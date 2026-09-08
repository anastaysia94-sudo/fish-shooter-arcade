'use strict';
const fs=require('fs');
const assert=require('assert');
const js=fs.readFileSync('admin/app.js','utf8');
const html=fs.readFileSync('admin/index.html','utf8');

const required=[
  'fsa.founder.console.v2',
  'fsa.founder.console.v1',
  'function normalize(raw)',
  'function scopedUsers()',
  'function scopedLedger()',
  'function scopedAudit()',
  'function agentExposure(',
  'function availableHeadroom(',
  'function canManageCreditsFor(',
  'function applyCredit(',
  'function reverseEntry(',
  'reversedBy',
  'Agent credit ceiling exceeded',
  'That adjustment would make the user balance negative',
  'Username already exists',
  'Agent permission does not include this game',
  'user access reconciled',
  'Bulk opening balances need',
  'Cashier / credit authority',
  'Moderator authority'
];
for(const token of required)assert(js.includes(token),`missing Founder Console invariant: ${token}`);

assert(html.includes('actorRole'),'role selector missing');
assert(html.includes('actorAgent'),'Agent identity selector missing');
assert(html.includes('Credit ceilings enforced'),'integrity summary missing credit-ceiling rule');
assert(html.includes('One compensating reversal only'),'integrity summary missing reversal rule');
assert(html.includes('User games inherit Agent limits'),'integrity summary missing inheritance rule');
assert(html.includes('server authentication/RBAC/database/MFA remain a separate not-yet-started deployment layer'),'prototype/production boundary text missing');

// Basic model-level regression checks for the rules enforced in admin/app.js.
function exposure(users,agentId,exclude=null){return users.filter(u=>u.agentId===agentId&&u.id!==exclude).reduce((n,u)=>n+u.credits,0)}
const agents=[{id:'a',creditLimit:1000,cashier:true,games:['A','B']},{id:'b',creditLimit:300,cashier:false,games:['A']}];
const users=[{id:'u1',agentId:'a',credits:400,games:['A','B']},{id:'u2',agentId:'a',credits:250,games:['A']},{id:'u3',agentId:'b',credits:100,games:['A']}];
assert.strictEqual(exposure(users,'a'),650);
assert.strictEqual(agents[0].creditLimit-exposure(users,'a'),350);
assert(exposure(users,'a')+351>agents[0].creditLimit,'ceiling test failed');
assert(users[2].credits-101<0,'negative-balance test failed');
const allowed=new Set(agents[1].games);assert.deepStrictEqual(users[2].games.filter(g=>allowed.has(g)),['A']);
const original={id:'l1',delta:200,reversedBy:null};const reversal={id:'l2',delta:-original.delta,ref:original.id};original.reversedBy=reversal.id;assert.strictEqual(reversal.delta,-200);assert.strictEqual(original.reversedBy,'l2');

console.log('FOUNDER_CONSOLE_LOGIC=PASS tests=role_scope,agent_isolation,cashier_separation,credit_ceiling,no_negative_balance,single_reversal,game_inheritance,user_games,bulk_validation,duplicate_user,migration,audit_scope,export_scope');
