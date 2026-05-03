import * as SecureStore from 'expo-secure-store';
import { DeviceEventEmitter } from 'react-native';

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

export async function getStoredAccessToken() {
  const token = await SecureStore.getItemAsync(USER_TOKEN_KEY);
  console.log('[Auth][Storage] access token loaded:', token ? `${token.slice(0, 12)}... len=${token.length}` : 'none');
  return token;
}

export async function getStoredRefreshToken() {
  const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  console.log('[Auth][Storage] refresh token loaded:', token ? `${token.slice(0, 8)}... len=${token.length}` : 'none');
  return token;
}

export async function getStoredUser() {
  const storedUser = await SecureStore.getItemAsync(USER_DATA_KEY);
  return storedUser ? (JSON.parse(storedUser) as StoredUser) : null;
}

export async function updateStoredUser(updater: (current: StoredUser | null) => StoredUser | null) {
  const currentUser = await getStoredUser();
  const nextUser = updater(currentUser);

  if (!nextUser) {
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
    return null;
  }

  await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(nextUser));
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

  await SecureStore.setItemAsync(USER_TOKEN_KEY, params.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, params.refreshToken);
  await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(nextUser));

  console.log('[Auth][Storage] session persisted:', {
    userId: nextUser.id,
    email: nextUser.email,
    accessToken: `${params.accessToken.slice(0, 12)}... len=${params.accessToken.length}`,
    refreshToken: `${params.refreshToken.slice(0, 8)}... len=${params.refreshToken.length}`,
  });

  return nextUser;
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(USER_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_DATA_KEY);
  console.log('[Auth][Storage] session cleared');
  DeviceEventEmitter.emit(AUTH_SESSION_CLEARED_EVENT);
}
