import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import { useThemePreference, type ThemePreference } from '@/core/contexts/theme-preference-context';

import { AsyncStorageReporteRepository } from '@/features/reportes/services/AsyncStorageReporteRepository';

const reporteRepository = new AsyncStorageReporteRepository();

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'auto', label: 'Automático' },
];

export function useConfiguracoesViewModel() {
  const { themePreference, setThemePreference } = useThemePreference() ?? {
    themePreference: 'auto' as ThemePreference,
    setThemePreference: async () => {},
  };

  const openLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o link.');
    });
  }, []);

  const openEmail = useCallback((email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o e-mail.');
    });
  }, []);

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
            await reporteRepository.limparTodosReportes();
            Alert.alert('Pronto', 'Reportes removidos.');
          },
        },
      ]
    );
  }, []);

  return {
    themePreference,
    setThemePreference,
    handleLimparReportes,
    openLink,
    openEmail,
    APP_VERSION,
    THEME_OPTIONS,
  };
}
