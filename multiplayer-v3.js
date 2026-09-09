import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const SUPABASE_URL='https://nqcshihyfhthywpseilx.supabase.co'
const SUPABASE_KEY='sb_publishable_lD--sdVpwV9djLF28XW1Jg_95DPa58G'
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce',storageKey:'fsa-player-auth-v3'}})
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)]
const GAME_INDEX={'reef-run':0,'dragon-depths':1,'pirates-plunder':2,'atlantis-rising':3,'ice-tide':4,'lava-reef':5,'storm-seas':6,'jade-dragon':7,'neon-ocean':8,'ancient-ruins':9,'mecha-marine':10,'coral-chaos':11,'krakens-lair':12,'treasure-trials':13,'boss-rush':14}
const ROOM_INDEX={bronze:0,silver:1,gold:2}
const ROOM_CAP={bronze:2,silver:3,gold:4}
const WEAPONS=['pulse','spread','rail']
const COOLDOWN={pulse:105,spread:185,rail:410}
const net=navigator.connection||navigator.mozConnection||navigator.webkitConnection
const reduced=matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false
const LOW=!!((net&&(net.saveData||/^(slow-)?2g$/.test(net.effectiveType||'')))||reduced||(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2))
const ROOT='https://anastaysia94-sudo.github.io/fish-shooter-arcade/'
const N={session:null,player:null,tables:[],current:null,lastSeq:0,channel:null,poll:null,heartbeat:null,backupPoll:null,fireHold:null,autoPoll:null,lastFire:0,serverBalance:null,renderLock:false,realtime:false}

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fmt(n){return Number(n||0).toLocaleString()}
function errText(e){return String(e?.message||e?.error_description||e?.error||e||'Unknown error').replace(/^Error:\s*/,'')}
function msg(text,bad=false){const e=$('#networkMessage');if(e){e.textContent=text;e.className=`network-message ${bad?'':'network-ok'}`}}
function rpc(name,args={}){return supabase.rpc(name,args).then(({data,error})=>{if(error)throw error;return data})}
function playerCan(gameId){return (N.player?.game_ids||[]).includes(gameId)}
function currentWeapon(){const i=$$('.weapon-switch button').slice(0,3).findIndex(b=>b.classList.contains('on'));return WEAPONS[Math.max(0,i)]}
function currentShot(){return Math.max(1,Number($('#youBet')?.textContent?.replace(/,/g,'')||0))}
function uuid(){return crypto.randomUUID()}
function setBadge(){const b=$('#networkBadge'),d=$('#networkDot'),t=$('#networkBadgeText');if(!b)return;const on=!!N.current;b.classList.toggle('on',on);if(d)d.className=`network-dot ${LOW||!N.realtime?'poll':''}`;if(t)t.textContent=on?`${LOW||!N.realtime?'POLL':'LIVE'} · ${String(N.current.table?.room_tier||'').toUpperCase()} · ${N.current.seats?.length||0}/${N.current.table?.max_players||0}`:''}
function syncBalance(v){if(v===undefined||v===null)return;N.serverBalance=Number(v);for(const id of ['coins','gcoins']){const e=document.getElementById(id);if(e)e.textContent=fmt(N.serverBalance)}const b=$('#youSeat .bal');if(b)b.textContent=fmt(N.serverBalance);const n=$('#networkBalance');if(n)n.textContent=fmt(N.serverBalance)}
function enforceBalanceSoon(){if(N.renderLock||N.serverBalance===null)return;N.renderLock=true;queueMicrotask(()=>{syncBalance(N.serverBalance);N.renderLock=false})}

