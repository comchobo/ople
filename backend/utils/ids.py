from uuid import uuid4


def uid() -> str:
    return str(uuid4())
