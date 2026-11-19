from sqlmodel import Field, SQLModel

from utils.ids import uid


class User(SQLModel, table=True):
    id: str = Field(default_factory=uid, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    password_hash: str | None = None
    google_sub: str | None = Field(default=None, unique=True)
