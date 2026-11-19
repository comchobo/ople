from argon2 import PasswordHasher
from argon2.exceptions import VerificationError

hasher = PasswordHasher()


def check_password(encoded: str | None, password: str) -> bool:
    try:
        return encoded is not None and hasher.verify(encoded, password)
    except VerificationError:
        return False
