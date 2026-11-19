from fastapi import APIRouter

from routers.dependencies import DB, CurrentUser
from schemas.planners import PlannerUpdate
from services.planner import planners

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
