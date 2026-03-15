'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  isCapacitorNative,
  initNetworkMonitoring,
  registerDeepLinkListener,
  registerPushListeners,
} from '@/lib/mobile';

/**
 * Mobile app shell initialization component.
 *
 * Rendered once in the root layout. Initializes:
 * - Network monitoring
 * - Deep link listener
 * - Push notification listeners
 * - App lifecycle handlers (back button, etc.)
 * - Status bar configuration
 * - Keyboard behavior
 *
 * No-op on web — all initializations check for Capacitor native context.
 */
export function MobileAppShell() {
  const router = useRouter();

  useEffect(() => {
    if (!isCapacitorNative()) return;

    let cleanup: (() => void) | undefined;

    async function initMobile() {
      // Mark HTML element for CSS overrides
      document.documentElement.classList.add('capacitor-native');

      // Initialize network monitoring
      await initNetworkMonitoring();

      // Register deep link listener
      await registerDeepLinkListener((path) => {
        router.push(path);
      });

      // Register push notification listeners
      await registerPushListeners(
        // On notification tap — navigate to relevant screen
        (data) => {
          if (data.url) {
            router.push(data.url);
          } else if (data.conversationId) {
            router.push(`/dashboard/messages/${data.conversationId}`);
          } else if (data.listingId) {
            router.push(`/cars/${data.listingId}`);
          }
        },
        // On foreground notification — could show in-app toast
        (_title, _body, _data) => {
          // Future: show in-app notification toast
        },
      );

      // Handle Android back button
      const { App } = await import('@capacitor/app');
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });

      // Configure status bar
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
      } catch {
        // Status bar plugin may not be available on all platforms
      }

      // Configure keyboard
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        Keyboard.addListener('keyboardWillShow', (info) => {
          document.documentElement.style.setProperty(
            '--keyboard-height',
            `${info.keyboardHeight}px`,
          );
        });
        Keyboard.addListener('keyboardWillHide', () => {
          document.documentElement.style.setProperty('--keyboard-height', '0px');
        });
      } catch {
        // Keyboard plugin may not be available
      }
    }

    initMobile();

    return cleanup;
  }, [router]);

  return null;
}
