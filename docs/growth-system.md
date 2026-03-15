# Growth & Retention System

User growth and retention infrastructure for ZUZZ.

## Features

### Saved Search Alerts

Users can save search filters and receive notifications when matching listings appear.

- Save search with filters: `POST /api/search/saved`
- Enable/disable alerts: `PATCH /api/growth/saved-searches/:id`
- Alert frequencies: `instant`, `daily`, `weekly`
- Cron endpoint: `POST /api/growth/cron/saved-search-alerts` (admin)

### Price Alerts

Automatic notifications when a favorited listing's price changes.

- Triggered when listing price is updated via car pricing endpoint
- Creates `PriceAlert` records for all users who favorited the listing
- Cron endpoint: `POST /api/growth/cron/price-alerts` (admin)

### Recently Viewed

Tracks and displays recently viewed listings per user.

- Auto-tracked on listing detail view (`GET /api/listings/:id`)
- Explicit tracking: `POST /api/growth/recently-viewed/:listingId`
- View history: `GET /api/search/recent`

### Recommendations

Three recommendation engines:

1. **Similar Listings** (`GET /api/growth/recommendations/similar/:id`)
   - Same vertical, same make (cars), similar price range
   - Promoted listings prioritized

2. **Popular Listings** (`GET /api/growth/recommendations/popular`)
   - Sorted by view count and favorite count
   - Filterable by vertical

3. **For You** (`GET /api/growth/recommendations/for-you`)
   - Based on recently viewed and favorited listings
   - Identifies preferred vertical, city, and price range

### Email Digest Preferences

Users control their email communication:

- `GET /api/growth/digest-preferences` — Get current preferences
- `PATCH /api/growth/digest-preferences` — Update preferences
- Options: weekly digest, saved search alerts, price alerts

### Analytics Events

Comprehensive event tracking:

- `POST /api/growth/track` — Track any event
- `POST /api/analytics/event` — Legacy endpoint (still works)

Key tracked events:
- `listing_view` — Page view on listing detail
- `lead_created` — Lead form submitted
- `message_sent` — Chat message sent
- `favorite_added` — Listing favorited
- `phone_revealed` — Phone number clicked

### Growth Metrics Dashboard

Admin-only metrics endpoint: `GET /api/growth/admin/metrics`

Returns:
- New users / listings (period)
- Total views, favorites, leads, messages
- Active saved searches, active promotions
- Revenue for period
- Conversion funnel events

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/api/growth/saved-searches/:id` | User | Update saved search alerts |
| POST | `/api/growth/price-alerts/:listingId` | User | Enable price alert for listing |
| POST | `/api/growth/recently-viewed/:listingId` | User | Track listing view |
| GET | `/api/growth/recommendations/similar/:id` | Public | Similar listings |
| GET | `/api/growth/recommendations/popular` | Public | Popular listings |
| GET | `/api/growth/recommendations/for-you` | User | Personalized recommendations |
| GET | `/api/growth/digest-preferences` | User | Get email preferences |
| PATCH | `/api/growth/digest-preferences` | User | Update email preferences |
| POST | `/api/growth/track` | Optional | Track analytics event |
| GET | `/api/growth/admin/metrics` | Admin | Growth dashboard metrics |
| POST | `/api/growth/cron/saved-search-alerts` | Admin | Process saved search alerts |
| POST | `/api/growth/cron/price-alerts` | Admin | Process price change alerts |

## Database Models

- `SavedSearch` — Saved search filters with alert settings
- `RecentlyViewed` — Per-user listing view history
- `PriceAlert` — Price change records for notifications
- `EmailDigestPreference` — Per-user email notification preferences
- `AnalyticsEvent` — Event tracking data

## Cron Jobs

For production, configure cron jobs to call these endpoints periodically:

```bash
# Saved search alerts — every 15 minutes
*/15 * * * * curl -X POST https://api.zuzz.co.il/api/growth/cron/saved-search-alerts -H "Authorization: Bearer $ADMIN_TOKEN"

# Price alerts — every 5 minutes
*/5 * * * * curl -X POST https://api.zuzz.co.il/api/growth/cron/price-alerts -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Testing

```bash
pnpm test -- growth.test
```
