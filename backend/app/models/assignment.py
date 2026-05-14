import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    group_id: Mapped[str] = mapped_column(
        String, ForeignKey("groups.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    reference_solution: Mapped[str] = mapped_column(Text, default="", nullable=False)
    rubric: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    # [{ "criterion": str, "max_points": float, "description": str }]
    max_score: Mapped[float] = mapped_column(Float, default=10.0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
