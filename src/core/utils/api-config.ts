const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Normalize env input to avoid subtle 404s from trailing spaces or slashes.
export const API_URL = rawApiUrl.trim().replace(/\/+$/, '');

export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  const baseUrl = API_URL.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
