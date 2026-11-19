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
