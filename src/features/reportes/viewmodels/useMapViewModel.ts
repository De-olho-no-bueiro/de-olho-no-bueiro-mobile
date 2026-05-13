import { useCallback, useEffect, useState, useRef } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import type { Reporte, TipoReporte, NivelAlagamento, Manhole, FloodArea, LocalPostMedia } from '@/features/reportes/models/Reporte';
import { ApiReporteRepository } from '@/features/reportes/services/ApiReporteRepository';
import { ExpoGeoService } from '@/features/reportes/services/ExpoGeoService';
import { ordenarPontosPoligono } from '@/features/reportes/utils/polygon';
const reporteRepository = new ApiReporteRepository();
const geoService = new ExpoGeoService();

const RAIO_MAXIMO_KM = geoService.getRaioMaximoPermitidoKm();

export type Coordenadas = { latitude: number; longitude: number };

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

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
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Location.LocationGeocodedAddress[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
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

  const resetFormState = useCallback((options?: { preserveAddress?: boolean }) => {
    setNivel('baixo');
    setDescricao('');
    setSelectedMedia([]);
    if (!options?.preserveAddress) {
      setEndereco('');
    }
    setConfirmationAddress('');
  }, []);

  const pedirPermissaoELocalizacao = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Localização',
          'Precisamos da sua localização para marcar pontos dentro de 2 km de você.'
        );
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    pedirPermissaoELocalizacao();
  }, [pedirPermissaoELocalizacao]);

  useEffect(() => {
    reporteRepository.carregarReportes().then(setSavedReportes);
    reporteRepository.carregarManholes().then(setSavedManholes);
    reporteRepository.carregarFloodAreas().then(setSavedFloodAreas);
  }, []);

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

  const buscarSugestoes = useCallback(async (text: string) => {
    if (text.length < 3) {
      setSearchSuggestions([]);
      return;
    }
    try {
      const results = await Location.geocodeAsync(text);
      if (results.length > 0) {
        // Limit to 5 results and fetch reverse geocode in parallel
        const suggestionPromises = results.slice(0, 5).map(async (coords) => {
          try {
            const reverse = await Location.reverseGeocodeAsync(coords);
            return reverse[0] || null;
          } catch {
            return null;
          }
        });
        
        const addresses = (await Promise.all(suggestionPromises)).filter((addr): addr is Location.LocationGeocodedAddress => addr !== null);
        setSearchSuggestions(addresses);
      } else {
        setSearchSuggestions([]);
      }
    } catch {
      setSearchSuggestions([]);
    }
  }, []);

  const buscarPorEndereco = useCallback(async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    setSearchError('');
    setShowSuggestions(false);
    try {
      const results = await Location.geocodeAsync(searchText.trim());
      if (results.length === 0) {
        setSearchError('Endereço não encontrado');
        setSearching(false);
        return;
      }
      const { latitude, longitude } = results[0];
      const newRegion: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      setMapRegion(newRegion);
      (mapRef.current as any)?.animateToRegion?.(newRegion, 500);
      setSearchText('');
      setSearchSuggestions([]);
    } catch {
      setSearchError('Erro ao buscar endereço');
    } finally {
      setSearching(false);
    }
  }, [searchText]);

  const selecionarSugestao = useCallback((address: Location.LocationGeocodedAddress) => {
    const searchString = [
      address.street,
      address.streetNumber,
      address.district,
      address.city,
    ].filter(Boolean).join(', ');
    
    Location.geocodeAsync(searchString).then((results) => {
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const newRegion: Region = {
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setMapRegion(newRegion);
        (mapRef.current as any)?.animateToRegion?.(newRegion, 500);
      }
    });
    
    setSearchText(searchString);
    setShowSuggestions(false);
    setSearchSuggestions([]);
  }, []);

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

  const aoClicarNoMapa = useCallback(
    (e: { nativeEvent: { coordinate?: Coordenadas } }) => {
      if (!e?.nativeEvent?.coordinate) return;
      const { latitude, longitude } = e.nativeEvent.coordinate;
      
      if (isDrawing) {
        if (!userLocation) {
          Alert.alert('Aguarde', 'Obtendo sua localização...');
          return;
        }

        try {
          const raio = geoService.getRaioMaximoPermitidoKm();
          const isDentro = geoService.estaDentroDoRaio(userLocation.latitude, userLocation.longitude, latitude, longitude, raio);
          if (!isDentro) {
            throw new Error(`Só é possível marcar áreas a até ${raio} km da sua localização atual.`);
          }
        } catch (error: any) {
          Alert.alert('Fora do raio', error.message);
          return;
        }

        const hoje = new Date().toDateString();
        const raioSobreposicaoKm = 0.015; // 15 meters
        const sobrepoeArea = savedFloodAreas.some(fa => {
          if (fa.is_finished || new Date(fa.dataHora).toDateString() !== hoje) return false;
          return fa.coordinates.some(c => geoService.estaDentroDoRaio(latitude, longitude, c.latitude, c.longitude, raioSobreposicaoKm));
        });

        if (sobrepoeArea) {
          Alert.alert('Atenção', 'Já existe uma área de alagamento ativa reportada hoje neste local.');
          return;
        }

        setDrawingCoordinates(prev => [...prev, { latitude, longitude }]);
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
    [userLocation, buscarEnderecoParaConfirmacao, isDrawing, savedFloodAreas]
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
    setSelectedPoint(userLocation);
    buscarEnderecoParaConfirmacao(userLocation.latitude, userLocation.longitude);
  }, [userLocation, buscarEnderecoParaConfirmacao]);

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

    // We get the first point to serve as the "logical" central address for the area pin and wait for it
    const pt = orderedCoordinates[0];
    
    setLoadingConfirmationAddress(true);
    Location.reverseGeocodeAsync({ latitude: pt.latitude, longitude: pt.longitude })
      .then((results) => {
        const addr = formatarEndereco(results[0] ?? null) || 'Endereço não disponível';
        setEndereco(addr);
      })
      .catch(() => {
        setEndereco('Endereço não disponível');
      })
      .finally(() => {
        setLoadingConfirmationAddress(false);
        setTipo('alagamento'); // Forced visually, or logic could change
        resetFormState({ preserveAddress: true });
        setModalVisible(true);
      });
  }, [drawingCoordinates, resetFormState]);

  const salvar = useCallback(async () => {
    setSalvando(true);
    try {
      const uploadedMedia = await reporteRepository.prepararUploads(selectedMedia);
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
        successMessage = 'Área de alagamento enviada com sucesso.';
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
        successMessage = 'Alagamento enviado com sucesso.';
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
         successMessage = 'Bueiro enviado com sucesso.';
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
    loadingAddress,
    modalVisible,
    searchText,
    searching,
    searchError,
    searchSuggestions,
    showSuggestions,
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
