import json
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlmodel import Session, select

from models.entities import Answer, LoginAttempt, User, WebSession
from services.archive import store_audio
from services.auth import digest
from tests.test_product import completed_interview


def test_concurrent_archive_claim_allows_one_writer(product):
    _, _, _, archive, user_id = product
    submission = uuid4()

    def write(_):
        try:
            store_audio(submission, user_id, uuid4(), 0, b"original", "audio/wav")
            return 201
        except HTTPException as exc:
            return exc.status_code

    with ThreadPoolExecutor(max_workers=8) as workers:
        statuses = list(workers.map(write, range(8)))
    assert statuses.count(201) == 1
    assert statuses.count(409) == 7
    assert (archive / str(submission) / "original").read_bytes() == b"original"
    assert json.loads((archive / str(submission) / "metadata.json").read_text())["size"] == 8


def test_question_failure_retains_transcript_for_next_submission(product):
    client, engine, ai, archive, _ = product
    interview_id = client.post("/api/interviews").json()["id"]
    normal = ai.question
    calls = []

    def failed(history):
        raise HTTPException(502, "일시 실패")

    ai.question = failed
    ai.transcribe = lambda audio, content_type: calls.append(audio) or "그림 배우기"
    url = f"/api/interviews/{interview_id}/answers/0/"
    assert client.post(url + str(uuid4()), content=b"audio").status_code == 502
    detail = client.get(f"/api/interviews/{interview_id}").json()
    assert detail["position"] == 0
    assert detail["question"]
    with Session(engine) as db:
        row = db.exec(select(Answer)).one()
        assert row.processed and row.transcript == "그림 배우기"
    ai.question = normal
    response = client.post(url + str(uuid4()), content=b"audio")
    assert response.status_code == 200
    assert response.json()["position"] == 1
    assert len(calls) == 1


def test_deleted_successful_planner_cannot_be_regenerated(product):
    client, engine, ai, _, user_id = product
    interview_id = completed_interview(engine, user_id)
    generated = client.post(f"/api/interviews/{interview_id}/generate").json()
    assert client.delete(f"/api/planners/{generated['id']}").status_code == 204
    assert client.post(f"/api/interviews/{interview_id}/generate").status_code == 409


def test_stt_failure_keeps_archive_but_does_not_advance(product):
    client, engine, ai, archive, _ = product
    interview_id = client.post("/api/interviews").json()["id"]

    def fail(*args):
        raise HTTPException(502, "전사 실패")

    ai.transcribe = fail
    response = client.post(f"/api/interviews/{interview_id}/answers/0/{uuid4()}", content=b"audio")
    assert response.status_code == 502
    assert len(list(archive.glob("*/original"))) == 1
    assert client.get(f"/api/interviews/{interview_id}").json()["answered"] == 0


def test_expired_session_and_foreign_children_are_denied(product):
    client, engine, ai, _, user_id = product
    planner = client.post(f"/api/interviews/{completed_interview(engine, user_id)}/generate").json()
    with Session(engine) as db:
        session = db.get(WebSession, digest("session-token"))
        assert session is not None
        other = User(google_sub="attacker", name="다른", email="else@example.com")
        db.add(other)
        db.flush()
        session.user_id = other.id
        db.add(session)
        db.commit()
    plan = planner["plans"][0]
    assert client.patch(f"/plans/{plan['id']}", json={}).status_code == 404
    assert client.patch(f"/api/plans/{plan['id']}", json={"title": "침범"}).status_code == 404
    assert client.post(f"/api/pieces/{plan['pieces'][0]['id']}/duplicate").status_code == 404
    assert (
        client.put(f"/api/plans/{plan['id']}/rating", json={"scores": [5] * 4}).status_code == 404
    )
    with Session(engine) as db:
        session = db.get(WebSession, digest("session-token"))
        assert session is not None
        session.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        db.add(session)
        db.commit()
    assert client.get("/api/auth/me").status_code == 401


def test_oauth_browser_binding_single_use_and_session_rotation(product, monkeypatch):
    client, engine, _, _, user_id = product
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    from urllib.parse import parse_qs, urlparse

    from routers import auth

    monkeypatch.setattr(
        auth,
        "google_identity",
        lambda *args: {"sub": "owner", "name": "새 이름", "email": "owner@example.com"},
    )
    response = client.get("/api/auth/login", follow_redirects=False)
    params = parse_qs(urlparse(response.headers["location"]).query)
    assert params["code_challenge_method"] == ["S256"]
    state = params["state"][0]
    browser = client.cookies.get("ople_login")
    client.cookies.clear()
    client.cookies.set("ople_login", "incorrect")
    assert client.get(f"/api/auth/callback?state={state}&code=test").status_code == 400
    client.cookies.clear()
    client.cookies.set("ople_login", browser)
    client.cookies.set("ople_session", "session-token")
    response = client.get(f"/api/auth/callback?state={state}&code=test", follow_redirects=False)
    assert response.status_code == 303
    assert response.headers["location"] == "/tmp/preview/implementation"
    assert "HttpOnly" in response.headers["set-cookie"]
    assert client.get("/api/auth/me").json()["name"] == "새 이름"
    assert client.get(f"/api/auth/callback?state={state}&code=test").status_code == 400
    with Session(engine) as db:
        assert db.get(WebSession, digest("session-token")) is None
        assert db.exec(select(User)).one().id == user_id


@pytest.mark.parametrize("error", ["access_denied", ""])
def test_oauth_cancel_and_expiry(product, monkeypatch, error):
    client, engine, *_ = product
    state = "login-state"
    with Session(engine) as db:
        db.add(
            LoginAttempt(
                state_hash=digest(state),
                browser_hash=digest("browser"),
                verifier="verifier",
                nonce="nonce",
                expires_at=datetime.now(UTC) + timedelta(minutes=1),
            )
        )
        db.commit()
    client.cookies.set("ople_login", "browser")
    response = client.get(f"/api/auth/callback?state={state}&error={error}", follow_redirects=False)
    assert response.status_code == 303
    assert response.headers["location"].endswith("?error=cancelled")
