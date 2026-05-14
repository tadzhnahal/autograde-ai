import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Group(Base):
    """Класс / группа / поток — основная единица в системе.

    У группы своя `grade_scale` (0-5, 0-10, 0-100). Все задания внутри группы
    используют эту шкалу как `max_score`.
    """

    __tablename__ = "groups"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    teacher_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    grade_scale: Mapped[str] = mapped_column(
        String, default="0-10", nullable=False
    )  # 0-5 | 0-10 | 0-100
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
