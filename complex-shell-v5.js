(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uiKey='fsa.shell.v5';
let ui={claimed:false,...(()=>{try{return JSON.parse(localStorage.getItem(uiKey)||'{}')}catch{return{}}})()};
const saveUi=()=>{try{localStorage.setItem(uiKey,JSON.stringify(ui))}catch{}};

function profile(){try{return JSON.parse(localStorage.getItem('fsa.arcade.v4')||'{}')}catch{return{}}}
function syncProfile(){const p=profile();const credits=Number(p.credits||12450),lv=Number(p.level||12),xp=(Number(p.cannon||6)*13)%100;$('#wallet')&&($('#wallet').textContent=Math.floor(credits).toLocaleString());$('#level')&&($('#level').textContent=lv);$('#cxLevel')&&($('#cxLevel').textContent=lv);$('#cxXpFill')&&($('#cxXpFill').style.width=xp+'%');}

function syncSession(){
  const m0=$('#m0')?.textContent||'0/50',m1=$('#m1')?.textContent||'0/3',m2=$('#m2')?.textContent||'0/25';
  const parse=(v,max)=>{const n=Math.max(0,Number(String(v).split('/')[0])||0);return [n,max,Math.min(100,n/max*100)]};
  const a=parse(m0,50),b=parse(m1,3),c=parse(m2,25);
  $('#cxM0')&&($('#cxM0').textContent=`${a[0]} / ${a[1]}`);$('#cxM1')&&($('#cxM1').textContent=`${b[0]} / ${b[1]}`);$('#cxM2')&&($('#cxM2').textContent=`${c[0]} / ${c[1]}`);
  $('#cxM0Bar')&&($('#cxM0Bar').style.width=a[2]+'%');$('#cxM1Bar')&&($('#cxM1Bar').style.width=b[2]+'%');$('#cxM2Bar')&&($('#cxM2Bar').style.width=c[2]+'%');
  const score=Number(String($('#pCredit')?.textContent||$('#wallet')?.textContent||'0').replace(/,/g,''))||0;$('#cxRankScore')&&($('#cxRankScore').textContent=score.toLocaleString());
}
setInterval(()=>{syncProfile();syncSession()},600);syncProfile();syncSession();

const duration=2*3600+14*60+37,start=Date.now();
function tick(){let s=duration-Math.floor((Date.now()-start)/1000);s=((s%duration)+duration)%duration;const h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor(s%3600/60)).padStart(2,'0'),sec=String(s%60).padStart(2,'0');$('#cxEventTimer')&&($('#cxEventTimer').textContent=`${h}:${m}:${sec}`);$('#cxMissionReset')&&($('#cxMissionReset').textContent=`${h}:${m}:${sec}`)}
setInterval(tick,1000);tick();

$$('[data-cx-scroll]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.cxScroll;document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});$$('.cxRail button').forEach(x=>x.classList.toggle('on',x===btn));}));

const claim=$('#cxClaim');
function renderClaim(){if(!claim)return;claim.textContent=ui.claimed?'Daily Supply Claimed':'Claim Daily Supply';claim.disabled=!!ui.claimed}
claim?.addEventListener('click',()=>{ui.claimed=true;saveUi();renderClaim()});renderClaim();

window.addEventListener('keydown',e=>{if((e.key==='p'||e.key==='P')&&!e.ctrlKey&&!e.metaKey&&document.activeElement?.tagName!=='INPUT')window.openFish?.(0);});
})();
