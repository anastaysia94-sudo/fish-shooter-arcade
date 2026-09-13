-- Applied migration: fsa_player_cloud_state_v4
-- Cross-device player preferences/session metadata. Wallet authority remains fsa_players.balance.

create table if not exists public.fsa_player_cloud_state (
  player_id uuid primary key references public.fsa_players(id) on delete cascade,
  level integer not null default 1 check (level between 1 and 10000),
  xp bigint not null default 0 check (xp >= 0),
  gems bigint not null default 0 check (gems >= 0),
  pearls bigint not null default 0 check (pearls >= 0),
  preferences jsonb not null default '{"audio":true,"sfx":true,"music":true,"quality":"auto","data_saver":"auto","reduced_motion":"system","hud_scale":1}'::jsonb,
  last_game_id text references public.fsa_games(id) on delete set null,
  last_room smallint check (last_room is null or last_room between 0 and 2),
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now()
);

create index if not exists fsa_player_cloud_state_updated_idx
  on public.fsa_player_cloud_state(updated_at desc);

alter table public.fsa_player_cloud_state enable row level security;
revoke all on public.fsa_player_cloud_state from anon, authenticated;
grant select on public.fsa_player_cloud_state to authenticated;

drop policy if exists fsa_player_cloud_self_read on public.fsa_player_cloud_state;
create policy fsa_player_cloud_self_read
on public.fsa_player_cloud_state
for select to authenticated
using (player_id=(select fsa_private.session_player_id()));
