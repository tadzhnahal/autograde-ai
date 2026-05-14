"""Подготовка файлов студента к грейдингу:
PDF → постраничные PNG, DOCX → текст, LaTeX/изображения — копируем как есть."""

from __future__ import annotations

import logging
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)


def render_pdf_to_pngs(pdf_path: Path, output_dir: Path, dpi: int = 150) -> list[Path]:
    """Рендерит PDF в PNG (по странице). Возвращает список путей.

    Если poppler не установлен или pdf2image падает — возвращает пустой список,
    Claude Code сможет прочитать PDF самостоятельно через свой Read tool.
    """
    try:
        from pdf2image import convert_from_path  # type: ignore
    except ImportError:
        logger.warning("pdf2image not available; skipping PDF→PNG rendering")
        return []

    output_dir.mkdir(parents=True, exist_ok=True)
    try:
        images = convert_from_path(str(pdf_path), dpi=dpi)
    except Exception as exc:  # noqa: BLE001
        logger.warning("PDF→PNG rendering failed (%s); Claude will read PDF directly", exc)
        return []

    paths: list[Path] = []
    for idx, img in enumerate(images, start=1):
        p = output_dir / f"page_{idx:02d}.png"
        img.save(p, format="PNG")
        paths.append(p)
    return paths


def extract_docx_text(docx_path: Path, output_txt: Path) -> bool:
    try:
        from docx import Document  # type: ignore
    except ImportError:
        logger.warning("python-docx not available; skipping DOCX→TXT extraction")
        return False

    try:
        doc = Document(str(docx_path))
        text = "\n".join(p.text for p in doc.paragraphs)
        output_txt.write_text(text, encoding="utf-8")
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("DOCX→TXT extraction failed: %s", exc)
        return False


def prepare_student_work(
    source_file: Path, file_type: str, workdir: Path
) -> dict:
    """Кладёт работу студента в workdir в форме, удобной для Claude Code.

    Возвращает словарь с описанием подготовленных артефактов.
    """
    workdir.mkdir(parents=True, exist_ok=True)
    artifacts: dict = {"original_filename": source_file.name, "file_type": file_type}

    target = workdir / f"student_work{source_file.suffix.lower()}"
    shutil.copy(source_file, target)
    artifacts["work_file"] = target.name

    if file_type == "pdf":
        pages_dir = workdir / "student_work_pages"
        pages = render_pdf_to_pngs(source_file, pages_dir)
        artifacts["pages"] = [p.name for p in pages]
    elif file_type == "docx":
        txt_path = workdir / "student_work.txt"
        if extract_docx_text(source_file, txt_path):
            artifacts["text_file"] = txt_path.name

    return artifacts
