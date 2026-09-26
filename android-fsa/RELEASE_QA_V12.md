# F.S.A. Android v12 — Release QA

This document defines what the Android v12 release candidate proves and what still requires a real device/store pass.

## Automated release gate

A passing `Build F.S.A. Android Release v12` workflow must prove all of the following:

- Android 16 / API 36 compile and target SDK.
- JavaScript source/security contract passes.
- Python release self-test passes.
- Release lint passes.
- Debug/unit-test task passes.
- Debug APK compiles.
- Release APK compiles.
- Release AAB compiles.
- package ID, version code and version name match the hardened v12 contract.
- Debug APK signature verifies.
- AAB ZIP integrity verifies.
- When repository signing secrets are present, the release APK and AAB signatures verify.
- Deterministic physical-device/release filenames are staged.
- SHA-256 hashes are produced.
- The APK/AAB candidates, hashes, build-status file and lint report are uploaded as retained GitHub Actions artifacts.

## Native security boundary

The Android cabinet is intentionally narrow:

- in-app WebView navigation is limited to `https://anastaysia94-sudo.github.io/fish-shooter-arcade/` and descendants;
- non-HTTPS custom/file/content navigation is blocked;
- ordinary external HTTPS links open outside the cabinet;
- mixed content, WebView file access, WebView content access, third-party cookies, geolocation and pop-up JavaScript are restricted;
- release WebView debugging is disabled through `BuildConfig.DEBUG=false`;
- there is no `addJavascriptInterface` native bridge;
- the old arbitrary-server username/password/session/telemetry console is removed;
- production player/cloud authority remains the canonical F.S.A. web/Supabase authority model;
- first-load network failure presents an explicit offline/retry path rather than falling back to another server.

## Manual physical-device gate still required

Do **not** label physical Android/store certification complete until a real device pass verifies the full checklist in `PHYSICAL_DEVICE_CERTIFICATION_V12.md`, including:

1. Fresh install from `FSA-v12-debug.apk`.
2. Cold launch on phone portrait.
3. Rotate to landscape during an active table without losing table state.
4. Enter and exit immersive/fullscreen mode.
5. Background and resume without a blank WebView.
6. Authorized cloud-player sign-in and server wallet/game-access state.
7. Denied-game enforcement.
8. Wi-Fi, cellular, metered/Data Saver and offline-first-load behavior.
9. Reconnect after offline using native Retry.
10. Android Back behavior.
11. External-link and blocked-scheme behavior.
12. No cleartext HTTP acceptance.
13. Touch/readability on at least one narrow phone and one large-screen/tablet-sized window.
14. Audio sanity.
15. Long-session stability, memory and heat sanity.
16. Release artifact verification after production signing is configured.
17. Store-policy checklist immediately before submission.

## Scope

Android v12 release hardening covers packaging, security, resilience, reproducible build artifacts and emulator CI. It does **not** prove Play Store acceptance or physical-device certification; those require external evidence.
