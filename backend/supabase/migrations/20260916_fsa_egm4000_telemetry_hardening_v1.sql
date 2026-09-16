-- F.S.A. -> EGM4000 telemetry hardening v1
-- Final-state hardening layered over 20260916_fsa_egm4000_telemetry_v1.sql.
-- Keeps telemetry append-only/non-financial while making direct access explicitly denied,
-- bounding client-supplied values, limiting event/session abuse, and pseudonymizing players
-- in the EGM4000 export surface.

-- Explicit restrictive deny policies document and enforce the RPC-only boundary.
drop policy if exists fsa_telemetry_sessions_no_direct_access on public.fsa_telemetry_sessions;
create policy fsa_telemetry_sessions_no_direct_access
on public.fsa_telemetry_sessions
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists fsa_telemetry_events_no_direct_access on public.fsa_telemetry_events;
create policy fsa_telemetry_events_no_direct_access
on public.fsa_telemetry_events
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

-- Replace the simple key allowlist with key + type + range validation.
-- CASE ensures object-only JSON functions never receive scalars/arrays/null.
create or replace function fsa_private.telemetry_payload_allowed(p_payload jsonb)
returns boolean
language sql
immutable
security definer
set search_path = pg_catalog, public
as $$
  select case
    when p_payload is null
      or jsonb_typeof(p_payload) <> 'object'
      or pg_column_size(p_payload) > 4096
    then false
    else
      not exists (
        select 1
        from jsonb_object_keys(p_payload) as keys(key)
        where keys.key not in (
          'client','build','low_data','source','reason','shots','hits','kills','score',
          'combo','fever','gun','power','slot_id','result_class','duration_ms',
          'target_count','wave','boss_ratio'
        )
      )
      and not exists (
        select 1
        from jsonb_each(p_payload) as item(key,value)
        where case
          when item.key in ('client','build','source','reason','power','slot_id','result_class') then
            jsonb_typeof(item.value) <> 'string'
            or char_length(item.value #>> '{}') < 1
            or char_length(item.value #>> '{}') > case when item.key='build' then 80 else 64 end
          when item.key = 'low_data' then
            jsonb_typeof(item.value) <> 'boolean'
          when item.key in ('shots','hits','kills','score','combo','fever','gun','duration_ms','target_count','wave') then
            case
              when jsonb_typeof(item.value) <> 'number' then true
              else
                ((item.value #>> '{}')::numeric < 0)
                or mod((item.value #>> '{}')::numeric,1) <> 0
                or (item.key in ('shots','hits') and (item.value #>> '{}')::numeric > 10000000)
                or (item.key='kills' and (item.value #>> '{}')::numeric > 1000000)
                or (item.key='score' and (item.value #>> '{}')::numeric > 2000000000)
                or (item.key='combo' and (item.value #>> '{}')::numeric > 100000)
                or (item.key='fever' and (item.value #>> '{}')::numeric > 100)
                or (item.key='gun' and (item.value #>> '{}')::numeric > 2)
                or (item.key='duration_ms' and (item.value #>> '{}')::numeric > 86400000)
                or (item.key='target_count' and (item.value #>> '{}')::numeric > 1000)
                or (item.key='wave' and (item.value #>> '{}')::numeric > 10000)
            end
          when item.key = 'boss_ratio' then
            case
              when jsonb_typeof(item.value) <> 'number' then true
              else (item.value #>> '{}')::numeric < 0 or (item.value #>> '{}')::numeric > 1
            end
          else false
        end
      )
  end;
$$;

revoke all on function fsa_private.telemetry_payload_allowed(jsonb) from public, anon, authenticated;

-- Limit simultaneous/open telemetry sessions. Stale sessions are closed server-side.
create or replace function public.fsa_rpc_telemetry_start(
  p_client_kind text default 'web',
  p_low_data boolean default false,
  p_build text default 'fsa-telemetry-v1'
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  pid uuid;
  sid uuid;
  kind text := lower(coalesce(nullif(trim(p_client_kind),''),'unknown'));
  build_name text := coalesce(nullif(trim(p_build),''),'fsa-telemetry-v1');
  open_count integer;
begin
  pid := fsa_private.session_player_id();
  if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  if kind not in ('web','pwa','android','unknown') then kind := 'unknown'; end if;
  if char_length(build_name) > 80 then raise exception 'FSA_TELEMETRY_BUILD_INVALID'; end if;

  update public.fsa_telemetry_sessions
  set ended_at=now(), last_event_at=now()
  where player_id=pid and ended_at is null and started_at < now() - interval '24 hours';

  select count(*)::integer into open_count
  from public.fsa_telemetry_sessions
  where player_id=pid and ended_at is null;
  if open_count >= 5 then raise exception 'FSA_TELEMETRY_OPEN_SESSION_LIMIT'; end if;

  insert into public.fsa_telemetry_sessions(player_id,client_kind,build,low_data)
  values(pid,kind,build_name,coalesce(p_low_data,false))
  returning id into sid;

  insert into public.fsa_telemetry_events(session_id,player_id,event_type,payload,source)
  values(
    sid,
    pid,
    'session_start',
    jsonb_build_object('client',kind,'build',build_name,'low_data',coalesce(p_low_data,false),'source','fsa'),
    'server_observed'
  );

  update public.fsa_telemetry_sessions
  set event_count=1,last_event_at=now()
  where id=sid;

  return sid;
end;
$$;

-- Serialize writes per session and cap a single session at 5,000 observations.
create or replace function public.fsa_rpc_telemetry_event(
  p_session_id uuid,
  p_event_type text,
  p_game_id text default null,
  p_room smallint default null,
  p_payload jsonb default '{}'::jsonb,
  p_client_nonce uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  pid uuid;
  eid bigint;
  current_event_count integer;
  et text := lower(coalesce(trim(p_event_type),''));
begin
  pid := fsa_private.session_player_id();
  if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;

  if et not in (
    'game_open','game_close','room_change','weapon_change','power_used',
    'performance_sample','slot_open','slot_close','slot_spin','client_error'
  ) then
    raise exception 'FSA_TELEMETRY_EVENT_INVALID';
  end if;

  if p_room is not null and (p_room < 0 or p_room > 2) then
    raise exception 'FSA_TELEMETRY_ROOM_INVALID';
  end if;

  if not fsa_private.telemetry_payload_allowed(coalesce(p_payload,'{}'::jsonb)) then
    raise exception 'FSA_TELEMETRY_PAYLOAD_INVALID';
  end if;

  select s.event_count into current_event_count
  from public.fsa_telemetry_sessions s
  where s.id=p_session_id and s.player_id=pid and s.ended_at is null
  for update;
  if not found then raise exception 'FSA_TELEMETRY_SESSION_INVALID'; end if;
  if current_event_count >= 5000 then raise exception 'FSA_TELEMETRY_SESSION_LIMIT'; end if;

  if p_game_id is not null then
    perform 1
    from public.fsa_games g
    join public.fsa_player_game_access a on a.game_id=g.id and a.player_id=pid
    where g.id=p_game_id and g.active;
    if not found then raise exception 'FSA_GAME_ACCESS_DENIED'; end if;
  end if;

  if p_client_nonce is not null then
    select e.id into eid
    from public.fsa_telemetry_events e
    where e.client_nonce=p_client_nonce and e.player_id=pid;
    if eid is not null then return eid; end if;
  end if;

  insert into public.fsa_telemetry_events(
    session_id,player_id,event_type,game_id,room,payload,client_nonce,source
  ) values(
    p_session_id,pid,et,p_game_id,p_room,coalesce(p_payload,'{}'::jsonb),p_client_nonce,'client_observed'
  )
  returning id into eid;

  update public.fsa_telemetry_sessions
  set event_count=event_count+1,
      last_event_at=now(),
      last_game_id=coalesce(p_game_id,last_game_id),
      last_room=coalesce(p_room,last_room)
  where id=p_session_id and player_id=pid;

  return eid;
end;
$$;

-- Replace the raw player UUID in the EGM4000 feed with a stable pseudonymous key.
drop function if exists public.fsa_rpc_egm4000_telemetry_feed(bigint,integer);
create function public.fsa_rpc_egm4000_telemetry_feed(
  p_after_id bigint default 0,
  p_limit integer default 200
)
returns table(
  event_id bigint,
  session_id uuid,
  player_key text,
  event_type text,
  game_id text,
  room smallint,
  payload jsonb,
  occurred_at timestamptz,
  source text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
begin
  if coalesce(fsa_private.session_role(),'') <> 'founder'
     or coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then
    raise exception 'FSA_FOUNDER_MFA_REQUIRED';
  end if;

  return query
  select
    e.id,
    e.session_id,
    encode(extensions.digest(e.player_id::text || ':fsa-egm4000-v1','sha256'),'hex') as player_key,
    e.event_type,
    e.game_id,
    e.room,
    e.payload,
    e.occurred_at,
    e.source
  from public.fsa_telemetry_events e
  where e.id > greatest(coalesce(p_after_id,0),0)
  order by e.id asc
  limit least(greatest(coalesce(p_limit,200),1),1000);
end;
$$;

revoke all on function public.fsa_rpc_telemetry_start(text,boolean,text) from public, anon;
revoke all on function public.fsa_rpc_telemetry_event(uuid,text,text,smallint,jsonb,uuid) from public, anon;
revoke all on function public.fsa_rpc_egm4000_telemetry_feed(bigint,integer) from public, anon;
grant execute on function public.fsa_rpc_telemetry_start(text,boolean,text) to authenticated;
grant execute on function public.fsa_rpc_telemetry_event(uuid,text,text,smallint,jsonb,uuid) to authenticated;
grant execute on function public.fsa_rpc_egm4000_telemetry_feed(bigint,integer) to authenticated;

comment on function public.fsa_rpc_egm4000_telemetry_feed(bigint,integer) is
  'Founder MFA-only sanitized F.S.A. telemetry feed for EGM4000. Uses a stable SHA-256 player_key instead of raw F.S.A. player UUID.';
