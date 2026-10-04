(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const root=document.documentElement;
root.dataset.releasePolish='v16';
const ONBOARD_KEY='fsa.v16.onboarded';
const GUEST_KEY='fsa.v9.profile';

function ensureGuestIdentity(){
  let signedIn=false;
  try{signedIn=!!localStorage.getItem('sb-nqcshihyfhthywpseilx-auth-token')}catch{}
  if(signedIn)return;
  const profile=$('.v8-account .profile');
  if(profile){
    const name=profile.querySelector('b'),rank=profile.querySelector('small');
    if(name)name.textContent='Guest Diver';
    if(rank)rank.textContent='ROOKIE · LV 1';
  }
  const seat=$('#youSeat .pname');
  if(seat){const bal=seat.querySelector('.bal');seat.childNodes[0].nodeValue='P1 · Guest Diver · ';if(bal&&!seat.contains(bal))seat.appendChild(bal)}
}

function removePrivateAdminShortcut(){
  $$('.v8-nav a').filter(a=>/founder|admin/i.test(a.textContent)||/\/admin\/?$/i.test(a.getAttribute('href')||'')).forEach(a=>a.remove())
}

function markDemoUiTruthfully(){
  const replacements=[
    ['.v14-panel-head span','325 ONLINE','LOCAL DEMO'],
    ['.v14-panel-head b','LIVE COMMUNITY','SAMPLE COMMUNITY'],
    ['.v14-panel-head b','GLOBAL LEADERBOARD','DEMO SCOREBOARD'],
    ['#v14LobbyPulse span','LIVE ARCADE','ARCADE DEMO'],
    ['#v14LobbyPulse b','15 OCEANS ONLINE','15 PLAYABLE OCEANS']
  ];
  for(const [selector,from,to] of replacements){
    $$(selector).forEach(el=>{if(el.textContent.includes(from))el.textContent=el.textContent.replace(from,to)})
  }
  $$('.v14-card-badges span').forEach(el=>{if(/LIVE TABLE/i.test(el.textContent))el.textContent='PLAYABLE TABLE'})
}

function installStyle(){
  if($('#fsaReleasePolishStyle'))return;
  const style=document.createElement('style');style.id='fsaReleasePolishStyle';style.textContent=`
  .fsa-onboard{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:#000c;backdrop-filter:blur(10px)}
  .fsa-onboard[hidden],.fsa-rotate[hidden]{display:none!important}
  .fsa-onboard-card{width:min(620px,94vw);border:1px solid #62eaff66;border-radius:24px;padding:24px;background:linear-gradient(160deg,#071f31f7,#020914fa);box-shadow:0 30px 90px #000,0 0 42px #31dfff1f;color:#effcff}
  .fsa-onboard-card h2{margin:0 0 8px;color:#fff0a1;font-size:clamp(28px,5vw,48px)}
  .fsa-onboard-card p{color:#add3dd;line-height:1.55}
  .fsa-onboard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}
  .fsa-onboard-step{padding:13px;border:1px solid #54eaff2d;border-radius:15px;background:#061521}.fsa-onboard-step b{display:block;color:#7df5ff}.fsa-onboard-step small{color:#9abac4;line-height:1.45}
  .fsa-onboard-actions{display:flex;gap:10px;flex-wrap:wrap}.fsa-onboard-actions button{padding:11px 16px;border:1px solid #70efff55;border-radius:12px;background:#0c5167;color:#fff;font-weight:900;cursor:pointer}.fsa-onboard-actions .secondary{background:#08131d;color:#b8d9e1}
  .fsa-rotate{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px;background:#01060bf2;color:#fff;text-align:center}.fsa-rotate div{max-width:420px;padding:24px;border:1px solid #61ebff55;border-radius:22px;background:#071725}.fsa-rotate b{display:block;font-size:28px;color:#fff0a0}.fsa-rotate p{color:#b4d5dc;line-height:1.5}.fsa-rotate button{padding:10px 15px;border-radius:11px;border:1px solid #63eaff55;background:#0d526a;color:#fff;font-weight:900}
  .fsa-tutorial-chip{display:inline-flex!important;align-items:center;gap:5px!important;color:#83f5ff!important}
  @media(max-width:1500px) and (min-width:901px){html[data-cinematic="v13"] .v8-hero-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}html[data-cinematic="v13"] .hero-card{grid-column:1/-1!important;min-height:390px!important}html[data-cinematic="v13"] .hero-copy{max-width:70%!important}.v8-hero-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.hero-card{grid-column:1/-1!important}}
  @media(max-width:1150px) and (min-width:901px){html[data-cinematic="v13"] .v8-hero-grid,.v8-hero-grid{grid-template-columns:1fr!important}.hero-card,.promo-card,.mission-card{grid-column:1!important}}
  @media(max-width:620px){.fsa-onboard-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(style)
}

function buildOnboarding(){
  if($('#fsaOnboard'))return;
  const overlay=document.createElement('div');overlay.id='fsaOnboard';overlay.className='fsa-onboard';overlay.hidden=true;overlay.innerHTML=`<section class="fsa-onboard-card" role="dialog" aria-modal="true" aria-labelledby="fsaOnboardTitle">
    <div class="eyebrow">F.S.A. QUICK START</div><h2 id="fsaOnboardTitle">Hunt fish. Build combos. Beat bosses.</h2>
    <p>This is a virtual-credit arcade. Credits are for gameplay only and are not cash or redeemable prizes.</p>
    <div class="fsa-onboard-grid">
      <div class="fsa-onboard-step"><b>1 · Choose an ocean</b><small>Start in Bronze Reef while learning. Silver and Gold raise shot ranges and enemy toughness.</small></div>
      <div class="fsa-onboard-step"><b>2 · Aim + fire</b><small>Tap/click the water to shoot. Use Lock On or Auto Fire only after you understand your shot cost.</small></div>
      <div class="fsa-onboard-step"><b>3 · Match the cannon</b><small>Pulse = precision. Spread = crowds. Rail = slower heavy hits and piercing pressure.</small></div>
      <div class="fsa-onboard-step"><b>4 · Watch the HUD</b><small>Combo, Fever, missions, bosses and your virtual-credit balance tell you when to change tactics.</small></div>
    </div>
    <div class="fsa-onboard-actions"><button id="fsaOnboardStart">Start with Reef Run</button><button id="fsaOnboardClose" class="secondary">Explore lobby first</button></div>
  </section>`;document.body.appendChild(overlay)
  const close=()=>{overlay.hidden=true;try{localStorage.setItem(ONBOARD_KEY,'1')}catch{}}
  $('#fsaOnboardClose').addEventListener('click',close)
  $('#fsaOnboardStart').addEventListener('click',()=>{close();window.openGame?.(0)})
  let seen=false;try{seen=localStorage.getItem(ONBOARD_KEY)==='1'}catch{}
  if(!seen)overlay.hidden=false

  const nav=$('.v8-nav');if(nav&&!$('#fsaTutorialChip')){const b=document.createElement('button');b.id='fsaTutorialChip';b.className='fsa-tutorial-chip';b.textContent='? TUTORIAL';b.addEventListener('click',()=>{overlay.hidden=false});nav.appendChild(b)}
}

function buildRotatePrompt(){
  if($('#fsaRotate'))return;
  const overlay=document.createElement('div');overlay.id='fsaRotate';overlay.className='fsa-rotate';overlay.hidden=true;overlay.innerHTML='<div><b>↻ Rotate for the full table</b><p>Fish Shooter Arcade works best in landscape on phones so the target field, cannons and HUD do not fight for the same six inches of screen.</p><button id="fsaRotateContinue">Continue in portrait</button></div>';document.body.appendChild(overlay)
  $('#fsaRotateContinue').addEventListener('click',()=>overlay.hidden=true)
  const maybe=()=>{const phone=Math.min(innerWidth,innerHeight)<=700,portrait=innerHeight>innerWidth,open=$('#game')?.classList.contains('on');overlay.hidden=!(phone&&portrait&&open)}
  addEventListener('resize',maybe);addEventListener('orientationchange',()=>setTimeout(maybe,150));
  const original=window.openGame;if(typeof original==='function'&&!original.__fsaReleasePolish){const wrapped=function(){const out=original.apply(this,arguments);setTimeout(maybe,30);return out};wrapped.__fsaReleasePolish=true;window.openGame=wrapped}
  const close=window.closeGame;if(typeof close==='function'&&!close.__fsaReleasePolish){const wrapped=function(){overlay.hidden=true;return close.apply(this,arguments)};wrapped.__fsaReleasePolish=true;window.closeGame=wrapped}
}

function simplifyPlayerCopy(){
  const hero=$('.hero-copy p');if(hero)hero.textContent='Pick an ocean, choose your cannon, hunt fish and bosses, build combos, and learn which targets are worth your virtual shots.'
  const footer=$('.v8-footer');if(footer&&!/virtual\/non-cash/i.test(footer.textContent))footer.prepend('Virtual/non-cash gameplay · ')
}

function install(){installStyle();ensureGuestIdentity();removePrivateAdminShortcut();simplifyPlayerCopy();buildOnboarding();buildRotatePrompt();markDemoUiTruthfully();
  const observer=new MutationObserver(()=>{removePrivateAdminShortcut();markDemoUiTruthfully()});observer.observe(document.body,{subtree:true,childList:true});
}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',install,{once:true});else install();
window.__FSA_RELEASE_POLISH_V16__={version:'v16',showTutorial:()=>{$('#fsaOnboard').hidden=false},sanitize:markDemoUiTruthfully};
})();
