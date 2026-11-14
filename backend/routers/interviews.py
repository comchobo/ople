from datetime import datetime
from typing import Annotated
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import OperationalError
from sqlmodel import select
from starlette.concurrency import run_in_threadpool

from models.entities import Answer, Interview, Piece, Plan, Planner, User
from schemas.product import Generation
from services.archive import store_audio
from services.auth import Database, Identity
from services.interviews import answers, history, owned_interview, view
from services.planners import default_name, serialize
from services.providers import AI, get_ai
from utils.settings import integer

router = APIRouter(prefix="/api/interviews", tags=["interviews"])
Provider = Annotated[AI, Depends(get_ai)]


@router.post("", status_code=201)
def start(user: Identity, db: Database, ai: Provider):
    question = ai.question([])
    interview = Interview(user_id=user.id)
    db.add(interview)
    db.flush()
    db.add(Answer(interview_id=interview.id, position=0, question=question))
    db.commit()
    return view(db, interview)


@router.get("/{interview_id}")
def detail(interview_id: UUID, user: Identity, db: Database):
    return view(db, owned_interview(db, interview_id, user.id))


@router.delete("/{interview_id}", status_code=204)
def abandon(interview_id: UUID, user: Identity, db: Database):
    interview = owned_interview(db, interview_id, user.id)
    interview.status = "abandoned"
    db.add(interview)
    db.commit()


@router.post("/{interview_id}/answers/{position}/{submission_id}")
async def submit(
    interview_id: UUID,
    position: int,
    submission_id: UUID,
    request: Request,
    user: Identity,
    db: Database,
    ai: Provider,
):
    owned_interview(db, interview_id, user.id)
    size_limit = integer("AUDIO_MAX_BYTES", 20_000_000)
    audio = bytearray()
    async for chunk in request.stream():
        audio.extend(chunk)
        if len(audio) > size_limit:
            raise HTTPException(413, "음성 파일이 너무 큽니다.")
    if not audio:
        raise HTTPException(422, "녹음한 답변이 필요합니다.")
    content_type = request.headers.get("content-type", "application/octet-stream").split(";")[0]
    if content_type not in {
        "audio/wav",
        "audio/webm",
        "audio/ogg",
        "audio/mp4",
        "application/octet-stream",
    }:
        raise HTTPException(415, "지원하지 않는 녹음 형식입니다.")
    return await run_in_threadpool(
        process_answer,
        interview_id,
        position,
        submission_id,
        user.id,
        db,
        ai,
        bytes(audio),
        content_type,
    )


def process_answer(interview_id, position, submission_id, user_id, db, ai, audio, content_type):
    store_audio(submission_id, user_id, interview_id, position, audio, content_type)
    try:
        interview = owned_interview(db, interview_id, user_id, lock=True)
    except OperationalError as exc:
        db.rollback()
        raise HTTPException(409, "다른 답변을 처리 중입니다.") from exc
    rows = answers(db, interview_id)
    if position < 0 or position >= len(rows) or position >= 10 or interview.status != "active":
        raise HTTPException(409, "현재 질문에만 답변할 수 있습니다.")
    answer = rows[position]
    # If the previous request committed a transcript but failed while generating the next question,
    # preserve that successful stage; a new explicit submission finishes only the missing stage.
    if not answer.processed:
        if any(not row.processed for row in rows[:position]):
            raise HTTPException(409, "이전 답변을 먼저 완료해주세요.")
        answer.transcript = ai.transcribe(bytes(audio), content_type)
        answer.processed = True
        db.add(answer)
        db.flush()
    try:
        past = history(db, interview_id)
        if position == 9:
            interview.summary = ai.summarize(past)
            interview.status = "complete"
            db.add(interview)
        elif len(rows) == position + 1:
            db.add(
                Answer(interview_id=interview_id, position=position + 1, question=ai.question(past))
            )
        else:
            raise HTTPException(409, "이미 완료한 질문입니다.")
        db.commit()
    except HTTPException:
        db.commit()  # retain a successful STT result when only the next stage failed
        raise
    return view(db, interview)


@router.post("/{interview_id}/generate")
def generate(interview_id: UUID, user: Identity, db: Database, ai: Provider):
    try:
        interview = owned_interview(db, interview_id, user.id, lock=True)
    except OperationalError as exc:
        db.rollback()
        raise HTTPException(409, "생성 중입니다. 잠시 후 확인해주세요.") from exc
    existing = db.exec(select(Planner).where(Planner.interview_id == interview_id)).first()
    if existing:
        return serialize(db, existing)
    if interview.status != "complete" or len(history(db, interview_id)) != 10:
        raise HTTPException(409, "10개 답변 처리를 먼저 완료해주세요.")
    result = Generation.model_validate(ai.generate(history(db, interview_id)))
    # Serialize naming against all creations/renames for this account.
    db.exec(select(User).where(User.id == user.id).with_for_update()).one()
    planner = Planner(
        user_id=user.id,
        interview_id=interview_id,
        name=default_name(db, user.id),
        start_month=datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m"),
    )
    db.add(planner)
    db.flush()
    for generated in result.plans:
        plan = Plan(
            planner_id=planner.id,
            kind=generated.kind,
            title=generated.title,
            description=generated.description,
        )
        db.add(plan)
        db.flush()
        for piece in generated.pieces:
            db.add(Piece(plan_id=plan.id, **piece.model_dump()))
    interview.status = "generated"
    db.add(interview)
    db.commit()
    return serialize(db, planner)
