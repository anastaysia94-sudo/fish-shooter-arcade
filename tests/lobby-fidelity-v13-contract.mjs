import { readFile } from 'node:fs/promises';

const read = p => readFile(p,'utf8');
const [css,cloud,sw,bridge,capture] = await Promise.all([
  read('lobby-fidelity-v13.css'),
  read('cloud-sync-v11.css'),
  read('sw.js'),
  read('arcade-intensity-v12-bridge.js'),
  read('tests/visual-acceptance-capture.mjs'),
]);
const need=(ok,msg)=>{if(!ok)throw new Error(msg)};

need(cloud.trimStart().startsWith("@import url('lobby-fidelity-v13.css');"),'Lobby fidelity stylesheet must be imported before cloud-sync rules.');
need(bridge.includes("root.dataset.cinematic='v13'"),'Cinematic v13 activation marker missing.');
need(bridge.includes("root.dataset.cinematicLite='1'"),'Lite/2G cinematic marker missing.');
need(bridge.includes('saveData') && bridge.includes('slow-)?2g'),'Cinematic Lite detection must retain Save-Data and 2G detection.');

for(const marker of [
  'html[data-vf="v10"][data-cinematic="v13"] .v8-topart',
  'html[data-vf="v10"][data-cinematic="v13"] .hero-card',
  'html[data-vf="v10"][data-cinematic="v13"] .promo-card.jackpot',
  'html[data-vf="v10"][data-cinematic="v13"] .promo-card.fever',
  '@media(max-width:560px)',
  "url('assets/fsa-lobby.svg')",
  "url('assets/fsa-gameplay.svg')",
  "url('assets/fsa-boss-event.svg')",
]) need(css.includes(marker),`Missing lobby fidelity marker: ${marker}`);

const hdStart=css.indexOf('/* HD art only for capable connections.');
const liteStart=css.indexOf('/* Explicit Lite/2G winners:');
need(hdStart>=0 && liteStart>hdStart,'HD/Lite capability sections are missing or out of order.');
const hd=css.slice(hdStart,liteStart);
const lite=css.slice(liteStart);
need(hd.includes(':not([data-cinematic-lite="1"])'),'HD art must be excluded from cinematic Lite documents.');
for(const asset of ['reef-run-hd-battle.webp','fsa-slots-hd-atlas.webp','fsa-fish-hd-atlas.webp']){
  need((css.match(new RegExp(asset.replaceAll('.','\\.'),'g'))||[]).length===1,`${asset} must appear exactly once.`);
  need(hd.includes(asset),`${asset} must live only in the capable-connection section.`);
  need(!lite.includes(asset),`${asset} leaked into the Lite/2G section.`);
}
need(lite.includes('[data-cinematic-lite="1"] .hero-card'),'Lite hero override missing.');
need(lite.includes("url('assets/fsa-gameplay.svg')"),'Lite hero must retain lightweight gameplay SVG art.');
need(lite.includes("url('assets/fsa-boss-event.svg')"),'Lite jackpot must retain lightweight boss SVG art.');
need(lite.includes("url('assets/fsa-lobby.svg')"),'Lite Fever card must retain lightweight lobby SVG art.');

need(sw.includes("'./lobby-fidelity-v13.css'"),'Offline CORE shell must cache lobby-fidelity-v13.css.');
need(sw.includes('lobby-fidelity-v13\\.css'),'Lobby fidelity stylesheet must be network-first/fresh in installed PWAs.');
const cacheVersion=Number(sw.match(/const CACHE='fsa-arcade-v(\d+)-/)?.[1]||0);
need(cacheVersion>=19,'Service-worker cache version must remain at or beyond the lobby-fidelity release.');

for(let i=1;i<=12;i++) need(capture.includes(`,${i}`)||capture.includes(`item:${i}`)||capture.includes(`item: ${i}`),`Visual acceptance harness lost item ${i}.`);
need(capture.includes('02-android-portrait-lobby'),'Portrait lobby capture is required.');
need(capture.includes('11-lite-2g-mode'),'Lite/2G capture is required.');

console.log('FSA_LOBBY_FIDELITY_V13=PASS premium=1 lite_2g_guard=1 offline=1 visual_acceptance=12');
