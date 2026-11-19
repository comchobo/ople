from fastapi import APIRouter

from models.generations import Generation
from routers.dependencies import DB, CurrentUser
from schemas.generations import Generate
from services.planner import generations

router = APIRouter(prefix="/generations")


def job_info(job: Generation):
    return {
        "id": job.id,
        "status": job.status,
        "planner_id": job.planner_id,
        "error": job.error,
        "created_at": job.created_at,
    }


@router.get("")
def list_generations(user: CurrentUser, db: DB):
    return [job_info(job) for job in generations.list_jobs(db, user.id)]


@router.post("/{job_id}")
def create_generation(job_id: str, body: Generate, user: CurrentUser, db: DB):
    return job_info(generations.create_job(db, user, job_id, body))


@router.post("/{job_id}/run")
def generate(job_id: str, user: CurrentUser):
    return job_info(generations.run_generation(job_id, user.id))
