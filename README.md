# de-olho-no-bueiro

Aplicativo mobile em Expo/React Native com projeto Android nativo já presente em `android/`.

## Requisitos para build local Android

- Node.js 20.x
- Java 21
- Android SDK em `~/Android/Sdk` ou via `ANDROID_HOME`
- Pacotes do SDK:
  - `platforms;android-36`
  - `build-tools;36.0.0`
  - `platform-tools`
  - `ndk;27.1.12297006`

## Configuração do ambiente

Se o Android SDK estiver no caminho padrão `~/Android/Sdk`, o script do projeto já exporta:

```bash
ANDROID_HOME=$HOME/Android/Sdk
ANDROID_SDK_ROOT=$HOME/Android/Sdk
```

Se o seu SDK estiver em outro local, exporte as variáveis antes de rodar o build.

## Comandos úteis

Instalar dependências:

```bash
npm install
```

Validar o projeto:

```bash
npx tsc --noEmit
npm run lint
npx expo-doctor
```

Gerar APK local:

```bash
./scripts/android-local-build.sh debug
./scripts/android-local-build.sh release
```

Saídas esperadas:

- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## Observações

- O build `release` atual gera um APK de teste assinado com o `debug.keystore`.
- Para distribuição real, substitua a assinatura de release por um keystore próprio.
- Os assets em `assets/images/` são placeholders sincronizados com a configuração do Expo. Troque-os pelos arquivos finais quando a identidade visual estiver pronta.
