(()=>{'use strict';
const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
const lowData=!!(conn&&(conn.saveData||/^(slow-)?2g$/.test(conn.effectiveType||'')));
const FISH_ATLAS='assets/fsa-fish-hd-atlas.webp';
const SLOT_ATLAS='assets/fsa-slots-hd-atlas.webp';
const REEF_BATTLE='assets/reef-run-hd-battle.webp';
let loaded=false,scheduled=false;

function indicator(text){
  let el=document.querySelector('.hd-v7-indicator');
  if(!el){el=document.createElement('div');el.className='hd-v7-indicator';document.body.appendChild(el)}
  el.textContent=text;
}

function sprite(card,url,index,cols,rows){
  if(!card||card.dataset.hdV7==='1')return;
  const layer=document.createElement('div');
  layer.className='hd-art-v7';
  const col=index%cols,row=Math.floor(index/cols);
  layer.style.backgroundImage=`url("${url}")`;
  layer.style.backgroundSize=`${cols*100}% ${rows*100}%`;
  layer.style.backgroundPosition=`${cols===1?0:(col/(cols-1))*100}% ${rows===1?0:(row/(rows-1))*100}%`;
  card.classList.add('hd-v7');
  card.insertBefore(layer,card.firstChild);
  card.dataset.hdV7='1';
  requestAnimationFrame(()=>layer.classList.add('ready'));
}

function applyCards(){
  const fish=[...document.querySelectorAll('#fishCards .v6-card')];
  const slots=[...document.querySelectorAll('#slotCards .v6-card')];
  fish.slice(0,15).forEach((card,i)=>sprite(card,FISH_ATLAS,i,5,3));
  slots.slice(0,20).forEach((card,i)=>sprite(card,SLOT_ATLAS,i,5,4));
}

function applyReef(){
  const table=document.querySelector('.v6table');
  if(!table)return;
  const head=document.querySelector('.v6head strong');
  const reef=!!(head&&/reef run/i.test(head.textContent||''));
  table.classList.toggle('hd-reef-v7',reef);
}

function apply(){
  if(lowData)return;
  applyCards();
  applyReef();
}

function schedule(){
  if(scheduled||lowData)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;apply()});
}

function preload(url){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.decoding='async';img.src=url})}

async function boot(){
  if(lowData){indicator('LITE ART · 2G / DATA SAVER');return}
  indicator('HD ART · LOADING');
  const results=await Promise.all([preload(FISH_ATLAS),preload(SLOT_ATLAS),preload(REEF_BATTLE)]);
  loaded=results.every(Boolean);
  indicator(loaded?'HD GENERATED ART · ON':'HD ART FALLBACK');
  apply();
  const mo=new MutationObserver(schedule);
  mo.observe(document.body,{childList:true,subtree:true,characterData:true});
  if(conn&&conn.addEventListener)conn.addEventListener('change',()=>location.reload(),{once:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.FSA_HD_ART_V7={lowData,fishAtlas:FISH_ATLAS,slotAtlas:SLOT_ATLAS,reefBattle:REEF_BATTLE,get loaded(){return loaded}};
})();
