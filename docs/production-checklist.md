# Production Readiness Checklist

## Infrastructure

- [ ] PostgreSQL 16 with PostGIS, pg_trgm, unaccent, uuid-ossp extensions
- [ ] Redis 7 with password authentication
- [ ] S3-compatible storage with dedicated bucket (`zuzz-media`)
- [ ] SMTP service configured (SendGrid, AWS SES, or equivalent)
- [ ] Reverse proxy (nginx) with TLS termination
- [ ] DNS configured: `zuzz.co.il`, `www.zuzz.co.il`, `admin.zuzz.co.il`
- [ ] SSL certificates provisioned (Let's Encrypt or commercial)

## Environment Variables

All of these must be set in `.env.production`:

| Variable                | Requirement                                             |
| ----------------------- | ------------------------------------------------------- |
| `DATABASE_URL`          | Production PostgreSQL connection string (not localhost) |
| `REDIS_URL`             | Production Redis connection string (not localhost)      |
| `AUTH_SECRET`           | Cryptographically random, 48+ characters                |
| `STORAGE_ENDPOINT`      | Production S3 endpoint                                  |
| `STORAGE_ACCESS_KEY`    | Not `minioadmin`                                        |
| `STORAGE_SECRET_KEY`    | Not `minioadmin`                                        |
| `STORAGE_BUCKET`        | `zuzz-media` (or custom)                                |
| `SMTP_HOST`             | Production SMTP host (not localhost)                    |
| `SMTP_PORT`             | Usually 587                                             |
| `SMTP_USER`             | SMTP credentials                                        |
| `SMTP_PASS`             | SMTP credentials                                        |
| `SMTP_FROM`             | `noreply@zuzz.co.il`                                    |
| `NODE_ENV`              | `production`                                            |
| `RATE_LIMIT_ENABLED`    | `true`                                                  |
| `MAPS_PROVIDER`         | `google` or `mapbox` (not `mock`)                       |
| `MAPS_API_KEY`          | Valid API key                                           |
| `PAYMENT_PROVIDER`      | `stripe` or `tranzilla` (not `sandbox`)                 |
| `PAYMENT_API_KEY`       | Valid API key                                           |
| `SENTRY_DSN`            | Sentry project DSN                                      |
| `LOG_LEVEL`             | `info` or `warn`                                        |
| `NEXT_PUBLIC_APP_URL`   | `https://zuzz.co.il`                                    |
| `NEXT_PUBLIC_API_URL`   | `https://zuzz.co.il/api` or dedicated API domain        |
| `NEXT_PUBLIC_ADMIN_URL` | `https://admin.zuzz.co.il`                              |
| `NEXT_PUBLIC_WS_URL`    | `wss://zuzz.co.il`                                      |

## Security

- [ ] `AUTH_SECRET` is cryptographically random (not a placeholder)
- [ ] `dev-login` endpoint is disabled (automatic in `NODE_ENV=production`)
- [ ] Rate limiting is enabled (`RATE_LIMIT_ENABLED=true`)
- [ ] Redis requires password in production
- [ ] Database credentials are not default values
- [ ] S3 credentials are not default MinIO values
- [ ] Helmet security headers enabled (automatic)
- [ ] CORS origins limited to production domains only
- [ ] Cookie settings use `secure: true` and `sameSite: 'lax'`
- [ ] File upload MIME type validation enabled (automatic)

## Database

- [ ] All migrations applied: `pnpm db:migrate:deploy`
- [ ] Extensions installed: PostGIS, pg_trgm, unaccent, uuid-ossp
- [ ] Database backup cron job configured
- [ ] Backup restoration tested at least once
- [ ] Connection pooling configured (PgBouncer recommended for >50 connections)

## Monitoring & Observability

- [ ] Sentry configured with `SENTRY_DSN`
- [ ] Structured logging verified (JSON format in production)
- [ ] Health endpoint accessible: `/api/health`
- [ ] Readiness endpoint accessible: `/api/health/ready`
- [ ] Log aggregation set up (optional: ELK, Grafana Loki)
- [ ] Uptime monitoring configured (optional: Uptime Robot, Pingdom)

## Pre-Deploy Verification

- [ ] All CI checks pass (lint, typecheck, test, build, e2e)
- [ ] Docker images build successfully
- [ ] Migration dry-run on staging database
- [ ] Environment validation passes: `node -e "require('@zuzz/config').validateConfig()"`

## Post-Deploy Verification

- [ ] `/api/health` returns `{ status: "ok" }` with all services connected
- [ ] `/api/health/ready` returns `{ ready: true }`
- [ ] Web app loads at configured URL
- [ ] Admin app loads at configured URL
- [ ] Auth flow works (register → OTP → login)
- [ ] File upload works
- [ ] Car listing create/publish flow works
- [ ] Search returns results
- [ ] WebSocket connection establishes
- [ ] Email delivery verified

## Deferred Items (Not Required for Initial Launch)

These are known gaps that do not block staging/limited-beta but should be addressed before full public launch:

- [ ] Vehicle registry API integration (currently mocked)
- [ ] Real maps provider with API key
- [ ] Real payment provider integration
- [ ] OpenTelemetry tracing
- [ ] Full-text search engine (Typesense/OpenSearch)
- [ ] CDN for static assets and media
- [ ] Horizontal scaling / load balancing
- [ ] Database read replicas
- [ ] Automated backup verification
- [ ] Penetration testing
- [ ] GDPR/privacy compliance review
- [ ] Performance/load testing
