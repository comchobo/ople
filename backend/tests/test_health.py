# TEMPORARY scaffold test: delete or replace when implementing the product.
from fastapi.testclient import TestClient

from main import app


def test_health() -> None:
    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
