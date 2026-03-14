# Known Limitations

Last updated: March 2026

Items that are known gaps but do not block a limited beta / staging deployment. Each item notes when it becomes blocking.

## External Integrations (Mocked)

| Integration            | Current State                          | Blocks                                    |
| ---------------------- | -------------------------------------- | ----------------------------------------- |
| Vehicle registry API   | Mocked — returns sample data           | Public launch (car data must be real)     |
| Maps provider          | Configurable, `mock` allowed in dev    | Homes vertical (map-first UX)             |
| Payment provider       | Configurable, `sandbox` allowed in dev | Paid features (promotions, subscriptions) |
| SMS/push notifications | Not implemented                        | Mobile app launch                         |

## Search

- **No dedicated search engine.** Search is SQL-based (pg_trgm + ILIKE). Acceptable for low-medium traffic. For scale, add Typesense or OpenSearch.
- **No autocomplete / fuzzy suggestions.** Search requires reasonably exact queries.
- **No geo-radius search for cars.** Homes has PostGIS support; cars filter by city string only.

## Media & Storage

- **Upload uses memory buffer → S3.** Files are buffered in API server memory before upload to S3. Large files or high concurrency may spike memory usage. For scale, switch to presigned S3 upload URLs (client → S3 direct).
- **No CDN.** Media served directly from S3. Add CloudFront/Cloudflare for production performance.
- **No image optimization pipeline.** Images stored as-is. Consider adding sharp/imgproxy for resizing and WebP conversion.

## Security

- **No server-side session revocation.** JWT-based auth; revoking a user requires waiting for token expiry (7 days) or the user's next authenticated request (which checks DB active status). Consider a Redis token blacklist for immediate revocation.
- **No CAPTCHA** on registration or login forms. Rate limiting provides some protection.
- **No penetration test** has been conducted.
- **Moderation is async.** Listings go live immediately with `moderationStatus: 'pending'` and are reviewed afterward. Inappropriate content may briefly be visible.

## Infrastructure

- **Single-server deployment.** No horizontal scaling, load balancing, or auto-scaling. Sufficient for beta but not for sustained high traffic.
- **No database read replicas.** Single Postgres instance handles all reads and writes.
- **No automated backup verification.** Backups are created but not automatically tested for restorability.
- **OpenTelemetry scaffolded but not active.** Distributed tracing is not yet collecting data.

## Product Features (Deferred)

- **Homes vertical:** Schema and API exist but frontend is skeletal. Not ready for users.
- **Market vertical:** Schema and API exist but frontend is skeletal. Not ready for users.
- **Real-time notifications:** WebSocket infrastructure exists; push notifications (mobile/browser) not implemented.
- **Advanced dealer analytics:** Basic stats only. No funnel analysis, conversion tracking, or comparative benchmarks.
- **Multi-language support:** Hebrew only. i18n infrastructure not yet in place.

## When Each Becomes Blocking

| Milestone                    | Requirements                                          |
| ---------------------------- | ----------------------------------------------------- |
| **Staging deploy**           | Nothing above blocks staging                          |
| **Limited beta (cars)**      | None — all above are acceptable for limited beta      |
| **Public launch (cars)**     | Vehicle registry API, CDN, penetration test, CAPTCHA  |
| **Homes launch**             | Maps provider, homes frontend, geo-search             |
| **Payments launch**          | Payment provider, subscription billing                |
| **Scale (>1000 concurrent)** | Search engine, horizontal scaling, read replicas, CDN |
