# F.S.A. Android v12 Release Readiness

This file separates repository-complete Android work from external physical-device and store steps.

## Repository-complete release lane

The Android project builds from `android-fsa/` with:

- package ID `com.smartpickshop.fsa`
- `versionCode` 12
- `versionName` `0.12.0-release-hardening`
- minimum SDK 26
- target/compile SDK 36

The launcher is `GameActivity`. It renders only the canonical HTTPS F.S.A. GitHub Pages path inside the cabinet WebView. External HTTPS links leave the cabinet. Non-HTTPS/custom navigation is blocked. File/content access, cleartext traffic, mixed content, geolocation and automatic JavaScript windows are disabled. Release builds disable WebView debugging because `BuildConfig.DEBUG` is false. Android backup is disabled.

CI runs both release contracts before building:

1. `node tests/android-release-contract.mjs`
2. `python3 android-fsa/release-selftest.py`

It then runs release lint, debug unit tests, and builds:

- an installable debug APK for physical-device testing;
- a release APK;
- a release Android App Bundle (AAB).

The workflow verifies package/version metadata, verifies the debug APK signature, validates AAB ZIP integrity, stages deterministic filenames, includes the release lint report, and publishes SHA-256 hashes.

## Secure signing path

Production signing material is intentionally **not** committed to this repository.

When all four repository secrets below are present, CI signs the release outputs and verifies both the APK and AAB signatures:

- `FSA_ANDROID_KEYSTORE_B64`
- `FSA_ANDROID_KEYSTORE_PASSWORD`
- `FSA_ANDROID_KEY_ALIAS`
- `FSA_ANDROID_KEY_PASSWORD`

`FSA_ANDROID_KEYSTORE_B64` is the base64 representation of the upload keystore. The decoded keystore exists only in the temporary CI runner and is not committed.

When any signing secret is absent, CI still produces:

- `FSA-v12-debug.apk` — installable physical-device test build;
- `FSA-v12-unsigned-release.apk` — unsigned release candidate;
- `FSA-v12-unsigned-release.aab` — unsigned bundle candidate;
- `BUILD-STATUS.txt`;
- `SHA256SUMS.txt`;
- `lint-results-release.html`.

Unsigned release outputs prove the release variant compiles. They are **not** represented as Play-ready uploads.

When signing secrets are present, the release filenames become:

- `FSA-v12-signed-release.apk`
- `FSA-v12-signed-release.aab`

## Physical-device certification package

The retained `FSA-Android-v12-debug-installable` artifact is the preferred first hardware-test package.

The retained `FSA-Android-v12-release-candidate` artifact is the evidence bundle and contains the deterministic release files, hashes, build status and lint report.

Physical testing must follow `PHYSICAL_DEVICE_CERTIFICATION_V12.md`. A real-device pass must record device/Android version, exact Git commit, artifact hash, pass/fail per test, screenshots when relevant, and any defect found.

## External gates that cannot be truthfully certified by repository CI

The following remain external evidence gates until performed against a real device/account:

1. Install the CI debug APK on at least one physical Android device and run the complete physical-device checklist.
2. Verify launch, rotation, active-table state preservation, WebView gameplay, audio, back navigation, immersive-mode recovery, suspend/resume, reconnect and low-data behavior.
3. Sign in with an authorized F.S.A. cloud player account and verify server wallet/game-access enforcement.
4. Add the production/upload signing secrets and retain the upload key securely outside the repository.
5. Verify the signed release artifact on a physical device or trusted Android test service.
6. Complete current Google Play Console app-content, privacy/data-safety, content-rating, target-audience, screenshots/listing and policy declarations.
7. Upload the signed AAB to a Play internal-test track and confirm Google Play accepts it.
8. Install the internal-test build from Google Play and repeat the smoke test before any production rollout.

No repository document should mark those external gates complete without corresponding evidence.
