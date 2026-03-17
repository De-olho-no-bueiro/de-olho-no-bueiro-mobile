import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/core/components/atoms/themed-text';
import { ThemedView } from '@/core/components/atoms/themed-view';
import { IconSymbol } from '@/core/components/atoms/icon-symbol';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { Colors } from '@/core/constants/theme';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const isDark = colorScheme === 'dark';

  const user = {
    name: 'João Cidadão',
    email: 'joao.cidadao@exemplo.com',
    avatar: 'https://i.pravatar.cc/150?u=joao'
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20) + 8, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.mainTitle}>
            Meu Perfil
          </ThemedText>
        </View>

        {/* Profile Info Card */}
        <View style={[
          styles.profileCard, 
          { 
            backgroundColor: colors.surface, 
            borderColor: isDark ? '#333' : '#EAF0F6',
            shadowColor: isDark ? '#000' : '#0A7EA4' 
          }
        ]}>
          <View style={styles.profileHeader}>
            <Image 
              source={{ uri: user.avatar }} 
              style={[styles.avatar, { borderColor: isDark ? '#333' : '#E6F2F7' }]}
              contentFit="cover"
            />
            <View style={styles.profileInfo}>
              <ThemedText style={styles.profileName}>{user.name}</ThemedText>
              <ThemedText style={{ color: colors.icon }}>{user.email}</ThemedText>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: colors.tint }]}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.editButtonText}>Editar Perfil</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Options section */}
        <ThemedText style={[styles.sectionTitle, { color: colors.icon }]}>
          GERENCIAR CONTA
        </ThemedText>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: isDark ? '#333' : '#EAF0F6' }]}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: isDark ? '#333' : '#EAF0F6' }]} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(10, 126, 164, 0.2)' : '#E6F2F7' }]}>
              <IconSymbol name="clock.fill" size={20} color="#0A7EA4" />
            </View>
            <ThemedText style={styles.rowLabel}>Meus Reportes</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: isDark ? '#333' : '#EAF0F6' }]} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(10, 126, 164, 0.2)' : '#E6F2F7' }]}>
              <IconSymbol name="bell.fill" size={20} color="#0A7EA4" />
            </View>
            <ThemedText style={styles.rowLabel}>Notificações</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>

          {/* Configurações do App Link */}
          <TouchableOpacity 
            style={[styles.row, { borderBottomColor: isDark ? '#333' : '#EAF0F6' }]} 
            activeOpacity={0.7}
            onPress={() => router.push('/configuracoes-app' as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#333' : '#F1F5F9' }]}>
              <IconSymbol name="gearshape.fill" size={20} color={isDark ? '#A0AAB5' : '#475569'} />
            </View>
            <ThemedText style={styles.rowLabel}>Configurações do App</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
              <IconSymbol name="arrow.right.square.fill" size={20} color={isDark ? '#F87171' : '#EF4444'} />
            </View>
            <ThemedText style={[styles.rowLabel, { color: isDark ? '#F87171' : '#EF4444' }]}>Sair da conta</ThemedText>
          </TouchableOpacity>
        </View>

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
  header: {
    marginBottom: 24,
  },
  mainTitle: {
    color: '#0A7EA4',
  },

  // Profile Card
  profileCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  editButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  // Sections
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 16,
  },
  section: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
