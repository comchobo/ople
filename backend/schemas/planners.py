from typing import Annotated, Literal

from pydantic import Field, StringConstraints, model_validator

from schemas.common import StrictModel

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Text = Annotated[str, StringConstraints(max_length=2000)]


class Piece(StrictModel):
    id: str = Field(min_length=1, max_length=100)
    title: Title
    description: Text = ""
    category: Literal["work", "creative", "relation", "rest"]
    start: int = Field(ge=0, le=59, strict=True)
    duration: int = Field(ge=1, le=60, strict=True)

    @model_validator(mode="after")
    def within_horizon(self):
        if self.start + self.duration > 60:
            raise ValueError("활동은 60개월 안에 있어야 합니다.")
        return self


class Scores(StrictModel):
    resources: int = Field(ge=0, le=10, strict=True)
    appeal: int = Field(ge=0, le=10, strict=True)
    confidence: int = Field(ge=0, le=10, strict=True)
    coherence: int = Field(ge=0, le=10, strict=True)


KINDS = ["현재 방향을 발전시키는 계획", "다른 방향을 탐색하는 계획", "원하는 삶에서 출발하는 계획"]


class Plan(StrictModel):
    kind: Title
    title: Title
    description: Text
    scores: Scores | dict = Field(default_factory=dict)
    pieces: list[Piece]

    @model_validator(mode="after")
    def valid_contents(self):
        if isinstance(self.scores, dict) and self.scores:
            raise ValueError("평가에는 네 가지 정수 점수가 필요합니다.")
        ids = [p.id for p in self.pieces]
        if len(ids) != len(set(ids)):
            raise ValueError("활동 ID가 중복되었습니다.")
        return self


class Plans(StrictModel):
    plans: list[Plan] = Field(min_length=3, max_length=3)

    @model_validator(mode="after")
    def kinds(self):
        if [p.kind for p in self.plans] != KINDS:
            raise ValueError("A/B/C 플랜 유형과 순서를 유지해야 합니다.")
        return self


class PlannerUpdate(Plans):
    name: Title
