import * as SecureStore from 'expo-secure-store';
import { DeviceEventEmitter } from 'react-native';

import { isWeb } from './platform-capabilities';

export const USER_TOKEN_KEY = 'userToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USER_DATA_KEY = 'userData';
export const AUTH_SESSION_CLEARED_EVENT = 'auth-session-cleared';

type StoredUser = {
  id: string;
  name: string;
  email: string;
  token?: string;
  profilePicture?: string | null;
};

async function getItem(key: string) {
  if (isWeb) {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string) {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getStoredAccessToken() {
  const token = await getItem(USER_TOKEN_KEY);
  console.log('[Auth][Storage] access token loaded:', token ? `${token.slice(0, 12)}... len=${token.length}` : 'none');
  return token;
}

export async function getStoredRefreshToken() {
  const token = await getItem(REFRESH_TOKEN_KEY);
  console.log('[Auth][Storage] refresh token loaded:', token ? `${token.slice(0, 8)}... len=${token.length}` : 'none');
  return token;
}

export async function getStoredUser() {
  const storedUser = await getItem(USER_DATA_KEY);
  return storedUser ? (JSON.parse(storedUser) as StoredUser) : null;
}

export async function updateStoredUser(updater: (current: StoredUser | null) => StoredUser | null) {
  const currentUser = await getStoredUser();
  const nextUser = updater(currentUser);

  if (!nextUser) {
    await deleteItem(USER_DATA_KEY);
    return null;
  }

  await setItem(USER_DATA_KEY, JSON.stringify(nextUser));
  return nextUser;
}

export async function persistSession(params: {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
}) {
  const nextUser = {
    ...params.user,
    token: params.accessToken,
  };

  await setItem(USER_TOKEN_KEY, params.accessToken);
  await setItem(REFRESH_TOKEN_KEY, params.refreshToken);
  await setItem(USER_DATA_KEY, JSON.stringify(nextUser));

  console.log('[Auth][Storage] session persisted:', {
    userId: nextUser.id,
    email: nextUser.email,
    accessToken: `${params.accessToken.slice(0, 12)}... len=${params.accessToken.length}`,
    refreshToken: `${params.refreshToken.slice(0, 8)}... len=${params.refreshToken.length}`,
  });

  return nextUser;
}

export async function clearSession() {
  await deleteItem(USER_TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
  await deleteItem(USER_DATA_KEY);
  console.log('[Auth][Storage] session cleared');
  DeviceEventEmitter.emit(AUTH_SESSION_CLEARED_EVENT);
}
