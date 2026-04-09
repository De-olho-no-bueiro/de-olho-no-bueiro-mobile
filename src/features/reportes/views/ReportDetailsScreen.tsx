import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedText } from '@/core/components/atoms/themed-text';
import { ThemedView } from '@/core/components/atoms/themed-view';
import { IconSymbol } from '@/core/components/atoms/icon-symbol';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/core/constants/theme';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { useReportDetailsViewModel } from '../viewmodels/useReportDetailsViewModel';
import { detailsStyles as styles } from './styles/detailsStyles';

function getNivelConfig(nivel: string) {
  switch (nivel) {
    case 'leve': return { title: 'Médio', color: '#FFB800', bg: 'rgba(255, 184, 0, 0.15)' };
    case 'medio': return { title: 'Avançado', color: '#FF8800', bg: 'rgba(255, 136, 0, 0.15)' };
    case 'grave': return { title: 'Extremo', color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.15)' };
    case 'baixo': return { title: 'Baixo', color: '#34C759', bg: 'rgba(52, 199, 89, 0.15)' };
    default: return { title: 'Reporte', color: '#0a7ea4', bg: 'rgba(10, 126, 164, 0.15)' };
  }
}

export function ReportDetailsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const vm = useReportDetailsViewModel();
  const [newComment, setNewComment] = useState('');

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    Keyboard.dismiss();
    await vm.enviarComentario(newComment.trim());
    setNewComment('');
  };

  if (vm.loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!vm.data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Feather name="alert-circle" size={48} color={colors.icon} style={{ marginBottom: 16 }} />
        <ThemedText style={{ textAlign: 'center', fontSize: 18 }}>Reporte não encontrado.</ThemedText>
        <TouchableOpacity style={{ marginTop: 24 }} onPress={() => router.back()}>
          <ThemedText type="link">Voltar ao mapa</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const { tipo, data, comments } = vm;
  const nivelConfig = getNivelConfig(data.nivel || 'baixo');
  
  // Handling arrays of media or single photoUri
  const hasImages = (data.midiasUri && data.midiasUri.length > 0) || !!data.fotoUri;
  const coverImage = data.midiasUri?.[0] || data.fotoUri;
  const dateStr = new Date(data.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedView style={styles.container}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {hasImages ? (
            <View style={styles.carouselContainer}>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carousel}>
                {(data.midiasUri || [data.fotoUri]).map((uri: string, index: number) => (
                  <View key={index} style={styles.carouselImageWrapper}>
                    <Image source={{ uri }} style={styles.carouselImage} contentFit="cover" />
                  </View>
                ))}
              </ScrollView>
              {data.midiasUri && data.midiasUri.length > 1 && (
                <View style={styles.imageHint}>
                  <ThemedText style={styles.imageHintText}>
                    Deslize para ver todas ({data.midiasUri.length})
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.headerImage, { backgroundColor: isDark ? '#333' : '#e1e1e1', alignItems: 'center', justifyContent: 'center' }]}>
              <IconSymbol name="photo.fill" size={64} color={colors.icon} />
            </View>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <View style={styles.backButtonPill}>
              <IconSymbol name="chevron.left" size={20} color="#333" />
              <ThemedText style={styles.backButtonText}>Voltar</ThemedText>
            </View>
          </TouchableOpacity>

          <View style={[styles.contentWrapper, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
            
            {/* Card Principal de Resumo */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.titleRow}>
                <View style={styles.titleIconWrapper}>
                  <IconSymbol name={tipo === 'alagamento' ? 'water' : 'warning'} size={24} color={tipo === 'alagamento' ? '#1A73E8' : '#F57C00'} />
                </View>
                <ThemedText style={styles.title}>
                  {tipo === 'alagamento' ? 'Área de Alagamento' : 'Bueiro Danificado'}
                </ThemedText>
              </View>
              
              {(tipo === 'alagamento' || data.nivel) && (
                <View style={[styles.statusBadge, { backgroundColor: nivelConfig.bg, borderColor: nivelConfig.color }]}>
                  <ThemedText style={[styles.statusText, { color: nivelConfig.color }]}>
                    {tipo === 'alagamento' ? 'Gravidade:' : 'Status:'} {nivelConfig.title}
                  </ThemedText>
                </View>
              )}

              <View style={styles.infoRow}>
                <IconSymbol name="clock.fill" size={18} color={colors.icon} />
                <ThemedText style={[styles.infoText, { color: colors.icon }]}>Registrado em {dateStr}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <IconSymbol name="location.fill" size={18} color={colors.icon} />
                <ThemedText style={[styles.infoText, { color: colors.text }]} numberOfLines={3}>
                  {data.endereco || 'Localização marcada no mapa'}
                </ThemedText>
              </View>
            </View>

            {/* Card da Descrição */}
            {data.descricao ? (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <ThemedText style={styles.sectionTitle}>Descrição do reporte</ThemedText>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <ThemedText style={[styles.description, { color: colors.text }]}>{data.descricao}</ThemedText>
              </View>
            ) : null}

            {/* Card de Comentários */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <ThemedText style={styles.sectionTitle}>Comentários da Comunidade ({comments.length})</ThemedText>
              <View style={[styles.divider, { backgroundColor: colors.border, marginBottom: 16 }]} />
              
              <View style={styles.commentsContainer}>
                {comments.length === 0 ? (
                  <ThemedText style={{ color: colors.icon, textAlign: 'center', marginVertical: 12 }}>
                    Nenhum comentário por enquanto. Seja o primeiro!
                  </ThemedText>
                ) : (
                  comments.map((c) => {
                    const authorName = c.author?.name || 'Usuário';
                    const initial = authorName.charAt(0).toUpperCase();
                    const timeStr = new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                    return (
                      <View key={c.id} style={styles.commentItem}>
                        <View style={[styles.avatar, { backgroundColor: '#1A73E8' }]}>
                          <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>{initial}</ThemedText>
                        </View>
                        <View style={[styles.commentBubble, { backgroundColor: isDark ? '#333' : '#F8FAFC' }]}>
                          <View style={styles.commentHeader}>
                            <ThemedText style={styles.commentName}>{authorName}</ThemedText>
                            <ThemedText style={[styles.commentTime, { color: colors.icon }]}>{timeStr}</ThemedText>
                          </View>
                          <ThemedText style={[styles.commentText, { color: colors.text }]}>{c.content}</ThemedText>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>

          </View>
        </ScrollView>

        {/* Componente Fixo de Adicionar Comentário */}
        <View style={[styles.commentInputWrapper, { backgroundColor: isDark ? '#121212' : '#FFFFFF', borderTopColor: isDark ? '#333' : '#EAF0F6' }]}>
          <TextInput
            style={[styles.commentInput, { color: isDark ? '#FFF' : '#0F172A', backgroundColor: isDark ? '#333' : '#F8FAFC', borderColor: isDark ? '#444' : '#EAF0F6' }]}
            placeholder="Adicione um comentário..."
            placeholderTextColor={colors.icon}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={250}
          />
          <TouchableOpacity 
            style={[styles.commentSubmitButton, !newComment.trim() && styles.commentSubmitButtonDisabled]}
            onPress={handleSendComment}
            disabled={!newComment.trim()}
          >
            <IconSymbol name="paperplane.fill" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
