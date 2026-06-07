# ═══════════════════════════════════════════════════════════
# TelChurn IQ — Multi-stage Dockerfile
# ═══════════════════════════════════════════════════════════

# ── Shared base with pnpm ──────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Install all workspace dependencies ────────────────────
FROM base AS installer
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY patches/ patches/
# Stub out node_modules first to allow sparse install
RUN pnpm fetch --frozen-lockfile

COPY . .
RUN pnpm install --frozen-lockfile --offline

# ── Build libs (composite packages) ───────────────────────
FROM installer AS lib-builder
RUN pnpm run typecheck:libs

# ── Build API Server ───────────────────────────────────────
FROM lib-builder AS api-builder
RUN pnpm --filter @workspace/api-server run build

# ── API Server production image ────────────────────────────
FROM node:22-alpine AS api
LABEL maintainer="EY Analytics Practice"
LABEL description="TelChurn IQ API Server"

RUN corepack enable
WORKDIR /app

COPY --from=api-builder /app/artifacts/api-server/dist ./dist
COPY --from=api-builder /app/artifacts/api-server/package.json ./package.json
COPY --from=api-builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/healthz || exit 1

CMD ["node", "--enable-source-maps", "dist/index.mjs"]

# ── Build React Dashboard ──────────────────────────────────
FROM lib-builder AS dashboard-builder
ENV VITE_API_URL=/api
RUN pnpm --filter @workspace/telecom-dashboard run build

# ── Dashboard static file server ──────────────────────────
FROM nginx:1.25-alpine AS dashboard
LABEL description="TelChurn IQ Dashboard"

COPY --from=dashboard-builder /app/artifacts/telecom-dashboard/dist /usr/share/nginx/html
COPY nginx/nginx-dashboard.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

# ── Python ETL image ───────────────────────────────────────
FROM python:3.12-slim AS etl
LABEL description="TelChurn IQ ETL Pipeline"

WORKDIR /app

COPY scripts/etl/ ./scripts/etl/
COPY docs/sql/ ./docs/sql/

RUN pip install --no-cache-dir \
    psycopg2-binary==2.9.9 \
    pandas==2.2.2

RUN mkdir -p logs/etl logs/quality logs/runs

ENV PYTHONUNBUFFERED=1

CMD ["python", "scripts/etl/pipeline.py", "--help"]
