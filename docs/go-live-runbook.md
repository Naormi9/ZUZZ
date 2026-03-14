# Go-Live Runbook

Step-by-step procedure for deploying ZUZZ to production for the first time.

## Prerequisites

Before starting, confirm:

- [ ] All CI checks pass on `main` (lint, typecheck, test, build, e2e, docker)
- [ ] Staging deployment verified with full walkthrough
- [ ] Production infrastructure provisioned (see Production Readiness Checklist)
- [ ] `.env.production` configured from `.env.production.example`
- [ ] SSL certificates ready in `infrastructure/nginx/ssl/`
- [ ] DNS records configured: `zuzz.co.il`, `www.zuzz.co.il`, `admin.zuzz.co.il`
- [ ] Team notified of deployment window

## Phase 1: Pre-Deploy (T-30 minutes)

### 1.1 Tag the release

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "ZUZZ v1.0.0 — Initial production launch"
git push origin v1.0.0
```

### 1.2 Verify Docker images

```bash
# Ensure CI has built and pushed images for latest main
# Check GHCR for images tagged with the commit SHA
```

### 1.3 Final environment check

```bash
# On the production server:
cd /opt/zuzz
cat .env.production | grep -v PASS | grep -v SECRET | grep -v KEY
# Verify all URLs, hosts, and providers are production values
```

## Phase 2: Database Setup (T-15 minutes)

### 2.1 Backup existing database (if any)

```bash
./scripts/pre-deploy-migrate.sh
```

### 2.2 Apply migrations

```bash
pnpm db:migrate:deploy
# or via Docker:
docker compose -f docker-compose.production.yml run --rm migrate
```

### 2.3 Verify migration status

```bash
pnpm db:migrate:status
```

## Phase 3: Deploy (T-0)

### 3.1 Start services

```bash
export GIT_SHA=$(git rev-parse --short HEAD)
docker compose -f docker-compose.production.yml up -d --build
```

### 3.2 Wait for API readiness

```bash
# Script will wait up to 2.5 minutes
for i in $(seq 1 30); do
  if curl -sf http://localhost:4000/api/health/ready > /dev/null 2>&1; then
    echo "API is ready (attempt $i)"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 5
done
```

### 3.3 Verify full health

```bash
curl -s http://localhost:4000/api/health | python3 -m json.tool
# Confirm: database=connected, redis=connected
```

### 3.4 Verify web apps

```bash
curl -s -o /dev/null -w "%{http_code}" https://zuzz.co.il        # → 200
curl -s -o /dev/null -w "%{http_code}" https://admin.zuzz.co.il   # → 200
```

## Phase 4: Smoke Test (T+5 minutes)

### 4.1 Automated smoke test

```bash
./scripts/smoke-test.sh https://zuzz.co.il/api https://zuzz.co.il https://admin.zuzz.co.il
```

### 4.2 Manual verification

- [ ] Register a new user account
- [ ] Receive and verify OTP email
- [ ] Create a car listing with photos
- [ ] Verify listing appears in search
- [ ] Test messaging between two users
- [ ] Verify admin panel accessible
- [ ] Check Sentry is receiving events (trigger a test error if needed)

## Phase 5: First Admin Setup (T+10 minutes)

### 5.1 Create admin user

```bash
# Connect to database and set admin role
docker compose -f docker-compose.production.yml exec api \
  node -e "
    const { prisma } = require('@zuzz/database');
    prisma.user.update({
      where: { email: 'admin@zuzz.co.il' },
      data: { roles: ['user', 'admin'] }
    }).then(() => console.log('Admin role assigned'))
    .catch(e => console.error(e))
    .finally(() => prisma.\$disconnect());
  "
```

### 5.2 Verify admin access

- [ ] Log in as admin at `admin.zuzz.co.il`
- [ ] Verify dashboard loads
- [ ] Verify user management works
- [ ] Verify moderation panel works

## Phase 6: Go Live (T+15 minutes)

### 6.1 Open to traffic

- [ ] Remove maintenance page (if any)
- [ ] Verify DNS propagation complete

### 6.2 Monitor

For the first hour:

- Watch Sentry for errors
- Watch API logs: `docker compose -f docker-compose.production.yml logs -f api`
- Monitor response times via health endpoint
- Watch for rate limiting false positives

## Rollback Procedure

If critical issues found after launch:

### Application rollback

```bash
# Roll back to previous version
git checkout <previous-tag>
docker compose -f docker-compose.production.yml up -d --build

# Verify
curl -sf http://localhost:4000/api/health/ready
```

### Database rollback

```bash
# Restore from pre-migration backup
pnpm db:restore /tmp/zuzz-backups/<backup-file>

# Then redeploy the previous application version
```

### Full rollback

1. Put up maintenance page (update nginx to serve static HTML)
2. Restore database from backup
3. Deploy previous application version
4. Verify health
5. Remove maintenance page

## Post-Launch (Day 1-3)

- [ ] Monitor error rates hourly for first day
- [ ] Review any user-reported issues
- [ ] Verify email delivery working
- [ ] Verify storage/media serving correctly
- [ ] Check database backup cron is running
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
