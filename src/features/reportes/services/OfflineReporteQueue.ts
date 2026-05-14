import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FloodArea, Manhole, Reporte } from '@/features/reportes/models/Reporte';

const PENDING_QUEUE_KEY = '@deolhonobueiro/pending-submissions';
const REPORTES_CACHE_KEY = '@deolhonobueiro/cache/reportes';
const MANHOLES_CACHE_KEY = '@deolhonobueiro/cache/manholes';
const FLOOD_AREAS_CACHE_KEY = '@deolhonobueiro/cache/flood-areas';
const HISTORY_CACHE_KEY = '@deolhonobueiro/cache/history';

export type PendingSubmission =
  | {
      queueId: string;
      kind: 'reporte';
      createdAt: string;
      payload: Reporte;
    }
  | {
      queueId: string;
      kind: 'manhole';
      createdAt: string;
      payload: Manhole;
    }
  | {
      queueId: string;
      kind: 'floodArea';
      createdAt: string;
      payload: FloodArea;
    };

async function readArray<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeArray<T>(key: string, value: T[]) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

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

export async function getPendingSubmissions() {
  return readArray<PendingSubmission>(PENDING_QUEUE_KEY);
}

export async function enqueuePendingSubmission(
  entry: Omit<PendingSubmission, 'queueId' | 'createdAt'>,
) {
  const queue = await getPendingSubmissions();
  const nextEntry: PendingSubmission = {
    ...entry,
    queueId: `${entry.kind}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  } as PendingSubmission;

  queue.unshift(nextEntry);
  await writeArray(PENDING_QUEUE_KEY, queue);
  return nextEntry;
}

export async function removePendingSubmission(queueId: string) {
  const queue = await getPendingSubmissions();
  await writeArray(
    PENDING_QUEUE_KEY,
    queue.filter((item) => item.queueId !== queueId),
  );
}

export async function cacheReportes(reportes: Reporte[]) {
  await writeArray(REPORTES_CACHE_KEY, reportes);
}

export async function cacheManholes(manholes: Manhole[]) {
  await writeArray(MANHOLES_CACHE_KEY, manholes);
}

export async function cacheFloodAreas(areas: FloodArea[]) {
  await writeArray(FLOOD_AREAS_CACHE_KEY, areas);
}

export async function cacheHistory(items: Reporte[]) {
  await writeArray(HISTORY_CACHE_KEY, items);
}

export async function getCachedReportes() {
  const cached = await readArray<Reporte>(REPORTES_CACHE_KEY);
  const pending = await getPendingSubmissions();
  const localPending = pending
    .filter((item): item is Extract<PendingSubmission, { kind: 'reporte' }> => item.kind === 'reporte')
    .map((item) => item.payload);

  return dedupeById([...localPending, ...cached]);
}

export async function getCachedManholes() {
  const cached = await readArray<Manhole>(MANHOLES_CACHE_KEY);
  const pending = await getPendingSubmissions();
  const localPending = pending
    .filter((item): item is Extract<PendingSubmission, { kind: 'manhole' }> => item.kind === 'manhole')
    .map((item) => item.payload);

  return dedupeById([...localPending, ...cached]);
}

export async function getCachedFloodAreas() {
  const cached = await readArray<FloodArea>(FLOOD_AREAS_CACHE_KEY);
  const pending = await getPendingSubmissions();
  const localPending = pending
    .filter((item): item is Extract<PendingSubmission, { kind: 'floodArea' }> => item.kind === 'floodArea')
    .map((item) => item.payload);

  return dedupeById([...localPending, ...cached]);
}

export async function getCachedHistory() {
  const cached = await readArray<Reporte>(HISTORY_CACHE_KEY);
  const pending = await getPendingSubmissions();
  const localPending = pending
    .filter((item): item is Extract<PendingSubmission, { kind: 'reporte' }> => item.kind === 'reporte')
    .map((item) => item.payload);

  return dedupeById([...localPending, ...cached]);
}
