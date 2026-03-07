import { Platform, View, StyleSheet } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { Text } from 'react-native';
import type { TipoReporte, NivelAlagamento, Manhole, FloodArea } from '@/features/reportes/models/Reporte';

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

interface MapViewComponentProps {
  mapRef: React.RefObject<MapView>;
  region?: Region;
  onPress: (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
  savedReportes: Array<{
    id: string;
    tipo: TipoReporte;
    latitude: number;
    longitude: number;
    endereco: string;
  }>;
  savedManholes: Manhole[];
  savedFloodAreas: FloodArea[];
  drawingCoordinates: { latitude: number; longitude: number }[];
  selectedPoint: { latitude: number; longitude: number } | null;
  colors: any;
  tintColor?: string;
}

function getPolygonColors(nivel: NivelAlagamento) {
  switch (nivel) {
    case 'leve': return { fill: 'rgba(255, 235, 59, 0.4)', stroke: 'rgba(255, 235, 59, 0.8)' }; // Amarelo/Verde
    case 'medio': return { fill: 'rgba(255, 152, 0, 0.4)', stroke: 'rgba(255, 152, 0, 0.8)' }; // Laranja
    case 'grave': return { fill: 'rgba(244, 67, 54, 0.4)', stroke: 'rgba(244, 67, 54, 0.8)' }; // Vermelho
    default: return { fill: 'rgba(0, 0, 0, 0.3)', stroke: 'rgba(0,0,0,0.6)' };
  }
}

export default function MapViewComponent({
  mapRef,
  region,
  onPress,
  savedReportes,
  savedManholes,
  savedFloodAreas,
  drawingCoordinates,
  selectedPoint,
  colors,
  tintColor,
}: MapViewComponentProps) {
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      region={region}
      onPress={onPress}
      showsUserLocation
      showsMyLocationButton
      mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
      {savedReportes.map((r) => (
        <Marker
          key={`report_${r.id}`}
          coordinate={{ latitude: r.latitude, longitude: r.longitude }}
          title={r.tipo === 'alagamento' ? 'Alagamento' : 'Bueiro'}
          description={r.endereco}
          pinColor={tintColor || colors.tint}
        />
      ))}

      {savedManholes.map((m) => (
        <Marker
          key={`manhole_${m.id}`}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          title="Bueiro"
          description={m.descricao}
          onPress={(e) => { e.stopPropagation(); }}
        >
          <View style={styles.wazePinContainer}>
            <View style={styles.wazePinIndicator}>
              <Text style={styles.wazePinEmoji}>🚧</Text>
            </View>
            <View style={styles.wazePinTail} />
          </View>
        </Marker>
      ))}

      {savedFloodAreas.map((fa) => {
        const { fill, stroke } = getPolygonColors(fa.nivel);
        return (
          <Polygon
            key={`flood_${fa.id}`}
            coordinates={fa.coordinates}
            fillColor={fill}
            strokeColor={stroke}
            strokeWidth={2}
            tappable
            onPress={(e) => { e.stopPropagation(); }}
          />
        );
      })}

      {drawingCoordinates.length > 0 && (
        <Polygon
          coordinates={drawingCoordinates}
          fillColor="rgba(0, 150, 255, 0.3)" // Blue for drawing preview
          strokeColor="rgba(0, 150, 255, 0.8)"
          strokeWidth={2}
        />
      )}
      {drawingCoordinates.map((coord, index) => (
        <Marker 
          key={`drawing_${index}`} 
          coordinate={coord} 
          pinColor="blue" 
          title={`Ponto ${index + 1}`} 
        />
      ))}

      {selectedPoint && (
        <Marker
          coordinate={selectedPoint}
          title="Novo ponto"
        >
          <View style={styles.wazePinContainer}>
            <View style={[styles.wazePinIndicator, { backgroundColor: '#FF3B30', borderColor: '#FFF' }]}>
              <Text style={styles.wazePinEmoji}>➕</Text>
            </View>
            <View style={[styles.wazePinTail, { borderTopColor: '#FF3B30' }]} />
          </View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
  },
  wazePinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 50,
  },
  wazePinIndicator: {
    backgroundColor: '#FF9500',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 2,
  },
  wazePinEmoji: {
    fontSize: 16,
  },
  wazePinTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF9500',
    marginTop: -2,
    zIndex: 1,
  }
});
