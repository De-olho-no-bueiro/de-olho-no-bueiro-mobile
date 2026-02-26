import { useCallback, useEffect, useState, useRef } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Reporte, TipoReporte, NivelAlagamento } from '@/types/report';
import { NIVEL_LABELS, TIPO_LABELS } from '@/types/report';
import { estaDentroDoRaio, RAIO_MAXIMO_KM } from '@/utils/geo';
import { adicionarReporte, carregarReportes } from '@/utils/storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Image } from 'expo-image';

const MapViewComponent = Platform.OS !== 'web' 
  ? require('@/components/map-view').default 
  : null;

type Coordenadas = { latitude: number; longitude: number };

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const REGIAO_INICIAL = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

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

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [userLocation, setUserLocation] = useState<Coordenadas | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Coordenadas | null>(null);
  const [savedReportes, setSavedReportes] = useState<Reporte[]>([]);
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

  type FiltroOpcao = 'todos' | 'mais-graves' | 'ultimos-7-dias' | 'alagamentos' | 'bueiros';
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroOpcao>('todos');

  const FILTROS: { key: FiltroOpcao; label: string; icon: string }[] = [
    { key: 'todos', label: 'Todos', icon: 'map' },
    { key: 'mais-graves', label: 'Mais Graves', icon: 'exclamationmark.triangle' },
    { key: 'ultimos-7-dias', label: 'Últimos 7 Dias', icon: 'clock' },
    { key: 'alagamentos', label: 'Alagamentos', icon: 'water' },
    { key: 'bueiros', label: 'Bueiros', icon: 'manhole' },
  ];

  const [tipo, setTipo] = useState<TipoReporte>('alagamento');
  const [nivel, setNivel] = useState<NivelAlagamento>('leve');
  const [descricao, setDescricao] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

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
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    pedirPermissaoELocalizacao();
  }, [pedirPermissaoELocalizacao]);

  useEffect(() => {
    carregarReportes().then(setSavedReportes);
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

  const buscarEndereco = useCallback(async (lat: number, lon: number) => {
    setLoadingAddress(true);
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      setEndereco(formatarEndereco(results[0] ?? null));
    } catch {
      setEndereco('');
    } finally {
      setLoadingAddress(false);
    }
  }, []);

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
        const addresses: Location.LocationGeocodedAddress[] = [];
        for (const coords of results.slice(0, 5)) {
          const reverse = await Location.reverseGeocodeAsync(coords);
          if (reverse[0]) {
            addresses.push(reverse[0]);
          }
        }
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
      (mapRef.current as any)?.animateToRegion(newRegion, 500);
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
        (mapRef.current as any)?.animateToRegion(newRegion, 500);
      }
    });
    
    setSearchText(searchString);
    setShowSuggestions(false);
    setSearchSuggestions([]);
  }, []);

  const filteredReportes = useCallback(() => {
    let filtered = savedReportes;
    
    if (filtroAtivo === 'mais-graves') {
      filtered = filtered.filter(r => r.nivel === 'grave');
    } else if (filtroAtivo === 'ultimos-7-dias') {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      filtered = filtered.filter(r => new Date(r.dataHora) >= seteDiasAtras);
    } else if (filtroAtivo === 'alagamentos') {
      filtered = filtered.filter(r => r.tipo === 'alagamento');
    } else if (filtroAtivo === 'bueiros') {
      filtered = filtered.filter(r => r.tipo === 'bueiro');
    }
    
    return filtered;
  }, [savedReportes, filtroAtivo]);

  const aoClicarNoMapa = useCallback(
    (e: { nativeEvent: { coordinate: Coordenadas } }) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      if (!userLocation) {
        Alert.alert('Aguarde', 'Obtendo sua localização...');
        return;
      }
      if (!estaDentroDoRaio(userLocation.latitude, userLocation.longitude, latitude, longitude)) {
        Alert.alert(
          'Fora do raio',
          `Só é possível marcar pontos a até ${RAIO_MAXIMO_KM} km da sua localização atual.`
        );
        return;
      }
      setSelectedPoint({ latitude, longitude });
      buscarEnderecoParaConfirmacao(latitude, longitude);
    },
    [userLocation, buscarEnderecoParaConfirmacao]
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
    mapRef.current?.animateToRegion(newRegion, 500);
    setSelectedPoint(userLocation);
    buscarEnderecoParaConfirmacao(userLocation.latitude, userLocation.longitude);
  }, [userLocation, buscarEnderecoParaConfirmacao]);

  const confirmarLocalAbrirForm = useCallback(() => {
    if (!selectedPoint || loadingConfirmationAddress) return;
    setEndereco(confirmationAddress || '');
    setLoadingAddress(false);
    setTipo('alagamento');
    setNivel('leve');
    setDescricao('');
    setFotoUri(null);
    setModalVisible(true);
  }, [selectedPoint, confirmationAddress, loadingConfirmationAddress]);

  const cancelarPin = useCallback(() => {
    setSelectedPoint(null);
    setConfirmationAddress('');
  }, []);

  const escolherDaGaleria = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos de acesso às fotos para anexar ao reporte.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setFotoUri(result.assets[0].uri);
  }, []);

  const tirarFoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos de acesso à câmera para tirar a foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setFotoUri(result.assets[0].uri);
  }, []);

  const escolherFoto = useCallback(() => {
    Alert.alert('Adicionar foto', 'De onde deseja adicionar a imagem?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Câmera', onPress: tirarFoto },
      { text: 'Galeria', onPress: escolherDaGaleria },
    ]);
  }, [tirarFoto, escolherDaGaleria]);

  const salvar = useCallback(async () => {
    if (!selectedPoint) return;
    setSalvando(true);
    try {
      const reporte: Reporte = {
        id: `report-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        tipo,
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        endereco: endereco || 'Endereço não informado',
        nivel,
        descricao: descricao.trim() || '',
        fotoUri,
        dataHora: new Date().toISOString(),
      };
      await adicionarReporte(reporte);
      const atualizados = await carregarReportes();
      setSavedReportes(atualizados);
      setModalVisible(false);
      setSelectedPoint(null);
      setConfirmationAddress('');
      Alert.alert('Salvo', 'Reporte registrado no seu celular.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o reporte.');
    } finally {
      setSalvando(false);
    }
  }, [selectedPoint, tipo, nivel, descricao, endereco, fotoUri]);

  const fecharModal = useCallback(() => {
    setModalVisible(false);
    setSelectedPoint(null);
    setConfirmationAddress('');
  }, []);

  if (Platform.OS === 'web') {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>O mapa está disponível apenas no app (Android e iOS).</ThemedText>
      </ThemedView>
    );
  }

  const loadingOverlayBg = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)';

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, paddingTop: insets.top + 8 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar bairro ou endereço..."
            placeholderTextColor={colors.icon}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              setSearchError('');
              buscarSugestoes(text);
              setShowSuggestions(text.length >= 3);
            }}
            onSubmitEditing={buscarPorEndereco}
            returnKeyType="search"
            onFocus={() => searchText.length >= 3 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {searching ? (
            <ActivityIndicator size="small" color={colors.tint} />
          ) : searchText.length > 0 ? (
            <TouchableOpacity onPress={() => { setSearchText(''); setSearchError(''); setSearchSuggestions([]); }}>
              <IconSymbol name="xmark.circle.fill" size={20} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {showSuggestions && searchSuggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {searchSuggestions.map((addr, index) => {
              const addrStr = [addr.street, addr.streetNumber, addr.district, addr.city].filter(Boolean).join(', ');
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                  onPress={() => selecionarSugestao(addr)}
                >
                  <ThemedText numberOfLines={1}>{addrStr}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {searchError ? (
          <ThemedText style={styles.searchError}>{searchError}</ThemedText>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTROS.map((filtro) => (
            <TouchableOpacity
              key={filtro.key}
              style={[
                styles.filterChip,
                { backgroundColor: filtroAtivo === filtro.key ? colors.tint : colors.surface },
              ]}
              onPress={() => setFiltroAtivo(filtro.key)}
            >
              <IconSymbol
                name={filtro.icon as any}
                size={14}
                color={filtroAtivo === filtro.key ? (isDark ? colors.background : '#fff') : colors.text}
              />
              <ThemedText
                style={[
                  styles.filterLabel,
                  { color: filtroAtivo === filtro.key ? (isDark ? colors.background : '#fff') : colors.text },
                ]}
              >
                {filtro.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {MapViewComponent ? (
        <MapViewComponent
          mapRef={mapRef}
          region={mapRegion}
          onPress={aoClicarNoMapa}
          savedReportes={filteredReportes()}
          selectedPoint={selectedPoint}
          colors={colors}
          tintColor={colors.tint}
        />
      ) : (
        <View style={[styles.map, styles.centered]} />
      )}

      {loadingLocation && (
        <View style={[styles.loadingOverlay, { backgroundColor: loadingOverlayBg }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Obtendo sua localização...</ThemedText>
        </View>
      )}

      <View style={[styles.buttons, { backgroundColor: colors.surface, paddingBottom: Math.max(16, insets.bottom + 16) }]}>
        {selectedPoint && !modalVisible ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonConfirmar, { backgroundColor: colors.tint }]}
              onPress={confirmarLocalAbrirForm}
              disabled={loadingConfirmationAddress}
            >
              {loadingConfirmationAddress ? (
                <ActivityIndicator size="small" color={isDark ? colors.background : '#fff'} />
              ) : (
                <ThemedText
                  style={[styles.buttonText, { color: isDark ? colors.background : '#fff' }]}
                  numberOfLines={2}
                >
                  Confirmar: {confirmationAddress || 'Carregando endereço...'}
                </ThemedText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonCancelar, { borderColor: colors.border }]}
              onPress={cancelarPin}
            >
              <ThemedText style={styles.buttonCancelarText}>Cancelar</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={usarMinhaLocalizacao}
              disabled={loadingLocation}
            >
              <IconSymbol
                name="location.fill"
                size={22}
                color={isDark ? colors.background : '#fff'}
              />
              <ThemedText
                style={[styles.buttonText, { color: isDark ? colors.background : '#fff' }]}
              >
                Usar minha localização
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.hint}>
              Ou toque no mapa para colocar um pin (até {RAIO_MAXIMO_KM} km de você).
            </ThemedText>
          </>
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={fecharModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background, paddingBottom: Math.max(16, insets.bottom + 16) }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText type="subtitle">Novo reporte</ThemedText>
              <TouchableOpacity onPress={fecharModal}>
                <ThemedText type="link">Fechar</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <ThemedText style={styles.label}>Tipo</ThemedText>
              <View style={styles.row}>
                {(['alagamento', 'bueiro'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.chip,
                      { backgroundColor: tipo === t ? colors.tint : colors.surface },
                    ]}
                    onPress={() => setTipo(t)}
                  >
                    <ThemedText
                      style={tipo === t ? { color: isDark ? colors.background : '#fff' } : undefined}
                    >
                      {TIPO_LABELS[t]}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={styles.label}>Nível</ThemedText>
              <View style={styles.row}>
                {(['leve', 'medio', 'grave'] as const).map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.chip,
                      { backgroundColor: nivel === n ? colors.tint : colors.surface },
                    ]}
                    onPress={() => setNivel(n)}
                  >
                    <ThemedText
                      style={nivel === n ? { color: isDark ? colors.background : '#fff' } : undefined}
                    >
                      {NIVEL_LABELS[n]}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={styles.label}>Endereço (automático)</ThemedText>
              {loadingAddress ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <ThemedText style={styles.endereco}>{endereco || '—'}</ThemedText>
              )}

              <ThemedText style={styles.label}>Descrição (opcional)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Ex.: Rua alagada na esquina"
                placeholderTextColor={colors.icon}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={3}
              />

              <ThemedText style={styles.label}>Foto (opcional)</ThemedText>
              <TouchableOpacity
                style={[
                  styles.fotoButton,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
                onPress={escolherFoto}
              >
                {fotoUri ? (
                  <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
                ) : (
                  <>
                    <IconSymbol name="camera.fill" size={32} color={colors.icon} />
                    <ThemedText style={styles.fotoLabel}>Anexar foto</ThemedText>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.salvarButton, { backgroundColor: colors.tint }]}
                onPress={salvar}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color={isDark ? colors.background : '#fff'} />
                ) : (
                  <ThemedText
                    style={[
                      styles.salvarButtonText,
                      { color: isDark ? colors.background : '#fff' },
                    ]}
                  >
                    Salvar reporte
                  </ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 20,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  filtersContainer: {
    marginTop: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filtersContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchError: {
    marginTop: 6,
    fontSize: 12,
    color: '#e74c3c',
    textAlign: 'center',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  buttons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonConfirmar: {
    flex: 1,
    minHeight: 52,
  },
  buttonCancelar: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonCancelarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  form: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  endereco: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  fotoButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  fotoLabel: {
    marginTop: 6,
    fontSize: 14,
  },
  salvarButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  salvarButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
