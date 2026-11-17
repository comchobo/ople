import hashlib
import secrets
from datetime import timedelta

import boto3
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from fastapi import HTTPException
from sqlmodel import Session, select

from models.entities import LoginSession, Signup, User, now
from utils.config import required

hasher = PasswordHasher()


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def normalize(email: str) -> str:
    return email.strip().lower()


def check_password(encoded: str | None, password: str) -> bool:
    try:
        return encoded is not None and hasher.verify(encoded, password)
    except VerificationError:
        return False


def send_code(email: str, code: str):
    client = boto3.client("sesv2", region_name=required("AWS_REGION"))
    client.send_email(
        FromEmailAddress=required("SES_FROM_EMAIL"),
        Destination={"ToAddresses": [email]},
        Content={
            "Simple": {
                "Subject": {"Data": "Ople 가입 인증번호", "Charset": "UTF-8"},
                "Body": {
                    "Text": {"Data": f"인증번호: {code}\n10분 동안 유효합니다.", "Charset": "UTF-8"}
                },
            }
        },
    )


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


def google_user(db: Session, sub: str, email: str, name: str) -> User:
    user = db.exec(select(User).where(User.google_sub == sub)).first()
    if user:
        return user
    email = normalize(email)
    user = db.exec(select(User).where(User.email == email).with_for_update()).first()
    if user and user.google_sub and user.google_sub != sub:
        raise HTTPException(409, "이미 다른 Google 계정이 연결되어 있습니다.")
    if not user:
        user = User(email=email, name=name[:100] or email.split("@")[0])
    user.google_sub = sub
    db.add(user)
    db.commit()
    return user


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
