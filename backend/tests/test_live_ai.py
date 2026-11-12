"""Explicit, paid network verification. Run only with RUN_LIVE_AI=1 in Compose."""

import hashlib
import json
import os
import time
from pathlib import Path
from uuid import uuid4

import pytest

from main import app
from schemas.product import Generation
from services.providers import AI, get_ai

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_LIVE_AI") != "1", reason="explicit live API run only"
)


def test_live_korean_stt_and_adaptive_plans(product, monkeypatch):
    for name in ("OLLAMA_API_KEY", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"):
        assert os.getenv(name), f"{name} is required; live verification is not complete"
    client, engine, _, _, user_id = product
    app.dependency_overrides.pop(get_ai)
    monkeypatch.setenv("AUDIO_ARCHIVE_DIR", "/data/audio")
    fixture = Path(__file__).parent / "fixtures" / "korean"
    manifest = json.loads((fixture / "transcripts.json").read_text())
    result = client.post("/api/interviews")
    assert result.status_code == 201, result.text
    interview = result.json()
    evidence = {
        "stt_model": os.getenv("CLOUDFLARE_STT_MODEL"),
        "text_model": os.getenv("OLLAMA_MODEL"),
        "audio": [],
    }
    for position, sample in enumerate(manifest["samples"]):
        audio = (fixture / sample["file"]).read_bytes()
        assert hashlib.sha256(audio).hexdigest() == sample["sha256"]
        submission = str(uuid4())
        started = time.monotonic()
        response = client.post(
            f"/api/interviews/{interview['id']}/answers/{position}/{submission}",
            content=audio,
            headers={"Content-Type": "audio/wav"},
        )
        assert response.status_code == 200, response.text
        assert response.json()["answered"] == position + 1
        assert (Path("/data/audio") / submission / "original").read_bytes() == audio
        from sqlmodel import Session, select

        from models.entities import Answer

        with Session(engine) as db:
            row = db.exec(select(Answer).where(Answer.position == position)).one()
            evidence["audio"].append(
                {
                    "sample": sample["source_id"],
                    "reference": sample["reference"],
                    "transcript": row.transcript,
                    "seconds_stt_and_next_question": round(time.monotonic() - started, 2),
                }
            )
    assert client.delete(f"/api/interviews/{interview['id']}").status_code == 204

    # FLEURS is read speech, not personal interview answers. Test grounded planning separately
    # with ten explicitly synthetic answers; never expand the two-clip audio corpus.
    synthetic = [
        "현재 웹 개발자로 일합니다. 안정적인 수입은 유지하고 과도한 야근은 줄이고 싶습니다.",
        "복잡한 문제를 정리하고 동료에게 설명할 때 강점을 느낍니다.",
        "5년 안에 개발 경험을 살린 교육 활동을 해보고 싶습니다.",
        "현재 방향에서는 제품 개발 전문성을 높이고 동료 멘토링을 하고 싶습니다.",
        "다른 방향으로는 성인 대상 코딩 교육을 작은 모임에서 시도하고 싶습니다.",
        "이상적인 하루는 오전에 집중해서 일하고 오후에 그림을 그리는 생활입니다.",
        "매주 수채화 수업을 한 번 듣고 작은 작품을 만들고 싶습니다.",
        "주말에는 가족과 시간을 보내고 주 3회 산책하며 쉬고 싶습니다.",
        "현재 일을 유지해야 하고 새 활동에는 주 4시간과 월 10만 원을 쓸 수 있습니다.",
        "먼저 친구 두 명에게 한 시간짜리 코딩 수업을 열어보고 피드백을 받고 싶습니다.",
    ]
    history = []
    for answer in synthetic:
        question = AI().question(history)
        assert question.strip()
        history.append({"question": question, "answer": answer})
    summary = AI().summarize(history)
    generated = Generation.model_validate(AI().generate(history))
    assert len({plan.title for plan in generated.plans}) == 3
    assert summary.strip()
    evidence["synthetic_interview"] = {
        "history": history,
        "summary": summary,
        "generation": generated.model_dump(),
    }
    # Evidence contains only public references and synthetic content, never credentials.
    print("LIVE_AI_EVIDENCE=" + json.dumps(evidence, ensure_ascii=False))
