# ============================================================
# main.py — CV Matcher FastAPI Service v2
# Update: support DOCX, candidate name, skill match, summary rec
# Jalankan: python -m uvicorn main:app --host 0.0.0.0 --port 8000
# ============================================================

import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cv_matcher_final import analyze_single, analyze_batch, load_cv, get_match_label, generate_reasoning

app = FastAPI(
    title="CV Matcher AI Service",
    description="Semantic CV-JD matching berbasis SBERT",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TMP_DIR = Path("./tmp_uploads")
TMP_DIR.mkdir(exist_ok=True)

ALLOWED_EXT = ('.pdf', '.docx', '.doc')


# ── Helpers ──────────────────────────────────────────────────

def save_upload(file: UploadFile) -> str:
    ext      = Path(file.filename).suffix.lower()
    tmp_path = TMP_DIR / f"{uuid.uuid4().hex}{ext}"
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return str(tmp_path)


def cleanup(paths: List[str]):
    for path in paths:
        try:
            os.remove(path)
        except Exception:
            pass


def serialize(obj):
    """Konversi ke JSON-serializable, hapus section_texts."""
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items() if k != 'section_texts'}
    if isinstance(obj, list):
        return [serialize(i) for i in obj]
    if isinstance(obj, tuple):
        return list(obj)
    return obj


def validate_cv_file(filename: str):
    if not filename.lower().endswith(ALLOWED_EXT):
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' tidak didukung. Gunakan PDF atau DOCX."
        )


def validate_jd(jd_text: str):
    if not jd_text or len(jd_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description terlalu pendek (min 20 karakter)")


# ── Endpoints ─────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    message: str


@app.get("/", response_model=HealthResponse)
def root():
    return {"status": "ok", "message": "CV Matcher AI Service v2 is running"}


@app.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "message": "Service healthy"}


@app.post("/analyze/single")
async def analyze_single_endpoint(
    cv:       UploadFile = File(...),
    jd_text:  str        = Form(...),
    jd_title: str        = Form(default="Posisi yang Dilamar"),
):
    """
    Analisis SATU CV terhadap satu JD — untuk fitur Job Seeker.

    Request (multipart/form-data):
        cv       : file PDF atau DOCX
        jd_text  : teks job description
        jd_title : nama posisi (opsional)

    Response:
        candidate_name, score_result, label, reasoning,
        matched_skills, unmatched_skills, cv_text,
        summary_recommendation, report
    """
    validate_cv_file(cv.filename)
    validate_jd(jd_text)

    tmp_path = save_upload(cv)
    try:
        result = analyze_single(tmp_path, jd_text, jd_title)
        return serialize(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CV: {str(e)}")
    finally:
        cleanup([tmp_path])


@app.post("/analyze/batch")
async def analyze_batch_endpoint(
    cvs:      List[UploadFile] = File(...),
    jd_text:  str              = Form(...),
    jd_title: str              = Form(default="Posisi yang Dilamar"),
    top_n:    int              = Form(default=10),
):
    """
    Ranking BANYAK CV terhadap satu JD — untuk fitur HRD.

    Request (multipart/form-data):
        cvs      : multiple file PDF/DOCX (maks 50)
        jd_text  : teks job description
        jd_title : nama posisi (opsional)
        top_n    : tampilkan N teratas (default 10)

    Response:
        summary  : { total, strong, potential, low }
        ranked   : list kandidat dengan semua field lengkap
        report   : laporan teks
    """
    if not cvs:
        raise HTTPException(status_code=400, detail="Tidak ada file CV yang dikirim")
    if len(cvs) > 50:
        raise HTTPException(status_code=400, detail="Maksimal 50 CV per request")

    validate_jd(jd_text)
    for cv in cvs:
        validate_cv_file(cv.filename)

    tmp_paths = []
    cv_list   = []

    try:
        for cv in cvs:
            tmp_path = save_upload(cv)
            tmp_paths.append(tmp_path)
            cv_text = load_cv(tmp_path)
            cv_list.append({'id': cv.filename, 'text': cv_text})

        result = analyze_batch(
            cv_inputs   = cv_list,
            jd_text     = jd_text,
            jd_title    = jd_title,
            top_n       = top_n,
            show_detail = False,
        )

        # Tambahkan label & reasoning per kandidat
        for r in result['ranked']:
            r['label']     = list(get_match_label(r['final_score']))
            r['reasoning'] = generate_reasoning(r)

        return serialize(result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing batch: {str(e)}")
    finally:
        cleanup(tmp_paths)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
