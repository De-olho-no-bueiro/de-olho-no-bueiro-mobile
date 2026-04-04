import { Reporte, Manhole, FloodArea } from '@/features/reportes/models/Reporte';
import { IReporteRepository } from './IReporteRepository';
import { fetchWithAuth } from '@/core/utils/api';

export class ApiReporteRepository implements IReporteRepository {
  async salvarReportes(reportes: Reporte[]): Promise<void> {
    // Ignorado na versão de API já que a nuvem é a fonte de verdade principal.
  }

  async carregarReportes(): Promise<Reporte[]> {
    try {
      const response = await fetchWithAuth('/mobile/v1/reportes');
      if (!response.ok) return [];
      const data = await response.json();
      // O DB usa campos type/nivel/latitude, o mobile usa o Reporte
      return data.map((d: any) => ({
        id: d.id.toString(),
        tipo: d.type || 'alagamento',
        latitude: d.latitude,
        longitude: d.longitude,
        endereco: d.endereco || 'Endereço não informado',
        nivel: d.nivel || 'baixo',
        descricao: d.content || '',
        fotoUri: null, // Mapeamento de mídia omitido para simplificação.
        dataHora: d.createdAt,
      }));
    } catch {
      return [];
    }
  }

  async adicionarReporte(reporte: Reporte): Promise<void> {
    const response = await fetchWithAuth('/mobile/v1/reportes', {
      method: 'POST',
      body: JSON.stringify(reporte)
    });
    if (!response.ok) throw new Error('Falha ao adicionar reporte');
  }

  async salvarManholes(manholes: Manhole[]): Promise<void> {}

  async carregarManholes(): Promise<Manhole[]> {
    try {
      const response = await fetchWithAuth('/mobile/v1/manholes');
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((d: any) => ({
        id: d.id.toString(),
        latitude: d.latitude,
        longitude: d.longitude,
        descricao: d.name,
        dataHora: d.createdAt,
        is_finished: false,
        midiasUri: [],
      }));
    } catch {
      return [];
    }
  }

  async adicionarManhole(manhole: Manhole): Promise<void> {
    const response = await fetchWithAuth('/mobile/v1/manholes', {
      method: 'POST',
      body: JSON.stringify(manhole)
    });
    if (!response.ok) throw new Error('Falha ao adicionar bueiro');
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
        return {
          id: d.id.toString(),
          coordinates,
          nivel: 'grave', // Mocking based on whatever Area provides if it lacks a `nivel` column locally
          descricao: d.name,
          dataHora: d.createdAt,
          is_finished: false,
          midiasUri: [],
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
    if (!response.ok) throw new Error('Falha ao adicionar área de alagamento');
  }

  async limparTodosReportes(): Promise<void> {
    // Op não aplicável para client via API a não ser que tenha claims de ADMIN
  }
}
