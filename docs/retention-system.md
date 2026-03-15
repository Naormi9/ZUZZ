# Retention System

## Overview

ZUZZ's retention system brings users back through three loops:

1. **Saved Search Alerts** — notify when new listings match criteria
2. **Price Watch / Drop Alerts** — notify when watched listings drop in price
3. **Notification Center** — centralized in-app notification hub

## Saved Searches

### API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/saved-searches` | POST | Create saved search (max 20) |
| `/api/saved-searches` | GET | List saved searches |
| `/api/saved-searches/:id` | PATCH | Update name/alert settings |
| `/api/saved-searches/:id` | DELETE | Delete saved search |

### Schema

```json
{
  "vertical": "cars",
  "name": "Toyota under 100k",
  "filters": { "make": "Toyota", "maxPrice": 100000 },
  "alertEnabled": true,
  "alertFrequency": "daily"
}
```

Alert frequency options: `instant`, `daily`, `weekly`

### Frontend Integration

- Cars search page has "Save Search" button for authenticated users
- Dashboard at `/dashboard/saved-searches` shows all saved searches with toggle alerts
- Each saved search links to its search results

## Price Watch

### API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/listing-watches` | POST | Watch a listing (max 50) |
| `/api/listing-watches` | GET | List watches with price drop info |
| `/api/listing-watches/:listingId` | DELETE | Unwatch |

### Behavior

- Records `priceAtWatch` when watch is created
- GET endpoint enriches with `currentPrice`, `priceDrop`, `priceDropPercent`
- Cannot watch your own listing
- Dashboard at `/dashboard/watches` shows all watched listings

### Price Drop Detection

The `PriceHistory` model tracks all price changes on listings. When a price drops:
1. A `PriceHistory` record is created
2. `notifyPriceDrop()` sends notifications to all watchers
3. Watch dashboard shows drop amount and percentage

## Notification Center

- Located at `/dashboard/notifications`
- Bell icon in header shows unread count badge
- Supports mark as read (individual) and mark all as read
- Each notification type has a distinct icon and color
- Notifications link to relevant pages (listing, conversation, dashboard)

## Database Models

### SavedSearch
Stores user's saved search criteria with alert preferences.

### ListingWatch
Links a user to a listing they're watching, with the price at time of watch.

### PriceHistory
Audit trail of all price changes on listings.

### DeviceToken
Stores push notification tokens for delivering alerts.
