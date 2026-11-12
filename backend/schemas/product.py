from typing import Annotated, Literal

from pydantic import BaseModel, Field, StrictInt, StringConstraints, model_validator

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class Rename(BaseModel):
    name: Title


class PlanEdit(BaseModel):
    title: Title
    description: str = Field(default="", max_length=2000)


class PieceEdit(PlanEdit):
    category: Literal["일", "창작", "관계", "휴식"]
    start_month: Annotated[StrictInt, Field(ge=1, le=60)]
    duration: Annotated[StrictInt, Field(ge=1, le=60)]

    @model_validator(mode="after")
    def in_bounds(self):
        if self.start_month + self.duration - 1 > 60:
            raise ValueError("활동은 60개월 안에 있어야 합니다.")
        return self


class RatingEdit(BaseModel):
    scores: list[Annotated[StrictInt, Field(ge=0, le=10)]] = Field(min_length=4, max_length=4)


class GeneratedPlan(PlanEdit):
    kind: Literal["A", "B", "C"]
    description: str = Field(min_length=1, max_length=2000)
    pieces: list[PieceEdit] = Field(min_length=1, max_length=40)


class Generation(BaseModel):
    plans: list[GeneratedPlan] = Field(min_length=3, max_length=3)

    @model_validator(mode="after")
    def unique_kinds(self):
        if {plan.kind for plan in self.plans} != set("ABC"):
            raise ValueError("A/B/C가 하나씩 필요합니다.")
        return self
