# Task Eval: Enable Android minify and publish v1.0.2

## Goal
- Publish an immutable upstream Android release with R8 minification and resource shrinking enabled, then update the existing F-Droid merge request and answer the reviewer with verified evidence.

## Acceptance Criteria
- [x] Android release builds set `android.enableProguardInReleaseBuilds=true`.
- [x] Android release builds set `android.enableShrinkResourcesInReleaseBuilds=true`.
- [x] Version is `1.0.2` with Android `versionCode` 3 everywhere it is declared.
- [x] Existing `v1.0.1` tag remains unchanged.
- [x] Unit tests and lint pass.
- [x] A clean release APK builds successfully and remains unsigned.
- [x] R8 output proves minification ran, and the APK manifest reports the expected package/version.
- [x] The release APK installs and launches on an Android device or emulator; core Fortune Telling screens receive a smoke test.
- [ ] Upstream main is pushed, annotated tag `v1.0.2` is published, and the remote tag resolves to the verified source commit.
- [ ] Existing F-Droid MR !44809 is updated to version 1.0.2/versionCode 3/new commit and its pipeline passes.
- [ ] Reviewer receives an evidence-backed reply; no duplicate MR is opened.

## Verification
- Command: `npm test -- --runInBand`
- Expected: all tests pass.
- Command: `npm run lint`
- Expected: exit code 0.
- Command: `cd android && ./gradlew clean assembleRelease --no-daemon`
- Expected: `BUILD SUCCESSFUL` and an unsigned release APK.
- Command: `apksigner verify --print-certs <apk>`
- Expected: verification fails because the F-Droid input APK is intentionally unsigned.
- Command: `aapt dump badging <apk>`
- Expected: package `com.zengtao.fortunetelling`, versionCode `3`, versionName `1.0.2`.
- Command: inspect `android/app/build/outputs/mapping/release/mapping.txt`
- Expected: R8 mapping file exists and is non-empty.
- Command: `adb install -r <apk>` followed by launch and UI checks.
- Expected: install/launch succeeds and no fatal crash appears in logcat.

## Manual Checks
- [x] Home/daily almanac renders.
- [ ] Astrology flow renders a result.
- [x] I Ching flow renders a hexagram/result.
- [x] Custom fonts, icons, and gradients still render after resource shrinking.
- [ ] Continuous animation remains visible after resource shrinking.

## Result
- Status: PARTIAL
- Evidence:
  - Initial audit: v1.0.1/versionCode 2 is the current immutable release; minify and resource shrinking both resolve to false.
  - `npm test -- --runInBand`: 3 suites, 34 tests passed.
  - `npm run lint`: exit 0 with 0 errors; 466 pre-existing warnings remain outside this task.
  - `assembleRelease`: `BUILD SUCCESSFUL` in 1m51s; R8, `shrinkReleaseRes`, and `optimizeReleaseResources` executed.
  - R8 mapping: `mapping.txt` is 7,265,048 bytes.
  - APK: about 64 MiB; package `com.zengtao.fortunetelling`, versionName `1.0.2`, versionCode `3`.
  - `apksigner verify --print-certs`: original release APK reports `DOES NOT VERIFY`, as required for F-Droid input.
  - A temporary test-signed copy installed on AVD `travelspend_test`; `MainActivity` cold-started in 1.76s.
  - Visual smoke screenshots: `/private/tmp/fortune-release-verify.tzOOz9/01-home.png`, `02-astrology.png`, and `05-iching.png`.
  - App-PID logcat scan: no `FATAL EXCEPTION`, `Resources$NotFoundException`, or `ClassNotFoundException`.
  - Clean `git archive` E2E: `npm ci` installed 1468 packages; real fdroidserver scanner returned `SCANNER_COUNT=0` and preserved Linux Hermes.
  - Scanner-clean tree built with external Gradle 8.3 and only JDK 21 visible: `BUILD SUCCESSFUL in 1m49s`; R8/resource shrinking and unsigned APK checks passed again.
- Remaining risks:
  - The astrology form rendered; a full result submission is being rechecked after an Android Gboard permission prompt interfered with automation.
  - Two captured I Ching frames were identical, so continuous animation is not yet proven by the automated smoke test.
  - Remote publication and F-Droid CI are pending.
