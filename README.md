# F.S.A. — Fish Shooter Arcade

**SmartPickShop Holdings · current development line: v8 cutover**

> **AI / Work continuation:** read [`CANONICAL_PROJECT_CHECKPOINT.md`](CANONICAL_PROJECT_CHECKPOINT.md) before changing the project, then use [`docs/visual-reference/REFERENCE_INDEX.md`](docs/visual-reference/REFERENCE_INDEX.md) for the approved F.S.A. / Fish Shooter Alliance visual target.

![Captain Reef — F.S.A. key art](assets/captain-reef.jpg)

F.S.A. is a standalone owned virtual arcade with **15 fish-shooter tables** and **20 original slot-style virtual-credit mini games**. The product target is the dense cinematic neon-Atlantis F.S.A. / Fish Shooter Alliance presentation defined in the canonical checkpoint — not a generic dashboard and not a static concept image.

## Canonical links

- Repository: `https://github.com/anastaysia94-sudo/fish-shooter-arcade`
- Canonical branch: `main`
- Live Pages target: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/`
- Founder Console prototype: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/`
- Full project requirements: [`CANONICAL_PROJECT_CHECKPOINT.md`](CANONICAL_PROJECT_CHECKPOINT.md)
- Visual implementation target: [`docs/visual-reference/REFERENCE_INDEX.md`](docs/visual-reference/REFERENCE_INDEX.md)

## Current runtime line

The repository currently contains the v8 arcade cutover (`fsa-v8.js` / `fsa-v8.css`) plus earlier engines retained for migration/reference. v8 includes:

- all 15 fish-game titles
- all 20 slot-game titles
- Pulse Cannon / Spread Blaster / Rail Harpoon
- different bet-per-shot ladders and distinct gun behavior
- Bronze Reef / Silver Current / Gold Abyss room tiers
- boss, combo/Fever, powers, auto-fire and lock-on concepts
- Data Saver / 2G detection
- browser-local virtual-credit/profile persistence

The next priority is **visual/runtime fidelity**: make the actual lobby and games look and operate like the approved cinematic F.S.A. reference images, while keeping the 2G/Android fallback.

## Founder Console

`/admin/` currently demonstrates Agent/User creation, virtual credits, cashier/moderator separation, game access, suspensions, ledger reversals, audit history, bulk creation and export. It is still a browser-local prototype.

Production target is:

**Founder / Root → Distributor → Agent → User**

with secure server authentication, MFA, RBAC, database persistence and a server-authoritative append-only virtual-credit ledger.

## Product boundaries

- F.S.A. remains separate from EGM4000.
- EGM4000 may consume versioned exact F.S.A. telemetry through an explicit owned-system API.
- F.S.A. remains **virtual/non-cash entertainment by default**; no cash deposits, withdrawals or redemption are enabled by this build.

## Working rule

Do not generate standalone concept images as a substitute for implementation. Build, test, fix, push, deploy Pages and verify the **actual runtime**.
