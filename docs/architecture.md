# ZUZZ Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                    Client Layer                   │
├──────────────────┬──────────────────────────────-┤
│   Web App (:3000) │   Admin App (:3001)          │
│   Next.js 15      │   Next.js 15                 │
│   Hebrew/RTL      │   Hebrew/RTL                 │
└────────┬─────────┴──────────┬────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────┐
│              API Server (:4000)                   │
│              Express + TypeScript                 │
│              WebSocket (Socket.IO)                │
├─────────────────────────────────────────────────-┤
│  Routes: auth, users, listings, cars, homes,     │
│  market, search, messages, leads, favorites,     │
│  notifications, admin, analytics, upload          │
└────────┬────────────────────┬────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │     Redis        │
│   + PostGIS      │  │   Cache/Queue    │
│   + pg_trgm      │  │                  │
└──────────────────┘  └──────────────────┘
         │
         ▼
┌──────────────────┐
│   MinIO (S3)     │
│   Media Storage  │
└──────────────────┘
```

## Monorepo Structure

```
/apps
  /web          - Public marketplace (Next.js)
  /admin        - Admin backoffice (Next.js)
  /api          - Backend API (Express)
/packages
  /ui           - Shared React components
  /types        - TypeScript type definitions
  /validation   - Zod schemas
  /config       - Environment config
  /database     - Prisma schema & client
  /shared-utils - Utility functions
  /trust-engine - Trust scoring system
  /storage      - S3 storage abstraction
  /email        - Email provider abstraction
  /search       - Search provider abstraction
  /analytics    - Event tracking
  /feature-flags - Feature flag system
  /integrations - External service adapters
```

## Key Design Decisions

### 1. Trust-First Architecture
Every listing has a computed trust score based on weighted factors:
- Seller verification status
- Documentation completeness
- Price reasonableness
- Listing completeness
- Historical behavior

### 2. Provider Abstraction Pattern
All external services are behind interfaces:
- Maps: mock → Google/Mapbox
- Payments: sandbox → Stripe/Tranzilla
- Email: SMTP → SendGrid/etc
- Storage: MinIO → S3
- Vehicle data: mock → Gov API
- Search: PostgreSQL → Typesense/OpenSearch

### 3. Vertical Architecture
Each vertical (Cars, Homes, Market) extends a shared listing base:
- Common: listing lifecycle, media, favorites, messaging
- Cars: vehicle details, trust factors, EV support
- Homes: property details, map integration
- Market: categories, condition, attributes

### 4. Hebrew-First / RTL-Native
- All UI text defaults to Hebrew
- CSS uses logical properties (start/end vs left/right)
- Tailwind configured for RTL
- Date/number formatting uses he-IL locale
```

## Data Flow

### Listing Creation (Cars Example)
1. User starts wizard → draft created in DB
2. Each step updates the listing via API
3. Media uploaded to MinIO via multipart
4. On publish: completeness score computed, trust factors evaluated
5. Listing goes active (auto-approve in MVP)
6. Trust score visible in search results

### Search Flow
1. Client sends filter params to /api/cars/search
2. API builds Prisma query with dynamic where clauses
3. Results include facets (make, fuel, gearbox counts)
4. Promoted/featured listings sorted first
5. Trust scores and badges displayed on cards
