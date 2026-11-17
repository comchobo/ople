from fastapi import HTTPException
from sqlmodel import Session, select

from db import engine
from models.entities import Generation, Planner, now, uid
from services.providers import generate_plans


def owned(db: Session, model, item_id: str, user_id: str):
    item = db.get(model, item_id)
    if item is None or item.user_id != user_id:
        raise HTTPException(404, "항목을 찾을 수 없습니다.")
    return item


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
