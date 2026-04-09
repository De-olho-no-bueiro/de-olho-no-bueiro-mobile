import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AsyncStorageReporteRepository } from '@/features/reportes/services/AsyncStorageReporteRepository';
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
      
      const repo = new AsyncStorageReporteRepository();
      try {
        if (tipo === 'bueiro') {
          const manholes = await repo.carregarManholes();
          const found = manholes.find((m) => m.id === id);
          if (found) setData(found);
        } else if (tipo === 'alagamento') {
          const areas = await repo.carregarFloodAreas();
          const found = areas.find((a) => a.id === id);
          if (found) setData(found);
        } else {
          // Fallback legacy reportes
           const reportes = await repo.carregarReportes();
           const found = reportes.find((r) => r.id === id);
           if (found) setData(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    async function loadComments() {
      if (!id) return;
      const apiComments = await commentRepo.getComments(id);
      setComments(apiComments);
    }
    
    loadData();
    loadComments();
  }, [id, tipo]);

  const enviarComentario = async (text: string) => {
    if (!id || !text) return;
    const newComment = await commentRepo.addComment(id, text);
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
