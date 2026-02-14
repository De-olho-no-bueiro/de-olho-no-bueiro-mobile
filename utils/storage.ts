import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reporte } from '@/types/report';

const STORAGE_KEY = '@deolhonobueiro/reportes';

export async function salvarReportes(reportes: Reporte[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reportes));
}

export async function carregarReportes(): Promise<Reporte[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function adicionarReporte(reporte: Reporte): Promise<void> {
  const atuais = await carregarReportes();
  atuais.unshift(reporte);
  await salvarReportes(atuais);
}

export async function limparTodosReportes(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
