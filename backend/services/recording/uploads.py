from typing import BinaryIO

from fastapi import HTTPException
from sqlmodel import Session

from models.recordings import Recording
from services.external.transcription import transcribe
from services.recording.storage import save_audio


def record(
    db: Session,
    user_id: str,
    audio: BinaryIO,
    content_type: str | None,
    interview_id: str,
    question_index: int,
):
    content_type = (content_type or "").split(";")[0]
    extensions = {"audio/webm": "webm", "audio/mp4": "mp4", "audio/ogg": "ogg", "audio/wav": "wav"}
    if content_type not in extensions:
        raise HTTPException(415, "지원하지 않는 녹음 형식입니다.")
    data = audio.read(20 * 1024 * 1024 + 1)
    if not data or len(data) > 20 * 1024 * 1024:
        raise HTTPException(413, "녹음 파일은 20MB 이하여야 합니다.")
    filename = save_audio(data, extensions[content_type])
    item = Recording(
        user_id=user_id,
        interview_id=interview_id,
        question_index=question_index,
        filename=filename,
        content_type=content_type,
    )
    db.add(item)
    db.commit()
    text = transcribe(data, content_type)
    return {"recording_id": item.id, "text": text}
