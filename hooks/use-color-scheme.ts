import { useColorScheme as useRNColorScheme } from 'react-native';

import { useThemePreference } from '@/contexts/theme-preference-context';

export function useColorScheme() {
  const themeContext = useThemePreference();
  const systemScheme = useRNColorScheme();

  if (themeContext) {
    return themeContext.effectiveScheme ?? systemScheme ?? 'light';
  }

  return systemScheme ?? 'light';
}