function installUI(){
  const nav=$('.v8-nav');if(nav&&!$('#networkNav')){const b=document.createElement('button');b.id='networkNav';b.className='network-nav';b.textContent='⚡ NETWORK';b.onclick=()=>openPanel();nav.insertBefore(b,nav.querySelector('a'))}
  document.body.insertAdjacentHTML('beforeend',`
    <div class="network-badge" id="networkBadge"><i class="network-dot" id="networkDot"></i><span id="networkBadgeText"></span></div>
    <section class="network-panel" id="networkPanel" aria-label="F.S.A. network tables">
      <div class="network-shell"><header class="network-head"><div><h2>F.S.A. NETWORK TABLES</h2><small>Real authenticated players · server-authoritative virtual credits · fish tables only</small></div><span class="spacer"></span><button id="networkRefresh">Refresh</button><button id="networkClose">Close</button></header>
      <div class="network-body">
        <div id="networkSignedOut" class="network-auth">
          <article class="network-card"><h3>Player sign in</h3><form id="networkLogin" class="network-form"><label>Email<input id="networkEmail" type="email" autocomplete="username" required></label><label>Password<input id="networkPassword" type="password" autocomplete="current-password" required></label><button class="primary">SIGN IN</button></form><button id="networkReset">Send password reset</button><div class="network-message" id="networkMessage"></div></article>
          <article class="network-card"><h3>Network-enabled account required</h3><p>Player accounts are issued by an authorized F.S.A. Founder, Distributor, or Agent. Your server balance, allowed games, table seat and network activity are not controlled by browser storage.</p><p>Invited for the first time? Open the invitation link, then use <b>Set / change password</b> after the session is established.</p></article>
        </div>
        <div id="networkSignedIn" hidden>
          <article class="network-card"><div class="network-toolbar"><div class="grow"><h3 id="networkPlayerName">PLAYER</h3><span>Server balance: <b id="networkBalance">0</b> virtual credits</span></div><button id="networkPasswordSet">Set / change password</button><button id="networkSignOut">Sign out</button></div><div id="networkPasswordBox" class="network-form network-recovery"><label>New password<input id="networkNewPassword" type="password" minlength="12" autocomplete="new-password"></label><button class="primary" id="networkPasswordSave">Save password</button></div></article>
          <div id="networkLobby">
            <article class="network-card"><h3>Create a table</h3><div class="network-toolbar"><select id="networkGame"></select><select id="networkRoom"><option value="bronze">Bronze Reef · 2 seats</option><option value="silver">Silver Current · 3 seats</option><option value="gold">Gold Abyss · 4 seats</option></select><button class="primary" id="networkCreate">CREATE TABLE</button></div><div class="network-mode-note">Only fish games granted through Distributor → Agent → User inheritance appear here.</div></article>
            <article class="network-card"><h3>Open tables</h3><div class="network-tables" id="networkTables"></div></article>
          </div>
          <div id="networkCurrent" hidden>
            <article class="network-card"><div class="network-toolbar"><div class="grow"><h3 id="networkCurrentTitle">CURRENT TABLE</h3><span id="networkCurrentMeta"></span></div><button id="networkPlay" class="primary">OPEN BATTLEFIELD</button><button id="networkLeave" class="danger">Leave table</button><button id="networkHostClose" class="danger">Close table</button></div></article>
            <div class="network-current"><article class="network-card"><h3>Live seats</h3><div class="network-seats" id="networkSeats"></div></article><article class="network-card"><h3>Table events</h3><div class="network-events" id="networkEvents"></div></article></div>
          </div>
          <div class="network-message" id="networkMessageSigned"></div>
        </div>
      </div></div>
    </section>
    <div class="network-seatbar" id="networkSeatbar"></div>`)
  $('#networkClose').onclick=closePanel;$('#networkRefresh').onclick=()=>refreshAll(true)
  $('#networkLogin').onsubmit=login;$('#networkReset').onclick=resetPassword;$('#networkSignOut').onclick=signOut
  $('#networkPasswordSet').onclick=()=>$('#networkPasswordBox').classList.toggle('on');$('#networkPasswordSave').onclick=setPassword
  $('#networkCreate').onclick=createTable;$('#networkLeave').onclick=leaveTable;$('#networkHostClose').onclick=closeTable;$('#networkPlay').onclick=openCurrentBattle
  $('#networkTables').addEventListener('click',e=>{const b=e.target.closest('[data-join]');if(b)joinTable(b.dataset.join)})
  const observer=new MutationObserver(()=>{if(document.body.classList.contains('network-active'))enforceBalanceSoon()})
  for(const e of [$('#coins'),$('#gcoins'),$('#youSeat .bal')])if(e)observer.observe(e,{childList:true,characterData:true,subtree:true})
}
function openPanel(){if($('#networkPanel'))$('#networkPanel').classList.add('on');refreshAll(false)}
function closePanel(){$('#networkPanel')?.classList.remove('on')}
async function login(e){e.preventDefault();try{msg('Signing in…');const {data,error}=await supabase.auth.signInWithPassword({email:$('#networkEmail').value.trim(),password:$('#networkPassword').value});if(error)throw error;await handleSession(data.session);msg('Signed in.')}catch(e){msg(errText(e),true)}}
async function resetPassword(){try{const email=$('#networkEmail').value.trim();if(!email)throw new Error('Enter your email first.');const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:ROOT});if(error)throw error;msg('Password reset email sent.')}catch(e){msg(errText(e),true)}}
async function setPassword(){try{const password=$('#networkNewPassword').value;if(password.length<12)throw new Error('Use at least 12 characters.');const {error}=await supabase.auth.updateUser({password});if(error)throw error;$('#networkNewPassword').value='';$('#networkPasswordBox').classList.remove('on');messageSigned('Password updated.')}catch(e){messageSigned(errText(e),true)}}
async function signOut(){await exitNetwork(false);await supabase.auth.signOut();N.session=null;N.player=null;renderAuth();messageSigned('Signed out.')}
function messageSigned(text,bad=false){const e=$('#networkMessageSigned');if(e){e.textContent=text;e.className=`network-message ${bad?'':'network-ok'}`}}

