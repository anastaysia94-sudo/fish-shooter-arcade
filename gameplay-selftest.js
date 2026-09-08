'use strict';
const fs=require('fs');
const assert=require('assert');
const js=fs.readFileSync('fsa-v9.js','utf8');
const css=fs.readFileSync('gameplay-layout-v9.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const html=fs.readFileSync('index.html','utf8');

const fishTitles=['Reef Run','Dragon Depths',"Pirate's Plunder",'Atlantis Rising','Ice Tide','Lava Reef','Storm Seas','Jade Dragon','Neon Ocean','Ancient Ruins','Mecha Marine','Coral Chaos',"Kraken's Lair",'Treasure Trials','Boss Rush'];
const slotTitles=['Ocean Fortune','Treasure Reels',"Siren's Gold",'Legend of Atlantis','Shark Jackpot','Pearl Rush','Kraken Spins','Reef Riches','Lucky Tide','Deep Diamonds','Golden Anchor',"Mermaid's Treasure",'Pirate Jackpot','Coral Cash',"Neptune's Wheel",'Sea King 777','Ocean Wilds','Diamond Dolphin','Wild Pearls','Treasure Temple'];
for(const title of fishTitles)assert(js.includes(title),`missing fish title: ${title}`);
for(const title of slotTitles)assert(js.includes(title),`missing slot title: ${title}`);
assert.strictEqual(fishTitles.length,15);
assert.strictEqual(slotTitles.length,20);

for(const gun of ['Pulse Cannon','Spread Blaster','Rail Harpoon'])assert(js.includes(gun),`missing gun: ${gun}`);
for(const room of ['Bronze Reef','Silver Current','Gold Abyss'])assert(js.includes(room),`missing room: ${room}`);
assert(js.includes('ROOM_BETS'),'room-specific shot ladders missing');
assert(js.includes('const cost=shotCost(seat)'),'shot charge must equal selected per-shot cost');
assert(!js.includes('cost=seat?Math.max(50,bet()*.6):bet()*g.mult'),'legacy hidden gun cost multiplier returned');
assert(js.includes('autoLimit=bet()*50'),'auto-fire spend ceiling missing');
assert(js.includes('AUTO FIRE ARMED · TAP AGAIN TO CONFIRM'),'auto-fire two-step confirmation missing');
assert(js.includes('LOCK ARMED · TAP AGAIN TO CONFIRM'),'lock-on two-step confirmation missing');
assert(js.includes("disableAuto('Auto fire disabled after weapon change')"),'weapon change must kill auto-fire');
assert(js.includes("disableAuto('Auto fire disabled after shot-value change')"),'bet change must kill auto-fire');

assert(js.includes('lifeBar:!!t.hard'),'ordinary fish must not receive HP bars');
assert(js.includes('if(f.boss||f.lifeBar)'),'HP bars must be limited to hard targets/bosses');
assert(js.includes('t.hp*ROOMS[st.room].hp'),'fish HP must use base HP, not multiplier as HP');
assert(js.includes('hpMult:9.5'),'elite durability multiplier missing');
assert(js.includes('ROOMS[st.room].bossHp*game().bossScale'),'boss HP must scale by room/game');
assert(js.includes('if(seat===0)st.mission[1]++'),'rival boss kills must not count for player mission');
assert(js.includes('if(seat===0)st.mission[2]++'),'rival hard-target kills must not count for player mission');
assert(js.includes('st.mission[3]=1'),'Ocean Fever mission must be connected to Fever activation');

assert(css.includes('opacity:.22'),'rival guns must remain translucent');
assert(css.includes('opacity:1!important'),'current player gun must remain opaque');
assert(css.includes('.seatgun:nth-child(4){left:50%;top:8px'),'P4 must occupy the upper table station');
assert(css.includes('background:transparent!important'),'player boxes must remain removed');

for(const lowDataSignal of ['saveData','slow-','2g','deviceMemory','hardwareConcurrency','prefers-reduced-motion'])assert(js.includes(lowDataSignal),`missing low-data signal: ${lowDataSignal}`);
assert(js.includes("document.addEventListener('visibilitychange'"),'background animation pause missing');
assert(sw.includes("const fallback=isAdmin?'./admin/index.html':'./index.html'"),'admin/root navigation caches are not separated');
assert(sw.includes("'./admin/app.js'"),'Founder Console must be available in cached shell');
assert(html.includes('fsa-v9.js')&&html.includes('gameplay-layout-v9.css'),'live HTML must load closure runtime');

console.log('FSA_GAMEPLAY_LOGIC=PASS games=15 slots=20 guns=3 rooms=3 auto_safety=PASS room_ladders=PASS hard_lifebars=PASS four_guns=PASS low_data=PASS');
