# F.S.A. — CANONICAL PROJECT CHECKPOINT

> **READ THIS FIRST in ChatGPT Work, Codex, Copilot, Grok, Perplexity, or any continuation environment.**
>
> This is the canonical product/status checkpoint for **Fish Shooter Arcade (F.S.A.)**. When older prompts, mockups, legacy notes, or previous status reports conflict with this file plus the current `main`, use this file and the current repository state.

## 1. Canonical repository and deployment

- Repository: `https://github.com/anastaysia94-sudo/fish-shooter-arcade`
- Canonical release branch: `main`
- Public arcade: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/`
- Founder Console: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/`
- Parent organization: **SmartPickShop Holdings**
- Always refresh `main` before editing. Never overwrite newer commits with an older snapshot.

## 2. Product boundary

**F.S.A. = Fish Shooter Arcade / Fish Shooter Alliance.**

- **F.S.A.** is the owned playable fish-shooter + slot-style virtual arcade and its operator control plane.
- **Founder Console** is the F.S.A. administration/control plane.
- **EGM4000** is a separate analytics/coaching/research product. Any telemetry connection must cross an explicit, versioned boundary.
- Do not merge EGM4000 into F.S.A. or silently let EGM4000 mutate F.S.A. rules.
- F.S.A. remains **virtual/non-cash entertainment** by default. No cash deposits, withdrawals, redemption, or real-money wagering belong in this default product.

## 3. Non-negotiable visual directive

**The actual live runtime must look and operate like the approved F.S.A. / Fish Shooter Alliance reference images. Do not substitute concept art, screenshots, or hero images for implementation.**

Canonical visual language:

- cinematic neon Atlantis / underwater megacity
- metallic gold F.S.A. / trident branding
- deep cobalt/cyan ocean lighting with gold, violet, coral, electric and molten accents
- premium adult arcade-machine presentation, not childish/emoji-first UI
- dense but readable fish-table HUD
- illustrated fish, sharks, dragons, rays, jellyfish, mechanical creatures, sea monsters, treasure, ruins, lightning, beams, coins and bosses
- rich lobby/game cards, missions, events, room selection, rewards and boss presentation

Primary visual references and implementation guidance are indexed in:

- `docs/visual-reference/REFERENCE_INDEX.md`
- `assets/fsa-lobby.svg`
- `assets/fsa-gameplay.svg`
- `assets/fsa-boss-event.svg`
- `assets/fsa-fish-hd-atlas.webp`
- `assets/reef-run-hd-battle.webp`
- `assets/fsa-slots-hd-atlas.webp`
- `assets/fsa-mark.svg`

If a continuation environment can see the earlier generated F.S.A. images, use those exact images as visual references. The runtime, not the mockup, is the deliverable.

## 4. Fish Shooter catalog — exactly 15

All 15 remain required playable owned tables with distinct themes and tuning:

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

Shared table requirements include:

- Bronze Reef / Silver Current / Gold Abyss rooms
- moving schools, formations and depth lanes
- target multipliers
- common / fast / armored / chain / vortex / treasure / bomb / laser / drill / elite / boss classes
- bosses with phases/entrances/finishing-shot ownership
- missions
- Ocean Radar
- combo + Ocean Fever
- lock-on
- auto-fire with deliberate activation/spend guard
- touch/hold-to-fire
- feature events and satisfying hit/treasure effects
- four table gun stations without giant player boxes covering landscape play
- P1/current gun fully visible and interactive; rivals visually subordinate/translucent
- ordinary fish do **not** show life bars; only genuinely hard targets/elites/bosses do

## 5. Three-gun requirement

### Pulse Cannon
- lowest shot cost
- fast precision fire
- common/fast-target role
- base ladder: 2 / 5 / 10 / 20 / 50 virtual credits

### Spread Blaster
- medium trigger cost
- multi-projectile crowd-control role
- base ladder: 10 / 20 / 50 / 100 / 200 virtual credits

### Rail Harpoon
- highest shot cost
- slower heavy/piercing boss and armor role
- base ladder: 50 / 100 / 200 / 500 / 1000 virtual credits

Room tiers can scale ladders, but displayed shot cost must equal the virtual-credit amount actually deducted. Weapon models/effects/behavior must visibly differ, not merely the label.

## 6. Slot catalog — exactly 20

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

All remain virtual-credit mini games. Each ultimately needs its own cabinet/background/symbol/bonus visual identity rather than twenty title swaps over one generic skin.

## 7. Founder Console — current production state

**The earlier browser-local prototype is no longer the authority. Production backend #1 has been implemented.**

Production authority is now:

`Supabase Auth → authenticated Founder/Agent identity → PostgreSQL RLS → audited RPC mutation layer → durable F.S.A. database`

Canonical backend documentation:

- `backend/README.md`
- `backend/supabase/migrations/`
- `backend/supabase/functions/fsa-founder-admin/index.ts`

### Implemented production backend

- real Supabase Auth operator identity
- password sign-in
- PKCE password-recovery flow
- durable PostgreSQL records
- server-enforced Founder vs Agent scope
- active/suspended operator enforcement
- TOTP MFA enrollment/challenge UI
- `aal2` MFA required **inside the database** for administrative mutations
- RLS on every exposed F.S.A. backend table
- Founder reads all F.S.A. operator records
- Agent reads only their own Agent/user/ledger/audit scope
- direct browser table writes are not the administrative authority
- cashier permission separate from moderator permission
- per-Agent aggregate virtual-credit ceiling
- no-negative-balance enforcement
- append-only virtual-credit ledger
- immutable audit log
- compensating reversals rather than editing/deleting ledger history
- exactly one reversal of an original ledger entry
- Agent game access plus inherited Player game access
- server-side authenticated Agent invitation/provisioning through a JWT-verified Edge Function
- browser never receives a Supabase service-role credential
- legacy `localStorage` records can be downloaded only as a backup; they are not production authority

