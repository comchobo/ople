from unittest.mock import Mock

import pytest
from fastapi import HTTPException

from models.recordings import Recording
from models.users import User
from schemas.interviews import Answer, Interview
from services.interview import questions, summaries


@pytest.mark.parametrize(
    "module,action,count", [(questions, "next_question", 1), (summaries, "summarize", 10)]
)
@pytest.mark.parametrize(
    "field,value,status",
    [("user_id", "other", 404), ("interview_id", "other", 400), ("question_index", 9, 400)],
)
def test_interview_operations_reject_mismatched_recordings_before_calling_llm(
    db, monkeypatch, module, action, count, field, value, status
):
    user = User(email="interview@example.com", name="인터뷰")
    db.add(user)
    db.commit()
    answers = []
    recordings = []
    for index in range(count):
        recording = Recording(
            user_id=user.id,
            interview_id="interview",
            question_index=index,
            filename=f"{index}.webm",
            content_type="audio/webm",
        )
        db.add(recording)
        db.flush()
        recordings.append(recording)
        answers.append(Answer(question="질문", answer="답변", recording_id=recording.id))
    setattr(recordings[0], field, value)
    db.add(recordings[0])
    db.commit()
    llm = Mock()
    monkeypatch.setattr(module, "llm_json", llm)

    with pytest.raises(HTTPException) as error:
        getattr(module, action)(db, user, Interview(interview_id="interview", answers=answers))

    assert error.value.status_code == status
    llm.assert_not_called()
