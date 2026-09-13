-- Applied migration: fsa_player_cloud_account_linking_v4
-- One Auth identity maps to at most one F.S.A. player. Existing server users can be safely linked to cloud login.

create unique index if not exists fsa_players_auth_user_unique_idx
on public.fsa_players(auth_user_id)
where auth_user_id is not null;

create or replace function public.fsa_service_link_network_player(
  p_actor_user_id uuid,
  p_player_id uuid,
  p_auth_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path=pg_catalog,public,auth
as $$
declare
  op public.fsa_operator_profiles;
  p public.fsa_players;
  a public.fsa_agents;
  d public.fsa_distributors;
begin
  if p_actor_user_id is null or p_auth_user_id is null or p_player_id is null then
    raise exception 'FSA_INVALID_LINK_REQUEST';
  end if;
  select * into op from public.fsa_operator_profiles where user_id=p_actor_user_id and status='active';
  if not found then raise exception 'FSA_OPERATOR_INACTIVE'; end if;
  if not exists(select 1 from auth.users where id=p_auth_user_id) then raise exception 'FSA_AUTH_USER_NOT_FOUND'; end if;

  select * into p from public.fsa_players where id=p_player_id for update;
  if not found then raise exception 'FSA_PLAYER_NOT_FOUND'; end if;
  if p.status<>'active' then raise exception 'FSA_PLAYER_SUSPENDED'; end if;
  if p.auth_user_id=p_auth_user_id then return p.id; end if;
  if p.auth_user_id is not null then raise exception 'FSA_PLAYER_AUTH_ALREADY_LINKED'; end if;

  select * into a from public.fsa_agents where id=p.agent_id;
  if not found or a.status<>'active' then raise exception 'FSA_AGENT_INACTIVE'; end if;
  select * into d from public.fsa_distributors where id=a.distributor_id;
  if not found or d.status<>'active' then raise exception 'FSA_DISTRIBUTOR_INACTIVE'; end if;

  if op.role='distributor' then
    if op.distributor_id<>d.id then raise exception 'FSA_SCOPE_DENIED'; end if;
    if not d.can_manage_users then raise exception 'FSA_MANAGE_USERS_REQUIRED'; end if;
  elsif op.role='agent' then
    if op.agent_id<>a.id then raise exception 'FSA_SCOPE_DENIED'; end if;
    if not a.can_manage_users then raise exception 'FSA_MANAGE_USERS_REQUIRED'; end if;
  elsif op.role<>'founder' then
    raise exception 'FSA_ROLE_INVALID';
  end if;

  if exists(select 1 from public.fsa_operator_profiles where user_id=p_auth_user_id) then
    raise exception 'FSA_AUTH_ACCOUNT_ALREADY_LINKED';
  end if;
  if exists(select 1 from public.fsa_players where auth_user_id=p_auth_user_id and id<>p.id) then
    raise exception 'FSA_AUTH_ACCOUNT_ALREADY_LINKED';
  end if;

  update public.fsa_players set auth_user_id=p_auth_user_id, updated_at=now() where id=p.id;
  insert into public.fsa_player_cloud_state(player_id) values(p.id) on conflict(player_id) do nothing;
  insert into public.fsa_audit_log(actor_user_id,actor_role,distributor_id,agent_id,action,target_type,target_id,details)
  values(p_actor_user_id,op.role,d.id,a.id,'player_auth_linked','player',p.id::text,jsonb_build_object('auth_linked',true));
  return p.id;
end $$;

revoke all on function public.fsa_service_link_network_player(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.fsa_service_link_network_player(uuid,uuid,uuid) to service_role;
select pg_notify('pgrst','reload schema');
