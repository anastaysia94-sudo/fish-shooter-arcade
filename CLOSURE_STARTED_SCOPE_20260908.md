# F.S.A. Started-Scope Closure — 2026-09-08

This checkpoint closes the browser-side F.S.A. work that was already implemented or partially implemented when the closure pass began. It intentionally does **not** start separate production systems that had not yet been implemented in this repository.

## Closed in this pass

### Fish Shooter Arcade gameplay

- 15 fish tables retained in the canonical v9 runtime.
- 20 virtual-credit slot titles retained in the canonical runtime.
- Pulse Cannon, Spread Blaster and Rail Harpoon use distinct mechanics and room-specific per-shot ladders.
- The displayed shot amount is the amount deducted for the shot. Legacy hidden weapon-cost multiplication was removed.
- Bronze Reef, Silver Current and Gold Abyss now alter usable shot ladders and durability/reward pressure.
- Four table guns remain visible without four large player information boxes covering landscape gameplay.
- P1 is fully opaque and interactive. Rival guns are translucent and non-interactive. P4 occupies the upper table position, matching its simulated shot origin.
- Regular fish do not display life bars. Hard targets and bosses do.
- Existing hard targets were made meaningfully more durable and use their base HP plus explicit hard-target multipliers.
- Boss HP now scales by room, title and wave rather than using the former fixed ten-million-HP placeholder.
- AI table players have their own selected weapons, shot values and virtual-credit balances.
- Rival kills no longer advance the current player's boss/hard-target missions.
- Ocean Fever mission state is connected to actual Fever activation.
- Auto Fire and Lock On use deliberate two-step activation.
- Auto Fire has a finite per-activation spending ceiling and shuts off when the ceiling or available credits are reached.
- Changing gun or shot value turns Auto Fire off.
- Existing lobby fish/slot filters are wired.
- Existing slot runtime now has title-specific symbol sets, improved simple win evaluation and Auto Spin.
- Low-data mode includes Data Saver, 2G/slow-2G, reduced-motion and constrained-device signals.
- Battle animation pauses when the document is hidden.
- Canvas targets use lightweight procedural creature drawing rather than relying solely on emoji glyphs during gameplay.

### Founder Console browser prototype

- State migrated from v1 to v2 without deleting legacy browser data.
- Founder and selected-Agent scopes are implemented in the existing browser prototype.
- Agent views only see their own users, ledger entries and scoped audit activity.
- Cashier permission remains separate from moderator permission and is enforced for virtual-credit changes.
- Suspended Agents cannot perform normal credit operations.
- Per-Agent aggregate virtual-credit ceilings are enforced.
- User balances cannot go below zero.
- Ledger corrections use compensating entries; original ledger history remains and an original entry can only be reversed once.
- User game access cannot exceed inherited Agent game permissions.
- Removing an Agent game reconciles affected user access.
- Duplicate usernames are blocked.
- User reassignment validates destination Agent ceiling headroom.
- Bulk creation validates duplicate names and total opening-balance ceiling requirements before creation.
- Founder/Agent exports are scoped appropriately.
- Existing dashboard, users, agents, credits, game access and audit views were made responsive and role-aware.

### Offline / PWA integrity

- Root arcade and `/admin/` navigation fallbacks are cached separately.
- The Founder Console shell is included in the service-worker cache.
- The prior possibility of an admin navigation response replacing the root arcade navigation fallback is removed.

## Regression gates

The repository now contains:

- `gameplay-selftest.js`
- `admin/logic-selftest.js`

The v9 and full release GitHub Actions workflows execute JavaScript syntax checks plus both behavioral regression suites.

The closure branch passed:

- Validate F.S.A. v9 Gameplay, run `34250351374`
- Validate F.S.A. Release, run `34250351538`

## Explicitly outside this closure

The following were not started by this pass because they are separate, previously unstarted production work rather than incomplete pieces of the browser prototype:

- production server authentication, database authority, MFA and server-enforced RBAC
- production Founder → Distributor → Agent → User backend hierarchy
- real network multiplayer
- cloud/cross-device account persistence
- production EGM4000 telemetry API
- comprehensive new binary production art/sprite/audio creation for every title
- physical Android-device/store QA
- real-money wagering, deposits, withdrawal or redemption

The default F.S.A. product remains virtual/non-cash entertainment only.
