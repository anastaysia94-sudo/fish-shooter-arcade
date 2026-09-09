-- Applied migration: fsa_distributor_hierarchy_authority_v2
create or replace function fsa_private.session_operator_active()
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
  select exists(select 1 from public.fsa_operator_profiles p
    left join public.fsa_distributors d on d.id=p.distributor_id
    left join public.fsa_agents a on a.id=p.agent_id
    left join public.fsa_distributors ad on ad.id=a.distributor_id
    where p.user_id=auth.uid() and p.status='active' and
      (p.role='founder' or (p.role='distributor' and d.status='active') or (p.role='agent' and a.status='active' and ad.status='active')));
$$;
create or replace function fsa_private.session_role()
returns text language sql stable security definer set search_path=pg_catalog,public,auth as $$
  select p.role from public.fsa_operator_profiles p where p.user_id=auth.uid() and fsa_private.session_operator_active() limit 1;
$$;
create or replace function fsa_private.session_agent_id()
returns uuid language sql stable security definer set search_path=pg_catalog,public,auth as $$
  select p.agent_id from public.fsa_operator_profiles p where p.user_id=auth.uid() and p.role='agent' and fsa_private.session_operator_active() limit 1;
$$;
create or replace function fsa_private.session_distributor_id()
returns uuid language sql stable security definer set search_path=pg_catalog,public,auth as $$
  select case when p.role='distributor' then p.distributor_id when p.role='agent' then a.distributor_id else null end
  from public.fsa_operator_profiles p left join public.fsa_agents a on a.id=p.agent_id
  where p.user_id=auth.uid() and fsa_private.session_operator_active() limit 1;
$$;

create or replace function fsa_private.assert_operator_v2(p_founder_only boolean default false,p_cashier boolean default false,p_moderator boolean default false,p_manage_agents boolean default false,p_manage_users boolean default false,p_require_mfa boolean default true)
returns public.fsa_operator_profiles language plpgsql stable security definer set search_path=pg_catalog,public,auth as $$
declare v public.fsa_operator_profiles; d public.fsa_distributors; a public.fsa_agents;
begin
 if auth.uid() is null then raise exception 'FSA_AUTH_REQUIRED'; end if;
 select * into v from public.fsa_operator_profiles where user_id=auth.uid();
 if not found or v.status<>'active' then raise exception 'FSA_OPERATOR_INACTIVE'; end if;
 if p_require_mfa and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'FSA_MFA_REQUIRED'; end if;
 if p_founder_only and v.role<>'founder' then raise exception 'FSA_FOUNDER_REQUIRED'; end if;
 if v.role='distributor' then
   select * into d from public.fsa_distributors where id=v.distributor_id;
   if not found or d.status<>'active' then raise exception 'FSA_DISTRIBUTOR_INACTIVE'; end if;
   if p_manage_agents and not d.can_manage_agents then raise exception 'FSA_MANAGE_AGENTS_REQUIRED'; end if;
   if p_manage_users and not d.can_manage_users then raise exception 'FSA_MANAGE_USERS_REQUIRED'; end if;
   if p_cashier and not d.can_cashier then raise exception 'FSA_CASHIER_REQUIRED'; end if;
   if p_moderator and not d.can_moderate then raise exception 'FSA_MODERATOR_REQUIRED'; end if;
 elsif v.role='agent' then
   select * into a from public.fsa_agents where id=v.agent_id;
   if not found or a.status<>'active' then raise exception 'FSA_AGENT_INACTIVE'; end if;
   select * into d from public.fsa_distributors where id=a.distributor_id;
   if not found or d.status<>'active' then raise exception 'FSA_DISTRIBUTOR_INACTIVE'; end if;
   if p_manage_agents then raise exception 'FSA_MANAGE_AGENTS_REQUIRED'; end if;
   if p_manage_users and not a.can_manage_users then raise exception 'FSA_MANAGE_USERS_REQUIRED'; end if;
   if p_cashier and not a.can_cashier then raise exception 'FSA_CASHIER_REQUIRED'; end if;
   if p_moderator and not a.can_moderate then raise exception 'FSA_MODERATOR_REQUIRED'; end if;
 elsif v.role<>'founder' then raise exception 'FSA_ROLE_INVALID'; end if;
 return v;
end $$;

