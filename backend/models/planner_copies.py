from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel

from utils.clock import now


class PlannerCopyRecord(SQLModel, table=True):
    """Keep successful copy requests even after their source or copy is deleted."""

    user_id: str = Field(primary_key=True, foreign_key="user.id", ondelete="CASCADE")
    request_key: UUID = Field(primary_key=True)
    # No planner foreign keys: a retry must still identify a deleted source or copy.
    source_planner_id: str
    requested_name: str | None = Field(default=None, max_length=100)
    copy_planner_id: str
    created_at: datetime = Field(default_factory=now)
