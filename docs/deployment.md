# Deployment Guide

## Deployment Architecture

ZUZZ deploys three applications, each as a Docker container:

| Component | Image | Port | Description |
|-----------|-------|------|-------------|
| API | `zuzz-api` | 4000 | Express + Socket.IO backend |
| Web | `zuzz-web` | 3000 | Next.js public marketplace |
| Admin | `zuzz-admin` | 3001 | Next.js admin backoffice |

Dependencies:
- PostgreSQL 16 with PostGIS, pg_trgm, unaccent, uuid-ossp
- Redis 7
- S3-compatible object storage (MinIO for dev, any S3 for production)
- SMTP service (MailHog for dev, SendGrid/SES for production)

## Environment Variables

See `.env.example` for the full list. Critical production variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (not localhost in production) |
| `REDIS_URL` | Yes | Redis connection string (not localhost in production) |
| `AUTH_SECRET` | Yes | Min 32 chars, no placeholder values |
| `STORAGE_ENDPOINT` | Yes | S3-compatible endpoint |
| `STORAGE_ACCESS_KEY` | Yes | Not `minioadmin` in production |
| `STORAGE_SECRET_KEY` | Yes | Not `minioadmin` in production |
| `STORAGE_PUBLIC_URL` | Optional | CDN or public URL for stored objects |
| `SMTP_HOST` | Yes | Not `localhost` in production |
| `SMTP_USER` | Prod | SMTP credentials |
| `SMTP_PASS` | Prod | SMTP credentials |
| `NODE_ENV` | Yes | Must be `production` |
| `RATE_LIMIT_ENABLED` | Yes (prod) | Must be `true` in production |
| `SENTRY_DSN` | Recommended | Error tracking |
| `NEXT_PUBLIC_APP_URL` | Yes | Not localhost in production |
| `NEXT_PUBLIC_ADMIN_URL` | Yes | Admin app URL |

The `@zuzz/config` package validates environment **eagerly on API startup**. If critical vars are missing or unsafe defaults are detected in production, the app will **fail to start** with a clear error message.

### Production safety checks

In `NODE_ENV=production`, the config validator rejects:
- Placeholder `AUTH_SECRET` values
- Default `minioadmin` storage credentials
- `MAPS_PROVIDER=mock`
- `PAYMENT_PROVIDER=sandbox`
- `RATE_LIMIT_ENABLED=false`
- `SMTP_HOST=localhost`
- `DATABASE_URL` or `REDIS_URL` pointing to localhost
- `NEXT_PUBLIC_APP_URL` pointing to localhost

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
# Never use db:reset in production — it drops all data
```

### Migration order of operations

1. **Backup** the database before any migration
2. **Check** pending migrations: `pnpm db:migrate:status`
3. **Apply** migrations: `pnpm db:migrate:deploy`
4. **Deploy** new application code
5. **Verify** health: `curl /api/health/ready`

If you have an existing database from `db:push` (no migration history):
```bash
# Mark the initial migration as already applied
cd packages/database && npx prisma migrate resolve --applied 0_init
```

### Rollback guidance

Prisma does not support automatic migration rollback. Options:
1. **Create a new "undo" migration** with the reverse SQL
2. **Restore from backup** using `pnpm db:restore` or `pg_restore`
3. For non-destructive migrations (adding columns/tables), rollback may not be needed

Always test migrations on staging first.

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
| `GET /api/health` | Full health (DB + Redis + timings) | `200` or `503` |
| `GET /api/health/ready` | Readiness probe | `200 { ready: true }` |
| `GET /api/health/startup` | Startup probe | `200 { started: true }` |

- Use `/api/health/live` for container liveness checks
- Use `/api/health/ready` for load balancer readiness and deploy gating
- Use `/api/health/startup` for initial startup verification
- Full health at `/api/health` includes version, uptime, git SHA, and dependency timings

## Deploy Scripts

```bash
# Full deployment (builds, migrates, deploys, health-checks)
./scripts/deploy.sh staging

# Pre-deploy migration with backup
./scripts/pre-deploy-migrate.sh

# Post-deploy smoke test
./scripts/smoke-test.sh [API_URL] [WEB_URL] [ADMIN_URL]
```

## Deployment Checklist

### Pre-deploy
- [ ] All CI checks pass (lint, typecheck, test, build, e2e)
- [ ] Database backup created
- [ ] Database migrations applied
- [ ] Environment variables set and validated
- [ ] `RATE_LIMIT_ENABLED=true`
- [ ] Redis accessible from all app containers
- [ ] S3/storage bucket created and accessible
- [ ] Sentry DSN configured (recommended)

### Post-deploy
- [ ] `/api/health/ready` returns `{ ready: true }`
- [ ] `/api/health` shows all services connected
- [ ] Web app loads at configured URL
- [ ] Admin app loads at configured URL
- [ ] Auth flow works (OTP or dev-login on staging)
- [ ] Upload a test image to verify storage works
- [ ] WebSocket connection establishes
- [ ] Run smoke test: `./scripts/smoke-test.sh`

## Staging Environment

For staging, use the same Docker images tagged with `staging` (from `develop` branch pushes):

```
ghcr.io/<org>/zuzz-api:staging
ghcr.io/<org>/zuzz-web:staging
ghcr.io/<org>/zuzz-admin:staging
```

See `docs/staging-deploy.md` for detailed staging setup instructions.

## Email

Email uses `@zuzz/email` with SMTP support (nodemailer). When `SMTP_HOST` is set, emails are sent via SMTP. When unset, falls back to console logging (dev only).

For production:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@zuzz.co.il
```

## Storage

Upload storage uses the `@zuzz/storage` abstraction. When `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, and `STORAGE_SECRET_KEY` are set, uploads go to S3/MinIO. When unset, falls back to local filesystem (`uploads/` directory).

For production, set `STORAGE_PUBLIC_URL` to point to a CDN or direct S3 URL for serving media.

## Observability

| Feature | Status | Configuration |
|---------|--------|---------------|
| Structured logging (Pino) | Active | `LOG_LEVEL` env var, JSON in production |
| Request correlation IDs | Active | `X-Request-ID` header |
| Sentry error tracking | Ready | Set `SENTRY_DSN` to enable |
| Sensitive data redaction | Active | Auth headers, cookies, passwords redacted from logs |
| OpenTelemetry tracing | Prepared | See `apps/api/src/instrumentation.ts` |

## Known Deferred Items

- Vehicle registry API integration is mocked
- Maps provider defaults to mock (requires real API key for production)
- Payment provider defaults to sandbox (requires real payment integration)
- OpenTelemetry tracing is prepared but not yet activated
- Full-text search uses PostgreSQL `ILIKE`; Typesense/OpenSearch planned
- CDN for static assets not yet configured
- Horizontal scaling not yet tested
