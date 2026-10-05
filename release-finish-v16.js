(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const VERSION='v16';
const TUTORIAL_KEY='fsa.v16.tutorial.seen';
const PROFILE_KEY='fsa.v9.profile';
const DEFAULT_SEED={credits:12680450,gems:2480,pearls:36,level:88,xp:4620};
const STARTER={credits:2500,gems:0,pearls:0,level:1,xp:0};

function injectCss(){
  if(document.querySelector('link[href="release-finish-v16.css"]'))return;
  const l=document.createElement('link');l.rel='stylesheet';l.href='release-finish-v16.css';document.head.appendChild(l);
}
function sameSeed(p){return p&&Object.keys(DEFAULT_SEED).every(k=>Number(p[k])===DEFAULT_SEED[k])}
function normalizeGuest(){
  let stored=null;try{stored=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{}
  const profile=window.__FSA_GAME_TEST__?.getProfile?.();
  if(!stored&&sameSeed(profile)){
    Object.assign(profile,STARTER);try{localStorage.setItem(PROFILE_KEY,JSON.stringify(profile))}catch{}
  }else if(sameSeed(stored)&&sameSeed(profile)){
    // Treat the exact legacy demo seed as a starter profile, but never overwrite progressed or cloud-backed state.
    Object.assign(profile,STARTER);try{localStorage.setItem(PROFILE_KEY,JSON.stringify(profile))}catch{}
  }
  const p=window.__FSA_GAME_TEST__?.getProfile?.()||STARTER;
  ['coins','gcoins','slotCoins'].forEach(id=>{const e=document.getElementById(id),v=Math.floor(Number(p.credits)||0).toLocaleString();if(e&&e.textContent!==v)e.textContent=v});
  const gems=$('#gems'),pearls=$('#pearls'),gv=(Number(p.gems)||0).toLocaleString(),pv=(Number(p.pearls)||0).toLocaleString();if(gems&&gems.textContent!==gv)gems.textContent=gv;if(pearls&&pearls.textContent!==pv)pearls.textContent=pv;
  const profileName=$('.v8-account .profile b');if(profileName&&/OceanHunterX/i.test(profileName.textContent))profileName.textContent='Guest Diver';
  const profileMeta=$('.v8-account .profile small');if(profileMeta&&/LV\s*88/i.test(profileMeta.textContent))profileMeta.textContent=`LOCAL GUEST · LV ${Math.max(1,Number(p.level)||1)}`;
  const ownName=$('#youSeat .pname');if(ownName&&/OceanHunterX/i.test(ownName.textContent))ownName.innerHTML=ownName.innerHTML.replace(/OceanHunterX/g,'Guest Diver');
  $$('.v14-rank .you span').forEach(e=>{if(/OceanHunterX/i.test(e.textContent))e.textContent='Guest Diver'});
}
function removePublicAdminDoor(){
  $$('.v8-nav a').filter(a=>/FOUNDER|admin\//i.test(`${a.textContent} ${a.getAttribute('href')||''}`)).forEach(a=>a.remove());
}
function normalizeFeedRows(){
  $$('#liveFeed .live-row em').forEach(e=>{if(/^LIVE$/i.test(e.textContent.trim()))e.textContent='SIM'});
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
    $$('.v14-msg b').forEach((b,i)=>{if(!/^YOU$/i.test(b.textContent)&&!/^CPU CREW/i.test(b.textContent))b.textContent=`CPU CREW ${i+1}`});
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
  if(localStorage.getItem(TUTORIAL_KEY)==='1'||$('#fsaTutorial'))return;
  const e=document.createElement('div');e.id='fsaTutorial';e.className='fsa-v16-tutorial';e.innerHTML=`<section><button class="fsa-v16-close" aria-label="Close tutorial">×</button><small>FIRST DIVE · 30-SECOND GUIDE</small><h2>How to play Fish Shooter Arcade</h2><div class="fsa-v16-steps"><div><b>1 · Aim + fire</b><span>Tap or click a fish to shoot. Holding continues fire.</span></div><div><b>2 · Pick your cannon</b><span>Pulse = precision, Spread = crowds, Rail = armored targets.</span></div><div><b>3 · Watch shot cost</b><span>Every shot spends virtual credits. Fish rewards add virtual credits back.</span></div><div><b>4 · Hunt bosses</b><span>Fill Fever, use powers and switch rooms as you learn the tables.</span></div></div><p>Other seats shown in local guest play are simulated CPU companions, not real remote players. Credits are virtual/non-cash and have no cash redemption.</p><button class="btn primary fsa-v16-start">GOT IT · START PLAYING</button></section>`;
  document.body.appendChild(e);
  const close=()=>{localStorage.setItem(TUTORIAL_KEY,'1');e.remove()};
  e.querySelector('.fsa-v16-close').onclick=close;e.querySelector('.fsa-v16-start').onclick=close;
}
function tunePlayerCopy(){
  const heroP=$('.hero-copy p'),heroCopy='Aim, fire and switch cannons across fifteen original fish-shooter tables. Hunt bosses, build combos and review your own authenticated session stats after play.';if(heroP&&heroP.textContent!==heroCopy)heroP.textContent=heroCopy;
  const quick=$('.v14-tools #v14Analyze');if(quick&&quick.textContent!=='🧠 MY SESSION STATS')quick.textContent='🧠 MY SESSION STATS';
  const alliance=$('.v14-alliance p'),allianceCopy='Practice with simulated table companions, then use authenticated cloud play for your own saved progression and post-session statistics.';if(alliance&&alliance.textContent!==allianceCopy)alliance.textContent=allianceCopy;
}
function observeTableFeed(){
  const feed=$('#liveFeed');if(!feed)return;new MutationObserver(normalizeFeedRows).observe(feed,{childList:true,subtree:true});
}
function sync(){normalizeGuest();removePublicAdminDoor();labelSimulatedPlay();tunePlayerCopy()}
function init(){injectCss();sync();addRotateHint();tutorial();observeTableFeed();setTimeout(sync,250);setTimeout(sync,1000);document.documentElement.dataset.releaseFinish=VERSION;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.__FSA_RELEASE_FINISH_V16__={version:VERSION,reapply:sync};
})();