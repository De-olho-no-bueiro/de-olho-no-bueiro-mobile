#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-debug}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_ARCHS="${ANDROID_RELEASE_ARCHS:-arm64-v8a}"
GRADLE_MAX_WORKERS="${GRADLE_MAX_WORKERS:-2}"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ -z "${MAPS_API_KEY:-}" && -n "${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:-}" ]]; then
  export MAPS_API_KEY="$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"
fi

if [[ "$MODE" != "debug" && "$MODE" != "release" ]]; then
  echo "Uso: ./scripts/android-local-build.sh [debug|release]" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado no PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm não encontrado no PATH." >&2
  exit 1
fi

if ! command -v java >/dev/null 2>&1; then
  echo "Java não encontrado no PATH." >&2
  exit 1
fi

DEFAULT_ANDROID_SDK="$HOME/Android/Sdk"
export ANDROID_HOME="${ANDROID_HOME:-$DEFAULT_ANDROID_SDK}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

if [[ ! -d "$ANDROID_HOME" ]]; then
  echo "Android SDK não encontrado em $ANDROID_HOME" >&2
  exit 1
fi

export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
export NODE_ENV="${NODE_ENV:-development}"

ANDROID_SDK_ESCAPED="${ANDROID_HOME// /\\ }"
cat > "$ROOT_DIR/android/local.properties" <<EOF
sdk.dir=$ANDROID_SDK_ESCAPED
EOF

for path in \
  "$ANDROID_HOME/platforms/android-36" \
  "$ANDROID_HOME/build-tools/36.0.0"
do
  if [[ ! -d "$path" ]]; then
    echo "Componente Android SDK ausente: $path" >&2
    exit 1
  fi
done

if [[ ! -d "$ANDROID_HOME/ndk/27.1.12297006" ]]; then
  echo "NDK 27.1.12297006 não encontrado em $ANDROID_HOME/ndk/27.1.12297006" >&2
  echo "Instale-o pelo Android Studio ou sdkmanager antes do build." >&2
  exit 1
fi

if [[ -z "${MAPS_API_KEY:-}" ]]; then
  echo "Chave do Google Maps não encontrada." >&2
  echo "Defina MAPS_API_KEY ou EXPO_PUBLIC_GOOGLE_MAPS_API_KEY no ambiente/.env antes do build." >&2
  exit 1
fi

cd "$ROOT_DIR"

echo "Node: $(node -v)"
echo "npm: $(npm -v)"
echo "Java: $(java -version 2>&1 | head -n 1)"
echo "ANDROID_HOME: $ANDROID_HOME"

if [[ ! -d node_modules/nativewind || ! -d node_modules/tailwindcss ]]; then
  echo "Dependências de UI ausentes. Executando npm install..."
  npm install
fi

npx tsc --noEmit
npm run lint

if ! npx --yes expo-doctor; then
  echo "expo-doctor reportou avisos não bloqueantes para o build local. Continuando..." >&2
fi

cd android
if [[ -d app/src/main/java/com/anonymous/deolhonobueiro ]]; then
  echo "Removendo namespace legado em app/src/main/java/com/anonymous..."
  rm -rf app/src/main/java/com/anonymous
fi

if [[ -f app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java ]] \
  && grep -q "com.anonymous.deolhonobueiro" app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java; then
  echo "Limpando cache local do Gradle e autolinking legado..."
  rm -rf .gradle build/generated/autolinking app/build/generated/autolinking app/build/intermediates app/build/tmp
  ./gradlew clean
fi

if [[ "$MODE" == "debug" ]]; then
  ./gradlew assembleDebug
else
  echo "Release local otimizado para estabilidade: --no-daemon, --max-workers=$GRADLE_MAX_WORKERS, ABI=$RELEASE_ARCHS"
  ./gradlew --no-daemon --max-workers="$GRADLE_MAX_WORKERS" assembleRelease -PreactNativeArchitectures="$RELEASE_ARCHS"
fi
