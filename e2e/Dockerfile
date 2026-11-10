FROM mcr.microsoft.com/playwright:v1.61.1-noble
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
RUN pnpm -C frontend install --frozen-lockfile
COPY frontend/ ./frontend/
COPY e2e/ ./e2e/
COPY prototypes/ ./prototypes/
RUN pnpm -C frontend build
CMD ["pnpm", "test:e2e"]
