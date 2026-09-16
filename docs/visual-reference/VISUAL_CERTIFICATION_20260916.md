# F.S.A. Visual Certification — 2026-09-16

## Certified current visual/runtime slice

**Status: PASS — 12/12 canonical acceptance items captured from and reviewed against the live GitHub Pages runtime.**

Certified runtime commit:

`8be6f562d473d8df2b7f6506f6a3963cc1c7bc3d`

Live evidence:

- GitHub Pages run: `35072907806` (run #122) — PASS.
- Visual acceptance artifact: `fsa-live-visual-acceptance-8be6f562d473d8df2b7f6506f6a3963cc1c7bc3d`.
- Artifact ID: `10437112303`.
- Artifact SHA-256: `3eb47a713e810a6d4c121cd902384bd407cf38a24b463ad9fde71b44bd94f276`.
- Automated capture harness: PASS.
- Post-merge Lobby Fidelity v13 gate: PASS.
- Post-merge release/runtime/low-data/cloud/backend workflows: PASS; no failed or incomplete workflow remained for the certified SHA.

## Reviewed acceptance set

1. Desktop main lobby — PASS. Premium illustrated Atlantis/arcade hierarchy, gold F.S.A. identity, account/navigation strip, hero event treatment and supporting modules are visually coherent.
2. Android portrait lobby — PASS. Hero, resources, navigation and premium event cards remain readable and correctly stacked in the narrow viewport.
3. Android landscape Reef Run — PASS.
4. Reef Run boss phase — PASS; boss is visibly present and readable in the battle field.
5. Dragon Depths boss phase — PASS; distinct orange/red boss identity and battle treatment survive the shared HUD.
6. Crowded Coral Chaos table — PASS; target-density gate and crowded battle presentation both hold.
7. Pulse / Spread / Rail weapon states — PASS; three distinct presentation/behavior states captured.
8. Bronze / Silver / Gold room selection — PASS.
9. Slot lobby — PASS; all 20 cabinet cards use the clipped per-title atlas and legacy emoji-primary art remains hidden.
10. Open five-reel feature state — PASS using the real slot engine; five 7 symbols resolved to `JACKPOT WIN +1,500`, with a 100-credit wager and +1,400 net credit delta.
11. Lite / 2G mode — PASS; constrained presentation remains usable and the heavy lobby WebP art is excluded by the cinematic-Lite contract in favor of SVG fallbacks.
12. Founder Console mobile view — PASS; secure operator sign-in remains readable and non-blank at mobile width.

## Regression protection added

The v13 lobby layer is imported through the existing runtime stylesheet, cached in the offline PWA shell and marked network-first so installed clients receive visual upgrades on the next normal load. A dedicated executable contract prevents HD key art from leaking into Save-Data/2G mode and verifies the 12-item capture harness remains present.

## Scope boundary

This certifies the **current web/PWA visual-device acceptance slice** represented by the canonical 12-screen set and the current runtime. It does not claim that unrelated future roadmap work is complete. Separate future scopes remain separate, including final bespoke production art/audio for every title, physical Android/store certification, real human network multiplayer, broader player cloud synchronization, and a production F.S.A. → EGM4000 telemetry bridge.