create or replace function fsa_private.distributor_exposure(p_distributor uuid,p_exclude_player uuid default null)
returns bigint language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(sum(p.balance),0)::bigint from public.fsa_players p join public.fsa_agents a on a.id=p.agent_id
 where a.distributor_id=p_distributor and (p_exclude_player is null or p.id<>p_exclude_player);
$$;
create or replace function fsa_private.write_audit_v2(p_action text,p_target_type text,p_target_id text,p_distributor_id uuid,p_agent_id uuid,p_details jsonb default '{}'::jsonb)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare v_role text; v_dist uuid:=p_distributor_id;
begin
 select role into v_role from public.fsa_operator_profiles where user_id=auth.uid();
 if v_dist is null and p_agent_id is not null then select distributor_id into v_dist from public.fsa_agents where id=p_agent_id; end if;
 if v_dist is null and v_role='distributor' then select distributor_id into v_dist from public.fsa_operator_profiles where user_id=auth.uid(); end if;
 insert into public.fsa_audit_log(actor_user_id,actor_role,distributor_id,agent_id,action,target_type,target_id,details)
 values(auth.uid(),coalesce(v_role,'system'),v_dist,p_agent_id,p_action,p_target_type,p_target_id,coalesce(p_details,'{}'::jsonb));
end $$;

create or replace function fsa_private.apply_credit_v2(p_player_id uuid,p_delta bigint,p_reason text,p_kind text default 'adjustment',p_reverses uuid default null)
returns public.fsa_credit_ledger language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare actor public.fsa_operator_profiles; p public.fsa_players; a public.fsa_agents; d public.fsa_distributors; before_bal bigint; after_bal bigint; a_exp bigint; d_exp bigint; entry public.fsa_credit_ledger;
begin
 if p_delta=0 then raise exception 'FSA_ZERO_ADJUSTMENT'; end if;
 if p_reason is null or char_length(trim(p_reason))=0 or char_length(p_reason)>250 then raise exception 'FSA_REASON_REQUIRED'; end if;
 actor:=fsa_private.assert_operator_v2(false,true,false,false,false,true);
 select * into p from public.fsa_players where id=p_player_id for update; if not found then raise exception 'FSA_PLAYER_NOT_FOUND'; end if;
 select * into a from public.fsa_agents where id=p.agent_id for update; if not found or a.status<>'active' then raise exception 'FSA_AGENT_INACTIVE'; end if;
 select * into d from public.fsa_distributors where id=a.distributor_id for update; if not found or d.status<>'active' then raise exception 'FSA_DISTRIBUTOR_INACTIVE'; end if;
 if actor.role='agent' and actor.agent_id<>a.id then raise exception 'FSA_SCOPE_DENIED'; end if;
 if actor.role='distributor' and actor.distributor_id<>d.id then raise exception 'FSA_SCOPE_DENIED'; end if;
 if p.status<>'active' and p_kind<>'reversal' then raise exception 'FSA_PLAYER_SUSPENDED'; end if;
 before_bal:=p.balance; after_bal:=before_bal+p_delta; if after_bal<0 then raise exception 'FSA_NEGATIVE_BALANCE'; end if;
 if p_delta>0 then
   a_exp:=fsa_private.agent_exposure(a.id,p.id)+after_bal; if a_exp>a.credit_ceiling then raise exception 'FSA_AGENT_CREDIT_CEILING_EXCEEDED'; end if;
   d_exp:=fsa_private.distributor_exposure(d.id,p.id)+after_bal; if d_exp>d.credit_ceiling then raise exception 'FSA_DISTRIBUTOR_CREDIT_CEILING_EXCEEDED'; end if;
 end if;
 update public.fsa_players set balance=after_bal where id=p.id;
 insert into public.fsa_credit_ledger(player_id,distributor_id,agent_id,amount,balance_before,balance_after,reason,kind,reverses_entry_id,actor_user_id)
 values(p.id,d.id,a.id,p_delta,before_bal,after_bal,trim(p_reason),p_kind,p_reverses,auth.uid()) returning * into entry;
 perform fsa_private.write_audit_v2('credit_'||p_kind,'player',p.id::text,d.id,a.id,jsonb_build_object('amount',p_delta,'balance_before',before_bal,'balance_after',after_bal,'reason',trim(p_reason),'ledger_id',entry.id));
 return entry;
end $$;

