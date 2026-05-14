import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    assignment_id: Mapped[str] = mapped_column(
        String, ForeignKey("assignments.id"), nullable=False, index=True
    )
    student_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )

    file_path: Mapped[str] = mapped_column(String, nullable=False)
    file_type: Mapped[str] = mapped_column(String, nullable=False)
    # pdf | docx | latex | image
    student_notes: Mapped[str] = mapped_column(Text, default="", nullable=False)

    status: Mapped[str] = mapped_column(String, default="pending", nullable=False)
    # pending | grading | ai_graded | graded | revision | error

    ai_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_suggestions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_per_criterion: Mapped[list | None] = mapped_column(JSON, nullable=True)
    ai_raw_output: Mapped[str | None] = mapped_column(Text, nullable=True)

    final_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    teacher_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    graded_by: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    ai_graded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    graded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
