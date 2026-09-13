# F.S.A. Visual Fidelity v10 Acceptance

This scope advances the remaining arcade priority identified by `CANONICAL_PROJECT_CHECKPOINT.md`: visual/content fidelity across the owned F.S.A. catalog while preserving the current playable v9 runtime, PWA/offline behavior, virtual-credit safety model, and Lite/2G constraints.

## Completed in this slice

- [x] 15 fish-game lobby cards use an original local vector title-art atlas instead of gradient-only presentation.
- [x] Every fish title receives a distinct atlas panel and accent treatment.
- [x] 20 slot cards use an original local vector cabinet atlas.
- [x] Every slot title receives a distinct cabinet panel position.
- [x] Legacy emoji slot-card symbols are visually demoted from primary art.
- [x] Boss-strip emoji are visually replaced by owned atlas art.
- [x] Weapon-station emoji are visually replaced by CSS cannon silhouettes while the existing gameplay runtime remains authoritative.
- [x] Current-player weapon art follows Pulse / Spread / Rail switching through a visual-only DOM adapter.
- [x] Slot reel emoji are visually replaced with local CSS symbol families while existing slot outcome logic remains unchanged.
- [x] The battle viewport receives an additional low-cost depth/light layer without changing canvas mechanics.
- [x] Reduced-motion behavior remains supported.
- [x] No third-party runtime or stylesheet dependency is introduced.
- [x] New visual assets are included in the offline shell.
- [x] Visual CSS and SVG atlases are explicitly included in low-data/offline byte budgets.
- [x] `tests/visual-fidelity-contract.mjs` makes the catalog visual layer executable CI.
- [x] Current Runtime Regression, v9 validation, and full Release validation execute the visual fidelity contract.
- [x] A dedicated `F.S.A. Visual Fidelity v10` workflow exists for visual/runtime/offline compatibility.

## Deliberately not claimed complete by this slice

This is a catalog/runtime visual-fidelity hardening release, not the final screenshot-certified art pass for every F.S.A. surface. The canonical visual reference still requires manual visual comparison of desktop/mobile lobby, multiple boss phases, crowded tables, all room tiers, an open slot feature state, Lite/2G presentation, and Founder Console mobile view.

Final visual completion must not be declared merely because the code-level visual contract passes. The acceptance screenshots in `docs/visual-reference/REFERENCE_INDEX.md` remain the final visual QA checklist.

## Merge rule

This slice is complete only when:

1. the dedicated visual fidelity workflow passes on the pull request;
2. Current Runtime Regression, v9 Gameplay, Release, and Low-Data checks pass on the pull request;
3. the pull request is merged to `main`;
4. the same relevant checks pass on the merge commit; and
5. GitHub Pages deploys successfully from that merge commit.
