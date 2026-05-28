import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { AuthBackdrop } from '@/features/auth/components/AuthBackdrop';

type AuthScaffoldProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onBack: () => void;
};

export function AuthScaffold({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  onBack,
}: AuthScaffoldProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#dbe9ff' }}>
      <StatusBar style="dark" />

      <View className="flex-1 bg-[#dbe9ff]">
        <AuthBackdrop />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-5 pb-8 pt-3">
              <View className="mx-auto w-full max-w-[440px] flex-1">
                <View
                  className="rounded-[38px] border border-white/70 bg-white/80 p-2"
                  style={{
                    shadowColor: '#173B83',
                    shadowOpacity: 0.14,
                    shadowRadius: 24,
                    shadowOffset: { width: 0, height: 18 },
                    elevation: 6,
                  }}
                >
                  <View className="rounded-[32px] bg-white px-4 pb-5 pt-4">
                    <View className="mb-8 flex-row items-center justify-between">
                      <Pressable
                        onPress={onBack}
                        className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white"
                        style={({ pressed }) => ({ opacity: pressed ? 0.84 : 1 })}
                      >
                        <Feather name="arrow-left" size={18} color="#0F172A" />
                      </Pressable>

                      <View className="flex-row items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-2">
                        <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-white overflow-hidden">
                          <Image
                            source={require('../../../../assets/images/Novo-logo-bueiro.png')}
                            resizeMode="cover"
                            className="h-6 w-6 rounded-full"
                          />
                        </View>
                        <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-blue-600">
                          De Olho no Bueiro
                        </Text>
                      </View>
                    </View>

                    <View className="mt-2">
                      <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-blue-600">
                        {eyebrow}
                      </Text>
                      <Text className="mt-2 text-[26px] font-bold leading-[30px] tracking-tight text-slate-950">
                        {title}
                      </Text>
                      <Text className="mt-3 text-sm leading-6 text-slate-500">{subtitle}</Text>
                    </View>

                    <View className="mt-8">{children}</View>

                    <View className="mt-6 items-center">{footer}</View>

                    <View className="mt-6 items-center">
                      <View className="h-1.5 w-16 rounded-full bg-slate-900/10" />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
