-- F.S.A. network multiplayer v3 authority. Browser clients receive no direct write grants.
create or replace function fsa_private.session_player_id()
returns uuid language sql stable security definer set search_path=pg_catalog,public,auth as $$
  select p.id
  from public.fsa_players p
  join public.fsa_agents a on a.id=p.agent_id
  join public.fsa_distributors d on d.id=a.distributor_id
  where p.auth_user_id=auth.uid() and p.status='active' and a.status='active' and d.status='active'
  limit 1;
$$;

create or replace function fsa_private.player_can_access_game(p_player uuid,p_game text)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(
    select 1 from public.fsa_players p
    join public.fsa_agents a on a.id=p.agent_id and a.status='active'
    join public.fsa_distributors d on d.id=a.distributor_id and d.status='active'
    join public.fsa_games g on g.id=p_game and g.active and g.category='fish'
    join public.fsa_player_game_access pga on pga.player_id=p.id and pga.game_id=g.id
    join public.fsa_agent_game_access aga on aga.agent_id=a.id and aga.game_id=g.id
    join public.fsa_distributor_game_access dga on dga.distributor_id=d.id and dga.game_id=g.id
    where p.id=p_player and p.status='active'
  );
$$;

create or replace function fsa_private.player_in_multiplayer_table(p_table uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
  select exists(select 1 from public.fsa_multiplayer_seats s where s.table_id=p_table and s.player_id=fsa_private.session_player_id());
$$;

create or replace function fsa_private.multiplayer_room_cap(p_room text)
returns smallint language sql immutable set search_path=pg_catalog as $$
  select case p_room when 'bronze' then 2 when 'silver' then 3 when 'gold' then 4 else 0 end::smallint;
$$;

create or replace function fsa_private.multiplayer_allowed_shot(p_room text,p_weapon text,p_value bigint)
returns boolean language sql immutable set search_path=pg_catalog as $$
  select case
    when p_room='bronze' and p_weapon='pulse' then p_value=any(array[2,5,10,20,50]::bigint[])
    when p_room='bronze' and p_weapon='spread' then p_value=any(array[10,20,50,100]::bigint[])
    when p_room='bronze' and p_weapon='rail' then p_value=any(array[50,100]::bigint[])
    when p_room='silver' and p_weapon='pulse' then p_value=any(array[10,20,50]::bigint[])
    when p_room='silver' and p_weapon='spread' then p_value=any(array[20,50,100,200]::bigint[])
    when p_room='silver' and p_weapon='rail' then p_value=any(array[50,100,200,500]::bigint[])
    when p_room='gold' and p_weapon='pulse' then p_value=any(array[100,200,500]::bigint[])
    when p_room='gold' and p_weapon='spread' then p_value=any(array[200,500,1000]::bigint[])
    when p_room='gold' and p_weapon='rail' then p_value=any(array[500,1000,2000,5000]::bigint[])
    else false end;
$$;

create or replace function fsa_private.multiplayer_cooldown_ms(p_weapon text)
returns integer language sql immutable set search_path=pg_catalog as $$
  select case p_weapon when 'pulse' then 105 when 'spread' then 185 when 'rail' then 410 else 1000000 end;
$$;

create or replace function fsa_private.multiplayer_emit_event(p_table uuid,p_actor uuid,p_type text,p_payload jsonb,p_nonce uuid default null)
returns public.fsa_multiplayer_events language plpgsql volatile security definer set search_path=pg_catalog,public as $$
declare seq bigint; outrow public.fsa_multiplayer_events;
begin
  update public.fsa_multiplayer_tables set event_seq=event_seq+1,last_activity_at=now() where id=p_table returning event_seq into seq;
  if not found then raise exception 'FSA_TABLE_NOT_FOUND'; end if;
  insert into public.fsa_multiplayer_events(table_id,event_seq,actor_player_id,client_nonce,event_type,payload)
  values(p_table,seq,p_actor,p_nonce,p_type,coalesce(p_payload,'{}'::jsonb)) returning * into outrow;
  return outrow;
end $$;

create or replace function public.fsa_service_create_network_player(
  p_actor_user_id uuid,p_auth_user_id uuid,p_username text,p_display_name text,p_agent_id uuid,
  p_opening_balance bigint default 0,p_game_ids text[] default null,p_notes text default ''
) returns uuid language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare op public.fsa_operator_profiles; a public.fsa_agents; d public.fsa_distributors; new_id uuid; a_exp bigint; d_exp bigint;
begin
  select * into op from public.fsa_operator_profiles where user_id=p_actor_user_id and status='active';
  if not found then raise exception 'FSA_OPERATOR_INACTIVE'; end if;
  select * into a from public.fsa_agents where id=p_agent_id and status='active' for update;
  if not found then raise exception 'FSA_AGENT_INACTIVE'; end if;
  select * into d from public.fsa_distributors where id=a.distributor_id and status='active' for update;
  if not found then raise exception 'FSA_DISTRIBUTOR_INACTIVE'; end if;
  if op.role='distributor' then
    if op.distributor_id<>d.id then raise exception 'FSA_SCOPE_DENIED'; end if;
    if not d.can_manage_users then raise exception 'FSA_MANAGE_USERS_REQUIRED'; end if;
    if p_opening_balance>0 and not d.can_cashier then raise exception 'FSA_CASHIER_REQUIRED'; end if;
  elsif op.role='agent' then
    if op.agent_id<>a.id then raise exception 'FSA_SCOPE_DENIED'; end if;
    if not a.can_manage_users then raise exception 'FSA_MANAGE_USERS_REQUIRED'; end if;
    if p_opening_balance>0 and not a.can_cashier then raise exception 'FSA_CASHIER_REQUIRED'; end if;
  elsif op.role<>'founder' then raise exception 'FSA_ROLE_INVALID'; end if;
  if p_opening_balance<0 then raise exception 'FSA_NEGATIVE_BALANCE'; end if;
  if p_username is null or char_length(trim(p_username))<2 or char_length(trim(p_username))>60 then raise exception 'FSA_INVALID_USERNAME'; end if;
  if exists(select 1 from public.fsa_players where lower(username)=lower(trim(p_username))) then raise exception 'FSA_USERNAME_TAKEN'; end if;
  if exists(select 1 from public.fsa_players where auth_user_id=p_auth_user_id) or exists(select 1 from public.fsa_operator_profiles where user_id=p_auth_user_id) then raise exception 'FSA_AUTH_ACCOUNT_ALREADY_LINKED'; end if;
  a_exp:=fsa_private.agent_exposure(a.id,null)+p_opening_balance;
  d_exp:=fsa_private.distributor_exposure(d.id,null)+p_opening_balance;
  if a_exp>a.credit_ceiling then raise exception 'FSA_AGENT_CREDIT_CEILING_EXCEEDED'; end if;
  if d_exp>d.credit_ceiling then raise exception 'FSA_DISTRIBUTOR_CREDIT_CEILING_EXCEEDED'; end if;
  if p_game_ids is not null and exists(select 1 from unnest(p_game_ids) gid where not exists(select 1 from public.fsa_agent_game_access aga where aga.agent_id=a.id and aga.game_id=gid)) then raise exception 'FSA_AGENT_GAME_DENIED'; end if;
  insert into public.fsa_players(username,display_name,agent_id,balance,notes,created_by,auth_user_id)
  values(trim(p_username),coalesce(nullif(trim(p_display_name),''),trim(p_username)),a.id,p_opening_balance,left(coalesce(p_notes,''),500),p_actor_user_id,p_auth_user_id) returning id into new_id;
  insert into public.fsa_player_game_access(player_id,game_id)
  select new_id,aga.game_id from public.fsa_agent_game_access aga where aga.agent_id=a.id and (p_game_ids is null or aga.game_id=any(p_game_ids));
  if p_opening_balance>0 then
    insert into public.fsa_credit_ledger(player_id,distributor_id,agent_id,amount,balance_before,balance_after,reason,kind,actor_user_id)
    values(new_id,d.id,a.id,p_opening_balance,0,p_opening_balance,'Opening balance','opening',p_actor_user_id);
  end if;
  insert into public.fsa_audit_log(actor_user_id,actor_role,distributor_id,agent_id,action,target_type,target_id,details)
  values(p_actor_user_id,op.role,d.id,a.id,'network_player_created','player',new_id::text,jsonb_build_object('username',trim(p_username),'opening_balance',p_opening_balance,'auth_linked',true));
  return new_id;
end $$;

create or replace function public.fsa_rpc_player_bootstrap()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,public,auth as $$
declare pid uuid; p public.fsa_players; current_row jsonb;
begin
  pid:=fsa_private.session_player_id(); if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  select * into p from public.fsa_players where id=pid;
  select jsonb_build_object('table_id',s.table_id,'seat_no',s.seat_no,'last_seen_at',s.last_seen_at) into current_row from public.fsa_multiplayer_seats s where s.player_id=pid;
  return jsonb_build_object(
    'player_id',p.id,'username',p.username,'display_name',p.display_name,'balance',p.balance,
    'game_ids',coalesce((select jsonb_agg(pga.game_id order by pga.game_id) from public.fsa_player_game_access pga join public.fsa_games g on g.id=pga.game_id and g.active and g.category='fish' where pga.player_id=pid),'[]'::jsonb),
    'current_table',current_row
  );
end $$;

create or replace function public.fsa_rpc_multiplayer_list_tables()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,public,auth as $$
declare pid uuid;
begin
  pid:=fsa_private.session_player_id(); if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  return coalesce((select jsonb_agg(x order by x.last_activity_at desc) from (
    select t.id,t.game_id,g.name game_name,t.room_tier,t.status,t.max_players,t.host_player_id,h.display_name host_name,t.last_activity_at,
      (select count(*) from public.fsa_multiplayer_seats s where s.table_id=t.id and s.last_seen_at>now()-interval '60 seconds') player_count
    from public.fsa_multiplayer_tables t join public.fsa_games g on g.id=t.game_id join public.fsa_players h on h.id=t.host_player_id
    where t.status in ('open','active') and fsa_private.player_can_access_game(pid,t.game_id)
      and t.last_activity_at>now()-interval '30 minutes'
  ) x),'[]'::jsonb);
end $$;

create or replace function public.fsa_rpc_multiplayer_create_table(p_game_id text,p_room_tier text,p_max_players smallint default null)
returns uuid language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare pid uuid; cap smallint; mp smallint; tid uuid; ev public.fsa_multiplayer_events; pname text;
begin
  pid:=fsa_private.session_player_id(); if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  if exists(select 1 from public.fsa_multiplayer_seats where player_id=pid) then raise exception 'FSA_ALREADY_IN_TABLE'; end if;
  if not fsa_private.player_can_access_game(pid,p_game_id) then raise exception 'FSA_GAME_ACCESS_DENIED'; end if;
  cap:=fsa_private.multiplayer_room_cap(p_room_tier); if cap=0 then raise exception 'FSA_INVALID_ROOM'; end if;
  mp:=coalesce(p_max_players,cap); if mp<2 or mp>cap then raise exception 'FSA_INVALID_TABLE_SIZE'; end if;
  insert into public.fsa_multiplayer_tables(game_id,room_tier,max_players,host_player_id) values(p_game_id,p_room_tier,mp,pid) returning id into tid;
  insert into public.fsa_multiplayer_seats(table_id,seat_no,player_id,shot_value) values(tid,1,pid,case p_room_tier when 'bronze' then 2 when 'silver' then 10 else 100 end);
  select display_name into pname from public.fsa_players where id=pid;
  ev:=fsa_private.multiplayer_emit_event(tid,pid,'table_created',jsonb_build_object('seat_no',1,'player_name',pname,'room_tier',p_room_tier,'game_id',p_game_id),null);
  return tid;
end $$;

create or replace function public.fsa_rpc_multiplayer_join_table(p_table_id uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare pid uuid; t public.fsa_multiplayer_tables; seat smallint; cnt integer; pname text; ev public.fsa_multiplayer_events;
begin
  pid:=fsa_private.session_player_id(); if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  select * into t from public.fsa_multiplayer_tables where id=p_table_id for update; if not found then raise exception 'FSA_TABLE_NOT_FOUND'; end if;
  if t.status='closed' then raise exception 'FSA_TABLE_CLOSED'; end if;
  if not fsa_private.player_can_access_game(pid,t.game_id) then raise exception 'FSA_GAME_ACCESS_DENIED'; end if;
  if exists(select 1 from public.fsa_multiplayer_seats where player_id=pid and table_id<>p_table_id) then raise exception 'FSA_ALREADY_IN_TABLE'; end if;
  select seat_no into seat from public.fsa_multiplayer_seats where table_id=p_table_id and player_id=pid;
  if seat is not null then update public.fsa_multiplayer_seats set last_seen_at=now() where table_id=p_table_id and player_id=pid; return jsonb_build_object('table_id',p_table_id,'seat_no',seat,'rejoined',true); end if;
  delete from public.fsa_multiplayer_seats where table_id=p_table_id and last_seen_at<now()-interval '90 seconds';
  select count(*) into cnt from public.fsa_multiplayer_seats where table_id=p_table_id;
  if cnt>=t.max_players then raise exception 'FSA_TABLE_FULL'; end if;
  select gs::smallint into seat from generate_series(1,t.max_players) gs where not exists(select 1 from public.fsa_multiplayer_seats s where s.table_id=p_table_id and s.seat_no=gs) order by gs limit 1;
  insert into public.fsa_multiplayer_seats(table_id,seat_no,player_id,shot_value) values(p_table_id,seat,pid,case t.room_tier when 'bronze' then 2 when 'silver' then 10 else 100 end);
  select count(*) into cnt from public.fsa_multiplayer_seats where table_id=p_table_id;
  update public.fsa_multiplayer_tables set status=case when cnt>=2 then 'active' else 'open' end where id=p_table_id;
  select display_name into pname from public.fsa_players where id=pid;
  ev:=fsa_private.multiplayer_emit_event(p_table_id,pid,'player_joined',jsonb_build_object('seat_no',seat,'player_name',pname),null);
  return jsonb_build_object('table_id',p_table_id,'seat_no',seat,'rejoined',false);
end $$;

create or replace function public.fsa_rpc_multiplayer_leave_table(p_table_id uuid)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare pid uuid; t public.fsa_multiplayer_tables; seat smallint; pname text; next_host uuid; cnt integer; ev public.fsa_multiplayer_events;
begin
  pid:=fsa_private.session_player_id(); if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  select * into t from public.fsa_multiplayer_tables where id=p_table_id for update; if not found then return; end if;
  select seat_no into seat from public.fsa_multiplayer_seats where table_id=p_table_id and player_id=pid; if seat is null then return; end if;
  select display_name into pname from public.fsa_players where id=pid;
  ev:=fsa_private.multiplayer_emit_event(p_table_id,pid,'player_left',jsonb_build_object('seat_no',seat,'player_name',pname),null);
  delete from public.fsa_multiplayer_seats where table_id=p_table_id and player_id=pid;
  select count(*) into cnt from public.fsa_multiplayer_seats where table_id=p_table_id;
  if cnt=0 then update public.fsa_multiplayer_tables set status='closed' where id=p_table_id;
  else
    if t.host_player_id=pid then select player_id into next_host from public.fsa_multiplayer_seats where table_id=p_table_id order by seat_no limit 1; update public.fsa_multiplayer_tables set host_player_id=next_host where id=p_table_id; end if;
    update public.fsa_multiplayer_tables set status=case when cnt>=2 then 'active' else 'open' end where id=p_table_id;
  end if;
end $$;

create or replace function public.fsa_rpc_multiplayer_close_table(p_table_id uuid)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare pid uuid; t public.fsa_multiplayer_tables; ev public.fsa_multiplayer_events;
begin
  pid:=fsa_private.session_player_id(); if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  select * into t from public.fsa_multiplayer_tables where id=p_table_id for update; if not found then return; end if;
  if t.host_player_id<>pid then raise exception 'FSA_HOST_REQUIRED'; end if;
  ev:=fsa_private.multiplayer_emit_event(p_table_id,pid,'table_closed','{}'::jsonb,null);
  update public.fsa_multiplayer_tables set status='closed' where id=p_table_id;
  delete from public.fsa_multiplayer_seats where table_id=p_table_id;
end $$;

create or replace function public.fsa_rpc_multiplayer_heartbeat(p_table_id uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare pid uuid;
begin
  pid:=fsa_private.session_player_id(); if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  update public.fsa_multiplayer_seats set last_seen_at=now() where table_id=p_table_id and player_id=pid;
  if not found then raise exception 'FSA_NOT_IN_TABLE'; end if;
  update public.fsa_multiplayer_tables set last_activity_at=now() where id=p_table_id;
  return jsonb_build_object('ok',true,'server_time',now());
end $$;

create or replace function public.fsa_rpc_multiplayer_state(p_table_id uuid,p_after_event_seq bigint default 0)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,public,auth as $$
declare pid uuid; t public.fsa_multiplayer_tables; bal bigint;
begin
  pid:=fsa_private.session_player_id(); if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.fsa_multiplayer_seats where table_id=p_table_id and player_id=pid) then raise exception 'FSA_NOT_IN_TABLE'; end if;
  select * into t from public.fsa_multiplayer_tables where id=p_table_id; if not found then raise exception 'FSA_TABLE_NOT_FOUND'; end if;
  select balance into bal from public.fsa_players where id=pid;
  return jsonb_build_object(
    'table',jsonb_build_object('id',t.id,'game_id',t.game_id,'room_tier',t.room_tier,'status',t.status,'max_players',t.max_players,'host_player_id',t.host_player_id,'event_seq',t.event_seq,'last_activity_at',t.last_activity_at),
    'balance',bal,
    'seats',coalesce((select jsonb_agg(jsonb_build_object('seat_no',s.seat_no,'player_id',s.player_id,'display_name',p.display_name,'balance',p.balance,'score',s.score,'shots',s.shots,'hits',s.hits,'weapon',s.weapon,'shot_value',s.shot_value,'last_seen_at',s.last_seen_at) order by s.seat_no) from public.fsa_multiplayer_seats s join public.fsa_players p on p.id=s.player_id where s.table_id=p_table_id),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(jsonb_build_object('event_seq',e.event_seq,'event_type',e.event_type,'actor_player_id',e.actor_player_id,'payload',e.payload,'created_at',e.created_at) order by e.event_seq) from (select * from public.fsa_multiplayer_events where table_id=p_table_id and event_seq>coalesce(p_after_event_seq,0) order by event_seq limit 100) e),'[]'::jsonb)
  );
end $$;

create or replace function public.fsa_rpc_multiplayer_fire(p_table_id uuid,p_weapon text,p_shot_value bigint,p_client_nonce uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare pid uuid; t public.fsa_multiplayer_tables; s public.fsa_multiplayer_seats; p public.fsa_players; a public.fsa_agents; d public.fsa_distributors; existing public.fsa_multiplayer_events; before_bal bigint; spend_bal bigint; final_bal bigint; max_bal bigint; raw_reward bigint:=0; reward bigint:=0; mult integer:=0; hit boolean:=false; target text:='miss'; threshold double precision; roll double precision; cooldown integer; other_a bigint; other_d bigint; ev public.fsa_multiplayer_events; pname text;
begin
  pid:=fsa_private.session_player_id(); if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  if p_client_nonce is null then raise exception 'FSA_NONCE_REQUIRED'; end if;
  select * into existing from public.fsa_multiplayer_events where client_nonce=p_client_nonce;
  if found then
    if existing.actor_player_id<>pid then raise exception 'FSA_NONCE_CONFLICT'; end if;
    return existing.payload||jsonb_build_object('event_seq',existing.event_seq,'idempotent',true);
  end if;
  select * into t from public.fsa_multiplayer_tables where id=p_table_id and status in ('open','active') for update; if not found then raise exception 'FSA_TABLE_NOT_ACTIVE'; end if;
  select * into s from public.fsa_multiplayer_seats where table_id=p_table_id and player_id=pid for update; if not found then raise exception 'FSA_NOT_IN_TABLE'; end if;
  if s.last_seen_at<now()-interval '90 seconds' then raise exception 'FSA_SEAT_STALE'; end if;
  if not fsa_private.multiplayer_allowed_shot(t.room_tier,p_weapon,p_shot_value) then raise exception 'FSA_INVALID_SHOT_VALUE'; end if;
  cooldown:=fsa_private.multiplayer_cooldown_ms(p_weapon);
  if s.last_shot_at is not null and (extract(epoch from (clock_timestamp()-s.last_shot_at))*1000)<cooldown then raise exception 'FSA_FIRE_RATE_LIMIT'; end if;
  select * into p from public.fsa_players where id=pid for update; if p.balance<p_shot_value then raise exception 'FSA_INSUFFICIENT_CREDITS'; end if;
  select * into a from public.fsa_agents where id=p.agent_id and status='active' for update; if not found then raise exception 'FSA_AGENT_INACTIVE'; end if;
  select * into d from public.fsa_distributors where id=a.distributor_id and status='active' for update; if not found then raise exception 'FSA_DISTRIBUTOR_INACTIVE'; end if;
  before_bal:=p.balance; spend_bal:=before_bal-p_shot_value;
  threshold:=case p_weapon when 'pulse' then .42 when 'spread' then .48 when 'rail' then .34 else 0 end - case t.room_tier when 'silver' then .04 when 'gold' then .08 else 0 end;
  hit:=random()<threshold;
  if hit then
    roll:=random();
    if roll<.015 then target:='boss'; mult:=80;
    elsif roll<.06 then target:='elite'; mult:=30;
    elsif roll<.18 then target:='hard'; mult:=15;
    elsif roll<.36 then target:='treasure'; mult:=8;
    else target:='common'; mult:=3; end if;
    raw_reward:=p_shot_value*mult;
  end if;
  other_a:=fsa_private.agent_exposure(a.id,p.id); other_d:=fsa_private.distributor_exposure(d.id,p.id);
  max_bal:=greatest(0,least(a.credit_ceiling-other_a,d.credit_ceiling-other_d));
  reward:=greatest(0,least(raw_reward,greatest(0,max_bal-spend_bal)));
  final_bal:=spend_bal+reward;
  update public.fsa_players set balance=spend_bal where id=pid;
  insert into public.fsa_credit_ledger(player_id,distributor_id,agent_id,amount,balance_before,balance_after,reason,kind,actor_user_id)
  values(pid,d.id,a.id,-p_shot_value,before_bal,spend_bal,'Network table shot','gameplay_spend',auth.uid());
  if reward>0 then
    update public.fsa_players set balance=final_bal where id=pid;
    insert into public.fsa_credit_ledger(player_id,distributor_id,agent_id,amount,balance_before,balance_after,reason,kind,actor_user_id)
    values(pid,d.id,a.id,reward,spend_bal,final_bal,'Network table hit: '||target,'gameplay_reward',auth.uid());
  end if;
  update public.fsa_multiplayer_seats set shots=shots+1,hits=hits+case when hit then 1 else 0 end,score=score+reward,weapon=p_weapon,shot_value=p_shot_value,last_shot_at=clock_timestamp(),last_seen_at=now() where table_id=p_table_id and player_id=pid;
  select display_name into pname from public.fsa_players where id=pid;
  ev:=fsa_private.multiplayer_emit_event(p_table_id,pid,'shot',jsonb_build_object('seat_no',s.seat_no,'player_name',pname,'weapon',p_weapon,'shot_value',p_shot_value,'cost',p_shot_value,'hit',hit,'target_class',target,'multiplier',mult,'reward',reward,'reward_capped',reward<raw_reward,'balance',final_bal),p_client_nonce);
  return ev.payload||jsonb_build_object('event_seq',ev.event_seq,'idempotent',false);
end $$;

create or replace function public.fsa_rpc_multiplayer_power(p_table_id uuid,p_power text,p_client_nonce uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare pid uuid; s public.fsa_multiplayer_seats; ev public.fsa_multiplayer_events; pname text; existing public.fsa_multiplayer_events;
begin
  pid:=fsa_private.session_player_id(); if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  if p_power not in ('freeze','lightning','bomb','tornado') then raise exception 'FSA_INVALID_POWER'; end if;
  if p_client_nonce is null then raise exception 'FSA_NONCE_REQUIRED'; end if;
  select * into existing from public.fsa_multiplayer_events where client_nonce=p_client_nonce;
  if found then return existing.payload||jsonb_build_object('event_seq',existing.event_seq,'idempotent',true); end if;
  select * into s from public.fsa_multiplayer_seats where table_id=p_table_id and player_id=pid; if not found then raise exception 'FSA_NOT_IN_TABLE'; end if;
  select display_name into pname from public.fsa_players where id=pid;
  ev:=fsa_private.multiplayer_emit_event(p_table_id,pid,'power',jsonb_build_object('seat_no',s.seat_no,'player_name',pname,'power',p_power),p_client_nonce);
  return ev.payload||jsonb_build_object('event_seq',ev.event_seq,'idempotent',false);
end $$;

-- Player self-read policies coexist with existing operator hierarchy policies.
drop policy if exists fsa_players_self_read on public.fsa_players;
create policy fsa_players_self_read on public.fsa_players for select to authenticated using (auth_user_id=(select auth.uid()) and (select fsa_private.session_player_id())=id);
drop policy if exists fsa_player_games_self_read on public.fsa_player_game_access;
create policy fsa_player_games_self_read on public.fsa_player_game_access for select to authenticated using (player_id=(select fsa_private.session_player_id()));
drop policy if exists fsa_ledger_self_read on public.fsa_credit_ledger;
create policy fsa_ledger_self_read on public.fsa_credit_ledger for select to authenticated using (player_id=(select fsa_private.session_player_id()));
drop policy if exists fsa_games_player_read on public.fsa_games;
create policy fsa_games_player_read on public.fsa_games for select to authenticated using ((select fsa_private.session_player_id()) is not null and active);

drop policy if exists fsa_multiplayer_tables_player_read on public.fsa_multiplayer_tables;
create policy fsa_multiplayer_tables_player_read on public.fsa_multiplayer_tables for select to authenticated using ((select fsa_private.session_player_id()) is not null and status in ('open','active'));
drop policy if exists fsa_multiplayer_seats_table_read on public.fsa_multiplayer_seats;
create policy fsa_multiplayer_seats_table_read on public.fsa_multiplayer_seats for select to authenticated using ((select fsa_private.player_in_multiplayer_table(table_id)));
drop policy if exists fsa_multiplayer_events_table_read on public.fsa_multiplayer_events;
create policy fsa_multiplayer_events_table_read on public.fsa_multiplayer_events for select to authenticated using ((select fsa_private.player_in_multiplayer_table(table_id)));

revoke execute on function fsa_private.session_player_id() from public,anon;
revoke execute on function fsa_private.player_can_access_game(uuid,text) from public,anon,authenticated;
revoke execute on function fsa_private.player_in_multiplayer_table(uuid) from public,anon;
revoke execute on function fsa_private.multiplayer_room_cap(text) from public,anon,authenticated;
revoke execute on function fsa_private.multiplayer_allowed_shot(text,text,bigint) from public,anon,authenticated;
revoke execute on function fsa_private.multiplayer_cooldown_ms(text) from public,anon,authenticated;
revoke execute on function fsa_private.multiplayer_emit_event(uuid,uuid,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function fsa_private.session_player_id() to authenticated;
grant execute on function fsa_private.player_in_multiplayer_table(uuid) to authenticated;

revoke all on function public.fsa_service_create_network_player(uuid,uuid,text,text,uuid,bigint,text[],text) from public,anon,authenticated;
grant execute on function public.fsa_service_create_network_player(uuid,uuid,text,text,uuid,bigint,text[],text) to service_role;

revoke all on function public.fsa_rpc_player_bootstrap() from public,anon;
revoke all on function public.fsa_rpc_multiplayer_list_tables() from public,anon;
revoke all on function public.fsa_rpc_multiplayer_create_table(text,text,smallint) from public,anon;
revoke all on function public.fsa_rpc_multiplayer_join_table(uuid) from public,anon;
revoke all on function public.fsa_rpc_multiplayer_leave_table(uuid) from public,anon;
revoke all on function public.fsa_rpc_multiplayer_close_table(uuid) from public,anon;
revoke all on function public.fsa_rpc_multiplayer_heartbeat(uuid) from public,anon;
revoke all on function public.fsa_rpc_multiplayer_state(uuid,bigint) from public,anon;
revoke all on function public.fsa_rpc_multiplayer_fire(uuid,text,bigint,uuid) from public,anon;
revoke all on function public.fsa_rpc_multiplayer_power(uuid,text,uuid) from public,anon;
grant execute on function public.fsa_rpc_player_bootstrap() to authenticated;
grant execute on function public.fsa_rpc_multiplayer_list_tables() to authenticated;
grant execute on function public.fsa_rpc_multiplayer_create_table(text,text,smallint) to authenticated;
grant execute on function public.fsa_rpc_multiplayer_join_table(uuid) to authenticated;
grant execute on function public.fsa_rpc_multiplayer_leave_table(uuid) to authenticated;
grant execute on function public.fsa_rpc_multiplayer_close_table(uuid) to authenticated;
grant execute on function public.fsa_rpc_multiplayer_heartbeat(uuid) to authenticated;
grant execute on function public.fsa_rpc_multiplayer_state(uuid,bigint) to authenticated;
grant execute on function public.fsa_rpc_multiplayer_fire(uuid,text,bigint,uuid) to authenticated;
grant execute on function public.fsa_rpc_multiplayer_power(uuid,text,uuid) to authenticated;

select pg_notify('pgrst','reload schema');
