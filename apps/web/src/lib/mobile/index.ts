/**
 * Mobile integration module for ZUZZ.
 *
 * Provides platform detection, native plugin wrappers, and mobile-specific
 * utilities. All exports are safe to use on web — they gracefully no-op
 * when not running inside a Capacitor native shell.
 */

export { isCapacitorNative, getPlatform, isIOS, isAndroid, getSafeAreaInsets } from './capacitor';
export { getStorage, getStoredAuthState, setStoredAuthState, clearStoredAuthState } from './secure-storage';
export { pickPhotos, takePhoto, capturedPhotoToFile } from './camera';
export type { CapturedPhoto } from './camera';
export { shareListing } from './share';
export type { ShareData } from './share';
export {
  requestPushPermission,
  checkPushPermission,
  registerPushListeners,
  registerTokenWithBackend,
} from './push-notifications';
export type { PushToken, NotificationCategory, PushNotificationData } from './push-notifications';
export { parseDeepLink, deepLinkToPath, registerDeepLinkListener } from './deep-links';
export type { DeepLinkRoute } from './deep-links';
export { initNetworkMonitoring, getNetworkStatus, onNetworkChange } from './network';
export type { NetworkStatus } from './network';
export { hapticLight, hapticMedium, hapticSuccess, hapticError } from './haptics';
