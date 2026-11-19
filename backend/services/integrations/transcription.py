import base64

import httpx

from utils.env import required


class TranscriptionError(Exception):
    pass


def transcribe(audio: bytes, content_type: str) -> str:
    model = required("CLOUDFLARE_STT_MODEL")
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{required('CLOUDFLARE_ACCOUNT_ID')}/ai/run/{model}"
    )
    headers = {"Authorization": f"Bearer {required('CLOUDFLARE_API_TOKEN')}"}
    try:
        with httpx.Client(timeout=120) as client:
            if "whisper-large-v3-turbo" in model:
                response = client.post(
                    url,
                    headers=headers,
                    json={
                        "audio": base64.b64encode(audio).decode(),
                        "language": "ko",
                        "task": "transcribe",
                    },
                )
            else:
                response = client.post(
                    url, headers={**headers, "Content-Type": content_type}, content=audio
                )
        response.raise_for_status()
        data = response.json()
        text = data.get("result", {}).get("text", "").strip()
        if not data.get("success") or not text:
            raise TranscriptionError("음성을 인식하지 못했습니다. 다시 녹음해주세요.")
        return text
    except (httpx.HTTPError, ValueError) as exc:
        raise TranscriptionError(
            "음성 인식 서비스에 연결할 수 없습니다. 다시 시도해주세요."
        ) from exc
