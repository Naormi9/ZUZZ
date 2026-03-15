# Push Notifications

## Architecture

ZUZZ uses a provider-based push notification architecture that supports:
- **Sandbox mode** (development) — logs push notifications to console
- **FCM mode** (production) — sends via Firebase Cloud Messaging to iOS and Android

### Components

| Component | Path | Description |
|-----------|------|-------------|
| Notification Service | `apps/api/src/services/notification.service.ts` | Core service for creating notifications and sending push |
| Device Tokens API | `apps/api/src/routes/device-tokens.ts` | Register/unregister device tokens |
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

### `POST /api/device-tokens/register`
Register or reactivate a device token.

```json
{
  "token": "fcm-device-token-string",
  "platform": "ios" | "android" | "web",
  "provider": "fcm",
  "appVersion": "1.0.0"
}
```

### `DELETE /api/device-tokens/unregister`
Deactivate a device token (e.g., on logout).

```json
{ "token": "fcm-device-token-string" }
```

### `GET /api/device-tokens/my`
List active device tokens for the authenticated user.

## Notification Types

| Type | Trigger | Helper Function |
|------|---------|-----------------|
| `new_message` | New chat message | `notifyNewMessage()` |
| `new_lead` | Lead submitted on listing | `notifyNewLead()` |
| `price_drop` | Price decreased on watched listing | `notifyPriceDrop()` |
| `saved_search_match` | New listing matches saved search | `notifySavedSearchMatch()` |
| `listing_status_change` | Listing approved/rejected/expired | `notifyListingStatusChange()` |
| `promotion_activated` | Promotion started | Via `createNotification()` |
| `promotion_expiring` | Promotion about to expire | Via `createNotification()` |
| `subscription_change` | Subscription activated/cancelled | Via `createNotification()` |
| `system` | System announcements | Via `createNotification()` |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FCM_SERVER_KEY` | Production | Firebase Cloud Messaging server key |
| `FCM_SERVICE_ACCOUNT_JSON` | Optional | Alternative FCM auth via service account |

## Production Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Get the server key from Project Settings → Cloud Messaging
4. Set `FCM_SERVER_KEY` environment variable
5. For iOS: upload APNs auth key to Firebase
6. For Android: include `google-services.json` in `apps/mobile/android/app/`
