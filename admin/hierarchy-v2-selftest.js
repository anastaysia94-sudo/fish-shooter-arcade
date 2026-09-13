import fs from 'node:fs'

const read = p => fs.readFileSync(p,'utf8')
const app = read('admin/app.js')
const migration = read('backend/supabase/migrations/20260913_fsa_hierarchy_atomic_provisioning_v2.sql')
const contract = read('backend/supabase/functions/fsa-founder-admin/atomic-contract.ts')
const notes = read('backend/supabase/functions/fsa-founder-admin/source-v5-notes.ts')

const checks = [
  ['Distributor table/UI', app.includes('renderDistributors') && app.includes('openInviteDistributor') && app.includes('fsa_rpc_update_distributor')],
  ['Agent table/UI', app.includes('renderAgents') && app.includes('openInviteAgent') && app.includes('fsa_rpc_update_agent')],
  ['Hierarchy game inheritance UI', app.includes('distributorGameIds') && app.includes('agentGameIds') && app.includes('playerGameIds')],
  ['Atomic distributor provisioning', migration.includes('fsa_rpc_provision_distributor_operator')],
  ['Atomic agent provisioning', migration.includes('fsa_rpc_provision_agent_operator')],
  ['AAL2 database enforcement', migration.includes('assert_operator_v2')],
  ['Parent game subset enforcement', migration.includes('FSA_DISTRIBUTOR_GAME_DENIED')],
  ['Parent credit ceiling enforcement', migration.includes('FSA_AGENT_CEILING_OUTSIDE_DISTRIBUTOR')],
  ['Tracked v5 deployment contract', notes.includes('version: 5') && notes.includes("verifyJwt: true")],
  ['No browser service-role credential', !app.includes('SERVICE_ROLE_KEY') && !app.includes('service_role')],
  ['Atomic contract source of truth', contract.includes("sourceOfTruth: 'postgres'") && contract.includes('requiresAal2: true')]
]

const failed = checks.filter(([,ok])=>!ok)
if (failed.length) {
  for (const [name] of failed) console.error('FAIL:',name)
  process.exit(1)
}
console.log(`FSA_HIERARCHY_V2=PASS checks=${checks.length}`)
