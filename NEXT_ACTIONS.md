# NEXT ACTIONS

Updated: 2026-09-30 America/Los_Angeles

## Smallest next execution block
1. Bring an authorized physical Android device online with USB debugging/authorization.
2. Install the retained F.S.A. v12 debug artifact and run `android-fsa/PHYSICAL_DEVICE_CERTIFICATION_V12.md`.
3. Fix only defects actually observed on hardware; rerun failed checks.
4. Add production/upload signing secrets securely outside source control.
5. Produce and verify the signed release APK/AAB.
6. Upload the signed AAB to an internal Play test track and run store-delivered smoke acceptance.
7. Separately capture the first real linked F.S.A. production telemetry session in EGM4000.
8. Preserve the already-green repository/emulator/release CI evidence; do not restart completed release-lane work.
