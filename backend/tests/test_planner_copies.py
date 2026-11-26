from copy import deepcopy
from datetime import UTC, datetime
from uuid import UUID

import pytest
from pydantic import ValidationError
from sqlmodel import Session, select

from models.planner_copies import PlannerCopyRecord
from models.planners import Planner
from models.users import User
from schemas.planner_copies import PlannerCopyErrorCode, PlannerCopyRequest
from schemas.planners import Plans
from services.planner.copies import PlannerCopyError, build_planner_copy, choose_copy_name


@pytest.mark.parametrize(
    ("source_name", "existing_names", "expected"),
    [
        ("원본", ["원본"], "원본(사본)"),
        ("원본", ["원본", "원본(사본)", "원본(사본)(사본)"], "원본(사본)(사본)(사본)"),
        ("원본(사본)", ["원본(사본)"], "원본(사본)(사본)"),
        ("원본", ["원본(사본)(사본)"], "원본(사본)"),
    ],
)
def test_automatic_name_appends_suffix_until_a_free_name(source_name, existing_names, expected):
    before = existing_names.copy()
    assert choose_copy_name(source_name, existing_names) == expected
    assert existing_names == before


@pytest.mark.parametrize("character", ["가", "😀"])
def test_automatic_name_accepts_exactly_100_code_points(character):
    source_name = character * 96
    assert choose_copy_name(source_name, []) == source_name + "(사본)"


@pytest.mark.parametrize("occupied", [False, True])
def test_automatic_name_reports_overflow_without_truncating(occupied):
    source_name = "가" * (96 if occupied else 97)
    existing = [source_name + "(사본)"] if occupied else []
    with pytest.raises(PlannerCopyError) as failed:
        choose_copy_name(source_name, existing)
    assert failed.value.code == PlannerCopyErrorCode.COPY_NAME_TOO_LONG
    assert failed.value.detail == "길이가 초과됩니다."


def test_manual_name_is_trimmed_and_used_without_suffix():
    assert (
        choose_copy_name("원본", ["원본(사본)"], requested_name="  내가 고른 이름  ")
        == "내가 고른 이름"
    )


def test_manual_name_duplicate_is_checked_after_trimming():
    with pytest.raises(PlannerCopyError) as failed:
        choose_copy_name("원본", ["이미 있는 이름"], requested_name="  이미 있는 이름  ")
    assert failed.value.code == PlannerCopyErrorCode.COPY_NAME_EXISTS
    assert failed.value.detail == "이미 있는 이름입니다."


@pytest.mark.parametrize("name", ["", " \t\n"])
def test_manual_empty_name_is_not_treated_as_automatic(name):
    with pytest.raises(ValidationError):
        choose_copy_name("원본", [], requested_name=name)


@pytest.mark.parametrize("character", ["가", "😀"])
def test_manual_name_uses_same_length_limit_as_request_schema(character):
    allowed = character * 100
    assert choose_copy_name("원본", [], requested_name=allowed) == allowed
    with pytest.raises(PlannerCopyError) as failed:
        choose_copy_name("원본", [], requested_name=allowed + character)
    assert failed.value.code == PlannerCopyErrorCode.COPY_NAME_TOO_LONG


def test_copy_preserves_contents_and_issues_new_ids_and_timestamps(plans_data):
    plans = plans_data["plans"]
    plans[0]["scores"] = {"resources": 1, "appeal": 4, "confidence": 7, "coherence": 10}
    plans[1]["pieces"].append(
        {
            "id": "extra-activity",
            "title": "쉬는 시간",
            "description": "휴식 설명",
            "category": "rest",
            "start": 12,
            "duration": 3,
        }
    )
    old_time = datetime(2020, 1, 1, tzinfo=UTC)
    source = Planner(
        user_id="owner",
        name="원본",
        plans=plans,
        created_at=old_time,
        updated_at=old_time,
    )
    before = deepcopy(source.plans)
    original_ids = {piece["id"] for plan in source.plans for piece in plan["pieces"]}

    copied = build_planner_copy(source, PlannerCopyRequest(), ["원본"])
    assert copied.id != source.id
    assert UUID(copied.id).version == 4
    assert copied.user_id == source.user_id
    assert copied.name == "원본(사본)"
    assert copied.created_at == copied.updated_at
    assert copied.created_at > old_time
    assert source.created_at == source.updated_at == old_time
    assert source.plans == before

    copy_ids = [piece["id"] for plan in copied.plans for piece in plan["pieces"]]
    assert original_ids.isdisjoint(copy_ids)
    assert len(copy_ids) == len(set(copy_ids))
    assert all(UUID(piece_id).version == 4 for piece_id in copy_ids)
    assert Plans(plans=copied.plans).model_dump()["plans"] == copied.plans

    restored = deepcopy(copied.plans)
    for original_plan, copied_plan in zip(before, restored, strict=True):
        for original_piece, copied_piece in zip(
            original_plan["pieces"], copied_plan["pieces"], strict=True
        ):
            copied_piece["id"] = original_piece["id"]
    assert restored == before
    assert copied.plans[1]["scores"] == {}


