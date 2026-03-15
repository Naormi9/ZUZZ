# ZUZZ Mobile App — Build Guide

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 10.x
- **Android Studio** (for Android builds) with:
  - Android SDK 34+
  - Android SDK Build Tools
  - Android Emulator or physical device
- **Xcode** 15+ (for iOS builds, macOS only) with:
  - iOS 16+ SDK
  - CocoaPods (`sudo gem install cocoapods`)
  - Apple Developer account (for device testing/store submission)

## Quick Start

### 1. Install Dependencies

```bash
# From repo root
pnpm install
```

### 2. Development Setup

The mobile app loads from the web app dev server in development mode.

```bash
# Terminal 1: Start infrastructure
pnpm docker:up

# Terminal 2: Start the API server
pnpm --filter @zuzz/api dev

# Terminal 3: Start the web app
pnpm --filter @zuzz/web dev
```

### 3. Configure Capacitor for Development

Edit `apps/mobile/capacitor.config.ts`:

```typescript
server: {
  // For Android emulator (10.0.2.2 = host machine localhost):
  url: 'http://10.0.2.2:3000',

  // For iOS simulator (use your machine's local IP):
  // url: 'http://192.168.1.100:3000',

  // For physical device (use your machine's local IP):
  // url: 'http://192.168.1.100:3000',

  cleartext: true,
}
```

### 4. Open in IDE

```bash
# Android
pnpm mobile:open:android
# or
cd apps/mobile && npx cap open android

# iOS (macOS only)
pnpm mobile:open:ios
# or
cd apps/mobile && npx cap open ios
```

### 5. Run on Device/Emulator

```bash
# Android
pnpm mobile:run:android

# iOS
pnpm mobile:run:ios
```

## Production Build

### 1. Deploy Web App

The web app must be deployed and accessible at a public URL (e.g., `https://app.zuzz.co.il`).

### 2. Update Capacitor Config for Production

In `apps/mobile/capacitor.config.ts`:

```typescript
server: {
  url: 'https://app.zuzz.co.il',
  // Remove cleartext: true
  androidScheme: 'https',
}
```

### 3. Sync Native Projects

```bash
cd apps/mobile
npx cap sync
```

### 4. Build for Android

1. Open in Android Studio: `npx cap open android`
2. Build → Generate Signed Bundle / APK
3. Choose Android App Bundle (.aab) for Play Store
4. Sign with your upload keystore

Or use command line:

```bash
cd apps/mobile/android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

### 5. Build for iOS

1. Open in Xcode: `npx cap open ios`
2. Select your development team
3. Set the target device to "Any iOS Device"
4. Product → Archive
5. Distribute via App Store Connect

## Troubleshooting

### Android: "cleartext not permitted"

In development, ensure `network_security_config.xml` allows cleartext for `10.0.2.2` and `localhost`.

### iOS: "App Transport Security"

In development, `Info.plist` allows HTTP for `localhost`. For production, only HTTPS is allowed.

### "Cannot connect to server"

1. Ensure the web app is running on the correct port
2. For emulators, use `10.0.2.2` (Android) or your local IP (iOS)
3. For physical devices, ensure both device and dev machine are on the same network

### Plugin Not Working

Run `npx cap sync` after any plugin installation to update native projects.

## Build Scripts Reference

```bash
# From repo root
pnpm mobile:sync              # Sync Capacitor plugins to native projects
pnpm mobile:open:android      # Open Android project in Android Studio
pnpm mobile:open:ios          # Open iOS project in Xcode
pnpm mobile:run:android       # Build and run on Android device/emulator
pnpm mobile:run:ios           # Build and run on iOS device/simulator

# From apps/mobile
npx cap sync                  # Sync all plugins
npx cap copy                  # Copy web assets only
npx cap update                # Update native plugins
npx cap doctor                # Diagnose issues
```
