import React, { useState } from 'react';
import {
  Alert,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  Share,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/core/components/atoms/themed-text';
import { ThemedView } from '@/core/components/atoms/themed-view';
import { IconSymbol } from '@/core/components/atoms/icon-symbol';
import { Feather } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { Colors } from '@/core/constants/theme';
import { useReportDetailsViewModel } from '../viewmodels/useReportDetailsViewModel';
import { detailsStyles as styles } from './styles/detailsStyles';
import { useAuth } from '@/core/contexts/auth-context';
import { navigateBackOrFallback } from '@/core/utils/navigation';
import type { Comment } from '@/features/reportes/services/ApiCommentRepository';
import { getMediaUrl } from '@/core/utils/api-config';

const POST_CARD_HORIZONTAL_MARGIN = 12;

const LEVEL_CONFIG = {
  baixo: { label: 'Baixo', color: '#34C759', bg: 'rgba(52, 199, 89, 0.15)' },
  medio: { label: 'Médio', color: '#FFB800', bg: 'rgba(255, 184, 0, 0.15)' },
  avancado: { label: 'Avançado', color: '#FF8800', bg: 'rgba(255, 136, 0, 0.15)' },
  extremo: { label: 'Extremo', color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.15)' },
} as const;

const AVATAR_COLORS = ['#0A7EA4', '#F57C00', '#7C4DFF', '#00BCD4', '#E91E63', '#4CAF50', '#FF6B6B', '#4ECDC4'];

function getAvatarColor(name: string): string {
  const safeName = name.trim() || 'U';
  const index = safeName.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function ReportDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const vm = useReportDetailsViewModel();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [newComment, setNewComment] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verificationChoice, setVerificationChoice] = useState<boolean | null>(null);
  const canSubmitComment = Boolean(newComment.trim()) && !vm.commentSubmitting;
  const postCardWidth = Math.max(0, width - POST_CARD_HORIZONTAL_MARGIN * 2);
  const mediaHeight = Math.round(postCardWidth * 0.75);

  const handleSendComment = async () => {
    if (!newComment.trim() || vm.commentSubmitting) return;
    Keyboard.dismiss();
    if (editingComment) {
      const updated = await vm.editarComentario(editingComment.id, newComment.trim());
      if (updated) {
        setEditingComment(null);
        setNewComment('');
      }
      return;
    }
    const created = await vm.enviarComentario(newComment.trim());
    if (created) {
      setNewComment('');
    }
  };

  const handleLike = async () => {
    await vm.toggleLike();
  };

  if (vm.loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }, styles.centeredState]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  if (!vm.data) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }, styles.centeredState, styles.emptyState]}>
        <Feather name="alert-circle" size={48} color={themeColors.icon} style={styles.emptyStateIcon} />
        <ThemedText style={styles.emptyStateTitle}>Reporte não encontrado.</ThemedText>
        <TouchableOpacity
          style={styles.emptyStateBackButton}
          onPress={() => navigateBackOrFallback(router)}
        >
          <ThemedText style={{ color: themeColors.tint }}>Voltar ao mapa</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const { tipo, data, comments } = vm;
  const nivelKey = (data.nivel || 'baixo') as keyof typeof LEVEL_CONFIG;
  const levelConfig = LEVEL_CONFIG[nivelKey] || LEVEL_CONFIG.baixo;
  const images = [data.fotoUri, ...(Array.isArray(data.midiasUri) ? data.midiasUri : [])]
    .filter((uri): uri is string => typeof uri === 'string' && uri.trim().length > 0)
    .filter((uri, index, arr) => arr.indexOf(uri) === index)
    .map(uri => getMediaUrl(uri));
  const hasImages = images.length > 0;
  const imageCount = images.length;
  const liked = Boolean(data.likedByMe);
  const likeCount = data.likeCount ?? 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getAuthorInitial = () => {
    const name = data.autor || 'Usuário';
    return name.charAt(0).toUpperCase();
  };

  const handleShare = async () => {
    const message = [data.endereco, data.descricao].filter(Boolean).join('\n');
    try {
      await Share.share({
        message: message || 'Confira este reporte no De Olho no Bueiro.',
      });
    } catch {}
  };

  const textPrimary = isDark ? '#F5F5F7' : '#111827';
  const textSecondary = isDark ? '#A1A1AA' : '#6B7280';
  const borderColor = isDark ? '#2F2F33' : '#E5E7EB';
  const cardBg = isDark ? '#17171A' : '#FFFFFF';
  const inputBg = isDark ? '#1C1C1E' : '#F3F4F6';
  const inputTextColor = isDark ? '#F5F5F7' : '#1A1A1A';
  const placeholderColor = isDark ? '#636366' : '#9CA3AF';
  const mediaBg = isDark ? '#101114' : '#EEF2F7';
  const authorName = data.autor || 'Cidadão';
  const rawAuthorPhoto =
    data.autorFotoUrl ||
    data.author?.profilePicture ||
    data.profilePicture ||
    null;
  const authorPhoto = rawAuthorPhoto ? getMediaUrl(rawAuthorPhoto) : null;
  const typeColor = tipo === 'alagamento' ? '#1A73E8' : '#F57C00';
  const typeBg = tipo === 'alagamento' ? 'rgba(26, 115, 232, 0.12)' : 'rgba(245, 124, 0, 0.14)';
  const typeLabel = tipo === 'alagamento' ? 'Alagamento' : 'Bueiro Danificado';
  const addressLabel =
    data.endereco ||
    (data.latitude != null && data.longitude != null
      ? `Coordenadas: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
      : 'Localização não disponível');
  const showVerificationPrompt = Boolean(data.postId || data.id);

  const handleCommentOptions = (comment: Comment) => {
    Alert.alert('Comentário', 'Escolha uma ação.', [
      {
        text: 'Editar',
        onPress: () => {
          setEditingComment(comment);
          setNewComment(comment.content);
        },
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Excluir comentário', 'Essa ação não pode ser desfeita.', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Excluir',
              style: 'destructive',
              onPress: async () => {
                await vm.excluirComentario(comment.id);
                if (editingComment?.id === comment.id) {
                  setEditingComment(null);
                  setNewComment('');
                }
              },
            },
          ]);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleOpenVerify = () => {
    if (!vm.verificationTargetId) {
      Alert.alert(
        'Verificação indisponível',
        'Esse reporte ainda não foi sincronizado com o servidor.',
      );
      return;
    }

    setVerificationChoice(null);
    setVerifyModalVisible(true);
  };

  const handleSubmitVerify = async () => {
    if (verificationChoice === null) {
      Alert.alert('Selecione uma opção', 'Informe se o incidente ainda está acontecendo.');
      return;
    }

    const success = await vm.verificarIncidente(verificationChoice);
    if (!success) {
      Alert.alert('Erro', 'Não foi possível registrar sua verificação agora.');
      return;
    }

    setVerifyModalVisible(false);
    setVerificationChoice(null);
    Alert.alert(
      'Verificação enviada',
      verificationChoice ? 'Marcamos o incidente como ativo.' : 'Marcamos o incidente como resolvido.',
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ThemedView style={styles.safeArea}>
        <TouchableOpacity
          style={[
            styles.floatingBackButton,
            {
              top: insets.top + 12,
              backgroundColor: isDark ? 'rgba(20,20,24,0.82)' : 'rgba(255,255,255,0.92)',
              borderColor,
            },
          ]}
          onPress={() => navigateBackOrFallback(router)}
        >
          <IconSymbol name="chevron.left" size={22} color={textPrimary} />
        </TouchableOpacity>

        <View style={styles.mainContent}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.postCard, { backgroundColor: cardBg, borderColor, marginTop: insets.top + 64 }]}>
              <View style={styles.headerSection}>
                <View style={styles.headerMainRow}>
                  <View style={[styles.authorAvatar, { backgroundColor: getAvatarColor(authorName) }]}>
                    {authorPhoto ? (
                      <Image source={{ uri: authorPhoto }} style={styles.authorAvatarImage} contentFit="cover" />
                    ) : (
                      <ThemedText style={styles.authorInitial}>{getAuthorInitial()}</ThemedText>
                    )}
                  </View>

                  <View style={styles.headerTextBlock}>
                    <View style={styles.headerTitleRow}>
                      <ThemedText numberOfLines={1} style={[styles.authorName, { color: textPrimary }]}>
                        {authorName}
                      </ThemedText>
                      <View style={[styles.typeBadge, { backgroundColor: typeBg }]}>
                        <IconSymbol
                          name={tipo === 'alagamento' ? 'drop.fill' : 'exclamationmark.triangle.fill'}
                          size={12}
                          color={typeColor}
                        />
                        <ThemedText style={[styles.typeBadgeText, { color: typeColor }]}>
                          {typeLabel}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.headerMetaRow}>
                      <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                        {formatDate(data.dataHora)}
                      </ThemedText>
                      <ThemedText style={[styles.metaDot, { color: textSecondary }]}>·</ThemedText>
                      <IconSymbol name="location.fill" size={12} color={textSecondary} />
                      <ThemedText numberOfLines={1} style={[styles.metaLocation, { color: textSecondary }]}>
                        {data.endereco ? 'Local confirmado' : 'Sem endereço'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.mediaContainer, { backgroundColor: mediaBg, height: mediaHeight }]}>
                {hasImages ? (
                  <>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      scrollEnabled={imageCount > 1}
                      style={styles.mediaScroll}
                      keyboardShouldPersistTaps="handled"
                      onMomentumScrollEnd={(e) => {
                        const pageWidth = e.nativeEvent.layoutMeasurement.width || 1;
                        const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
                        setCurrentPage(page);
                      }}
                    >
                      {images.map((uri: string, index: number) => (
                        <Image
                          key={`${uri}-${index}`}
                          source={{ uri }}
                          style={[styles.mediaImage, { height: mediaHeight, width: postCardWidth }]}
                          contentFit="cover"
                        />
                      ))}
                    </ScrollView>

                    {imageCount > 1 && (
                      <>
                        <View style={styles.mediaCounter}>
                          <IconSymbol name="photo.fill" size={14} color="#FFF" style={styles.mediaCounterIcon} />
                          <ThemedText style={styles.mediaCounterText}>
                            {currentPage + 1}/{imageCount}
                          </ThemedText>
                        </View>

                        <View style={styles.dotsContainer}>
                          {images.map((_: string, index: number) => (
                            <View
                              key={index}
                              style={[
                                styles.dot,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(17,24,39,0.22)' },
                                index === currentPage && [styles.dotActive, { backgroundColor: '#FFFFFF' }],
                              ]}
                            />
                          ))}
                        </View>
                      </>
                    )}
                  </>
                ) : (
                  <View style={[styles.mediaPlaceholder, { backgroundColor: mediaBg, height: mediaHeight }]}>
                    <MaterialIcons name="landscape" size={92} color={isDark ? '#4B5563' : '#9CA3AF'} />
                  </View>
                )}
              </View>

              <View style={styles.actionsRow}>
                <View style={styles.actionsPrimaryGroup}>
                  <Pressable style={styles.actionButton} onPress={handleLike} disabled={vm.liking}>
                    <IconSymbol
                      name={liked ? 'heart.fill' : 'heart'}
                      size={28}
                      color={liked ? '#FF3B30' : textPrimary}
                    />
                    <ThemedText style={[styles.actionLabel, { color: liked ? '#FF3B30' : textPrimary }]}>
                      {likeCount}
                    </ThemedText>
                  </Pressable>

                  <Pressable style={styles.actionButton}>
                    <IconSymbol name="bubble.right" size={24} color={textPrimary} />
                    <ThemedText style={[styles.actionLabel, { color: textPrimary }]}>
                      {comments.length}
                    </ThemedText>
                  </Pressable>

                  {showVerificationPrompt ? (
                    <Pressable style={styles.actionButton} onPress={handleOpenVerify} disabled={vm.verifying}>
                      {vm.verifying ? (
                        <ActivityIndicator size="small" color={textPrimary} />
                      ) : (
                        <MaterialCommunityIcons name="shield-alert" size={22} color={textPrimary} />
                      )}
                      <ThemedText style={[styles.actionLabel, { color: textPrimary }]}>
                        Verificar
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>

                <Pressable style={styles.shareActionButton} onPress={handleShare}>
                  <IconSymbol name="square.and.arrow.up" size={24} color={textPrimary} />
                </Pressable>
              </View>

              <View style={styles.bodySection}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, { backgroundColor: levelConfig.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: levelConfig.color }]} />
                    <ThemedText style={[styles.statusText, { color: levelConfig.color }]}>
                      {levelConfig.label}
                    </ThemedText>
                  </View>
                </View>

                {data.descricao ? (
                  <ThemedText style={[styles.description, { color: textPrimary }]}>
                    {data.descricao}
                  </ThemedText>
                ) : (
                  <ThemedText style={[styles.descriptionFallback, { color: textSecondary }]}>
                    Sem descrição adicionada para este reporte.
                  </ThemedText>
                )}

                <View style={[styles.locationSection, { borderColor }]}>
                  <IconSymbol name="location.fill" size={18} color={textSecondary} style={styles.locationIcon} />
                  <ThemedText style={[styles.locationText, { color: textSecondary }]}>
                    {addressLabel}
                  </ThemedText>
                </View>

                <View style={[styles.divider, { backgroundColor: borderColor }]} />

                <View style={styles.commentsHeader}>
                  <ThemedText style={[styles.commentsTitle, { color: textPrimary }]}>
                    Comentários {comments.length > 0 ? `(${comments.length})` : ''}
                  </ThemedText>
                </View>

                <View style={styles.commentsList}>
                  {comments.length === 0 ? (
                    <View style={styles.emptyComments}>
                      <Feather name="message-circle" size={28} color={textSecondary} style={styles.emptyCommentsIcon} />
                      <ThemedText style={[styles.emptyCommentsText, { color: textSecondary }]}>
                        Nenhum comentário ainda.{'\n'}Seja primeiro a comentar.
                      </ThemedText>
                    </View>
                  ) : (
                    comments.map((c) => {
                      const commentAuthor = c.author?.name || 'Usuário';
                      const initial = commentAuthor.charAt(0).toUpperCase();
                      const commentAvatarRaw = c.author?.profilePicture || null;
                      const commentAvatar = commentAvatarRaw ? getMediaUrl(commentAvatarRaw) : null;
                      const isOwnComment = String(c.authorId) === String(user?.id);

                      return (
                        <View key={c.id} style={styles.commentItem}>
                          <View style={[styles.commentAvatar, { backgroundColor: getAvatarColor(commentAuthor) }]}>
                            {commentAvatar ? (
                              <Image source={{ uri: commentAvatar }} style={styles.commentAvatarImage} contentFit="cover" />
                            ) : (
                              <ThemedText style={styles.commentAvatarInitial}>{initial}</ThemedText>
                            )}
                          </View>

                          <View style={[styles.commentContent, { backgroundColor: isDark ? '#111214' : '#F9FAFB' }]}>
                            <View style={styles.commentHeader}>
                              <View style={styles.commentHeaderMeta}>
                                <ThemedText numberOfLines={1} style={[styles.commentName, { color: textPrimary }]}>
                                  {commentAuthor}
                                </ThemedText>
                                <ThemedText style={[styles.commentTime, { color: textSecondary }]}>
                                  {formatDate(c.createdAt)}
                                </ThemedText>
                              </View>
                              {isOwnComment ? (
                                <TouchableOpacity style={styles.commentMenuButton} onPress={() => handleCommentOptions(c)}>
                                  <Feather name="more-horizontal" size={18} color={textSecondary} />
                                </TouchableOpacity>
                              ) : null}
                            </View>
                            <ThemedText style={[styles.commentText, { color: textSecondary }]}>
                              {c.content}
                            </ThemedText>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.commentInputWrapper, { backgroundColor: themeColors.background, borderTopColor: borderColor }]}>
            {editingComment ? (
              <View style={styles.commentEditBanner}>
                <ThemedText style={[styles.commentEditText, { color: textPrimary }]}>
                  Editando comentário
                </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    setEditingComment(null);
                    setNewComment('');
                  }}
                >
                  <ThemedText style={[styles.commentEditCancel, { color: themeColors.tint }]}>
                    Cancelar
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.commentComposerRow}>
              <TextInput
                style={[styles.commentInput, { backgroundColor: inputBg, color: inputTextColor }]}
                placeholder={editingComment ? 'Edite seu comentário...' : 'Comentar...'}
                placeholderTextColor={placeholderColor}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={250}
                editable={!vm.commentSubmitting}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.commentSubmitButton,
                  !canSubmitComment && styles.commentSubmitButtonDisabled,
                ]}
                onPress={handleSendComment}
                disabled={!canSubmitComment}
              >
                {vm.commentSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <IconSymbol name={editingComment ? 'checkmark' : 'paperplane.fill'} size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ThemedView>

      <Modal
        visible={verifyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!vm.verifying) {
            setVerifyModalVisible(false);
            setVerificationChoice(null);
          }
        }}
      >
        <View style={styles.verifyOverlay}>
          <View
            style={[
              styles.verifyCard,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <ThemedText style={[styles.verifyTitle, { color: textPrimary }]}>
              Verificar incidente
            </ThemedText>
            <ThemedText style={[styles.verifyDescription, { color: textSecondary }]}>
              Esse problema ainda está acontecendo nesse local?
            </ThemedText>

            <Pressable
              style={[
                styles.verifyOption,
                {
                  backgroundColor:
                    verificationChoice === true
                      ? 'rgba(52, 199, 89, 0.14)'
                      : inputBg,
                  borderColor:
                    verificationChoice === true ? '#34C759' : borderColor,
                },
              ]}
              onPress={() => setVerificationChoice(true)}
            >
              <View style={[styles.verifyOptionIcon, { backgroundColor: 'rgba(52, 199, 89, 0.16)' }]}>
                <Feather name="check-circle" size={18} color="#34C759" />
              </View>
              <View style={styles.verifyOptionTextBlock}>
                <ThemedText style={[styles.verifyOptionTitle, { color: textPrimary }]}>
                  Sim, ainda está acontecendo
                </ThemedText>
                <ThemedText style={[styles.verifyOptionText, { color: textSecondary }]}>
                  Mantém o alerta ativo no mapa.
                </ThemedText>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.verifyOption,
                {
                  backgroundColor:
                    verificationChoice === false
                      ? 'rgba(255, 59, 48, 0.12)'
                      : inputBg,
                  borderColor:
                    verificationChoice === false ? '#FF3B30' : borderColor,
                },
              ]}
              onPress={() => setVerificationChoice(false)}
            >
              <View style={[styles.verifyOptionIcon, { backgroundColor: 'rgba(255, 59, 48, 0.12)' }]}>
                <Feather name="x-circle" size={18} color="#FF3B30" />
              </View>
              <View style={styles.verifyOptionTextBlock}>
                <ThemedText style={[styles.verifyOptionTitle, { color: textPrimary }]}>
                  Não, foi resolvido
                </ThemedText>
                <ThemedText style={[styles.verifyOptionText, { color: textSecondary }]}>
                  Ajuda a retirar o alerta quando o local já estiver normalizado.
                </ThemedText>
              </View>
            </Pressable>

            <View style={styles.verifyActionsRow}>
              <TouchableOpacity
                style={[styles.verifySecondaryButton, { borderColor }]}
                onPress={() => {
                  setVerifyModalVisible(false);
                  setVerificationChoice(null);
                }}
                disabled={vm.verifying}
              >
                <ThemedText style={[styles.verifySecondaryButtonText, { color: textPrimary }]}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.verifyPrimaryButton,
                  (verificationChoice === null || vm.verifying) && styles.verifyPrimaryButtonDisabled,
                ]}
                onPress={handleSubmitVerify}
                disabled={verificationChoice === null || vm.verifying}
              >
                {vm.verifying ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <ThemedText style={styles.verifyPrimaryButtonText}>
                    Enviar
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
