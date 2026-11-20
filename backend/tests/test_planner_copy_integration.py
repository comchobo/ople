from concurrent.futures import ThreadPoolExecutor
from contextlib import ExitStack
from copy import deepcopy
from threading import Barrier
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from db import session
from main import app
from models.planner_copies import PlannerCopyRecord
from models.planners import Planner
from models.users import User
from services.auth.sessions import create_session


@pytest.fixture
def integration_api(migrated_postgres, plans_data):
    with Session(migrated_postgres, expire_on_commit=False) as db:
        user = User(email="copy-integration@example.com", name="검증 사용자")
        db.add(user)
        db.commit()
        source = Planner(
            user_id=user.id,
            name="원본",
            plans=deepcopy(plans_data["plans"]),
            is_favorite=True,
        )
        db.add(source)
        db.commit()
        source_id = source.id
        token = create_session(db, user)

    def request_session():
        with Session(migrated_postgres) as db:
            yield db

    app.dependency_overrides[session] = request_session
    with ExitStack() as clients:

        def new_client():
            client = clients.enter_context(TestClient(app))
            client.cookies.set("ople_session", token)
            return client

        try:
            yield new_client, source_id, migrated_postgres
        finally:
            app.dependency_overrides.clear()


def duplicate(client, source_id, key):
    return client.post(
        f"/api/planners/{source_id}/duplicate",
        headers={"Idempotency-Key": str(key)},
        json={},
    )


def listed(client):
    response = client.get("/api/planners")
    assert response.status_code == 200
    return {item["id"]: item for item in response.json()}


def test_copy_survives_refresh_and_edits_and_deletion_are_independent(integration_api):
    new_client, source_id, _ = integration_api
    client = new_client()
    original = listed(client)[source_id]
    response = duplicate(client, source_id, uuid4())
    assert response.status_code == 201
    copied = response.json()
    copy_id = copied["id"]

    refreshed = listed(new_client())
    assert refreshed[source_id] == original
    assert refreshed[copy_id]["plans"] == copied["plans"]
    assert refreshed[copy_id]["is_favorite"] is False

    copy_plans = deepcopy(copied["plans"])
    copy_plans[0]["pieces"][0]["title"] = "사본에서 수정한 활동"
    copy_plans[0]["scores"] = {"resources": 8, "appeal": 7, "confidence": 6, "coherence": 5}
    assert (
        client.put(
            f"/api/planners/{copy_id}", json={"name": "수정한 사본", "plans": copy_plans}
        ).status_code
        == 200
    )
    refreshed = listed(new_client())
    assert refreshed[source_id] == original
    assert refreshed[copy_id]["plans"] == copy_plans
    assert refreshed[copy_id]["name"] == "수정한 사본"

    original_plans = deepcopy(original["plans"])
    original_plans[1]["description"] = "원본에서 수정한 계획"
    original_plans[0]["scores"] = {"resources": 2, "appeal": 3, "confidence": 4, "coherence": 5}
    assert (
        client.put(
            f"/api/planners/{source_id}", json={"name": "수정한 원본", "plans": original_plans}
        ).status_code
        == 200
    )
    refreshed = listed(new_client())
    assert refreshed[source_id]["plans"] == original_plans
    assert refreshed[source_id]["is_favorite"] is True
    assert refreshed[copy_id]["plans"] == copy_plans
    assert client.delete(f"/api/planners/{source_id}").status_code == 200
    remaining = listed(new_client())
    assert set(remaining) == {copy_id}
    assert remaining[copy_id]["plans"] == copy_plans


def test_new_session_recovers_committed_copy_after_response_is_discarded(integration_api):
    new_client, source_id, database = integration_api
    key = uuid4()
    # Discard the initial HTTP result; the next client only knows the request key.
    duplicate(new_client(), source_id, key)

    with Session(database) as reader:
        record = reader.exec(select(PlannerCopyRecord)).one()
        copy_id = record.copy_planner_id
        saved = reader.get(Planner, copy_id)
        assert saved is not None
        plans = deepcopy(saved.plans)

    retry = duplicate(new_client(), source_id, key)
    assert retry.status_code == 201
    assert retry.json()["id"] == copy_id
    assert retry.json()["plans"] == plans
    assert listed(new_client())[copy_id]["plans"] == plans
    with Session(database) as reader:
        assert len(reader.exec(select(Planner)).all()) == 2
        assert len(reader.exec(select(PlannerCopyRecord)).all()) == 1


@pytest.mark.parametrize("same_key", [False, True])
def test_concurrent_http_requests_keep_names_unique_and_same_key_creates_once(
    integration_api, same_key
):
    new_client, source_id, database = integration_api
    clients = [new_client(), new_client()]
    keys = [uuid4(), uuid4()]
    if same_key:
        keys[1] = keys[0]
    start = Barrier(2)

    def send(index):
        start.wait(timeout=5)
        return duplicate(clients[index], source_id, keys[index])

    with ThreadPoolExecutor(max_workers=2) as workers:
        futures = [workers.submit(send, index) for index in range(2)]
        responses = [future.result(timeout=15) for future in futures]

    assert [response.status_code for response in responses] == [201, 201]
    results = [response.json() for response in responses]
    expected = 1 if same_key else 2
    assert len({item["id"] for item in results}) == expected
    assert {item["name"] for item in results} == (
        {"원본(사본)"} if same_key else {"원본(사본)", "원본(사본)(사본)"}
    )
    assert all(item["is_favorite"] is False for item in results)
    assert len(listed(new_client())) == 1 + expected
    with Session(database) as reader:
        assert len(reader.exec(select(PlannerCopyRecord)).all()) == expected
