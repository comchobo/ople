from copy import deepcopy
from datetime import UTC, datetime
from unittest.mock import Mock
from uuid import UUID, uuid4

import pytest
from sqlalchemy import event
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from models.generations import Generation
from models.planner_copies import PlannerCopyRecord
from models.planners import Planner
from models.recordings import Recording
from models.users import User
from services.planner import generations
from services.recording import uploads


@pytest.fixture
def source(db, signed_in, plans_data):
    planner = Planner(
        user_id=signed_in.id,
        name="원본",
        plans=deepcopy(plans_data["plans"]),
        created_at=datetime(2020, 1, 1, tzinfo=UTC),
    )
    db.add(planner)
    db.commit()
    return planner


def post_copy(client, source_id, body, key=None):
    return client.post(
        f"/api/planners/{source_id}/duplicate",
        headers={"Idempotency-Key": str(key or uuid4())},
        json=body,
    )


def test_copy_api_returns_public_saved_copy_and_list_includes_it(client, db, source, monkeypatch):
    generate = Mock(side_effect=AssertionError("AI must not run"))
    transcribe = Mock(side_effect=AssertionError("STT must not run"))
    monkeypatch.setattr(generations, "generate_plans", generate)
    monkeypatch.setattr(uploads, "transcribe", transcribe)
    db.add_all(
        [
            Generation(
                user_id=source.user_id, payload={}, status="completed", planner_id=source.id
            ),
            Recording(
                user_id=source.user_id,
                interview_id="existing",
                question_index=0,
                filename="existing.webm",
                content_type="audio/webm",
            ),
        ]
    )
    db.commit()
    key = uuid4()
    response = post_copy(client, source.id, {}, key)
    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "name", "created_at", "plans", "is_favorite"}
    assert UUID(body["id"]).version == 4
    assert body["id"] != source.id
    assert body["name"] == "원본(사본)"
    restored = deepcopy(body["plans"])
    for original, copied in zip(source.plans, restored, strict=True):
        for original_piece, copied_piece in zip(original["pieces"], copied["pieces"], strict=True):
            assert original_piece["id"] != copied_piece["id"]
            copied_piece["id"] = original_piece["id"]
    assert restored == source.plans
    db.expire_all()
    saved = db.get(Planner, body["id"])
    record = db.get(PlannerCopyRecord, (source.user_id, key))
    assert saved is not None and saved.plans == body["plans"]
    assert record is not None and record.copy_planner_id == saved.id
    assert client.get("/api/planners").json()[0]["id"] == body["id"]
    assert len(db.exec(select(Generation)).all()) == 1
    assert len(db.exec(select(Recording)).all()) == 1
    generate.assert_not_called()
    transcribe.assert_not_called()


def test_api_copy_edit_delete_and_source_delete_are_independent(client, source):
    original = deepcopy(source.plans)
    first = post_copy(client, source.id, {}).json()
    changed = deepcopy(first["plans"])
    changed[0]["pieces"][0]["title"] = "사본 활동 수정"
    response = client.put(
        "/api/planners/" + first["id"], json={"name": first["name"], "plans": changed}
    )
    assert response.status_code == 200
    listed = {item["id"]: item for item in client.get("/api/planners").json()}
    assert listed[source.id]["plans"] == original
    assert client.delete("/api/planners/" + first["id"]).status_code == 200
    key = uuid4()
    second = post_copy(client, source.id, {}, key).json()
    source_id = source.id
    assert client.delete("/api/planners/" + source_id).status_code == 200
    replay = post_copy(client, source_id, {}, key)
    assert replay.status_code == 201
    assert replay.json() == second
    assert [item["id"] for item in client.get("/api/planners").json()] == [second["id"]]


def test_retry_normalizes_name_and_returns_same_copy(client, db, source):
    key = uuid4()
    first = post_copy(client, source.id, {"name": "  나의 이름  "}, key)
    replay = post_copy(client, source.id, {"name": "나의 이름"}, key)
    assert first.status_code == replay.status_code == 201
    assert first.json() == replay.json()
    assert first.json()["name"] == "나의 이름"
    assert len(db.exec(select(PlannerCopyRecord)).all()) == 1


