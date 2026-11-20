from fastapi import APIRouter, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute

from routers.dependencies import DB, CurrentUser, PlannerCopyKey
from schemas.planner_copies import (
    PlannerCopyError as PlannerCopyErrorResponse,
)
from schemas.planner_copies import (
    PlannerCopyErrorCode,
    PlannerCopyInputError,
    PlannerCopyRequest,
    PlannerCopyResponse,
)
from schemas.planners import PlannerUpdate
from services.planner import copies, planners

router = APIRouter(prefix="/planners")


@router.get("")
def list_planners(user: CurrentUser, db: DB):
    return planners.list_planners(db, user.id)


@router.put("/{planner_id}")
def update_planner(planner_id: str, body: PlannerUpdate, user: CurrentUser, db: DB):
    return planners.update_planner(db, user.id, planner_id, body)


@router.delete("/{planner_id}")
def delete_planner(planner_id: str, user: CurrentUser, db: DB):
    planners.delete_planner(db, user.id, planner_id)
    return {"ok": True}


_COPY_ERROR_STATUS = {
    PlannerCopyErrorCode.COPY_NAME_TOO_LONG: 422,
    PlannerCopyErrorCode.COPY_NAME_EXISTS: 409,
    PlannerCopyErrorCode.IDEMPOTENCY_KEY_CONFLICT: 409,
    PlannerCopyErrorCode.COPY_DELETED: 410,
    PlannerCopyErrorCode.COPY_FAILED: 500,
}


def _copy_error_response(error: copies.PlannerCopyError) -> JSONResponse:
    body = PlannerCopyErrorResponse(detail=error.detail, code=error.code)
    return JSONResponse(
        status_code=_COPY_ERROR_STATUS[error.code], content=body.model_dump(mode="json")
    )


class _PlannerCopyRoute(APIRoute):
    def get_route_handler(self):
        handler = super().get_route_handler()

        async def handle(request: Request) -> Response:
            try:
                return await handler(request)
            except RequestValidationError as error:
                errors = error.errors()
                if (
                    len(errors) == 1
                    and errors[0]["loc"] == ("body", "name")
                    and errors[0]["type"] == "string_too_long"
                ):
                    return _copy_error_response(
                        copies.PlannerCopyError(
                            PlannerCopyErrorCode.COPY_NAME_TOO_LONG, "길이가 초과됩니다."
                        )
                    )
                raise
            except copies.PlannerCopyError as error:
                return _copy_error_response(error)

        return handle


def duplicate_planner(
    planner_id: str,
    body: PlannerCopyRequest,
    key: PlannerCopyKey,
    user: CurrentUser,
    db: DB,
):
    return copies.duplicate_planner(db, user.id, planner_id, key, body)


router.add_api_route(
    "/{planner_id}/duplicate",
    duplicate_planner,
    methods=["POST"],
    status_code=201,
    response_model=PlannerCopyResponse,
    route_class_override=_PlannerCopyRoute,
    responses={
        401: {"description": "로그인이 필요합니다."},
        403: {"description": "허용되지 않은 요청 출처입니다."},
        404: {"description": "원본이 없거나 본인 소유가 아닙니다."},
        409: {"model": PlannerCopyErrorResponse, "description": "이름 또는 요청 키 충돌"},
        410: {"model": PlannerCopyErrorResponse, "description": "생성했던 사본이 삭제됨"},
        422: {
            "model": PlannerCopyErrorResponse | PlannerCopyInputError,
            "description": "이름 길이 초과 또는 요청 입력 오류",
        },
        500: {"model": PlannerCopyErrorResponse, "description": "복제 저장 실패"},
    },
)
