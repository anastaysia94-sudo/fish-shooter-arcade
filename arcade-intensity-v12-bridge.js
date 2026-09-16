(()=>{'use strict';
const legacy=window.__FSA_GAME_TEST__||null;
if(!legacy)return;
const KEY='fsa.v9.profile';
const shadow={game:Number(legacy.getState?.()?.game)||0,room:Number(legacy.getState?.()?.room)||1};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};
const seedIntensityProfile=()=>{const p=legacy.getProfile?.();if(p)write({...read(),credits:Number(p.credits)||0,gems:Number(p.gems)||0,pearls:Number(p.pearls)||0,level:Number(p.level)||1,xp:Number(p.xp)||0})};
const intensityOpen=window.openGame;
const intensityRoom=window.chooseRoom;
if(typeof intensityOpen==='function')window.openGame=function(i){shadow.game=Math.max(0,Math.min(14,Number(i)||0));seedIntensityProfile();const out=intensityOpen.apply(this,arguments);queueMicrotask(syncCinematicHud);return out};
if(typeof intensityRoom==='function')window.chooseRoom=function(i){shadow.room=Math.max(0,Math.min(2,Number(i)||0));const out=intensityRoom.apply(this,arguments);queueMicrotask(syncCinematicHud);return out};
const legacyState=legacy.getState?.bind(legacy);
window.__FSA_GAME_TEST__={...legacy,getProfile:()=>legacy.getProfile?.(),getState:()=>{const base=legacyState?.()||{};const fishOpen=document.getElementById('game')?.classList.contains('on');const slotOpen=document.getElementById('slotModal')?.classList.contains('on');if(slotOpen)return base;if(fishOpen)return {...base,game:shadow.game,room:shadow.room};return {...base,game:shadow.game,room:shadow.room}}};
window.__FSA_INTENSITY_BRIDGE__={version:'v12',cinematic:'v13',getShadowState:()=>({...shadow}),seedProfile:seedIntensityProfile};

const root=document.documentElement;
root.dataset.cinematic='v13';
const net=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
const cinematicLite=!!(net&&(net.saveData||/^(slow-)?2g$/.test(net.effectiveType||'')));
if(cinematicLite)root.dataset.cinematicLite='1';
const $=s=>document.querySelector(s);
const battle=$('.battle');
const game=$('#game');
if(!battle||!game)return;

function button(label,action,icon){const b=document.createElement('button');b.type='button';b.dataset.v13Action=action;b.className='v13-action';b.setAttribute('aria-label',label);b.innerHTML=`<span>${icon}</span><b>${label}</b>`;return b}
function installCinematicChrome(){
  if(!$('#v13BossMeta')){
    const meta=document.createElement('div');meta.id='v13BossMeta';meta.className='v13-boss-meta';meta.innerHTML='<span id="v13BossLevel">LV 10</span><span id="v13BossPhase">HUNT</span><strong id="v13BossMult">×4</strong>';
    $('.boss-hud')?.appendChild(meta);
  }
  if(!$('#v13EventStamp')){const e=document.createElement('div');e.id='v13EventStamp';e.className='v13-event-stamp';e.innerHTML='<span>BOSS BATTLE</span><b>LIVE NOW</b>';battle.appendChild(e)}
  if(!$('#v13Reticle')){const r=document.createElement('div');r.id='v13Reticle';r.className='v13-reticle';r.setAttribute('aria-hidden','true');battle.appendChild(r)}
  if(!$('#v13ComboCallout')){const c=document.createElement('div');c.id='v13ComboCallout';c.className='v13-combo-callout';c.innerHTML='<b>CHAIN</b><strong>×0</strong><small>KEEP FIRING</small>';battle.appendChild(c)}
  if(!$('#v13TeamStrip')){const t=document.createElement('div');t.id='v13TeamStrip';t.className='v13-team-strip';t.innerHTML='<span>TEAM SYNC</span><i><b id="v13TeamFill"></b></i><strong id="v13TeamText">READY</strong>';battle.appendChild(t)}
  if(!$('#v13ActionTower')){
    const tower=document.createElement('div');tower.id='v13ActionTower';tower.className='v13-action-tower';
    const head=document.createElement('div');head.className='v13-tower-head';head.textContent='TACTICAL';tower.appendChild(head);
    tower.append(button('LOCK ON','lock','◎'));
    tower.append(button('AUTO FIRE','auto','⌁'));
    const mode=document.createElement('div');mode.className='v13-cannon-mode';mode.innerHTML='<small>CANNON MODE</small>';
    mode.append(button('PULSE','gun0','⚡'),button('SPREAD','gun1','✹'),button('RAIL','gun2','🔱'));
    tower.appendChild(mode);
    battle.appendChild(tower);
    tower.addEventListener('click',e=>{const b=e.target.closest('[data-v13-action]');if(b)runAction(b.dataset.v13Action)});
  }
  if(!$('#v13Hotkeys')){const h=document.createElement('div');h.id='v13Hotkeys';h.className='v13-hotkeys';h.textContent='1–3 CANNON  ·  Q LOCK  ·  E AUTO  ·  [ ] POWER  ·  Z/X/C/V SURGE';battle.appendChild(h)}
}

function runAction(action){
  if(action==='lock')return $('#lockBtn')?.click();
  if(action==='auto')return $('#autoBtn')?.click();
  if(/^gun[0-2]$/.test(action))return window.switchGun?.(Number(action.at(-1)));
}
function gameOpen(){return game.classList.contains('on')}
function activeInput(){const a=document.activeElement;return !!a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable)}
function pulseReticle(){const r=$('#v13Reticle');if(!r)return;r.classList.remove('blast');void r.offsetWidth;r.classList.add('blast')}
function setReticle(e){const r=$('#v13Reticle'),rect=battle.getBoundingClientRect();if(!r||!rect.width||!rect.height)return;const x=Math.max(0,Math.min(rect.width,e.clientX-rect.left)),y=Math.max(0,Math.min(rect.height,e.clientY-rect.top));r.style.setProperty('--rx',`${x}px`);r.style.setProperty('--ry',`${y}px`);r.classList.add('tracking')}

