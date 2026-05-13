import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

interface MapViewComponentProps {
  mapRef: any;
  region?: Region;
  onPress: (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
  savedReportes: {
    id: string;
    tipo: string;
    latitude: number;
    longitude: number;
    endereco: string;
  }[];
  selectedPoint: { latitude: number; longitude: number } | null;
  colors: any;
  tintColor?: string;
}

export default function MapViewComponent({
  colors,
}: MapViewComponentProps) {
  return (
    <View style={[styles.map, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: colors.text, textAlign: 'center', padding: 20 }}>
        O mapa não é suportado na versão Web.{'\n'}Por favor, use o aplicativo no celular.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
  },
});
