import { API_URL } from './api-config';
import {
  clearSession,
  getStoredRefreshToken,
  getStoredUser,
  persistSession,
} from './session';

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  userId: number | string;
  name?: string | null;
};

let refreshPromise: Promise<string | null> | null = null;

async function runRefresh(refreshToken: string): Promise<string | null> {
  console.log('[Auth][Refresh] requesting new access token with refresh token:', `${refreshToken.slice(0, 8)}... len=${refreshToken.length}`);
  const response = await fetch(`${API_URL}/mobile/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    console.log('[Auth][Refresh] failed:', response.status);
    await clearSession();
    return null;
  }

  const data = (await response.json()) as RefreshResponse;
  console.log('[Auth][Refresh] success:', {
    userId: data.userId,
    accessToken: `${data.access_token.slice(0, 12)}... len=${data.access_token.length}`,
    refreshToken: `${data.refresh_token.slice(0, 8)}... len=${data.refresh_token.length}`,
  });
  const storedUser = await getStoredUser();

  await persistSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: {
      id: String(data.userId ?? storedUser?.id ?? ''),
      name: data.name ?? storedUser?.name ?? '',
      email: storedUser?.email ?? '',
    },
  });

  return data.access_token;
}

export async function refreshAccessToken(refreshToken?: string): Promise<string | null> {
  const token = refreshToken ?? (await getStoredRefreshToken());
  if (!token) {
    await clearSession();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = runRefresh(token).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}
