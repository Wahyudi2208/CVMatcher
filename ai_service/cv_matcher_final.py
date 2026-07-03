# -*- coding: utf-8 -*-
# ============================================================
# CV Matcher - AI Pipeline (Production Ready) v2
# Update: DOCX support, candidate name extraction,
#         skill matching, summary recommendation
# ============================================================

# !pip install sentence-transformers scikit-learn pandas numpy pdfplumber python-docx tqdm nltk -q

import os
import re
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional

import numpy as np
import pandas as pd
import pdfplumber

import nltk
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from tqdm import tqdm

nltk.download('punkt',     quiet=True)
nltk.download('stopwords', quiet=True)

print("✅ Imports ready!")

# ============================================================
# CELL 2: CONFIG & CONSTANTS
# ============================================================

CONFIG = {
    'model_name': 'paraphrase-multilingual-MiniLM-L12-v2',
    'sections':   ['summary', 'education', 'skills', 'experience',
                   'certifications', 'projects', 'achievements'],
    'language':   'multilingual',
}

SECTION_KEYWORDS = {
    'summary': {
        'en': ['professional summary', 'profile', 'about me', 'career objective', 'summary'],
        'id': ['ringkasan profesional', 'profil', 'tentang saya', 'ringkasan', 'tujuan karir']
    },
    'education': {
        'en': ['education', 'educational background', 'academic background', 'education history'],
        'id': ['pendidikan', 'riwayat pendidikan', 'latar belakang pendidikan']
    },
    'skills': {
        'en': ['skills', 'technical skills', 'core skills', 'key skills',
               'tools', 'technologies', 'competencies'],
        'id': ['keahlian', 'skill', 'kompetensi inti', 'tools', 'teknologi', 'kemampuan teknis']
    },
    'experience': {
        'en': ['work experience', 'professional experience', 'employment history',
               'career history', 'internship experience', 'experience'],
        'id': ['pengalaman kerja', 'pengalaman profesional', 'riwayat pekerjaan',
               'riwayat karir', 'pengalaman magang']
    },
    'certifications': {
        'en': ['certifications', 'certificates', 'credentials', 'licenses', 'training', 'certification'],
        'id': ['sertifikasi', 'sertifikat', 'kredensial', 'lisensi', 'pelatihan']
    },
    'projects': {
        'en': ['projects', 'project experience', 'academic projects',
               'personal projects', 'portfolio', 'key projects'],
        'id': ['proyek', 'pengalaman proyek', 'proyek akademik',
               'proyek personal', 'portofolio', 'proyek utama']
    },
    'achievements': {
        'en': ['achievements', 'accomplishments', 'awards', 'recognitions', 'honors'],
        'id': ['pencapaian', 'prestasi', 'penghargaan', 'pengakuan', 'award']
    },
}

SECTION_WEIGHTS_BASE = {
    'experience': 0.40, 'skills': 0.30, 'summary': 0.15,
    'education':  0.10, 'certifications': 0.05,
    'projects':   0.00, 'achievements':   0.00,
}

MATCH_THRESHOLDS = {'strong': 58.0, 'potential': 38.0}

MATCH_LABELS = {
    'strong':    ('Strong Match',    '🟢'),
    'potential': ('Potential Match', '🟡'),
    'low':       ('Low Match',       '🔴'),
}

print("✅ Config & constants loaded!")
print(f"   Model    : {CONFIG['model_name']}")
print(f"   Sections : {', '.join(CONFIG['sections'])}")

# ============================================================
# CELL 3: TEXT PROCESSING
# ============================================================

