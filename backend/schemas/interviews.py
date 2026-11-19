from pydantic import Field

from schemas.common import StrictModel


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
