/**
 * Capacitor initialization script.
 *
 * This file is the entry point for native-specific initialization
 * that runs before the web app loads in the Capacitor shell.
 *
 * In the remote URL approach, this file is used as a reference
 * for what the web app's MobileAppShell component does.
 * The actual initialization happens in the web app itself via
 * apps/web/src/components/mobile/mobile-app-shell.tsx
 */

// This file documents the initialization flow:
//
// 1. Capacitor loads the web app from the configured server URL
// 2. The web app's root layout includes <MobileAppShell />
// 3. MobileAppShell detects the Capacitor native context
// 4. It initializes:
//    - Network monitoring (offline/online detection)
//    - Deep link listeners (zuzz:// and universal links)
//    - Push notification handlers
//    - Back button handler (Android)
//    - Status bar configuration
//    - Keyboard behavior
// 5. Auth uses Capacitor Preferences instead of localStorage
//
// All native plugins are dynamically imported only when running
// in a Capacitor context, so the web build is not affected.

export {};