create or replace function public.fsa_rpc_create_player(p_username text,p_display_name text,p_agent_id uuid,p_opening_balance bigint default 0,p_game_ids text[] default null,p_notes text default '')
returns uuid language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare actor public.fsa_operator_profiles; a public.fsa_agents; d public.fsa_distributors; new_id uuid; a_exp bigint; d_exp bigint;
begin
 actor:=fsa_private.assert_operator_v2(false,p_opening_balance>0,false,false,true,true); if actor.role='agent' then p_agent_id:=actor.agent_id; end if;
 if p_username is null or char_length(trim(p_username))<2 or char_length(p_username)>60 then raise exception 'FSA_INVALID_USERNAME'; end if;
 if exists(select 1 from public.fsa_players where lower(username)=lower(trim(p_username))) then raise exception 'FSA_USERNAME_TAKEN'; end if;
 select * into a from public.fsa_agents where id=p_agent_id for update; if not found or a.status<>'active' then raise exception 'FSA_AGENT_INACTIVE'; end if;
 select * into d from public.fsa_distributors where id=a.distributor_id for update; if not found or d.status<>'active' then raise exception 'FSA_DISTRIBUTOR_INACTIVE'; end if;
 if actor.role='distributor' and actor.distributor_id<>d.id then raise exception 'FSA_SCOPE_DENIED'; end if; if actor.role='agent' and actor.agent_id<>a.id then raise exception 'FSA_SCOPE_DENIED'; end if;
 if p_opening_balance<0 then raise exception 'FSA_NEGATIVE_BALANCE'; end if;
 a_exp:=fsa_private.agent_exposure(a.id,null)+p_opening_balance; if a_exp>a.credit_ceiling then raise exception 'FSA_AGENT_CREDIT_CEILING_EXCEEDED'; end if;
 d_exp:=fsa_private.distributor_exposure(d.id,null)+p_opening_balance; if d_exp>d.credit_ceiling then raise exception 'FSA_DISTRIBUTOR_CREDIT_CEILING_EXCEEDED'; end if;
 insert into public.fsa_players(username,display_name,agent_id,balance,notes,created_by) values(trim(p_username),coalesce(nullif(trim(p_display_name),''),trim(p_username)),a.id,p_opening_balance,left(coalesce(p_notes,''),500),auth.uid()) returning id into new_id;
 insert into public.fsa_player_game_access(player_id,game_id) select new_id,aga.game_id from public.fsa_agent_game_access aga where aga.agent_id=a.id and (p_game_ids is null or aga.game_id=any(p_game_ids));
 if p_opening_balance>0 then insert into public.fsa_credit_ledger(player_id,distributor_id,agent_id,amount,balance_before,balance_after,reason,kind,actor_user_id) values(new_id,d.id,a.id,p_opening_balance,0,p_opening_balance,'Opening balance','opening',auth.uid()); end if;
 perform fsa_private.write_audit_v2('player_created','player',new_id::text,d.id,a.id,jsonb_build_object('username',trim(p_username),'opening_balance',p_opening_balance)); return new_id;
end $$;
create or replace function public.fsa_rpc_adjust_credits(p_player_id uuid,p_delta bigint,p_reason text)
returns public.fsa_credit_ledger language sql volatile security definer set search_path=pg_catalog,public,auth as $$ select fsa_private.apply_credit_v2(p_player_id,p_delta,p_reason,'adjustment',null); $$;
create or replace function public.fsa_rpc_reverse_credit(p_ledger_id uuid,p_reason text default null)
returns public.fsa_credit_ledger language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare orig public.fsa_credit_ledger; r public.fsa_credit_ledger;
begin
 perform fsa_private.assert_operator_v2(false,true,false,false,false,true); select * into orig from public.fsa_credit_ledger where id=p_ledger_id;
 if not found then raise exception 'FSA_LEDGER_NOT_FOUND'; end if; if orig.kind='reversal' then raise exception 'FSA_REVERSAL_OF_REVERSAL_DENIED'; end if;
 if exists(select 1 from public.fsa_credit_ledger where reverses_entry_id=orig.id) then raise exception 'FSA_ALREADY_REVERSED'; end if;
 r:=fsa_private.apply_credit_v2(orig.player_id,-orig.amount,coalesce(nullif(trim(p_reason),''),'Reversal: '||orig.reason),'reversal',orig.id); return r;
end $$;

