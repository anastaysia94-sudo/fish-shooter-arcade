# F.S.A. — CANONICAL PROJECT CHECKPOINT

> **READ THIS FIRST in ChatGPT Work, Codex, Copilot, Grok, Perplexity, or any other continuation environment.**
>
> This file is the canonical product checkpoint for **Fish Shooter Arcade (F.S.A.)**. When older prompts, mockups, legacy files, or prior notes conflict with this document, use this document plus the current `main` branch as the source of truth.

## 1. Canonical repository and branch

- Repository: `https://github.com/anastaysia94-sudo/fish-shooter-arcade`
- Canonical branch: `main`
- Baseline inspected before this checkpoint: `d7d1f241ca52f7b4a60500610d6004b487c4ebbc`
- That baseline is the **v8 cutover** state and includes `fsa-v8.js` / `fsa-v8.css` plus earlier engines and assets retained for migration/reference.
- Always `git pull` / refresh `main` before making changes. Do not overwrite newer Work-session commits with an older local snapshot.
- Public Pages target: `https://anastaysia94-sudo.github.io/fish-shooter-arcade/`

## 2. Product identity

**F.S.A. = Fish Shooter Arcade / Fish Shooter Alliance** under **SmartPickShop Holdings**.

F.S.A. is its own owned playable arcade product. It is **not EGM4000**.

- **F.S.A.** = playable fish-shooter + slot-style virtual arcade + operator/founder control plane.
- **EGM4000** = separate analytics/coaching/research product that may consume exact F.S.A. telemetry through an explicit API boundary.
- **Founder Console** = control plane for F.S.A. accounts, agents, virtual credits, game access, moderation, audit, and configuration.
- Keep the codebases/logical products separate. Do not merge F.S.A. into EGM4000.

## 3. Non-negotiable visual directive

**The actual live runtime must look and operate like the approved F.S.A. / Fish Shooter Alliance reference images. Do not stop at concept art. Do not merely place a hero image over a simple game. Build the interface, interaction model, density, hierarchy, game feel, and effects shown in the references.**

The approved visual language is:

- cinematic neon Atlantis / underwater megacity
- metallic **gold F.S.A. trident branding**
- saturated cyan / electric blue / violet / coral / molten-orange effects
- adult, sharp, premium arcade tone — not childish, flat, sparse, or emoji-first
- dense fish-table cabinet presentation with readable information hierarchy
- large illustrated fish, sharks, dragons, jellyfish, rays, turtles, sea monsters, mechanical creatures, treasure, coral, ruins, lightning, beams, coins and boss effects
- dark ocean depth behind luminous HUD framing
- high-energy but organized UI: many systems visible without feeling like a generic developer dashboard

### Canonical screen structure from the latest references

#### Main arcade lobby

The live main page should visually resemble a premium online arcade lobby:

- large centered gold **F.S.A. Fish Shooter Arcade / Fish Shooter Alliance** masthead
- underwater Atlantis skyline / statues / sharks in the header environment
- player identity/avatar + level/XP
- balances/resources strip
- top navigation for All Games / Fish Games / Slots / Events / Missions / Boss Hunt / Rewards / Settings or equivalent
- large cinematic **Ocean Legends / featured-event** hero
- adjacent jackpot/event cards
- daily missions panel
- dense, illustrated game-card grid rather than plain cards
- fish-game and slot sections that feel like one connected premium arcade
- Bronze Reef / Silver Current / Gold Abyss room selection integrated into the flow
- mobile layout must preserve the same visual identity rather than collapsing into a generic list

#### Fish-game library

The fish-game catalog should include:

- side or top filters: All / Featured / New / Jackpot / Boss Hunt / Ocean Worlds / Classic / Multiplayer / Favorites
- 15 illustrated fish-title cards with distinct art and identity
- 1–4 player indicators
- tags such as Boss / Event / Treasure / High Bet / New / Hot where appropriate
- daily missions / event / jackpot side modules on wide screens
- room selection cards with obvious shot range / difficulty / seats

#### Fish-table gameplay

The actual game table should operate and visually present like the approved battle references:

