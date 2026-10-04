import fs from 'node:fs'
import assert from 'node:assert/strict'

const migration=fs.readFileSync('backend/supabase/migrations/20261004_fsa_operator_gameplay_logs_v1.sql','utf8')
const ui=fs.readFileSync('admin/gameplay-logs.js','utf8')
const html=fs.readFileSync('admin/index.html','utf8')

assert.match(migration,/create or replace function public\.fsa_rpc_operator_telemetry_feed/i)
assert.match(migration,/fsa_private\.assert_operator_v2\(false,false,false,false,false,true\)/i)
assert.match(migration,/actor\.role='founder'/i)
assert.match(migration,/actor\.role='distributor' and actor\.distributor_id=d\.id/i)
assert.match(migration,/actor\.role='agent' and actor\.agent_id=a\.id/i)
assert.match(migration,/revoke all on function public\.fsa_rpc_operator_telemetry_feed[\s\S]*from public, anon/i)
assert.match(migration,/grant execute on function public\.fsa_rpc_operator_telemetry_feed[\s\S]*to authenticated/i)

const fnBody=migration.match(/create or replace function public\.fsa_rpc_operator_telemetry_feed[\s\S]*?as \$\$([\s\S]*?)\$\$;/i)?.[1]||''
assert.ok(fnBody,'operator telemetry function body missing')
assert.doesNotMatch(fnBody,/\b(insert|update|delete|truncate)\b\s+(into\s+)?public\./i,'gameplay log feed must remain read-only')

assert.match(ui,/fsa_rpc_operator_telemetry_feed/)
assert.match(ui,/currentLevel!=='aal2'/)
assert.doesNotMatch(ui,/\.from\(['"]fsa_telemetry_(?:events|sessions)['"]\)/,'browser must not directly select telemetry tables')
assert.match(html,/gameplay-logs\.js/)

console.log('FSA_FOUNDER_GAMEPLAY_LOGS_CONTRACT=PASS')
