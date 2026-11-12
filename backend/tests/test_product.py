"""Product contracts exercised against PostgreSQL, without a browser or external AI."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine, select

from db import get_session
from main import app
from models.entities import Answer, Interview, Piece, Plan, Planner, User, WebSession
from services.auth import digest
from services.providers import get_ai


class FakeAI:
    def question(self, history):
        return f"{len(history) + 1}번째로 탐색하고 싶은 삶은 무엇인가요?"

    def transcribe(self, audio, content_type):
        return "개발 일을 이어가며 그림을 배우고 가족과 시간을 보내고 싶어요."

    def summarize(self, history):
        return "개발, 그림 배우기와 가족과의 시간을 원합니다."

    def generate(self, history):
        return {
            "plans": [
                {
                    "kind": kind,
                    "title": f"{kind} 계획",
                    "description": "답변을 바탕으로 작은 실험부터 시작합니다.",
                    "pieces": [
                        {
                            "title": "그림 배우기",
                            "description": "주말에 작게 시작",
                            "category": "창작",
                            "start_month": 1,
                            "duration": 3,
                        }
                    ],
                }
                for kind in "ABC"
            ]
        }


@pytest.fixture
def product(monkeypatch, tmp_path):
    from db import engine

    schema = f"test_{uuid4().hex}"
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA "{schema}"'))
    test_engine = create_engine(engine.url, connect_args={"options": f"-csearch_path={schema}"})
    SQLModel.metadata.create_all(test_engine)
    monkeypatch.setenv("AUDIO_ARCHIVE_DIR", str(tmp_path))
    monkeypatch.setenv("APP_ORIGIN", "http://testserver")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")

    def sessions():
        with Session(test_engine) as session:
            yield session

    app.dependency_overrides[get_session] = sessions
    ai = FakeAI()
    app.dependency_overrides[get_ai] = lambda: ai
    client = TestClient(app)
    with Session(test_engine) as session:
        user = User(google_sub="owner", name="주인", email="owner@example.com")
        session.add(user)
        session.flush()
        session.add(
            WebSession(
                token_hash=digest("session-token"),
                user_id=user.id,
                csrf_token="csrf",
                expires_at=datetime.now(UTC) + timedelta(days=1),
            )
        )
        session.commit()
        user_id = user.id
    client.cookies.set("ople_session", "session-token")
    client.headers.update({"Origin": "http://testserver", "X-CSRF-Token": "csrf"})
    yield client, test_engine, ai, tmp_path, user_id
    app.dependency_overrides.clear()
    test_engine.dispose()
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))


def completed_interview(engine, user_id):
    with Session(engine) as session:
        interview = Interview(user_id=user_id, summary="그림과 가족", status="complete")
        session.add(interview)
        session.flush()
        for index in range(10):
            session.add(
                Answer(
                    interview_id=interview.id,
                    position=index,
                    question=f"질문 {index + 1}",
                    transcript="개발과 그림, 가족",
                    processed=True,
                )
            )
        session.commit()
        return str(interview.id)


def test_auth_csrf_and_logout(product):
    client, *_ = product
    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["csrf_token"] == "csrf"
    assert client.post("/api/interviews", headers={"X-CSRF-Token": "wrong"}).status_code == 403
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/planners").status_code == 401


def test_adaptive_ten_answers_archive_duplicate_and_summary(product):
    client, engine, ai, archive, _ = product
    started = client.post("/api/interviews")
    assert started.status_code == 201
    interview_id = started.json()["id"]
    for index in range(10):
        submission_id = str(uuid4())
        url = f"/api/interviews/{interview_id}/answers/{index}/{submission_id}"
        response = client.post(url, content=b"RIFF audio", headers={"Content-Type": "audio/wav"})
        assert response.status_code == 200, response.text
        assert client.post(url, content=b"RIFF audio").status_code == 409
    result = client.get(f"/api/interviews/{interview_id}").json()
    assert result["status"] == "complete"
    assert "그림" in result["summary"]
    assert len(list(archive.glob("*/metadata.json"))) == 10
    assert client.delete(f"/api/interviews/{interview_id}").status_code == 204
    assert len(list(archive.glob("*/metadata.json"))) == 10


def test_generation_idempotency_ownership_crud_and_ratings(product):
    client, engine, ai, archive, user_id = product
    interview_id = completed_interview(engine, user_id)
    response = client.post(f"/api/interviews/{interview_id}/generate")
    assert response.status_code == 200, response.text
    planner = response.json()
    assert planner["name"] == "나의 플래너"
    assert [plan["kind"] for plan in planner["plans"]] == list("ABC")
    assert client.post(f"/api/interviews/{interview_id}/generate").json()["id"] == planner["id"]
    plan = planner["plans"][0]
    plan_url = f"/api/plans/{plan['id']}"
    assert client.patch(plan_url, json={"title": " ", "description": ""}).status_code == 422
    assert client.patch(plan_url, json={"title": "새 제목", "description": ""}).status_code == 200
    piece = plan["pieces"][0]
    piece_url = f"/api/pieces/{piece['id']}"
    invalid = {**piece, "start_month": 60, "duration": 2}
    assert client.patch(piece_url, json=invalid).status_code == 422
    copied = client.post(f"{piece_url}/duplicate").json()
    assert copied["id"] != piece["id"]
    assert "복사본" in copied["title"]
    rating_url = f"{plan_url}/rating"
    assert client.put(rating_url, json={"scores": [0, 5, 10, 3]}).status_code == 200
    assert client.put(rating_url, json={"scores": [0, 5, 10, 1.5]}).status_code == 422
    assert client.delete(rating_url).status_code == 204
    with Session(engine) as session:
        other = User(google_sub="other", name="다른", email="other@example.com")
        session.add(other)
        session.flush()
        foreign = Planner(user_id=other.id, name="비공개", start_month="2026-11")
        session.add(foreign)
        session.commit()
        foreign_id = foreign.id
    assert client.get(f"/api/planners/{foreign_id}").status_code == 404
    assert client.delete(f"/api/planners/{foreign_id}").status_code == 404
    assert client.delete(f"/api/planners/{planner['id']}").status_code == 204
    with Session(engine) as session:
        assert session.exec(select(Plan)).all() == []
        assert session.exec(select(Piece)).all() == []


def test_default_names_use_current_titles_and_lowest_gap(product):
    client, engine, ai, _, user_id = product
    planners = [
        client.post(f"/api/interviews/{completed_interview(engine, user_id)}/generate").json()
        for _ in range(3)
    ]
    assert [p["name"] for p in planners] == ["나의 플래너", "나의 플래너 (1)", "나의 플래너 (2)"]
    client.patch(f"/api/planners/{planners[1]['id']}", json={"name": "그림"})
    created = client.post(f"/api/interviews/{completed_interview(engine, user_id)}/generate").json()
    assert created["name"] == "나의 플래너 (1)"
