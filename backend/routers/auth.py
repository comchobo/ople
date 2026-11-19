from typing import Annotated

from fastapi import APIRouter, Cookie, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError

from config import origin
from models.users import User
from routers.cookies import login_cookie, secure_cookie
from routers.dependencies import DB, CurrentUser
from schemas.auth import Credentials, Verify
from services import auth, google, sessions

router = APIRouter(prefix="/auth")


def public_user(user: User):
    return {"id": user.id, "name": user.name, "email": user.email}


@router.post("/signup")
def signup(body: Credentials, db: DB):
    try:
        auth.start_signup(db, str(body.email), body.password)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "이미 처리 중인 가입 요청입니다.") from None
    return {"ok": True}


@router.post("/verify")
def verify(body: Verify, db: DB, response: Response):
    user = auth.verify_signup(db, str(body.email), body.code)
    login_cookie(response, sessions.create_session(db, user))
    return public_user(user)


@router.post("/login")
def login(body: Credentials, db: DB, response: Response):
    user = auth.login(db, str(body.email), body.password)
    login_cookie(response, sessions.create_session(db, user))
    return public_user(user)


@router.get("/me")
def me(user: CurrentUser):
    return public_user(user)


@router.post("/logout")
def logout(db: DB, response: Response, ople_session: Annotated[str | None, Cookie()] = None):
    sessions.delete_session(db, ople_session)
    response.delete_cookie("ople_session", path="/")
    return {"ok": True}


@router.get("/google")
def google_start(db: DB):
    url, state = google.start(db)
    response = RedirectResponse(url)
    response.set_cookie(
        "ople_oauth",
        state,
        max_age=600,
        httponly=True,
        secure=secure_cookie(),
        samesite="lax",
        path="/",
    )
    return response


@router.get("/google/callback")
def google_callback(request: Request, db: DB):
    nonce, verifier = google.consume_attempt(
        db, request.query_params.get("state", ""), request.cookies.get("ople_oauth", "")
    )
    try:
        user = google.authenticate(db, request.query_params.get("code", ""), nonce, verifier)
        response = RedirectResponse(origin())
        login_cookie(response, sessions.create_session(db, user))
    except Exception:
        db.rollback()
        response = RedirectResponse(origin() + "/?auth_error=1")
    response.delete_cookie("ople_oauth", path="/")
    return response
