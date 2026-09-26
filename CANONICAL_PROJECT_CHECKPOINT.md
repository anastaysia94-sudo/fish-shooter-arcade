# F.S.A. — CANONICAL PROJECT CHECKPOINT

> **READ THIS FIRST in ChatGPT Work, Codex, Copilot, Grok, Perplexity, or any continuation environment.**
>
> This file plus the current `main` branch is the source of truth for **Fish Shooter Arcade (F.S.A.)**. Older prompts, screenshots, status reports, and prototype files do not override it.

## 1. Canonical repository and deployment

- Repository: `https://github.com/anastaysia94-sudo/fish-shooter-arcade`
- Canonical release branch: `main`
- Arcade: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/`
- Founder Console: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/`
- Account activation fallback: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/activate.html`
- Parent organization: **SmartPickShop Holdings**
- Refresh `main` before editing. Never overwrite newer work with an older snapshot.

## 2. Product boundary

**F.S.A. = Fish Shooter Arcade / Fish Shooter Alliance.** F.S.A. is the owned playable fish-shooter + slot-style virtual arcade, cloud player account layer, and operator control plane. **EGM4000 is separate.** Any telemetry bridge must be explicit/versioned and must never silently mutate F.S.A. rules.

F.S.A. remains **virtual/non-cash entertainment by default**. No cash deposits, withdrawals, redemption, or real-money wagering are enabled.

## 3. Non-negotiable visual/runtime directive

The actual live runtime must look and operate like the approved F.S.A. / Fish Shooter Alliance references. Do not stop at concept art and do not cover a simple game with a pretty hero image.

Canonical visual language: cinematic neon Atlantis / underwater megacity; metallic gold F.S.A. identity; saturated cyan/electric-blue/violet/coral/molten-orange effects; adult premium arcade tone; dense cabinet presentation; illustrated fish/sharks/dragons/rays/jellyfish/sea monsters/mechanical creatures/treasure/ruins/lightning/beams/boss effects; blue/gold glass-and-metal lobby cards; full-screen battlefield with missions/radar/boss HP/powers/combo/Fever/floating gun stations; Android/touch usability with Lite/2G fallback.

Primary reference index: [`docs/visual-reference/REFERENCE_INDEX.md`](docs/visual-reference/REFERENCE_INDEX.md).

## 4. Required fish games — exactly 15

1. Reef Run
2. Dragon Depths
3. Pirate's Plunder
4. Atlantis Rising
5. Ice Tide
6. Lava Reef
7. Storm Seas
8. Jade Dragon
9. Neon Ocean
10. Ancient Ruins
11. Mecha Marine
12. Coral Chaos
13. Kraken's Lair
14. Treasure Trials
15. Boss Rush

All 15 remain real playable tables with distinct identity/tuning. Shared systems include moving schools, target multipliers, common/fast/armored/special/elite/boss targets, boss phases, missions, Ocean Radar, combo, Ocean Fever, lock-on, guarded Auto Fire, hold-to-fire, powers, room tiers and owned-game telemetry hooks.

**Only intentionally hard targets/elites/bosses get life bars. Ordinary fish do not.**

## 5. Weapons and rooms

Weapons:
- **Pulse Cannon** — lowest cost, rapid precision fire.
- **Spread Blaster** — medium cost, multi-projectile crowd control.
- **Rail Harpoon** — highest cost, slow heavy/piercing boss/armor role.

Rooms:
- Bronze Reef
- Silver Current
- Gold Abyss

Gun switching changes behavior/presentation. Room tiers control shot ranges/difficulty while preserving Pulse < Spread < Rail cost/destructive role.

## 6. Required slot games — exactly 20

1. Ocean Fortune
2. Treasure Reels
3. Siren's Gold
4. Legend of Atlantis
5. Shark Jackpot
6. Pearl Rush
7. Kraken Spins
8. Reef Riches
9. Lucky Tide
10. Deep Diamonds
11. Golden Anchor
12. Mermaid's Treasure
13. Pirate Jackpot
14. Coral Cash
15. Neptune's Wheel
16. Sea King 777
17. Ocean Wilds
18. Diamond Dolphin
19. Wild Pearls
20. Treasure Temple

Slots remain original **virtual-credit** mini games. Production art direction should ultimately give each title a distinct cabinet, background, symbols and feature identity.

## 7. Current gameplay/runtime state

Implemented and protected by CI:
- 15 fish games + 20 slots
- Pulse / Spread / Rail weapons
- Bronze/Silver/Gold room tiers
- correct room-specific shot values and deductions
- hard-target and scalable boss durability
- hard-target/boss-only life bars
- four floating landscape gun stations; current player opaque, rivals translucent
- missions, radar, combo/Fever, powers
- guarded Auto Fire/Lock On and Auto Fire spending cap
- AI shooter balances/weapons
- Data Saver/2G/constrained-device detection
- PWA/offline shell
- cinematic visual-fidelity layer and visual acceptance tooling

## 8. Production Founder Console hierarchy — IMPLEMENTED

Production authority is:

**Founder → Distributor → Agent → User**

Authority boundary: **Supabase Auth + PostgreSQL RLS + MFA-gated audited RPCs + protected Auth-admin Edge Functions**. Browser `localStorage` is not authoritative.

Founder sees/manages the complete hierarchy after MFA. Distributors are isolated to their own Agents/users and delegated permissions. Agents are isolated to their own users. Cashier and moderator permissions remain separate. Every Agent belongs to exactly one Distributor and every User belongs to exactly one Agent.

## 9. Hierarchical credit and game invariants

Every positive credit mutation checks both aggregate guards:
1. Agent exposure must stay `<= Agent.credit_ceiling`.
2. Distributor exposure across child Agents/users must stay `<= Distributor.credit_ceiling`.

Additional invariants:
- no negative balances
- Agent ceiling cannot exceed parent Distributor ceiling
- append-only `fsa_credit_ledger`
- compensating reversals instead of history rewrites
- immutable `fsa_audit_log`
- Distributor + Agent lineage retained on ledger rows
- strict game inheritance: `active game → Distributor → Agent → User`
- parent game removal cascades downward
- child operators cannot self-grant a parent-blocked game
- parent suspension blocks effective child authority

## 10. Authentication / MFA / operator provisioning

- Supabase Auth provides operator identity/password/recovery.
- browser uses only a publishable key under RLS.
- service-role credentials never appear in GitHub Pages/browser code.
- TOTP MFA is supported and Founder MFA has been production-verified.
- administrative writes require `aal2`.
- Founder sensitive reads are AAL2-gated by database RLS.
- `fsa-founder-admin` provisions Distributor/Agent Auth identities under server checks.
- account recovery has a direct one-time-link fallback if project redirects are stale.
- compromised passwords are screened using HIBP k-anonymity because the shared Supabase organization is on the Free plan.

## 11. Production cloud player accounts — IMPLEMENTED

Cross-device player accounts are a production F.S.A. subsystem and **must not be reverted to local-only identity**.

Authority and behavior:
- normal player Auth identity maps one-to-one to `fsa_players.auth_user_id` with a partial unique index;
- `fsa_private.session_player_id()` resolves only an active player under an active Agent and Distributor;
- `fsa_rpc_player_bootstrap()` returns the signed-in player's server identity/wallet without depending on multiplayer tables;
- `fsa_player_cloud_state` stores level/xp/gems/pearls plus preferences, last game/room, revision and update timestamp;
- player browser writes are restricted to safe preference/session fields; progression fields are server-only;
- `fsa_player_game_access` remains authoritative for available titles;
- signed-in arcade UI displays server wallet and blocks games not granted by the hierarchy;
- cross-device preference writes use optimistic revision matching; stale writes reload the newest cloud state instead of silently winning;
- offline cache may display the last synced account/access snapshot, but cannot become server authority;
- guest/local demo state remains explicitly separate from a cloud wallet;
- public self-registration remains disabled.

Provisioning:
- protected `fsa-player-admin` Edge Function has JWT verification enabled and requires operator AAL2;
- `invite_player` creates/invites the Auth identity then calls service-only `fsa_service_create_network_player`;
- `link_player` attaches an Auth identity to an existing unlinked server user through service-only `fsa_service_link_network_player`;
- Founder/Distributor/Agent scopes and `can_manage_users` are checked server-side;
- non-zero opening balance additionally requires cashier authority for non-Founder operators;
- Agent/Distributor aggregate credit ceilings and Agent game inheritance remain enforced;
- account creation/linking writes audit events;
- Auth provisioning is rolled back when a newly invited account cannot be linked.

Activation/recovery resilience:
- invitation emails target the production arcade URL;
- `/activate.html` accepts only links from this F.S.A. Supabase project, verifies invite/recovery OTPs directly, screens the new password through HIBP k-anonymity, and returns the player to the arcade;
- this fallback avoids making account activation depend on an unverifiable project-level redirect allowlist.

## 12. Cloud-account migrations / runtime files

Tracked cloud account pieces include:
- `backend/supabase/migrations/20260913_fsa_player_cloud_state_v4.sql`
- `backend/supabase/migrations/20260913_fsa_player_cloud_write_v4.sql`
- `backend/supabase/migrations/20260913_fsa_player_cloud_account_linking_v4.sql`
- `backend/supabase/migrations/20260913_fsa_player_cloud_authority_completion_v4.sql`
- `backend/supabase/functions/fsa-player-admin/index.ts`
- `cloud-sync-v11.js`
- `cloud-sync-v11.css`
- `admin/cloud-player-admin.js`
- `activate.html`
- `activate.js`
- `cloud-sync-selftest.js`
- `cloud-account-completion-selftest.js`

## 13. Live verification requirements

A release is not complete merely because files exist. Relevant GitHub CI must pass, migrations/functions must be present in the live Supabase project, changes must be merged to `main`, Pages must deploy the exact `main` commit, and live database state must be inspected where connector tooling permits.

Previous hierarchy verification includes AAL1 rejection, AAL2 credit/reversal correctness, append-only ledger behavior, credit ceiling enforcement, RLS isolation and cross-Distributor scope denial. Cloud-account completion additionally verifies database function/ACL structure, one-to-one Auth linkage constraints, Edge Function deployment/JWT verification, browser boundary tests, optimistic sync invariants and PWA delivery.

As of 2026-09-25, Android v12 repository-side certification is also reproducible on `main`: the debug APK builds, installs and launches in an API 35 Pixel 6 emulator; the trusted production page reaches the Android cabinet readiness marker; portrait/landscape captures and rotation-survival evidence are uploaded; and the Android release workflow produces a release-candidate artifact. This is emulator/repository certification only, not physical-device or store certification.

The same `main` commit also passed the GitHub Pages deployment workflow, including live route preflight, deployed runtime byte-parity verification and visual-acceptance capture.

## 14. Low-data / Android rule

Preserve a Lite path for `saveData`, 2G/slow-2G, reduced-motion and constrained devices. Heavy art/audio remains optional/lazy. HD enhances play but must not be required to reach a usable table. Keep the service-worker shell, compressed assets, scaled effects and touch-friendly layouts.

## 15. Separate workstreams not implied by cloud accounts

Do not silently claim these complete merely because hierarchy/cloud accounts exist:
- real network multiplayer/shared human tables unless its own live verification proves completion
- the **F.S.A. telemetry producer** is implemented and production-hardened behind an explicit versioned boundary, but the **EGM4000 consumer/import + explicit pseudonymous identity-link workflow** remains a separate incomplete workstream
- final bespoke production art/audio for every title
- full physical Android/store QA; repository-side Android emulator certification is complete, but real-device/store certification is not
- real-money functionality

## 16. Working rule

Do not substitute generated pictures for implementation. Do not claim completion from code generation alone. Build the actual runtime/backend, test it, fix failures, merge the tested head, deploy Pages, and verify the live result.
