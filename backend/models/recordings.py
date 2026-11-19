from datetime import datetime

from sqlmodel import Field, SQLModel

from utils.clock import now
from utils.ids import uid


class Recording(SQLModel, table=True):
    id: str = Field(default_factory=uid, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    interview_id: str = Field(index=True)
    question_index: int
    filename: str
    content_type: str
    created_at: datetime = Field(default_factory=now)
