# F.S.A. Android v12 Release Readiness

This file separates repository-complete Android work from external store/operator steps.

## Repository-complete release lane

The Android project builds from `android-fsa/` with package ID `com.smartpickshop.fsa`, `versionCode` 12, `versionName` `0.12.0-android-rc1`, minimum SDK 26 and target/compile SDK 36.

The launcher is `GameActivity`. It renders only the canonical HTTPS F.S.A. GitHub Pages path inside the cabinet WebView. Other HTTP/HTTPS/mail links leave the app; file/content access, cleartext traffic, mixed content, geolocation and automatic JavaScript windows are disabled. WebView debugging is disabled. Android backup is disabled.

CI runs `android-fsa/release-selftest.py`, then builds:

- an installable debug APK for device testing;
- a release APK;
- a release Android App Bundle (AAB).

The workflow validates package/version metadata, verifies the debug APK signature, tests AAB ZIP integrity, stages deterministic filenames and publishes SHA-256 hashes.

## Secure signing path

Production signing material is intentionally **not** committed to this repository.

When all four repository secrets below are present, CI signs the release outputs and verifies both the APK and AAB signatures:

- `FSA_ANDROID_KEYSTORE_B64`
- `FSA_ANDROID_KEYSTORE_PASSWORD`
- `FSA_ANDROID_KEY_ALIAS`
- `FSA_ANDROID_KEY_PASSWORD`

`FSA_ANDROID_KEYSTORE_B64` is the base64 representation of the upload keystore. The decoded keystore exists only in the temporary CI runner.

When those secrets are absent, CI still produces the installable debug APK plus clearly labeled unsigned release APK/AAB candidates. Unsigned release artifacts are evidence that the release variant compiles; they are **not** represented as Play-ready uploads.

## External gates that cannot be truthfully certified by repository CI

The following remain external evidence gates until performed against a real device/account:

1. Install the CI debug APK on at least one physical Android device and verify launch, rotation, WebView gameplay, audio, back navigation and full-screen recovery.
2. Add the production/upload signing secrets and retain the upload key securely outside the repository.
3. Verify the signed release artifact on a physical device or a trusted Android test service.
4. Complete current Google Play Console app-content, privacy/data-safety, content-rating, target-audience, screenshots/listing and policy declarations.
5. Upload the signed AAB to a Play internal-test track and confirm Google Play accepts it.
6. Install the internal-test build from Google Play and repeat the smoke test before any production rollout.

No repository document should mark those external gates complete without corresponding evidence.
