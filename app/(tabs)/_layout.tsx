import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/core/components/molecules/haptic-tab';
import { IconSymbol } from '@/core/components/atoms/icon-symbol';
import { Colors } from '@/core/constants/theme';
import { useColorScheme } from '@/core/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pesquisa"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="report/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="report-history"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
