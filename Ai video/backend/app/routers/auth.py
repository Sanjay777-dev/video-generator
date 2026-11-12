from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
import hmac

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["authentication"])


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    is_admin: bool


class UserResponse(BaseModel):
    email: str
    is_admin: bool


def _response(user: User) -> AuthResponse:
    return AuthResponse(access_token=create_access_token(user), email=user.email, is_admin=user.is_admin)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(credentials: Credentials, db: Session = Depends(get_db)) -> AuthResponse:
    email = str(credentials.email).lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    is_admin_email = bool(settings.admin_email and email == settings.admin_email.lower())
    if is_admin_email and (
        not settings.admin_password or not hmac.compare_digest(credentials.password, settings.admin_password)
    ):
        raise HTTPException(status_code=403, detail="The configured administrator credentials do not match.")
    is_admin = is_admin_email
    user = User(
        email=email,
        hashed_password=hash_password(credentials.password),
        is_admin=is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _response(user)


@router.post("/login", response_model=AuthResponse)
def login(credentials: Credentials, db: Session = Depends(get_db)) -> AuthResponse:
    email = str(credentials.email).lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return _response(user)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(email=user.email, is_admin=user.is_admin)
