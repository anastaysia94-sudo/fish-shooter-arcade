(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
const LD=!!(conn&&(conn.saveData||/^(slow-)?2g$/.test(conn.effectiveType||'')));
const DPR=Math.min(2,window.devicePixelRatio||1);

const G=[
 {name:'Reef Run',accent:'#35e7ff',event:'Treasure Current',boss:'Crowned Kraken',feature:'Golden Shoal',zone:'Atlantis Reef',density:1.25,bossDelay:34,palette:['#031c2d','#05536b','#00b6c9'],bossType:0},
 {name:'Dragon Depths',accent:'#ff6b38',event:'Dragon Fury',boss:'Abyss Dragon',feature:'Inferno Chain',zone:'Inferno Trench',density:1.05,bossDelay:28,palette:['#1c0910','#522010','#cb4c18'],bossType:1},
 {name:"Pirate's Plunder",accent:'#ffc456',event:'Gold Current',boss:'Dreadnought Shark',feature:'Chest Barrage',zone:'Corsair Graveyard',density:1.4,bossDelay:32,palette:['#081622','#3e2a10','#b88628'],bossType:2},
 {name:'Atlantis Rising',accent:'#55f0e3',event:'Temple Awakening',boss:'Atlas Guardian',feature:'Trident Pulse',zone:'Sunken Citadel',density:1.22,bossDelay:35,palette:['#032e3d','#085b61','#16a69d'],bossType:3},
 {name:'Ice Tide',accent:'#83dcff',event:'Frost Bite',boss:'Frost Leviathan',feature:'Deep Freeze',zone:'Glacier Rift',density:1.45,bossDelay:30,palette:['#061a31','#0b4c74','#6bcdf2'],bossType:4},
 {name:'Lava Reef',accent:'#ff5b27',event:'Volcano Erupt',boss:'Magma Maw',feature:'Magma Burst',zone:'Obsidian Reef',density:1.12,bossDelay:27,palette:['#220805','#5c1406','#ff4e12'],bossType:1},
 {name:'Storm Seas',accent:'#62c8ff',event:'Storm Surge',boss:'Tempest Ray',feature:'Lightning Chain',zone:'Thunder Shelf',density:1.48,bossDelay:33,palette:['#07133e','#06425b','#3ba8d8'],bossType:5},
 {name:'Jade Dragon',accent:'#65ff9d',event:'Jade Blessing',boss:'Jade Emperor',feature:'Emerald Focus',zone:'Emerald Temple',density:1.04,bossDelay:31,palette:['#03261d','#0b5137','#36b976'],bossType:1},
 {name:'Neon Ocean',accent:'#f55cff',event:'Neon Fever',boss:'Pulse Sovereign',feature:'Fever Overdrive',zone:'Pulse District',density:1.62,bossDelay:26,palette:['#130b3f','#32145a','#b12fc8'],bossType:6},
 {name:'Ancient Ruins',accent:'#e8c55e',event:'Relic Wake',boss:'Ruin Guardian',feature:'Artifact Beam',zone:'Lost Observatory',density:1.12,bossDelay:35,palette:['#1b1a0b','#304229','#b69031'],bossType:3},
 {name:'Mecha Marine',accent:'#4bdbff',event:'Mecha Override',boss:'Titan Sub',feature:'EMP Burst',zone:'Steel Abyss',density:1.16,bossDelay:29,palette:['#071923','#17323c','#2984a1'],bossType:7},
 {name:'Coral Chaos',accent:'#ff77dd',event:'Coral Bloom',boss:'Prism Ray',feature:'Color Burst',zone:'Prism Gardens',density:1.72,bossDelay:27,palette:['#240b28','#3e1b4d','#c2409f'],bossType:5},
 {name:"Kraken's Lair",accent:'#b85dff',event:'Kraken Rage',boss:'Prime Kraken',feature:'Tentacle Storm',zone:'Blackwater Lair',density:.98,bossDelay:23,palette:['#10061e','#261145','#6934a6'],bossType:0},
 {name:'Treasure Trials',accent:'#ffd04f',event:'Treasure Hunt',boss:'Vault Keeper',feature:'Vault Surge',zone:'Golden Vault',density:1.36,bossDelay:32,palette:['#171207','#46310c','#c69525'],bossType:8},
 {name:'Boss Rush',accent:'#ff3f52',event:'Multi-Boss Assault',boss:'Abyss King',feature:'Overdrive',zone:'Crown Abyss',density:.95,bossDelay:16,palette:['#1e0508','#4b0a12','#a91f2f'],bossType:9}
];

const R=[
 {name:'Bronze Reef',min:1,max:50,seats:3,density:.9,factor:.92,desc:'Entry table · broad schools · lighter boss pressure'},
 {name:'Silver Current',min:5,max:200,seats:4,density:1.08,factor:1.08,desc:'Four-seat table · dense schools · full feature cycle'},
 {name:'Gold Abyss',min:20,max:1000,seats:4,density:1.28,factor:1.24,desc:'High-action table · rapid formations · hard bosses'}
];

const T=[
 {name:'Blue Tang',mult:2,hp:8,r:24,speed:1.35,shape:0,colors:['#3de4ff','#116cbd','#082d64'],fx:null},
 {name:'Clown Fish',mult:4,hp:12,r:27,speed:1.2,shape:0,colors:['#ff8d28','#ff4b1f','#fff2b0'],fx:null},
 {name:'Puffer',mult:8,hp:20,r:32,speed:.9,shape:1,colors:['#ffd24f','#b77b18','#6c4310'],fx:'bomb'},
 {name:'Lionfish',mult:12,hp:29,r:39,speed:.86,shape:2,colors:['#ff8b61','#b93046','#4b1430'],fx:null},
 {name:'Sea Turtle',mult:18,hp:42,r:44,speed:.72,shape:3,colors:['#6ee0a7','#297f65','#17493d'],fx:null},
 {name:'Manta Ray',mult:25,hp:55,r:52,speed:1.05,shape:4,colors:['#72c4ff','#2964a4','#102d56'],fx:'chain'},
 {name:'Hammer Shark',mult:35,hp:75,r:58,speed:1.18,shape:5,colors:['#a8c7d9','#436b7f','#183443'],fx:null},
 {name:'Golden Koi',mult:50,hp:92,r:52,speed:1.0,shape:0,colors:['#ffe36d','#f28c18','#7e3905'],fx:'gold'},
 {name:'Prism Jelly',mult:60,hp:105,r:54,speed:.8,shape:6,colors:['#f384ff','#7c4dff','#32e3ff'],fx:'freeze'},
 {name:'Rocket Shrimp',mult:80,hp:130,r:56,speed:1.25,shape:7,colors:['#ff705e','#ffc052','#8c2a2a'],fx:'missile'},
 {name:'Laser Shrimp',mult:100,hp:155,r:58,speed:1.18,shape:7,colors:['#62efff','#3f7cff','#4732a8'],fx:'laser'},
 {name:'Chain Shark',mult:120,hp:185,r:67,speed:1.12,shape:5,colors:['#ff6a76','#802a45','#31182a'],fx:'chain'},
 {name:'Siren Sprite',mult:150,hp:220,r:62,speed:.9,shape:8,colors:['#ffb7eb','#9a5dff','#36e4de'],fx:'rapid'},
 {name:'Twin Dragon',mult:200,hp:320,r:76,speed:.78,shape:9,colors:['#ffd85a','#e95d28','#7c1616'],fx:'wild'}
];

let P={credits:12450,gems:320,pearls:25,energy:120,level:12,cannon:6};
try{P=Object.assign(P,JSON.parse(localStorage.getItem('fsa.arcade.v5')||'{}'))}catch(e){}

const S={
 game:0,room:1,run:null,fish:[],shots:[],fx:[],coins:[],labels:[],nets:[],rays:[],
 raf:0,last:0,spawnClock:0,schoolClock:0,aiClock:0,eventClock:0,
 pointer:{x:640,y:360},hold:0,auto:false,lock:false,lockedId:null,speciesMode:0,
 combo:0,fever:0,feverUntil:0,freezeUntil:0,rapidUntil:0,boss:null,bossIn:30,wave:1,waveTime:75,
 powers:{freeze:2,lightning:2,bomb:2,net:2},players:[],tele:[],shake:0,feature:0,
 schoolIndex:0,aim:[{x:640,y:360},{x:640,y:360},{x:640,y:360},{x:640,y:360}]
};

const fmt=n=>Math.max(0,Math.floor(n)).toLocaleString();
function save(){
 try{localStorage.setItem('fsa.arcade.v5',JSON.stringify(P))}catch(e){}
 ['wallet','pCredit','slotWallet'].forEach(id=>{const e=$('#'+id);if(e)e.textContent=fmt(P.credits)});
 const l=$('#level');if(l)l.textContent=P.level;
}
function emit(type,data={}){
 S.tele.push(Object.assign({schema:'fsa.telemetry.v5',time:new Date().toISOString(),game:G[S.game].name,room:R[S.room].name,type,source:'FSA-exact-owned',confidence:1},data));
 if(S.tele.length>7000)S.tele.shift();
}

function installStyles(){
 if($('#fsa5style'))return;
 const st=document.createElement('style');st.id='fsa5style';st.textContent=`
 .fsa5mark{position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:8;pointer-events:none;text-align:center}
 .fsa5mark .tier{display:inline-flex;gap:4px;align-items:center;padding:4px 9px;border:1px solid #f2c45e;border-radius:999px;background:#071019e8;color:#ffe293;font:900 8px system-ui;letter-spacing:.08em}
 .fsa5mark .pots{display:flex;gap:4px;justify-content:center;margin-top:3px}
 .fsa5mark .pots span{min-width:72px;padding:3px 6px;border:1px solid #48758b;border-radius:6px;background:#03121be8;color:#dff8ff;font:800 7px system-ui}
 .fsa5mark .pots b{color:#ffd561}
 .speciesBtn{font-size:8px!important;line-height:1.05}
 .speciesBtn small{display:block;font-size:6px;color:#91cfe0}
 .stage4:after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 -45px 80px #000a,inset 0 0 80px #0007}
 .premiumPreview{image-rendering:auto}
 .r4 .fishRef{height:54px;margin:-3px -3px 7px;border:1px solid #315f75;border-radius:9px;background:radial-gradient(circle at 65% 35%,#34d8ff33,transparent 34%),linear-gradient(140deg,#062334,#031019)}
 .feed .hot{color:#ffd760}
 @media(max-width:800px){.fsa5mark{top:4px}.fsa5mark .pots{display:none}}
 `;
 document.head.appendChild(st);
}

function ui(){
 const m=$('#fishModal');if(!m)return;
 m.className='modal premium-fish-modal';
 m.innerHTML=`<div class="shell"><div class="shellHead"><div><h3 id="fishTitle"></h3><div class="sub" id="fishSub"></div></div><button class="close" onclick="closeModal('fishModal')">Close</button></div>
 <div class="fsa4 ${LD?'low':''}">
  <div class="fsa4top">
   <div class="pbox"><div class="ava">⚓</div><div><b>OceanHunter</b><small>Lv. <span id="pLv">${P.level}</span> · F.S.A. table seat 1</small></div></div>
   <div class="res gold">🪙 <b id="pCredit">${fmt(P.credits)}</b><small>virtual credits</small></div>
   <div class="res blue">💎 <b>${P.gems}</b><small>gems</small></div>
   <div class="res purple">🔮 <b>${P.pearls}</b><small>pearls</small></div>
   <div class="res green">⚡ <b>${P.energy}/120</b><small>energy</small></div>
   <div class="actions"><button class="ib" id="intelBtn">☰</button><button class="ib" id="audioBtn">♫</button><button class="ib" id="tableBtn">⚙</button></div>
  </div>
  <div class="fsa4main">
   <aside class="side4 left" id="intel">
    <div class="panel4"><h4>Current Table</h4><div class="gameMeta"><div class="gameThumb"></div><div><b id="gRoom"></b><small id="rName"></small><small id="feature"></small></div></div><div class="split"><span>Wave <b id="wave">1/10</b></span><span id="wtime">01:15</span></div><div class="bar"><i id="wbar"></i></div></div>
    <div class="panel4"><h4>Live Missions</h4><div class="mission"><i>🎯</i><span>Capture targets</span><b id="m0">0/50</b></div><div class="mission"><i>👑</i><span>Feature / boss</span><b id="m1">0/3</b></div><div class="mission"><i>🔥</i><span>Combo chain</span><b id="m2">0/25</b></div></div>
    <div class="panel4"><h4>Ocean Radar</h4><div class="radar" id="radar"></div><div class="split"><span>Targets <b id="rcount">0</b></span><span>Elite <b id="ecount">0</b></span></div></div>
    <div class="panel4"><h4>Table Feed</h4><div class="feed" id="feed"><b>[System]</b> Four-seat cabinet synchronized.</div></div>
   </aside>
   <main class="stage4">
    <canvas id="pc" width="1280" height="720"></canvas>
    <div class="fsa5mark"><div class="tier">F.S.A. · PREMIUM TABLE ENGINE v5</div><div class="pots"><span>MINI <b id="potMini">240</b></span><span>MAJOR <b id="potMajor">1,800</b></span><span>GRAND <b id="potGrand">8,000</b></span></div></div>
    <div class="dataPill">${LD?'2G / DATA SAVER':'HD ADAPTIVE · PROJECTILES'}</div>
    <div class="banner4" id="banner"></div>
    <div class="target4" id="target"><b id="tname"></b><small id="tmult"></small><div class="bar"><i id="thp"></i></div></div>
   </main>
   <aside class="side4 right" id="tableSide">
    <div class="panel4 warn"><h4>Boss / Feature</h4><div class="bossTimer" id="btimer">00:30</div><div class="bossRow"><canvas class="bossMini" id="bossMini" width="104" height="90"></canvas><div><b id="bname"></b><small id="bstatus">Meter charging</small><div class="bar"><i id="bbar"></i></div></div></div></div>
    <div class="panel4"><h4>Combo / Fever</h4><div class="combo4">×<span id="combo">0</span><small id="flabel">Consecutive impacts charge Fever</small></div><div class="fever"><i id="fbar"></i></div></div>
    <div class="panel4"><h4>Table Players</h4><div id="players"></div></div>
    <div class="panel4"><h4>Cannon Upgrade</h4><div class="up4"><div><b>Lv. <span id="clevel">${P.cannon}</span></b><small style="display:block">barrel power</small></div><button id="upgrade">UPGRADE<br><span id="ucost"></span></button></div></div>
    <div class="panel4"><h4>Game Feature</h4><div class="feed" id="rules"></div></div>
   </aside>
  </div>
  <div class="fsa4bottom">
   <div class="ugrp"><button class="util">🏆<small>Ranks</small></button><button class="util">🎒<small>Inventory</small></button><button class="util">🐟<small>Collection</small></button></div>
   <div class="cockpit">
    <button class="round4" id="auto">AUTO</button><button class="round4" id="minus">−</button>
    <div class="cannon4"><strong id="shot">20</strong><small>VIRTUAL CREDITS / SHOT</small><button class="fire4" id="fire">FIRE · HOLD</button></div>
    <button class="round4" id="plus">+</button><button class="round4" id="lock">LOCK</button>
   </div>
   <div class="ugrp" style="justify-content:flex-end"><button class="power ready" data-pow="freeze">❄<span id="freezeN">2</span></button><button class="power ready" data-pow="lightning">⚡<span id="lightningN">2</span></button><button class="power ready" data-pow="bomb">🚀<span id="bombN">2</span></button><button class="power ready" data-pow="net">◎<span id="netN">2</span></button><button class="power speciesBtn" id="species">TYPE<small>ALL</small></button></div>
  </div>
  <div class="room4" id="rooms"><div class="roomWrap"><div class="roomTitle"><h2 id="rg"></h2><p>Choose a four-seat fish-table room. Shot range changes pace; every balance here is virtual/non-cash.</p></div><div class="roomGrid4" id="rgrid"></div><div class="lowNote">Original F.S.A. art + mechanics · inspired by the broader arcade fish-table genre · no copied game assets</div></div></div>
 </div></div>`;

 $('#intelBtn').onclick=()=>$('#intel').classList.toggle('open');
 $('#tableBtn').onclick=()=>$('#tableSide').classList.toggle('open');
 $('#audioBtn').onclick=()=>banner('Audio layer queued for production mix');
 $('#auto').onclick=()=>{S.auto=!S.auto;$('#auto').classList.toggle('active',S.auto);emit('auto_fire',{enabled:S.auto})};
 $('#lock').onclick=()=>{S.lock=!S.lock;S.lockedId=null;$('#lock').classList.toggle('active',S.lock);emit('lock_on',{enabled:S.lock})};
 $('#minus').onclick=()=>shotStep(-1);$('#plus').onclick=()=>shotStep(1);$('#upgrade').onclick=upgrade;
 $('#species').onclick=()=>{S.speciesMode=(S.speciesMode+1)%4;const labels=['ALL','SMALL','ELITE','SPECIAL'];$('#species small').textContent=labels[S.speciesMode];emit('species_filter',{mode:labels[S.speciesMode]})};
 $$('[data-pow]').forEach(b=>b.onclick=()=>power(b.dataset.pow));

 const c=$('#pc');
 const pt=e=>{const r=c.getBoundingClientRect();S.pointer.x=(e.clientX-r.left)*1280/r.width;S.pointer.y=(e.clientY-r.top)*720/r.height};
 c.onpointermove=pt;
 c.onpointerdown=e=>{pt(e);startHold()};
 ['pointerup','pointercancel','pointerleave'].forEach(n=>c.addEventListener(n,stopHold));
 $('#fire').onpointerdown=startHold;
 ['pointerup','pointercancel','pointerleave'].forEach(n=>$('#fire').addEventListener(n,stopHold));
}

function startHold(){shoot(S.pointer.x,S.pointer.y,0);clearInterval(S.hold);S.hold=setInterval(()=>shoot(S.pointer.x,S.pointer.y,0),Date.now()<S.rapidUntil?72:(LD?210:128))}
function stopHold(){clearInterval(S.hold);S.hold=0}

window.openFish=i=>{
 S.game=i;const g=G[i];const m=$('#fishModal');if(!m)return;
 $('#fishTitle').textContent=g.name;$('#fishSub').textContent=g.zone+' · '+g.feature;
 m.classList.add('on');$('#rg').textContent=g.name;$('#rooms').style.display='grid';
 $('#rgrid').innerHTML=R.map((r,j)=>`<article class="r4" data-r="${j}"><div class="fishRef"></div><div class="eyebrow">${j===0?'ENTRY':j===1?'TEAM':'LEGEND'}</div><h3>${r.name}</h3><div class="shotRange">${r.min}–${r.max} / shot</div><p>${r.desc}</p><div class="tags4"><span>${r.seats} seats</span><span>${Math.round(r.density*100)}% density</span><span>${Math.round(r.factor*100)}% score factor</span></div></article>`).join('');
 $$('[data-r]').forEach(x=>x.onclick=()=>start(+x.dataset.r));
 cancelAnimationFrame(S.raf);stopHold();
};

function start(roomIndex){
 S.room=roomIndex;const g=G[S.game],r=R[roomIndex];
 $('#rooms').style.display='none';
 S.run={shot:roomIndex===0?5:roomIndex===1?20:100,shots:0,hits:0,kills:0,score:0};
 S.fish=[];S.shots=[];S.fx=[];S.coins=[];S.labels=[];S.nets=[];S.rays=[];
 S.players=[['OceanHunter',0,'#ffd34e'],['AquaKing',Math.floor(Math.random()*1200),'#58c8ff'],['DeepBlue',Math.floor(Math.random()*1000),'#a76eff'],['TitanFish',Math.floor(Math.random()*850),'#42eda0']];
 S.combo=0;S.fever=0;S.feverUntil=0;S.freezeUntil=0;S.rapidUntil=0;S.boss=null;S.bossIn=g.bossDelay;S.wave=1;S.waveTime=75;
 S.powers={freeze:2,lightning:2,bomb:2,net:2};S.m=[0,0,0];S.feature=0;S.schoolIndex=0;S.speciesMode=0;S.lockedId=null;
 $('#gRoom').textContent=g.zone;$('#rName').textContent=r.name;$('#feature').textContent=g.feature;$('#bname').textContent=g.boss;
 $('#rules').innerHTML=`<b style="color:${g.accent}">${g.feature}</b><br>${g.event}<br><span class="hot">Projectile travel · moving schools · visible target values · multi-seat cannon fire · special weapon targets</span>`;
 $('#ucost').textContent=fmt(P.cannon*12000);
 bossThumb();
 for(let i=0;i<(LD?2:4);i++)spawnSchool(i%4);
 abilities();players();hud();banner(r.name+' · SCHOOL WAVE OPEN');
 emit('session_start',{engine:'v5',lowData:LD,shot:S.run.shot});
 S.last=performance.now();S.spawnClock=0;S.schoolClock=0;S.aiClock=0;S.eventClock=0;
 S.raf=requestAnimationFrame(loop);
}

function shotStep(d){
 if(!S.run)return;const r=R[S.room],vals=[1,2,5,10,20,50,100,200,500,1000];
 let i=vals.findIndex(v=>v>=S.run.shot);if(i<0)i=vals.length-1;i=Math.max(0,Math.min(vals.length-1,i+d));
 S.run.shot=Math.max(r.min,Math.min(r.max,vals[i]));$('#shot').textContent=S.run.shot;emit('cannon_changed',{shot:S.run.shot});
}
function upgrade(){const c=P.cannon*12000;if(P.credits<c)return banner('More virtual credits required');P.credits-=c;P.cannon=Math.min(20,P.cannon+1);save();$('#clevel').textContent=P.cannon;$('#ucost').textContent=fmt(P.cannon*12000);banner('BARREL POWER Lv. '+P.cannon)}

function pickType(preferSpecial=false){
 if(preferSpecial&&Math.random()<.65)return T[8+Math.floor(Math.random()*(T.length-8))];
 const roll=Math.random();
 if(roll<.52)return T[Math.floor(Math.random()*5)];
 if(roll<.86)return T[5+Math.floor(Math.random()*4)];
 return T[9+Math.floor(Math.random()*(T.length-9))];
}

function spawnOne(t,opts={}){
 const g=G[S.game],r=R[S.room],dir=opts.dir??(Math.random()<.5?-1:1);
 const hp=t.hp*(1+S.room*.32)*(1+S.wave*.045);
 const f={id:Math.random().toString(36).slice(2),name:t.name,mult:Math.round(t.mult*(1+S.room*.16)),hp,max:hp,r:t.r,
  x:opts.x??(dir<0?1360:-80),y:opts.y??(70+Math.random()*560),vx:dir*(58+Math.random()*62)*t.speed*g.density,vy:opts.vy??((Math.random()-.5)*12),
  type:T.indexOf(t),shape:t.shape,colors:t.colors,kind:t.fx||'normal',phase:Math.random()*6.28,path:opts.path||'sine',pathAmp:opts.amp??(18+Math.random()*24),pathRate:.7+Math.random()*.9,
  boss:false,school:opts.school??0,index:opts.index??0,spawnY:opts.y??360};
 S.fish.push(f);emit('target_spawned',{targetId:f.id,species:f.name,multiplier:f.mult,effect:f.kind,trueHp:+hp.toFixed(2)});
 return f;
}

function spawnSchool(pattern=0){
 if(!S.run)return;const count=LD?5:7+Math.floor(Math.random()*7),dir=Math.random()<.5?-1:1,y0=110+Math.random()*430,school=++S.schoolIndex;
 const names=['RIBBON SCHOOL','WEDGE SCHOOL','RING SCHOOL','CROSS CURRENT','ELITE PROCESSION'];
 const p=pattern%5;
 for(let i=0;i<count;i++){
  const special=p===4&&i===Math.floor(count/2);
  const t=pickType(special);
  let y=y0,x=dir<0?1360+i*45:-80-i*45,path='sine',amp=18+Math.random()*20;
  if(p===0)y=y0+Math.sin(i*.8)*55;
  if(p===1)y=y0+(i-Math.floor(count/2))*22;
  if(p===2){y=y0+Math.sin(i/count*Math.PI*2)*100;x=(dir<0?1360:-80)-dir*Math.cos(i/count*Math.PI*2)*80;path='orbit'}
  if(p===3)y=100+(i%2)*400+(i*31)%120;
  if(p===4){y=y0+Math.sin(i*.45)*38;path='straight';}
  spawnOne(t,{dir,x,y,path,amp,school,index:i});
 }
 banner(names[p]);
 emit('school_spawned',{pattern:names[p],count,school});
}

function spawnBoss(){
 const g=G[S.game],hp=(1000+S.wave*180+S.room*520)*(P.cannon/6*.65+1);
 const f={id:'boss-'+Math.random().toString(36).slice(2),name:g.boss,mult:220+S.room*120+S.wave*12,hp,max:hp,r:118,x:1410,y:260,vx:-30,vy:0,
  type:99,shape:g.bossType,colors:[g.accent,'#6b1a32','#ffd25b'],kind:'boss',phase:0,path:'boss',pathAmp:90,pathRate:.55,boss:true,school:0,index:0,spawnY:280,shield:1};
 S.fish.push(f);S.boss=f;S.shake=6;banner('BOSS ENTERS · '+g.boss);emit('boss_spawned',{targetId:f.id,multiplier:f.mult,hp:+hp.toFixed(2)});
}

function targetValid(f){
 if(!f)return false;
 if(S.speciesMode===1)return f.mult<25;
 if(S.speciesMode===2)return f.mult>=50||f.boss;
 if(S.speciesMode===3)return f.kind!=='normal'||f.boss;
 return true;
}
function chooseTarget(x,y){
 let list=S.fish.filter(targetValid);if(!list.length)list=S.fish;
 if(!list.length)return null;
 if(S.lock){
  const locked=list.find(f=>f.id===S.lockedId);
  if(locked)return locked;
  list.sort((a,b)=>(b.boss-a.boss)||(b.mult-a.mult));
  S.lockedId=list[0].id;return list[0];
 }
 let hit=null,d=1e9;for(const f of list){const q=Math.hypot(f.x-x,f.y-y);if(q<f.r*1.45&&q<d){d=q;hit=f}}return hit;
}

const stations=[{x:640,y:708},{x:26,y:676},{x:1254,y:676},{x:640,y:18}];
function shoot(x,y,seat=0){
 if(!S.run)return;
 const player=!seat;
 if(player){if(P.credits<S.run.shot)return banner('Virtual credits depleted');P.credits-=S.run.shot;S.run.shots++;save();}
 const target=seat?aiTarget():chooseTarget(x,y);
 if(S.lock&&target&&!seat){x=target.x;y=target.y;}
 const o=stations[seat]||stations[0],dx=x-o.x,dy=y-o.y,len=Math.max(1,Math.hypot(dx,dy)),speed=seat?900:1050;
 const shotValue=seat?Math.max(1,S.run.shot*(.65+seat*.08)):S.run.shot;
 S.aim[seat]={x,y};
 S.shots.push({x:o.x,y:o.y,vx:dx/len*speed,vy:dy/len*speed,r:player?6:5,seat,value:shotValue,targetId:S.lock&&target?target.id:null,t:0,max:1.8,color:S.players[seat]?.[2]||'#ffd34e'});
 S.fx.push({kind:'muzzle',x:o.x,y:o.y,t:0,c:S.players[seat]?.[2]||'#ffd34e'});
 emit('shot_fired',{seat:seat+1,shotValue:+shotValue.toFixed(2),aimX:+x.toFixed(1),aimY:+y.toFixed(1),lock:!!S.lock});
}

function aiTarget(){
 const list=S.fish.filter(f=>!f.boss||Math.random()<.6);
 return list.length?list[Math.floor(Math.random()*list.length)]:null;
}

function impact(shot,f){
 const dmg=shot.value*(.78+Math.random()*.36)*(P.cannon/6)*(Date.now()<S.feverUntil?1.25:1);
 if(shot.seat===0){S.run.hits++;S.combo=Math.min(99,S.combo+1);S.fever=Math.min(100,S.fever+1.5);S.m[2]=Math.max(S.m[2],S.combo);}
 S.nets.push({x:f.x,y:f.y,r:10,max:22+Math.min(34,shot.value*.15),t:0,c:shot.color});
 damage(f,dmg,shot.seat,shot.value);
}

function damage(f,dmg,seat,shotValue){
 if(!f||f.hp<=0)return;
 f.hp-=dmg;S.fx.push({kind:'spark',x:f.x,y:f.y,t:0,c:S.players[seat]?.[2]||'#ffd34e'});
 emit('target_hit',{targetId:f.id,damage:+dmg.toFixed(2),seat:seat+1,multiplier:f.mult});
 if(seat===0){$('#target').classList.add('on');$('#tname').textContent=f.name;$('#tmult').textContent='×'+f.mult+' · '+f.kind.toUpperCase();$('#thp').style.width=Math.max(0,f.hp/f.max*100)+'%';}
 if(f.hp<=0)capture(f,seat,shotValue);
}

function capture(f,seat,shotValue){
 const reward=Math.round((shotValue||S.run.shot)*f.mult*R[S.room].factor*(Date.now()<S.feverUntil?2:1));
 if(S.players[seat])S.players[seat][1]+=reward;
 if(seat===0){
  P.credits+=reward;S.run.kills++;S.run.score+=reward;S.m[0]++;save();
  S.labels.push({x:f.x,y:f.y,t:0,v:'+'+fmt(reward),big:f.mult>=80});
  for(let i=0;i<Math.min(LD?6:18,4+Math.floor(Math.log10(reward+10)*4));i++)S.coins.push({x:f.x,y:f.y,vx:(Math.random()-.5)*230,vy:-80-Math.random()*180,t:0});
  grantSpecial(f);
 }
 if(f.boss){
  banner((S.players[seat]?.[0]||'Seat '+(seat+1))+' CAPTURED '+f.name+' · ×'+f.mult);
  S.boss=null;S.bossIn=G[S.game].bossDelay;S.m[1]++;S.shake=14;S.feature=Math.min(100,S.feature+30);
  emit('boss_destroyed',{seat:seat+1,reward,multiplier:f.mult});
 }
 S.fish=S.fish.filter(x=>x!==f);players();emit('target_destroyed',{targetId:f.id,seat:seat+1,reward,multiplier:f.mult,effect:f.kind});
}

function grantSpecial(f){
 if(f.kind==='normal')return;
 S.m[1]++;
 if(f.kind==='gold'){S.feature=Math.min(100,S.feature+18);banner('GOLDEN CURRENT · FEATURE METER +18')}
 if(f.kind==='freeze'){S.powers.freeze=Math.min(9,S.powers.freeze+1);banner('FREEZE CHARGE ACQUIRED')}
 if(f.kind==='chain'){S.powers.lightning=Math.min(9,S.powers.lightning+1);banner('CHAIN CHARGE ACQUIRED')}
 if(f.kind==='missile'){S.powers.bomb=Math.min(9,S.powers.bomb+1);banner('MISSILE CHARGE ACQUIRED')}
 if(f.kind==='laser'){laserSweep();banner('PRISM LASER SWEEP')}
 if(f.kind==='rapid'){S.rapidUntil=Date.now()+6500;banner('RAPID CANNON · 6.5 SEC')}
 if(f.kind==='bomb'){areaBlast(f.x,f.y,180,S.run.shot*2.2,0)}
 if(f.kind==='wild'){S.feature=Math.min(100,S.feature+25);banner('TWIN DRAGON · FEATURE +25')}
 abilities();
}

function laserSweep(){
 if(!S.run)return;const o=stations[0],dx=S.pointer.x-o.x,dy=S.pointer.y-o.y,len=Math.max(1,Math.hypot(dx,dy)),ux=dx/len,uy=dy/len;
 S.rays.push({x:o.x,y:o.y,ux,uy,t:0,c:'#8bf7ff'});
 S.fish.slice().forEach(f=>{const px=f.x-o.x,py=f.y-o.y,along=px*ux+py*uy,perp=Math.abs(px*uy-py*ux);if(along>0&&perp<f.r+30)damage(f,S.run.shot*3.2,0,S.run.shot)});
}
function areaBlast(x,y,r,dmg,seat=0){S.fx.push({kind:'blast',x,y,t:0,c:'#ffb342'});S.fish.slice().forEach(f=>{if(Math.hypot(f.x-x,f.y-y)<r+f.r)damage(f,dmg,seat,S.run.shot)});S.shake=Math.max(S.shake,6)}

function power(p){
 if(!S.run||!S.powers[p])return;S.powers[p]--;abilities();emit('power_used',{power:p});
 if(p==='freeze'){S.freezeUntil=Date.now()+4500;banner('DEEP FREEZE · CURRENT SLOWED')}
 if(p==='net'){S.fish.filter(targetValid).slice(0,8).forEach(f=>{S.nets.push({x:f.x,y:f.y,r:8,max:f.r*1.3,t:0,c:'#ffd45d'});damage(f,S.run.shot*1.25,0,S.run.shot)});banner('CAPTURE NET VOLLEY')}
 if(p==='lightning'){const arr=S.fish.filter(targetValid).sort((a,b)=>b.mult-a.mult).slice(0,8);arr.forEach((f,i)=>{damage(f,S.run.shot*(2.4-i*.08),0,S.run.shot);if(i)S.rays.push({x:arr[i-1].x,y:arr[i-1].y,tx:f.x,ty:f.y,t:0,c:'#8fe8ff',chain:true})});banner('CHAIN LIGHTNING')}
 if(p==='bomb'){const t=chooseTarget(S.pointer.x,S.pointer.y)||S.fish[0];if(t){areaBlast(t.x,t.y,240,S.run.shot*3.4,0);banner('MISSILE IMPACT')}}
}
function abilities(){Object.keys(S.powers).forEach(p=>{const n=$('#'+p+'N'),b=$('[data-pow="'+p+'"]');if(n)n.textContent=S.powers[p];if(b)b.classList.toggle('empty',!S.powers[p])})}
function players(){const el=$('#players');if(el)el.innerHTML=S.players.map((p,i)=>`<div class="prow ${i===0?'me':''}"><span class="seat4" style="background:${p[2]}">${i+1}</span><span>${p[0]}</span><b>${fmt(p[1])}</b></div>`).join('')}

function banner(t){const e=$('#banner');if(!e)return;e.textContent=t;e.classList.add('on');clearTimeout(banner.x);banner.x=setTimeout(()=>e.classList.remove('on'),1700);const f=$('#feed');if(f)f.innerHTML='<b>[System]</b> '+t+'<br>'+f.innerHTML.slice(0,420)}

function hud(){
 if(!S.run)return;const g=G[S.game];
 $('#pCredit').textContent=fmt(P.credits);$('#wave').textContent=S.wave+'/10';$('#wtime').textContent='00:'+String(Math.max(0,Math.ceil(S.waveTime%60))).padStart(2,'0');$('#wbar').style.width=Math.min(100,(1-S.waveTime/75)*100)+'%';
 $('#combo').textContent=S.combo;$('#fbar').style.width=S.fever+'%';$('#flabel').textContent=Date.now()<S.feverUntil?'FEVER ACTIVE · REWARD ×2':'Consecutive impacts charge Fever';
 $('#rcount').textContent=S.fish.length;$('#ecount').textContent=S.fish.filter(f=>f.mult>=50).length;
 $('#btimer').textContent=S.boss?'LIVE':'00:'+String(Math.max(0,Math.ceil(S.bossIn))).padStart(2,'0');
 $('#bstatus').textContent=S.boss?Math.ceil(S.boss.hp)+' HP · ×'+S.boss.mult:'Meter charging · '+Math.round(S.feature)+'% feature';
 $('#bbar').style.width=(S.boss?Math.max(0,S.boss.hp/S.boss.max*100):Math.max(Math.min(100,S.feature),(g.bossDelay-S.bossIn)/g.bossDelay*100))+'%';
 $('#m0').textContent=Math.min(50,S.m[0])+'/50';$('#m1').textContent=Math.min(3,S.m[1])+'/3';$('#m2').textContent=Math.min(25,S.m[2])+'/25';
 $('#potMini').textContent=fmt(240+S.run.score*.015);$('#potMajor').textContent=fmt(1800+S.run.score*.04);$('#potGrand').textContent=fmt(8000+S.run.score*.08);
 radar();
}

function radar(){
 const r=$('#radar');if(!r)return;r.querySelectorAll('.rdot').forEach(x=>x.remove());
 S.fish.slice(0,LD?10:24).forEach(f=>{const d=document.createElement('i');d.className='rdot';d.style.left=(8+84*Math.max(0,Math.min(1280,f.x))/1280)+'%';d.style.top=(8+84*Math.max(0,Math.min(720,f.y))/720)+'%';d.style.background=f.boss?'#ffd22e':f.mult>=80?'#ff4d56':f.kind!=='normal'?'#a96dff':'#3fe7ff';r.appendChild(d)});
}

function grad(ctx,c1,c2,c3,r){
 const g=ctx.createLinearGradient(-r,-r*.7,r,r*.7);g.addColorStop(0,c3||c1);g.addColorStop(.48,c1);g.addColorStop(1,c2);return g;
}
function eye(ctx,x,y,r){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#061018';ctx.beginPath();ctx.arc(x+r*.2,y,r*.48,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+r*.4,y-r*.25,r*.16,0,Math.PI*2);ctx.fill()}

function fishArt(ctx,f){
 const r=f.r,c=f.colors,ph=f.phase;ctx.save();
 ctx.shadowBlur=LD?0:12;ctx.shadowColor=c[0];ctx.lineJoin='round';ctx.lineCap='round';
 if(f.shape===1){
  ctx.fillStyle=grad(ctx,c[0],c[1],c[2],r);ctx.beginPath();ctx.arc(0,0,r*.82,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=c[2];ctx.lineWidth=2;for(let a=0;a<Math.PI*2;a+=.45){ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.72,Math.sin(a)*r*.72);ctx.lineTo(Math.cos(a)*r*1.02,Math.sin(a)*r*1.02);ctx.stroke()}eye(ctx,r*.36,-r*.18,r*.12);
 } else if(f.shape===3){
  ctx.fillStyle=grad(ctx,c[0],c[1],c[2],r);ctx.beginPath();ctx.ellipse(-r*.05,0,r*.78,r*.55,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=c[2];ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(-r*.05,0,r*.5,r*.36,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=c[0];for(const [x,y,a] of [[-.5,-.55,-.6],[-.5,.55,.6],[.25,-.55,.45],[.25,.55,-.45]]){ctx.save();ctx.translate(r*x,r*y);ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,0,r*.32,r*.13,0,0,Math.PI*2);ctx.fill();ctx.restore()}
  ctx.beginPath();ctx.arc(r*.72,-r*.05,r*.22,0,Math.PI*2);ctx.fill();eye(ctx,r*.82,-r*.1,r*.07);
 } else if(f.shape===4){
  ctx.fillStyle=grad(ctx,c[0],c[1],c[2],r);ctx.beginPath();ctx.moveTo(r*1.2,0);ctx.quadraticCurveTo(0,-r*.95,-r*1.2,0);ctx.quadraticCurveTo(0,r*.95,r*1.2,0);ctx.fill();
  ctx.strokeStyle=c[0];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-r*.95,0);ctx.quadraticCurveTo(-r*1.65,Math.sin(ph)*r*.2,-r*1.9,r*.15);ctx.stroke();eye(ctx,r*.45,-r*.15,r*.08);
 } else if(f.shape===5){
  ctx.fillStyle=grad(ctx,c[0],c[1],c[2],r);ctx.beginPath();ctx.moveTo(r*1.22,0);ctx.quadraticCurveTo(r*.3,-r*.58,-r*.85,-r*.38);ctx.lineTo(-r*1.38,-r*.72);ctx.lineTo(-r*1.15,0);ctx.lineTo(-r*1.38,r*.72);ctx.lineTo(-r*.85,r*.38);ctx.quadraticCurveTo(r*.3,r*.58,r*1.22,0);ctx.fill();
  ctx.beginPath();ctx.moveTo(-r*.05,-r*.38);ctx.lineTo(-r*.35,-r*.95);ctx.lineTo(r*.35,-r*.42);ctx.fill();eye(ctx,r*.62,-r*.15,r*.08);
 } else if(f.shape===6){
  ctx.fillStyle=grad(ctx,c[0],c[1],c[2],r);ctx.beginPath();ctx.arc(0,-r*.05,r*.7,Math.PI,0);ctx.quadraticCurveTo(r*.7,r*.45,0,r*.55);ctx.quadraticCurveTo(-r*.7,r*.45,-r*.7,-r*.05);ctx.fill();
  ctx.strokeStyle=c[0];ctx.lineWidth=3;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*.22,r*.38);ctx.quadraticCurveTo(i*r*.3+Math.sin(ph+i)*8,r*.85,i*r*.14,r*1.2);ctx.stroke()}
  eye(ctx,r*.2,0,r*.07);eye(ctx,-r*.2,0,r*.07);
 } else if(f.shape===7){
  ctx.strokeStyle=grad(ctx,c[0],c[1],c[2],r);ctx.lineWidth=r*.34;ctx.beginPath();for(let i=0;i<7;i++){const xx=-r*.95+i*r*.28,yy=Math.sin(i*.72+ph)*r*.18;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.stroke();
  ctx.fillStyle=c[0];ctx.beginPath();ctx.moveTo(r*1.15,0);ctx.lineTo(r*.55,-r*.42);ctx.lineTo(r*.6,r*.42);ctx.fill();eye(ctx,r*.55,-r*.15,r*.08);
  ctx.strokeStyle=c[2];ctx.lineWidth=2;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(-r*.15+i*r*.14,r*.05);ctx.lineTo(-r*.35+i*r*.14,r*.55);ctx.stroke()}
 } else if(f.shape===8){
  ctx.fillStyle=grad(ctx,c[0],c[1],c[2],r);ctx.beginPath();ctx.ellipse(0,0,r*.68,r*.4,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.75;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(-r*.2-i*r*.24,Math.sin(ph+i)*r*.14,r*.35,r*.12,-.3,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;eye(ctx,r*.38,-r*.12,r*.08);
 } else if(f.shape===9){
  ctx.strokeStyle=grad(ctx,c[0],c[1],c[2],r);ctx.lineWidth=r*.3;for(const off of [-.18,.18]){ctx.beginPath();for(let i=0;i<8;i++){const xx=-r+i*r*.3,yy=(off+Math.sin(ph+i*.7)*.28)*r;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.stroke()}
  ctx.fillStyle=c[0];ctx.beginPath();ctx.moveTo(r*1.35,-r*.15);ctx.lineTo(r*.65,-r*.55);ctx.lineTo(r*.65,r*.18);ctx.fill();ctx.beginPath();ctx.moveTo(r*1.35,r*.15);ctx.lineTo(r*.65,-r*.18);ctx.lineTo(r*.65,r*.55);ctx.fill();
 } else if(f.shape===2){
  ctx.fillStyle=grad(ctx,c[0],c[1],c[2],r);ctx.beginPath();ctx.ellipse(0,0,r,r*.52,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=c[0];ctx.lineWidth=3;for(let i=-4;i<=4;i++){ctx.beginPath();ctx.moveTo(i*r*.18,-r*.35);ctx.lineTo(i*r*.25,-r*.95);ctx.stroke()}eye(ctx,r*.55,-r*.13,r*.1);
 } else {
  ctx.fillStyle=grad(ctx,c[0],c[1],c[2],r);ctx.beginPath();ctx.ellipse(0,0,r*1.02,r*.55,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(-r*.88,0);ctx.lineTo(-r*1.48,-r*.52);ctx.lineTo(-r*1.37,r*.52);ctx.closePath();ctx.fill();
  ctx.globalAlpha=.85;ctx.beginPath();ctx.moveTo(-r*.1,-r*.42);ctx.lineTo(r*.12,-r*.82);ctx.lineTo(r*.4,-r*.38);ctx.fill();ctx.globalAlpha=1;
  if(f.name==='Clown Fish'){ctx.strokeStyle='#fff2c5';ctx.lineWidth=r*.13;for(const xx of [-.35,.12,.52]){ctx.beginPath();ctx.moveTo(xx*r,-r*.42);ctx.lineTo((xx+.1)*r,r*.42);ctx.stroke()}}
  if(f.name==='Golden Koi'){ctx.strokeStyle='#fff2b0';ctx.lineWidth=2;for(let i=-2;i<3;i++){ctx.beginPath();ctx.arc(i*r*.24,0,r*.22,-1.2,1.2);ctx.stroke()}}
  eye(ctx,r*.58,-r*.14,r*.1);
 }
 ctx.restore();
}

function bossArt(ctx,f){
 const r=f.r,g=G[S.game];ctx.save();ctx.shadowBlur=LD?0:24;ctx.shadowColor=g.accent;ctx.strokeStyle=g.accent;ctx.fillStyle='#20112d';
 if(f.shape===0){
  ctx.beginPath();ctx.arc(0,-r*.18,r*.58,0,Math.PI*2);ctx.fill();ctx.lineWidth=r*.13;for(let i=0;i<8;i++){const a=-2.75+i*.39;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.32,r*.15);ctx.quadraticCurveTo(Math.cos(a)*r*.9,r*.75,Math.cos(a+.55+Math.sin(f.phase+i)*.1)*r*1.3,r*1.12);ctx.stroke()}eye(ctx,-r*.2,-r*.25,r*.09);eye(ctx,r*.2,-r*.25,r*.09);
 } else if(f.shape===5){
  const pseudo={...f,shape:4,colors:[g.accent,'#18324f','#061629']};fishArt(ctx,pseudo);ctx.strokeStyle='#ffd65d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-r*.6,0);ctx.lineTo(r*.65,0);ctx.stroke();
 } else if(f.shape===3){
  ctx.fillStyle=grad(ctx,g.accent,'#1b3140','#f1c05a',r);ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffe187';ctx.lineWidth=5;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.7,Math.sin(a)*r*.7);ctx.lineTo(Math.cos(a)*r*1.05,Math.sin(a)*r*1.05);ctx.stroke()}eye(ctx,-r*.2,-r*.12,r*.1);eye(ctx,r*.2,-r*.12,r*.1);
 } else if(f.shape===8){
  ctx.fillStyle=grad(ctx,g.accent,'#7a370b','#f5c45e',r);ctx.beginPath();ctx.ellipse(0,0,r*.72,r*.5,0,0,Math.PI*2);ctx.fill();ctx.lineWidth=r*.15;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*r*.55,-r*.1);ctx.quadraticCurveTo(s*r*.95,-r*.55,s*r*1.15,-r*.15);ctx.stroke()}for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*.22,r*.3);ctx.lineTo(i*r*.35,r*.78);ctx.stroke()}eye(ctx,-r*.22,-r*.2,r*.09);eye(ctx,r*.22,-r*.2,r*.09);
 } else {
  const pseudo={...f,shape:f.shape===2?5:9,colors:[g.accent,'#8a2635','#ffd65b']};fishArt(ctx,pseudo);
 }
 ctx.restore();
}

