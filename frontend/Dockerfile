FROM node:24-alpine

RUN corepack enable

ENV npm_config_store_dir=/root/.local/share/pnpm/store

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=${npm_config_store_dir} \
    pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "dev", "-H", "0.0.0.0", "-p", "3000"]
