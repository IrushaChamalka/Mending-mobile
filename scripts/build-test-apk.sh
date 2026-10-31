#!/usr/bin/env bash
# Builds a standalone release APK for internal testing against the hosted backend (no Metro needed).
# It is signed with the debug keystore, so it installs on any phone but must never be published.
#
#   scripts/build-test-apk.sh                       # http://3.88.233.218:3000
#   EXPO_PUBLIC_API_URL=http://<host>:3000 scripts/build-test-apk.sh
#
# Needs JDK 17 and an Android SDK (ANDROID_HOME, or android/local.properties). Output:
# dist/stitchflow-test-<version>.apk
set -euo pipefail
cd "$(dirname "$0")/.."

# Shell values win over .env, so the local-backend .env stays untouched.
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://3.88.233.218:3000}"
export EXPO_PUBLIC_APP_ENV=preview
export EXPO_PUBLIC_USE_MOCK_API=false
export EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV=false
if [[ "$EXPO_PUBLIC_API_URL" == http://* ]]; then
  export EXPO_PUBLIC_ALLOW_INSECURE_HTTP=true
fi
export NODE_ENV=production
# The SDK location Android Studio and `sdkmanager --sdk_root` use on macOS.
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

# Apply app.config.ts (including the cleartext permission for an http:// API) to android/.
npx expo prebuild --platform android --no-install
# Expo inlines EXPO_PUBLIC_* while bundling; drop cached transforms made with other values.
rm -rf node_modules/.cache/metro "${TMPDIR:-/tmp}"/metro-* 2>/dev/null || true

(cd android && ./gradlew assembleRelease \
  -PreactNativeArchitectures="${ARCHITECTURES:-arm64-v8a,armeabi-v7a}")

version=$(node -p "require('./package.json').version")
mkdir -p dist
cp android/app/build/outputs/apk/release/app-release.apk "dist/stitchflow-test-${version}.apk"
echo "APK: $(pwd)/dist/stitchflow-test-${version}.apk (API ${EXPO_PUBLIC_API_URL})"
