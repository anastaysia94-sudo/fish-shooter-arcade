-- F.S.A. operator gameplay log feed v1
-- Read-only, MFA-gated telemetry visibility for Founder, Distributor and Agent scopes.
-- This RPC never changes balances, game access, telemetry rows or gameplay outcomes.

create or replace function public.fsa_rpc_operator_telemetry_feed(
  p_after_id bigint default 0,
  p_limit integer default 250,
  p_player_id uuid default null,
  p_event_type text default null
)
returns table(
  event_id bigint,
  session_id uuid,
  player_id uuid,
  username text,
  display_name text,
  distributor_id uuid,
  distributor_name text,
  agent_id uuid,
  agent_name text,
  event_type text,
  game_id text,
  room smallint,
  payload jsonb,
  occurred_at timestamptz,
  source text,
  client_kind text,
  build text,
  low_data boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  actor public.fsa_operator_profiles;
  normalized_event text := lower(nullif(trim(coalesce(p_event_type,'')),''));
begin
  actor := fsa_private.assert_operator_v2(false,false,false,false,false,true);

  if normalized_event is not null and normalized_event not in (
    'session_start','session_end','game_open','game_close','room_change','weapon_change',
    'power_used','performance_sample','slot_open','slot_close','slot_spin','client_error'
  ) then
    raise exception 'FSA_TELEMETRY_EVENT_INVALID';
  end if;

  return query
  select
    e.id,
    e.session_id,
    p.id,
    p.username,
    p.display_name,
    d.id,
    d.display_name,
    a.id,
    a.display_name,
    e.event_type,
    e.game_id,
    e.room,
    e.payload,
    e.occurred_at,
    e.source,
    s.client_kind,
    s.build,
    s.low_data
  from public.fsa_telemetry_events e
  join public.fsa_telemetry_sessions s on s.id=e.session_id and s.player_id=e.player_id
  join public.fsa_players p on p.id=e.player_id
  join public.fsa_agents a on a.id=p.agent_id
  join public.fsa_distributors d on d.id=a.distributor_id
  where e.id > greatest(coalesce(p_after_id,0),0)
    and (p_player_id is null or p.id=p_player_id)
    and (normalized_event is null or e.event_type=normalized_event)
    and (
      actor.role='founder'
      or (actor.role='distributor' and actor.distributor_id=d.id)
      or (actor.role='agent' and actor.agent_id=a.id)
    )
  order by e.id desc
  limit least(greatest(coalesce(p_limit,250),1),1000);
end
$$;

revoke all on function public.fsa_rpc_operator_telemetry_feed(bigint,integer,uuid,text) from public, anon;
grant execute on function public.fsa_rpc_operator_telemetry_feed(bigint,integer,uuid,text) to authenticated;

comment on function public.fsa_rpc_operator_telemetry_feed(bigint,integer,uuid,text) is
  'MFA-gated read-only gameplay telemetry feed scoped to the authenticated Founder, Distributor or Agent hierarchy.';
