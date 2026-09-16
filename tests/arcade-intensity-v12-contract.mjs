import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html');
const js=read('arcade-intensity-v12.js');
const css=read('arcade-intensity-v12.css');
const bridge=read('arcade-intensity-v12-bridge.js');
const sw=read('sw.js');

for(const asset of ['arcade-intensity-v12.css','arcade-intensity-v12.js','arcade-intensity-v12-bridge.js']){
  assert(index.includes(asset),`index must load ${asset}`);
  assert(sw.includes(`./${asset}`),`service worker must cache ${asset}`);
}
assert(index.indexOf('arcade-intensity-v12.js')>index.indexOf('fsa-v9.js'),'v12 engine must layer after v9');
assert(index.indexOf('arcade-intensity-v12-bridge.js')>index.indexOf('cloud-sync-v11.js'),'cloud bridge must execute after cloud-sync source in defer order');

for(const name of ['Reef Run','Dragon Depths',"Pirate's Plunder",'Atlantis Rising','Ice Tide','Lava Reef','Storm Seas','Jade Dragon','Neon Ocean','Ancient Ruins','Mecha Marine','Coral Chaos',"Kraken's Lair",'Treasure Trials','Boss Rush']){
  assert(js.includes(`name:'${name.replaceAll("'","\\'")}'`)||js.includes(`name:"${name}"`)||js.includes(`name:${JSON.stringify(name)}`),`v12 theme missing ${name}`);
}
for(const feature of ['spawnFormation','spawnBoss','updateShots','coinBurst','screenFlash','bossPulse','OCEAN FEVER','AUTO ARMED','LOCK ARMED','navigator.vibrate','pierce:g.key===\'rail\'?4:1']) assert(js.includes(feature),`v12 gameplay feature missing ${feature}`);
for(const species of ['Chain Ray','Vortex Jelly','Chrome Shark','Bomb Crab','Arc Eel','Drill Marlin','Royal Leviathan']) assert(js.includes(species),`v12 species missing ${species}`);
for(const gun of ['Pulse Cannon','Spread Blaster','Rail Harpoon']) assert(js.includes(gun),`v12 gun missing ${gun}`);
for(const room of ['Bronze Reef','Silver Current','Gold Abyss']) assert(js.includes(room),`v12 room missing ${room}`);
assert(js.includes('S.bossClock=S.game===14?8:12+Math.random()*10'),'normal tables must surface the first boss quickly enough to keep arcade pacing intense');
assert(js.includes('if(s.trail.length>(LOW?5:10))s.trail.shift()'),'projectile trail cap must preserve a visible multi-frame trail');
assert(js.includes("if($('#rightToggle'))$('#rightToggle').onclick=()=>$('#rightHud')?.classList.toggle('open')"),'right HUD toggle must stay interactive');
assert(js.includes('const LOW='),'v12 must preserve low-data/constrained-device mode');
assert(css.includes('prefers-reduced-motion'),'v12 CSS must preserve reduced-motion handling');
assert(css.includes('data-intensity="v12"'),'v12 CSS must remain scoped');
assert(bridge.includes('__FSA_GAME_TEST__'),'bridge must preserve cloud runtime hooks');
assert(bridge.includes('seedIntensityProfile'),'bridge must seed v12 from cloud/legacy profile authority before fish play');
assert(bridge.includes('shadow.game')&&bridge.includes('shadow.room'),'bridge must report current v12 game/room to cloud sync');

// Cinematic v13 is a local UI/gameplay-control enhancement layered inside the existing bridge.
for(const marker of ["cinematic:'v13'",'__FSA_CINEMATIC_UI__','v13ActionTower','v13Reticle','v13TeamStrip','v13ComboCallout','v13BossMeta','data-cinematic-lite']){
  assert(bridge.includes(marker),`cinematic v13 marker missing ${marker}`);
}
for(const marker of ["k==='q'","k==='e'","window.switchGun?.(Number(k)-1)","window.betStep?.(-1)","window.betStep?.(1)","z:'nuke'","x:'lightning'","c:'freeze'","v:'bomb'"]){
  assert(bridge.includes(marker),`cinematic v13 control binding missing ${marker}`);
}
assert(bridge.includes("$('#lockBtn')?.click()")&&bridge.includes("$('#autoBtn')?.click()"),'cinematic controls must reuse canonical lock/auto authority and confirmation semantics');
assert(bridge.includes('@media(max-width:760px)'),'cinematic v13 must preserve a phone layout');
assert(bridge.includes('@media(max-height:520px) and (orientation:landscape)'),'cinematic v13 must preserve short landscape play');
assert(bridge.includes('@media(prefers-reduced-motion:reduce)'),'cinematic v13 must preserve reduced-motion behavior');
assert(!/fetch\s*\(/.test(bridge),'cinematic v13 bridge must remain local-first without fetch');
assert(!js.includes('Fire Kirin'),'runtime must remain original and not embed competitor branding');

console.log('FSA_ARCADE_INTENSITY_V12_CONTRACT=PASS cinematic_v13=PASS');
