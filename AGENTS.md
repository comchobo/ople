# AGENTS.md

- Always perform development, testing, and debugging inside the `compose.dev.yaml` environment using `docker compose -f compose.dev.yaml --env-file .env.dev`.
- Write every commit and PR title in clear, concise Korean. Never use any prefix.
- When implementing code, add meaningful unit, component, and integration tests that verify behavior, including external API interactions.
- Do not write tests with trivial assertions or tests that merely mirror the implementation.