async function handleSession(session){N.session=session;if(!session){N.player=null;renderAuth();return}try{N.player=await rpc('fsa_rpc_player_bootstrap');syncBalance(N.player.balance);renderAuth();if(N.player.current_table?.table_id){await joinExisting(N.player.current_table.table_id)}else await listTables()}catch(e){N.player=null;renderAuth();msg(errText(e),true)}}
function renderAuth(){const on=!!N.player;$('#networkSignedOut').hidden=on;$('#networkSignedIn').hidden=!on;if(!on)return;$('#networkPlayerName').textContent=`${N.player.display_name||N.player.username} · ${N.player.username}`;syncBalance(N.player.balance);const ids=N.player.game_ids||[];$('#networkGame').innerHTML=ids.map(id=>`<option value="${esc(id)}">${esc(gameTitle(id))}</option>`).join('')||'<option disabled>No fish games granted</option>';$('#networkCreate').disabled=!ids.length;renderCurrent()}
function gameTitle(id){return id.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ').replace('Krakens Lair',"Kraken’s Lair").replace('Pirates Plunder',"Pirate’s Plunder")}
async function listTables(){if(!N.player)return;try{N.tables=await rpc('fsa_rpc_multiplayer_list_tables')||[];renderTables()}catch(e){messageSigned(errText(e),true)}}
function renderTables(){const box=$('#networkTables');if(!box)return;box.innerHTML=N.tables.length?N.tables.map(t=>`<div class="network-table"><h4>${esc(t.game_name||gameTitle(t.game_id))}</h4><div class="meta"><span>${esc(String(t.room_tier).toUpperCase())}</span><span>${t.player_count}/${t.max_players} ACTIVE</span><span>${esc(t.status)}</span><span>Host: ${esc(t.host_name)}</span></div><div class="actions"><button class="primary" data-join="${t.id}" ${Number(t.player_count)>=Number(t.max_players)?'disabled':''}>JOIN TABLE</button></div></div>`).join(''):'<p>No joinable network tables right now. Create one above.</p>'}
async function createTable(){try{const game=$('#networkGame').value,room=$('#networkRoom').value;if(!game||!playerCan(game))throw new Error('That game is not available to this player.');const id=await rpc('fsa_rpc_multiplayer_create_table',{p_game_id:game,p_room_tier:room,p_max_players:ROOM_CAP[room]});await joinExisting(id);openCurrentBattle();messageSigned('Network table created.')}catch(e){messageSigned(errText(e),true)}}
async function joinTable(id){try{await rpc('fsa_rpc_multiplayer_join_table',{p_table_id:id});await joinExisting(id);openCurrentBattle();messageSigned('Joined network table.')}catch(e){messageSigned(errText(e),true)}}
async function joinExisting(id){await stopSync();N.lastSeq=0;const state=await rpc('fsa_rpc_multiplayer_state',{p_table_id:id,p_after_event_seq:0});applyState(state);startSync(id)}
function applyState(state){if(!state)return;N.current=state;N.lastSeq=Math.max(N.lastSeq,Number(state.table?.event_seq||0));syncBalance(state.balance);document.body.classList.add('network-active');renderCurrent();setBadge()}
function renderCurrent(){const on=!!N.current;$('#networkLobby').hidden=on;$('#networkCurrent').hidden=!on;if(!on){$('#networkSeatbar')?.classList.remove('on');setBadge();return}const t=N.current.table,seats=N.current.seats||[],mine=seats.find(s=>s.player_id===N.player?.player_id);$('#networkCurrentTitle').textContent=`${gameTitle(t.game_id)} · ${String(t.room_tier).toUpperCase()} NETWORK`;$('#networkCurrentMeta').textContent=`${seats.length}/${t.max_players} seats · ${t.status} · event #${t.event_seq}`;$('#networkHostClose').hidden=t.host_player_id!==N.player?.player_id;$('#networkSeats').innerHTML=Array.from({length:t.max_players},(_,i)=>{const s=seats.find(x=>Number(x.seat_no)===i+1);return s?`<div class="network-seat ${s.player_id===N.player?.player_id?'me':''}"><strong>P${s.seat_no} · ${esc(s.display_name)}</strong><small>${esc(s.weapon)} · shot ${fmt(s.shot_value)}</small><small>${fmt(s.balance)} credits · score ${fmt(s.score)}</small></div>`:`<div class="network-seat"><strong>P${i+1} · OPEN</strong><small>Waiting for player</small></div>`}).join('');renderSeatbar(seats,t.max_players);renderEvents(N.current.events||[]);if(mine)syncBalance(mine.balance);setBadge()}
function renderSeatbar(seats,max){const b=$('#networkSeatbar');if(!b)return;b.innerHTML=Array.from({length:max},(_,i)=>{const s=seats.find(x=>Number(x.seat_no)===i+1);return s?`<div class="nseat ${s.player_id===N.player?.player_id?'me':''}" data-network-seat="${s.seat_no}"><b>P${s.seat_no} · ${esc(s.display_name)}</b><small>${fmt(s.balance)} · ${esc(s.weapon)} · ${fmt(s.shot_value)}</small></div>`:`<div class="nseat"><b>P${i+1} · OPEN</b><small>network seat</small></div>`}).join('');b.classList.toggle('on',!!N.current)}
function renderEvents(events){const box=$('#networkEvents');if(!box)return;box.innerHTML=[...events].slice(-40).reverse().map(e=>eventHTML(e)).join('')||'<div class="network-event">Waiting for table activity…</div>'}
function eventHTML(e){const p=e.payload||{};if(e.event_type==='shot')return `<div class="network-event ${p.hit?'hit':''}"><span>P${p.seat_no} ${esc(p.player_name)} · ${esc(p.weapon)} ${fmt(p.shot_value)} · ${p.hit?esc(p.target_class):'miss'}</span><b>${p.hit?'+'+fmt(p.reward):'-'+fmt(p.cost)}</b></div>`;if(e.event_type==='power')return `<div class="network-event hit"><span>P${p.seat_no} ${esc(p.player_name)}</span><b>${esc(String(p.power).toUpperCase())}</b></div>`;return `<div class="network-event"><span>${esc(e.event_type.replaceAll('_',' '))}</span><b>${esc(p.player_name||'TABLE')}</b></div>`}
function consumeEvent(e){if(!e||Number(e.event_seq)<=N.lastSeq)return;N.lastSeq=Number(e.event_seq);if(N.current){N.current.table.event_seq=Math.max(Number(N.current.table.event_seq||0),N.lastSeq);N.current.events=[...(N.current.events||[]),e].slice(-100)}const p=e.payload||{};if(e.event_type==='shot'){const seat=$(`[data-network-seat="${p.seat_no}"]`);if(seat){seat.classList.remove('flash');requestAnimationFrame(()=>seat.classList.add('flash'))}emitGameFeed(`${p.player_name||'Player'} · ${p.hit?`${p.target_class} +${fmt(p.reward)}`:`shot ${fmt(p.shot_value)}`}`)}else if(e.event_type==='power'){emitGameFeed(`${p.player_name||'Player'} triggered ${String(p.power||'power').toUpperCase()}`)}else emitGameFeed(`${p.player_name||'Player'} · ${e.event_type.replaceAll('_',' ')}`);renderEvents(N.current?.events||[]);setBadge()}
function emitGameFeed(text){const f=$('#liveFeed');if(f)f.insertAdjacentHTML('afterbegin',`<div class="live-row"><span>${esc(text)}</span><em>NET</em></div>`)}

async function startSync(tableId){if(LOW){startPolling(tableId,2500);N.realtime=false;setBadge();return}N.realtime=true;N.channel=supabase.channel(`fsa-table-${tableId}`)
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'fsa_multiplayer_events',filter:`table_id=eq.${tableId}`},p=>consumeEvent(p.new))
  .on('postgres_changes',{event:'*',schema:'public',table:'fsa_multiplayer_seats',filter:`table_id=eq.${tableId}`},()=>refreshState(false))
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'fsa_multiplayer_tables',filter:`id=eq.${tableId}`},()=>refreshState(false))
  .subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){N.realtime=false;startPolling(tableId,2500);setBadge()}else if(status==='SUBSCRIBED'){N.realtime=true;setBadge()}})
  N.backupPoll=setInterval(()=>refreshState(false),15000)
  N.heartbeat=setInterval(()=>heartbeat(tableId),15000)
  startAutoNetwork()
}
function startPolling(tableId,ms){clearInterval(N.poll);N.poll=setInterval(()=>refreshState(false),ms);clearInterval(N.heartbeat);N.heartbeat=setInterval(()=>heartbeat(tableId),15000);startAutoNetwork()}
async function heartbeat(tableId){try{await rpc('fsa_rpc_multiplayer_heartbeat',{p_table_id:tableId})}catch(e){if(errText(e).includes('FSA_NOT_IN_TABLE'))await exitNetwork(false)}}
async function refreshState(showError=true){if(!N.current)return;try{const state=await rpc('fsa_rpc_multiplayer_state',{p_table_id:N.current.table.id,p_after_event_seq:N.lastSeq});const events=state.events||[];N.current.table=state.table;N.current.seats=state.seats;N.current.balance=state.balance;N.current.events=[...(N.current.events||[]),...events.filter(e=>Number(e.event_seq)>N.lastSeq)].slice(-100);events.forEach(consumeEvent);syncBalance(state.balance);renderCurrent();if(state.table.status==='closed')await exitNetwork(false)}catch(e){if(showError)messageSigned(errText(e),true)}}
async function stopSync(){if(N.channel){await supabase.removeChannel(N.channel).catch(()=>{});N.channel=null}for(const k of ['poll','heartbeat','backupPoll','fireHold','autoPoll']){clearInterval(N[k]);N[k]=null}N.realtime=false}
async function leaveTable(){if(!N.current)return;try{await rpc('fsa_rpc_multiplayer_leave_table',{p_table_id:N.current.table.id});await exitNetwork(true);messageSigned('Left network table.')}catch(e){messageSigned(errText(e),true)}}
async function closeTable(){if(!N.current)return;try{await rpc('fsa_rpc_multiplayer_close_table',{p_table_id:N.current.table.id});await exitNetwork(true);messageSigned('Network table closed.')}catch(e){messageSigned(errText(e),true)}}
async function exitNetwork(refresh=true){await stopSync();N.current=null;N.lastSeq=0;N.serverBalance=N.player?.balance??null;document.body.classList.remove('network-active');$('#networkSeatbar')?.classList.remove('on');renderCurrent();if(refresh&&N.player){const p=await rpc('fsa_rpc_player_bootstrap').catch(()=>null);if(p){N.player=p;syncBalance(p.balance)}await listTables()}}
function openCurrentBattle(){if(!N.current)return;const i=GAME_INDEX[N.current.table.game_id];if(i===undefined)return;window.openGame(i);window.chooseRoom(ROOM_INDEX[N.current.table.room_tier]);closePanel();syncBalance(N.current.balance);setTimeout(()=>{syncBalance(N.current?.balance);renderSeatbar(N.current?.seats||[],N.current?.table?.max_players||2)},30)}

