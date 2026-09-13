# F.S.A. Low-Data / 2G Acceptance Checklist

This document defines the release gate for the current F.S.A. browser runtime. A check is complete only when it is enforced by executable regression tests and the relevant GitHub Actions workflows pass.

## Detection policy

- [x] `navigator.connection` is supported with Mozilla/WebKit fallbacks.
- [x] `saveData=true` activates Low Mode.
- [x] `effectiveType=2g` activates Low Mode.
- [x] `effectiveType=slow-2g` activates Low Mode.
- [x] `prefers-reduced-motion: reduce` activates Low Mode.
- [x] devices reporting <=2 GiB memory activate Low Mode.
- [x] devices reporting <=2 logical processors activate Low Mode.
- [x] normal 3G/4G devices with capable hardware do not enter Low Mode solely because Network Information API is present.
- [x] absence of Network Information API does not itself force Low Mode on capable hardware.

## Runtime degradation behavior

- [x] initial table target count drops from 18 to 8.
- [x] live target cap drops from 42 to 16.
- [x] timed event spawn burst drops from 5 to 2.
- [x] radar marker cap drops from 24 to 10.
- [x] hold-to-fire interval slows from 130 ms to 260 ms.
- [x] fish, boss and projectile canvas shadows are disabled in Low Mode.
- [x] decorative canvas particles are omitted in Low Mode.
- [x] reduced-motion CSS collapses animations/transitions even outside canvas rendering.
- [x] background tabs stop the animation loop and clear hold-to-fire timers, then restart safely when visible.

## Network and offline behavior

- [x] the playable cold-start shell has no third-party JS/CSS dependency.
- [x] root arcade navigation has an offline fallback.
- [x] Founder Console navigation has a separate offline fallback.
- [x] security-sensitive Founder Console assets remain network-first with cached fallback.
- [x] PWA CORE shell contains the current arcade runtime, CSS and manifest.
- [x] service-worker CORE shell contains no third-party URL.

## Budgets

- [x] critical first-load source remains <=250 KiB total.
- [x] each critical file has an explicit individual regression ceiling.
- [x] complete cached offline shell remains <=768 KiB.

## CI enforcement

- [x] dedicated `F.S.A. Low-Data Budget` workflow runs source-budget tests.
- [x] dedicated workflow runs behavioral Low-Data / 2G tests.
- [x] pull requests trigger the dedicated low-data workflow.
- [x] full `Validate F.S.A. Release` workflow executes both low-data suites.
- [x] `Validate F.S.A. v9 Gameplay` executes both low-data suites.

## Completion rule

This checklist reaches **100%** only when the branch containing these gates passes the dedicated low-data workflow, the v9 gameplay workflow and the full F.S.A. release workflow, then merges to `main` and the same gates pass on `main`.
