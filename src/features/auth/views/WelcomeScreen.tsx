import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { wazeAuthStyles as styles } from './styles';

export function WelcomeScreen() {
  const router = useRouter();
  const isDark = false;
  // Fallback to a hardcoded minimal palette if Colors isn't available
  const colors = {
    background: '#E6F4FE',
    tint: '#0a7ea4',
    border: '#c0c0c0',
    text: '#11181C',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <Feather name="map" size={80} color={colors.tint} />
        <Text style={[styles.slogan, isDark && styles.sloganDark]}>
          De Olho No Bueiro
        </Text>
        <Text style={styles.subSlogan}>
          Ajude a prevenir enchentes na sua cidade de forma rápida e comunitária.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.tint }]}
        onPress={() => router.push('/register' as any)}
      >
        <Text style={styles.buttonText}>Começar a ajudar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.border }]}
        onPress={() => router.push('/login' as any)}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
          Já tenho uma conta
        </Text>
      </TouchableOpacity>
    </View>
  );
}
