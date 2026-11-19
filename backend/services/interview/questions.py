from fastapi import HTTPException
from sqlmodel import Session

from models.users import User
from schemas.interviews import Interview, Question
from services.external.llm import llm_json
from services.interview.validation import validate_recordings


def next_question(db: Session, user: User, interview: Interview) -> Question:
    if len(interview.answers) >= 10:
        raise HTTPException(400, "인터뷰가 완료되었습니다.")
    validate_recordings(db, user, interview)
    return llm_json(
        Question,
        (
            f"총 10문항 중 {len(interview.answers) + 1}번째 질문 하나를 생성하세요. "
            "이전 질문과 모든 응답을 참고해 반복하지 말고 자연스럽게 심화하세요. "
            "10문항 전체에서 현재 유지/변화, 일·창작·관계·휴식, 현재 방향의 발전·대안·"
            "자유롭게 원하는 삶, 시간·비용·책임·제약을 탐색하세요. "
            "한 번에 답할 수 있는 질문이어야 합니다."
        ),
        interview.model_dump(),
    )
