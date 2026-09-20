(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const battle=$('.battle'),combo=$('#combo'),fever=$('#feverPct'),bossText=$('#bossText'),canvas=$('#battleCanvas');
if(!battle||!combo||!fever||!bossText||!canvas)return;
document.documentElement.dataset.spectacle='v13';
document.documentElement.dataset.brandRegeneration='v14';
const V={combo:0,lastCombo:0,fever:0,bossRatio:1,lastMilestone:0,lastBurst:0,shotIndex:0,armed:new Set(),rage:false};
function mount(){
  if(!$('.v13-fever-core')){const e=document.createElement('div');e.className='v13-fever-core';e.innerHTML='<div><small>OCEAN FEVER</small><b id="v13Fever">0%</b></div>';battle.appendChild(e)}
  if(!$('.v13-callout')){const e=document.createElement('div');e.className='v13-callout';e.innerHTML='<b>LEGENDARY HIT</b><span>COMBO SURGE</span>';battle.appendChild(e)}
  if(!$('.v13-treasure-burst')){const e=document.createElement('div');e.className='v13-treasure-burst';battle.appendChild(e)}
  if(!$('.v13-boss-rage')){const e=document.createElement('div');e.className='v13-boss-rage';battle.appendChild(e)}
  if(!$('.v13-cannon-trails')){const e=document.createElement('div');e.className='v13-cannon-trails';battle.appendChild(e)}
}
function callout(title,sub='COMBO SURGE'){
  const e=$('.v13-callout');if(!e)return;e.innerHTML=`<b>${title}</b><span>${sub}</span>`;e.classList.remove('on');void e.offsetWidth;e.classList.add('on');
}
function coinBurst(n=18){const e=$('.v13-treasure-burst');if(!e)return;e.innerHTML='';e.classList.add('on');for(let i=0;i<n;i++){const c=document.createElement('i');c.className='v13-coin';const a=Math.random()*Math.PI*2,d=90+Math.random()*230;c.style.setProperty('--x',`${Math.cos(a)*d}px`);c.style.setProperty('--y',`${Math.sin(a)*d}px`);c.style.setProperty('--d',`${.55+Math.random()*.55}s`);e.appendChild(c)}setTimeout(()=>{e.classList.remove('on');e.innerHTML=''},1200)}
function crit(x,y,text='CRITICAL!'){
  const r=canvas.getBoundingClientRect(),e=document.createElement('div');e.className='v13-critical-flare';e.textContent=text;e.style.left=`${Math.max(7,Math.min(93,(x-r.left)/r.width*100))}%`;e.style.top=`${Math.max(10,Math.min(88,(y-r.top)/r.height*100))}%`;battle.appendChild(e);setTimeout(()=>e.remove(),760)
}
function beam(x,y,color){const rail=$('.v13-cannon-trails');if(!rail)return;const r=canvas.getBoundingClientRect(),cx=(x-r.left)/r.width*r.width,cy=(y-r.top)/r.height*r.height,ox=r.width/2,oy=r.height;const angle=Math.atan2(cy-oy,cx-ox)*180/Math.PI+90,e=document.createElement('i');e.className='v13-beam';e.style.left='calc(50% - 2px)';e.style.setProperty('--a',`${angle}deg`);e.style.setProperty('--beam',color);rail.appendChild(e);setTimeout(()=>e.remove(),260)}
function kickSeat(i=0){const seats=$$('.seatgun'),s=seats[i%seats.length];if(!s)return;s.classList.remove('v13-fire');void s.offsetWidth;s.classList.add('v13-fire')}
function currentFever(){return Math.max(0,Math.min(100,parseInt(fever.textContent,10)||0))}
function updateFever(){V.fever=currentFever();const core=$('.v13-fever-core'),val=$('#v13Fever');if(val)val.textContent=`${V.fever}%`;if(core)core.classList.toggle('v13-hot',V.fever>=95);document.documentElement.dataset.v13Intensity=V.fever>=95||V.combo>=25?'legendary':'hunt'}
function parseBoss(){const m=(bossText.textContent||'').match(/([\d,]+)\s*\/\s*([\d,]+)/);if(!m){V.bossRatio=1;$('.v13-boss-rage')?.classList.remove('on');return}const cur=+m[1].replaceAll(',',''),max=+m[2].replaceAll(',','');if(max>0)V.bossRatio=cur/max;const rage=V.bossRatio<.34;if(rage!==V.rage){V.rage=rage;$('.v13-boss-rage')?.classList.toggle('on',rage);if(rage)callout('BOSS RAGE','FINAL PHASE')}}
function triggerMilestone(n){if(V.armed.has(n))return;V.armed.add(n);V.lastMilestone=n;
  if(n===10){callout('CHAIN x10','LIGHTNING BONUS');coinBurst(10);try{window.power?.('lightning')}catch{}}
  if(n===25){callout('COMBO x25','LEGENDARY HIT');coinBurst(24);try{window.power?.('bomb')}catch{};navigator.vibrate?.([18,18,28])}
  if(n===50){callout('COMBO x50','OCEAN OVERDRIVE');coinBurst(34);try{window.power?.('lightning');setTimeout(()=>window.power?.('nuke'),220)}catch{};navigator.vibrate?.([25,20,25,20,40])}
}
function updateCombo(){const n=Math.max(0,parseInt(combo.textContent,10)||0);if(n!==V.combo){V.lastCombo=V.combo;V.combo=n;combo.classList.remove('v13-pop');void combo.offsetWidth;combo.classList.add('v13-pop');if(n<5&&V.lastCombo>n)V.armed.clear();if(n>=10)triggerMilestone(10);if(n>=25)triggerMilestone(25);if(n>=50)triggerMilestone(50)}}
function observe(node,fn){new MutationObserver(fn).observe(node,{subtree:true,childList:true,characterData:true,attributes:true})}
observe(combo,updateCombo);observe(fever,updateFever);observe(bossText,parseBoss);
canvas.addEventListener('pointerdown',e=>{V.shotIndex++;const colors=['#ff5a37','#38a9ff','#53f27a','#bc58ff'];kickSeat(0);beam(e.clientX,e.clientY,colors[V.shotIndex%colors.length]);if(V.combo>=4&&Math.random()<Math.min(.18,.03+V.combo*.004))crit(e.clientX,e.clientY,V.combo>=25?'LEGENDARY!':'CRITICAL!')},{passive:true});
const feed=$('#liveFeed');if(feed)observe(feed,()=>{const first=feed.querySelector('.live-row');if(!first)return;const text=first.textContent||'';if(/BOSS/i.test(text)){coinBurst(28);callout('BOSS BREAK','TREASURE EXPLOSION')}else if(/ELITE|downed/i.test(text)&&Date.now()-V.lastBurst>1200){V.lastBurst=Date.now();coinBurst(9)}});
const game=$('#game');if(game)new MutationObserver(()=>{if(!game.classList.contains('on')){V.combo=0;V.armed.clear();$('.v13-boss-rage')?.classList.remove('on')}}).observe(game,{attributes:true,attributeFilter:['class']});
function installLobbyRenderGovernor(){
  if(window.__FSA_LOBBY_RENDER_GOVERNOR__)return;
  const nativeRaf=window.requestAnimationFrame.bind(window),nativeCaf=window.cancelAnimationFrame.bind(window),jobs=new Map(),denseNames=new Set(['drawAtmos','frame']);let seq=0;
  window.requestAnimationFrame=cb=>{
    if(!(game&&!game.classList.contains('on')&&denseNames.has(cb?.name)))return nativeRaf(cb);
    const id=-(++seq),run=t=>{jobs.delete(id);cb(t)},timer=setTimeout(()=>{if(!jobs.has(id))return;const raf=nativeRaf(run);jobs.set(id,{raf})},250);
    jobs.set(id,{timer});return id;
  };
  window.cancelAnimationFrame=id=>{
    if(id>=0){nativeCaf(id);return}
    const job=jobs.get(id);if(!job)return;if(job.timer)clearTimeout(job.timer);if(job.raf)nativeCaf(job.raf);jobs.delete(id);
  };
  document.documentElement.dataset.renderGovernor='v2';
  window.__FSA_LOBBY_RENDER_GOVERNOR__={version:'v2',idleDelayMs:250,scopedCallbacks:[...denseNames],status:()=>({active:!!game?.classList.contains('on'),pending:jobs.size})};
}
function loadDenseVisualStack(){
  for(const href of ['dense-mode-v14.css','dense-mode-v14-overlay.css','dense-graphics-v15.css']){
    if(document.querySelector(`link[href="${href}"]`))continue;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.appendChild(link);
  }
  for(const src of ['dense-mode-v14.js','dense-graphics-v15.js']){
    if(document.querySelector(`script[src="${src}"]`))continue;
    const script=document.createElement('script');script.src=src;script.async=false;document.body.appendChild(script);
  }
}
function loadTelemetryV1(){
  if(document.querySelector('script[src="telemetry-v1.js"]'))return;
  const script=document.createElement('script');script.src='telemetry-v1.js';script.async=false;script.dataset.optional='analytics';document.body.appendChild(script);
}
function loadBrandRegenerationV14(){
  if(!document.querySelector('link[href="brand-regeneration-v14.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='brand-regeneration-v14.css';document.head.appendChild(link)}
  if(!document.querySelector('script[src="brand-regeneration-v14.js"]')){const script=document.createElement('script');script.src='brand-regeneration-v14.js';script.async=false;document.body.appendChild(script)}
}
mount();updateCombo();updateFever();parseBoss();installLobbyRenderGovernor();loadDenseVisualStack();loadTelemetryV1();loadBrandRegenerationV14();
window.__FSA_SPECTACLE_V13__={version:'v13',brandRegeneration:'v14',denseGraphics:'v15',telemetry:'v1',renderGovernor:'v2',state:()=>({...V,armed:[...V.armed]}),callout,coinBurst};
window.__FSA_BRAND_REGEN__={version:'v14',identity:'Fish Shooter Arcade / Fish Shooter Alliance',status:'active'};
})();