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

## Common Commands

```bash
# Development
pnpm dev           # Start all apps in dev mode
pnpm build         # Build all packages
pnpm lint          # Lint all packages
pnpm typecheck     # Type-check all packages
pnpm test          # Run tests

# Database
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Push schema changes
pnpm db:seed       # Seed demo data
pnpm db:studio     # Open Prisma Studio

# Infrastructure
pnpm docker:up     # Start Docker services
pnpm docker:down   # Stop Docker services
```

## Troubleshooting

### Database connection fails
Make sure Docker containers are running: `docker compose ps`

### Prisma client not found
Run `pnpm db:generate` to generate the client.

### Port already in use
Check for conflicting processes: `lsof -i :3000` / `lsof -i :4000`
