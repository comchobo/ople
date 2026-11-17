import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from models import entities  # noqa: F401


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
def plans_data():
    from schemas.domain import KINDS

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
