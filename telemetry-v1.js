(()=>{'use strict';
const VERSION='fsa.telemetry.v1';
const BUILD='fsa-telemetry-v1';
const SUPABASE_URL='https://nqcshihyfhthywpseilx.supabase.co';
const SUPABASE_KEY='sb_publishable_lD--sdVpwV9djLF28XW1Jg_95DPa58G';
const AUTH_KEY='sb-nqcshihyfhthywpseilx-auth-token';
const FISH_IDS=['reef-run','dragon-depths','pirates-plunder','atlantis-rising','ice-tide','lava-reef','storm-seas','jade-dragon','neon-ocean','ancient-ruins','mecha-marine','coral-chaos','krakens-lair','treasure-trials','boss-rush'];
const SLOT_IDS=['ocean-fortune','treasure-reels','sirens-gold','legend-of-atlantis','shark-jackpot','pearl-rush','kraken-spins','reef-riches','lucky-tide','deep-diamonds','golden-anchor','mermaids-treasure','pirate-jackpot','coral-cash','neptunes-wheel','sea-king-777','ocean-wilds','diamond-dolphin','wild-pearls','treasure-temple'];
const net=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
const LOW=!!(net&&(net.saveData||/^(slow-)?2g$/.test(net.effectiveType||'')));
const state={sessionId:null,startedAt:0,mode:null,gameId:null,room:null,lastSample:null,lastError:null,sent:0,skipped:0};
let startPromise=null,openingGame=false,ending=false;

function accessToken(){
  try{
    const raw=localStorage.getItem(AUTH_KEY);if(!raw)return null;
    const data=JSON.parse(raw);return typeof data?.access_token==='string'&&data.access_token?data.access_token:null;
  }catch{return null}
}
function uuid(){
  if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
}
function clientKind(){
  if(/FSA-Android-v12/i.test(navigator.userAgent||''))return 'android';
  if(matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true)return 'pwa';
  return 'web';
}
function runtimeState(){try{return window.__FSA_GAME_TEST__?.getState?.()||null}catch{return null}}
function safeInt(v,max=2147483647){const n=Math.floor(Number(v)||0);return Math.max(0,Math.min(max,n))}
function safeRatio(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0}
function gameOpen(){return document.getElementById('game')?.classList.contains('on')===true}
function slotOpen(){return document.getElementById('slotModal')?.classList.contains('on')===true}
function currentGameId(){
  const s=runtimeState();
  if(slotOpen())return SLOT_IDS[Number(s?.slot)]||state.gameId;
  if(gameOpen())return FISH_IDS[Number(s?.game)]||state.gameId;
  return state.gameId;
}
function currentRoom(){const s=runtimeState();return Number.isInteger(s?.room)?Math.max(0,Math.min(2,s.room)):(state.room??null)}
function performancePayload(extra={}){
  const s=runtimeState(),run=s?.run||{};
  const payload={
    shots:safeInt(run.shots,10000000),hits:safeInt(run.hits,10000000),kills:safeInt(run.kills,1000000),
    score:safeInt(run.score,2000000000),combo:safeInt(s?.combo,100000),fever:safeInt(s?.fever,100),
    wave:safeInt(s?.wave,10000),target_count:Array.isArray(s?.fish)?Math.min(1000,s.fish.length):0,...extra
  };
  if(s?.boss&&Number.isFinite(Number(s.boss.hp))&&Number.isFinite(Number(s.boss.max))&&Number(s.boss.max)>0){payload.boss_ratio=safeRatio(Number(s.boss.hp)/Number(s.boss.max))}
  return payload;
}
function sessionSummary(){
  const base=performancePayload({duration_ms:state.startedAt?Math.max(0,Date.now()-state.startedAt):0});
  delete base.target_count;delete base.boss_ratio;return base;
}
async function rpc(name,args,{keepalive=false}={}){
  const token=accessToken();if(!token){state.skipped++;return null}
  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',keepalive,
    headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify(args||{})
  });
  if(!response.ok){const text=await response.text().catch(()=>String(response.status));throw new Error(`telemetry:${response.status}:${text.slice(0,120)}`)}
  if(response.status===204)return null;
  const text=await response.text();if(!text)return null;
  try{return JSON.parse(text)}catch{return text.replace(/^"|"$/g,'')}
}
async function ensureSession(){
  if(state.sessionId)return state.sessionId;
  if(!accessToken()){state.skipped++;return null}
  if(startPromise)return startPromise;
  startPromise=(async()=>{
    try{
      const sid=await rpc('fsa_rpc_telemetry_start',{p_client_kind:clientKind(),p_low_data:LOW,p_build:BUILD});
      if(typeof sid==='string'&&sid){state.sessionId=sid;state.startedAt=Date.now();return sid}
      return null;
    }catch(e){state.lastError=String(e?.message||e);return null}
    finally{startPromise=null}
  })();
  return startPromise;
}
async function record(eventType,{gameId=currentGameId(),room=currentRoom(),payload={}}={}){
  if(ending)return null;
  const sid=await ensureSession();if(!sid)return null;
  try{
    const id=await rpc('fsa_rpc_telemetry_event',{
      p_session_id:sid,p_event_type:eventType,p_game_id:gameId||null,p_room:Number.isInteger(room)?room:null,
      p_payload:payload||{},p_client_nonce:uuid()
    });
    state.sent++;state.lastError=null;return id;
  }catch(e){state.lastError=String(e?.message||e);return null}
}
function fire(eventType,options){void record(eventType,options)}
async function endSession({keepalive=false}={}){
  if(ending||!state.sessionId)return;
  ending=true;const sid=state.sessionId;
  try{await rpc('fsa_rpc_telemetry_end',{p_session_id:sid,p_payload:sessionSummary()},{keepalive})}
  catch(e){state.lastError=String(e?.message||e)}
  finally{state.sessionId=null;state.startedAt=0;ending=false}
}
function wrap(name,before,after){
  const original=window[name];if(typeof original!=='function'||original.__fsaTelemetryWrapped)return;
  const wrapped=function(...args){before?.(args);let value;try{value=original.apply(this,args)}finally{after?.(args)}return value};
  wrapped.__fsaTelemetryWrapped=true;wrapped.__fsaTelemetryOriginal=original;window[name]=wrapped;
}
function install(){
  if(window.__FSA_TELEMETRY_INSTALLED__)return;window.__FSA_TELEMETRY_INSTALLED__=true;
  wrap('openGame',()=>{openingGame=true},args=>{
    openingGame=false;if(!gameOpen())return;
    const i=Math.max(0,Math.min(FISH_IDS.length-1,Number(args[0])||0));state.mode='fish';state.gameId=FISH_IDS[i];state.room=currentRoom();fire('game_open',{gameId:state.gameId,room:state.room,payload:{client:clientKind(),low_data:LOW}})
  });
  wrap('closeGame',null,()=>{if(state.mode==='fish')fire('game_close',{gameId:state.gameId,room:state.room,payload:performancePayload()});state.mode=null});
  wrap('chooseRoom',null,args=>{state.room=Math.max(0,Math.min(2,Number(args[0])||0));if(!openingGame&&gameOpen())fire('room_change',{gameId:currentGameId(),room:state.room,payload:{}})});
  wrap('switchGun',null,args=>{if(gameOpen())fire('weapon_change',{gameId:currentGameId(),room:currentRoom(),payload:{gun:Math.max(0,Math.min(2,Number(args[0])||0))}})});
  wrap('power',args=>{if(gameOpen())fire('power_used',{gameId:currentGameId(),room:currentRoom(),payload:{power:String(args[0]||'').slice(0,32)}})});
  wrap('openSlot',null,args=>{
    if(!slotOpen())return;
    const i=Math.max(0,Math.min(SLOT_IDS.length-1,Number(args[0])||0));state.mode='slot';state.gameId=SLOT_IDS[i];state.room=null;fire('slot_open',{gameId:state.gameId,room:null,payload:{slot_id:state.gameId,client:clientKind(),low_data:LOW}})
  });
  wrap('closeSlot',null,()=>{if(state.mode==='slot')fire('slot_close',{gameId:state.gameId,room:null,payload:{slot_id:state.gameId}});state.mode=null});
  wrap('spin',null,()=>{
    if(!slotOpen())return;const result=(document.getElementById('slotResult')?.textContent||'').toUpperCase();
    const resultClass=/JACKPOT/.test(result)?'jackpot':/WIN/.test(result)?'win':'no_line';
    fire('slot_spin',{gameId:currentGameId(),room:null,payload:{slot_id:currentGameId(),result_class:resultClass}})
  });
  const sampleMs=LOW?30000:15000;
  setInterval(()=>{if(!gameOpen())return;const sample=performancePayload();state.lastSample=sample;fire('performance_sample',{gameId:currentGameId(),room:currentRoom(),payload:sample})},sampleMs);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&gameOpen()){const sample=performancePayload();state.lastSample=sample;fire('performance_sample',{gameId:currentGameId(),room:currentRoom(),payload:sample})}});
  addEventListener('pagehide',()=>{void endSession({keepalive:true})},{capture:true});
}
install();
window.__FSA_TELEMETRY_V1__={version:VERSION,build:BUILD,lowData:LOW,snapshot:()=>({...state,lastSample:state.lastSample?{...state.lastSample}:null}),record:(type,options)=>record(type,options),end:()=>endSession()};
})();