- full-screen underwater battlefield
- large animated targets and dense schools crossing multiple depths
- top-center **boss banner + HP bar + boss phase / multiplier**
- mission stack on the left
- **Ocean Radar / minimap**
- combo and Ocean Fever system
- right-side live rewards / table feed / room info
- four player stations around the bottom/edges
- three visually distinct gun systems
- per-shot value controls visible at the player station
- auto-fire and lock-on
- special powers in a central power bar
- visible target multipliers
- critical-hit / chain / treasure / feature event bursts
- boss entrances, phase transitions and finishing-shot ownership
- coins/treasure/energy effects that feel satisfying without blocking play
- all HUD elements remain usable on Android touch devices

#### Slot annex

The 20 slot-style games should visually resemble the F.S.A. slot references:

- premium blue/gold/coral cabinet frames
- unique background/key art per title
- custom symbol set per title
- five-reel presentation
- bet controls, spin, auto, balance
- visible wild/scatter/bonus identity
- jackpot / bonus / free-spin style presentation where appropriate
- animated reel/symbol/feature effects
- no generic identical slot skins with only the title changed

## 4. Visual implementation anchors already in the repository

Use these repo assets as implementation anchors and replace/improve them when better production art is added:

- `assets/fsa-lobby.svg`
- `assets/fsa-gameplay.svg`
- `assets/fsa-boss-event.svg`
- `assets/fsa-fish-hd-atlas.webp`
- `assets/reef-run-hd-battle.webp`
- `assets/fsa-slots-hd-atlas.webp`
- `assets/captain-reef.jpg`
- `assets/fsa-mark.svg`

The latest ChatGPT-generated F.S.A. reference images used to derive this specification include the visual concepts named:

- `neon_underwater_fish_shooter_arcade_brand_board`
- `neon_atlantis_fish_shooter_arcade_lobby`
- `neon_atlantis_fish_shooter_lobby`
- `neon_atlantis_kraken_arcade_battle`
- `abyssal_kraken_fish_shooter_arcade`
- `ocean_legends_jackpot_lobby`
- `f.s.a._ocean_legends_slot_collection`

If ChatGPT Work has access to the project image history, use those exact images as the primary visual references. If it does not, the detailed screen specifications in this checkpoint are authoritative and should be implemented literally.

## 5. Required fish games — exactly 15

All 15 must be real playable tables on the owned F.S.A. engine, not renamed clones with only colors changed.

1. **Reef Run** — balanced flagship table; colorful reef; treasure events; Kraken Lord.
2. **Dragon Depths** — inferno/dragon world; fire chains; Inferno Dragon; aggressive boss phases.
3. **Pirate's Plunder** — shipwrecks, treasure chests, bomb events, Dread Kraken, gold-rush feature.
4. **Atlantis Rising** — lost-city / relic hunt; vortex/trident effects; Atlantis Guardian.
5. **Ice Tide** — glacier world; freeze fish; slow-field mechanics; Frost Leviathan.
6. **Lava Reef** — volcanic ocean; magma bursts; heat hazards; Magma Behemoth.
7. **Storm Seas** — lightning-heavy table; chain attacks; weather events; Thunder Leviathan.
8. **Jade Dragon** — emerald temple; precision play; elite targets; Jade Dragon King.
9. **Neon Ocean** — cyber-ocean; fastest pacing; Fever emphasis; neon feature chains.
10. **Ancient Ruins** — relic/artifact table; ruins guardians; artifact beam events.
11. **Mecha Marine** — armored fish / machines; EMP/armor systems; Leviathan X.
12. **Coral Chaos** — dense colorful schools; crowd-control emphasis; spread-gun friendly.
13. **Kraken's Lair** — hazard/tentacle survival; frequent Kraken encounters; high-pressure table.
14. **Treasure Trials** — chest/coin/vault features; treasure multipliers; Poseidon-style guardian boss.
15. **Boss Rush** — short waves, frequent elite/boss encounters, endgame pacing and highest spectacle.

### Shared advanced fish-table systems

Every table should support the common engine while applying title-specific tuning/art/behavior:

- 1–4 player table presentation
- simulated co-shooters until real multiplayer is implemented
- Bronze Reef / Silver Current / Gold Abyss room tiers
- moving schools, formations and depth lanes
- visible target multipliers
- common / fast / armored / chain / vortex / treasure / bomb / laser / drill / elite / boss target classes
- boss phases, enrages, entrances and finishing-shot ownership
- missions
- Ocean Radar
- combo / hit streak
- Ocean Fever
- lock-on
- auto-fire
- hold-to-fire on Android/touch
- feature-event announcements
- treasure bursts / chain reactions / screen effects
- exact owned-game telemetry with provenance

## 6. Three-gun requirement

