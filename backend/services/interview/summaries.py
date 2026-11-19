from fastapi import HTTPException
from sqlmodel import Session

from models.users import User
from schemas.interviews import Interview, Summary
from services.external.llm import llm_json
from services.interview.validation import validate_recordings


def summarize(db: Session, user: User, interview: Interview) -> Summary:
    if len(interview.answers) != 10:
        raise HTTPException(400, "10개의 답변이 필요합니다.")
    validate_recordings(db, user, interview)
    return llm_json(
        Summary,
        "응답에 근거한 핵심 가치·희망·현실 제약을 한국어로 요약하세요. 사실을 지어내지 마세요.",
        interview.model_dump(),
    )
