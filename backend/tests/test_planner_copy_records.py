from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from models.planner_copies import PlannerCopyRecord
from models.users import User


@pytest.mark.parametrize("requested_name", [None, "직접 입력한 이름"])
def test_copy_request_content_and_result_survive_reload(db, requested_name):
    user = User(email="owner@example.com", name="owner")
    db.add(user)
    db.commit()
    key = uuid4()
    db.add(
        PlannerCopyRecord(
            user_id=user.id,
            request_key=key,
            source_planner_id="source",
            requested_name=requested_name,
            copy_planner_id="copy",
        )
    )
    db.commit()
    db.expire_all()

    saved = db.get(PlannerCopyRecord, (user.id, key))
    assert saved is not None
    assert (saved.source_planner_id, saved.requested_name, saved.copy_planner_id) == (
        "source",
        requested_name,
        "copy",
    )


def test_same_request_key_is_independent_for_different_users(db):
    users = [
        User(email="one@example.com", name="one"),
        User(email="two@example.com", name="two"),
    ]
    db.add_all(users)
    db.commit()
    key = uuid4()
    for user in users:
        db.add(
            PlannerCopyRecord(
                user_id=user.id,
                request_key=key,
                source_planner_id="source-" + user.id,
                copy_planner_id="copy-" + user.id,
            )
        )
    db.commit()
    db.expire_all()

    for user in users:
        saved = db.get(PlannerCopyRecord, (user.id, key))
        assert saved is not None
        assert saved.copy_planner_id == "copy-" + user.id


def test_duplicate_user_request_key_cannot_replace_success(db, database):
    user = User(email="owner@example.com", name="owner")
    db.add(user)
    db.commit()
    key = uuid4()
    db.add(
        PlannerCopyRecord(
            user_id=user.id,
            request_key=key,
            source_planner_id="source",
            copy_planner_id="first-copy",
        )
    )
    db.commit()

    with Session(database) as another:
        another.add(
            PlannerCopyRecord(
                user_id=user.id,
                request_key=key,
                source_planner_id="different-source",
                requested_name="다른 요청",
                copy_planner_id="second-copy",
            )
        )
        with pytest.raises(IntegrityError):
            another.commit()
        another.rollback()

    db.expire_all()
    saved = db.get(PlannerCopyRecord, (user.id, key))
    assert saved is not None
    assert (saved.source_planner_id, saved.requested_name, saved.copy_planner_id) == (
        "source",
        None,
        "first-copy",
    )
