/**
 * Tipos para reportes de alagamento e bueiros
 */

export type TipoReporte = 'alagamento' | 'bueiro';

export type NivelAlagamento = 'leve' | 'medio' | 'grave';

export interface Reporte {
  id: string;
  tipo: TipoReporte;
  latitude: number;
  longitude: number;
  endereco: string;
  nivel: NivelAlagamento;
  descricao: string;
  fotoUri: string | null;
  dataHora: string; // ISO 8601
}

export const NIVEL_LABELS: Record<NivelAlagamento, string> = {
  leve: 'Leve',
  medio: 'Médio',
  grave: 'Grave',
};

export const TIPO_LABELS: Record<TipoReporte, string> = {
  alagamento: 'Alagamento',
  bueiro: 'Bueiro / Drenagem',
};
