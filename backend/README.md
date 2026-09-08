# F.S.A. Founder Console Production Backend

This directory is the canonical source for the production backend introduced for the existing Founder → Agent → User control plane.

## Production authority

Founder Console data authority is **Supabase Auth + PostgreSQL + Row Level Security + audited RPCs**. `localStorage` is no longer authoritative for Agents, users, virtual-credit balances, permissions, ledger history, or audit history. The UI can still read an old browser prototype record solely so the operator can download a legacy backup.

The default F.S.A. product remains **virtual/non-cash entertainment**. This backend does not implement deposits, withdrawals, cash redemption, or real-money wagering.

## Authentication and sessions

- Supabase Auth provides operator identity and password verification.
- The static GitHub Pages client uses the public/publishable Supabase key. This is intentional; RLS is the security boundary.
- The service-role credential is never embedded in the browser or repository. It exists only in the Supabase Edge Function runtime.
- Password recovery uses `resetPasswordForEmail` and the PKCE recovery flow.
- Founder/Agent status is resolved from `fsa_operator_profiles`; the old UI role simulator has been removed.
- MFA uses Supabase TOTP enrollment/challenge APIs.
- Administrative mutations require an `aal2` JWT at the database layer, not merely a disabled/enabled button in the UI.

Because the Founder Console is a static SPA, Supabase manages the browser access/refresh token session rather than a custom application cookie. Authorization is bearer-token based, which avoids ambient cookie CSRF; database RLS and `aal2` checks remain authoritative even if the UI is bypassed.

## Tables

- `fsa_games` — canonical 15 fish + 20 slot catalog.
- `fsa_agents` — authenticated Agent records, status, cashier/moderator authority, credit ceilings.
- `fsa_operator_profiles` — authenticated Founder/Agent role mapping.
- `fsa_players` — Agent-owned virtual-credit users.
- `fsa_agent_game_access` — games an Agent may expose.
- `fsa_player_game_access` — games a user may access, constrained by Agent access.
- `fsa_credit_ledger` — append-only virtual-credit history.
- `fsa_audit_log` — immutable administrative audit history.
- `fsa_backend_meta` — backend/schema authority marker.

## Row Level Security

All F.S.A. public tables have RLS enabled. Authenticated reads are scoped server-side:

- Founder can read the complete F.S.A. operator dataset.
- Agent can read only their own Agent record, users, access rows, ledger, and audit scope.
- unauthenticated clients cannot read F.S.A. operator data.
- browser clients do not receive direct INSERT/UPDATE/DELETE table grants for administrative records.

## Audited mutation surface

Authenticated administrative writes use these PostgreSQL RPCs:

- `fsa_rpc_create_player`
- `fsa_rpc_adjust_credits`
- `fsa_rpc_reverse_credit`
- `fsa_rpc_update_player`
- `fsa_rpc_update_agent`
- `fsa_rpc_set_agent_games`
- `fsa_rpc_set_player_games`

Each mutation re-checks identity, operator status, role/scope, Agent status, applicable cashier/moderator permission, and `aal2` MFA in PostgreSQL. Credit mutations enforce non-negative balances and Agent credit ceilings.

`fsa_credit_ledger` and `fsa_audit_log` have triggers rejecting UPDATE/DELETE. Reversals are compensating entries and can only reverse an original entry once.

## Founder-only Edge Function

`supabase/functions/fsa-founder-admin/index.ts` is deployed as `fsa-founder-admin` with JWT verification enabled. It is used for operations that require Supabase Auth admin authority, currently authenticated Agent invitation/provisioning.

The function:

1. validates the caller's JWT,
2. requires `aal2`,
3. verifies the caller is an active Founder,
4. invites or resolves the Agent Auth account,
5. creates the Agent/operator mapping,
6. assigns valid game access,
7. records an audit event.

The Supabase service-role key is read only from the Edge runtime environment.

## Migrations

Migration files mirror the production database changes:

1. `20260908_fsa_founder_console_backend_v1.sql` — schema, functions, RPCs and RLS.
2. `20260908_fsa_harden_trigger_search_paths.sql` — fixed trigger-function search paths.
3. `20260908_fsa_least_privilege_execute_v1.sql` — minimum helper/RPC execution grants.
4. `20260908_fsa_performance_hardening_v1.sql` — foreign-key indexes and RLS init-plan improvements.

The initial live Founder account is bootstrapped environment-side and its Auth UUID is intentionally not hard-coded into these public migrations.

## Verified behavior

Production database smoke tests were executed transactionally and rolled back:

- active Founder at `aal1` can read allowed operator data but cannot mutate;
- private mutation helpers cannot be called directly by ordinary authenticated clients;
- Founder at `aal2` can create a user, post a credit adjustment, create one compensating reversal, and preserve the correct final balance;
- game access and append-only ledger counts remain correct after the sequence;
- Supabase performance advisor no longer reports missing F.S.A. foreign-key indexes or per-row Auth/RLS initialization-plan warnings.

Security advisor warnings for the seven authenticated `SECURITY DEFINER` public RPCs are intentional: those functions are the explicitly authorized mutation API and enforce scope/MFA internally. Unrelated warnings belonging to other products in the shared Supabase project are outside F.S.A. scope.

## Account-level settings that are not code

The shared Supabase project currently reports **Leaked Password Protection disabled**. That is an Auth project setting rather than an F.S.A. schema/code setting and should be enabled in the Supabase Auth dashboard when the plan/project exposes that option.

Invitation/password-recovery emails use this return target:

`https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/`

That URL must be allowed in the Supabase Auth redirect URL configuration. The available connector does not expose an Auth redirect-configuration mutation, so this account-level allowlist cannot be truthfully marked verified by the repository build.

## Explicitly separate future work

This production backend completes the previously unstarted **#1 Founder Console backend** for the existing Founder/Agent/User model. It does **not** silently start the separate future scopes:

- Distributor hierarchy (Founder → Distributor → Agent → User)
- real network multiplayer
- production EGM4000 telemetry API
- real-money functionality