def test_nested_mutations_are_independent_in_both_directions(plans_data):
    plans_data["plans"][0]["scores"] = {
        "resources": 1,
        "appeal": 2,
        "confidence": 3,
        "coherence": 4,
    }
    source = Planner(user_id="owner", name="원본", plans=plans_data["plans"])
    copied = build_planner_copy(source, PlannerCopyRequest(), [])

    copied.plans[0]["scores"]["resources"] = 9
    copied.plans[0]["pieces"][0]["title"] = "사본 활동 수정"
    copied.plans[1]["pieces"].clear()
    assert source.plans[0]["scores"]["resources"] == 1
    assert source.plans[0]["pieces"][0]["title"] == "실험"
    assert len(source.plans[1]["pieces"]) == 1

    source.plans[0]["scores"]["appeal"] = 8
    source.plans[0]["description"] = "원본 설명 수정"
    source.plans[2]["pieces"][0]["description"] = "원본 활동 설명 수정"
    assert copied.plans[0]["scores"]["appeal"] == 2
    assert copied.plans[0]["description"] == "응답 기반 계획"
    assert copied.plans[2]["pieces"][0]["description"] == "작게 시도"


def test_each_copy_gets_independent_planner_and_activity_ids(plans_data):
    source = Planner(user_id="owner", name="원본", plans=plans_data["plans"])
    first = build_planner_copy(source, PlannerCopyRequest(), [])
    second = build_planner_copy(source, PlannerCopyRequest(), [first.name])
    assert second.name == "원본(사본)(사본)"
    first_ids = {first.id} | {p["id"] for plan in first.plans for p in plan["pieces"]}
    second_ids = {second.id} | {p["id"] for plan in second.plans for p in plan["pieces"]}
    assert first_ids.isdisjoint(second_ids)


def test_copy_supports_empty_plans_and_shared_old_ids_between_plans(plans_data):
    plans_data["plans"][1]["pieces"] = []
    plans_data["plans"][2]["pieces"][0]["id"] = plans_data["plans"][0]["pieces"][0]["id"]
    source = Planner(user_id="owner", name="원본", plans=plans_data["plans"])
    copied = build_planner_copy(source, PlannerCopyRequest(), [])
    assert copied.plans[1]["pieces"] == []
    assert copied.plans[0]["pieces"][0]["id"] != copied.plans[2]["pieces"][0]["id"]
    assert Plans(plans=copied.plans).plans[1].pieces == []


def test_manual_name_can_rescue_an_overlong_automatic_name(plans_data):
    source = Planner(user_id="owner", name="가" * 100, plans=plans_data["plans"])
    copied = build_planner_copy(source, PlannerCopyRequest(name="  짧은 이름  "), [])
    assert copied.name == "짧은 이름"


def test_building_copy_does_not_attach_or_save_it_and_persisted_data_is_independent(
    db, database, plans_data
):
    user = User(email="owner@example.com", name="owner")
    db.add(user)
    db.commit()
    source = Planner(user_id=user.id, name="원본", plans=plans_data["plans"])
    db.add(source)
    db.commit()
    original = deepcopy(source.plans)
    source_id = source.id

    copied = build_planner_copy(source, PlannerCopyRequest(), [source.name])
    assert Session.object_session(copied) is None
    assert db.exec(select(Planner)).all() == [source]
    assert db.exec(select(PlannerCopyRecord)).all() == []
    db.add(copied)
    db.commit()
    copy_id = copied.id

    with Session(database) as another:
        saved_copy = another.get(Planner, copy_id)
        assert saved_copy is not None
        changed = deepcopy(saved_copy.plans)
        changed[0]["pieces"][0]["title"] = "사본 수정"
        saved_copy.plans = changed
        another.add(saved_copy)
        another.commit()

    with Session(database) as another:
        saved_source = another.get(Planner, source_id)
        saved_copy = another.get(Planner, copy_id)
        assert saved_source is not None
        assert saved_copy is not None
        assert saved_source.plans == original
        assert saved_copy.plans[0]["pieces"][0]["title"] == "사본 수정"
        another.delete(saved_source)
        another.commit()
        assert another.get(Planner, copy_id) is not None


@pytest.mark.parametrize("favorite", [False, True])
def test_build_copy_clears_favorite_without_changing_source(plans_data, favorite):
    source = Planner(user_id="owner", name="원본", plans=plans_data["plans"], is_favorite=favorite)
    copied = build_planner_copy(source, PlannerCopyRequest(), [source.name])
    assert copied.is_favorite is False
    assert source.is_favorite is favorite
