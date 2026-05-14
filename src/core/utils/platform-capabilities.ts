import { Platform } from 'react-native';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Navigator {
    standalone?: boolean;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const isWeb = Platform.OS === 'web';

export function getUserAgent() {
  if (!isWeb || typeof navigator === 'undefined') {
    return '';
  }

  return navigator.userAgent || '';
}

export function isIosWeb() {
  const ua = getUserAgent();
  return /iphone|ipad|ipod/i.test(ua);
}

export function isSafariWeb() {
  const ua = getUserAgent();
  return /safari/i.test(ua) && !/chrome|crios|android/i.test(ua);
}

export function isStandaloneWeb() {
  if (!isWeb || typeof window === 'undefined') {
    return false;
  }

  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches;
  return Boolean(displayModeStandalone || window.navigator.standalone);
}

export function isSecureBrowserContext() {
  if (!isWeb || typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.isSecureContext);
}

export function supportsServiceWorker() {
  return isWeb && typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

export function supportsPushNotifications() {
  return (
    isWeb &&
    isSecureBrowserContext() &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function supportsInstallPrompt() {
  return isWeb && !isIosWeb();
}

export function supportsBackgroundLocation() {
  return !isWeb;
}

export function getInstallCoachStorageKey() {
  return 'pwa-install-coach-dismissed-at';
}

export function getPushSubscriptionStorageKey() {
  return 'web-push-subscription';
}

export function getVapidPublicKey() {
  const key = process.env.EXPO_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  return key || '';
}

export function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const raw = atob(padded);
  const result = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    result[index] = raw.charCodeAt(index);
  }

  return result;
}

