import AsyncStorage from '@react-native-async-storage/async-storage';
import { IReporteRepository } from '@/features/reportes/services/IReporteRepository';
import { Reporte, Manhole, FloodArea } from '@/features/reportes/models/Reporte';

const STORAGE_KEY = '@deolhonobueiro/reportes';
const MANHOLES_KEY = '@deolhonobueiro/manholes';
const FLOOD_AREAS_KEY = '@deolhonobueiro/flood_areas';

export class AsyncStorageReporteRepository implements IReporteRepository {
  async salvarReportes(reportes: Reporte[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reportes));
  }

  async carregarReportes(): Promise<Reporte[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async adicionarReporte(reporte: Reporte): Promise<void> {
    const atuais = await this.carregarReportes();
    atuais.unshift(reporte);
    await this.salvarReportes(atuais);
  }

  async salvarManholes(manholes: Manhole[]): Promise<void> {
    await AsyncStorage.setItem(MANHOLES_KEY, JSON.stringify(manholes));
  }

  async carregarManholes(): Promise<Manhole[]> {
    const raw = await AsyncStorage.getItem(MANHOLES_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async adicionarManhole(manhole: Manhole): Promise<void> {
    const atuais = await this.carregarManholes();
    atuais.unshift(manhole);
    await this.salvarManholes(atuais);
  }

  async salvarFloodAreas(areas: FloodArea[]): Promise<void> {
    await AsyncStorage.setItem(FLOOD_AREAS_KEY, JSON.stringify(areas));
  }

  async carregarFloodAreas(): Promise<FloodArea[]> {
    const raw = await AsyncStorage.getItem(FLOOD_AREAS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async adicionarFloodArea(area: FloodArea): Promise<void> {
    const atuais = await this.carregarFloodAreas();
    atuais.unshift(area);
    await this.salvarFloodAreas(atuais);
  }

  async limparTodosReportes(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(MANHOLES_KEY);
    await AsyncStorage.removeItem(FLOOD_AREAS_KEY);
  }
}
