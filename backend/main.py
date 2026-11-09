# TEMPORARY scaffold: delete or replace when implementing the product.
from fastapi import FastAPI

app = FastAPI(title="ople")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
