import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/core/components/atoms/themed-text';
import { ThemedView } from '@/core/components/atoms/themed-view';
import { IconSymbol } from '@/core/components/atoms/icon-symbol';
import { Colors } from '@/core/constants/theme';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { ApiReporteRepository } from '@/features/reportes/services/ApiReporteRepository';
import type { Reporte } from '@/features/reportes/models/Reporte';

const reporteRepository = new ApiReporteRepository();

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReportHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Reporte[]>([]);

  useEffect(() => {
    let mounted = true;

    reporteRepository.carregarMeuHistorico()
      .then((data) => {
        if (mounted) {
          setItems(data);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { borderColor: colors.border }]} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <ThemedText style={styles.title}>Histórico de Posts</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
              Ativos, resolvidos e expirados.
            </ThemedText>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerState}>
            <ThemedText style={{ color: colors.icon }}>Você ainda não criou posts.</ThemedText>
          </View>
        ) : (
          items.map((item) => {
            const statusColor = item.isActive ? '#16A34A' : '#6B7280';
            const statusBg = item.isActive ? 'rgba(22,163,74,0.12)' : (isDark ? 'rgba(107,114,128,0.25)' : 'rgba(107,114,128,0.12)');

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/report/[id]' as any,
                    params: {
                      id: item.id,
                      tipo: item.tipo,
                      postId: item.postId || item.id,
                    },
                  })
                }
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: item.tipo === 'bueiro' ? 'rgba(245,124,0,0.14)' : 'rgba(26,115,232,0.12)' }]}>
                    <ThemedText style={[styles.typeBadgeText, { color: item.tipo === 'bueiro' ? '#F57C00' : '#1A73E8' }]}>
                      {item.tipo === 'bueiro' ? 'Bueiro' : 'Alagamento'}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <ThemedText style={[styles.statusText, { color: statusColor }]}>
                      {item.isActive ? 'Ativo' : 'Resolvido/Expirado'}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText numberOfLines={2} style={styles.address}>
                  {item.endereco || 'Endereço não informado'}
                </ThemedText>

                <ThemedText numberOfLines={2} style={[styles.description, { color: colors.icon }]}>
                  {item.descricao || 'Sem descrição.'}
                </ThemedText>

                <View style={styles.metaRow}>
                  <ThemedText style={[styles.metaText, { color: colors.icon }]}>
                    {formatDate(item.dataHora)}
                  </ThemedText>
                  <ThemedText style={[styles.metaText, { color: colors.icon }]}>
                    {item.likeCount ?? 0} curtidas
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerState: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  address: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
