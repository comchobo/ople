from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import ConfigDict, Field, field_validator

from schemas.common import StrictModel
from schemas.planners import Plans, Title


class PlannerCopyRequest(StrictModel):
    """Omit name for automatic naming; an explicit null is not a valid name."""

    name: Title | None = None

    @field_validator("name", mode="before", json_schema_input_type=Title)
    @classmethod
    def reject_null_name(cls, value):
        if value is None:
            raise ValueError("이름은 생략하거나 문자열로 입력해주세요.")
        return value


class PlannerCopyResponse(Plans):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: Title
    created_at: datetime
    is_favorite: bool = Field(strict=True)


class PlannerCopyErrorCode(StrEnum):
    COPY_NAME_TOO_LONG = "COPY_NAME_TOO_LONG"
    COPY_NAME_EXISTS = "COPY_NAME_EXISTS"
    IDEMPOTENCY_KEY_CONFLICT = "IDEMPOTENCY_KEY_CONFLICT"
    COPY_DELETED = "COPY_DELETED"
    COPY_FAILED = "COPY_FAILED"


class PlannerCopyError(StrictModel):
    detail: str
    code: PlannerCopyErrorCode


class PlannerCopyInputError(StrictModel):
    """FastAPI validation errors retain their standard detail array."""

    detail: list[dict]
