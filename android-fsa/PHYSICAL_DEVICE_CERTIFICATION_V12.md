# F.S.A. Android v12 — Physical Device Certification

Use this checklist for the first real-hardware certification pass. Emulator evidence does not replace it.

## Build identity

Record before testing:

- Git commit:
- GitHub Actions run:
- Artifact name: `FSA-Android-v12-debug-installable`
- APK filename: `FSA-v12-debug.apk`
- APK SHA-256:
- Tester:
- Date/time:
- Device manufacturer/model:
- Android version:
- Screen size/orientation:
- Network(s) used:

Verify the APK hash against `FSA-Android-v12-release-candidate/SHA256SUMS.txt` from the same workflow run. Do not mix artifacts from different commits/runs.

## Acceptance checklist

Mark each item PASS / FAIL / NOT TESTED and attach evidence or a defect note for every FAIL.

| # | Test | Result | Evidence / notes |
|---|---|---|---|
| 1 | Fresh install succeeds without sideload/install error |  |  |
| 2 | Cold launch opens the canonical F.S.A. production arcade |  |  |
| 3 | Portrait render has no clipped critical controls |  |  |
| 4 | Landscape render has no clipped critical controls |  |  |
| 5 | Rotate during an active fish table and preserve usable state |  |  |
| 6 | Lobby → table → lobby navigation works |  |  |
| 7 | Touch fire, weapon switching, powers and room controls respond correctly |  |  |
| 8 | Enter fullscreen/immersive mode |  |  |
| 9 | Android Back exits fullscreen before exiting the activity |  |  |
| 10 | Android Back follows WebView history when history exists |  |  |
| 11 | Background app for at least 30 seconds and resume without blank WebView |  |  |
| 12 | Screen lock/unlock resumes to a usable state |  |  |
| 13 | Authorized cloud-player sign-in succeeds |  |  |
| 14 | Server wallet/account state matches web authority |  |  |
| 15 | Allowed game opens |  |  |
| 16 | Denied game remains denied |  |  |
| 17 | Wi-Fi gameplay works |  |  |
| 18 | Cellular gameplay works, when cellular is available |  |  |
| 19 | Metered/Data Saver path remains usable |  |  |
| 20 | Offline first load reaches explicit offline/retry behavior |  |  |
| 21 | Reconnect + native RETRY restores the canonical arcade |  |  |
| 22 | External HTTPS link leaves the cabinet |  |  |
| 23 | Non-HTTPS/custom scheme does not execute inside the cabinet |  |  |
| 24 | Cleartext HTTP content is not accepted |  |  |
| 25 | Audio starts/stops normally and does not remain stuck after background/resume |  |  |
| 26 | No repeated crash, renderer loop or blank screen during 30-minute session |  |  |
| 27 | Device remains thermally usable during 30-minute session |  |  |
| 28 | Memory pressure does not make the app unusable during 30-minute session |  |  |
| 29 | Narrow-phone readability/touch target pass |  |  |
| 30 | Large-screen/tablet-sized window readability/touch target pass |  |  |

## Required evidence

For a certification record, retain at minimum:

- APK SHA-256 and exact Git commit/run;
- one portrait screenshot;
- one landscape screenshot;
- one active-table screenshot;
- one offline/retry screenshot;
- one signed-in cloud-account screenshot with private/sensitive values redacted if shared publicly;
- defect notes for every failed test;
- final PASS / FAIL decision.

Recommended evidence naming:

- `01-install.txt`
- `02-portrait.png`
- `03-landscape.png`
- `04-active-table.png`
- `05-offline-retry.png`
- `06-cloud-account-redacted.png`
- `07-network-reconnect.txt`
- `08-long-session.txt`
- `CERTIFICATION_RESULT.md`

## Certification result template

```text
FSA_ANDROID_PHYSICAL_CERTIFICATION=
PASS | FAIL

commit=
workflow_run=
artifact=
apk_sha256=
device=
android_version=
tests_passed=
tests_failed=
tests_not_tested=
blocking_defects=
notes=
```

A PASS requires every blocking item to pass. Any crash, install failure, canonical-production load failure, broken rotation/state recovery, broken cloud-account authority, denied-game bypass, unsafe in-cabinet navigation, or reconnect failure is blocking.

## After physical PASS

Physical-device PASS closes only the hardware QA gate. Store release still requires production/upload signing, signed-artifact verification, Play Console declarations/listing assets, internal-track upload acceptance, and an internal-track install smoke test.
