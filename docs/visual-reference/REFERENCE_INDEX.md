# F.S.A. Visual Reference Index

This index accompanies [`CANONICAL_PROJECT_CHECKPOINT.md`](../../CANONICAL_PROJECT_CHECKPOINT.md).

The goal is not to preserve old mockups as decoration. The goal is to translate the approved visual language into the **actual lobby DOM, fish-game HUD, animation system, game art, slot cabinets, and responsive layouts**.

## Canonical reference set

The most recent approved ChatGPT F.S.A. / Fish Shooter Alliance concepts were generated under these names:

1. `neon_underwater_fish_shooter_arcade_brand_board`
2. `neon_atlantis_fish_shooter_arcade_lobby`
3. `neon_atlantis_fish_shooter_lobby`
4. `neon_atlantis_kraken_arcade_battle`
5. `abyssal_kraken_fish_shooter_arcade`
6. `ocean_legends_jackpot_lobby`
7. `f.s.a._ocean_legends_slot_collection`

When ChatGPT Work has project-image access, use these images directly. When it does not, implement the compositions below literally.

## Existing repository visual anchors

- [`../../assets/fsa-lobby.svg`](../../assets/fsa-lobby.svg) — lobby composition anchor
- [`../../assets/fsa-gameplay.svg`](../../assets/fsa-gameplay.svg) — fish-table HUD composition anchor
- [`../../assets/fsa-boss-event.svg`](../../assets/fsa-boss-event.svg) — boss/event treatment
- [`../../assets/reef-run-hd-battle.webp`](../../assets/reef-run-hd-battle.webp) — Reef Run HD battle direction
- [`../../assets/fsa-fish-hd-atlas.webp`](../../assets/fsa-fish-hd-atlas.webp) — fish-library art anchor
- [`../../assets/fsa-slots-hd-atlas.webp`](../../assets/fsa-slots-hd-atlas.webp) — slot-library art anchor
- [`../../assets/captain-reef.jpg`](../../assets/captain-reef.jpg) — character/key-art direction
- [`../../assets/fsa-mark.svg`](../../assets/fsa-mark.svg) — F.S.A. mark

## Reference A — Main lobby

**First-glance test:** it should look like a premium neon Atlantis arcade, not a developer dashboard.

Required composition:

- submerged Atlantis skyline fills the top environment
- large metallic-gold F.S.A. trident/logo centered in the masthead
- player portrait / username / level / XP on the left of the account strip
- coin, gem and secondary-resource balances across the account strip
- VIP / Inbox / Events / Missions / Rewards / Settings style utilities
- large category bar below: All Games / Fish Games / Slots / Tournament / Jackpot / New / Boss Hunt / Ocean Worlds / Favorites
- huge illustrated featured panel (Ocean Legends / dragon / leviathan / current event)
- adjacent jackpot and limited-event cards
- Daily Missions card with progress and claim state
- Featured Fish Games row with large illustrated cards
- Featured Slots row with large illustrated cabinets
- Ocean Worlds / Boss Hunt / Tournament or equivalent lower sections
- blue/cyan frame lighting + warm gold reward accents + red/orange boss accents

## Reference B — Fish game library

Required composition:

- left navigation/category rail on wide screens
- 15 illustrated fish-game cards visible in a dense grid
- each card has unique creature/world key art
- 1–4-player badge
- gameplay tag(s): Boss / Event / Treasure / New / Hot / High Bet / Classic / Weather / etc.
- search + filters above the grid
- right-side Daily Missions / event / jackpot modules on desktop
- Bronze Reef / Silver Current / Gold Abyss room cards along the lower section
- room cards show seats, shot range, difficulty and distinct environment art

## Reference C — Fish battle / boss table

This is the most important runtime reference.

Required composition:

- game fills the viewport in landscape
- animated underwater city/reef environment, not an empty canvas
- huge boss can occupy the central third of the screen
- red/orange boss banner and HP bar across the top center
- boss multiplier/phase/enrage indicator
- mission panel on the left
- Ocean Radar / minimap below missions
- Ocean Fever / combo panel visible during active play
- dense multi-depth fish schools around the boss
- visible multipliers on targets
- lock-on reticle
- critical / mega-win / chain / treasure text bursts
- live rewards / table feed / room panel on right
- four player weapon stations along bottom/edges
- each player station contains balance, selected gun, bet-per-shot, +/- bet controls, auto-fire state and power shortcuts
- center power bar contains powers such as Freeze, Lightning, Bomb, Net/Tornado/Gold Rain depending on table
- Fever bar / event meter above the central brand area

## Reference D — Gun art and behavior

### Pulse Cannon

- electric-blue/cyan
- rapid small projectiles
- lowest shot cost
- compact agile barrel

### Spread Blaster

- red/orange
- visibly larger multi-barrel / spread weapon
- medium shot cost
- fires multiple projectiles / crowd-control pattern

### Rail Harpoon

- gold/green or gold/white premium heavy frame
- highest shot cost
- slow charge / piercing beam or heavy harpoon
- visually dominates boss-targeting moments

All three must have different silhouettes, muzzle effects and projectile behavior.

## Reference E — Slot lobby / slot cabinets

Required composition:

- same Atlantis universe as the fish lobby
- blue-gold premium cabinet borders
- large readable game title art
- unique character/creature/treasure centerpiece per slot
- five-reel cabinet view once opened
- custom symbols rather than one universal symbol set
- bet / spin / auto controls in a fixed lower control deck
- bonus / wild / scatter / free-spin / jackpot presentation visually distinct by title

## Fidelity rules

Do:

- create original F.S.A. art inspired by the approved concepts
- use layered Canvas/WebGL/CSS animation and lazy-loaded sprites where useful
- preserve HUD density and visual hierarchy
- keep adult premium cyber-aquatic tone
- design individual title identities

Do not:

- use emoji as the primary normal/HD game art
- make every title the same game with a different gradient
- use giant static screenshots as a substitute for working UI
- reduce the lobby to a handful of plain cards
- remove the 2G/Data Saver path to gain visual quality
- copy proprietary third-party Fire Kirin / Juwa / Panda Master art, code, logos or hidden math

## Acceptance screenshots to capture during QA

Work should capture/inspect at minimum:

1. desktop main lobby
2. Android portrait lobby
3. Android landscape Reef Run
4. Reef Run boss phase
5. Dragon Depths boss phase
6. a crowded Coral Chaos / Storm Seas table
7. weapon switching among all 3 guns
8. Bronze / Silver / Gold room selection
9. slot lobby
10. one open five-reel slot in a feature state
11. Lite / 2G mode
12. Founder Console mobile view

A release should not be called visually complete until these screens are compared against this index and the canonical checkpoint.
