from collections.abc import Collection
from copy import deepcopy
from uuid import UUID

from fastapi import HTTPException
from pydantic import TypeAdapter, ValidationError
from sqlalchemy import insert
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlmodel import Session, select

from models.planner_copies import PlannerCopyRecord
from models.planners import Planner, is_name_conflict
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
    """Resolve a name against this user's names; the database enforces uniqueness."""
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
        is_favorite=False,
        created_at=created_at,
        updated_at=created_at,
    )


def _replay_copy(
    db: Session,
    record: PlannerCopyRecord,
    source_id: str,
    request: PlannerCopyRequest,
) -> Planner:
    if record.source_planner_id != source_id or record.requested_name != request.name:
        raise PlannerCopyError(
            PlannerCopyErrorCode.IDEMPOTENCY_KEY_CONFLICT,
            "같은 요청 번호에 다른 요청 내용을 사용할 수 없습니다.",
        )
    copied = db.exec(
        select(Planner)
        .where(Planner.id == record.copy_planner_id, Planner.user_id == record.user_id)
        .execution_options(populate_existing=True)
    ).first()
    if copied is None:
        raise PlannerCopyError(PlannerCopyErrorCode.COPY_DELETED, "복제된 플래너가 삭제되었습니다.")
    return copied


def duplicate_planner(
    db: Session,
    user_id: str,
    source_id: str,
    request_key: UUID,
    request: PlannerCopyRequest,
) -> Planner:
    """Commit one copy and its request record together, or replay a completed request."""
    try:
        copy_id = uid()
        try:
            db.execute(
                insert(PlannerCopyRecord).values(
                    user_id=user_id,
                    request_key=request_key,
                    source_planner_id=source_id,
                    requested_name=request.name,
                    copy_planner_id=copy_id,
                )
            )
        except IntegrityError as error:
            db.rollback()
            record = db.get(PlannerCopyRecord, (user_id, request_key))
            if record is None:
                raise error
            copied = _replay_copy(db, record, source_id, request)
            db.commit()
            return copied

        source = db.exec(
            select(Planner)
            .where(Planner.id == source_id, Planner.user_id == user_id)
            .execution_options(populate_existing=True)
        ).first()
        if source is None:
            raise HTTPException(404, "항목을 찾을 수 없습니다.")
        names = db.exec(select(Planner.name).where(Planner.user_id == user_id)).all()
        copied = build_planner_copy(source, request, names)
        copied.id = copy_id
        db.add(copied)
        db.commit()
        return copied
    except IntegrityError as error:
        db.rollback()
        if is_name_conflict(error):
            raise PlannerCopyError(
                PlannerCopyErrorCode.COPY_NAME_EXISTS, "이미 있는 이름입니다."
            ) from error
        raise PlannerCopyError(
            PlannerCopyErrorCode.COPY_FAILED, "플래너를 복제하지 못했습니다."
        ) from error
    except SQLAlchemyError as error:
        db.rollback()
        raise PlannerCopyError(
            PlannerCopyErrorCode.COPY_FAILED,
            "플래너를 복제하지 못했습니다. 다시 시도해주세요.",
        ) from error
    except Exception:
        db.rollback()
        raise
