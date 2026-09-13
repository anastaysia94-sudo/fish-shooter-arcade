import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sourceRaw = await readFile(new URL('../fsa-v9.js', import.meta.url), 'utf8');
const exportMarker = 'window.__FSA_GAME_TEST__={';
assert.ok(sourceRaw.includes(exportMarker), 'current runtime test hook marker missing');

// Expose existing closure functions only inside this VM test copy. Production source is unchanged.
const source = sourceRaw.replace(
  exportMarker,
  'window.__FSA_GAME_TEST__={shoot,hit,kill,armAuto,armLock,disableAuto,bestTarget,targetAt,shotCost,spawn,power,spin,toggleSlotAuto,makePlayers,save,'
);

class FakeClassList {
  constructor(){ this.values = new Set(); }
  add(...names){ names.forEach(name => this.values.add(name)); }
  remove(...names){ names.forEach(name => this.values.delete(name)); }
  contains(name){ return this.values.has(name); }
  toggle(name, force){
    if (force === true) { this.values.add(name); return true; }
    if (force === false) { this.values.delete(name); return false; }
    if (this.values.has(name)) { this.values.delete(name); return false; }
    this.values.add(name); return true;
  }
}

class FakeNode {
  constructor(name='node'){
    this.name = name;
    this.textContent = '';
    this.innerHTML = '';
    this.hidden = false;
    this.children = [];
    this.className = '';
    this.classList = new FakeClassList();
    this.style = { setProperty: (key, value) => { this.style[key] = value; } };
    this.dataset = {};
    this.listeners = new Map();
    this._queries = new Map();
    this.width = 1280;
    this.height = 720;
  }
  addEventListener(type, fn){
    const list = this.listeners.get(type) || [];
    list.push(fn); this.listeners.set(type, list);
  }
  querySelector(selector){
    if (!this._queries.has(selector)) this._queries.set(selector, new FakeNode(`${this.name}:${selector}`));
    return this._queries.get(selector);
  }
  querySelectorAll(selector){
    if (selector === '.dot') return this.children.filter(child => child.className === 'dot');
    return [];
  }
  appendChild(child){ this.children.push(child); return child; }
  remove(){ this.removed = true; }
  insertBefore(child){ this.children.push(child); return child; }
  scrollIntoView(){ this.scrolled = true; }
  getBoundingClientRect(){ return { left:0, top:0, width:1280, height:720 }; }
  getContext(){ return makeCanvasContext(); }
  click(){ this.onclick?.({ clientX:0, clientY:0 }); }
}

function makeCanvasContext(){
  const gradient = { addColorStop(){} };
  return {
    clearRect(){}, createLinearGradient(){ return gradient; }, fillRect(){}, strokeRect(){},
    beginPath(){}, moveTo(){}, lineTo(){}, fill(){}, stroke(){}, arc(){}, ellipse(){},
    quadraticCurveTo(){}, closePath(){}, save(){}, restore(){}, translate(){}, scale(){},
    strokeText(){}, fillText(){}, setLineDash(){},
    globalAlpha:1, fillStyle:'', strokeStyle:'', lineWidth:1, shadowBlur:0, shadowColor:'',
    textAlign:'', font:''
  };
}

