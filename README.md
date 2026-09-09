# F.S.A. — Fish Shooter Arcade

**SmartPickShop Holdings · cinematic v9 arcade + production Founder hierarchy**

> **Continuation rule:** read [`CANONICAL_PROJECT_CHECKPOINT.md`](CANONICAL_PROJECT_CHECKPOINT.md), [`docs/visual-reference/REFERENCE_INDEX.md`](docs/visual-reference/REFERENCE_INDEX.md), and [`backend/README.md`](backend/README.md) before changing this project.

F.S.A. is a standalone owned virtual arcade with **15 fish-shooter tables** and **20 original slot-style virtual-credit mini games**. The runtime target is the approved dense cinematic neon-Atlantis / blue-gold Fish Shooter Arcade / Fish Shooter Alliance presentation, not a generic dashboard or a static concept image.

## Canonical links

- Repository: `https://github.com/anastaysia94-sudo/fish-shooter-arcade`
- Release branch: `main`
- Arcade: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/`
- Founder Console: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/`
- Project checkpoint: [`CANONICAL_PROJECT_CHECKPOINT.md`](CANONICAL_PROJECT_CHECKPOINT.md)
- Backend architecture: [`backend/README.md`](backend/README.md)

## Arcade runtime

Current gameplay includes all 15 fish titles and 20 slot titles, Pulse Cannon / Spread Blaster / Rail Harpoon, Bronze Reef / Silver Current / Gold Abyss, tougher elite/boss targets, life bars only on hard targets/bosses, four floating landscape gun stations, missions, Ocean Radar, combo/Fever, powers, Auto Fire/Lock On guards, PWA/offline shell, and Data Saver/2G/constrained-device fallback.

The continuing arcade priority remains visual fidelity to the approved cinematic references while retaining fast Android/low-data startup.

## Production Founder Console hierarchy

The control plane is server-authoritative:

**Founder → Distributor → Agent → User**

Implemented production behavior:

- Supabase Auth operator accounts and password recovery
- TOTP MFA; administrative mutations require database-verified `aal2`
- PostgreSQL Row Level Security for Founder / Distributor / Agent scopes
- Founder creates and manages Distributors
- permitted Distributors create/manage only their own Agents
- permitted Founder/Distributor/Agent operators manage users within inherited scope
- every Agent belongs to exactly one Distributor
- Distributor aggregate virtual-credit ceilings
- Agent aggregate virtual-credit ceilings inside the parent Distributor ceiling
- cashier and moderator authority remain separate
- Distributor → Agent → User game-access inheritance
- parent game removals cascade downward
- parent suspension blocks effective child authority
- Founder-only cross-Distributor Agent reassignment
- append-only virtual-credit ledger with Distributor + Agent lineage
- immutable audit history
- compensating reversals instead of rewriting ledger rows
- protected JWT-verified Edge Function for authenticated Distributor/Agent provisioning
- no service-role credential in browser code
- no browser `localStorage` authority for hierarchy, balances, permissions, ledger, or audit

F.S.A. remains **virtual/non-cash entertainment**. No deposits, withdrawals, cash redemption, or real-money wagering are enabled.

## Product boundary

F.S.A. remains separate from EGM4000. Any future F.S.A. → EGM4000 connection must use an explicit versioned telemetry boundary. Real multiplayer, cloud player-account sync, production EGM4000 telemetry, and real-money systems are separate workstreams, not implied by this hierarchy release.

## Working rule

Do not substitute generated images for implementation. Build the actual runtime/backend, run tests, fix failures, merge, deploy Pages, and verify the live result before calling a release complete.
