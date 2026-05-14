from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_teacher
from app.models.assignment import Assignment
from app.models.dataset import GradingDataset
from app.models.enrollment import Enrollment
from app.models.group import Group
from app.models.notification import Notification
from app.models.submission import Submission
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentListItem,
    AssignmentResponse,
    AssignmentUpdate,
)
from app.schemas.common import max_score_for_scale
from app.schemas.group import (
    GroupCreate,
    GroupListItem,
    GroupResponse,
    GroupUpdate,
    StudentInGroup,
)
from app.schemas.student import StudentCreate, StudentDetail, StudentResponse
from app.schemas.submission import FinishReviewRequest, SubmissionListItem
from app.services import notifications_service
from app.services.auth_service import hash_password
from app.services.grader import run_grading

router = APIRouter()


# ----------------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------------


def _get_owned_group(db: Session, group_id: str, teacher: User) -> Group:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(404, "Group not found")
    if group.teacher_id != teacher.id:
        raise HTTPException(403, "Not your group")
    return group


def _get_owned_assignment(db: Session, assignment_id: str, teacher: User) -> tuple[Assignment, Group]:
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise HTTPException(404, "Assignment not found")
    group = _get_owned_group(db, assignment.group_id, teacher)
    return assignment, group


def _get_owned_submission(db: Session, submission_id: str, teacher: User) -> tuple[Submission, Assignment, Group]:
    sub = db.get(Submission, submission_id)
    if sub is None:
        raise HTTPException(404, "Submission not found")
    assignment, group = _get_owned_assignment(db, sub.assignment_id, teacher)
    return sub, assignment, group


def _teacher_group_ids(db: Session, teacher: User) -> list[str]:
    return [g.id for g in db.query(Group.id).filter(Group.teacher_id == teacher.id).all()]


# ----------------------------------------------------------------------------
# Groups
# ----------------------------------------------------------------------------


