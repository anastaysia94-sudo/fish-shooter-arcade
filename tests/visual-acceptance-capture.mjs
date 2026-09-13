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

try{
  {const {c,p}=await page(1600,1000);await go(p);await p.waitForSelector('#fishGrid .lib-card');await snap(p,'01-desktop-main-lobby',1);await c.close()}
  {const {c,p}=await page(412,915,true);await go(p);await snap(p,'02-android-portrait-lobby',2);await c.close()}
  {const {c,p}=await page(915,412,true);await go(p);await openGame(p,0);await snap(p,'03-android-landscape-reef-run',3);await c.close()}
  {
    const a=await page(1366,768),b=await page(1366,768);await Promise.all([go(a.p),go(b.p)]);await Promise.all([a.p.evaluate(()=>{Math.random=()=>0}),b.p.evaluate(()=>{Math.random=()=>0})]);await Promise.all([openGame(a.p,0),openGame(b.p,1)]);
    const wait=p=>p.waitForFunction(()=>document.querySelector('#bossText')?.textContent?.trim()!=='INCOMING',null,{timeout:28000});await Promise.all([wait(a.p),wait(b.p)]);await Promise.all([snap(a.p,'04-reef-run-boss-phase',4),snap(b.p,'05-dragon-depths-boss-phase',5)]);await a.c.close();await b.c.close();
  }
  {const {c,p}=await page(1366,768);await go(p);await openGame(p,11,2);await p.waitForTimeout(7000);await snap(p,'06-crowded-coral-chaos',6);await c.close()}
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

// Release-gate touchpoint: this file is intentionally part of PR path filters.
