// Expedition prototype core (rules only, shared by the page and test sims).
// Your party (up to 3 slimes) runs expeditions that never fail. Each run can bring back a slime and always brings gold.
// Slimes only come from expeditions. Zone 1 is free; every other zone costs 1 key per run, and keys for a zone drop in the zone below. Two identical slimes (same tier and rank) merge into the next rank; two at +4 make the next tier.
const EXP = {
  ranks: 5,               // base, +1 ... +4
  tierPower: 10,          // power of a tier vs the tier below (at base rank)
  rankBonus: 1.25,        // power per rank
  partyStart: 3,
  barnStart: 10,
  baseTime: 20,           // seconds for zone 1 with a party exactly at its power
  zoneTimeGrowth: 1.2,    // each zone takes this much longer
  reqGap: 4,              // zone 2 wants a party 4 ranks above what zone 1 drops
  needStep: 2.4,          // each zone's power need rises about 2.4 ranks, but drops only rise 2: later zones need more merging
  dropStep: 2,            // each zone drops slimes 2 ranks higher
  slimeChance: 0.7,       // chance a run brings back a slime
  luckyUp: 0.15,          // chance that slime is 1 rank higher
  overSpeedPow: 0.5,      // overpowered: speed = (power / need) ^ 0.5, up to maxSpeed
  maxSpeed: 4,
  goldBase: 5, goldGrowth: 2,
  keyBase: 0.6,           // keys for the next zone per run, at exactly the zone's power
  keyOverPow: 0.5,        // over-powered: keys = keyBase × (power/need)^0.5, up to keyMax per run
  keyMax: 2,
  keyUnderPow: 2,         // under-powered: keys = keyBase × (power/need)^2 (low odds)
  unlockKeys: 1,          // free keys when a zone unlocks
  tradeRate: 6,           // trade this many keys of a zone for 1 key of the next zone
  extraSlimeStep: 0.05,   // each zone adds 5% chance of a second slime (up to 50%)
  // what each zone unlocks when you reach it (index = zone number - 1)
  unlocks: {
    1: "Better Nets and Haggling upgrades",
    2: "Orders board",
    3: "Auto-Merge upgrade",
    4: "Second expedition team (coming soon)",
    5: "Bigger Party upgrade",
    7: "Key crafting automation (coming soon)",
    9: "Selling the ranch: first reset (coming soon)",
    11: "Mutations and the Slime Zoo (coming soon)",
  },
  orders: { zone: 2, slots: 3, every: 90, lasts: 480, rationsTime: 120, rationsSpeed: 2, rationsCap: 600 },
  upgrades: {
    wagon: { zone: 0, name: "Faster Wagons",  base: 30,   growth: 4,   max: 40, desc: "Expeditions are 10% faster" },
    nets:  { zone: 1, name: "Better Nets",    base: 150,  growth: 6,   max: 6,  desc: "+5% chance to bring back a slime" },
    train: { zone: 0, name: "Training Yard",  base: 80,   growth: 8,   max: 99, desc: "Party power ×1.25" },
    keys:  { zone: 2, name: "Key Ring",       base: 300,  growth: 6,   max: 20, desc: "+20% keys from expeditions" },
    gold:  { zone: 1, name: "Haggling",       base: 50,   growth: 5,   max: 99, desc: "Gold from expeditions ×1.5" },
    party: { zone: 5, name: "Bigger Party",   base: 5000, growth: 50,  max: 2,  desc: "+1 party slot" },
    pen:   { zone: 0, name: "Bigger Barn",    base: 40,   growth: 2.2, max: 20, desc: "+1 Breeding Pen space" },
    auto:  { zone: 3, name: "Auto-Merge",     base: 500,  growth: 1,   max: 1,  desc: "Merges pairs (keeps your party full) and equips your best" },
  },
};

const TIER_NAMES = ["Droplet", "Blob", "Puddle", "Glob", "Ooze", "Jelly", "Mound", "Wobbler",
  "Bulb", "Gloop", "Swamp", "Torrent", "Lake", "Colossus", "Leviathan", "Titan",
  "Primordial", "Abyss", "Tide Lord", "Slime Dragon"];
const ZONE_NAMES = ["Mossy Meadow", "Drip Caves", "Sour Bog", "Puddle Plains", "Ooze Falls", "Jelly Thicket",
  "Muck Mire", "Wobble Hills", "Bulb Grotto", "Gloop Basin", "Swamp Depths", "Torrent Gorge", "Great Lake",
  "Colossus Ridge", "Leviathan Trench", "Titan Peaks", "Primordial Pools", "The Abyss", "Tide Throne", "Dragon's Nest"];
