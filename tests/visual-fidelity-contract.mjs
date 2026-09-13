import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(process.cwd());
const read=p=>readFile(resolve(root,p),'utf8');
const [html,css,titleAtlas,slotAtlas]=await Promise.all([
  read('index.html'),read('visual-fidelity-v10.css'),read('assets/fsa-title-atlas-v10.svg'),read('assets/fsa-slot-atlas-v10.svg')
]);

assert.ok(html.includes('href="visual-fidelity-v10.css"'),'visual fidelity stylesheet is not loaded');
assert.ok(html.includes('id="visualFidelityAdapter"'),'visual fidelity DOM adapter is not loaded');
assert.ok(html.includes("document.documentElement.dataset.vf='v10'"),'visual fidelity v10 marker missing');
assert.ok(html.includes('new MutationObserver(syncGuns)'),'weapon-art sync observer missing');
assert.ok(html.includes('new MutationObserver(syncReels)'),'slot-symbol sync observer missing');

assert.ok(css.includes("url('assets/fsa-title-atlas-v10.svg')"),'fish title atlas is not used');
assert.ok(css.includes("url('assets/fsa-slot-atlas-v10.svg')"),'slot cabinet atlas is not used');
assert.ok(css.includes('.slot-symbols{opacity:0'),'legacy emoji slot-card art is still visually primary');
assert.ok(css.includes('.boss-card span{font-size:0'),'legacy emoji boss art is still visually primary');
assert.ok(css.includes('.gunart{font-size:0'),'legacy emoji weapon art is still visually primary');
assert.ok(css.includes('.reel{font-size:0'),'legacy emoji slot reel art is still visually primary');
assert.ok(/@media\(prefers-reduced-motion:reduce\)/.test(css),'reduced-motion fidelity override missing');
assert.ok(!/https?:\/\//i.test(css),'visual CSS must stay local-only');

for(let i=1;i<=15;i++)assert.ok(css.includes(`.lib-card:nth-child(${i})`),`fish title ${i} lacks distinct atlas position`);
for(let i=1;i<=20;i++)assert.ok(css.includes(`.slot-card:nth-child(${i})`),`slot title ${i} lacks distinct cabinet position`);

const titlePanels=(titleAtlas.match(/transform="translate\(/g)||[]).length;
const slotPanels=(slotAtlas.match(/id="s\d+"/g)||[]).length;
assert.equal(titlePanels,15,'fish title atlas must contain exactly 15 original panels');
assert.equal(slotPanels,20,'slot cabinet atlas must contain exactly 20 original panels');
for(const [name,svg] of [['fish title atlas',titleAtlas],['slot atlas',slotAtlas]]){
  assert.ok(svg.startsWith('<svg'),'invalid SVG atlas');
  assert.ok(!/<image\b/i.test(svg),`${name} must not embed third-party raster art`);
  assert.ok(!/https?:\/\//i.test(svg.replace('http://www.w3.org/2000/svg','')),`${name} contains external URL`);
}

const titleBytes=(await stat(resolve(root,'assets/fsa-title-atlas-v10.svg'))).size;
const slotBytes=(await stat(resolve(root,'assets/fsa-slot-atlas-v10.svg'))).size;
assert.ok(titleBytes<32*1024,`fish title atlas too heavy for Lite/offline shell: ${titleBytes} bytes`);
assert.ok(slotBytes<32*1024,`slot atlas too heavy for Lite/offline shell: ${slotBytes} bytes`);

console.log(`FSA_VISUAL_FIDELITY_V10=PASS fish_panels=${titlePanels} slot_panels=${slotPanels} title_bytes=${titleBytes} slot_bytes=${slotBytes}`);