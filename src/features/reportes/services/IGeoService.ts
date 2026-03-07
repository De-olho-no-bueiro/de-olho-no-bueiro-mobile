export interface IGeoService {
  distanciaEmKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
  estaDentroDoRaio(userLat: number, userLon: number, pontoLat: number, pontoLon: number, raioMaximoKm: number): boolean;
  getRaioMaximoPermitidoKm(): number;
}
