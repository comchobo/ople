import secrets
from datetime import timedelta

from fastapi import HTTPException
from sqlmodel import Session, select

from models.auth import Signup
from models.users import User
from services.auth.passwords import check_password, hasher
from services.external.email import send_code
from utils.clock import now


def normalize(email: str) -> str:
    return email.strip().lower()


def login(db: Session, email: str, password: str) -> User:
    user = db.exec(select(User).where(User.email == normalize(email))).first()
    if not user or not check_password(user.password_hash, password):
        raise HTTPException(401, "이메일 또는 비밀번호가 올바르지 않습니다.")
    return user


def start_signup(db: Session, email: str, password: str):
    email = normalize(email)
    existing = db.exec(select(User).where(User.email == email)).first()
    if existing and existing.password_hash:
        raise HTTPException(409, "이미 가입된 이메일입니다.")
    pending = db.exec(select(Signup).where(Signup.email == email).with_for_update()).first()
    if pending and (now() - pending.sent_at).total_seconds() < 60:
        raise HTTPException(429, "60초 후 다시 요청해주세요.")
    code = f"{secrets.randbelow(1000000):06d}"
    encoded = hasher.hash(password)
    # Sending errors roll back the transaction; an unusable code is never persisted.
    send_code(email, code)
    if pending:
        pending.password_hash = encoded
        pending.code_hash = hasher.hash(code)
        pending.sent_at = now()
        pending.expires_at = now() + timedelta(minutes=10)
    else:
        pending = Signup(
            email=email,
            password_hash=encoded,
            code_hash=hasher.hash(code),
            sent_at=now(),
            expires_at=now() + timedelta(minutes=10),
        )
    db.add(pending)
    db.commit()


def verify_signup(db: Session, email: str, code: str) -> User:
    email = normalize(email)
    pending = db.exec(select(Signup).where(Signup.email == email).with_for_update()).first()
    if not pending or pending.expires_at <= now() or not check_password(pending.code_hash, code):
        raise HTTPException(400, "인증번호가 올바르지 않거나 만료되었습니다.")
    user = db.exec(select(User).where(User.email == email).with_for_update()).first()
    if user is None:
        user = User(email=email, name=email.split("@")[0])
    if user.password_hash:
        raise HTTPException(409, "이미 가입된 이메일입니다.")
    user.password_hash = pending.password_hash
    db.add(user)
    db.delete(pending)
    db.commit()
    return user
