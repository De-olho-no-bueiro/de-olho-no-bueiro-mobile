export type TipoReporte = 'alagamento' | 'bueiro';
export type NivelAlagamento = 'baixo' | 'leve' | 'medio' | 'grave';

export interface Reporte {
  id: string;
  tipo: TipoReporte;
  latitude: number;
  longitude: number;
  endereco: string;
  nivel: NivelAlagamento;
  descricao: string;
  fotoUri: string | null;
  dataHora: string;
}

export interface Manhole {
  id: string;
  latitude: number;
  longitude: number;
  descricao?: string;
  dataHora: string;
  is_finished?: boolean;
  midiasUri?: string[];
}

export interface FloodArea {
  id: string;
  coordinates: { latitude: number; longitude: number }[];
  nivel: NivelAlagamento; // 'baixo' | 'leve' | 'medio' | 'grave'
  descricao?: string;
  dataHora: string;
  is_finished?: boolean;
  midiasUri?: string[];
}

export const TIPO_LABELS: Record<TipoReporte, string> = {
  alagamento: 'Alagamento',
  bueiro: 'Problema em Bueiro',
};

export const NIVEL_LABELS: Record<NivelAlagamento, string> = {
  baixo: 'Baixo',
  leve: 'Leve',
  medio: 'Médio',
  grave: 'Grave',
};
