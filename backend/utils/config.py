import os


def setting(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def required(name: str) -> str:
    value = setting(name)
    if not value:
        raise RuntimeError(f"{name} 설정이 필요합니다.")
    return value


def origin() -> str:
    return setting("APP_ORIGIN", "http://localhost:3000").rstrip("/")


def secure_cookie() -> bool:
    return setting("SESSION_COOKIE_SECURE", "false").lower() == "true"
