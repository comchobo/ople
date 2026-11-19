# AGENTS.md

- Always perform development, testing, and debugging inside the `compose.dev.yaml` environment.
- Write every commit and PR title in clear, concise Korean. Never use any prefix.
- When implementing code, add meaningful unit, component, and integration tests that verify behavior, including external API interactions.
- Do not write tests with trivial assertions or tests that merely mirror the implementation.
- Give each module, function, and component one responsibility and one reason to change.

## Backend

- Keep `utils/` domain-agnostic.

## Frontend

- Keep `lib/` domain-agnostic.
- Keep `components/` for React component modules and their tests.
