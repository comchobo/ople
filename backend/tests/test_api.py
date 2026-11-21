from unittest.mock import Mock

from models.planners import Planner
from models.recordings import Recording
from services.auth import google, sessions


def authenticated(client, db):
    user = google.google_user(db, "google", "hello@example.com", "이름")
    client.cookies.set("ople_session", sessions.create_session(db, user))
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
    other = google.google_user(db, "other", "other@example.com", "다른 사용자")
    client.cookies.set("ople_session", sessions.create_session(db, other))
    assert (
        client.put(f"/api/planners/{planner.id}", json={"name": "침입", **plans_data}).status_code
        == 404
    )
    assert client.delete(f"/api/planners/{planner.id}").status_code == 404
    client.cookies.set("ople_session", sessions.create_session(db, user))
    assert client.delete(f"/api/planners/{planner.id}").status_code == 200


def test_audio_is_retained_and_only_metadata_returned(client, db, monkeypatch, tmp_path):
    from services.recording import storage as recording_files
    from services.recording import uploads as recordings

    user = authenticated(client, db)
    monkeypatch.setattr(recording_files, "RECORDINGS_DIR", tmp_path)
    monkeypatch.setattr(recordings, "transcribe", Mock(return_value="응답입니다"))
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


def test_favorite_is_owned_idempotent_and_independent_of_content(client, db, plans_data):
    user = authenticated(client, db)
    planner = Planner(user_id=user.id, name="원래 이름", plans=plans_data["plans"])
    db.add(planner)
    db.commit()
    path = f"/api/planners/{planner.id}"
    favorite = path + "/favorite"
    assert client.get("/api/planners").json()[0]["is_favorite"] is False
    for _ in range(2):
        assert client.put(favorite, json={"is_favorite": True}).json() == {"is_favorite": True}
    original = client.get("/api/planners").json()[0]
    assert (original["name"], original["plans"]) == ("원래 이름", plans_data["plans"])
    assert client.put(path, json={"name": "새 이름", **plans_data}).status_code == 200
    assert client.get("/api/planners").json()[0]["is_favorite"] is True
    other = google.google_user(db, "other", "other@example.com", "다른 사용자")
    client.cookies.set("ople_session", sessions.create_session(db, other))
    assert client.put(favorite, json={"is_favorite": False}).status_code == 404
    client.cookies.clear()
    assert client.put(favorite, json={"is_favorite": False}).status_code == 401
    client.cookies.set("ople_session", sessions.create_session(db, user))
    assert client.get("/api/planners").json()[0]["is_favorite"] is True
    assert client.put(favorite, json={"is_favorite": False}).status_code == 200
    db.expire_all()
    saved = client.get("/api/planners").json()[0]
    assert (saved["name"], saved["is_favorite"], saved["plans"]) == (
        "새 이름",
        False,
        plans_data["plans"],
    )
