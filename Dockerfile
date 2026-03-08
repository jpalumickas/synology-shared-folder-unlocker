FROM node:25-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy package files first for dependency caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/unlocker/package.json packages/unlocker/package.json
COPY packages/theme/package.json packages/theme/package.json

RUN pnpm install --frozen-lockfile

COPY . .

# Build client (Vite)
RUN pnpm build

# Bundle server with esbuild (inlines workspace packages, externalizes npm deps)
RUN pnpm exec esbuild apps/server/src/server/index.ts \
  --bundle \
  --platform=node \
  --target=node25 \
  --format=esm \
  --outfile=apps/server/dist/server.mjs \
  --external:@hono/node-server \
  --external:hono \
  --external:ssh2

# Install only runtime npm dependencies in a clean directory
RUN mkdir /runtime && cd /runtime && \
    npm init -y > /dev/null 2>&1 && \
    npm install --omit=optional @hono/node-server hono ssh2 > /dev/null 2>&1

# --- Runner ---
FROM node:25-alpine

ARG PUID=1000
ARG PGID=1000

RUN deluser --remove-home node 2>/dev/null; \
    delgroup node 2>/dev/null; \
    addgroup -g "${PGID}" app && \
    adduser -u "${PUID}" -G app -s /bin/sh -D app

WORKDIR /app

COPY --from=builder /runtime/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./dist

ENV NODE_ENV=production
ENV DATA_PATH=/data
ENV PORT=3001

RUN mkdir -p /data && chown app:app /data

VOLUME /data
EXPOSE 3001

USER app

CMD ["node", "dist/server.mjs"]