def normalize_text(text: str, aggressive: bool = False) -> str:
    if not text:
        return ""
    text = text.replace("\n", " ").replace("\r", " ")
    if aggressive:
        text = re.sub(r"[^a-zA-Z0-9\s\+\#\.\/\-]", " ", text)
    else:
        text = re.sub(r"[^\w\s\.\,\-\(\)\+\#\/]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def clean_text_for_sbert(text: str) -> str:
    return normalize_text(text, aggressive=False)


def is_heading_line(line: str, section_keywords: Dict) -> Tuple[bool, Optional[str]]:
    line = line.strip()
    if not line or len(line) < 3:
        return False, None
    if line[0] in ('-', '•', '*'):
        return False, None
    if len(line) > 80:
        return False, None
    line_clean = re.sub(r'^(\d+[\.\)])\s+', '', line.rstrip(':')).strip()
    if len(line_clean.split()) > 6:
        return False, None
    line_lower = line_clean.lower()
    for section_name, keywords in section_keywords.items():
        all_keywords = keywords['en'] + keywords['id']
        for kw in sorted(all_keywords, key=len, reverse=True):
            if re.search(r'\b' + re.escape(kw) + r'\b', line_lower):
                return True, section_name
    return False, None


def extract_cv_sections(cv_text: str) -> Dict[str, str]:
    sections = {s: "" for s in CONFIG['sections']}
    current_section = None
    buffer = []
    for line in cv_text.split('\n'):
        is_heading, matched = is_heading_line(line, SECTION_KEYWORDS)
        if is_heading:
            if current_section is not None:
                sections[current_section] = '\n'.join(buffer).strip()
            current_section = matched
            buffer = []
        else:
            if current_section is not None:
                buffer.append(line)
    if current_section is not None:
        sections[current_section] = '\n'.join(buffer).strip()
    return {k: clean_text_for_sbert(v) for k, v in sections.items()}


def _fix_encoding(text: str) -> str:
    if not text:
        return ""
    try:
        text = text.encode('latin-1').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass
    fixes = {
        'â¢': '•', 'â€™': "'", 'â€˜': "'",
        'â€œ': '"', 'â€': '"', 'â€"': '–',
        'â€"': '—', 'Ã©': 'é', 'Ã¨': 'è',
        '\x00': '', '\uf0b7': '•',
    }
    for wrong, correct in fixes.items():
        text = text.replace(wrong, correct)
    return text


def extract_text_from_pdf(pdf_path: str) -> str:
    path = Path(pdf_path)
    if not path.exists():
        print(f"  File tidak ditemukan: {pdf_path}")
        return ""
    try:
        pages = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
        if not pages:
            return ""
        combined = '\n'.join(pages)
        combined = _fix_encoding(combined)
        combined = re.sub(r'\n{3,}', '\n\n', combined)
        combined = re.sub(r'[ \t]+', ' ', combined)
        return combined.strip()
    except Exception as e:
        print(f"  Error membaca PDF {pdf_path}: {e}")
        return ""


def extract_text_from_docx(docx_path: str) -> str:
    """Ekstrak teks dari file DOCX. Membutuhkan: pip install python-docx"""
    try:
        from docx import Document as DocxDocument
        path = Path(docx_path)
        if not path.exists():
            print(f"  File tidak ditemukan: {docx_path}")
            return ""
        doc = DocxDocument(str(path))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        combined = '\n'.join(paragraphs)
        combined = _fix_encoding(combined)
        combined = re.sub(r'\n{3,}', '\n\n', combined)
        return combined.strip()
    except ImportError:
        raise RuntimeError(
        "python-docx belum terinstall."
    )
    except Exception as e:
        print(f"  Error membaca DOCX {docx_path}: {e}")
        return ""


def extract_text_from_csv_row(resume_text: str) -> str:
    if not resume_text or not isinstance(resume_text, str):
        return ""
    text = _fix_encoding(resume_text)
    text = re.sub(r'\r\n|\r', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


def load_cv(input_data: str, source: str = 'auto') -> str:
    """
    Universal CV loader.
    Support: PDF, DOCX (.docx/.doc), teks biasa.
    """
    if source == 'auto':
        if isinstance(input_data, str):
            lower = input_data.lower()
            if lower.endswith('.pdf'):
                source = 'pdf'
            elif lower.endswith('.docx') or lower.endswith('.doc'):
                source = 'docx'
            else:
                source = 'text'
        else:
            source = 'text'

    if source == 'pdf':
        return extract_text_from_pdf(input_data)
    elif source == 'docx':
        return extract_text_from_docx(input_data)
    else:
        return extract_text_from_csv_row(input_data)


print("✅ Text processing ready!")
print("   3A — normalize_text(), clean_text_for_sbert()")
print("   3B — is_heading_line(), extract_cv_sections()")
print("   3C — extract_text_from_pdf(), extract_text_from_docx(), load_cv()")

# ============================================================
# CELL 4: SBERT ENCODER + DYNAMIC WEIGHTING
# ============================================================

print("⏳ Loading SBERT model...")
_sbert_model = SentenceTransformer(CONFIG['model_name'])
print(f"✅ SBERT model loaded: {CONFIG['model_name']}")


def encode_text(text: str) -> Optional[np.ndarray]:
    if not text or len(text.strip()) < 5:
        return None
    return _sbert_model.encode(clean_text_for_sbert(text), convert_to_numpy=True)


def encode_sections(cv_sections: Dict[str, str]) -> Dict[str, Optional[np.ndarray]]:
    return {
        name: encode_text(text) if text and len(text.strip()) > 5 else None
        for name, text in cv_sections.items()
    }


def encode_jd(jd_text: str) -> np.ndarray:
    return _sbert_model.encode(clean_text_for_sbert(jd_text), convert_to_numpy=True)


def section_similarity(cv_embedding: Optional[np.ndarray], jd_embedding: np.ndarray) -> float:
    if cv_embedding is None:
        return 0.0
    sim = cosine_similarity(
        cv_embedding.reshape(1, -1),
        jd_embedding.reshape(1, -1)
    )[0][0]
    return float(np.clip(sim, 0.0, 1.0))


def _detect_jd_signals(jd_text: str) -> Dict[str, float]:
    t = jd_text.lower()
    return {
        'experience': min(1.0, sum([
            bool(re.search(r'\d+\+?\s*(?:years?|yrs?|tahun)\s+(?:of\s+)?(?:experience|pengalaman)', t)),
            bool(re.search(r'(?:minimum|at least|minimal|setidaknya)\s+\d+\s*(?:years?|tahun)', t)),
            any(w in t for w in ['work experience', 'professional experience', 'pengalaman kerja']),
            any(w in t for w in ['experience required', 'experienced candidate']),
        ]) * 0.35),
        'skills': min(1.0, sum([
            any(w in t for w in ['skills', 'proficiency', 'proficient', 'expertise', 'keahlian']),
            any(w in t for w in ['required skills', 'technical skills', 'must have']),
            any(w in t for w in ['familiar with', 'knowledge of', 'experience with']),
            bool(re.search(r'\b(?:python|java|sql|aws|excel|sap|javascript)\b', t)),
        ]) * 0.28),
        'education': min(1.0, sum([
            any(w in t for w in ['bachelor', 'master', 'phd', 'degree', 'diploma', 'sarjana', 's1', 's2']),
            any(w in t for w in ['education required', 'educational background']),
            any(w in t for w in ['computer science', 'engineering', 'accounting', 'statistics']),
            bool(re.search(r'(?:degree|diploma)\s+in\b', t)),
        ]) * 0.27),
        'summary': min(1.0, 0.3 + sum([
            any(w in t for w in ['leadership', 'communication', 'teamwork', 'analytical']),
            any(w in t for w in ['passionate', 'motivated', 'proactive', 'fast learner']),
            any(w in t for w in ['strong background', 'proven track', 'demonstrated ability']),
        ]) * 0.15),
        'certifications': min(1.0, sum([
            any(w in t for w in ['certified', 'certification', 'certificate', 'sertifikat']),
            any(w in t for w in ['cpa', 'aws certified', 'pmp', 'cissp', 'cfa']),
            bool(re.search(r'(?:certification|certificate)\s+(?:required|preferred|is a plus)', t)),
        ]) * 0.35),
        'projects':     0.0,
        'achievements': 0.0,
    }


def compute_dynamic_weights(jd_text: str, verbose: bool = False) -> Dict[str, float]:
    BASE = {
        'experience': 0.35, 'skills': 0.28, 'summary': 0.12,
        'education':  0.08, 'certifications': 0.02,
        'projects':   0.00, 'achievements':   0.00,
    }
    CAPS = {
        'experience': (0.25, 0.55), 'skills': (0.20, 0.45),
        'summary': (0.05, 0.20),    'education': (0.03, 0.20),
        'certifications': (0.00, 0.15),
        'projects': (0.00, 0.00),   'achievements': (0.00, 0.00),
    }
    signals = _detect_jd_signals(jd_text)
    raw     = {s: BASE[s] + signals.get(s, 0.0) * 0.3 for s in BASE}
    capped  = {s: float(np.clip(raw[s], *CAPS[s])) for s in raw}
    total   = sum(capped.values())
    weights = {s: v / total for s, v in capped.items()} if total > 0 else BASE.copy()
    if verbose:
        print("  Dynamic Weights:")
        for s, w in weights.items():
            if w > 0:
                print(f"     {s:<15} {w:.1%}")
    return weights


print("\n✅ SBERT Encoder & Dynamic Weighting ready!")

# ============================================================
# CELL 5: HYBRID SCORER + RANKER
# ============================================================

def score_cv(
    cv_text: str,
    jd_text: str,
    jd_embedding:    Optional[np.ndarray] = None,
    dynamic_weights: Optional[Dict]        = None,
    hybrid_alpha:    float                 = 0.7,
) -> Dict:
    if dynamic_weights is None:
        dynamic_weights = compute_dynamic_weights(jd_text)
    if jd_embedding is None:
        jd_embedding = encode_jd(jd_text)

    cv_sections    = extract_cv_sections(cv_text)
    cv_embeddings  = encode_sections(cv_sections)
    section_scores = {}
    weighted_total = 0.0
    active_weight  = 0.0

    for sec, weight in dynamic_weights.items():
        if weight == 0.0:
            section_scores[sec] = 0.0
            continue
        sim = section_similarity(cv_embeddings.get(sec), jd_embedding)
        section_scores[sec] = round(sim * 100, 2)
        if cv_embeddings.get(sec) is not None:
            weighted_total += sim * weight
            active_weight  += weight

    section_score  = (weighted_total / active_weight * 100) if active_weight > 0 else 0.0
    fulltext_emb   = encode_text(clean_text_for_sbert(cv_text))
    fulltext_score = section_similarity(fulltext_emb, jd_embedding) * 100
    non_empty      = sum(1 for v in cv_sections.values() if v and len(v) > 20)

    if non_empty >= 2:
        final = section_score * hybrid_alpha + fulltext_score * (1 - hybrid_alpha)
        mode  = 'hybrid'
    else:
        final = fulltext_score
        mode  = 'fulltext_fallback'

    return {
        'final_score':        round(float(np.clip(final, 0.0, 100.0)), 2),
        'section_score':      round(section_score, 2),
        'fulltext_score':     round(fulltext_score, 2),
        'scoring_mode':       mode,
        'section_scores':     section_scores,
        'section_texts':      cv_sections,
        'weights_used':       dynamic_weights,
        'non_empty_sections': non_empty,
    }


def rank_cvs(
    cv_list:       List[Dict],
    jd_text:       str,
    top_n:         Optional[int] = None,
    hybrid_alpha:  float         = 0.7,
    show_progress: bool          = True,
) -> List[Dict]:
    print("  Analyzing JD...")
    weights      = compute_dynamic_weights(jd_text)
    jd_embedding = encode_jd(jd_text)
    results      = []
    iterator     = tqdm(cv_list, desc="Scoring CVs") if show_progress else cv_list

    for cv_data in iterator:
        cv_text = cv_data.get('text', '')
        if not cv_text:
            continue
        scored = score_cv(cv_text, jd_text, jd_embedding=jd_embedding,
                          dynamic_weights=weights, hybrid_alpha=hybrid_alpha)
        results.append({**cv_data, **scored})

    results.sort(key=lambda x: x['final_score'], reverse=True)
    for i, r in enumerate(results):
        r['rank'] = i + 1
    return results[:top_n] if top_n else results


print("✅ Hybrid Scorer & Ranker ready!")

# ============================================================
# CELL 6: CANDIDATE NAME + DYNAMIC SKILL MATCH + SUMMARY REC
# ============================================================

import re
from typing import List, Dict, Tuple


# ── FIX 1: Truncate JD ke bagian Requirements/Kualifikasi saja ──

_JD_SKILL_HEADINGS = [
    r'requirements?', r'qualifications?', r'preferred\s+qualifications?',
    r'kualifikasi', r'persyaratan', r'skills?\s*(required|needed)?',
    r'keahlian', r'kompetensi', r'what\s+you.?ll\s+need',
    r'what\s+we.?re\s+looking\s+for', r'nice\s+to\s+have', r'good\s+to\s+have',
]

# PENTING: semua heading pakai bentuk jamak opsional (s?)
# supaya "Benefit" maupun "Benefits" sama-sama ke-detect
_JD_STOP_HEADINGS = [
    r'benefits?', r'fasilitas', r'compensation', r'gaji', r'perks?',
    r'tentang\s*(kami|perusahaan)', r'about\s*(us|the\s*role)?',
    r'responsibilities?', r'tanggung\s*jawab', r'job\s*desc(ription)?',
    r'how\s*to\s*apply', r'cara\s*melamar', r'why\s+join',
]


def truncate_jd_to_requirements(jd_text: str) -> str:
    """
    Ambil HANYA teks di bagian skill-relevant (Requirements,
    Preferred Qualifications, dll), buang Responsibilities & Benefits.

    v5: mencari posisi heading di SELURUH teks via regex.finditer,
    bukan cek baris-per-baris. Ini jauh lebih tahan terhadap variasi
    format paste — heading tidak harus sendirian persis di satu baris.

    Kalau JD sama sekali tidak punya heading yang dikenali,
    kembalikan teks asli (tidak di-truncate).
    """
    skill_pattern = (
        r'(?im)^[^\S\r\n]*[^a-zA-Z0-9\n]*\s*(' +
        '|'.join(_JD_SKILL_HEADINGS) +
        r')\s*:?[^\S\r\n]*$'
    )
    stop_pattern = (
        r'(?im)^[^\S\r\n]*[^a-zA-Z0-9\n]*\s*(' +
        '|'.join(_JD_STOP_HEADINGS) +
        r')\s*:?[^\S\r\n]*$'
    )

    skill_matches = list(re.finditer(skill_pattern, jd_text))
    stop_matches  = list(re.finditer(stop_pattern, jd_text))

    # Fallback longgar kalau heading tidak sendirian di baris
    # (misal nempel dengan teks lain karena hasil paste/copy web)
    if not skill_matches:
        loose_skill = r'(?im)\b(' + '|'.join(_JD_SKILL_HEADINGS) + r')\b\s*:?'
        skill_matches = list(re.finditer(loose_skill, jd_text))
    if not skill_matches:
        return jd_text  # tidak ada heading sama sekali, jangan truncate

    if not stop_matches:
        loose_stop = r'(?im)\b(' + '|'.join(_JD_STOP_HEADINGS) + r')\b\s*:?'
        stop_matches = list(re.finditer(loose_stop, jd_text))

    result_parts = []
    for sm in skill_matches:
        start = sm.end()
        next_stops = [stm.start() for stm in stop_matches if stm.start() > start]
        end = min(next_stops) if next_stops else len(jd_text)

        # Jangan overlap ke skill-heading berikutnya
        next_skills = [s.start() for s in skill_matches if s.start() > start]
        if next_skills:
            end = min(end, max(next_skills))

        chunk = jd_text[start:end].strip()
        if chunk:
            result_parts.append(chunk)

    combined = '\n'.join(result_parts)
    return combined if combined.strip() else jd_text


# ── FIX 2: Split baris jadi frasa bersih, handle bullet di tengah kalimat ──

def clean_line_edges(line: str) -> str:
    """Bersihkan karakter non-alfanumerik di awal & akhir baris."""
    line = re.sub(r'^[^a-zA-Z0-9]+', '', line)
    line = re.sub(r'[^a-zA-Z0-9\)]+$', '', line)
    return line.strip()


def split_into_clean_phrases(text: str) -> List[str]:
    phrases = []
    for raw_line in text.split('\n'):
        sub_lines = re.split(r'\s*[•\u2022\*]\s*', raw_line)
        for sub in sub_lines:
            sub = clean_line_edges(sub)
            if not sub:
                continue
            if sub.count('.') >= 1 and len(sub.split()) > 8:
                sentence_parts = re.split(r'\.\s+', sub)
            else:
                sentence_parts = [sub]
            for sentence in sentence_parts:
                parts = re.split(r',\s*|\s+(?:and|dan)\s+', sentence)
                for p in parts:
                    p = clean_line_edges(p)
                    if p and 1 <= len(p.split()) <= 8:
                        phrases.append(p)
    return phrases

def extract_candidate_name(cv_text: str) -> str:
    """Extract nama kandidat dari baris pertama CV."""
    if not cv_text:
        return "Tidak Diketahui"

    lines    = [l.strip() for l in cv_text.split('\n') if l.strip()]
    top      = lines[:8]
    NOT_NAME = [r'@', r'\d{5,}', r'http|www\.', r'cv|resume|curriculum',
                r'summary|profile|objective']

    for line in top:
        if any(re.search(p, line.lower()) for p in NOT_NAME):
            continue
        words = line.split()
        if len(words) < 2 or len(words) > 5:
            continue
        has_alpha = any(c.isalpha() for c in line)
        if has_alpha and (line.istitle() or (line.isupper() and len(words) >= 2)):
            name = re.sub(r'[^\w\s\-\.]', '', line).strip()
            if name:
                return name.title()

    for line in top:
        words = line.split()
        if 2 <= len(words) <= 5 and all(w.replace('-', '').isalpha() for w in words):
            return line.title()

    return "Tidak Diketahui"


# ------------------------------------------------------------
# DYNAMIC SKILL EXTRACTION (domain-agnostic, lokal, tanpa hardcoded list)
# ------------------------------------------------------------

_STOPWORDS_ID_EN = {
    'dan', 'atau', 'yang', 'untuk', 'dengan', 'dari', 'pada', 'ini', 'itu',
    'kami', 'anda', 'kandidat', 'pelamar', 'minimal', 'maksimal', 'wajib',
    'diutamakan', 'memiliki', 'mampu', 'dapat', 'bisa', 'berpengalaman',
    'pengalaman', 'kualifikasi', 'persyaratan', 'tanggung', 'jawab',
    'tugas', 'deskripsi', 'pekerjaan', 'lamaran', 'lowongan', 'posisi',
    'tahun', 'min', 'max', 'usia', 'pria', 'wanita', 'domisili',
    'and', 'or', 'the', 'a', 'an', 'for', 'with', 'from', 'to', 'of', 'in',
    'is', 'are', 'be', 'will', 'must', 'should', 'have', 'has', 'having',
    'strong', 'good', 'excellent', 'basic', 'advanced', 'proficient',
    'familiar', 'knowledge', 'understanding', 'ability', 'able', 'skills',
    'skill', 'experience', 'experienced', 'required', 'requirement',
    'requirements', 'responsibilities', 'responsibility', 'qualification',
    'qualifications', 'job', 'description', 'candidate', 'candidates',
    'years', 'year', 'minimum', 'maximum', 'preferred', 'plus', 'etc',
    'about', 'company', 'team', 'work', 'working', 'role', 'position',
    'we', 'you', 'our', 'your', 'as', 'at', 'by', 'on', 'level', 'entry',
}

_HEADER_PATTERNS = [
    r'^(kualifikasi|persyaratan|requirements?|qualifications?)\s*:?$',
    r'^(tanggung\s*jawab|responsibilities?|job\s*desc(ription)?)\s*:?$',
    r'^(about\s*(us|the\s*role)?|tentang)\s*:?$',
    r'^(benefit|fasilitas|compensation)s?\s*:?$',
]

_INTRO_NOISE = re.compile(
    r'^(we are looking for|we\'re looking for|looking for|'
    r'\d+\+?\s*years?\s+experience|kami (sedang )?mencari|dibutuhkan|'
    r'kami (adalah|merupakan))',
    re.IGNORECASE
)

_LEAD_PHRASES = re.compile(
    r'^(proficiency in|experience (in|with)|knowledge of|familiarity with|'
    r'familiar with|understanding of|expertise in|menguasai|memahami)\s+',
    re.IGNORECASE
)

_BULLET_PREFIX = re.compile(r'^[\-\*\•\u2022\d\.\)]+\s*')

# ------------------------------------------------------------
# OPSI A: Section markers untuk JD (mirip SECTION_KEYWORDS tapi untuk JD)
# ------------------------------------------------------------
_JD_SKILL_SECTION_MARKERS = [
    r'kualifikasi', r'persyaratan', r'requirements?', r'qualifications?',
    r'skills?\s*(required|needed)?', r'keahlian', r'kompetensi',
]

_JD_NON_SKILL_SECTION_MARKERS = [
    r'tanggung\s*jawab', r'responsibilities?', r'job\s*desc(ription)?',
    r'tugas', r'benefit', r'fasilitas', r'compensation', r'gaji',
    r'tentang\s*(kami|perusahaan)', r'about\s*(us|the\s*role)?',
    r'cara\s*melamar', r'how\s*to\s*apply', r'kontak', r'contact',
]

# ------------------------------------------------------------
# OPSI B: Pola kategori noise (bukan kata spesifik, tapi pola/kategori)
# ------------------------------------------------------------
_CATEGORY_NOISE_PATTERNS = [
    r'\b(bachelor|master|phd|diploma|degree|gelar|sarjana|s1|s2|s3|d3|d4)\b',
    r'\d+\+?\s*(years?|tahun|yrs?)\b',
    r'\b(minimum|minimal|at least|setidaknya)\s+\d+',
    r'\b(gaji|salary|kirim\s*(cv|lamaran)|lokasi|domisili|jam\s*kerja|kontak|hubungi)\b',
    r'\b(usia|umur|jenis\s*kelamin|pria|wanita)\b',
]
_CATEGORY_NOISE_RE = re.compile('|'.join(_CATEGORY_NOISE_PATTERNS), re.IGNORECASE)

_SOFT_SKILL_NOISE = {
    'jujur', 'teliti', 'disiplin', 'tanggung jawab', 'komunikatif',
    'team player', 'mampu bekerja dalam tim', 'kerja keras', 'proaktif',
    'honest', 'meticulous', 'hardworking', 'team work', 'communication skills',
    'under pressure', 'able to work under pressure', 'fast learner',
    'attention to detail', 'time management', 'problem solving',
}


def _clean_phrase(raw: str) -> str:
    text = _BULLET_PREFIX.sub('', raw).strip()
    text = re.sub(r'[:.]+$', '', text).strip()
    return text


def _is_noise(phrase: str) -> bool:
    low = phrase.lower().strip()
    if not low:
        return True
    if any(re.match(p, low) for p in _HEADER_PATTERNS):
        return True
    if _INTRO_NOISE.match(low):
        return True
    if _CATEGORY_NOISE_RE.search(low):
        return True
    if low in _SOFT_SKILL_NOISE:
        return True
    if re.fullmatch(r'[\d\s\-\.,]+', low):
        return True
    word_count = len(low.split())
    if word_count == 0 or word_count > 12:
        return True
    return False


def _strip_leading_trailing_stopwords(phrase: str) -> str:
    words = phrase.split()
    while words and words[0].lower() in _STOPWORDS_ID_EN:
        words.pop(0)
    while words and words[-1].lower() in _STOPWORDS_ID_EN:
        words.pop()
    return ' '.join(words)


def _split_jd_into_sections(jd_text: str) -> List[Tuple[str, bool]]:
    """
    Pecah JD jadi blok section. Return list of (line, is_skill_relevant_section).
    True = baris di bawah heading Kualifikasi/Requirements/Skills.
    False = baris di bawah heading Tanggung Jawab/Benefit/dll (dibuang).
    Kalau JD tidak berheading, semua baris dianggap relevan (fallback ke Opsi B).
    """
    lines = re.split(r'[\n\r]+', jd_text)
    result = []
    current_relevant = True
    has_any_heading = False

    for line in lines:
        stripped = line.strip()
        low = stripped.lower().rstrip(':')

        is_skill_heading = any(re.match(p, low) for p in _JD_SKILL_SECTION_MARKERS) and len(low.split()) <= 4
        is_non_skill_heading = any(re.match(p, low) for p in _JD_NON_SKILL_SECTION_MARKERS) and len(low.split()) <= 4

        if is_skill_heading:
            current_relevant = True
            has_any_heading = True
            continue
        if is_non_skill_heading:
            current_relevant = False
            has_any_heading = True
            continue

        result.append((line, current_relevant))

    if not has_any_heading:
        return [(line, True) for line in lines]

    return result


def extract_candidate_phrases_from_jd(jd_text: str) -> List[str]:
    if not jd_text:
        return []

    jd_text = truncate_jd_to_requirements(jd_text)          # FIX 1
    raw_phrases = split_into_clean_phrases(jd_text)         # FIX 2

    candidates = []
    for phrase in raw_phrases:
        phrase = _LEAD_PHRASES.sub('', phrase)
        phrase = _strip_leading_trailing_stopwords(phrase)
        if not phrase or _is_noise(phrase):
            continue
        candidates.append(phrase)

    seen, unique_candidates = set(), []
    for c in candidates:
        key = c.lower()
        if key not in seen:
            seen.add(key)
            unique_candidates.append(c)

    return unique_candidates


def _split_cv_sentences(cv_text: str) -> List[str]:
    """Pecah CV per baris DAN per item koma, supaya skill-list tidak 'diencerkan'."""
    if not cv_text:
        return []
    lines = re.split(r'[\n\r]+', cv_text)
    sentences = []
    for line in lines:
        line = _BULLET_PREFIX.sub('', line).strip()
        if len(line) <= 2:
            continue
        sentences.append(line)
        if ',' in line and len(line.split()) <= 15:
            for part in re.split(r',\s*', line):
                part = part.strip(' .')
                if part and part.lower() != line.lower():
                    sentences.append(part)
    return sentences


def semantic_match_phrases(
    jd_phrases: List[str],
    cv_text:    str,
    threshold:  float = 0.60,
    model=None,
) -> Tuple[List[str], List[str], Dict[str, float]]:
    """Cosine similarity (sklearn) antara frasa kandidat JD vs kalimat CV, pakai SBERT."""
    if model is None:
        model = _sbert_model

    cv_sentences = _split_cv_sentences(cv_text)
    if not jd_phrases or not cv_sentences:
        return [], jd_phrases, {}

    jd_embeddings = model.encode(jd_phrases, convert_to_numpy=True)
    cv_embeddings = model.encode(cv_sentences, convert_to_numpy=True)
    sim_matrix = cosine_similarity(jd_embeddings, cv_embeddings)

    matched, unmatched, scores = [], [], {}
    for i, phrase in enumerate(jd_phrases):
        best_score = float(sim_matrix[i].max())
        scores[phrase] = round(best_score, 4)
        if best_score >= threshold:
            matched.append(phrase)
        else:
            unmatched.append(phrase)

    return matched, unmatched, scores


def _format_skill_display(phrase: str) -> str:
    """Title Case untuk frasa umum, UPPERCASE untuk akronim pendek."""
    words = phrase.split()
    formatted = []
    for w in words:
        core = re.sub(r'[^\w]', '', w)
        if core.isupper() and 1 < len(core) <= 5:
            formatted.append(core)
        elif len(core) <= 4 and w.isupper():
            formatted.append(core.upper())
        else:
            formatted.append(w.capitalize())
    return ' '.join(formatted)


def match_skills(cv_text: str, jd_text: str, threshold: float = 0.72) -> Dict[str, List[str]]:
    """
    Dynamic Skill Extraction (section-aware + kategori-noise filter) + SBERT Semantic Filtering.
    Returns: matched_skills, unmatched_skills, jd_skills, similarity_scores
    """
    jd_phrases = extract_candidate_phrases_from_jd(jd_text)
    matched_raw, unmatched_raw, scores = semantic_match_phrases(
        jd_phrases, cv_text, threshold=threshold
    )

    matched   = sorted({_format_skill_display(p) for p in matched_raw})
    unmatched = sorted({_format_skill_display(p) for p in unmatched_raw})
    all_jd    = sorted({_format_skill_display(p) for p in jd_phrases})

    return {
        'matched_skills':    matched,
        'unmatched_skills':  unmatched,
        'jd_skills':         all_jd,
        'similarity_scores': scores,
    }


def generate_summary_recommendation(
    score_result:   Dict,
    skill_match:    Dict,
    candidate_name: str = "Kandidat",
    jd_title:       str = "posisi ini",
) -> str:
    """Generate summary recommendation 3-4 kalimat."""
    final_score = score_result.get('final_score', 0)
    matched     = skill_match.get('matched_skills', [])
    unmatched   = skill_match.get('unmatched_skills', [])
    sentences   = []

    if final_score >= MATCH_THRESHOLDS['strong']:
        sentences.append(
            f"{candidate_name} merupakan kandidat yang sangat sesuai untuk {jd_title} "
            f"dengan skor kesesuaian {final_score:.0f}%."
        )
    elif final_score >= MATCH_THRESHOLDS['potential']:
        sentences.append(
            f"{candidate_name} menunjukkan potensi yang cukup baik untuk {jd_title} "
            f"dengan skor kesesuaian {final_score:.0f}%, namun masih terdapat beberapa gap."
        )
    else:
        sentences.append(
            f"{candidate_name} kurang sesuai dengan kebutuhan {jd_title} "
            f"berdasarkan skor kesesuaian {final_score:.0f}%."
        )

    if matched:
        skill_str = ', '.join(matched[:5])
        suffix    = f" dan {len(matched) - 5} skill lainnya" if len(matched) > 5 else ""
        sentences.append(f"Kandidat memiliki skill yang sesuai: {skill_str}{suffix}.")

    if unmatched:
        gap_str = ', '.join(unmatched[:4])
        suffix  = f" dan {len(unmatched) - 4} lainnya" if len(unmatched) > 4 else ""
        sentences.append(f"Skill yang belum terdeteksi di CV namun dibutuhkan JD: {gap_str}{suffix}.")

    if final_score >= MATCH_THRESHOLDS['strong']:
        sentences.append(
            "Direkomendasikan untuk melanjutkan ke tahap interview guna memverifikasi "
            "pengalaman dan kemampuan teknis kandidat secara langsung."
        )
    elif final_score >= MATCH_THRESHOLDS['potential']:
        sentences.append(
            "Pertimbangkan screening awal untuk menggali lebih dalam gap skill "
            "yang ada sebelum memutuskan ke tahap selanjutnya."
        )
    else:
        sentences.append(
            "Kandidat kurang direkomendasikan untuk posisi ini. "
            "Pertimbangkan kandidat lain yang memiliki profil lebih sesuai."
        )

    return ' '.join(sentences)


print("✅ Cell 6 (final v2): Section-aware + category-noise dynamic skill matcher ready!")
# ============================================================
# CELL 7: RANKING REPORT + PUBLIC API
# ============================================================

def get_match_label(score: float) -> Tuple[str, str]:
    if score >= MATCH_THRESHOLDS['strong']:
        return MATCH_LABELS['strong']
    elif score >= MATCH_THRESHOLDS['potential']:
        return MATCH_LABELS['potential']
    return MATCH_LABELS['low']


def generate_reasoning(score_result: Dict) -> str:
    section_scores = score_result.get('section_scores', {})
    weights        = score_result.get('weights_used', SECTION_WEIGHTS_BASE)
    final_score    = score_result.get('final_score', 0)
    active = {k: v for k, v in section_scores.items() if weights.get(k, 0) > 0 and v > 0}
    if not active:
        return "Tidak cukup konten CV untuk dianalisis."
    strongest       = max(active, key=active.get)
    weakest         = min(active, key=active.get)
    strongest_score = active[strongest]
    weakest_score   = active[weakest]
    SECTION_ID = {
        'experience': 'pengalaman kerja', 'skills': 'keahlian teknis',
        'summary': 'profil kandidat', 'education': 'latar belakang pendidikan',
        'certifications': 'sertifikasi',
    }
    s_label = SECTION_ID.get(strongest, strongest)
    w_label = SECTION_ID.get(weakest, weakest)
    if final_score >= MATCH_THRESHOLDS['strong']:
        r = f"Kandidat menunjukkan relevansi tinggi pada bagian {s_label} ({strongest_score:.0f}%)."
        if weakest_score < 35 and weakest != strongest:
            r += f" Bagian {w_label} relatif kurang relevan ({weakest_score:.0f}%)."
    elif final_score >= MATCH_THRESHOLDS['potential']:
        r = (f"Kandidat memiliki potensi di bagian {s_label} ({strongest_score:.0f}%), "
             f"namun bagian {w_label} perlu digali lebih lanjut saat interview.")
    else:
        r = "Profil kandidat kurang sesuai dengan kebutuhan posisi ini."
        if strongest_score > 30:
            r += f" Relevansi hanya terdeteksi pada bagian {s_label} ({strongest_score:.0f}%)."
    return r


def build_report(
    ranked_results:      List[Dict],
    jd_title:            str           = "Posisi yang Dilamar",
    top_n:               Optional[int]  = None,
    show_section_detail: bool           = False,
) -> str:
    to_show   = ranked_results[:top_n] if top_n else ranked_results
    total     = len(ranked_results)
    strong    = sum(1 for r in ranked_results if r['final_score'] >= MATCH_THRESHOLDS['strong'])
    potential = sum(1 for r in ranked_results
                    if MATCH_THRESHOLDS['potential'] <= r['final_score'] < MATCH_THRESHOLDS['strong'])
    low       = total - strong - potential
    SEP       = "=" * 68
    SEP2      = "-" * 68
    lines     = [
        SEP,
        f"  LAPORAN RANKING CV — {jd_title.upper()}",
        f"  {datetime.now().strftime('%d %B %Y, %H:%M')}",
        SEP,
        f"  Total kandidat   : {total}",
        f"  🟢 Strong Match   : {strong}",
        f"  🟡 Potential Match: {potential}",
        f"  🔴 Low Match      : {low}",
    ]
    if top_n and top_n < total:
        lines.append(f"\n  Menampilkan {top_n} dari {total} kandidat:")
    lines.append(SEP2)

    for r in to_show:
        label, emoji = get_match_label(r['final_score'])
        lines += [
            f"\n  Rank #{r['rank']}  {emoji} {label}",
            f"  Nama     : {r.get('candidate_name', '-')}",
            f"  File     : {r.get('id', '-')}",
            f"  Score    : {r['final_score']:.1f}%",
            f"  Analisis : {generate_reasoning(r)}",
        ]
        matched   = r.get('matched_skills', [])
        unmatched = r.get('unmatched_skills', [])
        if matched:
            lines.append(f"  Skill OK : {', '.join(matched[:6])}")
        if unmatched:
            lines.append(f"  Gap Skill: {', '.join(unmatched[:4])}")
        lines.append("  " + SEP2)

    lines += [
        "\n  DISCLAIMER",
        "  Score adalah indikator relevansi semantik berbasis AI.",
        "  Sistem ini adalah alat bantu penyaringan, bukan pengambil keputusan.",
        "  Keputusan rekrutmen final sepenuhnya ada di tangan HRD.",
        SEP,
    ]
    return '\n'.join(lines)


# ── PUBLIC API ────────────────────────────────────────────────

def analyze_single(cv_input: str, jd_text: str, jd_title: str = "Posisi") -> Dict:
    """
    Analisis satu CV terhadap satu JD (Job Seeker).

    Returns JSON dengan field:
        candidate_name, score_result, label, reasoning,
        matched_skills, unmatched_skills, cv_text,
        summary_recommendation, report
    """
    cv_text        = load_cv(cv_input)
    score_result   = score_cv(cv_text, jd_text)
    label          = get_match_label(score_result['final_score'])
    reasoning      = generate_reasoning(score_result)
    skill_match    = match_skills(cv_text, jd_text)
    candidate_name = extract_candidate_name(cv_text)
    summary_rec    = generate_summary_recommendation(
        score_result, skill_match, candidate_name, jd_title
    )
    report = build_report(
        ranked_results=[{**score_result, 'id': cv_input, 'rank': 1,
                         'candidate_name': candidate_name, **skill_match}],
        jd_title=jd_title,
        show_section_detail=True,
    )
    return {
        'candidate_name':         candidate_name,
        'score_result':           score_result,
        'label':                  list(label),
        'reasoning':              reasoning,
        'matched_skills':         skill_match['matched_skills'],
        'unmatched_skills':       skill_match['unmatched_skills'],
        'job_skills':             skill_match['jd_skills'],
        'cv_skills':              skill_match['cv_skills'],
        'cv_text':                cv_text,
        'summary_recommendation': summary_rec,
        'report':                 report,
    }


def analyze_batch(
    cv_inputs:   List[Dict],
    jd_text:     str,
    jd_title:    str           = "Posisi",
    top_n:       Optional[int]  = None,
    show_detail: bool           = False,
) -> Dict:
    """
    Ranking banyak CV terhadap satu JD (HRD).

    Returns JSON dengan field:
        ranked (list dengan semua field per kandidat),
        report, summary
    """
    ranked = rank_cvs(cv_inputs, jd_text, top_n=None)

    for r in ranked:
        cv_text = r.get('text', '')
        sm      = match_skills(cv_text, jd_text)
        name    = extract_candidate_name(cv_text)
        r['candidate_name']         = name
        r['matched_skills']         = sm['matched_skills']
        r['unmatched_skills']       = sm['unmatched_skills']
        r['job_skills']             = sm['jd_skills']
        r['cv_skills']              = sm['cv_skills']
        r['cv_text']                = cv_text
        r['summary_recommendation'] = generate_summary_recommendation(
            r, sm, name, jd_title
        )

    report    = build_report(ranked_results=ranked, jd_title=jd_title,
                              top_n=top_n, show_section_detail=show_detail)
    total     = len(ranked)
    strong    = sum(1 for r in ranked if r['final_score'] >= MATCH_THRESHOLDS['strong'])
    potential = sum(1 for r in ranked
                    if MATCH_THRESHOLDS['potential'] <= r['final_score'] < MATCH_THRESHOLDS['strong'])

    return {
        'ranked':  ranked[:top_n] if top_n else ranked,
        'report':  report,
        'summary': {
            'total':     total,
            'strong':    strong,
            'potential': potential,
            'low':       total - strong - potential,
        },
    }


print("✅ Public API ready!")
print("   analyze_single() ← Job Seeker (1 CV)")
print("   analyze_batch()  ← HRD (multiple CV)")

# ============================================================
# SMOKE TEST
# ============================================================

print("\n" + "=" * 68)
print("SMOKE TEST v2")
print("=" * 68)

_jd = """
We are looking for a Senior Frontend Developer.
Requirements:
- Minimum 3 years experience in frontend development
- Proficiency in React.js, Vue.js, JavaScript, TypeScript
- Experience with REST API integration
- Knowledge of MySQL or PostgreSQL
- Familiarity with Git and CI/CD
- Bachelor degree in Computer Science
"""

_cv = """
SARI DEWI KUSUMA
sari.dewi@email.com | 081234567890

Summary
Frontend Developer dengan 4 tahun pengalaman di pengembangan web.
Mahir dalam Vue.js, JavaScript, dan REST API.

Work Experience
Frontend Developer | PT Teknologi Maju | 2021 - Present
- Mengembangkan aplikasi web menggunakan Vue.js dan JavaScript
- Integrasi REST API dengan backend Express.js
- Penggunaan MySQL untuk manajemen data

Skills
Vue.js, JavaScript, REST API, MySQL, Git, HTML, CSS

Education
S1 Teknik Informatika | Universitas Indonesia | 2021
"""

result = analyze_single(_cv, _jd, "Senior Frontend Developer")
label, emoji = result['label']
print(f"\n  Nama kandidat : {result['candidate_name']}")
print(f"  Score         : {emoji} {label} ({result['score_result']['final_score']:.1f}%)")
print(f"  Skill sesuai  : {result['matched_skills']}")
print(f"  Skill gap     : {result['unmatched_skills']}")
print(f"  Summary       : {result['summary_recommendation'][:150]}...")

print("\n✅ Smoke test passed!")
print("=" * 68)
print("""
OUTPUT JSON UNTUK BACKEND:
  candidate_name         → nama kandidat dari CV
  score_result           → detail scoring SBERT per section
  label                  → ["Strong Match", "🟢"]
  reasoning              → analisis singkat 1-2 kalimat
  matched_skills         → list skill yang sesuai dengan JD
  unmatched_skills       → list skill yang kurang/tidak ada di CV
  jd_skills              → list seluruh skill requirement yang berhasil diekstrak dari Job Description
  cv_skills              → list seluruh skill yang berhasil diekstrak dari CV kandidat
  cv_text                → isi teks CV (untuk ditampilkan di detail)
  summary_recommendation → rekomendasi lengkap 3-4 kalimat
  report                 → laporan teks lengkap (untuk export)
""")