import { useCallback } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemePreference, type ThemePreference } from '@/contexts/theme-preference-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { limparTodosReportes } from '@/utils/storage';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'auto', label: 'Automático' },
];

function openLink(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Erro', 'Não foi possível abrir o link.');
  });
}

function openEmail(email: string) {
  Linking.openURL(`mailto:${email}`).catch(() => {
    Alert.alert('Erro', 'Não foi possível abrir o e-mail.');
  });
}

export default function ConfiguracoesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { themePreference, setThemePreference } = useThemePreference() ?? {
    themePreference: 'auto' as ThemePreference,
    setThemePreference: async () => {},
  };

  const handleLimparReportes = useCallback(() => {
    Alert.alert(
      'Limpar reportes',
      'Todos os reportes salvos neste celular serão excluídos. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar tudo',
          style: 'destructive',
          onPress: async () => {
            await limparTodosReportes();
            Alert.alert('Pronto', 'Reportes removidos.');
          },
        },
      ]
    );
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20) + 8, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.mainTitle}>
          Configurações
        </ThemedText>

        {/* Preferências */}
        <ThemedText style={[styles.sectionTitle, { color: colors.icon }]}>
          PREFERÊNCIAS
        </ThemedText>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <ThemedText style={[styles.themeSectionLabel, { color: colors.text }]}>
            Aparência
          </ThemedText>
          {THEME_OPTIONS.map((opt, index) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.themeOptionRow,
                {
                  backgroundColor: colors.surface,
                  borderBottomWidth: index < THEME_OPTIONS.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => setThemePreference(opt.value)}
              activeOpacity={0.6}
            >
              <ThemedText style={styles.themeOptionLabel}>{opt.label}</ThemedText>
              <View
                style={[
                  styles.themeOptionRadio,
                  {
                    borderColor: themePreference === opt.value ? colors.tint : colors.border,
                    borderWidth: themePreference === opt.value ? 2 : 1.5,
                  },
                ]}
              >
                {themePreference === opt.value && (
                  <View style={[styles.themeOptionRadioInner, { backgroundColor: colors.tint }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dados e privacidade */}
        <ThemedText style={[styles.sectionTitle, { color: colors.icon }]}>
          DADOS E PRIVACIDADE
        </ThemedText>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.row, styles.rowTouchable, { borderBottomColor: colors.border }]}
            onPress={handleLimparReportes}
          >
            <ThemedText style={styles.rowLabel}>Limpar reportes salvos</ThemedText>
            <ThemedText style={[styles.rowValue, { color: colors.icon }]}>
              Excluir todos do celular
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Sobre */}
        <ThemedText style={[styles.sectionTitle, { color: colors.icon }]}>
          SOBRE
        </ThemedText>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.rowLabel}>Versão</ThemedText>
            <ThemedText style={[styles.rowValue, { color: colors.icon }]}>
              {APP_VERSION}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.row, styles.rowTouchable, { borderBottomColor: colors.border }]}
            onPress={() => openLink('https://example.com/termos')}
          >
            <ThemedText style={styles.rowLabel}>Termos de uso</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, styles.rowTouchable]}
            onPress={() => openLink('https://example.com/privacidade')}
          >
            <ThemedText style={styles.rowLabel}>Política de privacidade</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Contato e projeto */}
        <ThemedText style={[styles.sectionTitle, { color: colors.icon }]}>
          CONTATO E PROJETO
        </ThemedText>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.aboutBlock}>
            <ThemedText style={styles.rowLabel}>Sobre o projeto</ThemedText>
            <ThemedText style={[styles.aboutText, { color: colors.icon }]}>
              De olho no bueiro é um app para você reportar pontos de alagamento e problemas de
              drenagem na sua cidade. Os reportes ficam salvos no seu celular e podem ser
              compartilhados. Junte-se a outros cidadãos para mapear e cobrar melhorias.
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.row, styles.rowTouchable]}
            onPress={() => openEmail('contato@deolhonobueiro.app')}
          >
            <ThemedText style={styles.rowLabel}>Contato / Suporte</ThemedText>
            <ThemedText style={[styles.rowValue, { color: colors.tint }]}>
              contato@deolhonobueiro.app
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  mainTitle: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  themeSectionLabel: {
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  themeOptionLabel: {
    fontSize: 16,
  },
  themeOptionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowTouchable: {
    minHeight: 48,
  },
  rowLabel: {
    fontSize: 16,
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    marginLeft: 12,
  },
  aboutBlock: {
    padding: 16,
    paddingBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  footer: {
    height: 24,
  },
});
