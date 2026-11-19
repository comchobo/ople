from pydantic import EmailStr, Field

from schemas.common import StrictModel


class Credentials(StrictModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class Verify(StrictModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")
