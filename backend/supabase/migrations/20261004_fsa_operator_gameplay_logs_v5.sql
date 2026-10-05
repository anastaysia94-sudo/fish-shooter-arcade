-- F.S.A. Founder Console gameplay logs v5
-- Read-only, MFA-gated operator surface over append-only non-financial telemetry.
-- Founder sees all; Distributor sees its hierarchy; Agent sees its own users only.
-- Direct telemetry table access remains denied.

create or replace function public.fsa_rpc_operator_gameplay_logs(
  p_limit integer default 200,
  p_before_event_id bigint default null
)
returns table(
  event_id bigint,
  occurred_at timestamptz,
  event_type text,
  game_id text,
  room smallint,
  client_kind text,
  player_id uuid,
  player_username text,
  player_display_name text,
  agent_id uuid,
  agent_name text,
  distributor_id uuid,
  distributor_name text,
  payload jsonb,
  source text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  op public.fsa_operator_profiles%rowtype;
  max_rows integer := least(greatest(coalesce(p_limit,200),1),500);
begin
  select * into op
  from public.fsa_operator_profiles
  where user_id=auth.uid() and status='active';

  if not found then raise exception 'FSA_OPERATOR_SCOPE_REQUIRED'; end if;
  if coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then raise exception 'FSA_MFA_REQUIRED'; end if;
  if op.role not in ('founder','distributor','agent') then raise exception 'FSA_SCOPE_DENIED'; end if;

  return query
  select
    e.id,
    e.occurred_at,
    e.event_type,
    e.game_id,
    e.room,
    s.client_kind,
    p.id,
    p.username,
    p.display_name,
    a.id,
    coalesce(a.display_name,a.username),
    d.id,
    coalesce(d.display_name,d.username),
    e.payload,
    e.source
  from public.fsa_telemetry_events e
  join public.fsa_telemetry_sessions s on s.id=e.session_id
  join public.fsa_players p on p.id=e.player_id
  join public.fsa_agents a on a.id=p.agent_id
  join public.fsa_distributors d on d.id=a.distributor_id
  where (p_before_event_id is null or e.id < p_before_event_id)
    and (
      op.role='founder'
      or (op.role='distributor' and d.id=op.distributor_id)
      or (op.role='agent' and a.id=op.agent_id)
    )
  order by e.id desc
  limit max_rows;
end
$$;

revoke all on function public.fsa_rpc_operator_gameplay_logs(integer,bigint) from public, anon;
grant execute on function public.fsa_rpc_operator_gameplay_logs(integer,bigint) to authenticated;

comment on function public.fsa_rpc_operator_gameplay_logs(integer,bigint) is
  'MFA-gated read-only Founder Console gameplay log feed. Hierarchy scoped: Founder all, Distributor own hierarchy, Agent own users. Non-financial telemetry only.';
