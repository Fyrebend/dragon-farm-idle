// Merge prototype core: the rules only (no screen code), so the page and test sims share it.
// v4 (breeding): Active slimes breed new slimes into the Breeding Pen; slime (currency) buys upgrades.
// Slots hold a level = tier and rank. Two of the same level merge into the next level;
// two at the top rank make the next tier. Only the Active Pen earns; the Breeding Pen is storage.
const MERGE = {
  startSlime: 10,
  ranks: 5,              // base, +1, +2, +3, +4
  tierPower: 10,         // each tier (at base rank) makes this many times the tier below
  rankBonus: 1.25,       // each rank within a tier
  baseRate: 1,           // slime per second from one Droplet
  buyBase: 10,           // price of the first Droplet
  buyGrowth: 1,          // price growth per slime bought (1 = flat: price only rises with Hatchery level)
  activeStart: 3,        // earning + breeding spaces at the start
  breedTime: 10,         // seconds per drop for a Droplet-tier breeder
  breedSlow: 3,          // each tier up breeds this much slower (big slimes breed slowly)
  dropGap: 5,            // drops are this many ranks below the parent (5 = one tier lower)
  barnStart: 10,         // breeding (storage) spaces at the start
  priceModel: "perBuy",
  autobuyRate: 5,        // Auto-Buy hatches up to this many slimes per second
  discoverBonus: 1.1,    // all slime production for each new tier discovered
  upgrades: {
    speed:   { name: "Faster Breeding", base: 25,   growth: 6,  max: 40, desc: "Breeding is 15% faster" },
    blood:   { name: "Better Bloodlines", base: 2000, growth: 60, max: 4, desc: "Drops are 1 rank closer to the parent" },
    active:  { name: "Grazing Field",   base: 200,  growth: 12, max: 7,  desc: "+1 Active Pen space (earns and breeds)" },
    pen:     { name: "Bigger Barn",     base: 40,   growth: 2.2, max: 20, desc: "+1 Breeding Pen space (holds more drops before the weakest get released)" },
    rich:    { name: "Richer Slime",    base: 100,  growth: 5,  max: 99, desc: "All slime production ×2" },
    auto:    { name: "Auto-Merge",      base: 3000, growth: 1,  max: 1,  desc: "Merges pairs and equips your best automatically" },
  },

};

const TIER_NAMES = ["Droplet", "Blob", "Puddle", "Glob", "Ooze", "Jelly", "Mound", "Wobbler",
  "Bulb", "Gloop", "Swamp", "Torrent", "Lake", "Colossus", "Leviathan", "Titan",
  "Primordial", "Abyss", "Tide Lord", "Slime Dragon"];
function tierName(i) { return TIER_NAMES[i] || ("Tier " + (i + 1)); }
function tierOf(L) { return Math.floor(L / MERGE.ranks); }
function rankOf(L) { return L % MERGE.ranks; }
function levelName(L) { const r = rankOf(L); return tierName(tierOf(L)) + (r ? " +" + r : ""); }

