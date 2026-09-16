(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const runtime=()=>window.__FSA_DENSE_RUNTIME__;
const game=$('#game'),battle=$('.battle'),left=$('#leftHud'),right=$('#rightHud');
if(!game||!battle||!left||!right)return;
const root=document.documentElement;root.dataset.denseUi='v14';

const box=(title,id,html)=>{const e=document.createElement('div');e.className='hudbox v14-hudbox';if(id)e.id=id;e.innerHTML=`<h3>${title}</h3>${html}`;return e};
function installLobbyDensity(){
  const badge=$('#v13VersionBadge');if(badge)badge.textContent='DENSE V14';
  const content=$('.v8-content');if(content&&!$('#v14LobbyPulse')){const bar=document.createElement('div');bar.id='v14LobbyPulse';bar.className='v14-lobby-pulse';bar.innerHTML='<span><i></i> LIVE ARCADE</span><b>15 OCEANS ONLINE</b><em>BOSS RUSH · TREASURE TRIALS · CORAL CHAOS · NEON OCEAN</em><strong>DENSE MODE</strong>';content.insertBefore(bar,content.firstChild)}
  const decorate=()=>{$$('#fishGrid .lib-card').forEach((card,i)=>{if(card.querySelector('.v14-card-badges'))return;const tags=document.createElement('div');tags.className='v14-card-badges';const a=i%5===0?'BOSS':i%4===0?'BOUNTY':i%3===0?'EVENT':'HOT';tags.innerHTML=`<b>${a}</b><span>${i%2?'HIGH ACTIVITY':'LIVE TABLE'}</span>`;card.appendChild(tags)});};decorate();const grid=$('#fishGrid');if(grid)new MutationObserver(decorate).observe(grid,{childList:true,subtree:true});
}
function installCombatModules(){
  if(!$('#v14CombatRail')){const rail=document.createElement('div');rail.id='v14CombatRail';rail.className='v14-combat-rail';rail.innerHTML='<div><small>ROOM</small><b id="v14Room">SILVER</b></div><div><small>WAVE</small><b id="v14Wave">1</b></div><div class="v14-threat"><small>THREAT</small><i><b id="v14ThreatFill"></b></i><strong id="v14Threat">DENSE</strong></div><div><small>FIELD</small><b id="v14Targets">0 / 34</b></div><div><small>EVENT</small><b id="v14Event">HUNT</b></div>';battle.appendChild(rail)}
  if(!$('#v14Bounties'))left.insertBefore(box('🎯 ACTIVE BOUNTIES','v14Bounties','<div class="v14-bounty"><b>GOLD TARGET</b><span>×80+</span></div><div class="v14-bounty"><b>ELITE HUNTER</b><span id="v14EliteCount">0 ACTIVE</span></div><div class="v14-bounty"><b>BOSS CONTRACT</b><span id="v14BossBounty">STANDBY</span></div>'),left.children[1]||null);
  if(!$('#v14Buffs'))left.appendChild(box('⚡ ACTIVE BUFFS','v14Buffs','<div class="v14-buffs"><span>🔥 <b>DAMAGE</b><em>+20%</em></span><span>⚡ <b>FIRE RATE</b><em>+15%</em></span><span>🎯 <b>CRIT CHAIN</b><em id="v14Crits">0</em></span></div>'));
  if(!$('#v14Targeting')){const t=box('◎ TARGET PRIORITY','v14Targeting','<div class="v14-priority"><button data-policy="highest">VALUE</button><button data-policy="elite">ELITE</button><button data-policy="boss">BOSS</button><button data-policy="nearest">NEAR</button><button data-policy="treasure">TREASURE</button></div>');right.insertBefore(t,right.children[1]||null);t.addEventListener('click',e=>{const b=e.target.closest('[data-policy]');if(!b)return;runtime()?.setTargetPolicy?.(b.dataset.policy);sync()})}
  if(!$('#v14TargetInspector'))right.appendChild(box('☠ TARGET INTEL','v14TargetInspector','<div class="v14-target-card"><b id="v14TargetName">SCANNING FIELD</b><span>VALUE <strong id="v14TargetValue">—</strong></span><span>HP <strong id="v14TargetHp">—</strong></span><span>CLASS <strong id="v14TargetClass">—</strong></span></div>'));
  if(!$('#v14DensityCtl')){const d=box('▦ VISUAL DENSITY','v14DensityCtl','<div class="v14-density-ctl"><button data-density="standard">STD</button><button data-density="dense">DENSE</button><button data-density="extreme">EXTREME</button></div><small class="v14-density-note">Dense is default. Extreme auto-engages during major combat.</small>');right.appendChild(d);d.addEventListener('click',e=>{const b=e.target.closest('[data-density]');if(!b)return;runtime()?.setMode?.(b.dataset.density);sync()})}
  if(!$('#v14FeverCore')){const f=document.createElement('div');f.id='v14FeverCore';f.className='v14-fever-core';f.innerHTML='<span>OCEAN FEVER</span><div><i id="v14FeverFill"></i></div><b id="v14FeverText">0%</b><small id="v14FeverBuff">BUILD OVERDRIVE</small>';battle.appendChild(f)}
  if(!$('#v14LootStack')){const l=document.createElement('div');l.id='v14LootStack';l.className='v14-loot-stack';l.innerHTML='<small>LIVE TABLE</small><div id="v14LootLine">TARGET FIELD LOADED</div><div id="v14PlayerLine">TEAM CANNONS READY</div>';battle.appendChild(l)}
  if(!$('#v14DensityStamp')){const s=document.createElement('div');s.id='v14DensityStamp';s.className='v14-density-stamp';s.innerHTML='<small>F.S.A.</small><b>DENSE MODE</b><span>V14</span>';battle.appendChild(s)}
}
function threatName(v){return v>=91?'EXTREME':v>=76?'CHAOS':v>=51?'DENSE':v>=26?'ACTIVE':'CALM'}
const roomName=n=>['BRONZE','SILVER','GOLD'][Math.max(0,Math.min(2,Number(n)||0))];
let lastEvent='';let eventUntil=0;
function sync(){
  installCombatModules();const rt=runtime(),s=rt?.getState?.();if(!s)return;
  root.dataset.densityMode=s.mode||'dense';
  const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
  set('#v14Room',roomName(s.room));set('#v14Wave',s.wave||1);set('#v14Targets',`${s.fish||0} / ${s.targetCap||0}`);set('#v14EliteCount',`${s.hard||0} ACTIVE`);set('#v14BossBounty',s.boss?'ENGAGED':'STANDBY');set('#v14Crits',s.crits||0);
  const intensity=Math.max(0,Math.min(100,s.intensity||0)),threat=threatName(intensity);set('#v14Threat',threat);const tf=$('#v14ThreatFill');if(tf)tf.style.width=`${intensity}%`;
  set('#v14Event',s.event||'HUNT');if(s.event&&s.event!==lastEvent){lastEvent=s.event;eventUntil=Date.now()+2200;set('#v14LootLine',s.event);}
  if(Date.now()>eventUntil)set('#v14LootLine',s.boss?`${s.boss.name} · PHASE ${s.boss.stage||1}`:`${s.fish} TARGETS · ${s.hard} ELITES`);
  set('#v14PlayerLine',`CHAIN ×${s.combo||0} · ${s.particles||0} FX · ${s.labels||0} HIT CALLOUTS`);
  const fever=Math.max(0,Math.min(100,Number(s.fever)||0)),ff=$('#v14FeverFill');if(ff)ff.style.width=`${fever}%`;set('#v14FeverText',`${Math.round(fever)}%`);set('#v14FeverBuff',s.mode==='extreme'?'OVERDRIVE ACTIVE':fever>=70?'SURGE NEAR':'BUILD OVERDRIVE');
  const target=rt?.getTarget?.();set('#v14TargetName',target?.name||'SCANNING FIELD');set('#v14TargetValue',target?`×${target.mult}`:'—');set('#v14TargetHp',target?`${Math.max(0,Math.round(target.hp)).toLocaleString()} / ${Math.round(target.max).toLocaleString()}`:'—');set('#v14TargetClass',target?(target.boss?'BOSS':target.hard?'ELITE':'COMMON'):'—');
  $$('#v14Targeting [data-policy]').forEach(b=>b.classList.toggle('on',b.dataset.policy===s.targetPolicy));$$('#v14DensityCtl [data-density]').forEach(b=>b.classList.toggle('on',b.dataset.density===s.baseMode));
  battle.classList.toggle('v14-chaos',intensity>=76);battle.classList.toggle('v14-extreme',s.mode==='extreme');
}
installLobbyDensity();installCombatModules();sync();
const timer=setInterval(()=>{if(game.classList.contains('on'))sync()},220);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
window.__FSA_DENSE_UI__={version:'v14',refresh:sync,getStatus:()=>runtime()?.getState?.()||null};
})();