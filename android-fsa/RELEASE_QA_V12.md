# F.S.A. Android v12 — Release QA

This document defines what the Android v12 release candidate proves and what still requires a real device/store pass.

## Automated release gate

A passing `Build F.S.A. Android Release v12` workflow must prove all of the following:

- Android 16 / API 36 compile and target SDK.
- Source security contract passes.
- Release lint passes.
- Debug/unit-test task passes.
- Debug APK compiles.
- Release AAB compiles.
- SHA-256 hashes are produced for both build artifacts.
- The APK, AAB, hashes, and lint report are uploaded as a retained GitHub Actions artifact.

## Native security boundary

The Android cabinet is intentionally narrow:

- in-app WebView navigation is limited to `https://anastaysia94-sudo.github.io/fish-shooter-arcade/` and descendants;
- non-HTTPS custom/file/content navigation is blocked;
- ordinary external HTTPS links open outside the cabinet;
- mixed content, WebView file access, WebView content access, third-party cookies, geolocation, pop-up JavaScript, and release WebView debugging are disabled;
- there is no `addJavascriptInterface` native bridge;
- the old arbitrary-server username/password/session/telemetry console is removed;
- production player/cloud authority remains the canonical F.S.A. web/Supabase authority model;
- first-load network failure presents an explicit offline/retry screen rather than falling back to another server.

## Manual physical-device gate still required

Do **not** label physical Android/store certification complete until a real device pass verifies:

1. Fresh install from the produced APK.
2. Cold launch on phone portrait.
3. Rotate to landscape during an active table without losing the table state.
4. Enter and exit immersive/fullscreen mode.
5. Background for at least 30 seconds and resume without a blank WebView.
6. Sign in with an authorized F.S.A. cloud player account and confirm server wallet/game-access state.
7. Verify a denied game remains denied.
8. Test Wi-Fi, cellular, metered/Data Saver, and an offline-first-load failure.
9. Reconnect after offline and use the native Retry action.
10. Confirm Android Back exits fullscreen first, then WebView history, then the activity.
11. Confirm external HTTPS links leave the cabinet and non-HTTPS/custom schemes do not execute inside it.
12. Confirm no cleartext HTTP traffic is accepted.
13. Verify touch targets and readability on at least one narrow phone and one large-screen/tablet-sized window.
14. Verify the release AAB with the eventual Play upload signing/developer-verification setup.
15. Re-run the store-policy checklist immediately before submission.

## Scope

Android v12 release hardening improves packaging, security, resilience, build artifacts, and CI. It does not itself prove Play Store acceptance or a physical-device matrix; those require external/device evidence.
