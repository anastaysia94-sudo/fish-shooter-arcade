# F.S.A. — CANONICAL PROJECT CHECKPOINT

> **READ THIS FIRST in ChatGPT Work, Codex, Copilot, Grok, Perplexity, or any continuation environment.**
>
> This file plus the current `main` branch is the source of truth for **Fish Shooter Arcade (F.S.A.)**. Older prompts, screenshots, status reports, and prototype files do not override it.

## 1. Canonical repository and deployment

- Repository: `https://github.com/anastaysia94-sudo/fish-shooter-arcade`
- Canonical release branch: `main`
- Arcade: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/`
- Founder Console: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/`
- Parent organization: **SmartPickShop Holdings**
- Refresh `main` before editing. Never overwrite newer work with an older snapshot.

## 2. Product boundary

**F.S.A. = Fish Shooter Arcade / Fish Shooter Alliance.**

F.S.A. is the owned playable fish-shooter + slot-style virtual arcade and its operator control plane. **EGM4000 is separate.** A future telemetry bridge must be explicit/versioned and must never silently mutate F.S.A. rules.

F.S.A. remains **virtual/non-cash entertainment by default**. No cash deposits, withdrawals, redemption, or real-money wagering are enabled.

## 3. Non-negotiable visual/runtime directive

The actual live runtime must look and operate like the approved F.S.A. / Fish Shooter Alliance references. Do not stop at concept art and do not cover a simple game with a pretty hero image.

Canonical visual language:

- cinematic neon Atlantis / underwater megacity
- metallic gold F.S.A. trident identity
- saturated cyan/electric-blue/violet/coral/molten-orange effects
- adult, premium arcade tone
- dense fish-table cabinet presentation with readable hierarchy
- illustrated fish, sharks, dragons, rays, jellyfish, sea monsters, mechanical creatures, treasure, ruins, lightning, beams and boss effects
- blue/gold glass-and-metal lobby/game cards
- full-screen battlefield with missions, radar, boss HP, powers, combo/Fever and floating gun stations
- Android/touch usability and a Lite/2G fallback must survive visual upgrades

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

All 15 must remain real playable tables with distinct identity/tuning, not title-only reskins.

Shared table systems include moving schools, target multipliers, common/fast/armored/special/elite/boss targets, boss phases, missions, Ocean Radar, combo, Ocean Fever, lock-on, guarded Auto Fire, hold-to-fire, powers, room tiers and exact owned-game telemetry hooks.

Only intentionally hard targets/elites/bosses get life bars. Ordinary fish do not.

## 5. Three-gun requirement

- **Pulse Cannon** — lowest cost, rapid precision fire.
- **Spread Blaster** — medium cost, multi-projectile crowd control.
- **Rail Harpoon** — highest cost, slow heavy/piercing boss/armor role.

Gun switching must change weapon behavior and presentation, not merely the label. Current runtime keeps room-aware shot ladders and correct per-shot virtual-credit deductions.

## 6. Room tiers

- Bronze Reef
- Silver Current
- Gold Abyss

Room tiers control shot ranges/difficulty while preserving Pulse < Spread < Rail cost/destructive role.

## 7. Required slot games — exactly 20

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

Slots remain original virtual-credit mini games. Production art direction should ultimately give each title a distinct cabinet, background, symbols and feature identity.

## 8. Current gameplay/runtime state

Implemented and protected by CI:

- 15 fish games + 20 slots
- Pulse / Spread / Rail weapons
- Bronze/Silver/Gold room tiers
- room-specific shot values
- correct shot deductions
- hard-target and scalable boss durability
- hard-target/boss-only life bars
- four floating landscape gun stations; current player opaque, simulated rivals translucent
- missions, radar, combo/Fever, powers
- safer two-step Auto Fire/Lock On and Auto Fire spending guard
- AI shooter balances/weapons
- Data Saver/2G/constrained-device detection
- PWA/offline shell
- network-first security-sensitive Founder Console assets

The remaining arcade priority is visual/content fidelity across all titles, not hierarchy/backend rework.

## 9. Production Founder Console hierarchy — IMPLEMENTED

Production authority is:

**Founder → Distributor → Agent → User**

This is no longer a browser-local prototype. The authority boundary is **Supabase Auth + PostgreSQL Row Level Security + MFA-gated audited RPCs + protected Auth-admin Edge Function**.

### Founder

- sees complete hierarchy
- invites/edits/suspends/reactivates Distributors
- manages any Agent/user
- reassigns Agents across Distributors when constraints pass
- defines Distributor game access
- normal credit/moderation powers after MFA

### Distributor

- authenticated operator tied to exactly one Distributor record
- sees only its Distributor, its Agents/users, its ledger/audit and inherited access
- may manage Agents only when `can_manage_agents=true`
- may manage users only when `can_manage_users=true`
- cashier and moderator permissions are separate
- cannot see/mutate sibling Distributors
- cannot create Agent ceilings above its own ceiling
- cannot grant games it does not own

### Agent

- authenticated operator tied to exactly one Agent
- every Agent belongs to exactly one Distributor
- sees parent Distributor, own Agent/users, own ledger/audit/access
- may manage users only when `can_manage_users=true`
- cashier and moderator permissions are separate
- cannot see/mutate sibling Agents/users
- cannot grant users games blocked at Agent level

