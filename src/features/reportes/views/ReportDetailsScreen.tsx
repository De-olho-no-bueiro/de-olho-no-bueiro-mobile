import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Keyboard, Dimensions, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/core/components/atoms/themed-text';
import { ThemedView } from '@/core/components/atoms/themed-view';
import { IconSymbol } from '@/core/components/atoms/icon-symbol';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { Colors } from '@/core/constants/theme';
import { useReportDetailsViewModel } from '../viewmodels/useReportDetailsViewModel';
import { detailsStyles as styles } from './styles/detailsStyles';

const { width } = Dimensions.get('window');

const LEVEL_CONFIG = {
  baixo: { label: 'Baixo', color: '#34C759', bg: 'rgba(52, 199, 89, 0.15)' },
  leve: { label: 'Médio', color: '#FFB800', bg: 'rgba(255, 184, 0, 0.15)' },
  medio: { label: 'Avançado', color: '#FF8800', bg: 'rgba(255, 136, 0, 0.15)' },
  grave: { label: 'Extremo', color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.15)' },
};

const AVATAR_COLORS = ['#0A7EA4', '#F57C00', '#7C4DFF', '#00BCD4', '#E91E63', '#4CAF50', '#FF6B6B', '#4ECDC4'];

function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function ReportDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const vm = useReportDetailsViewModel();
  
  const [newComment, setNewComment] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 1);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    Keyboard.dismiss();
    await vm.enviarComentario(newComment.trim());
    setNewComment('');
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  if (vm.loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  if (!vm.data) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Feather name="alert-circle" size={48} color={themeColors.icon} style={{ marginBottom: 16 }} />
        <ThemedText style={{ textAlign: 'center', fontSize: 18 }}>Reporte não encontrado.</ThemedText>
        <TouchableOpacity style={{ marginTop: 24 }} onPress={() => router.back()}>
          <ThemedText style={{ color: themeColors.tint }}>Voltar ao mapa</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const { tipo, data, comments } = vm;
  const nivelKey = (data.nivel || 'baixo') as keyof typeof LEVEL_CONFIG;
  const levelConfig = LEVEL_CONFIG[nivelKey] || LEVEL_CONFIG.baixo;
  const hasImages = (data.midiasUri && data.midiasUri.length > 0) || !!data.fotoUri;
  const images = data.midiasUri?.length ? data.midiasUri : data.fotoUri ? [data.fotoUri] : [];
  const imageCount = images.length;
  
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

  const textPrimary = isDark ? '#F5F5F7' : '#1A1A1A';
  const textSecondary = isDark ? '#8E8E93' : '#6B7280';
  const borderColor = isDark ? '#38383A' : '#E5E7EB';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBg = isDark ? '#1C1C1E' : '#F3F4F6';
  const inputTextColor = isDark ? '#F5F5F7' : '#1A1A1A';
  const placeholderColor = isDark ? '#636366' : '#9CA3AF';
  const mediaBg = isDark ? '#000' : '#F3F4F6';
  const wazeBlue = '#33CCFF';

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ThemedView style={styles.safeArea}>
        <View style={[styles.topSpacer, { height: insets.top, backgroundColor: themeColors.background }]} />
        <View style={styles.mainContent}>
          <ScrollView 
            bounces={false} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <View style={[styles.mediaContainer, { backgroundColor: mediaBg }]}>
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              style={styles.mediaScroll}
              onMomentumScrollEnd={(e) => {
                const page = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentPage(page);
              }}
            >
              {hasImages ? (
                images.map((uri: string, index: number) => (
                  <Image 
                    key={index} 
                    source={{ uri }} 
                    style={styles.mediaImage}
                    contentFit="cover"
                  />
                ))
              ) : (
                <View style={[styles.mediaPlaceholder, { backgroundColor: mediaBg }]}>
                  <IconSymbol 
                    name={tipo === 'alagamento' ? 'water' : 'exclamationmark.triangle'} 
                    size={72} 
                    color={isDark ? '#444' : '#9CA3AF'} 
                  />
                </View>
              )}
            </ScrollView>
            
            <View style={[styles.headerOverlay, { paddingTop: insets.top + 12 }]}>
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)' }]} 
                onPress={() => router.back()}
              >
                <IconSymbol name="chevron.left" size={24} color={isDark ? '#FFF' : '#333'} />
              </TouchableOpacity>
              {imageCount > 1 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                  <IconSymbol name="photo.fill" size={14} color="#FFF" style={{ marginRight: 6 }} />
                  <ThemedText style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>
                    {currentPage + 1}/{imageCount}
                  </ThemedText>
                </View>
              )}
            </View>

            {imageCount > 1 && (
              <View style={styles.dotsContainer}>
                {images.map((_: string, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)' },
                      index === currentPage && [styles.dotActive, { backgroundColor: isDark ? '#FFF' : '#333' }]
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={[styles.content, { backgroundColor: themeColors.background }]}>
            <View style={styles.authorRow}>
              <View style={[styles.authorAvatar, { backgroundColor: getAvatarColor(data.autor || 'U') }]}>
                <ThemedText style={styles.authorInitial}>{getAuthorInitial()}</ThemedText>
              </View>
              <View style={styles.authorInfo}>
                <ThemedText style={[styles.authorName, { color: textPrimary }]}>
                  {data.autor || 'Usuário Anônimo'}
                </ThemedText>
                <View style={styles.authorMeta}>
                  <ThemedText style={[styles.metaText, { color: textSecondary }]}>{formatDate(data.dataHora)}</ThemedText>
                  <ThemedText style={[styles.metaDot, { color: textSecondary }]}>·</ThemedText>
                  <IconSymbol name="globe" size={12} color={textSecondary} />
                </View>
              </View>
            </View>

            <View style={styles.titleSection}>
              <View style={styles.typeLabel}>
                <IconSymbol 
                  name={tipo === 'alagamento' ? 'drop.fill' : 'exclamationmark.triangle.fill'} 
                  size={14} 
                  color={tipo === 'alagamento' ? '#1A73E8' : '#F57C00'}
                  style={styles.typeIcon}
                />
                <ThemedText style={[styles.typeText, { color: tipo === 'alagamento' ? '#1A73E8' : '#F57C00' }]}>
                  {tipo === 'alagamento' ? 'Área de Alagamento' : 'Bueiro Danificado'}
                </ThemedText>
              </View>
              <ThemedText style={[styles.title, { color: textPrimary }]}>
                {data.endereco || 'Local sem endereço especificado'}
              </ThemedText>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: levelConfig.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: levelConfig.color }]} />
              <ThemedText style={[styles.statusText, { color: levelConfig.color }]}>
                {levelConfig.label}
              </ThemedText>
            </View>

            {data.descricao && (
              <ThemedText style={[styles.description, { color: textSecondary }]}>
                {data.descricao}
              </ThemedText>
            )}

            <View style={[styles.locationSection, { borderColor }]}>
              <IconSymbol name="location.fill" size={18} color={textSecondary} style={styles.locationIcon} />
              <ThemedText style={[styles.locationText, { color: textSecondary }]}>
                {data.endereco || (data.latitude != null && data.longitude != null
                  ? `Coordenadas: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
                  : 'Coordenadas não disponíveis')}
              </ThemedText>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={styles.actionButton} onPress={handleLike}>
                <View style={[styles.actionIconWrapper, liked && { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                  <IconSymbol 
                    name={liked ? 'heart.fill' : 'heart'} 
                    size={22} 
                    color={liked ? '#FF3B30' : textSecondary} 
                  />
                </View>
                <ThemedText style={[styles.actionCount, { color: liked ? '#FF3B30' : textSecondary }]}>
                  {likeCount}
                </ThemedText>
              </Pressable>

              <Pressable style={styles.actionButton}>
                <View style={styles.actionIconWrapper}>
                  <IconSymbol name="bubble.right" size={20} color={textSecondary} />
                </View>
                <ThemedText style={[styles.actionCount, { color: textSecondary }]}>
                  {comments.length}
                </ThemedText>
              </Pressable>

              <Pressable style={styles.actionButton}>
                <View style={styles.actionIconWrapper}>
                  <IconSymbol name="square.and.arrow.up" size={20} color={textSecondary} />
                </View>
                <ThemedText style={[styles.actionCount, { color: textSecondary }]}>
                  Compartilhar
                </ThemedText>
              </Pressable>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.commentsHeader}>
              <ThemedText style={[styles.commentsTitle, { color: textPrimary }]}>
                Comentários {comments.length > 0 && `(${comments.length})`}
              </ThemedText>
            </View>

            <View style={styles.commentsList}>
              {comments.length === 0 ? (
                <View style={styles.emptyComments}>
                  <ThemedText style={[styles.emptyCommentsText, { color: textSecondary }]}>
                    Nenhum comentário ainda.{'\n'}Seja o primeiro a comentar!
                  </ThemedText>
                </View>
              ) : (
                comments.map((c) => {
                  const authorName = c.author?.name || 'Usuário';
                  const initial = authorName.charAt(0).toUpperCase();
                  return (
                    <View key={c.id} style={styles.commentItem}>
                      <View style={[styles.commentAvatar, { backgroundColor: getAvatarColor(authorName) }]}>
                        <ThemedText style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{initial}</ThemedText>
                      </View>
                      <View style={[styles.commentContent, { backgroundColor: cardBg }]}>
                        <View style={styles.commentHeader}>
                          <ThemedText style={[styles.commentName, { color: textPrimary }]}>{authorName}</ThemedText>
                          <ThemedText style={[styles.commentTime, { color: textSecondary }]}>· {formatDate(c.createdAt)}</ThemedText>
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
        </ScrollView>

        <View style={[styles.commentInputWrapper, { backgroundColor: themeColors.background, borderTopColor: borderColor }]}>
          <TextInput
            style={[styles.commentInput, { backgroundColor: inputBg, color: inputTextColor }]}
            placeholder="Comentar..."
            placeholderTextColor={placeholderColor}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={250}
          />
          <TouchableOpacity 
            style={[
              styles.commentSubmitButton, 
              !newComment.trim() && styles.commentSubmitButtonDisabled
            ]}
            onPress={handleSendComment}
            disabled={!newComment.trim()}
          >
            <IconSymbol name="paperplane.fill" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
