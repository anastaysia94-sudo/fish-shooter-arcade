-- Applied migration: fsa_player_cloud_write_v4
-- Players may sync only preferences/session metadata. Progression and wallet fields remain server-controlled.

create or replace function fsa_private.validate_player_cloud_update()
returns trigger
language plpgsql
set search_path=pg_catalog,public,auth
as $$
begin
  if new.player_id<>old.player_id or new.level<>old.level or new.xp<>old.xp or new.gems<>old.gems or new.pearls<>old.pearls then
    raise exception 'FSA_PLAYER_PROGRESS_SERVER_ONLY';
  end if;
  if new.revision<>old.revision+1 then raise exception 'FSA_SYNC_CONFLICT'; end if;
  if new.preferences is null or jsonb_typeof(new.preferences)<>'object' or octet_length(new.preferences::text)>4096 then raise exception 'FSA_INVALID_PREFERENCES'; end if;
  if exists(select 1 from jsonb_object_keys(new.preferences) k where k not in ('audio','sfx','music','quality','data_saver','reduced_motion','hud_scale')) then raise exception 'FSA_INVALID_PREFERENCE_KEY'; end if;
  if new.preferences ? 'audio' and jsonb_typeof(new.preferences->'audio')<>'boolean' then raise exception 'FSA_INVALID_PREFERENCES'; end if;
  if new.preferences ? 'sfx' and jsonb_typeof(new.preferences->'sfx')<>'boolean' then raise exception 'FSA_INVALID_PREFERENCES'; end if;
  if new.preferences ? 'music' and jsonb_typeof(new.preferences->'music')<>'boolean' then raise exception 'FSA_INVALID_PREFERENCES'; end if;
  if new.preferences ? 'quality' and new.preferences->>'quality' not in ('auto','lite','balanced','hd') then raise exception 'FSA_INVALID_PREFERENCES'; end if;
  if new.preferences ? 'data_saver' and new.preferences->>'data_saver' not in ('auto','on','off') then raise exception 'FSA_INVALID_PREFERENCES'; end if;
  if new.preferences ? 'reduced_motion' and new.preferences->>'reduced_motion' not in ('system','on','off') then raise exception 'FSA_INVALID_PREFERENCES'; end if;
  if new.preferences ? 'hud_scale' and (jsonb_typeof(new.preferences->'hud_scale')<>'number' or (new.preferences->>'hud_scale')::numeric<0.8 or (new.preferences->>'hud_scale')::numeric>1.3) then raise exception 'FSA_INVALID_PREFERENCES'; end if;
  if new.last_room is not null and (new.last_room<0 or new.last_room>2) then raise exception 'FSA_INVALID_ROOM'; end if;
  if new.last_game_id is not null and not exists(
    select 1 from public.fsa_player_game_access pga
    join public.fsa_games g on g.id=pga.game_id and g.active
    where pga.player_id=new.player_id and pga.game_id=new.last_game_id
  ) then raise exception 'FSA_GAME_ACCESS_DENIED'; end if;
  new.updated_at:=now();
  return new;
end $$;

drop trigger if exists fsa_player_cloud_validate on public.fsa_player_cloud_state;
create trigger fsa_player_cloud_validate before update on public.fsa_player_cloud_state
for each row execute function fsa_private.validate_player_cloud_update();

create or replace function fsa_private.init_player_cloud_state()
returns trigger
language plpgsql
set search_path=pg_catalog,public
as $$
begin
  insert into public.fsa_player_cloud_state(player_id) values(new.id) on conflict(player_id) do nothing;
  return new;
end $$;

drop trigger if exists fsa_player_cloud_init on public.fsa_players;
create trigger fsa_player_cloud_init after insert on public.fsa_players
for each row execute function fsa_private.init_player_cloud_state();

insert into public.fsa_player_cloud_state(player_id)
select id from public.fsa_players on conflict(player_id) do nothing;

grant update(preferences,last_game_id,last_room,revision) on public.fsa_player_cloud_state to authenticated;

drop policy if exists fsa_player_cloud_self_update on public.fsa_player_cloud_state;
create policy fsa_player_cloud_self_update on public.fsa_player_cloud_state
for update to authenticated
using (player_id=(select fsa_private.session_player_id()))
with check (player_id=(select fsa_private.session_player_id()));

update public.fsa_backend_meta set schema_version=greatest(schema_version,4),updated_at=now() where id=true;
select pg_notify('pgrst','reload schema');
