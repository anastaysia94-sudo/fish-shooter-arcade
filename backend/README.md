# F.S.A. Founder Console Production Backend

This directory is the canonical backend source for the production F.S.A. operator hierarchy:

**Founder → Distributor → Agent → User**

The default product remains **virtual/non-cash entertainment**. This backend does not implement deposits, withdrawals, cash redemption, or real-money wagering.

## Authority boundary

Production authority is **Supabase Auth + PostgreSQL + Row Level Security + MFA-gated audited RPCs**. Browser `localStorage` is not authoritative for Distributors, Agents, users, balances, permissions, ledger history, or audit history. The browser uses only the Supabase publishable key; the service-role credential exists only in the Supabase Edge Function runtime.

Administrative database mutations require an `aal2` JWT. The UI can be bypassed; the database cannot.

## Hierarchy tables

- `fsa_games` — 15 fish + 20 slot catalog.
- `fsa_distributors` — authenticated Distributor records, status, aggregate credit ceiling and delegated permissions.
- `fsa_distributor_game_access` — games a Distributor may expose downstream.
- `fsa_agents` — authenticated Agent records, mandatory parent Distributor, Agent ceiling and delegated user/cashier/moderator permissions.
- `fsa_operator_profiles` — Founder / Distributor / Agent Auth-role mapping.
- `fsa_players` — user records owned by an Agent.
- `fsa_agent_game_access` — subset of Distributor game access.
- `fsa_player_game_access` — subset of Agent game access.
- `fsa_credit_ledger` — append-only virtual-credit history including Distributor and Agent lineage.
- `fsa_audit_log` — immutable administrative audit history with Distributor/Agent scope.
- `fsa_backend_meta` — schema version / production-authority marker. Hierarchy v2 uses `schema_version=2`.

## Effective authorization

**Founder**
- complete hierarchy read scope;
- invite/edit/suspend/reactivate Distributors;
- manage any Agent or user;
- reassign Agents across Distributors when destination constraints pass;
- define Distributor game access;
- all normal credit/moderation authority after MFA.

**Distributor**
- sees only itself, its Agents, its users, its ledger/audit and inherited access rows;
- may invite/manage its own Agents only when `can_manage_agents=true`;
- may manage users only when `can_manage_users=true`;
- cashier and moderator permissions are independent;
- cannot access sibling Distributors;
- cannot make an Agent ceiling exceed its own ceiling;
- cannot grant an Agent a game it does not possess.

**Agent**
- sees its parent Distributor, itself, its users, its own ledger/audit and inherited access;
- may manage users only when `can_manage_users=true`;
- cashier and moderator permissions are independent;
- cannot see sibling Agents/users;
- cannot grant users games blocked at Agent level.

A suspended Distributor makes child Agent operator sessions effectively inactive. A suspended Agent blocks its child administrative actions without deleting data.

## Credit invariants

Every positive credit mutation checks both aggregate limits:

1. Agent user exposure after the mutation must be `<= Agent.credit_ceiling`.
2. Distributor exposure across all child Agents/users after the mutation must be `<= Distributor.credit_ceiling`.

Balances may never become negative. Ledger UPDATE/DELETE is rejected by trigger. A correction creates one equal-and-opposite reversal entry referencing the original row. Ledger rows retain both `distributor_id` and `agent_id` lineage.

## Game inheritance

Game access is strictly nested:

`active F.S.A. games → Distributor access → Agent access → User access`

Removing a game from a Distributor cascades removal from child Agents and their users. Removing a game from an Agent cascades removal from its users. Child operators cannot self-grant a game blocked by a parent.

## Public RPC mutation API

Browser administrative writes use authenticated SECURITY DEFINER RPCs whose bodies re-check role/scope/MFA/permissions:

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

The legacy six-argument `fsa_rpc_update_agent` signature remains as a compatibility wrapper but routes through hierarchy-v2 enforcement.

## Auth-admin Edge Function

`supabase/functions/fsa-founder-admin/index.ts` is deployed as `fsa-founder-admin` with JWT verification enabled.

It performs operations requiring Supabase Auth admin authority:

- `invite_distributor` — Founder-only.
- `invite_agent` — Founder or a permitted Distributor; Distributor scope is forced server-side to its own ID.
- `health` — authenticated AAL2 hierarchy-role check.

All provisioning validates AAL2, active operator/parent state, parent ceiling constraints, game inheritance, duplicate profiles/usernames and audit lineage. Newly invited Auth users return to the production `/admin/` URL. The service-role key is read only from the Edge runtime environment.

## Migrations

Production migrations are tracked in order:

1. `20260908_fsa_founder_console_backend_v1.sql`
2. `20260908_fsa_harden_trigger_search_paths.sql`
3. `20260908_fsa_least_privilege_execute_v1.sql`
4. `20260908_fsa_performance_hardening_v1.sql`
5. `20260909_fsa_distributor_hierarchy_schema_v2.sql`
6. `20260909_fsa_distributor_hierarchy_authority_v2.sql`

The initial Founder Auth UUID is environment bootstrap data and is intentionally not hard-coded in public migrations.

## Verified live behavior

Disposable production-database transactions were rolled back after testing. Verified:

- `aal1` Founder mutation rejected with `FSA_MFA_REQUIRED`;
- `aal2` Founder create-user → +credit → reversal returns the exact opening balance;
- ledger sequence remains three rows (opening, adjustment, reversal);
- removing a Distributor game cascades to Agent and User access;
- Agent ceiling independently rejects an overage;
- Distributor ceiling independently rejects an overage;
- a Distributor in a two-Distributor fixture sees exactly its one Distributor, one Agent and one User through RLS;
- cross-Distributor Agent mutation is rejected with `FSA_SCOPE_DENIED`;
- smoke fixtures leave no production rows after rollback.

Supabase's performance advisor reports no F.S.A.-specific missing-FK or RLS-init-plan warning after hierarchy v2. Newly created indexes are naturally reported as unused until real traffic exercises them.

The security advisor reports authenticated SECURITY DEFINER RPCs because they are intentionally callable as the authenticated administrative API; each is explicitly permission/MFA/scope checked. The unrelated existing Instant Decision RLS notices belong to another product in the shared project.

## Account-level Auth settings

Two Supabase account/project settings remain outside the available connector's mutation surface:

- enable **Leaked Password Protection** where available;
- allow `https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/` as an Auth redirect URL.

Founder/Distributor/Agent TOTP enrollment is intentionally completed by each human operator in the Security panel.

## Separate future work

This hierarchy backend does not imply or start real multiplayer, cloud player-account synchronization, EGM4000 production telemetry, final per-title art/audio production, Android store QA, or real-money functionality.