@router.get("/groups", response_model=list[GroupListItem])
def list_groups(
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    groups = (
        db.query(Group)
        .filter(Group.teacher_id == teacher.id)
        .order_by(Group.created_at.desc())
        .all()
    )
    result = []
    for g in groups:
        students_count = (
            db.query(func.count(Enrollment.id))
            .filter(Enrollment.group_id == g.id)
            .scalar()
            or 0
        )
        assignments_count = (
            db.query(func.count(Assignment.id))
            .filter(Assignment.group_id == g.id)
            .scalar()
            or 0
        )
        pending = (
            db.query(func.count(Submission.id))
            .join(Assignment, Submission.assignment_id == Assignment.id)
            .filter(
                Assignment.group_id == g.id,
                Submission.status.in_(["pending", "grading", "ai_graded"]),
            )
            .scalar()
            or 0
        )
        result.append(
            GroupListItem(
                id=g.id,
                name=g.name,
                description=g.description,
                teacher_id=g.teacher_id,
                grade_scale=g.grade_scale,
                created_at=g.created_at,
                students_count=students_count,
                assignments_count=assignments_count,
                pending_submissions=pending,
            )
        )
    return result


@router.post("/groups", response_model=GroupResponse, status_code=201)
def create_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group = Group(
        name=payload.name,
        description=payload.description,
        teacher_id=teacher.id,
        grade_scale=payload.grade_scale,
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.get("/groups/{group_id}", response_model=GroupResponse)
def get_group(
    group_id: str,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    return _get_owned_group(db, group_id, teacher)


@router.patch("/groups/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: str,
    payload: GroupUpdate,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group = _get_owned_group(db, group_id, teacher)
    if payload.name is not None:
        group.name = payload.name
    if payload.description is not None:
        group.description = payload.description
    if payload.grade_scale is not None and payload.grade_scale != group.grade_scale:
        group.grade_scale = payload.grade_scale
        # Подтягиваем max_score у всех существующих заданий
        new_max = max_score_for_scale(payload.grade_scale)
        db.query(Assignment).filter(Assignment.group_id == group.id).update(
            {Assignment.max_score: new_max}
        )
    db.commit()
    db.refresh(group)
    return group


@router.delete("/groups/{group_id}", status_code=204)
def delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group = _get_owned_group(db, group_id, teacher)
    db.query(Enrollment).filter(Enrollment.group_id == group.id).delete()
    assignment_ids = [
        a.id
        for a in db.query(Assignment.id).filter(Assignment.group_id == group.id).all()
    ]
    if assignment_ids:
        db.query(Submission).filter(
            Submission.assignment_id.in_(assignment_ids)
        ).delete(synchronize_session=False)
        db.query(Assignment).filter(Assignment.group_id == group.id).delete()
    db.delete(group)
    db.commit()


@router.get("/groups/{group_id}/students", response_model=list[StudentInGroup])
def list_group_students(
    group_id: str,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group = _get_owned_group(db, group_id, teacher)
    enrollments = (
        db.query(Enrollment).filter(Enrollment.group_id == group.id).all()
    )
    out = []
    for e in enrollments:
        student = db.get(User, e.student_id)
        if student is None:
            continue
        # Среднее по сданным и оценённым работам этого ученика в этой группе
        scores = (
            db.query(Submission.final_score)
            .join(Assignment, Submission.assignment_id == Assignment.id)
            .filter(
                Assignment.group_id == group.id,
                Submission.student_id == student.id,
                Submission.final_score.isnot(None),
            )
            .all()
        )
        avg = sum(s[0] for s in scores) / len(scores) if scores else None
        subs_count = (
            db.query(func.count(Submission.id))
            .join(Assignment, Submission.assignment_id == Assignment.id)
            .filter(
                Assignment.group_id == group.id,
                Submission.student_id == student.id,
            )
            .scalar()
            or 0
        )
        out.append(
            StudentInGroup(
                id=student.id,
                email=student.email,
                full_name=student.full_name,
                enrolled_at=e.created_at,
                average_score=avg,
                submissions_count=subs_count,
            )
        )
    return out


# ----------------------------------------------------------------------------
# Students
# ----------------------------------------------------------------------------


@router.get("/students", response_model=list[StudentResponse])
def list_students(
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group_ids = _teacher_group_ids(db, teacher)
    if not group_ids:
        return []
    student_ids = [
        s[0]
        for s in db.query(Enrollment.student_id)
        .filter(Enrollment.group_id.in_(group_ids))
        .distinct()
        .all()
    ]
    if not student_ids:
        return []
    students = (
        db.query(User)
        .filter(User.id.in_(student_ids))
        .order_by(User.full_name)
        .all()
    )
    return students


@router.post("/students", response_model=StudentResponse, status_code=201)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(400, "Email already registered")
    # Все группы должны принадлежать этому учителю
    for gid in payload.group_ids:
        _get_owned_group(db, gid, teacher)

    student = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role="student",
    )
    db.add(student)
    db.flush()
    for gid in payload.group_ids:
        db.add(Enrollment(student_id=student.id, group_id=gid))
    db.commit()
    db.refresh(student)
    return student


@router.get("/students/{student_id}", response_model=StudentDetail)
def get_student(
    student_id: str,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    student = db.get(User, student_id)
    if student is None or student.role != "student":
        raise HTTPException(404, "Student not found")
    teacher_group_ids = set(_teacher_group_ids(db, teacher))
    # Проверка: студент должен быть хотя бы в одной группе этого учителя
    student_group_ids = {
        e.group_id
        for e in db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    }
    shared = teacher_group_ids & student_group_ids
    if not shared:
        raise HTTPException(403, "This student is not in any of your groups")

    groups_info = []
    for gid in shared:
        g = db.get(Group, gid)
        if g is not None:
            groups_info.append({"id": g.id, "name": g.name, "grade_scale": g.grade_scale})

    subs = (
        db.query(Submission)
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .filter(
            Assignment.group_id.in_(shared),
            Submission.student_id == student.id,
        )
        .all()
    )
    graded = [s for s in subs if s.final_score is not None]
    avg = sum(s.final_score for s in graded) / len(graded) if graded else None

    return StudentDetail(
        id=student.id,
        email=student.email,
        full_name=student.full_name,
        role=student.role,
        created_at=student.created_at,
        groups=groups_info,
        submissions_count=len(subs),
        graded_count=len(graded),
        average_score=avg,
    )


class EnrollRequest(BaseModel):
    student_id: str


@router.post("/groups/{group_id}/enroll", status_code=201)
def enroll_student(
    group_id: str,
    payload: EnrollRequest,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group = _get_owned_group(db, group_id, teacher)
    student = db.get(User, payload.student_id)
    if student is None or student.role != "student":
        raise HTTPException(404, "Student not found")
    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.group_id == group.id,
            Enrollment.student_id == student.id,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(400, "Already enrolled")
    enrollment = Enrollment(student_id=student.id, group_id=group.id)
    db.add(enrollment)
    db.commit()
    return {"status": "ok"}


@router.delete("/groups/{group_id}/students/{student_id}", status_code=204)
def unenroll_student(
    group_id: str,
    student_id: str,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group = _get_owned_group(db, group_id, teacher)
    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.group_id == group.id,
            Enrollment.student_id == student_id,
        )
        .first()
    )
    if enrollment is None:
        raise HTTPException(404, "Enrollment not found")
    db.delete(enrollment)
    db.commit()


# ----------------------------------------------------------------------------
# Assignments
# ----------------------------------------------------------------------------


def _assignment_list_item(db: Session, a: Assignment, group: Group) -> AssignmentListItem:
    subs = db.query(Submission).filter(Submission.assignment_id == a.id).all()
    pending = sum(1 for s in subs if s.status in ("pending", "grading", "ai_graded"))
    graded = sum(1 for s in subs if s.status == "graded")
    return AssignmentListItem(
        id=a.id,
        group_id=a.group_id,
        group_name=group.name,
        title=a.title,
        description=a.description,
        due_date=a.due_date,
        max_score=a.max_score,
        created_at=a.created_at,
        submissions_count=len(subs),
        pending_count=pending,
        graded_count=graded,
    )


@router.get("/assignments", response_model=list[AssignmentListItem])
def list_all_assignments(
    group_id: str | None = None,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group_ids = _teacher_group_ids(db, teacher)
    if not group_ids:
        return []
    q = db.query(Assignment).filter(Assignment.group_id.in_(group_ids))
    if group_id is not None:
        if group_id not in group_ids:
            raise HTTPException(403, "Not your group")
        q = q.filter(Assignment.group_id == group_id)
    assignments = q.order_by(Assignment.created_at.desc()).all()
    groups_by_id = {g.id: g for g in db.query(Group).filter(Group.id.in_(group_ids)).all()}
    return [_assignment_list_item(db, a, groups_by_id[a.group_id]) for a in assignments]


@router.post(
    "/groups/{group_id}/assignments",
    response_model=AssignmentResponse,
    status_code=201,
)
def create_assignment(
    group_id: str,
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group = _get_owned_group(db, group_id, teacher)
    assignment = Assignment(
        group_id=group.id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        reference_solution=payload.reference_solution,
        rubric=[r.model_dump() for r in payload.rubric],
        max_score=max_score_for_scale(group.grade_scale),
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    a, _ = _get_owned_assignment(db, assignment_id, teacher)
    return a


@router.patch("/assignments/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    a, _ = _get_owned_assignment(db, assignment_id, teacher)
    if payload.title is not None:
        a.title = payload.title
    if payload.description is not None:
        a.description = payload.description
    if payload.due_date is not None:
        a.due_date = payload.due_date
    if payload.reference_solution is not None:
        a.reference_solution = payload.reference_solution
    if payload.rubric is not None:
        a.rubric = [r.model_dump() for r in payload.rubric]
    db.commit()
    db.refresh(a)
    return a


@router.delete("/assignments/{assignment_id}", status_code=204)
def delete_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    a, _ = _get_owned_assignment(db, assignment_id, teacher)
    db.query(Submission).filter(Submission.assignment_id == a.id).delete()
    db.delete(a)
    db.commit()


# ----------------------------------------------------------------------------
# Submissions
# ----------------------------------------------------------------------------


def _submission_list_item(
    db: Session, s: Submission, assignment: Assignment, group: Group
) -> SubmissionListItem:
    student = db.get(User, s.student_id)
    return SubmissionListItem(
        id=s.id,
        assignment_id=s.assignment_id,
        assignment_title=assignment.title,
        group_id=group.id,
        group_name=group.name,
        student_id=s.student_id,
        student_name=student.full_name if student else "—",
        student_email=student.email if student else "—",
        file_type=s.file_type,
        status=s.status,
        ai_score=s.ai_score,
        final_score=s.final_score,
        submitted_at=s.submitted_at,
        ai_graded_at=s.ai_graded_at,
        graded_at=s.graded_at,
    )


@router.get("/submissions", response_model=list[SubmissionListItem])
def list_submissions(
    group_id: str | None = None,
    assignment_id: str | None = None,
    student_id: str | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group_ids = _teacher_group_ids(db, teacher)
    if not group_ids:
        return []
    q = (
        db.query(Submission, Assignment, Group)
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .join(Group, Assignment.group_id == Group.id)
        .filter(Group.id.in_(group_ids))
    )
    if group_id is not None:
        if group_id not in group_ids:
            raise HTTPException(403, "Not your group")
        q = q.filter(Group.id == group_id)
    if assignment_id is not None:
        q = q.filter(Assignment.id == assignment_id)
    if student_id is not None:
        q = q.filter(Submission.student_id == student_id)
    if status_filter is not None:
        q = q.filter(Submission.status == status_filter)

    rows = q.order_by(Submission.submitted_at.desc()).all()
    return [_submission_list_item(db, s, a, g) for s, a, g in rows]


@router.get("/submissions/{submission_id}")
def get_submission_detail(
    submission_id: str,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    s, a, g = _get_owned_submission(db, submission_id, teacher)
    student = db.get(User, s.student_id)
    file_name = Path(s.file_path).name
    return {
        "id": s.id,
        "assignment_id": s.assignment_id,
        "assignment_title": a.title,
        "assignment_description": a.description,
        "assignment_rubric": a.rubric,
        "assignment_max_score": a.max_score,
        "assignment_reference_solution": a.reference_solution,
        "group_id": g.id,
        "group_name": g.name,
        "group_grade_scale": g.grade_scale,
        "student_id": s.student_id,
        "student_name": student.full_name if student else "—",
        "student_email": student.email if student else "—",
        "file_path": s.file_path,
        "file_type": s.file_type,
        "file_name": file_name,
        "file_url": f"/api/files/submissions/{s.id}",
        "student_notes": s.student_notes,
        "status": s.status,
        "ai_score": s.ai_score,
        "ai_feedback": s.ai_feedback,
        "ai_suggestions": s.ai_suggestions,
        "ai_confidence": s.ai_confidence,
        "ai_per_criterion": s.ai_per_criterion,
        "final_score": s.final_score,
        "teacher_feedback": s.teacher_feedback,
        "submitted_at": s.submitted_at,
        "ai_graded_at": s.ai_graded_at,
        "graded_at": s.graded_at,
    }


@router.post("/submissions/{submission_id}/finish")
def finish_review(
    submission_id: str,
    payload: FinishReviewRequest,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    s, a, g = _get_owned_submission(db, submission_id, teacher)
    if payload.final_score > a.max_score:
        raise HTTPException(
            400, f"final_score {payload.final_score} > max_score {a.max_score}"
        )
    s.final_score = float(payload.final_score)
    s.teacher_feedback = payload.teacher_feedback
    s.graded_by = teacher.id
    s.graded_at = datetime.utcnow()
    s.status = "graded"

    # Data Moat
    if s.ai_score is not None:
        delta = s.final_score - s.ai_score
        ds = GradingDataset(
            submission_id=s.id,
            ai_score=s.ai_score,
            final_score=s.final_score,
            teacher_changed=abs(delta) > 1e-6,
            delta=delta,
        )
        db.add(ds)

    db.commit()
    notifications_service.notify_review_finished(
        db,
        student_id=s.student_id,
        submission_id=s.id,
        assignment_title=a.title,
        final_score=s.final_score,
        max_score=a.max_score,
    )
    return {"status": "ok"}


@router.post("/submissions/{submission_id}/revision")
def request_revision(
    submission_id: str,
    payload: FinishReviewRequest,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    s, _, _ = _get_owned_submission(db, submission_id, teacher)
    s.status = "revision"
    s.teacher_feedback = payload.teacher_feedback
    s.graded_by = teacher.id
    db.commit()
    return {"status": "ok"}


@router.post("/submissions/{submission_id}/regrade")
def regrade_submission(
    submission_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    s, _, _ = _get_owned_submission(db, submission_id, teacher)
    if s.status == "grading":
        raise HTTPException(409, "Grading already in progress")
    s.status = "pending"
    s.ai_score = None
    s.ai_feedback = None
    s.ai_suggestions = None
    s.ai_confidence = None
    s.ai_per_criterion = None
    s.ai_raw_output = None
    s.ai_graded_at = None
    db.commit()
    background_tasks.add_task(run_grading, s.id)
    return {"status": "queued"}


# ----------------------------------------------------------------------------
# Notifications
# ----------------------------------------------------------------------------


@router.get("/notifications")
def list_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    q = db.query(Notification).filter(Notification.user_id == teacher.id)
    if unread_only:
        q = q.filter(Notification.is_read.is_(False))
    items = q.order_by(Notification.created_at.desc()).limit(100).all()
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
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    n = db.get(Notification, notification_id)
    if n is None or n.user_id != teacher.id:
        raise HTTPException(404, "Not found")
    n.is_read = True
    db.commit()
    return {"status": "ok"}


@router.post("/notifications/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    db.query(Notification).filter(
        Notification.user_id == teacher.id, Notification.is_read.is_(False)
    ).update({Notification.is_read: True})
    db.commit()
    return {"status": "ok"}


# ----------------------------------------------------------------------------
# Stats
# ----------------------------------------------------------------------------


@router.get("/stats")
def teacher_stats(
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    group_ids = _teacher_group_ids(db, teacher)
    if not group_ids:
        return {
            "groups_count": 0,
            "students_count": 0,
            "assignments_count": 0,
            "submissions_total": 0,
            "submissions_pending": 0,
            "submissions_ai_graded": 0,
            "submissions_graded": 0,
            "average_final_score": None,
            "average_ai_score": None,
            "by_group": [],
        }

    students_count = (
        db.query(func.count(func.distinct(Enrollment.student_id)))
        .filter(Enrollment.group_id.in_(group_ids))
        .scalar()
        or 0
    )
    assignments = db.query(Assignment).filter(Assignment.group_id.in_(group_ids)).all()
    assignment_ids = [a.id for a in assignments]
    subs = (
        db.query(Submission).filter(Submission.assignment_id.in_(assignment_ids)).all()
        if assignment_ids
        else []
    )

    by_status: dict[str, int] = {}
    for s in subs:
        by_status[s.status] = by_status.get(s.status, 0) + 1

    finals = [s.final_score for s in subs if s.final_score is not None]
    ais = [s.ai_score for s in subs if s.ai_score is not None]

    groups = db.query(Group).filter(Group.id.in_(group_ids)).all()
    by_group = []
    for g in groups:
        g_assignment_ids = [a.id for a in assignments if a.group_id == g.id]
        g_subs = [s for s in subs if s.assignment_id in g_assignment_ids]
        g_finals = [s.final_score for s in g_subs if s.final_score is not None]
        by_group.append(
            {
                "id": g.id,
                "name": g.name,
                "grade_scale": g.grade_scale,
                "students_count": db.query(func.count(Enrollment.id))
                .filter(Enrollment.group_id == g.id)
                .scalar()
                or 0,
                "submissions_count": len(g_subs),
                "graded_count": sum(1 for s in g_subs if s.status == "graded"),
                "average_score": (sum(g_finals) / len(g_finals)) if g_finals else None,
            }
        )

    return {
        "groups_count": len(group_ids),
        "students_count": students_count,
        "assignments_count": len(assignments),
        "submissions_total": len(subs),
        "submissions_pending": by_status.get("pending", 0) + by_status.get("grading", 0),
        "submissions_ai_graded": by_status.get("ai_graded", 0),
        "submissions_graded": by_status.get("graded", 0),
        "submissions_error": by_status.get("error", 0),
        "average_final_score": (sum(finals) / len(finals)) if finals else None,
        "average_ai_score": (sum(ais) / len(ais)) if ais else None,
        "by_group": by_group,
    }
