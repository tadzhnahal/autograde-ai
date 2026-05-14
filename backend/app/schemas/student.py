from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class StudentCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=4, max_length=128)
    group_ids: list[str] = []


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    created_at: datetime


class StudentDetail(StudentResponse):
    groups: list[dict] = []
    submissions_count: int = 0
    graded_count: int = 0
    average_score: float | None = None
