# Local Development Setup

## Prerequisites

- Node.js >= 20
- pnpm >= 10
- Docker & Docker Compose

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/zuzz.git
cd zuzz

# 2. Copy environment variables
cp .env.example .env

# 3. Start infrastructure (PostgreSQL, Redis, MinIO, MailHog)
pnpm docker:up

# 4. Install dependencies
pnpm install

# 5. Generate Prisma client
pnpm db:generate

# 6. Push schema to database
pnpm db:push

# 7. Seed demo data
pnpm db:seed

# 8. Start development
pnpm dev
```

## Services

| Service   | URL                     | Purpose          |
|-----------|-------------------------|------------------|
| Web App   | http://localhost:3000    | Public marketplace |
| Admin     | http://localhost:3001    | Backoffice       |
| API       | http://localhost:4000    | Backend API      |
| PostgreSQL| localhost:5432          | Database         |
| Redis     | localhost:6379          | Cache/Queue      |
| MinIO     | http://localhost:9001    | Storage Console  |
| MailHog   | http://localhost:8025    | Email UI         |

## Demo Accounts

| Email                | Role       | Description       |
|----------------------|------------|-------------------|
| admin@zuzz.co.il     | admin      | Admin user        |
| yossi@example.com    | seller     | Private seller    |
| dana@example.com     | seller     | Private seller    |
| buyer@example.com    | buyer      | Buyer             |
| dealer@carzone.co.il | dealer     | Dealer user       |

In development, use the `/api/auth/dev-login` endpoint to bypass OTP:
```bash
curl -X POST http://localhost:4000/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zuzz.co.il"}'
```

## Running Tests

```bash
# Run all unit/integration tests
pnpm test

# Run API tests only
pnpm --filter @zuzz/api test

# Run trust engine tests only
pnpm --filter @zuzz/trust-engine test

# Run E2E tests (requires running services — pnpm dev in another terminal)
pnpm test:e2e

# Run E2E with UI mode
pnpm test:e2e:ui
```

## Linting & Type Checking

```bash
pnpm lint          # ESLint across all packages
pnpm typecheck     # TypeScript checking across all packages
pnpm format        # Auto-format with Prettier
pnpm format:check  # Check formatting (used in CI)
```

## Common Commands

```bash
# Development
pnpm dev           # Start all apps in dev mode
pnpm build         # Build all packages

# Database
pnpm db:generate   # Generate Prisma client after schema changes
pnpm db:push       # Push schema changes (resets data!)
pnpm db:migrate:dev -- --name describe_change  # Create migration
pnpm db:seed       # Seed demo data
pnpm db:studio     # Open Prisma Studio GUI

# Infrastructure
pnpm docker:up     # Start Docker services
pnpm docker:down   # Stop Docker services
```

## Environment Variables

See `.env.example` for the complete list with comments. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://zuzz:zuzz_dev@localhost:5432/zuzz_dev` | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `AUTH_SECRET` | (placeholder) | JWT signing secret (min 32 chars) |
| `STORAGE_ENDPOINT` | `http://localhost:9000` | MinIO/S3 endpoint |
| `RATE_LIMIT_ENABLED` | `false` | Enable Redis-backed rate limiting |
| `LOG_LEVEL` | `debug` | Pino log level |
| `NODE_ENV` | `development` | Environment mode |

## How Uploads Work in Dev

Uploads use the `@zuzz/storage` abstraction layer. In dev, when `STORAGE_ENDPOINT` is set (default in `.env.example`), uploads go to the local MinIO instance. When MinIO is not running and storage env vars are unset, uploads fall back to the local filesystem (`uploads/` directory) served via Express static middleware.

In production, uploads go to S3/MinIO via the same abstraction — no code changes needed.

## How Auth Works in Dev

1. Register or login triggers OTP generation
2. OTP email is sent via MailHog (when `SMTP_HOST=localhost` in `.env`). View at http://localhost:8025
3. If email send fails, OTP code is logged to console as fallback
4. OTP is stored in the database with 10-minute expiry
5. Use dev-login endpoint to skip OTP entirely
6. JWT tokens expire after 7 days

## Troubleshooting

### Database connection fails
Make sure Docker containers are running: `docker compose ps`

### Prisma client not found
Run `pnpm db:generate` to generate the client.

### Port already in use
Check for conflicting processes: `lsof -i :3000` / `lsof -i :4000`

### Tests fail with import errors
Ensure Prisma client is generated: `pnpm db:generate`

### Upload directory missing
The API creates `uploads/` automatically on startup. If permissions are wrong, create it manually: `mkdir -p apps/api/uploads`