create or replace function public.fsa_rpc_update_player(p_player_id uuid,p_display_name text,p_status text,p_agent_id uuid,p_notes text)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare actor public.fsa_operator_profiles; p public.fsa_players; src_a public.fsa_agents; dest_a public.fsa_agents; dest_d public.fsa_distributors; target_agent uuid; a_exp bigint; d_exp bigint;
begin
 actor:=fsa_private.assert_operator_v2(false,false,true,false,true,true); select * into p from public.fsa_players where id=p_player_id for update; if not found then raise exception 'FSA_PLAYER_NOT_FOUND'; end if;
 select * into src_a from public.fsa_agents where id=p.agent_id; if not found then raise exception 'FSA_AGENT_NOT_FOUND'; end if;
 if actor.role='agent' and actor.agent_id<>p.agent_id then raise exception 'FSA_SCOPE_DENIED'; end if; if actor.role='distributor' and actor.distributor_id<>src_a.distributor_id then raise exception 'FSA_SCOPE_DENIED'; end if;
 target_agent:=coalesce(p_agent_id,p.agent_id); if actor.role='agent' and target_agent<>actor.agent_id then raise exception 'FSA_REASSIGN_PARENT_ONLY'; end if; if p_status not in ('active','suspended') then raise exception 'FSA_INVALID_STATUS'; end if;
 select * into dest_a from public.fsa_agents where id=target_agent for update; if not found or dest_a.status<>'active' then raise exception 'FSA_AGENT_INACTIVE'; end if; select * into dest_d from public.fsa_distributors where id=dest_a.distributor_id for update; if not found or dest_d.status<>'active' then raise exception 'FSA_DISTRIBUTOR_INACTIVE'; end if;
 if actor.role='distributor' and actor.distributor_id<>dest_d.id then raise exception 'FSA_REASSIGN_FOUNDER_ONLY'; end if;
 if target_agent<>p.agent_id then a_exp:=fsa_private.agent_exposure(target_agent,null)+p.balance; if a_exp>dest_a.credit_ceiling then raise exception 'FSA_AGENT_CREDIT_CEILING_EXCEEDED'; end if; d_exp:=fsa_private.distributor_exposure(dest_d.id,p.id)+p.balance; if d_exp>dest_d.credit_ceiling then raise exception 'FSA_DISTRIBUTOR_CREDIT_CEILING_EXCEEDED'; end if; end if;
 update public.fsa_players set display_name=coalesce(nullif(trim(p_display_name),''),username),status=p_status,agent_id=target_agent,notes=left(coalesce(p_notes,''),500) where id=p.id;
 if target_agent<>p.agent_id then delete from public.fsa_player_game_access pga where pga.player_id=p.id and not exists(select 1 from public.fsa_agent_game_access aga where aga.agent_id=target_agent and aga.game_id=pga.game_id); end if;
 perform fsa_private.write_audit_v2('player_updated','player',p.id::text,dest_d.id,target_agent,jsonb_build_object('status',p_status,'agent_id',target_agent));
end $$;

create or replace function public.fsa_rpc_update_distributor(p_distributor_id uuid,p_display_name text,p_status text,p_credit_ceiling bigint,p_can_manage_agents boolean,p_can_manage_users boolean,p_can_cashier boolean,p_can_moderate boolean)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare exposure bigint; max_agent_ceiling bigint; au uuid;
begin
 perform fsa_private.assert_operator_v2(true,false,false,false,false,true); if p_status not in ('active','suspended') then raise exception 'FSA_INVALID_STATUS'; end if; if p_credit_ceiling<0 then raise exception 'FSA_INVALID_CEILING'; end if;
 exposure:=fsa_private.distributor_exposure(p_distributor_id,null); if p_credit_ceiling<exposure then raise exception 'FSA_CEILING_BELOW_CURRENT_EXPOSURE'; end if; select coalesce(max(credit_ceiling),0) into max_agent_ceiling from public.fsa_agents where distributor_id=p_distributor_id; if p_credit_ceiling<max_agent_ceiling then raise exception 'FSA_CEILING_BELOW_CHILD_AGENT'; end if;
 update public.fsa_distributors set display_name=coalesce(nullif(trim(p_display_name),''),display_name),status=p_status,credit_ceiling=p_credit_ceiling,can_manage_agents=coalesce(p_can_manage_agents,false),can_manage_users=coalesce(p_can_manage_users,false),can_cashier=coalesce(p_can_cashier,false),can_moderate=coalesce(p_can_moderate,false) where id=p_distributor_id returning auth_user_id into au; if not found then raise exception 'FSA_DISTRIBUTOR_NOT_FOUND'; end if;
 if au is not null then update public.fsa_operator_profiles set status=p_status,display_name=coalesce(nullif(trim(p_display_name),''),display_name) where user_id=au; end if;
 perform fsa_private.write_audit_v2('distributor_updated','distributor',p_distributor_id::text,p_distributor_id,null,jsonb_build_object('status',p_status,'credit_ceiling',p_credit_ceiling,'can_manage_agents',p_can_manage_agents,'can_manage_users',p_can_manage_users,'can_cashier',p_can_cashier,'can_moderate',p_can_moderate));
