import pytest
from pydantic import ValidationError

from schemas.planners import Plans


def test_schema_rejects_overflow_duplicate_ids_and_invalid_scores(plans_data):
    Plans.model_validate(plans_data)
    piece = plans_data["plans"][0]["pieces"][0]
    piece["start"] = 59
    with pytest.raises(ValidationError):
        Plans.model_validate(plans_data)
    piece["start"] = 0
    plans_data["plans"][0]["pieces"].append(piece.copy())
    with pytest.raises(ValidationError):
        Plans.model_validate(plans_data)
    plans_data["plans"][0]["pieces"].pop()
    plans_data["plans"][0]["scores"] = {"resources": 11}
    with pytest.raises(ValidationError):
        Plans.model_validate(plans_data)


def test_activity_count_has_no_unapproved_limit(plans_data):
    piece = plans_data["plans"][0]["pieces"][0]
    plans_data["plans"][0]["pieces"] = [{**piece, "id": f"activity-{i}"} for i in range(201)]
    assert len(Plans.model_validate(plans_data).plans[0].pieces) == 201
