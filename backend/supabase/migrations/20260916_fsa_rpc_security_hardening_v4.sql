-- F.S.A. privileged RPC security hardening v4
-- 2026-09-16
--
-- Closes two authorization-order/idempotency gaps found during the live
-- SECURITY DEFINER audit without changing the public RPC signatures.

create or replace function public.fsa_rpc_multiplayer_power(
  p_table_id uuid,
  p_power text,
  p_client_nonce uuid
)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public,auth
as $$
declare
  pid uuid;
  s public.fsa_multiplayer_seats;
  ev public.fsa_multiplayer_events;
  pname text;
  existing public.fsa_multiplayer_events;
begin
  pid:=fsa_private.session_player_id();
  if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  if p_power not in ('freeze','lightning','bomb','tornado') then raise exception 'FSA_INVALID_POWER'; end if;
  if p_client_nonce is null then raise exception 'FSA_NONCE_REQUIRED'; end if;

  select * into existing
  from public.fsa_multiplayer_events
  where client_nonce=p_client_nonce;

  if found then
    -- A nonce is an idempotency key for the authenticated actor. Never return
    -- another player's event merely because the caller guessed/reused its UUID.
    if existing.actor_player_id is distinct from pid then
      raise exception 'FSA_NONCE_CONFLICT';
    end if;
    return existing.payload||jsonb_build_object('event_seq',existing.event_seq,'idempotent',true);
  end if;

  select * into s
  from public.fsa_multiplayer_seats
  where table_id=p_table_id and player_id=pid;
  if not found then raise exception 'FSA_NOT_IN_TABLE'; end if;

  select display_name into pname from public.fsa_players where id=pid;
  ev:=fsa_private.multiplayer_emit_event(
    p_table_id,
    pid,
    'power',
    jsonb_build_object('seat_no',s.seat_no,'player_name',pname,'power',p_power),
    p_client_nonce
  );
  return ev.payload||jsonb_build_object('event_seq',ev.event_seq,'idempotent',false);
end $$;

create or replace function public.fsa_rpc_update_agent(
  p_agent_id uuid,
  p_display_name text,
  p_status text,
  p_credit_ceiling bigint,
  p_can_cashier boolean,
  p_can_moderate boolean
)
returns void
language plpgsql
security definer
set search_path=pg_catalog,public,auth
as $$
declare
  v_manage boolean;
begin
  -- Authorize before the compatibility wrapper performs its privileged read.
  -- The 7-argument implementation repeats this check before mutation.
  perform fsa_private.assert_operator_v2(false,false,false,true,false,true);

  select can_manage_users into v_manage
  from public.fsa_agents
  where id=p_agent_id;
  if not found then raise exception 'FSA_AGENT_NOT_FOUND'; end if;

  perform public.fsa_rpc_update_agent(
    p_agent_id,
    p_display_name,
    p_status,
    p_credit_ceiling,
    coalesce(v_manage,true),
    p_can_cashier,
    p_can_moderate
  );
end $$;

-- Preserve the existing least-privilege API surface explicitly.
revoke all on function public.fsa_rpc_multiplayer_power(uuid,text,uuid) from public,anon;
grant execute on function public.fsa_rpc_multiplayer_power(uuid,text,uuid) to authenticated,service_role;

revoke all on function public.fsa_rpc_update_agent(uuid,text,text,bigint,boolean,boolean) from public,anon;
grant execute on function public.fsa_rpc_update_agent(uuid,text,text,bigint,boolean,boolean) to authenticated,service_role;

select pg_notify('pgrst','reload schema');
