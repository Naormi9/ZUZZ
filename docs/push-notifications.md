# Push Notifications

End-to-end push notification system for ZUZZ mobile and web.

## Architecture

```
Mobile App (Capacitor)     Web Browser
     │                         │
     ├── Request Permission    │
     ├── Register w/ APNS/FCM  │
     ├── Get Device Token      ├── Web Push API (future)
     │                         │
     └──── POST /api/push/register ────► API Server
                                            │
                                    ┌───────┴───────┐
                                    │  DeviceToken   │
                                    │  table (DB)    │
                                    └───────┬───────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          │                 │                 │
                     FCM Provider     APNS (via FCM)    Mock Provider
                     (production)                        (dev/test)
```

## Components

### Backend

- **Push Service** (`apps/api/src/lib/push.ts`) — Unified notification delivery
- **Push Routes** (`apps/api/src/routes/push.ts`) — Device registration & admin tools
- **DeviceToken model** — Stores device tokens per user

### Mobile (Client)

- **Push module** (`apps/web/src/lib/mobile/push-notifications.ts`) — Capacitor integration
- Token registration, permission handling, notification listeners

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/push/register` | User | Register device token |
| POST | `/api/push/unregister` | User | Unregister device token |
| GET | `/api/push/devices` | User | List active devices |
| GET | `/api/push/admin/tokens` | Admin | Browse all tokens |
| POST | `/api/push/admin/resend/:id` | Admin | Resend a notification |
| POST | `/api/push/admin/test` | Admin | Send test notification |

## Notification Types

| Type | Trigger | Recipient |
|------|---------|-----------|
| `new_lead` | Lead created on listing | Listing owner |
| `new_message` | New chat message sent | Other party in conversation |
| `saved_search_match` | New listing matches saved search | Search owner |
| `listing_status` | Listing approved/rejected/sold | Listing owner / watchers |
| `price_alert` | Price changed on watched listing | Users who favorited listing |
| `dealer_response` | Dealer responds to inquiry | Lead buyer |

## Configuration

### Environment Variables

```bash
# Firebase Cloud Messaging server key
FCM_SERVER_KEY="your-fcm-server-key"
```

When `FCM_SERVER_KEY` is not set, the system uses a mock provider that logs notifications to console.

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Add Android app with package name `il.co.zuzz.app`
3. Download `google-services.json` to `apps/mobile/android/app/`
4. Add iOS app with bundle ID `il.co.zuzz.app`
5. Download `GoogleService-Info.plist` to `apps/mobile/ios/App/App/`
6. Upload APNS key in Firebase Console for iOS push

## Rate Limiting

Push notifications are rate-limited per user:
- **30 notifications per minute** per user
- Backed by Redis

## Token Management

- Invalid tokens (e.g., after app uninstall) are automatically deactivated
- Tokens are deduplicated by `(userId, token)` unique constraint
- Each token tracks its platform (`ios`, `android`, `web`)

## Testing

Run push notification tests:
```bash
pnpm test -- push.test
```
