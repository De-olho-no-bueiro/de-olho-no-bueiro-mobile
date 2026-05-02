export type TipoReporte = 'alagamento' | 'bueiro';
export type NivelAlagamento = 'baixo' | 'medio' | 'avancado' | 'extremo';

export interface Reporte {
  id: string;
  postId?: string;
  tipo: TipoReporte;
  latitude: number;
  longitude: number;
  endereco: string;
  nivel: NivelAlagamento;
  descricao: string;
  fotoUri: string | null;
  autor?: string;
  autorFotoUrl?: string | null;
  likeCount?: number;
  likedByMe?: boolean;
  isActive?: boolean;
  negativeReportsCount?: number;
  postType?: string;
  coordinates?: { latitude: number; longitude: number }[];
  midiasUri?: string[]; // Arrays nativos de file://
  midias?: string[];    // Array temporário carregado de Base64 para envio payload
  dataHora: string;
}

export interface Manhole {
  id: string;
  postId?: string;
  latitude: number;
  longitude: number;
  endereco?: string;
  descricao?: string;
  autor?: string;
  autorFotoUrl?: string | null;
  likeCount?: number;
  likedByMe?: boolean;
  isActive?: boolean;
  negativeReportsCount?: number;
  dataHora: string;
  is_finished?: boolean;
  midiasUri?: string[];
  midias?: string[];
}

export interface FloodArea {
  id: string;
  postId?: string;
  coordinates: { latitude: number; longitude: number }[];
  endereco?: string;
  nivel: NivelAlagamento;
  descricao?: string;
  autor?: string;
  autorFotoUrl?: string | null;
  latitude?: number;
  longitude?: number;
  likeCount?: number;
  likedByMe?: boolean;
  isActive?: boolean;
  negativeReportsCount?: number;
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
  medio: 'Médio',
  avancado: 'Avançado',
  extremo: 'Extremo',
};
