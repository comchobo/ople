FROM node:24-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "dev", "-H", "0.0.0.0", "-p", "3000"]
