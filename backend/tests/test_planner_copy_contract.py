from datetime import UTC, datetime
from uuid import UUID

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from models.planners import Planner
from routers.dependencies import PlannerCopyKey
from schemas.planner_copies import (
    PlannerCopyError,
    PlannerCopyErrorCode,
    PlannerCopyRequest,
    PlannerCopyResponse,
)

KEY = "4a8f9ee1-b280-4ea0-9aab-b3314f9cfdb4"
COPY_ID = "76d9f157-3eae-4c8c-a12e-4876052a72d5"


def test_omitted_name_survives_request_round_trip():
    request = PlannerCopyRequest.model_validate_json("{}")
    assert request.name is None
    assert request.model_dump(exclude_unset=True) == {}
    with pytest.raises(ValidationError) as invalid:
        PlannerCopyRequest.model_validate_json('{"name": null}')
    assert invalid.value.errors()[0]["loc"] == ("name",)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [("  새로운 계획\n", "새로운 계획"), ("가" * 100, "가" * 100), ("😀" * 100, "😀" * 100)],
)
def test_name_trims_whitespace_and_counts_unicode_code_points(raw, expected):
    request = PlannerCopyRequest(name=raw)
    assert request.model_dump(exclude_unset=True) == {"name": expected}


@pytest.mark.parametrize(
    ("name", "error_type"),
    [
        ("", "string_too_short"),
        (" \t\n", "string_too_short"),
        ("가" * 101, "string_too_long"),
        ("😀" * 101, "string_too_long"),
        (1, "string_type"),
        (False, "string_type"),
        ([], "string_type"),
    ],
)
def test_invalid_name_is_rejected_with_a_field_error(name, error_type):
    with pytest.raises(ValidationError) as invalid:
        PlannerCopyRequest.model_validate({"name": name})
    error = invalid.value.errors()[0]
    assert error["loc"] == ("name",)
    assert error["type"] == error_type


@pytest.mark.parametrize("field", ["plans", "user_id", "id"])
def test_request_cannot_supply_copy_contents_or_identity(field):
    with pytest.raises(ValidationError) as invalid:
        PlannerCopyRequest.model_validate({field: "client supplied"})
    assert invalid.value.errors()[0]["loc"] == (field,)
    assert invalid.value.errors()[0]["type"] == "extra_forbidden"


@pytest.fixture
def contract_client(plans_data):
    # Isolate schema and header behavior; production routing is covered in test_planner_copies_api.
    app = FastAPI()
    received = []
    planner = Planner(
        id=COPY_ID,
        user_id="private-owner",
        name="응답 검증용",
        created_at=datetime(2026, 11, 19, 12, 0, tzinfo=UTC),
        plans=plans_data["plans"],
    )

    @app.post("/contract", status_code=201, response_model=PlannerCopyResponse)
    def contract(body: PlannerCopyRequest, key: PlannerCopyKey):
        received.append((body, key))
        return planner

    with TestClient(app) as client:
        yield client, received


@pytest.mark.parametrize("body", [{}, {"name": "  사용자 이름  "}])
def test_http_contract_parses_key_and_serializes_public_response(contract_client, body, plans_data):
    client, received = contract_client
    response = client.post("/contract", headers={"Idempotency-Key": KEY}, json=body)
    assert response.status_code == 201
    request, key = received[0]
    assert key == UUID(KEY)
    assert request.model_dump(exclude_unset=True) == ({} if not body else {"name": "사용자 이름"})
    assert response.json() == {
        "id": COPY_ID,
        "name": "응답 검증용",
        "created_at": "2026-11-19T12:00:00Z",
        "plans": plans_data["plans"],
    }


@pytest.mark.parametrize(
    ("headers", "body", "location"),
    [
        ({}, {}, ["header", "Idempotency-Key"]),
        ({"Idempotency-Key": "invalid-key"}, {}, ["header", "Idempotency-Key"]),
        ({"Idempotency-Key": KEY}, {"name": None}, ["body", "name"]),
        ({"Idempotency-Key": KEY}, {"plans": []}, ["body", "plans"]),
        ({"Idempotency-Key": KEY}, [], ["body"]),
    ],
)
def test_http_contract_rejects_invalid_input_before_handler(
    contract_client, headers, body, location
):
    client, received = contract_client
    response = client.post("/contract", headers=headers, json=body)
    assert response.status_code == 422
    assert location in [error["loc"] for error in response.json()["detail"]]
    assert received == []


def test_http_contract_requires_json_object_body(contract_client):
    client, received = contract_client
    response = client.post("/contract", headers={"Idempotency-Key": KEY})
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body"]
    assert received == []


def test_openapi_describes_omission_without_allowing_null(contract_client):
    client, _ = contract_client
    schema = client.get("/openapi.json").json()
    request = schema["components"]["schemas"]["PlannerCopyRequest"]
    assert "name" not in request.get("required", [])
    assert request["properties"]["name"]["type"] == "string"
    assert request["properties"]["name"]["minLength"] == 1
    assert request["properties"]["name"]["maxLength"] == 100
    operation = schema["paths"]["/contract"]["post"]
    assert operation["requestBody"]["required"] is True
    header = operation["parameters"][0]
    assert (header["name"], header["in"], header["required"]) == ("Idempotency-Key", "header", True)
    assert header["schema"]["format"] == "uuid"


def test_response_reuses_abc_order_and_score_validation(plans_data):
    data = {
        "id": COPY_ID,
        "name": "사본",
        "created_at": "2026-11-19T12:00:00Z",
        **plans_data,
    }
    plans_data["plans"].reverse()
    with pytest.raises(ValidationError, match="A/B/C"):
        PlannerCopyResponse.model_validate(data)
    plans_data["plans"].reverse()
    plans_data["plans"][0]["scores"] = {"resources": 11}
    with pytest.raises(ValidationError):
        PlannerCopyResponse.model_validate(data)


def test_error_response_uses_flat_machine_readable_code():
    error = PlannerCopyError(
        detail="길이가 초과됩니다.", code=PlannerCopyErrorCode.COPY_NAME_TOO_LONG
    )
    assert error.model_dump(mode="json") == {
        "detail": "길이가 초과됩니다.",
        "code": "COPY_NAME_TOO_LONG",
    }
    with pytest.raises(ValidationError):
        PlannerCopyError(detail="알 수 없는 오류", code="UNDEFINED_CODE")