The player must be able to switch between **three genuinely different weapons**, each with a different cost-per-shot and gameplay role.

### Pulse Cannon

- lowest cost per shot
- fast precision fire
- best for common / fast targets
- base ladder: **2 / 5 / 10 / 20 / 50** virtual credits per shot

### Spread Blaster

- medium cost per trigger
- multi-projectile / wide coverage
- crowd-control and school clearing
- base ladder: **10 / 20 / 50 / 100 / 200** virtual credits per trigger

### Rail Harpoon

- highest cost per shot
- slower heavy piercing / beam-style attack
- strongest against armor, elites and bosses
- base ladder: **50 / 100 / 200 / 500 / 1000** virtual credits per shot

Room tiers may expand/scale those ranges, but the ordering must remain clear: **Pulse < Spread < Rail** in cost and destructive role.

Gun selection must visibly change the weapon model, muzzle effect, projectile behavior, recoil/charge treatment and HUD accent — not only a label.

## 7. Required slot games — exactly 20

All 20 remain original F.S.A. virtual-credit mini games and each needs its own art direction, symbol set, background, frame and bonus identity.

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

### Slot requirements

- five reels
- responsive reel animation
- unique symbol set per title
- title-specific wild/scatter/bonus visual identity
- bet +/- and spin
- auto-spin option
- payline / win visualization
- bonus/free-spin-style feature presentation where used
- jackpot-style UI may be simulated with virtual credits only
- title-specific music/SFX hooks can be added later, but the architecture should support them
- no cash deposits, withdrawals, redemption or real-money wagering in the default build

## 8. Founder Console requirements

Founder Console is the F.S.A. operator/control plane. Current `/admin/` code is a **browser-local prototype** and is not yet a production authority.

### Required hierarchy

**Founder / Root → Distributor → Agent → User**

Current code already demonstrates Agent/User workflows, virtual credits, game access, cashier/moderator separation, audit and reversal concepts. Production work must add the full hierarchy and enforce it server-side.

### Founder/root capabilities

- create / edit / suspend / reactivate distributors
- create / edit / suspend / reactivate agents
- create / edit / suspend / reactivate users
- assign agents to distributors
- assign users to agents
- add/remove virtual credits
- append-only credit ledger
- compensating reversals instead of deleting/rewriting history
- per-distributor and per-agent credit ceilings
- cashier permission separate from moderator permission
- per-role game-access controls for all 15 fish + 20 slots
- user notes and support/moderation cases
- low-balance warnings
- search/filter/export
- bulk user creation
- audit trail for every administrative write
- session/event/game configuration controls
- owned-game difficulty/config experiment controls with audit history

### Agent capabilities

When permitted by Founder:

- create/manage their own users
- add/remove virtual credits within enforced ceiling/authority
- suspend/reactivate their own users
- manage allowed game access within inherited limits
- see their own user/credit activity
- no access to other agents' users
- no privilege escalation

### Production security requirements

Move authority from `localStorage` to a server/database:

- secure authentication
- password hashing
- secure sessions/cookies
- MFA for Founder/admin
- CSRF protection
- rate limiting
- server-enforced RBAC
- immutable/append-only ledger semantics
- idempotency keys for credit/event writes
- audit logging
- account lockout/recovery
- concurrency/version checks
- database migrations
- backups + restore drill
- privacy/export/delete-account operations where applicable

## 9. Current inspected repo state

As of the baseline commit named above:

### Present in code

- `fsa-v8.js` defines all **15 fish titles**.
- `fsa-v8.js` defines all **20 slot titles**.
- `fsa-v8.js` defines **Pulse Cannon / Spread Blaster / Rail Harpoon** with different bet ladders and weapon behavior.
- `fsa-v8.js` defines **Bronze Reef / Silver Current / Gold Abyss**.
- v8 contains a Data Saver / 2G network check via `navigator.connection` / `effectiveType`.
- the gameplay loop includes fish spawning, target multipliers, boss spawning, auto/lock behavior, combo/Fever concepts and multiple powers.
- local player/profile state currently persists via browser storage.
- `/admin/app.js` contains Agent/User management, virtual-credit changes, reversals, cashier/moderator separation, game access, bulk creation, audit and export concepts.
- GitHub Pages is the current public deployment route.

### Still not acceptable as “finished”

