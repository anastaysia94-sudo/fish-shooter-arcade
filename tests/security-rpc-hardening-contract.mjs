import fs from 'node:fs';
import assert from 'node:assert/strict';

const path = 'backend/supabase/migrations/20260916_fsa_rpc_security_hardening_v4.sql';
const sql = fs.readFileSync(path, 'utf8');

assert.match(sql, /create or replace function public\.fsa_rpc_multiplayer_power/i);
assert.match(sql, /existing\.actor_player_id\s+is\s+distinct\s+from\s+pid/i);
assert.match(sql, /raise exception 'FSA_NONCE_CONFLICT'/i);

const wrapperStart = sql.toLowerCase().indexOf('create or replace function public.fsa_rpc_update_agent');
assert.notEqual(wrapperStart, -1, 'compatibility update_agent wrapper must exist');
const wrapper = sql.slice(wrapperStart);
const authIndex = wrapper.indexOf('assert_operator_v2(false,false,false,true,false,true)');
const readIndex = wrapper.indexOf('select can_manage_users into v_manage');
assert.ok(authIndex >= 0, 'wrapper must authorize the operator');
assert.ok(readIndex >= 0, 'wrapper must preserve can_manage_users');
assert.ok(authIndex < readIndex, 'authorization must occur before privileged agent read');

assert.match(sql, /revoke all on function public\.fsa_rpc_multiplayer_power\(uuid,text,uuid\) from public,anon/i);
assert.match(sql, /revoke all on function public\.fsa_rpc_update_agent\(uuid,text,text,bigint,boolean,boolean\) from public,anon/i);

console.log('FSA_RPC_SECURITY_HARDENING_V4=PASS nonce_actor_binding=1 auth_before_read=1 least_privilege=1');
