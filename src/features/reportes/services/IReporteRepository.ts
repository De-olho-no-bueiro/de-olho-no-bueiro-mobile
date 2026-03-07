import { Reporte, Manhole, FloodArea } from '@/features/reportes/models/Reporte';

export interface IReporteRepository {
  salvarReportes(reportes: Reporte[]): Promise<void>;
  carregarReportes(): Promise<Reporte[]>;
  adicionarReporte(reporte: Reporte): Promise<void>;
  
  salvarManholes(manholes: Manhole[]): Promise<void>;
  carregarManholes(): Promise<Manhole[]>;
  adicionarManhole(manhole: Manhole): Promise<void>;

  salvarFloodAreas(areas: FloodArea[]): Promise<void>;
  carregarFloodAreas(): Promise<FloodArea[]>;
  adicionarFloodArea(area: FloodArea): Promise<void>;

  limparTodosReportes(): Promise<void>;
}
