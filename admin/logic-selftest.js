'use strict';
const fs=require('fs');
const assert=require('assert');
const js=fs.readFileSync('admin/app.js','utf8');
const html=fs.readFileSync('admin/index.html','utf8');
const sql=fs.readFileSync('backend/supabase/migrations/20260908_fsa_founder_console_backend_v1.sql','utf8');
const harden=fs.readFileSync('backend/supabase/migrations/20260908_fsa_harden_trigger_search_paths.sql','utf8');
const least=fs.readFileSync('backend/supabase/migrations/20260908_fsa_least_privilege_execute_v1.sql','utf8');
const perf=fs.readFileSync('backend/supabase/migrations/20260908_fsa_performance_hardening_v1.sql','utf8');
const edge=fs.readFileSync('backend/supabase/functions/fsa-founder-admin/index.ts','utf8');
const sw=fs.readFileSync('sw.js','utf8');

for(const token of [
  'createClient(',
  'signInWithPassword',
  'resetPasswordForEmail',
  'getAuthenticatorAssuranceLevel',
  'mfa.enroll',
  'mfa.challengeAndVerify',
  'fsa_rpc_create_player',
  'fsa_rpc_adjust_credits',
  'fsa_rpc_reverse_credit',
  'fsa_rpc_update_player',
  'fsa_rpc_update_agent',
  'fsa_rpc_set_agent_games',
  'fsa_rpc_set_player_games',
  "supabase.functions.invoke('fsa-founder-admin'"
]) assert(js.includes(token),`missing production client contract: ${token}`);

assert(!js.includes('localStorage.setItem('),'browser must not write authoritative Founder Console state');
assert(js.includes('localStorage.getItem('),'legacy browser backup reader should remain available');
assert(!html.includes('actorRole'),'role simulator must be removed');
assert(!html.includes('actorAgent'),'Agent simulator must be removed');
assert(html.includes('server-authoritative'),'production authority banner missing');
assert(html.includes('MFA required for mutations'),'MFA integrity rule missing');
assert(html.includes('localStorage is not authority'),'browser-authority boundary missing');
assert(html.includes('Secure operator sign in'),'real auth gate missing');

for(const token of [
  'enable row level security',
  'fsa_operator_profiles',
  'fsa_credit_ledger',
  'fsa_audit_log',
  'FSA_MFA_REQUIRED',
  "auth.jwt()->>'aal'",
  'FSA_CREDIT_CEILING_EXCEEDED',
  'FSA_NEGATIVE_BALANCE',
  'FSA_ALREADY_REVERSED',
  'fsa_credit_ledger_immutable',
  'fsa_audit_log_immutable',
  'grant select on public.fsa_games',
  'to authenticated'
]) assert(sql.toLowerCase().includes(token.toLowerCase()),`missing database invariant: ${token}`);

assert(harden.includes('set search_path=pg_catalog'),'trigger helper search paths must be pinned');
assert(least.includes('revoke execute on all functions in schema fsa_private from public, anon, authenticated'),'private helpers must default-deny execution');
for(const fn of ['is_operator_active(uuid)','is_founder(uuid)','current_agent_id(uuid)'])assert(least.includes(`grant execute on function fsa_private.${fn} to authenticated`),`RLS helper grant missing: ${fn}`);
for(const idx of ['fsa_agents_created_by_idx','fsa_credit_ledger_actor_idx','fsa_operator_profiles_agent_idx','fsa_players_created_by_idx'])assert(perf.includes(idx),`performance index migration missing: ${idx}`);
assert(perf.includes('(select auth.uid())'),'RLS Auth calls should use init-plan friendly SELECT form');

assert(!sql.includes('service_role'),'migration must not embed a service-role secret');
assert(edge.includes("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"),'Edge Function must source service credential from environment');
assert(edge.includes("claims.aal !== 'aal2'"),'Edge Function must require MFA/AAL2');
assert(edge.includes("profile.role !== 'founder'"),'Edge Function must require Founder role');
assert(edge.includes('inviteUserByEmail'),'Agent auth provisioning missing');
assert(!js.includes('SUPABASE_SERVICE_ROLE_KEY'),'service-role credential reference must never appear in browser client');
assert(sw.includes("fsa-arcade-v10-founder-backend-20260908"),'service worker cache must be bumped for production admin cutover');
assert(sw.includes("/\\/admin\\/(?:app\\.js|styles\\.css|index\\.html)$/"),'Founder Console assets must use the security-sensitive network-first route');

const tableNames=['fsa_games','fsa_agents','fsa_operator_profiles','fsa_players','fsa_agent_game_access','fsa_player_game_access','fsa_credit_ledger','fsa_audit_log','fsa_backend_meta'];
for(const table of tableNames)assert(sql.includes(`public.${table}`),`missing production table: ${table}`);

console.log('FOUNDER_CONSOLE_PRODUCTION_BACKEND=PASS auth=1 rls=1 mfa=1 server_rbac=1 immutable_ledger=1 immutable_audit=1 least_privilege=1 perf_hardening=1 fresh_admin_assets=1 local_authority=0 edge_admin=1');
