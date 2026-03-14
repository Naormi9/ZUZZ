# Staging Deployment Guide

## What "Staging Ready" Means

The staging environment runs the same Docker images and configuration as production, but with:

- A separate database (non-production data)
- `NODE_ENV=production` (to test production code paths)
- Rate limiting enabled
- Dev-login endpoint disabled (production mode blocks it)
- Sentry DSN optional but recommended

## Prerequisites

- Server with Docker & Docker Compose
- PostgreSQL 16 with PostGIS extensions
- Redis 7
- S3-compatible storage (MinIO is fine for staging)
- SMTP service (or accept console logging for emails)

## Quick Start

```bash
# 1. Clone and enter repo
git clone <repo-url> /opt/zuzz
cd /opt/zuzz
git checkout develop  # or the release branch

# 2. Create environment file
cp .env.example .env.production
# Edit .env.production with staging values (see below)

# 3. Deploy
./scripts/deploy.sh staging
```

## Environment Configuration for Staging

Minimum required `.env.production` for staging:

```env
# Database — use a staging-specific database
DATABASE_URL="postgresql://zuzz:STAGING_PASSWORD@postgres:5432/zuzz_staging"

# Redis
REDIS_URL="redis://redis:6379"

# Auth — generate a real secret: openssl rand -base64 48
AUTH_SECRET="your-staging-secret-at-least-32-characters"

# Storage — can use MinIO for staging
STORAGE_ENDPOINT="http://minio:9000"
STORAGE_ACCESS_KEY="staging-access-key"
STORAGE_SECRET_KEY="staging-secret-key"
STORAGE_BUCKET="zuzz-media"

# Email — use real SMTP or accept console logging
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_FROM="noreply@staging.zuzz.co.il"

# App URLs — use staging domain or IP
API_URL="http://your-staging-host:4000"
NEXT_PUBLIC_API_URL="http://your-staging-host:4000"
NEXT_PUBLIC_APP_URL="http://your-staging-host:3000"
NEXT_PUBLIC_ADMIN_URL="http://your-staging-host:3001"
NEXT_PUBLIC_WS_URL="ws://your-staging-host:4000"

# Production mode
NODE_ENV="production"
RATE_LIMIT_ENABLED="true"
LOG_LEVEL="info"

# Maps/payments — mock/sandbox is OK for staging
MAPS_PROVIDER="mock"
PAYMENT_PROVIDER="sandbox"
```

**Note:** The config validator will reject `MAPS_PROVIDER=mock` and `PAYMENT_PROVIDER=sandbox` in `NODE_ENV=production`. For staging, you have two options:

1. Use `NODE_ENV=production` and set real provider values (recommended for production-parity testing)
2. Temporarily relax the validation for staging (not recommended)

For staging, consider keeping `NODE_ENV=production` but setting `MAPS_PROVIDER=google` with a dev API key.

## Deploy Order

1. **Infrastructure** — PostgreSQL, Redis, MinIO must be running and healthy
2. **Migrations** — `docker compose -f docker-compose.production.yml run --rm migrate`
3. **API** — Start and wait for `/api/health/ready` to return 200
4. **Web** — Start after API is healthy
5. **Admin** — Start after API is healthy
6. **Nginx** — Start after all apps are up

The `docker-compose.production.yml` enforces this order via `depends_on` conditions.

## Post-Deploy Verification

```bash
# Health check
curl http://your-staging-host:4000/api/health | jq .

# Readiness check
curl http://your-staging-host:4000/api/health/ready

# Smoke test (if available)
./scripts/smoke-test.sh http://your-staging-host:4000
```

## Seeding Staging Data

For initial staging setup, you may want demo data:

```bash
# Run seed ONLY on first deploy or after a database reset
docker compose -f docker-compose.production.yml run --rm \
  -e DATABASE_URL="postgresql://..." \
  api npx tsx packages/database/prisma/seed.ts
```

**Warning:** Do not run seed on a database with real data.

## Monitoring

- **Logs:** `docker compose -f docker-compose.production.yml logs -f api`
- **Health:** `curl http://localhost:4000/api/health`
- **Sentry:** Configure `SENTRY_DSN` in `.env.production` for error tracking

## Rollback

If a deploy fails:

```bash
# 1. Roll back to previous images
docker compose -f docker-compose.production.yml down
git checkout <previous-tag-or-commit>
docker compose -f docker-compose.production.yml up -d

# 2. If a migration caused the issue, see docs/runbooks/migration-rollback.md
```

**Important:** Prisma does not support automatic migration rollback. If a migration must be reversed, you need to create a new "undo" migration or restore from backup. Always backup before deploying schema changes.

## Updating Staging

```bash
cd /opt/zuzz
git pull origin develop
./scripts/deploy.sh staging
```
