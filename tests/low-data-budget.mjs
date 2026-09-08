import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const critical = ['index.html', 'fsa-v8.css', 'gameplay-layout-v9.css', 'fsa-v9.js', 'sw.js'];
const MAX_CRITICAL_BYTES = 250 * 1024;

let total = 0;
for (const file of critical) {
  const size = (await stat(resolve(root, file))).size;
  total += size;
  console.log(`${file}: ${(size / 1024).toFixed(1)} KiB`);
}

if (total > MAX_CRITICAL_BYTES) {
  throw new Error(`Critical first-load source budget exceeded: ${(total / 1024).toFixed(1)} KiB > ${MAX_CRITICAL_BYTES / 1024} KiB`);
}

const runtime = await readFile(resolve(root, 'fsa-v9.js'), 'utf8');
for (const marker of ['navigator.connection', 'saveData', 'slow-)?2g', 'LOW?8:18', 'shadowBlur=LOW?0']) {
  if (!runtime.includes(marker)) throw new Error(`Missing low-data runtime marker: ${marker}`);
}

const index = await readFile(resolve(root, 'index.html'), 'utf8');
if (!index.includes('guide.html')) throw new Error('Public answer guide must remain linked from the lobby.');
if (!index.includes('virtual/non-cash')) throw new Error('Lobby must retain explicit virtual/non-cash disclosure.');

const sw = await readFile(resolve(root, 'sw.js'), 'utf8');
if (!/cache|caches/i.test(sw)) throw new Error('Service worker must retain cache behavior for intermittent connections.');

console.log(`Critical source total: ${(total / 1024).toFixed(1)} KiB / ${MAX_CRITICAL_BYTES / 1024} KiB budget`);
console.log('F.S.A. low-data startup contract passed.');
