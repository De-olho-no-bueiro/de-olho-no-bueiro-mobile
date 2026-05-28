import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';

import { IconSymbol } from '@/core/components/atoms/icon-symbol';
import { ThemedText } from '@/core/components/atoms/themed-text';
import { ThemedView } from '@/core/components/atoms/themed-view';
import { Colors } from '@/core/constants/theme';
import { useAuth } from '@/core/contexts/auth-context';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { navigateBackOrFallback } from '@/core/utils/navigation';
import { changeMyPassword, updateMyProfile } from '@/features/configuracoes/services/profile-api';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePicture || null);
  const [showWebPhotoOptions, setShowWebPhotoOptions] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (value: string) => {
    if (!value || value === 'Usuário') return '?';
    const parts = value.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return value.substring(0, 2).toUpperCase();
  };

  const setPictureFromAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.base64) {
      const mimeType = asset.mimeType || 'image/jpeg';
      setProfilePicture(`data:${mimeType};base64,${asset.base64}`);
      return;
    }

    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    setProfilePicture(`data:${asset.mimeType || 'image/jpeg'};base64,${base64}`);
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão', 'Precisamos do acesso à galeria para escolher sua foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      await setPictureFromAsset(result.assets[0]);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão', 'Precisamos do acesso à câmera para tirar sua foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      await setPictureFromAsset(result.assets[0]);
    }
  };

  const handleLoadFromInternet = async () => {
    const url = imageUrl.trim();
    if (!url) {
      Alert.alert('Erro', 'Informe uma URL de imagem válida.');
      return;
    }

    try {
      const fileUri = `${FileSystem.cacheDirectory}profile-${Date.now()}.img`;
      const download = await FileSystem.downloadAsync(url, fileUri);
      const base64 = await FileSystem.readAsStringAsync(download.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.deleteAsync(download.uri, { idempotent: true });

      const extension = url.split('.').pop()?.toLowerCase();
      const mimeType =
        extension === 'png'
          ? 'image/png'
          : extension === 'webp'
            ? 'image/webp'
            : 'image/jpeg';

      setProfilePicture(`data:${mimeType};base64,${base64}`);
      setShowUrlInput(false);
      setImageUrl('');
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a imagem pela URL informada.');
    }
  };

  const openPhotoOptions = () => {
    if (Platform.OS === 'web') {
      setShowWebPhotoOptions((value) => !value);
      return;
    }

    Alert.alert('Foto de perfil', 'Escolha como deseja alterar sua foto.', [
      { text: 'Câmera', onPress: handleTakePhoto },
      { text: 'Galeria', onPress: handlePickFromGallery },
      {
        text: 'Internet',
        onPress: () => setShowUrlInput((value) => !value),
      },
      ...(profilePicture
        ? [
            {
              text: 'Remover foto',
              style: 'destructive' as const,
              onPress: () => setProfilePicture(null),
            },
          ]
        : []),
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Erro', 'O nome não pode estar vazio.');
      return;
    }

    if (trimmedName.length < 3) {
      Alert.alert('Erro', 'Digite um nome com pelo menos 3 caracteres.');
      return;
    }

    const wantsPasswordChange =
      currentPassword.trim() || newPassword.trim() || confirmPassword.trim();

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert('Erro', 'Preencha todos os campos de senha para alterar sua senha.');
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Erro', 'A confirmação da nova senha não confere.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await updateMyProfile({
        name: trimmedName,
        profilePicture,
        removeProfilePicture: !profilePicture,
      });

      await updateProfile({
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
      });

      if (wantsPasswordChange) {
        await changeMyPassword(currentPassword, newPassword);
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
      navigateBackOrFallback(router, '/(tabs)/configuracoes');
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Falha ao salvar dados.');
    } finally {
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
          <TouchableOpacity
            onPress={() => navigateBackOrFallback(router, '/(tabs)/configuracoes')}
            style={[styles.backButton, { backgroundColor: isDark ? '#1C2730' : '#E8F4F8' }]}
          >
            <IconSymbol name="chevron.left" size={22} color="#0A7EA4" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <ThemedText type="title" style={styles.mainTitle}>
              Editar Perfil
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
              Atualize foto, nome e senha da sua conta.
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? '#2D3942' : '#DCEAF1',
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.avatarWrap}>
              <View
                style={[
                  styles.avatar,
                  {
                    borderColor: isDark ? '#294452' : '#D2ECF4',
                    backgroundColor: '#0A7EA4',
                  },
                ]}
              >
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <ThemedText style={styles.avatarText}>{getInitials(name)}</ThemedText>
                )}
              </View>

              <TouchableOpacity style={styles.pencilButton} activeOpacity={0.85} onPress={openPhotoOptions}>
                <IconSymbol name="pencil" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.identityBlock}>
              <ThemedText style={styles.heroName}>{name.trim() || 'Usuário'}</ThemedText>
              <ThemedText style={[styles.heroEmail, { color: colors.icon }]}>{email}</ThemedText>
            </View>
          </View>

          <View style={[styles.badge, { backgroundColor: isDark ? '#173442' : '#E7F6FB' }]}>
            <IconSymbol name="camera.fill" size={16} color="#0A7EA4" />
            <ThemedText style={styles.badgeText}>Toque no lápis para trocar a foto</ThemedText>
          </View>

          {Platform.OS === 'web' && showWebPhotoOptions && (
            <View
              style={[
                styles.webPhotoOptions,
                {
                  backgroundColor: isDark ? '#102630' : '#F3FAFD',
                  borderColor: isDark ? '#294452' : '#D2ECF4',
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.webPhotoAction, { borderColor: colors.tint }]}
                activeOpacity={0.8}
                onPress={() => {
                  setShowWebPhotoOptions(false);
                  void handleTakePhoto();
                }}
              >
                <IconSymbol name="camera.fill" size={18} color={colors.tint} />
                <ThemedText style={[styles.webPhotoActionText, { color: colors.tint }]}>
                  Tirar foto
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.webPhotoAction, { borderColor: colors.tint }]}
                activeOpacity={0.8}
                onPress={() => {
                  setShowWebPhotoOptions(false);
                  void handlePickFromGallery();
                }}
              >
                <IconSymbol name="photo.on.rectangle" size={18} color={colors.tint} />
                <ThemedText style={[styles.webPhotoActionText, { color: colors.tint }]}>
                  Escolher da galeria
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.webPhotoAction, { borderColor: colors.tint }]}
                activeOpacity={0.8}
                onPress={() => {
                  setShowWebPhotoOptions(false);
                  setShowUrlInput((value) => !value);
                }}
              >
                <IconSymbol name="globe" size={18} color={colors.tint} />
                <ThemedText style={[styles.webPhotoActionText, { color: colors.tint }]}>
                  Usar URL
                </ThemedText>
              </TouchableOpacity>

              {profilePicture ? (
                <TouchableOpacity
                  style={[styles.webPhotoAction, styles.webPhotoActionDanger]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowWebPhotoOptions(false);
                    setProfilePicture(null);
                  }}
                >
                  <IconSymbol name="trash.fill" size={18} color="#B42318" />
                  <ThemedText style={[styles.webPhotoActionText, { color: '#B42318' }]}>
                    Remover foto
                  </ThemedText>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>

        {showUrlInput && (
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? '#2D3942' : '#DCEAF1',
                marginBottom: 20,
              },
            ]}
          >
            <ThemedText style={styles.formTitle}>Imagem pela internet</ThemedText>
            <ThemedText style={[styles.formHint, { color: colors.icon }]}>
              Cole uma URL direta de imagem para usar como foto de perfil.
            </ThemedText>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: isDark ? '#333' : '#EAF0F6',
                  marginTop: 14,
                },
              ]}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://exemplo.com/minha-foto.jpg"
              placeholderTextColor={isDark ? '#666' : '#999'}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.tint }]}
              activeOpacity={0.8}
              onPress={handleLoadFromInternet}
            >
              <ThemedText style={[styles.secondaryButtonText, { color: colors.tint }]}>
                Carregar imagem da internet
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? '#2D3942' : '#DCEAF1',
            },
          ]}
        >
          <View style={styles.formSectionHeader}>
            <ThemedText style={styles.formTitle}>Informações básicas</ThemedText>
            <ThemedText style={[styles.formHint, { color: colors.icon }]}>
              O e-mail permanece fixo nesta versão.
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Nome Completo</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: isDark ? '#333' : '#EAF0F6',
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: João Cidadão"
              placeholderTextColor={isDark ? '#666' : '#999'}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>E-mail</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: isDark ? '#333' : '#EAF0F6',
                  opacity: 0.7,
                },
              ]}
              value={email}
              editable={false}
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>
        </View>

        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? '#2D3942' : '#DCEAF1',
              marginTop: 20,
            },
          ]}
        >
          <View style={styles.formSectionHeader}>
            <ThemedText style={styles.formTitle}>Alterar senha</ThemedText>
            <ThemedText style={[styles.formHint, { color: colors.icon }]}>
              Preencha apenas se quiser definir uma nova senha.
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Senha atual</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: isDark ? '#333' : '#EAF0F6',
                },
              ]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Digite sua senha atual"
              placeholderTextColor={isDark ? '#666' : '#999'}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Nova senha</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: isDark ? '#333' : '#EAF0F6',
                },
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo de 6 caracteres"
              placeholderTextColor={isDark ? '#666' : '#999'}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Confirmar nova senha</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: isDark ? '#333' : '#EAF0F6',
                },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a nova senha"
              placeholderTextColor={isDark ? '#666' : '#999'}
              secureTextEntry
            />
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#17232B' : '#F4FAFC' }]}>
          <IconSymbol name="info.circle.fill" size={18} color="#0A7EA4" />
          <ThemedText style={[styles.infoText, { color: colors.icon }]}>
            A nova foto escolhida já será exibida no perfil e usada como avatar do seu usuário nas próximas respostas da API.
          </ThemedText>
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
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 28,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  mainTitle: {
    color: '#0A7EA4',
    fontSize: 22,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  pencilButton: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0A7EA4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  identityBlock: {
    flex: 1,
    marginLeft: 18,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
  },
  heroEmail: {
    marginTop: 4,
    fontSize: 14,
  },
  badge: {
    marginTop: 18,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A7EA4',
  },
  webPhotoOptions: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  webPhotoAction: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  webPhotoActionDanger: {
    borderColor: '#FDCFC2',
    backgroundColor: '#FFF5F3',
  },
  webPhotoActionText: {
    fontWeight: '700',
    fontSize: 14,
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
  },
  formSectionHeader: {
    marginBottom: 18,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  formHint: {
    marginTop: 4,
    fontSize: 14,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 18,
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
  secondaryButton: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  infoBox: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  saveButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
