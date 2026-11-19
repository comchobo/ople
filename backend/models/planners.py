from datetime import datetime

from sqlmodel import Field, SQLModel

from models.columns import json_column
from utils.clock import now
from utils.ids import uid


class Planner(SQLModel, table=True):
    id: str = Field(default_factory=uid, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    name: str
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)
    plans: list[dict] = Field(sa_column=json_column())
