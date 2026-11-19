from unittest.mock import Mock
from uuid import uuid4

import pytest
from sqlmodel import select

from models.generations import Generation
from models.planners import Planner
from models.recordings import Recording
from models.users import User
from schemas.planners import Plans
from services.auth import sessions
from services.planners import generations


@pytest.fixture
def completed_interview(db, signed_in):
    answers = []
    for index in range(10):
        item = Recording(
            user_id=signed_in.id,
            interview_id="interview",
            question_index=index,
            filename=f"{index}.webm",
            content_type="audio/webm",
        )
        db.add(item)
        db.flush()
        answers.append(
            {"question": f"질문 {index}", "answer": f"답변 {index}", "recording_id": item.id}
        )
    db.commit()
    return {"interview_id": "interview", "answers": answers, "summary": "나의 이야기"}


def test_generation_creation_run_retry_and_user_isolation(
    client, db, database, signed_in, completed_interview, monkeypatch, plans_data
):
    monkeypatch.setattr(generations, "engine", database)
    generator = Mock(side_effect=[RuntimeError("unavailable"), Plans.model_validate(plans_data)])
    monkeypatch.setattr(generations, "generate_plans", generator)
    job_id = str(uuid4())
    url = f"/api/generations/{job_id}"
    assert client.post("/api/generations/not-a-uuid", json=completed_interview).status_code == 400
    created = client.post(url, json=completed_interview)
    assert created.status_code == 200
    assert set(created.json()) == {"id", "status", "planner_id", "error", "created_at"}
    assert created.json()["status"] == "pending"
    assert client.post(url, json=completed_interview).json() == created.json()
    assert len(db.exec(select(Generation)).all()) == 1
    assert client.get("/api/generations").json() == [created.json()]
    failed = client.post(url + "/run").json()
    assert failed["status"] == "failed" and failed["error"]
    completed = client.post(url + "/run").json()
    assert completed["status"] == "completed" and completed["planner_id"]
    assert client.post(url + "/run").json() == completed
    assert generator.call_count == 2
    assert len(db.exec(select(Planner)).all()) == 1

    other = User(email="other@example.com", name="다른 사용자")
    db.add(other)
    db.commit()
    client.cookies.set("ople_session", sessions.create_session(db, other))
    assert client.get("/api/generations").json() == []
    assert client.post(url, json=completed_interview).status_code == 404
    assert client.post(url + "/run").status_code == 404
    assert generator.call_count == 2


def test_generation_rejects_mismatched_recording_without_creating_job(
    client, db, completed_interview
):
    completed_interview["answers"][0]["recording_id"] = completed_interview["answers"][1][
        "recording_id"
    ]
    response = client.post(f"/api/generations/{uuid4()}", json=completed_interview)
    assert response.status_code == 400
    assert response.json() == {"detail": "인터뷰 녹음 정보가 올바르지 않습니다."}
    assert db.exec(select(Generation)).all() == []