function bootRuntime({ effectiveType='4g', saveData=false, deviceMemory=8, hardwareConcurrency=8, reduceMotion=false, storedProfile=null } = {}){
  const elements = new Map();
  const byId = new Map();
  const reels = Array.from({length:5}, (_, i) => new FakeNode(`reel-${i}`));
  const seats = Array.from({length:4}, (_, i) => new FakeNode(`seat-${i}`));
  const weaponButtons = Array.from({length:5}, (_, i) => new FakeNode(`weapon-${i}`));
  const feverMission = new FakeNode('fever-mission');
  feverMission.textContent = 'Trigger Ocean Fever 0/1';
  const docListeners = new Map();

  const nodeFor = selector => {
    if (!elements.has(selector)) elements.set(selector, new FakeNode(selector));
    return elements.get(selector);
  };

  const document = {
    hidden:false,
    querySelector: nodeFor,
    querySelectorAll(selector){
      if (selector === '.reel') return reels;
      if (selector === '.seatgun') return seats;
      if (selector === '.weapon-switch button') return weaponButtons;
      if (selector === '.gmission') return [feverMission];
      return [];
    },
    getElementById(id){
      if (!byId.has(id)) byId.set(id, new FakeNode(`#${id}`));
      return byId.get(id);
    },
    createElement(tag){ return new FakeNode(tag); },
    addEventListener(type, fn){
      const list = docListeners.get(type) || [];
      list.push(fn); docListeners.set(type, list);
    }
  };

  // Keep querySelector('#id') and getElementById('id') on the same fake element.
  document.querySelector = selector => {
    if (selector.startsWith('#')) return document.getElementById(selector.slice(1));
    return nodeFor(selector);
  };

  const storage = new Map();
  if (storedProfile !== null) storage.set('fsa.v9.profile', storedProfile);
  const localStorage = {
    getItem:key => storage.has(key) ? storage.get(key) : null,
    setItem:(key, value) => storage.set(key, String(value)),
    removeItem:key => storage.delete(key)
  };

  let perfNow = 1000;
  let timerId = 0;
  let rafCount = 0;
  let cancelRafCount = 0;
  let clearIntervalCount = 0;
  const randomState = { fn: () => 0.5 };
  const math = Object.create(Math);
  math.random = () => randomState.fn();

  const sandbox = {
    console,
    document,
    navigator:{ connection:{ effectiveType, saveData }, deviceMemory, hardwareConcurrency },
    matchMedia:() => ({ matches:reduceMotion }),
    localStorage,
    performance:{ now:() => perfNow },
    Math:math,
    Date,
    Object, Array, String, Number, Boolean, RegExp, JSON, Map, Set,
    setTimeout:() => ++timerId,
    clearTimeout:() => {},
    setInterval:() => ++timerId,
    clearInterval:() => { clearIntervalCount++; },
    requestAnimationFrame:() => { rafCount++; return ++timerId; },
    cancelAnimationFrame:() => { cancelRafCount++; },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename:'fsa-v9.js' });

  return {
    sandbox,
    t:sandbox.__FSA_GAME_TEST__,
    document,
    storage,
    reels,
    seats,
    weaponButtons,
    docListeners,
    advance(ms){ perfNow += ms; },
    setRandom(values){
      const seq = [...values]; let i = 0;
      randomState.fn = () => seq[Math.min(i++, seq.length - 1)] ?? 0;
    },
    counts(){ return { rafCount, cancelRafCount, clearIntervalCount }; }
  };
}

function resetGame(env, { credits=1000, room=0, gun=0, betIndex=0 } = {}){
  const { t } = env;
  const st = t.getState();
  const p = t.getProfile();
  p.credits = credits;
  p.gems = 2480;
  p.pearls = 36;
  Object.assign(st, {
    game:0, room, gun, betIndex,
    fish:[], shots:[], fx:[], labels:[], players:[], boss:null,
    bossClock:35, wave:1, waveClock:90, combo:0, fever:0, feverUntil:0, freezeUntil:0,
    auto:false, autoArmUntil:0, autoSpent:0, autoLimit:0,
    lock:false, lockArmUntil:0, lastShot:0, paused:false,
    mission:[0,0,0,0], run:{shots:0,hits:0,kills:0,score:0},
    slot:0, slotBet:100, slotAuto:false, slotAutoTimer:0
  });
  st.players = t.makePlayers();
  st.players[0].balance = credits;
  return st;
}

function fish(overrides={}){
  return { id:Math.random(), name:'Test Fish', class:'common', mult:10, hp:10, max:10, r:30, x:500, y:300, vx:0, vy:0, phase:0, lifeBar:false, hard:false, ...overrides };
}

const env = bootRuntime();
const { t, sandbox } = env;

// Catalog and progression matrix.
assert.equal(t.lowMode, false, 'capable 4G runtime should boot in normal mode');
assert.equal(t.GAMES.length, 15, 'fish game catalog regressed');
assert.equal(t.SLOTS.length, 20, 'slot catalog regressed');
assert.equal(t.GUNS.length, 3, 'gun catalog regressed');
assert.equal(t.ROOMS.length, 3, 'room catalog regressed');
assert.equal(t.FISH.length, 12, 'target archetype catalog regressed');
assert.equal(JSON.stringify(t.ROOM_BETS), JSON.stringify([
  [[2,5,10,20,50],[10,20,50,100],[50,100]],
  [[10,20,50],[20,50,100,200],[50,100,200,500]],
  [[100,200,500],[200,500,1000],[500,1000,2000,5000]]
]), 'room/gun shot ladders changed');
assert.equal(t.bossHp(0,0,1), 15000);
assert.equal(t.bossHp(14,2,1), 279000);
assert.equal(t.bossHp(14,2,2), 301320);

