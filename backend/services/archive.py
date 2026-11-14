import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException

from utils.settings import setting


def store_audio(
    submission_id: UUID,
    user_id: UUID,
    interview_id: UUID,
    position: int,
    audio: bytes,
    content_type: str,
) -> None:
    root = Path(setting("AUDIO_ARCHIVE_DIR", "/data/audio"))
    root.mkdir(parents=True, exist_ok=True)
    directory = root / str(submission_id)
    try:
        # mkdir is the exclusive claim, not an existence-check followed by a write.
        directory.mkdir()
    except FileExistsError as exc:
        raise HTTPException(409, "이미 사용된 제출 ID입니다.") from exc
    metadata = {
        "submission_id": str(submission_id),
        "user_id": str(user_id),
        "interview_id": str(interview_id),
        "question_position": position,
        "filename": "original",
        "content_type": content_type,
        "size": len(audio),
        "sha256": hashlib.sha256(audio).hexdigest(),
        "received_at": datetime.now(UTC).isoformat(),
    }
    # A crash leaves the claim occupied: subsequent requests fail, never overwrite originals.
    (directory / "original").write_bytes(audio)
    temporary = directory / "metadata.pending"
    temporary.write_text(json.dumps(metadata, ensure_ascii=False), encoding="utf-8")
    temporary.replace(directory / "metadata.json")
