FROM ghcr.io/astral-sh/uv:python3.13-trixie-slim

ENV UV_LINK_MODE=copy

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
