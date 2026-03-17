import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AsyncStorageReporteRepository } from '@/features/reportes/services/AsyncStorageReporteRepository';

export function useReportDetailsViewModel() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const tipo = params.tipo as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [comments, setComments] = useState([
    { id: '1', user: 'Ana P.', text: 'Isso está um perigo! Quase caí aí ontem.', time: '2h atrás' },
    { id: '2', user: 'Carlos M.', text: 'A prefeitura precisa vir arrumar. Marquei aqui também pra dar força.', time: '5h atrás' },
  ]); // Mocked comments

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
    
    loadData();
  }, [id, tipo]);

  return {
    id,
    tipo,
    loading,
    data,
    comments,
  };
}
