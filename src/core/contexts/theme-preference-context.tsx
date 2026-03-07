import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@deolhonobueiro/theme';

export type ThemePreference = 'light' | 'dark' | 'auto';

type ThemePreferenceContextValue = {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  effectiveScheme: 'light' | 'dark';
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('auto');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'auto') {
        setThemePreferenceState(value);
      }
      setLoaded(true);
    });
  }, []);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    await AsyncStorage.setItem(STORAGE_KEY, pref);
  }, []);

  const effectiveScheme: 'light' | 'dark' =
    themePreference === 'auto'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : themePreference;

  return (
    <ThemePreferenceContext.Provider
      value={{ themePreference, setThemePreference, effectiveScheme }}
    >
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  return useContext(ThemePreferenceContext);
}
