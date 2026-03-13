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
pnpm dev           # Start all apps
pnpm build         # Build all
pnpm lint          # Lint
pnpm typecheck     # Type-check
pnpm test          # Run tests
pnpm format        # Format code
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Push schema to DB
pnpm db:seed       # Seed demo data
pnpm db:studio     # Open Prisma Studio
pnpm docker:up     # Start infrastructure
pnpm docker:down   # Stop infrastructure
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
  config/       — Environment config
  database/     — Prisma schema & client
  shared-utils/ — Utility functions
  trust-engine/ — Trust scoring system
  storage/      — S3 storage abstraction
  email/        — Email provider
  search/       — Search provider
  analytics/    — Event tracking
  feature-flags/— Feature flags
  integrations/ — External service adapters
docs/           — Documentation
infrastructure/ — Docker configs, scripts
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed architecture overview.

## Local Setup Guide

See [docs/local-setup.md](docs/local-setup.md) for detailed setup instructions.

## License

Proprietary — All rights reserved.
