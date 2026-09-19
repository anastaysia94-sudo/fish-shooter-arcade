import { chromium } from 'playwright';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = new URL((process.argv[2] || process.env.FSA_BASE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/'));
const out = resolve('artifacts/visual-acceptance');
await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true});
const browser = await chromium.launch({headless:true,args:['--no-proxy-server']});
const rows=[];
const ua='Mozilla/5.0 (Linux; Android 16; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Mobile Safari/537.36';
const lobbyPoll={timeout:120000,polling:250};

async function page(width,height,mobile=false,low=false){
  const c=await browser.newContext({viewport:{width,height},screen:{width,height},isMobile:mobile,hasTouch:mobile,userAgent:mobile?ua:undefined,serviceWorkers:'block'});
  if(low) await c.addInitScript(()=>{const v={saveData:true,effectiveType:'2g',downlink:.25,rtt:900,addEventListener(){},removeEventListener(){}};for(const k of ['connection','mozConnection','webkitConnection'])try{Object.defineProperty(navigator,k,{get:()=>v})}catch{};try{Object.defineProperty(navigator,'deviceMemory',{get:()=>2})}catch{};try{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2})}catch{}});
  const p=await c.newPage();
  p.setDefaultTimeout(45000);
  p.setDefaultNavigationTimeout(45000);
  p.on('pageerror',error=>console.error(`FSA_BROWSER_PAGEERROR ${error.message}`));
  p.on('requestfailed',request=>console.error(`FSA_BROWSER_REQUEST_FAILED ${request.method()} ${request.url()} ${request.failure()?.errorText||''}`));
  return {c,p};
}
async function go(p,path=''){
  const url=new URL(path,base).toString();
  let lastError;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response=await p.goto(url,{waitUntil:'commit',timeout:45000});
      if(response&&!response.ok())throw new Error(`navigation returned HTTP ${response.status()}`);
      // Every capture path has its own domain-specific readiness gate below.
      // Avoid a redundant generic body/document-ready wait here: Chromium can
      // have committed and rendered the shell while heavy game startup keeps
      // Playwright's injected readiness checks from being scheduled promptly.
      await p.waitForTimeout(500);
      return;
    }catch(error){
      lastError=error;
      console.error(`FSA_BROWSER_NAV_RETRY attempt=${attempt} url=${url} error=${error.message}`);
      if(attempt<3){
        try{await p.goto('about:blank',{waitUntil:'commit',timeout:5000})}catch{}
        await p.waitForTimeout(750*attempt);
      }
    }
  }
  throw lastError;
}
async function waitForLobbyReady(p){
  // Explicit interval polling avoids Playwright's default requestAnimationFrame
  // poller, which can stall in a headless idle lobby even when the exact runtime
  // is fully served and loaded. Acceptance criteria remain unchanged.
  await p.waitForFunction(()=>typeof window.openGame==='function'&&typeof window.openSlot==='function'&&document.querySelectorAll('#fishGrid .lib-card').length===15&&document.querySelectorAll('#slotGrid .slot-card').length===20,null,lobbyPoll);
  return p.evaluate(()=>({fishCards:document.querySelectorAll('#fishGrid .lib-card').length,slotCards:document.querySelectorAll('#slotGrid .slot-card').length,openGame:typeof window.openGame,openSlot:typeof window.openSlot,readyState:document.readyState,serviceWorkerController:!!navigator.serviceWorker?.controller,renderGovernor:window.__FSA_LOBBY_RENDER_GOVERNOR__?.version||null,denseUi:document.documentElement.dataset.denseUi||null,denseGraphics:document.documentElement.dataset.denseGraphics||null}));
}
async function snap(p,name,item,meta={}){await p.screenshot({path:resolve(out,`${name}.png`),animations:'disabled'});rows.push({item,name,file:`${name}.png`,...meta})}
async function openGame(p,i,r=1){await p.waitForFunction(()=>typeof window.openGame==='function'&&typeof window.chooseRoom==='function',null,lobbyPoll);await p.evaluate(({i,r})=>{window.openGame(i);window.chooseRoom(r)},{i,r});await p.waitForSelector('#game.on',{timeout:60000});await p.waitForTimeout(700)}
async function forceBossIntoView(p){
  const spawned=await p.evaluate(()=>{
    const api=(window.__FSA_INTENSITY_V12_TEST__||window.__FSA_GAME_TEST__);
    if(typeof api?.spawnBossForTest!=='function')return null;
    const boss=api.spawnBossForTest();
    return boss?{x:Number(boss.x),y:Number(boss.y),hp:Number(boss.hp),max:Number(boss.max)}:null;
  });
  if(!spawned)throw new Error('Current runtime did not expose or create the deterministic QA boss');
}
async function waitForVisibleBoss(p){
  await forceBossIntoView(p);
  await p.waitForTimeout(350);
  const state=await p.evaluate(()=>{
    const boss=(window.__FSA_INTENSITY_V12_TEST__||window.__FSA_GAME_TEST__)?.getState?.()?.boss||null;
    const hud=(document.querySelector('#bossText')?.textContent||'').trim();
    const width=parseFloat(document.querySelector('#bossHP')?.style.width||'0');
    const radarBoss=document.querySelector('#radar .dot[data-kind="boss"]');
    const dense=window.__FSA_DENSE_GRAPHICS_V15__?.status?.()||null;
    return {
      boss:boss?{x:Number(boss.x),y:Number(boss.y),hp:Number(boss.hp),max:Number(boss.max)}:null,
      hud,
      hpWidth:width,
      semanticRadarBoss:!!radarBoss,
      denseBossVisible:!!dense?.bossVisible
    };
  });
  const valid=!!state.boss&&state.boss.hp>0&&state.boss.x>140&&state.boss.x<1140&&state.boss.y>80&&state.boss.y<640&&/\d+\s*\/\s*\d+/.test(state.hud.replaceAll(',',''))&&Number.isFinite(state.hpWidth)&&state.hpWidth>0&&state.semanticRadarBoss;
  if(!valid)throw new Error(`Boss visual state did not become valid: ${JSON.stringify(state)}`);
  return {bossX:state.boss.x,bossY:state.boss.y,bossHp:state.boss.hp,bossMaxHp:state.boss.max,denseBossVisible:state.denseBossVisible,semanticRadarBoss:state.semanticRadarBoss};
}
async function visibleTargetCount(p){
  return p.evaluate(()=>{
    const fish=(window.__FSA_INTENSITY_V12_TEST__||window.__FSA_GAME_TEST__)?.getState?.()?.fish||[];
    return fish.filter(f=>!f.boss&&Number.isFinite(Number(f.x))&&Number.isFinite(Number(f.y))&&Number(f.x)>40&&Number(f.x)<1240&&Number(f.y)>40&&Number(f.y)<680).length;
  });
}
async function forceVisibleTargetDensity(p,minVisible=18){
  await p.evaluate(min=>{
    const api=window.__FSA_INTENSITY_V12_TEST__||window.__FSA_GAME_TEST__;
    if(typeof api?.forceVisibleTargetsForTest==='function')return api.forceVisibleTargetsForTest(min);
    const fish=(api?.getState?.()?.fish||[]).filter(f=>!f.boss).slice(0,min);
    fish.forEach((f,i)=>{f.x=120+(i%6)*190;f.y=110+Math.floor(i/6)*190;f.vx=0;f.vy=0});
    return fish.length;
  },minVisible);
}
async function snapAtTargetDensity(p,name,item,minVisible=18){
  await forceVisibleTargetDensity(p,minVisible);
  const deadline=Date.now()+15000;
  while(Date.now()<deadline){
    const remaining=Math.max(1000,deadline-Date.now());
    await p.waitForFunction(min=>{
      const fish=(window.__FSA_INTENSITY_V12_TEST__||window.__FSA_GAME_TEST__)?.getState?.()?.fish||[];
      return fish.filter(f=>!f.boss&&Number.isFinite(Number(f.x))&&Number.isFinite(Number(f.y))&&Number(f.x)>40&&Number(f.x)<1240&&Number(f.y)>40&&Number(f.y)<680).length>=min;
    },minVisible,{timeout:remaining});
    const before=await visibleTargetCount(p);
    if(before<minVisible)continue;
    await p.screenshot({path:resolve(out,`${name}.png`),animations:'disabled'});
    const after=await visibleTargetCount(p);
    rows.push({item,name,file:`${name}.png`,visibleTargetsAtCaptureGate:before,visibleTargetsAfter:after,minVisibleTargets:minVisible});
    return;
  }
  throw new Error(`Target density did not reach ${minVisible}+ before capture`);
}
async function verifySlotLobby(p){
  const qa=await p.evaluate(()=>{
    const cards=[...document.querySelectorAll('#slotGrid .slot-card')];
    const states=cards.map(card=>{
      const cs=getComputedStyle(card),symbols=card.querySelector('.slot-symbols'),ss=symbols?getComputedStyle(symbols):null;
      const layers=cs.backgroundSize.split(',').map(x=>x.trim());
      const atlasLayer=layers[1]||'';
      return {
        atlas:cs.backgroundImage.includes('fsa-slot-atlas-v10.svg'),
        clipped:cs.overflowX==='hidden'&&cs.overflowY==='hidden',
        symbolsHidden:!!ss&&ss.opacity==='0'&&ss.visibility==='hidden',
        atlasWidthSized:atlasLayer.startsWith('2000%')&&!/\s100%$/i.test(atlasLayer),
        atlasLayer,
        position:cs.backgroundPosition,
        size:cs.backgroundSize,
        width:card.getBoundingClientRect().width,
        height:card.getBoundingClientRect().height
      };
    });
    return {
      slotCards:cards.length,
      atlasCards:states.filter(x=>x.atlas).length,
      clippedCards:states.filter(x=>x.clipped).length,
      hiddenLegacySymbolCards:states.filter(x=>x.symbolsHidden).length,
      widthSizedAtlasCards:states.filter(x=>x.atlasWidthSized).length,
      distinctAtlasPositions:new Set(states.map(x=>x.position)).size,
      distinctAtlasSizes:new Set(states.map(x=>x.size)).size,
      sampleAtlasLayers:[...new Set(states.map(x=>x.atlasLayer))].slice(0,5),
      measurableCards:states.filter(x=>x.width>40&&x.height>80).length
    };
  });
  if(qa.slotCards!==20)throw new Error(`Slot lobby expected 20 cards, found ${qa.slotCards}`);
  if(qa.atlasCards!==20)throw new Error(`Slot lobby atlas missing on ${20-qa.atlasCards} cards`);
  if(qa.clippedCards!==20)throw new Error(`Slot lobby clipping missing on ${20-qa.clippedCards} cards`);
  if(qa.hiddenLegacySymbolCards!==20)throw new Error(`Legacy slot symbols remain visible on ${20-qa.hiddenLegacySymbolCards} cards`);
  if(qa.widthSizedAtlasCards!==20)throw new Error(`Slot atlas width semantics missing on ${20-qa.widthSizedAtlasCards} cards; sample=${JSON.stringify(qa.sampleAtlasLayers)}`);
  if(qa.distinctAtlasPositions!==20)throw new Error(`Slot lobby expected 20 distinct atlas positions, found ${qa.distinctAtlasPositions}`);
  if(qa.measurableCards!==20)throw new Error(`Slot lobby contains collapsed cards`);
  return qa;
}

