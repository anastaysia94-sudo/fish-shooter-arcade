-- Applied migration: fsa_distributor_hierarchy_schema_v2
create table public.fsa_distributors (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  username text not null,
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  can_manage_agents boolean not null default true,
  can_manage_users boolean not null default true,
  can_cashier boolean not null default false,
  can_moderate boolean not null default false,
  credit_ceiling bigint not null default 0 check (credit_ceiling >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index fsa_distributors_username_lower_uidx on public.fsa_distributors ((lower(username)));
create index fsa_distributors_created_by_idx on public.fsa_distributors(created_by);

create table public.fsa_distributor_game_access (
  distributor_id uuid not null references public.fsa_distributors(id) on delete cascade,
  game_id text not null references public.fsa_games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (distributor_id, game_id)
);
create index fsa_distributor_game_access_game_idx on public.fsa_distributor_game_access(game_id);

alter table public.fsa_agents add column distributor_id uuid;
alter table public.fsa_agents add column can_manage_users boolean not null default true;

do $$
declare v_dist uuid;
begin
  if exists(select 1 from public.fsa_agents where distributor_id is null) then
    select id into v_dist from public.fsa_distributors where lower(username)='founder-direct' limit 1;
    if v_dist is null then
      insert into public.fsa_distributors(username,display_name,status,can_manage_agents,can_manage_users,can_cashier,can_moderate,credit_ceiling,created_by)
      values('founder-direct','Founder Direct','active',true,true,true,true,9223372036854775807,null)
      returning id into v_dist;
      insert into public.fsa_distributor_game_access(distributor_id,game_id)
      select v_dist,id from public.fsa_games where active;
    end if;
    update public.fsa_agents set distributor_id=v_dist where distributor_id is null;
  end if;
end $$;
alter table public.fsa_agents alter column distributor_id set not null;
alter table public.fsa_agents add constraint fsa_agents_distributor_id_fkey foreign key(distributor_id) references public.fsa_distributors(id) on delete restrict;
create index fsa_agents_distributor_idx on public.fsa_agents(distributor_id);

alter table public.fsa_operator_profiles add column distributor_id uuid references public.fsa_distributors(id) on delete set null;
alter table public.fsa_operator_profiles drop constraint if exists fsa_operator_profiles_role_check;
alter table public.fsa_operator_profiles drop constraint if exists fsa_operator_role_agent_ck;
alter table public.fsa_operator_profiles add constraint fsa_operator_profiles_role_check check (role in ('founder','distributor','agent'));
alter table public.fsa_operator_profiles add constraint fsa_operator_role_scope_ck check (
  (role='founder' and distributor_id is null and agent_id is null) or
  (role='distributor' and distributor_id is not null and agent_id is null) or
  (role='agent' and distributor_id is null and agent_id is not null)
);
create index if not exists fsa_operator_profiles_distributor_idx on public.fsa_operator_profiles(distributor_id);

alter table public.fsa_credit_ledger add column distributor_id uuid;
update public.fsa_credit_ledger l set distributor_id=a.distributor_id from public.fsa_agents a where a.id=l.agent_id and l.distributor_id is null;
alter table public.fsa_credit_ledger alter column distributor_id set not null;
alter table public.fsa_credit_ledger add constraint fsa_credit_ledger_distributor_id_fkey foreign key(distributor_id) references public.fsa_distributors(id) on delete restrict;
create index fsa_credit_ledger_distributor_idx on public.fsa_credit_ledger(distributor_id,created_at desc);

alter table public.fsa_audit_log add column distributor_id uuid references public.fsa_distributors(id) on delete set null;
update public.fsa_audit_log l set distributor_id=a.distributor_id from public.fsa_agents a where a.id=l.agent_id and l.distributor_id is null;
create index fsa_audit_distributor_idx on public.fsa_audit_log(distributor_id,created_at desc);

create trigger fsa_distributors_touch before update on public.fsa_distributors for each row execute function fsa_private.touch_updated_at();
alter table public.fsa_distributors enable row level security;
alter table public.fsa_distributor_game_access enable row level security;
revoke all on public.fsa_distributors, public.fsa_distributor_game_access from anon,authenticated;
grant select on public.fsa_distributors, public.fsa_distributor_game_access to authenticated;
update public.fsa_backend_meta set schema_version=2,updated_at=now() where id=true;
select pg_notify('pgrst','reload schema');
