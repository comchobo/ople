from unittest.mock import Mock

import pytest

from schemas.domain import Interview, Question
from services import providers


def client_with(monkeypatch, contents):
    client = Mock()
    client.__enter__ = Mock(return_value=client)
    client.__exit__ = Mock(return_value=False)
    client.post.side_effect = [
        Mock(json=Mock(return_value={"message": {"content": value}})) for value in contents
    ]
    monkeypatch.setattr(providers.httpx, "Client", Mock(return_value=client))
    monkeypatch.setenv("OLLAMA_API_KEY", "test-key")
    monkeypatch.setenv("OLLAMA_MODEL", "test-model")
    return client


def test_llm_repair_up_to_twice_and_max_reasoning(monkeypatch):
    client = client_with(monkeypatch, ["invalid", '{"question":""}', '{"question":"원하는 삶은?"}'])
    value = providers.llm_json(Question, "질문 하나", {})
    assert value.question == "원하는 삶은?"
    assert client.post.call_count == 3
    assert client.post.call_args.kwargs["json"]["think"] == "max"
    assert client.post.call_args.kwargs["json"]["model"] == "test-model"


def test_llm_fails_after_two_repairs(monkeypatch):
    client = client_with(monkeypatch, ["invalid"] * 3)
    with pytest.raises(providers.ProviderError):
        providers.llm_json(Question, "질문", {})
    assert client.post.call_count == 3


def test_question_includes_all_previous_answers(monkeypatch):
    llm = Mock(return_value=Question(question="다음 질문"))
    monkeypatch.setattr(providers, "llm_json", llm)
    body = Interview(
        interview_id="i",
        answers=[
            {
                "question": "첫 질문",
                "answer": "첫 응답",
                "recording_id": "r",
            }
        ],
    )
    providers.next_question(body)
    assert llm.call_args.args[2]["answers"][0]["answer"] == "첫 응답"
    assert "2번째" in llm.call_args.args[1]


def test_stt_posts_real_audio_and_rejects_empty_result(monkeypatch):
    monkeypatch.setenv("CLOUDFLARE_STT_MODEL", "@cf/openai/whisper-large-v3-turbo")
    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", "account")
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "token")
    client = client_with(monkeypatch, [])
    client.post.side_effect = None
    client.post.return_value.json.return_value = {"success": True, "result": {"text": "응답"}}
    assert providers.transcribe(b"audio", "audio/mp4") == "응답"
    assert "audio" in client.post.call_args.kwargs["json"]
    client.post.return_value.json.return_value = {"success": True, "result": {"text": ""}}
    with pytest.raises(providers.ProviderError):
        providers.transcribe(b"audio", "audio/mp4")
