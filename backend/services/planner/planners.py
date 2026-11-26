from fastapi import HTTPException
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlmodel import Session, col, select

from models.planners import Planner
from schemas.planners import PlannerUpdate
from services.ownership import owned
from utils.clock import now


def list_planners(db: Session, user_id: str):
    return db.exec(
        select(Planner).where(Planner.user_id == user_id).order_by(col(Planner.created_at).desc())
    ).all()


def update_planner(db: Session, user_id: str, planner_id: str, body: PlannerUpdate):
    planner = owned(db, Planner, planner_id, user_id)
    planner.name, planner.plans = body.name, body.model_dump()["plans"]
    planner.updated_at = now()
    db.add(planner)
    db.commit()
    return planner


def delete_planner(db: Session, user_id: str, planner_id: str):
    db.delete(owned(db, Planner, planner_id, user_id))
    db.commit()


def set_favorite(db: Session, user_id: str, planner_id: str, is_favorite: bool):
    planner = owned(db, Planner, planner_id, user_id)
    planner.is_favorite = is_favorite
    try:
        db.commit()
    except DBAPIError as exc:
        sqlstate = getattr(exc.orig, "sqlstate", None)
        if not isinstance(exc, IntegrityError) and sqlstate not in {"40001", "40P01"}:
            raise
        db.rollback()
        raise HTTPException(500, "favorite_not_saved") from exc
    return {"is_favorite": planner.is_favorite}
