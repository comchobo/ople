import hashlib
import json
from pathlib import Path


def test_committed_korean_fixture_subset_and_integrity():
    root = Path(__file__).parent / "fixtures" / "korean"
    manifest = json.loads((root / "transcripts.json").read_text())
    assert manifest["license"] == "CC-BY-4.0"
    assert len(manifest["samples"]) == 2
    assert sum(sample["duration_seconds"] for sample in manifest["samples"]) == 23.28
    for sample in manifest["samples"]:
        audio = (root / sample["file"]).read_bytes()
        assert audio[:4] == b"RIFF" and audio[8:12] == b"WAVE"
        assert len(audio) == sample["bytes"]
        assert hashlib.sha256(audio).hexdigest() == sample["sha256"]
        assert sample["reference"]
