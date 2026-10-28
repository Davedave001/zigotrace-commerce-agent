# ---- Stage 1: install deps ----
FROM node:22-alpine AS deps
WORKDIR /app

COPY .npmrc ./
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ap2/package.json ./packages/ap2/
COPY packages/acp/package.json ./packages/acp/
COPY packages/mpp/package.json ./packages/mpp/

RUN npm ci --legacy-peer-deps

# ---- Stage 2: build ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web

# INTERNAL_API_URL is set at runtime via Docker/Coolify env var.
# Next.js rewrites proxy /api/* → this URL server-side.
# The build does not bake the URL in (rewrites are evaluated at runtime).
ENV NEXT_TELEMETRY_DISABLED=1

RUN cd apps/web && npx next build

# ---- Stage 3: production runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone output includes only the necessary files
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
