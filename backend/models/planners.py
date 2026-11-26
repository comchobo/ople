from datetime import datetime

from sqlalchemy import UniqueConstraint
from sqlalchemy.exc import IntegrityError
from sqlmodel import Field, SQLModel

from models.columns import json_column
from utils.clock import now
from utils.ids import uid


class Planner(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_planner_user_name"),)

    id: str = Field(default_factory=uid, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    name: str
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)
    plans: list[dict] = Field(sa_column=json_column())
    is_favorite: bool = Field(
        default=False, nullable=False, sa_column_kwargs={"server_default": "false"}
    )


def is_name_conflict(error: IntegrityError) -> bool:
    diagnostic = getattr(error.orig, "diag", None)
    return (
        getattr(diagnostic, "constraint_name", None) == "uq_planner_user_name"
        or str(error.orig) == "UNIQUE constraint failed: planner.user_id, planner.name"
    )
