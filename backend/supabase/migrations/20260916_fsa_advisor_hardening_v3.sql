-- F.S.A. Supabase advisor hardening, 2026-09-16.
-- Mirrors behavior-preserving changes already applied to the live project.
-- Intentionally does NOT revoke authenticated EXECUTE from fsa_rpc_* SECURITY DEFINER
-- functions: the browser admin console and player runtime call these RPCs directly,
-- and the functions enforce role/scope/MFA checks internally.

-- Remove the duplicate partial unique index. Keep fsa_players_auth_user_unique_idx.
drop index if exists public.fsa_players_auth_user_uidx;

-- Cover the remaining F.S.A. foreign key reported by the database advisor.
create index if not exists fsa_player_cloud_state_last_game_id_idx
  on public.fsa_player_cloud_state(last_game_id);

-- Telemetry tables are intentionally RPC-only for clients. Explicit deny-all policies
-- preserve the previous implicit RLS deny behavior while documenting the boundary.
drop policy if exists fsa_telemetry_sessions_client_deny_all on public.fsa_telemetry_sessions;
create policy fsa_telemetry_sessions_client_deny_all on public.fsa_telemetry_sessions
  as restrictive for all to anon, authenticated using (false) with check (false);

drop policy if exists fsa_telemetry_events_client_deny_all on public.fsa_telemetry_events;
create policy fsa_telemetry_events_client_deny_all on public.fsa_telemetry_events
  as restrictive for all to anon, authenticated using (false) with check (false);

-- Merge equivalent permissive SELECT policy pairs into one policy per table.
-- Existing restrictive founder-MFA policies remain untouched and continue to gate
-- sensitive reads.

drop policy if exists fsa_ledger_scope_read on public.fsa_credit_ledger;
drop policy if exists fsa_ledger_self_read on public.fsa_credit_ledger;
drop policy if exists fsa_ledger_read on public.fsa_credit_ledger;
create policy fsa_ledger_read on public.fsa_credit_ledger
  for select to authenticated
  using (
    (select fsa_private.session_role()) = 'founder'
    or ((select fsa_private.session_role()) = 'distributor'
        and distributor_id = (select fsa_private.session_distributor_id()))
    or ((select fsa_private.session_role()) = 'agent'
        and agent_id = (select fsa_private.session_agent_id()))
    or player_id = (select fsa_private.session_player_id())
  );

drop policy if exists fsa_games_operator_read on public.fsa_games;
drop policy if exists fsa_games_player_read on public.fsa_games;
drop policy if exists fsa_games_read on public.fsa_games;
create policy fsa_games_read on public.fsa_games
  for select to authenticated
  using (
    (select fsa_private.session_operator_active())
    or (((select fsa_private.session_player_id()) is not null) and active)
  );

drop policy if exists fsa_player_games_scope_read on public.fsa_player_game_access;
drop policy if exists fsa_player_games_self_read on public.fsa_player_game_access;
drop policy if exists fsa_player_games_read on public.fsa_player_game_access;
create policy fsa_player_games_read on public.fsa_player_game_access
  for select to authenticated
  using (
    (select fsa_private.session_role()) = 'founder'
    or (
      (select fsa_private.session_role()) = 'distributor'
      and exists (
        select 1
        from public.fsa_players p
        join public.fsa_agents a on a.id = p.agent_id
        where p.id = fsa_player_game_access.player_id
          and a.distributor_id = (select fsa_private.session_distributor_id())
      )
    )
    or (
      (select fsa_private.session_role()) = 'agent'
      and exists (
        select 1
        from public.fsa_players p
        where p.id = fsa_player_game_access.player_id
          and p.agent_id = (select fsa_private.session_agent_id())
      )
    )
    or player_id = (select fsa_private.session_player_id())
  );

drop policy if exists fsa_players_scope_read on public.fsa_players;
drop policy if exists fsa_players_self_read on public.fsa_players;
drop policy if exists fsa_players_read on public.fsa_players;
create policy fsa_players_read on public.fsa_players
  for select to authenticated
  using (
    (select fsa_private.session_role()) = 'founder'
    or (
      (select fsa_private.session_role()) = 'distributor'
      and exists (
        select 1
        from public.fsa_agents a
        where a.id = fsa_players.agent_id
          and a.distributor_id = (select fsa_private.session_distributor_id())
      )
    )
    or ((select fsa_private.session_role()) = 'agent'
        and agent_id = (select fsa_private.session_agent_id()))
    or (auth_user_id = (select auth.uid())
        and (select fsa_private.session_player_id()) = id)
  );
