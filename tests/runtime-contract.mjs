import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const read = path => readFile(resolve(root, path), 'utf8');
const [html, runtime, cloudRuntime, cssBase, cssLayout, cssVisual, cssCloud, sw, guide, manifestText] = await Promise.all([
  read('index.html'), read('fsa-v9.js'), read('cloud-sync-v11.js'), read('fsa-v8.css'), read('gameplay-layout-v9.css'), read('visual-fidelity-v10.css'), read('cloud-sync-v11.css'),
  read('sw.js'), read('guide.html'), read('manifest.webmanifest')
]);
const manifest = JSON.parse(manifestText);
const css = `${cssBase}\n${cssLayout}\n${cssVisual}\n${cssCloud}`;

// The public page must boot the one canonical gameplay runtime plus the isolated cloud-account adapter, not stale gameplay generations.
const scriptSrcs = [...html.matchAll(/<script\s+[^>]*src=["']([^"']+)["']/gi)].map(m => m[1]);
assert.deepEqual(scriptSrcs, ['fsa-v9.js','cloud-sync-v11.js'], `unexpected executable script set: ${scriptSrcs.join(', ')}`);
assert.ok(html.includes('gameplay-layout-v9.css'), 'current gameplay layout stylesheet missing');
assert.ok(html.includes('fsa-v8.css'), 'base arcade stylesheet missing');
assert.ok(html.includes('visual-fidelity-v10.css'), 'visual fidelity stylesheet missing');
assert.ok(html.includes('cloud-sync-v11.css'), 'cloud account stylesheet missing');
assert.ok(html.includes('id="visualFidelityAdapter"'), 'visual-only DOM adapter missing');
assert.ok(html.includes("document.documentElement.dataset.vf='v10'"), 'visual fidelity version marker missing');
assert.ok(html.includes('id="guestStateRestore"'), 'guest state restore boundary missing');
assert.ok(html.indexOf('guestStateRestore') < html.indexOf('src="fsa-v9.js"'), 'guest state restore must execute before gameplay runtime');
for (const legacy of ['app.js','advanced-engine-v6.js','gameplay-v7.js','fsa-v8.js']) {
  assert.ok(!scriptSrcs.includes(legacy), `legacy runtime accidentally reactivated: ${legacy}`);
}

// Every statically referenced gameplay-runtime ID must either exist in the live HTML shell or be explicitly created by the gameplay runtime itself.
const runtimeIds = new Set();
for (const match of runtime.matchAll(/\$\('#([A-Za-z][\w:-]*)'\)/g)) runtimeIds.add(match[1]);
for (const match of runtime.matchAll(/getElementById\('([A-Za-z][\w:-]*)'\)/g)) runtimeIds.add(match[1]);
const providesId = id => {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`id=["']${escaped}["']`).test(html) ||
    new RegExp(`\\.id\\s*=\\s*["']${escaped}["']`).test(runtime) ||
    new RegExp(`setAttribute\\(\\s*["']id["']\\s*,\\s*["']${escaped}["']`).test(runtime);
};
const missingIds = [...runtimeIds].filter(id => !providesId(id));
assert.deepEqual(missingIds, [], `runtime DOM IDs are neither present nor runtime-created: ${missingIds.join(', ')}`);

