/**
 * Utilitários de geolocalização
 */

const RAIO_TERRA_KM = 6371;

/**
 * Calcula a distância em km entre dois pontos (fórmula de Haversine).
 */
export function distanciaEmKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RAIO_TERRA_KM * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export const RAIO_MAXIMO_KM = 2;

/**
 * Verifica se o ponto (lat, lon) está dentro do raio permitido (2 km) da posição do usuário.
 */
export function estaDentroDoRaio(
  userLat: number,
  userLon: number,
  pontoLat: number,
  pontoLon: number
): boolean {
  return distanciaEmKm(userLat, userLon, pontoLat, pontoLon) <= RAIO_MAXIMO_KM;
}
