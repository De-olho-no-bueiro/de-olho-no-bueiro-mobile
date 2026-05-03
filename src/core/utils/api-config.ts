const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:3000/api';

// Normalize env input to avoid subtle 404s from trailing spaces or slashes.
export const API_URL = rawApiUrl.trim().replace(/\/+$/, '');
