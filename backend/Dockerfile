FROM ghcr.io/astral-sh/uv:0.13.9 AS uv

FROM python:3.13-slim-trixie

COPY --from=uv /uv /usr/local/bin/uv

WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
