from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

from routers.dependencies import DB, CurrentUser
from schemas.interviews import Interview
from services import interviews, recordings

router = APIRouter(prefix="/interview")


@router.post("/question")
def question(body: Interview, user: CurrentUser, db: DB):
    return interviews.next_question(db, user, body)


@router.post("/summary")
def summary(body: Interview, user: CurrentUser, db: DB):
    return interviews.summarize(db, user, body)


@router.post("/recording")
def recording(
    user: CurrentUser,
    db: DB,
    audio: Annotated[UploadFile, File()],
    interview_id: Annotated[str, Form(min_length=1, max_length=100)],
    question_index: Annotated[int, Form(ge=0, le=9)],
    duration: Annotated[float, Form(gt=0, le=180)],
):
    return recordings.record(
        db, user.id, audio.file, audio.content_type, interview_id, question_index
    )
