import os


def setting(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def integer(name: str, default: int) -> int:
    return int(setting(name, str(default)))
