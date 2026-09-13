import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PLAYER_URL='https://anastaysia94-sudo.github.io/fish-shooter-arcade/'
const ALLOWED_ORIGIN='https://anastaysia94-sudo.github.io'
const admin=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})

function cors(req:Request){const o=req.headers.get('origin');return {'access-control-allow-origin':o===ALLOWED_ORIGIN?o:ALLOWED_ORIGIN,'access-control-allow-headers':'authorization, x-client-info, apikey, content-type','access-control-allow-methods':'POST, OPTIONS','vary':'Origin'}}
function json(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...cors(req)}})}
function payload(token:string):Record<string,unknown>{const p=token.split('.')[1];if(!p)return {};try{const n=p.replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(n.padEnd(Math.ceil(n.length/4)*4,'=')))}catch{return {}}}
async function findUserByEmail(email:string){for(let page=1;page<=100;page++){const {data,error}=await admin.auth.admin.listUsers({page,perPage:100});if(error)throw error;const u=data.users.find(x=>(x.email||'').toLowerCase()===email.toLowerCase());if(u)return u;if(data.users.length<100)break}return null}
async function ensureUnlinked(userId:string){const [op,p]=await Promise.all([admin.from('fsa_operator_profiles').select('user_id').eq('user_id',userId).maybeSingle(),admin.from('fsa_players').select('id').eq('auth_user_id',userId).maybeSingle()]);if(op.error)throw op.error;if(p.error)throw p.error;if(op.data||p.data)throw new Error('FSA_AUTH_ACCOUNT_ALREADY_LINKED')}
async function provisionAuth(email:string,displayName:string){let u=await findUserByEmail(email),invited=false;if(!u){const {data,error}=await admin.auth.admin.inviteUserByEmail(email,{data:{display_name:displayName,app:'fsa',fsa_role:'player'},redirectTo:PLAYER_URL});if(error)throw error;u=data.user;invited=true}if(!u)throw new Error('AUTH_USER_CREATE_FAILED');await ensureUnlinked(u.id);return {user:u,invited}}
async function operator(req:Request){const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!token)throw new Error('FSA_AUTH_REQUIRED');const {data,error}=await admin.auth.getUser(token);if(error||!data.user)throw new Error('FSA_AUTH_INVALID');if(payload(token).aal!=='aal2')throw new Error('FSA_MFA_REQUIRED');const r=await admin.from('fsa_operator_profiles').select('user_id,role,status,distributor_id,agent_id').eq('user_id',data.user.id).maybeSingle();if(r.error)throw r.error;if(!r.data||r.data.status!=='active'||!['founder','distributor','agent'].includes(r.data.role))throw new Error('FSA_OPERATOR_SCOPE_REQUIRED');return {user:data.user,profile:r.data}}
function identity(body:any){const email=String(body.email||'').trim().toLowerCase(),username=String(body.username||'').trim(),displayName=String(body.display_name||username).trim();if(!email||!email.includes('@'))throw new Error('INVALID_EMAIL');if(!/^[A-Za-z0-9][A-Za-z0-9._-]{1,59}$/.test(username))throw new Error('INVALID_USERNAME');if(displayName.length<1||displayName.length>80)throw new Error('INVALID_DISPLAY_NAME');return {email,username,displayName}}
function opening(body:any){const n=Number(body.opening_balance||0);if(!Number.isSafeInteger(n)||n<0)throw new Error('FSA_INVALID_OPENING_BALANCE');return n}

Deno.serve(async(req:Request)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});if(req.method!=='POST')return json(req,{error:'METHOD_NOT_ALLOWED'},405);try{const op=await operator(req);const body:any=await req.json().catch(()=>({}));const action=String(body.action||'');
if(action==='health')return json(req,{ok:true,role:op.profile.role,aal:'aal2'});
if(action==='invite_player'){
  const {email,username,displayName}=identity(body),openingBalance=opening(body),agentId=String(body.agent_id||'');if(!agentId)throw new Error('FSA_AGENT_REQUIRED');
  const {user,invited}=await provisionAuth(email,displayName);
  try{const requested=Array.isArray(body.game_ids)?body.game_ids.map(String):null;const {data:playerId,error}=await admin.rpc('fsa_service_create_network_player',{p_actor_user_id:op.user.id,p_auth_user_id:user.id,p_username:username,p_display_name:displayName,p_agent_id:agentId,p_opening_balance:openingBalance,p_game_ids:requested?.length?requested:null,p_notes:String(body.notes||'').slice(0,500)});if(error)throw error;const p=await admin.from('fsa_players').select('id,username,display_name,agent_id,status,balance,auth_user_id').eq('id',playerId).single();if(p.error)throw p.error;return json(req,{ok:true,invited,player:p.data})}catch(e){if(invited)await admin.auth.admin.deleteUser(user.id).catch(()=>undefined);throw e}
}
if(action==='link_player'){
  const playerId=String(body.player_id||''),email=String(body.email||'').trim().toLowerCase();if(!playerId)throw new Error('FSA_PLAYER_REQUIRED');if(!email||!email.includes('@'))throw new Error('INVALID_EMAIL');
  const pr=await admin.from('fsa_players').select('id,username,display_name,status,auth_user_id').eq('id',playerId).maybeSingle();if(pr.error)throw pr.error;if(!pr.data)throw new Error('FSA_PLAYER_NOT_FOUND');if(pr.data.auth_user_id)throw new Error('FSA_PLAYER_AUTH_ALREADY_LINKED');
  const {user,invited}=await provisionAuth(email,pr.data.display_name||pr.data.username);
  try{const {data:linkedId,error}=await admin.rpc('fsa_service_link_network_player',{p_actor_user_id:op.user.id,p_player_id:playerId,p_auth_user_id:user.id});if(error)throw error;return json(req,{ok:true,invited,player_id:linkedId})}catch(e){if(invited)await admin.auth.admin.deleteUser(user.id).catch(()=>undefined);throw e}
}
return json(req,{error:'UNKNOWN_ACTION'},400)}catch(e){const m=e instanceof Error?e.message:'UNKNOWN_ERROR';const status=m.includes('AUTH')?401:(m.includes('MFA')||m.includes('SCOPE')||m.includes('REQUIRED'))?403:(m.includes('INVALID')||m.includes('LINKED')||m.includes('TAKEN')||m.includes('DENIED')||m.includes('SUSPENDED')||m.includes('INACTIVE'))?400:500;return json(req,{error:m},status)}})
