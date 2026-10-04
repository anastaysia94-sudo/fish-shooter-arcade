import fs from 'node:fs'
import assert from 'node:assert/strict'

const html=fs.readFileSync('index.html','utf8')
const polish=fs.readFileSync('release-polish-v16.js','utf8')
const sw=fs.readFileSync('sw.js','utf8')

assert.match(html,/Guest Diver/)
assert.match(html,/ROOKIE · LV 1/)
assert.match(html,/id="coins">2,500</)
assert.match(html,/\{credits:2500,gems:0,pearls:0,level:1,xp:0\}/)
assert.match(html,/release-polish-v16\.js/)
assert.doesNotMatch(html,/href="admin\/?"/i,'public arcade must not expose the Founder Console shortcut')
assert.doesNotMatch(html,/OceanHunterX/,'first-run shell must not impersonate an advanced player')
assert.doesNotMatch(html,/12,680,450/,'first-run shell must not fake an advanced balance')

assert.match(polish,/F\.S\.A\. QUICK START/)
assert.match(polish,/Credits are for gameplay only and are not cash or redeemable prizes/)
assert.match(polish,/Rotate for the full table/)
assert.match(polish,/@media\(max-width:1500px\) and \(min-width:901px\)/)
assert.match(polish,/removePrivateAdminShortcut/)
assert.match(polish,/LOCAL DEMO/)
assert.match(polish,/DEMO SCOREBOARD/)
assert.match(sw,/release-polish-v16\.js/)

const guestSeedIndex=html.indexOf("id=\"guestStateRestore\"")
const runtimeIndex=html.indexOf('src="fsa-v9.js"')
assert.ok(guestSeedIndex>=0&&runtimeIndex>guestSeedIndex,'guest seed must execute before the v9 runtime')

console.log('FSA_RELEASE_POLISH_V16_CONTRACT=PASS')
