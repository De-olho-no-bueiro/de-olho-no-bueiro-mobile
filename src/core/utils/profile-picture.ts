import { encode as btoa } from 'base-64';

export function parseProfilePicture(value: any): string | null {
  if (!value) return null;

  if (typeof value === 'string') {
    if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return `data:image/jpeg;base64,${value}`;
  }

  if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < value.data.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, value.data.slice(i, i + chunkSize));
    }

    try {
      return `data:image/jpeg;base64,${btoa(binary)}`;
    } catch {
      return null;
    }
  }

  return null;
}

export function stripProfilePictureDataUrl(value: string | null | undefined) {
  if (!value) return null;
  return value.replace(/^data:[^;]+;base64,/, '');
}
