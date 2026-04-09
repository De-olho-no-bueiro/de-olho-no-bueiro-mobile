import { fetchWithAuth } from '@/core/utils/api';

export interface Comment {
  id: string;
  postId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author?: {
    id: number;
    name: string;
    profilePicture?: string | null;
  };
}

export class ApiCommentRepository {
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const response = await fetchWithAuth(`/mobile/v1/comments/${postId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((d: any) => ({
        id: String(d.id),
        postId: d.postId,
        authorId: d.authorId,
        content: d.content,
        createdAt: d.createdAt,
        author: d.author,
      }));
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
      return await response.json();
    } catch {
      return null;
    }
  }
}
