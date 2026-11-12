from uuid import UUID

from fastapi import APIRouter
from sqlmodel import col, select

from models.entities import Piece, Planner, Rating
from schemas.product import PieceEdit, PlanEdit, RatingEdit, Rename
from services.auth import Database, Identity
from services.planners import owned_piece, owned_plan, owned_planner, serialize

router = APIRouter(prefix="/api", tags=["planners"])


@router.get("/planners")
def listing(user: Identity, db: Database):
    return db.exec(
        select(Planner).where(Planner.user_id == user.id).order_by(col(Planner.created_at).desc())
    ).all()


@router.get("/planners/{planner_id}")
def detail(planner_id: UUID, user: Identity, db: Database):
    return serialize(db, owned_planner(db, planner_id, user.id))


@router.patch("/planners/{planner_id}")
def rename(planner_id: UUID, body: Rename, user: Identity, db: Database):
    planner = owned_planner(db, planner_id, user.id)
    planner.name = body.name
    db.add(planner)
    db.commit()
    db.refresh(planner)
    return planner


@router.delete("/planners/{planner_id}", status_code=204)
def delete(planner_id: UUID, user: Identity, db: Database):
    db.delete(owned_planner(db, planner_id, user.id))
    db.commit()


@router.patch("/plans/{plan_id}")
def edit_plan(plan_id: UUID, body: PlanEdit, user: Identity, db: Database):
    plan = owned_plan(db, plan_id, user.id)
    plan.sqlmodel_update(body.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.post("/plans/{plan_id}/pieces", status_code=201)
def add_piece(plan_id: UUID, body: PieceEdit, user: Identity, db: Database):
    owned_plan(db, plan_id, user.id)
    piece = Piece(plan_id=plan_id, **body.model_dump())
    db.add(piece)
    db.commit()
    db.refresh(piece)
    return piece


@router.patch("/pieces/{piece_id}")
def edit_piece(piece_id: UUID, body: PieceEdit, user: Identity, db: Database):
    piece = owned_piece(db, piece_id, user.id)
    piece.sqlmodel_update(body.model_dump())
    db.add(piece)
    db.commit()
    db.refresh(piece)
    return piece


@router.post("/pieces/{piece_id}/duplicate", status_code=201)
def duplicate(piece_id: UUID, user: Identity, db: Database):
    source = owned_piece(db, piece_id, user.id)
    values = source.model_dump(exclude={"id"})
    values["title"] = source.title[:94] + " (복사본)"
    copy = Piece(**values)
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return copy


@router.delete("/pieces/{piece_id}", status_code=204)
def remove_piece(piece_id: UUID, user: Identity, db: Database):
    db.delete(owned_piece(db, piece_id, user.id))
    db.commit()


@router.put("/plans/{plan_id}/rating")
def rate(plan_id: UUID, body: RatingEdit, user: Identity, db: Database):
    owned_plan(db, plan_id, user.id)
    rating = db.get(Rating, plan_id) or Rating(
        plan_id=plan_id, resources=0, attraction=0, confidence=0, coherence=0
    )
    rating.resources, rating.attraction, rating.confidence, rating.coherence = body.scores
    db.add(rating)
    db.commit()
    return body


@router.delete("/plans/{plan_id}/rating", status_code=204)
def reset(plan_id: UUID, user: Identity, db: Database):
    owned_plan(db, plan_id, user.id)
    rating = db.get(Rating, plan_id)
    if rating:
        db.delete(rating)
        db.commit()
