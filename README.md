# ZUZZ — המקום שבו עסקאות זזות באמת

A Hebrew-first, RTL-native, trust-centric classifieds and transaction platform for Israel.

## Verticals

- **ZUZZ Cars** (MVP) — Full car marketplace with trust scoring, dealer portal, EV support
- **ZUZZ Homes** — Property listings with map-first discovery
- **ZUZZ Market** — General marketplace with categories

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm + Turborepo |
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Backend | Express + TypeScript |
| Database | PostgreSQL + PostGIS + pg_trgm |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| ORM | Prisma |
| Auth | JWT + Email OTP |
| Realtime | Socket.IO |
| CI | GitHub Actions |

## Quick Start

```bash
# Prerequisites: Node.js >= 20, pnpm >= 10, Docker

cp .env.example .env
pnpm docker:up
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

## Services

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| Admin Panel | http://localhost:3001 |
| API | http://localhost:4000 |
| MailHog | http://localhost:8025 |
| MinIO Console | http://localhost:9001 |

## Commands

```bash
# Development
pnpm dev               # Start all apps
pnpm build             # Build all
pnpm lint              # Lint (ESLint across all packages)
pnpm typecheck         # Type-check all packages
pnpm test              # Run unit/integration tests (vitest)
pnpm test:e2e          # Run Playwright E2E tests
pnpm format            # Format code with Prettier
pnpm format:check      # Check formatting (CI)

# Database
pnpm db:generate       # Generate Prisma client
pnpm db:push           # Push schema to DB (dev only)
pnpm db:migrate:dev    # Create new migration (dev)
pnpm db:migrate:deploy # Apply migrations (staging/production)
pnpm db:migrate:status # Check migration status
pnpm db:seed           # Seed demo data
pnpm db:studio         # Open Prisma Studio

# Infrastructure
pnpm docker:up         # Start PostgreSQL, Redis, MinIO, MailHog
pnpm docker:down       # Stop infrastructure
```

## Project Structure

```
apps/
  web/          — Public marketplace (Next.js)
  admin/        — Admin backoffice (Next.js)
  api/          — Backend API (Express)
packages/
  ui/           — Shared React components
  types/        — TypeScript types
  validation/   — Zod schemas
  config/       — Environment config with Zod validation
  database/     — Prisma schema & client
  logger/       — Structured logging (Pino)
  redis/        — Shared Redis client
  shared-utils/ — Utility functions
  trust-engine/ — Trust scoring system
  storage/      — S3 storage abstraction
  email/        — Email provider abstraction
  search/       — Search provider abstraction
  analytics/    — Event tracking
  feature-flags/— Feature flags
  integrations/ — External service adapters
docs/           — Documentation
e2e/            — Playwright E2E tests
infrastructure/ — Docker configs, scripts
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | System architecture overview |
| [docs/local-setup.md](docs/local-setup.md) | Local development setup guide |
| [docs/deployment.md](docs/deployment.md) | Deployment guide & checklist |
| [docs/runbooks.md](docs/runbooks.md) | Operational runbooks |

## Testing

- **Unit/Integration tests**: `pnpm test` — Uses vitest with mocked Prisma/Redis
- **E2E tests**: `pnpm test:e2e` — Uses Playwright against running web + API
- **Trust engine tests**: `pnpm --filter @zuzz/trust-engine test`

## Security

- JWT-based authentication with email OTP verification
- Role-based access control (user, admin, moderator)
- Redis-backed rate limiting on auth, uploads, messages, leads, reports
- Request correlation IDs for log tracing
- File upload validation (MIME type + extension matching)
- Ownership checks on all user-scoped mutations
- WebSocket room authorization for conversations

## License

Proprietary — All rights reserved.
