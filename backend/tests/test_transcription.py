import base64
import json

import httpx
import pytest

from services.external import transcription
from services.external.exceptions import ProviderError


@pytest.mark.parametrize("model", ["@cf/openai/whisper-large-v3-turbo", "@cf/openai/whisper"])
def test_stt_sends_expected_audio_representation_and_strips_text(monkeypatch, model):
    monkeypatch.setenv("CLOUDFLARE_STT_MODEL", model)
    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", "account")
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "token")
    requests = []

    def handle(request):
        requests.append(request)
        return httpx.Response(200, json={"success": True, "result": {"text": " 응답 "}})

    client = httpx.Client
    monkeypatch.setattr(
        transcription.httpx,
        "Client",
        lambda **kwargs: client(transport=httpx.MockTransport(handle), **kwargs),
    )
    assert transcription.transcribe(b"audio", "audio/mp4") == "응답"
    (request,) = requests
    assert (
        str(request.url) == f"https://api.cloudflare.com/client/v4/accounts/account/ai/run/{model}"
    )
    assert request.headers["Authorization"] == "Bearer token"
    if "turbo" in model:
        assert json.loads(request.content) == {
            "audio": base64.b64encode(b"audio").decode(),
            "language": "ko",
            "task": "transcribe",
        }
    else:
        assert request.content == b"audio" and request.headers["Content-Type"] == "audio/mp4"


@pytest.mark.parametrize("failure", ["http", "timeout", "empty", "invalid-json"])
def test_stt_translates_remote_failures_to_provider_errors(monkeypatch, failure):
    monkeypatch.setenv("CLOUDFLARE_STT_MODEL", "whisper")
    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", "account")
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "token")

    def handle(request):
        if failure == "timeout":
            raise httpx.ReadTimeout("timeout", request=request)
        if failure == "http":
            return httpx.Response(503)
        if failure == "invalid-json":
            return httpx.Response(200, content=b"invalid")
        return httpx.Response(200, json={"success": True, "result": {"text": " "}})

    client = httpx.Client
    monkeypatch.setattr(
        transcription.httpx,
        "Client",
        lambda **kwargs: client(transport=httpx.MockTransport(handle), **kwargs),
    )
    with pytest.raises(ProviderError) as error:
        transcription.transcribe(b"audio", "audio/webm")
    assert str(error.value) == (
        "음성을 인식하지 못했습니다. 다시 녹음해주세요."
        if failure == "empty"
        else "음성 인식 서비스에 연결할 수 없습니다. 다시 시도해주세요."
    )
