from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select

from db import engine
from models.generations import Generation
from models.planners import Planner
from models.users import User
from schemas.generations import Generate
from schemas.planners import KINDS, Plans
from services.common import owned
from services.integrations.llm import llm_json
from services.interviews.service import validate_recordings
from utils.clock import now
from utils.ids import uid


def list_jobs(db: Session, user_id: str):
    return db.exec(
        select(Generation)
        .where(Generation.user_id == user_id)
        .order_by(col(Generation.created_at).desc())
    ).all()


def create_job(db: Session, user: User, job_id: str, body: Generate):
    try:
        UUID(job_id)
    except ValueError:
        raise HTTPException(400, "올바르지 않은 작업 ID입니다.") from None
    job = db.get(Generation, job_id)
    if job:
        return owned(db, Generation, job_id, user.id)
    validate_recordings(db, user, body)
    job = Generation(id=job_id, user_id=user.id, payload=body.model_dump())
    db.add(job)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        job = owned(db, Generation, job_id, user.id)
    return job


def recover_interrupted():
    # A terminated API request is retried explicitly; never silently re-run the LLM.
    with engine.begin() as connection:
        connection.execute(
            update(Generation)
            .where(col(Generation.status) == "running")
            .values(
                status="failed",
                error="서버 재시작으로 중단되었습니다. 다시 시도해주세요.",
                updated_at=now(),
            )
        )


def generate_plans(payload: dict) -> Plans:
    return llm_json(
        Plans,
        (
            f"서로 다른 5년 계획 3개를 생성하세요. kind는 순서대로 {KINDS}입니다. "
            "각 계획은 제목·설명·구체적 활동들을 포함하세요. 활동 id는 계획 안에서 고유한 문자열, "
            "start는 0~59, duration은 1~60이며 합은 60 이하의 정수입니다. "
            "category는 work/creative/relation/rest입니다. scores는 빈 객체입니다. "
            "사용자의 가치와 실제 제약을 반영하고 응답에 없는 사실을 확정하지 마세요."
        ),
        payload,
    )


def run_generation(job_id: str, user_id: str):
    with Session(engine, expire_on_commit=False) as db:
        job = db.exec(select(Generation).where(Generation.id == job_id).with_for_update()).first()
        if not job or job.user_id != user_id:
            raise HTTPException(404, "작업을 찾을 수 없습니다.")
        if job.status in ("running", "completed"):
            return job
        attempt = uid()
        job.status, job.attempt, job.error = "running", attempt, None
        job.updated_at = now()
        payload = job.payload
        db.add(job)
        db.commit()
    try:
        result = generate_plans(payload)
        for plan in result.plans:
            plan.scores = {}
        with Session(engine, expire_on_commit=False) as db:
            job = db.exec(select(Generation).where(Generation.id == job_id).with_for_update()).one()
            if job.attempt != attempt or job.status != "running":
                return job
            planner = Planner(user_id=user_id, name="새 플래너", plans=result.model_dump()["plans"])
            db.add(planner)
            db.flush()
            job.planner_id, job.status = planner.id, "completed"
            job.updated_at = now()
            db.add(job)
            db.commit()
            return job
    except Exception:
        with Session(engine, expire_on_commit=False) as db:
            job = db.exec(select(Generation).where(Generation.id == job_id).with_for_update()).one()
            if job.attempt == attempt and job.status == "running":
                job.status = "failed"
                job.error = "플랜 생성에 실패했습니다. 다시 시도해주세요."
                job.updated_at = now()
                db.add(job)
                db.commit()
            return job
