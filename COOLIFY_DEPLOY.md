# EUDR Guardian — VPS Deployment Guide

Two containers on Hostinger Ubuntu 24.04 VPS (IP `187.124.35.209`) with Nginx reverse proxy.

```
Internet
    │
    ▼
Nginx (host, port 80/443)
    ├── commerce-agent.zigotrace.com     → localhost:3002  (web container)
    └── api-commerce-agent.zigotrace.com → localhost:3001  (api container)
```

---

## Step 0 — DNS records

In your DNS provider (Hostinger Domains or wherever `zigotrace.com` is managed), add two A records:

| Name | Type | Value |
|---|---|---|
| `commerce-agent` | A | `187.124.35.209` |
| `api-commerce-agent` | A | `187.124.35.209` |

Wait for DNS propagation (usually < 5 min on Hostinger).

---

## Step 1 — SSH into VPS

From Hostinger hPanel → **Terminal** button (top-right), or from your local machine:

```bash
ssh root@187.124.35.209
```

---

## Step 2 — Install Docker + Docker Compose

```bash
# Update packages
apt-get update && apt-get upgrade -y

# Install Docker (official script)
curl -fsSL https://get.docker.com | sh

# Verify
docker --version
docker compose version
```

---

## Step 3 — Install Nginx + Certbot

```bash
apt-get install -y nginx certbot python3-certbot-nginx
```

---

## Step 4 — Clone the repo

```bash
cd /opt
git clone https://github.com/Davedave001/zigotrace-commerce-agent.git
cd zigotrace-commerce-agent
```

---

## Step 5 — Create the .env file

```bash
cp .env.example .env
nano .env
```

Fill in every value:

```env
# Hedera
HEDERA_OPERATOR_ID=0.0.XXXXX
HEDERA_OPERATOR_KEY=302e...
HEDERA_NETWORK=testnet
HCS_EUDR_TOPIC_ID=0.0.XXXXX

# Specialist agent accounts (can all be same account for testing)
GEOLOCATION_ACCOUNT=0.0.XXXXX
DEFORESTATION_ACCOUNT=0.0.XXXXX
AGRONOMY_ACCOUNT=0.0.XXXXX
FARM_RECORDS_ACCOUNT=0.0.XXXXX
COUNTERFEIT_ACCOUNT=0.0.XXXXX
COMPLIANCE_ACCOUNT=0.0.XXXXX
REPORT_ACCOUNT=0.0.XXXXX

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Container networking (keep exactly as-is)
INTERNAL_API_URL=http://api:3001

# CORS — set to your UI domain
CORS_ORIGIN=https://commerce-agent.zigotrace.com

# App URL
APP_URL=https://commerce-agent.zigotrace.com
```

Save with `Ctrl+O`, exit with `Ctrl+X`.

---

## Step 6 — Build and start both containers

```bash
docker compose up --build -d
```

This takes 5–10 minutes on first build (installs npm deps, compiles Next.js, runs esbuild).

Check both are running:

```bash
docker compose ps
# Both should show "Up" with a "(healthy)" status after ~30s

# Quick health check
curl http://localhost:3001/health
# → {"status":"ok","service":"eudr-guardian-api"}

curl http://localhost:3002
# → 200 HTML
```

---

## Step 7 — Configure Nginx

Create two virtual host files:

### UI — commerce-agent.zigotrace.com

```bash
nano /etc/nginx/sites-available/commerce-agent.zigotrace.com
```

Paste:

```nginx
server {
    listen 80;
    server_name commerce-agent.zigotrace.com;

    location / {
        proxy_pass         http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE support (agent activity feed)
        proxy_buffering    off;
        proxy_read_timeout 300s;
    }
}
```

### API — api-commerce-agent.zigotrace.com

```bash
nano /etc/nginx/sites-available/api-commerce-agent.zigotrace.com
```

Paste:

```nginx
server {
    listen 80;
    server_name api-commerce-agent.zigotrace.com;

    location / {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE support
        proxy_buffering    off;
        proxy_read_timeout 300s;
    }
}
```

Enable both sites:

```bash
ln -s /etc/nginx/sites-available/commerce-agent.zigotrace.com \
      /etc/nginx/sites-enabled/

ln -s /etc/nginx/sites-available/api-commerce-agent.zigotrace.com \
      /etc/nginx/sites-enabled/

# Test config
nginx -t

# Reload
systemctl reload nginx
```

---

## Step 8 — SSL certificates (HTTPS)

```bash
certbot --nginx \
  -d commerce-agent.zigotrace.com \
  -d api-commerce-agent.zigotrace.com \
  --email omondidavid271@gmail.com \
  --agree-tos \
  --non-interactive
```

Certbot rewrites the Nginx configs automatically to add HTTPS and redirect HTTP → HTTPS.

Test auto-renewal:

```bash
certbot renew --dry-run
```

---

## Step 9 — Verify end-to-end

```bash
# API health via public domain
curl https://api-commerce-agent.zigotrace.com/health
# → {"status":"ok","service":"eudr-guardian-api"}

# ACP service catalog
curl https://api-commerce-agent.zigotrace.com/api/services

# UI
curl -I https://commerce-agent.zigotrace.com
# → HTTP/2 200
```

Open `https://commerce-agent.zigotrace.com` in a browser — you should see the EUDR Guardian dashboard.

---

## Updating the deployment

```bash
cd /opt/zigotrace-commerce-agent
git pull origin master
docker compose up --build -d
```

Docker Compose rebuilds only the changed layers, then does a rolling restart.

---

## Useful commands

```bash
# View live logs from both containers
docker compose logs -f

# View only API logs
docker compose logs -f api

# Restart a single container
docker compose restart api

# Stop everything
docker compose down

# Free disk space from old build layers
docker system prune -f
```

---

## Architecture on the VPS

```
                    ┌─────────────────────────────────────────────┐
                    │  Ubuntu 24.04 VPS (187.124.35.209)          │
                    │                                             │
  :443 ──────────── │  Nginx                                      │
  commerce-agent    │    ├── :3000 ──► web container (Next.js)    │
  .zigotrace.com    │    │                │                       │
                    │    │         INTERNAL_API_URL               │
  :443 ──────────── │    │         http://api:3001                │
  api-commerce-agent│    │                ▼                       │
  .zigotrace.com    │    └── :3001 ──► api container (Express)    │
                    │                   • 7 AI agents             │
                    │                   • Hedera SDK              │
                    │                   • Anthropic SDK           │
                    └─────────────────────────────────────────────┘
```

The web container talks to the api container via the internal Docker network (`http://api:3001`), never via the public domain. This means even if the API domain is hit publicly, SSE streaming from the UI goes web→docker-network→api (fast), not web→internet→api.
