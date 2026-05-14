from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RubricItem(BaseModel):
    criterion: str = Field(min_length=1)
    max_points: float = Field(gt=0)
    description: str = ""


class AssignmentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    due_date: datetime | None = None
    reference_solution: str = ""
    rubric: list[RubricItem] = []


class AssignmentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    due_date: datetime | None = None
    reference_solution: str | None = None
    rubric: list[RubricItem] | None = None


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    title: str
    description: str
    due_date: datetime | None
    reference_solution: str
    rubric: list[dict]
    max_score: float
    created_at: datetime


class AssignmentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    group_name: str
    title: str
    description: str
    due_date: datetime | None
    max_score: float
    created_at: datetime
    submissions_count: int = 0
    pending_count: int = 0
    graded_count: int = 0
