import { fetchWithAuth } from '@/core/utils/api';
import { parseProfilePicture, stripProfilePictureDataUrl } from '@/core/utils/profile-picture';

type RemoteProfile = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  profilePicture?: any;
};

export type ProfilePayload = {
  name: string;
  profilePicture?: string | null;
  removeProfilePicture?: boolean;
};

async function readError(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text);
    return parsed?.message || fallback;
  } catch {
    return text || fallback;
  }
}

export async function updateMyProfile(payload: ProfilePayload) {
  const response = await fetchWithAuth('/mobile/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify({
      name: payload.name,
      profilePictureBase64:
        payload.profilePicture !== undefined ? stripProfilePictureDataUrl(payload.profilePicture) : undefined,
      removeProfilePicture: payload.removeProfilePicture ?? false,
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'Falha ao atualizar perfil'));
  }

  const data = (await response.json()) as RemoteProfile;
  return {
    id: String(data.id),
    name: data.name || '',
    email: data.email || '',
    profilePicture: parseProfilePicture(data.profilePicture),
  };
}

export async function changeMyPassword(currentPassword: string, newPassword: string) {
  const response = await fetchWithAuth('/mobile/v1/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'Falha ao alterar senha'));
  }
}
