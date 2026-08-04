# Mystic Compass

Mystic Compass is an offline React Native/Expo app that combines a Chinese almanac, an entertainment-oriented I Ching casting tool, and a simplified Sun/Moon/Rising calculation.

## Privacy and network behavior

- No advertising, analytics, tracking, accounts, cloud APIs, geolocation, or WebView.
- All calculations run locally on the device.
- Birth details are not saved unless the user explicitly enables **Remember on this device**.
- Saved details can be deleted from the astrology form at any time.
- The Android build blocks `android.permission.INTERNET` and disables Expo remote updates.

See [PRIVACY.md](PRIVACY.md).

## Important limitation

The content is provided for traditional-culture entertainment and self-reflection. It is not medical, legal, financial, psychological, or other professional advice and does not make deterministic predictions.

## Supported birth locations

Moon and Rising calculations require a recognized city because latitude, longitude, and the historical IANA timezone are needed. The offline city table is in `src/logic/locations.js`. Unknown locations are rejected rather than silently replaced with default coordinates. Without a birth time, only the Sun sign is calculated.

## Development

Requirements:

- Node.js 22.13.x
- npm 11.5.x
- JDK 17 or the JDK version required by Expo SDK 57
- Android SDK 36 for Android builds

```bash
npm install
npm run verify
npm run web
```

## Android / F-Droid build

```bash
npm run fdroid
```

The script installs dependencies from source, runs lint and tests, generates the native Android project with Expo Prebuild, builds an unsigned release APK, and checks that the final manifest does not contain Internet permission.

Detailed instructions are in [docs/BUILDING.md](docs/BUILDING.md) and [docs/FDROID.md](docs/FDROID.md).

## Application ID

`io.github.zengtao227.fortunetelling`

The package identifier was changed before the first F-Droid release so it is tied to the project's controlled GitHub namespace.

## Release process

1. Update `version` and `android.versionCode`.
2. Add `fastlane/metadata/android/*/changelogs/<versionCode>.txt`.
3. Run `npm run fdroid` in a clean Linux environment.
4. Inspect permissions and test the unsigned APK.
5. Tag the exact commit as `vX.Y.Z`.
6. Submit/update the fdroiddata metadata.

## License

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
