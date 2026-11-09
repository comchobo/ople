# TEMP: 리뉴얼 스켈레톤. 실제 구현 시 교체/삭제.
from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
async def health():
    return {"status": "ok"}
