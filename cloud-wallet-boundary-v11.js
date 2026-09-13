(()=>{'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>Math.floor(Number(n)||0).toLocaleString();
const cloud=()=>window.FSACloudSync||null;
const profile=()=>window.__FSA_GAME_TEST__?.getProfile?.()||null;
const signed=()=>!!cloud()?.isSignedIn?.();
const serverBalance=()=>Number(cloud()?.getAccount?.()?.balance);

function restoreServerWallet(){
  if(!signed())return;
  const balance=serverBalance();
  if(!Number.isFinite(balance))return;
  const p=profile();
  if(p)p.credits=balance;
  for(const id of ['coins','gcoins','slotCoins']){const e=$(id);if(e)e.textContent=fmt(balance)}
  const seat=document.querySelector('#youSeat .bal');if(seat)seat.textContent=fmt(balance);
}

function wrap(name,before=false){
  const original=window[name];
  if(typeof original!=='function'||original.__fsaCloudWalletBoundary)return;
  const wrapped=function(){
    if(before)restoreServerWallet();
    const result=original.apply(this,arguments);
    if(!before)queueMicrotask(restoreServerWallet);
    return result;
  };
  wrapped.__fsaCloudWalletBoundary=true;
  window[name]=wrapped;
}

function install(){
  // Local fish/slot gameplay may animate temporary credits. Signed-in account balance is
  // restored at session boundaries so local demo outcomes can never masquerade as persisted wallet state.
  wrap('openGame',true);
  wrap('openSlot',true);
  wrap('closeGame',false);
  wrap('closeSlot',false);
  addEventListener('focus',restoreServerWallet);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)restoreServerWallet()});
  restoreServerWallet();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FSACloudWalletBoundary={restore:restoreServerWallet};
})();
