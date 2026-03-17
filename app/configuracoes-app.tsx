import { ConfiguracoesScreen } from '@/features/configuracoes/views/ConfiguracoesScreen';
import { Stack } from 'expo-router';

export default function ConfiguracoesApp() {
  return (
    <>
      <Stack.Screen options={{ title: 'Configurações', presentation: 'card', headerShown: true, headerBackTitle: 'Voltar' }} />
      <ConfiguracoesScreen />
    </>
  );
}
