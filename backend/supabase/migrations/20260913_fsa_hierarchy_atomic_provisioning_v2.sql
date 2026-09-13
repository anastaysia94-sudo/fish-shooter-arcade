-- F.S.A. hierarchy v2 completion: atomic Distributor/Agent operator provisioning.
-- Relational hierarchy writes now happen in one MFA-gated database transaction.

create or replace function public.fsa_rpc_provision_distributor_operator(
  p_auth_user_id uuid,
  p_username text,
  p_display_name text,
  p_credit_ceiling bigint,
  p_can_manage_agents boolean,
  p_can_manage_users boolean,
  p_can_cashier boolean,
  p_can_moderate boolean,
  p_game_ids text[] default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path=pg_catalog,public,auth
as $$
declare
  v_actor public.fsa_operator_profiles;
  v_id uuid;
begin
  v_actor := fsa_private.assert_operator_v2(true,false,false,false,false,true);
  if p_auth_user_id is null or not exists(select 1 from auth.users where id=p_auth_user_id) then raise exception 'FSA_AUTH_USER_NOT_FOUND'; end if;
  if exists(select 1 from public.fsa_operator_profiles where user_id=p_auth_user_id) then raise exception 'FSA_OPERATOR_ALREADY_EXISTS'; end if;
  if p_username is null or p_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{1,59}$' then raise exception 'FSA_INVALID_USERNAME'; end if;
  if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 80 then raise exception 'FSA_INVALID_DISPLAY_NAME'; end if;
  if p_credit_ceiling is null or p_credit_ceiling < 0 then raise exception 'FSA_INVALID_CEILING'; end if;
  if p_game_ids is not null and exists(
    select 1 from unnest(p_game_ids) gid
    where not exists(select 1 from public.fsa_games g where g.id=gid and g.active)
  ) then raise exception 'FSA_INVALID_GAME'; end if;

  insert into public.fsa_distributors(
    auth_user_id,username,display_name,status,can_manage_agents,can_manage_users,
    can_cashier,can_moderate,credit_ceiling,created_by
  ) values(
    p_auth_user_id,trim(p_username),trim(p_display_name),'active',
    coalesce(p_can_manage_agents,false),coalesce(p_can_manage_users,false),
    coalesce(p_can_cashier,false),coalesce(p_can_moderate,false),p_credit_ceiling,auth.uid()
  ) returning id into v_id;

  insert into public.fsa_operator_profiles(user_id,role,distributor_id,display_name,status)
  values(p_auth_user_id,'distributor',v_id,trim(p_display_name),'active');

  insert into public.fsa_distributor_game_access(distributor_id,game_id)
  select v_id,g.id from public.fsa_games g
  where g.active and (p_game_ids is null or g.id=any(p_game_ids));

  perform fsa_private.write_audit_v2(
    'distributor_invited','distributor',v_id::text,v_id,null,
    jsonb_build_object(
      'username',trim(p_username),'credit_ceiling',p_credit_ceiling,
      'can_manage_agents',coalesce(p_can_manage_agents,false),
      'can_manage_users',coalesce(p_can_manage_users,false),
      'can_cashier',coalesce(p_can_cashier,false),
      'can_moderate',coalesce(p_can_moderate,false)
    )
  );
  return v_id;
end $$;

create or replace function public.fsa_rpc_provision_agent_operator(
  p_auth_user_id uuid,
  p_distributor_id uuid,
  p_username text,
  p_display_name text,
  p_credit_ceiling bigint,
  p_can_manage_users boolean,
  p_can_cashier boolean,
  p_can_moderate boolean,
  p_game_ids text[] default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path=pg_catalog,public,auth
as $$
declare
  v_actor public.fsa_operator_profiles;
  v_dist public.fsa_distributors;
  v_id uuid;
begin
  v_actor := fsa_private.assert_operator_v2(false,false,false,true,false,true);
  if p_auth_user_id is null or not exists(select 1 from auth.users where id=p_auth_user_id) then raise exception 'FSA_AUTH_USER_NOT_FOUND'; end if;
  if exists(select 1 from public.fsa_operator_profiles where user_id=p_auth_user_id) then raise exception 'FSA_OPERATOR_ALREADY_EXISTS'; end if;
  if p_username is null or p_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{1,59}$' then raise exception 'FSA_INVALID_USERNAME'; end if;
  if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 80 then raise exception 'FSA_INVALID_DISPLAY_NAME'; end if;
  if p_credit_ceiling is null or p_credit_ceiling < 0 then raise exception 'FSA_INVALID_CEILING'; end if;

  select * into v_dist from public.fsa_distributors where id=p_distributor_id for update;
  if not found or v_dist.status<>'active' then raise exception 'FSA_DISTRIBUTOR_INACTIVE'; end if;
  if v_actor.role='distributor' and v_actor.distributor_id<>v_dist.id then raise exception 'FSA_SCOPE_DENIED'; end if;
  if p_credit_ceiling>v_dist.credit_ceiling then raise exception 'FSA_AGENT_CEILING_OUTSIDE_DISTRIBUTOR'; end if;
  if p_game_ids is not null and exists(
    select 1 from unnest(p_game_ids) gid
    where not exists(
      select 1 from public.fsa_distributor_game_access dga
      where dga.distributor_id=v_dist.id and dga.game_id=gid
    )
  ) then raise exception 'FSA_DISTRIBUTOR_GAME_DENIED'; end if;

  insert into public.fsa_agents(
    auth_user_id,distributor_id,username,display_name,status,can_manage_users,
    can_cashier,can_moderate,credit_ceiling,created_by
  ) values(
    p_auth_user_id,v_dist.id,trim(p_username),trim(p_display_name),'active',
    coalesce(p_can_manage_users,true),coalesce(p_can_cashier,false),
    coalesce(p_can_moderate,false),p_credit_ceiling,auth.uid()
  ) returning id into v_id;

  insert into public.fsa_operator_profiles(user_id,role,agent_id,display_name,status)
  values(p_auth_user_id,'agent',v_id,trim(p_display_name),'active');

  insert into public.fsa_agent_game_access(agent_id,game_id)
  select v_id,dga.game_id from public.fsa_distributor_game_access dga
  where dga.distributor_id=v_dist.id and (p_game_ids is null or dga.game_id=any(p_game_ids));

  perform fsa_private.write_audit_v2(
    'agent_invited','agent',v_id::text,v_dist.id,v_id,
    jsonb_build_object(
      'username',trim(p_username),'credit_ceiling',p_credit_ceiling,
      'can_manage_users',coalesce(p_can_manage_users,true),
      'can_cashier',coalesce(p_can_cashier,false),
      'can_moderate',coalesce(p_can_moderate,false)
    )
  );
  return v_id;
end $$;

revoke all on function public.fsa_rpc_provision_distributor_operator(uuid,text,text,bigint,boolean,boolean,boolean,boolean,text[]) from public,anon;
revoke all on function public.fsa_rpc_provision_agent_operator(uuid,uuid,text,text,bigint,boolean,boolean,boolean,text[]) from public,anon;
grant execute on function public.fsa_rpc_provision_distributor_operator(uuid,text,text,bigint,boolean,boolean,boolean,boolean,text[]) to authenticated;
grant execute on function public.fsa_rpc_provision_agent_operator(uuid,uuid,text,text,bigint,boolean,boolean,boolean,text[]) to authenticated;

select pg_notify('pgrst','reload schema');
