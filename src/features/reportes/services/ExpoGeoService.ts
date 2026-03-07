import { IGeoService } from '@/features/reportes/services/IGeoService';

const RAIO_TERRA_KM = 6371;
const RAIO_MAXIMO_KM_PERMITIDO = 2; // O limite máximo estabelecido pelas regras de negócio

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export class ExpoGeoService implements IGeoService {
  /**
   * Calcula a distância em km entre dois pontos (fórmula de Haversine).
   */
  distanciaEmKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return RAIO_TERRA_KM * c;
  }

  estaDentroDoRaio(
    userLat: number,
    userLon: number,
    pontoLat: number,
    pontoLon: number,
    raioMaximoKm: number
  ): boolean {
    return this.distanciaEmKm(userLat, userLon, pontoLat, pontoLon) <= raioMaximoKm;
  }

  getRaioMaximoPermitidoKm(): number {
    return RAIO_MAXIMO_KM_PERMITIDO;
  }
}
