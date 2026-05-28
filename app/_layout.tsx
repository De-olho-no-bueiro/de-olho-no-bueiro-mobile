import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { useEffect } from 'react';

import { NetworkStatusBanner } from '@/core/components/organisms/network-status-banner';
import { PWAInstallCoach } from '@/core/components/organisms/pwa-install-coach';
import { PWAShellRuntime } from '@/core/components/organisms/pwa-shell-runtime';
import { ThemePreferenceProvider } from '@/core/contexts/theme-preference-context';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/core/contexts/auth-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isWeb } from '@/core/utils/platform-capabilities';

export const unstable_settings = {
  anchor: '(tabs)',
};

const ENABLE_INCIDENT_MONITORING =
  process.env.EXPO_PUBLIC_ENABLE_INCIDENT_MONITORING === 'true';

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to welcome screen if not logged in
      router.replace('/welcome' as any);
    } else if (user && inAuthGroup) {
      // Redirect to tabs if logged in and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router]);

  useEffect(() => {
    if (!ENABLE_INCIDENT_MONITORING || isWeb) {
      return;
    }

    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    void (async () => {
      try {
        const incidentMonitoring = await import(
          '@/features/reportes/services/IncidentMonitoringService'
        );
        if (!isMounted) {
          return;
        }

        await incidentMonitoring.initializeIncidentMonitoring();
        if (!isMounted) {
          return;
        }

        subscription =
          incidentMonitoring.subscribeToIncidentNotificationResponses();
      } catch (error) {
        console.error('[IncidentMonitoring] init error', error);
      }
    })();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!ENABLE_INCIDENT_MONITORING || isLoading || isWeb) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const incidentMonitoring = await import(
          '@/features/reportes/services/IncidentMonitoringService'
        );
        if (cancelled) {
          return;
        }

        if (!user) {
          await incidentMonitoring.stopIncidentMonitoring();
          return;
        }

        await incidentMonitoring.startIncidentMonitoring();
      } catch (error) {
        console.error(
          `[IncidentMonitoring] ${user ? 'start' : 'stop'} error`,
          error,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.appShell}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <PWAShellRuntime />
        <View pointerEvents="box-none" style={styles.topOverlay}>
          <NetworkStatusBanner />
        </View>
        <View pointerEvents="box-none" style={styles.bottomOverlay}>
          <PWAInstallCoach />
        </View>
      </View>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemePreferenceProvider>
          <RootLayoutContent />
        </ThemePreferenceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
  },
  topOverlay: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bottomOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
