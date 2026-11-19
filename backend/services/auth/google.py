import base64
import hashlib
import secrets
from datetime import timedelta
from urllib.parse import urlencode

import httpx
from authlib.jose import JsonWebToken
from fastapi import HTTPException
from sqlmodel import Session, select

from config import origin
from models.auth import OAuthAttempt
from models.users import User
from services.auth.accounts import normalize
from services.auth.sessions import digest
from utils.clock import now
from utils.env import required


def start(db: Session) -> tuple[str, str]:
    state, nonce, verifier = (secrets.token_urlsafe(32) for _ in range(3))
    db.add(
        OAuthAttempt(
            state_hash=digest(state),
            nonce=nonce,
            verifier=verifier,
            expires_at=now() + timedelta(minutes=10),
        )
    )
    db.commit()
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    )
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(
        {
            "client_id": required("GOOGLE_CLIENT_ID"),
            "redirect_uri": origin() + "/api/auth/google/callback",
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "nonce": nonce,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }
    )
    return url, state


def consume_attempt(db: Session, state: str, cookie: str) -> tuple[str, str]:
    attempt = db.exec(
        select(OAuthAttempt).where(OAuthAttempt.state_hash == digest(state)).with_for_update()
    ).first()
    if not attempt or attempt.expires_at <= now() or not secrets.compare_digest(state, cookie):
        raise HTTPException(400, "로그인 요청이 만료되었습니다.")
    nonce, verifier = attempt.nonce, attempt.verifier
    db.delete(attempt)
    db.commit()
    return nonce, verifier


def identity(code: str, nonce: str, verifier: str):
    with httpx.Client(timeout=20) as client:
        token = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": required("GOOGLE_CLIENT_ID"),
                "client_secret": required("GOOGLE_CLIENT_SECRET"),
                "code": code,
                "code_verifier": verifier,
                "redirect_uri": origin() + "/api/auth/google/callback",
                "grant_type": "authorization_code",
            },
        )
        token.raise_for_status()
        keys = client.get("https://www.googleapis.com/oauth2/v3/certs")
        keys.raise_for_status()
    claims = JsonWebToken(["RS256"]).decode(
        token.json()["id_token"],
        keys.json(),
        claims_options={
            "iss": {"values": ["https://accounts.google.com", "accounts.google.com"]},
            "aud": {"value": required("GOOGLE_CLIENT_ID")},
            "exp": {"essential": True},
            "sub": {"essential": True},
        },
    )
    claims.validate()
    if claims.get("nonce") != nonce or claims.get("email_verified") is not True:
        raise ValueError("unverified identity")
    return claims


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


def authenticate(db: Session, code: str, nonce: str, verifier: str) -> User:
    claims = identity(code, nonce, verifier)
    return google_user(db, claims["sub"], claims["email"], claims.get("name", ""))
