from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Literal["teacher", "student"]


class RegisterTeacherRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4, max_length=128)
    full_name: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str


class TokenResponse(BaseModel):
    token: str
    user: UserResponse
