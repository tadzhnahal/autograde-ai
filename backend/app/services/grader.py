"""AI-грейдер через локальный Claude Code CLI.

Используется в фоновой задаче FastAPI BackgroundTasks. Никакого Anthropic API,
никаких сетевых вызовов — только subprocess к локально установленному `claude`.

Mock-режим (GRADER_MODE=mock) возвращает фиктивный валидный результат для
случаев, когда CLI недоступен (отсутствует на машине / нет авторизации).
"""

from __future__ import annotations

import json
import logging
import random
import re
import shutil
import subprocess
import time
from datetime import datetime
from pathlib import Path

from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session

from app.config import settings
from app.db import SessionLocal
from app.models.assignment import Assignment
from app.models.group import Group
from app.models.submission import Submission
from app.models.user import User
from app.prompts.grading_prompt import GRADING_PROMPT
from app.services import notifications_service
from app.services.file_processor import prepare_student_work
from app.services.storage import get_storage

logger = logging.getLogger(__name__)


class CriterionScore(BaseModel):
    criterion: str
    points: float = Field(ge=0)
    max_points: float = Field(gt=0)
    comment: str = ""


class GradingResult(BaseModel):
    ai_score: float = Field(ge=0)
    max_score: float = Field(gt=0)
    confidence: float = Field(ge=0, le=1)
    per_criterion: list[CriterionScore]
    suggestions: list[str]
    feedback: str


class GraderError(RuntimeError):
    pass


# ----------------------------------------------------------------------------
# Public API: schedule grading from FastAPI BackgroundTasks
# ----------------------------------------------------------------------------


def run_grading(submission_id: str) -> None:
    """Точка входа из BackgroundTasks. Открывает свою сессию БД."""
    db = SessionLocal()
    try:
        _grade_in_session(db, submission_id)
    except Exception:  # noqa: BLE001
        logger.exception("Unexpected error in grading worker for %s", submission_id)
    finally:
        db.close()


def _grade_in_session(db: Session, submission_id: str) -> None:
    sub = db.get(Submission, submission_id)
    if sub is None:
        logger.warning("Submission %s vanished before grading", submission_id)
        return
    assignment = db.get(Assignment, sub.assignment_id)
    if assignment is None:
        logger.warning("Assignment %s missing for submission %s", sub.assignment_id, submission_id)
        return
    group = db.get(Group, assignment.group_id)
    student = db.get(User, sub.student_id)

    sub.status = "grading"
    db.commit()

    try:
        result = _grade_one(sub, assignment)
    except GraderError as exc:
        logger.error("Grading failed for %s: %s", submission_id, exc)
        sub.status = "error"
        sub.ai_raw_output = str(exc)[:5000]
        db.commit()
        if group is not None and student is not None:
            notifications_service.notify_grading_error(
                db,
                teacher_id=group.teacher_id,
                submission_id=sub.id,
                student_name=student.full_name,
                error=str(exc)[:300],
            )
        return
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected grading error for %s", submission_id)
        sub.status = "error"
        sub.ai_raw_output = repr(exc)[:5000]
        db.commit()
        return

    sub.ai_score = float(result.ai_score)
    sub.ai_feedback = result.feedback
    sub.ai_suggestions = list(result.suggestions)
    sub.ai_confidence = float(result.confidence)
    sub.ai_per_criterion = [c.model_dump() for c in result.per_criterion]
    sub.ai_graded_at = datetime.utcnow()
    sub.status = "ai_graded"
    db.commit()

    if group is not None and student is not None:
        notifications_service.notify_grading_done(
            db,
            teacher_id=group.teacher_id,
            submission_id=sub.id,
            student_name=student.full_name,
            assignment_title=assignment.title,
            ai_score=sub.ai_score,
        )


# ----------------------------------------------------------------------------
# Internal: dispatch by mode
# ----------------------------------------------------------------------------


def _grade_one(submission: Submission, assignment: Assignment) -> GradingResult:
    mode = settings.grader_mode
    if mode == "mock":
        return _grade_mock(assignment)
    if mode == "claude_cli":
        return _grade_via_claude(submission, assignment)
    raise GraderError(f"Unknown GRADER_MODE={mode!r}")


# ----------------------------------------------------------------------------
# Mock grader
# ----------------------------------------------------------------------------


