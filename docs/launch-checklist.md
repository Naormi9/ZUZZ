# Launch Day Checklist

Step-by-step sequence for deploying ZUZZ to production for the first time.

## Pre-Launch (Day Before)

### 1. Code freeze

- [ ] All launch PRs merged to `main`
- [ ] CI green on `main`: lint, typecheck, test, build, e2e, docker
- [ ] Git tag created: `git tag -a v1.0.0 -m "Initial launch"`

### 2. Infrastructure ready

- [ ] PostgreSQL 16 provisioned with extensions (PostGIS, pg_trgm, unaccent, uuid-ossp)
- [ ] Redis 7 provisioned with password
- [ ] S3 bucket created (`zuzz-media`)
- [ ] SMTP service configured (SendGrid/SES)
- [ ] DNS records live: `zuzz.co.il`, `www.zuzz.co.il`, `admin.zuzz.co.il`
- [ ] SSL certificates provisioned and auto-renewed
- [ ] Nginx reverse proxy configured

### 3. Environment configured

- [ ] `.env.production` populated from `.env.production.example`
- [ ] All variables in `docs/production-checklist.md` set
- [ ] Environment validation passes: API starts without config errors

### 4. Staging verified

- [ ] Full staging deploy successful
- [ ] Smoke test script passes: `./scripts/smoke-test.sh`
- [ ] Manual walkthrough: register → login → create car listing → upload photos → publish → search → find listing

## Launch Day

### 5. Database setup

```bash
# Backup (if migrating from existing staging data)
pnpm db:backup

# Apply migrations
pnpm db:migrate:deploy

# Verify
pnpm db:migrate:status
```

### 6. Deploy

```bash
# Build and start production stack
docker compose -f docker-compose.production.yml up -d --build

# Or use deploy script
./scripts/deploy.sh production
```

### 7. Post-deploy verification (within 5 minutes)

```bash
# Health checks
curl https://zuzz.co.il/api/health/live    # → 200
curl https://zuzz.co.il/api/health/ready   # → { ready: true }
curl https://zuzz.co.il/api/health         # → all services ok

# Web apps load
curl -s -o /dev/null -w "%{http_code}" https://zuzz.co.il         # → 200
curl -s -o /dev/null -w "%{http_code}" https://admin.zuzz.co.il   # → 200

# Full smoke test
./scripts/smoke-test.sh https://zuzz.co.il/api https://zuzz.co.il https://admin.zuzz.co.il
```

### 8. Manual verification

- [ ] Register a new user account
- [ ] Receive and verify OTP email
- [ ] Create a car listing with photos
- [ ] Verify listing appears in search
- [ ] Test messaging between two users
- [ ] Verify admin panel accessible
- [ ] Check Sentry is receiving events (trigger a test error)
- [ ] Verify logs are structured JSON in production

### 9. Go live

- [ ] Remove maintenance page / open to traffic
- [ ] Monitor error rates in Sentry for first hour
- [ ] Monitor API response times via logs
- [ ] Watch for rate limiting false positives

## Rollback Plan

If critical issues found after launch:

1. **Application bug:** Redeploy previous Docker image tag
2. **Database migration issue:** Restore from pre-migration backup (`pnpm db:restore`)
3. **Full rollback:** Put up maintenance page, restore DB backup, deploy previous version

See `docs/rollback-recovery.md` for detailed rollback procedures and `docs/go-live-runbook.md` for the full launch sequence.