function tierName(i) { return TIER_NAMES[i] || ("Tier " + (i + 1)); }
function zoneName(z) { return ZONE_NAMES[z] || ("Zone " + (z + 1)); }
function tierOf(L) { return Math.floor(L / EXP.ranks); }
function rankOf(L) { return L % EXP.ranks; }
function levelName(L) { const r = rankOf(L); return tierName(tierOf(L)) + (r ? " +" + r : ""); }

function newExpState() {
  const s = { gold: 0, party: [], barn: [], best: 0, zone: 0, maxZone: 0, runT: 0, runs: 0, found: 0,
    up: { wagon: 0, nets: 0, train: 0, keys: 0, gold: 0, party: 0, pen: 0, auto: 0 }, autoOn: true, time: 0, lastLoot: null,
    orders: [], orderT: 0, boostT: 0, delivered: 0, keys: [], runZone: 0, running: false };
  fitSlots(s);
  s.party[0] = 0;   // you start with one Droplet
  return s;
}

// ----- Slots -----
function partySize(s) { return EXP.partyStart + s.up.party; }
function barnSize(s) { return EXP.barnStart + s.up.pen; }
function fitSlots(s) {
  while (s.party.length < partySize(s)) s.party.push(null);
  while (s.barn.length < barnSize(s)) s.barn.push(null);
}
function zone(s, z) { return z === "party" ? s.party : s.barn; }
function allSlimes(s) { return s.party.concat(s.barn).filter(t => t !== null); }
function unitCount(s) { return allSlimes(s).length; }

// ----- Power and zones -----
function levelPower(L) { return Math.pow(EXP.tierPower, tierOf(L)) * Math.pow(EXP.rankBonus, rankOf(L)); }
function trainMult(s) { return Math.pow(1.25, s.up.train); }
function partyPower(s) { let p = 0; for (const L of s.party) if (L !== null) p += levelPower(L); return p * trainMult(s); }
function zoneNeed(z) { return z === 0 ? 1 : 3 * levelPower(Math.round(EXP.needStep * (z - 1)) + EXP.reqGap); }
function zoneDrop(z) { return EXP.dropStep * z; }
function zoneGold(s, z) { return EXP.goldBase * Math.pow(EXP.goldGrowth, z) * Math.pow(1.5, s.up.gold); }
// never fails: under-powered parties are slower (speed = power / need), over-powered faster (up to maxSpeed)
function zoneSpeed(s, z) {
  const r = partyPower(s) / zoneNeed(z);
  return r >= 1 ? Math.min(EXP.maxSpeed, Math.pow(r, EXP.overSpeedPow)) : Math.max(r, 0.001);
}
function zoneTime(s, z) { return EXP.baseTime * Math.pow(EXP.zoneTimeGrowth, z) * Math.pow(0.9, s.up.wagon) / zoneSpeed(s, z) / (s.boostT > 0 ? EXP.orders.rationsSpeed : 1); }
function slimeChance(s) { return Math.min(1, EXP.slimeChance + 0.05 * s.up.nets); }
function noteBest(s, L) { if (L > s.best) { if (tierOf(L) > tierOf(s.best)) s.lastDiscover = tierOf(L); s.best = L; } }

