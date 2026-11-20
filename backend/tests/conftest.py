import os
import subprocess
import sys
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import models  # noqa: F401
from db import engine, session
from main import app
from models.users import User
from services.auth.sessions import create_session


@pytest.fixture
def database():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db(database):
    with Session(database, expire_on_commit=False) as value:
        yield value


@pytest.fixture
def client(db):
    app.dependency_overrides[session] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def signed_in(client, db):
    user = User(email="hello@example.com", name="이름")
    db.add(user)
    db.commit()
    client.cookies.set("ople_session", create_session(db, user))
    return user


@pytest.fixture
def plans_data():
    from schemas.planners import KINDS

    return {
        "plans": [
            {
                "kind": kind,
                "title": f"미래 {i}",
                "description": "응답 기반 계획",
                "scores": {},
                "pieces": [
                    {
                        "id": f"p{i}",
                        "title": "실험",
                        "description": "작게 시도",
                        "category": "work",
                        "start": 0,
                        "duration": 6,
                    }
                ],
            }
            for i, kind in enumerate(KINDS)
        ]
    }


@pytest.fixture
def migrated_postgres():
    schema = "test_" + uuid4().hex
    with engine.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    url = engine.url.update_query_dict({"options": f"-csearch_path={schema}"})
    migrated = create_engine(url)
    try:
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            env={**os.environ, "DATABASE_URL": url.render_as_string(hide_password=False)},
            text=True,
            capture_output=True,
        )
        assert result.returncode == 0, result.stdout + result.stderr
        yield migrated
    finally:
        migrated.dispose()
        with engine.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
