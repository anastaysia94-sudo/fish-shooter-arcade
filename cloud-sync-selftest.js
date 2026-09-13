const fs=require('fs');
const assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html');
const cloud=read('cloud-sync-v11.js');
const css=read('cloud-sync-v11.css');
const sw=read('sw.js');
const schema=read('backend/supabase/migrations/20260913_fsa_player_cloud_state_v4.sql');
const writes=read('backend/supabase/migrations/20260913_fsa_player_cloud_write_v4.sql');

assert(index.includes('cloud-sync-v11.css'),'cloud CSS must be loaded');
assert(index.includes('cloud-sync-v11.js'),'cloud JS must be loaded');
assert(index.includes('fsa.v11.guestBackup'),'guest state must be restored before runtime startup');
assert(index.indexOf('guestStateRestore')<index.indexOf('src="fsa-v9.js"'),'guest restore must run before fsa-v9');
assert(sw.includes("'./cloud-sync-v11.css'")&&sw.includes("'./cloud-sync-v11.js'"),'PWA cache must include cloud shell');
assert(sw.includes('fsa-arcade-v13-cloud-sync'),'cloud release must bump cache generation');

assert(cloud.includes("client.rpc('fsa_rpc_player_bootstrap')"),'server bootstrap is required');
assert(cloud.includes("from('fsa_player_cloud_state')"),'cloud state must be RLS-backed');
assert(cloud.includes("from('fsa_player_game_access')"),'game access must be server sourced');
assert(cloud.includes(".eq('revision',expected)"),'sync writes must use optimistic revision matching');
assert(cloud.includes('Public self-registration is intentionally disabled'),'public sign-up must remain disabled');
assert(cloud.includes('Local solo-demo outcomes are session-only'),'wallet boundary must be disclosed');
assert(!/service[_-]?role/i.test(cloud),'browser cloud code must never contain service-role material');
assert(!/deposit|withdrawal|cash redemption/i.test(cloud),'cloud player code must not add real-money flows');

const fish=['reef-run','dragon-depths','pirates-plunder','atlantis-rising','ice-tide','lava-reef','storm-seas','jade-dragon','neon-ocean','ancient-ruins','mecha-marine','coral-chaos','krakens-lair','treasure-trials','boss-rush'];
const slots=['ocean-fortune','treasure-reels','sirens-gold','legend-of-atlantis','shark-jackpot','pearl-rush','kraken-spins','reef-riches','lucky-tide','deep-diamonds','golden-anchor','mermaids-treasure','pirate-jackpot','coral-cash','neptunes-wheel','sea-king-777','ocean-wilds','diamond-dolphin','wild-pearls','treasure-temple'];
for(const id of [...fish,...slots])assert(cloud.includes(`'${id}'`),`missing canonical game id ${id}`);

assert(schema.includes('enable row level security'),'cloud state must use RLS');
assert(schema.includes('session_player_id'),'RLS must bind to authenticated player identity');
assert(writes.includes('FSA_PLAYER_PROGRESS_SERVER_ONLY'),'browser must not write progression fields');
assert(writes.includes('new.revision<>old.revision+1'),'database must enforce monotonic optimistic revisions');
assert(writes.includes('grant update(preferences,last_game_id,last_room,revision)'),'only preference/session columns may be player-updatable');
assert(writes.includes('FSA_GAME_ACCESS_DENIED'),'last-game sync must respect player game access');
assert(css.includes('.cloud-locked'),'locked games need visible account-state styling');

console.log(`cloud-sync-v11 selftest passed: ${fish.length} fish + ${slots.length} slots, RLS cloud state, optimistic sync, guest/offline boundary`);
