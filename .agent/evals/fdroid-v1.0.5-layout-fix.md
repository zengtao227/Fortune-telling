# Task Eval: F-Droid Android layout review fix

## Goal

- Resolve the Android horizontal overflow shown by the F-Droid maintainer, publish an immutable follow-up release, and update the existing F-Droid submission with verified source metadata.

## Acceptance Criteria

- [x] Home almanac card stays fully inside the Android viewport at 320dp, 360dp, and 411dp.
- [x] Astrology form/result and I Ching result cards follow the same width contract without horizontal scrolling.
- [x] Existing tarot/zen visual identity and content behavior are preserved.
- [x] Lint and all unit tests pass.
- [x] Android release build succeeds and remains unsigned.
- [x] Package, versionName, and versionCode are verified from the built APK.
- [ ] F-Droid scanner returns zero findings on a clean source export and preserves Linux Hermes.
- [ ] The next GitHub tag/release points to the exact verified source commit; no old tag or versionCode is reused.
- [ ] Existing F-Droid MR metadata points to the new full source commit and per-ABI builds.
- [ ] The fork pipeline completes successfully before reporting the submission ready.

## Verification

- Command: `npm run lint`
- Expected: exit 0.
- Command: `npm test -- --runInBand`
- Expected: all suites and tests pass.
- Command: `npm run build:web`
- Expected: Expo web export succeeds for auxiliary responsive checks.
- Command: Android emulator screenshots at 320dp, 360dp, and 411dp.
- Expected: no clipped card border or horizontal scroll on required views.
- Command: clean F-Droid scanner/build rehearsal using the MR recipe.
- Expected: scanner count 0; release APK builds for both configured ABIs.
- Command: `apksigner verify --print-certs <release-apk>`
- Expected: the repository-built release APK does not verify because it is intentionally unsigned.

## Manual Checks

- [x] Compare the fixed Android home screenshot with the maintainer screenshot.
- [x] Inspect both tarot and zen themes.
- [ ] Inspect the three fastlane screenshots after any replacement.
- [ ] Confirm the GitHub/GitLab/F-Droid commit chain byte-for-byte.

## Result

- Status: PARTIAL
- Evidence:
  - Baseline: maintainer Android screenshot shows the home card's right border beyond the viewport.
  - Root cause: nested percentage-width cards inside a full-width padded container; removing the child percentage exposed a second Yoga cycle in which the centered ScrollView content shrank the parent to 278dp on a 360dp viewport.
  - Fix: derive the outer content width from `useWindowDimensions()` with a 420dp cap, let inner cards stretch into the padded content box, reset scroll position on page changes, and stack changing hexagrams vertically.
  - Native QA: Android emulator screenshots inspected at 320dp, 360dp, and 411dp. At 320dp, astrology form and calculated result both stayed inside the card; I Ching was checked with both a static and a changing hexagram in tarot and zen themes.
  - Tests: `npm test -- --runInBand` → 4 suites, 50 tests passed; `npm run lint -- --quiet` → exit 0; `npm run build:web` → export success.
  - Android: JDK 17 `./gradlew :app:clean :app:assembleRelease --no-daemon` → `BUILD SUCCESSFUL in 1m 16s`.
  - APK: `com.zengtao.fortunetelling`, `versionName=1.0.5`, `versionCode=6`, `targetSdk=34`; `apksigner verify` → expected `DOES NOT VERIFY` for the unsigned source build.
- Remaining risks:
  - F-Droid scanner/build rehearsal, immutable GitHub release, fdroiddata metadata update, remote pipeline, and maintainer response are not yet complete.
