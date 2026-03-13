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

## Commands to keep updated
Document all real commands in README and keep this section synced:
- install
- dev
- db setup
- seed
- test
- lint
- typecheck
- build

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

## Non-goals
- Do not turn this into a shallow clone
- Do not optimize for ad clutter
- Do not overbuild every future vertical before Cars is strong
- Do not introduce brittle scraping dependencies into core product logic