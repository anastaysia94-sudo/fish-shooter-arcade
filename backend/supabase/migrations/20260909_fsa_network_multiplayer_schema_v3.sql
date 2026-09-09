-- F.S.A. real network multiplayer v3: durable player identity, tables, seats and event stream.
alter table public.fsa_players add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists fsa_players_auth_user_uidx on public.fsa_players(auth_user_id) where auth_user_id is not null;

alter table public.fsa_credit_ledger drop constraint if exists fsa_credit_ledger_kind_check;
alter table public.fsa_credit_ledger add constraint fsa_credit_ledger_kind_check check (kind in ('opening','adjustment','reversal','gameplay_spend','gameplay_reward'));

create table public.fsa_multiplayer_tables (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.fsa_games(id) on delete restrict,
  room_tier text not null check (room_tier in ('bronze','silver','gold')),
  status text not null default 'open' check (status in ('open','active','closed')),
  max_players smallint not null check (max_players between 2 and 4),
  host_player_id uuid not null references public.fsa_players(id) on delete restrict,
  event_seq bigint not null default 0 check (event_seq >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);
create index fsa_multiplayer_tables_status_idx on public.fsa_multiplayer_tables(status,last_activity_at desc);
create index fsa_multiplayer_tables_game_idx on public.fsa_multiplayer_tables(game_id,room_tier,status);
create index fsa_multiplayer_tables_host_idx on public.fsa_multiplayer_tables(host_player_id);

create table public.fsa_multiplayer_seats (
  table_id uuid not null references public.fsa_multiplayer_tables(id) on delete cascade,
  seat_no smallint not null check (seat_no between 1 and 4),
  player_id uuid not null references public.fsa_players(id) on delete restrict,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  score bigint not null default 0 check (score >= 0),
  shots bigint not null default 0 check (shots >= 0),
  hits bigint not null default 0 check (hits >= 0),
  weapon text not null default 'pulse' check (weapon in ('pulse','spread','rail')),
  shot_value bigint not null default 2 check (shot_value > 0),
  last_shot_at timestamptz,
  primary key (table_id,seat_no),
  unique (table_id,player_id),
  unique (player_id)
);
create index fsa_multiplayer_seats_player_idx on public.fsa_multiplayer_seats(player_id);
create index fsa_multiplayer_seats_seen_idx on public.fsa_multiplayer_seats(table_id,last_seen_at desc);

create table public.fsa_multiplayer_events (
  id bigserial primary key,
  table_id uuid not null references public.fsa_multiplayer_tables(id) on delete cascade,
  event_seq bigint not null,
  actor_player_id uuid references public.fsa_players(id) on delete set null,
  client_nonce uuid,
  event_type text not null check (event_type in ('table_created','player_joined','player_left','table_closed','shot','power')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (table_id,event_seq),
  unique (client_nonce)
);
create index fsa_multiplayer_events_table_idx on public.fsa_multiplayer_events(table_id,event_seq desc);
create index fsa_multiplayer_events_actor_idx on public.fsa_multiplayer_events(actor_player_id,created_at desc);

create trigger fsa_multiplayer_tables_touch before update on public.fsa_multiplayer_tables for each row execute function fsa_private.touch_updated_at();

alter table public.fsa_multiplayer_tables enable row level security;
alter table public.fsa_multiplayer_seats enable row level security;
alter table public.fsa_multiplayer_events enable row level security;

revoke all on public.fsa_multiplayer_tables,public.fsa_multiplayer_seats,public.fsa_multiplayer_events from anon,authenticated;
grant select on public.fsa_multiplayer_tables,public.fsa_multiplayer_seats,public.fsa_multiplayer_events to authenticated;
grant usage,select on sequence public.fsa_multiplayer_events_id_seq to service_role;

update public.fsa_backend_meta set schema_version=3,updated_at=now() where id=true;

do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fsa_multiplayer_tables') then alter publication supabase_realtime add table public.fsa_multiplayer_tables; end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fsa_multiplayer_seats') then alter publication supabase_realtime add table public.fsa_multiplayer_seats; end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fsa_multiplayer_events') then alter publication supabase_realtime add table public.fsa_multiplayer_events; end if;
  end if;
end $$;

select pg_notify('pgrst','reload schema');
