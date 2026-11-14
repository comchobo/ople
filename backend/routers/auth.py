import base64
import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import httpx2 as httpx
from authlib.jose import JsonWebToken
from authlib.oidc.core import CodeIDToken
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.dialects.postgresql import insert

from models.entities import LoginAttempt, User, WebSession
from services.auth import Database, Identity, create_session, digest
from utils.settings import setting
from utils.temp_preview import PREVIEW_PATH

router = APIRouter(prefix="/api/auth", tags=["auth"])


def secure() -> bool:
    return setting("SESSION_COOKIE_SECURE", "true").lower() == "true"


@router.get("/login")
def login(db: Database):
    client_id = setting("GOOGLE_CLIENT_ID")
    if not client_id or not setting("GOOGLE_CLIENT_SECRET"):
        raise HTTPException(503, "Google 로그인 설정이 필요합니다.")
    state, verifier, nonce, browser = (secrets.token_urlsafe(32) for _ in range(4))
    db.add(
        LoginAttempt(
            state_hash=digest(state),
            browser_hash=digest(browser),
            verifier=verifier,
            nonce=nonce,
            expires_at=datetime.now(UTC) + timedelta(minutes=10),
        )
    )
    db.commit()
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=")
    response = RedirectResponse(
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urlencode(
            {
                "client_id": client_id,
                "redirect_uri": setting("APP_ORIGIN", "http://localhost:3000")
                + "/api/auth/callback",
                "response_type": "code",
                "scope": "openid email profile",
                "state": state,
                "nonce": nonce,
                "code_challenge": challenge.decode(),
                "code_challenge_method": "S256",
            }
        )
    )
    response.set_cookie(
        "ople_login", browser, max_age=600, httponly=True, secure=secure(), samesite="lax"
    )
    return response


def google_identity(code: str, verifier: str, nonce: str) -> dict:
    client_id = setting("GOOGLE_CLIENT_ID")
    with httpx.Client(timeout=20) as client:
        response = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": setting("GOOGLE_CLIENT_SECRET"),
                "redirect_uri": setting("APP_ORIGIN", "http://localhost:3000")
                + "/api/auth/callback",
                "grant_type": "authorization_code",
                "code_verifier": verifier,
            },
        )
        response.raise_for_status()
        token = response.json()
        jwks = client.get("https://www.googleapis.com/oauth2/v3/certs")
        jwks.raise_for_status()
    claims = JsonWebToken(["RS256"]).decode(
        token["id_token"],
        jwks.json(),
        claims_cls=CodeIDToken,
        claims_options={
            "iss": {
                "essential": True,
                "values": ["https://accounts.google.com", "accounts.google.com"],
            },
            "aud": {"essential": True, "value": client_id},
            "exp": {"essential": True},
            "sub": {"essential": True},
        },
        claims_params={
            "nonce": nonce,
            "client_id": client_id,
            "access_token": token.get("access_token"),
        },
    )
    claims.validate(leeway=30)
    return dict(claims)


@router.get("/callback")
def callback(request: Request, db: Database, state: str = "", code: str = "", error: str = ""):
    attempt = db.get(LoginAttempt, digest(state), with_for_update=True)
    browser = request.cookies.get("ople_login", "")
    valid = (
        attempt is not None
        and attempt.expires_at > datetime.now(UTC)
        and secrets.compare_digest(attempt.browser_hash, digest(browser))
    )
    if not valid or attempt is None:
        raise HTTPException(400, "로그인 요청이 만료되었거나 유효하지 않습니다.")
    verifier, nonce = attempt.verifier, attempt.nonce
    db.delete(attempt)
    db.commit()  # one-use state, even when Google rejects the exchange
    destination = PREVIEW_PATH
    if error or not code:
        response = RedirectResponse(destination + "?error=cancelled", status_code=303)
    else:
        try:
            claims = google_identity(code, verifier, nonce)
            statement = insert(User).values(
                google_sub=claims["sub"], name=claims.get("name", ""), email=claims.get("email", "")
            )
            statement = statement.on_conflict_do_update(
                index_elements=["google_sub"],
                set_={"name": statement.excluded.name, "email": statement.excluded.email},
            ).returning(User)
            user = db.exec(statement).scalars().one()
            old = db.get(WebSession, digest(request.cookies.get("ople_session", "")))
            if old:
                db.delete(old)
            token, _ = create_session(db, user)
            response = RedirectResponse(destination, status_code=303)
            response.set_cookie(
                "ople_session",
                token,
                max_age=30 * 86400,
                httponly=True,
                secure=secure(),
                samesite="lax",
            )
        except Exception:
            db.rollback()
            response = RedirectResponse(destination + "?error=failed", status_code=303)
    response.delete_cookie("ople_login", secure=secure(), httponly=True, samesite="lax")
    response.headers["Cache-Control"] = "no-store"
    return response


@router.get("/me")
def me(request: Request, user: Identity):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "csrf_token": request.state.web_session.csrf_token,
    }


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, user: Identity, db: Database):
    db.delete(request.state.web_session)
    db.commit()
    response.delete_cookie("ople_session", secure=secure(), httponly=True, samesite="lax")
