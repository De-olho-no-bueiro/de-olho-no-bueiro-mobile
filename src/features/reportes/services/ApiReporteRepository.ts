import * as FileSystem from 'expo-file-system/legacy';
import { Reporte, Manhole, FloodArea, LocalPostMedia, PostMedia } from '@/features/reportes/models/Reporte';
import { IReporteRepository } from './IReporteRepository';
import { fetchWithAuth } from '@/core/utils/api';
import { encode as btoa } from 'base-64';
import { isWeb } from '@/core/utils/platform-capabilities';
import {
  cacheFloodAreas,
  cacheHistory,
  cacheManholes,
  cacheReportes,
  enqueuePendingSubmission,
  getCachedFloodAreas,
  getCachedHistory,
  getCachedManholes,
  getCachedReportes,
  getPendingSubmissions,
  removePendingSubmission,
} from './OfflineReporteQueue';

const normalizeNivel = (nivel?: string): Reporte['nivel'] => {
  switch (nivel) {
    case 'leve':
      return 'medio';
    case 'grave':
      return 'extremo';
    case 'avancado':
    case 'extremo':
    case 'medio':
    case 'baixo':
      return nivel;
    default:
      return 'baixo';
  }
};

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
    try {
      return `data:image/jpeg;base64,${btoa(binary)}`;
    } catch {}
  }
  return '';
};

const mapPostTypeToTipo = (type?: string): Reporte['tipo'] => (type === 'bueiro' ? 'bueiro' : 'alagamento');

const normalizeAuthorPhoto = (value: any): string | null => {
  const parsed = parseBufferToDataUrl(value);
  return parsed || null;
};

const normalizeRemoteMedia = (mediaObj: any, position: number): PostMedia | null => {
  if (mediaObj?.url) {
    return {
      id: mediaObj.id != null ? String(mediaObj.id) : undefined,
      storageKey: mediaObj.storageKey ?? null,
      url: mediaObj.url,
      mimeType: mediaObj.mimeType || 'image/jpeg',
      sizeBytes: Number(mediaObj.sizeBytes || 0),
      width: mediaObj.width ?? null,
      height: mediaObj.height ?? null,
      position: mediaObj.position ?? position,
    };
  }

  const legacyUrl = parseBufferToDataUrl(mediaObj);
  if (!legacyUrl) return null;

  return {
    id: `legacy-${position}`,
    storageKey: null,
    url: legacyUrl,
    mimeType: 'image/jpeg',
    sizeBytes: 0,
    width: null,
    height: null,
    position,
  };
};

const isPostMedia = (media: PostMedia | null): media is PostMedia => media !== null;
const isBrowserOffline = () =>
  isWeb && typeof navigator !== 'undefined' && navigator.onLine === false;

