# TEMP: 리뉴얼 스켈레톤 스모크 테스트. 실제 테스트 작성 시 교체/삭제.
from fastapi.testclient import TestClient

from main import app


def test_health_returns_ok():
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
