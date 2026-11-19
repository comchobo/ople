from fastapi import HTTPException
from sqlmodel import Session

from models.recordings import Recording
from models.users import User
from schemas.interviews import Interview
from services.ownership import owned


def validate_recordings(db: Session, user: User, interview: Interview):
    for index, answer in enumerate(interview.answers):
        recording = owned(db, Recording, answer.recording_id, user.id)
        if recording.interview_id != interview.interview_id or recording.question_index != index:
            raise HTTPException(400, "인터뷰 녹음 정보가 올바르지 않습니다.")
