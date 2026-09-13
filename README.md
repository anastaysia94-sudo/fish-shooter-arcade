# F.S.A. — Fish Shooter Arcade

**SmartPickShop Holdings · cinematic arcade + production hierarchy + cloud player accounts**

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

Implemented production behavior includes Supabase Auth, TOTP MFA/AAL2, PostgreSQL Row Level Security, Distributor/Agent credit ceilings, scoped user administration, cashier/moderator separation, inherited game access, append-only virtual-credit ledger, immutable audit history, compensating reversals, and protected Edge Functions. Browser `localStorage` is not authority for hierarchy, balances, permissions, ledger, or audit.

## Production cloud player accounts

Invited F.S.A. players can now use the same server-backed account on multiple devices.

- Auth identity is linked one-to-one to an F.S.A. player record.
- Founder/Distributor/Agent operators invite new cloud players through an MFA-gated Edge Function.
- Existing server users can be linked to an Auth identity without recreating their wallet or player record.
- Player identity resolves through `fsa_private.session_player_id()` and the authenticated bootstrap RPC.
- Virtual-credit wallet and game permissions remain server-authoritative.
- Cloud state stores level/xp/gems/pearls plus user preferences and last game/room.
- Browser writes are limited to safe preference/session fields; progression fields are server-only.
- Sync uses monotonic optimistic revisions so a stale device cannot silently overwrite newer cloud settings.
- Offline mode can show the last synced account/access cache, while server authority resumes when connectivity returns.
- Guest/local demo state remains separate and does not become a server wallet.
- Public player self-registration remains disabled; accounts originate from authorized hierarchy operators.
- Service-role credentials remain inside JWT-protected Edge Functions and never ship to the arcade browser.

F.S.A. remains **virtual/non-cash entertainment**. No deposits, withdrawals, cash redemption, or real-money wagering are enabled.

## Product boundary

F.S.A. remains separate from EGM4000. Any F.S.A. → EGM4000 connection must use an explicit versioned telemetry boundary. Real network multiplayer, production EGM4000 telemetry, final per-title art/audio completion, physical Android/store QA, and any real-money system remain separate workstreams unless their own release evidence says otherwise.

## Working rule

Do not substitute generated images for implementation. Build the actual runtime/backend, run tests, fix failures, merge, deploy Pages, and verify the live result before calling a release complete.
