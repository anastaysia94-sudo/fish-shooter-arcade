import { chromium } from 'playwright';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = new URL((process.argv[2] || process.env.FSA_BASE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/'));
const out = resolve('artifacts/visual-acceptance');
await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true});
const browser = await chromium.launch({headless:true});
const rows=[];
const ua='Mozilla/5.0 (Linux; Android 16; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Mobile Safari/537.36';

async function page(width,height,mobile=false,low=false){
  const c=await browser.newContext({viewport:{width,height},screen:{width,height},isMobile:mobile,hasTouch:mobile,userAgent:mobile?ua:undefined});
  if(low) await c.addInitScript(()=>{const v={saveData:true,effectiveType:'2g',downlink:.25,rtt:900,addEventListener(){},removeEventListener(){}};for(const k of ['connection','mozConnection','webkitConnection'])try{Object.defineProperty(navigator,k,{get:()=>v})}catch{};try{Object.defineProperty(navigator,'deviceMemory',{get:()=>2})}catch{};try{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2})}catch{}});
  return {c,p:await c.newPage()};
}
async function go(p,path=''){await p.goto(new URL(path,base).toString(),{waitUntil:'domcontentloaded',timeout:45000});await p.waitForTimeout(700)}
async function snap(p,name,item,meta={}){await p.screenshot({path:resolve(out,`${name}.png`),animations:'disabled'});rows.push({item,name,file:`${name}.png`,...meta})}
async function openGame(p,i,r=1){await p.waitForFunction(()=>typeof window.openGame==='function');await p.evaluate(({i,r})=>{window.openGame(i);window.chooseRoom(r)},{i,r});await p.waitForSelector('#game.on');await p.waitForTimeout(700)}
async function waitForVisibleBoss(p){
  await p.waitForFunction(()=>{
    const canvas=document.querySelector('#battleCanvas');
    const dots=[...document.querySelectorAll('#radar .dot')];
    if(!canvas||!dots.length)return false;
    const boss=dots.find(d=>getComputedStyle(d).backgroundColor==='rgb(255, 64, 88)');
    if(!boss)return false;
    const left=parseFloat(boss.style.left),top=parseFloat(boss.style.top);
    if(!Number.isFinite(left)||!Number.isFinite(top)||left<=20||left>=72||top<=14||top>=86)return false;
    const x=(left-8)/84*(canvas.width||1280),y=(top-8)/84*(canvas.height||720);
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)return false;
    const r=150,x0=Math.max(0,Math.floor(x-r)),y0=Math.max(0,Math.floor(y-r));
    const w=Math.max(1,Math.min(canvas.width-x0,r*2)),h=Math.max(1,Math.min(canvas.height-y0,r*2));
    const data=ctx.getImageData(x0,y0,w,h).data;
    let bright=0;
    for(let py=0;py<h;py+=4)for(let px=0;px<w;px+=4){const i=(py*w+px)*4,R=data[i],G=data[i+1],B=data[i+2],A=data[i+3],hi=Math.max(R,G,B),lo=Math.min(R,G,B);if(A>200&&hi>175&&hi-lo>45)bright++}
    return bright>=180;
  },null,{timeout:50000});
  return p.evaluate(()=>{const boss=[...document.querySelectorAll('#radar .dot')].find(d=>getComputedStyle(d).backgroundColor==='rgb(255, 64, 88)');return boss?{radarLeft:parseFloat(boss.style.left),radarTop:parseFloat(boss.style.top)}:null});
}
async function visibleTargetCount(p){
  return p.evaluate(()=>[...document.querySelectorAll('#radar .dot')].filter(d=>{
    if(getComputedStyle(d).backgroundColor==='rgb(255, 64, 88)')return false;
    const left=parseFloat(d.style.left),top=parseFloat(d.style.top);
    return Number.isFinite(left)&&Number.isFinite(top)&&left>10&&left<90&&top>10&&top<90;
  }).length);
}
async function snapAtTargetDensity(p,name,item,minVisible=18){
  const deadline=Date.now()+60000;
  while(Date.now()<deadline){
    const remaining=Math.max(1000,deadline-Date.now());
    await p.waitForFunction(min=>[...document.querySelectorAll('#radar .dot')].filter(d=>{
      if(getComputedStyle(d).backgroundColor==='rgb(255, 64, 88)')return false;
      const left=parseFloat(d.style.left),top=parseFloat(d.style.top);
      return Number.isFinite(left)&&Number.isFinite(top)&&left>10&&left<90&&top>10&&top<90;
    }).length>=min,minVisible,{timeout:remaining});
    const before=await visibleTargetCount(p);
    if(before<minVisible)continue;
    await p.screenshot({path:resolve(out,`${name}.png`),animations:'disabled'});
    const after=await visibleTargetCount(p);
    if(after>=minVisible){
      rows.push({item,name,file:`${name}.png`,visibleTargets:Math.min(before,after),visibleTargetsBefore:before,visibleTargetsAfter:after,minVisibleTargets:minVisible});
      return;
    }
  }
  throw new Error(`Target density did not remain at ${minVisible}+ through capture`);
}

