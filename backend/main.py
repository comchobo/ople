from fastapi import FastAPI

from routers import auth, interviews, planners
from utils.settings import integer

app = FastAPI()
app.include_router(auth.router)
app.include_router(interviews.router)
app.include_router(planners.router)


@app.middleware("http")
async def private_responses(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/config")
def config():
    return {"recording_max_seconds": integer("RECORDING_MAX_SECONDS", 300)}
