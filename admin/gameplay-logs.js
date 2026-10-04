import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const SUPABASE_URL='https://nqcshihyfhthywpseilx.supabase.co'
const SUPABASE_KEY='sb_publishable_lD--sdVpwV9djLF28XW1Jg_95DPa58G'
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}})
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)]
const state={rows:[],loading:false,lastError:null}

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function prettyEvent(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
function prettyPayload(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return '—'
  const entries=Object.entries(value).slice(0,8)
  if(!entries.length)return '—'
  return entries.map(([k,v])=>`${k}: ${typeof v==='object'?JSON.stringify(v):String(v)}`).join(' · ')
}
function eventClass(type){
  if(type==='client_error')return 'danger'
  if(type==='game_open'||type==='slot_open'||type==='session_start')return 'ok'
  return ''
}

function ensureUi(){
  if($('#gameplayLogsNav'))return
  const auditButton=$('nav [data-tab="audit"]')
  if(!auditButton)return
  const button=document.createElement('button')
  button.id='gameplayLogsNav'
  button.type='button'
  button.textContent='Gameplay Logs'
  auditButton.insertAdjacentElement('beforebegin',button)

  const main=$('main')
  const section=document.createElement('section')
  section.id='gameplayLogs'
  section.className='tab'
  section.innerHTML=`
    <div class="bar"><h2>Gameplay logs</h2><button id="refreshGameplayLogs" type="button">Refresh</button></div>
    <p class="muted">Read-only gameplay telemetry. Founder sees all players; Distributors and Agents see only their server-authorized hierarchy. Virtual-credit balances cannot be changed from this feed.</p>
    <div class="cards" id="gameplayLogStats"></div>
    <div class="grid2">
      <label>Search<input id="gameplayLogSearch" class="search" placeholder="Player, game, event, device or payload..."></label>
      <label>Event<select id="gameplayLogEvent"><option value="">All events</option><option value="game_open">Game open</option><option value="game_close">Game close</option><option value="performance_sample">Performance sample</option><option value="weapon_change">Weapon change</option><option value="power_used">Power used</option><option value="slot_spin">Slot spin</option><option value="client_error">Client error</option></select></label>
    </div>
    <div id="gameplayLogMessage" class="message"></div>
    <div id="gameplayLogTable"></div>`
  main.appendChild(section)

  const activate=async()=>{
    $$('nav [data-tab],#gameplayLogsNav').forEach(x=>x.classList.toggle('active',x===button))
    $$('.tab').forEach(x=>x.classList.toggle('active',x===section))
    await load()
  }
  button.addEventListener('click',activate)
  $('#refreshGameplayLogs').addEventListener('click',load)
  $('#gameplayLogSearch').addEventListener('input',render)
  $('#gameplayLogEvent').addEventListener('change',load)
  $$('nav [data-tab]').forEach(existing=>existing.addEventListener('click',()=>{
    button.classList.remove('active')
    section.classList.remove('active')
  }))
}

async function load(){
  if(state.loading)return
  state.loading=true
  const msg=$('#gameplayLogMessage')
  if(msg)msg.textContent='Loading server-authorized gameplay logs…'
  try{
    const {data:{session}}=await supabase.auth.getSession()
    if(!session)throw new Error('Sign in to the Founder Console first.')
    const {data:aal,error:aalError}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if(aalError)throw aalError
    if(aal?.currentLevel!=='aal2')throw new Error('Verify MFA in Security before viewing gameplay logs.')
    const filter=$('#gameplayLogEvent')?.value||null
    const {data,error}=await supabase.rpc('fsa_rpc_operator_telemetry_feed',{p_after_id:0,p_limit:500,p_player_id:null,p_event_type:filter})
    if(error)throw error
    state.rows=Array.isArray(data)?data:[]
    state.lastError=null
    if(msg)msg.textContent=`Loaded ${state.rows.length.toLocaleString()} scoped gameplay events.`
    render()
  }catch(error){
    state.rows=[]
    state.lastError=String(error?.message||error)
    if(msg)msg.textContent=state.lastError
    render()
  }finally{state.loading=false}
}

function render(){
  const table=$('#gameplayLogTable'),stats=$('#gameplayLogStats')
  if(!table||!stats)return
  const q=($('#gameplayLogSearch')?.value||'').trim().toLowerCase()
  const rows=state.rows.filter(r=>`${r.username||''} ${r.display_name||''} ${r.agent_name||''} ${r.distributor_name||''} ${r.event_type||''} ${r.game_id||''} ${r.client_kind||''} ${r.build||''} ${JSON.stringify(r.payload||{})}`.toLowerCase().includes(q))
  const players=new Set(rows.map(r=>r.player_id)).size
  const errors=rows.filter(r=>r.event_type==='client_error').length
  const games=new Set(rows.map(r=>r.game_id).filter(Boolean)).size
  stats.innerHTML=[['Visible events',rows.length],['Players',players],['Games',games],['Client errors',errors]].map(([label,value])=>`<div class="card"><span>${label}</span><strong>${Number(value).toLocaleString()}</strong></div>`).join('')
  const body=rows.map(r=>`<tr>
    <td>${esc(new Date(r.occurred_at).toLocaleString())}</td>
    <td><b>${esc(r.display_name||r.username||r.player_id)}</b><br><small>${esc(r.username||'')}</small></td>
    <td>${esc(r.distributor_name||'—')}<br><small>${esc(r.agent_name||'—')}</small></td>
    <td><span class="pill ${eventClass(r.event_type)}">${esc(prettyEvent(r.event_type))}</span></td>
    <td>${esc(r.game_id||'—')}${r.room===null||r.room===undefined?'':`<br><small>Room ${Number(r.room)+1}</small>`}</td>
    <td>${esc(r.client_kind||'—')}<br><small>${esc(r.build||'')}</small></td>
    <td><small>${esc(prettyPayload(r.payload))}</small></td>
  </tr>`).join('')
  table.innerHTML=`<div class="table"><table><thead><tr><th>Time</th><th>Player</th><th>Distributor / Agent</th><th>Event</th><th>Game</th><th>Client</th><th>Details</th></tr></thead><tbody>${body||'<tr><td colspan="7">No gameplay events in this authorized scope.</td></tr>'}</tbody></table></div>`
}

ensureUi()
window.__FSA_GAMEPLAY_LOGS__={reload:load,snapshot:()=>({count:state.rows.length,lastError:state.lastError})}
