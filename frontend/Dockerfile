FROM node:24-alpine

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

CMD ["pnpm", "dev", "-H", "0.0.0.0", "-p", "3000"]
