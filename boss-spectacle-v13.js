(()=>{'use strict';
const root=document.documentElement;
root.dataset.spectacle='v14';
root.dataset.brandRegeneration='v14';

// Keep the useful high-energy boss feedback from the earlier spectacle pass.
const $=s=>document.querySelector(s);
const battle=$('.battle'),combo=$('#combo'),bossText=$('#bossText'),canvas=$('#battleCanvas');
if(battle&&!$('.v14-hit-flash')){const f=document.createElement('div');f.className='v14-hit-flash';battle.appendChild(f)}
if(combo)new MutationObserver(()=>{combo.classList.remove('v13-pop');void combo.offsetWidth;combo.classList.add('v13-pop')}).observe(combo,{subtree:true,childList:true,characterData:true});
if(bossText)new MutationObserver(()=>{const text=bossText.textContent||'';root.dataset.bossPhase=/FINAL|RAGE/i.test(text)?'rage':'hunt'}).observe(bossText,{subtree:true,childList:true,characterData:true});
if(canvas)canvas.addEventListener('pointerdown',e=>{navigator.vibrate?.(8);const flash=$('.v14-hit-flash');if(flash){flash.style.left=e.offsetX+'px';flash.style.top=e.offsetY+'px';flash.classList.remove('on');void flash.offsetWidth;flash.classList.add('on')}},{passive:true});

// Load the complete regenerated Fish Shooter Arcade / Fish Shooter Alliance shell.
if(!document.querySelector('script[src="brand-regeneration-v14.js"]')){
  const s=document.createElement('script');s.src='brand-regeneration-v14.js';s.async=false;document.body.appendChild(s);
}

// Preserve the dense gameplay and optional telemetry layers already used by F.S.A.
for(const href of ['dense-mode-v14.css','dense-mode-v14-overlay.css','dense-graphics-v15.css']){
  if(document.querySelector(`link[href="${href}"]`))continue;
  const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l);
}
for(const src of ['dense-mode-v14.js','dense-graphics-v15.js','telemetry-v1.js']){
  if(document.querySelector(`script[src="${src}"]`))continue;
  const s=document.createElement('script');s.src=src;s.async=false;document.body.appendChild(s);
}
window.__FSA_BRAND_REGEN__={version:'v14',identity:'Fish Shooter Arcade / Fish Shooter Alliance',status:'active'};
})();