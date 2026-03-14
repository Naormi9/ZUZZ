# CLAUDE.md — ZUZZ Repository Memory

## Project identity

ZUZZ is a Hebrew-first, RTL-native, trust-centric classifieds and transaction platform for Israel.

Mission:

- Not just a listings board
- A transaction platform with strong trust infrastructure
- Cars first, then Homes, then Market

Brand line:
ZUZZ — המקום שבו עסקאות זזות באמת

## Product priorities

1. Cars-first depth
2. Shared platform reuse
3. Trust by default
4. Structured listings before free text
5. Transaction completion, not only discovery
6. Mobile-first UX without sacrificing desktop business workflows
7. Hebrew-first and RTL-native everywhere

## Core verticals

### ZUZZ Cars

Most important vertical.
Key ideas:

- Listing by license plate / VIN / manual fallback
- Trust score
- Verified owner / verified dealer badges
- Documents
- EV support
- Search with trust filters
- Inspection / financing / insurance flows
- Dealer portal

### ZUZZ Homes

Second vertical.
Key ideas:

- Map-first discovery
- Verified owner / verified agent / verified developer
- Project pages
- Saved searches and lead forms

### ZUZZ Market

Third vertical.
Key ideas:

- Reuse listing/messaging/moderation/trust framework
- Structured categories
- Lightweight seller trust

## Technical principles

- Monorepo
- Type-safe end to end
- Reusable shared packages
- External providers behind adapters
- Postgres as source of truth
- PostGIS + pg_trgm for search/geography foundations
- Redis for cache/queues/rate limits
- S3-compatible storage abstraction
- Strong docs
- Good tests
- Production-minded architecture

## Packages/modules to preserve

- auth
- users/profiles
- listings
- cars
- homes
- market
- trust-engine
- search
- media
- messages
- leads
- subscriptions
- promotions
- moderation
- admin
- analytics
- cms
- logger (structured logging via Pino)
- redis (shared Redis client)

## Important coding rules

- Avoid hardcoding external vendor logic directly into feature code
- Keep domains modular
- Prefer explicit types
- Prefer Zod validation at boundaries
- Keep UI components reusable
- Maintain RTL correctness
- Use Hebrew-aware formatting for UI
- Never build trust signals as fake cosmetics; back them with actual logic and data states
- Favor clean simple architecture over clever abstractions

## UX rules

- Fast first
- Clear CTA hierarchy
- Strong empty/skeleton/error states
- Draft autosave where relevant
- Sticky filters on mobile
- Listing cards must be highly scannable
- Trust information must be visible above the fold where possible

## Commands

```bash
# Development
pnpm install           # Install all dependencies
pnpm dev               # Start all apps in dev mode
pnpm build             # Build all packages and apps
pnpm lint              # Lint all packages (real ESLint)
pnpm typecheck         # Type-check all packages
pnpm test              # Run all tests (vitest)
pnpm test:e2e          # Run Playwright E2E tests
pnpm format            # Format code with Prettier

# Database
pnpm db:generate       # Generate Prisma client
pnpm db:push           # Push schema to database (dev only! NEVER in production)
pnpm db:migrate:dev    # Create new migration (dev)
pnpm db:migrate:deploy # Apply pending migrations (staging/production)
pnpm db:migrate:status # Check migration status
pnpm db:seed           # Seed demo data (dev only)
pnpm db:studio         # Open Prisma Studio GUI
pnpm db:backup         # Backup PostgreSQL
pnpm db:restore        # Restore PostgreSQL from backup

# Infrastructure
pnpm docker:up         # Start PostgreSQL, Redis, MinIO, MailHog
pnpm docker:down       # Stop Docker services
pnpm docker:prod:up    # Start production stack
pnpm docker:prod:down  # Stop production stack

# Deployment
./scripts/deploy.sh staging         # Full deploy to staging
./scripts/pre-deploy-migrate.sh     # Pre-deploy migration with backup
./scripts/smoke-test.sh             # Post-deploy smoke test
```

## When implementing new features

1. Update plan
2. Check existing domain boundaries
3. Reuse shared types/components if possible
4. Add tests for important business logic
5. Update docs if behavior or commands changed

## If using Claude Code subagents

Prefer focused subagents with narrow responsibilities:

- ui-system
- backend-domain
- search-ranking
- trust-engine
- qa-e2e
- docs-devex

## Security & hardening notes

