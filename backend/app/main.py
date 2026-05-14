from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, engine
from app.models import (  # noqa: F401 — импорт для регистрации в metadata
    Assignment,
    Enrollment,
    GradingDataset,
    Group,
    Message,
    Notification,
    Submission,
    User,
)
from app.routers import auth, chat, files, health, student, teacher


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаём папки хранения, если их нет
    Path(settings.storage_path).mkdir(parents=True, exist_ok=True)
    Path(settings.grading_workdir).mkdir(parents=True, exist_ok=True)
    # Создаём таблицы (для демо без Alembic)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AutoGrade AI", version="0.1.0", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["teacher"])
app.include_router(student.router, prefix="/api/student", tags=["student"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
