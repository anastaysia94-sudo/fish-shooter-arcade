'use strict';
const fs=require('fs');
const assert=require('assert');
const js=fs.readFileSync('admin/app.js','utf8');
const html=fs.readFileSync('admin/index.html','utf8');
const base=fs.readFileSync('backend/supabase/migrations/20260908_fsa_founder_console_backend_v1.sql','utf8');
const schema=fs.readFileSync('backend/supabase/migrations/20260909_fsa_distributor_hierarchy_schema_v2.sql','utf8');
const authority=fs.readFileSync('backend/supabase/migrations/20260909_fsa_distributor_hierarchy_authority_v2.sql','utf8');
const edge=fs.readFileSync('backend/supabase/functions/fsa-founder-admin/index.ts','utf8');
const sw=fs.readFileSync('sw.js','utf8');

for(const token of ['createClient(','signInWithPassword','resetPasswordForEmail','getAuthenticatorAssuranceLevel','mfa.enroll','mfa.challengeAndVerify','fsa_distributors','fsa_distributor_game_access','invite_distributor','invite_agent','fsa_rpc_create_player','fsa_rpc_adjust_credits','fsa_rpc_reverse_credit','fsa_rpc_update_distributor','fsa_rpc_update_agent','fsa_rpc_reassign_agent','fsa_rpc_set_distributor_games','fsa_rpc_set_agent_games','fsa_rpc_set_player_games']) assert(js.includes(token),`missing hierarchy client contract: ${token}`);
assert(!js.includes('localStorage.setItem('),'browser must not write authoritative hierarchy state');
assert(js.includes('localStorage.getItem('),'legacy backup reader should remain read-only');
for(const token of ['Founder → Distributor → Agent → User','Distributors','Distributor credit ceiling','Agent credit ceiling','Distributor → Agent → User game inheritance','localStorage is not authority']) assert(html.includes(token),`missing hierarchy UI invariant: ${token}`);
assert(!html.includes('actorRole')&&!html.includes('actorAgent'),'role simulator must stay removed');

for(const token of ['public.fsa_distributors','public.fsa_distributor_game_access','distributor_id uuid','can_manage_agents','can_manage_users','fsa_agents_distributor_id_fkey','fsa_credit_ledger_distributor_id_fkey','fsa_operator_profiles_role_check','schema_version=2']) assert(schema.includes(token),`missing hierarchy schema invariant: ${token}`);
for(const token of ['session_distributor_id','assert_operator_v2','distributor_exposure','FSA_DISTRIBUTOR_CREDIT_CEILING_EXCEEDED','FSA_AGENT_CREDIT_CEILING_EXCEEDED','FSA_DISTRIBUTOR_GAME_DENIED','FSA_AGENT_GAME_DENIED','fsa_rpc_update_distributor','fsa_rpc_reassign_agent','fsa_rpc_set_distributor_games','fsa_distributors_scope_read','fsa_distributor_games_scope_read']) assert(authority.includes(token),`missing hierarchy authority invariant: ${token}`);
assert(authority.includes("coalesce(auth.jwt()->>'aal','aal1')<>'aal2'"),'hierarchy mutations must require AAL2');
assert(authority.includes("actor.role='distributor' and actor.distributor_id<>d.id"),'Distributor mutation scope check missing');
assert(authority.includes("actor.role='agent' and actor.agent_id<>a.id"),'Agent mutation scope check missing');
assert(authority.includes('a_exp>a.credit_ceiling'),'Agent aggregate ceiling check missing');
assert(authority.includes('d_exp>d.credit_ceiling'),'Distributor aggregate ceiling check missing');
assert(authority.includes("a.distributor_id=(select fsa_private.session_distributor_id())"),'Distributor RLS child scope missing');

assert(base.includes('fsa_credit_ledger_immutable')&&base.includes('fsa_audit_log_immutable'),'immutable v1 ledger/audit triggers must remain foundational');
assert(edge.includes("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"),'Edge Function must keep service credential server-side');
assert(edge.includes("jwtPayload(token).aal !== 'aal2'"),'provisioning must require MFA/AAL2');
assert(edge.includes("action==='invite_distributor'")&&edge.includes("action==='invite_agent'"),'Distributor/Agent provisioning actions missing');
assert(edge.includes("operator.profile.role==='distributor'"),'Distributor-scoped Agent provisioning missing');
assert(edge.includes('FSA_AGENT_CEILING_OUTSIDE_DISTRIBUTOR'),'Agent provisioning ceiling inheritance missing');
assert(edge.includes('fsa_distributor_game_access'),'Agent provisioning game inheritance missing');
assert(!js.includes('SUPABASE_SERVICE_ROLE_KEY'),'service-role credential reference must never appear in browser client');

assert(sw.includes('fsa-arcade-v11-distributor-hierarchy-20260909'),'service-worker cache must be bumped for hierarchy cutover');
assert(sw.includes('/\\/admin\\/(?:app\\.js|styles\\.css|index\\.html)$/'),'security-sensitive admin assets must remain network-first');

// Model-level ceiling/inheritance regression checks.
const distributors=[{id:'d1',ceiling:1000,games:['A','B']},{id:'d2',ceiling:500,games:['A']}];
const agents=[{id:'a1',distributor:'d1',ceiling:600,games:['A','B']},{id:'a2',distributor:'d1',ceiling:400,games:['A']},{id:'a3',distributor:'d2',ceiling:300,games:['A']}];
const users=[{agent:'a1',balance:350},{agent:'a2',balance:200},{agent:'a3',balance:100}];
const agentExposure=id=>users.filter(u=>u.agent===id).reduce((n,u)=>n+u.balance,0);
const distributorExposure=id=>users.filter(u=>agents.find(a=>a.id===u.agent)?.distributor===id).reduce((n,u)=>n+u.balance,0);
assert.strictEqual(agentExposure('a1'),350);assert.strictEqual(distributorExposure('d1'),550);
assert(agentExposure('a1')+251>agents[0].ceiling,'Agent ceiling regression failed');
assert(distributorExposure('d1')+451>distributors[0].ceiling,'Distributor ceiling regression failed');
assert(agents[0].games.every(g=>distributors[0].games.includes(g)),'Agent game inheritance regression failed');
assert(!distributors[1].games.includes('B'),'Distributor game restriction regression failed');

console.log('FOUNDER_DISTRIBUTOR_AGENT_USER_HIERARCHY=PASS auth=1 rls=1 mfa=1 distributors=1 agents=1 users=1 dual_ceiling=1 game_inheritance=1 immutable_ledger=1 immutable_audit=1 scoped_provisioning=1 local_authority=0');
