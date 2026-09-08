-- F.S.A. Founder Console security hardening: pin trigger helper search paths.
create or replace function fsa_private.touch_updated_at()
returns trigger language plpgsql set search_path=pg_catalog as $$
begin
  new.updated_at=now();
  return new;
end $$;

create or replace function fsa_private.reject_immutable_mutation()
returns trigger language plpgsql set search_path=pg_catalog as $$
begin
  raise exception 'FSA_IMMUTABLE_RECORD';
end $$;
