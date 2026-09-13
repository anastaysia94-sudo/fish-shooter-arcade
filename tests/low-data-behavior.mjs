import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile('fsa-v9.js', 'utf8');
const gameplayCss = await readFile('gameplay-layout-v9.css', 'utf8');
const sw = await readFile('sw.js', 'utf8');
const html = await readFile('index.html', 'utf8');

// Evaluate the exact LOW-mode expression shipped by the current runtime.
assert.ok(
  runtime.includes('const net=navigator.connection||navigator.mozConnection||navigator.webkitConnection;'),
  'Network Information API fallbacks must remain wired.'
);
assert.ok(
  runtime.includes("const reduceMotion=matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;"),
  'Reduced-motion preference must remain a low-resource signal.'
);
const lowMatch = runtime.match(/const LOW=(!!\(.*?\));\s*const KEY=/s);
assert.ok(lowMatch, 'Unable to extract the runtime LOW-mode policy.');
const lowExpression = lowMatch[1];
const evaluateLow = ({ net = null, reduceMotion = false, deviceMemory, hardwareConcurrency } = {}) => {
  const navigator = { deviceMemory, hardwareConcurrency };
  return Function('net', 'reduceMotion', 'navigator', `return (${lowExpression});`)(net, reduceMotion, navigator);
};

const detectionCases = [
  ['normal 4G device', { net: { saveData: false, effectiveType: '4g' }, deviceMemory: 8, hardwareConcurrency: 8 }, false],
  ['normal 3G device', { net: { saveData: false, effectiveType: '3g' }, deviceMemory: 4, hardwareConcurrency: 4 }, false],
  ['Save-Data enabled', { net: { saveData: true, effectiveType: '4g' }, deviceMemory: 8, hardwareConcurrency: 8 }, true],
  ['2G network', { net: { saveData: false, effectiveType: '2g' }, deviceMemory: 8, hardwareConcurrency: 8 }, true],
  ['slow-2G network', { net: { saveData: false, effectiveType: 'slow-2g' }, deviceMemory: 8, hardwareConcurrency: 8 }, true],
  ['reduced motion', { net: { saveData: false, effectiveType: '4g' }, reduceMotion: true, deviceMemory: 8, hardwareConcurrency: 8 }, true],
  ['2 GiB device memory', { net: { saveData: false, effectiveType: '4g' }, deviceMemory: 2, hardwareConcurrency: 8 }, true],
  ['2 logical processors', { net: { saveData: false, effectiveType: '4g' }, deviceMemory: 8, hardwareConcurrency: 2 }, true],
  ['unknown network API with capable hardware', { deviceMemory: 8, hardwareConcurrency: 8 }, false],
];
for (const [name, scenario, expected] of detectionCases) {
  assert.equal(evaluateLow(scenario), expected, `${name}: LOW mode mismatch`);
}

// Low Mode must change real runtime work, not merely set a flag.
const effectContracts = [
  ['initial table population', 'LOW?8:18'],
  ['live target cap', 'LOW?16:42'],
  ['event burst size', 'LOW?2:5'],
  ['radar marker cap', 'slice(0,LOW?10:24)'],
  ['hold-to-fire cadence', 'LOW?260:130'],
  ['fish shadow suppression', 'x.shadowBlur=LOW?0:(f.hard?16:8)'],
  ['boss shadow suppression', 'x.shadowBlur=LOW?0:28'],
  ['projectile shadow suppression', 'x.shadowBlur=LOW?0:14'],
  ['decorative particle suppression', 'if(!LOW){for(let i=0;i<20;i++)'],
];
for (const [name, marker] of effectContracts) {
  assert.ok(runtime.includes(marker), `${name} low-data behavior regressed: ${marker}`);
}

// Background tabs must stop the animation loop and restart safely when visible.
for (const marker of [
  "document.addEventListener('visibilitychange'",
  'st.paused=document.hidden',
  'clearInterval(st.hold)',
  'cancelAnimationFrame(st.raf)',
  "else if($('#game').classList.contains('on'))",
  'st.last=performance.now()',
  'st.raf=requestAnimationFrame(loop)',
]) {
  assert.ok(runtime.includes(marker), `Background-pause contract missing: ${marker}`);
}

// CSS must honor reduced-motion independently of JavaScript canvas degradation.
assert.match(gameplayCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, 'Reduced-motion CSS gate missing.');
assert.match(gameplayCss, /animation-duration:\s*\.001ms!important/, 'Reduced-motion animations are not collapsed.');
assert.match(gameplayCss, /transition-duration:\s*\.001ms!important/, 'Reduced-motion transitions are not collapsed.');

// Offline shell must include the playable runtime and keep root/admin navigation fallbacks distinct.
for (const shellEntry of ['./index.html', './fsa-v8.css', './gameplay-layout-v9.css', './fsa-v9.js', './manifest.webmanifest']) {
  assert.ok(sw.includes(`'${shellEntry}'`), `Offline shell missing ${shellEntry}`);
}
assert.ok(sw.includes("const fallback=isAdmin?'./admin/index.html':'./index.html'"), 'Root/admin offline navigation fallback separation regressed.');
assert.ok(sw.includes(".catch(()=>caches.match(fallback))"), 'Offline navigation fallback must survive a failed network request.');
assert.ok(sw.includes('Security-sensitive Founder Console assets always prefer the network.'), 'Founder Console network-first security rule missing.');

// The critical playable shell must remain local-first: no remote JS/CSS dependency on a 2G cold start.
const remoteCritical = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)=["'](https?:\/\/[^"']+\.(?:js|css)(?:\?[^"']*)?)["']/gi)].map(m => m[1]);
assert.deepEqual(remoteCritical, [], `Remote critical JS/CSS dependencies are not allowed: ${remoteCritical.join(', ')}`);

console.log(`LOW_DATA_BEHAVIOR=PASS cases=${detectionCases.length} effects=${effectContracts.length} offline_shell=PASS reduced_motion=PASS background_pause=PASS`);
