import type { CapacitorConfig } from '@capacitor/cli';

const isProduction = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'il.co.zuzz.app',
  appName: 'ZUZZ',
  webDir: 'www',

  server: isProduction
    ? {
        // Production: load from deployed web app
        url: 'https://app.zuzz.co.il',
        androidScheme: 'https',
      }
    : {
        // Development: point to local Next.js dev server
        url: 'http://10.0.2.2:3000', // Android emulator localhost alias
        cleartext: true,
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
    Camera: {},
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
