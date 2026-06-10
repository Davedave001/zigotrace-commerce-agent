# EUDR Guardian — Coolify Deployment Guide

Deploy two containers on Hostinger VPS using Coolify's Docker Compose stack.

---

## Prerequisites

- Hostinger VPS with Coolify installed ([coolify.io/docs](https://coolify.io/docs/installation))
- Domain or subdomain pointed at the VPS IP
- Hedera testnet account IDs + operator private key
- Anthropic API key

---

## Step 1 — Create a new Coolify project

1. Open Coolify dashboard → **Projects** → **New Project**
2. Name it `eudr-guardian`

---

## Step 2 — Add a Docker Compose resource

1. In the project → **New Resource** → **Docker Compose**
2. Source: **Git Repository**
3. Repository: `https://github.com/Davedave001/zigotrace-commerce-agent`
4. Branch: `master`
5. Compose file path: `docker-compose.yml`
6. Click **Save**

---

## Step 3 — Set environment variables

In the Coolify resource → **Environment Variables**, add every variable from `.env.example`:

| Variable | Value |
|---|---|
| `HEDERA_OPERATOR_ID` | `0.0.XXXXX` — your testnet account |
| `HEDERA_OPERATOR_KEY` | `302e...` — ED25519 private key |
| `HEDERA_NETWORK` | `testnet` |
| `HCS_EUDR_TOPIC_ID` | Run `npx tsx scripts/setup-hedera.ts` locally first |
| `GEOLOCATION_ACCOUNT` | `0.0.XXXXX` |
| `DEFORESTATION_ACCOUNT` | `0.0.XXXXX` |
| `AGRONOMY_ACCOUNT` | `0.0.XXXXX` |
| `FARM_RECORDS_ACCOUNT` | `0.0.XXXXX` |
| `COUNTERFEIT_ACCOUNT` | `0.0.XXXXX` |
| `COMPLIANCE_ACCOUNT` | `0.0.XXXXX` |
| `REPORT_ACCOUNT` | `0.0.XXXXX` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `INTERNAL_API_URL` | `http://api:3001` — keep this exact value |
| `CORS_ORIGIN` | `https://your-domain.com` |
| `APP_URL` | `https://your-domain.com` |

> The 7 specialist accounts can all be the same account for testing. For production each agent should have its own account so the MPP split is visible on the explorer.

---

## Step 4 — Configure the domain

1. Coolify resource → **Domains**
2. Add your domain, e.g. `eudr.yourdomain.com`
3. Coolify auto-provisions a Traefik reverse proxy entry pointing to the `web` container on port 3000
4. The `api` container stays internal — it is never exposed to the internet

---

## Step 5 — Deploy

Click **Deploy**. Coolify will:
1. Pull the repo
2. Build both Docker images (multi-stage — takes 3–5 min first time)
3. Start `api` first (healthcheck: `GET /health`)
4. Start `web` once `api` is healthy
5. Assign your domain via Traefik + auto-SSL (Let's Encrypt)

---

## Verifying the deployment

```bash
# API health (from VPS terminal)
curl http://localhost:3001/health
# → {"status":"ok","service":"eudr-guardian-api"}

# ACP service catalog
curl http://localhost:3001/api/services
# → {"name":"EUDR Guardian","services":[...7 services...]}

# UI
curl https://your-domain.com
# → 200 HTML
```

---

## Container networking diagram

```
Internet
   │
   ▼
Traefik (Coolify managed)
   │
   ▼  port 3000
┌──────────────────────────────┐
│  web container (Next.js)     │
│  GET /api/* → rewrites to    │
│  http://api:3001/api/*       │
└───────────────┬──────────────┘
                │  Docker internal network
                ▼  port 3001 (not exposed)
┌──────────────────────────────┐
│  api container (Express)     │
│  • 7 specialist agents       │
│  • Hedera SDK (HCS + HTS)    │
│  • Anthropic (claude-haiku)  │
│  • MPP HBAR split            │
└──────────────────────────────┘
```

---

## Environment variable notes

**`INTERNAL_API_URL`** must be `http://api:3001` inside Docker Compose because `api` is the service name in `docker-compose.yml`. Next.js reads this at runtime (not build time) to resolve the rewrite destination.

**`CORS_ORIGIN`** should match your public domain exactly, e.g. `https://eudr.yourdomain.com`. The API container rejects cross-origin POST requests from other origins.

---

## Updating the deployment

Push to `master` on GitHub, then in Coolify:
- Click **Redeploy** (or enable **Auto Deploy** on push)

---

## Running locally with Docker Compose

```bash
cp .env.example .env
# Fill in your keys in .env
docker compose up --build
# UI: http://localhost:3000
# API: http://localhost:3001/health  (internal, but exposed for local dev)
```

To expose the API port locally for debugging, temporarily add `ports: ["3001:3001"]` under the `api` service in `docker-compose.yml`.
