from utils.env import required


def origin() -> str:
    return required("APP_ORIGIN").rstrip("/")
