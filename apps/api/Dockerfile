# ---- Stage 1: install deps ----
FROM node:22-alpine AS deps
WORKDIR /app

COPY .npmrc ./
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ap2/package.json ./packages/ap2/
COPY packages/acp/package.json ./packages/acp/
COPY packages/mpp/package.json ./packages/mpp/

RUN npm ci --legacy-peer-deps

# ---- Stage 2: bundle ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Bundle entire API + workspace packages into one file with esbuild.
# Must use CJS format — Express and its deps use dynamic require() at runtime,
# which is unsupported when the output format is ESM.
RUN node_modules/.bin/esbuild apps/api/src/server.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=cjs \
  --outfile=apps/api/dist/server.cjs \
  --external:@hashgraph/sdk \
  --external:@anthropic-ai/sdk \
  --loader:.ts=ts

# ---- Stage 3: production runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only the bundle + heavy native deps that can't be bundled
COPY --from=builder /app/apps/api/dist/server.cjs ./server.cjs
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "server.cjs"]
