import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const SUPABASE_URL='https://nqcshihyfhthywpseilx.supabase.co'
const SUPABASE_KEY='sb_publishable_lD--sdVpwV9djLF28XW1Jg_95DPa58G'
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}})
const $=s=>document.querySelector(s)
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))
let rows=[], before=null, loading=false

function mount(){
  const nav=document.querySelector('nav[aria-label="Founder Console sections"]'),main=document.querySelector('#consoleShell main')
  if(!nav||!main||$('#gameplayLogsNav'))return
  const btn=document.createElement('button');btn.id='gameplayLogsNav';btn.dataset.tab='gameplay-logs';btn.textContent='Gameplay Logs'
  const audit=nav.querySelector('[data-tab="audit"]');nav.insertBefore(btn,audit||nav.lastElementChild)
  const section=document.createElement('section');section.id='gameplay-logs';section.className='tab';section.innerHTML=`
    <div class="bar"><h2>Gameplay Logs</h2><span>Read-only, non-financial session telemetry · hierarchy scoped</span></div>
    <div class="grid2 gameplay-log-controls"><label>Search<input id="gameplayLogSearch" class="search" placeholder="Player, game, event, Agent or Distributor"></label><label>Event type<select id="gameplayLogType"><option value="">All events</option><option>session_start</option><option>session_end</option><option>game_open</option><option>game_close</option><option>room_change</option><option>weapon_change</option><option>power_used</option><option>performance_sample</option><option>slot_open</option><option>slot_close</option><option>slot_spin</option><option>client_error</option></select></label></div>
    <div class="bar"><button id="gameplayLogRefresh">Refresh logs</button><button id="gameplayLogMore" class="secondary">Load older</button><span id="gameplayLogStatus" class="muted">MFA verification is required to read gameplay logs.</span></div>
    <div id="gameplayLogsTable"></div>`
  main.appendChild(section)
  btn.addEventListener('click',()=>{document.querySelectorAll('nav [data-tab]').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('#consoleShell main .tab').forEach(x=>x.classList.toggle('active',x===section));void load(true)})
  $('#gameplayLogRefresh').onclick=()=>void load(true)
  $('#gameplayLogMore').onclick=()=>void load(false)
  $('#gameplayLogSearch').addEventListener('input',render)
  $('#gameplayLogType').addEventListener('change',render)
}
function friendly(e){const raw=String(e?.message||e||'Unknown error').replace(/^Error:\s*/,'');if(/FSA_MFA_REQUIRED|FSA_FOUNDER_MFA_REQUIRED/.test(raw))return 'Verify MFA in Security before reading gameplay logs.';if(/FSA_OPERATOR_SCOPE_REQUIRED/.test(raw))return 'This account is not an active F.S.A. operator.';return raw}
function fmtTime(v){try{return new Date(v).toLocaleString()}catch{return String(v||'')}}
function compactPayload(p){if(!p||typeof p!=='object')return '';const keys=['shots','hits','kills','score','combo','fever','gun','power','result_class','duration_ms','wave','boss_ratio'];return keys.filter(k=>p[k]!==undefined).map(k=>`${k}=${p[k]}`).join(' · ')}
function render(){
  const out=$('#gameplayLogsTable');if(!out)return
  const q=($('#gameplayLogSearch')?.value||'').trim().toLowerCase(), type=$('#gameplayLogType')?.value||''
  const visible=rows.filter(r=>{if(type&&r.event_type!==type)return false;const hay=`${r.player_username} ${r.player_display_name} ${r.agent_name} ${r.distributor_name} ${r.game_id} ${r.event_type} ${compactPayload(r.payload)}`.toLowerCase();return !q||hay.includes(q)})
  out.innerHTML=`<div class="table"><table><thead><tr><th>When</th><th>Player</th><th>Hierarchy</th><th>Event</th><th>Game / Room</th><th>Client</th><th>Details</th></tr></thead><tbody>${visible.map(r=>`<tr><td>${esc(fmtTime(r.occurred_at))}</td><td><b>${esc(r.player_display_name||r.player_username)}</b><br><small>${esc(r.player_username)}</small></td><td>${esc(r.distributor_name)}<br><small>${esc(r.agent_name)}</small></td><td><span class="pill">${esc(r.event_type)}</span></td><td>${esc(r.game_id||'—')}<br><small>${r.room===null||r.room===undefined?'—':`Room ${Number(r.room)+1}`}</small></td><td>${esc(r.client_kind||'unknown')}</td><td><small>${esc(compactPayload(r.payload)||r.source||'—')}</small></td></tr>`).join('')||'<tr><td colspan="7">No gameplay log rows in this authorized scope.</td></tr>'}</tbody></table></div>`
}
async function load(reset){
  if(loading)return;loading=true;const status=$('#gameplayLogStatus');if(status)status.textContent='Loading gameplay logs…'
  try{
    const {data:aal,error:ae}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();if(ae)throw ae;if(aal?.currentLevel!=='aal2')throw new Error('FSA_MFA_REQUIRED')
    const args={p_limit:200,p_before_event_id:reset?null:before};const {data,error}=await supabase.rpc('fsa_rpc_operator_gameplay_logs',args);if(error)throw error
    const batch=Array.isArray(data)?data:[];rows=reset?batch:[...rows,...batch];before=batch.length?batch[batch.length-1].event_id:before
    if(status)status.textContent=`${rows.length.toLocaleString()} gameplay events loaded · read-only · non-financial`
    $('#gameplayLogMore').disabled=batch.length<200;render()
  }catch(e){if(status)status.textContent=friendly(e);rows=reset?[]:rows;render()}
  finally{loading=false}
}

function init(){mount();supabase.auth.onAuthStateChange(()=>{if($('#gameplay-logs')?.classList.contains('active'))void load(true)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
window.__FSA_GAMEPLAY_LOGS_V5__={version:'v5',refresh:()=>load(true),snapshot:()=>rows.map(x=>({...x}))}
