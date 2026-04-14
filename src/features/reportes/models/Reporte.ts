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
  midiasUri?: string[]; // Arrays nativos de file://
  midias?: string[];    // Array temporário carregado de Base64 para envio payload
  dataHora: string;
}

export interface Manhole {
  id: string;
  postId?: string;
  latitude: number;
  longitude: number;
  descricao?: string;
  dataHora: string;
  is_finished?: boolean;
  midiasUri?: string[];
  midias?: string[];
}

export interface FloodArea {
  id: string;
  postId?: string;
  coordinates: { latitude: number; longitude: number }[];
  nivel: NivelAlagamento; // 'baixo' | 'leve' | 'medio' | 'grave'
  descricao?: string;
  dataHora: string;
  is_finished?: boolean;
  midiasUri?: string[];
  midias?: string[];
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
