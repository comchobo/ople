FROM ghcr.io/astral-sh/uv:python3.13-trixie

WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen

COPY backend/ .

EXPOSE 8000

CMD ["sh", "-ec", "uv run alembic upgrade head && exec uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000"]
