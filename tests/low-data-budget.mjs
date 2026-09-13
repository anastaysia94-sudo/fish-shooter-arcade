import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const criticalBudgets = new Map([
  ['index.html', 96 * 1024],
  ['fsa-v8.css', 128 * 1024],
  ['gameplay-layout-v9.css', 64 * 1024],
  ['visual-fidelity-v10.css', 48 * 1024],
  ['fsa-v9.js', 128 * 1024],
  ['sw.js', 32 * 1024],
]);
const MAX_CRITICAL_BYTES = 250 * 1024;
const MAX_OFFLINE_SHELL_BYTES = 768 * 1024;

let total = 0;
for (const [file, maxBytes] of criticalBudgets) {
  const size = (await stat(resolve(root, file))).size;
  total += size;
  console.log(`${file}: ${(size / 1024).toFixed(1)} KiB / ${(maxBytes / 1024).toFixed(0)} KiB`);
  if (size > maxBytes) {
    throw new Error(`${file} exceeded its 2G cold-start budget: ${(size / 1024).toFixed(1)} KiB > ${(maxBytes / 1024).toFixed(0)} KiB`);
  }
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
const coreMatch = sw.match(/const CORE=\[(.*?)\];/s);
if (!coreMatch) throw new Error('Unable to read service-worker CORE shell.');
const coreEntries = [...coreMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
if (coreEntries.some(entry => /^https?:\/\//i.test(entry))) {
  throw new Error('Offline CORE shell must not depend on third-party URLs.');
}
let offlineShellBytes = 0;
for (const entry of coreEntries) {
  if (entry.endsWith('/')) continue;
  const file = entry.replace(/^\.\//, '');
  const size = (await stat(resolve(root, file))).size;
  offlineShellBytes += size;
}
if (offlineShellBytes > MAX_OFFLINE_SHELL_BYTES) {
  throw new Error(`Offline shell budget exceeded: ${(offlineShellBytes / 1024).toFixed(1)} KiB > ${MAX_OFFLINE_SHELL_BYTES / 1024} KiB`);
}

console.log(`Critical source total: ${(total / 1024).toFixed(1)} KiB / ${MAX_CRITICAL_BYTES / 1024} KiB budget`);
console.log(`Offline shell total: ${(offlineShellBytes / 1024).toFixed(1)} KiB / ${MAX_OFFLINE_SHELL_BYTES / 1024} KiB budget`);
console.log('F.S.A. low-data startup contract passed.');