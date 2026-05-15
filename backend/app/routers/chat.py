"""Чат ученик ↔ учитель в рамках группы.

Для студента собеседник в группе всегда один — учитель этой группы.
Для учителя в группе может быть много собеседников (все её ученики).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db import get_db
from app.deps import get_current_user
from app.models.enrollment import Enrollment
from app.models.group import Group
from app.models.message import Message
from app.models.user import User
from app.services import notifications_service

router = APIRouter()


class SendMessageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    to_user_id: str | None = None  # обязательно для учителя; для студента игнорируется


def _ensure_member(db: Session, group: Group, user: User) -> None:
    if user.role == "teacher":
        if group.teacher_id != user.id:
            raise HTTPException(403, "Not your group")
        return
    enrolled = (
        db.query(Enrollment)
        .filter(Enrollment.group_id == group.id, Enrollment.student_id == user.id)
        .first()
    )
    if enrolled is None:
        raise HTTPException(403, "You are not in this group")


def to_sortable_datetime(value: object) -> datetime:
    fallback = datetime.min.replace(tzinfo=timezone.utc)

    if value is None:
        return fallback

    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    if isinstance(value, str):
        raw_value = value.strip()
        if not raw_value:
            return fallback

        normalized_value = raw_value.replace("Z", "+00:00")

        try:
            parsed_value = datetime.fromisoformat(normalized_value)
        except ValueError:
            return fallback

        if parsed_value.tzinfo is None:
            return parsed_value.replace(tzinfo=timezone.utc)

        return parsed_value

    return fallback


@router.get("/groups")
def list_chat_groups(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Список групп, доступных для чата с учётом непрочитанных."""
    if user.role == "teacher":
        groups = db.query(Group).filter(Group.teacher_id == user.id).all()
    else:
        group_ids = [
            e.group_id
            for e in db.query(Enrollment).filter(Enrollment.student_id == user.id).all()
        ]
        groups = db.query(Group).filter(Group.id.in_(group_ids)).all() if group_ids else []

    result = []
    for g in groups:
        unread = (
            db.query(Message)
            .filter(
                Message.group_id == g.id,
                Message.to_user_id == user.id,
                Message.is_read.is_(False),
            )
            .count()
        )
        last = (
            db.query(Message)
            .filter(Message.group_id == g.id)
            .filter(
                (Message.from_user_id == user.id) | (Message.to_user_id == user.id)
            )
            .order_by(Message.created_at.desc())
            .first()
        )
        result.append(
            {
                "id": g.id,
                "name": g.name,
                "unread": unread,
                "last_message": (
                    None
                    if last is None
                    else {
                        "text": last.text[:200],
                        "created_at": last.created_at,
                        "from_me": last.from_user_id == user.id,
                    }
                ),
            }
        )

    result.sort(
        key=lambda r: to_sortable_datetime(
            r["last_message"]["created_at"] if r["last_message"] else None
        ),
        reverse=True,
    )

    return result


@router.get("/groups/{group_id}/threads")
def list_threads(
    group_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Для учителя: список собеседников в группе. Для студента: один учитель."""
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(404, "Group not found")
    _ensure_member(db, group, user)

    if user.role == "student":
        teacher = db.get(User, group.teacher_id)
        if teacher is None:
            return []
        unread = (
            db.query(Message)
            .filter(
                Message.group_id == group.id,
                Message.from_user_id == teacher.id,
                Message.to_user_id == user.id,
                Message.is_read.is_(False),
            )
            .count()
        )
        return [
            {
                "user_id": teacher.id,
                "full_name": teacher.full_name,
                "role": "teacher",
                "unread": unread,
            }
        ]

    # teacher
    student_ids = [
        e.student_id
        for e in db.query(Enrollment).filter(Enrollment.group_id == group.id).all()
    ]
    threads = []
    for sid in student_ids:
        student = db.get(User, sid)
        if student is None:
            continue
        unread = (
            db.query(Message)
            .filter(
                Message.group_id == group.id,
                Message.from_user_id == student.id,
                Message.to_user_id == user.id,
                Message.is_read.is_(False),
            )
            .count()
        )
        last = (
            db.query(Message)
            .filter(
                Message.group_id == group.id,
                ((Message.from_user_id == student.id) & (Message.to_user_id == user.id))
                | (
                    (Message.from_user_id == user.id)
                    & (Message.to_user_id == student.id)
                ),
            )
            .order_by(Message.created_at.desc())
            .first()
        )
        threads.append(
            {
                "user_id": student.id,
                "full_name": student.full_name,
                "role": "student",
                "unread": unread,
                "last_message": (
                    None
                    if last is None
                    else {
                        "text": last.text[:200],
                        "created_at": last.created_at,
                        "from_me": last.from_user_id == user.id,
                    }
                ),
            }
        )
    return threads


@router.get("/groups/{group_id}/messages")
def get_messages(
    group_id: str,
    with_user_id: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(404, "Group not found")
    _ensure_member(db, group, user)

    other_id: str
    if user.role == "student":
        other_id = group.teacher_id
    else:
        if with_user_id is None:
            raise HTTPException(400, "Teacher must specify with_user_id")
        other_id = with_user_id

    msgs = (
        db.query(Message)
        .filter(
            Message.group_id == group.id,
            (
                (Message.from_user_id == user.id) & (Message.to_user_id == other_id)
            )
            | (
                (Message.from_user_id == other_id) & (Message.to_user_id == user.id)
            ),
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Помечаем входящие как прочитанные
    db.query(Message).filter(
        Message.group_id == group.id,
        Message.from_user_id == other_id,
        Message.to_user_id == user.id,
        Message.is_read.is_(False),
    ).update({Message.is_read: True})
    db.commit()

    return [
        {
            "id": m.id,
            "text": m.text,
            "from_user_id": m.from_user_id,
            "to_user_id": m.to_user_id,
            "from_me": m.from_user_id == user.id,
            "created_at": m.created_at,
        }
        for m in msgs
    ]


@router.post("/groups/{group_id}/messages", status_code=201)
def send_message(
    group_id: str,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(404, "Group not found")
    _ensure_member(db, group, user)

    if user.role == "student":
        to_id = group.teacher_id
    else:
        if payload.to_user_id is None:
            raise HTTPException(400, "Teacher must specify to_user_id")
        to_id = payload.to_user_id
        # Проверка, что получатель действительно ученик в этой группе
        ok = (
            db.query(Enrollment)
            .filter(
                Enrollment.group_id == group.id, Enrollment.student_id == to_id
            )
            .first()
        )
        if ok is None:
            raise HTTPException(400, "Recipient is not in this group")

    msg = Message(
        group_id=group.id,
        from_user_id=user.id,
        to_user_id=to_id,
        text=payload.text,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    notifications_service.notify_new_message(
        db,
        to_user_id=to_id,
        group_id=group.id,
        from_name=user.full_name,
        preview=payload.text,
    )

    return {
        "id": msg.id,
        "text": msg.text,
        "from_user_id": msg.from_user_id,
        "to_user_id": msg.to_user_id,
        "from_me": True,
        "created_at": msg.created_at,
    }
