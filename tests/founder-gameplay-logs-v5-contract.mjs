import fs from 'node:fs'
import assert from 'node:assert/strict'

const sql=fs.readFileSync(new URL('../backend/supabase/migrations/20261004_fsa_operator_gameplay_logs_v5.sql',import.meta.url),'utf8')
const ui=fs.readFileSync(new URL('../admin/gameplay-logs.js',import.meta.url),'utf8')
const security=fs.readFileSync(new URL('../admin/security-completion.js',import.meta.url),'utf8')

assert.match(sql,/security definer/i,'gameplay log RPC must be server-authorized')
assert.match(sql,/auth\.jwt\(\)->>'aal'.*aal2/s,'gameplay logs must require MFA AAL2')
assert.match(sql,/fsa_private\.session_operator_active\(\)/,'gameplay logs must inherit parent-aware operator suspension rules')
assert.match(sql,/op\.role='founder'/,'Founder scope must exist')
assert.match(sql,/op\.role='distributor'.*d\.id=op\.distributor_id/s,'Distributor scope must be hierarchy limited')
assert.match(sql,/op\.role='agent'.*a\.id=op\.agent_id/s,'Agent scope must be own-agent limited')
assert.match(sql,/revoke all on function public\.fsa_rpc_operator_gameplay_logs.*from public, anon/is,'anonymous execution must be revoked')
assert.match(sql,/grant execute on function public\.fsa_rpc_operator_gameplay_logs.*to authenticated/is,'authenticated operators may call the guarded RPC')
assert.match(sql,/pg_notify\('pgrst','reload schema'\)/,'migration must reload the PostgREST schema cache')
assert.doesNotMatch(sql,/balance|credit_ledger|wallet/i,'gameplay log RPC must remain non-financial')
assert.match(ui,/fsa_rpc_operator_gameplay_logs/,'Founder Console must call the scoped RPC')
assert.match(ui,/getAuthenticatorAssuranceLevel/,'client should preflight MFA before requesting logs')
assert.match(ui,/Read-only, non-financial session telemetry/i,'UI must label the data boundary')
assert.match(ui,/Search loaded rows/,'search must accurately state that it filters currently loaded pages')
assert.match(ui,/if\(reset\)\{rows=\[\];before=null\}/,'failed reset loads must reset both rows and pagination cursor')
assert.match(security,/import\('\.\/gameplay-logs\.js'\)/,'security layer must load gameplay logs module')

console.log('founder-gameplay-logs-v5 contracts: PASS')
