import React from 'react';
import Constants from 'expo-constants';
import { View, StyleSheet, Text, Platform, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import MapView, { Marker, Polygon, Callout, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { TipoReporte, NivelAlagamento, Manhole, FloodArea } from '@/features/reportes/models/Reporte';
import { ordenarPontosPoligono } from '@/features/reportes/utils/polygon';

type MarkerRef = InstanceType<typeof Marker>;
type CalloutIconName = React.ComponentProps<typeof Ionicons>['name'];
type Coordinate = { latitude: number; longitude: number };

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
  savedReportes: {
    id: string;
    tipo: TipoReporte;
    latitude: number;
    longitude: number;
    endereco: string;
  }[];
  savedManholes: Manhole[];
  savedFloodAreas: FloodArea[];
  isDrawing: boolean;
  drawingCoordinates: { latitude: number; longitude: number }[];
  selectedPoint: { latitude: number; longitude: number } | null;
  colors: any;
  tintColor?: string;
  androidBottomOverlayInset?: number;
}

type CalloutPayload = {
  id: string;
  tipo: TipoReporte;
  title: string;
  description: string;
  coordinate: Coordinate;
  iconName: CalloutIconName;
  iconBackgroundColor: string;
  iconColor: string;
};

type CalloutCardPayload = Omit<CalloutPayload, 'coordinate'>;

const ANDROID_CALLOUT_MAX_WIDTH = 260;
const ANDROID_CALLOUT_HORIZONTAL_MARGIN = 12;
const ANDROID_CALLOUT_VERTICAL_OFFSET = 170;
const ANDROID_CALLOUT_TOP_MARGIN = 16;
const ANDROID_CALLOUT_BOTTOM_MARGIN = 20;
const ANDROID_CALLOUT_ESTIMATED_HEIGHT = 182;
const expoConfigExtra = (Constants.expoConfig?.extra ?? {}) as {
  googleMapsConfigured?: boolean;
};
const HAS_GOOGLE_MAPS_KEY =
  expoConfigExtra.googleMapsConfigured === true ||
  Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());

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
  isDrawing: _isDrawing,
  drawingCoordinates,
  selectedPoint,
  colors,
  tintColor,
  androidBottomOverlayInset = 0,
}: MapViewComponentProps) {
  const { width: windowWidth } = useWindowDimensions();
  const reportMarkerRefs = React.useRef<Record<string, MarkerRef | null>>({});
  const manholeMarkerRefs = React.useRef<Record<string, MarkerRef | null>>({});
  const floodMarkerRefs = React.useRef<Record<string, MarkerRef | null>>({});
  const [selectedFloodAreaId, setSelectedFloodAreaId] = React.useState<string | null>(null);
  const [androidCallout, setAndroidCallout] = React.useState<CalloutPayload | null>(null);
  const [androidCalloutPoint, setAndroidCalloutPoint] = React.useState<{ x: number; y: number } | null>(null);
  const [androidCalloutHeight, setAndroidCalloutHeight] = React.useState(ANDROID_CALLOUT_ESTIMATED_HEIGHT);
  const [mapLayout, setMapLayout] = React.useState({ width: 0, height: 0 });
  const isAndroid = Platform.OS === 'android';
  const calloutWidth = React.useMemo(() => {
    const availableWidth = (mapLayout.width || windowWidth) - ANDROID_CALLOUT_HORIZONTAL_MARGIN * 2;
    return Math.max(200, Math.min(ANDROID_CALLOUT_MAX_WIDTH, availableWidth));
  }, [mapLayout.width, windowWidth]);

  const closeAndroidCallout = React.useCallback(() => {
    setAndroidCallout(null);
    setAndroidCalloutPoint(null);
  }, []);

  const updateAndroidCalloutPosition = React.useCallback(
    async (coordinate: Coordinate) => {
      if (!isAndroid) return;

      try {
        const point = await (mapRef.current as any)?.pointForCoordinate?.(coordinate);
        if (point) {
          setAndroidCalloutPoint({ x: point.x, y: point.y });
        }
      } catch {
        setAndroidCalloutPoint(null);
      }
    },
    [isAndroid, mapRef],
  );

  const handleMarkerPress = React.useCallback(
    async (payload: CalloutPayload, markerRef?: MarkerRef | null) => {
      if (!isAndroid) {
        markerRef?.showCallout?.();
        return;
      }

      setAndroidCallout(payload);
      await updateAndroidCalloutPosition(payload.coordinate);
    },
    [isAndroid, updateAndroidCalloutPosition],
  );

  const renderCalloutCard = React.useCallback(
    ({
      payload,
      interactive = false,
      onActionPress,
    }: {
      payload: CalloutCardPayload;
      interactive?: boolean;
      onActionPress?: () => void;
    }) => (
      <View style={styles.calloutBubble}>
        <View style={styles.calloutBody}>
          <View style={styles.calloutHeader}>
            <View
              style={[
                styles.calloutIconWrapper,
                { backgroundColor: payload.iconBackgroundColor },
              ]}
            >
              <Ionicons
                name={payload.iconName}
                size={18}
                color={payload.iconColor}
              />
            </View>
            <Text style={styles.calloutTitle}>{payload.title}</Text>
          </View>
          <Text style={styles.calloutDesc} numberOfLines={2}>
            {payload.description}
          </Text>
        </View>
        <View style={styles.calloutActionContainer}>
          {interactive ? (
            <TouchableOpacity
              onPress={onActionPress}
              activeOpacity={0.9}
              style={styles.calloutButton}
            >
              <Text style={styles.calloutButtonText}>Veja mais</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.calloutButton}>
              <Text style={styles.calloutButtonText}>Veja mais</Text>
            </View>
          )}
        </View>
      </View>
    ),
    [calloutWidth],
  );

  const renderCalloutContent = React.useCallback(
    (payload: CalloutCardPayload) => (
      <View style={[styles.calloutWrapper, { width: calloutWidth }]}>
        {renderCalloutCard({ payload })}
        <View style={styles.calloutArrow} />
      </View>
    ),
    [renderCalloutCard, calloutWidth],
  );

  const renderNativeCallout = React.useCallback(
    (payload: Omit<CalloutPayload, 'coordinate'>) => {
      if (isAndroid) return null;

      return (
        <Callout
          onPress={() => onCalloutPress?.(payload.id, payload.tipo)}
          tooltip
        >
          {renderCalloutContent(payload)}
        </Callout>
      );
    },
    [isAndroid, onCalloutPress, renderCalloutContent],
  );

  const androidCalloutStyle = React.useMemo(() => {
    if (!androidCalloutPoint || mapLayout.width <= 0) return null;

    const reservedBottomSpace = Math.max(
      ANDROID_CALLOUT_BOTTOM_MARGIN,
      androidBottomOverlayInset + ANDROID_CALLOUT_BOTTOM_MARGIN,
    );

    const left = Math.min(
      Math.max(
        androidCalloutPoint.x - calloutWidth / 2,
        ANDROID_CALLOUT_HORIZONTAL_MARGIN,
      ),
      Math.max(
        ANDROID_CALLOUT_HORIZONTAL_MARGIN,
        mapLayout.width - calloutWidth - ANDROID_CALLOUT_HORIZONTAL_MARGIN,
      ),
    );

    const top = Math.min(
      Math.max(
        ANDROID_CALLOUT_TOP_MARGIN,
        androidCalloutPoint.y - ANDROID_CALLOUT_VERTICAL_OFFSET,
      ),
      Math.max(
        ANDROID_CALLOUT_TOP_MARGIN,
        mapLayout.height - androidCalloutHeight - reservedBottomSpace,
      ),
    );

    const arrowLeft = Math.min(
      Math.max(androidCalloutPoint.x - left - 16, 20),
      calloutWidth - 36,
    );

    return { left, top, arrowLeft };
  }, [
    androidBottomOverlayInset,
    androidCalloutHeight,
    androidCalloutPoint,
    calloutWidth,
    mapLayout.height,
    mapLayout.width,
  ]);

  if (isAndroid && !HAS_GOOGLE_MAPS_KEY) {
    return (
      <View style={[styles.mapContainer, styles.mapUnavailableContainer]}>
        <Ionicons name="warning-outline" size={28} color="#F57C00" />
        <Text style={styles.mapUnavailableTitle}>Mapa indisponivel</Text>
        <Text style={styles.mapUnavailableText}>
          Configure `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` antes de gerar o APK
          Android.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.mapContainer}
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;
        setMapLayout({ width, height });
      }}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onPress={(e) => {
          setSelectedFloodAreaId(null);
          closeAndroidCallout();
          onPress(e);
        }}
        onRegionChangeComplete={() => {
          if (androidCallout) {
            void updateAndroidCalloutPosition(androidCallout.coordinate);
          }
        }}
        showsUserLocation
        showsMyLocationButton
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        {savedReportes.map((r) => (
          <Marker
            ref={(ref) => {
              reportMarkerRefs.current[r.id] = ref;
            }}
            key={`report_${r.id}`}
            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
            pinColor={tintColor || colors.tint}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedFloodAreaId(null);
              void handleMarkerPress(
                {
                  id: r.id,
                  tipo: r.tipo,
                  title: r.tipo === 'alagamento' ? 'Alagamento' : 'Bueiro',
                  description: r.endereco,
                  coordinate: { latitude: r.latitude, longitude: r.longitude },
                  iconName: r.tipo === 'alagamento' ? 'water' : 'warning',
                  iconBackgroundColor: r.tipo === 'alagamento' ? '#E8F0FE' : '#FFF3E0',
                  iconColor: r.tipo === 'alagamento' ? '#1A73E8' : '#F57C00',
                },
                reportMarkerRefs.current[r.id],
              );
            }}
          >
            {renderNativeCallout({
              id: r.id,
              tipo: r.tipo,
              title: r.tipo === 'alagamento' ? 'Alagamento' : 'Bueiro',
              description: r.endereco,
              iconName: r.tipo === 'alagamento' ? 'water' : 'warning',
              iconBackgroundColor: r.tipo === 'alagamento' ? '#E8F0FE' : '#FFF3E0',
              iconColor: r.tipo === 'alagamento' ? '#1A73E8' : '#F57C00',
            })}
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
              ref={(ref) => {
                manholeMarkerRefs.current[m.id] = ref;
              }}
              coordinate={{ latitude: m.latitude, longitude: m.longitude }}
              tracksViewChanges={false}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedFloodAreaId(null);
                void handleMarkerPress(
                  {
                    id: m.id,
                    tipo: 'bueiro',
                    title: 'Bueiro Danificado',
                    description: m.descricao || 'Sem descrição',
                    coordinate: { latitude: m.latitude, longitude: m.longitude },
                    iconName: 'warning',
                    iconBackgroundColor: '#FFF3E0',
                    iconColor: '#F57C00',
                  },
                  manholeMarkerRefs.current[m.id],
                );
              }}
            >
              <View style={styles.customMarkerContainer}>
                <View style={styles.customMarkerHalo} />
                <View style={styles.customMarkerCore} />
              </View>
              {renderNativeCallout({
                id: m.id,
                tipo: 'bueiro',
                title: 'Bueiro Danificado',
                description: m.descricao || 'Sem descrição',
                iconName: 'warning',
                iconBackgroundColor: '#FFF3E0',
                iconColor: '#F57C00',
              })}
            </Marker>
          </React.Fragment>
        ))}

        {savedFloodAreas.map((fa) => {
          const orderedCoordinates = ordenarPontosPoligono(fa.coordinates);
          const { fill, stroke } = getPolygonColors(fa.nivel);
          const lat =
            orderedCoordinates.reduce((acc, c) => acc + c.latitude, 0) /
            orderedCoordinates.length;
          const lon =
            orderedCoordinates.reduce((acc, c) => acc + c.longitude, 0) /
            orderedCoordinates.length;
          const centroid = { latitude: lat, longitude: lon };

          return (
            <React.Fragment key={`flood_${fa.id}`}>
              <Polygon
                coordinates={orderedCoordinates}
                fillColor={fill}
                strokeColor={stroke}
                strokeWidth={2}
                tappable
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedFloodAreaId(fa.id);
                  void handleMarkerPress(
                    {
                      id: fa.id,
                      tipo: 'alagamento',
                      title: 'Área de Alagamento',
                      description: fa.descricao || 'Sem descrição',
                      coordinate: centroid,
                      iconName: 'water',
                      iconBackgroundColor: '#FFEBEE',
                      iconColor: '#D32F2F',
                    },
                    floodMarkerRefs.current[fa.id],
                  );
                }}
              />
              <Marker
                ref={(ref) => {
                  floodMarkerRefs.current[fa.id] = ref;
                }}
                coordinate={centroid}
                opacity={selectedFloodAreaId === fa.id ? 1 : 0.01}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedFloodAreaId(fa.id);
                  void handleMarkerPress(
                    {
                      id: fa.id,
                      tipo: 'alagamento',
                      title: 'Área de Alagamento',
                      description: fa.descricao || 'Sem descrição',
                      coordinate: centroid,
                      iconName: 'water',
                      iconBackgroundColor: '#FFEBEE',
                      iconColor: '#D32F2F',
                    },
                    floodMarkerRefs.current[fa.id],
                  );
                }}
                tracksViewChanges={false}
              >
                <View style={styles.floodMarkerContainer}>
                  <View style={styles.floodMarkerHalo} />
                  <View style={styles.floodMarkerCore}>
                    <Ionicons name="water" size={12} color="#FFFFFF" />
                  </View>
                </View>
                {renderNativeCallout({
                  id: fa.id,
                  tipo: 'alagamento',
                  title: 'Área de Alagamento',
                  description: fa.descricao || 'Sem descrição',
                  iconName: 'water',
                  iconBackgroundColor: '#FFEBEE',
                  iconColor: '#D32F2F',
                })}
              </Marker>
            </React.Fragment>
          );
        })}

        {drawingCoordinates.length > 0 && (
          <Polygon
            coordinates={ordenarPontosPoligono(drawingCoordinates)}
            fillColor="rgba(0, 150, 255, 0.3)"
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
            <Marker coordinate={selectedPoint} title="Novo ponto">
              <View style={styles.customMarkerContainer}>
                <View
                  style={[
                    styles.customMarkerHalo,
                    { backgroundColor: 'rgba(255, 59, 48, 0.25)' },
                  ]}
                />
                <View
                  style={[
                    styles.customMarkerCore,
                    { backgroundColor: '#FF3B30' },
                  ]}
                />
              </View>
            </Marker>
          </>
        )}
      </MapView>

      {isAndroid && androidCallout && androidCalloutStyle ? (
        <View
          pointerEvents="box-none"
          onLayout={({ nativeEvent }) => {
            const nextHeight = Math.ceil(nativeEvent.layout.height);
            if (nextHeight > 0 && nextHeight !== androidCalloutHeight) {
              setAndroidCalloutHeight(nextHeight);
            }
          }}
          style={[
            styles.androidCalloutContainer,
            {
              width: calloutWidth,
              left: androidCalloutStyle.left,
              top: androidCalloutStyle.top,
            },
          ]}
        >
          {renderCalloutCard({
            payload: {
              id: androidCallout.id,
              tipo: androidCallout.tipo,
              title: androidCallout.title,
              description: androidCallout.description,
              iconName: androidCallout.iconName,
              iconBackgroundColor: androidCallout.iconBackgroundColor,
              iconColor: androidCallout.iconColor,
            },
            interactive: true,
            onActionPress: () => {
              closeAndroidCallout();
              onCalloutPress?.(androidCallout.id, androidCallout.tipo);
            },
          })}
          <View
            style={[
              styles.calloutArrow,
              styles.androidCalloutArrow,
              { marginLeft: androidCalloutStyle.arrowLeft },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  mapUnavailableContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: '#FFF8E1',
  },
  mapUnavailableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7A4B00',
    textAlign: 'center',
  },
  mapUnavailableText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8A5A10',
    textAlign: 'center',
  },
  customMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  floodMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
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
  floodMarkerHalo: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 122, 255, 0.22)',
  },
  floodMarkerCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1.5,
    elevation: 3,
  },
  calloutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  calloutBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
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
    lineHeight: 20,
  },
  calloutActionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 2,
    backgroundColor: '#FFFFFF',
  },
  calloutButton: {
    backgroundColor: '#0A74FF',
    borderRadius: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#0058C7',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  calloutButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  calloutArrow: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: '#fff',
    borderWidth: 16,
    alignSelf: 'center',
    marginTop: -2,
  },
  androidCalloutContainer: {
    position: 'absolute',
    zIndex: 20,
    elevation: 20,
  },
  androidCalloutArrow: {
    alignSelf: 'flex-start',
  },
});
