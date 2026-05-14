from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterTeacherRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter()

DEMO_USERS = {
    "prof.demo@email.com": ("teacher", "Prof. Demo"),
    "student.demo@email.com": ("student", "Student Demo"),
}


def _make_token_response(user: User) -> TokenResponse:
    return TokenResponse(
        token=create_access_token(user.id, user.role),
        user=UserResponse.model_validate(user),
    )


@router.post("/register-teacher", response_model=TokenResponse)
def register_teacher(req: RegisterTeacherRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        role="teacher",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _make_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    # Demo-режим: автосоздание демо-пользователей на лету (если ещё нет)
    if settings.demo_login and req.email in DEMO_USERS and user is None:
        role, name = DEMO_USERS[req.email]
        if role != req.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Demo account {req.email} is a {role}, not a {req.role}",
            )
        user = User(
            email=req.email,
            password_hash=hash_password(req.password),
            full_name=name,
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return _make_token_response(user)

    if user is None or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if user.role != req.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is a {user.role}, not a {req.role}",
        )
    return _make_token_response(user)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.post("/logout")
def logout(user: User = Depends(get_current_user)):
    # JWT stateless — на сервере ничего не нужно делать. Фронт просто забывает токен.
    return {"status": "ok"}
