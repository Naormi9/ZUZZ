# Operational Runbooks

## Auth & Sessions

### How authentication works
1. User registers with email via `POST /api/auth/register`
2. OTP code generated and stored in DB (10-minute expiry, max 5 attempts)
3. User verifies OTP via `POST /api/auth/verify`
4. Server returns JWT token (7-day expiry) set as httpOnly cookie + in response body
5. All authenticated requests use the JWT (cookie or `Authorization: Bearer` header)
6. The `authenticate` middleware verifies the JWT AND checks the user is active in the DB
7. Logout clears the cookie client-side; no server-side session invalidation

### Dev login (non-production only)
```bash
curl -X POST http://localhost:4000/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zuzz.co.il"}'
```
This bypasses OTP and returns a JWT directly. Only available when `NODE_ENV !== 'production'`.

### Deactivating a user
Use the admin API:
```bash
PATCH /api/admin/users/:id/toggle-active
```
Deactivated users are blocked at the `authenticate` middleware level. Their existing JWTs become invalid on the next request.

## Uploads & Storage

### How uploads work
1. Client sends multipart form data to `POST /api/upload/listing/:id/media`
2. Multer saves files to local `uploads/` directory with sanitized filenames
3. File metadata stored in `ListingMedia` or `ListingDocument` table
4. Files served via Express static middleware at `/uploads/<filename>`

### Storage architecture
The `@zuzz/storage` package provides an abstraction with two providers:
- `local`: Writes to local filesystem (used in dev)
- `s3`: Uses S3-compatible storage (MinIO in dev, real S3 in production)

Currently, the upload route uses Multer's local disk storage directly. For production, this should be migrated to use the storage abstraction's S3 provider.

### File validation
- Images: JPEG, PNG, WebP only
- Documents: JPEG, PNG, WebP, PDF
- Max size: 10MB per file
- Max media per listing: 20
- Filenames sanitized to prevent path traversal
- MIME type AND file extension must match

## WebSocket / Realtime

### How realtime works
1. Client connects to Socket.IO with JWT in `handshake.auth.token`
2. Authenticated users auto-join `user:<userId>` room
3. To join a conversation, client emits `join:conversation` with conversation ID
4. Server verifies the user is a participant (buyer or listing owner) before allowing join
5. Typing events only work within rooms the user has joined
6. Messages/notifications pushed via server to user rooms

### Debugging WebSocket issues
- Check `/api/health` to verify Redis is connected (Socket.IO uses Redis adapter if configured)
- Verify the CORS origins include the client URL
- Check client-side token is being passed in `handshake.auth.token`

## Database

### Reset and reseed (dev only)
```bash
pnpm db:push     # Reset schema (destructive! NEVER in staging/production)
pnpm db:seed     # Seed demo data (dev/staging first setup only)
```

**WARNING:** `db:push` and `db:reset` are destructive. They drop and recreate tables. Never use them on staging or production databases.

### Create a new migration (dev)
```bash
pnpm db:migrate:dev -- --name describe_the_change
```

### Apply migrations (staging/production)
```bash
# Safe pre-deploy migration with backup
./scripts/pre-deploy-migrate.sh

# Or manually:
pnpm db:migrate:status    # Check what's pending
pnpm db:migrate:deploy    # Apply pending migrations
```

### Migration order for deploys
1. Create database backup: `pnpm db:backup`
2. Check pending migrations: `pnpm db:migrate:status`
3. Apply migrations: `pnpm db:migrate:deploy`
4. Deploy new application code
5. Verify health: `curl /api/health/ready`

### Resolving migration for existing db:push databases
If your database was created with `db:push` (no migration history):
```bash
cd packages/database
npx prisma migrate resolve --applied 0_init
```
This marks the initial migration as applied without re-running it.

### Rollback guidance
Prisma does not support automatic rollback. Options:
1. **New undo migration:** Create a migration that reverses the changes
2. **Restore from backup:** `pnpm db:restore` (restores from latest backup)
3. **Manual SQL:** Connect to the database and apply reverse DDL manually
4. For additive migrations (new columns/tables), you may not need rollback

Always test migrations on staging before production.

### Backup/restore
```bash
pnpm db:backup    # Creates pg_dump (supports S3 upload if S3_BUCKET is set)
pnpm db:restore   # Restores from latest backup
```

## Testing

### Run all tests
```bash
pnpm test
```

### Run API tests only
```bash
pnpm --filter @zuzz/api test
```

### Run E2E tests (requires running services)
```bash
pnpm test:e2e
```

### Run tests in watch mode (development)
```bash
cd apps/api && pnpm vitest
```

## Rate Limiting

Rate limiting is Redis-backed and controlled by `RATE_LIMIT_ENABLED`.

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| Global (all routes) | 200/min | 1 min |
| `/api/auth/*` | 10/min | 1 min |
| `/api/upload/*` | 20/min | 1 min |
| `/api/messages/*` | 30/min | 1 min |
| `/api/leads/*` | 15/min | 1 min |
| Listing reports | 5/min | 1 min |

Rate limited responses return `429` with Hebrew error message.

## Observability

### Structured logging
All API logs use Pino (structured JSON in production, pretty-printed in development).
Log level controlled by `LOG_LEVEL` env var.
Sensitive data (auth headers, cookies, passwords, tokens) is automatically redacted from logs.

### Request correlation
Every request gets a unique `X-Request-ID` header (generated or forwarded from load balancer).
This ID appears in all log entries for that request.

### Error tracking
Sentry is initialized when `SENTRY_DSN` is set. All 5xx errors and unhandled exceptions are captured.
The error handler at `apps/api/src/middleware/error-handler.ts` sends exceptions to Sentry automatically.

### OpenTelemetry (prepared, not yet active)
The instrumentation scaffold is at `apps/api/src/instrumentation.ts`.
To enable:
1. Install OTEL packages (see comments in the file)
2. Set `OTEL_EXPORTER_OTLP_ENDPOINT` in environment
3. Uncomment the initialization code

### Key log contexts
- `api:auth` — Login/register/OTP events
- `api:upload` — File upload/delete events
- `api:websocket` — WebSocket connection/room events
- `api:error` — Error handler events

## Deployment Operations

### Full deploy
```bash
./scripts/deploy.sh staging    # or production
```

### Smoke test after deploy
```bash
./scripts/smoke-test.sh [API_URL] [WEB_URL] [ADMIN_URL]
```

### Rolling back a deploy
1. If migration was the issue, restore from pre-migration backup
2. If application code was the issue:
   ```bash
   git checkout <previous-tag-or-commit>
   docker compose -f docker-compose.production.yml up -d --build
   ```
3. Verify with health check: `curl /api/health/ready`

### Checking deployment health
```bash
# Quick check
curl http://localhost:4000/api/health/ready

# Full status with timings
curl http://localhost:4000/api/health | python3 -m json.tool

# View API logs
docker compose -f docker-compose.production.yml logs -f api

# View all service status
docker compose -f docker-compose.production.yml ps
```

### Emergency: API not starting
1. Check logs: `docker compose -f docker-compose.production.yml logs api`
2. Common causes:
   - Environment validation failed (check .env.production)
   - Database not reachable
   - Redis not reachable
   - Port conflict
3. If env validation fails, the error message will indicate which variable is wrong

### Graceful shutdown
The API handles `SIGTERM` and `SIGINT` with a graceful shutdown sequence:
1. Stops accepting new connections
2. Closes WebSocket connections
3. Disconnects from PostgreSQL
4. Disconnects from Redis
5. Force-exits after 15 seconds if shutdown hangs