- Rate limiting is Redis-backed, controlled by `RATE_LIMIT_ENABLED` env var
- Rate limiters exist for: global, auth, upload, messages, leads, reports
- Analytics summary endpoint requires admin/moderator role
- All user-scoped mutations have ownership checks
- WebSocket conversation rooms require membership verification
- Typing events require room membership
- `optionalAuth` verifies user is active in DB (not just token validity)
- Upload route validates MIME type + file extension match
- Media reorder validates all media IDs belong to the listing
- Report endpoint prevents self-reporting and duplicate reports
- Request correlation IDs via `X-Request-ID` header
- Multer file size errors return proper 413 status
- `@zuzz/config` validates environment eagerly on API startup with Zod, rejects unsafe production defaults
- Sensitive data (auth headers, cookies, passwords) redacted from Pino logs
- Production config rejects: placeholder AUTH_SECRET, minioadmin storage creds, localhost URLs, disabled rate limiting, mock providers

## Test coverage

- API tests: auth (19), cars (27), upload (14), health (8), messages (10), leads (8), favorites (4), organizations (15), promotions (7), subscriptions (5)
- Trust engine: unit tests
- E2E: Playwright tests for cars flow
- All tests run via `pnpm test` in CI

## SEO & Growth Architecture

- robots.txt via Next.js route handler (blocks /api, /dashboard, /auth, /create)
- Sitemap with static pages, cars-by-make, cars-by-city, homes-by-city
- Dynamic metadata for car detail pages (make/model/year/price in title)
- Vehicle JSON-LD structured data on car listings
- Organization + WebSite JSON-LD globally
- Canonical URLs on all pages
- noindex on dashboard, auth, create pages and heavily-filtered search pages (3+ filters)
- Open Graph and Twitter Card metadata on all key pages
- Breadcrumbs on car detail and search pages
- Internal linking grid: makes, cities, fuel types on cars pages
- Editorial foundation: buying guide, selling guide, trust page, about page
- Articles API: GET /api/articles, GET /api/articles/:slug
- SEO utility library: apps/web/src/lib/seo.ts, apps/web/src/lib/json-ld.ts
- Full documentation: docs/seo.md

## Documentation

- docs/architecture.md — System architecture
- docs/local-setup.md — Local dev setup
- docs/deployment.md — Deployment guide & checklist
- docs/staging-deploy.md — Staging deployment guide
- docs/production-checklist.md — Production readiness checklist
- docs/runbooks.md — Operational runbooks
- docs/go-live-runbook.md — Step-by-step go-live procedure
- docs/post-deploy-smoke-tests.md — Post-deploy verification checklist
- docs/rollback-recovery.md — Rollback and recovery procedures
- docs/known-limitations.md — Known gaps and when they become blocking
- docs/launch-checklist.md — Launch day checklist
- docs/seo.md — SEO architecture, metadata rules, indexing policy
- docs/dealer-portal.md — Dealer portal architecture, APIs, and onboarding flow

## Dealer Portal

- Organization model: create org → pending verification → admin approves/rejects → verified/suspended
- Roles: owner, admin, member — with permission checks via `requireOrgMember()`
- Dealer onboarding: `/dealer/onboarding` → POST /api/organizations
- Dashboard: `/dashboard/dealer` — stats, inventory, leads, promotions, team, billing, settings
- Public profile: `/dealers/[id]` — SEO-optimized with `generateMetadata()`
- Promotion types: boost, highlight, featured, top_of_search, gallery
- Subscription plans: free, basic, pro, enterprise (admin-assigned)
- Admin tools: organization list with status filter, detail view, approve/reject/suspend/reactivate actions
- API routes: /api/organizations, /api/promotions, /api/subscriptions

## Deployment readiness

- Environment validated eagerly on API startup (fail-fast)
- Production rejects unsafe defaults (placeholder secrets, localhost URLs, disabled rate limiting)
- Health endpoints: /api/health/live, /api/health, /api/health/ready, /api/health/startup
- Graceful shutdown with 15s timeout
- Sentry error tracking when SENTRY_DSN is set
- Sensitive data redacted from logs
- OpenTelemetry tracing prepared (not yet active)
- Smoke test script for post-deploy validation
- CI/CD: lint → typecheck → test → build → e2e → docker build
- Deploy workflow: manual dispatch with staging/production targets

## Non-goals

- Do not turn this into a shallow clone
- Do not optimize for ad clutter
- Do not overbuild every future vertical before Cars is strong
- Do not introduce brittle scraping dependencies into core product logic
