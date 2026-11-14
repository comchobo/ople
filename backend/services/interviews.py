from uuid import UUID

from fastapi import HTTPException
from sqlmodel import Session, col, select

from models.entities import Answer, Interview


def owned_interview(db: Session, interview_id: UUID, user_id: UUID, lock=False) -> Interview:
    query = select(Interview).where(Interview.id == interview_id, Interview.user_id == user_id)
    if lock:
        query = query.with_for_update(nowait=True)
    interview = db.exec(query).first()
    if not interview or interview.status == "abandoned":
        raise HTTPException(404, "인터뷰를 찾을 수 없습니다.")
    return interview


def answers(db: Session, interview_id: UUID) -> list[Answer]:
    return list(
        db.exec(
            select(Answer).where(Answer.interview_id == interview_id).order_by(col(Answer.position))
        )
    )


def history(db: Session, interview_id: UUID) -> list[dict]:
    return [
        {"question": answer.question, "answer": answer.transcript}
        for answer in answers(db, interview_id)
        if answer.processed
    ]


def view(db: Session, interview: Interview) -> dict:
    rows = answers(db, interview.id)
    current = next((row for row in rows if not row.processed), None)
    if current is None and interview.status == "active" and rows:
        # STT succeeded but the next question/summary exhausted its internal retries.
        current = rows[-1]
    return {
        "id": interview.id,
        "status": interview.status,
        "summary": interview.summary,
        "position": current.position if current else len(rows),
        "question": current.question if current else "",
        "answered": sum(row.processed for row in rows),
    }