async function sendFire(){if(!N.current||!$('#game')?.classList.contains('on'))return;const weapon=currentWeapon(),shot=currentShot(),now=performance.now();if(now-N.lastFire<COOLDOWN[weapon])return;N.lastFire=now;try{const r=await rpc('fsa_rpc_multiplayer_fire',{p_table_id:N.current.table.id,p_weapon:weapon,p_shot_value:shot,p_client_nonce:uuid()});syncBalance(r.balance);N.current.balance=r.balance;const mine=N.current.seats?.find(s=>s.player_id===N.player.player_id);if(mine){mine.balance=r.balance;mine.weapon=weapon;mine.shot_value=shot;mine.shots=Number(mine.shots||0)+1;mine.hits=Number(mine.hits||0)+(r.hit?1:0);mine.score=Number(mine.score||0)+Number(r.reward||0)}const e={event_seq:Number(r.event_seq),event_type:'shot',actor_player_id:N.player.player_id,payload:{seat_no:mine?.seat_no,player_name:N.player.display_name,weapon,shot_value:shot,cost:r.cost,hit:r.hit,target_class:r.target_class,multiplier:r.multiplier,reward:r.reward,balance:r.balance}};consumeEvent(e);renderCurrent()}catch(e){const t=errText(e);if(!t.includes('FSA_FIRE_RATE_LIMIT')){emitGameFeed(t);messageSigned(t,true)}enforceBalanceSoon()}}
async function sendPower(type){if(!N.current)return;const map={nuke:'tornado',freeze:'freeze',lightning:'lightning',bomb:'bomb'},power=map[type]||type;try{const r=await rpc('fsa_rpc_multiplayer_power',{p_table_id:N.current.table.id,p_power:power,p_client_nonce:uuid()});const mine=N.current.seats?.find(s=>s.player_id===N.player.player_id);consumeEvent({event_seq:Number(r.event_seq),event_type:'power',actor_player_id:N.player.player_id,payload:{seat_no:mine?.seat_no,player_name:N.player.display_name,power}})}catch(e){messageSigned(errText(e),true)}}
function bindBattleNetwork(){const c=$('#battleCanvas');if(!c)return;c.addEventListener('pointerdown',()=>{if(!N.current)return;sendFire();clearInterval(N.fireHold);N.fireHold=setInterval(sendFire,LOW?300:120)},{capture:true});for(const ev of ['pointerup','pointerleave','pointercancel'])c.addEventListener(ev,()=>{clearInterval(N.fireHold);N.fireHold=null},{capture:true});$('.power-grid')?.addEventListener('click',e=>{if(!N.current)return;const b=e.target.closest('button');if(!b)return;const onclick=b.getAttribute('onclick')||'';const m=onclick.match(/power\('([^']+)'\)/);if(m)sendPower(m[1])},{capture:true})}
function startAutoNetwork(){clearInterval(N.autoPoll);N.autoPoll=setInterval(()=>{if(!N.current||!$('#game')?.classList.contains('on'))return;if($('#autoBtn')?.textContent?.includes('AUTO ON'))sendFire()},90)}
async function refreshAll(show=false){if(!N.player)return;if(N.current)await refreshState(show);else await listTables()}

installUI();bindBattleNetwork();
supabase.auth.onAuthStateChange((event,session)=>{setTimeout(()=>handleSession(session),0);if(event==='PASSWORD_RECOVERY'||event==='USER_UPDATED')setTimeout(()=>$('#networkPasswordBox')?.classList.add('on'),20)})
const {data:{session}}=await supabase.auth.getSession();await handleSession(session)
window.addEventListener('beforeunload',()=>{if(N.current)navigator.sendBeacon?.('',new Blob())})
