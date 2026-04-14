import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/core/components/atoms/themed-text';
import { ThemedView } from '@/core/components/atoms/themed-view';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { Colors } from '@/core/constants/theme';
import { useAuth } from '@/core/contexts/auth-context';
import { IconSymbol } from '@/core/components/atoms/icon-symbol';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name: string) => {
    if (!name || name === 'Usuário') return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome não pode estar vazio.');
      return;
    }
    setIsSubmitting(true);
    try {
      // TODO: Conectar à API real futuramente para salvar o perfil se necessário
      // await saveProfileData({ name, email });
      setTimeout(() => {
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso. (Mock)');
        setIsSubmitting(false);
        router.back();
      }, 1000);
    } catch (err) {
      Alert.alert('Erro', 'Falha ao salvar dados.');
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20) + 8, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color="#0A7EA4" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.mainTitle}>
            Editar Perfil
          </ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { borderColor: isDark ? '#333' : '#E6F2F7', backgroundColor: '#0A7EA4' }]}>
            <ThemedText style={{ color: '#fff', fontSize: 36, fontWeight: 'bold' }}>
              {getInitials(name)}
            </ThemedText>
          </View>
          <ThemedText style={{ color: colors.icon, marginTop: 12 }}>Altere sua foto tocando acima (Em breve)</ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Nome Completo</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: isDark ? '#333' : '#EAF0F6' 
                }
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: João Cidadão"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>E-mail</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: isDark ? '#333' : '#EAF0F6',
                  opacity: 0.7 
                }
              ]}
              value={email}
              editable={false} // Mantém desativado no mock atual
              placeholder="Ex: joao@email.com"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: isSubmitting ? '#A0AAB5' : colors.tint }]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <ThemedText style={styles.saveButtonText}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </ThemedText>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    padding: 4,
  },
  mainTitle: {
    color: '#0A7EA4',
    fontSize: 22,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  saveButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