- visual fidelity is still behind the approved reference images
- many gameplay targets still use lightweight/icon-like rendering instead of production-quality animated creatures
- all 15 tables need individually art-directed live backgrounds, target sets, bosses, guns and FX
- the lobby must be rebuilt so the **actual DOM/runtime** matches the cinematic reference composition, not merely show reference images
- the slots need production-quality individual cabinets/symbols/animations/features
- Founder Console is not yet server-authenticated/authoritative
- real multiplayer is not implemented; current shared-table feel is simulated
- cloud persistence/cross-device player state is not production-complete
- production telemetry API boundary to EGM4000 still needs server-side implementation
- broad real-device Android QA still needs to be performed

## 10. Android / 2G / Data Saver requirement

F.S.A. must remain usable on weak mobile data and older Android hardware.

### Mandatory architecture

- **Lite mode** automatically for `saveData`, `2g`, `slow-2g`, reduced-motion or constrained-device conditions when detectable
- no giant HD atlas in the critical first-load path
- lightweight HTML/CSS/JS/Canvas shell first
- lazy-load HD backgrounds, animated sprite sheets, audio and premium FX only after the table becomes usable
- service-worker caching for the critical shell
- aggressive image compression (WebP/AVIF where supported)
- resolution/particle/fish-count scaling
- pause expensive effects when hidden/backgrounded
- avoid blocking render on optional fonts or large art
- touch targets sized for phones
- portrait lobby + landscape battle layouts where appropriate
- continue to function with cached shell when the network becomes intermittent

### Quality tiers

- **Lite / 2G:** procedural/simple sprites, fewer particles, lower target cap, smaller textures, reduced animation rate
- **Balanced:** normal mobile default
- **HD:** lazy-loaded richer backgrounds, sprite animation, glow, particles, richer boss/gun FX

HD must enhance the game; it must never be required to start playing.

## 11. EGM4000 boundary

F.S.A. may expose perfect owned telemetry to EGM4000, but they remain separate products.

Desired flow:

`F.S.A. exact telemetry → explicit versioned API/events → EGM4000 normalized gameplay events → metrics/patterns/coaching/replay/experiments`

Do not make EGM4000 silently mutate F.S.A. rules. Any owned-game experiment/config change must be an explicit Founder-controlled action with audit history.

## 12. Virtual-credit / legal boundary

Default F.S.A. remains **virtual/non-cash entertainment**.

Do not claim or implement a production real-money gambling/cash-redemption system without an explicit separate legal/licensing/jurisdiction project and approval gate.

The default product must not offer:

- cash deposits
- cash withdrawals
- cash redemption
- real-money prizes
- claims of guaranteed profit

## 13. Definition of “the runtime matches the reference images”

A build is **not** complete merely because it has blue gradients, neon borders, or a concept image.

The build is visually acceptable only when:

1. the lobby composition, density and hierarchy resemble the approved F.S.A. lobby references at first glance;
2. every fish table opens into a battle screen with the boss/mission/radar/4-seat/power/Fever structure shown in the references;
3. the three guns are visibly and mechanically distinct;
4. targets/bosses/backgrounds look like premium game art rather than emoji or debug primitives in normal/HD mode;
5. each of the 15 fish games has a clearly distinct world and boss identity;
6. the 20 slot games look individually authored rather than reskinned clones;
7. mobile/2G fallback preserves gameplay without forcing HD downloads;
8. CI validates catalogs, syntax, low-data path and critical interactions;
9. GitHub Pages deployment succeeds;
10. the live URL is manually checked on phone and desktop before calling the visual rebuild complete.

## 14. Next Work-session priority

**Do not generate more standalone concept images unless an implementation asset is genuinely missing.**

The next Work task should operate directly on the current `main` branch and:

1. compare the live v8 DOM/CSS/game runtime against this checkpoint;
2. rebuild the main lobby to the approved cinematic F.S.A. composition;
3. rebuild the fish battle shell around the approved boss/radar/missions/4-seat/guns/powers/Fever layout;
4. replace icon/emoji-first targets with proper animated art assets in HD mode while retaining Lite fallback;
5. art-direct all 15 fish titles individually;
6. art-direct all 20 slot titles individually;
7. test syntax/interaction/catalog/low-data behavior;
8. fix failures;
9. push to GitHub;
10. deploy Pages and verify the live site.

**Primary directive:** MAKE THE ACTUAL ARCADE LOOK AND OPERATE LIKE THE APPROVED F.S.A. / FISH SHOOTER ALLIANCE REFERENCES — NOT JUST THE MOCKUPS.
