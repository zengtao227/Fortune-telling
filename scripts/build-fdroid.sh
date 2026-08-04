#!/usr/bin/env bash
set -euo pipefail

export CI=1
export EXPO_NO_TELEMETRY=1
export npm_config_audit=false
export npm_config_fund=false

required_node_major=22
actual_node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [[ "$actual_node_major" != "$required_node_major" ]]; then
  echo "Expected Node.js 22.x, found $(node --version)" >&2
  exit 1
fi

rm -rf node_modules android
npm install --ignore-scripts=false
npx expo-doctor
npm run lint
npm test
npx expo prebuild --clean --platform android --no-install

pushd android >/dev/null
./gradlew --no-daemon --stacktrace assembleRelease
popd >/dev/null

apk="android/app/build/outputs/apk/release/app-release.apk"
if [[ ! -f "$apk" ]]; then
  echo "Release APK was not produced" >&2
  exit 1
fi

if command -v aapt2 >/dev/null 2>&1; then
  if aapt2 dump permissions "$apk" | grep -q 'android.permission.INTERNET'; then
    echo "F-Droid build unexpectedly contains INTERNET permission" >&2
    exit 1
  fi
else
  echo "aapt2 not found; permission verification skipped" >&2
fi

sha256sum "$apk"
echo "F-Droid candidate built at: $apk"
