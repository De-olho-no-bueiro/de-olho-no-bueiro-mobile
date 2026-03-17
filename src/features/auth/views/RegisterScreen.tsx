import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/core/constants/theme';
import { wazeAuthStyles as styles } from './styles';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';

export function RegisterScreen() {
  const router = useRouter();
  const colorScheme = 'light';
  const isDark = false;
  const colors = Colors.light;
  const vm = useAuthViewModel();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <Text style={[styles.slogan, isDark && styles.sloganDark, { marginBottom: 32 }]}>
          Crie sua Conta
        </Text>
      </View>

      <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
        <Feather name="user" size={20} color={colors.icon} />
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Seu Nome Completo"
          placeholderTextColor={colors.icon}
          value={vm.name}
          onChangeText={vm.setName}
        />
      </View>

      <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
        <Feather name="mail" size={20} color={colors.icon} />
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Seu E-mail"
          placeholderTextColor={colors.icon}
          keyboardType="email-address"
          autoCapitalize="none"
          value={vm.email}
          onChangeText={vm.setEmail}
        />
      </View>

      <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
        <Feather name="lock" size={20} color={colors.icon} />
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Sua Senha"
          placeholderTextColor={colors.icon}
          secureTextEntry
          value={vm.password}
          onChangeText={vm.setPassword}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.tint, marginTop: 32 }]}
        onPress={vm.handleRegister}
        disabled={vm.isSubmitting}
      >
        {vm.isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Cadastrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.footerText}>
          Já possui conta? <Text style={[styles.linkText, { color: colors.tint }]}>Fazer Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
