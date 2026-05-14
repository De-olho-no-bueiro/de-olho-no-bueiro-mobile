import { useCallback, useEffect, useState, useRef } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import type {
  GoogleAddressError,
  GoogleAddressPrediction,
  GoogleAddressSearchOptions,
  GoogleAddressResolved,
} from '@/core/utils/google-address-search';
import {
  geocodeAddressWithGoogleMaps,
  geocodePlaceIdWithGoogleMaps,
  isGoogleRequestDeniedError,
  searchAddressPredictionsWithGoogleMaps,
} from '@/core/utils/google-address-search';
import { isWeb } from '@/core/utils/platform-capabilities';
import type { Reporte, TipoReporte, NivelAlagamento, Manhole, FloodArea, LocalPostMedia } from '@/features/reportes/models/Reporte';
import { ApiReporteRepository } from '@/features/reportes/services/ApiReporteRepository';
import { ExpoGeoService } from '@/features/reportes/services/ExpoGeoService';
import { ordenarPontosPoligono } from '@/features/reportes/utils/polygon';
const reporteRepository = new ApiReporteRepository();
const geoService = new ExpoGeoService();

const RAIO_MAXIMO_KM = geoService.getRaioMaximoPermitidoKm();
const MAX_PONTOS_AREA = 4;
const SEARCH_DEBOUNCE_MS = 280;

export type Coordenadas = { latitude: number; longitude: number };
export type SearchSuggestionItem = {
  id: string;
  label: string;
  coordinate?: Coordenadas;
  placeId?: string;
  source: 'local' | 'geocode' | 'google';
};

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export type FiltroOpcao = 'todos' | 'mais-graves' | 'ultimos-7-dias' | 'alagamentos' | 'bueiros';

function formatarEndereco(addr: Location.LocationGeocodedAddress | null): string {
  if (!addr) return '';
  const parts = [
    addr.street,
    addr.streetNumber,
    addr.district,
    addr.subregion,
    addr.city,
    addr.region,
  ].filter(Boolean);
  return parts.join(', ') || 'Endereço não disponível';
}