end $$;
create or replace function public.fsa_rpc_update_agent(p_agent_id uuid,p_display_name text,p_status text,p_credit_ceiling bigint,p_can_manage_users boolean,p_can_cashier boolean,p_can_moderate boolean)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare actor public.fsa_operator_profiles; a public.fsa_agents; d public.fsa_distributors; exposure bigint; au uuid;
begin
 actor:=fsa_private.assert_operator_v2(false,false,false,true,false,true); select * into a from public.fsa_agents where id=p_agent_id for update; if not found then raise exception 'FSA_AGENT_NOT_FOUND'; end if; select * into d from public.fsa_distributors where id=a.distributor_id for update; if not found then raise exception 'FSA_DISTRIBUTOR_NOT_FOUND'; end if;
 if actor.role='agent' then raise exception 'FSA_MANAGE_AGENTS_REQUIRED'; end if; if actor.role='distributor' and actor.distributor_id<>d.id then raise exception 'FSA_SCOPE_DENIED'; end if; if p_status not in ('active','suspended') then raise exception 'FSA_INVALID_STATUS'; end if; if p_credit_ceiling<0 or p_credit_ceiling>d.credit_ceiling then raise exception 'FSA_AGENT_CEILING_OUTSIDE_DISTRIBUTOR'; end if;
 exposure:=fsa_private.agent_exposure(p_agent_id,null); if p_credit_ceiling<exposure then raise exception 'FSA_CEILING_BELOW_CURRENT_EXPOSURE'; end if;
 update public.fsa_agents set display_name=coalesce(nullif(trim(p_display_name),''),display_name),status=p_status,credit_ceiling=p_credit_ceiling,can_manage_users=coalesce(p_can_manage_users,false),can_cashier=coalesce(p_can_cashier,false),can_moderate=coalesce(p_can_moderate,false) where id=p_agent_id returning auth_user_id into au; if au is not null then update public.fsa_operator_profiles set status=p_status,display_name=coalesce(nullif(trim(p_display_name),''),display_name) where user_id=au; end if;
 perform fsa_private.write_audit_v2('agent_updated','agent',p_agent_id::text,d.id,p_agent_id,jsonb_build_object('status',p_status,'credit_ceiling',p_credit_ceiling,'can_manage_users',p_can_manage_users,'can_cashier',p_can_cashier,'can_moderate',p_can_moderate));
end $$;
create or replace function public.fsa_rpc_update_agent(p_agent_id uuid,p_display_name text,p_status text,p_credit_ceiling bigint,p_can_cashier boolean,p_can_moderate boolean)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$ declare v_manage boolean; begin select can_manage_users into v_manage from public.fsa_agents where id=p_agent_id; perform public.fsa_rpc_update_agent(p_agent_id,p_display_name,p_status,p_credit_ceiling,coalesce(v_manage,true),p_can_cashier,p_can_moderate); end $$;

