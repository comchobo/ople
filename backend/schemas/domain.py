from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, model_validator

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Text = Annotated[str, StringConstraints(max_length=2000)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


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


class Credentials(StrictModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class Verify(StrictModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")


class Question(StrictModel):
    question: str = Field(min_length=1, max_length=1000)


class Summary(StrictModel):
    summary: str = Field(min_length=1, max_length=8000)


class Answer(StrictModel):
    question: str = Field(min_length=1, max_length=1000)
    answer: str = Field(min_length=1, max_length=12000)
    recording_id: str


class Interview(StrictModel):
    interview_id: str = Field(min_length=1, max_length=100)
    answers: list[Answer] = Field(max_length=10)


class Generate(Interview):
    summary: str = Field(min_length=1, max_length=8000)

    @model_validator(mode="after")
    def complete(self):
        if len(self.answers) != 10:
            raise ValueError("10개의 답변이 필요합니다.")
        return self
