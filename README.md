# F.S.A. — Fish Shooter Arcade

**SmartPickShop Holdings · current development line: cinematic v9 + production Founder Console backend**

> **AI / Work continuation:** read [`CANONICAL_PROJECT_CHECKPOINT.md`](CANONICAL_PROJECT_CHECKPOINT.md) before changing the project, then use [`docs/visual-reference/REFERENCE_INDEX.md`](docs/visual-reference/REFERENCE_INDEX.md) for the approved F.S.A. / Fish Shooter Alliance visual target. Founder Console/backend work must also read [`backend/README.md`](backend/README.md).

![Captain Reef — F.S.A. key art](assets/captain-reef.jpg)

F.S.A. is a standalone owned virtual arcade with **15 fish-shooter tables** and **20 original slot-style virtual-credit mini games**. The product target is the dense cinematic neon-Atlantis F.S.A. / Fish Shooter Alliance presentation defined in the canonical checkpoint, not a generic dashboard and not a static concept image.

## Canonical links

- Repository: `https://github.com/anastaysia94-sudo/fish-shooter-arcade`
- Canonical branch: `main`
- Live Pages target: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/`
- Founder Console: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/`
- Full project/status checkpoint: [`CANONICAL_PROJECT_CHECKPOINT.md`](CANONICAL_PROJECT_CHECKPOINT.md)
- Visual implementation target: [`docs/visual-reference/REFERENCE_INDEX.md`](docs/visual-reference/REFERENCE_INDEX.md)
- Production backend architecture: [`backend/README.md`](backend/README.md)

## Current arcade runtime

The current arcade line includes:

- all 15 fish-game titles
- all 20 slot-game titles
- Pulse Cannon / Spread Blaster / Rail Harpoon
- room-specific shot ladders and distinct gun behavior
- Bronze Reef / Silver Current / Gold Abyss
- scaled hard targets and bosses
- life bars only for hard targets/elites/bosses
- four floating landscape gun stations instead of giant player boxes
- missions, Ocean Radar, combo/Fever, powers, safer Auto Fire and Lock On
- Data Saver / 2G / constrained-device fallback
- service-worker/offline shell

The continuing arcade priority is **visual/runtime fidelity**: make the actual lobby and games match the approved cinematic F.S.A. references while preserving fast Android/2G startup.

## Founder Console production backend

`/admin/` is no longer a browser-local authority. Its production control plane is backed by Supabase Auth and PostgreSQL.

Implemented production boundary:

**Founder → Agent → User**

with:

- real authenticated operator accounts
- password recovery
- TOTP MFA enrollment/challenge
- database-enforced `aal2` for administrative mutations
- server-side Founder/Agent scope through Row Level Security
- durable Agents/users/permissions/balances
- cashier permission separate from moderator permission
- Agent virtual-credit ceilings
- append-only credit ledger with compensating reversals
- immutable audit log
- inherited game access
- protected Founder-only Edge Function for authenticated Agent invitation/provisioning
- no service-role credential in browser code
- no `localStorage` authority for users, balances, permissions, ledger or audit data

The broader **Founder → Distributor → Agent → User** production hierarchy remains a separate future workstream; Distributor support is not falsely included in this backend release.

## Product boundaries

- F.S.A. remains separate from EGM4000.
- EGM4000 may consume versioned exact F.S.A. telemetry through an explicit owned-system API.
- F.S.A. remains **virtual/non-cash entertainment by default**; no cash deposits, withdrawals or redemption are enabled by this build.

## Working rule

Do not generate standalone concept images as a substitute for implementation. Build, test, fix, push, deploy Pages and verify the **actual runtime/backend** before calling a release complete.
