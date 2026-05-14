from sqlalchemy.orm import Session

from app.models.notification import Notification


def _create(
    db: Session,
    *,
    user_id: str,
    type_: str,
    title: str,
    body: str = "",
    link: str | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id, type=type_, title=title, body=body, link=link
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def notify_new_submission(
    db: Session,
    *,
    teacher_id: str,
    submission_id: str,
    student_name: str,
    assignment_title: str,
) -> None:
    _create(
        db,
        user_id=teacher_id,
        type_="new_submission",
        title=f"Новая сдача: {student_name}",
        body=f"Задание «{assignment_title}» ждёт проверки.",
        link=f"/teacher/submissions/{submission_id}",
    )


def notify_grading_done(
    db: Session,
    *,
    teacher_id: str,
    submission_id: str,
    student_name: str,
    assignment_title: str,
    ai_score: float | None,
) -> None:
    _create(
        db,
        user_id=teacher_id,
        type_="grading_done",
        title=f"AI оценил работу: {student_name}",
        body=(
            f"«{assignment_title}» — AI-балл "
            f"{ai_score:.1f}" if ai_score is not None else f"«{assignment_title}» — готов черновик"
        ),
        link=f"/teacher/submissions/{submission_id}",
    )


def notify_grading_error(
    db: Session,
    *,
    teacher_id: str,
    submission_id: str,
    student_name: str,
    error: str,
) -> None:
    _create(
        db,
        user_id=teacher_id,
        type_="grading_error",
        title=f"Ошибка AI-проверки: {student_name}",
        body=error[:300],
        link=f"/teacher/submissions/{submission_id}",
    )


def notify_review_finished(
    db: Session,
    *,
    student_id: str,
    submission_id: str,
    assignment_title: str,
    final_score: float,
    max_score: float,
) -> None:
    _create(
        db,
        user_id=student_id,
        type_="finished_review",
        title=f"Оценка готова: {assignment_title}",
        body=f"Финальная оценка: {final_score:g} / {max_score:g}.",
        link=f"/student/submissions/{submission_id}",
    )


def notify_new_message(
    db: Session,
    *,
    to_user_id: str,
    group_id: str,
    from_name: str,
    preview: str,
) -> None:
    _create(
        db,
        user_id=to_user_id,
        type_="new_message",
        title=f"Сообщение от {from_name}",
        body=preview[:200],
        link=f"/chat/{group_id}",
    )
