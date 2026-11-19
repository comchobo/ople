from fastapi.testclient import TestClient

from main import app
from models.generations import Generation
from services.planner import generations


def test_startup_marks_only_running_jobs_as_failed(database, db, monkeypatch):
    monkeypatch.setattr(generations, "engine", database)
    jobs = [
        Generation(user_id="user", status=status, payload={})
        for status in ("pending", "running", "completed", "failed")
    ]
    db.add_all(jobs)
    db.commit()
    before = {job.id: job.updated_at for job in jobs}
    with TestClient(app) as client:
        assert client.get("/api/health").json() == {"status": "ok"}
    for job in jobs:
        previous_status = job.status
        db.refresh(job)
        if previous_status == "running":
            assert job.status == "failed"
            assert job.error == "서버 재시작으로 중단되었습니다. 다시 시도해주세요."
            assert job.updated_at > before[job.id]
        else:
            assert job.status == previous_status
            assert job.error is None
            assert job.updated_at == before[job.id]
