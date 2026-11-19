from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from sqlmodel import select

from models.generations import Generation
from models.planners import Planner
from models.users import User
from schemas.planners import Plans
from services.common.ownership import owned
from services.planners import generations


def test_ownership_is_enforced(db, plans_data):
    user = User(email="one@example.com", name="one")
    db.add(user)
    db.commit()
    planner = Planner(user_id=user.id, name="계획", plans=plans_data["plans"])
    db.add(planner)
    db.commit()
    assert owned(db, Planner, planner.id, user.id).id == planner.id
    with pytest.raises(HTTPException) as denied:
        owned(db, Planner, planner.id, "other")
    assert denied.value.status_code == 404


def test_generation_failure_retry_and_idempotent_completion(db, database, monkeypatch, plans_data):
    user = User(email="one@example.com", name="one")
    db.add(user)
    db.commit()
    job = Generation(user_id=user.id, payload={"summary": "나의 이야기"})
    db.add(job)
    db.commit()
    monkeypatch.setattr(generations, "engine", database)
    generator = Mock(
        side_effect=[RuntimeError("provider failure"), Plans.model_validate(plans_data)]
    )
    monkeypatch.setattr(generations, "generate_plans", generator)
    failed = generations.run_generation(job.id, user.id)
    assert failed.status == "failed"
    done = generations.run_generation(job.id, user.id)
    assert done.status == "completed" and done.planner_id
    again = generations.run_generation(job.id, user.id)
    assert again.planner_id == done.planner_id
    assert generator.call_count == 2
    assert len(db.exec(select(Planner)).all()) == 1
    with pytest.raises(HTTPException):
        generations.run_generation(job.id, "other")
