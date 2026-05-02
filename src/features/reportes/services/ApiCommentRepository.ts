import { fetchWithAuth } from '@/core/utils/api';
import { encode as btoa } from 'base-64';

export interface Comment {
  id: string;
  postId: number;
  authorId: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id: number;
    name: string;
    profilePicture?: string | null;
  };
}

const parseBufferToDataUrl = (mediaObj: any): string => {
  if (typeof mediaObj === 'string') {
    return mediaObj.startsWith('data:') ? mediaObj : `data:image/jpeg;base64,${mediaObj}`;
  }
  if (mediaObj && mediaObj.type === 'Buffer' && Array.isArray(mediaObj.data)) {
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < mediaObj.data.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, mediaObj.data.slice(i, i + chunkSize));
    }
    try {
      return `data:image/jpeg;base64,${btoa(binary)}`;
    } catch {}
  }
  return '';
};

const mapComment = (d: any): Comment => ({
  id: String(d.id),
  postId: d.postId,
  authorId: d.authorId,
  content: d.content,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
  author: d.author
    ? {
        ...d.author,
        profilePicture: parseBufferToDataUrl(d.author.profilePicture) || null,
      }
    : undefined,
});

export class ApiCommentRepository {
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const response = await fetchWithAuth(`/mobile/v1/comments/${postId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.map(mapComment);
    } catch {
      return [];
    }
  }

  async addComment(postId: string, content: string): Promise<Comment | null> {
    try {
      const response = await fetchWithAuth(`/mobile/v1/comments/${postId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (!response.ok) return null;
      return mapComment(await response.json());
    } catch {
      return null;
    }
  }

  async updateComment(commentId: string, content: string): Promise<Comment | null> {
    try {
      const response = await fetchWithAuth(`/mobile/v1/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      });
      if (!response.ok) return null;
      return mapComment(await response.json());
    } catch {
      return null;
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const response = await fetchWithAuth(`/mobile/v1/comments/${commentId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
