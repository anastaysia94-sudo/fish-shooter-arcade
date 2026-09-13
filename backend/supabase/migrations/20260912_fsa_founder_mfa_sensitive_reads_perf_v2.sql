-- Evaluate the Founder AAL claim once per statement, not once per row.
-- Security semantics are unchanged from v1.

drop policy if exists fsa_founder_mfa_sensitive_read on public.fsa_distributors;
create policy fsa_founder_mfa_sensitive_read on public.fsa_distributors as restrictive for select to authenticated using (coalesce((select fsa_private.session_role()),'') <> 'founder' or coalesce(((select auth.jwt())->>'aal'),'aal1') = 'aal2');
drop policy if exists fsa_founder_mfa_sensitive_read on public.fsa_agents;
create policy fsa_founder_mfa_sensitive_read on public.fsa_agents as restrictive for select to authenticated using (coalesce((select fsa_private.session_role()),'') <> 'founder' or coalesce(((select auth.jwt())->>'aal'),'aal1') = 'aal2');
drop policy if exists fsa_founder_mfa_sensitive_read on public.fsa_players;
create policy fsa_founder_mfa_sensitive_read on public.fsa_players as restrictive for select to authenticated using (coalesce((select fsa_private.session_role()),'') <> 'founder' or coalesce(((select auth.jwt())->>'aal'),'aal1') = 'aal2');
drop policy if exists fsa_founder_mfa_sensitive_read on public.fsa_distributor_game_access;
create policy fsa_founder_mfa_sensitive_read on public.fsa_distributor_game_access as restrictive for select to authenticated using (coalesce((select fsa_private.session_role()),'') <> 'founder' or coalesce(((select auth.jwt())->>'aal'),'aal1') = 'aal2');
drop policy if exists fsa_founder_mfa_sensitive_read on public.fsa_agent_game_access;
create policy fsa_founder_mfa_sensitive_read on public.fsa_agent_game_access as restrictive for select to authenticated using (coalesce((select fsa_private.session_role()),'') <> 'founder' or coalesce(((select auth.jwt())->>'aal'),'aal1') = 'aal2');
drop policy if exists fsa_founder_mfa_sensitive_read on public.fsa_player_game_access;
create policy fsa_founder_mfa_sensitive_read on public.fsa_player_game_access as restrictive for select to authenticated using (coalesce((select fsa_private.session_role()),'') <> 'founder' or coalesce(((select auth.jwt())->>'aal'),'aal1') = 'aal2');
drop policy if exists fsa_founder_mfa_sensitive_read on public.fsa_credit_ledger;
create policy fsa_founder_mfa_sensitive_read on public.fsa_credit_ledger as restrictive for select to authenticated using (coalesce((select fsa_private.session_role()),'') <> 'founder' or coalesce(((select auth.jwt())->>'aal'),'aal1') = 'aal2');
drop policy if exists fsa_founder_mfa_sensitive_read on public.fsa_audit_log;
create policy fsa_founder_mfa_sensitive_read on public.fsa_audit_log as restrictive for select to authenticated using (coalesce((select fsa_private.session_role()),'') <> 'founder' or coalesce(((select auth.jwt())->>'aal'),'aal1') = 'aal2');
