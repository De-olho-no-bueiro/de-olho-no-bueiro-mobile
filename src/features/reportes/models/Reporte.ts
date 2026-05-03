export type TipoReporte = 'alagamento' | 'bueiro';
export type NivelAlagamento = 'baixo' | 'medio' | 'avancado' | 'extremo';

export interface PostMedia {
  id?: string;
  storageKey?: string | null;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  position?: number;
}

export interface LocalPostMedia {
  uri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

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
  fotoUrl?: string | null;
  autor?: string;
  autorFotoUrl?: string | null;
  likeCount?: number;
  likedByMe?: boolean;
  isActive?: boolean;
  negativeReportsCount?: number;
  postType?: string;
  coordinates?: { latitude: number; longitude: number }[];
  midiasUri?: string[]; // Arrays nativos de file://
  mediaUploads?: PostMedia[];
  dataHora: string;
}

export interface Manhole {
  id: string;
  postId?: string;
  latitude: number;
  longitude: number;
  endereco?: string;
  descricao?: string;
  fotoUrl?: string | null;
  autor?: string;
  autorFotoUrl?: string | null;
  likeCount?: number;
  likedByMe?: boolean;
  isActive?: boolean;
  negativeReportsCount?: number;
  dataHora: string;
  is_finished?: boolean;
  midiasUri?: string[];
  mediaUploads?: PostMedia[];
}

export interface FloodArea {
  id: string;
  postId?: string;
  coordinates: { latitude: number; longitude: number }[];
  endereco?: string;
  nivel: NivelAlagamento;
  descricao?: string;
  fotoUrl?: string | null;
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
  mediaUploads?: PostMedia[];
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
