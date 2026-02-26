import { Platform, View, StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

interface MapViewComponentProps {
  mapRef: React.RefObject<MapView>;
  region?: Region;
  onPress: (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
  savedReportes: Array<{
    id: string;
    tipo: string;
    latitude: number;
    longitude: number;
    endereco: string;
  }>;
  selectedPoint: { latitude: number; longitude: number } | null;
  colors: any;
  tintColor?: string;
}

export default function MapViewComponent({
  mapRef,
  region,
  onPress,
  savedReportes,
  selectedPoint,
  colors,
  tintColor,
}: MapViewComponentProps) {
  if (Platform.OS === 'web') {
    return <View style={styles.map} />;
  }

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
          key={r.id}
          coordinate={{ latitude: r.latitude, longitude: r.longitude }}
          title={r.tipo === 'alagamento' ? 'Alagamento' : 'Bueiro'}
          description={r.endereco}
          pinColor={tintColor || colors.tint}
        />
      ))}
      {selectedPoint && (
        <Marker
          coordinate={selectedPoint}
          title="Novo ponto"
          pinColor="#e74c3c"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
  },
});
