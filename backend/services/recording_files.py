from pathlib import Path

from utils.ids import uid

RECORDINGS_DIR = Path("/recordings")


def save_audio(data: bytes, extension: str) -> str:
    RECORDINGS_DIR.mkdir(parents=True, exist_ok=True, mode=0o700)
    filename = f"{uid()}.{extension}"
    path = RECORDINGS_DIR / filename
    with path.open("xb") as output:
        output.write(data)
    path.chmod(0o600)
    return filename
