import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FloodArea, Manhole, TipoReporte } from '@/features/reportes/models/Reporte';
import { ordenarPontosPoligono } from '@/features/reportes/utils/polygon';
import { getGoogleMapsApiKey, loadGoogleMaps } from '@/core/utils/google-maps-loader.web';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Coordinate = { latitude: number; longitude: number };

type DebugState = {
  source: 'map-click' | 'pointerup' | 'touchend' | 'projection-miss' | 'idle';
  latitude?: number;
  longitude?: number;
  at?: number;
};

interface MapViewComponentProps {
  mapRef: React.RefObject<any>;
  region?: Region;
  onPress: (e: { nativeEvent: { coordinate: Coordinate } }) => void;
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
  drawingCoordinates: Coordinate[];
  selectedPoint: Coordinate | null;
  colors: any;
  tintColor?: string;
}

function getPolygonColors(nivel: FloodArea['nivel']) {
  switch (nivel) {
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

function regionToZoom(region?: Region) {
  if (!region) {
    return 14;
  }

  const delta = Math.max(region.latitudeDelta, region.longitudeDelta);
  if (delta <= 0.003) return 16;
  if (delta <= 0.008) return 15;
  if (delta <= 0.02) return 14;
  if (delta <= 0.05) return 13;
  return 12;
}

function createInfoWindowHtml(title: string, description: string) {
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeDescription = description.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `
    <div style="min-width:200px;max-width:240px;padding:8px 4px 2px 4px;font-family:Arial,sans-serif;">
      <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">${safeTitle}</div>
      <div style="font-size:12px;line-height:1.45;color:#4B5563;margin-bottom:10px;">${safeDescription}</div>
      <button id="map-callout-action" style="border:none;border-radius:999px;background:#33CCFF;color:#08212B;font-weight:700;padding:8px 12px;cursor:pointer;">
        Veja mais
      </button>
    </div>
  `;
}

function isSameCoordinate(a: Coordinate, b: Coordinate) {
  return (
    Math.abs(a.latitude - b.latitude) < 0.00002 &&
    Math.abs(a.longitude - b.longitude) < 0.00002
  );
}

function getEventClientPoint(event: PointerEvent | TouchEvent) {
  if ('clientX' in event && typeof event.clientX === 'number') {
    return { x: event.clientX, y: event.clientY };
  }

  const touch = event.changedTouches?.[0] || event.touches?.[0];
  if (!touch) {
    return null;
  }

  return { x: touch.clientX, y: touch.clientY };
}

export default function MapViewComponent({
  mapRef,
  region,
  onPress,
  onCalloutPress,
  savedReportes,
  savedManholes,
  savedFloodAreas,
  isDrawing,
  drawingCoordinates,
  selectedPoint,
  colors,
  tintColor,
}: MapViewComponentProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const googleMapRef = React.useRef<any>(null);
  const overlaysRef = React.useRef<any[]>([]);
  const mapClickListenerRef = React.useRef<any>(null);
  const infoWindowRef = React.useRef<any>(null);
  const projectionOverlayRef = React.useRef<any>(null);
  const lastEmitRef = React.useRef<{ coordinate: Coordinate; at: number } | null>(null);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error' | 'missing-key'>(
    getGoogleMapsApiKey() ? 'loading' : 'missing-key',
  );
  const [errorMessage, setErrorMessage] = React.useState('');
  const [debugState, setDebugState] = React.useState<DebugState>({ source: 'idle' });
  const isMapReady = status === 'ready';

  const closeInfoWindow = React.useCallback(() => {
    infoWindowRef.current?.close();
  }, []);

  const emitCoordinate = React.useCallback(
    (coordinate: Coordinate, source: DebugState['source']) => {
      const now = Date.now();
      const lastEmit = lastEmitRef.current;
      if (lastEmit && now - lastEmit.at < 450 && isSameCoordinate(lastEmit.coordinate, coordinate)) {
        return;
      }

      lastEmitRef.current = { coordinate, at: now };
      setDebugState({ source, latitude: coordinate.latitude, longitude: coordinate.longitude, at: now });
      onPress({
        nativeEvent: {
          coordinate,
        },
      });
    },
    [onPress],
  );

  const openInfoWindow = React.useCallback(
    (options: {
      anchor?: any;
      position: Coordinate;
      id: string;
      tipo: TipoReporte;
      title: string;
      description: string;
    }) => {
      if (!window.google?.maps || !googleMapRef.current || isDrawing) {
        return;
      }

      if (!infoWindowRef.current) {
        infoWindowRef.current = new window.google.maps.InfoWindow();
      }

      infoWindowRef.current.setContent(
        createInfoWindowHtml(options.title, options.description || 'Sem descrição'),
      );
      infoWindowRef.current.setPosition(options.position);
      infoWindowRef.current.open({
        anchor: options.anchor,
        map: googleMapRef.current,
      });

      window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
        const button = document.getElementById('map-callout-action');
        button?.addEventListener('click', () => {
          onCalloutPress?.(options.id, options.tipo);
        });
      });
    },
    [isDrawing, onCalloutPress],
  );

  React.useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let mounted = true;
    if (!getGoogleMapsApiKey()) {
      setStatus('missing-key');
      return;
    }

    loadGoogleMaps()
      .then((maps) => {
        if (!mounted || googleMapRef.current) {
          return;
        }

        const initialCenter = region
          ? { lat: region.latitude, lng: region.longitude }
          : { lat: -3.7319, lng: -38.5267 };

        const map = new maps.Map(containerRef.current, {
          center: initialCenter,
          zoom: regionToZoom(region),
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });

        class ProjectionOverlay extends maps.OverlayView {
          onAdd() {}
          draw() {}
          onRemove() {}
        }

        const projectionOverlay = new ProjectionOverlay();
        projectionOverlay.setMap(map);
        projectionOverlayRef.current = projectionOverlay;

        googleMapRef.current = map;
        mapRef.current = {
          animateToRegion(nextRegion: Region) {
            map.panTo({ lat: nextRegion.latitude, lng: nextRegion.longitude });
            map.setZoom(regionToZoom(nextRegion));
          },
        };
        setStatus('ready');
      })
      .catch((error: any) => {
        if (!mounted) {
          return;
        }

        setStatus('error');
        setErrorMessage(error?.message || 'Não foi possível inicializar o mapa web.');
      });

    return () => {
      mounted = false;
      mapClickListenerRef.current?.remove?.();
      projectionOverlayRef.current?.setMap?.(null);
    };
  }, [mapRef, region]);

  React.useEffect(() => {
    if (!isMapReady || !googleMapRef.current || !region) {
      return;
    }

    googleMapRef.current.panTo({ lat: region.latitude, lng: region.longitude });
    googleMapRef.current.setZoom(regionToZoom(region));
  }, [isMapReady, region]);

  React.useEffect(() => {
    if (!isMapReady || !googleMapRef.current || !window.google?.maps) {
      return;
    }

    mapClickListenerRef.current?.remove?.();
    mapClickListenerRef.current = googleMapRef.current.addListener('click', (event: any) => {
      closeInfoWindow();
      if (!event.latLng) {
        return;
      }

      emitCoordinate(
        {
          latitude: event.latLng.lat(),
          longitude: event.latLng.lng(),
        },
        'map-click',
      );
    });

    return () => {
      mapClickListenerRef.current?.remove?.();
      mapClickListenerRef.current = null;
    };
  }, [closeInfoWindow, emitCoordinate, isMapReady]);

  React.useEffect(() => {
    if (!isMapReady || !googleMapRef.current || !projectionOverlayRef.current || !isDrawing) {
      return;
    }

    const mapDiv = googleMapRef.current.getDiv?.() as HTMLDivElement | undefined;
    if (!mapDiv) {
      return;
    }

    const projectEventToCoordinate = (event: PointerEvent | TouchEvent, source: DebugState['source']) => {
      const projection = projectionOverlayRef.current?.getProjection?.();
      const point = getEventClientPoint(event);
      if (!projection || !point) {
        setDebugState({ source: 'projection-miss', at: Date.now() });
        return;
      }

      const bounds = mapDiv.getBoundingClientRect();
      const pixelPoint = new window.google.maps.Point(point.x - bounds.left, point.y - bounds.top);
      const latLng = projection.fromDivPixelToLatLng(pixelPoint);
      if (!latLng) {
        setDebugState({ source: 'projection-miss', at: Date.now() });
        return;
      }

      closeInfoWindow();
      emitCoordinate(
        {
          latitude: latLng.lat(),
          longitude: latLng.lng(),
        },
        source,
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      projectEventToCoordinate(event, 'pointerup');
    };

    const handleTouchEnd = (event: TouchEvent) => {
      projectEventToCoordinate(event, 'touchend');
    };

    mapDiv.addEventListener('pointerup', handlePointerUp, { passive: true });
    mapDiv.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      mapDiv.removeEventListener('pointerup', handlePointerUp);
      mapDiv.removeEventListener('touchend', handleTouchEnd);
    };
  }, [closeInfoWindow, emitCoordinate, isDrawing, isMapReady]);

  React.useEffect(() => {
    if (!isMapReady || !googleMapRef.current || !window.google?.maps) {
      return;
    }

    overlaysRef.current.forEach((overlay) => overlay.setMap?.(null));
    overlaysRef.current = [];

    const map = googleMapRef.current;
    const maps = window.google.maps;
    const overlaysClickable = !isDrawing;

    savedReportes.forEach((reporte) => {
      const marker = new maps.Marker({
        map,
        clickable: overlaysClickable,
        position: { lat: reporte.latitude, lng: reporte.longitude },
        title: reporte.endereco,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: tintColor || colors.tint,
          fillOpacity: 1,
          scale: 8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      if (overlaysClickable) {
        marker.addListener('click', () => {
          openInfoWindow({
            anchor: marker,
            position: { latitude: reporte.latitude, longitude: reporte.longitude },
            id: reporte.id,
            tipo: reporte.tipo,
            title: reporte.tipo === 'alagamento' ? 'Alagamento' : 'Bueiro',
            description: reporte.endereco,
          });
        });
      }
      overlaysRef.current.push(marker);
    });

    savedManholes.forEach((manhole) => {
      const circle = new maps.Circle({
        map,
        clickable: false,
        center: { lat: manhole.latitude, lng: manhole.longitude },
        radius: 50,
        fillColor: '#FF9500',
        fillOpacity: 0.12,
        strokeColor: '#FF9500',
        strokeOpacity: 0.45,
        strokeWeight: 1,
      });

      const marker = new maps.Marker({
        map,
        clickable: overlaysClickable,
        position: { lat: manhole.latitude, lng: manhole.longitude },
        title: manhole.descricao || 'Bueiro danificado',
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: '#F57C00',
          fillOpacity: 1,
          scale: 7,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      if (overlaysClickable) {
        marker.addListener('click', () => {
          openInfoWindow({
            anchor: marker,
            position: { latitude: manhole.latitude, longitude: manhole.longitude },
            id: manhole.id,
            tipo: 'bueiro',
            title: 'Bueiro Danificado',
            description: manhole.descricao || 'Sem descrição',
          });
        });
      }

      overlaysRef.current.push(circle, marker);
    });

    savedFloodAreas.forEach((area) => {
      const orderedCoordinates = ordenarPontosPoligono(area.coordinates);
      const { fill, stroke } = getPolygonColors(area.nivel);
      const polygon = new maps.Polygon({
        map,
        clickable: overlaysClickable,
        paths: orderedCoordinates.map((coordinate) => ({
          lat: coordinate.latitude,
          lng: coordinate.longitude,
        })),
        fillColor: fill,
        fillOpacity: 1,
        strokeColor: stroke,
        strokeOpacity: 1,
        strokeWeight: 2,
      });

      const latitude =
        orderedCoordinates.reduce((sum, coordinate) => sum + coordinate.latitude, 0) /
        orderedCoordinates.length;
      const longitude =
        orderedCoordinates.reduce((sum, coordinate) => sum + coordinate.longitude, 0) /
        orderedCoordinates.length;

      const marker = new maps.Marker({
        map,
        clickable: overlaysClickable,
        position: { lat: latitude, lng: longitude },
        title: area.descricao || 'Área de alagamento',
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: '#D32F2F',
          fillOpacity: 1,
          scale: 9,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      if (overlaysClickable) {
        const openArea = () => {
          openInfoWindow({
            anchor: marker,
            position: { latitude, longitude },
            id: area.id,
            tipo: 'alagamento',
            title: 'Área de Alagamento',
            description: area.descricao || 'Sem descrição',
          });
        };

        polygon.addListener('click', openArea);
        marker.addListener('click', openArea);
      }
      overlaysRef.current.push(polygon, marker);
    });

    drawingCoordinates.forEach((coordinate, index) => {
      const marker = new maps.Marker({
        map,
        clickable: false,
        position: { lat: coordinate.latitude, lng: coordinate.longitude },
        zIndex: 1000 + index,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: '#0A7EA4',
          fillOpacity: 1,
          scale: 7,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        label: {
          color: '#08212B',
          fontSize: '12px',
          fontWeight: '700',
          text: String(index + 1),
        },
      });

      overlaysRef.current.push(marker);
    });

    if (drawingCoordinates.length >= 2) {
      const polyline = new maps.Polyline({
        map,
        clickable: false,
        path: drawingCoordinates.map((coordinate) => ({
          lat: coordinate.latitude,
          lng: coordinate.longitude,
        })),
        strokeColor: colors.tint,
        strokeOpacity: 0.95,
        strokeWeight: 3,
      });

      overlaysRef.current.push(polyline);
    }

    if (drawingCoordinates.length >= 3) {
      const polygon = new maps.Polygon({
        map,
        clickable: false,
        paths: drawingCoordinates.map((coordinate) => ({
          lat: coordinate.latitude,
          lng: coordinate.longitude,
        })),
        fillColor: 'rgba(51, 204, 255, 0.18)',
        fillOpacity: 1,
        strokeColor: colors.tint,
        strokeOpacity: 1,
        strokeWeight: 2,
      });
      overlaysRef.current.push(polygon);
    }

    if (selectedPoint) {
      const marker = new maps.Marker({
        map,
        clickable: false,
        position: { lat: selectedPoint.latitude, lng: selectedPoint.longitude },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: '#0A7EA4',
          fillOpacity: 1,
          scale: 8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });
      const circle = new maps.Circle({
        map,
        clickable: false,
        center: { lat: selectedPoint.latitude, lng: selectedPoint.longitude },
        radius: 30,
        fillColor: '#0A7EA4',
        fillOpacity: 0.15,
        strokeColor: '#0A7EA4',
        strokeOpacity: 0.4,
        strokeWeight: 1,
      });

      overlaysRef.current.push(marker, circle);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (!googleMapRef.current) {
            return;
          }

          const marker = new maps.Marker({
            map,
            clickable: false,
            position: { lat: coords.latitude, lng: coords.longitude },
            icon: {
              path: maps.SymbolPath.CIRCLE,
              fillColor: '#2563EB',
              fillOpacity: 1,
              scale: 7,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
          });
          const circle = new maps.Circle({
            map,
            clickable: false,
            center: { lat: coords.latitude, lng: coords.longitude },
            radius: Math.max(coords.accuracy || 20, 20),
            fillColor: '#2563EB',
            fillOpacity: 0.08,
            strokeColor: '#2563EB',
            strokeOpacity: 0.18,
            strokeWeight: 1,
          });
          overlaysRef.current.push(marker, circle);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 5000 },
      );
    }
  }, [
    colors.tint,
    drawingCoordinates,
    isMapReady,
    isDrawing,
    openInfoWindow,
    savedFloodAreas,
    savedManholes,
    savedReportes,
    selectedPoint,
    tintColor,
  ]);

  if (status === 'missing-key') {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Mapa web indisponível</Text>
        <Text style={[styles.stateText, { color: colors.icon }]}>
          Configure `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` para habilitar o mapa no PWA.
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Falha ao carregar o mapa</Text>
        <Text style={[styles.stateText, { color: colors.icon }]}>
          {errorMessage || 'Tente novamente em alguns instantes.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div ref={containerRef} style={styles.mapElement as any} />
      {status === 'loading' ? (
        <View style={[styles.loadingBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando mapa…</Text>
        </View>
      ) : null}
      {isDrawing ? (
        <View style={[styles.debugBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.debugTitle, { color: colors.text }]}>
            Desenho ativo: {drawingCoordinates.length} pt
          </Text>
          <Text style={[styles.debugText, { color: colors.icon }]}>
            Último evento: {debugState.source}
          </Text>
          {debugState.latitude != null && debugState.longitude != null ? (
            <Text style={[styles.debugText, { color: colors.icon }]}>
              {debugState.latitude.toFixed(5)}, {debugState.longitude.toFixed(5)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  mapElement: {
    borderRadius: 0,
    height: '100%',
    width: '100%',
  },
  loadingBadge: {
    borderRadius: 999,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    top: 16,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  debugBadge: {
    borderRadius: 16,
    bottom: 16,
    left: 16,
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'absolute',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  debugText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  stateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
