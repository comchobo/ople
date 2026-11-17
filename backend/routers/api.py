import base64
import hashlib
import secrets
from datetime import timedelta
from pathlib import Path
from typing import Annotated
from urllib.parse import urlencode
from uuid import UUID

import httpx
from authlib.jose import JsonWebToken
from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    Response,
    UploadFile,
)
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select

from db import session
from models.entities import (
    Generation,
    LoginSession,
    OAuthAttempt,
    Planner,
    Recording,
    User,
    now,
    uid,
)
from schemas.domain import Credentials, Generate, Interview, PlannerUpdate, Verify
from services import auth, providers
from services.planners import owned, run_generation
from utils.config import origin, required, secure_cookie

router = APIRouter(prefix="/api")
DB = Annotated[Session, Depends(session)]
RECORDINGS_DIR = Path("/recordings")


def user_dependency(db: DB, ople_session: Annotated[str | None, Cookie()] = None) -> User:
    return auth.current_user(db, ople_session)


CurrentUser = Annotated[User, Depends(user_dependency)]


def public_user(user: User):
    return {"id": user.id, "name": user.name, "email": user.email}


def login_cookie(response: Response, token: str):
    response.set_cookie(
        "ople_session",
        token,
        max_age=30 * 86400,
        httponly=True,
        secure=secure_cookie(),
        samesite="lax",
        path="/",
    )


@router.post("/auth/signup")
def signup(body: Credentials, db: DB):
    try:
        auth.start_signup(db, str(body.email), body.password)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "이미 처리 중인 가입 요청입니다.") from None
    return {"ok": True}


@router.post("/auth/verify")
def verify(body: Verify, db: DB, response: Response):
    user = auth.verify_signup(db, str(body.email), body.code)
    login_cookie(response, auth.create_session(db, user))
    return public_user(user)


@router.post("/auth/login")
def login(body: Credentials, db: DB, response: Response):
    user = db.exec(select(User).where(User.email == auth.normalize(str(body.email)))).first()
    if not user or not auth.check_password(user.password_hash, body.password):
        raise HTTPException(401, "이메일 또는 비밀번호가 올바르지 않습니다.")
    login_cookie(response, auth.create_session(db, user))
    return public_user(user)


@router.get("/auth/me")
def me(user: CurrentUser):
    return public_user(user)


@router.post("/auth/logout")
def logout(db: DB, response: Response, ople_session: Annotated[str | None, Cookie()] = None):
    login = db.get(LoginSession, auth.digest(ople_session or ""))
    if login:
        db.delete(login)
        db.commit()
    response.delete_cookie("ople_session", path="/")
    return {"ok": True}