### Current backend tables

- `fsa_games`
- `fsa_agents`
- `fsa_operator_profiles`
- `fsa_players`
- `fsa_agent_game_access`
- `fsa_player_game_access`
- `fsa_credit_ledger`
- `fsa_audit_log`
- `fsa_backend_meta`

### Current audited RPC mutation surface

- `fsa_rpc_create_player`
- `fsa_rpc_adjust_credits`
- `fsa_rpc_reverse_credit`
- `fsa_rpc_update_player`
- `fsa_rpc_update_agent`
- `fsa_rpc_set_agent_games`
- `fsa_rpc_set_player_games`

### Current role model

The implemented production backend covers the **existing Founder → Agent → User** workflows.

The broader **Founder → Distributor → Agent → User** hierarchy remains a separate future scope and must not be falsely described as already implemented. Distributor creation/assignment/limits belong to that later project stage.

### Backend verification completed

Transactional production-database smoke tests have verified:

- an active Founder at `aal1` can read authorized data but administrative mutation is denied;
- direct execution of private mutation helpers by ordinary authenticated users is denied;
- an active Founder at `aal2` can create a test user, add virtual credits, reverse that adjustment, retain the original ledger history, and return to the expected balance;
- Agent game inheritance and ledger entry counts remain correct;
- tests are rolled back so synthetic smoke-test users/Agents are not retained;
- performance hardening added the missing F.S.A. foreign-key indexes and optimized Auth/RLS initialization-plan calls.

### Account-level Auth settings

Two settings cannot be truthfully represented as repository code:

1. Supabase security advisor currently reports **Leaked Password Protection disabled** for the shared Auth project. Enable it in the Supabase Auth dashboard if the project/plan exposes that option.
2. Agent invitation/password-recovery emails return to `https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/`. That URL must be present in Supabase Auth's allowed redirect URLs. The available connector does not expose a redirect-allowlist mutation, so this setting requires dashboard verification.

These are account-level Auth configuration checks, not a return to browser-local authority.

## 8. Current arcade/runtime state

Implemented and regression-tested in the existing runtime:

- 15 fish titles
- 20 slot titles
- Pulse / Spread / Rail weapon systems
- room-specific shot ladders
- correct displayed-vs-deducted shot cost
- tougher hard targets and scaled bosses
- hard-target/boss-only life bars
- four-gun landscape layout without large player panels
- P1 opaque/current; rivals translucent
- P4 upper station aligned with simulated origin
- simulated co-shooters with their own weapon/bet/virtual-credit state
- missions, Radar, combo/Fever, powers, Auto/Lock behavior
- safer two-step Auto Fire / Lock On activation and Auto spending ceiling
- title/slot filters
- service-worker/offline shell
- weak-network/device detection and low-data fallback
- background animation pause

## 9. Still separate/unstarted or future scope

Do **not** confuse completion of production backend #1 with completion of the entire F.S.A. roadmap. The following remain separate future projects/workstreams unless explicitly started:

- Distributor hierarchy backend (Founder → Distributor → Agent → User)
- real network multiplayer
- cloud/cross-device **player arcade account** system beyond the operator console
- production F.S.A. → EGM4000 telemetry API
- comprehensive final bespoke production art/sprite/audio pass for every title
- broad physical Android-device/store QA
- any real-money deposit/withdrawal/redemption system

Visual fidelity also remains an active product-quality target: the live fish/slot runtime should keep moving toward the approved cinematic reference images rather than being called visually final merely because the backend is production-authoritative.

## 10. Android / 2G / Data Saver requirement

F.S.A. must remain usable on weak mobile data and older Android hardware.

Mandatory architecture:

- Lite mode for Data Saver / 2G / slow-2G / reduced-motion / constrained-device signals when detectable
- lightweight HTML/CSS/JS/Canvas shell first
- no giant HD atlas in the critical startup path
- lazy-load richer backgrounds/sprites/audio/FX
- service-worker cache for the critical shell
- compressed WebP/AVIF-style production assets where supported
- dynamic resolution/particle/target scaling
- pause expensive effects when hidden
- touch-sized controls
- portrait-friendly lobby and landscape battle layouts
- HD is an enhancement, never a prerequisite to start playing

## 11. Continuation rules

Before changing F.S.A.:

1. refresh `main`;
2. read this checkpoint and `AGENTS.md`;
3. preserve F.S.A. vs EGM4000 separation;
4. preserve virtual/non-cash default behavior;
5. preserve low-data/Android startup;
6. make actual code/runtime changes rather than generating replacement mockups;
7. protect the production Founder Console authority boundary;
8. never expose a service-role key in browser code or GitHub;
9. run regression/CI checks before merging;
10. verify the exact GitHub Pages deployment SHA before claiming a release is live.

## 12. Definition of truth

A feature is only “done” when the implemented runtime/backend exists, its relevant automated checks pass, and the deployed environment is verified where tool access permits. Do not claim screenshots, prose, TODOs, or a branch-only prototype as production completion.
