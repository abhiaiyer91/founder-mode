# 🚀 Deployment Guide

This guide covers all deployment options for Founder Mode.

---

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Vercel (Recommended)](#vercel-recommended)
3. [Railway](#railway)
4. [Fly.io](#flyio)
5. [Docker / Self-hosted](#docker--self-hosted)
6. [Static Hosting (Frontend Only)](#static-hosting-frontend-only)
7. [Environment Variables Reference](#environment-variables-reference)

---

## Quick Overview

### What You're Deploying

| Component | Required | Purpose |
|-----------|----------|---------|
| **Frontend** | Yes | React app (Vite build) |
| **API Server** | Optional | AI agents, persistence, OAuth |
| **PostgreSQL** | Optional | Cloud saves, user data |

### Deployment Modes

| Mode | Components | Features |
|------|------------|----------|
| **Static** | Frontend only | Plays offline, localStorage saves |
| **Full Stack** | Frontend + Server + DB | Cloud saves, real AI, GitHub OAuth |

---

## Vercel (Recommended)

The easiest way to deploy the full application.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/founder-mode)

### Manual Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (first time - will prompt for settings)
vercel

# Deploy to production
vercel --prod
```

### Database Setup (Vercel Postgres)

1. Go to your Vercel project dashboard
2. Click **Storage** → **Create Database** → **Postgres**
3. Copy the `DATABASE_URL` to your environment variables
4. Run schema migration:

```bash
# Locally with the production DATABASE_URL
DATABASE_URL=your-vercel-postgres-url pnpm db:push
```

### Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `postgres://...` from Vercel Postgres | For cloud saves |
| `OPENAI_API_KEY` | `sk-...` | For AI features |
| `GITHUB_CLIENT_ID` | OAuth client ID | For GitHub push |
| `GITHUB_CLIENT_SECRET` | OAuth secret | For GitHub push |
| `FRONTEND_URL` | `https://your-app.vercel.app` | For OAuth |
| `NODE_ENV` | `production` | Required |

### API Routes on Vercel

The API runs as Vercel Serverless Functions. Create `/api` directory:

```
api/
├── game/
│   └── saves.ts      # GET/POST game saves
├── agents/
│   └── execute.ts    # AI agent execution
└── oauth/
    └── github.ts     # OAuth flow
```

> **Note**: For full Mastra agent support, you may need a separate backend on Railway/Fly.io.

---

## Railway

Great for full-stack deployment with easy database provisioning.

### Quick Start

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Link to existing repo
railway link

# Add PostgreSQL
railway add --database postgres

# Deploy
railway up
```

### Configuration

Railway auto-detects the project type. For explicit config:

**railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm preview --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### For Full Stack (Frontend + Backend)

Create two services:

**1. Frontend Service**
```json
{
  "build": {
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm preview --host 0.0.0.0 --port $PORT"
  }
}
```

**2. Backend Service**
```json
{
  "build": {
    "buildCommand": "pnpm install && pnpm build:server"
  },
  "deploy": {
    "startCommand": "pnpm start:server"
  }
}
```

### Environment Variables

Set in Railway Dashboard → Variables:

```bash
# PostgreSQL (auto-set if you add Railway Postgres)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# API Server
PORT=3001
NODE_ENV=production
VITE_API_URL=https://your-backend.railway.app

# AI & OAuth
OPENAI_API_KEY=sk-...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
FRONTEND_URL=https://your-frontend.railway.app
```

---

## Fly.io

Great for low-latency global deployment.

### Quick Start

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (interactive setup)
fly launch

# Deploy
fly deploy
```

### Configuration

**fly.toml**
```toml
app = "founder-mode"
primary_region = "sjc"

[build]
  [build.args]
    NODE_VERSION = "20"

[http_service]
  internal_port = 5173
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

### Add PostgreSQL

```bash
# Create Postgres cluster
fly postgres create --name founder-mode-db

# Attach to your app
fly postgres attach founder-mode-db

# This sets DATABASE_URL automatically
```

### Set Secrets

```bash
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set GITHUB_CLIENT_ID=...
fly secrets set GITHUB_CLIENT_SECRET=...
fly secrets set FRONTEND_URL=https://founder-mode.fly.dev
```

---

## Docker / Self-hosted

For maximum control on your own infrastructure.

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4173
ENV NODE_ENV=production

CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "4173"]
```

### Docker Compose (Full Stack)

**docker-compose.prod.yml**
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "4173:4173"
    environment:
      - VITE_API_URL=http://api:3001
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: Dockerfile.server
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgres://founder:founder123@postgres:5432/founder_mode
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=founder
      - POSTGRES_PASSWORD=founder123
      - POSTGRES_DB=founder_mode

volumes:
  postgres_data:
```

### Build and Run

```bash
# Build
docker compose -f docker-compose.prod.yml build

# Run
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Kubernetes (Helm)

For enterprise deployments, a Helm chart is available:

```bash
helm repo add founder-mode https://charts.founder-mode.dev
helm install founder-mode founder-mode/founder-mode \
  --set postgres.enabled=true \
  --set openai.apiKey=$OPENAI_API_KEY
```

---

## Static Hosting (Frontend Only)

The simplest deployment - works with any static file host.

### Build

```bash
pnpm build
# Output: dist/
```

### Hosting Options

**Vercel**
```bash
vercel --prod
```

**Netlify**
```bash
netlify deploy --prod --dir=dist
```

**GitHub Pages**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Cloudflare Pages**
```bash
# Wrangler CLI
npx wrangler pages deploy dist
```

**AWS S3 + CloudFront**
```bash
# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |

### Database (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |

### AI (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

### GitHub OAuth (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_CLIENT_ID` | OAuth app client ID | `Iv1.abc123` |
| `GITHUB_CLIENT_SECRET` | OAuth app secret | `secret123` |
| `FRONTEND_URL` | Your app's URL | `https://app.example.com` |

### Server

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `VITE_API_URL` | API server URL | `http://localhost:3001` |

---

## Troubleshooting

### Build Fails

```bash
# Clear caches
rm -rf node_modules dist
pnpm install
pnpm build
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Push schema
DATABASE_URL=$DATABASE_URL pnpm db:push
```

### OAuth Not Working

1. Verify `FRONTEND_URL` matches your actual domain
2. Check GitHub OAuth app callback URL matches
3. Ensure HTTPS is used in production

### Large Bundle Size Warning

The Phaser library is large (~3.8MB). This is expected. Consider:
- Enable compression (gzip/brotli)
- Use CDN for caching
- Load Campus view lazily

---

## Performance Tips

1. **Enable Compression**: Most hosts do this automatically
2. **Use a CDN**: CloudFront, Cloudflare, or Vercel Edge
3. **Database Connection Pooling**: Use `?pgbouncer=true` for Supabase
4. **Cache Static Assets**: Vite adds hashes for cache busting

---

## Support

- 📚 [Documentation](https://docs.founder-mode.dev)
- 💬 [Discord](https://discord.gg/founder-mode)
- 🐛 [Issues](https://github.com/your-username/founder-mode/issues)
