# Application implementation

## Run

Copy `.env.example` to the ignored `.env` and configure Google OIDC, Ollama Cloud,
and Cloudflare Workers AI. Never commit `.env` or API credentials.

Run services through Docker Compose. Backend startup applies Alembic migrations
before starting FastAPI. The Google OAuth client must allow the exact
`${APP_ORIGIN}/api/auth/callback` redirect. Local HTTP uses
`SESSION_COOKIE_SECURE=false`; HTTPS deployments use `true`.

The existing Compose DB volume has an explicit shared name. In a worktree use a
local override to replace that mount with a worktree-scoped volume, remove DB and
backend host ports, and publish frontend on a free host port. Run all commands
with the same project name and override. This session uses:

```sh
docker compose -p towering-panda -f compose.yaml -f tmp/compose.worktree.yaml up -d --build
```

`tmp/compose.worktree.yaml` is deliberately local and ignored. Its DB volume is
`towering-panda_towering-panda-db`; audio is `towering-panda_ople-audio-data`.

## Feature entry points and #55 handoff

- `/planners`: account-owned list, rename, confirmed deletion.
- `/planners/[id]`: A/B/C board, inline editors, ratings, timeline gestures.
- `/interviews/new`: recording instructions and interview start.
- `/interviews/[id]`: ten adaptive questions, WAV recording, summary, generation.
- `/tmp/preview/implementation`: **TEMP #55** account/login/logout entry.

The introduction and common header are left to #55. The temporary redirect lives
in `backend/utils/temp_preview.py`. Final UI integration and removal are tracked
in [#70](https://github.com/comchobo/ople/issues/70). Permanent feature styles are
scoped to `frontend/components/planner/feature.module.css`.

Authentication uses opaque hashed PostgreSQL sessions. Read `/api/auth/me` for
account information and the session's CSRF token. Mutations require the matching
`Origin` and `X-CSRF-Token`; client-supplied owner IDs are never used.

## Recording and processing

Recording remains in browser memory until **답변 전송**. Pauses do not contribute
to the duration. At the configurable limit recording pauses without submitting.
Native microphone PCM is encoded as mono 16 kHz PCM WAV (lower source rates are
preserved), keeping a five-minute recording under the default upload limit.

The backend keeps each submitted original and `metadata.json` in
`AUDIO_ARCHIVE_DIR/<submission UUID>/`. Exclusive directory creation reserves the
ID. Any later upload with that ID receives 409, including an incomplete previous
write. A new explicit submission uses a new ID. No file locks are used. There is
no original playback/download/deletion endpoint. App deletion never deletes the
archive; the archive volume must not be removed with `down -v`.

Workers AI transcribes Korean with Whisper Large V3 Turbo. Ollama Cloud generates
contextual questions, grounded summaries, and schema-validated A/B/C plans.
Structured output is validated in the application, rather than relying on Cloud
JSON-schema enforcement. Temporary provider errors and invalid output retry in
the same HTTP request within configured attempt and time limits. Successful STT
is retained if only the next question or summary fails. There is no task queue,
separate Worker, or reprocessing endpoint. After exhausted retries the client
keeps its recording; another explicit submission starts with a new ID.

Confirmed form edits are sent immediately to the server; there is no separate
whole-planner save. Editors preserve failed drafts and support retry. Cancel
does not persist a draft. Timeline gestures save on release, not on every move;
interrupted gestures discard their preview. Ratings persist only on Apply.

## Checks (no browser E2E)

Using the same Compose project/override, run:

```sh
docker compose exec -T backend sh -ec 'uv run ruff check .; uv run ruff format --check .; uv run ty check; uv run pytest tests; uv run lint-imports; uv run alembic check'
docker compose exec -T frontend sh -ec 'pnpm test; pnpm run typecheck; pnpm run check; pnpm run depcruise; pnpm run build'
```

Backend integration tests create and drop isolated PostgreSQL schemas; they do
not clear application tables. Browser E2E is intentionally excluded from this
task; the existing CI browser job is unchanged.

### Mandatory real model verification

```sh
docker compose run --rm --no-deps -e RUN_LIVE_AI=1 backend uv run pytest -s tests/test_live_ai.py
```

This explicitly enabled test makes paid network calls using `.env` credentials.
It submits only the two committed Google FLEURS Korean WAVs (23.28 seconds total)
through the application upload/STT/next-question path. It preserves originals in
the audio volume and checks against stored references. These read-speech clips
are not personal interview answers: ten short, explicitly synthetic text answers
separately exercise all adaptive turns, summary, and A/B/C generation. No second
STT model or full-corpus benchmark is used. Fixture attribution and exact hashes
are in `backend/tests/fixtures/korean/`.

The ordinary test suite skips this paid test. A skipped test is **not** evidence
of actual API verification; task completion requires a successful explicit run
and human inspection of its transcript/grounding evidence. Real Google login
also requires configured credentials and an interactive account authorization;
the nonbrowser suite separately verifies OAuth/state/session contracts.
