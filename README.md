# F.S.A. — Fish Shooter Arcade

**SmartPickShop Holdings · Multi-Game Arcade v2**

![Captain Reef — F.S.A. key art](assets/captain-reef.jpg)

F.S.A. is a standalone owned virtual arcade with **15 original fish-shooter tables** and **20 original slot-style mini games**. The product uses the approved cyber-aquatic / nautical-steampunk visual direction, persistent local virtual credits, touch/mouse controls, PWA support, and exact telemetry for the owned fish-game engine.

## Live site

GitHub Pages deploys automatically from `main` after pushes:

`https://anastaysia94-sudo.github.io/fish-shooter-arcade/`

## Fish-shooter catalog

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

Each title runs on the owned F.S.A. engine but has a different theme, spawn rate, target HP model, reward tuning, speed profile, boss, special-event identity, and preferred weapon style.

## Slot catalog

20 original five-reel, three-row virtual-credit mini games are included, from Ocean Fortune and Treasure Reels through Wild Pearls and Treasure Temple. They are entertainment-only simulations and do not provide deposits, withdrawals, cash prizes, or redemption.

## Core mechanics

- Mouse/touch aiming and shooting
- Cannon levels 1–10
- Per-shot virtual-credit cost
- Small, medium and large target tiers
- Boss meter and boss encounters
- Auto-fire and lock-on tools
- Exact owned-game telemetry (`fsa.telemetry.v2`)
- JSON telemetry export
- Persistent virtual-credit wallet and XP/level state
- Responsive desktop/tablet/mobile lobby
- Offline-capable PWA shell
- 20 playable five-reel slot-style mini games

## Architecture boundary

This repository is **F.S.A.-only**. EGM4000 and Founder Console remain separate products/codebases. F.S.A. telemetry is designed so EGM4000 can later consume owned-game events through an explicit interface without merging the products.

## Safety / integrity

F.S.A. uses **virtual/non-cash credits only**. No real-money deposits, withdrawals, cash prizes, or gambling operation is enabled by this release. Third-party services are not modified or bypassed, and no proprietary third-party game logic or assets are copied.

## Validation

GitHub Actions validates the complete 15-fish / 20-slot catalog, PWA files, required assets, `fsa.telemetry.v2`, and JavaScript syntax. GitHub Pages deployment is automated on pushes to `main`.
