import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthInput } from '@/features/auth/components/AuthInput';
import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';

export function LoginScreen() {
  const router = useRouter();
  const vm = useAuthViewModel();

  return (
    <AuthScaffold
      eyebrow="Acesso rápido"
      title="Bem-vindo de volta"
      subtitle="Entre com suas credenciais para continuar reportando riscos e colaborando."
      onBack={() => router.replace({ pathname: '/welcome', params: { slide: 1 } } as any)}
      footer={
        <Pressable
          onPress={() => router.push('/register' as any)}
          style={({ pressed }) => ({ opacity: pressed ? 0.84 : 1 })}
        >
          <Text className="text-sm text-slate-500">
            Ainda não tem conta? <Text className="font-semibold text-blue-600">Cadastre-se</Text>
          </Text>
        </Pressable>
      }
    >
      <View>

        <AuthInput
          icon="mail"
          label="E-mail"
          placeholder="voce@empresa.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          returnKeyType="next"
          value={vm.email}
          onChangeText={vm.setEmail}
        />

        <AuthInput
          icon="lock"
          label="Senha"
          placeholder="Digite sua senha"
          secureTextEntry
          textContentType="password"
          returnKeyType="go"
          hint="Coloque uma senha fácil."
          value={vm.password}
          onChangeText={vm.setPassword}
        />

        <View className="mt-6">
          <AuthPrimaryButton
            label="Entrar"
            icon="arrow-right"
            onPress={vm.handleLogin}
            isLoading={vm.isSubmitting}
          />
        </View>
      </View>
    </AuthScaffold>
  );
}
