import fs from 'node:fs'
import assert from 'node:assert/strict'

const js=fs.readFileSync(new URL('../release-finish-v16.js',import.meta.url),'utf8')
const css=fs.readFileSync(new URL('../release-finish-v16.css',import.meta.url),'utf8')
const brand=fs.readFileSync(new URL('../brand-regeneration-v14.js',import.meta.url),'utf8')

assert.match(brand,/release-finish-v16\.js/,'brand layer must load release finish v16')
assert.match(js,/removePublicAdminDoor/,'public Founder-link removal must exist')
assert.match(js,/LOCAL DEMO CREW/,'simulated community must be labeled honestly')
assert.match(js,/DEMO SCOREBOARD/,'simulated leaderboard must be labeled honestly')
assert.match(js,/simulated CPU companions/i,'tutorial must explain simulated seats')
assert.match(js,/credits are virtual\/non-cash/i,'tutorial must preserve non-cash boundary')
assert.match(js,/Rotate for the best fish-table view/i,'portrait guidance must exist')
assert.match(js,/sameSeed\(stored\)&&sameSeed\(profile\)/,'legacy demo seed migration must be exact-match only')
assert.doesNotMatch(js,/localStorage\.clear\(/,'finish pass must not wipe user storage')
assert.match(css,/min-width:1060px.*max-width:1500px/s,'laptop-width layout fix must exist')
assert.match(css,/\.fsa-v14-right\{display:none!important\}/,'right rail must collapse in constrained laptop widths')

console.log('release-finish-v16 contracts: PASS')
