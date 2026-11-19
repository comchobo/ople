from fastapi import HTTPException
from sqlmodel import Session


def owned(db: Session, model, item_id: str, user_id: str):
    item = db.get(model, item_id)
    if item is None or item.user_id != user_id:
        raise HTTPException(404, "항목을 찾을 수 없습니다.")
    return item
