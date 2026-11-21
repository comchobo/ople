# AGENTS.md

- Add content to this file only when the agent harness cannot verify it.
- Always perform development, testing, and debugging inside the `compose.dev.yaml` environment.
- Optimize Docker images and Compose environments for image size and build time, and do not leave unnecessary layers.
- Write every commit and PR title in clear, concise Korean. Never use any prefix.
- Never force-push (`git push --force`, `--force-with-lease`) to any branch.
- When implementing code, add meaningful unit, component, and integration tests that verify behavior, including external API interactions.
- Do not write tests with trivial assertions or tests that merely mirror the implementation.
- Give each module, function, and component one responsibility and one reason to change.
- Do not add new architectural layers without the user's explicit request.

## Backend

- Keep `utils/` domain-agnostic.

## Frontend

- Keep `lib/` domain-agnostic.
- Keep `components/` for React component modules and their tests.
- Always use TailwindCSS for styling.
- When making UI changes, attach screenshots to the PR body.
