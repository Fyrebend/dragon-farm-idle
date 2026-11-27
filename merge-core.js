// Merge prototype core: the rules only (no screen code), so the page and test sims share it.
const MERGE = {
  startSlime: 10,
  mergeSize: 3,          // how many of one tier combine into one of the next tier
  tierPower: 4,          // each tier makes this many times the slime of the tier below
  baseRate: 1,           // slime per second from one Droplet
  buyBase: 10,           // price of the first Droplet
  buyGrowth: 1.08,       // price grows this much per slime bought
  penStart: 10,          // creatures the pen holds at the start
  discoverBonus: 1.1,   // all slime production for each new tier discovered
  upgrades: {
    pen:   { name: "Bigger Pen",    base: 50,   growth: 2.6, max: 20, desc: "+1 pen space" },
    hatch: { name: "Better Hatchery", base: 500, growth: 13,  max: 40, desc: "Bought slimes hatch 1 tier higher (price ×3)" },
    rich:  { name: "Richer Slime",  base: 100,  growth: 6,   max: 99, desc: "All slime production ×2" },
    auto:  { name: "Auto-Merge",    base: 1000, growth: 1,   max: 1,  desc: "Merges automatically when a tier has enough" },
    autobuy: { name: "Auto-Buy",    base: 20000, growth: 1,  max: 1,  desc: "Buys a slime whenever you have space and slime" },
  },
};

const TIER_NAMES = ["Droplet", "Blob", "Puddle", "Glob", "Ooze", "Jelly", "Mound", "Wobbler",
  "Bulb", "Gloop", "Swamp", "Torrent", "Lake", "Colossus", "Leviathan", "Titan",
  "Primordial", "Abyss", "Tide Lord", "Slime Dragon"];
function tierName(i) { return TIER_NAMES[i] || ("Tier " + (i + 1)); }

function newMergeState() {
  return { slime: MERGE.startSlime, bought: 0, units: [0], best: 0, up: { pen: 0, hatch: 0, rich: 0, auto: 0, autobuy: 0 },
    autoOn: true, autobuyOn: true, made: 0, time: 0 };
}

function penSize(s) { return MERGE.penStart + s.up.pen; }
function unitCount(s) { return s.units.reduce((a, b) => a + b, 0); }
function hatchTier(s) { return s.up.hatch; }
function buyCost(s) { return MERGE.buyBase * Math.pow(MERGE.mergeSize, s.up.hatch) * Math.pow(MERGE.buyGrowth, s.bought); }
function upCost(s, id) { const u = MERGE.upgrades[id]; return u.base * Math.pow(u.growth, s.up[id]); }
function prodMult(s) { return Math.pow(2, s.up.rich) * Math.pow(MERGE.discoverBonus, s.best); }
function tierRate(s, i) { return MERGE.baseRate * Math.pow(MERGE.tierPower, i) * prodMult(s); }
function slimePerSec(s) { let t = 0; s.units.forEach((n, i) => { t += n * tierRate(s, i); }); return t; }

function canBuy(s) { return unitCount(s) < penSize(s) && s.slime >= buyCost(s); }
function buy(s) {
  if (!canBuy(s)) return false;
  s.slime -= buyCost(s); s.bought++;
  const t = hatchTier(s);
  while (s.units.length <= t) s.units.push(0);
  s.units[t]++;
  noteBest(s, t);
  return true;
}
function noteBest(s, t) { if (t > s.best) { s.best = t; s.lastDiscover = t; } }

function canMerge(s, i) { return (s.units[i] || 0) >= MERGE.mergeSize; }
function merge(s, i) {
  if (!canMerge(s, i)) return false;
  s.units[i] -= MERGE.mergeSize;
  while (s.units.length <= i + 1) s.units.push(0);
  s.units[i + 1]++;
  s.made++;
  noteBest(s, i + 1);
  return true;
}
// merge from the bottom up, as many times as possible
function mergeAll(s) { let n = 0; for (let i = 0; i < s.units.length; i++) while (merge(s, i)) n++; return n; }

function canUpgrade(s, id) { const u = MERGE.upgrades[id]; return s.up[id] < u.max && s.slime >= upCost(s, id); }
function upgrade(s, id) { if (!canUpgrade(s, id)) return false; s.slime -= upCost(s, id); s.up[id]++; return true; }

function stepMerge(s, dt) {
  s.slime += slimePerSec(s) * dt;
  s.time += dt;
  if (s.up.auto && s.autoOn) mergeAll(s);
  if (s.up.autobuy && s.autobuyOn) { let k = 0; while (buy(s) && k++ < 50) { if (s.up.auto && s.autoOn) mergeAll(s); } }
}

if (typeof module !== "undefined") module.exports = { MERGE, tierName, newMergeState, penSize, unitCount, buyCost, upCost,
  prodMult, tierRate, slimePerSec, canBuy, buy, canMerge, merge, mergeAll, canUpgrade, upgrade, stepMerge };
