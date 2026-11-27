#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
slug="wt-$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | tr -d '\n' | sed 's/-$//')"
docker compose -p "$slug" --env-file .env.dev -f compose.dev.yaml -f - up -d --no-deps notebook <<'YAML'
services:
  notebook:
    image: python:3.13-slim-bookworm
    working_dir: /notebook
    command: python -B prototype/server.py
    volumes:
      - ./prototype:/notebook/prototype:ro
      - ./PROTOTYPE.html:/notebook/PROTOTYPE.html:ro
      - ./ople-logo.svg:/notebook/ople-logo.svg:ro
    environment:
      OLLAMA_MODEL: ${OLLAMA_MODEL}
      OLLAMA_API_KEY: ${OLLAMA_API_KEY}
      CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID}
      CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN}
      CLOUDFLARE_STT_MODEL: ${CLOUDFLARE_STT_MODEL}
    ports:
      - '127.0.0.1:${NOTEBOOK_PORT:-4178}:4178'
YAML
