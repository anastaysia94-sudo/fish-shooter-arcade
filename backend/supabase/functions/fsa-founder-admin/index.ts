import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
      'access-control-allow-methods': 'POST, OPTIONS',
    },
  })
}

function jwtPayload(token: string): Record<string, unknown> {
  const part = token.split('.')[1]
  if (!part) return {}
  const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  try { return JSON.parse(atob(padded)) } catch { return {} }
}

async function requireFounder(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('FSA_AUTH_REQUIRED')
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) throw new Error('FSA_AUTH_INVALID')
  const claims = jwtPayload(token)
  if (claims.aal !== 'aal2') throw new Error('FSA_MFA_REQUIRED')
  const { data: profile, error: profileError } = await admin.from('fsa_operator_profiles').select('user_id,role,status').eq('user_id', userData.user.id).maybeSingle()
  if (profileError) throw profileError
  if (!profile || profile.status !== 'active' || profile.role !== 'founder') throw new Error('FSA_FOUNDER_REQUIRED')
  return userData.user
}

async function findUserByEmail(email: string) {
  let page = 1
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    const found = data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
    if (found) return found
    if (data.users.length < 100) break
    page++
  }
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type', 'access-control-allow-methods': 'POST, OPTIONS' } })
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405)
  try {
    const founder = await requireFounder(req)
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '')
    if (action === 'health') return json({ ok: true, role: 'founder', aal: 'aal2' })
    if (action !== 'invite_agent') return json({ error: 'UNKNOWN_ACTION' }, 400)

    const email = String(body.email || '').trim().toLowerCase()
    const username = String(body.username || '').trim()
    const displayName = String(body.display_name || username).trim()
    const creditCeiling = Math.max(0, Math.floor(Number(body.credit_ceiling || 0)))
    const canCashier = Boolean(body.can_cashier)
    const canModerate = Boolean(body.can_moderate)
    const requestedGames = Array.isArray(body.game_ids) ? body.game_ids.map(String) : []
    if (!email || !email.includes('@')) return json({ error: 'INVALID_EMAIL' }, 400)
    if (username.length < 2 || username.length > 60) return json({ error: 'INVALID_USERNAME' }, 400)
    if (displayName.length < 1 || displayName.length > 80) return json({ error: 'INVALID_DISPLAY_NAME' }, 400)

    const { data: existingUsername, error: usernameError } = await admin.from('fsa_agents').select('id').ilike('username', username).maybeSingle()
    if (usernameError) throw usernameError
    if (existingUsername) return json({ error: 'FSA_USERNAME_TAKEN' }, 409)

    let authUser = await findUserByEmail(email)
    let invited = false
    if (!authUser) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { display_name: displayName, app: 'fsa-founder-console', fsa_role: 'agent' },
        redirectTo: 'https://anastaysia94-sudo.github.io/fish-shooter-arcade/admin/'
      })
      if (error) throw error
      authUser = data.user
      invited = true
    }
    if (!authUser) throw new Error('AUTH_USER_CREATE_FAILED')

    const { data: existingProfile } = await admin.from('fsa_operator_profiles').select('user_id').eq('user_id', authUser.id).maybeSingle()
    if (existingProfile) return json({ error: 'FSA_OPERATOR_ALREADY_EXISTS' }, 409)

    const { data: agent, error: agentError } = await admin.from('fsa_agents').insert({ auth_user_id: authUser.id, username, display_name: displayName, status: 'active', can_cashier: canCashier, can_moderate: canModerate, credit_ceiling: creditCeiling, created_by: founder.id }).select('id,username,display_name,status,credit_ceiling,can_cashier,can_moderate').single()
    if (agentError || !agent) {
      if (invited) await admin.auth.admin.deleteUser(authUser.id).catch(() => undefined)
      throw agentError || new Error('AGENT_CREATE_FAILED')
    }

    try {
      const { error: profileError } = await admin.from('fsa_operator_profiles').insert({ user_id: authUser.id, role: 'agent', agent_id: agent.id, display_name: displayName, status: 'active' })
      if (profileError) throw profileError
      const { data: validGames, error: gamesError } = await admin.from('fsa_games').select('id').eq('active', true)
      if (gamesError) throw gamesError
      const validIds = new Set((validGames || []).map((g) => g.id))
      const gameIds = requestedGames.length ? requestedGames.filter((id) => validIds.has(id)) : [...validIds]
      if (gameIds.length) {
        const { error: accessError } = await admin.from('fsa_agent_game_access').insert(gameIds.map((game_id) => ({ agent_id: agent.id, game_id })))
        if (accessError) throw accessError
      }
      await admin.from('fsa_audit_log').insert({ actor_user_id: founder.id, actor_role: 'founder', agent_id: agent.id, action: 'agent_invited', target_type: 'agent', target_id: agent.id, details: { email, username, invited, can_cashier: canCashier, can_moderate: canModerate, credit_ceiling: creditCeiling } })
    } catch (e) {
      await admin.from('fsa_agents').delete().eq('id', agent.id)
      if (invited) await admin.auth.admin.deleteUser(authUser.id).catch(() => undefined)
      throw e
    }
    return json({ ok: true, invited, agent })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    const status = message.includes('AUTH') ? 401 : message.includes('MFA') || message.includes('FOUNDER') ? 403 : 500
    return json({ error: message }, status)
  }
})
