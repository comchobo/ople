import json

import httpx2 as httpx
import pytest
from fastapi import HTTPException

from services.providers import AI


def client_factory(monkeypatch, responses):
    class Client:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            status, payload = responses.pop(0)
            return httpx.Response(status, json=payload, request=httpx.Request("POST", url))

    monkeypatch.setattr("services.providers.httpx.AsyncClient", Client)
    monkeypatch.setattr("services.providers.time.sleep", lambda _: None)
    monkeypatch.setenv("OLLAMA_API_KEY", "not-a-real-key")
    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", "account")
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "not-a-real-key")


def test_invalid_json_and_temporary_error_retry_in_same_call(monkeypatch):
    responses = [
        (429, {}),
        (200, {"message": {"content": "not JSON"}}),
        (200, {"message": {"content": json.dumps({"text": "다음 질문은?"})}}),
    ]
    client_factory(monkeypatch, responses)
    assert AI().question([]) == "다음 질문은?"
    assert responses == []


def test_permanent_auth_error_does_not_retry(monkeypatch):
    responses = [(401, {}), (200, {})]
    client_factory(monkeypatch, responses)
    with pytest.raises(HTTPException) as exc:
        AI().transcribe(b"audio", "audio/wav")
    assert exc.value.status_code == 502
    assert len(responses) == 1


def test_stt_empty_response_and_exhaustion(monkeypatch):
    responses = [(200, {"result": {"text": ""}})] * 3
    client_factory(monkeypatch, responses)
    with pytest.raises(HTTPException) as exc:
        AI().transcribe(b"audio", "audio/wav")
    assert "한도" in exc.value.detail
    assert not responses


def test_deadline_prevents_calls(monkeypatch):
    responses = [(200, {})]
    client_factory(monkeypatch, responses)
    monkeypatch.setenv("AI_TOTAL_TIMEOUT_SECONDS", "0")
    with pytest.raises(HTTPException):
        AI().question([])
    assert len(responses) == 1


def test_blank_model_question_is_retried(monkeypatch):
    responses = [
        (200, {"message": {"content": '{"text":"  "}'}}),
        (200, {"message": {"content": '{"text":"무엇을 바라나요?"}'}}),
    ]
    client_factory(monkeypatch, responses)
    assert AI().question([]) == "무엇을 바라나요?"


def test_malformed_code_fence_is_retried(monkeypatch):
    responses = [
        (200, {"message": {"content": "```malformed"}}),
        (200, {"message": {"content": '{"text":"다음 질문은?"}'}}),
    ]
    client_factory(monkeypatch, responses)
    assert AI().question([]) == "다음 질문은?"


def test_total_deadline_cancels_a_slow_complete_response(monkeypatch):
    import threading
    import time
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

    class SlowResponse(BaseHTTPRequestHandler):
        def do_POST(self):
            time.sleep(0.14)
            body = json.dumps({"message": {"content": '{"text":"늦은 질문"}'}}).encode()
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            time.sleep(0.14)
            try:
                self.wfile.write(body)
            except OSError:
                pass

        def log_message(self, format, *args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), SlowResponse)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    monkeypatch.setenv("OLLAMA_API_KEY", "local-test")
    monkeypatch.setenv("OLLAMA_BASE_URL", f"http://127.0.0.1:{server.server_port}")
    ai = AI()
    ai.deadline = time.monotonic() + 0.2
    try:
        with pytest.raises(HTTPException):
            ai.question([])
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
