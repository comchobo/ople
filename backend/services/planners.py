from uuid import UUID

from fastapi import HTTPException
from sqlmodel import Session, col, select

from models.entities import Piece, Plan, Planner, Rating


def owned_planner(db: Session, planner_id: UUID, user_id: UUID) -> Planner:
    planner = db.get(Planner, planner_id)
    if not planner or planner.user_id != user_id:
        raise HTTPException(404, "플래너를 찾을 수 없습니다.")
    return planner


def owned_plan(db: Session, plan_id: UUID, user_id: UUID) -> Plan:
    plan = db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(404, "계획을 찾을 수 없습니다.")
    owned_planner(db, plan.planner_id, user_id)
    return plan


def owned_piece(db: Session, piece_id: UUID, user_id: UUID) -> Piece:
    piece = db.get(Piece, piece_id)
    if not piece:
        raise HTTPException(404, "활동을 찾을 수 없습니다.")
    owned_plan(db, piece.plan_id, user_id)
    return piece


def serialize(db: Session, planner: Planner) -> dict:
    db.refresh(planner)
    result = planner.model_dump()
    result["plans"] = []
    for plan in db.exec(select(Plan).where(Plan.planner_id == planner.id).order_by(Plan.kind)):
        rating = db.get(Rating, plan.id)
        result["plans"].append(
            {
                **plan.model_dump(),
                "pieces": [
                    p.model_dump()
                    for p in db.exec(
                        select(Piece)
                        .where(Piece.plan_id == plan.id)
                        .order_by(col(Piece.start_month), col(Piece.id))
                    )
                ],
                "scores": [rating.resources, rating.attraction, rating.confidence, rating.coherence]
                if rating
                else None,
            }
        )
    return result


def default_name(db: Session, user_id: UUID) -> str:
    names = set(db.exec(select(Planner.name).where(Planner.user_id == user_id)).all())
    if "나의 플래너" not in names:
        return "나의 플래너"
    index = 1
    while f"나의 플래너 ({index})" in names:
        index += 1
    return f"나의 플래너 ({index})"
