import json

import httpx
import pytest

from schemas.interviews import Question
from services.integrations import llm
from services.integrations.llm import LLMError


@pytest.fixture
def ollama(monkeypatch):
    monkeypatch.setenv("OLLAMA_API_KEY", "test-key")
    monkeypatch.setenv("OLLAMA_MODEL", "test-model")
    client = httpx.Client

    def connect(handler):
        monkeypatch.setattr(
            llm.httpx,
            "Client",
            lambda **kwargs: client(transport=httpx.MockTransport(handler), **kwargs),
        )

    return connect


def test_llm_repairs_invalid_json_and_schema_and_accepts_fenced_response(ollama):
    contents = iter(["invalid", '{"question":""}', '```json\n{"question":"원하는 삶은?"}\n```'])
    requests = []

    def handle(request):
        requests.append((request, json.loads(request.content)))
        return httpx.Response(200, json={"message": {"content": next(contents)}})

    ollama(handle)
    context = {"answers": [{"answer": "이전 답변"}]}
    value = llm.llm_json(Question, "질문 하나", context)
    assert value.question == "원하는 삶은?"
    assert len(requests) == 3
    for index, (request, payload) in enumerate(requests):
        assert str(request.url) == "https://ollama.com/api/chat"
        assert request.headers["Authorization"] == "Bearer test-key"
        assert payload["model"] == "test-model" and payload["think"] == "max"
        assert payload["stream"] is False
        assert len(payload["messages"]) == 2 + 2 * index
        assert json.loads(payload["messages"][1]["content"]) == context
    assert "질문 하나" in requests[0][1]["messages"][0]["content"]
    assert requests[1][1]["messages"][2] == {"role": "assistant", "content": "invalid"}
    assert requests[2][1]["messages"][4] == {"role": "assistant", "content": '{"question":""}'}


def test_llm_stops_after_two_repairs(ollama):
    requests = []

    def handle(request):
        requests.append(request)
        return httpx.Response(200, json={"message": {"content": "invalid"}})

    ollama(handle)
    with pytest.raises(LLMError, match="AI 응답 형식이 올바르지 않습니다"):
        llm.llm_json(Question, "질문", {})
    assert len(requests) == 3


@pytest.mark.parametrize("failure", ["http", "timeout", "missing-message", "invalid-json"])
def test_llm_translates_transport_and_response_errors_without_retrying(ollama, failure):
    requests = []

    def handle(request):
        requests.append(request)
        if failure == "timeout":
            raise httpx.ReadTimeout("timeout", request=request)
        if failure == "http":
            return httpx.Response(503)
        if failure == "missing-message":
            return httpx.Response(200, json={})
        return httpx.Response(200, content=b"invalid")

    ollama(handle)
    with pytest.raises(LLMError, match="AI 서비스에 연결할 수 없습니다"):
        llm.llm_json(Question, "질문", {})
    assert len(requests) == 1
