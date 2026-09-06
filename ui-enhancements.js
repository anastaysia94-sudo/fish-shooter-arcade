(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const stateKey='fsa.ui.v4';
let ui={claimed:false,sound:true,...(()=>{try{return JSON.parse(localStorage.getItem(stateKey)||'{}')}catch{return{}}})()};
const save=()=>localStorage.setItem(stateKey,JSON.stringify(ui));

function sync(){
  const shots=Number($('#shots')?.textContent||0), kills=Number($('#kills')?.textContent||0), score=Number(String($('#fgScore')?.textContent||'0').replace(/,/g,''))||0;
  const boss=($('#fgBoss')?.textContent||'—').trim();
  if($('#mFish'))$('#mFish').textContent=`${Math.min(kills,50)} / 50`;
  if($('#mShots'))$('#mShots').textContent=`${Math.min(shots,100)} / 100`;
  if($('#mBoss'))$('#mBoss').textContent=boss!=='—'?'1 / 1':'0 / 1';
  if($('#mFishBar'))$('#mFishBar').style.width=`${Math.min(100,kills/50*100)}%`;
  if($('#mShotsBar'))$('#mShotsBar').style.width=`${Math.min(100,shots)}%`;
  if($('#mBossBar'))$('#mBossBar').style.width=boss!=='—'?'100%':'0%';
  if($('#rankScore'))$('#rankScore').textContent=Math.floor(score).toLocaleString();
  const profile=(()=>{try{return JSON.parse(localStorage.getItem('fsa.arcade.v3')||'{}')}catch{return{}}})();
  const xp=Math.max(0,Math.min(100,Number(profile.xp||42)%100));
  if($('#xpFill'))$('#xpFill').style.width=`${xp}%`;
}
setInterval(sync,500);sync();

const duration=2*3600+14*60+37;let start=Date.now();
function clock(){const left=(duration-Math.floor((Date.now()-start)/1000))%duration;const s=left<0?duration+left:left;const h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor(s%3600/60)).padStart(2,'0'),sec=String(s%60).padStart(2,'0');if($('#eventTimer'))$('#eventTimer').textContent=`${h}:${m}:${sec}`;if($('#missionReset'))$('#missionReset').textContent=`${h}:${m}:${sec}`}
setInterval(clock,1000);clock();

$$('[data-scroll]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.scroll;document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});$$('.railBtn').forEach(x=>x.classList.toggle('on',x===btn));}));

const claim=$('#dailyClaim');
function renderClaim(){if(!claim)return;claim.textContent=ui.claimed?'Daily Supply Claimed':'Claim Daily Supply';claim.disabled=!!ui.claimed;}
claim?.addEventListener('click',()=>{ui.claimed=true;save();renderClaim();});renderClaim();

const sound=$('#soundToggle');
function renderSound(){if(sound){sound.textContent=ui.sound?'◉':'○';sound.title=ui.sound?'UI sound enabled':'UI sound muted';}}
sound?.addEventListener('click',()=>{ui.sound=!ui.sound;save();renderSound();});renderSound();

addEventListener('keydown',e=>{if(e.key==='Escape')$$('.modal.on').forEach(m=>m.classList.remove('on'));if((e.key==='p'||e.key==='P')&&!e.ctrlKey&&!e.metaKey&&document.activeElement?.tagName!=='INPUT')window.openRoomSelect?.(0);});

if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
})();
