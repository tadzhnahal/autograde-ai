from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SubmissionListItem(BaseModel):
    """Строка в таблице сабмишенов у учителя."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    assignment_id: str
    assignment_title: str
    group_id: str
    group_name: str
    student_id: str
    student_name: str
    student_email: str
    file_type: str
    status: str
    ai_score: float | None
    final_score: float | None
    submitted_at: datetime
    ai_graded_at: datetime | None
    graded_at: datetime | None


class SubmissionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    assignment_id: str
    assignment_title: str
    assignment_description: str
    assignment_rubric: list[dict]
    assignment_max_score: float
    group_id: str
    group_name: str
    group_grade_scale: str
    student_id: str
    student_name: str
    student_email: str

    file_path: str
    file_type: str
    file_name: str
    file_url: str
    student_notes: str

    status: str
    ai_score: float | None
    ai_feedback: str | None
    ai_suggestions: list[str] | None
    ai_confidence: float | None
    ai_per_criterion: list[dict] | None

    final_score: float | None
    teacher_feedback: str | None

    submitted_at: datetime
    ai_graded_at: datetime | None
    graded_at: datetime | None


class FinishReviewRequest(BaseModel):
    final_score: float = Field(ge=0)
    teacher_feedback: str = ""


class StudentSubmissionView(BaseModel):
    """Что видит ученик про свой сабмишен."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    file_name: str
    submitted_at: datetime
    final_score: float | None
    teacher_feedback: str | None
    ai_score: float | None  # показывается только после finish — но даём поле всегда, в роутере фильтруем
