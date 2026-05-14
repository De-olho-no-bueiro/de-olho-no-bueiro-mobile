import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/core/components/atoms/themed-text';
import { ThemedView } from '@/core/components/atoms/themed-view';
import { IconSymbol } from '@/core/components/atoms/icon-symbol';
import { WebPushSettingsCard } from '@/core/components/organisms/web-push-settings-card';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { Colors, Layout } from '@/core/constants/theme';
import { useConfiguracoesViewModel } from '@/features/configuracoes/viewmodels/useConfiguracoesViewModel';

export function ConfiguracoesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const vm = useConfiguracoesViewModel();

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
        <View style={[styles.section, { backgroundColor: colors.surface }, Layout.shadow]}>
          <ThemedText style={[styles.themeSectionLabel, { color: colors.text }]}>
            Aparência
          </ThemedText>
          {vm.THEME_OPTIONS.map((opt: { value: any /* ThemePreference */; label: string }, index: number) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.themeOptionRow,
                {
                  backgroundColor: colors.surface,
                  borderBottomWidth: index < vm.THEME_OPTIONS.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => vm.setThemePreference(opt.value)}
              activeOpacity={0.6}
            >
              <ThemedText style={styles.themeOptionLabel}>{opt.label}</ThemedText>
              <View
                style={[
                  styles.themeOptionRadio,
                  {
                    borderColor: vm.themePreference === opt.value ? colors.tint : colors.border,
                    borderWidth: vm.themePreference === opt.value ? 2 : 1.5,
                  },
                ]}
              >
                {vm.themePreference === opt.value && (
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
        <View style={[styles.section, { backgroundColor: colors.surface }, Layout.shadow]}>
          <TouchableOpacity
            style={[styles.row, styles.rowTouchable, { borderBottomColor: colors.border }]}
            onPress={vm.handleLimparReportes}
          >
            <ThemedText style={styles.rowLabel}>Limpar reportes salvos</ThemedText>
            <ThemedText style={[styles.rowValue, { color: colors.icon }]}>
              Excluir todos do celular
            </ThemedText>
          </TouchableOpacity>
        </View>

        <WebPushSettingsCard />

        {/* Sobre */}
        <ThemedText style={[styles.sectionTitle, { color: colors.icon }]}>
          SOBRE
        </ThemedText>
        <View style={[styles.section, { backgroundColor: colors.surface }, Layout.shadow]}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.rowLabel}>Versão</ThemedText>
            <ThemedText style={[styles.rowValue, { color: colors.icon }]}>
              {vm.APP_VERSION}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.row, styles.rowTouchable, { borderBottomColor: colors.border }]}
            onPress={() => vm.openLink('https://example.com/termos')}
          >
            <ThemedText style={styles.rowLabel}>Termos de uso</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, styles.rowTouchable]}
            onPress={() => vm.openLink('https://example.com/privacidade')}
          >
            <ThemedText style={styles.rowLabel}>Política de privacidade</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Contato e projeto */}
        <ThemedText style={[styles.sectionTitle, { color: colors.icon }]}>
          CONTATO E PROJETO
        </ThemedText>
        <View style={[styles.section, { backgroundColor: colors.surface }, Layout.shadow]}>
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
            onPress={() => vm.openEmail('contato@deolhonobueiro.app')}
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
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 12,
  },
  section: {
    borderRadius: 20, // More rounded like Waze cards
    overflow: 'hidden',
    marginBottom: 28,
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
