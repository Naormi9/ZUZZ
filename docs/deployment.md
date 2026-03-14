# Deployment Guide

## Deployment Architecture

ZUZZ deploys three applications, each as a Docker container:

| Component | Image | Port | Description |
|-----------|-------|------|-------------|
| API | `zuzz-api` | 4000 | Express + Socket.IO backend |
| Web | `zuzz-web` | 3000 | Next.js public marketplace |
| Admin | `zuzz-admin` | 3001 | Next.js admin backoffice |

Dependencies:
- PostgreSQL 16 with PostGIS
- Redis 7
- S3-compatible object storage (MinIO for dev, any S3 for production)

## Environment Variables

See `.env.example` for the full list. Critical production variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `AUTH_SECRET` | Yes | Min 32 chars, no placeholder values |
| `STORAGE_ENDPOINT` | Yes | S3-compatible endpoint |
| `STORAGE_ACCESS_KEY` | Yes | Not `minioadmin` in production |
| `STORAGE_SECRET_KEY` | Yes | Not `minioadmin` in production |
| `NODE_ENV` | Yes | Must be `production` |
| `RATE_LIMIT_ENABLED` | Recommended | Set `true` for production |
| `SENTRY_DSN` | Recommended | Error tracking |

The `@zuzz/config` package validates environment on startup. If critical vars are missing or unsafe defaults are detected in production, the app will fail to start with a clear error.

## Build Process

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Generate Prisma client
pnpm db:generate

# Build all apps and packages
pnpm build
```

## Database Migrations

```bash
# Check pending migrations
pnpm db:migrate:status

# Apply pending migrations (production-safe, non-destructive)
pnpm db:migrate:deploy

# Never use db:push in production — it can be destructive
```

Always run migrations BEFORE deploying new application code.

## Docker Build

Each app has a `Dockerfile` in its directory. The CI pipeline builds and pushes images to GHCR on merge to `main` or `develop`.

```bash
# Local Docker build
docker build -f apps/api/Dockerfile -t zuzz-api .
docker build -f apps/web/Dockerfile -t zuzz-web .
docker build -f apps/admin/Dockerfile -t zuzz-admin .
```

## Health Checks

| Endpoint | Purpose | Expected |
|----------|---------|----------|
| `GET /api/health/live` | Liveness probe | `200 { status: "ok" }` |
| `GET /api/health` | Full health (DB + Redis) | `200` or `503` |
| `GET /api/health/ready` | Readiness probe | `200 { ready: true }` |

Use `/api/health/live` for container liveness checks.
Use `/api/health/ready` for load balancer readiness checks.

## Deployment Checklist

### Pre-deploy
- [ ] All CI checks pass (lint, typecheck, test, build, e2e)
- [ ] Database migrations applied
- [ ] Environment variables set (especially `AUTH_SECRET`, `STORAGE_*`, `NODE_ENV=production`)
- [ ] `RATE_LIMIT_ENABLED=true`
- [ ] Redis accessible from all app containers
- [ ] S3/storage bucket created and accessible
- [ ] Sentry DSN configured (recommended)

### Post-deploy
- [ ] `/api/health/ready` returns `{ ready: true }`
- [ ] `/api/health` shows all services connected
- [ ] Web app loads at configured URL
- [ ] Admin app loads at configured URL
- [ ] Can complete a dev-login (staging only) or real OTP flow
- [ ] Upload a test image to verify storage works
- [ ] WebSocket connection establishes

## Staging Environment

For staging, use the same Docker images tagged with `staging` (from `develop` branch pushes):

```
ghcr.io/<org>/zuzz-api:staging
ghcr.io/<org>/zuzz-web:staging
ghcr.io/<org>/zuzz-admin:staging
```

Staging can use `NODE_ENV=production` with a staging database to test production behavior.

## Email

Email is wired via `@zuzz/email` with SMTP support. When `SMTP_HOST` is set, emails are sent via SMTP (nodemailer). When unset, falls back to console logging (dev only).

For production, set these in your environment:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@zuzz.co.il
```

OTP and welcome emails are automatically sent during auth flows.

## Storage

Upload storage uses the `@zuzz/storage` abstraction. When `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, and `STORAGE_SECRET_KEY` are set, uploads go to S3/MinIO. When unset, falls back to local filesystem (`uploads/` directory).

Media files are stored under `listings/{listingId}/media/` keys. Documents use `listings/{listingId}/documents/`.

## Known Deferred Items

- Vehicle registry API integration is mocked
- Maps provider defaults to mock
- Payment provider defaults to sandbox
- OpenTelemetry tracing is prepared but not yet enabled
- Full-text search uses PostgreSQL `ILIKE`; Typesense/OpenSearch planned