create or replace function public.fsa_rpc_reassign_agent(p_agent_id uuid,p_distributor_id uuid)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare a public.fsa_agents; d public.fsa_distributors; agent_bal bigint; dest_exp bigint;
begin
 perform fsa_private.assert_operator_v2(true,false,false,false,false,true); select * into a from public.fsa_agents where id=p_agent_id for update; if not found then raise exception 'FSA_AGENT_NOT_FOUND'; end if; select * into d from public.fsa_distributors where id=p_distributor_id for update; if not found or d.status<>'active' then raise exception 'FSA_DISTRIBUTOR_INACTIVE'; end if; if a.credit_ceiling>d.credit_ceiling then raise exception 'FSA_AGENT_CEILING_OUTSIDE_DISTRIBUTOR'; end if;
 agent_bal:=fsa_private.agent_exposure(a.id,null); dest_exp:=fsa_private.distributor_exposure(d.id,null)+case when a.distributor_id=d.id then 0 else agent_bal end; if dest_exp>d.credit_ceiling then raise exception 'FSA_DISTRIBUTOR_CREDIT_CEILING_EXCEEDED'; end if;
 update public.fsa_agents set distributor_id=d.id where id=a.id; delete from public.fsa_agent_game_access aga where aga.agent_id=a.id and not exists(select 1 from public.fsa_distributor_game_access dga where dga.distributor_id=d.id and dga.game_id=aga.game_id); delete from public.fsa_player_game_access pga using public.fsa_players p where pga.player_id=p.id and p.agent_id=a.id and not exists(select 1 from public.fsa_agent_game_access aga where aga.agent_id=a.id and aga.game_id=pga.game_id);
 perform fsa_private.write_audit_v2('agent_reassigned','agent',a.id::text,d.id,a.id,jsonb_build_object('from_distributor',a.distributor_id,'to_distributor',d.id));
end $$;

create or replace function public.fsa_rpc_set_distributor_games(p_distributor_id uuid,p_game_ids text[])
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
begin
 perform fsa_private.assert_operator_v2(true,false,false,false,false,true); if not exists(select 1 from public.fsa_distributors where id=p_distributor_id) then raise exception 'FSA_DISTRIBUTOR_NOT_FOUND'; end if; if exists(select 1 from unnest(coalesce(p_game_ids,array[]::text[])) gid where not exists(select 1 from public.fsa_games g where g.id=gid and g.active)) then raise exception 'FSA_INVALID_GAME'; end if;
 delete from public.fsa_distributor_game_access where distributor_id=p_distributor_id; insert into public.fsa_distributor_game_access(distributor_id,game_id) select p_distributor_id,g.id from public.fsa_games g where g.active and g.id=any(coalesce(p_game_ids,array[]::text[]));
 delete from public.fsa_agent_game_access aga using public.fsa_agents a where aga.agent_id=a.id and a.distributor_id=p_distributor_id and not exists(select 1 from public.fsa_distributor_game_access dga where dga.distributor_id=p_distributor_id and dga.game_id=aga.game_id); delete from public.fsa_player_game_access pga using public.fsa_players p,public.fsa_agents a where pga.player_id=p.id and p.agent_id=a.id and a.distributor_id=p_distributor_id and not exists(select 1 from public.fsa_agent_game_access aga where aga.agent_id=a.id and aga.game_id=pga.game_id);
 perform fsa_private.write_audit_v2('distributor_games_updated','distributor',p_distributor_id::text,p_distributor_id,null,jsonb_build_object('games',coalesce(p_game_ids,array[]::text[])));
end $$;
create or replace function public.fsa_rpc_set_agent_games(p_agent_id uuid,p_game_ids text[])
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare actor public.fsa_operator_profiles; a public.fsa_agents;
begin
 actor:=fsa_private.assert_operator_v2(false,false,false,true,false,true); select * into a from public.fsa_agents where id=p_agent_id; if not found then raise exception 'FSA_AGENT_NOT_FOUND'; end if; if actor.role='distributor' and actor.distributor_id<>a.distributor_id then raise exception 'FSA_SCOPE_DENIED'; end if; if actor.role='agent' then raise exception 'FSA_MANAGE_AGENTS_REQUIRED'; end if; if exists(select 1 from unnest(coalesce(p_game_ids,array[]::text[])) gid where not exists(select 1 from public.fsa_distributor_game_access dga where dga.distributor_id=a.distributor_id and dga.game_id=gid)) then raise exception 'FSA_DISTRIBUTOR_GAME_DENIED'; end if;
 delete from public.fsa_agent_game_access where agent_id=p_agent_id; insert into public.fsa_agent_game_access(agent_id,game_id) select p_agent_id,dga.game_id from public.fsa_distributor_game_access dga where dga.distributor_id=a.distributor_id and dga.game_id=any(coalesce(p_game_ids,array[]::text[])); delete from public.fsa_player_game_access pga using public.fsa_players p where pga.player_id=p.id and p.agent_id=p_agent_id and not exists(select 1 from public.fsa_agent_game_access aga where aga.agent_id=p_agent_id and aga.game_id=pga.game_id); perform fsa_private.write_audit_v2('agent_games_updated','agent',p_agent_id::text,a.distributor_id,p_agent_id,jsonb_build_object('games',coalesce(p_game_ids,array[]::text[])));
