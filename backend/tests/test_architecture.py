import os
import subprocess
import sys
from pathlib import Path

import pytest

CONFIG = Path(__file__).parents[1] / "pyproject.toml"


@pytest.mark.parametrize(
    ("filename", "code", "allowed"),
    [
        ("routers/example.py", "import httpx as sdk\nsdk.Client()\n", False),
        ("main.py", "from boto3 import client\nclient('sesv2')\n", False),
        ("config.py", "from authlib.jose import JsonWebToken\nJsonWebToken(['RS256'])\n", False),
        ("utils/example.py", "import httpx\nhttpx.get('https://example.com')\n", False),
        ("models/example.py", "import botocore\nprint(botocore)\n", False),
        ("schemas/example.py", "import httpx2\nprint(httpx2)\n", False),
        ("services/example.py", "import httpx\nhttpx.Client()\n", True),
        ("tests/test_example.py", "import httpx\nhttpx.MockTransport(print)\n", True),
    ],
)
def test_external_sdk_boundary_is_enforced_for_imports_and_aliases(filename, code, allowed):
    result = subprocess.run(
        [
            str(Path(sys.executable).with_name("ruff")),
            "check",
            "--config",
            str(CONFIG),
            "--select",
            "TID251",
            "--stdin-filename",
            str(CONFIG.parent / filename),
            "-",
        ],
        input=code,
        text=True,
        capture_output=True,
    )
    assert result.returncode == (0 if allowed else 1), result.stdout + result.stderr
    if not allowed:
        assert "TID251" in result.stdout


@pytest.mark.parametrize(
    ("source", "target", "allowed"),
    [
        ("services", "schemas", True),
        ("routers", "services", True),
        ("services", "routers", False),
        ("models", "services", False),
        ("utils", "models", False),
        ("utils", "config", False),
        ("utils", "db", False),
    ],
)
def test_layer_and_utility_contracts_reject_real_dependency_violations(
    tmp_path, source, target, allowed
):
    (tmp_path / "pyproject.toml").write_text(CONFIG.read_text())
    for package in ("routers", "services", "schemas", "models", "utils"):
        (tmp_path / package).mkdir()
        (tmp_path / package / "__init__.py").write_text("")
    for module in ("db", "config"):
        (tmp_path / f"{module}.py").write_text("")
    # Keep external application modules visible to the graph even in allowed fixtures.
    (tmp_path / "routers" / "infrastructure.py").write_text("import config\nimport db\n")
    (tmp_path / source / "example.py").write_text(f"import {target}\n")
    result = subprocess.run(
        [str(Path(sys.executable).with_name("lint-imports")), "--no-cache"],
        cwd=tmp_path,
        env={**os.environ, "PYTHONPATH": str(tmp_path)},
        text=True,
        capture_output=True,
    )
    assert result.returncode == (0 if allowed else 1), result.stdout + result.stderr
    assert ("KEPT" if allowed else "BROKEN") in result.stdout
