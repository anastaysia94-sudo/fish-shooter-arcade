-- F.S.A. Founder Console performance hardening.
create index if not exists fsa_agents_created_by_idx on public.fsa_agents(created_by);
create index if not exists fsa_credit_ledger_actor_idx on public.fsa_credit_ledger(actor_user_id);
create index if not exists fsa_operator_profiles_agent_idx on public.fsa_operator_profiles(agent_id);
create index if not exists fsa_players_created_by_idx on public.fsa_players(created_by);

drop policy if exists fsa_profiles_scope_read on public.fsa_operator_profiles;
create policy fsa_profiles_scope_read on public.fsa_operator_profiles
for select to authenticated
using (
  user_id=(select auth.uid())
  or (select fsa_private.is_founder())
  or (role='agent' and agent_id=(select fsa_private.current_agent_id()))
);

drop policy if exists fsa_audit_scope_read on public.fsa_audit_log;
create policy fsa_audit_scope_read on public.fsa_audit_log
for select to authenticated
using (
  (select fsa_private.is_founder())
  or agent_id=(select fsa_private.current_agent_id())
  or actor_user_id=(select auth.uid())
);