try{
  {const {c,p}=await page(1600,1000);await go(p);const ready=await waitForLobbyReady(p);await snap(p,'01-desktop-main-lobby',1,{runtimeReady:ready});await c.close()}
  {const {c,p}=await page(412,915,true);await go(p);const ready=await waitForLobbyReady(p);await snap(p,'02-android-portrait-lobby',2,{runtimeReady:ready});await c.close()}
  {const {c,p}=await page(915,412,true);await go(p);await openGame(p,0);const landscapeQa=await p.evaluate(()=>{const battle=document.querySelector('.battle')?.getBoundingClientRect(),left=document.querySelector('#leftHud')?.getBoundingClientRect(),right=document.querySelector('#rightHud')?.getBoundingClientRect(),tower=document.querySelector('.v13-action-tower')?.getBoundingClientRect();return{viewportWidth:innerWidth,battleWidth:battle?.width||0,battleRatio:battle?.width/innerWidth||0,leftHudOffscreen:!!left&&left.right<=1,rightHudOffscreen:!!right&&right.left>=innerWidth-1,actionTowerFits:!tower||(tower.left>=0&&tower.right<=innerWidth)}});if(landscapeQa.battleRatio<.88)throw new Error(`Landscape battlefield too narrow: ${JSON.stringify(landscapeQa)}`);if(!landscapeQa.leftHudOffscreen||!landscapeQa.rightHudOffscreen)throw new Error(`Landscape HUDs must start collapsed as overlays: ${JSON.stringify(landscapeQa)}`);if(!landscapeQa.actionTowerFits)throw new Error(`Landscape tactical tower clips viewport: ${JSON.stringify(landscapeQa)}`);await snap(p,'03-android-landscape-reef-run',3,landscapeQa);await c.close()}
  {
    const a=await page(1366,768);await go(a.p);await a.p.evaluate(()=>{Math.random=()=>0});await openGame(a.p,0);const reefBoss=await waitForVisibleBoss(a.p);await snap(a.p,'04-reef-run-boss-phase',4,{bossVisible:true,...reefBoss});await a.c.close();
    const b=await page(1366,768);await go(b.p);await b.p.evaluate(()=>{Math.random=()=>0});await openGame(b.p,1);const dragonBoss=await waitForVisibleBoss(b.p);await snap(b.p,'05-dragon-depths-boss-phase',5,{bossVisible:true,...dragonBoss});await b.c.close();
  }
  {const {c,p}=await page(1366,768);await go(p);await openGame(p,11,2);await snapAtTargetDensity(p,'06-crowded-coral-chaos',6,18);await c.close()}
  {const {c,p}=await page(1366,768);await go(p);await openGame(p,0);for(const [i,n] of [[0,'pulse'],[1,'spread'],[2,'rail']]){await p.evaluate(x=>window.switchGun(x),i);await p.waitForTimeout(250);await snap(p,`07-${n}-mode`,7,{mode:n})}await c.close()}
  {const {c,p}=await page(1440,900);await go(p);await p.locator('#worlds').scrollIntoViewIfNeeded();await p.waitForTimeout(250);await snap(p,'08-room-selection',8);await c.close()}
  {const {c,p}=await page(1440,900);await go(p);await waitForLobbyReady(p);await p.locator('#slots').scrollIntoViewIfNeeded();await p.waitForTimeout(250);await p.screenshot({path:resolve(out,'09-slot-lobby.png'),animations:'disabled'});const slotQa=await verifySlotLobby(p);rows.push({item:9,name:'09-slot-lobby',file:'09-slot-lobby.png',...slotQa});await c.close()}
  {const {c,p}=await page(1366,768);await go(p);await p.waitForFunction(()=>typeof window.openSlot==='function'&&typeof window.spin==='function',null,lobbyPoll);const feature=await p.evaluate(()=>{window.openSlot(0);const n=e=>Number((e?.textContent||'0').replace(/[^0-9.-]/g,''))||0;const before=n(document.querySelector('#slotCoins')),bet=n(document.querySelector('#slotBet')),realRandom=Math.random;try{Math.random=()=>0.65;window.spin()}finally{Math.random=realRandom}const reels=[...document.querySelectorAll('.reel')].map(x=>x.textContent.trim());const after=n(document.querySelector('#slotCoins'));return {engineResolved:true,slotTitle:document.querySelector('#slotTitle')?.textContent?.trim()||'',reelCount:reels.length,reelValues:reels,result:document.querySelector('#slotResult')?.textContent?.trim()||'',bet,beforeCredits:before,afterCredits:after,creditDelta:after-before}});if(feature.reelCount!==5||!feature.reelValues.every(v=>v==='7'))throw new Error(`Real slot feature did not resolve five 7s: ${JSON.stringify(feature.reelValues)}`);if(!/^JACKPOT WIN \+1,500$/.test(feature.result))throw new Error(`Real slot feature result mismatch: ${feature.result}`);if(feature.bet!==100||feature.creditDelta!==1400)throw new Error(`Real slot payout mismatch: bet=${feature.bet} delta=${feature.creditDelta}`);await p.waitForSelector('#slotModal.on');await p.waitForTimeout(250);await snap(p,'10-open-five-reel-feature',10,feature);await c.close()}
  {const {c,p}=await page(915,412,true,true);await go(p);await openGame(p,0,0);const dots=await p.locator('#radar .dot').count();if(dots>10)throw new Error(`Lite mode did not engage: ${dots} radar dots`);await snap(p,'11-lite-2g-mode',11,{radarDots:dots});await c.close()}
  {const {c,p}=await page(412,915,true);await go(p,'admin/');const txt=(await p.locator('body').innerText()).trim();if(!txt)throw new Error('Founder Console mobile view is blank');const founderQa=await p.evaluate(()=>{const h=document.querySelector('.auth-card h1'),keep=h?.querySelector('.keep-together'),card=document.querySelector('.auth-card'),hr=h?.getBoundingClientRect(),kr=keep?.getBoundingClientRect(),cr=card?.getBoundingClientRect(),cs=h?getComputedStyle(h):null;return{title:h?.textContent?.trim()||'',keepTogether:!!keep,keepWhiteSpace:keep?getComputedStyle(keep).whiteSpace:'',titleHeight:hr?.height||0,keepRight:kr?.right||0,cardRight:cr?.right||0,fontSize:cs?parseFloat(cs.fontSize):0,lineHeight:cs?parseFloat(cs.lineHeight):0}});if(!founderQa.keepTogether||founderQa.keepWhiteSpace!=='nowrap')throw new Error(`Founder sign-in phrase can orphan: ${JSON.stringify(founderQa)}`);if(founderQa.keepRight>founderQa.cardRight+1)throw new Error(`Founder sign-in phrase overflows card: ${JSON.stringify(founderQa)}`);await snap(p,'12-founder-console-mobile',12,founderQa);await c.close()}
  for(let i=1;i<=12;i++)if(!rows.some(r=>r.item===i))throw new Error(`Missing acceptance item ${i}`);
  await writeFile(resolve(out,'manifest.json'),JSON.stringify({schema:'fsa.visual-acceptance.v1',baseUrl:base.toString(),generatedAt:new Date().toISOString(),acceptanceItems:12,screenshots:rows},null,2));
  console.log(`FSA_VISUAL_ACCEPTANCE_CAPTURE=PASS items=12 screenshots=${rows.length}`);
}finally{await browser.close()}
