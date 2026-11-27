// Merge prototype core: the rules only (no screen code), so the page and test sims share it.
// v2: 2-to-1 merges; only slimes in the Active Pen earn; the Breeding Pen is storage for merging.
const MERGE = {
  startSlime: 10,
  tierPower: 3,          // each tier makes this many times the slime of the tier below
  baseRate: 1,           // slime per second from one Droplet
  buyBase: 10,           // price of the first Droplet
  buyGrowth: 1.2,        // price grows this much per slime bought
  activeStart: 3,        // earning spaces at the start
  barnStart: 10,         // breeding (storage) spaces at the start
  discoverBonus: 1.1,    // all slime production for each new tier discovered
  upgrades: {
    active:  { name: "Grazing Field",   base: 300,   growth: 40, max: 7,  desc: "+1 Active Pen space (earning)" },
    pen:     { name: "Bigger Barn",     base: 50,    growth: 3,  max: 20, desc: "+1 Breeding Pen space (storage)" },
    hatch:   { name: "Better Hatchery", base: 500,   growth: 9.5, max: 40, desc: "Bought slimes hatch 1 tier higher (price ×2)" },
    rich:    { name: "Richer Slime",    base: 100,   growth: 6,  max: 99, desc: "All slime production ×2" },
    auto:    { name: "Auto-Merge",      base: 1000,  growth: 1,  max: 1,  desc: "Merges pairs and equips your best automatically" },
    autobuy: { name: "Auto-Buy",        base: 20000, growth: 1,  max: 1,  desc: "Hatches a slime whenever you have space and slime" },
  },
};

const TIER_NAMES = ["Droplet", "Blob", "Puddle", "Glob", "Ooze", "Jelly", "Mound", "Wobbler",
  "Bulb", "Gloop", "Swamp", "Torrent", "Lake", "Colossus", "Leviathan", "Titan",
  "Primordial", "Abyss", "Tide Lord", "Slime Dragon"];
function tierName(i) { return TIER_NAMES[i] || ("Tier " + (i + 1)); }

function newMergeState() {
  return { slime: MERGE.startSlime, bought: 0, active: [], barn: [], best: 0,
    up: { active: 0, pen: 0, hatch: 0, rich: 0, auto: 0, autobuy: 0 }, autoOn: true, autobuyOn: true, time: 0 };
}

// ----- Sizes -----
function activeSize(s) { return MERGE.activeStart + s.up.active; }
function barnSize(s) { return MERGE.barnStart + s.up.pen; }
function fitSlots(s) {
  while (s.active.length < activeSize(s)) s.active.push(null);
  while (s.barn.length < barnSize(s)) s.barn.push(null);
}
function zone(s, z) { return z === "active" ? s.active : s.barn; }
function allSlimes(s) { return s.active.concat(s.barn).filter(t => t !== null); }
function unitCount(s) { return allSlimes(s).length; }
function totalSpace(s) { return activeSize(s) + barnSize(s); }

// ----- Earning -----
function buyCost(s) { return MERGE.buyBase * Math.pow(2, s.up.hatch) * Math.pow(MERGE.buyGrowth, s.bought); }
function upCost(s, id) { const u = MERGE.upgrades[id]; return u.base * Math.pow(u.growth, s.up[id]); }
function prodMult(s) { return Math.pow(2, s.up.rich) * Math.pow(MERGE.discoverBonus, s.best); }
function tierRate(s, i) { return MERGE.baseRate * Math.pow(MERGE.tierPower, i) * prodMult(s); }
function slimePerSec(s) { let t = 0; for (const x of s.active) if (x !== null) t += tierRate(s, x); return t; }
function noteBest(s, t) { if (t > s.best) { s.best = t; s.lastDiscover = t; } }

// ----- Hatching: goes to an empty Active space first, then the Breeding Pen -----
function emptySpot(s) {
  fitSlots(s);
  let i = s.active.indexOf(null); if (i >= 0) return ["active", i];
  i = s.barn.indexOf(null); if (i >= 0) return ["barn", i];
  return null;
}
function canBuy(s) { return emptySpot(s) !== null && s.slime >= buyCost(s); }
function buy(s) {
  if (!canBuy(s)) return false;
  s.slime -= buyCost(s); s.bought++;
  const [z, i] = emptySpot(s);
  zone(s, z)[i] = s.up.hatch;
  noteBest(s, s.up.hatch);
  return true;
}

// ----- Drag and drop: same tier = merge, empty = move, different tier = swap -----
function drop(s, fz, fi, tz, ti) {
  if (fz === tz && fi === ti) return "none";
  const from = zone(s, fz), to = zone(s, tz), a = from[fi], b = to[ti];
  if (a === null || a === undefined) return "none";
  if (b === null || b === undefined) { to[ti] = a; from[fi] = null; return "move"; }
  if (a === b) { to[ti] = a + 1; from[fi] = null; noteBest(s, a + 1); return "merge"; }
  to[ti] = a; from[fi] = b; return "swap";
}

// ----- Equip best: highest tiers into the Active Pen, the rest sorted into the Breeding Pen -----
function equipBest(s) {
  fitSlots(s);
  placeSorted(s, allSlimes(s));
}
function placeSorted(s, list) {
  list = list.slice().sort((x, y) => y - x);
  s.active = s.active.map((_, i) => i < list.length ? list[i] : null);
  const rest = list.slice(s.active.length);
  s.barn = s.barn.map((_, i) => i < rest.length ? rest[i] : null);
}
// merge every pair, lowest tiers first, then equip best
function mergeAll(s) {
  const count = [];
  for (const t of allSlimes(s)) count[t] = (count[t] || 0) + 1;
  let n = 0;
  for (let t = 0; t < count.length; t++) {
    while ((count[t] || 0) >= 2) { count[t] -= 2; count[t + 1] = (count[t + 1] || 0) + 1; noteBest(s, t + 1); n++; }
  }
  if (!n) return 0;
  const list = [];
  count.forEach((c, t) => { for (let k = 0; k < (c || 0); k++) list.push(t); });
  placeSorted(s, list);
  return n;
}
function canMergeAny(s) { const seen = {}; for (const t of allSlimes(s)) { if (seen[t]) return true; seen[t] = 1; } return false; }

function canUpgrade(s, id) { const u = MERGE.upgrades[id]; return s.up[id] < u.max && s.slime >= upCost(s, id); }
function upgrade(s, id) { if (!canUpgrade(s, id)) return false; s.slime -= upCost(s, id); s.up[id]++; fitSlots(s); return true; }

function stepMerge(s, dt) {
  fitSlots(s);
  s.slime += slimePerSec(s) * dt;
  s.time += dt;
  const auto = s.up.auto && s.autoOn;
  if (auto) mergeAll(s);
  if (s.up.autobuy && s.autobuyOn) { let k = 0; while (k++ < 50 && buy(s)) if (auto) mergeAll(s); if (auto) equipBest(s); }
}

if (typeof module !== "undefined") module.exports = { MERGE, tierName, newMergeState, activeSize, barnSize, fitSlots, allSlimes,
  unitCount, totalSpace, buyCost, upCost, prodMult, tierRate, slimePerSec, canBuy, buy, drop, equipBest, mergeAll, canMergeAny,
  canUpgrade, upgrade, stepMerge };
