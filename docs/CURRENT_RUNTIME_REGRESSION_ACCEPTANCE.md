# F.S.A. Current Runtime Regression Acceptance

This is the release-gate checklist for the browser runtime currently shipped by `index.html` + `fsa-v9.js`. It covers the executable arcade runtime, its HTML/CSS/PWA shell, the existing low-data/2G behavior, and the user-facing virtual-credit safety contracts. It does not claim to replace physical-device certification, browser-vendor testing, or Founder Console backend production validation.

A box is complete only when the behavior is enforced by executable CI, not merely described in prose.

## Canonical runtime and boot

- [x] `index.html` loads exactly the current `fsa-v9.js` gameplay runtime.
- [x] legacy runtime generations are prevented from silently becoming executable again.
- [x] every statically referenced runtime DOM ID exists in the live HTML shell.
- [x] inline HTML controls resolve to functions exposed by the current runtime.
- [x] the 1280×720 canvas coordinate contract matches pointer-coordinate conversion.
- [x] current runtime JS and service worker syntax are CI checked.

## Catalog and progression

- [x] 15 fish-shooter games are enforced.
- [x] 20 virtual-credit slot mini games are enforced.
- [x] three cannon systems are enforced.
- [x] three room tiers are enforced.
- [x] twelve target archetypes are enforced.
- [x] every room/gun shot-value ladder is regression tested.
- [x] boss HP room/game/wave scaling is regression tested.
- [x] entering a room resets volatile run state and seeds the expected normal-mode table.

## Shot and reward accounting

- [x] a player shot debits exactly the selected shot value.
- [x] gun cooldown rejects an immediate duplicate shot.
- [x] Spread Blaster emits three projectiles.
- [x] insufficient balance rejects a shot without debiting credits.
- [x] room reward formula is regression tested.
- [x] rival rewards do not alter the user's profile balance.
- [x] rival kills do not advance user missions.
- [x] player boss kills advance the boss mission.
- [x] Ocean Fever doubles eligible player rewards.
- [x] reaching the Fever threshold activates the Fever window and mission.

## Automation and targeting safety

- [x] Auto Fire requires two-step confirmation.
- [x] Auto Fire has a finite 50-shot-value spend ceiling.
- [x] Auto Fire stops before exceeding that ceiling.
- [x] weapon changes disable Auto Fire.
- [x] shot-value changes disable Auto Fire.
- [x] Lock On requires two-step confirmation.
- [x] Lock On can be explicitly switched off.
- [x] Lock On prioritizes boss > hard target > ordinary multiplier.
- [x] exiting gameplay stops Auto Fire and Lock On.

## Powers and slots

- [x] Freeze creates a finite future freeze window.
- [x] Tornado Clear excludes bosses while removing eligible ordinary targets.
- [x] slot bet floor is 10 virtual credits.
- [x] slot bet ceiling is 5,000 virtual credits.
- [x] a non-winning paid spin debits exactly one bet.
- [x] five-symbol line payout math is regression tested.
- [x] insufficient slot balance prevents a debit.
- [x] closing the slot modal stops Auto Spin.

## Persistence and lifecycle

- [x] profile state saves to the current `fsa.v9.profile` storage key.
- [x] malformed persisted JSON falls back safely instead of preventing runtime boot.
- [x] hiding the tab pauses the runtime and clears hold-fire work.
- [x] returning to a visible active game schedules animation again.

## Mobile, accessibility, low-data and offline

- [x] phone breakpoint remains present.
- [x] short-landscape breakpoint remains present.
- [x] gameplay canvas uses `touch-action:none` so browser panning does not steal active gameplay gestures.
- [x] reduced-motion CSS remains enforced.
- [x] low-data / 2G behavioral regression suite remains release-blocking.
- [x] low-data source/offline byte budgets remain release-blocking.
- [x] PWA manifest remains installable/standalone.
- [x] service worker registration remains present.
- [x] root arcade and Founder Console navigation maintain separate offline fallbacks.
- [x] current arcade JS/CSS/manifest remain in the cached shell.
- [x] current playable gameplay shell does not gain a third-party JS/CSS dependency.

## Product-safety disclosure

- [x] live page retains explicit `virtual/non-cash` language.
- [x] live page retains `no cash redemption` language.
- [x] public guide remains linked and retains virtual-credit disclosure.

## CI enforcement

- [x] dedicated `F.S.A. Current Runtime Regression` workflow executes the full runtime suite.
- [x] `Validate F.S.A. v9 Gameplay` executes the current runtime behavior + contract suites.
- [x] `Validate F.S.A. Release` executes the current runtime behavior + contract suites.
- [x] the existing low-data/2G suites execute alongside the broader runtime gates.
- [x] runtime-relevant file changes trigger the dedicated regression workflow on pull requests and `main` pushes.

## 100% completion rule

This scope reaches **100% complete** only when:

1. the hardening branch passes the dedicated Current Runtime Regression workflow, the v9 gameplay workflow, and the full release workflow;
2. the pull request is merged to `main`;
3. the same gates pass on the merged `main` commit; and
4. the GitHub Pages deployment for that merged commit succeeds.

Physical handset/network certification and backend production-environment certification are separate release-QA scopes and are not disguised as automated browser-runtime regression coverage.