// ----- Expedition finishes: loot -----
function keysFor(s, z) { return z === 0 ? Infinity : (s.keys[z] || 0); }
function powerRatio(s, z) { return partyPower(s) / zoneNeed(z); }
// expected keys for the next zone from one run here: low odds when under-powered, more when over-powered
function keyYield(s, z) {
  const r = powerRatio(s, z);
  const e = EXP.keyBase * (r < 1 ? Math.pow(r, EXP.keyUnderPow) : Math.min(EXP.keyMax / EXP.keyBase, Math.pow(r, EXP.keyOverPow)));
  return e * (1 + 0.2 * s.up.keys);
}
function extraSlimeChance(z) { return Math.min(0.5, EXP.extraSlimeStep * z); }
function finishRun(s, rng, z) {
  if (z === undefined) z = s.zone;
  const g = zoneGold(s, z);
  s.gold += g; s.runs++;
  let got = null, got2 = null;
  const roll = () => { let L = zoneDrop(z) + (rng() < EXP.luckyUp ? 1 : 0); if (!place(s, L)) return "full"; s.found++; noteBest(s, L); return L; };
  if (rng() < slimeChance(s)) { got = roll(); if (rng() < extraSlimeChance(z)) got2 = roll(); }
  // keys for the next zone
  let k = 0;
  if (z < ZONE_NAMES.length - 1 && z + 1 <= s.maxZone + 1) {
    const e = keyYield(s, z); k = Math.floor(e) + (rng() < e - Math.floor(e) ? 1 : 0);
    if (k) s.keys[z + 1] = (s.keys[z + 1] || 0) + k;
  }
  // clearing your top zone with enough power unlocks the next (under-powered runs still bring loot)
  if (z === s.maxZone && z < ZONE_NAMES.length - 1 && partyPower(s) >= zoneNeed(z)) {
    s.maxZone = z + 1; s.lastZone = z + 1;
    s.keys[z + 1] = (s.keys[z + 1] || 0) + EXP.unlockKeys;
    if (s.maxZone === EXP.orders.zone) s.orderT = EXP.orders.every * EXP.orders.slots;   // the board opens with full orders
  }
  s.lastLoot = { zone: z, gold: g, slime: got, slime2: got2, keys: k };
}
// new slime: an empty party slot first, then the barn; if the barn is full, replace the weakest if the new one is better
function place(s, L) {
  fitSlots(s);
  let i = s.party.indexOf(null); if (i >= 0) { s.party[i] = L; return true; }
  i = s.barn.indexOf(null); if (i >= 0) { s.barn[i] = L; return true; }
  let w = 0; for (let k = 1; k < s.barn.length; k++) if (s.barn[k] < s.barn[w]) w = k;
  if (s.barn[w] < L) { s.barn[w] = L; return true; }
  return false;
}

// ----- Moving and merging -----
function drop(s, fz, fi, tz, ti) {
  if (fz === tz && fi === ti) return "none";
  const from = zone(s, fz), to = zone(s, tz), a = from[fi], b = to[ti];
  if (a === null || a === undefined) return "none";
  if (b === null || b === undefined) { to[ti] = a; from[fi] = null; return "move"; }
  if (a === b) { to[ti] = a + 1; from[fi] = null; noteBest(s, a + 1); return "merge"; }
  to[ti] = a; from[fi] = b; return "swap";
}
function placeSorted(s, list) {
  list = list.slice().sort((x, y) => y - x);
  s.party = s.party.map((_, i) => i < list.length ? list[i] : null);
  const rest = list.slice(s.party.length);
  s.barn = s.barn.map((_, i) => i < rest.length ? rest[i] : null);
}
function equipBest(s) { fitSlots(s); placeSorted(s, allSlimes(s)); }
// merge pairs lowest first, but never below a full party, and hold back slimes an open order asks for; then equip best
function mergeAll(s) {
  const count = []; let left = 0;
  for (const t of allSlimes(s)) { count[t] = (count[t] || 0) + 1; left++; }
  const hold = [];
  for (const o of (s.orders || [])) hold[o.level] = (hold[o.level] || 0) + o.count;
  let n = 0;
  for (let t = 0; t < count.length; t++)
    while ((count[t] || 0) - (hold[t] || 0) >= 2 && left > partySize(s)) { left--; count[t] -= 2; count[t + 1] = (count[t + 1] || 0) + 1; noteBest(s, t + 1); n++; }
  if (!n) return 0;
  const list = []; count.forEach((c, t) => { for (let k = 0; k < (c || 0); k++) list.push(t); });
  placeSorted(s, list);
  return n;
}
function canMergeAny(s) { const seen = {}; for (const t of allSlimes(s)) { if (seen[t]) return true; seen[t] = 1; } return false; }

// ----- Upgrades -----
function upCost(s, id) { const u = EXP.upgrades[id]; return u.base * Math.pow(u.growth, s.up[id]); }
function upUnlocked(s, id) { return s.maxZone >= (EXP.upgrades[id].zone || 0); }
function canUpgrade(s, id) { const u = EXP.upgrades[id]; return upUnlocked(s, id) && s.up[id] < u.max && s.gold >= upCost(s, id); }
function upgrade(s, id) { if (!canUpgrade(s, id)) return false; s.gold -= upCost(s, id); s.up[id]++; fitSlots(s); return true; }

// ----- Keys: trade, choose the zone to run -----
function canTrade(s, z) { return z >= 1 && z < s.maxZone && (s.keys[z] || 0) >= EXP.tradeRate; }
function tradeKeys(s, z, times) {
  let n = 0;
  while (n < (times || 1) && canTrade(s, z)) { s.keys[z] -= EXP.tradeRate; s.keys[z + 1] = (s.keys[z + 1] || 0) + 1; n++; }
  return n;
}
// the selected zone if you have a key for it, otherwise the highest zone below it you have keys for (zone 1 is free)
function pickRunZone(s) { for (let z = s.zone; z > 0; z--) if ((s.keys[z] || 0) >= 1) return z; return 0; }
function setZone(s, z) {
  if (z > s.maxZone || z === s.zone) return;
  if (s.running && s.runZone > 0) s.keys[s.runZone] = (s.keys[s.runZone] || 0) + 1;   // switching refunds the key of the run in progress
  s.zone = z; s.runT = 0; s.running = false;
}

