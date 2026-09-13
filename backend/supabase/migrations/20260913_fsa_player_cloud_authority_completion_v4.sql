-- Applied migration: fsa_player_cloud_authority_completion_v4
-- Makes cross-device player accounts independent of multiplayer migrations.

alter table public.fsa_players add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists fsa_players_auth_user_unique_idx on public.fsa_players(auth_user_id) where auth_user_id is not null;

create or replace function fsa_private.session_player_id()
returns uuid
language sql
stable
security definer
set search_path=pg_catalog,public,auth
as $$
  select p.id
  from public.fsa_players p
  join public.fsa_agents a on a.id=p.agent_id
  join public.fsa_distributors d on d.id=a.distributor_id
  where p.auth_user_id=auth.uid() and p.status='active' and a.status='active' and d.status='active'
  limit 1;
$$;
revoke all on function fsa_private.session_player_id() from public,anon;
grant execute on function fsa_private.session_player_id() to authenticated,service_role;

create or replace function public.fsa_rpc_player_bootstrap()
returns jsonb
language plpgsql
stable
security definer
set search_path=pg_catalog,public,auth
as $$
declare pid uuid; p public.fsa_players;
begin
  pid:=fsa_private.session_player_id();
  if pid is null then raise exception 'FSA_PLAYER_AUTH_REQUIRED'; end if;
  select * into p from public.fsa_players where id=pid;
  return jsonb_build_object(
    'player_id',p.id,'username',p.username,'display_name',p.display_name,'balance',p.balance,
    'game_ids',coalesce((select jsonb_agg(pga.game_id order by pga.game_id) from public.fsa_player_game_access pga join public.fsa_games g on g.id=pga.game_id and g.active where pga.player_id=pid),'[]'::jsonb),
    'current_table',null
  );
end $$;
revoke all on function public.fsa_rpc_player_bootstrap() from public,anon;
grant execute on function public.fsa_rpc_player_bootstrap() to authenticated;

create or replace function public.fsa_service_create_network_player(
  p_actor_user_id uuid,p_auth_user_id uuid,p_username text,p_display_name text,p_agent_id uuid,
  p_opening_balance bigint default 0,p_game_ids text[] default null,p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path=pg_catalog,public,auth
as $$
declare op public.fsa_operator_profiles; a public.fsa_agents; d public.fsa_distributors; new_id uuid; a_exp bigint; d_exp bigint;
begin
  select * into op from public.fsa_operator_profiles where user_id=p_actor_user_id and status='active';
  if not found then raise exception 'FSA_OPERATOR_INACTIVE'; end if;
  if not exists(select 1 from auth.users where id=p_auth_user_id) then raise exception 'FSA_AUTH_USER_NOT_FOUND'; end if;
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
  insert into public.fsa_player_cloud_state(player_id) values(new_id) on conflict(player_id) do nothing;
  insert into public.fsa_audit_log(actor_user_id,actor_role,distributor_id,agent_id,action,target_type,target_id,details)
  values(p_actor_user_id,op.role,d.id,a.id,'network_player_created','player',new_id::text,jsonb_build_object('username',trim(p_username),'opening_balance',p_opening_balance,'auth_linked',true));
  return new_id;
end $$;
revoke all on function public.fsa_service_create_network_player(uuid,uuid,text,text,uuid,bigint,text[],text) from public,anon,authenticated;
grant execute on function public.fsa_service_create_network_player(uuid,uuid,text,text,uuid,bigint,text[],text) to service_role;
select pg_notify('pgrst','reload schema');
