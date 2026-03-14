# Database Migrations — ZUZZ

## Commands

| Command | Environment | Description |
|---------|-------------|-------------|
| `pnpm db:migrate:dev` | Development | Create and apply new migrations |
| `pnpm db:migrate:deploy` | Production/CI | Apply pending migrations (non-interactive) |
| `pnpm db:migrate:status` | Any | Check migration status |
| `pnpm db:push` | Development only | Push schema without migration (prototyping) |

## Creating a new migration

```bash
# Make your schema changes in prisma/schema.prisma, then:
pnpm db:migrate:dev
# Prisma will prompt for a migration name
```

## Applying migrations in production

Migrations run automatically via the `migrate` service in `docker-compose.production.yml`.
Manual application:

```bash
DATABASE_URL="..." pnpm db:migrate:deploy
```

## Rollback strategy

Prisma does not support down migrations. To rollback:

1. Create a new migration that reverts the schema change
2. Apply it with `pnpm db:migrate:dev --name revert_<original_name>`
3. Deploy the revert migration

## Rules

- **Never** use `db:push` in production
- **Always** review generated SQL before applying
- **Commit** the `prisma/migrations/` directory to git
- **Test** migrations against a staging database first
