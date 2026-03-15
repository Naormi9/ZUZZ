import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'il.co.zuzz.app',
  appName: 'ZUZZ',
  webDir: 'www',

  // Server configuration — in production, load from deployed web app URL.
  // In development, point to local Next.js dev server.
  server: {
    // For production builds, this should be the deployed web app URL:
    // url: 'https://app.zuzz.co.il',
    // For local development:
    url: 'http://10.0.2.2:3000', // Android emulator localhost alias
    cleartext: true, // Allow HTTP in dev — disable in production
    androidScheme: 'https',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFFFFF',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      // Use CameraSource.Photos for gallery-only, CameraSource.Camera for camera-only
    },
  },

  // iOS-specific config
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
    scheme: 'zuzz',
  },

  // Android-specific config
  android: {
    allowMixedContent: false,
    backgroundColor: '#FFFFFF',
  },
};

export default config;
