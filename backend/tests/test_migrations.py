import os
import subprocess
import sys
from datetime import timedelta
from uuid import uuid4

import pytest
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from models.auth import LoginSession, OAuthAttempt, Signup
from models.generations import Generation
from models.planner_copies import PlannerCopyRecord
from models.planners import Planner
from models.recordings import Recording
from models.users import User
from utils.clock import now


def migrate(database, direction, revision):
    result = subprocess.run(
        [sys.executable, "-m", "alembic", direction, revision],
        env={
            **os.environ,
            "DATABASE_URL": database.url.render_as_string(hide_password=False),
        },
        text=True,
        capture_output=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_migrated_postgres_supports_all_split_models_and_foreign_keys(
    migrated_postgres, plans_data
):
    inspector = inspect(migrated_postgres)
    assert set(inspector.get_table_names()) == {
        "alembic_version",
        "user",
        "signup",
        "oauthattempt",
        "loginsession",
        "recording",
        "planner",
        "generation",
        "plannercopyrecord",
    }
    with Session(migrated_postgres) as db:
        user = User(email="hello@example.com", name="이름", google_sub="google")
        db.add(user)
        db.commit()
        db.add_all(
            [
                Signup(
                    email=user.email,
                    password_hash="hash",
                    code_hash="code",
                    sent_at=now(),
                    expires_at=now(),
                ),
                OAuthAttempt(
                    state_hash="state", nonce="nonce", verifier="verifier", expires_at=now()
                ),
                LoginSession(token_hash="token", user_id=user.id, expires_at=now()),
                Recording(
                    user_id=user.id,
                    interview_id="i",
                    question_index=0,
                    filename="0.webm",
                    content_type="audio/webm",
                ),
                Planner(user_id=user.id, name="계획", plans=plans_data["plans"]),
                Generation(user_id=user.id, payload={"summary": "나의 이야기"}),
                PlannerCopyRecord(
                    user_id=user.id,
                    request_key=uuid4(),
                    source_planner_id="source",
                    copy_planner_id="copy",
                ),
            ]
        )
        db.commit()
        for model in (
            User,
            Signup,
            OAuthAttempt,
            LoginSession,
            Recording,
            Planner,
            Generation,
            PlannerCopyRecord,
        ):
            item = db.exec(select(model)).one()
            if isinstance(item, (Signup, OAuthAttempt, LoginSession)):
                assert item.expires_at.tzinfo is not None
        assert db.exec(select(Planner)).one().plans == plans_data["plans"]
        assert db.exec(select(Generation)).one().payload == {"summary": "나의 이야기"}
    for table in ("loginsession", "recording", "planner", "generation", "plannercopyrecord"):
        assert any(
            key["referred_table"] == "user" and key["constrained_columns"] == ["user_id"]
            for key in inspector.get_foreign_keys(table)
        )
    assert any(
        constraint["column_names"] == ["google_sub"]
        for constraint in inspector.get_unique_constraints("user")
    )
    assert any(
        index["column_names"] == ["interview_id"] for index in inspector.get_indexes("recording")
    )

    assert inspector.get_pk_constraint("plannercopyrecord")["constrained_columns"] == [
        "user_id",
        "request_key",
    ]
    foreign_keys = inspector.get_foreign_keys("plannercopyrecord")
    assert len(foreign_keys) == 1
    assert foreign_keys[0]["options"]["ondelete"] == "CASCADE"


def test_migrated_copy_records_survive_planner_deletion_and_cascade_with_user(
    migrated_postgres, plans_data
):
    key = uuid4()
    with Session(migrated_postgres, expire_on_commit=False) as db:
        owner = User(email="owner@example.com", name="owner")
        other = User(email="other@example.com", name="other")
        db.add_all([owner, other])
        db.commit()
        source = Planner(user_id=owner.id, name="원본", plans=plans_data["plans"])
        copy = Planner(user_id=owner.id, name="원본(사본)", plans=plans_data["plans"])
        db.add_all([source, copy])
        db.commit()
        owner_id, other_id = owner.id, other.id
        source_id, copy_id = source.id, copy.id
        db.add_all(
            [
                PlannerCopyRecord(
                    user_id=owner_id,
                    request_key=key,
                    source_planner_id=source_id,
                    requested_name="사용자 이름",
                    copy_planner_id=copy_id,
                ),
                PlannerCopyRecord(
                    user_id=other_id,
                    request_key=key,
                    source_planner_id="other-source",
                    copy_planner_id="other-copy",
                ),
            ]
        )
        db.commit()

        with Session(migrated_postgres) as duplicate:
            duplicate.add(
                PlannerCopyRecord(
                    user_id=owner_id,
                    request_key=key,
                    source_planner_id=source_id,
                    copy_planner_id="unwanted-copy",
                )
            )
            with pytest.raises(IntegrityError):
                duplicate.commit()
            duplicate.rollback()

        db.delete(source)
        db.delete(copy)
        db.commit()
        db.expire_all()
        record = db.get(PlannerCopyRecord, (owner_id, key))
        assert record is not None
        assert (record.source_planner_id, record.requested_name, record.copy_planner_id) == (
            source_id,
            "사용자 이름",
            copy_id,
        )
        assert record.created_at.tzinfo is not None
        assert record.created_at.utcoffset() == timedelta(0)

        db.delete(owner)
        db.commit()
        db.expire_all()
        assert db.get(PlannerCopyRecord, (owner_id, key)) is None
        other_record = db.get(PlannerCopyRecord, (other_id, key))
        assert other_record is not None
        assert other_record.requested_name is None
        assert other_record.copy_planner_id == "other-copy"


def test_copy_record_migration_downgrade_and_upgrade_preserve_existing_planners(
    migrated_postgres, plans_data
):
    with Session(migrated_postgres, expire_on_commit=False) as db:
        user = User(email="owner@example.com", name="owner")
        db.add(user)
        db.commit()
        source = Planner(user_id=user.id, name="기존 원본", plans=plans_data["plans"])
        db.add(source)
        db.commit()
        source_id = source.id
        db.add(
            PlannerCopyRecord(
                user_id=user.id,
                request_key=uuid4(),
                source_planner_id=source_id,
                copy_planner_id="deleted-copy",
            )
        )
        db.commit()

    migrate(migrated_postgres, "downgrade", "0002")
    assert "plannercopyrecord" not in inspect(migrated_postgres).get_table_names()
    # Query only columns that exist at revision 0002.
    with Session(migrated_postgres) as db:
        source_name, source_plans = db.exec(
            select(Planner.name, Planner.plans).where(Planner.id == source_id)
        ).one()
        assert source_name == "기존 원본"
        assert source_plans == plans_data["plans"]

    migrate(migrated_postgres, "upgrade", "head")
    with Session(migrated_postgres) as db:
        assert db.exec(select(PlannerCopyRecord)).all() == []
        source = db.get(Planner, source_id)
        assert source is not None
        assert source.plans == plans_data["plans"]


def test_favorite_migration_initializes_existing_rows_and_preserves_planner_data(
    migrated_postgres, plans_data
):
    with Session(migrated_postgres, expire_on_commit=False) as db:
        user = User(email="favorite-migration@example.com", name="owner")
        db.add(user)
        db.commit()
        source = Planner(
            user_id=user.id, name="기존 플래너", plans=plans_data["plans"], is_favorite=True
        )
        db.add(source)
        db.commit()
        source_id = source.id

    migrate(migrated_postgres, "downgrade", "0003")
    assert "is_favorite" not in {
        column["name"] for column in inspect(migrated_postgres).get_columns("planner")
    }
    migrate(migrated_postgres, "upgrade", "head")
    column = next(
        column
        for column in inspect(migrated_postgres).get_columns("planner")
        if column["name"] == "is_favorite"
    )
    assert column["nullable"] is False
    with Session(migrated_postgres) as db:
        source = db.get(Planner, source_id)
        assert source is not None
        assert source.is_favorite is False
        assert source.name == "기존 플래너"
        assert source.plans == plans_data["plans"]
        new_id = str(uuid4())
        db.connection().execute(
            text(
                "INSERT INTO planner (id, user_id, name, plans, created_at, updated_at) "
                "SELECT :new_id, user_id, name, plans, created_at, updated_at "
                "FROM planner WHERE id = :source_id"
            ),
            {"new_id": new_id, "source_id": source_id},
        )
        db.commit()
        saved = db.get(Planner, new_id)
        assert saved is not None
        assert saved.is_favorite is False
