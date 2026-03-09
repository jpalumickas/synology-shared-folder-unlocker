FROM node:25-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy package files first for dependency caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/client/package.json apps/client/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/unlocker/package.json packages/unlocker/package.json
COPY packages/theme/package.json packages/theme/package.json

RUN pnpm install --frozen-lockfile

COPY . .

# Build client (Vite) then server (tsup)
RUN pnpm --filter @synology-shared-folder-unlocker/client build
RUN pnpm --filter @synology-shared-folder-unlocker/server build

# Install production dependencies in a clean directory
RUN mkdir -p /prod/apps/server /prod/packages/config /prod/packages/unlocker && \
    cp package.json pnpm-lock.yaml pnpm-workspace.yaml /prod/ && \
    cp apps/server/package.json /prod/apps/server/ && \
    cp packages/config/package.json /prod/packages/config/ && \
    cp packages/unlocker/package.json /prod/packages/unlocker/ && \
    cd /prod && CI=true pnpm install --frozen-lockfile --prod

# --- Runner ---
FROM node:25-alpine

ARG PUID=1000
ARG PGID=1000

RUN deluser --remove-home node 2>/dev/null; \
    delgroup node 2>/dev/null; \
    addgroup -g "${PGID}" app && \
    adduser -u "${PUID}" -G app -s /bin/sh -D app

WORKDIR /app

# Copy production node_modules (preserving pnpm symlinks)
RUN --mount=from=builder,source=/prod,target=/prod \
    cp -a /prod/node_modules ./node_modules && \
    cp -a /prod/apps ./apps && \
    cp -a /prod/packages ./packages

# Copy built server
COPY --from=builder /app/apps/server/dist/server ./apps/server/dist/server

# Copy built client into the location the server expects
COPY --from=builder /app/apps/client/dist ./apps/server/dist/client

ENV NODE_ENV=production
ENV DATA_PATH=/data
ENV PORT=3001
ENV HOST=0.0.0.0

RUN mkdir -p /data && chown app:app /data

VOLUME /data
EXPOSE 3001

USER app

WORKDIR /app/apps/server

CMD ["node", "dist/server/index.mjs"]
