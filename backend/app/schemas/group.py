from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import GradeScale


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    description: str = ""
    grade_scale: GradeScale = "0-10"


class GroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)
    description: str | None = None
    grade_scale: GradeScale | None = None


class GroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    teacher_id: str
    grade_scale: str
    created_at: datetime


class GroupListItem(GroupResponse):
    students_count: int = 0
    assignments_count: int = 0
    pending_submissions: int = 0


class StudentInGroup(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    enrolled_at: datetime
    average_score: float | None = None
    submissions_count: int = 0
