import { useCallback, useEffect, useState } from 'react';
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
import MapView, { Marker } from 'react-native-maps';
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

type Coordenadas = { latitude: number; longitude: number };

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

  const [userLocation, setUserLocation] = useState<Coordenadas | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Coordenadas | null>(null);
  const [savedReportes, setSavedReportes] = useState<Reporte[]>([]);
  const [confirmationAddress, setConfirmationAddress] = useState('');
  const [loadingConfirmationAddress, setLoadingConfirmationAddress] = useState(false);
  const [endereco, setEndereco] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

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

  const initialRegion = userLocation
    ? {
        ...userLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : REGIAO_INICIAL;

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
      <MapView
        key={userLocation ? 'centered' : 'default'}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={aoClicarNoMapa}
        showsUserLocation
        showsMyLocationButton
      >
        {savedReportes.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
            title={r.tipo === 'alagamento' ? 'Alagamento' : 'Bueiro'}
            description={r.endereco}
            pinColor={colors.tint}
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

      {loadingLocation && (
        <View style={[styles.loadingOverlay, { backgroundColor: loadingOverlayBg }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Obtendo sua localização...</ThemedText>
        </View>
      )}

      <View style={[styles.buttons, { backgroundColor: colors.surface }]}>
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
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
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