function formatarCoordenadas({ latitude, longitude }: Coordenadas): string {
  return `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function buildSuggestionMapKey(suggestion: SearchSuggestionItem): string {
  const coordinateKey = suggestion.coordinate
    ? `${suggestion.coordinate.latitude.toFixed(5)}:${suggestion.coordinate.longitude.toFixed(5)}`
    : suggestion.placeId || 'sem-coordenada';

  return `${normalizarTexto(suggestion.label)}:${coordinateKey}`;
}

function traduzirErroBuscaEndereco(error: unknown): string {
  const message = error instanceof Error ? error.message : '';

  if (!message) {
    return 'Erro ao buscar endereço';
  }

  if (message.includes('ZERO_RESULTS')) {
    return 'Endereço não encontrado';
  }

  if (message.includes('REQUEST_DENIED')) {
    return 'No momento esta funcionalidade está indisponivel';
  }

  if (message.includes('OVER_QUERY_LIMIT')) {
    return 'No momento esta funcionalidade está indisponivel';
  }

  if (message.includes('Google Places não está disponível') || message.includes('biblioteca places')) {
    return 'No momento esta funcionalidade está indisponivel';
  }

  if (message.includes('Google Maps') || message.includes('Google Geocoder') || message.includes('Google Autocomplete')) {
    return 'No momento esta funcionalidade está indisponivel';
  }

  return 'Erro ao buscar endereço';
}

function logSearchFallback(event: string, payload: Record<string, unknown>) {
  console.warn('[Search][Fallback]', event, payload);
}

function obterCentroArea(area: FloodArea): Coordenadas | null {
  if (!Array.isArray(area.coordinates) || area.coordinates.length === 0) {
    return null;
  }

  const latitude =
    area.coordinates.reduce((acc, point) => acc + point.latitude, 0) /
    area.coordinates.length;
  const longitude =
    area.coordinates.reduce((acc, point) => acc + point.longitude, 0) /
    area.coordinates.length;

  return { latitude, longitude };
}

function toLocalPostMedia(asset: ImagePicker.ImagePickerAsset): LocalPostMedia {
  const extensionFromMime = asset.mimeType?.split('/')[1] || 'jpg';
  return {
    uri: asset.uri,
    fileName: asset.fileName || `image-${Date.now()}.${extensionFromMime}`,
    mimeType: asset.mimeType || 'image/jpeg',
    sizeBytes: asset.fileSize || 0,
    width: asset.width,
    height: asset.height,
  };
}

function fromGooglePrediction(
  prediction: GoogleAddressPrediction,
  requestId: number,
  index: number,
): SearchSuggestionItem {
  return {
    id: `${prediction.id}-${requestId}-${index}`,
    label: prediction.label,
    placeId: prediction.placeId,
    source: 'google',
  };
}

function fromGoogleResolved(result: GoogleAddressResolved): SearchSuggestionItem {
  return {
    id: result.id,
    label: result.label,
    coordinate: result.coordinate,
    placeId: result.placeId,
    source: 'google',
  };
}

function getGoogleSearchOptions(
  userLocation: Coordenadas | null,
): GoogleAddressSearchOptions {
  return {
    country: 'br',
    language: 'pt-BR',
    region: 'br',
    locationBias: userLocation
      ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusMeters: 50000,
        }
      : undefined,
  };
}

export function useMapViewModel() {
  const [userLocation, setUserLocation] = useState<Coordenadas | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Coordenadas | null>(null);
  const [savedReportes, setSavedReportes] = useState<Reporte[]>([]);
  const [savedManholes, setSavedManholes] = useState<Manhole[]>([]);
  const [savedFloodAreas, setSavedFloodAreas] = useState<FloodArea[]>([]);

  // Modos do mapa
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingCoordinates, setDrawingCoordinates] = useState<Coordenadas[]>([]);

  const [confirmationAddress, setConfirmationAddress] = useState('');
  const [loadingConfirmationAddress, setLoadingConfirmationAddress] = useState(false);
  const [endereco, setEndereco] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasResolvedInitialLocation, setHasResolvedInitialLocation] =
    useState(false);

  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHasResolved, setSearchHasResolved] = useState(false);
  const searchRequestIdRef = useRef(0);
  const searchDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const mapRef = useRef<any>(null);
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);

  const [filtroAtivo, setFiltroAtivo] = useState<FiltroOpcao>('todos');

  const [tipo, setTipo] = useState<TipoReporte>('alagamento');
  const [nivel, setNivel] = useState<NivelAlagamento>('baixo');
  const [descricao, setDescricao] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<LocalPostMedia[]>([]);
  const [salvando, setSalvando] = useState(false);
  const midiasUri = selectedMedia.map((item) => item.uri);

  const limparBuscaPendente = useCallback(() => {
    if (searchDebounceTimeoutRef.current) {
      clearTimeout(searchDebounceTimeoutRef.current);
      searchDebounceTimeoutRef.current = null;
    }
  }, []);

  const resetFormState = useCallback((options?: { preserveAddress?: boolean }) => {
    setNivel('baixo');
    setDescricao('');
    setSelectedMedia([]);
    if (!options?.preserveAddress) {
      setEndereco('');
    }
    setConfirmationAddress('');
  }, []);

  const pedirPermissaoELocalizacao = useCallback(
    async (options?: { markInitialResolved?: boolean }) => {
      setLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Localização',
            'Precisamos da sua localização para marcar pontos dentro de 2 km de você.'
          );
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {
        Alert.alert('Erro', 'Não foi possível obter sua localização.');
      } finally {
        setLoadingLocation(false);
        if (options?.markInitialResolved) {
          setHasResolvedInitialLocation(true);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void pedirPermissaoELocalizacao({ markInitialResolved: true });
  }, [pedirPermissaoELocalizacao]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [reportesResult, manholesResult, floodAreasResult] =
        await Promise.allSettled([
          reporteRepository.carregarReportes(),
          reporteRepository.carregarManholes(),
          reporteRepository.carregarFloodAreas(),
        ]);

      if (cancelled) {
        return;
      }

      if (reportesResult.status === 'fulfilled') {
        setSavedReportes(reportesResult.value);
      } else {
        console.error('[Map] erro ao carregar reportes iniciais', reportesResult.reason);
      }

      if (manholesResult.status === 'fulfilled') {
        setSavedManholes(manholesResult.value);
      } else {
        console.error('[Map] erro ao carregar bueiros iniciais', manholesResult.reason);
      }

      if (floodAreasResult.status === 'fulfilled') {
        setSavedFloodAreas(floodAreasResult.value);
      } else {
        console.error(
          '[Map] erro ao carregar areas de alagamento iniciais',
          floodAreasResult.reason,
        );
      }

      setLoadingInitialData(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => {
    limparBuscaPendente();
  }, [limparBuscaPendente]);

  useEffect(() => {
    if (userLocation && !hasCenteredOnUser) {
      const newRegion: Region = {
        ...userLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setMapRegion(newRegion);
      setHasCenteredOnUser(true);
    }
  }, [userLocation, hasCenteredOnUser]);

  const isInitialViewportReady =
    !userLocation || hasCenteredOnUser || Boolean(mapRegion);
  const isMapBootstrapping =
    !hasResolvedInitialLocation || loadingInitialData || !isInitialViewportReady;

  const buscarEnderecoParaConfirmacao = useCallback(async (lat: number, lon: number) => {
    setLoadingConfirmationAddress(true);
    setConfirmationAddress('');
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      setConfirmationAddress(formatarEndereco(results[0] ?? null) || 'Endereço não disponível');
    } catch {
      setConfirmationAddress('Endereço não disponível');
    } finally {
      setLoadingConfirmationAddress(false);
    }
  }, []);

  const centralizarNoMapa = useCallback((coordinate: Coordenadas) => {
    const newRegion: Region = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
    setMapRegion(newRegion);
    (mapRef.current as any)?.animateToRegion?.(newRegion, 500);
  }, []);

  const obterSugestoesLocais = useCallback((text: string): SearchSuggestionItem[] => {
    const query = normalizarTexto(text);
    if (query.length < 3) return [];

    const suggestions = new Map<string, SearchSuggestionItem>();

    const addSuggestion = (
      id: string,
      label: string | undefined,
      coordinate: Coordenadas | null,
    ) => {
      const safeLabel = label?.trim();
      if (!safeLabel || !coordinate) return;
      if (!normalizarTexto(safeLabel).includes(query)) return;

      const key = `${normalizarTexto(safeLabel)}:${coordinate.latitude.toFixed(5)}:${coordinate.longitude.toFixed(5)}`;
      if (suggestions.has(key)) return;

      suggestions.set(key, {
        id,
        label: safeLabel,
        coordinate,
        source: 'local',
      });
    };

    savedReportes.forEach((reporte) => {
      addSuggestion(reporte.id, reporte.endereco, {
        latitude: reporte.latitude,
        longitude: reporte.longitude,
      });
    });

    savedManholes.forEach((manhole) => {
      addSuggestion(manhole.id, manhole.endereco || manhole.descricao, {
        latitude: manhole.latitude,
        longitude: manhole.longitude,
      });
    });

    savedFloodAreas.forEach((area) => {
      addSuggestion(area.id, area.endereco || area.descricao, obterCentroArea(area));
    });

    return Array.from(suggestions.values()).slice(0, 5);
  }, [savedFloodAreas, savedManholes, savedReportes]);

  const buscarSugestoes = useCallback(async (text: string) => {
    limparBuscaPendente();

    const trimmedText = text.trim();
    const localSuggestions = isWeb ? [] : obterSugestoesLocais(trimmedText);
    const googleOptions = getGoogleSearchOptions(userLocation);

    if (trimmedText.length < 3) {
      searchRequestIdRef.current += 1;
      setSearchSuggestions([]);
      setSearching(false);
      setSearchHasResolved(false);
      return;
    }

    setSearchError('');
    setSearchHasResolved(false);
    setSearchSuggestions(localSuggestions);
    setSearching(true);
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    searchDebounceTimeoutRef.current = setTimeout(() => {
      void (async () => {
        try {
          const remainingSlots = Math.max(0, 5 - localSuggestions.length);
          if (remainingSlots === 0) {
            if (searchRequestIdRef.current === requestId) {
              setSearching(false);
              setSearchHasResolved(true);
            }
            return;
          }

          const remoteSuggestions = isWeb
            ? (
                await searchAddressPredictionsWithGoogleMaps(
                  trimmedText,
                  remainingSlots,
                  googleOptions,
                )
              ).map((item, index) => fromGooglePrediction(item, requestId, index))
            : (
                await Promise.all(
                  (await Location.geocodeAsync(trimmedText)).slice(0, 8).map(async (coords, index) => {
                    try {
                      const reverse = await Location.reverseGeocodeAsync(coords);
                      const label =
                        formatarEndereco(reverse[0] ?? null) || formatarCoordenadas(coords);

                      return {
                        id: `geocode-${requestId}-${index}`,
                        label,
                        coordinate: {
                          latitude: coords.latitude,
                          longitude: coords.longitude,
                        },
                        source: 'geocode' as const,
                      };
                    } catch {
                      return {
                        id: `geocode-${requestId}-${index}`,
                        label: formatarCoordenadas(coords),
                        coordinate: {
                          latitude: coords.latitude,
                          longitude: coords.longitude,
                        },
                        source: 'geocode' as const,
                      };
                    }
                  }),
                )
              ).filter((item) => Boolean(item.label));

          if (searchRequestIdRef.current !== requestId) {
            return;
          }

          const dedupedSuggestions = new Map<string, SearchSuggestionItem>();
          [...localSuggestions, ...remoteSuggestions].forEach((suggestion) => {
            const key = buildSuggestionMapKey(suggestion);
            if (!dedupedSuggestions.has(key)) {
              dedupedSuggestions.set(key, suggestion);
            }
          });

          setSearchSuggestions(Array.from(dedupedSuggestions.values()).slice(0, 5));
          setSearchHasResolved(true);
        } catch (error) {
          if (searchRequestIdRef.current === requestId) {
            setSearchSuggestions(localSuggestions);
            if (isWeb) {
              if (isGoogleRequestDeniedError(error, 'autocomplete')) {
                logSearchFallback('autocomplete-request-denied', {
                  query: trimmedText,
                  status: (error as GoogleAddressError).status,
                });
                setSearchError('');
              } else {
                setSearchError(traduzirErroBuscaEndereco(error));
              }
            }
            setSearchHasResolved(false);
          }
        } finally {
          if (searchRequestIdRef.current === requestId) {
            setSearching(false);
          }
        }
      })();
    }, SEARCH_DEBOUNCE_MS);
  }, [limparBuscaPendente, obterSugestoesLocais, userLocation]);

  const buscarPorEndereco = useCallback(async () => {
    limparBuscaPendente();

    const trimmedText = searchText.trim();
    if (!trimmedText) return;

    const googleOptions = getGoogleSearchOptions(userLocation);
    setSearching(true);
    setSearchError('');
    setSearchHasResolved(false);
    setShowSuggestions(false);
    try {
      const localSuggestions = isWeb ? [] : obterSugestoesLocais(trimmedText);
      if (localSuggestions.length > 0) {
        const [firstLocalSuggestion] = localSuggestions;
        if (firstLocalSuggestion.coordinate) {
          centralizarNoMapa(firstLocalSuggestion.coordinate);
        }
        setSearchText(firstLocalSuggestion.label);
        setSearchSuggestions(localSuggestions);
        return;
      }

      if (isWeb) {
        let predictions: GoogleAddressPrediction[] = [];

        try {
          predictions = await searchAddressPredictionsWithGoogleMaps(
            trimmedText,
            1,
            googleOptions,
          );
        } catch (error) {
          if (isGoogleRequestDeniedError(error, 'autocomplete')) {
            logSearchFallback('autocomplete-request-denied-submit', {
              query: trimmedText,
              status: (error as GoogleAddressError).status,
            });
          } else {
            throw error;
          }
        }

        if (predictions.length > 0) {
          const resolved = await geocodePlaceIdWithGoogleMaps(predictions[0].placeId);
          const nextSuggestion = fromGoogleResolved(resolved);
          centralizarNoMapa(resolved.coordinate);
          setSearchText(resolved.label);
          setSearchSuggestions([nextSuggestion]);
          setSearchHasResolved(true);
          return;
        }

        const googleResults = await geocodeAddressWithGoogleMaps(
          trimmedText,
          1,
          googleOptions,
        );
        if (googleResults.length === 0) {
          setSearchError('Endereço não encontrado');
          setSearchHasResolved(true);
          return;
        }

        const firstResult = googleResults[0];
        centralizarNoMapa(firstResult.coordinate);
        setSearchText(firstResult.label);
        setSearchSuggestions([fromGoogleResolved(firstResult)]);
        setSearchHasResolved(true);
        return;
      }

      const results = await Location.geocodeAsync(trimmedText);
      if (results.length === 0) {
        setSearchError('Endereço não encontrado');
        return;
      }

      const firstResult = results[0];
      let label = trimmedText;
      try {
        const reverse = await Location.reverseGeocodeAsync(firstResult);
        label = formatarEndereco(reverse[0] ?? null) || trimmedText;
      } catch {}

      centralizarNoMapa({
        latitude: firstResult.latitude,
        longitude: firstResult.longitude,
      });
      setSearchText(label);
      setSearchSuggestions([
        {
          id: `submit-${Date.now()}`,
          label,
          coordinate: {
            latitude: firstResult.latitude,
            longitude: firstResult.longitude,
          },
          source: 'geocode',
        },
      ]);
      setSearchHasResolved(true);
    } catch (error) {
      setSearchError(traduzirErroBuscaEndereco(error));
    } finally {
      setSearching(false);
    }
  }, [centralizarNoMapa, limparBuscaPendente, obterSugestoesLocais, searchText, userLocation]);

  const selecionarSugestao = useCallback(async (suggestion: SearchSuggestionItem) => {
    limparBuscaPendente();
    setSearching(true);
    setSearchError('');
    setShowSuggestions(false);

    try {
      if (suggestion.coordinate) {
        centralizarNoMapa(suggestion.coordinate);
        setSearchText(suggestion.label);
        return;
      }

      if (isWeb && suggestion.placeId) {
        const resolved = await geocodePlaceIdWithGoogleMaps(suggestion.placeId);
        centralizarNoMapa(resolved.coordinate);
        setSearchText(resolved.label);
        setSearchSuggestions([fromGoogleResolved(resolved)]);
        setSearchHasResolved(true);
        return;
      }

      throw new Error('Nenhuma coordenada disponível para a sugestão selecionada.');
    } catch (error) {
      setSearchError(traduzirErroBuscaEndereco(error));
    } finally {
      setSearching(false);
    }
  }, [centralizarNoMapa, limparBuscaPendente]);

  const getFilteredReportes = useCallback(() => {
    let filtered = savedReportes;

    if (filtroAtivo === 'mais-graves') {
      filtered = filtered.filter(r => r.nivel === 'avancado' || r.nivel === 'extremo');
    } else if (filtroAtivo === 'ultimos-7-dias') {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      filtered = filtered.filter(r => new Date(r.dataHora) >= seteDiasAtras);
    } else if (filtroAtivo === 'alagamentos') {
      filtered = filtered.filter(r => r.tipo === 'alagamento');
    } else if (filtroAtivo === 'bueiros') {
      filtered = [];
    }

    return filtered;
  }, [savedReportes, filtroAtivo]);

  const getFilteredManholes = useCallback(() => {
    if (filtroAtivo === 'alagamentos') return [];
    if (filtroAtivo === 'mais-graves') return [];
    if (filtroAtivo === 'ultimos-7-dias') {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      return savedManholes.filter(m => new Date(m.dataHora) >= seteDiasAtras);
    }
    return savedManholes;
  }, [savedManholes, filtroAtivo]);

  const getFilteredFloodAreas = useCallback(() => {
    if (filtroAtivo === 'bueiros') return [];
    if (filtroAtivo === 'mais-graves') {
      return savedFloodAreas.filter(fa => fa.nivel === 'avancado' || fa.nivel === 'extremo');
    }
    if (filtroAtivo === 'ultimos-7-dias') {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      return savedFloodAreas.filter(fa => new Date(fa.dataHora) >= seteDiasAtras);
    }
    return savedFloodAreas;
  }, [savedFloodAreas, filtroAtivo]);

  const adicionarPontoNaArea = useCallback(
    (latitude: number, longitude: number) => {
      if (!userLocation) {
        Alert.alert('Aguarde', 'Obtendo sua localização...');
        return false;
      }

      if (drawingCoordinates.length >= MAX_PONTOS_AREA) {
        Alert.alert('Limite atingido', `A área pode ter no máximo ${MAX_PONTOS_AREA} pontos.`);
        return false;
      }

      try {
        const raio = geoService.getRaioMaximoPermitidoKm();
        const isDentro = geoService.estaDentroDoRaio(
          userLocation.latitude,
          userLocation.longitude,
          latitude,
          longitude,
          raio,
        );
        if (!isDentro) {
          throw new Error(`Só é possível marcar áreas a até ${raio} km da sua localização atual.`);
        }
      } catch (error: any) {
        Alert.alert('Fora do raio', error.message);
        return false;
      }

      const hoje = new Date().toDateString();
      const raioSobreposicaoKm = 0.015;
      const sobrepoeArea = savedFloodAreas.some((fa) => {
        if (fa.is_finished || new Date(fa.dataHora).toDateString() !== hoje) return false;
        return fa.coordinates.some((c) =>
          geoService.estaDentroDoRaio(latitude, longitude, c.latitude, c.longitude, raioSobreposicaoKm),
        );
      });

      if (sobrepoeArea) {
        Alert.alert('Atenção', 'Já existe uma área de alagamento ativa reportada hoje neste local.');
        return false;
      }

      setDrawingCoordinates((prev) => [...prev, { latitude, longitude }]);
      return true;
    },
    [drawingCoordinates.length, savedFloodAreas, userLocation],
  );

  const aoClicarNoMapa = useCallback(
    (e: { nativeEvent: { coordinate?: Coordenadas } }) => {
      if (!e?.nativeEvent?.coordinate) return;
      const { latitude, longitude } = e.nativeEvent.coordinate;
      
      if (isDrawing) {
        adicionarPontoNaArea(latitude, longitude);
        return;
      }

      if (!userLocation) {
        Alert.alert('Aguarde', 'Obtendo sua localização...');
        return;
      }
      try {
        const raio = geoService.getRaioMaximoPermitidoKm();
        const isDentro = geoService.estaDentroDoRaio(userLocation.latitude, userLocation.longitude, latitude, longitude, raio);
        if (!isDentro) {
          throw new Error(`Só é possível marcar pontos a até ${raio} km da sua localização atual.`);
        }
      } catch (error: any) {
        Alert.alert('Fora do raio', error.message);
        return;
      }
      setSelectedPoint({ latitude, longitude });
      buscarEnderecoParaConfirmacao(latitude, longitude);
    },
    [adicionarPontoNaArea, userLocation, buscarEnderecoParaConfirmacao, isDrawing]
  );

  const usarMinhaLocalizacao = useCallback(() => {
    if (!userLocation) {
      Alert.alert('Aguarde', 'Obtendo sua localização...');
      return;
    }
    const newRegion: Region = {
      ...userLocation,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setMapRegion(newRegion);
    mapRef.current?.animateToRegion?.(newRegion, 500);

    if (isDrawing) {
      adicionarPontoNaArea(userLocation.latitude, userLocation.longitude);
      return;
    }

    setSelectedPoint(userLocation);
    buscarEnderecoParaConfirmacao(userLocation.latitude, userLocation.longitude);
  }, [adicionarPontoNaArea, isDrawing, userLocation, buscarEnderecoParaConfirmacao]);

  const abrirReporteDeAlagamentoNaMinhaLocalizacao = useCallback(async () => {
    if (!userLocation) {
      Alert.alert('Aguarde', 'Obtendo sua localização...');
      return;
    }

    const newRegion: Region = {
      ...userLocation,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    setMapRegion(newRegion);
    mapRef.current?.animateToRegion?.(newRegion, 500);
    setIsDrawing(false);
    setDrawingCoordinates([]);
    setConfirmationAddress('');
    setSelectedPoint(userLocation);
    setTipo('alagamento');
    setLoadingAddress(true);
    setLoadingConfirmationAddress(true);

    let nextAddress = formatarCoordenadas(userLocation);

    try {
      const results = await Location.reverseGeocodeAsync(userLocation);
      nextAddress = formatarEndereco(results[0] ?? null) || nextAddress;
    } catch {}

    setConfirmationAddress(nextAddress);
    resetFormState({ preserveAddress: true });
    setEndereco(nextAddress);
    setLoadingAddress(false);
    setLoadingConfirmationAddress(false);
    setModalVisible(true);
  }, [resetFormState, userLocation]);

  const recentralizar = useCallback(() => {
    if (!userLocation) {
      pedirPermissaoELocalizacao();
      return;
    }
    const newRegion: Region = {
      ...userLocation,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setMapRegion(newRegion);
    mapRef.current?.animateToRegion?.(newRegion, 500);
  }, [userLocation, pedirPermissaoELocalizacao]);

  const confirmarLocalAbrirForm = useCallback(() => {
    if (!selectedPoint || loadingConfirmationAddress) return;
    setEndereco(confirmationAddress || '');
    setLoadingAddress(false);
    resetFormState({ preserveAddress: true });
    setEndereco(confirmationAddress || '');
    setModalVisible(true);
  }, [selectedPoint, confirmationAddress, loadingConfirmationAddress, resetFormState]);

  const cancelarPin = useCallback(() => {
    setSelectedPoint(null);
    setConfirmationAddress('');
    setDrawingCoordinates([]);
    setIsDrawing(false);
  }, []);

  const toggleDrawingMode = useCallback(() => {
    setIsDrawing(prev => !prev);
    setDrawingCoordinates([]);
    setSelectedPoint(null);
    setConfirmationAddress('');
  }, []);

  const desfazerUltimoPonto = useCallback(() => {
    setDrawingCoordinates(prev => prev.slice(0, -1));
  }, []);

  const escolherDaGaleria = useCallback(async () => {
    if (midiasUri.length >= 6) {
      Alert.alert('Limite atingido', 'Você pode adicionar no máximo 6 fotos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos de acesso às fotos para anexar ao reporte.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 6 - midiasUri.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedMedia(prev => {
        const remainingSlots = 6 - prev.length;
        const newMedia = result.assets.slice(0, remainingSlots).map(toLocalPostMedia);
        return [...prev, ...newMedia];
      });
    }
  }, [midiasUri.length]);

  const tirarFoto = useCallback(async () => {
    if (midiasUri.length >= 6) {
      Alert.alert('Limite atingido', 'Você pode adicionar no máximo 6 fotos.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos de acesso à câmera para tirar a foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedMedia(prev => {
        if (prev.length >= 6) return prev;
        return [...prev, toLocalPostMedia(result.assets[0])];
      });
    }
  }, [midiasUri.length]);

  const removerFoto = useCallback((indexToRemove: number) => {
    setSelectedMedia(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const escolherFoto = useCallback(() => {
    Alert.alert('Adicionar foto', 'De onde deseja adicionar a imagem?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Câmera', onPress: tirarFoto },
      { text: 'Galeria', onPress: escolherDaGaleria },
    ]);
  }, [tirarFoto, escolherDaGaleria]);

  const confirmarAreaAbrirForm = useCallback(() => {
    if (drawingCoordinates.length < 3) {
      Alert.alert('Atenção', 'Um polígono precisa de pelo menos 3 pontos.');
      return;
    }

    const orderedCoordinates = ordenarPontosPoligono(drawingCoordinates);
    setDrawingCoordinates(orderedCoordinates);

    const latitude =
      orderedCoordinates.reduce((acc, point) => acc + point.latitude, 0) /
      orderedCoordinates.length;
    const longitude =
      orderedCoordinates.reduce((acc, point) => acc + point.longitude, 0) /
      orderedCoordinates.length;
    const referencia = { latitude, longitude };
    
    setLoadingConfirmationAddress(true);
    Location.reverseGeocodeAsync(referencia)
      .then((results) => {
        const addr = formatarEndereco(results[0] ?? null) || formatarCoordenadas(referencia);
        setConfirmationAddress(addr);
        setEndereco(addr);
      })
      .catch(() => {
        const fallback = formatarCoordenadas(referencia);
        setConfirmationAddress(fallback);
        setEndereco(fallback);
      })
      .finally(() => {
        setLoadingConfirmationAddress(false);
        setLoadingAddress(false);
        setTipo('alagamento'); // Forced visually, or logic could change
        resetFormState({ preserveAddress: true });
        setModalVisible(true);
      });
  }, [drawingCoordinates, resetFormState]);

  const salvar = useCallback(async () => {
    setSalvando(true);
    try {
      const isOfflineWeb =
        isWeb && typeof navigator !== 'undefined' && navigator.onLine === false;

      if (isOfflineWeb && selectedMedia.length > 0) {
        throw new Error('Sem internet. Reportes com fotos ainda precisam de conexão para enviar as mídias.');
      }

      const uploadedMedia = isOfflineWeb
        ? []
        : await reporteRepository.prepararUploads(selectedMedia);
      let successMessage = 'Reporte enviado com sucesso.';

      if (isDrawing) {
        const orderedCoordinates = ordenarPontosPoligono(drawingCoordinates);
        const floodArea: FloodArea = {
          id: `flood-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          coordinates: orderedCoordinates,
          endereco: endereco || 'Endereço não informado',
          nivel,
          descricao: descricao.trim() || '',
          dataHora: new Date().toISOString(),
          is_finished: false,
          midiasUri,
          mediaUploads: uploadedMedia,
        };
        await reporteRepository.adicionarFloodArea(floodArea);
        const atualizados = await reporteRepository.carregarFloodAreas();
        setSavedFloodAreas(atualizados);
        setIsDrawing(false);
        setDrawingCoordinates([]);
        successMessage = isOfflineWeb
          ? 'Área de alagamento salva no aparelho e será sincronizada quando a rede voltar.'
          : 'Área de alagamento enviada com sucesso.';
      } else if (selectedPoint && tipo === 'alagamento') {
        const reporte: Reporte = {
          id: `report-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          tipo,
          latitude: selectedPoint.latitude,
          longitude: selectedPoint.longitude,
          endereco: endereco || 'Endereço não informado',
          nivel,
          descricao: descricao.trim() || '',
          fotoUri: midiasUri[0] || null,
          midiasUri,
          mediaUploads: uploadedMedia,
          dataHora: new Date().toISOString(),
        };
        await reporteRepository.adicionarReporte(reporte);
        const atualizados = await reporteRepository.carregarReportes();
        setSavedReportes(atualizados);
        successMessage = isOfflineWeb
          ? 'Alagamento salvo no aparelho e será sincronizado quando a rede voltar.'
          : 'Alagamento enviado com sucesso.';
      } else if (selectedPoint && tipo === 'bueiro') {
         const manhole: Manhole = {
           id: `manhole-${Date.now()}-${Math.random().toString(36).slice(2)}`,
           latitude: selectedPoint.latitude,
           longitude: selectedPoint.longitude,
           endereco: endereco || 'Endereço não informado',
           descricao: descricao.trim() || '',
           dataHora: new Date().toISOString(),
           is_finished: false,
           midiasUri,
           mediaUploads: uploadedMedia,
         };
         await reporteRepository.adicionarManhole(manhole);
         const atualizados = await reporteRepository.carregarManholes();
         setSavedManholes(atualizados);
         successMessage = isOfflineWeb
           ? 'Bueiro salvo no aparelho e será sincronizado quando a rede voltar.'
           : 'Bueiro enviado com sucesso.';
      }

      setModalVisible(false);
      setSelectedPoint(null);
      resetFormState();
      setDrawingCoordinates([]);
      setIsDrawing(false);
      setTimeout(() => {
        Alert.alert('Sucesso', successMessage);
      }, 500);
      return true;
    } catch (error: any) {
      console.error('[Map] erro ao salvar reporte:', error);
      setTimeout(() => {
        Alert.alert('Erro', error?.message || 'Não foi possível salvar o reporte.');
      }, 500);
      return false;
    } finally {
      setSalvando(false);
    }
  }, [selectedPoint, tipo, nivel, descricao, endereco, midiasUri, selectedMedia, isDrawing, drawingCoordinates, resetFormState]);

  const fecharModal = useCallback(() => {
    setModalVisible(false);
    setSelectedPoint(null);
    resetFormState();
    setIsDrawing(false);
    setDrawingCoordinates([]);
  }, [resetFormState]);

  return {
    // State
    userLocation,
    selectedPoint,
    savedReportes,
    savedManholes,
    savedFloodAreas,
    isDrawing,
    drawingCoordinates,
    confirmationAddress,
    loadingConfirmationAddress,
    endereco,
    loadingLocation,
    isMapBootstrapping,
    loadingAddress,
    modalVisible,
    searchText,
    searching,
    searchError,
    searchSuggestions,
    showSuggestions,
    searchHasResolved,
    mapRef,
    mapRegion,
    hasCenteredOnUser,
    filtroAtivo,
    tipo,
    nivel,
    descricao,
    midiasUri,
    salvando,
    RAIO_MAXIMO_KM,

    // Setters
    setSearchText,
    setSearchError,
    setShowSuggestions,
    setFiltroAtivo,
    setTipo,
    setNivel,
    setEndereco,
    setDescricao,

    // Actions
    buscarSugestoes,
    buscarPorEndereco,
    selecionarSugestao,
    getFilteredReportes,
    getFilteredManholes,
    getFilteredFloodAreas,
    aoClicarNoMapa,
    usarMinhaLocalizacao,
    abrirReporteDeAlagamentoNaMinhaLocalizacao,
    recentralizar,
    confirmarLocalAbrirForm,
    confirmarAreaAbrirForm,
    cancelarPin,
    toggleDrawingMode,
    desfazerUltimoPonto,
    escolherFoto,
    removerFoto,
    salvar,
    fecharModal,
  };
}