try{
  {const {c,p}=await page(1600,1000);await go(p);await p.waitForSelector('#fishGrid .lib-card');await snap(p,'01-desktop-main-lobby',1);await c.close()}
  {const {c,p}=await page(412,915,true);await go(p);await snap(p,'02-android-portrait-lobby',2);await c.close()}
  {const {c,p}=await page(915,412,true);await go(p);await openGame(p,0);await snap(p,'03-android-landscape-reef-run',3);await c.close()}
  {
    const a=await page(1366,768);await go(a.p);await a.p.evaluate(()=>{Math.random=()=>0});await openGame(a.p,0);const reefBoss=await waitForVisibleBoss(a.p);await snap(a.p,'04-reef-run-boss-phase',4,{bossVisible:true,...reefBoss});await a.c.close();
    const b=await page(1366,768);await go(b.p);await b.p.evaluate(()=>{Math.random=()=>0});await openGame(b.p,1);const dragonBoss=await waitForVisibleBoss(b.p);await snap(b.p,'05-dragon-depths-boss-phase',5,{bossVisible:true,...dragonBoss});await b.c.close();
  }
  {const {c,p}=await page(1366,768);await go(p);await openGame(p,11,2);await snapAtTargetDensity(p,'06-crowded-coral-chaos',6,18);await c.close()}
  {const {c,p}=await page(1366,768);await go(p);await openGame(p,0);for(const [i,n] of [[0,'pulse'],[1,'spread'],[2,'rail']]){await p.evaluate(x=>window.switchGun(x),i);await p.waitForTimeout(250);await snap(p,`07-${n}-mode`,7,{mode:n})}await c.close()}
  {const {c,p}=await page(1440,900);await go(p);await p.locator('#worlds').scrollIntoViewIfNeeded();await p.waitForTimeout(250);await snap(p,'08-room-selection',8);await c.close()}
  {const {c,p}=await page(1440,900);await go(p);await p.locator('#slots').scrollIntoViewIfNeeded();await p.waitForTimeout(250);await snap(p,'09-slot-lobby',9);await c.close()}
  {const {c,p}=await page(1366,768);await go(p);await p.waitForFunction(()=>typeof window.openSlot==='function');await p.evaluate(()=>{window.openSlot(0);document.querySelectorAll('.reel').forEach(x=>x.textContent='7');const e=document.querySelector('#slotResult');if(e)e.textContent='JACKPOT FEATURE · FIVE-REEL QA STATE'});await p.waitForSelector('#slotModal.on');await p.waitForTimeout(350);await snap(p,'10-open-five-reel-feature',10);await c.close()}
  {const {c,p}=await page(915,412,true,true);await go(p);await openGame(p,0,0);const dots=await p.locator('#radar .dot').count();if(dots>10)throw new Error(`Lite mode did not engage: ${dots} radar dots`);await snap(p,'11-lite-2g-mode',11,{radarDots:dots});await c.close()}
  {const {c,p}=await page(412,915,true);await go(p,'admin/');const txt=(await p.locator('body').innerText()).trim();if(!txt)throw new Error('Founder Console mobile view is blank');await snap(p,'12-founder-console-mobile',12);await c.close()}
  for(let i=1;i<=12;i++)if(!rows.some(r=>r.item===i))throw new Error(`Missing acceptance item ${i}`);
  await writeFile(resolve(out,'manifest.json'),JSON.stringify({schema:'fsa.visual-acceptance.v1',baseUrl:base.toString(),generatedAt:new Date().toISOString(),acceptanceItems:12,screenshots:rows},null,2));
  console.log(`FSA_VISUAL_ACCEPTANCE_CAPTURE=PASS items=12 screenshots=${rows.length}`);
}finally{await browser.close()}
