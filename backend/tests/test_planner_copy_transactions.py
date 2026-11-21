from concurrent.futures import ThreadPoolExecutor, TimeoutError
from copy import deepcopy
from threading import Barrier, Event
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy import event
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from models.planner_copies import PlannerCopyRecord
from models.planners import Planner
from models.users import User
from schemas.planner_copies import PlannerCopyErrorCode, PlannerCopyRequest
from services.planner.copies import PlannerCopyError, duplicate_planner


def seed(database, plans):
    with Session(database, expire_on_commit=False) as db:
        user = User(email=uuid4().hex + "@example.com", name="owner")
        db.add(user)
        db.commit()
        source = Planner(user_id=user.id, name="원본", plans=deepcopy(plans))
        db.add(source)
        db.commit()
        return user.id, source.id


@pytest.fixture
def owned_source(database, plans_data):
    return seed(database, plans_data["plans"])


def test_copy_commits_result_and_record_after_an_auth_read(db, owned_source):
    user_id, source_id = owned_source
    key = uuid4()
    assert db.get(User, user_id) is not None
    assert db.in_transaction()
    result = duplicate_planner(
        db, user_id, source_id, key, PlannerCopyRequest(name="  지정한 이름  ")
    )
    record = db.get(PlannerCopyRecord, (user_id, key))
    assert record is not None
    assert (record.source_planner_id, record.requested_name, record.copy_planner_id) == (
        source_id,
        "지정한 이름",
        result.id,
    )
    assert result.name == "지정한 이름"
    assert len(db.exec(select(Planner)).all()) == 2


def test_retry_uses_record_even_after_source_changed_then_deleted(db, owned_source):
    user_id, source_id = owned_source
    key = uuid4()
    first = duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest())
    source = db.get(Planner, source_id)
    assert source is not None
    source.name = "원본 이름 수정"
    source.plans = deepcopy(source.plans)
    source.plans[0]["title"] = "바뀐 원본"
    db.add(source)
    db.commit()
    replay = duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest())
    assert replay.id == first.id
    assert replay.plans[0]["title"] != source.plans[0]["title"]
    db.delete(source)
    db.commit()
    assert duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest()).id == first.id
    assert len(db.exec(select(Planner)).all()) == 1


@pytest.mark.parametrize("change", ["source", "name", "omit-name"])
def test_request_key_content_conflict_leaves_first_result_intact(db, owned_source, change):
    user_id, source_id = owned_source
    key = uuid4()
    first = duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest(name="사용자 이름"))
    next_source = "different-source" if change == "source" else source_id
    next_request = (
        PlannerCopyRequest()
        if change == "omit-name"
        else PlannerCopyRequest(name="다른 이름" if change == "name" else "사용자 이름")
    )
    with pytest.raises(PlannerCopyError) as failed:
        duplicate_planner(db, user_id, next_source, key, next_request)
    assert failed.value.code == PlannerCopyErrorCode.IDEMPOTENCY_KEY_CONFLICT
    assert not db.in_transaction()
    record = db.get(PlannerCopyRecord, (user_id, key))
    assert record is not None and record.copy_planner_id == first.id
    assert len(db.exec(select(Planner)).all()) == 2


def test_deleted_copy_is_not_recreated_by_retry(db, owned_source):
    user_id, source_id = owned_source
    key = uuid4()
    copied = duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest())
    db.delete(copied)
    db.commit()
    with pytest.raises(PlannerCopyError) as failed:
        duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest())
    assert failed.value.code == PlannerCopyErrorCode.COPY_DELETED
    assert len(db.exec(select(Planner)).all()) == 1
    assert db.get(PlannerCopyRecord, (user_id, key)) is not None


@pytest.mark.parametrize("missing", [False, True])
def test_missing_and_other_users_sources_share_404(db, owned_source, missing):
    owner_id, source_id = owned_source
    other = User(email="other@example.com", name="other")
    db.add(other)
    db.commit()
    key = uuid4()
    with pytest.raises(HTTPException) as failed:
        duplicate_planner(
            db, other.id, "missing" if missing else source_id, key, PlannerCopyRequest()
        )
    assert (failed.value.status_code, failed.value.detail) == (404, "항목을 찾을 수 없습니다.")
    assert not db.in_transaction()
    assert db.get(PlannerCopyRecord, (other.id, key)) is None
    assert len(db.exec(select(Planner).where(Planner.user_id == owner_id)).all()) == 1


def test_nonexistent_user_cannot_create_a_record(db, owned_source):
    _, source_id = owned_source
    with pytest.raises(HTTPException) as failed:
        duplicate_planner(db, "missing-user", source_id, uuid4(), PlannerCopyRequest())
    assert failed.value.status_code == 401
    assert db.exec(select(PlannerCopyRecord)).all() == []


def test_validation_failure_does_not_consume_key_and_other_users_names_do_not_conflict(
    db, database, owned_source, plans_data
):
    user_id, source_id = owned_source
    other_id, _ = seed(database, plans_data["plans"])
    db.add(Planner(user_id=other_id, name="새 이름", plans=plans_data["plans"]))
    db.commit()
    key = uuid4()
    with pytest.raises(PlannerCopyError) as failed:
        duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest(name="원본"))
    assert failed.value.code == PlannerCopyErrorCode.COPY_NAME_EXISTS
    assert db.get(PlannerCopyRecord, (user_id, key)) is None
    result = duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest(name="새 이름"))
    assert result.name == "새 이름"


