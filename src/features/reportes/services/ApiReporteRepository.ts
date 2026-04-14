import { Reporte, Manhole, FloodArea } from '@/features/reportes/models/Reporte';
import { IReporteRepository } from './IReporteRepository';
import { fetchWithAuth } from '@/core/utils/api';
import { encode as btoa } from 'base-64';

// Helpers para converter os Bytes[] do PostgreSQL Serializados em Base64 p/ usar no source={{uri}}
// O Prisma retorna um objeto { type: 'Buffer', data: [...] } quando faz um JSON.stringify do Uint8Array
const parseBufferToDataUrl = (mediaObj: any): string => {
  if (typeof mediaObj === 'string') {
    return mediaObj.startsWith('data:') ? mediaObj : `data:image/jpeg;base64,${mediaObj}`;
  }
  if (mediaObj && mediaObj.type === 'Buffer' && Array.isArray(mediaObj.data)) {
    // Reduz os números para char map para btoa - otimizado para chunks pra não crachar o call stack
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < mediaObj.data.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, mediaObj.data.slice(i, i + chunkSize));
    }
    // Caso não exista btoa global (Expo), usa require na marra ou assume fallback
    try {
      const base64 = typeof window !== 'undefined' && window.btoa ? window.btoa(binary) : (global as any).btoa ? (global as any).btoa(binary) : null;
      if (base64) return `data:image/jpeg;base64,${base64}`;
    } catch {}
  }
  return '';
};

export class ApiReporteRepository implements IReporteRepository {
  async salvarReportes(reportes: Reporte[]): Promise<void> {
    // Ignorado na versão de API já que a nuvem é a fonte de verdade principal.
  }

  async carregarReportes(): Promise<Reporte[]> {
    try {
      const response = await fetchWithAuth('/mobile/v1/reportes');
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((d: any) => {
        const midiasUri = d.medias && Array.isArray(d.medias) ? d.medias.map(parseBufferToDataUrl).filter(Boolean) : [];
        return {
          id: d.id.toString(),
          tipo: d.type || 'alagamento',
          latitude: d.latitude,
          longitude: d.longitude,
          endereco: d.endereco || 'Endereço não informado',
          nivel: d.nivel || 'baixo',
          descricao: d.content || '',
          fotoUri: midiasUri[0] || null, // A primeira foto é usada como thumb legado
          midiasUri, // Para detalhes ou carousel
          dataHora: d.createdAt,
        };
      });
    } catch {
      return [];
    }
  }

  async adicionarReporte(reporte: Reporte): Promise<void> {
    const response = await fetchWithAuth('/mobile/v1/reportes', {
      method: 'POST',
      body: JSON.stringify(reporte)
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[API] Erro ao adicionar reporte. Status: ${response.status}. Detalhes:`, errText);
      throw new Error(`Falha ao adicionar reporte (Status ${response.status})`);
    }
  }

  async salvarManholes(manholes: Manhole[]): Promise<void> {}

  async carregarManholes(): Promise<Manhole[]> {
    try {
      const response = await fetchWithAuth('/mobile/v1/manholes');
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((d: any) => {
        const latestPost = (d.posts && d.posts.length > 0) ? d.posts[0] : null;
        const rawMedias = latestPost ? latestPost.medias : d.medias;
        const midiasParsed = rawMedias && Array.isArray(rawMedias) ? rawMedias.map(parseBufferToDataUrl).filter(Boolean) : [];
        const postId = latestPost ? latestPost.id.toString() : undefined;

        return {
          id: d.id.toString(),
          postId: postId,
          latitude: d.latitude,
          longitude: d.longitude,
          descricao: latestPost?.content || d.name,
          dataHora: d.createdAt,
          is_finished: false,
          midiasUri: midiasParsed,
        };
      });
    } catch {
      return [];
    }
  }

  async adicionarManhole(manhole: Manhole): Promise<void> {
    const response = await fetchWithAuth('/mobile/v1/manholes', {
      method: 'POST',
      body: JSON.stringify(manhole)
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[API] Erro ao adicionar bueiro. Status: ${response.status}. Detalhes:`, errText);
      throw new Error(`Falha ao adicionar bueiro (Status ${response.status})`);
    }
  }

  async salvarFloodAreas(areas: FloodArea[]): Promise<void> {}

  async carregarFloodAreas(): Promise<FloodArea[]> {
    try {
      const response = await fetchWithAuth('/mobile/v1/flood-areas');
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((d: any) => {
        // Converte os vetores unificados de latitude/longitude de volta em pt
        const coordinates = (d.latitude || []).map((lat: number, idx: number) => ({
          latitude: lat,
          longitude: d.longitude[idx],
        }));
        
        const latestPost = (d.posts && d.posts.length > 0) ? d.posts[0] : null;
        const rawMedias = latestPost ? latestPost.medias : d.medias;
        const midiasParsed = rawMedias && Array.isArray(rawMedias) ? rawMedias.map(parseBufferToDataUrl).filter(Boolean) : [];
        const postId = latestPost ? latestPost.id.toString() : undefined;

        return {
          id: d.id.toString(),
          postId: postId,
          coordinates,
          nivel: latestPost?.nivel || 'grave',
          descricao: latestPost?.content || d.name,
          dataHora: d.createdAt,
          is_finished: false,
          midiasUri: midiasParsed,
        };
      });
    } catch {
      return [];
    }
  }

  async adicionarFloodArea(area: FloodArea): Promise<void> {
    const response = await fetchWithAuth('/mobile/v1/flood-areas', {
      method: 'POST',
      body: JSON.stringify(area)
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[API] Erro ao adicionar área de alagamento. Status: ${response.status}. Detalhes:`, errText);
      throw new Error(`Falha ao adicionar área de alagamento (Status ${response.status})`);
    }
  }

  async limparTodosReportes(): Promise<void> {
    // Op não aplicável para client via API a não ser que tenha claims de ADMIN
  }
}
