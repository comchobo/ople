import base64
import hashlib
import time
from datetime import timedelta
from urllib.parse import parse_qs, urlencode, urlsplit

import httpx
import pytest
from authlib.jose import JsonWebKey, JsonWebToken
from sqlmodel import select

from models.auth import LoginSession, OAuthAttempt
from models.users import User
from services import google, sessions
from utils.clock import now


@pytest.fixture
def google_http(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "google-client")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "google-secret")
    monkeypatch.setenv("APP_ORIGIN", "http://testserver")
    key = JsonWebKey.generate_key("RSA", 2048, {"kid": "test"}, is_private=True)
    requests = []
    response_claims = {}

    def handle(request):
        requests.append(request)
        if request.url.path == "/token":
            claims = {
                "iss": "https://accounts.google.com",
                "aud": "google-client",
                "sub": "google-user",
                "exp": int(time.time()) + 300,
                "email": "hello@example.com",
                "name": "이름",
                "email_verified": True,
                **response_claims,
            }
            token = JsonWebToken(["RS256"]).encode({"alg": "RS256", "kid": "test"}, claims, key)
            return httpx.Response(200, json={"id_token": token.decode()})
        assert str(request.url) == "https://www.googleapis.com/oauth2/v3/certs"
        return httpx.Response(200, json={"keys": [key.as_dict(is_private=False)]})

    http_client = httpx.Client
    monkeypatch.setattr(
        google.httpx,
        "Client",
        lambda **kwargs: http_client(transport=httpx.MockTransport(handle), **kwargs),
    )
    return response_claims, requests


def start_login(client, db, google_http):
    claims, requests = google_http
    response = client.get("/api/auth/google", follow_redirects=False)
    assert response.status_code == 307
    query = parse_qs(urlsplit(response.headers["location"]).query)
    state = query["state"][0]
    claims["nonce"] = query["nonce"][0]
    attempt = db.get(OAuthAttempt, sessions.digest(state))
    expected_challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(attempt.verifier.encode()).digest())
        .rstrip(b"=")
        .decode()
    )
    assert query["code_challenge"] == [expected_challenge]
    assert query["code_challenge_method"] == ["S256"]
    assert query["redirect_uri"] == ["http://testserver/api/auth/google/callback"]
    assert client.cookies["ople_oauth"] == state
    assert "HttpOnly" in response.headers["set-cookie"]
    return state, attempt.verifier, requests


def test_oauth_exchanges_code_validates_signed_identity_and_consumes_attempt(
    client, db, google_http
):
    state, verifier, requests = start_login(client, db, google_http)
    response = client.get(
        "/api/auth/google/callback?" + urlencode({"state": state, "code": "authorization-code"}),
        follow_redirects=False,
    )
    assert response.status_code == 307 and response.headers["location"] == "http://testserver"
    assert [str(request.url) for request in requests] == [
        "https://oauth2.googleapis.com/token",
        "https://www.googleapis.com/oauth2/v3/certs",
    ]
    assert parse_qs(requests[0].content.decode()) == {
        "client_id": ["google-client"],
        "client_secret": ["google-secret"],
        "code": ["authorization-code"],
        "code_verifier": [verifier],
        "redirect_uri": ["http://testserver/api/auth/google/callback"],
        "grant_type": ["authorization_code"],
    }
    assert db.get(OAuthAttempt, sessions.digest(state)) is None
    assert "ople_oauth" not in client.cookies
    assert client.get("/api/auth/me").json()["email"] == "hello@example.com"
    assert (
        client.get(f"/api/auth/google/callback?state={state}", follow_redirects=False).status_code
        == 400
    )
    assert len(requests) == 2


@pytest.mark.parametrize(
    "invalid_claims",
    [
        {"nonce": "wrong"},
        {"email_verified": False},
        {"aud": "another-client"},
        {"iss": "https://other.test"},
        {"exp": 1},
    ],
)
def test_oauth_rejects_invalid_identity_without_creating_user(
    client, db, google_http, invalid_claims
):
    state, _, _ = start_login(client, db, google_http)
    google_http[0].update(invalid_claims)
    response = client.get(f"/api/auth/google/callback?state={state}&code=x", follow_redirects=False)
    assert response.headers["location"] == "http://testserver/?auth_error=1"
    assert db.get(OAuthAttempt, sessions.digest(state)) is None
    assert "ople_oauth" not in client.cookies and "ople_session" not in client.cookies
    assert db.exec(select(User)).all() == []
    assert db.exec(select(LoginSession)).all() == []


@pytest.mark.parametrize("failure", ["cookie", "expired"])
def test_oauth_rejects_invalid_attempt_before_external_requests(client, db, google_http, failure):
    state, _, requests = start_login(client, db, google_http)
    if failure == "cookie":
        client.cookies.clear()
    else:
        attempt = db.get(OAuthAttempt, sessions.digest(state))
        attempt.expires_at = now() - timedelta(seconds=1)
        db.add(attempt)
        db.commit()
    response = client.get(f"/api/auth/google/callback?state={state}&code=x", follow_redirects=False)
    assert response.status_code == 400
    assert response.json() == {"detail": "로그인 요청이 만료되었습니다."}
    assert requests == []