@router.get("/auth/google")
def google_start(db: DB):
    state, nonce, verifier = (secrets.token_urlsafe(32) for _ in range(3))
    db.add(
        OAuthAttempt(
            state_hash=auth.digest(state),
            nonce=nonce,
            verifier=verifier,
            expires_at=now() + timedelta(minutes=10),
        )
    )
    db.commit()
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    )
    response = RedirectResponse(
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urlencode(
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
    )
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


@router.get("/auth/google/callback")
def google_callback(request: Request, db: DB):
    state = request.query_params.get("state", "")
    attempt = db.exec(
        select(OAuthAttempt).where(OAuthAttempt.state_hash == auth.digest(state)).with_for_update()
    ).first()
    if (
        not attempt
        or attempt.expires_at <= now()
        or not secrets.compare_digest(state, request.cookies.get("ople_oauth", ""))
    ):
        raise HTTPException(400, "로그인 요청이 만료되었습니다.")
    nonce, verifier = attempt.nonce, attempt.verifier
    db.delete(attempt)
    db.commit()
    try:
        with httpx.Client(timeout=20) as client:
            token = client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": required("GOOGLE_CLIENT_ID"),
                    "client_secret": required("GOOGLE_CLIENT_SECRET"),
                    "code": request.query_params.get("code", ""),
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
        user = auth.google_user(db, claims["sub"], claims["email"], claims.get("name", ""))
        response = RedirectResponse(origin())
        login_cookie(response, auth.create_session(db, user))
    except Exception:
        db.rollback()
        response = RedirectResponse(origin() + "/?auth_error=1")
    response.delete_cookie("ople_oauth", path="/")
    return response


@router.get("/planners")
def list_planners(user: CurrentUser, db: DB):
    return db.exec(
        select(Planner).where(Planner.user_id == user.id).order_by(col(Planner.created_at).desc())
    ).all()


@router.put("/planners/{planner_id}")
def update_planner(planner_id: str, body: PlannerUpdate, user: CurrentUser, db: DB):
    planner = owned(db, Planner, planner_id, user.id)
    planner.name, planner.plans = body.name, body.model_dump()["plans"]
    planner.updated_at = now()
    db.add(planner)
    db.commit()
    return planner


@router.delete("/planners/{planner_id}")
def delete_planner(planner_id: str, user: CurrentUser, db: DB):
    db.delete(owned(db, Planner, planner_id, user.id))
    db.commit()
    return {"ok": True}


def validate_recordings(db: Session, user: User, interview: Interview):
    for index, answer in enumerate(interview.answers):
        recording = owned(db, Recording, answer.recording_id, user.id)
        if recording.interview_id != interview.interview_id or recording.question_index != index:
            raise HTTPException(400, "인터뷰 녹음 정보가 올바르지 않습니다.")


@router.post("/interview/question")
def question(body: Interview, user: CurrentUser, db: DB):
    if len(body.answers) >= 10:
        raise HTTPException(400, "인터뷰가 완료되었습니다.")
    validate_recordings(db, user, body)
    return providers.next_question(body)


@router.post("/interview/summary")
def summary(body: Interview, user: CurrentUser, db: DB):
    if len(body.answers) != 10:
        raise HTTPException(400, "10개의 답변이 필요합니다.")
    validate_recordings(db, user, body)
    return providers.summarize(body)


@router.post("/interview/recording")
def recording(
    user: CurrentUser,
    db: DB,
    audio: Annotated[UploadFile, File()],
    interview_id: Annotated[str, Form(min_length=1, max_length=100)],
    question_index: Annotated[int, Form(ge=0, le=9)],
    duration: Annotated[float, Form(gt=0, le=180)],
):
    content_type = (audio.content_type or "").split(";")[0]
    extensions = {"audio/webm": "webm", "audio/mp4": "mp4", "audio/ogg": "ogg", "audio/wav": "wav"}
    if content_type not in extensions:
        raise HTTPException(415, "지원하지 않는 녹음 형식입니다.")
    data = audio.file.read(20 * 1024 * 1024 + 1)
    if not data or len(data) > 20 * 1024 * 1024:
        raise HTTPException(413, "녹음 파일은 20MB 이하여야 합니다.")
    directory = RECORDINGS_DIR
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    filename = f"{uid()}.{extensions[content_type]}"
    path = directory / filename
    with path.open("xb") as output:
        output.write(data)
    path.chmod(0o600)
    item = Recording(
        user_id=user.id,
        interview_id=interview_id,
        question_index=question_index,
        filename=filename,
        content_type=content_type,
    )
    db.add(item)
    db.commit()
    text = providers.transcribe(data, content_type)
    return {"recording_id": item.id, "text": text}


@router.get("/generations")
def list_generations(user: CurrentUser, db: DB):
    jobs = db.exec(
        select(Generation)
        .where(Generation.user_id == user.id)
        .order_by(col(Generation.created_at).desc())
    ).all()
    return [job_info(job) for job in jobs]


def job_info(job: Generation):
    return {
        "id": job.id,
        "status": job.status,
        "planner_id": job.planner_id,
        "error": job.error,
        "created_at": job.created_at,
    }


@router.post("/generations/{job_id}")
def create_generation(job_id: str, body: Generate, user: CurrentUser, db: DB):
    try:
        UUID(job_id)
    except ValueError:
        raise HTTPException(400, "올바르지 않은 작업 ID입니다.") from None
    job = db.get(Generation, job_id)
    if job:
        owned(db, Generation, job_id, user.id)
        return job_info(job)
    validate_recordings(db, user, body)
    job = Generation(id=job_id, user_id=user.id, payload=body.model_dump())
    db.add(job)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        job = owned(db, Generation, job_id, user.id)
    return job_info(job)


@router.post("/generations/{job_id}/run")
def generate(job_id: str, user: CurrentUser):
    return job_info(run_generation(job_id, user.id))
