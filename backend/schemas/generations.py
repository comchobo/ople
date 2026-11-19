from pydantic import Field, model_validator

from schemas.interviews import Interview


class Generate(Interview):
    summary: str = Field(min_length=1, max_length=8000)

    @model_validator(mode="after")
    def complete(self):
        if len(self.answers) != 10:
            raise ValueError("10개의 답변이 필요합니다.")
        return self