def test_length_error_does_not_consume_key(db, owned_source):
    user_id, source_id = owned_source
    source = db.get(Planner, source_id)
    assert source is not None
    source.name = "가" * 100
    db.add(source)
    db.commit()
    key = uuid4()
    with pytest.raises(PlannerCopyError) as failed:
        duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest())
    assert failed.value.code == PlannerCopyErrorCode.COPY_NAME_TOO_LONG
    assert db.get(PlannerCopyRecord, (user_id, key)) is None
    result = duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest(name="짧은 이름"))
    assert result.name == "짧은 이름"


def test_source_is_read_again_instead_of_using_a_stale_session_identity(db, database, owned_source):
    user_id, source_id = owned_source
    stale = db.get(Planner, source_id)
    assert stale is not None
    with Session(database) as writer:
        current = writer.get(Planner, source_id)
        assert current is not None
        current.name = "서버 최신 이름"
        writer.add(current)
        writer.commit()
    copied = duplicate_planner(db, user_id, source_id, uuid4(), PlannerCopyRequest())
    assert copied.name == "서버 최신 이름(사본)"


def test_postgres_failure_after_flush_rolls_back_both_rows_and_allows_retry(
    migrated_postgres, plans_data
):
    user_id, source_id = seed(migrated_postgres, plans_data["plans"])
    key = uuid4()
    with Session(migrated_postgres, expire_on_commit=False) as db:

        def fail_after_flush(session, context):
            assert (
                session.connection()
                .execute(select(PlannerCopyRecord).where(PlannerCopyRecord.request_key == key))
                .first()
                is not None
            )
            raise SQLAlchemyError("simulated database write failure")

        event.listen(db, "after_flush", fail_after_flush)
        try:
            with pytest.raises(PlannerCopyError) as failed:
                duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest())
            assert failed.value.code == PlannerCopyErrorCode.COPY_FAILED
            assert not db.in_transaction()
        finally:
            event.remove(db, "after_flush", fail_after_flush)

        with Session(migrated_postgres) as reader:
            assert len(reader.exec(select(Planner)).all()) == 1
            assert reader.exec(select(PlannerCopyRecord)).all() == []
        result = duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest())
        assert result.name == "원본(사본)"


@pytest.mark.parametrize("same_key", [False, True])
def test_postgres_concurrent_copies_serialize_names_and_replay_same_key(
    migrated_postgres, plans_data, same_key
):
    user_id, source_id = seed(migrated_postgres, plans_data["plans"])
    keys = [uuid4(), uuid4()]
    if same_key:
        keys[1] = keys[0]
    start = Barrier(2)

    def run(key):
        with Session(migrated_postgres, expire_on_commit=False) as db:
            start.wait(timeout=5)
            copied = duplicate_planner(db, user_id, source_id, key, PlannerCopyRequest())
            return copied.id, copied.name

    with ThreadPoolExecutor(max_workers=2) as workers:
        futures = [workers.submit(run, key) for key in keys]
        results = [future.result(timeout=10) for future in futures]

    expected = 1 if same_key else 2
    assert len({result[0] for result in results}) == expected
    assert {result[1] for result in results} == (
        {"원본(사본)"} if same_key else {"원본(사본)", "원본(사본)(사본)"}
    )
    with Session(migrated_postgres) as reader:
        assert len(reader.exec(select(Planner)).all()) == 1 + expected
        assert len(reader.exec(select(PlannerCopyRecord)).all()) == expected


def test_postgres_copy_waits_for_its_user_row_lock(migrated_postgres, plans_data):
    user_id, source_id = seed(migrated_postgres, plans_data["plans"])
    reached_lock = Event()

    def observe(connection, cursor, statement, parameters, context, executemany):
        if "FOR UPDATE" in statement:
            reached_lock.set()

    with Session(migrated_postgres) as blocker:
        blocker.exec(select(User).where(User.id == user_id).with_for_update()).one()
        event.listen(migrated_postgres, "before_cursor_execute", observe)

        def run():
            with Session(migrated_postgres, expire_on_commit=False) as db:
                return duplicate_planner(db, user_id, source_id, uuid4(), PlannerCopyRequest()).id

        with ThreadPoolExecutor(max_workers=1) as worker:
            future = worker.submit(run)
            try:
                assert reached_lock.wait(timeout=5)
                with pytest.raises(TimeoutError):
                    future.result(timeout=0.1)
            finally:
                blocker.rollback()
                event.remove(migrated_postgres, "before_cursor_execute", observe)
            assert future.result(timeout=5)


def test_postgres_another_users_copy_does_not_wait_for_locked_user(migrated_postgres, plans_data):
    first_id, _ = seed(migrated_postgres, plans_data["plans"])
    other_id, other_source = seed(migrated_postgres, plans_data["plans"])
    with Session(migrated_postgres) as blocker:
        blocker.exec(select(User).where(User.id == first_id).with_for_update()).one()

        def run():
            with Session(migrated_postgres, expire_on_commit=False) as db:
                return duplicate_planner(
                    db, other_id, other_source, uuid4(), PlannerCopyRequest()
                ).name

        with ThreadPoolExecutor(max_workers=1) as worker:
            future = worker.submit(run)
            try:
                assert future.result(timeout=5) == "원본(사본)"
            finally:
                blocker.rollback()
