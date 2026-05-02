import { API_URL } from './api-config';
import { clearSession, getStoredAccessToken } from './session';
import { refreshAccessToken } from './refresh-token';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let token = await getStoredAccessToken();
  if (!token) {
    console.log(`[Auth][Request] no access token for ${endpoint}. Trying refresh first.`);
    token = await refreshAccessToken();
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  console.log('[Auth][Request] sending request:', {
    endpoint,
    method: options.method || 'GET',
    hasToken: Boolean(token),
    authHeader: token ? `Bearer ${token.slice(0, 12)}...` : 'none',
  });

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status !== 401) {
    console.log(`[Auth][Request] response ${response.status} for ${endpoint}`);
    return response;
  }

  console.log(`[Auth][Request] got 401 for ${endpoint}. Trying refresh.`);
  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    await clearSession();
    return response;
  }

  const retryHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${refreshedToken}`,
    ...options.headers,
  };

  console.log('[Auth][Request] retrying request after refresh:', {
    endpoint,
    method: options.method || 'GET',
    authHeader: `Bearer ${refreshedToken.slice(0, 12)}...`,
  });

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: retryHeaders,
  });
}