// Room entry resets volatile session state and seeds the normal-mode table.
let st = resetGame(env, { room:2, gun:2 });
st.auto = true; st.lock = true; st.mission = [9,9,9,1]; st.wave = 5;
sandbox.chooseRoom(0);
assert.equal(st.room, 0);
assert.equal(st.gun, 0);
assert.equal(st.wave, 1);
assert.deepEqual(Array.from(st.mission), [0,0,0,0]);
assert.equal(st.auto, false);
assert.equal(st.lock, false);
assert.equal(st.fish.length, 18, 'normal-mode room seed count changed');
assert.ok(st.run && st.players.length === 4, 'room entry must initialize run/player state');

// Shot accounting, cooldown, projectile count and insufficient-credit protection.
st = resetGame(env, { credits:1000, room:0, gun:0, betIndex:0 });
assert.equal(t.shotCost(0), 2);
assert.equal(t.shoot(600,300,0), true);
assert.equal(t.getProfile().credits, 998, 'shot must charge exact selected value');
assert.equal(st.run.shots, 1);
assert.equal(st.shots.length, 1);
assert.equal(t.shoot(600,300,0), false, 'gun cooldown must reject immediate repeat');
assert.equal(t.getProfile().credits, 998);
env.advance(106);
assert.equal(t.shoot(600,300,0), true);
assert.equal(t.getProfile().credits, 996);

st = resetGame(env, { credits:1000, room:0, gun:1, betIndex:0 });
env.advance(500);
assert.equal(t.shoot(600,300,0), true);
assert.equal(st.shots.length, 3, 'Spread Blaster must emit three projectiles');
assert.equal(t.getProfile().credits, 990);

st = resetGame(env, { credits:1, room:0, gun:0, betIndex:0 });
env.advance(500);
assert.equal(t.shoot(600,300,0), false, 'insufficient credits must reject shot');
assert.equal(t.getProfile().credits, 1);

// Auto-fire safety: two-step confirmation, finite spend ceiling, and configuration-change kill switch.
st = resetGame(env, { credits:1000, room:0, gun:0, betIndex:0 });
t.armAuto();
assert.equal(st.auto, false, 'first auto-fire tap must only arm');
t.armAuto();
assert.equal(st.auto, true, 'second auto-fire tap must confirm');
assert.equal(st.autoLimit, 100, 'auto-fire ceiling must equal 50 selected shots');
st.autoSpent = 100;
env.advance(500);
assert.equal(t.shoot(600,300,0), false, 'auto-fire must stop before exceeding spend ceiling');
assert.equal(st.auto, false);

t.armAuto(); t.armAuto();
assert.equal(st.auto, true);
sandbox.switchGun(1);
assert.equal(st.auto, false, 'weapon change must disable auto-fire');
t.armAuto(); t.armAuto();
sandbox.betStep(1);
assert.equal(st.auto, false, 'shot-value change must disable auto-fire');

// Lock-on safety and target priority.
st = resetGame(env);
t.armLock();
assert.equal(st.lock, false, 'first lock tap must only arm');
t.armLock();
assert.equal(st.lock, true, 'second lock tap must confirm');
t.armLock();
assert.equal(st.lock, false, 'confirmed lock must be manually switchable off');
const commonHigh = fish({ mult:500 });
const hardLow = fish({ hard:true, mult:2 });
const bossLow = fish({ boss:true, mult:1 });
st.fish = [commonHigh, hardLow, bossLow];
assert.equal(t.bestTarget(), bossLow, 'boss must outrank every non-boss lock target');
st.fish = [commonHigh, hardLow];
assert.equal(t.bestTarget(), hardLow, 'hard target must outrank ordinary multiplier');

// Reward accounting and mission ownership.
st = resetGame(env, { credits:1000, room:0, gun:0, betIndex:0 });
let target = fish({ hp:0, mult:10 });
st.fish = [target];
t.kill(target,0);
assert.equal(t.getProfile().credits, 1018, 'Bronze reward formula changed');
assert.equal(st.run.kills, 1);
assert.equal(st.mission[0], 1);

st = resetGame(env, { credits:1000, room:0, gun:0, betIndex:0 });
target = fish({ hp:0, mult:10, hard:true, lifeBar:true });
st.fish = [target];
const beforeUserCredits = t.getProfile().credits;
t.kill(target,1);
assert.equal(t.getProfile().credits, beforeUserCredits, 'rival reward must not alter user profile');
assert.deepEqual(Array.from(st.mission), [0,0,0,0], 'rival kill must not advance user missions');

