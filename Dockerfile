# syntax=docker/dockerfile:1

# ---- Base: Node + pnpm (version pinned by package.json "packageManager") ----
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./

# ---- Build: full install + TypeScript compile ----
FROM base AS build
RUN pnpm install --frozen-lockfile
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build

# ---- Production dependencies only ----
FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod

# ---- Runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app

# Hosted defaults: Streamable HTTP on all interfaces. Railway injects PORT;
# 8080 matches the mcp.northscore.ca target port.
ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    HOST=0.0.0.0 \
    PORT=8080

# package.json is required at runtime for "type": "module"
COPY --chown=node:node package.json ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

# Non-root user shipped with the official Node image
USER node

EXPOSE 8080

# Used by Docker/compose only — Railway uses the service's healthcheck path
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1

CMD ["node", "dist/index.js"]
