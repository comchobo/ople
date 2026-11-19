from unittest.mock import Mock

from models.auth import LoginSession, Signup
from services.auth import service as auth
from services.auth import sessions


def test_signup_verify_login_and_logout_preserve_session_contract(client, db, monkeypatch):
    sender = Mock()
    monkeypatch.setattr(auth, "send_code", sender)
    credentials = {"email": "Hello@Example.com", "password": "password123"}
    assert client.post("/api/auth/signup", json=credentials).json() == {"ok": True}
    email, code = sender.call_args.args
    pending = db.get(Signup, email)
    assert pending and pending.code_hash != code

    invalid = client.post("/api/auth/verify", json={"email": email, "code": "abcdef"})
    assert invalid.status_code == 422
    verified = client.post("/api/auth/verify", json={"email": email, "code": code})
    assert verified.status_code == 200
    assert set(verified.json()) == {"id", "name", "email"}
    assert verified.json()["email"] == "hello@example.com"
    cookie = verified.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie and "Max-Age=2592000" in cookie
    assert client.get("/api/auth/me").json() == verified.json()

    token = client.cookies["ople_session"]
    assert db.get(LoginSession, sessions.digest(token)) is not None
    response = client.post("/api/auth/logout")
    assert response.json() == {"ok": True}
    assert "Max-Age=0" in response.headers["set-cookie"]
    assert db.get(LoginSession, sessions.digest(token)) is None
    assert client.get("/api/auth/me").status_code == 401
    assert client.post("/api/auth/logout").json() == {"ok": True}

    wrong = client.post("/api/auth/login", json={**credentials, "password": "wrong-password"})
    assert wrong.status_code == 401
    assert wrong.json() == {"detail": "이메일 또는 비밀번호가 올바르지 않습니다."}
    logged_in = client.post("/api/auth/login", json=credentials)
    assert logged_in.json() == verified.json()
    assert client.get("/api/auth/me").json() == verified.json()