function drawBackground(ctx,t){
 const g=G[S.game],p=g.palette;
 const gr=ctx.createLinearGradient(0,0,0,720);gr.addColorStop(0,p[1]);gr.addColorStop(.45,p[0]);gr.addColorStop(1,'#01070d');ctx.fillStyle=gr;ctx.fillRect(-40,-40,1360,800);
 ctx.globalAlpha=.13;ctx.fillStyle=g.accent;for(let i=0;i<7;i++){const x=70+i*210+(t*.01)%80;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+160,720);ctx.lineTo(x+260,720);ctx.lineTo(x+80,0);ctx.fill()}ctx.globalAlpha=1;
 ctx.fillStyle='#02131c';for(let i=0;i<10;i++){const x=i*145-20,h=70+(i%4)*38;ctx.beginPath();ctx.moveTo(x,720);ctx.quadraticCurveTo(x+55,720-h,x+110,720);ctx.fill()}
 for(let i=0;i<13;i++){const x=25+i*105,y=690;ctx.strokeStyle=i%3===0?g.accent:'#0b5a61';ctx.globalAlpha=.34;ctx.lineWidth=5+(i%3);ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-12,y-45,x+Math.sin(i)*20,y-75-(i%4)*13);ctx.moveTo(x,y-25);ctx.quadraticCurveTo(x+22,y-55,x+35,y-65);ctx.stroke()}ctx.globalAlpha=1;
 if(!LD){for(let i=0;i<30;i++){const bx=(i*91+t*.028*(1+i%3))%1320-20,by=80+(i*73)%540;ctx.fillStyle=i%4?g.accent:'#b8fbff';ctx.globalAlpha=.18;ctx.beginPath();ctx.arc(bx,by,1.5+(i%4),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
}

function drawCannon(ctx,seat){
 const o=stations[seat],aim=S.aim[seat]||S.pointer,ang=Math.atan2(aim.y-o.y,aim.x-o.x),col=S.players[seat]?.[2]||'#ffd34e';
 ctx.save();ctx.translate(o.x,o.y);ctx.rotate(ang+Math.PI/2);ctx.shadowBlur=12;ctx.shadowColor=col;
 ctx.fillStyle='#0b2634';ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-16,-36,32,50,8);ctx.fill();ctx.stroke();ctx.fillStyle='#8a5a27';ctx.fillRect(-7,-59,14,34);
 ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,15,19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#08151d';ctx.beginPath();ctx.arc(0,15,11,0,Math.PI*2);ctx.fill();ctx.restore();
}

function draw(){
 const c=$('#pc');if(!c)return;const ctx=c.getContext('2d'),t=performance.now();
 ctx.save();if(S.shake>0&&!LD){ctx.translate((Math.random()-.5)*S.shake,(Math.random()-.5)*S.shake);S.shake*=.88}
 drawBackground(ctx,t);
 for(const r of S.rays){ctx.save();ctx.globalAlpha=Math.max(0,1-r.t*2.2);ctx.strokeStyle=r.c;ctx.shadowBlur=16;ctx.shadowColor=r.c;ctx.lineWidth=r.chain?3:8;ctx.beginPath();ctx.moveTo(r.x,r.y);if(r.chain)ctx.lineTo(r.tx,r.ty);else ctx.lineTo(r.x+r.ux*1600,r.y+r.uy*1600);ctx.stroke();ctx.restore()}
 for(const b of S.shots){ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle=b.color;ctx.shadowBlur=14;ctx.shadowColor=b.color;ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-b.vx*.02,-b.vy*.02);ctx.lineTo(0,0);ctx.stroke();ctx.restore()}
 for(const f of S.fish){
  ctx.save();ctx.translate(f.x,f.y);
  if(f.vx>0)ctx.scale(-1,1);
  if(f.boss)bossArt(ctx,f);else fishArt(ctx,f);
  if(f.vx>0)ctx.scale(-1,1);
  ctx.textAlign='center';ctx.font='900 '+(f.boss?24:15)+'px system-ui';ctx.lineWidth=4;ctx.strokeStyle='#01070b';ctx.strokeText('×'+f.mult,0,f.boss?f.r*.93:f.r*.82);ctx.fillStyle=f.boss?'#ffe16e':'#ffd34d';ctx.fillText('×'+f.mult,0,f.boss?f.r*.93:f.r*.82);
  if(f.boss||f.mult>=80){ctx.fillStyle='#02070bcc';ctx.fillRect(-52,-f.r*.98,104,6);ctx.fillStyle=f.boss?'#ff4d60':'#3ee7ff';ctx.fillRect(-52,-f.r*.98,104*Math.max(0,f.hp/f.max),6)}
  if(Date.now()<S.freezeUntil){ctx.strokeStyle='#b6f6ff';ctx.lineWidth=2;ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(0,0,f.r*1.06,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  ctx.restore();
 }
 for(const n of S.nets){ctx.save();ctx.globalAlpha=Math.max(0,1-n.t*2);ctx.strokeStyle=n.c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.stroke();for(let a=0;a<Math.PI*2;a+=Math.PI/4){ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(n.x+Math.cos(a)*n.r,n.y+Math.sin(a)*n.r);ctx.stroke()}ctx.restore()}
 for(const q of S.fx){ctx.save();ctx.globalAlpha=Math.max(0,1-q.t*2);ctx.strokeStyle=q.c||'#fff';ctx.fillStyle=q.c||'#fff';if(q.kind==='muzzle'){ctx.beginPath();ctx.arc(q.x,q.y,5+q.t*28,0,Math.PI*2);ctx.fill()}else if(q.kind==='blast'){ctx.lineWidth=8;ctx.beginPath();ctx.arc(q.x,q.y,20+q.t*260,0,Math.PI*2);ctx.stroke()}else{ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,q.y,7+q.t*42,0,Math.PI*2);ctx.stroke()}ctx.restore()}
 for(const co of S.coins){ctx.save();ctx.globalAlpha=Math.max(0,1-co.t);ctx.translate(co.x,co.y);ctx.rotate(co.t*8);ctx.fillStyle='#ffd34e';ctx.strokeStyle='#fff0a0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,7,4,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore()}
 for(const l of S.labels){ctx.save();ctx.globalAlpha=Math.max(0,1-l.t*1.2);ctx.textAlign='center';ctx.font='900 '+(l.big?31:23)+'px system-ui';ctx.lineWidth=5;ctx.strokeStyle='#2a1000';ctx.strokeText(l.v,l.x,l.y-l.t*50);ctx.fillStyle='#ffe16c';ctx.fillText(l.v,l.x,l.y-l.t*50);ctx.restore()}
 for(let seat=0;seat<R[S.room].seats;seat++)drawCannon(ctx,seat);
 if(S.lock){
  const f=S.fish.find(z=>z.id===S.lockedId)||S.fish.filter(targetValid).sort((a,b)=>b.mult-a.mult)[0];
  if(f){S.lockedId=f.id;ctx.save();ctx.strokeStyle='#68efff';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(f.x,f.y,f.r*1.25+Math.sin(t*.008)*4,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore()}
 }
 ctx.restore();
}

function updateFish(dt){
 const slow=(Date.now()<S.freezeUntil)?0.25:1;
 for(const f of S.fish){
  f.phase+=dt*f.pathRate*2.4;
  if(f.path==='boss'){f.x+=f.vx*dt*slow;f.y=f.spawnY+Math.sin(f.phase)*f.pathAmp;if(f.x<900)f.vx=Math.abs(f.vx);if(f.x>1320)f.vx=-Math.abs(f.vx)}
  else{f.x+=f.vx*dt*slow;if(f.path==='sine'||f.path==='orbit')f.y+=Math.sin(f.phase+f.index*.45)*f.pathAmp*dt*1.4;else f.y+=f.vy*dt*slow}
 }
 S.fish=S.fish.filter(f=>f.x>-260&&f.x<1540&&f.y>-160&&f.y<880);
 if(S.boss&&!S.fish.includes(S.boss))S.boss=null;
}

function updateShots(dt){
 for(const b of S.shots){
  b.t+=dt;
  if(b.targetId){const f=S.fish.find(x=>x.id===b.targetId);if(f){const dx=f.x-b.x,dy=f.y-b.y,len=Math.max(1,Math.hypot(dx,dy)),spd=Math.hypot(b.vx,b.vy);b.vx=b.vx*.82+dx/len*spd*.18;b.vy=b.vy*.82+dy/len*spd*.18}}
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  let hit=null,bd=Infinity;for(const f of S.fish){const d=Math.hypot(f.x-b.x,f.y-b.y);if(d<f.r*.82+b.r&&d<bd){hit=f;bd=d}}
  if(hit){impact(b,hit);b.dead=true}
  if(b.x<-40||b.x>1320||b.y<-40||b.y>760||b.t>b.max)b.dead=true;
 }
 S.shots=S.shots.filter(b=>!b.dead);
}

function loop(now){
 const modal=$('#fishModal');if(!modal||!modal.classList.contains('on')||!S.run)return;
 const dt=Math.min(.04,(now-S.last)/1000||.016);S.last=now;
 S.spawnClock+=dt;S.schoolClock+=dt;S.aiClock+=dt;S.eventClock+=dt;S.waveTime-=dt;S.bossIn-=dt;
 if(S.fever>=100){S.fever=0;S.feverUntil=Date.now()+8500;banner('FEVER MODE · VIRTUAL REWARD ×2');S.shake=5}
 const cap=LD?18:42;
 if(S.spawnClock>Math.max(.42,1.35/(G[S.game].density*R[S.room].density))){S.spawnClock=0;if(S.fish.length<cap)spawnOne(pickType(false))}
 if(S.schoolClock>(LD?9:6.5)){S.schoolClock=0;if(S.fish.length<cap-6)spawnSchool((S.wave+S.schoolIndex)%5)}
 if(S.bossIn<=0&&!S.boss)spawnBoss();
 if(S.waveTime<=0){S.wave++;S.waveTime=75;banner('WAVE '+S.wave+' · '+G[S.game].feature);spawnSchool(S.wave%5);S.feature=Math.min(100,S.feature+8)}
 if(S.eventClock>24){S.eventClock=0;banner(G[S.game].event);spawnSchool(4);S.feature=Math.min(100,S.feature+12)}
 if(S.feature>=100){S.feature=0;banner('FEATURE SURGE · SPECIAL SCHOOL');for(let i=0;i<(LD?3:6);i++)spawnOne(pickType(true));S.shake=7}
 if(S.aiClock>.68){S.aiClock=0;for(let seat=1;seat<R[S.room].seats;seat++){const f=aiTarget();if(f){S.aim[seat]={x:f.x,y:f.y};shoot(f.x,f.y,seat)}}}
 if(S.auto&&S.fish.length&&Math.random()<dt*(Date.now()<S.rapidUntil?14:(LD?4:7))){const f=S.lock?chooseTarget(S.pointer.x,S.pointer.y):aiTarget();if(f)shoot(f.x,f.y,0)}
 if(S.combo>0&&Math.random()<dt*.28)S.combo--;
 updateFish(dt);updateShots(dt);
 S.nets.forEach(n=>{n.t+=dt;n.r=Math.min(n.max,n.r+dt*140)});S.nets=S.nets.filter(n=>n.t<.5);
 S.rays.forEach(r=>r.t+=dt);S.rays=S.rays.filter(r=>r.t<.45);
 S.fx.forEach(q=>q.t+=dt);S.fx=S.fx.filter(q=>q.t<.55);
 S.coins.forEach(c=>{c.t+=dt;c.vy+=280*dt;c.x+=c.vx*dt;c.y+=c.vy*dt});S.coins=S.coins.filter(c=>c.t<1.05);
 S.labels.forEach(l=>l.t+=dt);S.labels=S.labels.filter(l=>l.t<.9);
 draw();hud();S.raf=requestAnimationFrame(loop);
}

function bossThumb(){const c=$('#bossMini');if(!c)return;const x=c.getContext('2d');x.clearRect(0,0,104,90);const f={r:30,phase:0,shape:G[S.game].bossType,colors:[G[S.game].accent,'#46202d','#ffd25b']};x.save();x.translate(52,40);bossArt(x,f);x.restore()}

function preview(canvas,i){
 const x=canvas.getContext('2d'),g=G[i];x.clearRect(0,0,320,160);
 const gg=x.createLinearGradient(0,0,320,160);gg.addColorStop(0,g.palette[0]);gg.addColorStop(1,g.palette[1]);x.fillStyle=gg;x.fillRect(0,0,320,160);
 for(let k=0;k<5;k++){const t=T[(i+k)%T.length],f={...t,r:17+k*2,phase:k,shape:t.shape,colors:t.colors};x.save();x.translate(65+k*48,55+Math.sin(k)*22);fishArt(x,f);x.restore()}
 x.save();x.translate(255,90);const b={r:38,phase:0,shape:g.bossType,colors:[g.accent,'#46202d','#ffd25b']};bossArt(x,b);x.restore();
 x.fillStyle='#fff';x.font='900 11px system-ui';x.fillText(g.feature,10,148);
}
function cards(){
 const h=$('#fishCards');if(!h)return;
 h.innerHTML=G.map((g,i)=>`<article class="gameCard" onclick="openFish(${i})"><div class="tag">${i+1}</div><div class="art premium-card-art"><canvas class="premiumPreview" width="320" height="160" data-p="${i}"></canvas></div><div class="cardBody"><b>${g.name}</b><small>${g.zone} · ${g.feature}</small><div class="cardStats"><span>${g.boss}</span><span>${g.event}</span></div></div></article>`).join('');
 $$('[data-p]').forEach(c=>preview(c,+c.dataset.p));
}

window.exportTelemetryV5=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S.tele,null,2)],{type:'application/json'}));a.download='fsa-telemetry-v5.json';a.click()};

function markV5(){
 document.querySelectorAll('.cxRailStatus small').forEach(e=>e.innerHTML='PREMIUM TABLE ENGINE v5<b>READY</b>');
 const facts=document.querySelectorAll('.cxHeroFacts span b');if(facts[3])facts[3].textContent='v5';
 const previewTitle=document.querySelector('.cxPreviewCopy .cxKicker');if(previewTitle)previewTitle.textContent='PREMIUM TABLE ENGINE v5';
 const desc=document.querySelector('.cxPreviewCopy p');if(desc)desc.textContent='Projectile-travel cannons, dense formations, four visible table stations, original vector creatures, bosses, special weapon targets, capture nets, coin bursts, lock-on, auto-fire, species targeting, combo/Fever and exact owned-game telemetry.';
}

function boot(){installStyles();ui();cards();save();markV5();const n=$('#research');if(n)n.innerHTML='<b>F.S.A. Premium Table Engine v5:</b> rebuilt around the recognizable arcade fish-table interaction pattern: moving schools, fixed cannon stations, projectile travel, lock/auto controls, target values, multiplayer table pressure, special-weapon creatures, bosses and large capture effects. All gameplay art and code remain original F.S.A. assets; virtual/non-cash credits only.'}
boot();
})();