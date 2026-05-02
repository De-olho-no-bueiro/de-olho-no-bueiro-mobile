import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polygon, Callout, Circle } from 'react-native-maps';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TipoReporte, NivelAlagamento, Manhole, FloodArea } from '@/features/reportes/models/Reporte';
import { ordenarPontosPoligono } from '@/features/reportes/utils/polygon';

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
  onCalloutPress?: (id: string, tipo: TipoReporte) => void;
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
    case 'baixo':
      return { fill: 'rgba(52, 199, 89, 0.22)', stroke: '#34C759' };
    case 'medio':
      return { fill: 'rgba(255, 184, 0, 0.24)', stroke: '#FFB800' };
    case 'avancado':
      return { fill: 'rgba(255, 136, 0, 0.24)', stroke: '#FF8800' };
    case 'extremo':
      return { fill: 'rgba(255, 59, 48, 0.24)', stroke: '#FF3B30' };
    default:
      return { fill: 'rgba(52, 199, 89, 0.22)', stroke: '#34C759' };
  }
}

export default function MapViewComponent({
  mapRef,
  region,
  onPress,
  onCalloutPress,
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
          pinColor={tintColor || colors.tint}
        >
          <Callout onPress={() => onCalloutPress?.(r.id, r.tipo)} tooltip={true}>
            <View style={styles.calloutWrapper}>
              <View style={styles.calloutBubble}>
                <View style={styles.calloutHeader}>
                  <View style={[styles.calloutIconWrapper, { backgroundColor: r.tipo === 'alagamento' ? '#E8F0FE' : '#FFF3E0' }]}>
                    <Ionicons name={r.tipo === 'alagamento' ? 'water' : 'warning'} size={18} color={r.tipo === 'alagamento' ? '#1A73E8' : '#F57C00'} />
                  </View>
                  <Text style={styles.calloutTitle}>{r.tipo === 'alagamento' ? 'Alagamento' : 'Bueiro'}</Text>
                </View>
                <Text style={styles.calloutDesc} numberOfLines={2}>{r.endereco}</Text>
                <View style={styles.calloutButton}>
                  <Text style={styles.calloutButtonText}>Veja mais</Text>
                </View>
              </View>
              <View style={styles.calloutArrow} />
            </View>
          </Callout>
        </Marker>
      ))}

      {savedManholes.map((m) => (
        <React.Fragment key={`manhole_${m.id}`}>
          <Circle
            center={{ latitude: m.latitude, longitude: m.longitude }}
            radius={50}
            fillColor="rgba(255, 149, 0, 0.12)"
            strokeColor="rgba(255, 149, 0, 0.45)"
            strokeWidth={1}
          />
          <Marker
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            tracksViewChanges={false}
            onPress={(e) => { e.stopPropagation(); }}
          >
            <View style={styles.customMarkerContainer}>
              <View style={styles.customMarkerHalo} />
              <View style={styles.customMarkerCore} />
            </View>
            <Callout onPress={() => onCalloutPress?.(m.id, 'bueiro')} tooltip={true}>
              <View style={styles.calloutWrapper}>
                <View style={styles.calloutBubble}>
                  <View style={styles.calloutHeader}>
                    <View style={[styles.calloutIconWrapper, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="warning" size={18} color="#F57C00" />
                    </View>
                    <Text style={styles.calloutTitle}>Bueiro Danificado</Text>
                  </View>
                  <Text style={styles.calloutDesc} numberOfLines={2}>{m.descricao || 'Sem descrição'}</Text>
                  <View style={styles.calloutButton}>
                    <Text style={styles.calloutButtonText}>Veja mais</Text>
                  </View>
                </View>
                <View style={styles.calloutArrow} />
              </View>
            </Callout>
          </Marker>
        </React.Fragment>
      ))}

      {savedFloodAreas.map((fa) => {
        const orderedCoordinates = ordenarPontosPoligono(fa.coordinates);
        const { fill, stroke } = getPolygonColors(fa.nivel);
        // Calculate an approximate centroid for the marker
        const lat = orderedCoordinates.reduce((acc, c) => acc + c.latitude, 0) / orderedCoordinates.length;
        const lon = orderedCoordinates.reduce((acc, c) => acc + c.longitude, 0) / orderedCoordinates.length;
        return (
          <React.Fragment key={`flood_${fa.id}`}>
            <Polygon
              coordinates={orderedCoordinates}
              fillColor={fill}
              strokeColor={stroke}
              strokeWidth={2}
              tappable
              onPress={(e) => { e.stopPropagation(); }}
            />
            {/* Invisible marker just to hold the Callout on top of the polygon */}
            <Marker coordinate={{ latitude: lat, longitude: lon }} opacity={0} onPress={(e) => e.stopPropagation()} tracksViewChanges={false}>
              <Callout onPress={() => onCalloutPress?.(fa.id, 'alagamento')} tooltip={true}>
                <View style={styles.calloutWrapper}>
                  <View style={styles.calloutBubble}>
                    <View style={styles.calloutHeader}>
                      <View style={[styles.calloutIconWrapper, { backgroundColor: '#FFEBEE' }]}>
                        <Ionicons name="water" size={18} color="#D32F2F" />
                      </View>
                      <Text style={styles.calloutTitle}>Área de Alagamento</Text>
                    </View>
                    <Text style={styles.calloutDesc} numberOfLines={2}>{fa.descricao || 'Sem descrição'}</Text>
                    <View style={styles.calloutButton}>
                      <Text style={styles.calloutButtonText}>Veja mais</Text>
                    </View>
                  </View>
                  <View style={styles.calloutArrow} />
                </View>
              </Callout>
            </Marker>
          </React.Fragment>
        );
      })}

      {drawingCoordinates.length > 0 && (
        <Polygon
          coordinates={ordenarPontosPoligono(drawingCoordinates)}
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
          tracksViewChanges={false}
        />
      ))}

      {selectedPoint && (
        <>
          <Circle
            center={selectedPoint}
            radius={50}
            fillColor="rgba(255, 59, 48, 0.12)"
            strokeColor="rgba(255, 59, 48, 0.45)"
            strokeWidth={1}
          />
          <Marker
            coordinate={selectedPoint}
            title="Novo ponto"
          >
            <View style={styles.customMarkerContainer}>
              <View style={[styles.customMarkerHalo, { backgroundColor: 'rgba(255, 59, 48, 0.25)' }]} />
              <View style={[styles.customMarkerCore, { backgroundColor: '#FF3B30' }]} />
            </View>
          </Marker>
        </>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
  },
  customMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  customMarkerHalo: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 149, 0, 0.25)', // Laranja translúcido
  },
  customMarkerCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF9500', // Laranja sólido
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 3,
  },
  calloutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 260,
  },
  calloutBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  calloutTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  calloutDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  calloutButton: {
    backgroundColor: '#007AFF', // Waze-like Blue
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  calloutArrow: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: '#fff',
    borderWidth: 16,
    alignSelf: 'center',
    marginTop: -2,
  }
});
