# F.S.A. SECURITY DEFINER Audit — 2026-09-16

## Scope

This audit covers the 27 `public` RPC functions that Supabase currently reports under `authenticated_security_definer_function_executable` because the `authenticated` role can execute them while they run as `SECURITY DEFINER`.

The warning is structural. It identifies privileged callable functions; it does not determine whether each function contains adequate authorization logic. F.S.A. deliberately uses these RPCs as a narrow capability boundary while direct browser access to underlying authority tables remains restricted by RLS/privileges.

## Verified baseline

All 27 authenticated-callable `SECURITY DEFINER` RPCs were inspected against the live production database on 2026-09-16.

- All 27 use a fixed `search_path`.
- All 27 deny `anon` execution.
- Operator/admin mutations use `fsa_private.assert_operator_v2(...)` directly or through an audited helper, enforcing active-account, hierarchy/scope, capability, and MFA requirements where required.
- Player/gameplay RPCs use `fsa_private.session_player_id()` to bind requests to the authenticated active player and active parent hierarchy.
- `fsa_rpc_egm4000_telemetry_feed` is restricted to the founder role and requires AAL2.
- `fsa_rpc_adjust_credits` delegates to `fsa_private.apply_credit_v2`, which performs the cashier, scope, ceiling, and MFA authorization before mutation.
- Service-only functions remain outside the authenticated client API.

## Concrete findings fixed in v4

### Multiplayer power nonce actor binding

`fsa_rpc_multiplayer_power` previously returned an existing event for any matching `client_nonce` before confirming that the event belonged to the authenticated player. A caller who reused or guessed another player's nonce could therefore receive that event payload.

`20260916_fsa_rpc_security_hardening_v4.sql` now requires the existing event's `actor_player_id` to match the current authenticated player and raises `FSA_NONCE_CONFLICT` otherwise. This matches the existing protection in the multiplayer fire RPC.

### Legacy update-agent authorization ordering

The six-argument compatibility overload of `fsa_rpc_update_agent` previously read `fsa_agents.can_manage_users` before delegating to the seven-argument implementation, where authorization occurred.

The v4 migration now calls `fsa_private.assert_operator_v2(...)` before that privileged read, then delegates to the fully authorized seven-argument implementation. The public signature remains compatible.

## Post-fix production verification

After applying `fsa_rpc_security_hardening_v4` to production:

- Stored function bodies were re-read from `pg_proc` and confirmed to contain the new checks.
- `anon` execute permission remains revoked for both patched RPCs.
- Intended `authenticated` and `service_role` execute access remains present.
- The project security advisor still reports 27 authenticated `SECURITY DEFINER` warnings because the linter flags the architectural pattern, not the internal authorization semantics.

## Decision

Do not revoke authenticated execution from these 27 RPCs or convert them wholesale to `SECURITY INVOKER` solely to make the warning count zero. Doing so would bypass the intended capability boundary or break legitimate client operations while direct table access remains deliberately restricted.

Treat future advisor findings in this category as review triggers. Any new or materially changed authenticated `SECURITY DEFINER` RPC must preserve all of the following:

1. fixed `search_path`;
2. no anonymous execute grant;
3. explicit authenticated identity binding;
4. role/scope/capability checks appropriate to the operation;
5. AAL2 for sensitive founder/operator mutations and reads where required;
6. actor-bound idempotency keys/nonces for player-originated writes;
7. regression coverage for newly discovered authorization defects.

## Remaining auth warning

Supabase also reports `auth_leaked_password_protection` as disabled. This setting belongs to hosted Supabase Auth configuration rather than database DDL. The connected database tooling cannot safely toggle it. Supabase's current documentation says leaked-password protection is configured in Auth settings and is available on Pro plans and above.

Official reference: https://supabase.com/docs/guides/auth/password-security
