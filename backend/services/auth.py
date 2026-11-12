import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlmodel import Session

from db import get_session
from models.entities import User, WebSession
from utils.settings import setting

Database = Annotated[Session, Depends(get_session)]


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def current_user(request: Request, db: Database) -> User:
    token = request.cookies.get("ople_session", "")
    session = db.get(WebSession, digest(token))
    if not session or session.expires_at <= datetime.now(UTC):
        raise HTTPException(401, "로그인이 필요합니다.")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, "계정을 확인할 수 없습니다.")
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        if request.headers.get("origin") != setting("APP_ORIGIN", "http://localhost:3000"):
            raise HTTPException(403, "요청 출처를 확인할 수 없습니다.")
        if not secrets.compare_digest(request.headers.get("x-csrf-token", ""), session.csrf_token):
            raise HTTPException(403, "보안 토큰을 새로 확인해주세요.")
    request.state.web_session = session
    return user


Identity = Annotated[User, Depends(current_user)]


def create_session(db: Session, user: User) -> tuple[str, WebSession]:
    token = secrets.token_urlsafe(48)
    session = WebSession(
        token_hash=digest(token),
        user_id=user.id,
        csrf_token=secrets.token_urlsafe(32),
        expires_at=datetime.now(UTC) + timedelta(days=30),
    )
    db.add(session)
    db.commit()
    return token, session
