import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import models  # noqa: F401
from db import session
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
