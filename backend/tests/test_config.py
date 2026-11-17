import pytest

from utils.config import origin, required, secure_cookie


@pytest.mark.parametrize(
    ("app_origin", "expected"),
    [("http://localhost:3000/", False), ("https://ople.ink/", True)],
)
def test_cookie_security_follows_origin(monkeypatch, app_origin, expected):
    monkeypatch.setenv("APP_ORIGIN", app_origin)
    assert origin() == app_origin.rstrip("/")
    assert secure_cookie() is expected


@pytest.mark.parametrize("value", [None, ""])
def test_required_rejects_missing_or_empty_settings(monkeypatch, value):
    if value is None:
        monkeypatch.delenv("APP_ORIGIN", raising=False)
    else:
        monkeypatch.setenv("APP_ORIGIN", value)
    with pytest.raises(RuntimeError, match="APP_ORIGIN"):
        required("APP_ORIGIN")