// ----- Orders board: buyers want specific slimes; sell them for gold or Trail Rations -----
function ordersOpen(s) { return s.maxZone >= EXP.orders.zone; }
function newOrder(s, rng) {
  // ask for slimes near what you are finding now: from two zones back up to a few ranks above your newest zone's drop
  const lo = zoneDrop(Math.max(0, s.maxZone - 2)), hi = Math.max(lo, Math.min(s.best, zoneDrop(s.maxZone) + 3));
  const level = lo + Math.floor(rng() * (hi - lo + 1));
  const count = level <= s.best - 2 && rng() < 0.35 ? 2 : 1;
  const rations = rng() < 0.25;
  const gold = zoneGold(s, s.maxZone) * 6 * Math.pow(1.6, level - zoneDrop(s.maxZone)) * count;
  return { level, count, reward: rations ? "rations" : "gold", gold: Math.max(1, gold), left: EXP.orders.lasts };
}
function ownedCount(s, L) { return allSlimes(s).filter(x => x === L).length; }
function canDeliver(s, i) { const o = s.orders[i]; return !!o && ownedCount(s, o.level) >= o.count; }
// would delivering take a slime out of the party?
function deliverTakesParty(s, i) { const o = s.orders[i]; return !!o && s.barn.filter(x => x === o.level).length < o.count; }
function deliver(s, i) {
  if (!canDeliver(s, i)) return false;
  const o = s.orders[i];
  let need = o.count;
  for (const z of [s.barn, s.party]) for (let k = 0; k < z.length && need > 0; k++) if (z[k] === o.level) { z[k] = null; need--; }
  if (o.reward === "gold") s.gold += o.gold;
  else s.boostT = Math.min(EXP.orders.rationsCap, s.boostT + EXP.orders.rationsTime);
  s.orders.splice(i, 1); s.delivered++;
  return true;
}
function skipOrder(s, i) { if (s.orders[i]) s.orders.splice(i, 1); }
function stepOrders(s, dt, rng) {
  if (!ordersOpen(s)) return;
  for (const o of s.orders) o.left = (o.left == null ? EXP.orders.lasts : o.left) - dt;   // buyers leave after a while
  s.orders = s.orders.filter(o => o.left > 0);
  if (s.orders.length >= EXP.orders.slots) return;
  s.orderT += dt;
  while (s.orderT >= EXP.orders.every && s.orders.length < EXP.orders.slots) {
    s.orderT -= EXP.orders.every; s.orders.push(newOrder(s, rng)); s.newOrder = true;
  }
  if (s.orders.length >= EXP.orders.slots) s.orderT = 0;
}

// ----- Tick: the expedition progresses and repeats automatically -----
function stepExp(s, dt, rng) {
  rng = rng || Math.random;
  fitSlots(s);
  s.time += dt;
  stepOrders(s, dt, rng);
  if (!s.party.some(x => x !== null)) return;   // nobody to send
  if (s.boostT > 0) s.boostT = Math.max(0, s.boostT - dt);
  let left = dt, guard = 0;
  while (left > 0 && guard++ < 1000) {
    if (!s.running) {   // start a run: pay its key
      s.runZone = pickRunZone(s);
      if (s.runZone > 0) s.keys[s.runZone]--;
      s.running = true;
    }
    const T = zoneTime(s, s.runZone), need = T - s.runT;
    if (left < need) { s.runT += left; break; }
    left -= need; s.runT = 0; s.running = false;
    finishRun(s, rng, s.runZone);
    if (s.up.auto && s.autoOn) mergeAll(s);
  }
}

if (typeof module !== "undefined") module.exports = { EXP, tierName, zoneName, tierOf, rankOf, levelName, newExpState, partySize,
  barnSize, fitSlots, allSlimes, unitCount, levelPower, partyPower, zoneNeed, zoneDrop, zoneGold, zoneSpeed, zoneTime, slimeChance,
  finishRun, place, drop, equipBest, mergeAll, canMergeAny, upCost, upUnlocked, canUpgrade, upgrade, setZone, stepExp,
  keysFor, powerRatio, keyYield, extraSlimeChance, canTrade, tradeKeys, pickRunZone,
  ordersOpen, newOrder, ownedCount, canDeliver, deliverTakesParty, deliver, skipOrder };
