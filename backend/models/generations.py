from datetime import datetime

from sqlmodel import Field, SQLModel

from models.columns import json_column
from utils.clock import now
from utils.ids import uid


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