function dedupeById<T extends { id?: string; postId?: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.postId || item.id;
    if (!key) {
      return true;
    }

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

const mapPostToReporte = (d: any): Reporte => {
  const mediaUploads: PostMedia[] = Array.isArray(d.media)
    ? d.media.map(normalizeRemoteMedia).filter(isPostMedia)
    : Array.isArray(d.medias)
      ? d.medias.map(normalizeRemoteMedia).filter(isPostMedia)
      : [];
  const midiasUri = mediaUploads.map((item) => item.url);
  const coordinates =
    d.area && Array.isArray(d.area.latitude) && Array.isArray(d.area.longitude)
      ? d.area.latitude.map((lat: number, idx: number) => ({
          latitude: lat,
          longitude: d.area.longitude[idx],
        }))
      : undefined;

  return {
    id: d.id.toString(),
    postId: d.id.toString(),
    tipo: mapPostTypeToTipo(d.type),
    latitude: d.latitude ?? coordinates?.[0]?.latitude ?? 0,
    longitude: d.longitude ?? coordinates?.[0]?.longitude ?? 0,
    endereco: d.endereco || 'Endereço não informado',
    nivel: normalizeNivel(d.nivel),
    descricao: d.content || '',
    fotoUri: midiasUri[0] || null,
    fotoUrl: d.fotoUrl || midiasUri[0] || null,
    autor: d.author?.name || 'Usuário',
    autorFotoUrl: normalizeAuthorPhoto(d.author?.profilePicture),
    likeCount: d.likeCount ?? 0,
    likedByMe: Boolean(d.likedByMe),
    isActive: d.isActive ?? true,
    negativeReportsCount: d.negativeReportsCount ?? 0,
    postType: d.type,
    coordinates,
    midiasUri,
    mediaUploads: mediaUploads as PostMedia[],
    dataHora: d.createdAt,
  };
};

type PresignedUpload = {
  storageKey: string;
  uploadUrl: string;
  publicUrl: string;
  headers?: Record<string, string>;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

export class ApiReporteRepository implements IReporteRepository {
  async salvarReportes(reportes: Reporte[]): Promise<void> {
    // Ignorado na versão de API já que a nuvem é a fonte de verdade principal.
  }

  async carregarReportes(): Promise<Reporte[]> {
    try {
      const response = await fetchWithAuth('/mobile/v1/reportes');
      if (!response.ok) return getCachedReportes();
      const data = await response.json();
      const mapped = data.map(mapPostToReporte);
      const merged = dedupeById([...(await getCachedReportes()), ...mapped]);
      await cacheReportes(merged);
      return merged;
    } catch {
      return getCachedReportes();
    }
  }

  async adicionarReporte(reporte: Reporte): Promise<void> {
    if (isBrowserOffline()) {
      await enqueuePendingSubmission({ kind: 'reporte', payload: reporte });
      await cacheReportes(dedupeById([reporte, ...(await getCachedReportes())]));
      return;
    }

    try {
      const response = await fetchWithAuth('/mobile/v1/reportes', {
        method: 'POST',
        body: JSON.stringify(reporte)
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error(`[API] Erro ao adicionar reporte. Status: ${response.status}. Detalhes:`, errText);
        throw new Error(`Falha ao adicionar reporte (Status ${response.status})`);
      }
    } catch {
      await enqueuePendingSubmission({ kind: 'reporte', payload: reporte });
      await cacheReportes(dedupeById([reporte, ...(await getCachedReportes())]));
    }
  }

  async salvarManholes(manholes: Manhole[]): Promise<void> {}

  async carregarManholes(): Promise<Manhole[]> {
    try {
      const response = await fetchWithAuth('/mobile/v1/manholes');
      if (!response.ok) return getCachedManholes();
      const data = await response.json();
      const mapped = data.map((d: any) => {
        const latestPost = (d.posts && d.posts.length > 0) ? d.posts[0] : null;
        const rawMedias = latestPost?.media || latestPost?.medias || d.media || d.medias;
        const mediaUploads = rawMedias && Array.isArray(rawMedias)
          ? rawMedias.map(normalizeRemoteMedia).filter(isPostMedia)
          : [];
        const midiasParsed = mediaUploads.map((item) => item.url);
        const postId = latestPost ? latestPost.id.toString() : undefined;

        return {
          id: d.id.toString(),
          postId: postId,
          latitude: d.latitude,
          longitude: d.longitude,
          endereco: latestPost?.endereco || 'Endereço não informado',
          descricao: latestPost?.content || d.name,
          fotoUrl: latestPost?.fotoUrl || midiasParsed[0] || null,
          autor: latestPost?.author?.name || 'Usuário',
          autorFotoUrl: normalizeAuthorPhoto(latestPost?.author?.profilePicture),
          likeCount: latestPost?.likeCount ?? 0,
          likedByMe: Boolean(latestPost?.likedByMe),
          isActive: latestPost?.isActive ?? true,
          negativeReportsCount: latestPost?.negativeReportsCount ?? 0,
          dataHora: d.createdAt,
          is_finished: false,
          midiasUri: midiasParsed,
          mediaUploads,
        };
      });
      const merged = dedupeById([...(await getCachedManholes()), ...mapped]);
      await cacheManholes(merged);
      return merged;
    } catch {
      return getCachedManholes();
    }
  }

  async adicionarManhole(manhole: Manhole): Promise<void> {
    if (isBrowserOffline()) {
      await enqueuePendingSubmission({ kind: 'manhole', payload: manhole });
      await cacheManholes(dedupeById([manhole, ...(await getCachedManholes())]));
      return;
    }

    try {
      const response = await fetchWithAuth('/mobile/v1/manholes', {
        method: 'POST',
        body: JSON.stringify(manhole)
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error(`[API] Erro ao adicionar bueiro. Status: ${response.status}. Detalhes:`, errText);
        throw new Error(`Falha ao adicionar bueiro (Status ${response.status})`);
      }
    } catch {
      await enqueuePendingSubmission({ kind: 'manhole', payload: manhole });
      await cacheManholes(dedupeById([manhole, ...(await getCachedManholes())]));
    }
  }

  async salvarFloodAreas(areas: FloodArea[]): Promise<void> {}

  async carregarFloodAreas(): Promise<FloodArea[]> {
    try {
      const response = await fetchWithAuth('/mobile/v1/flood-areas');
      if (!response.ok) return getCachedFloodAreas();
      const data = await response.json();
      const mapped = data.map((d: any) => {
        // Converte os vetores unificados de latitude/longitude de volta em pt
        const coordinates = (d.latitude || []).map((lat: number, idx: number) => ({
          latitude: lat,
          longitude: d.longitude[idx],
        }));
        
        const latestPost = (d.posts && d.posts.length > 0) ? d.posts[0] : null;
        const rawMedias = latestPost?.media || latestPost?.medias || d.media || d.medias;
        const mediaUploads = rawMedias && Array.isArray(rawMedias)
          ? rawMedias.map(normalizeRemoteMedia).filter(isPostMedia)
          : [];
        const midiasParsed = mediaUploads.map((item) => item.url);
        const postId = latestPost ? latestPost.id.toString() : undefined;

        return {
          id: d.id.toString(),
          postId: postId,
          coordinates,
          endereco: latestPost?.endereco || 'Endereço não informado',
          nivel: normalizeNivel(latestPost?.nivel),
          descricao: latestPost?.content || d.name,
          fotoUrl: latestPost?.fotoUrl || midiasParsed[0] || null,
          autor: latestPost?.author?.name || 'Usuário',
          autorFotoUrl: normalizeAuthorPhoto(latestPost?.author?.profilePicture),
          latitude: latestPost?.latitude || coordinates[0]?.latitude,
          longitude: latestPost?.longitude || coordinates[0]?.longitude,
          likeCount: latestPost?.likeCount ?? 0,
          likedByMe: Boolean(latestPost?.likedByMe),
          isActive: latestPost?.isActive ?? true,
          negativeReportsCount: latestPost?.negativeReportsCount ?? 0,
          dataHora: d.createdAt,
          is_finished: false,
          midiasUri: midiasParsed,
          mediaUploads,
        };
      });
      const merged = dedupeById([...(await getCachedFloodAreas()), ...mapped]);
      await cacheFloodAreas(merged);
      return merged;
    } catch {
      return getCachedFloodAreas();
    }
  }

  async adicionarFloodArea(area: FloodArea): Promise<void> {
    if (isBrowserOffline()) {
      await enqueuePendingSubmission({ kind: 'floodArea', payload: area });
      await cacheFloodAreas(dedupeById([area, ...(await getCachedFloodAreas())]));
      return;
    }

    try {
      const response = await fetchWithAuth('/mobile/v1/flood-areas', {
        method: 'POST',
        body: JSON.stringify(area)
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error(`[API] Erro ao adicionar área de alagamento. Status: ${response.status}. Detalhes:`, errText);
        throw new Error(`Falha ao adicionar área de alagamento (Status ${response.status})`);
      }
    } catch {
      await enqueuePendingSubmission({ kind: 'floodArea', payload: area });
      await cacheFloodAreas(dedupeById([area, ...(await getCachedFloodAreas())]));
    }
  }

  async limparTodosReportes(): Promise<void> {
    // Op não aplicável para client via API a não ser que tenha claims de ADMIN
  }

  async prepararUploads(midias: LocalPostMedia[]): Promise<PostMedia[]> {
    if (!Array.isArray(midias) || midias.length === 0) return [];
    if (isBrowserOffline()) {
      throw new Error('Sem internet. Reportes com fotos precisam de conexão para enviar as mídias.');
    }

    const normalizedMedia = await Promise.all(
      midias.map(async (item) => {
        if (item.sizeBytes > 0) {
          return item;
        }

        const info = await FileSystem.getInfoAsync(item.uri);
        return {
          ...item,
          sizeBytes: info.exists && typeof info.size === 'number' ? info.size : 0,
        };
      }),
    );

    const presignResponse = await fetchWithAuth('/mobile/v1/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({
        files: normalizedMedia.map((item) => ({
          fileName: item.fileName,
          mimeType: item.mimeType,
          sizeBytes: item.sizeBytes,
          width: item.width,
          height: item.height,
        })),
      }),
    });

    console.log('[Uploads] presign request files:', normalizedMedia.map((item) => ({
      fileName: item.fileName,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      width: item.width,
      height: item.height,
    })));

    if (!presignResponse.ok) {
      const errText = await presignResponse.text();
      throw new Error(`Falha ao preparar uploads: ${presignResponse.status} ${errText}`);
    }

    const data = await presignResponse.json();
    const uploads = Array.isArray(data.uploads) ? (data.uploads as PresignedUpload[]) : [];

    if (uploads.length !== normalizedMedia.length) {
      throw new Error('Quantidade de uploads assinados diferente da quantidade de mídias.');
    }

    await Promise.all(
      uploads.map(async (upload, index) => {
        if (isWeb) {
          const sourceResponse = await fetch(normalizedMedia[index].uri);
          const blob = await sourceResponse.blob();
          const uploadResponse = await fetch(upload.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': upload.mimeType,
              ...(upload.headers || {}),
            },
            body: blob,
          });

          if (!uploadResponse.ok) {
            throw new Error(
              `Upload falhou para ${normalizedMedia[index].fileName} com status ${uploadResponse.status}`,
            );
          }
          return;
        }

        return FileSystem.uploadAsync(upload.uploadUrl, normalizedMedia[index].uri, {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'Content-Type': upload.mimeType,
            ...(upload.headers || {}),
          },
        }).then((result) => {
          console.log('[Uploads] upload result:', {
            fileName: normalizedMedia[index].fileName,
            status: result.status,
            body: result.body?.slice?.(0, 300) ?? '',
          });
          if (result.status < 200 || result.status >= 300) {
            throw new Error(
              `Upload falhou para ${normalizedMedia[index].fileName} com status ${result.status}: ${result.body || 'sem detalhes'}`,
            );
          }
        });
      }),
    );

    return uploads.map((upload, index) => ({
      storageKey: upload.storageKey,
      url: upload.publicUrl,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
      width: normalizedMedia[index].width,
      height: normalizedMedia[index].height,
      position: index,
    }));
  }

  async carregarDetalhePost(postId: string): Promise<Reporte | null> {
    try {
      const response = await fetchWithAuth(`/mobile/v1/reportes/${postId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return mapPostToReporte(data);
    } catch {
      return null;
    }
  }

  async toggleLike(postId: string): Promise<{ likedByMe: boolean; likeCount: number } | null> {
    try {
      const response = await fetchWithAuth(`/mobile/v1/reportes/${postId}/like`, {
        method: 'POST',
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async verifyPost(postId: string, isStillHappening: boolean): Promise<Partial<Reporte> | null> {
    try {
      const response = await fetchWithAuth(`/mobile/v1/reportes/${postId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ isStillHappening }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return {
        isActive: data.isActive,
        negativeReportsCount: data.negativeReportsCount,
      };
    } catch {
      return null;
    }
  }

  async carregarMeuHistorico(): Promise<Reporte[]> {
    try {
      const response = await fetchWithAuth('/mobile/v1/reportes/history/me');
      if (!response.ok) return getCachedHistory();
      const data = await response.json();
      const mapped = data.map(mapPostToReporte);
      const merged = dedupeById([...(await getCachedHistory()), ...mapped]);
      await cacheHistory(merged);
      return merged;
    } catch {
      return getCachedHistory();
    }
  }

  async carregarIncidentesAtivosParaNotificacao(): Promise<
    { postId: string; latitude: number; longitude: number; tipo: string; endereco: string; descricao: string }[]
  > {
    const [reportes, manholes, floodAreas] = await Promise.all([
      this.carregarReportes(),
      this.carregarManholes(),
      this.carregarFloodAreas(),
    ]);

    return [
      ...reportes.map((item) => ({
        postId: item.postId || item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        tipo: item.tipo,
        endereco: item.endereco,
        descricao: item.descricao,
      })),
      ...manholes
        .filter((item) => item.postId)
        .map((item) => ({
          postId: item.postId!,
          latitude: item.latitude,
          longitude: item.longitude,
          tipo: 'bueiro',
          endereco: item.endereco || 'Endereço não informado',
          descricao: item.descricao || '',
        })),
      ...floodAreas
        .filter((item) => item.postId && item.latitude != null && item.longitude != null)
        .map((item) => ({
          postId: item.postId!,
          latitude: item.latitude!,
          longitude: item.longitude!,
          tipo: 'alagamento',
          endereco: item.endereco || 'Endereço não informado',
          descricao: item.descricao || '',
        })),
    ];
  }

  async flushPendingSubmissions() {
    if (isBrowserOffline()) {
      return;
    }

    const pending = await getPendingSubmissions();

    for (const item of pending.slice().reverse()) {
      try {
        const endpoint =
          item.kind === 'reporte'
            ? '/mobile/v1/reportes'
            : item.kind === 'manhole'
              ? '/mobile/v1/manholes'
              : '/mobile/v1/flood-areas';

        const response = await fetchWithAuth(endpoint, {
          method: 'POST',
          body: JSON.stringify(item.payload),
        });

        if (!response.ok) {
          continue;
        }

        await removePendingSubmission(item.queueId);
      } catch {
        return;
      }
    }
  }
}