@pytest.mark.parametrize("change", ["source", "name"])
def test_request_key_conflict_is_flat_409(client, db, source, change):
    key = uuid4()
    assert post_copy(client, source.id, {}, key).status_code == 201
    response = post_copy(
        client,
        str(uuid4()) if change == "source" else source.id,
        {"name": "다른 이름"} if change == "name" else {},
        key,
    )
    assert response.status_code == 409
    assert response.json() == {
        "detail": "같은 요청 번호에 다른 요청 내용을 사용할 수 없습니다.",
        "code": "IDEMPOTENCY_KEY_CONFLICT",
    }
    assert len(db.exec(select(Planner)).all()) == 2


def test_deleted_copy_returns_410_without_recreation(client, db, source):
    key = uuid4()
    copied = post_copy(client, source.id, {}, key).json()
    assert client.delete("/api/planners/" + copied["id"]).status_code == 200
    response = post_copy(client, source.id, {}, key)
    assert response.status_code == 410
    assert response.json() == {"detail": "복제된 플래너가 삭제되었습니다.", "code": "COPY_DELETED"}
    assert len(db.exec(select(Planner)).all()) == 1
    assert len(db.exec(select(PlannerCopyRecord)).all()) == 1


def test_name_conflict_does_not_consume_key(client, db, source):
    key = uuid4()
    response = post_copy(client, source.id, {"name": "  원본  "}, key)
    assert response.status_code == 409
    assert response.json() == {"detail": "이미 있는 이름입니다.", "code": "COPY_NAME_EXISTS"}
    assert db.exec(select(PlannerCopyRecord)).all() == []
    assert post_copy(client, source.id, {"name": "다른 이름"}, key).status_code == 201


@pytest.mark.parametrize("mode", ["manual", "automatic", "collision"])
def test_name_overflow_has_actionable_error_and_allows_retry(client, db, source, mode):
    key = uuid4()
    if mode != "manual":
        source.name = "가" * (96 if mode == "collision" else 100)
        db.add(source)
        if mode == "collision":
            db.add(
                Planner(
                    user_id=source.user_id,
                    name=source.name + "(사본)",
                    plans=deepcopy(source.plans),
                )
            )
        db.commit()
    body = {"name": "😀" * 101} if mode == "manual" else {}
    response = post_copy(client, source.id, body, key)
    assert response.status_code == 422
    assert response.json() == {"detail": "길이가 초과됩니다.", "code": "COPY_NAME_TOO_LONG"}
    assert db.exec(select(PlannerCopyRecord)).all() == []
    assert post_copy(client, source.id, {"name": "짧은 이름"}, key).status_code == 201


@pytest.mark.parametrize(
    "body",
    [
        {"name": None},
        {"name": ""},
        {"name": "  "},
        {"name": 1},
        {"name": True},
        {"plans": []},
        {"user_id": "other"},
        [],
    ],
)
def test_invalid_body_retains_default_validation_array(client, db, source, body):
    response = post_copy(client, source.id, body)
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)
    assert db.exec(select(PlannerCopyRecord)).all() == []
    assert len(db.exec(select(Planner)).all()) == 1


@pytest.mark.parametrize("headers", [{}, {"Idempotency-Key": "invalid-uuid"}])
def test_request_key_header_is_required_and_validated(client, db, source, headers):
    response = client.post(f"/api/planners/{source.id}/duplicate", headers=headers, json={})
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["header", "Idempotency-Key"]
    assert db.exec(select(PlannerCopyRecord)).all() == []


def test_multiple_input_errors_are_not_hidden_by_name_error(client, source):
    response = client.post(
        f"/api/planners/{source.id}/duplicate",
        headers={"Idempotency-Key": "invalid"},
        json={"name": "가" * 101},
    )
    assert response.status_code == 422
    assert len(response.json()["detail"]) == 2


def test_body_is_required(client, source):
    response = client.post(
        f"/api/planners/{source.id}/duplicate",
        headers={"Idempotency-Key": str(uuid4())},
    )
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body"]


def test_authentication_is_required(client):
    response = post_copy(client, str(uuid4()), {})
    assert response.status_code == 401
    assert response.json() == {"detail": "로그인이 필요합니다."}


@pytest.mark.parametrize(
    "headers", [{"Origin": "https://other.test"}, {"sec-fetch-site": "cross-site"}]
)
def test_copy_obeys_existing_csrf_protection(client, source, headers, monkeypatch):
    monkeypatch.setenv("APP_ORIGIN", "http://localhost:3000")
    response = client.post(
        f"/api/planners/{source.id}/duplicate",
        headers={**headers, "Idempotency-Key": str(uuid4())},
        json={},
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "허용되지 않은 요청입니다."}


