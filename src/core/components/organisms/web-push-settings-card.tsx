import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors, Layout } from '@/core/constants/theme';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import {
  decodeBase64Url,
  getPushSubscriptionStorageKey,
  getVapidPublicKey,
  isStandaloneWeb,
  isWeb,
  supportsPushNotifications,
} from '@/core/utils/platform-capabilities';

import { ThemedText } from '../atoms/themed-text';

type PushState = 'loading' | 'unsupported' | 'not-installed' | 'missing-vapid' | 'ready' | 'subscribed';

function getStoredSubscription() {
  if (!isWeb || typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(getPushSubscriptionStorageKey());
}

async function ensureServiceWorkerReady() {
  const registration = await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready.then(() => registration);
}

export function WebPushSettingsCard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [pushState, setPushState] = useState<PushState>('loading');
  const [permission, setPermission] = useState<string>('default');
  const [message, setMessage] = useState('Avaliaremos o suporte do navegador para notificações web.');

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    const subscription = getStoredSubscription();
    const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    setPermission(notificationPermission);

    if (!supportsPushNotifications()) {
      setPushState('unsupported');
      setMessage('Este navegador não suporta Web Push para o app web.');
      return;
    }

    if (!isStandaloneWeb()) {
      setPushState('not-installed');
      setMessage('No iPhone, notificações web exigem o app instalado na Tela Inicial.');
      return;
    }

    if (!getVapidPublicKey()) {
      setPushState('missing-vapid');
      setMessage('Falta configurar EXPO_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY para ativar subscriptions.');
      return;
    }

    if (subscription) {
      setPushState('subscribed');
      setMessage('Subscription local criada. Falta apenas enviar ao backend de push.');
      return;
    }

    setPushState('ready');
    setMessage('O app está apto a pedir permissão e criar a subscription web.');
  }, []);

  const handleEnablePush = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setMessage('Permissão negada. Você pode reativar nas configurações do Safari/iPhone.');
        return;
      }

      const registration = await ensureServiceWorkerReady();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeBase64Url(getVapidPublicKey()),
      });

      window.localStorage.setItem(
        getPushSubscriptionStorageKey(),
        JSON.stringify(subscription.toJSON()),
      );
      setPushState('subscribed');
      setMessage('Subscription criada no cliente. Integre o payload ao backend para disparo real.');
    } catch (error: any) {
      setMessage(error?.message || 'Não foi possível ativar o push neste dispositivo.');
    }
  };

  const handleDisablePush = async () => {
    try {
      const registration = await ensureServiceWorkerReady();
      const subscription = await registration.pushManager.getSubscription();
      await subscription?.unsubscribe();
      window.localStorage.removeItem(getPushSubscriptionStorageKey());
      setPushState('ready');
      setMessage('Subscription removida deste dispositivo.');
    } catch (error: any) {
      setMessage(error?.message || 'Não foi possível remover a subscription local.');
    }
  };

  if (!isWeb) {
    return null;
  }

  const showPrimaryAction = pushState === 'ready';
  const showSecondaryAction = pushState === 'subscribed';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, Layout.shadow]}>
      <ThemedText style={styles.title}>Notificações Web</ThemedText>
      <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
        {message}
      </ThemedText>

      <View style={styles.metaRow}>
        <View style={[styles.badge, { backgroundColor: isDark ? '#173442' : '#E7F6FB' }]}>
          <ThemedText style={styles.badgeText}>Permissão: {permission}</ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: isDark ? '#2A2B31' : '#EEF2F7' }]}>
          <ThemedText style={styles.badgeText}>Estado: {pushState}</ThemedText>
        </View>
      </View>

      {showPrimaryAction ? (
        <TouchableOpacity
          onPress={handleEnablePush}
          style={[styles.primaryButton, { backgroundColor: colors.tint }]}
        >
          <ThemedText style={styles.primaryText}>Ativar neste aparelho</ThemedText>
        </TouchableOpacity>
      ) : null}

      {showSecondaryAction ? (
        <TouchableOpacity
          onPress={handleDisablePush}
          style={[styles.secondaryButton, { borderColor: colors.border }]}
        >
          <ThemedText style={[styles.secondaryText, { color: colors.text }]}>
            Remover subscription local
          </ThemedText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 28,
    overflow: 'hidden',
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 44,
  },
  primaryText: {
    color: '#08212B',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 44,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
