import os
from urllib.parse import urlsplit


def required(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} 설정이 필요합니다.")
    return value


def origin() -> str:
    return required("APP_ORIGIN").rstrip("/")


def secure_cookie() -> bool:
    return urlsplit(origin()).scheme == "https"
