import time

import httpx2 as httpx
import pytest
from authlib.jose import JsonWebKey, JsonWebToken
from joserfc.errors import ExpiredTokenError, InvalidClaimError

from routers.auth import google_identity


@pytest.mark.parametrize("invalid", [None, "iss", "aud", "nonce", "exp"])
def test_signed_id_token_checks_issuer_audience_nonce_and_expiry(monkeypatch, invalid):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "client")
    key = JsonWebKey.generate_key("RSA", 2048, options={"kid": "test"}, is_private=True)
    claims = {
        "iss": "https://accounts.google.com",
        "aud": "client",
        "sub": "google-user",
        "iat": int(time.time()),
        "exp": int(time.time()) + 300,
        "nonce": "expected-nonce",
    }
    if invalid:
        claims[invalid] = int(time.time()) - 100 if invalid == "exp" else "wrong"
    token = JsonWebToken(["RS256"]).encode({"alg": "RS256", "kid": "test"}, claims, key).decode()

    class Google:
        def __init__(self, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def post(self, url, **kwargs):
            assert kwargs["data"]["code_verifier"] == "verifier"
            return httpx.Response(200, json={"id_token": token}, request=httpx.Request("POST", url))

        def get(self, url):
            return httpx.Response(
                200,
                json={"keys": [key.as_dict(is_private=False)]},
                request=httpx.Request("GET", url),
            )

    monkeypatch.setattr("routers.auth.httpx.Client", Google)
    if invalid:
        with pytest.raises((InvalidClaimError, ExpiredTokenError)):
            google_identity("code", "verifier", "expected-nonce")
    else:
        assert google_identity("code", "verifier", "expected-nonce")["sub"] == "google-user"
