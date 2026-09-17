import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),css=read('boss-spectacle-v13.css'),js=read('boss-spectacle-v13.js'),sw=read('sw.js');
for(const asset of ['boss-spectacle-v13.css','boss-spectacle-v13.js']){
  assert(html.includes(asset),`index missing ${asset}`);
  assert(sw.includes(`./${asset}`),`service worker missing ${asset}`);
}
assert(html.indexOf('boss-spectacle-v13.js')>html.indexOf('arcade-intensity-v12.js'),'v13 must layer after v12 gameplay');
for(const marker of ['CHAIN x10','COMBO x25','COMBO x50','LIGHTNING BONUS','LEGENDARY HIT','OCEAN OVERDRIVE'])assert(js.includes(marker),`missing combo mechanic ${marker}`);
for(const marker of ["window.power?.('lightning')","window.power?.('bomb')","window.power?.('nuke')",'bossRatio','v13-boss-rage','v13-fever-core','v13-treasure-burst','v13-critical-flare'])assert(js.includes(marker)||css.includes(marker),`missing spectacle mechanic ${marker}`);
assert(js.includes('MutationObserver'),'v13 must react to real runtime state');
assert(js.includes("observe(combo,updateCombo)")&&js.includes("observe(fever,updateFever)")&&js.includes("observe(bossText,parseBoss)"),'v13 must observe combo fever and boss HP');
assert(js.includes("new Set(['drawAtmos','frame'])"),'lobby render governor must scope throttling to dense visual loops');
assert(js.includes("return nativeRaf(cb)"),'non-dense requestAnimationFrame callbacks must preserve native scheduling');
assert(js.includes("if(id>=0){nativeCaf(id);return}"),'native requestAnimationFrame ids must preserve cancelAnimationFrame semantics');
assert(js.includes("renderGovernor='v2'")&&js.includes("renderGovernor:'v2'"),'scoped render governor v2 must be exposed');
assert(css.includes('prefers-reduced-motion'),'v13 must respect reduced motion');
assert(css.includes('data-spectacle="v13"'),'v13 CSS must be scoped');
assert(!js.includes('Fire Kirin')&&!css.includes('Fire Kirin'),'competitor branding must not ship in runtime');
console.log('FSA_BOSS_SPECTACLE_V13_CONTRACT=PASS renderGovernor=v2 nativeRaf=preserved');
