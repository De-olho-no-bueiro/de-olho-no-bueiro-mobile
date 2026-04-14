import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ApiReporteRepository } from '@/features/reportes/services/ApiReporteRepository';
import { ApiCommentRepository, Comment } from '@/features/reportes/services/ApiCommentRepository';

export function useReportDetailsViewModel() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const tipo = params.tipo as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const commentRepo = new ApiCommentRepository();

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      const repo = new ApiReporteRepository();
      try {
        let found: any = null;
        if (tipo === 'bueiro') {
          const manholes = await repo.carregarManholes();
          found = manholes.find((m) => m.id === id);
        } else if (tipo === 'alagamento') {
          const areas = await repo.carregarFloodAreas();
          found = areas.find((a) => a.id === id);
        }

        // Fallback genérico: se for um marcador de alagamento pontual (não polígono) ou tipo não mapeado
        if (!found) {
           const reportes = await repo.carregarReportes();
           found = reportes.find((r) => r.id === id);
        }

        if (found) {
          setData(found);
          const targetPostId = found.postId || found.id;
          const apiComments = await commentRepo.getComments(targetPostId);
          setComments(apiComments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id, tipo]);

  const enviarComentario = async (text: string) => {
    if (!id || !text || !data) return;
    const targetPostId = data.postId || data.id;
    const newComment = await commentRepo.addComment(targetPostId, text);
    if (newComment) {
      setComments((prev) => [...prev, newComment]);
    }
  };

  return {
    id,
    tipo,
    loading,
    data,
    comments,
    enviarComentario,
  };
}
