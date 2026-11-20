from collections.abc import Collection
from copy import deepcopy

from pydantic import TypeAdapter, ValidationError

from models.planners import Planner
from schemas.planner_copies import PlannerCopyErrorCode, PlannerCopyRequest
from schemas.planners import Title
from utils.clock import now
from utils.ids import uid

COPY_SUFFIX = "(사본)"
_NAME = TypeAdapter(Title)


class PlannerCopyError(Exception):
    def __init__(self, code: PlannerCopyErrorCode, detail: str):
        super().__init__(detail)
        self.code = code
        self.detail = detail


def _validated_name(value: str) -> str:
    try:
        return _NAME.validate_python(value)
    except ValidationError as error:
        if any(item["type"] == "string_too_long" for item in error.errors()):
            raise PlannerCopyError(
                PlannerCopyErrorCode.COPY_NAME_TOO_LONG, "길이가 초과됩니다."
            ) from error
        raise


def choose_copy_name(
    source_name: str,
    existing_names: Collection[str],
    *,
    requested_name: str | None = None,
) -> str:
    """Resolve a name against this user's names; database locking belongs to the caller."""
    used = set(existing_names)
    if requested_name is not None:
        name = _validated_name(requested_name)
        if name in used:
            raise PlannerCopyError(PlannerCopyErrorCode.COPY_NAME_EXISTS, "이미 있는 이름입니다.")
        return name

    name = _validated_name(source_name + COPY_SUFFIX)
    while name in used:
        name = _validated_name(name + COPY_SUFFIX)
    return name


def build_planner_copy(
    source: Planner,
    request: PlannerCopyRequest,
    existing_names: Collection[str],
) -> Planner:
    """Build an unsaved copy of an ownership-checked source without changing it."""
    name = choose_copy_name(source.name, existing_names, requested_name=request.name)
    plans = deepcopy(source.plans)
    for plan in plans:
        for piece in plan["pieces"]:
            piece["id"] = uid()
    created_at = now()
    return Planner(
        user_id=source.user_id,
        name=name,
        plans=plans,
        created_at=created_at,
        updated_at=created_at,
    )
