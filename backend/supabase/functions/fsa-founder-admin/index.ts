import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ADMIN_URL = 'https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/'
const PLAYER_URL = 'https://anastaysia94-sudo.github.io/fish-shooter-arcade/'
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods': 'POST, OPTIONS'
  }})
}
function jwtPayload(token: string): Record<string, unknown> {
  const part = token.split('.')[1]; if (!part) return {}
  const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
  try { return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))) } catch { return {} }
}
async function findUserByEmail(email: string) {
  for (let page=1; page<=10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 }); if (error) throw error
    const found = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase()); if (found) return found
    if (data.users.length < 100) break
  }
  return null
}
async function operatorFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('FSA_AUTH_REQUIRED')
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) throw new Error('FSA_AUTH_INVALID')
  if (jwtPayload(token).aal !== 'aal2') throw new Error('FSA_MFA_REQUIRED')
  const { data: profile, error } = await admin.from('fsa_operator_profiles').select('user_id,role,status,distributor_id,agent_id').eq('user_id', userData.user.id).maybeSingle()
  if (error) throw error
  if (!profile || profile.status !== 'active' || !['founder','distributor','agent'].includes(profile.role)) throw new Error('FSA_OPERATOR_SCOPE_REQUIRED')
  let distributor:any = null, agent:any = null
  if (profile.role === 'distributor') {
    const r = await admin.from('fsa_distributors').select('id,status,can_manage_agents,can_manage_users,can_cashier,can_moderate,credit_ceiling').eq('id', profile.distributor_id).maybeSingle()
    if (r.error) throw r.error
    if (!r.data || r.data.status !== 'active') throw new Error('FSA_DISTRIBUTOR_INACTIVE')
    distributor = r.data
  }
  if (profile.role === 'agent') {
    const r = await admin.from('fsa_agents').select('id,distributor_id,status,can_manage_users,can_cashier,can_moderate,credit_ceiling').eq('id', profile.agent_id).maybeSingle()
    if (r.error) throw r.error
    if (!r.data || r.data.status !== 'active') throw new Error('FSA_AGENT_INACTIVE')
    agent = r.data
    const d = await admin.from('fsa_distributors').select('id,status').eq('id', agent.distributor_id).maybeSingle()
    if (d.error) throw d.error
    if (!d.data || d.data.status !== 'active') throw new Error('FSA_DISTRIBUTOR_INACTIVE')
  }
  return { user: userData.user, profile, distributor, agent }
}
async function ensureUnlinkedAuthUser(userId: string) {
  const [op, player] = await Promise.all([
    admin.from('fsa_operator_profiles').select('user_id').eq('user_id', userId).maybeSingle(),
    admin.from('fsa_players').select('id').eq('auth_user_id', userId).maybeSingle()
  ])
  if (op.error) throw op.error; if (player.error) throw player.error
  if (op.data || player.data) throw new Error('FSA_AUTH_ACCOUNT_ALREADY_LINKED')
}
async function provisionAuth(email: string, displayName: string, role: string, redirectTo: string) {
  let authUser = await findUserByEmail(email), invited = false
  if (!authUser) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { display_name: displayName, app: 'fsa', fsa_role: role }, redirectTo
    })
    if (error) throw error
    authUser = data.user; invited = true
  }
  if (!authUser) throw new Error('AUTH_USER_CREATE_FAILED')
  await ensureUnlinkedAuthUser(authUser.id)
  return { authUser, invited }
}
async function validActiveGames(category?: string) {
  let q:any = admin.from('fsa_games').select('id').eq('active', true)
  if (category) q = q.eq('category', category)
  const { data, error } = await q; if (error) throw error
  return new Set((data || []).map((g:any) => g.id))
}
function identity(body: any) {
  const email = String(body.email || '').trim().toLowerCase()
  const username = String(body.username || '').trim()
  const displayName = String(body.display_name || username).trim()
  if (!email || !email.includes('@')) throw new Error('INVALID_EMAIL')
  if (username.length < 2 || username.length > 60) throw new Error('INVALID_USERNAME')
  if (displayName.length < 1 || displayName.length > 80) throw new Error('INVALID_DISPLAY_NAME')
  return { email, username, displayName }
}
function ceiling(body:any) { return Math.max(0, Math.floor(Number(body.credit_ceiling || 0))) }

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'access-control-allow-origin':'*','access-control-allow-headers':'authorization, x-client-info, apikey, content-type','access-control-allow-methods':'POST, OPTIONS' } })
  if (req.method !== 'POST') return json({ error:'METHOD_NOT_ALLOWED' },405)
  try {
    const operator = await operatorFromRequest(req)
    const body:any = await req.json().catch(()=>({})); const action=String(body.action||'')
    if (action==='health') return json({ok:true,role:operator.profile.role,aal:'aal2',distributor_id:operator.profile.distributor_id||operator.agent?.distributor_id||null,agent_id:operator.profile.agent_id||null})

    if (action==='invite_distributor') {
      if (operator.profile.role!=='founder') throw new Error('FSA_FOUNDER_REQUIRED')
      const {email,username,displayName}=identity(body), creditCeiling=ceiling(body)
      const dup=await admin.from('fsa_distributors').select('id').ilike('username',username).maybeSingle(); if(dup.error)throw dup.error; if(dup.data)return json({error:'FSA_USERNAME_TAKEN'},409)
      const {authUser,invited}=await provisionAuth(email,displayName,'distributor',ADMIN_URL)
      let distributor:any=null
      try {
        const ins=await admin.from('fsa_distributors').insert({auth_user_id:authUser.id,username,display_name:displayName,status:'active',can_manage_agents:Boolean(body.can_manage_agents),can_manage_users:Boolean(body.can_manage_users),can_cashier:Boolean(body.can_cashier),can_moderate:Boolean(body.can_moderate),credit_ceiling:creditCeiling,created_by:operator.user.id}).select('id,username,display_name,status,credit_ceiling,can_manage_agents,can_manage_users,can_cashier,can_moderate').single()
        if(ins.error)throw ins.error; distributor=ins.data
        const p=await admin.from('fsa_operator_profiles').insert({user_id:authUser.id,role:'distributor',distributor_id:distributor.id,display_name:displayName,status:'active'}); if(p.error)throw p.error
        const valid=await validActiveGames(); const requested=Array.isArray(body.game_ids)?body.game_ids.map(String):[]; const ids=requested.length?requested.filter((x:string)=>valid.has(x)):[...valid]
        if(ids.length){const ga=await admin.from('fsa_distributor_game_access').insert(ids.map((game_id:string)=>({distributor_id:distributor.id,game_id})));if(ga.error)throw ga.error}
        await admin.from('fsa_audit_log').insert({actor_user_id:operator.user.id,actor_role:'founder',distributor_id:distributor.id,action:'distributor_invited',target_type:'distributor',target_id:distributor.id,details:{email,username,invited,credit_ceiling:creditCeiling}})
        return json({ok:true,invited,distributor})
      } catch(e) {
        if(distributor?.id) await admin.from('fsa_distributors').delete().eq('id',distributor.id)
        if(invited) await admin.auth.admin.deleteUser(authUser.id).catch(()=>undefined)
        throw e
      }
    }

    if (action==='invite_agent') {
      if (!['founder','distributor'].includes(operator.profile.role)) throw new Error('FSA_MANAGE_AGENTS_REQUIRED')
      const {email,username,displayName}=identity(body), creditCeiling=ceiling(body)
      let distributorId=String(body.distributor_id||'')
      if(operator.profile.role==='distributor') {
        if(!operator.distributor?.can_manage_agents) throw new Error('FSA_MANAGE_AGENTS_REQUIRED')
        distributorId=String(operator.profile.distributor_id)
      }
      if(!distributorId) throw new Error('FSA_DISTRIBUTOR_REQUIRED')
      const dr=await admin.from('fsa_distributors').select('id,status,credit_ceiling').eq('id',distributorId).maybeSingle(); if(dr.error)throw dr.error
      if(!dr.data||dr.data.status!=='active')throw new Error('FSA_DISTRIBUTOR_INACTIVE')
      if(operator.profile.role==='distributor'&&dr.data.id!==operator.profile.distributor_id)throw new Error('FSA_SCOPE_DENIED')
      if(creditCeiling>Number(dr.data.credit_ceiling))throw new Error('FSA_AGENT_CEILING_OUTSIDE_DISTRIBUTOR')
      const dup=await admin.from('fsa_agents').select('id').ilike('username',username).maybeSingle();if(dup.error)throw dup.error;if(dup.data)return json({error:'FSA_USERNAME_TAKEN'},409)
      const {authUser,invited}=await provisionAuth(email,displayName,'agent',ADMIN_URL)
      let agent:any=null
      try {
        const ins=await admin.from('fsa_agents').insert({auth_user_id:authUser.id,distributor_id:distributorId,username,display_name:displayName,status:'active',can_manage_users:body.can_manage_users!==false,can_cashier:Boolean(body.can_cashier),can_moderate:Boolean(body.can_moderate),credit_ceiling:creditCeiling,created_by:operator.user.id}).select('id,distributor_id,username,display_name,status,credit_ceiling,can_manage_users,can_cashier,can_moderate').single()
        if(ins.error)throw ins.error;agent=ins.data
        const p=await admin.from('fsa_operator_profiles').insert({user_id:authUser.id,role:'agent',agent_id:agent.id,display_name:displayName,status:'active'});if(p.error)throw p.error
        const allowed=await admin.from('fsa_distributor_game_access').select('game_id').eq('distributor_id',distributorId);if(allowed.error)throw allowed.error
        const allowedIds=new Set((allowed.data||[]).map((x:any)=>x.game_id));const requested=Array.isArray(body.game_ids)?body.game_ids.map(String):[]
        if(requested.some((x:string)=>!allowedIds.has(x)))throw new Error('FSA_DISTRIBUTOR_GAME_DENIED')
        const ids=requested.length?requested:[...allowedIds]
        if(ids.length){const ga=await admin.from('fsa_agent_game_access').insert(ids.map((game_id:string)=>({agent_id:agent.id,game_id})));if(ga.error)throw ga.error}
        await admin.from('fsa_audit_log').insert({actor_user_id:operator.user.id,actor_role:operator.profile.role,distributor_id:distributorId,agent_id:agent.id,action:'agent_invited',target_type:'agent',target_id:agent.id,details:{email,username,invited,credit_ceiling:creditCeiling}})
        return json({ok:true,invited,agent})
      } catch(e) {
        if(agent?.id)await admin.from('fsa_agents').delete().eq('id',agent.id)
        if(invited)await admin.auth.admin.deleteUser(authUser.id).catch(()=>undefined)
        throw e
      }
    }

    if (action==='invite_player') {
      const {email,username,displayName}=identity(body)
      const openingBalance=Math.max(0,Math.floor(Number(body.opening_balance||0)))
      let agentId=String(body.agent_id||'')
      if(operator.profile.role==='agent') {
        if(!operator.agent?.can_manage_users) throw new Error('FSA_MANAGE_USERS_REQUIRED')
        if(openingBalance>0&&!operator.agent?.can_cashier) throw new Error('FSA_CASHIER_REQUIRED')
        agentId=String(operator.profile.agent_id)
      } else if(operator.profile.role==='distributor') {
        if(!operator.distributor?.can_manage_users) throw new Error('FSA_MANAGE_USERS_REQUIRED')
        if(openingBalance>0&&!operator.distributor?.can_cashier) throw new Error('FSA_CASHIER_REQUIRED')
      }
      if(!agentId) throw new Error('FSA_AGENT_REQUIRED')
      const ar=await admin.from('fsa_agents').select('id,distributor_id,status').eq('id',agentId).maybeSingle(); if(ar.error)throw ar.error
      if(!ar.data||ar.data.status!=='active')throw new Error('FSA_AGENT_INACTIVE')
      if(operator.profile.role==='distributor'&&ar.data.distributor_id!==operator.profile.distributor_id)throw new Error('FSA_SCOPE_DENIED')
      if(operator.profile.role==='agent'&&ar.data.id!==operator.profile.agent_id)throw new Error('FSA_SCOPE_DENIED')
      const dup=await admin.from('fsa_players').select('id').ilike('username',username).maybeSingle();if(dup.error)throw dup.error;if(dup.data)return json({error:'FSA_USERNAME_TAKEN'},409)
      const {authUser,invited}=await provisionAuth(email,displayName,'player',PLAYER_URL)
      try {
        const requested=Array.isArray(body.game_ids)?body.game_ids.map(String):null
        const {data:playerId,error}=await admin.rpc('fsa_service_create_network_player',{p_actor_user_id:operator.user.id,p_auth_user_id:authUser.id,p_username:username,p_display_name:displayName,p_agent_id:agentId,p_opening_balance:openingBalance,p_game_ids:requested,p_notes:String(body.notes||'').slice(0,500)})
        if(error)throw error
        const p=await admin.from('fsa_players').select('id,username,display_name,agent_id,status,balance,auth_user_id').eq('id',playerId).single();if(p.error)throw p.error
        return json({ok:true,invited,player:p.data})
      } catch(e) {
        if(invited)await admin.auth.admin.deleteUser(authUser.id).catch(()=>undefined)
        throw e
      }
    }
    return json({error:'UNKNOWN_ACTION'},400)
  } catch(error) {
    const message=error instanceof Error?error.message:'UNKNOWN_ERROR'
    const status=message.includes('AUTH')?401:(message.includes('MFA')||message.includes('FOUNDER')||message.includes('SCOPE')||message.includes('REQUIRED'))?403:(message.includes('INVALID')||message.includes('CEILING')||message.includes('DENIED'))?400:500
    return json({error:message},status)
  }
})
