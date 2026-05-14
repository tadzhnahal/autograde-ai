"""Файловое хранилище через интерфейс, чтобы локальную папку можно было заменить
на S3 / MinIO без правок в роутерах."""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path
from typing import BinaryIO, Protocol

from app.config import settings


class FileStorage(Protocol):
    def save(self, source: BinaryIO, *, original_name: str, prefix: str) -> str:
        """Сохранить файл и вернуть относительный путь (хранится в Submission.file_path)."""

    def open(self, relative_path: str) -> BinaryIO:
        """Открыть файл на чтение в бинарном режиме."""

    def absolute_path(self, relative_path: str) -> Path:
        """Абсолютный путь — нужен грейдеру, чтобы скопировать в workdir."""

    def exists(self, relative_path: str) -> bool: ...


class LocalStorage:
    def __init__(self, root: str | Path):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, source: BinaryIO, *, original_name: str, prefix: str) -> str:
        safe_name = Path(original_name).name or "upload.bin"
        sub_id = uuid.uuid4().hex
        rel_dir = Path(prefix) / sub_id
        abs_dir = self.root / rel_dir
        abs_dir.mkdir(parents=True, exist_ok=True)
        abs_path = abs_dir / safe_name
        with abs_path.open("wb") as out:
            shutil.copyfileobj(source, out)
        return str(rel_dir / safe_name)

    def open(self, relative_path: str) -> BinaryIO:
        return (self.root / relative_path).open("rb")

    def absolute_path(self, relative_path: str) -> Path:
        return self.root / relative_path

    def exists(self, relative_path: str) -> bool:
        return (self.root / relative_path).is_file()


_storage: FileStorage | None = None


def get_storage() -> FileStorage:
    global _storage
    if _storage is None:
        if settings.storage_backend == "local":
            _storage = LocalStorage(settings.storage_path)
        else:
            raise RuntimeError(
                f"Unknown STORAGE_BACKEND={settings.storage_backend!r}; only 'local' is implemented"
            )
    return _storage


def detect_file_type(filename: str) -> str:
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext == "pdf":
        return "pdf"
    if ext == "docx":
        return "docx"
    if ext == "tex":
        return "latex"
    if ext in {"png", "jpg", "jpeg", "webp"}:
        return "image"
    raise ValueError(
        f"Unsupported file type {ext!r}. Allowed: pdf, docx, tex, png, jpg, jpeg, webp."
    )
