# ============================================================
# main.py — CV Matcher FastAPI Service
# Jalankan: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# ============================================================

import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import pipeline dari cv_matcher_final.py
# Pastikan cv_matcher_final.py ada di folder yang sama
from cv_matcher_final import analyze_single, analyze_batch, load_cv

# ── App Setup ─────────────────────────────────────────────────
app = FastAPI(
    title="CV Matcher AI Service",
    description="Semantic CV-JD matching berbasis SBERT",
    version="1.0.0",
)

# CORS — izinkan Express.js komunikasi ke FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Ganti dengan domain Express.js saat production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Folder temporary untuk simpan PDF upload
TMP_DIR = Path("./tmp_uploads")
TMP_DIR.mkdir(exist_ok=True)


# ── Helper ────────────────────────────────────────────────────

def save_upload(file: UploadFile) -> str:
    """Simpan file upload ke folder tmp, return path-nya."""
    ext      = Path(file.filename).suffix
    tmp_path = TMP_DIR / f"{uuid.uuid4().hex}{ext}"
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return str(tmp_path)


def cleanup(paths: List[str]):
    """Hapus file temporary setelah selesai diproses."""
    for path in paths:
        try:
            os.remove(path)
        except Exception:
            pass


def serialize_result(result: dict) -> dict:
    """
    Konversi hasil analyze_* ke format JSON-serializable.
    Hapus section_texts (terlalu besar, tidak perlu dikirim ke frontend).
    """
    def clean(obj):
        if isinstance(obj, dict):
            return {k: clean(v) for k, v in obj.items() if k != 'section_texts'}
        if isinstance(obj, list):
            return [clean(i) for i in obj]
        if isinstance(obj, tuple):
            return list(obj)
        return obj
    return clean(result)


# ── Response Models ───────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    message: str


# ── Endpoints ─────────────────────────────────────────────────

@app.get("/", response_model=HealthResponse)
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "CV Matcher AI Service is running"}


@app.get("/health", response_model=HealthResponse)
def health():
    """Health check untuk monitoring."""
    return {"status": "ok", "message": "Service healthy"}


@app.post("/analyze/single")
async def analyze_single_endpoint(
    cv:       UploadFile = File(...),
    jd_text:  str        = Form(...),
    jd_title: str        = Form(default="Posisi yang Dilamar"),
):
    """
    Analisis satu CV terhadap satu JD.
    Digunakan untuk fitur JOB SEEKER.

    Form data:
        cv       : file PDF CV
        jd_text  : teks job description
        jd_title : nama posisi (opsional)

    Returns:
        {
            final_score    : float (0-100)
            label          : ["Strong Match", "🟢"]
            reasoning      : str
            section_scores : { experience: float, skills: float, ... }
            scoring_mode   : "hybrid" | "fulltext_fallback"
            report         : str (laporan lengkap)
        }
    """
    # Validasi file
    if not cv.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Hanya file PDF yang diterima")

    if not jd_text or len(jd_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description terlalu pendek")

    tmp_path = save_upload(cv)

    try:
        result = analyze_single(tmp_path, jd_text, jd_title)
        return serialize_result(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CV: {str(e)}")
    finally:
        cleanup([tmp_path])


@app.post("/analyze/batch")
async def analyze_batch_endpoint(
    cvs:       List[UploadFile] = File(...),
    jd_text:   str              = Form(...),
    jd_title:  str              = Form(default="Posisi yang Dilamar"),
    top_n:     int              = Form(default=10),
):
    """
    Ranking banyak CV terhadap satu JD.
    Digunakan untuk fitur HRD.

    Form data:
        cvs      : multiple file PDF CV
        jd_text  : teks job description
        jd_title : nama posisi (opsional)
        top_n    : tampilkan N teratas (default 10)

    Returns:
        {
            summary : { total, strong, potential, low }
            ranked  : [
                {
                    rank          : int
                    id            : str (nama file)
                    final_score   : float
                    label         : ["Strong Match", "🟢"]
                    reasoning     : str
                    section_scores: { ... }
                    scoring_mode  : str
                },
                ...
            ]
            report  : str (laporan lengkap)
        }
    """
    if not cvs:
        raise HTTPException(status_code=400, detail="Tidak ada file CV yang dikirim")

    if len(cvs) > 50:
        raise HTTPException(status_code=400, detail="Maksimal 50 CV per request")

    if not jd_text or len(jd_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description terlalu pendek")

    # Validasi semua file PDF
    for cv in cvs:
        if not cv.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail=f"File '{cv.filename}' bukan PDF"
            )

    # Simpan semua file sementara
    tmp_paths = []
    cv_list   = []

    try:
        for cv in cvs:
            tmp_path = save_upload(cv)
            tmp_paths.append(tmp_path)
            cv_text = load_cv(tmp_path, source='pdf')
            cv_list.append({
                'id':   cv.filename,
                'text': cv_text,
            })

        result = analyze_batch(
            cv_inputs  = cv_list,
            jd_text    = jd_text,
            jd_title   = jd_title,
            top_n      = top_n,
            show_detail = False,
        )

        # Tambahkan label & reasoning per kandidat
        for r in result['ranked']:
            from cv_matcher_final import get_match_label, generate_reasoning
            r['label']     = list(get_match_label(r['final_score']))
            r['reasoning'] = generate_reasoning(r)

        return serialize_result(result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing batch: {str(e)}")
    finally:
        cleanup(tmp_paths)


# ── Run (development only) ────────────────────────────────────
# Production: gunakan uvicorn main:app --host 0.0.0.0 --port 8000

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
