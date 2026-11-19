from datetime import timedelta
from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from sqlmodel import select

from models.auth import LoginSession, Signup
from models.users import User
from services.auth import accounts as auth
from services.auth import google, sessions
from utils.clock import now


def test_signup_verifies_code_and_hashes_password(db, monkeypatch):
    sender = Mock()
    monkeypatch.setattr(auth, "send_code", sender)
    auth.start_signup(db, "Hello@Example.com", "password123")
    email, code = sender.call_args.args
    assert email == "hello@example.com" and len(code) == 6
    assert not db.exec(select(User)).all()
    pending = db.get(Signup, email)
    assert pending.code_hash != code
    for _ in range(7):
        with pytest.raises(HTTPException):
            auth.verify_signup(db, email, "not-a-code")
    user = auth.verify_signup(db, email, code)
    assert auth.check_password(user.password_hash, "password123")
    assert not auth.check_password(user.password_hash, "wrong")
    assert db.get(Signup, email) is None
    with pytest.raises(HTTPException):
        auth.verify_signup(db, email, code)


def test_code_expiration_and_resend_cooldown(db, monkeypatch):
    sender = Mock()
    monkeypatch.setattr(auth, "send_code", sender)
    auth.start_signup(db, "hello@example.com", "password123")
    with pytest.raises(HTTPException) as limited:
        auth.start_signup(db, "hello@example.com", "password123")
    assert limited.value.status_code == 429
    pending = db.get(Signup, "hello@example.com")
    pending.sent_at = now() - timedelta(minutes=11)
    pending.expires_at = now() - timedelta(minutes=1)
    db.add(pending)
    db.commit()
    with pytest.raises(HTTPException):
        auth.verify_signup(db, pending.email, sender.call_args.args[1])
    auth.start_signup(db, pending.email, "new-password")
    assert sender.call_count == 2


def test_google_and_verified_email_merge_in_both_orders(db, monkeypatch):
    sender = Mock()
    monkeypatch.setattr(auth, "send_code", sender)
    auth.start_signup(db, "hello@example.com", "password123")
    first = auth.verify_signup(db, "hello@example.com", sender.call_args.args[1])
    linked = google.google_user(db, "google-1", "HELLO@example.com", "이름")
    assert first.id == linked.id
    other = google.google_user(db, "google-2", "other@example.com", "다른 이름")
    auth.start_signup(db, "other@example.com", "password456")
    verified = auth.verify_signup(db, "other@example.com", sender.call_args.args[1])
    assert other.id == verified.id
    assert len(db.exec(select(User)).all()) == 2


def test_unverified_signup_does_not_set_google_password(db, monkeypatch):
    monkeypatch.setattr(auth, "send_code", Mock())
    auth.start_signup(db, "hello@example.com", "attacker-password")
    user = google.google_user(db, "google", "hello@example.com", "소유자")
    assert user.password_hash is None


def test_session_expiry_and_logout(db):
    user = google.google_user(db, "g", "hello@example.com", "이름")
    token = sessions.create_session(db, user)
    assert sessions.current_user(db, token).id == user.id
    login = db.get(LoginSession, sessions.digest(token))
    assert token != login.token_hash
    login.expires_at = now() - timedelta(seconds=1)
    db.add(login)
    db.commit()
    with pytest.raises(HTTPException) as expired:
        sessions.current_user(db, token)
    assert expired.value.status_code == 401


def test_mail_failure_does_not_create_pending_signup(db, monkeypatch):
    monkeypatch.setattr(auth, "send_code", Mock(side_effect=RuntimeError("unavailable")))
    with pytest.raises(RuntimeError):
        auth.start_signup(db, "hello@example.com", "password123")
    assert db.get(Signup, "hello@example.com") is None