// Inline controls must resolve to current gameplay runtime functions/globals.
const inlineFns = new Set([...html.matchAll(/onclick=["']([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]));
for (const fn of inlineFns) {
  const declared = new RegExp(`function\\s+${fn}\\s*\\(`).test(runtime) ||
    new RegExp(`window\\.${fn}\\s*=`).test(runtime);
  assert.ok(declared, `inline control points to missing runtime function: ${fn}`);
}

for (const className of ['reel','slot-controls','seatgun','weapon-switch','gmission','radar','battle']) {
  assert.ok(new RegExp(`class=["'][^"']*\\b${className}\\b`).test(html), `required runtime class missing: ${className}`);
}

// Catalog/safety disclosure shell.
assert.ok(/15 original|fifteen original/i.test(html), '15-game public catalog promise missing');
assert.ok(/20 ocean-themed|FEATURED SLOTS · 20/i.test(html), '20-slot public catalog promise missing');
assert.ok(/virtual\/non-cash/i.test(html), 'live page must state virtual/non-cash');
assert.ok(/no cash redemption/i.test(html), 'live page must state no cash redemption');
assert.ok(/virtual|non-cash/i.test(guide), 'guide must retain virtual-credit disclosure');
assert.ok(html.includes('guide.html'), 'public guide link missing');
assert.ok(html.includes('href="admin/"'), 'Founder Console link missing');
assert.ok(cloudRuntime.includes('server wallet') || cloudRuntime.includes('SERVER WALLET'), 'cloud layer must disclose server wallet authority');
assert.ok(cloudRuntime.includes('Public self-registration is intentionally disabled'), 'cloud account layer must remain invite-only');

// PWA install contract.
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.prefer_related_applications, false);
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 1, 'manifest must retain at least one app icon');
assert.ok(html.includes('rel="manifest" href="manifest.webmanifest"'), 'manifest link missing from document');
assert.ok(html.includes("navigator.serviceWorker.register('./sw.js')"), 'service worker registration missing');

// Offline/current-shell contract.
for (const asset of [
  './index.html','./fsa-v8.css','./gameplay-layout-v9.css','./visual-fidelity-v10.css','./cloud-sync-v11.css','./fsa-v9.js','./cloud-sync-v11.js','./manifest.webmanifest',
  './assets/fsa-title-atlas-v10.svg','./assets/fsa-slot-atlas-v10.svg'
]) {
  assert.ok(sw.includes(`'${asset}'`), `service-worker CORE missing ${asset}`);
}
assert.ok(sw.includes("const fallback=isAdmin?'./admin/index.html':'./index.html'"), 'root/admin navigation fallbacks must stay separated');
assert.ok(sw.includes("'./admin/app.js'"), 'Founder Console JS must remain in offline shell');
assert.ok(/caches\.match\(event\.request\)/.test(sw), 'cache-first static asset fallback missing');
assert.ok(/fetch\(event\.request\)/.test(sw), 'network path missing from service worker');

// Gameplay remains local-first. Account networking is isolated in the cloud adapter.
for (const url of scriptSrcs) assert.ok(!/^https?:\/\//i.test(url), `third-party runtime script forbidden: ${url}`);
const stylesheetHrefs = [...html.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)].map(m => m[1]);
for (const url of stylesheetHrefs) assert.ok(!/^https?:\/\//i.test(url), `third-party runtime stylesheet forbidden: ${url}`);
for (const primitive of ['XMLHttpRequest','WebSocket(']) assert.ok(!runtime.includes(primitive), `unexpected network primitive in gameplay runtime: ${primitive}`);
assert.ok(!/fetch\s*\(/.test(runtime), 'gameplay runtime must remain playable without a network fetch path');
assert.ok(!/https?:\/\//i.test(cssVisual), 'visual fidelity CSS must remain local-only');
assert.ok(!/service[_-]?role/i.test(cloudRuntime), 'cloud browser adapter must not contain service-role credentials');

for (const marker of [
  "const KEY='fsa.v9.profile'",
  "document.addEventListener('visibilitychange'",
  "AUTO FIRE ARMED · TAP AGAIN TO CONFIRM",
  "LOCK ARMED · TAP AGAIN TO CONFIRM",
  "autoLimit=bet()*50",
  "disableAuto('Auto fire disabled after weapon change')",
  "disableAuto('Auto fire disabled after shot-value change')"
]) assert.ok(runtime.includes(marker), `runtime safety/lifecycle marker missing: ${marker}`);

assert.ok(/@media\(max-width:760px\)/.test(css), 'phone breakpoint missing');
assert.ok(/@media\(max-height:520px\) and \(orientation:landscape\)/.test(css), 'short landscape breakpoint missing');
assert.ok(/prefers-reduced-motion:\s*reduce/.test(css), 'reduced-motion CSS gate missing');
assert.ok(/touch-action/i.test(css), 'touch interaction contract missing');

assert.ok(html.includes('id="battleCanvas" width="1280" height="720"'), 'canvas coordinate contract changed');
assert.ok(runtime.includes('*1280/r.width') && runtime.includes('*720/r.height'), 'pointer-to-canvas coordinate mapping changed');

console.log(`FSA_CURRENT_RUNTIME_CONTRACT=PASS ids=${runtimeIds.size} inline_controls=${inlineFns.size} scripts=${scriptSrcs.length} pwa=PASS offline=PASS mobile=PASS visual_v10=PASS cloud_v11=PASS safety_disclosure=PASS`);
