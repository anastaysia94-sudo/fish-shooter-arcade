(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
document.body.classList.add('brand-v14');document.documentElement.dataset.fsaBrand='v14';
const app=$('.v8-app'),top=$('.v8-topart'),account=$('.v8-account'),nav=$('.v8-nav'),main=$('.v8-content');
if(!app||!nav||!main)return;
if(!$('.fsa-v14-workspace')){
  const ws=document.createElement('div');ws.className='fsa-v14-workspace';
  const left=document.createElement('aside');left.className='fsa-v14-left';
  const center=document.createElement('div');center.className='fsa-v14-center';
  const right=document.createElement('aside');right.className='fsa-v14-right';
  left.appendChild(nav);center.appendChild(main);ws.append(left,center,right);app.appendChild(ws);
  right.innerHTML=`
    <section class="v14-panel"><div class="v14-panel-head"><b>LIVE COMMUNITY</b><span>● 325 ONLINE</span></div><div class="v14-feed" id="v14Feed">
      <div class="v14-msg"><span class="v14-face">AQ</span><div><b>AquaQueen</b><small>Just hit a huge Golden Dragon combo. 🔥</small></div></div>
      <div class="v14-msg"><span class="v14-face">RH</span><div><b>ReefHunter</b><small>What cannon are you using on turtles?</small></div></div>
      <div class="v14-msg"><span class="v14-face">LS</span><div><b>LuckyShot</b><small>Boss wave incoming. Check the table radar.</small></div></div>
      <div class="v14-msg"><span class="v14-face">OM</span><div><b>OceanMaster</b><small>New strategy notes added to the Alliance hub.</small></div></div>
    </div><div class="v14-chatbox"><input id="v14Chat" maxlength="100" placeholder="Write a local message…"><button id="v14Send">➤</button></div></section>
    <section class="v14-panel"><div class="v14-panel-head"><b>GLOBAL LEADERBOARD</b><span>TODAY</span></div><div class="v14-rank"><div><b>1</b><span>DragonSlayer</span><em>12,458,300</em></div><div><b>2</b><span>OceanQueen</span><em>10,234,550</em></div><div><b>3</b><span>FishHunterX</span><em>8,992,110</em></div><div><b>4</b><span>AquaLegend</span><em>7,654,890</em></div><div><b>5</b><span>ReefMaster</span><em>6,221,430</em></div><div class="you"><b>#48</b><span>OceanHunterX</span><em id="v14Score">1,245,300</em></div></div></section>
    <section class="v14-panel"><div class="v14-panel-head"><b>QUICK TOOLS</b><span>F.S.A.</span></div><div class="v14-tools"><button id="v14Play">🎮 PLAY NOW</button><button id="v14Tables">🎯 TABLES</button><button id="v14Alliance">♛ ALLIANCE</button><button id="v14Analyze">🧠 EGM4000</button></div></section>
    <div class="v14-reference-note">F.S.A. regenerated around the premium neon-ocean / Fish Shooter Alliance visual system.</div>`;
  const alliance=document.createElement('section');alliance.className='v14-alliance';alliance.id='alliance';alliance.innerHTML=`<div><div class="eyebrow">FISH SHOOTER ALLIANCE</div><h2>PLAY TOGETHER. GROW TOGETHER.</h2><p>Community, crew progression, strategy sharing, events and owned-game telemetry now live inside the same F.S.A. identity instead of feeling like unrelated screens stapled together by a sleep-deprived octopus.</p></div><div class="v14-alliance-grid"><button data-a="crew">👥 Crew Hub</button><button data-a="events">⚡ Live Events</button><button data-a="strategy">🧠 Strategy Hub</button><button data-a="rewards">🎁 Rewards</button></div>`;main.insertBefore(alliance,main.querySelector('#slots'));
}
const navLabels=[['ALL GAMES','⌂ HOME'],['FISH GAMES','🎮 PLAY GAME'],['777 SLOTS','🎯 GAME TABLES'],['OCEAN WORLDS','♛ ALLIANCE'],['BOSS HUNT','☠ BOSS HUNT'],['MISSIONS','◎ MISSIONS']];
$$('.v8-nav button').forEach(btn=>{const txt=btn.textContent.toUpperCase();for(const [a,b] of navLabels)if(txt.includes(a)){btn.textContent=b;break}});
const play=()=>window.openGame?.(0);$('#v14Play')?.addEventListener('click',play);$('#v14Tables')?.addEventListener('click',()=>$('#fishgames')?.scrollIntoView({behavior:'smooth'}));$('#v14Alliance')?.addEventListener('click',()=>$('#alliance')?.scrollIntoView({behavior:'smooth'}));$('#v14Analyze')?.addEventListener('click',()=>{const msg=$('#battleMsg');if(msg){msg.textContent='EGM4000 companion analyzes owned F.S.A. session telemetry after play.';msg.classList.add('show')}else alert('EGM4000 companion: session analysis uses F.S.A. owned-game telemetry.');});
$('#v14Send')?.addEventListener('click',()=>{const input=$('#v14Chat'),feed=$('#v14Feed');const text=input?.value.trim();if(!text||!feed)return;const row=document.createElement('div');row.className='v14-msg';row.innerHTML='<span class="v14-face">YOU</span><div><b>OceanHunterX</b><small></small></div>';row.querySelector('small').textContent=text;feed.appendChild(row);input.value='';row.scrollIntoView({behavior:'smooth',block:'nearest'});});
$('#v14Chat')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('#v14Send')?.click()});
$$('[data-a]').forEach(btn=>btn.addEventListener('click',()=>{const label=btn.dataset.a;if(label==='events')$('#bosses')?.scrollIntoView({behavior:'smooth'});else if(label==='strategy')alert('Strategy Hub uses EGM4000 session analysis, replay and pattern tools.');else if(label==='crew')$('#v14Chat')?.focus();else alert('Rewards remain virtual/non-cash in this build.');}));
const refresh=()=>{const coins=$('#coins')?.textContent||'0';const score=Number(String(coins).replace(/[^0-9]/g,''))||0;const el=$('#v14Score');if(el)el.textContent=Math.max(1245300,Math.floor(score/10)).toLocaleString();};setInterval(refresh,1200);refresh();
const hero=$('.hero-copy h1');if(hero)hero.innerHTML='A SMARTER FISH SHOOTER.<br><span style="color:#56eaff">A BIGGER OCEAN.</span>';
const heroP=$('.hero-copy p');if(heroP)heroP.textContent='Play dense multi-seat fish tables, hunt bosses, build your cannon loadout, join the Fish Shooter Alliance and feed exact owned-game telemetry into EGM4000 for smarter post-session analysis.';
})();