### User

- belongs to exactly one Agent
- virtual-credit balance is server-authoritative
- user game access is a subset of Agent access
- user/credit writes are performed through audited server RPCs

## 10. Hierarchical credit invariants

Every positive credit mutation checks **both** aggregate guards:

1. Agent exposure after the mutation must not exceed `Agent.credit_ceiling`.
2. Distributor exposure across all child Agents/users after the mutation must not exceed `Distributor.credit_ceiling`.

Additional invariants:

- no negative balances
- Agent ceiling cannot exceed parent Distributor ceiling
- Distributor ceiling cannot be lowered below existing exposure or below a child Agent ceiling
- cross-Distributor user/Agent moves are restricted to authorized parent roles; Agent reassignment across Distributors is Founder-only
- `fsa_credit_ledger` is append-only
- corrections use compensating reversals
- ledger rows record Distributor + Agent lineage
- `fsa_audit_log` is immutable

## 11. Hierarchical game access

Strict inheritance:

`active F.S.A. game → Distributor → Agent → User`

- Founder controls Distributor access.
- Founder/permitted Distributor controls Agent access inside the Distributor subset.
- permitted hierarchy operators control User access inside the Agent subset.
- removing a Distributor game cascades removal from Agents/users.
- removing an Agent game cascades removal from users.
- children cannot self-grant a parent-blocked game.

## 12. Authentication / MFA / provisioning

- Supabase Auth provides operator identity/password verification and recovery.
- browser uses only the publishable key under RLS.
- service-role credentials never appear in GitHub Pages/browser code.
- TOTP MFA is supported.
- administrative mutations require database-verified `aal2`.
- `fsa-founder-admin` Edge Function has JWT verification enabled.
- `invite_distributor` is Founder-only.
- `invite_agent` is Founder or permitted Distributor; Distributor scope is forced server-side to the caller's own Distributor.
- invited operators receive real Auth accounts and role mappings.

## 13. Server mutation API

Authenticated hierarchy writes use:

- `fsa_rpc_create_player`
- `fsa_rpc_adjust_credits`
- `fsa_rpc_reverse_credit`
- `fsa_rpc_update_player`
- `fsa_rpc_update_distributor`
- `fsa_rpc_update_agent`
- `fsa_rpc_reassign_agent`
- `fsa_rpc_set_distributor_games`
- `fsa_rpc_set_agent_games`
- `fsa_rpc_set_player_games`

Each function re-checks role, active parent state, scope, delegated permission and MFA as applicable.

## 14. Live hierarchy verification completed

Disposable transactions were rolled back after verification. The live production database has passed:

- `aal1` Founder mutation → rejected with `FSA_MFA_REQUIRED`
- `aal2` Founder create user → +credit → reversal → exact opening balance restored
- append-only 3-row opening/adjustment/reversal ledger sequence
- Distributor game removal cascades to Agent and User
- Agent ceiling overage → `FSA_AGENT_CREDIT_CEILING_EXCEEDED`
- Distributor ceiling overage → `FSA_DISTRIBUTOR_CREDIT_CEILING_EXCEEDED`
- in a two-Distributor RLS fixture, Distributor sees exactly 1 Distributor / 1 Agent / 1 User
- cross-Distributor Agent update → `FSA_SCOPE_DENIED`
- smoke test fixtures leave no live Distributor/Agent/User/ledger/audit rows after rollback

## 15. Supabase schema/version

Hierarchy v2 sets `fsa_backend_meta.schema_version=2`.

Tracked migrations include:

- `20260908_fsa_founder_console_backend_v1.sql`
- `20260908_fsa_harden_trigger_search_paths.sql`
- `20260908_fsa_least_privilege_execute_v1.sql`
- `20260908_fsa_performance_hardening_v1.sql`
- `20260909_fsa_distributor_hierarchy_schema_v2.sql`
- `20260909_fsa_distributor_hierarchy_authority_v2.sql`

Backend details: [`backend/README.md`](backend/README.md).

## 16. Low-data / Android rule

Preserve a Lite path for `saveData`, 2G/slow-2G, reduced-motion and constrained devices. Heavy art/audio must remain optional/lazy. HD enhances play but must not be required to reach a usable table. Keep the service-worker shell, compressed assets, scaled effects and touch-friendly layouts.

## 17. Account-level settings outside repository code

The available connector cannot change these Supabase Auth project settings:

- **Leaked Password Protection** is currently reported disabled and should be enabled where available.
- `https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/` must be present in the Auth redirect allowlist for invitation/recovery links.

Each human Founder/Distributor/Agent must enroll/verify their own TOTP factor. The app cannot scan an operator's authenticator on their behalf.

## 18. Separate future work — NOT implied by hierarchy v2

The hierarchy release does not start or complete:

- cross-device/cloud player-account synchronization outside the operator backend
- real network multiplayer/shared human tables
- production F.S.A. → EGM4000 telemetry API
- final bespoke production art/audio for every title
- full physical Android/store QA
- real-money functionality

Do not silently fold these into the hierarchy release or claim they are complete.

## 19. Working rule

Do not claim completion from code generation alone. A release is complete only after the relevant logic tests/CI pass, the target changes are merged into `main`, GitHub Pages deploys successfully, and the live runtime/backend state is verified where tooling permits.
