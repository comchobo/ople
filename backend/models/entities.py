from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel


def now() -> datetime:
    return datetime.now(UTC)


class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    google_sub: str = Field(unique=True, index=True)
    name: str
    email: str


class WebSession(SQLModel, table=True):
    token_hash: str = Field(primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    csrf_token: str
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))


class LoginAttempt(SQLModel, table=True):
    state_hash: str = Field(primary_key=True)
    browser_hash: str
    verifier: str
    nonce: str
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))


class Interview(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    status: str = "active"
    summary: str = ""
    created_at: datetime = Field(
        default_factory=now, sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class Answer(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("interview_id", "position"),)
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    interview_id: UUID = Field(foreign_key="interview.id", ondelete="CASCADE", index=True)
    position: int
    question: str
    transcript: str = ""
    processed: bool = False


class Planner(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    interview_id: UUID | None = Field(default=None, foreign_key="interview.id", unique=True)
    name: str
    start_month: str
    created_at: datetime = Field(
        default_factory=now, sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class Plan(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("planner_id", "kind"),)
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    planner_id: UUID = Field(foreign_key="planner.id", ondelete="CASCADE", index=True)
    kind: str
    title: str
    description: str


class Piece(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    plan_id: UUID = Field(foreign_key="plan.id", ondelete="CASCADE", index=True)
    title: str
    description: str = ""
    category: str
    start_month: int
    duration: int


class Rating(SQLModel, table=True):
    plan_id: UUID = Field(foreign_key="plan.id", ondelete="CASCADE", primary_key=True)
    resources: int
    attraction: int
    confidence: int
    coherence: int
