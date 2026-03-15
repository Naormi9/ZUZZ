# Mobile App Release Guide

## App Identity

| Property | Value |
|----------|-------|
| App ID | `il.co.zuzz.app` |
| App Name | ZUZZ |
| URL Scheme | `zuzz://` |
| Version | 1.0 |

## Prerequisites

- Node.js 18+
- Android Studio (for Android builds)
- Xcode 15+ (for iOS builds)
- Firebase project configured (for push notifications)

## Build Steps

### Android

1. Place `google-services.json` in `apps/mobile/android/app/`
2. Sync Capacitor:
   ```bash
   pnpm mobile:sync
   ```
3. Open in Android Studio:
   ```bash
   pnpm mobile:open:android
   ```
4. Build signed APK/AAB via Android Studio
   - Build → Generate Signed Bundle / APK
   - Use your release keystore

### iOS

1. Place `GoogleService-Info.plist` in `apps/mobile/ios/App/App/`
2. Sync Capacitor:
   ```bash
   pnpm mobile:sync
   ```
3. Open in Xcode:
   ```bash
   pnpm mobile:open:ios
   ```
4. Configure signing:
   - Set Team in Signing & Capabilities
   - Enable Push Notifications capability
   - Enable Associated Domains (for universal links)
5. Archive and distribute via App Store Connect

## Native Configuration

### Android (`AndroidManifest.xml`)

Permissions configured:
- `INTERNET` — Network access
- `CAMERA` — Listing photo capture
- `READ_MEDIA_IMAGES` — Photo gallery access
- `POST_NOTIFICATIONS` — Push notifications (Android 13+)
- `VIBRATE` — Haptic feedback
- `ACCESS_NETWORK_STATE` — Network monitoring

Deep links configured:
- `zuzz://` custom URL scheme
- `https://zuzz.co.il` App Links (requires Digital Asset Links)

### iOS (`Info.plist`)

Permissions configured:
- `NSCameraUsageDescription` — Camera access
- `NSPhotoLibraryUsageDescription` — Photo library
- `UIBackgroundModes: remote-notification` — Push notifications

ATS (App Transport Security):
- HTTPS enforced for all connections
- Exception for `localhost` (development only)

Deep links:
- `zuzz://` URL scheme via `CFBundleURLTypes`

## Production Capacitor Config

The `capacitor.config.ts` automatically switches between dev and production:
- **Production** (`NODE_ENV=production`): Loads `https://app.zuzz.co.il`
- **Development**: Points to `http://10.0.2.2:3000` (Android emulator)

## Store Submission Checklist

See `docs/store-submission-checklist.md` for the full checklist.

Key items:
- [ ] App icons generated (all densities)
- [ ] Splash screens generated
- [ ] Screenshots for all required sizes
- [ ] Privacy policy URL
- [ ] App description (Hebrew + English)
- [ ] Content rating questionnaire
- [ ] Firebase + APNS configured for push
- [ ] Production API URL set in Capacitor config
- [ ] Keystore/signing configured
