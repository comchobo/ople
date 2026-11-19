from unittest.mock import Mock

import pytest
from sqlmodel import select

from models.recordings import Recording
from schemas.interviews import Question, Summary
from services.integrations.llm import LLMError
from services.integrations.transcription import TranscriptionError
from services.interviews import recording_files, recordings
from services.interviews import service as interviews


def test_question_and_summary_validate_answer_count_and_recording_ownership(
    client, db, signed_in, monkeypatch
):
    llm = Mock(side_effect=[Question(question="다음 질문"), Summary(summary="핵심 가치")])
    monkeypatch.setattr(interviews, "llm_json", llm)
    body = {"interview_id": "i", "answers": []}
    assert client.post("/api/interview/summary", json=body).status_code == 400
    item = Recording(
        user_id=signed_in.id,
        interview_id="i",
        question_index=0,
        filename="0.webm",
        content_type="audio/webm",
    )
    db.add(item)
    db.commit()
    body["answers"].append({"question": "질문", "answer": "답변", "recording_id": item.id})
    assert client.post("/api/interview/question", json=body).json() == {"question": "다음 질문"}
    assert llm.call_args.args[2] == body
    assert "2번째" in llm.call_args.args[1]
    item.user_id = "other"
    db.add(item)
    db.commit()
    assert client.post("/api/interview/question", json=body).status_code == 404
    item.user_id = signed_in.id
    item.interview_id = "wrong"
    db.add(item)
    db.commit()
    assert client.post("/api/interview/question", json=body).status_code == 400
    item.interview_id = "i"
    db.add(item)
    for index in range(1, 10):
        recording = Recording(
            user_id=signed_in.id,
            interview_id="i",
            question_index=index,
            filename=f"{index}.webm",
            content_type="audio/webm",
        )
        db.add(recording)
        db.flush()
        body["answers"].append({"question": "질문", "answer": "답변", "recording_id": recording.id})
    db.commit()
    assert client.post("/api/interview/question", json=body).status_code == 400
    assert client.post("/api/interview/summary", json=body).json() == {"summary": "핵심 가치"}
    assert llm.call_args.args[2] == body
    assert llm.call_count == 2


@pytest.mark.parametrize("audio", [b"", b"x" * (20 * 1024 * 1024 + 1)])
def test_invalid_audio_size_is_rejected_before_storage_or_transcription(
    client, db, signed_in, tmp_path, monkeypatch, audio
):
    monkeypatch.setattr(recording_files, "RECORDINGS_DIR", tmp_path)
    transcribe = Mock()
    monkeypatch.setattr(recordings, "transcribe", transcribe)
    response = client.post(
        "/api/interview/recording",
        files={"audio": ("voice.webm", audio, "audio/webm")},
        data={"interview_id": "i", "question_index": "0", "duration": "3"},
    )
    assert response.status_code == 413
    assert db.exec(select(Recording)).all() == []
    assert list(tmp_path.iterdir()) == []
    transcribe.assert_not_called()


def test_transcription_failure_keeps_private_audio_and_metadata(
    client, db, signed_in, tmp_path, monkeypatch
):
    monkeypatch.setattr(recording_files, "RECORDINGS_DIR", tmp_path)
    monkeypatch.setattr(recordings, "transcribe", Mock(side_effect=TranscriptionError("인식 실패")))
    response = client.post(
        "/api/interview/recording",
        files={"audio": ("voice.webm", b"audio", "audio/webm;codecs=opus")},
        data={"interview_id": "i", "question_index": "0", "duration": "3"},
    )
    assert response.status_code == 502 and response.json() == {"detail": "인식 실패"}
    item = db.exec(select(Recording)).one()
    path = tmp_path / item.filename
    assert item.user_id == signed_in.id and item.content_type == "audio/webm"
    assert path.read_bytes() == b"audio"
    assert path.stat().st_mode & 0o777 == 0o600


def test_question_provider_failure_returns_bad_gateway(client, signed_in, monkeypatch):
    monkeypatch.setattr(interviews, "llm_json", Mock(side_effect=LLMError("AI 연결 실패")))

    response = client.post("/api/interview/question", json={"interview_id": "i", "answers": []})

    assert response.status_code == 502
    assert response.json() == {"detail": "AI 연결 실패"}
