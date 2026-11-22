import pytest
from psycopg import errors
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlmodel import Session

from models.planners import Planner


@pytest.fixture
def planner_id(db, signed_in):
    planner = Planner(user_id=signed_in.id, name="계획", plans=[])
    db.add(planner)
    db.commit()
    return planner.id


@pytest.mark.parametrize("failure", [None, errors.SerializationFailure, errors.DeadlockDetected])
def test_rejected_favorite(client, db, database, planner_id, monkeypatch, failure):
    if failure is None:
        db.execute(
            text("""CREATE TRIGGER reject_favorite BEFORE UPDATE OF is_favorite ON planner
                           BEGIN SELECT RAISE(ABORT, 'favorite rejected'); END""")
        )
    else:

        def reject():
            db.flush()
            raise OperationalError(None, None, failure())

        monkeypatch.setattr(db, "commit", reject)

    response = client.put(f"/api/planners/{planner_id}/favorite", json={"is_favorite": True})
    assert response.status_code == 500
    assert response.json() == {"detail": "favorite_not_saved"}
    assert not db.in_transaction()
    with Session(database) as reader:
        planner = reader.get(Planner, planner_id)
        assert planner is not None
        assert planner.is_favorite is False


@pytest.mark.parametrize("failure", [errors.ConnectionFailure, errors.StatementCompletionUnknown])
def test_lost_commit_response(client, db, database, planner_id, monkeypatch, failure):
    commit = db.commit

    def lose_response():
        commit()
        raise OperationalError(None, None, failure())

    monkeypatch.setattr(db, "commit", lose_response)
    with pytest.raises(OperationalError):
        client.put(f"/api/planners/{planner_id}/favorite", json={"is_favorite": True})
    with Session(database) as reader:
        planner = reader.get(Planner, planner_id)
        assert planner is not None
        assert planner.is_favorite is True