def test_other_users_and_missing_sources_have_same_404(client, db, signed_in, plans_data):
    other = User(email="other@example.com", name="other")
    db.add(other)
    db.commit()
    planner = Planner(user_id=other.id, name="남의 계획", plans=plans_data["plans"])
    db.add(planner)
    db.commit()
    denied = post_copy(client, planner.id, {})
    missing = post_copy(client, str(uuid4()), {})
    assert denied.status_code == missing.status_code == 404
    assert denied.json() == missing.json() == {"detail": "항목을 찾을 수 없습니다."}
    assert db.exec(select(PlannerCopyRecord)).all() == []


def test_database_failure_returns_flat_500_and_rolls_back(client, db, source):
    key = uuid4()

    def fail_after_flush(session, context):
        raise SQLAlchemyError("internal database failure")

    event.listen(db, "after_flush", fail_after_flush)
    try:
        response = post_copy(client, source.id, {}, key)
    finally:
        event.remove(db, "after_flush", fail_after_flush)
    assert response.status_code == 500
    assert response.json() == {
        "detail": "플래너를 복제하지 못했습니다. 다시 시도해주세요.",
        "code": "COPY_FAILED",
    }
    assert len(db.exec(select(Planner)).all()) == 1
    assert db.exec(select(PlannerCopyRecord)).all() == []
    assert post_copy(client, source.id, {}, key).status_code == 201


def test_existing_update_validation_keeps_its_original_error_format(client, source):
    response = client.put(
        f"/api/planners/{source.id}", json={"name": "가" * 101, "plans": source.plans}
    )
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)
    assert response.json()["detail"][0]["type"] == "string_too_long"


def test_openapi_documents_actual_copy_endpoint_and_both_422_shapes(client):
    operation = client.get("/openapi.json").json()["paths"]["/api/planners/{planner_id}/duplicate"][
        "post"
    ]
    assert operation["requestBody"]["required"] is True
    key = next(item for item in operation["parameters"] if item["name"] == "Idempotency-Key")
    assert key["required"] is True
    assert key["schema"]["format"] == "uuid"
    responses = operation["responses"]
    assert {"201", "401", "403", "404", "409", "410", "422", "500"} <= responses.keys()
    assert responses["201"]["content"]["application/json"]["schema"]["$ref"].endswith(
        "/PlannerCopyResponse"
    )
    schemas = responses["422"]["content"]["application/json"]["schema"]["anyOf"]
    assert {item["$ref"].rsplit("/", 1)[1] for item in schemas} == {
        "PlannerCopyError",
        "PlannerCopyInputError",
    }


@pytest.mark.parametrize("favorite", [False, True])
@pytest.mark.parametrize("body", [{}, {"name": "직접 정한 사본"}])
def test_copy_clears_favorite_in_response_database_and_list(client, db, source, favorite, body):
    source.is_favorite = favorite
    db.add(source)
    db.commit()
    source_id = source.id
    key = uuid4()

    first = post_copy(client, source_id, body, key)
    assert first.status_code == 201
    copied = first.json()
    assert copied["is_favorite"] is False
    replay = post_copy(client, source_id, body, key)
    assert replay.status_code == 201
    assert replay.json() == copied

    db.expire_all()
    assert db.get(Planner, source_id).is_favorite is favorite
    assert db.get(Planner, copied["id"]).is_favorite is False
    listed = {item["id"]: item for item in client.get("/api/planners").json()}
    assert listed[source_id]["is_favorite"] is favorite
    assert listed[copied["id"]]["is_favorite"] is False


def test_copy_rejects_client_supplied_favorite(client, db, source):
    response = post_copy(client, source.id, {"is_favorite": True})
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "is_favorite"]
    assert len(db.exec(select(Planner)).all()) == 1
    assert db.exec(select(PlannerCopyRecord)).all() == []


def test_replaying_copy_does_not_reset_a_favorite_changed_after_creation(client, db, source):
    key = uuid4()
    first = post_copy(client, source.id, {}, key)
    assert first.status_code == 201
    copied_id = first.json()["id"]
    copied = db.get(Planner, copied_id)
    assert copied is not None
    copied.is_favorite = True
    db.add(copied)
    db.commit()

    replay = post_copy(client, source.id, {}, key)
    assert replay.status_code == 201
    assert replay.json()["id"] == copied_id
    assert replay.json()["is_favorite"] is True
    db.expire_all()
    assert db.get(Planner, copied_id).is_favorite is True
    assert len(db.exec(select(Planner)).all()) == 2
