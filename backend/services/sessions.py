import hashlib
import secrets
from datetime import timedelta

from fastapi import HTTPException
from sqlmodel import Session

from models.auth import LoginSession
from models.users import User
from utils.clock import now


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def create_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(
        LoginSession(
            token_hash=digest(token), user_id=user.id, expires_at=now() + timedelta(days=30)
        )
    )
    db.commit()
    return token


def current_user(db: Session, token: str | None) -> User:
    login = db.get(LoginSession, digest(token or ""))
    if not login or login.expires_at <= now():
        raise HTTPException(401, "로그인이 필요합니다.")
    user = db.get(User, login.user_id)
    if not user:
        raise HTTPException(401, "로그인이 필요합니다.")
    return user


def delete_session(db: Session, token: str | None):
    login = db.get(LoginSession, digest(token or ""))
    if login:
        db.delete(login)
        db.commit()
