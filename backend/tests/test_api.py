from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from db import session
from main import app
from models.entities import Planner, Recording
from services import auth


@pytest.fixture
def client(db):
    app.dependency_overrides[session] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()


def authenticated(client, db):
    user = auth.google_user(db, "google", "hello@example.com", "이름")
    client.cookies.set("ople_session", auth.create_session(db, user))
    return user


def test_auth_and_csrf_boundary(client):
    assert client.get("/api/planners").status_code == 401
    assert (
        client.post(
            "/api/auth/login",
            headers={"Origin": "https://other.test"},
            json={"email": "x@example.com", "password": "password"},
        ).status_code
        == 403
    )


def test_planner_save_delete_and_user_isolation(client, db, plans_data):
    user = authenticated(client, db)
    planner = Planner(user_id=user.id, name="계획", plans=plans_data["plans"])
    db.add(planner)
    db.commit()
    result = client.put(f"/api/planners/{planner.id}", json={"name": "수정", **plans_data})
    assert result.status_code == 200 and result.json()["name"] == "수정"
    assert len(client.get("/api/planners").json()) == 1
    other = auth.google_user(db, "other", "other@example.com", "다른 사용자")
    client.cookies.set("ople_session", auth.create_session(db, other))
    assert (
        client.put(f"/api/planners/{planner.id}", json={"name": "침입", **plans_data}).status_code
        == 404
    )
    assert client.delete(f"/api/planners/{planner.id}").status_code == 404
    client.cookies.set("ople_session", auth.create_session(db, user))
    assert client.delete(f"/api/planners/{planner.id}").status_code == 200


def test_audio_is_retained_and_only_metadata_returned(client, db, monkeypatch, tmp_path):
    from routers import api

    user = authenticated(client, db)
    monkeypatch.setattr(api, "RECORDINGS_DIR", tmp_path)
    monkeypatch.setattr(api.providers, "transcribe", Mock(return_value="응답입니다"))
    response = client.post(
        "/api/interview/recording",
        files={"audio": ("voice.webm", b"audio", "audio/webm")},
        data={"interview_id": "i", "question_index": "0", "duration": "3"},
    )
    assert response.status_code == 200
    recording = db.get(Recording, response.json()["recording_id"])
    assert recording.user_id == user.id
    assert (tmp_path / recording.filename).read_bytes() == b"audio"
    assert "filename" not in response.json()
    assert (
        client.post(
            "/api/interview/recording",
            files={"audio": ("x", b"audio", "text/html")},
            data={"interview_id": "i", "question_index": "0", "duration": "3"},
        ).status_code
        == 415
    )
    assert (
        client.post(
            "/api/interview/recording",
            files={"audio": ("x", b"audio", "audio/webm")},
            data={"interview_id": "i", "question_index": "0", "duration": "181"},
        ).status_code
        == 422
    )
