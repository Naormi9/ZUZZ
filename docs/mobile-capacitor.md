# ZUZZ Mobile App — Capacitor Integration

## Overview

The ZUZZ mobile app uses **Capacitor 6** to wrap the existing Next.js web application for distribution on the Apple App Store and Google Play Store. This is a **remote URL** approach: the native shell loads the deployed web app and adds native capabilities through the Capacitor bridge.

### Architecture Decision

We chose the **remote URL shell** approach over static export because:

1. **Next.js App Router with SSR** cannot be statically exported without breaking major product flows (dynamic routes, server components, API proxy patterns)
2. The remote URL approach preserves all SSR/ISR capabilities
3. App updates are instant (deploy web → users see changes) without requiring store review for content changes
4. Native plugins (camera, push, share, haptics) work identically in both approaches

**Trade-off**: The app requires internet connectivity to function. This is acceptable for ZUZZ's transaction-centric use case.

## Repository Structure

```
apps/mobile/
├── capacitor.config.ts    # Capacitor configuration
├── package.json           # Capacitor dependencies
├── tsconfig.json          # TypeScript config
├── www/                   # Placeholder webDir (remote URL loads the actual content)
│   └── index.html         # Fallback loading page
├── android/               # Android native project (Gradle/Android Studio)
│   └── app/
│       └── src/main/
│           ├── AndroidManifest.xml  # Permissions, deep links, config
│           └── res/xml/
│               └── network_security_config.xml
├── ios/                   # iOS native project (Xcode)
│   └── App/App/
│       └── Info.plist     # Permissions, URL schemes, ATS config
├── resources/             # App icon and splash screen source assets
│   ├── icon.svg
│   └── splash.svg
└── src/
    └── capacitor-init.ts  # Documentation of init flow

apps/web/src/lib/mobile/       # Mobile integration layer (in web app)
├── index.ts                   # Barrel export
├── capacitor.ts               # Platform detection utilities
├── secure-storage.ts          # Auth token storage (Preferences on native)
├── camera.ts                  # Camera/photo picker wrapper
├── share.ts                   # Native share sheet wrapper
├── push-notifications.ts      # Push notification registration & handling
├── deep-links.ts              # Deep link parsing & navigation
├── network.ts                 # Network status monitoring
└── haptics.ts                 # Haptic feedback utilities

apps/web/src/components/mobile/   # Mobile-specific React components
├── mobile-app-shell.tsx          # App initialization (rendered in root layout)
├── network-banner.tsx            # Offline indicator banner
├── share-button.tsx              # Share button with native integration
└── camera-upload-button.tsx      # Native photo picker for uploads
```

## App Identity

| Property | Value |
|----------|-------|
| App Name | ZUZZ |
| Package ID (Android) | `il.co.zuzz.app` |
| Bundle ID (iOS) | `il.co.zuzz.app` |
| URL Scheme | `zuzz://` |
| Web Domain | `zuzz.co.il` |

## Native Plugins Integrated

| Plugin | Status | Usage |
|--------|--------|-------|
| `@capacitor/app` | Implemented | Back button, deep link events, app lifecycle |
| `@capacitor/camera` | Implemented | Photo picker and camera capture for listings |
| `@capacitor/share` | Implemented | Native share sheet for listings |
| `@capacitor/push-notifications` | Foundation ready | Token registration, notification handlers |
| `@capacitor/preferences` | Implemented | Secure auth token storage on native |
| `@capacitor/network` | Implemented | Online/offline detection |
| `@capacitor/haptics` | Implemented | Tactile feedback on interactions |
| `@capacitor/keyboard` | Implemented | Keyboard height tracking, resize behavior |
| `@capacitor/status-bar` | Implemented | Status bar styling |
| `@capacitor/splash-screen` | Configured | Splash screen on app launch |
| `@capacitor/browser` | Available | External link handling |
| `@capacitor/device` | Available | Device info queries |
| `@capacitor/filesystem` | Available | File system access for downloads |

## Deep Linking

### Supported Routes

| Deep Link | Web Path |
|-----------|----------|
| `zuzz://cars/{id}` | `/cars/{id}` |
| `zuzz://cars/search?make=Toyota` | `/cars/search?make=Toyota` |
| `zuzz://homes/{id}` | `/homes/{id}` |
| `zuzz://market/{id}` | `/market/{id}` |
| `zuzz://dashboard/messages` | `/dashboard/messages` |
| `zuzz://dashboard/messages/{id}` | `/dashboard/messages/{id}` |
| `zuzz://dealers/{id}` | `/dealers/{id}` |

### Universal Links / App Links

For production, configure:
- **iOS**: Associated Domains entitlement + `apple-app-site-association` file on `zuzz.co.il`
- **Android**: Digital Asset Links file at `https://zuzz.co.il/.well-known/assetlinks.json`

## Auth in Mobile Context

- Auth tokens are stored in **Capacitor Preferences** on native (sandboxed per-app storage)
- On web, standard localStorage is used (backward compatible)
- The Zustand auth store automatically detects the platform and uses the appropriate storage adapter
- JWT tokens survive app restarts and are cleared on logout
- The `refreshMe()` function validates tokens on app resume

## Push Notifications

### Current State: Foundation Ready

The push notification infrastructure is prepared but **not connected to a production push provider**. What's in place:

1. Permission request flow
2. Token registration with backend endpoint stub (`POST /api/push/register`)
3. Notification category definitions (new_lead, new_message, saved_search_match, listing_status)
4. Foreground notification handler
5. Notification tap → deep link navigation

### What's Needed for Production Push

1. **Firebase project** setup for FCM (Android) and APNS relay (iOS)
2. Backend endpoint `POST /api/push/register` to store device tokens
3. Backend push delivery service using FCM HTTP v1 API
4. `google-services.json` (Android) and APNS key/certificate (iOS)

## Environment Variables

For mobile builds, these environment variables must be set at web app build/deploy time:

```env
NEXT_PUBLIC_API_URL=https://api.zuzz.co.il
NEXT_PUBLIC_WS_URL=wss://api.zuzz.co.il
NEXT_PUBLIC_APP_URL=https://app.zuzz.co.il
```

The Capacitor config's `server.url` should match `NEXT_PUBLIC_APP_URL`.
