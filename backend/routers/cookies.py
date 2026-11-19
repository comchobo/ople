from urllib.parse import urlsplit

from fastapi import Response

from config import origin


def secure_cookie() -> bool:
    return urlsplit(origin()).scheme == "https"


def login_cookie(response: Response, token: str):
    response.set_cookie(
        "ople_session",
        token,
        max_age=30 * 86400,
        httponly=True,
        secure=secure_cookie(),
        samesite="lax",
        path="/",
    )
