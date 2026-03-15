# Push Notifications

## Architecture

ZUZZ uses a provider-based push notification architecture that supports:
- **Sandbox mode** (development) — logs push notifications to console
- **FCM mode** (production) — sends via Firebase Cloud Messaging to iOS and Android

```
Mobile App (Capacitor)     Web Browser
     │                         │
     ├── Request Permission    │
     ├── Register w/ APNS/FCM  │
     ├── Get Device Token      ├── Web Push API (future)
     │                         │
     └──── POST /api/device-tokens/register ────► API Server
           POST /api/push/register ──────────►      │
                                            ┌───────┴───────┐
                                            │  DeviceToken   │
                                            │  table (DB)    │
                                            └───────┬───────┘
                                                    │
                              ┌─────────────────────┼─────────────────────┐
                              │                     │                     │
                         FCM Provider         APNS (via FCM)        Mock Provider
                         (production)                                (dev/test)
```

### Components

| Component | Path | Description |
|-----------|------|-------------|
| Notification Service | `apps/api/src/services/notification.service.ts` | Core service for creating notifications and sending push |
| Push Service | `apps/api/src/lib/push.ts` | Unified notification delivery |
| Device Tokens API | `apps/api/src/routes/device-tokens.ts` | Register/unregister device tokens |
| Push Routes | `apps/api/src/routes/push.ts` | Push admin tools and device registration |
| Push Client (Capacitor) | `apps/web/src/lib/mobile/push.ts` | Native push initialization |
| Push Foundations | `apps/web/src/lib/mobile/push-notifications.ts` | Token management and listener registration |

### Flow

1. App launches → `initPushNotifications()` checks/requests permission
2. OS returns device token from APNS (iOS) or FCM (Android)
3. Token sent to `POST /api/device-tokens/register` and stored in `DeviceToken` table
4. When backend needs to notify a user, it calls `createNotification()` or a typed helper
5. Service creates an in-app `Notification` record
6. If push channel is enabled, sends to all active `DeviceToken`s for that user
7. Invalid tokens are automatically deactivated

### Push Provider Selection

```
FCM_SERVER_KEY set? → FcmPushProvider (production)
Otherwise         → SandboxPushProvider (logs only)
```

## API Endpoints

### Device Token Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/device-tokens/register` | User | Register or reactivate a device token |
| DELETE | `/api/device-tokens/unregister` | User | Deactivate a device token |
| GET | `/api/device-tokens/my` | User | List active device tokens |

### Push Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/push/register` | User | Register device token |
| POST | `/api/push/unregister` | User | Unregister device token |
| GET | `/api/push/devices` | User | List active devices |
| GET | `/api/push/admin/tokens` | Admin | Browse all tokens |
| POST | `/api/push/admin/resend/:id` | Admin | Resend a notification |
| POST | `/api/push/admin/test` | Admin | Send test notification |

### Register Token Payload

```json
{
  "token": "fcm-device-token-string",
  "platform": "ios" | "android" | "web",
  "provider": "fcm",
  "appVersion": "1.0.0"
}
```

## Notification Types

| Type | Trigger | Helper Function |
|------|---------|-----------------|
| `new_message` | New chat message | `notifyNewMessage()` |
| `new_lead` | Lead submitted on listing | `notifyNewLead()` |
| `price_drop` | Price decreased on watched listing | `notifyPriceDrop()` |
| `price_alert` | Price changed on favorited listing | Push service |
| `saved_search_match` | New listing matches saved search | `notifySavedSearchMatch()` |
| `listing_status_change` | Listing approved/rejected/expired | `notifyListingStatusChange()` |
| `promotion_activated` | Promotion started | Via `createNotification()` |
| `promotion_expiring` | Promotion about to expire | Via `createNotification()` |
| `subscription_change` | Subscription activated/cancelled | Via `createNotification()` |
| `system` | System announcements | Via `createNotification()` |

## Rate Limiting

Push notifications are rate-limited per user:
- **30 notifications per minute** per user
- Backed by Redis

## Token Management

- Invalid tokens (e.g., after app uninstall) are automatically deactivated
- Tokens are deduplicated by `(userId, token)` unique constraint
- Each token tracks its platform (`ios`, `android`, `web`)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FCM_SERVER_KEY` | Production | Firebase Cloud Messaging server key |
| `FCM_SERVICE_ACCOUNT_JSON` | Optional | Alternative FCM auth via service account |

## Production Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Add Android app with package name `il.co.zuzz.app`
4. Download `google-services.json` to `apps/mobile/android/app/`
5. Add iOS app with bundle ID `il.co.zuzz.app`
6. Download `GoogleService-Info.plist` to `apps/mobile/ios/App/App/`
7. Upload APNS key in Firebase Console for iOS push
8. Get the server key from Project Settings → Cloud Messaging
9. Set `FCM_SERVER_KEY` environment variable

## Testing

```bash
pnpm test -- push.test
pnpm test -- device-tokens.test
```
