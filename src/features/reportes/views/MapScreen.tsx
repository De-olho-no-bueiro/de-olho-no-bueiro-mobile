import {
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

import { ThemedText } from '@/core/components/atoms/themed-text';
import { ThemedView } from '@/core/components/atoms/themed-view';
import { IconSymbol } from '@/core/components/atoms/icon-symbol';
import { NIVEL_LABELS, TIPO_LABELS } from '@/features/reportes/models/Reporte';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { Colors, Layout } from '@/core/constants/theme';
import { Image } from 'expo-image';
import { useMapViewModel, FiltroOpcao } from '@/features/reportes/viewmodels/useMapViewModel';

import MapViewComponent from '@/core/components/organisms/map-view';

const FILTROS: { key: FiltroOpcao; label: string; icon: string }[] = [
  { key: 'todos', label: 'Todos', icon: 'map' },
  { key: 'mais-graves', label: 'Mais Graves', icon: 'exclamationmark.triangle' },
  { key: 'ultimos-7-dias', label: 'Últimos 7 Dias', icon: 'clock' },
  { key: 'alagamentos', label: 'Alagamentos', icon: 'water' },
  { key: 'bueiros', label: 'Bueiros', icon: 'manhole' },
];

const NIVEL_WAZE_OPTIONS = [
  {
    id: 'baixo',
    title: 'Baixo',
    description: 'Cobre a rua, mas está tranquilo',
    icon: '🟢🚗',
    color: '#34C759',
    bgColor: 'rgba(52, 199, 89, 0.15)',
  },
  {
    id: 'leve',
    title: 'Médio',
    description: 'Até o meio da roda do carro',
    icon: '🚙💦',
    color: '#FFB800',
    bgColor: 'rgba(255, 184, 0, 0.15)',
  },
  {
    id: 'medio',
    title: 'Avançado',
    description: 'Até a altura do umbigo de uma pessoa comum',
    icon: '🩳🌊',
    color: '#FF8800',
    bgColor: 'rgba(255, 136, 0, 0.15)',
  },
  {
    id: 'grave',
    title: 'Extremo',
    description: 'Intransponível',
    icon: '🛑⛈️',
    color: '#FF3B30',
    bgColor: 'rgba(255, 59, 48, 0.15)',
  },
] as const;

export function MapScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const vm = useMapViewModel();



  const loadingOverlayBg = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)';

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: insets.top + 16 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }, Layout.shadow]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar bairro ou endereço..."
            placeholderTextColor={colors.icon}
            value={vm.searchText}
            onChangeText={(text) => {
              vm.setSearchText(text);
              vm.setSearchError('');
              vm.buscarSugestoes(text);
              vm.setShowSuggestions(text.length >= 3);
            }}
            onSubmitEditing={vm.buscarPorEndereco}
            returnKeyType="search"
            onFocus={() => vm.searchText.length >= 3 && vm.setShowSuggestions(true)}
            onBlur={() => setTimeout(() => vm.setShowSuggestions(false), 200)}
          />
          {vm.searching ? (
            <ActivityIndicator size="small" color={colors.tint} />
          ) : vm.searchText.length > 0 ? (
            <TouchableOpacity onPress={() => { vm.setSearchText(''); vm.setSearchError(''); vm.buscarSugestoes(''); vm.setShowSuggestions(false); }}>
              <IconSymbol name="xmark.circle.fill" size={20} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {vm.showSuggestions && vm.searchSuggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface }, Layout.shadow]}>
            {vm.searchSuggestions.map((addr: any, index: number) => {
              const addrStr = [addr.street, addr.streetNumber, addr.district, addr.city].filter(Boolean).join(', ');
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                  onPress={() => vm.selecionarSugestao(addr)}
                >
                  <ThemedText numberOfLines={1}>{addrStr}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {vm.searchError ? (
          <ThemedText style={styles.searchError}>{vm.searchError}</ThemedText>
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
                { backgroundColor: vm.filtroAtivo === filtro.key ? colors.tint : colors.surface },
                Layout.shadow,
              ]}
              onPress={() => vm.setFiltroAtivo(filtro.key)}
            >
              <IconSymbol
                name={filtro.icon as any}
                size={14}
                color={vm.filtroAtivo === filtro.key ? (isDark ? colors.background : '#fff') : colors.text}
              />
              <ThemedText
                style={[
                  styles.filterLabel,
                  { color: vm.filtroAtivo === filtro.key ? (isDark ? colors.background : '#fff') : colors.text },
                ]}
              >
                {filtro.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <MapViewComponent
        mapRef={vm.mapRef}
        region={vm.mapRegion}
        onPress={vm.aoClicarNoMapa}
        savedReportes={vm.getFilteredReportes()}
        savedManholes={vm.savedManholes}
        savedFloodAreas={vm.savedFloodAreas}
        drawingCoordinates={vm.drawingCoordinates}
        selectedPoint={vm.selectedPoint}
        colors={colors}
        tintColor={colors.tint}
      />

      {vm.loadingLocation && (
        <View style={[styles.loadingOverlay, { backgroundColor: loadingOverlayBg }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Obtendo sua localização...</ThemedText>
        </View>
      )}

      <View style={[
        styles.bottomCard, 
        { backgroundColor: colors.surface, paddingBottom: Math.max(16, insets.bottom) },
        Layout.shadow
      ]}>
        {vm.isDrawing ? (
          <View style={styles.drawingControls}>
            <ThemedText style={styles.drawingHint}>
              Modo Desenho ({vm.drawingCoordinates.length} pt). Demarque a área no mapa e confirme.
            </ThemedText>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {vm.drawingCoordinates.length > 0 && (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.background, flex: 1, borderWidth: 1, borderColor: colors.border }]}
                  onPress={vm.desfazerUltimoPonto}
                >
                  <IconSymbol name="arrow.uturn.backward" size={20} color={colors.text} />
                  <ThemedText style={{ color: colors.text }}>Desfazer</ThemedText>
                </TouchableOpacity>
              )}
              {vm.drawingCoordinates.length > 2 && (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.tint, flex: 1 }]}
                  onPress={vm.confirmarAreaAbrirForm}
                >
                  <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar Área</ThemedText>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.buttonCancelar} onPress={vm.toggleDrawingMode}>
              <ThemedText>Cancelar Desenho</ThemedText>
            </TouchableOpacity>
          </View>
        ) : vm.selectedPoint && !vm.modalVisible ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonConfirmar, { backgroundColor: colors.tint }]}
              onPress={vm.confirmarLocalAbrirForm}
              disabled={vm.loadingConfirmationAddress}
            >
              {vm.loadingConfirmationAddress ? (
                <ActivityIndicator size="small" color={isDark ? colors.background : '#fff'} />
              ) : (
                <ThemedText
                  style={[styles.buttonText, { color: isDark ? colors.background : '#fff' }]}
                  numberOfLines={2}
                >
                  Confirmar: {vm.confirmationAddress || 'Carregando endereço...'}
                </ThemedText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonCancelar, { borderColor: colors.border }]}
              onPress={vm.cancelarPin}
            >
              <ThemedText style={styles.buttonCancelarText}>Cancelar</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginBottom: 8 }]}
              onPress={vm.toggleDrawingMode}
            >
              <IconSymbol name="pencil.and.outline" size={24} color={colors.icon} />
              <ThemedText style={{ color: colors.text }}>Desenhar Área de Enchente</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={vm.usarMinhaLocalizacao}
              disabled={vm.loadingLocation}
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
              Ou toque no mapa para colocar um pin (até {vm.RAIO_MAXIMO_KM} km de você).
            </ThemedText>
          </>
        )}
      </View>

      <Modal
        visible={vm.modalVisible}
        animationType="slide"
        transparent
        onRequestClose={vm.fecharModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: Math.max(16, insets.bottom + 16) }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText type="subtitle">Novo reporte</ThemedText>
              <TouchableOpacity onPress={vm.fecharModal}>
                <ThemedText type="link">Fechar</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {vm.tipo === 'alagamento' && (
                <>
                  <ThemedText style={styles.label}>Gravidade do Alagamento</ThemedText>
                  <View style={[styles.nivelWazeContainer, { marginBottom: 16 }]}>
                    {NIVEL_WAZE_OPTIONS.map((opt) => {
                      const isSelected = vm.nivel === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.nivelWazeCard,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            isSelected && { borderColor: opt.color, backgroundColor: opt.bgColor, borderWidth: 2 }
                          ]}
                          onPress={() => vm.setNivel(opt.id as any)}
                        >
                          <ThemedText style={styles.nivelWazeIcon}>{opt.icon}</ThemedText>
                          <View style={styles.nivelWazeTextContainer}>
                            <ThemedText style={[styles.nivelWazeTitle, isSelected && { color: opt.color }]}>
                              {opt.title}
                            </ThemedText>
                            <ThemedText style={[styles.nivelWazeDesc, { color: colors.icon }]}>
                              {opt.description}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <ThemedText style={styles.label}>Endereço (automático)</ThemedText>
              {vm.loadingAddress ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <ThemedText style={styles.endereco}>{vm.endereco || '—'}</ThemedText>
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
                value={vm.descricao}
                onChangeText={vm.setDescricao}
                multiline
                numberOfLines={3}
              />

              <ThemedText style={styles.label}>Mídia (opcional)</ThemedText>
              <TouchableOpacity
                style={[
                  styles.fotoButton,
                  { borderColor: colors.border, backgroundColor: colors.surface, marginBottom: vm.midiasUri.length > 0 ? 12 : 24 },
                ]}
                onPress={vm.escolherFoto}
              >
                  <IconSymbol name="camera.fill" size={32} color={colors.icon} />
                  <ThemedText style={styles.fotoLabel}>Anexar foto ou vídeo</ThemedText>
              </TouchableOpacity>

              {vm.midiasUri.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                  {vm.midiasUri.map((uri, idx) => (
                    <Image key={idx} source={{ uri }} style={[styles.fotoPreview, { width: 120, marginRight: 8 }]} />
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={[styles.salvarButton, { backgroundColor: colors.tint }]}
                onPress={vm.salvar}
                disabled={vm.salvando}
              >
                {vm.salvando ? (
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
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999, // Pill shape
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 64,
    left: 16,
    right: 16,
    borderRadius: 16,
    marginTop: 8,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999, // Pill shape
    gap: 6,
    marginVertical: 4, // Para a sombra não ser cortada
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
  bottomCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 24,
    zIndex: 5,
  },
  drawingControls: {
    gap: 8,
  },
  drawingHint: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  nivelWazeContainer: {
    gap: 8,
    width: '100%',
  },
  nivelWazeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  nivelWazeIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  nivelWazeTextContainer: {
    flex: 1,
  },
  nivelWazeTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  nivelWazeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999, // Pill shape
  },
  buttonConfirmar: {
    flex: 1,
    minHeight: 52,
  },
  buttonCancelar: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999, // Pill shape
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingTop: 8, // extra room for a potential handle indicator
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
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  endereco: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  fotoButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    elevation: 4, // waze usually has strong CTA buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  salvarButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
