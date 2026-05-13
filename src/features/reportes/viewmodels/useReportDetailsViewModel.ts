import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ApiReporteRepository } from '@/features/reportes/services/ApiReporteRepository';
import { ApiCommentRepository, Comment } from '@/features/reportes/services/ApiCommentRepository';

export function useReportDetailsViewModel() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const tipo = params.tipo as string;
  const postIdParam = params.postId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liking, setLiking] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const commentRepoRef = useRef(new ApiCommentRepository());
  const reporteRepoRef = useRef(new ApiReporteRepository());

  const loadComments = useCallback(async (targetPostId: string) => {
    const apiComments = await commentRepoRef.current.getComments(targetPostId);
    setComments(apiComments);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      try {
        let found: any = null;

        if (postIdParam) {
          found = await reporteRepoRef.current.carregarDetalhePost(postIdParam);
        } else if (tipo === 'bueiro') {
          const manholes = await reporteRepoRef.current.carregarManholes();
          found = manholes.find((m) => m.id === id);
        } else if (tipo === 'alagamento') {
          const areas = await reporteRepoRef.current.carregarFloodAreas();
          found = areas.find((a) => a.id === id);
        }

        // Fallback genérico: se for um marcador de alagamento pontual (não polígono) ou tipo não mapeado
        if (!found) {
           const reportes = await reporteRepoRef.current.carregarReportes();
           found = reportes.find((r) => r.id === id);
        }

        if (found) {
          setData(found);
          const targetPostId = String(found.postId || postIdParam || found.id);
          await loadComments(targetPostId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id, tipo, postIdParam, loadComments]);

  const enviarComentario = async (text: string) => {
    if (!id || !text || !data || commentSubmitting) return false;
    const targetPostId = String(data.postId || postIdParam || data.id);
    setCommentSubmitting(true);
    try {
      const newComment = await commentRepoRef.current.addComment(targetPostId, text);
      if (newComment) {
        setComments((prev) => [...prev, newComment]);
        return true;
      }
      return false;
    } finally {
      setCommentSubmitting(false);
    }
  };

  const editarComentario = async (commentId: string, text: string) => {
    if (commentSubmitting) return false;
    setCommentSubmitting(true);
    try {
      const updatedComment = await commentRepoRef.current.updateComment(commentId, text);
      if (updatedComment) {
        setComments((prev) => prev.map((comment) => (comment.id === commentId ? updatedComment : comment)));
        return true;
      }
      return false;
    } finally {
      setCommentSubmitting(false);
    }
  };

  const excluirComentario = async (commentId: string) => {
    const success = await commentRepoRef.current.deleteComment(commentId);
    if (success) {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    }
    return success;
  };

  const toggleLike = async () => {
    if (!data) return;
    const targetPostId = String(data.postId || postIdParam || data.id);
    setLiking(true);
    try {
      const result = await reporteRepoRef.current.toggleLike(targetPostId);
      if (result) {
        setData((prev: any) => prev ? { ...prev, ...result } : prev);
      }
    } finally {
      setLiking(false);
    }
  };

  const verificarIncidente = async (isStillHappening: boolean) => {
    if (!data) return false;
    const targetPostId = String(data.postId || postIdParam || data.id);
    const result = await reporteRepoRef.current.verifyPost(targetPostId, isStillHappening);
    if (result) {
      setData((prev: any) => prev ? { ...prev, ...result } : prev);
      return true;
    }
    return false;
  };

  return {
    id,
    tipo,
    postIdParam,
    loading,
    data,
    comments,
    liking,
    commentSubmitting,
    enviarComentario,
    editarComentario,
    excluirComentario,
    toggleLike,
    verificarIncidente,
  };
}
