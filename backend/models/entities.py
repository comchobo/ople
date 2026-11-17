from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import JSON, Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def now() -> datetime:
    return datetime.now(UTC)


def uid() -> str:
    return str(uuid4())


def json_column() -> Column:
    return Column(JSON().with_variant(JSONB(), "postgresql"), nullable=False)


class User(SQLModel, table=True):
    id: str = Field(default_factory=uid, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    password_hash: str | None = None
    google_sub: str | None = Field(default=None, unique=True)


class LoginSession(SQLModel, table=True):
    token_hash: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    expires_at: datetime


class Signup(SQLModel, table=True):
    email: str = Field(primary_key=True)
    password_hash: str
    code_hash: str
    sent_at: datetime
    expires_at: datetime


class OAuthAttempt(SQLModel, table=True):
    state_hash: str = Field(primary_key=True)
    nonce: str
    verifier: str
    expires_at: datetime


class Recording(SQLModel, table=True):
    id: str = Field(default_factory=uid, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    interview_id: str = Field(index=True)
    question_index: int
    filename: str
    content_type: str
    created_at: datetime = Field(default_factory=now)


class Planner(SQLModel, table=True):
    id: str = Field(default_factory=uid, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    name: str
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)
    plans: list[dict] = Field(sa_column=json_column())


class Generation(SQLModel, table=True):
    id: str = Field(default_factory=uid, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    status: str = "pending"
    payload: dict = Field(sa_column=json_column())
    planner_id: str | None = None
    error: str | None = None
    attempt: str | None = None
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)