end $$;
create or replace function public.fsa_rpc_set_player_games(p_player_id uuid,p_game_ids text[])
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare actor public.fsa_operator_profiles; p public.fsa_players; a public.fsa_agents;
begin
 actor:=fsa_private.assert_operator_v2(false,false,true,false,true,true); select * into p from public.fsa_players where id=p_player_id; if not found then raise exception 'FSA_PLAYER_NOT_FOUND'; end if; select * into a from public.fsa_agents where id=p.agent_id; if actor.role='agent' and actor.agent_id<>a.id then raise exception 'FSA_SCOPE_DENIED'; end if; if actor.role='distributor' and actor.distributor_id<>a.distributor_id then raise exception 'FSA_SCOPE_DENIED'; end if; if exists(select 1 from unnest(coalesce(p_game_ids,array[]::text[])) gid where not exists(select 1 from public.fsa_agent_game_access aga where aga.agent_id=a.id and aga.game_id=gid)) then raise exception 'FSA_AGENT_GAME_DENIED'; end if;
 delete from public.fsa_player_game_access where player_id=p_player_id; insert into public.fsa_player_game_access(player_id,game_id) select p_player_id,aga.game_id from public.fsa_agent_game_access aga where aga.agent_id=a.id and aga.game_id=any(coalesce(p_game_ids,array[]::text[])); perform fsa_private.write_audit_v2('player_games_updated','player',p.id::text,a.distributor_id,a.id,jsonb_build_object('games',coalesce(p_game_ids,array[]::text[])));
end $$;

revoke execute on all functions in schema fsa_private from public,anon,authenticated;
grant execute on function fsa_private.session_operator_active() to authenticated;
grant execute on function fsa_private.session_role() to authenticated;
grant execute on function fsa_private.session_agent_id() to authenticated;
grant execute on function fsa_private.session_distributor_id() to authenticated;
revoke all on function public.fsa_rpc_update_distributor(uuid,text,text,bigint,boolean,boolean,boolean,boolean) from public,anon;
revoke all on function public.fsa_rpc_update_agent(uuid,text,text,bigint,boolean,boolean,boolean) from public,anon;
revoke all on function public.fsa_rpc_reassign_agent(uuid,uuid) from public,anon;
revoke all on function public.fsa_rpc_set_distributor_games(uuid,text[]) from public,anon;
grant execute on function public.fsa_rpc_update_distributor(uuid,text,text,bigint,boolean,boolean,boolean,boolean) to authenticated;
grant execute on function public.fsa_rpc_update_agent(uuid,text,text,bigint,boolean,boolean,boolean) to authenticated;
grant execute on function public.fsa_rpc_reassign_agent(uuid,uuid) to authenticated;
grant execute on function public.fsa_rpc_set_distributor_games(uuid,text[]) to authenticated;
revoke all on function public.fsa_rpc_create_player(text,text,uuid,bigint,text[],text) from public,anon;
revoke all on function public.fsa_rpc_adjust_credits(uuid,bigint,text) from public,anon;
revoke all on function public.fsa_rpc_reverse_credit(uuid,text) from public,anon;
revoke all on function public.fsa_rpc_update_player(uuid,text,text,uuid,text) from public,anon;
revoke all on function public.fsa_rpc_update_agent(uuid,text,text,bigint,boolean,boolean) from public,anon;
revoke all on function public.fsa_rpc_set_agent_games(uuid,text[]) from public,anon;
revoke all on function public.fsa_rpc_set_player_games(uuid,text[]) from public,anon;
grant execute on function public.fsa_rpc_create_player(text,text,uuid,bigint,text[],text) to authenticated;
grant execute on function public.fsa_rpc_adjust_credits(uuid,bigint,text) to authenticated;
grant execute on function public.fsa_rpc_reverse_credit(uuid,text) to authenticated;
grant execute on function public.fsa_rpc_update_player(uuid,text,text,uuid,text) to authenticated;
grant execute on function public.fsa_rpc_update_agent(uuid,text,text,bigint,boolean,boolean) to authenticated;
grant execute on function public.fsa_rpc_set_agent_games(uuid,text[]) to authenticated;
grant execute on function public.fsa_rpc_set_player_games(uuid,text[]) to authenticated;

