# ---- Stage 1: install deps ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY .npmrc ./
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ap2/package.json ./packages/ap2/
COPY packages/acp/package.json ./packages/acp/
COPY packages/mpp/package.json ./packages/mpp/

RUN npm ci --legacy-peer-deps

# ---- Stage 2: bundle ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Bundle entire API + workspace packages into one file with esbuild
RUN node_modules/.bin/esbuild apps/api/src/server.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outfile=apps/api/dist/server.mjs \
  --external:@hashgraph/sdk \
  --external:@anthropic-ai/sdk \
  --loader:.ts=ts

# ---- Stage 3: production runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only the bundle + heavy native deps that can't be bundled
COPY --from=builder /app/apps/api/dist/server.mjs ./server.mjs
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "server.mjs"]
