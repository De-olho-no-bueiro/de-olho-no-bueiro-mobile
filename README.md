# De Olho no Bueiro Mobile

Aplicativo mobile em Expo + React Native para registrar ocorrências, consultar incidentes próximos e acompanhar reportes de alagamento e bueiros.

## O que este projeto entrega

- Onboarding, login e cadastro
- Mapa com ocorrências e pontos de interesse
- Criação de reportes com localização
- Histórico de reportes do usuário
- Perfil e configurações
- Suporte a Android, iOS e web/PWA
- Recursos opcionais de mapa web e notificações push

## Stack

- Expo 54
- React Native 0.81
- Expo Router
- TypeScript
- NativeWind

## Requisitos

### Para desenvolvimento geral

- Node.js 20+
- npm 10+

### Para Android local

- Java 21
- Android SDK em `~/Android/Sdk` ou configurado via `ANDROID_HOME`
- Pacotes do SDK:
  - `platforms;android-36`
  - `build-tools;36.0.0`
  - `platform-tools`
  - `ndk;27.1.12297006`

## Variáveis de ambiente

Crie um `.env` na raiz do projeto.

Exemplo:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_ENABLE_INCIDENT_MONITORING=false
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=
```

Notas:

- O fallback atual do app é `http://localhost:3000/api`, então configure `EXPO_PUBLIC_API_URL` explicitamente em desenvolvimento.
- No Android Emulator, normalmente a API local deve ser `http://10.0.2.2:3001/api`.
- Em dispositivo físico, use o IP da máquina na rede local, por exemplo `http://192.168.x.x:3001/api`.
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` habilita mapa web e configuração nativa do Google Maps no Android.

## Como rodar localmente

1. Instale dependências:

```bash
npm install
```

2. Configure o `.env`

3. Inicie o projeto:

```bash
npm run start
```

4. Depois escolha a plataforma:

```bash
npm run android
npm run ios
npm run web:dev
```

## Validação local

```bash
npm run lint
npx tsc --noEmit
npx expo-doctor
```

## Build Android local

Use o script auxiliar do projeto:

```bash
./scripts/android-local-build.sh debug
./scripts/android-local-build.sh release
```

Saídas esperadas:

- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## Estrutura resumida

```text
app/
├─ (auth)/
├─ (tabs)/
└─ *.tsx

src/
├─ core/
└─ features/
   ├─ auth/
   ├─ configuracoes/
   └─ reportes/
```

## Scripts úteis

```bash
npm run start
npm run android
npm run ios
npm run web:dev
npm run build:web
npm run lint
```

## Observações importantes

- O build `release` atual gera APK assinado com `debug.keystore`; isso não é suficiente para distribuição real.
- Recursos de mapa web dependem de `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Notificações web exigem `EXPO_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`.
- O backend recomendado para desenvolvimento é o projeto `Backend` deste workspace.

## Contribuição

Leia [CONTRIBUTING.md](./CONTRIBUTING.md) para setup, checklist e padrão de contribuição.
