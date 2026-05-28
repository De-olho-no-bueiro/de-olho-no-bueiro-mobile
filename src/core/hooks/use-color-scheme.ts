import { type ColorSchemeName, useColorScheme as useRNColorScheme } from 'react-native';

import { useThemePreference } from '@/core/contexts/theme-preference-context';

export function useColorScheme(): NonNullable<ColorSchemeName> {
  const themeContext = useThemePreference();
  const systemScheme = useRNColorScheme();

  if (themeContext) {
    return themeContext.effectiveScheme ?? systemScheme ?? 'light';
  }

  return systemScheme ?? 'light';
}