def _grade_mock(assignment: Assignment) -> GradingResult:
    time.sleep(1.5)
    max_score = float(assignment.max_score)
    rubric = assignment.rubric or [
        {"criterion": "Overall", "max_points": max_score, "description": ""}
    ]

    per_criterion: list[CriterionScore] = []
    points_factor = random.uniform(0.7, 0.95)
    for item in rubric:
        max_pts = float(item.get("max_points", max_score / len(rubric)))
        pts = round(max_pts * points_factor, 2)
        per_criterion.append(
            CriterionScore(
                criterion=item.get("criterion", "—"),
                points=pts,
                max_points=max_pts,
                comment="Mock: критерий выполнен с небольшими замечаниями.",
            )
        )

    total = round(sum(c.points for c in per_criterion), 2)
    return GradingResult(
        ai_score=total,
        max_score=max_score,
        confidence=round(random.uniform(0.75, 0.95), 2),
        per_criterion=per_criterion,
        suggestions=[
            "Решение в целом верное",
            "Часть шагов оформлена кратко — можно расписать подробнее",
            "Ответ соответствует ожидаемому формату",
        ],
        feedback=(
            "Хорошая работа! Ход решения в целом правильный, заметны небольшие "
            "неточности в оформлении промежуточных шагов. Финальный ответ "
            "корректный. Это mock-проверка для демо без CLI."
        ),
    )


# ----------------------------------------------------------------------------
# Claude CLI grader
# ----------------------------------------------------------------------------


def _grade_via_claude(submission: Submission, assignment: Assignment) -> GradingResult:
    workdir = Path(settings.grading_workdir).resolve() / submission.id
    if workdir.exists():
        shutil.rmtree(workdir)
    workdir.mkdir(parents=True, exist_ok=True)

    storage = get_storage()
    source_file = storage.absolute_path(submission.file_path)
    if not source_file.is_file():
        raise GraderError(f"Source file missing: {submission.file_path}")

    artifacts = prepare_student_work(source_file, submission.file_type, workdir)

    assignment_json = {
        "title": assignment.title,
        "description": assignment.description,
        "reference_solution": assignment.reference_solution,
        "rubric": assignment.rubric,
        "max_score": assignment.max_score,
    }
    (workdir / "assignment.json").write_text(
        json.dumps(assignment_json, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (workdir / "instructions.md").write_text(GRADING_PROMPT, encoding="utf-8")
    logger.info("Grading workdir prepared: %s (artifacts=%s)", workdir, artifacts)

    cmd = [
        settings.claude_bin,
        "-p",
        GRADING_PROMPT,
        "--output-format",
        "json",
        "--permission-mode",
        "acceptEdits",
        "--add-dir",
        str(workdir),
    ]
    logger.info("Launching Claude CLI: %s", " ".join(cmd[:6]) + " ...")
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=settings.claude_timeout_seconds,
            cwd=str(workdir),
        )
    except FileNotFoundError as exc:
        raise GraderError(
            f"Claude CLI binary not found: {settings.claude_bin!r}. "
            "Установи Claude Code или включи GRADER_MODE=mock."
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise GraderError(
            f"Claude CLI timed out after {settings.claude_timeout_seconds}s"
        ) from exc

    if proc.returncode != 0:
        raise GraderError(
            f"claude exited with code {proc.returncode}: {proc.stderr[:1000] or proc.stdout[:1000]}"
        )

    # Сохраним сырой stdout — пригодится для дебага и записи в БД
    (workdir / "claude_stdout.json").write_text(proc.stdout or "", encoding="utf-8")
    return parse_claude_output(proc.stdout, workdir)


def parse_claude_output(stdout: str, workdir: Path) -> GradingResult:
    # 1) Наиболее надёжный путь — Claude должен был записать grading_result.json
    result_file = workdir / "grading_result.json"
    if result_file.exists():
        try:
            return GradingResult.model_validate_json(result_file.read_text("utf-8"))
        except ValidationError as exc:
            raise GraderError(f"grading_result.json invalid: {exc}") from exc

    # 2) Иначе — извлекаем финальный JSON из stdout
    text = stdout or ""
    try:
        wrapper = json.loads(text)
        if isinstance(wrapper, dict):
            text = (
                wrapper.get("result")
                or wrapper.get("content")
                or wrapper.get("message")
                or stdout
            )
            if isinstance(text, list):
                # message может быть массивом блоков {type, text}
                text = "\n".join(
                    block.get("text", "") if isinstance(block, dict) else str(block)
                    for block in text
                )
    except json.JSONDecodeError:
        pass

    if not isinstance(text, str):
        text = str(text)

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match is None:
        raise GraderError(f"No JSON object in Claude output: {text[:500]!r}")
    try:
        return GradingResult.model_validate_json(match.group(0))
    except ValidationError as exc:
        raise GraderError(f"GradingResult schema validation failed: {exc}") from exc
