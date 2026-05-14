import mimetypes
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.assignment import Assignment
from app.models.group import Group
from app.models.submission import Submission
from app.models.user import User
from app.services.storage import get_storage

router = APIRouter()


@router.get("/submissions/{submission_id}")
def download_submission_file(
    submission_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = db.get(Submission, submission_id)
    if s is None:
        raise HTTPException(404, "Submission not found")
    # Доступ: либо студент-владелец, либо учитель, которому принадлежит группа задания
    if user.role == "student":
        if s.student_id != user.id:
            raise HTTPException(403, "Not your submission")
    elif user.role == "teacher":
        assignment = db.get(Assignment, s.assignment_id)
        if assignment is None:
            raise HTTPException(404, "Assignment not found")
        group = db.get(Group, assignment.group_id)
        if group is None or group.teacher_id != user.id:
            raise HTTPException(403, "Not your submission")
    else:
        raise HTTPException(403, "Forbidden")

    storage = get_storage()
    if not storage.exists(s.file_path):
        raise HTTPException(404, "File missing on disk")

    abs_path: Path = storage.absolute_path(s.file_path)
    filename = abs_path.name
    media_type, _ = mimetypes.guess_type(filename)
    return FileResponse(
        path=str(abs_path),
        media_type=media_type or "application/octet-stream",
        filename=filename,
    )
