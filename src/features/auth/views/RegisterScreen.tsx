import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthInput } from '@/features/auth/components/AuthInput';
import { AuthPrimaryButton } from '@/features/auth/components/AuthPrimaryButton';
import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';

export function RegisterScreen() {
  const router = useRouter();
  const vm = useAuthViewModel();

  return (
    <AuthScaffold
      eyebrow="Criar conta"
      title="Junte-se à comunidade"
      subtitle="Crie seu acesso para reportar riscos e ajudar sua região."
      onBack={() => router.replace({ pathname: '/welcome', params: { slide: 1 } } as any)}
      footer={
        <Pressable
          onPress={() => router.push('/login' as any)}
          style={({ pressed }) => ({ opacity: pressed ? 0.84 : 1 })}
        >
          <Text className="text-sm text-slate-500">
            Já possui conta? <Text className="font-semibold text-blue-600">Fazer login</Text>
          </Text>
        </Pressable>
      }
    >
      <View>

        <AuthInput
          icon="user"
          label="Nome completo"
          placeholder="Seu nome"
          autoCapitalize="words"
          textContentType="name"
          returnKeyType="next"
          value={vm.name}
          onChangeText={vm.setName}
        />

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
          placeholder="Crie uma senha segura"
          secureTextEntry
          textContentType="newPassword"
          returnKeyType="done"
          hint="Coloque uma senha fácil."
          value={vm.password}
          onChangeText={vm.setPassword}
        />

        <View className="mt-6">
          <AuthPrimaryButton
            label="Cadastrar"
            icon="arrow-right"
            onPress={vm.handleRegister}
            isLoading={vm.isSubmitting}
          />
        </View>
      </View>
    </AuthScaffold>
  );
}
