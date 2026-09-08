-- F.S.A. Founder Console production backend v1
-- Applied to the connected Supabase project on 2026-09-08.
-- This file intentionally does not contain an environment-specific Founder auth UUID.

create schema if not exists fsa_private;
revoke all on schema fsa_private from public, anon, authenticated;
grant usage on schema fsa_private to authenticated;

create table if not exists public.fsa_games (
  id text primary key,
  name text not null unique,
  category text not null check (category in ('fish','slot')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.fsa_agents (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  username text not null,
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  can_cashier boolean not null default false,
  can_moderate boolean not null default false,
  credit_ceiling bigint not null default 0 check (credit_ceiling >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists fsa_agents_username_lower_uidx on public.fsa_agents ((lower(username)));

create table if not exists public.fsa_operator_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('founder','agent')),
  agent_id uuid references public.fsa_agents(id) on delete set null,
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fsa_operator_role_agent_ck check ((role='founder' and agent_id is null) or (role='agent' and agent_id is not null))
);

create table if not exists public.fsa_players (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  display_name text not null,
  agent_id uuid not null references public.fsa_agents(id) on delete restrict,
  status text not null default 'active' check (status in ('active','suspended')),
  balance bigint not null default 0 check (balance >= 0),
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists fsa_players_username_lower_uidx on public.fsa_players ((lower(username)));
create index if not exists fsa_players_agent_idx on public.fsa_players(agent_id);

create table if not exists public.fsa_agent_game_access (
  agent_id uuid not null references public.fsa_agents(id) on delete cascade,
  game_id text not null references public.fsa_games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (agent_id, game_id)
);

create table if not exists public.fsa_player_game_access (
  player_id uuid not null references public.fsa_players(id) on delete cascade,
  game_id text not null references public.fsa_games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (player_id, game_id)
);

create table if not exists public.fsa_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.fsa_players(id) on delete restrict,
  agent_id uuid not null references public.fsa_agents(id) on delete restrict,
  amount bigint not null check (amount <> 0),
  balance_before bigint not null check (balance_before >= 0),
  balance_after bigint not null check (balance_after >= 0),
  reason text not null check (char_length(trim(reason)) between 1 and 250),
  kind text not null default 'adjustment' check (kind in ('opening','adjustment','reversal')),
  reverses_entry_id uuid unique references public.fsa_credit_ledger(id) on delete restrict,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists fsa_credit_ledger_player_idx on public.fsa_credit_ledger(player_id, created_at desc);
create index if not exists fsa_credit_ledger_agent_idx on public.fsa_credit_ledger(agent_id, created_at desc);

create table if not exists public.fsa_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text not null,
  agent_id uuid references public.fsa_agents(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists fsa_audit_agent_idx on public.fsa_audit_log(agent_id, created_at desc);
create index if not exists fsa_audit_actor_idx on public.fsa_audit_log(actor_user_id, created_at desc);

create table if not exists public.fsa_backend_meta (
  id boolean primary key default true check (id),
  schema_version integer not null,
  production_authority boolean not null default true,
  require_mfa_for_mutations boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.fsa_backend_meta(id,schema_version,production_authority,require_mfa_for_mutations)
values(true,1,true,true)
on conflict(id) do update set schema_version=excluded.schema_version,production_authority=true,require_mfa_for_mutations=true,updated_at=now();

insert into public.fsa_games(id,name,category) values
('reef-run','Reef Run','fish'),('dragon-depths','Dragon Depths','fish'),('pirates-plunder','Pirate’s Plunder','fish'),('atlantis-rising','Atlantis Rising','fish'),('ice-tide','Ice Tide','fish'),('lava-reef','Lava Reef','fish'),('storm-seas','Storm Seas','fish'),('jade-dragon','Jade Dragon','fish'),('neon-ocean','Neon Ocean','fish'),('ancient-ruins','Ancient Ruins','fish'),('mecha-marine','Mecha Marine','fish'),('coral-chaos','Coral Chaos','fish'),('krakens-lair','Kraken’s Lair','fish'),('treasure-trials','Treasure Trials','fish'),('boss-rush','Boss Rush','fish'),
('ocean-fortune','Ocean Fortune','slot'),('treasure-reels','Treasure Reels','slot'),('sirens-gold','Siren’s Gold','slot'),('legend-of-atlantis','Legend of Atlantis','slot'),('shark-jackpot','Shark Jackpot','slot'),('pearl-rush','Pearl Rush','slot'),('kraken-spins','Kraken Spins','slot'),('reef-riches','Reef Riches','slot'),('lucky-tide','Lucky Tide','slot'),('deep-diamonds','Deep Diamonds','slot'),('golden-anchor','Golden Anchor','slot'),('mermaids-treasure','Mermaid’s Treasure','slot'),('pirate-jackpot','Pirate Jackpot','slot'),('coral-cash','Coral Cash','slot'),('neptunes-wheel','Neptune’s Wheel','slot'),('sea-king-777','Sea King 777','slot'),('ocean-wilds','Ocean Wilds','slot'),('diamond-dolphin','Diamond Dolphin','slot'),('wild-pearls','Wild Pearls','slot'),('treasure-temple','Treasure Temple','slot')
on conflict(id) do update set name=excluded.name,category=excluded.category,active=true;

create or replace function fsa_private.touch_updated_at()
returns trigger language plpgsql set search_path=pg_catalog as $$ begin new.updated_at=now(); return new; end $$;
create or replace function fsa_private.reject_immutable_mutation()
returns trigger language plpgsql set search_path=pg_catalog as $$ begin raise exception 'FSA_IMMUTABLE_RECORD'; end $$;

drop trigger if exists fsa_agents_touch on public.fsa_agents;
create trigger fsa_agents_touch before update on public.fsa_agents for each row execute function fsa_private.touch_updated_at();
drop trigger if exists fsa_operator_profiles_touch on public.fsa_operator_profiles;
create trigger fsa_operator_profiles_touch before update on public.fsa_operator_profiles for each row execute function fsa_private.touch_updated_at();
drop trigger if exists fsa_players_touch on public.fsa_players;
create trigger fsa_players_touch before update on public.fsa_players for each row execute function fsa_private.touch_updated_at();
drop trigger if exists fsa_credit_ledger_immutable on public.fsa_credit_ledger;
create trigger fsa_credit_ledger_immutable before update or delete on public.fsa_credit_ledger for each row execute function fsa_private.reject_immutable_mutation();
drop trigger if exists fsa_audit_log_immutable on public.fsa_audit_log;
create trigger fsa_audit_log_immutable before update or delete on public.fsa_audit_log for each row execute function fsa_private.reject_immutable_mutation();

create or replace function fsa_private.is_operator_active(p_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
  select exists(select 1 from public.fsa_operator_profiles p where p.user_id=p_uid and p.status='active');
$$;
create or replace function fsa_private.is_founder(p_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
  select exists(select 1 from public.fsa_operator_profiles p where p.user_id=p_uid and p.status='active' and p.role='founder');
$$;
create or replace function fsa_private.current_agent_id(p_uid uuid default auth.uid())
returns uuid language sql stable security definer set search_path=pg_catalog,public,auth as $$
  select p.agent_id from public.fsa_operator_profiles p where p.user_id=p_uid and p.status='active' and p.role='agent' limit 1;
$$;
create or replace function fsa_private.assert_operator(p_founder_only boolean default false,p_cashier boolean default false,p_moderator boolean default false,p_require_mfa boolean default true)
returns public.fsa_operator_profiles language plpgsql stable security definer set search_path=pg_catalog,public,auth as $$
declare v public.fsa_operator_profiles; a public.fsa_agents;
begin
  if auth.uid() is null then raise exception 'FSA_AUTH_REQUIRED'; end if;
  select * into v from public.fsa_operator_profiles where user_id=auth.uid();
  if not found or v.status<>'active' then raise exception 'FSA_OPERATOR_INACTIVE'; end if;
  if p_require_mfa and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'FSA_MFA_REQUIRED'; end if;
  if p_founder_only and v.role<>'founder' then raise exception 'FSA_FOUNDER_REQUIRED'; end if;
  if v.role='agent' then
    select * into a from public.fsa_agents where id=v.agent_id;
    if not found or a.status<>'active' then raise exception 'FSA_AGENT_INACTIVE'; end if;
    if p_cashier and not a.can_cashier then raise exception 'FSA_CASHIER_REQUIRED'; end if;
    if p_moderator and not a.can_moderate then raise exception 'FSA_MODERATOR_REQUIRED'; end if;
  end if;
  return v;
end $$;
create or replace function fsa_private.agent_exposure(p_agent uuid,p_exclude_player uuid default null)
returns bigint language sql stable security definer set search_path=pg_catalog,public as $$
  select coalesce(sum(balance),0)::bigint from public.fsa_players where agent_id=p_agent and (p_exclude_player is null or id<>p_exclude_player);
$$;
create or replace function fsa_private.write_audit(p_action text,p_target_type text,p_target_id text,p_agent_id uuid,p_details jsonb default '{}'::jsonb)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare v_role text;
begin
  select role into v_role from public.fsa_operator_profiles where user_id=auth.uid();
  insert into public.fsa_audit_log(actor_user_id,actor_role,agent_id,action,target_type,target_id,details)
  values(auth.uid(),coalesce(v_role,'system'),p_agent_id,p_action,p_target_type,p_target_id,coalesce(p_details,'{}'::jsonb));
end $$;
create or replace function fsa_private.apply_credit(p_player_id uuid,p_delta bigint,p_reason text,p_kind text default 'adjustment',p_reverses uuid default null)
returns public.fsa_credit_ledger language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare actor public.fsa_operator_profiles; p public.fsa_players; a public.fsa_agents; before_bal bigint; after_bal bigint; exposure bigint; entry public.fsa_credit_ledger;
begin
  if p_delta=0 then raise exception 'FSA_ZERO_ADJUSTMENT'; end if;
  if p_reason is null or char_length(trim(p_reason))=0 or char_length(p_reason)>250 then raise exception 'FSA_REASON_REQUIRED'; end if;
  actor:=fsa_private.assert_operator(false,true,false,true);
  select * into p from public.fsa_players where id=p_player_id for update;
  if not found then raise exception 'FSA_PLAYER_NOT_FOUND'; end if;
  if actor.role='agent' and actor.agent_id<>p.agent_id then raise exception 'FSA_SCOPE_DENIED'; end if;
  if p.status<>'active' and p_kind<>'reversal' then raise exception 'FSA_PLAYER_SUSPENDED'; end if;
  select * into a from public.fsa_agents where id=p.agent_id for update;
  if not found or a.status<>'active' then raise exception 'FSA_AGENT_INACTIVE'; end if;
  before_bal:=p.balance; after_bal:=before_bal+p_delta;
  if after_bal<0 then raise exception 'FSA_NEGATIVE_BALANCE'; end if;
  if p_delta>0 then exposure:=fsa_private.agent_exposure(a.id,p.id)+after_bal; if exposure>a.credit_ceiling then raise exception 'FSA_CREDIT_CEILING_EXCEEDED'; end if; end if;
  update public.fsa_players set balance=after_bal where id=p.id;
  insert into public.fsa_credit_ledger(player_id,agent_id,amount,balance_before,balance_after,reason,kind,reverses_entry_id,actor_user_id)
  values(p.id,p.agent_id,p_delta,before_bal,after_bal,trim(p_reason),p_kind,p_reverses,auth.uid()) returning * into entry;
  perform fsa_private.write_audit('credit_'||p_kind,'player',p.id::text,p.agent_id,jsonb_build_object('amount',p_delta,'balance_before',before_bal,'balance_after',after_bal,'reason',trim(p_reason),'ledger_id',entry.id));
  return entry;
end $$;

create or replace function public.fsa_rpc_create_player(p_username text,p_display_name text,p_agent_id uuid,p_opening_balance bigint default 0,p_game_ids text[] default null,p_notes text default '')
returns uuid language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare actor public.fsa_operator_profiles; a public.fsa_agents; new_id uuid; exposure bigint;
begin
  actor:=fsa_private.assert_operator(false,false,false,true);
  if actor.role='agent' then p_agent_id:=actor.agent_id; end if;
  if p_username is null or char_length(trim(p_username))<2 or char_length(p_username)>60 then raise exception 'FSA_INVALID_USERNAME'; end if;
  if exists(select 1 from public.fsa_players where lower(username)=lower(trim(p_username))) then raise exception 'FSA_USERNAME_TAKEN'; end if;
  select * into a from public.fsa_agents where id=p_agent_id for update;
  if not found or a.status<>'active' then raise exception 'FSA_AGENT_INACTIVE'; end if;
  if p_opening_balance<0 then raise exception 'FSA_NEGATIVE_BALANCE'; end if;
  if actor.role='agent' and p_opening_balance>0 and not a.can_cashier then raise exception 'FSA_CASHIER_REQUIRED'; end if;
  exposure:=fsa_private.agent_exposure(a.id,null)+p_opening_balance;
  if exposure>a.credit_ceiling then raise exception 'FSA_CREDIT_CEILING_EXCEEDED'; end if;
  insert into public.fsa_players(username,display_name,agent_id,balance,notes,created_by)
  values(trim(p_username),coalesce(nullif(trim(p_display_name),''),trim(p_username)),a.id,p_opening_balance,left(coalesce(p_notes,''),500),auth.uid()) returning id into new_id;
  insert into public.fsa_player_game_access(player_id,game_id)
  select new_id,aga.game_id from public.fsa_agent_game_access aga where aga.agent_id=a.id and (p_game_ids is null or aga.game_id=any(p_game_ids));
  if p_opening_balance>0 then insert into public.fsa_credit_ledger(player_id,agent_id,amount,balance_before,balance_after,reason,kind,actor_user_id) values(new_id,a.id,p_opening_balance,0,p_opening_balance,'Opening balance','opening',auth.uid()); end if;
  perform fsa_private.write_audit('player_created','player',new_id::text,a.id,jsonb_build_object('username',trim(p_username),'opening_balance',p_opening_balance));
  return new_id;
end $$;

create or replace function public.fsa_rpc_adjust_credits(p_player_id uuid,p_delta bigint,p_reason text)
returns public.fsa_credit_ledger language sql volatile security definer set search_path=pg_catalog,public,auth as $$ select fsa_private.apply_credit(p_player_id,p_delta,p_reason,'adjustment',null); $$;
create or replace function public.fsa_rpc_reverse_credit(p_ledger_id uuid,p_reason text default null)
returns public.fsa_credit_ledger language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare orig public.fsa_credit_ledger; r public.fsa_credit_ledger;
begin
  perform fsa_private.assert_operator(false,true,false,true);
  select * into orig from public.fsa_credit_ledger where id=p_ledger_id;
  if not found then raise exception 'FSA_LEDGER_NOT_FOUND'; end if;
  if orig.kind='reversal' then raise exception 'FSA_REVERSAL_OF_REVERSAL_DENIED'; end if;
  if exists(select 1 from public.fsa_credit_ledger where reverses_entry_id=orig.id) then raise exception 'FSA_ALREADY_REVERSED'; end if;
  r:=fsa_private.apply_credit(orig.player_id,-orig.amount,coalesce(nullif(trim(p_reason),''),'Reversal: '||orig.reason),'reversal',orig.id);
  return r;
end $$;
create or replace function public.fsa_rpc_update_player(p_player_id uuid,p_display_name text,p_status text,p_agent_id uuid,p_notes text)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare actor public.fsa_operator_profiles; p public.fsa_players; destination public.fsa_agents; target_agent uuid; exposure bigint;
begin
  actor:=fsa_private.assert_operator(false,false,true,true);
  select * into p from public.fsa_players where id=p_player_id for update;
  if not found then raise exception 'FSA_PLAYER_NOT_FOUND'; end if;
  if actor.role='agent' and actor.agent_id<>p.agent_id then raise exception 'FSA_SCOPE_DENIED'; end if;
  target_agent:=coalesce(p_agent_id,p.agent_id);
  if actor.role='agent' and target_agent<>actor.agent_id then raise exception 'FSA_REASSIGN_FOUNDER_ONLY'; end if;
  if p_status not in ('active','suspended') then raise exception 'FSA_INVALID_STATUS'; end if;
  if target_agent<>p.agent_id then
    if actor.role<>'founder' then raise exception 'FSA_REASSIGN_FOUNDER_ONLY'; end if;
    select * into destination from public.fsa_agents where id=target_agent for update;
    if not found or destination.status<>'active' then raise exception 'FSA_AGENT_INACTIVE'; end if;
    exposure:=fsa_private.agent_exposure(target_agent,null)+p.balance;
    if exposure>destination.credit_ceiling then raise exception 'FSA_CREDIT_CEILING_EXCEEDED'; end if;
  end if;
  update public.fsa_players set display_name=coalesce(nullif(trim(p_display_name),''),username),status=p_status,agent_id=target_agent,notes=left(coalesce(p_notes,''),500) where id=p.id;
  if target_agent<>p.agent_id then delete from public.fsa_player_game_access pga where pga.player_id=p.id and not exists(select 1 from public.fsa_agent_game_access aga where aga.agent_id=target_agent and aga.game_id=pga.game_id); end if;
  perform fsa_private.write_audit('player_updated','player',p.id::text,target_agent,jsonb_build_object('status',p_status,'agent_id',target_agent));
end $$;
create or replace function public.fsa_rpc_update_agent(p_agent_id uuid,p_display_name text,p_status text,p_credit_ceiling bigint,p_can_cashier boolean,p_can_moderate boolean)
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare exposure bigint; au uuid;
begin
  perform fsa_private.assert_operator(true,false,false,true);
  if p_status not in ('active','suspended') then raise exception 'FSA_INVALID_STATUS'; end if;
  if p_credit_ceiling<0 then raise exception 'FSA_INVALID_CEILING'; end if;
  exposure:=fsa_private.agent_exposure(p_agent_id,null);
  if p_credit_ceiling<exposure then raise exception 'FSA_CEILING_BELOW_CURRENT_EXPOSURE'; end if;
  update public.fsa_agents set display_name=coalesce(nullif(trim(p_display_name),''),display_name),status=p_status,credit_ceiling=p_credit_ceiling,can_cashier=coalesce(p_can_cashier,false),can_moderate=coalesce(p_can_moderate,false) where id=p_agent_id returning auth_user_id into au;
  if not found then raise exception 'FSA_AGENT_NOT_FOUND'; end if;
  if au is not null then update public.fsa_operator_profiles set status=p_status,display_name=coalesce(nullif(trim(p_display_name),''),display_name) where user_id=au; end if;
  perform fsa_private.write_audit('agent_updated','agent',p_agent_id::text,p_agent_id,jsonb_build_object('status',p_status,'credit_ceiling',p_credit_ceiling,'can_cashier',p_can_cashier,'can_moderate',p_can_moderate));
end $$;
create or replace function public.fsa_rpc_set_agent_games(p_agent_id uuid,p_game_ids text[])
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
begin
  perform fsa_private.assert_operator(true,false,false,true);
  if not exists(select 1 from public.fsa_agents where id=p_agent_id) then raise exception 'FSA_AGENT_NOT_FOUND'; end if;
  delete from public.fsa_agent_game_access where agent_id=p_agent_id;
  insert into public.fsa_agent_game_access(agent_id,game_id) select p_agent_id,g.id from public.fsa_games g where g.active and g.id=any(coalesce(p_game_ids,array[]::text[]));
  delete from public.fsa_player_game_access pga using public.fsa_players p where pga.player_id=p.id and p.agent_id=p_agent_id and not exists(select 1 from public.fsa_agent_game_access aga where aga.agent_id=p_agent_id and aga.game_id=pga.game_id);
  perform fsa_private.write_audit('agent_games_updated','agent',p_agent_id::text,p_agent_id,jsonb_build_object('games',coalesce(p_game_ids,array[]::text[])));
end $$;
create or replace function public.fsa_rpc_set_player_games(p_player_id uuid,p_game_ids text[])
returns void language plpgsql volatile security definer set search_path=pg_catalog,public,auth as $$
declare actor public.fsa_operator_profiles; p public.fsa_players;
begin
  actor:=fsa_private.assert_operator(false,false,true,true);
  select * into p from public.fsa_players where id=p_player_id;
  if not found then raise exception 'FSA_PLAYER_NOT_FOUND'; end if;
  if actor.role='agent' and actor.agent_id<>p.agent_id then raise exception 'FSA_SCOPE_DENIED'; end if;
  delete from public.fsa_player_game_access where player_id=p_player_id;
  insert into public.fsa_player_game_access(player_id,game_id) select p_player_id,aga.game_id from public.fsa_agent_game_access aga where aga.agent_id=p.agent_id and aga.game_id=any(coalesce(p_game_ids,array[]::text[]));
  perform fsa_private.write_audit('player_games_updated','player',p.id::text,p.agent_id,jsonb_build_object('games',coalesce(p_game_ids,array[]::text[])));
end $$;

alter table public.fsa_games enable row level security;
alter table public.fsa_agents enable row level security;
alter table public.fsa_operator_profiles enable row level security;
alter table public.fsa_players enable row level security;
alter table public.fsa_agent_game_access enable row level security;
alter table public.fsa_player_game_access enable row level security;
alter table public.fsa_credit_ledger enable row level security;
alter table public.fsa_audit_log enable row level security;
alter table public.fsa_backend_meta enable row level security;

revoke all on public.fsa_games,public.fsa_agents,public.fsa_operator_profiles,public.fsa_players,public.fsa_agent_game_access,public.fsa_player_game_access,public.fsa_credit_ledger,public.fsa_audit_log,public.fsa_backend_meta from anon,authenticated;
grant select on public.fsa_games,public.fsa_agents,public.fsa_operator_profiles,public.fsa_players,public.fsa_agent_game_access,public.fsa_player_game_access,public.fsa_credit_ledger,public.fsa_audit_log,public.fsa_backend_meta to authenticated;

grant execute on function public.fsa_rpc_create_player(text,text,uuid,bigint,text[],text) to authenticated;
grant execute on function public.fsa_rpc_adjust_credits(uuid,bigint,text) to authenticated;
grant execute on function public.fsa_rpc_reverse_credit(uuid,text) to authenticated;
grant execute on function public.fsa_rpc_update_player(uuid,text,text,uuid,text) to authenticated;
grant execute on function public.fsa_rpc_update_agent(uuid,text,text,bigint,boolean,boolean) to authenticated;
grant execute on function public.fsa_rpc_set_agent_games(uuid,text[]) to authenticated;
grant execute on function public.fsa_rpc_set_player_games(uuid,text[]) to authenticated;
grant execute on all functions in schema fsa_private to authenticated;

create policy fsa_games_operator_read on public.fsa_games for select to authenticated using (fsa_private.is_operator_active());
create policy fsa_meta_operator_read on public.fsa_backend_meta for select to authenticated using (fsa_private.is_operator_active());
create policy fsa_profiles_scope_read on public.fsa_operator_profiles for select to authenticated using (user_id=auth.uid() or fsa_private.is_founder() or (role='agent' and agent_id=fsa_private.current_agent_id()));
create policy fsa_agents_scope_read on public.fsa_agents for select to authenticated using (fsa_private.is_founder() or id=fsa_private.current_agent_id());
create policy fsa_players_scope_read on public.fsa_players for select to authenticated using (fsa_private.is_founder() or agent_id=fsa_private.current_agent_id());
create policy fsa_agent_games_scope_read on public.fsa_agent_game_access for select to authenticated using (fsa_private.is_founder() or agent_id=fsa_private.current_agent_id());
create policy fsa_player_games_scope_read on public.fsa_player_game_access for select to authenticated using (fsa_private.is_founder() or exists(select 1 from public.fsa_players p where p.id=player_id and p.agent_id=fsa_private.current_agent_id()));
create policy fsa_ledger_scope_read on public.fsa_credit_ledger for select to authenticated using (fsa_private.is_founder() or agent_id=fsa_private.current_agent_id());
create policy fsa_audit_scope_read on public.fsa_audit_log for select to authenticated using (fsa_private.is_founder() or agent_id=fsa_private.current_agent_id() or actor_user_id=auth.uid());

select pg_notify('pgrst','reload schema');
