import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/core/constants/theme';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { isWeb } from '@/core/utils/platform-capabilities';

import { ThemedText } from '../atoms/themed-text';

export function NetworkStatusBanner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') {
      return;
    }

    const syncStatus = () => {
      setIsOffline(window.navigator.onLine === false);
    };

    syncStatus();
    window.addEventListener('online', syncStatus);
    window.addEventListener('offline', syncStatus);

    return () => {
      window.removeEventListener('online', syncStatus);
      window.removeEventListener('offline', syncStatus);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.warning, paddingTop: Math.max(insets.top, 0) + 10 },
      ]}
    >
      <ThemedText style={styles.text}>
        Sem internet. O app continua aberto e vai sincronizar quando a rede voltar.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