drop policy if exists fsa_games_operator_read on public.fsa_games;
drop policy if exists fsa_meta_operator_read on public.fsa_backend_meta;
drop policy if exists fsa_profiles_scope_read on public.fsa_operator_profiles;
drop policy if exists fsa_agents_scope_read on public.fsa_agents;
drop policy if exists fsa_players_scope_read on public.fsa_players;
drop policy if exists fsa_agent_games_scope_read on public.fsa_agent_game_access;
drop policy if exists fsa_player_games_scope_read on public.fsa_player_game_access;
drop policy if exists fsa_ledger_scope_read on public.fsa_credit_ledger;
drop policy if exists fsa_audit_scope_read on public.fsa_audit_log;
create policy fsa_games_operator_read on public.fsa_games for select to authenticated using ((select fsa_private.session_operator_active()));
create policy fsa_meta_operator_read on public.fsa_backend_meta for select to authenticated using ((select fsa_private.session_operator_active()));
create policy fsa_distributors_scope_read on public.fsa_distributors for select to authenticated using ((select fsa_private.session_role())='founder' or id=(select fsa_private.session_distributor_id()));
create policy fsa_distributor_games_scope_read on public.fsa_distributor_game_access for select to authenticated using ((select fsa_private.session_role())='founder' or distributor_id=(select fsa_private.session_distributor_id()));
create policy fsa_profiles_scope_read on public.fsa_operator_profiles for select to authenticated using (user_id=(select auth.uid()) or (select fsa_private.session_role())='founder' or ((select fsa_private.session_role())='distributor' and ((role='distributor' and distributor_id=(select fsa_private.session_distributor_id())) or (role='agent' and exists(select 1 from public.fsa_agents a where a.id=agent_id and a.distributor_id=(select fsa_private.session_distributor_id()))))) or ((select fsa_private.session_role())='agent' and role='agent' and agent_id=(select fsa_private.session_agent_id())));
create policy fsa_agents_scope_read on public.fsa_agents for select to authenticated using ((select fsa_private.session_role())='founder' or ((select fsa_private.session_role())='distributor' and distributor_id=(select fsa_private.session_distributor_id())) or ((select fsa_private.session_role())='agent' and id=(select fsa_private.session_agent_id())));
create policy fsa_players_scope_read on public.fsa_players for select to authenticated using ((select fsa_private.session_role())='founder' or ((select fsa_private.session_role())='distributor' and exists(select 1 from public.fsa_agents a where a.id=agent_id and a.distributor_id=(select fsa_private.session_distributor_id()))) or ((select fsa_private.session_role())='agent' and agent_id=(select fsa_private.session_agent_id())));
create policy fsa_agent_games_scope_read on public.fsa_agent_game_access for select to authenticated using ((select fsa_private.session_role())='founder' or ((select fsa_private.session_role())='distributor' and exists(select 1 from public.fsa_agents a where a.id=agent_id and a.distributor_id=(select fsa_private.session_distributor_id()))) or ((select fsa_private.session_role())='agent' and agent_id=(select fsa_private.session_agent_id())));
create policy fsa_player_games_scope_read on public.fsa_player_game_access for select to authenticated using ((select fsa_private.session_role())='founder' or ((select fsa_private.session_role())='distributor' and exists(select 1 from public.fsa_players p join public.fsa_agents a on a.id=p.agent_id where p.id=player_id and a.distributor_id=(select fsa_private.session_distributor_id()))) or ((select fsa_private.session_role())='agent' and exists(select 1 from public.fsa_players p where p.id=player_id and p.agent_id=(select fsa_private.session_agent_id()))));
create policy fsa_ledger_scope_read on public.fsa_credit_ledger for select to authenticated using ((select fsa_private.session_role())='founder' or ((select fsa_private.session_role())='distributor' and distributor_id=(select fsa_private.session_distributor_id())) or ((select fsa_private.session_role())='agent' and agent_id=(select fsa_private.session_agent_id())));
create policy fsa_audit_scope_read on public.fsa_audit_log for select to authenticated using ((select fsa_private.session_role())='founder' or ((select fsa_private.session_role())='distributor' and distributor_id=(select fsa_private.session_distributor_id())) or ((select fsa_private.session_role())='agent' and agent_id=(select fsa_private.session_agent_id())) or actor_user_id=(select auth.uid()));
select pg_notify('pgrst','reload schema');
