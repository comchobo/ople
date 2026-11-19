# syntax=docker/dockerfile:1

FROM ghcr.io/astral-sh/uv:0.13.9 AS uv

FROM python:3.13-slim-trixie

COPY --from=uv /uv /usr/local/bin/uv

ENV UV_LINK_MODE=copy

WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen

COPY backend/ .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
