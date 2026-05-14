from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_student
from app.models.assignment import Assignment
from app.models.enrollment import Enrollment
from app.models.group import Group
from app.models.notification import Notification
from app.models.submission import Submission
from app.models.user import User
from app.services import notifications_service
from app.services.grader import run_grading
from app.services.storage import detect_file_type, get_storage

router = APIRouter()


def _student_group_ids(db: Session, student: User) -> list[str]:
    return [
        e.group_id
        for e in db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    ]


# ----------------------------------------------------------------------------
# Dashboard
# ----------------------------------------------------------------------------


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student),
):
    group_ids = _student_group_ids(db, student)
    if not group_ids:
        return {
            "total_assignments": 0,
            "pending_submissions": 0,
            "average_grade": None,
            "groups": [],
        }
    groups = db.query(Group).filter(Group.id.in_(group_ids)).all()
    assignments = db.query(Assignment).filter(Assignment.group_id.in_(group_ids)).all()
    submissions = (
        db.query(Submission)
        .filter(Submission.student_id == student.id)
        .all()
    )
    subs_by_assignment = {s.assignment_id: s for s in submissions}

    pending = sum(
        1
        for a in assignments
        if a.id not in subs_by_assignment
        or subs_by_assignment[a.id].status in ("pending", "grading", "revision")
    )
    finals = [s.final_score for s in submissions if s.final_score is not None]
    avg = sum(finals) / len(finals) if finals else None

    groups_payload = []
    for g in groups:
        g_assignments = [a for a in assignments if a.group_id == g.id]
        completed = sum(
            1
            for a in g_assignments
            if a.id in subs_by_assignment
            and subs_by_assignment[a.id].status == "graded"
        )
        g_finals = [
            s.final_score
            for s in submissions
            if s.assignment_id in {a.id for a in g_assignments}
            and s.final_score is not None
        ]
        g_avg = sum(g_finals) / len(g_finals) if g_finals else None
        groups_payload.append(
            {
                "id": g.id,
                "name": g.name,
                "grade_scale": g.grade_scale,
                "assignments_total": len(g_assignments),
                "assignments_completed": completed,
                "average_score": g_avg,
            }
        )

    return {
        "total_assignments": len(assignments),
        "pending_submissions": pending,
        "average_grade": avg,
        "groups": groups_payload,
    }


@router.get("/groups/{group_id}")
def get_group_view(
    group_id: str,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student),
):
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(404, "Group not found")
    enrolled = (
        db.query(Enrollment)
        .filter(Enrollment.group_id == group.id, Enrollment.student_id == student.id)
        .first()
    )
    if enrolled is None:
        raise HTTPException(403, "You are not enrolled in this group")

    assignments = (
        db.query(Assignment)
        .filter(Assignment.group_id == group.id)
        .order_by(Assignment.created_at.desc())
        .all()
    )
    subs = {
        s.assignment_id: s
        for s in db.query(Submission)
        .filter(
            Submission.student_id == student.id,
            Submission.assignment_id.in_([a.id for a in assignments] or [""]),
        )
        .all()
    }
    items = []
    for a in assignments:
        s = subs.get(a.id)
        items.append(
            {
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "due_date": a.due_date,
                "max_score": a.max_score,
                "submission": (
                    None
                    if s is None
                    else {
                        "id": s.id,
                        "status": s.status,
                        "file_name": Path(s.file_path).name,
                        "submitted_at": s.submitted_at,
                        "final_score": s.final_score if s.status == "graded" else None,
                        "teacher_feedback": (
                            s.teacher_feedback if s.status in ("graded", "revision") else None
                        ),
                    }
                ),
            }
        )

    teacher = db.get(User, group.teacher_id)
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "grade_scale": group.grade_scale,
        "teacher": (
            None
            if teacher is None
            else {
                "id": teacher.id,
                "full_name": teacher.full_name,
                "email": teacher.email,
            }
        ),
        "assignments": items,
    }


# ----------------------------------------------------------------------------
# Submit
# ----------------------------------------------------------------------------


@router.post("/assignments/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    notes: str = Form(default=""),
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student),
):
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise HTTPException(404, "Assignment not found")
    enrolled = (
        db.query(Enrollment)
        .filter(
            Enrollment.group_id == assignment.group_id,
            Enrollment.student_id == student.id,
        )
        .first()
    )
    if enrolled is None:
        raise HTTPException(403, "You are not enrolled in this group")

    try:
        file_type = detect_file_type(file.filename or "upload.bin")
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    # Удаляем предыдущий сабмишен этого ученика по этому заданию, если был
    db.query(Submission).filter(
        Submission.assignment_id == assignment.id,
        Submission.student_id == student.id,
    ).delete()

    storage = get_storage()
    relative_path = storage.save(
        file.file,
        original_name=file.filename or "upload.bin",
        prefix=f"submissions/{assignment.id}",
    )

    submission = Submission(
        assignment_id=assignment.id,
        student_id=student.id,
        file_path=relative_path,
        file_type=file_type,
        student_notes=notes,
        status="pending",
        submitted_at=datetime.utcnow(),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    group = db.get(Group, assignment.group_id)
    if group is not None:
        notifications_service.notify_new_submission(
            db,
            teacher_id=group.teacher_id,
            submission_id=submission.id,
            student_name=student.full_name,
            assignment_title=assignment.title,
        )

    # Авто-запуск AI-грейдинга в фоне
    background_tasks.add_task(run_grading, submission.id)

    return {
        "id": submission.id,
        "status": submission.status,
        "submitted_at": submission.submitted_at,
    }


@router.get("/notifications")
def list_student_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student),
):
    q = db.query(Notification).filter(Notification.user_id == student.id)
    if unread_only:
        q = q.filter(Notification.is_read.is_(False))
    items = q.order_by(Notification.created_at.desc()).limit(50).all()
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in items
    ]


@router.post("/notifications/{notification_id}/read")
def mark_student_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student),
):
    n = db.get(Notification, notification_id)
    if n is None or n.user_id != student.id:
        raise HTTPException(404, "Not found")
    n.is_read = True
    db.commit()
    return {"status": "ok"}


@router.get("/submissions/{submission_id}")
def get_my_submission(
    submission_id: str,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student),
):
    s = db.get(Submission, submission_id)
    if s is None or s.student_id != student.id:
        raise HTTPException(404, "Submission not found")
    return {
        "id": s.id,
        "assignment_id": s.assignment_id,
        "status": s.status,
        "file_name": Path(s.file_path).name,
        "submitted_at": s.submitted_at,
        "final_score": s.final_score if s.status == "graded" else None,
        "teacher_feedback": (
            s.teacher_feedback if s.status in ("graded", "revision") else None
        ),
    }
