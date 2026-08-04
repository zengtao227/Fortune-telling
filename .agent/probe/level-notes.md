# Per-level probe notes (working log, source for EXPO57_PROBE_REPORT.md)

Environment constant across all levels unless noted: Node v22.19.0, npm 10.9.3.

## SDK 50 (baseline, commit ff5592c / integration/fdroid)
- expo@50.0.21, react-native@0.73.6, react@18.2.0, jest-expo@50.0.4, lucide-react-native@0.344.0
- `npm install`: clean, 1778 packages, 58 vulnerabilities (3 low/14 mod/38 high/3 crit) - pre-existing, not introduced by probe.
- `npx expo-doctor`: 16/16 checks passed. No issues detected.
- `npm run lint`: FAILED to run at all initially — "ESLint couldn't determine the plugin 'prettier' uniquely" because this worktree is nested inside the parent repo's own tree (parent has its own node_modules + .eslintrc.js without `root:true`, so legacy ESLint cascades configs upward and finds two copies of eslint-plugin-prettier). Fixed with a standalone commit adding `root: true` to .eslintrc.js — this is a worktree-nesting artifact, NOT related to the SDK upgrade. After the fix: 0 errors, 466 warnings (all `prettier/prettier` formatting warnings, pre-existing style only, not touched).
- `npm test`: 3 suites / 34 tests passed, 0 failed.
- Files changed this level: none (baseline capture only). Separate commit: .eslintrc.js (root:true).

## SDK 51
- Command: `npx expo install expo@51 --fix`
- Result: ran clean, no errors. expo bumped to 51 line; expo install --fix then reported and auto-installed 9 packages needing bumps: @expo/metro-runtime 3.1.3->3.2.3, @react-native-async-storage/async-storage 1.21.0->1.23.1, expo-font 11.10.3->12.0.10, expo-haptics 12.8.1->13.0.1, expo-linear-gradient 12.7.2->13.0.2, expo-status-bar 1.11.1->1.12.1, jest-expo 50.0.4->51.0.4, react-native 0.73.6->0.74.5, react-native-svg 14.1.0->15.2.0. React stayed 18.2.0 at this level (no react bump yet needed at 51).
- `npx expo-doctor`: 17/17 checks passed. No issues detected.
- `npm run lint`: 0 errors, 466 warnings (identical set to baseline, no new warnings).
- `npm test`: 3 suites / 34 tests passed.
- Files changed: package.json, package-lock.json only (npm install regenerated lockfile in place via expo install's own npm install steps, not a from-scratch reinstall).
- No manual intervention needed at this level.

## SDK 52
- Command: `npx expo install expo@52 --fix`
- Result: ran with transient npm ERESOLVE *warnings* (not errors) during intermediate resolution steps ("Could not resolve dependency: peer react@18.2.0 from react-native@0.74.5" while react-native was mid-transition to 0.76.9) — these were warnings only, the command completed successfully and produced a working install. Final versions: expo@52.0.49, react-native@0.76.9, react@18.3.1, react-dom@18.3.1.
- `npx expo-doctor`: 18/18 checks passed. No issues detected.
- `npm run lint`: 0 errors, 466 warnings (unchanged).
- `npm test`: 3 suites / 34 tests passed.
- Files changed: package.json, package-lock.json only.
- No manual intervention needed at this level.

## SDK 53 — first REAL blocker requiring a manual, non-mechanical fix
- Command: `npx expo install expo@53 --fix`
- `expo install --fix` correctly rewrote package.json to target versions (expo 53, react-native 0.79.6, react/react-dom 19.0.0, jest-expo ~53.0.14, @expo/metro-runtime ~5.0.5, @react-native-async-storage/async-storage 2.1.2, expo-font ~13.3.2, expo-haptics ~14.1.4, expo-linear-gradient ~14.1.5, expo-status-bar ~2.2.3, react-native-svg 15.11.2, react-native-web ^0.20.0) but then its own internal `npm install` step FAILED:
  ```
  npm error code ERESOLVE
  npm error Found: jest-expo@52.0.6
  npm error   jest-expo@"~53.0.14" from the root project
  npm error Conflicting peer dependency: react@19.0.0
  npm error   peer react@"^19.0.0" from react-native@0.79.6
  ```
  Root cause: node_modules still physically contained the stale jest-expo@52.0.6 from the previous (successful) SDK52 install; npm's resolver got confused reconciling old on-disk state against the new package.json target. Retrying plain `npm install` (even after deleting package-lock.json) reproduced the exact same error because node_modules itself, not just the lockfile, was stale.
  Fix: moved node_modules aside (not deleted in-place, to comply with sandbox rm-rf guard) and ran a fully clean `npm install`. This is an install-tooling/environment quirk, not an SDK compatibility issue.

- After the clean install, a SECOND, genuine SDK53-level incompatibility surfaced:
  ```
  npm error code ERESOLVE
  npm error Found: react@19.0.0
  npm error Could not resolve dependency:
  npm error peer react@"^16.5.1 || ^17.0.0 || ^18.0.0" from lucide-react-native@0.344.0
  ```
  `lucide-react-native@0.344.0`'s peer dependency range does not include React 19, which SDK53's react-native@0.79.6 requires. Confirmed via `grep -rln "lucide" .` (excluding node_modules/lockfile) that lucide-react-native is declared in package.json but is NOT imported anywhere in App.js or src/ — it is dead/unused in this app's current code. Per probe rules it must NOT be deleted; only version-bumped.
  Checked `npm view lucide-react-native@latest peerDependencies`: latest (1.28.0) declares `react: '^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0'` — React 19 is supported starting somewhere in the 1.x line. Bumped `lucide-react-native` ^0.344.0 -> ^1.28.0 (a major version jump, 0.344 -> 1.28; not inspected for internal breaking API changes since it's unused in app code, but the package itself now installs cleanly against React 19).
  Also found `react-test-renderer` stale-pinned at 18.2.0 while jest-expo@53.0.14 itself depends directly on `react-test-renderer@19.0.0` (confirmed via `npm view jest-expo@53.0.14 dependencies`). Bumped top-level `react-test-renderer` 18.2.0 -> 19.0.0 to match.
- After both fixes, clean `npm install` completed: 1284 packages, 12 vulnerabilities (11 moderate, 1 high) — vulnerability count dropped sharply vs SDK50-52 baselines (was 40-58), likely because many old transitive deps were replaced.
- `npx expo-doctor`: 18/18 checks passed. No issues detected.
- `npm run lint`: 0 errors, 466 warnings (unchanged from baseline).
- `npm test`: 3 suites / 34 tests passed.
- Files changed: package.json (expo/react/react-native/jest-expo/lucide-react-native/react-test-renderer/etc version bumps), package-lock.json (fully regenerated from a clean node_modules, not incrementally patched).
- **Classification: this level required a real, SDK-driven dependency-compatibility fix (lucide-react-native's peer range), correctly resolved by a version bump — not a workaround, not a deletion, not a product-behavior change.**