st = resetGame(env, { credits:1000, room:0, gun:0, betIndex:0 });
target = fish({ hp:0, mult:800, boss:true, lifeBar:true });
st.fish = [target]; st.boss = target;
t.kill(target,0);
assert.equal(st.mission[1], 1, 'player boss kill must advance boss mission');

st = resetGame(env, { credits:1000, room:0, gun:0, betIndex:0 });
st.feverUntil = Date.now()+10000;
target = fish({ hp:0, mult:10 });
st.fish = [target];
t.kill(target,0);
assert.equal(t.getProfile().credits, 1036, 'Ocean Fever must double player reward');

st = resetGame(env);
st.fever = 99.5;
target = fish({ hp:100, max:100 });
st.fish = [target];
t.hit(target,0.1,0);
assert.equal(st.mission[3], 1, 'reaching Fever must complete Fever mission');
assert.equal(st.fever, 0, 'Fever activation must reset meter');
assert.ok(st.feverUntil > Date.now());

// Powers retain their core safety/targeting contracts.
st = resetGame(env);
t.power('freeze');
assert.ok(st.freezeUntil > Date.now(), 'freeze must create a future freeze window');
st = resetGame(env);
const boss = fish({ boss:true, hp:100, max:100, lifeBar:true });
const minion = fish({ hp:1, max:1 });
st.fish = [boss, minion]; st.boss = boss;
t.power('nuke');
assert.ok(st.fish.includes(boss), 'Tornado clear must not delete bosses');
assert.ok(!st.fish.includes(minion), 'Tornado clear must remove eligible non-boss targets');

// Slot bet bounds, paid-spin debit/payout, insufficient-credit guard, and close cleanup.
st = resetGame(env, { credits:1000 });
st.slotBet = 10;
sandbox.slotBet(-1);
assert.equal(st.slotBet, 10, 'slot bet floor changed');
st.slotBet = 5000;
sandbox.slotBet(1);
assert.equal(st.slotBet, 5000, 'slot bet ceiling changed');

st = resetGame(env, { credits:1000 });
st.slotBet = 100;
env.setRandom([0,.15,.30,.45,.60]);
t.spin(true);
assert.equal(t.getProfile().credits, 900, 'non-winning paid spin must debit exactly one bet');

st = resetGame(env, { credits:1000 });
st.slotBet = 100;
env.setRandom([0,0,0,0,0]);
t.spin(true);
assert.equal(t.getProfile().credits, 2400, 'five-symbol line payout formula changed');

st = resetGame(env, { credits:50 });
st.slotBet = 100;
env.setRandom([0,0,0,0,0]);
t.spin(true);
assert.equal(t.getProfile().credits, 50, 'insufficient slot balance must not debit');
st.slotAuto = true;
sandbox.closeSlot();
assert.equal(st.slotAuto, false, 'closing slot modal must stop auto-spin');

// Save contract persists current profile and must remain non-fatal with normal storage.
t.getProfile().credits = 4321;
t.save();
assert.equal(JSON.parse(env.storage.get('fsa.v9.profile')).credits, 4321, 'profile save contract changed');

// Background lifecycle: hidden tab pauses work; visible active game resumes animation scheduling.
st = resetGame(env);
const visibilityHandlers = env.docListeners.get('visibilitychange') || [];
assert.equal(visibilityHandlers.length, 1, 'visibility lifecycle listener missing');
env.document.getElementById('game').classList.add('on');
env.document.hidden = true;
visibilityHandlers[0]();
assert.equal(st.paused, true);
const hiddenCounts = env.counts();
assert.ok(hiddenCounts.cancelRafCount >= 1 && hiddenCounts.clearIntervalCount >= 1, 'hidden tab must stop RAF and hold-fire interval');
env.document.hidden = false;
visibilityHandlers[0]();
assert.equal(st.paused, false);
assert.ok(env.counts().rafCount >= 1, 'visible active game must schedule RAF again');

// Exit must stop the two continuous targeting/fire modes.
st.auto = true; st.lock = true;
sandbox.closeGame();
assert.equal(st.auto, false);
assert.equal(st.lock, false);

// Corrupt persisted JSON must not prevent boot.
const corrupt = bootRuntime({ storedProfile:'{not-json' });
assert.equal(corrupt.t.getProfile().credits, 12680450, 'corrupt profile fallback changed');

console.log('FSA_CURRENT_RUNTIME_BEHAVIOR=PASS catalog=PASS rooms=PASS shots=PASS rewards=PASS missions=PASS auto=PASS lock=PASS powers=PASS slots=PASS persistence=PASS lifecycle=PASS');
