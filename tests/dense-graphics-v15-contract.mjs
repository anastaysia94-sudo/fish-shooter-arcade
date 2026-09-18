import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const js=read('dense-graphics-v15.js');
const css=read('dense-graphics-v15.css');
const spectacle=read('boss-spectacle-v13.js');
const sw=read('sw.js');

for(const asset of ['dense-graphics-v15.js','dense-graphics-v15.css']){
  assert(spectacle.includes(asset),`boss spectacle must load ${asset}`);
  assert(sw.includes(`./${asset}`),`service worker must cache ${asset}`);
  assert(sw.includes(asset.replaceAll('.','\\.'))||sw.includes(asset),`fresh runtime policy must include ${asset}`);
}
for(const marker of ['__FSA_DENSE_GRAPHICS_V15__','v15Backdrop','v15Fx','radarTargets','drawCommon','drawElite','drawBoss','drawSchools','spawnImpact','spawnCoins','seedEnvironment']){
  assert(js.includes(marker),`Dense Graphics V15 runtime marker missing ${marker}`);
}
for(const formation of ["'stream'","'diamond'","'spiral'","'cross'","'escort'"]) assert(js.includes(formation),`school formation missing ${formation}`);
for(const theme of ['reef','dragon','pirate','atlantis','ice','lava','storm','jade','neon','ruins','mecha','coral','kraken','treasure','boss']) assert(js.includes(`${theme}:`)||js.includes(`return'${theme}'`),`theme treatment missing ${theme}`);
assert(js.includes("m==='extreme'?38:m==='dense'?30:18"),'live target skin budgets must scale Standard/Dense/Extreme');
assert(js.includes("LOW?10"),'Lite mode must cap live target skins');
assert(js.includes("root.dataset.weapon||'pulse'"),'impact treatment must follow the active canonical weapon');
assert(js.includes('parseBossRatio'),'boss rendering must react to canonical boss HP');
assert(js.includes("root.dataset.cinematicLite==='1'"),'V15 must preserve cinematic Lite mode');
assert(js.includes('prefers-reduced-motion'),'V15 must preserve reduced-motion mode');
assert(!/fetch\s*\(/.test(js),'Dense Graphics V15 must remain local-first and must not fetch art or authority');
assert(!/Fire Kirin|Juwa|Panda Master/i.test(js),'V15 runtime must remain original and not embed competitor branding');
for(const marker of ['#v15Backdrop','#v15Fx','pointer-events:none','data-density-mode="extreme"','prefers-reduced-motion','data-cinematic-lite']) assert(css.includes(marker),`V15 CSS contract missing ${marker}`);
assert(css.includes('#v15Backdrop{z-index:3')&&css.includes('#v15Fx{z-index:5'),'V15 canvas layering must remain deterministic');
assert(sw.includes("fsa-arcade-v24-dense-v15-telemetry-20260916"),'V15 + telemetry must bump the installed-PWA cache generation');
assert(sw.includes('./telemetry-v1.js')&&sw.includes('telemetry-v1\\.js'),'V15 cache generation must preserve telemetry runtime caching and refresh');
assert(spectacle.includes('telemetry-v1.js'),'V15 spectacle loader must preserve telemetry v1 attachment');


if(!/function\s+radarTargets\(\)\{const dots=\$\$\('#radar \\.dot'\)/.test(js)) fail('Dense Graphics must iterate the full radar-dot collection with $$().');
if(!/dataset\.kind/.test(js)||!/kind==='boss'/.test(js)||!/kind==='hard'/.test(js)) fail('Dense Graphics must classify radar targets by semantic data-kind, not historical colors.');
console.log('FSA_DENSE_GRAPHICS_V15_CONTRACT=PASS targets=live boss=phased impacts=weapon-specific coins=magnetic schools=5 environment=procedural telemetry=preserved lite=preserved');
