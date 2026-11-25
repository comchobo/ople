from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from threading import Barrier
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete
from sqlmodel import Session, select

from db import engine
from main import app
from models.auth import LoginSession
from models.planner_copies import PlannerCopyRecord
from models.planners import Planner
from models.users import User
from services.auth.sessions import create_session


@pytest.fixture
def integration_api(plans_data):
    with Session(engine, expire_on_commit=False) as db:
        user = User(email=f"{uuid4()}@example.com", name="검증 사용자")
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

    clients = []

    def new_client():
        client = TestClient(app)
        clients.append(client)
        client.cookies.set("ople_session", token)
        return client

    try:
        yield new_client, source_id, engine
    finally:
        for client in clients:
            client.close()
        with Session(engine) as db:
            for model in (LoginSession, PlannerCopyRecord, Planner):
                db.execute(delete(model).where(model.user_id == user.id))
            db.execute(delete(User).where(User.id == user.id))
            db.commit()


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
        record = reader.exec(
            select(PlannerCopyRecord).where(PlannerCopyRecord.request_key == key)
        ).one()
        owner_id = record.user_id
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
        assert len(reader.exec(select(Planner).where(Planner.user_id == owner_id)).all()) == 2
        assert (
            len(
                reader.exec(
                    select(PlannerCopyRecord).where(PlannerCopyRecord.request_key == key)
                ).all()
            )
            == 1
        )


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

    conflicts = [response for response in responses if response.status_code == 409]
    if conflicts:
        assert not same_key
        assert len(conflicts) == 1
        assert conflicts[0].json()["code"] == "COPY_NAME_EXISTS"
    responses = [response for response in responses if response not in conflicts]
    assert all(response.status_code == 201 for response in responses)
    results = [response.json() for response in responses]
    expected = 1 if same_key else len(responses)
    assert len({item["id"] for item in results}) == expected
    assert {item["name"] for item in results} == (
        {"원본(사본)"} if expected == 1 else {"원본(사본)", "원본(사본)(사본)"}
    )
    assert all(item["is_favorite"] is False for item in results)
    assert len(listed(new_client())) == 1 + expected
    with Session(database) as reader:
        assert (
            len(
                reader.exec(
                    select(PlannerCopyRecord).where(PlannerCopyRecord.request_key.in_(keys))
                ).all()
            )
            == expected
        )


def test_concurrent_requested_name_has_one_winner_and_rename_rejects_duplicate(integration_api):
    new_client, source_id, _ = integration_api
    clients = [new_client(), new_client()]
    start = Barrier(2)

    def send(client):
        start.wait(timeout=5)
        return client.post(
            f"/api/planners/{source_id}/duplicate",
            headers={"Idempotency-Key": str(uuid4())},
            json={"name": "직접 지정"},
        )

    with ThreadPoolExecutor(max_workers=2) as workers:
        results = list(workers.map(send, clients))
    assert sorted(response.status_code for response in results) == [201, 409]
    assert (
        next(response for response in results if response.status_code == 409).json()["code"]
        == "COPY_NAME_EXISTS"
    )
    source = listed(clients[0])[source_id]
    response = clients[0].put(
        f"/api/planners/{source_id}", json={"name": "직접 지정", "plans": source["plans"]}
    )
    assert response.status_code == 409
    assert {item["name"] for item in listed(clients[0]).values()} == {"원본", "직접 지정"}
