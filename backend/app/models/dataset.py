import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class GradingDataset(Base):
    """Data Moat: пары (AI-оценка, финальная оценка преподавателя, дельта).

    Заполняется при `POST /teacher/submissions/{id}/finish`.
    """

    __tablename__ = "grading_dataset"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    submission_id: Mapped[str] = mapped_column(
        String, ForeignKey("submissions.id"), nullable=False, index=True
    )
    ai_score: Mapped[float] = mapped_column(Float, nullable=False)
    final_score: Mapped[float] = mapped_column(Float, nullable=False)
    teacher_changed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    delta: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
