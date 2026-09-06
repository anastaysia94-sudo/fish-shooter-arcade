(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uiKey='fsa.shell.v5';
let ui={claimed:false,...(()=>{try{return JSON.parse(localStorage.getItem(uiKey)||'{}')}catch{return{}}})()};
const saveUi=()=>{try{localStorage.setItem(uiKey,JSON.stringify(ui))}catch{}};

function profile(){
  try{
    const v5=JSON.parse(localStorage.getItem('fsa.arcade.v5')||'null');
    if(v5)return v5;
    return JSON.parse(localStorage.getItem('fsa.arcade.v4')||'{}');
  }catch{return{}}
}
function syncProfile(){
  const p=profile(),credits=Number(p.credits||12450),lv=Number(p.level||12),xp=(Number(p.cannon||6)*13)%100;
  $('#wallet')&&($('#wallet').textContent=Math.floor(credits).toLocaleString());
  $('#level')&&($('#level').textContent=lv);
  $('#cxLevel')&&($('#cxLevel').textContent=lv);
  $('#cxXpFill')&&($('#cxXpFill').style.width=xp+'%');
}

function syncSession(){
  const m0=$('#m0')?.textContent||'0/50',m1=$('#m1')?.textContent||'0/3',m2=$('#m2')?.textContent||'0/25';
  const parse=(v,max)=>{const n=Math.max(0,Number(String(v).split('/')[0])||0);return [n,max,Math.min(100,n/max*100)]};
  const a=parse(m0,50),b=parse(m1,3),c=parse(m2,25);
  $('#cxM0')&&($('#cxM0').textContent=`${a[0]} / ${a[1]}`);$('#cxM1')&&($('#cxM1').textContent=`${b[0]} / ${b[1]}`);$('#cxM2')&&($('#cxM2').textContent=`${c[0]} / ${c[1]}`);
  $('#cxM0Bar')&&($('#cxM0Bar').style.width=a[2]+'%');$('#cxM1Bar')&&($('#cxM1Bar').style.width=b[2]+'%');$('#cxM2Bar')&&($('#cxM2Bar').style.width=c[2]+'%');
  const score=Number(String($('#pCredit')?.textContent||$('#wallet')?.textContent||'0').replace(/,/g,''))||0;
  $('#cxRankScore')&&($('#cxRankScore').textContent=score.toLocaleString());
}

function syncVersionLabels(){
  const replace=(el)=>{if(el)el.innerHTML=el.innerHTML.replaceAll('Engine v4','Engine v5').replaceAll('ENGINE v4','ENGINE v5').replaceAll('Premium Table Engine v4','Premium Table Engine v5').replaceAll('PREMIUM TABLE ENGINE v4','PREMIUM TABLE ENGINE v5').replaceAll('>v4<','>v5<')};
  replace($('.cxRailStatus small'));
  replace($('.cxHeroCopy p'));
  replace($('.cxHeroFacts'));
  replace($('.cxPreviewCopy .cxKicker'));
  replace($('.cxPreviewCopy p'));
  replace($('.cxCannon small'));
}

function installCabinetPolish(){
  if($('#fsaCabinetPolishV5'))return;
  const st=document.createElement('style');
  st.id='fsaCabinetPolishV5';
  st.textContent=`
    .stage4{border:1px solid #356f86!important;box-shadow:inset 0 0 80px #00c6ff10,0 0 0 1px #000,0 20px 70px #000a!important}
    .stage4::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:3;background:radial-gradient(circle at 50% 100%,#33d9ff0c,transparent 34%),linear-gradient(90deg,#04111a33,transparent 12% 88%,#04111a33)}
    .fsa4bottom{border-top:1px solid #376779!important;background:linear-gradient(180deg,#07131e,#02080d)!important}
    .cannon4{box-shadow:inset 0 0 22px #ffb22c18,0 0 24px #000!important}
    .fire4{letter-spacing:.08em!important;text-shadow:0 0 10px currentColor}
    .round4.active{box-shadow:0 0 16px #5af2ff55,inset 0 0 12px #5af2ff22!important}
    .power.ready{filter:drop-shadow(0 0 5px #5cf1ff55)}
    .target4.on{box-shadow:0 0 24px #3be7ff22!important}
    .fidelityStrip{display:flex;gap:5px;align-items:center;justify-content:center;flex-wrap:wrap;padding:5px 8px;border-top:1px solid #173b4d;border-bottom:1px solid #102d3a;background:#031019;color:#8fd8eb;font:800 7px/1.1 system-ui;letter-spacing:.06em;text-transform:uppercase}
    .fidelityStrip b{color:#ffe08a;margin-right:2px}.fidelityStrip span{padding:4px 7px;border:1px solid #24566b;border-radius:999px;background:#061822}
    .fidelityStrip .exact{border-color:#aa7f2c;color:#ffe4a0}
    .cabinetHint{position:absolute;right:8px;bottom:7px;z-index:7;padding:4px 7px;border:1px solid #2b6378;border-radius:6px;background:#031018d9;color:#86d5e9;font:800 7px system-ui;pointer-events:none}
    @media(max-width:800px){.fidelityStrip{justify-content:flex-start;overflow-x:auto;flex-wrap:nowrap}.fidelityStrip span{white-space:nowrap}.cabinetHint{display:none}}
  `;
  document.head.appendChild(st);
}

function enhanceFishModal(){
  const root=$('.fsa4');
  if(!root)return;
  const stage=root.querySelector('.stage4');
  if(stage&&!stage.querySelector('.cabinetHint')){
    const hint=document.createElement('div');
    hint.className='cabinetHint';
    hint.textContent='4-SEAT CABINET · MOVING SCHOOLS · TRAVELING SHOTS';
    stage.appendChild(hint);
  }
  if(!root.querySelector('.fidelityStrip')){
    const strip=document.createElement('div');
    strip.className='fidelityStrip';
    strip.innerHTML='<span><b>Table v5</b> four-seat cannon layout</span><span>moving target schools</span><span>traveling projectiles</span><span>auto + lock controls</span><span>boss + special-weapon targets</span><span class="exact">original F.S.A. simulation</span>';
    root.querySelector('.fsa4bottom')?.before(strip);
  }
  root.querySelectorAll('#fire,#auto,#lock,.power,#minus,#plus').forEach(btn=>{
    if(btn.dataset.hapticV5)return;
    btn.dataset.hapticV5='1';
    btn.addEventListener('pointerdown',()=>{try{navigator.vibrate?.(btn.id==='fire'?10:6)}catch{}});
  });
}

setInterval(()=>{syncProfile();syncSession();enhanceFishModal()},600);
syncProfile();syncSession();syncVersionLabels();installCabinetPolish();enhanceFishModal();

const duration=2*3600+14*60+37,start=Date.now();
function tick(){let s=duration-Math.floor((Date.now()-start)/1000);s=((s%duration)+duration)%duration;const h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor(s%3600/60)).padStart(2,'0'),sec=String(s%60).padStart(2,'0');$('#cxEventTimer')&&($('#cxEventTimer').textContent=`${h}:${m}:${sec}`);$('#cxMissionReset')&&($('#cxMissionReset').textContent=`${h}:${m}:${sec}`)}
setInterval(tick,1000);tick();

$$('[data-cx-scroll]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.cxScroll;document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});$$('.cxRail button').forEach(x=>x.classList.toggle('on',x===btn));}));

const claim=$('#cxClaim');
function renderClaim(){if(!claim)return;claim.textContent=ui.claimed?'Daily Supply Claimed':'Claim Daily Supply';claim.disabled=!!ui.claimed}
claim?.addEventListener('click',()=>{ui.claimed=true;saveUi();renderClaim()});renderClaim();

const observer=new MutationObserver(()=>{syncVersionLabels();enhanceFishModal()});
observer.observe(document.body,{childList:true,subtree:true});

window.addEventListener('keydown',e=>{if((e.key==='p'||e.key==='P')&&!e.ctrlKey&&!e.metaKey&&document.activeElement?.tagName!=='INPUT')window.openFish?.(0);});
})();
