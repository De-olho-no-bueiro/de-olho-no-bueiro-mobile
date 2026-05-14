import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Layout } from '@/core/constants/theme';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import {
  getInstallCoachStorageKey,
  isIosWeb,
  isSafariWeb,
  isStandaloneWeb,
  isWeb,
  supportsInstallPrompt,
} from '@/core/utils/platform-capabilities';

import { IconSymbol } from '../atoms/icon-symbol';
import { ThemedText } from '../atoms/themed-text';

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;
const IOS_INSTALL_STEPS = [
  {
    id: 'share',
    number: '1',
    title: 'Compartilhar',
    description: 'Toque no botão na barra do Safari.',
  },
  {
    id: 'add-home',
    number: '2',
    title: 'Adicionar à Tela de Início',
    description: 'Escolha esta opção na lista.',
  },
  {
    id: 'launch',
    number: '3',
    title: 'Abrir',
    description: 'Use o novo ícone na Tela de Início.',
  },
] as const;

function StepIcon({
  stepId,
  color,
}: {
  stepId: (typeof IOS_INSTALL_STEPS)[number]['id'];
  color: string;
}) {
  if (stepId === 'share') {
    return <Ionicons name="share-outline" size={18} color={color} />;
  }

  if (stepId === 'add-home') {
    return <Feather name="plus-square" size={18} color={color} />;
  }

  return <Ionicons name="home-outline" size={18} color={color} />;
}

function wasDismissedRecently() {
  if (!isWeb || typeof window === 'undefined') {
    return false;
  }

  const raw = window.localStorage.getItem(getInstallCoachStorageKey());
  if (!raw) {
    return false;
  }

  return Date.now() - Number(raw) < DISMISS_WINDOW_MS;
}

function persistDismiss() {
  if (!isWeb || typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getInstallCoachStorageKey(), String(Date.now()));
}

export function PWAInstallCoach() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);

  useEffect(() => {
    if (!isWeb || isStandaloneWeb() || wasDismissedRecently()) {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPrompt);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    if (isIosWeb() && isSafariWeb()) {
      const timeoutId = window.setTimeout(() => {
        setVisible(true);
      }, 1800);

      return () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.removeEventListener('appinstalled', onAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (!isWeb || isStandaloneWeb() || !visible) {
    return null;
  }

  const dismiss = () => {
    persistDismiss();
    setShowIosSteps(false);
    setVisible(false);
  };

  const handleInstall = async () => {
    if (isIosWeb()) {
      setShowIosSteps(true);
      return;
    }

    if (!supportsInstallPrompt() || !deferredPrompt) {
      dismiss();
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    dismiss();
  };

  return (
    <>
      <View
        style={[
          styles.banner,
          {
            backgroundColor: isDark ? 'rgba(18,18,18,0.96)' : 'rgba(255,255,255,0.98)',
            borderColor: colors.border,
            marginBottom: Math.max(insets.bottom, 8),
          },
          Layout.shadow,
        ]}
      >
        <View style={styles.bannerBody}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(51,204,255,0.12)' }]}>
            <IconSymbol name="square.and.arrow.up" size={18} color={colors.tint} />
          </View>
          <View style={styles.textWrap}>
            <ThemedText style={styles.title}>Instale o app</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
              Use em tela cheia, com abertura mais rápida e experiência melhor no iPhone.
            </ThemedText>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={dismiss} style={styles.secondaryAction}>
            <ThemedText style={[styles.secondaryText, { color: colors.icon }]}>Agora não</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleInstall}
            style={[styles.primaryAction, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.primaryText}>
              {isIosWeb() ? 'Ver passos' : 'Instalar'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <Modal animationType="fade" transparent visible={showIosSteps} onRequestClose={dismiss}>
        <Pressable style={styles.modalBackdrop} onPress={dismiss}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <ThemedText style={styles.modalTitle}>Adicionar à Tela Inicial</ThemedText>
            <ThemedText style={[styles.modalText, { color: colors.icon }]}>
              No Safari, siga estes passos:
            </ThemedText>

            <View style={styles.stepsList}>
              {IOS_INSTALL_STEPS.map((step) => (
                <View
                  key={step.id}
                  style={[
                    styles.stepCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : '#F8FBFD',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.stepHeader}>
                    <View
                      style={[
                        styles.stepBadge,
                        { backgroundColor: 'rgba(51,204,255,0.12)' },
                      ]}
                    >
                      <ThemedText
                        style={[styles.stepBadgeText, { color: colors.tint }]}
                      >
                        {step.number}
                      </ThemedText>
                    </View>

                    <View
                      style={[
                        styles.stepIconWrap,
                        { backgroundColor: 'rgba(51,204,255,0.12)' },
                      ]}
                    >
                      <StepIcon stepId={step.id} color={colors.tint} />
                    </View>

                    <View style={styles.stepContent}>
                      <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
                      <ThemedText
                        style={[styles.stepDescription, { color: colors.icon }]}
                      >
                        {step.description}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={dismiss}
              style={[styles.dismissButton, { backgroundColor: colors.tint }]}
            >
              <ThemedText style={styles.primaryText}>Entendi</ThemedText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
  },
  bannerBody: {
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 16,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    gap: 10,
  },
  secondaryAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 8,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryAction: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 104,
    paddingHorizontal: 16,
  },
  primaryText: {
    color: '#08212B',
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 28,
    borderWidth: 1,
    maxWidth: 420,
    padding: 22,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  stepsList: {
    gap: 10,
    marginBottom: 10,
  },
  stepCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  stepHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  stepBadge: {
    alignItems: 'center',
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepIconWrap: {
    alignItems: 'center',
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  dismissButton: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 44,
  },
});
