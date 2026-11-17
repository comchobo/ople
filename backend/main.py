from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import update
from sqlmodel import col

from db import engine
from models.entities import Generation, now
from routers.api import router
from services.providers import ProviderError
from utils.config import origin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # A terminated API request is retried explicitly; never silently re-run the LLM.
    with engine.begin() as connection:
        connection.execute(
            update(Generation)
            .where(col(Generation.status) == "running")
            .values(
                status="failed",
                error="서버 재시작으로 중단되었습니다. 다시 시도해주세요.",
                updated_at=now(),
            )
        )
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(router)


@app.middleware("http")
async def same_origin(request: Request, call_next):
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        source = request.headers.get("origin")
        if source and source != origin():
            return JSONResponse({"detail": "허용되지 않은 요청입니다."}, status_code=403)
        if request.headers.get("sec-fetch-site") == "cross-site":
            return JSONResponse({"detail": "허용되지 않은 요청입니다."}, status_code=403)
    return await call_next(request)


@app.exception_handler(ProviderError)
async def provider_error(request: Request, exc: ProviderError):
    return JSONResponse({"detail": str(exc)}, status_code=502)


@app.exception_handler(RuntimeError)
async def configuration_error(request: Request, exc: RuntimeError):
    return JSONResponse({"detail": "외부 서비스 설정을 확인해주세요."}, status_code=503)


@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok"}
