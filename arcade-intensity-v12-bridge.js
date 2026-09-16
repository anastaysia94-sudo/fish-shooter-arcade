(()=>{'use strict';
const legacy=window.__FSA_GAME_TEST__||null;
if(!legacy)return;
const KEY='fsa.v9.profile';
const shadow={game:Number(legacy.getState?.()?.game)||0,room:Number(legacy.getState?.()?.room)||1};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};
const seedIntensityProfile=()=>{const p=legacy.getProfile?.();if(p)write({...read(),credits:Number(p.credits)||0,gems:Number(p.gems)||0,pearls:Number(p.pearls)||0,level:Number(p.level)||1,xp:Number(p.xp)||0})};
const intensityOpen=window.openGame;
const intensityRoom=window.chooseRoom;
if(typeof intensityOpen==='function')window.openGame=function(i){shadow.game=Math.max(0,Math.min(14,Number(i)||0));seedIntensityProfile();const out=intensityOpen.apply(this,arguments);queueMicrotask(syncCinematicHud);return out};
if(typeof intensityRoom==='function')window.chooseRoom=function(i){shadow.room=Math.max(0,Math.min(2,Number(i)||0));const out=intensityRoom.apply(this,arguments);queueMicrotask(syncCinematicHud);return out};
const legacyState=legacy.getState?.bind(legacy);
window.__FSA_GAME_TEST__={...legacy,getProfile:()=>legacy.getProfile?.(),getState:()=>{const base=legacyState?.()||{};const fishOpen=document.getElementById('game')?.classList.contains('on');const slotOpen=document.getElementById('slotModal')?.classList.contains('on');if(slotOpen)return base;if(fishOpen)return {...base,game:shadow.game,room:shadow.room};return {...base,game:shadow.game,room:shadow.room}}};
window.__FSA_INTENSITY_BRIDGE__={version:'v12',cinematic:'v13',getShadowState:()=>({...shadow}),seedIntensityProfile};

const root=document.documentElement;
root.dataset.cinematic='v13';
const net=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
const cinematicLite=!!(net&&(net.saveData||/^(slow-)?2g$/.test(net.effectiveType||'')));
if(cinematicLite)root.dataset.cinematicLite='1';
const $=s=>document.querySelector(s);
const battle=$('.battle');
const game=$('#game');
if(!battle||!game)return;

function installCinematicStyle(){
  if($('#v13CinematicStyle'))return;
  const style=document.createElement('style');style.id='v13CinematicStyle';style.textContent=`
html[data-cinematic="v13"] body{background:#01060b}
html[data-cinematic="v13"] .v8-app{min-height:100vh;background:
radial-gradient(circle at 12% 8%,#18346d55,transparent 26%),
radial-gradient(circle at 86% 18%,#721c7555,transparent 28%),
radial-gradient(circle at 46% 48%,#006c7a38,transparent 34%),
linear-gradient(180deg,#020610 0%,#03121d 52%,#01070d 100%)!important;color:#effcff}
html[data-cinematic="v13"] .v8-topart{position:relative;overflow:hidden;background:linear-gradient(90deg,#020812f5,#071526ef 45%,#12081cef)!important;border-bottom:1px solid #60ecff3d!important;box-shadow:0 12px 36px #0009!important}
html[data-cinematic="v13"] .v8-topart:after{content:"";position:absolute;inset:auto -10% -1px -10%;height:2px;background:linear-gradient(90deg,transparent,#43eaff,#b356ff,#ffd45a,#43eaff,transparent);box-shadow:0 0 16px #62eaff99}
html[data-cinematic="v13"] .v8-brand strong{font-size:clamp(29px,3vw,50px)!important;letter-spacing:.12em!important;background:linear-gradient(90deg,#8ef6ff,#fff,#d69cff,#ffe47c);-webkit-background-clip:text;background-clip:text;color:transparent!important;text-shadow:0 0 28px #56eaff35}
html[data-cinematic="v13"] .v8-brand span{letter-spacing:.24em!important;color:#c7faff!important;font-weight:900!important}
html[data-cinematic="v13"] .v8-brand small{color:#779aac!important;letter-spacing:.07em}
html[data-cinematic="v13"] .v13-version-badge{position:absolute;right:18px;top:50%;transform:translateY(-50%);padding:7px 11px;border:1px solid #ffe06b66;border-radius:999px;background:#171004d9;color:#ffe58a;font-size:8px;font-weight:1000;letter-spacing:.14em;box-shadow:0 0 24px #ffb23820,inset 0 0 14px #ffd65a0d}
html[data-cinematic="v13"] .v8-account{margin:12px auto 0!important;width:min(1500px,calc(100% - 24px));border:1px solid #67ebff24!important;border-radius:18px!important;background:linear-gradient(180deg,#061624dd,#020b14e8)!important;box-shadow:0 18px 42px #0008,inset 0 0 22px #45eaff08!important;backdrop-filter:blur(15px)}
html[data-cinematic="v13"] .profile .avatar{border:1px solid #72efff77!important;background:radial-gradient(circle,#145271,#04111d)!important;box-shadow:0 0 25px #48eaff26!important}
html[data-cinematic="v13"] .currency{border:1px solid #ffffff14!important;background:#06111cd9!important;box-shadow:inset 0 0 13px #ffffff08}
html[data-cinematic="v13"] .quick-actions button{border-radius:12px!important;border:1px solid #67eaff22!important;background:linear-gradient(180deg,#0b2232,#04101a)!important}
html[data-cinematic="v13"] .v8-nav{position:sticky;top:0;z-index:70;margin:10px auto 0!important;width:min(1500px,calc(100% - 24px));border:1px solid #62eaff27!important;border-radius:16px!important;background:#020b14e8!important;box-shadow:0 10px 28px #000b!important;backdrop-filter:blur(16px);overflow:auto}
html[data-cinematic="v13"] .v8-nav button,html[data-cinematic="v13"] .v8-nav a{border-radius:10px!important;letter-spacing:.05em!important}
html[data-cinematic="v13"] .v8-nav .active{background:linear-gradient(180deg,#12384d,#071b29)!important;color:#dffcff!important;box-shadow:inset 0 0 18px #54eaff12}
html[data-cinematic="v13"] .v8-content{width:min(1500px,calc(100% - 24px));margin:0 auto!important;padding-top:18px!important}
html[data-cinematic="v13"] .v8-hero-grid{gap:14px!important}
html[data-cinematic="v13"] .hero-card{position:relative;min-height:440px!important;overflow:hidden!important;border:1px solid #66efff45!important;border-radius:24px!important;background:
linear-gradient(90deg,#020812f2 0%,#031321c9 44%,#02081240 70%,#02081220 100%),
url('assets/fsa-gameplay.svg') center/cover no-repeat!important;box-shadow:0 24px 60px #000b,0 0 45px #22dfff12,inset 0 0 55px #1ce5ff0c!important}
html[data-cinematic="v13"] .hero-card:before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 28%,#61eaff0d 42%,transparent 56%),radial-gradient(circle at 75% 28%,#ffb94a1f,transparent 25%);pointer-events:none}
html[data-cinematic="v13"] .hero-card:after{content:"";position:absolute;left:-20%;right:-20%;bottom:0;height:1px;background:linear-gradient(90deg,transparent,#55eaff,#d35dff,#ffd65a,#55eaff,transparent);box-shadow:0 0 18px #72eaff}
html[data-cinematic="v13"] .hero-copy{position:relative;z-index:2;max-width:650px!important;padding:32px!important}
html[data-cinematic="v13"] .hero-copy .eyebrow{color:#78f4ff!important;letter-spacing:.2em!important;font-weight:1000!important}
html[data-cinematic="v13"] .hero-copy h1{margin:12px 0 12px!important;font-size:clamp(40px,5.2vw,78px)!important;line-height:.92!important;letter-spacing:-.035em!important;font-style:italic!important;color:#fff!important;text-shadow:0 3px #06101a,0 0 28px #38e7ff32!important}
html[data-cinematic="v13"] .hero-copy h1 span{background:linear-gradient(90deg,#ff6f4f,#ffd85c,#ff7adf);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none}
html[data-cinematic="v13"] .hero-copy p{max-width:560px;color:#b9dce6!important;font-size:14px!important;line-height:1.6!important}
html[data-cinematic="v13"] .hero-copy .btn.primary{padding:14px 22px!important;border-radius:14px!important;border:1px solid #8bf4ff55!important;background:linear-gradient(180deg,#0e5a72,#062d3d)!important;color:#efffff!important;box-shadow:0 0 30px #22dfff25!important;font-weight:1000!important;letter-spacing:.08em!important}
html[data-cinematic="v13"] .v13-hero-kicker{display:inline-flex;gap:8px;align-items:center;margin-bottom:4px;padding:5px 9px;border:1px solid #ff7b6947;border-radius:999px;background:#200a0bd1;color:#ff9687;font-size:7px;font-weight:1000;letter-spacing:.18em;text-transform:uppercase}
html[data-cinematic="v13"] .v13-hero-kicker:before{content:"";width:6px;height:6px;border-radius:50%;background:#ff4d47;box-shadow:0 0 10px #ff423f}
html[data-cinematic="v13"] .v13-hero-stats{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
html[data-cinematic="v13"] .v13-hero-stats span{min-width:112px;padding:8px 10px;border:1px solid #67eaff2b;border-radius:12px;background:#02101ac2;box-shadow:inset 0 0 15px #34eaff08}
html[data-cinematic="v13"] .v13-hero-stats b{display:block;color:#fff0a6;font-size:17px;line-height:1;text-shadow:0 0 12px #ffbd3d44}
html[data-cinematic="v13"] .v13-hero-stats small{display:block;margin-top:3px;color:#7ba9b8;font-size:6px;font-weight:900;letter-spacing:.11em}
html[data-cinematic="v13"] .v13-live-raid{position:absolute;z-index:3;right:18px;bottom:18px;width:min(280px,36%);padding:14px 15px;text-align:left;border:1px solid #ff6b5f6b;border-radius:18px;background:linear-gradient(160deg,#26080edd,#090b15eb)!important;color:#fff;box-shadow:0 16px 38px #000b,0 0 30px #ff463921,inset 0 0 18px #ff4a3110;cursor:pointer}
html[data-cinematic="v13"] .v13-live-raid span{display:block;color:#ff7a69;font-size:7px;font-weight:1000;letter-spacing:.2em}
html[data-cinematic="v13"] .v13-live-raid b{display:block;margin-top:3px;color:#fff3d0;font-size:19px;letter-spacing:.04em;text-shadow:0 0 12px #ff704f4a}
html[data-cinematic="v13"] .v13-live-raid small{display:block;margin-top:4px;color:#a4c4cd;font-size:7px;letter-spacing:.08em}
html[data-cinematic="v13"] .promo-card,html[data-cinematic="v13"] .mission-card{border-radius:20px!important;border:1px solid #61eaff2d!important;background:linear-gradient(180deg,#071725e6,#020b13f2)!important;box-shadow:0 18px 42px #0009,inset 0 0 22px #43eaff08!important}
html[data-cinematic="v13"] .promo-card.jackpot{border-color:#ffd65a45!important;background:radial-gradient(circle at 70% 15%,#8c631f2d,transparent 35%),linear-gradient(180deg,#191105e8,#060a10f2)!important}
html[data-cinematic="v13"] .promo-card.fever{border-color:#ff62d44a!important;background:radial-gradient(circle at 75% 18%,#9d1b9e35,transparent 38%),linear-gradient(180deg,#17091fe8,#060a12f2)!important}
html[data-cinematic="v13"] .promo-card .big{font-size:clamp(26px,3vw,42px)!important;text-shadow:0 0 18px currentColor}
html[data-cinematic="v13"] .v8-library-head{margin-top:24px!important;padding:14px 16px;border:1px solid #61eaff1d;border-radius:16px;background:#03101ac7;box-shadow:inset 0 0 18px #55eaff07}
html[data-cinematic="v13"] .v8-library-head h2{font-size:clamp(24px,3vw,40px)!important;letter-spacing:-.02em;color:#effcff!important}
html[data-cinematic="v13"] .filters button{border-radius:999px!important;border:1px solid #66ebff2d!important;background:#061622!important;color:#9ed6e1!important}
html[data-cinematic="v13"] .game-grid{grid-template-columns:repeat(auto-fit,minmax(245px,1fr))!important;gap:14px!important}
html[data-cinematic="v13"] .lib-card{position:relative;min-height:190px!important;overflow:hidden!important;border:1px solid #68eaff38!important;border-radius:20px!important;background:var(--art)!important;box-shadow:0 18px 34px #0008,inset 0 0 22px #fff04!important;transform:translateZ(0);transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease!important}
html[data-cinematic="v13"] .lib-card:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 10%,#02081130 45%,#020811e8 100%),radial-gradient(circle at 72% 22%,#ffffff18,transparent 24%);pointer-events:none}
html[data-cinematic="v13"] .lib-card:hover{transform:translateY(-5px) scale(1.015)!important;border-color:#9af7ff7a!important;box-shadow:0 24px 42px #000b,0 0 30px #48eaff1c!important}
html[data-cinematic="v13"] .lib-card .num{position:absolute!important;top:10px!important;left:10px!important;z-index:3!important;padding:4px 7px!important;border:1px solid #fff2!important;border-radius:999px!important;background:#020812cf!important;color:#e6fbff!important;font-size:8px!important}
html[data-cinematic="v13"] .lib-card .meta{position:absolute!important;z-index:3!important;left:0!important;right:0!important;bottom:0!important;padding:14px!important}
html[data-cinematic="v13"] .lib-card .meta h3{font-size:21px!important;letter-spacing:.02em!important;color:#fff!important;text-shadow:0 2px #00101a,0 0 12px #3eeaff33!important}
html[data-cinematic="v13"] .lib-card .tags span{border:1px solid #ffffff16!important;border-radius:999px!important;background:#04111bd8!important;color:#acd8e2!important}
html[data-cinematic="v13"] .rooms{gap:14px!important}
html[data-cinematic="v13"] .world-card{position:relative;overflow:hidden;border:1px solid #67eaff34!important;border-radius:20px!important;background:linear-gradient(160deg,#082235,#02101a)!important;box-shadow:0 16px 36px #0008,inset 0 0 22px #3eeaff08!important}
html[data-cinematic="v13"] .world-card:nth-child(2){border-color:#cf72ff38!important;background:linear-gradient(160deg,#1f1230,#07101b)!important}
html[data-cinematic="v13"] .world-card:nth-child(3){border-color:#ffd85a48!important;background:linear-gradient(160deg,#2b2007,#0a1017)!important}
html[data-cinematic="v13"] .world-card h3{font-size:22px!important;letter-spacing:.08em!important}
html[data-cinematic="v13"] .boss-strip{gap:12px!important}
html[data-cinematic="v13"] .boss-card{min-height:112px!important;border-radius:18px!important;border:1px solid #ff6c5f34!important;background:radial-gradient(circle at 50% 5%,#ff4f3930,transparent 45%),linear-gradient(180deg,#17080d,#050a11)!important;box-shadow:0 14px 30px #0008!important}
html[data-cinematic="v13"] .boss-card span{font-size:38px!important;filter:drop-shadow(0 0 12px #ff704c66)}
html[data-cinematic="v13"] .slots-grid{gap:12px!important}
html[data-cinematic="v13"] .slot-card{border-radius:18px!important;border:1px solid #f8d45a34!important;background:radial-gradient(circle at 75% 0%,var(--c2),transparent 42%),linear-gradient(180deg,#151008,#050a10)!important;box-shadow:0 16px 32px #0008,inset 0 0 20px #ffd65a08!important}
html[data-cinematic="v13"] .slot-symbols span{border-radius:10px!important;border:1px solid #ffffff18!important;background:#071018d9!important;box-shadow:inset 0 0 12px #fff08}
html[data-cinematic="v13"] .v8-footer{margin:26px 0 14px!important;border-top:1px solid #61eaff1c!important;color:#648998!important}

html[data-cinematic="v13"] .v8-game{--v13-cyan:#57efff;--v13-gold:#ffd65a;--v13-red:#ff465e;--v13-violet:#b257ff}
html[data-cinematic="v13"] .game-top{border-bottom-color:#7eefff55!important;box-shadow:0 8px 34px #000c,inset 0 -1px #ffd65a4a!important}
html[data-cinematic="v13"] .boss-hud{position:relative;padding-right:118px!important;border-color:#ffbf5a55!important;background:linear-gradient(180deg,#210711e6,#06111ce6)!important;box-shadow:inset 0 0 28px #ff37481c,0 0 28px #000a!important}
html[data-cinematic="v13"] .boss-hud h2{font-size:16px!important;letter-spacing:.13em!important;color:#fff5e2;text-shadow:0 0 8px #fff4,0 0 18px #ff435fb3!important}
html[data-cinematic="v13"] .bossbar{height:14px!important;border-color:#ffd36f88!important;border-radius:999px!important;overflow:visible!important}
html[data-cinematic="v13"] .bossbar i{border-radius:999px!important;background:linear-gradient(90deg,#ff2443 0%,#ff6e43 56%,#ffdc63 100%)!important;box-shadow:0 0 9px #ff2f4f,0 0 22px #ff883f66!important}
html[data-cinematic="v13"] .v13-boss-meta{position:absolute;right:10px;top:7px;display:grid;grid-template-columns:auto auto;gap:2px 6px;align-items:center;text-align:right;pointer-events:none}
html[data-cinematic="v13"] .v13-boss-meta span{font-size:7px;font-weight:950;letter-spacing:.12em;color:#bff8ff}
html[data-cinematic="v13"] .v13-boss-meta span:nth-child(2){color:#ffbe78}
html[data-cinematic="v13"] .v13-boss-meta strong{grid-column:1/3;font-size:15px;line-height:1;color:#ffe277;text-shadow:0 0 12px #ffad2f}
html[data-cinematic="v13"] .battle{box-shadow:inset 0 0 90px #00101ed9,inset 0 -55px 80px #000b!important}
html[data-cinematic="v13"] .battle.v13-fever{box-shadow:inset 0 0 70px #e75bff26,inset 0 -45px 90px #ff9e2133!important}
html[data-cinematic="v13"] .battle.v13-boss-enraged{animation:v13Danger 1.15s ease-in-out infinite alternate}
html[data-cinematic="v13"] .v13-event-stamp{position:absolute;z-index:29;top:48px;right:112px;display:flex;flex-direction:column;align-items:flex-end;opacity:0;transform:translateY(-8px) rotate(-5deg);pointer-events:none;transition:opacity .22s ease,transform .22s ease}
html[data-cinematic="v13"] .v13-event-stamp.on{opacity:1;transform:translateY(0) rotate(-5deg)}
html[data-cinematic="v13"] .v13-event-stamp span{font-size:17px;font-weight:1000;font-style:italic;letter-spacing:.05em;color:#ff6256;text-shadow:0 2px #5d0b0b,0 0 16px #ff332f}
html[data-cinematic="v13"] .v13-event-stamp b{font-size:11px;letter-spacing:.12em;color:#ffe274;text-shadow:0 0 10px #ffb23e}
html[data-cinematic="v13"] .v13-action-tower{position:absolute;z-index:32;right:9px;top:50%;transform:translateY(-44%);width:88px;padding:6px;border:1px solid #57eaff55;border-radius:17px;background:linear-gradient(180deg,#041a2be8,#010914ed);box-shadow:0 12px 35px #000c,inset 0 0 22px #35e5ff0c;backdrop-filter:blur(10px);display:grid;gap:5px}
html[data-cinematic="v13"] .v13-tower-head{padding:2px 0 4px;text-align:center;font-size:6px;font-weight:1000;letter-spacing:.2em;color:#89efff;border-bottom:1px solid #56eaff24}
html[data-cinematic="v13"] .v13-action{appearance:none;border:1px solid #5ceaff44;border-radius:11px;min-height:46px;padding:5px 3px;background:linear-gradient(180deg,#0a2c41e8,#03121de8);color:#dffaff;display:grid;place-items:center;gap:1px;cursor:pointer;box-shadow:inset 0 0 12px #2ceaff0d;transition:transform .12s ease,filter .12s ease,border-color .12s ease,box-shadow .12s ease}
html[data-cinematic="v13"] .v13-action:hover{filter:brightness(1.2);border-color:#a0f7ff88}
html[data-cinematic="v13"] .v13-action:active{transform:scale(.94)}
html[data-cinematic="v13"] .v13-action.on{border-color:#ffd85ba8;background:linear-gradient(180deg,#43320ae8,#161006e8);box-shadow:0 0 18px #ffbd3440,inset 0 0 15px #ffd95b17;color:#fff0a4}
html[data-cinematic="v13"] .v13-action span{font-size:20px;line-height:1;text-shadow:0 0 10px currentColor}
html[data-cinematic="v13"] .v13-action b{font-size:6px;letter-spacing:.05em;white-space:nowrap}
html[data-cinematic="v13"] .v13-cannon-mode{display:grid;gap:4px;margin-top:2px;padding-top:4px;border-top:1px solid #56eaff22}
html[data-cinematic="v13"] .v13-cannon-mode>small{text-align:center;font-size:5px;font-weight:1000;letter-spacing:.11em;color:#7edee9}
html[data-cinematic="v13"] .v13-cannon-mode .v13-action{min-height:35px;grid-template-columns:22px 1fr;place-items:center start;padding:3px 5px}
html[data-cinematic="v13"] .v13-cannon-mode .v13-action span{font-size:14px}
html[data-cinematic="v13"] .v13-cannon-mode .v13-action b{font-size:6px}
html[data-cinematic="v13"] .v13-reticle{position:absolute;z-index:27;left:0;top:0;width:54px;height:54px;transform:translate(calc(var(--rx,50vw) - 27px),calc(var(--ry,50vh) - 27px));border:2px solid #fff7;border-radius:50%;opacity:0;pointer-events:none;filter:drop-shadow(0 0 7px #ff513b);transition:opacity .12s ease}
html[data-cinematic="v13"] .v13-reticle.tracking{opacity:.85}
html[data-cinematic="v13"] .v13-reticle:before,html[data-cinematic="v13"] .v13-reticle:after{content:"";position:absolute;inset:50% auto auto 50%;background:#ff694f;box-shadow:0 0 7px #ff3f2e}
html[data-cinematic="v13"] .v13-reticle:before{width:72px;height:2px;transform:translate(-50%,-50%)}
html[data-cinematic="v13"] .v13-reticle:after{width:2px;height:72px;transform:translate(-50%,-50%)}
html[data-cinematic="v13"] .v13-reticle.blast{animation:v13Reticle .22s ease-out}
html[data-cinematic="v13"] .v13-combo-callout{position:absolute;z-index:28;right:116px;bottom:126px;min-width:112px;text-align:center;opacity:0;transform:scale(.82) rotate(-5deg);pointer-events:none;transition:opacity .18s ease,transform .18s ease}
html[data-cinematic="v13"] .v13-combo-callout.on{opacity:1;transform:scale(1) rotate(-5deg)}
html[data-cinematic="v13"] .v13-combo-callout b{display:block;font-size:8px;letter-spacing:.18em;color:#fff0a1;text-shadow:0 0 7px #ff9a2d}
html[data-cinematic="v13"] .v13-combo-callout strong{display:block;font-size:38px;line-height:.9;font-style:italic;color:#fff7b1;text-shadow:0 2px #8d2f00,0 0 9px #ffab24,0 0 22px #ff5b20}
html[data-cinematic="v13"] .v13-combo-callout small{font-size:7px;font-weight:1000;letter-spacing:.08em;color:#ff754a}
html[data-cinematic="v13"] .v13-combo-callout.pop{animation:v13ComboPop .34s cubic-bezier(.2,.95,.3,1.25)}
html[data-cinematic="v13"] .v13-team-strip{position:absolute;z-index:26;left:50%;bottom:155px;transform:translateX(-50%);width:min(330px,40vw);padding:5px 9px;border:1px solid #59ebff46;border-radius:999px;background:#03121cdd;box-shadow:0 8px 22px #000a,inset 0 0 16px #37eaff0c;backdrop-filter:blur(8px);display:grid;grid-template-columns:auto 1fr auto;gap:7px;align-items:center;pointer-events:none}
html[data-cinematic="v13"] .v13-team-strip span,html[data-cinematic="v13"] .v13-team-strip strong{font-size:6px;font-weight:1000;letter-spacing:.11em;color:#a9f5ff}
html[data-cinematic="v13"] .v13-team-strip strong{color:#ffe178}
html[data-cinematic="v13"] .v13-team-strip i{height:5px;border-radius:999px;background:#07121a;overflow:hidden;box-shadow:inset 0 0 5px #000}
html[data-cinematic="v13"] .v13-team-strip i b{display:block;height:100%;width:4%;border-radius:inherit;background:linear-gradient(90deg,#31e5ff,#7b75ff,#ff52bf,#ffd75e);box-shadow:0 0 9px #65eaff;transition:width .28s ease}
html[data-cinematic="v13"] .v13-hotkeys{position:absolute;z-index:24;left:10px;bottom:105px;padding:4px 7px;border-radius:999px;border:1px solid #61eaff22;background:#020b12aa;color:#7fa9b6;font-size:5px;font-weight:850;letter-spacing:.07em;pointer-events:none;backdrop-filter:blur(6px)}
html[data-cinematic="v13"] .weapon-switch:before{content:"CANNON MODE";display:grid;place-items:center;padding:0 4px;font-size:6px;font-weight:1000;letter-spacing:.11em;color:#8aeaf4}
html[data-cinematic="v13"] .weapon-switch{border-color:#78f1ff55!important;background:linear-gradient(180deg,#041723ee,#01080fee)!important;box-shadow:0 10px 30px #000d,inset 0 0 24px #2aeaff0d!important}
html[data-cinematic="v13"] .weapon-switch button{min-height:30px!important}
html[data-cinematic="v13"] .hudbox{border-color:#59eaff3b!important;box-shadow:inset 0 0 22px #3beaff0d,0 9px 25px #0008!important}
html[data-cinematic="v13"] .radar{border:1px solid #61efff38;border-radius:50%;box-shadow:inset 0 0 20px #2aefff1c,0 0 18px #00dfff12!important}
html[data-cinematic="v13"] .power-grid button b{filter:drop-shadow(0 0 7px currentColor)}
html[data-cinematic="v13"] .seatgun.you .gunart:before{box-shadow:0 0 13px color-mix(in srgb,var(--seat) 70%,transparent),inset 0 0 8px #fff2!important}
html[data-cinematic="v13"] .seatgun.you .gunart{border-width:2px!important;box-shadow:0 0 22px #fff3,0 0 48px color-mix(in srgb,var(--seat) 75%,transparent),inset 0 0 28px #ffffff2c!important}
html[data-cinematic="v13"] .v13-time-critical .roomtime strong{color:#ff6f66!important;text-shadow:0 0 14px #ff2e3e;animation:v13Time .65s ease-in-out infinite alternate}
html[data-cinematic="v13"][data-cinematic-lite="1"] .hero-card{background:linear-gradient(135deg,#031523,#071a2b 60%,#0d0a19)!important}
html[data-cinematic="v13"][data-cinematic-lite="1"] .v13-reticle,html[data-cinematic="v13"][data-cinematic-lite="1"] .v13-event-stamp,html[data-cinematic="v13"][data-cinematic-lite="1"] .v13-hotkeys{display:none}
html[data-cinematic="v13"][data-cinematic-lite="1"] .v13-action-tower{backdrop-filter:none;box-shadow:0 5px 14px #000b}
@keyframes v13Reticle{0%{transform:translate(calc(var(--rx) - 27px),calc(var(--ry) - 27px)) scale(.65);filter:drop-shadow(0 0 16px #fff)}100%{transform:translate(calc(var(--rx) - 27px),calc(var(--ry) - 27px)) scale(1.18);filter:drop-shadow(0 0 4px #ff513b)}}
@keyframes v13ComboPop{0%{transform:scale(.7) rotate(-8deg)}65%{transform:scale(1.16) rotate(-4deg)}100%{transform:scale(1) rotate(-5deg)}}
@keyframes v13Danger{from{box-shadow:inset 0 0 70px #ff1d3a0a,inset 0 -55px 80px #000b}to{box-shadow:inset 0 0 95px #ff1d3a28,inset 0 -55px 80px #000b}}
@keyframes v13Time{from{opacity:.72}to{opacity:1}}
@media(max-width:1100px){html[data-cinematic="v13"] .hero-card{min-height:410px!important}.v13-live-raid{width:32%!important}.v13-action-tower{width:74px;right:5px}.v13-event-stamp{right:91px!important}.v13-combo-callout{right:93px!important}.v13-team-strip{width:min(270px,36vw)}}
@media(max-width:760px){html[data-cinematic="v13"] .v13-version-badge{right:10px;top:9px;transform:none;padding:4px 7px;font-size:6px}.v8-account,.v8-nav,.v8-content{width:calc(100% - 12px)!important}.hero-card{min-height:520px!important}.hero-copy{padding:22px 18px 132px!important}.hero-copy h1{font-size:42px!important}.v13-live-raid{left:12px!important;right:12px!important;bottom:12px!important;width:auto!important}.v13-hero-stats span{min-width:calc(50% - 5px)}.game-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}.lib-card{min-height:150px!important;border-radius:15px!important}.lib-card .meta h3{font-size:15px!important}.v8-library-head{padding:10px!important}.boss-hud{padding-right:70px!important}.v13-boss-meta{right:5px!important}.v13-boss-meta span{font-size:5px!important}.v13-boss-meta strong{font-size:10px!important}.v13-event-stamp{top:33px!important;right:61px!important}.v13-event-stamp span{font-size:10px!important}.v13-event-stamp b{font-size:7px!important}.v13-action-tower{right:3px!important;width:52px!important;padding:3px!important;border-radius:12px!important;gap:3px!important}.v13-tower-head{display:none}.v13-action{min-height:38px!important;padding:2px!important}.v13-action span{font-size:17px!important}.v13-action b{display:none}.v13-cannon-mode>small{display:none}.v13-cannon-mode .v13-action{display:grid!important;grid-template-columns:1fr!important;place-items:center!important;min-height:30px!important}.v13-cannon-mode .v13-action span{font-size:13px!important}.v13-combo-callout{right:60px!important;bottom:88px!important;min-width:82px!important}.v13-combo-callout strong{font-size:27px!important}.v13-team-strip{bottom:118px!important;width:min(220px,52vw)!important;padding:4px 7px!important}.v13-team-strip span,.v13-team-strip strong{font-size:5px!important}.v13-hotkeys{display:none}.v13-reticle{width:42px!important;height:42px!important;transform:translate(calc(var(--rx,50vw) - 21px),calc(var(--ry,50vh) - 21px))}.v13-reticle:before{width:56px!important}.v13-reticle:after{height:56px!important}}
@media(max-width:520px){html[data-cinematic="v13"] .game-grid{grid-template-columns:1fr!important}.hero-copy h1{font-size:36px!important}.v13-hero-stats span{min-width:100%}}
@media(max-height:520px) and (orientation:landscape){html[data-cinematic="v13"] .v13-action-tower{width:48px!important;right:2px!important;gap:2px!important;padding:2px!important}.v13-action{min-height:29px!important}.v13-action span{font-size:14px!important}.v13-cannon-mode{gap:2px!important;padding-top:2px!important}.v13-cannon-mode .v13-action{min-height:24px!important}.v13-event-stamp{top:27px!important;right:55px!important}.v13-team-strip{bottom:86px!important}.v13-combo-callout{bottom:73px!important}.v13-hotkeys{display:none}}
@media(prefers-reduced-motion:reduce){html[data-cinematic="v13"] .battle.v13-boss-enraged,html[data-cinematic="v13"] .v13-time-critical .roomtime strong,html[data-cinematic="v13"] .v13-combo-callout.pop,html[data-cinematic="v13"] .v13-reticle.blast{animation:none!important}.v13-action,.v13-event-stamp,.v13-combo-callout,.v13-team-strip i b,.lib-card{transition:none!important}}
`;
  document.head.appendChild(style);
}

function installLobbyChrome(){
  const top=$('.v8-topart');
  if(top&&!$('#v13VersionBadge')){const badge=document.createElement('div');badge.id='v13VersionBadge';badge.className='v13-version-badge';badge.textContent='CINEMATIC V13';top.appendChild(badge)}
  const hero=$('.hero-card');const copy=hero?.querySelector('.hero-copy');
  if(copy&&!$('#v13HeroKicker')){const kicker=document.createElement('div');kicker.id='v13HeroKicker';kicker.className='v13-hero-kicker';kicker.textContent='LIVE OCEAN COMBAT';copy.insertBefore(kicker,copy.firstChild)}
  if(copy){const h=copy.querySelector('h1');if(h)h.innerHTML='ENTER THE <span>ABYSS</span>.<br>HUNT SOMETHING BIG.';const p=copy.querySelector('p');if(p)p.textContent='Fifteen original combat tables, escalating boss phases, shared-table rivals, power surges and three cannon systems built for fast arcade sessions.';const play=copy.querySelector('.btn.primary');if(play)play.textContent='ENTER LIVE TABLE ›'}
  if(copy&&!$('#v13HeroStats')){const stats=document.createElement('div');stats.id='v13HeroStats';stats.className='v13-hero-stats';stats.innerHTML='<span><b>15</b><small>COMBAT OCEANS</small></span><span><b>3</b><small>CANNON SYSTEMS</small></span><span><b>4</b><small>POWER SURGES</small></span>';const play=copy.querySelector('.btn.primary');copy.insertBefore(stats,play)}
  if(hero&&!$('#v13LiveRaid')){const raid=document.createElement('button');raid.id='v13LiveRaid';raid.type='button';raid.className='v13-live-raid';raid.innerHTML='<span>LIVE RAID</span><b>ULTIMATE LEGION</b><small>BOSS RUSH · GOLD ABYSS · ENTER NOW</small>';raid.onclick=()=>{window.openGame?.(14);window.chooseRoom?.(2)};hero.appendChild(raid)}
}

function button(label,action,icon){const b=document.createElement('button');b.type='button';b.dataset.v13Action=action;b.className='v13-action';b.setAttribute('aria-label',label);b.innerHTML=`<span>${icon}</span><b>${label}</b>`;return b}
function installCinematicChrome(){
  installCinematicStyle();
  installLobbyChrome();
  if(!$('#v13BossMeta')){const meta=document.createElement('div');meta.id='v13BossMeta';meta.className='v13-boss-meta';meta.innerHTML='<span id="v13BossLevel">LV 10</span><span id="v13BossPhase">HUNT</span><strong id="v13BossMult">×4</strong>';$('.boss-hud')?.appendChild(meta)}
  if(!$('#v13EventStamp')){const e=document.createElement('div');e.id='v13EventStamp';e.className='v13-event-stamp';e.innerHTML='<span>BOSS BATTLE</span><b>LIVE NOW</b>';battle.appendChild(e)}
  if(!$('#v13Reticle')){const r=document.createElement('div');r.id='v13Reticle';r.className='v13-reticle';r.setAttribute('aria-hidden','true');battle.appendChild(r)}
  if(!$('#v13ComboCallout')){const c=document.createElement('div');c.id='v13ComboCallout';c.className='v13-combo-callout';c.innerHTML='<b>CHAIN</b><strong>×0</strong><small>KEEP FIRING</small>';battle.appendChild(c)}
  if(!$('#v13TeamStrip')){const t=document.createElement('div');t.id='v13TeamStrip';t.className='v13-team-strip';t.innerHTML='<span>TEAM SYNC</span><i><b id="v13TeamFill"></b></i><strong id="v13TeamText">READY</strong>';battle.appendChild(t)}
  if(!$('#v13ActionTower')){const tower=document.createElement('div');tower.id='v13ActionTower';tower.className='v13-action-tower';const head=document.createElement('div');head.className='v13-tower-head';head.textContent='TACTICAL';tower.appendChild(head);tower.append(button('LOCK ON','lock','◎'));tower.append(button('AUTO FIRE','auto','⌁'));const mode=document.createElement('div');mode.className='v13-cannon-mode';mode.innerHTML='<small>CANNON MODE</small>';mode.append(button('PULSE','gun0','⚡'),button('SPREAD','gun1','✹'),button('RAIL','gun2','🔱'));tower.appendChild(mode);battle.appendChild(tower);tower.addEventListener('click',e=>{const b=e.target.closest('[data-v13-action]');if(b)runAction(b.dataset.v13Action)})}
  if(!$('#v13Hotkeys')){const h=document.createElement('div');h.id='v13Hotkeys';h.className='v13-hotkeys';h.textContent='1–3 CANNON  ·  Q LOCK  ·  E AUTO  ·  [ ] BET  ·  Z/X/C/V SURGE';battle.appendChild(h)}
}
function runAction(action){if(action==='lock')return $('#lockBtn')?.click();if(action==='auto')return $('#autoBtn')?.click();if(/^gun[0-2]$/.test(action))return window.switchGun?.(Number(action.at(-1)))}
function gameOpen(){return game.classList.contains('on')}
function activeInput(){const a=document.activeElement;return !!a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable)}
function pulseReticle(){const r=$('#v13Reticle');if(!r)return;r.classList.remove('blast');void r.offsetWidth;r.classList.add('blast')}
function setReticle(e){const r=$('#v13Reticle'),rect=battle.getBoundingClientRect();if(!r||!rect.width||!rect.height)return;const x=Math.max(0,Math.min(rect.width,e.clientX-rect.left)),y=Math.max(0,Math.min(rect.height,e.clientY-rect.top));r.style.setProperty('--rx',`${x}px`);r.style.setProperty('--ry',`${y}px`);r.classList.add('tracking')}
battle.addEventListener('pointermove',setReticle,{passive:true});
battle.addEventListener('pointerdown',e=>{setReticle(e);pulseReticle()},{passive:true});
battle.addEventListener('pointerleave',()=>$('#v13Reticle')?.classList.remove('tracking'),{passive:true});
window.addEventListener('keydown',e=>{if(!gameOpen()||activeInput()||e.altKey||e.ctrlKey||e.metaKey)return;const k=e.key.toLowerCase();if(['1','2','3'].includes(k)){e.preventDefault();window.switchGun?.(Number(k)-1);return}if(k==='q'){e.preventDefault();$('#lockBtn')?.click();return}if(k==='e'){e.preventDefault();$('#autoBtn')?.click();return}if(k==='['){e.preventDefault();window.betStep?.(-1);return}if(k===']'){e.preventDefault();window.betStep?.(1);return}const powers={z:'nuke',x:'lightning',c:'freeze',v:'bomb'};if(powers[k]){e.preventDefault();window.power?.(powers[k])}});
const numberFrom=(el,fallback=0)=>{const n=Number(String(el?.textContent||'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:fallback};
function bossRatio(){const fill=$('#bossHP'),bar=fill?.parentElement;if(!fill||!bar)return 0;const fw=parseFloat(getComputedStyle(fill).width)||0,bw=parseFloat(getComputedStyle(bar).width)||0;return bw?Math.max(0,Math.min(1,fw/bw)):0}
function bossLive(){return String($('#bossText')?.textContent||'').trim()!=='INCOMING'}
function comboTier(combo){if(combo>=50)return['MYTHIC','LEGENDARY HIT'];if(combo>=25)return['LEGENDARY','CHAIN SURGE'];if(combo>=10)return['HOT STREAK','KEEP FIRING'];return['CHAIN','KEEP FIRING']}
let lastTier='';
function syncCinematicHud(){
  installCinematicChrome();
  const state=window.__FSA_GAME_TEST__?.getState?.()||{};
  const roomNo=Math.max(0,Math.min(2,Number(state.room??shadow.room)||0));
  const level=[5,10,15][roomNo],mult=[2,4,8][roomNo];
  const levelEl=$('#v13BossLevel'),multEl=$('#v13BossMult'),phaseEl=$('#v13BossPhase');if(levelEl)levelEl.textContent=`LV ${level}`;if(multEl)multEl.textContent=`×${mult}`;
  const live=bossLive(),ratio=bossRatio();let phase='HUNT';if(live)phase=ratio>.66?'PHASE I':ratio>.33?'PHASE II':'ENRAGED';if(phaseEl)phaseEl.textContent=phase;
  battle.classList.toggle('v13-boss-live',live);battle.classList.toggle('v13-boss-enraged',live&&ratio<=.33);$('#v13EventStamp')?.classList.toggle('on',live);
  const combo=numberFrom($('#combo'));const [tier,sub]=comboTier(combo),callout=$('#v13ComboCallout');if(callout){callout.querySelector('b').textContent=tier;callout.querySelector('strong').textContent=`×${combo}`;callout.querySelector('small').textContent=sub;callout.classList.toggle('on',combo>=10)}if(tier!==lastTier&&combo>=10){lastTier=tier;callout?.classList.remove('pop');void callout?.offsetWidth;callout?.classList.add('pop')}if(combo<10)lastTier='';
  const fever=numberFrom($('#feverPct'));battle.classList.toggle('v13-fever',fever>=100);
  const fishCount=Number(window.__FSA_GAME_TEST__?.getFishCount?.()??state.fish?.length??0)||0;const sync=Math.max(4,Math.min(100,Math.round(combo*1.6+fishCount*1.5+(live?14:0))));const teamFill=$('#v13TeamFill'),teamText=$('#v13TeamText');if(teamFill)teamFill.style.width=`${sync}%`;if(teamText)teamText.textContent=sync>=85?'OVERDRIVE':sync>=55?'LINKED':sync>=25?'BUILDING':'READY';
  const timeText=String($('#timeLeft')?.textContent||'');const m=timeText.match(/(\d+):(\d+)/),seconds=m?(Number(m[1])*60+Number(m[2])):999;game.classList.toggle('v13-time-critical',seconds<=30);
  const actionTower=$('#v13ActionTower');if(actionTower){actionTower.querySelector('[data-v13-action="lock"]')?.classList.toggle('on',$('#lockBtn')?.classList.contains('on'));actionTower.querySelector('[data-v13-action="auto"]')?.classList.toggle('on',$('#autoBtn')?.classList.contains('on'));const gunName=String($('#youGun')?.textContent||'').toLowerCase();const active=gunName.includes('spread')?1:gunName.includes('rail')?2:0;for(let i=0;i<3;i++)actionTower.querySelector(`[data-v13-action="gun${i}"]`)?.classList.toggle('on',i===active)}
}
installCinematicChrome();syncCinematicHud();
const observer=new MutationObserver(syncCinematicHud);for(const target of [$('#bossHP'),$('#bossText'),$('#combo'),$('#feverPct'),$('#timeLeft'),$('#youGun')])if(target)observer.observe(target,{attributes:true,childList:true,subtree:true,characterData:true});
const syncTimer=setInterval(()=>{if(gameOpen())syncCinematicHud()},500);window.addEventListener('pagehide',()=>clearInterval(syncTimer),{once:true});
window.__FSA_CINEMATIC_UI__={version:'v13',refresh:syncCinematicHud,getStatus:()=>({open:gameOpen(),room:shadow.room,game:shadow.game,phase:$('#v13BossPhase')?.textContent||'',team:$('#v13TeamText')?.textContent||'',lite:cinematicLite})};
})();