function newMergeState() {
  const s = { slime: MERGE.startSlime, bought: 0, active: [], barn: [], best: 0,
    up: { speed: 0, blood: 0, active: 0, pen: 0, rich: 0, auto: 0, hatch: 0, autobuy: 0 }, autoOn: true, autobuyOn: false, time: 0, timers: [], lost: 0 };
  fitSlots(s); s.active[0] = 0; s.active[1] = 0; return s;
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
// price model: "perBuy" = grows with every slime ever bought; "reset" = growth restarts at each Hatchery level
function buyCost(s) {
  const n = MERGE.priceModel === "reset" ? (s.sinceHatch || 0) : s.bought;
  return MERGE.buyBase * Math.pow(2, s.up.hatch) * Math.pow(MERGE.buyGrowth, n);
}
function upCost(s, id) { const u = MERGE.upgrades[id]; return u.base * Math.pow(u.growth, s.up[id]); }
function prodMult(s) { return Math.pow(2, s.up.rich) * Math.pow(MERGE.discoverBonus, tierOf(s.best)); }
function tierRate(s, L) { return MERGE.baseRate * Math.pow(MERGE.tierPower, tierOf(L)) * Math.pow(MERGE.rankBonus, rankOf(L)) * prodMult(s); }
function slimePerSec(s) { let t = 0; for (const x of s.active) if (x !== null) t += tierRate(s, x); return t; }
function noteBest(s, L) { if (L > s.best) { if (tierOf(L) > tierOf(s.best)) s.lastDiscover = tierOf(L); s.best = L; } }

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
  s.slime -= buyCost(s); s.bought++; s.sinceHatch = (s.sinceHatch || 0) + 1;
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
// merge pairs, lowest first, but keep enough slimes to fill the Active Pen (they breed); then equip best
function mergeAll(s) {
  const count = [];
  let left = 0;
  for (const t of allSlimes(s)) { count[t] = (count[t] || 0) + 1; left++; }
  let n = 0;
  for (let t = 0; t < count.length; t++) {
    while ((count[t] || 0) >= 2 && left > activeSize(s)) { left--; count[t] -= 2; count[t + 1] = (count[t + 1] || 0) + 1; noteBest(s, t + 1); n++; }
  }
  if (!n) return 0;
  const list = [];
  count.forEach((c, t) => { for (let k = 0; k < (c || 0); k++) list.push(t); });
  placeSorted(s, list);
  return n;
}
function canMergeAny(s) { const seen = {}; for (const t of allSlimes(s)) { if (seen[t]) return true; seen[t] = 1; } return false; }

function canUpgrade(s, id) { const u = MERGE.upgrades[id]; return s.up[id] < u.max && s.slime >= upCost(s, id); }
function upgrade(s, id) { if (!canUpgrade(s, id)) return false; s.slime -= upCost(s, id); s.up[id]++; if (id === "hatch") s.sinceHatch = 0; fitSlots(s); return true; }

// ----- Breeding -----
function dropGap(s) { return Math.max(1, MERGE.dropGap - s.up.blood); }
function dropLevel(s, L) { return Math.max(0, L - dropGap(s)); }
function breedTime(s, L) { return MERGE.breedTime * Math.pow(MERGE.breedSlow, tierOf(L)) * Math.pow(0.85, s.up.speed); }
function breed(s, dt) {
  for (let i = 0; i < s.active.length; i++) {
    const L = s.active[i];
    if (L === null) { s.timers[i] = 0; continue; }
    s.timers[i] = (s.timers[i] || 0) + dt;
    const bt = breedTime(s, L);
    while (s.timers[i] >= bt) {
      s.timers[i] -= bt;
      const d = dropLevel(s, L);
      const a = s.active.indexOf(null);   // an empty Active space gets the drop first
      if (a >= 0) { s.active[a] = d; noteBest(s, d); continue; }
      let j = s.barn.indexOf(null);
      if (j < 0) {   // barn full: release the weakest slime there if the drop is better, otherwise the drop is lost
        j = 0; for (let k = 1; k < s.barn.length; k++) if (s.barn[k] < s.barn[j]) j = k;
        if (s.barn[j] >= d) { s.lost++; continue; }
        s.released = (s.released || 0) + 1;
      }
      s.barn[j] = d; noteBest(s, d);
    }
  }
}

function stepMerge(s, dt) {
  fitSlots(s);
  s.slime += slimePerSec(s) * dt;
  breed(s, dt);
  s.time += dt;
  const auto = s.up.auto && s.autoOn;
  if (auto) mergeAll(s);
  if (s.up.autobuy && s.autobuyOn) {
    s.autoBank = Math.min((s.autoBank || 0) + MERGE.autobuyRate * dt, MERGE.autobuyRate);
    while (s.autoBank >= 1 && buy(s)) { s.autoBank--; if (auto) mergeAll(s); }
    if (auto) equipBest(s);
  }
}

if (typeof module !== "undefined") module.exports = { MERGE, tierName, tierOf, rankOf, levelName, newMergeState, activeSize, barnSize, fitSlots, allSlimes,
  unitCount, totalSpace, buyCost, upCost, prodMult, tierRate, slimePerSec, canBuy, buy, drop, equipBest, mergeAll, canMergeAny,
  canUpgrade, upgrade, stepMerge, dropGap, dropLevel, breedTime };
