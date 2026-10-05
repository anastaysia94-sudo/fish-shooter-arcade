(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const VERSION='v16';
const TUTORIAL_KEY='fsa.v16.tutorial.seen';
const PROFILE_KEY='fsa.v9.profile';
const GUEST_BACKUP='fsa.v11.guestBackup';
const DEFAULT_SEED={credits:12680450,gems:2480,pearls:36,level:88,xp:4620};
const STARTER={credits:2500,gems:0,pearls:0,level:1,xp:0};
let guestSyncQueued=false;

function injectCss(){
  if(document.querySelector('link[href="release-finish-v16.css"]'))return;
  const l=document.createElement('link');l.rel='stylesheet';l.href='release-finish-v16.css';document.head.appendChild(l);
}
function sameSeed(p){return p&&Object.keys(DEFAULT_SEED).every(k=>Number(p[k])===DEFAULT_SEED[k])}
function safeReadJson(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function safeWriteJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function preferredGuest(profile){
  const primary=safeReadJson(PROFILE_KEY),backup=safeReadJson(GUEST_BACKUP);
  const progressed=[primary,backup].find(v=>v&&!sameSeed(v));
  const needsMigration=sameSeed(primary)||sameSeed(backup)||sameSeed(profile);
  const normalized=progressed|| (needsMigration?{...STARTER}:null);
  if(needsMigration&&normalized){
    if(!primary||sameSeed(primary))safeWriteJson(PROFILE_KEY,normalized);
    if(!backup||sameSeed(backup))safeWriteJson(GUEST_BACKUP,normalized);
    if(sameSeed(profile))Object.assign(profile,normalized);
  }
  return normalized;
}
function cloudIdentityActive(){return /^CLOUD PLAYER\b/i.test($('.v8-account .profile small')?.textContent||'')}
function normalizeGuest(){
  const profile=window.__FSA_GAME_TEST__?.getProfile?.();
  preferredGuest(profile);
  if(cloudIdentityActive())return;
  const stored=safeReadJson(PROFILE_KEY),p=profile||stored||STARTER;
  if(profile&&stored&&!sameSeed(stored)&&sameSeed(profile))Object.assign(profile,stored);
  ['coins','gcoins','slotCoins'].forEach(id=>{const e=document.getElementById(id),v=Math.floor(Number(p.credits)||0).toLocaleString();if(e&&e.textContent!==v)e.textContent=v});
  const gems=$('#gems'),pearls=$('#pearls'),gv=(Number(p.gems)||0).toLocaleString(),pv=(Number(p.pearls)||0).toLocaleString();if(gems&&gems.textContent!==gv)gems.textContent=gv;if(pearls&&pearls.textContent!==pv)pearls.textContent=pv;
  const profileName=$('.v8-account .profile b');if(profileName&&/OceanHunterX/i.test(profileName.textContent))profileName.textContent='Guest Diver';
  const profileMeta=$('.v8-account .profile small');if(profileMeta&&(/LV\s*88/i.test(profileMeta.textContent)||/F\.S\.A\. ELITE/i.test(profileMeta.textContent)))profileMeta.textContent=`LOCAL GUEST · LV ${Math.max(1,Number(p.level)||1)}`;
  const ownName=$('#youSeat .pname');if(ownName&&/OceanHunterX/i.test(ownName.textContent))ownName.innerHTML=ownName.innerHTML.replace(/OceanHunterX/g,'Guest Diver');
  $$('.v14-rank .you span').forEach(e=>{if(/OceanHunterX/i.test(e.textContent))e.textContent='Guest Diver'});
}
function removePublicAdminDoor(){
  $$('.v8-nav a').filter(a=>/FOUNDER|admin\//i.test(`${a.textContent} ${a.getAttribute('href')||''}`)).forEach(a=>a.remove());
}
function normalizeFeedRows(){
  $$('#liveFeed .live-row em').forEach(e=>{if(/^LIVE$/i.test(e.textContent.trim()))e.textContent='SIM'});
}
function labelDemoCrew(){
  $$('.v14-msg').forEach((row,i)=>{
    const face=(row.querySelector('.v14-face')?.textContent||'').trim(),b=row.querySelector('b');if(!b)return;
    if(/^YOU$/i.test(face)){if(!cloudIdentityActive()&&/OceanHunterX/i.test(b.textContent))b.textContent='Guest Diver';return;}
    if(!/^CPU CREW/i.test(b.textContent))b.textContent=`CPU CREW ${i+1}`;
  });
}
function labelSimulatedPlay(){
  const h=$('#liveFeed')?.closest('.hudbox')?.querySelector('h3');if(h&&h.textContent!=='TABLE EVENTS')h.textContent='TABLE EVENTS';
  normalizeFeedRows();
  $$('.seatgun .pname').forEach((e,i)=>{if(i>0&&/Player\s+[234]/i.test(e.textContent))e.innerHTML=e.innerHTML.replace(/Player\s+([234])/gi,'CPU $1')});
  const right=$('.fsa-v14-right');if(right){
    $$('.v14-panel-head').forEach(head=>{
      const b=head.querySelector('b'),span=head.querySelector('span');
      if(/LIVE COMMUNITY/i.test(b?.textContent||'')){b.textContent='LOCAL DEMO CREW';if(span&&span.textContent!=='SIMULATED')span.textContent='SIMULATED';}
      if(/GLOBAL LEADERBOARD/i.test(b?.textContent||'')){b.textContent='DEMO SCOREBOARD';if(span&&span.textContent!=='LOCAL SAMPLE')span.textContent='LOCAL SAMPLE';}
    });
    labelDemoCrew();
    const note=$('.v14-reference-note'),copy='Demo crew and scoreboard entries are simulated locally. Real player accounts are shown only after authenticated cloud play.';if(note&&note.textContent!==copy)note.textContent=copy;
  }
}
function addRotateHint(){
  if($('#fsaRotateHint'))return;
  const hint=document.createElement('div');hint.id='fsaRotateHint';hint.className='fsa-v16-rotate';hint.innerHTML='<b>↻ Rotate for the best fish-table view</b><span>Landscape gives the cannon HUD more room.</span>';document.body.appendChild(hint);
  const game=$('#game');const update=()=>hint.classList.toggle('on',matchMedia('(orientation: portrait)').matches&&innerWidth<820&&game?.classList.contains('on'));
  addEventListener('resize',update,{passive:true});if(game)new MutationObserver(update).observe(game,{attributes:true,attributeFilter:['class']});update();
}
function tutorial(){
  if(navigator.webdriver)return;
  let seen=false;try{seen=localStorage.getItem(TUTORIAL_KEY)==='1'}catch{}
  if(seen||$('#fsaTutorial'))return;
  const previous=document.activeElement;
  const e=document.createElement('div');e.id='fsaTutorial';e.className='fsa-v16-tutorial';e.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="fsaTutorialTitle" tabindex="-1"><button class="fsa-v16-close" aria-label="Close tutorial">×</button><small>FIRST DIVE · 30-SECOND GUIDE</small><h2 id="fsaTutorialTitle">How to play Fish Shooter Arcade</h2><div class="fsa-v16-steps"><div><b>1 · Aim + fire</b><span>Tap or click a fish to shoot. Holding continues fire.</span></div><div><b>2 · Pick your cannon</b><span>Pulse = precision, Spread = crowds, Rail = armored targets.</span></div><div><b>3 · Watch shot cost</b><span>Every shot spends virtual credits. Fish rewards add virtual credits back.</span></div><div><b>4 · Hunt bosses</b><span>Fill Fever, use powers and switch rooms as you learn the tables.</span></div></div><p>Other seats shown in local guest play are simulated CPU companions, not real remote players. Credits are virtual/non-cash and have no cash redemption.</p><button class="btn primary fsa-v16-start">GOT IT · START PLAYING</button></section>`;
  document.body.appendChild(e);
  const close=()=>{try{localStorage.setItem(TUTORIAL_KEY,'1')}catch{}e.remove();previous?.focus?.()};
  const onKey=event=>{if(event.key==='Escape'){document.removeEventListener('keydown',onKey);close()}};document.addEventListener('keydown',onKey);
  e.querySelector('.fsa-v16-close').onclick=()=>{document.removeEventListener('keydown',onKey);close()};e.querySelector('.fsa-v16-start').onclick=()=>{document.removeEventListener('keydown',onKey);close()};e.querySelector('.fsa-v16-start')?.focus();
}
function tunePlayerCopy(){
  const heroP=$('.hero-copy p'),heroCopy='Aim, fire and switch cannons across fifteen original fish-shooter tables. Hunt bosses, build combos and review your own authenticated session stats after play.';if(heroP&&heroP.textContent!==heroCopy)heroP.textContent=heroCopy;
  const quick=$('.v14-tools #v14Analyze');if(quick&&quick.textContent!=='🧠 MY SESSION STATS')quick.textContent='🧠 MY SESSION STATS';
  const alliance=$('.v14-alliance p'),allianceCopy='Practice with simulated table companions, then use authenticated cloud play for your own saved progression and post-session statistics.';if(alliance&&alliance.textContent!==allianceCopy)alliance.textContent=allianceCopy;
}
function scheduleGuestSync(){if(guestSyncQueued)return;guestSyncQueued=true;queueMicrotask(()=>{guestSyncQueued=false;normalizeGuest()})}
function observeGuestIdentity(){
  const observer=new MutationObserver(scheduleGuestSync);const profile=$('.v8-account .profile'),seat=$('#youSeat .pname');
  if(profile)observer.observe(profile,{childList:true,subtree:true,characterData:true});if(seat)observer.observe(seat,{childList:true,subtree:true,characterData:true});
}
function observeTableFeed(){const feed=$('#liveFeed');if(feed)new MutationObserver(normalizeFeedRows).observe(feed,{childList:true,subtree:true})}
function observeDemoCrew(){const feed=$('#v14Feed');if(feed)new MutationObserver(labelDemoCrew).observe(feed,{childList:true,subtree:true})}
function sync(){normalizeGuest();removePublicAdminDoor();labelSimulatedPlay();tunePlayerCopy()}
function init(){document.documentElement.dataset.releaseFinish=VERSION;injectCss();sync();addRotateHint();tutorial();observeGuestIdentity();observeTableFeed();observeDemoCrew();setTimeout(sync,250);setTimeout(sync,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.__FSA_RELEASE_FINISH_V16__={version:VERSION,reapply:sync};
})();