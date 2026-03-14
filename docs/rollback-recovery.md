# Rollback & Recovery Guide

## Decision Tree

```
Is the issue critical (data loss, security, complete outage)?
├── YES → Full rollback (see below)
└── NO → Can it be fixed forward?
    ├── YES → Deploy a hotfix
    └── NO → Application rollback (see below)
```

## Application Rollback (No DB Changes)

When the issue is in application code and no migration was applied:

```bash
cd /opt/zuzz

# 1. Check which version is currently deployed
docker compose -f docker-compose.production.yml exec api \
  sh -c 'echo $GIT_SHA'

# 2. Roll back to previous version
git checkout <previous-tag-or-commit>
export GIT_SHA=$(git rev-parse --short HEAD)
docker compose -f docker-compose.production.yml up -d --build

# 3. Verify
curl -sf http://localhost:4000/api/health/ready
curl -sf http://localhost:4000/api/health | python3 -m json.tool
```

## Database Migration Rollback

Prisma does not support automatic rollback. Options:

### Option A: Restore from backup

```bash
# 1. Stop the API to prevent writes
docker compose -f docker-compose.production.yml stop api web admin

# 2. Restore from pre-migration backup
pnpm db:restore /tmp/zuzz-backups/<pre-migration-backup>.dump.gz

# 3. Deploy the previous application version
git checkout <previous-tag>
export GIT_SHA=$(git rev-parse --short HEAD)
docker compose -f docker-compose.production.yml up -d --build

# 4. Verify
curl -sf http://localhost:4000/api/health/ready
```

### Option B: Create reverse migration

For simple migrations (added column/table), create a new migration that reverses it:

```bash
# 1. Write a reverse SQL script
cat > packages/database/prisma/migrations/<timestamp>_undo_<name>/migration.sql << 'SQL'
-- Reverse of the problematic migration
ALTER TABLE "SomeTable" DROP COLUMN IF EXISTS "newColumn";
SQL

# 2. Apply
pnpm db:migrate:deploy

# 3. Deploy the previous application version
```

### Option C: Manual SQL fix

For targeted fixes, connect directly:

```bash
docker compose -f docker-compose.production.yml exec postgres \
  psql -U zuzz -d zuzz_prod
```

## Full Rollback (Application + Database)

When both code and data need to be rolled back:

```bash
# 1. Put up maintenance page
# (Update nginx to serve a static maintenance.html)

# 2. Stop all application services
docker compose -f docker-compose.production.yml stop api web admin

# 3. Restore database from backup
pnpm db:restore /tmp/zuzz-backups/<backup-file>.dump.gz

# 4. Deploy previous application version
git checkout <previous-tag>
export GIT_SHA=$(git rev-parse --short HEAD)
docker compose -f docker-compose.production.yml up -d --build

# 5. Verify health
curl -sf http://localhost:4000/api/health/ready

# 6. Remove maintenance page
# (Revert nginx config)

# 7. Verify site is working
./scripts/smoke-test.sh
```

## Emergency: API Won't Start

If the API refuses to start after deployment:

```bash
# 1. Check logs
docker compose -f docker-compose.production.yml logs --tail=100 api

# 2. Common causes:
#    - Environment validation failed → fix .env.production
#    - Database not reachable → check postgres container + network
#    - Redis not reachable → check redis container
#    - Port conflict → check nothing else uses port 4000
#    - Prisma schema drift → run migrations

# 3. If env validation fails, the error message indicates which variable
#    Look for: "Environment validation failed" in logs
```

## Emergency: Database Issues

```bash
# Check database connectivity
docker compose -f docker-compose.production.yml exec postgres \
  pg_isready -U zuzz -d zuzz_prod

# Check migration status
pnpm db:migrate:status

# Check database size
docker compose -f docker-compose.production.yml exec postgres \
  psql -U zuzz -d zuzz_prod -c "SELECT pg_size_pretty(pg_database_size('zuzz_prod'));"
```

## Emergency: Redis Issues

```bash
# Check Redis connectivity
docker compose -f docker-compose.production.yml exec redis \
  redis-cli -a "$REDIS_PASSWORD" ping

# Check Redis memory
docker compose -f docker-compose.production.yml exec redis \
  redis-cli -a "$REDIS_PASSWORD" info memory | head -5

# Flush rate limit keys if false positives
docker compose -f docker-compose.production.yml exec redis \
  redis-cli -a "$REDIS_PASSWORD" KEYS "rl:*" | head -20
```

## Backup Schedule

| Action         | Frequency  | Retention | Location           |
| -------------- | ---------- | --------- | ------------------ |
| DB backup      | Daily      | 7 days    | /tmp/zuzz-backups/ |
| DB backup (S3) | Daily      | 30 days   | s3://zuzz-backups/ |
| Pre-migration  | Per deploy | 7 days    | /tmp/zuzz-backups/ |

Set up daily backup cron:

```bash
# Add to crontab on production server
0 3 * * * cd /opt/zuzz && DATABASE_URL="..." pnpm db:backup >> /var/log/zuzz-backup.log 2>&1
```
