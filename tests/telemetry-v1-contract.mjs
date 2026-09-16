import fs from 'node:fs';
import assert from 'node:assert/strict';

const telemetry = fs.readFileSync('telemetry-v1.js', 'utf8');
const migration = fs.readFileSync('backend/supabase/migrations/20260916_fsa_egm4000_telemetry_v1.sql', 'utf8');
const hardening = fs.readFileSync('backend/supabase/migrations/20260916_fsa_egm4000_telemetry_hardening_v1.sql', 'utf8');
const spectacle = fs.readFileSync('boss-spectacle-v13.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

const has = (text, pattern, message) => assert.match(text, pattern, message);
const lacks = (text, pattern, message) => assert.doesNotMatch(text, pattern, message);

// Runtime wiring: telemetry is an additive, non-blocking enhancement of the existing game.
has(spectacle, /telemetry-v1\.js/, 'v13 loader must attach telemetry-v1.js');
has(sw, /telemetry-v1\.js/, 'service worker must cache/refresh telemetry-v1.js');
has(telemetry, /window\.__FSA_TELEMETRY_V1__/, 'runtime must expose a diagnostics-only telemetry handle');
has(telemetry, /if\(!token\)\{state\.skipped\+\+;return null\}/, 'missing auth token must skip rather than block gameplay');
has(telemetry, /sampleMs=LOW\?30000:15000/, 'Low-Data mode must halve telemetry sample frequency');

// Only the narrow RPC surface may receive client telemetry.
for (const rpc of ['fsa_rpc_telemetry_start', 'fsa_rpc_telemetry_event', 'fsa_rpc_telemetry_end']) {
  has(telemetry, new RegExp(rpc), `client must call ${rpc}`);
}
lacks(telemetry, /\/rest\/v1\/(?!rpc\/)/, 'client must not write telemetry tables directly');
lacks(telemetry, /\b(email|password|payout|cashout|withdrawal)\b/i, 'telemetry client must not collect identity/payment secrets');
lacks(telemetry, /\b(balance|credits|gems|pearls)\s*:/i, 'telemetry payloads must not serialize wallet/currency state');

// Database authority: RPC-only append/read model with RLS and least privilege.
has(migration, /create table if not exists public\.fsa_telemetry_sessions/i, 'sessions table missing');
has(migration, /create table if not exists public\.fsa_telemetry_events/i, 'events table missing');
has(migration, /alter table public\.fsa_telemetry_sessions enable row level security/i, 'sessions RLS missing');
has(migration, /alter table public\.fsa_telemetry_events enable row level security/i, 'events RLS missing');
has(migration, /revoke all on table public\.fsa_telemetry_sessions from anon, authenticated/i, 'direct session-table access must be revoked');
has(migration, /revoke all on table public\.fsa_telemetry_events from anon, authenticated/i, 'direct event-table access must be revoked');
has(migration, /revoke all on sequence public\.fsa_telemetry_events_id_seq from anon, authenticated/i, 'event sequence must not be client-accessible');
has(hardening, /as restrictive\s+for all\s+to anon, authenticated\s+using \(false\)\s+with check \(false\)/is, 'final state must include restrictive deny-all direct-access policies');

// Player writes are bound to the authenticated active-player identity and their own open session.
has(migration, /pid := fsa_private\.session_player_id\(\)/, 'telemetry RPCs must bind to session_player_id()');
has(hardening, /s\.id=p_session_id and s\.player_id=pid and s\.ended_at is null/i, 'event writes must be ownership/open-session checked');
has(hardening, /join public\.fsa_player_game_access a on a\.game_id=g\.id and a\.player_id=pid/i, 'telemetry game ids must respect game entitlement');
has(hardening, /FSA_TELEMETRY_SESSION_LIMIT/, 'per-session abuse cap missing');
has(hardening, /open_count >= 5/, 'open-session abuse cap missing');
has(hardening, /when p_payload is null[\s\S]*?jsonb_typeof\(p_payload\) <> 'object'[\s\S]*?pg_column_size\(p_payload\) > 4096[\s\S]*?then false/i, 'safe non-object/size guard missing');
has(hardening, /item\.key = 'low_data'[\s\S]*?jsonb_typeof\(item\.value\) <> 'boolean'/i, 'typed boolean validation missing');
has(hardening, /mod\(\(item\.value #>> '\{\}'\)::numeric,1\) <> 0/i, 'integer-like telemetry validation missing');
has(hardening, /item\.key = 'boss_ratio'[\s\S]*?::numeric < 0[\s\S]*?::numeric > 1/i, 'boss-ratio range validation missing');

// The EGM4000 export is sanitized, pseudonymous and founder MFA-only.
has(hardening, /fsa_rpc_egm4000_telemetry_feed/, 'EGM4000 feed RPC missing');
has(hardening, /session_role\(\).*<> 'founder'/s, 'EGM4000 feed must require founder role');
has(hardening, /auth\.jwt\(\)->>'aal'.*<> 'aal2'/s, 'EGM4000 feed must require AAL2');
has(hardening, /returns table\(\s*event_id bigint,\s*session_id uuid,\s*player_key text,\s*event_type text,\s*game_id text,\s*room smallint,\s*payload jsonb,\s*occurred_at timestamptz,\s*source text\s*\)/is, 'final feed must expose only sanitized telemetry columns');
has(hardening, /extensions\.digest\(e\.player_id::text \|\| ':fsa-egm4000-v1','sha256'\)/i, 'final feed must pseudonymize the raw F.S.A. player id');
lacks(hardening, /returns table\([\s\S]*?\bplayer_id uuid\b[\s\S]*?\)\s*language/i, 'final feed must not return raw player_id');

// Telemetry must never gain wallet/account mutation authority.
for (const sql of [migration, hardening]) {
  for (const forbidden of [
    /update\s+public\.fsa_players/i,
    /insert\s+into\s+public\.fsa_players/i,
    /delete\s+from\s+public\.fsa_players/i,
    /update\s+public\.fsa_player_cloud_state/i,
    /insert\s+into\s+public\.fsa_player_cloud_state/i,
    /set\s+balance\s*=/i,
    /balance\s*=\s*balance/i,
    /set\s+(credits|gems|pearls)\s*=/i
  ]) {
    lacks(sql, forbidden, `telemetry migration contains forbidden financial/account mutation: ${forbidden}`);
  }
}

// Authenticated callers get EXECUTE only on the intended RPCs; anon/public do not.
const finalSql = migration + '\n' + hardening;
for (const signature of [
  'fsa_rpc_telemetry_start\\(text,boolean,text\\)',
  'fsa_rpc_telemetry_event\\(uuid,text,text,smallint,jsonb,uuid\\)',
  'fsa_rpc_telemetry_end\\(uuid,jsonb\\)',
  'fsa_rpc_egm4000_telemetry_feed\\(bigint,integer\\)'
]) {
  has(finalSql, new RegExp(`revoke all on function public\\.${signature} from public, anon`, 'i'), `public/anon revoke missing for ${signature}`);
  has(finalSql, new RegExp(`grant execute on function public\\.${signature} to authenticated`, 'i'), `authenticated EXECUTE grant missing for ${signature}`);
}

console.log('F.S.A. -> EGM4000 telemetry v1 final-state contract: PASS');
