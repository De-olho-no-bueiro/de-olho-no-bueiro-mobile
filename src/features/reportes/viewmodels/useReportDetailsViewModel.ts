import { useState, useEffect } from 'react';
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
  const commentRepo = new ApiCommentRepository();
  const reporteRepo = new ApiReporteRepository();

  const loadComments = async (targetPostId: string) => {
    const apiComments = await commentRepo.getComments(targetPostId);
    setComments(apiComments);
  };

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      try {
        let found: any = null;

        if (postIdParam) {
          found = await reporteRepo.carregarDetalhePost(postIdParam);
        } else if (tipo === 'bueiro') {
          const manholes = await reporteRepo.carregarManholes();
          found = manholes.find((m) => m.id === id);
        } else if (tipo === 'alagamento') {
          const areas = await reporteRepo.carregarFloodAreas();
          found = areas.find((a) => a.id === id);
        }

        // Fallback genérico: se for um marcador de alagamento pontual (não polígono) ou tipo não mapeado
        if (!found) {
           const reportes = await reporteRepo.carregarReportes();
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
  }, [id, tipo, postIdParam]);

  const enviarComentario = async (text: string) => {
    if (!id || !text || !data) return;
    const targetPostId = String(data.postId || postIdParam || data.id);
    const newComment = await commentRepo.addComment(targetPostId, text);
    if (newComment) {
      setComments((prev) => [...prev, newComment]);
    }
  };

  const editarComentario = async (commentId: string, text: string) => {
    const updatedComment = await commentRepo.updateComment(commentId, text);
    if (updatedComment) {
      setComments((prev) => prev.map((comment) => (comment.id === commentId ? updatedComment : comment)));
      return true;
    }
    return false;
  };

  const excluirComentario = async (commentId: string) => {
    const success = await commentRepo.deleteComment(commentId);
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
      const result = await reporteRepo.toggleLike(targetPostId);
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
    const result = await reporteRepo.verifyPost(targetPostId, isStillHappening);
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
    enviarComentario,
    editarComentario,
    excluirComentario,
    toggleLike,
    verificarIncidente,
  };
}