battle.addEventListener('pointermove',setReticle,{passive:true});
battle.addEventListener('pointerdown',e=>{setReticle(e);pulseReticle()},{passive:true});
battle.addEventListener('pointerleave',()=>$('#v13Reticle')?.classList.remove('tracking'),{passive:true});
window.addEventListener('keydown',e=>{
  if(!gameOpen()||activeInput()||e.altKey||e.ctrlKey||e.metaKey)return;
  const k=e.key.toLowerCase();
  if(['1','2','3'].includes(k)){e.preventDefault();window.switchGun?.(Number(k)-1);return}
  if(k==='q'){e.preventDefault();$('#lockBtn')?.click();return}
  if(k==='e'){e.preventDefault();$('#autoBtn')?.click();return}
  if(k==='['){e.preventDefault();window.betStep?.(-1);return}
  if(k===']'){e.preventDefault();window.betStep?.(1);return}
  const powers={z:'nuke',x:'lightning',c:'freeze',v:'bomb'};
  if(powers[k]){e.preventDefault();window.power?.(powers[k])}
});

const numberFrom=(el,fallback=0)=>{const n=Number(String(el?.textContent||'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:fallback};
function bossRatio(){const fill=$('#bossHP'),bar=fill?.parentElement;if(!fill||!bar)return 0;const fw=parseFloat(getComputedStyle(fill).width)||0,bw=parseFloat(getComputedStyle(bar).width)||0;return bw?Math.max(0,Math.min(1,fw/bw)):0}
function bossLive(){return String($('#bossText')?.textContent||'').trim()!=='INCOMING'}
function comboTier(combo){if(combo>=50)return['MYTHIC','LEGENDARY HIT'];if(combo>=25)return['LEGENDARY','CHAIN SURGE'];if(combo>=10)return['HOT STREAK','KEEP FIRING'];return['CHAIN','KEEP FIRING']}
let lastTier='';
function syncCinematicHud(){
  installCinematicChrome();
  const state=window.__FSA_GAME_TEST__?.getState?.()||{};
  const roomNo=Math.max(0,Math.min(2,Number(state.room??shadow.room)||0));
  const level=[5,10,15][roomNo],mult=[2,4,8][roomNo];
  const levelEl=$('#v13BossLevel'),multEl=$('#v13BossMult'),phaseEl=$('#v13BossPhase');
  if(levelEl)levelEl.textContent=`LV ${level}`;if(multEl)multEl.textContent=`×${mult}`;
  const live=bossLive(),ratio=bossRatio();
  let phase='HUNT';if(live)phase=ratio>.66?'PHASE I':ratio>.33?'PHASE II':'ENRAGED';
  if(phaseEl)phaseEl.textContent=phase;
  battle.classList.toggle('v13-boss-live',live);
  battle.classList.toggle('v13-boss-enraged',live&&ratio<=.33);
  const stamp=$('#v13EventStamp');if(stamp)stamp.classList.toggle('on',live);

  const combo=numberFrom($('#combo'));
  const [tier,sub]=comboTier(combo),callout=$('#v13ComboCallout');
  if(callout){callout.querySelector('b').textContent=tier;callout.querySelector('strong').textContent=`×${combo}`;callout.querySelector('small').textContent=sub;callout.classList.toggle('on',combo>=10)}
  if(tier!==lastTier&&combo>=10){lastTier=tier;callout?.classList.remove('pop');void callout?.offsetWidth;callout?.classList.add('pop')}
  if(combo<10)lastTier='';

  const fever=numberFrom($('#feverPct'));
  battle.classList.toggle('v13-fever',fever>=100);
  const fishCount=Number(window.__FSA_GAME_TEST__?.getFishCount?.()??state.fish?.length??0)||0;
  const sync=Math.max(4,Math.min(100,Math.round(combo*1.6+fishCount*1.5+(live?14:0))));
  const teamFill=$('#v13TeamFill'),teamText=$('#v13TeamText');if(teamFill)teamFill.style.width=`${sync}%`;if(teamText)teamText.textContent=sync>=85?'OVERDRIVE':sync>=55?'LINKED':sync>=25?'BUILDING':'READY';

  const timeText=String($('#timeLeft')?.textContent||'');const m=timeText.match(/(\d+):(\d+)/),seconds=m?(Number(m[1])*60+Number(m[2])):999;
  game.classList.toggle('v13-time-critical',seconds<=30);
  const actionTower=$('#v13ActionTower');
  if(actionTower){
    actionTower.querySelector('[data-v13-action="lock"]')?.classList.toggle('on',$('#lockBtn')?.classList.contains('on'));
    actionTower.querySelector('[data-v13-action="auto"]')?.classList.toggle('on',$('#autoBtn')?.classList.contains('on'));
    const gunName=String($('#youGun')?.textContent||'').toLowerCase();const active=gunName.includes('spread')?1:gunName.includes('rail')?2:0;
    for(let i=0;i<3;i++)actionTower.querySelector(`[data-v13-action="gun${i}"]`)?.classList.toggle('on',i===active);
  }
}

installCinematicChrome();
syncCinematicHud();
const observer=new MutationObserver(syncCinematicHud);
for(const target of [$('#bossHP'),$('#bossText'),$('#combo'),$('#feverPct'),$('#timeLeft'),$('#youGun')])if(target)observer.observe(target,{attributes:true,childList:true,subtree:true,characterData:true});
const syncTimer=setInterval(()=>{if(gameOpen())syncCinematicHud()},500);
window.addEventListener('pagehide',()=>clearInterval(syncTimer),{once:true});
window.__FSA_CINEMATIC_UI__={version:'v13',refresh:syncCinematicHud,getStatus:()=>({open:gameOpen(),room:shadow.room,game:shadow.game,phase:$('#v13BossPhase')?.textContent||'',team:$('#v13TeamText')?.textContent||'',lite:cinematicLite})};
})();
