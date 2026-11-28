// Expedition prototype core (rules only, shared by the page and test sims).
// Your party (up to 3 slimes) runs expeditions that never fail. Each run can bring back a slime and always brings gold.
// Slimes only come from expeditions. Zone 1 is free; every other zone costs 1 key per run, and keys for a zone drop in the zone below. Two identical slimes (same tier and rank) merge into the next rank; two at +4 make the next tier.
const EXP = {
  ranks: 5,               // base, +1 ... +4
  tierPower: 10,          // power of a tier vs the tier below (at base rank)
  rankBonus: 1.25,        // power per rank
  zoneCap: 400,           // zones keep going past Dragon's Nest (400 keeps the numbers safely inside JavaScript's range)
  partyStart: 3,
  team2Zone: 4,           // Zone 5 unlocks Team B
  team2Size: 3,
  barnStart: 10,
  baseTime: 20,           // seconds for zone 1 with a party exactly at its power
  zoneTimeGrowth: 1.2,    // each zone takes this much longer
  reqGap: 3,              // zone 2 wants a party 3 ranks above what zone 1 drops
  needStep: 2.5,          // each zone's power need rises about 2.5 ranks, but drops only rise 2: later zones need more merging
  dropStep: 2,            // each zone drops slimes 2 ranks higher
  slimeChance: 0.4,       // chance a run brings back a slime (every full 100% is a sure slime; future layers push it past 100%)
  luckyUp: 0.15,          // chance that slime is 1 rank higher
  overSpeedPow: 0.5,      // overpowered: speed = (power / need) ^ 0.5, up to maxSpeed
  maxSpeed: 4,
  goldBase: 5, goldGrowth: 2,
  keyBase: 0.4,           // chance of a key for the next zone per run, at exactly the zone's power (40%)
  keyOverPow: 0.25,       // over-powered: chance = keyBase × (power/need)^0.25, no cap: every full 100% is a guaranteed key
  keyMax: Infinity,       // (e.g. 220% = 2 keys plus a 20% chance at a third)
  keyUnderPow: 2,         // under-powered: chance = keyBase × (power/need)^2 (low odds)
  unlockClears: 10,       // clears of your newest zone needed to unlock the next
  unlockNeedsPower: false, // no power check to unlock: a weak party is just very slow
  unlockKeys: 1,          // free keys when a zone unlocks
  tradeRate: 6,           // trade this many keys of a zone for 1 key of the next zone
  // what each zone unlocks when you reach it (index = zone number - 1)
  unlocks: {
    1: "Better Nets and Haggling upgrades",
    2: "Orders board",
    3: "Auto-Merge upgrade",
    4: "Team B: a second expedition team",
    5: "Bigger Party upgrade",
    7: "Key automation: auto zone changer and key crafting",
    9: "Selling the ranch: Scales and the Scale shop",
    11: "Mutations and the Slime Zoo (coming soon)",
    19: "Dragon's Nest: clear it for your first Dragon Egg",
  },
  keyAutoZone: 7,         // Zone 8 unlocks key automation (it stays unlocked after selling the ranch)
  orders: { zone: 2, slots: 3, every: 90, lasts: 480, rationsTime: 120, rationsSpeed: 2, rationsCap: 600 },
  // ----- Dragons: eggs from Dragon's Nest and beyond; feed slimes to hatch and grow them; they survive selling the ranch -----
  dragons: {
    nestZone: 19,            // Dragon's Nest (Zone 20)
    eggChance: 0.02,         // per run in Zone 20 or higher
    maxEggs: 3, maxDragons: 3,
    hatchWarmth: 5e9,        // slime power fed to hatch an egg (each slime gives its power)
    stageGrowth: [0, 5e10, 5e12, 5e14],   // food needed to reach each stage
    stageNames: ["Hatchling", "Juvenile", "Adult", "Elder"],
    elements: {
      fire:  { name: "Fire",  color: "#ff7a45", desc: "Expeditions faster", per: 0.25 },
      water: { name: "Water", color: "#4fb3ff", desc: "Slime chance up",    per: 0.10 },
      earth: { name: "Earth", color: "#9bc46b", desc: "Slime power up",     per: 0.5 },
      wind:  { name: "Wind",  color: "#c9f0ff", desc: "Key chance up",      per: 0.2 },
      gold:  { name: "Gold",  color: "#f2c75c", desc: "Gold up",            per: 1.0 },
    },
  },
  // ----- Selling the ranch (reset) -----
  sell: { zone: 9, base: 5, growth: 1.35, bestBonus: 0.02 },  // from Zone 10: Scales = 5 × 1.35^(zones past 10) × (1 + 2% per best-slime rank)
  shop: {
    power: { name: "Dragon's Blessing", base: 2,  growth: 1.8, max: 99, desc: "All slime power ×1.25" },
    nets:  { name: "Scale Nets",        base: 3,  growth: 1.7, max: 30, desc: "+5% slime chance (can go past 100%)" },
    keys:  { name: "Lucky Keys",        base: 3,  growth: 1.7, max: 30, desc: "+15% key chance" },
    gold:  { name: "Gold Rush",         base: 1,  growth: 1.6, max: 99, desc: "Gold ×1.5" },
    start: { name: "Head Start",        base: 6,  growth: 2.5, max: 5,  desc: "Start each run 1 zone further, with 3 keys for each" },
    crew:  { name: "Early Crew",        base: 8,  growth: 3,   max: 3,  desc: "Team B unlocks 1 zone earlier" },
    barn:  { name: "Big Barn",          base: 2,  growth: 1.8, max: 20, desc: "+2 Breeding Pen space" },
  },
  upgrades: {
    wagon: { zone: 0, name: "Faster Wagons",  base: 30,   growth: 4,   max: 40, desc: "Expeditions are 10% faster" },
    nets:  { zone: 1, name: "Better Nets",    base: 150,  growth: 10,  max: 20, desc: "+2% slime chance" },
    train: { zone: 0, name: "Training Yard",  base: 80,   growth: 8,   max: 99, desc: "Party power ×1.25" },
    keys:  { zone: 2, name: "Key Ring",       base: 300,  growth: 6,   max: 20, desc: "+20% key drop chance" },
    gold:  { zone: 1, name: "Haggling",       base: 50,   growth: 5,   max: 99, desc: "Gold from expeditions ×1.5" },
    party: { zone: 5, name: "Bigger Party",   base: 5000, growth: 50,  max: 2,  desc: "+1 slot for your main team (Team A only)" },
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
// past Dragon's Nest, zones get generated names: a place for each zone, a numeral for each lap through the list
const ZONE_MORE_A = ["Ashen", "Frozen", "Sunken", "Howling", "Gilded", "Shattered", "Verdant", "Starlit", "Molten", "Hollow", "Ancient", "Stormy"];
const ZONE_MORE_B = ["Wastes", "Reef", "Spire", "Caverns", "Marsh", "Peaks", "Hollows", "Canyon", "Wilds", "Depths"];
function zoneName(z) {
  if (z < ZONE_NAMES.length) return ZONE_NAMES[z];
  const k = z - ZONE_NAMES.length, n = ZONE_MORE_A.length * ZONE_MORE_B.length;
  const lap = Math.floor(k / n), i = k % n;
  const roman = ["", " II", " III", " IV", " V", " VI", " VII", " VIII", " IX", " X"];
  return ZONE_MORE_A[i % ZONE_MORE_A.length] + " " + ZONE_MORE_B[Math.floor(i / ZONE_MORE_A.length)] + (roman[lap] != null ? roman[lap] : " " + (lap + 1));
}
function tierOf(L) { return Math.floor(L / EXP.ranks); }
function rankOf(L) { return L % EXP.ranks; }
function levelName(L) { const r = rankOf(L); return tierName(tierOf(L)) + (r ? " +" + r : ""); }

function newTeam() { return { party: [], zone: 0, runZone: 0, runT: 0, running: false, autoOn: false, autoMin: 5 }; }
// ----- Dragon bonuses -----
function dragonStage(d) { const g = EXP.dragons.stageGrowth; let st = 0; for (let i = 1; i < g.length; i++) if (d.food >= g[i]) st = i; return st; }
function dragonBonus(s, el) {   // summed over your dragons of that element: per × (stage + 1)
  let b = 0; for (const d of (s.dragons || [])) if (d.el === el) b += EXP.dragons.elements[el].per * (dragonStage(d) + 1);
  return b;
}
function newMeta() { const m = {}; for (const id in EXP.shop) m[id] = 0; return m; }
function newExpState(keep) {
  const s = { gold: 0, teams: [newTeam(), newTeam()], barn: [], best: 0, maxZone: 0, runs: 0, found: 0,
    scales: 0, sold: 0, meta: newMeta(), flags: { orders: false, auto: false, keyAuto: false }, bestZoneEver: 0, craft: { on: false, keep: 10 }, eggs: [], dragons: [],
    up: { wagon: 0, nets: 0, train: 0, keys: 0, gold: 0, party: 0, pen: 0, auto: 0 }, autoOn: true, time: 0, lastLoot: null,
    orders: [], orderT: 0, boostT: 0, delivered: 0, keys: [] };
  if (keep) {   // carried over from selling the ranch
    s.scales = keep.scales; s.sold = keep.sold; s.meta = Object.assign(newMeta(), keep.meta); s.flags = Object.assign({}, keep.flags);
    s.bestZoneEver = keep.bestZoneEver || 0;
    if (keep.craft) s.craft = Object.assign({}, keep.craft);
    s.eggs = (keep.eggs || []).map(e => Object.assign({}, e)); s.dragons = (keep.dragons || []).map(d => Object.assign({}, d));
    if (keep.autoSettings) keep.autoSettings.forEach((a, i) => Object.assign(s.teams[i], a));
    if (s.flags.auto) s.up.auto = 1;   // Auto-Merge stays owned
    s.maxZone = Math.min(s.meta.start, EXP.zoneCap - 1);   // Head Start
    for (let z = 1; z <= s.maxZone; z++) s.keys[z] = 3;
    if (s.flags.orders || ordersOpen(s)) s.orderT = EXP.orders.every * EXP.orders.slots;
  }
  fitSlots(s);
  s.teams[0].party[0] = 0;   // you start with one Droplet
  return s;
}
// older saves had a single party: move it into Team A
function migrateExp(s, d) {
  if (d && !d.teams) {
    s.teams = [newTeam(), newTeam()];
    Object.assign(s.teams[0], { party: d.party || [], zone: d.zone || 0, runZone: d.runZone || 0, runT: d.runT || 0, running: !!d.running });
    delete s.party; delete s.zone; delete s.runZone; delete s.runT; delete s.running;
  }
  s.meta = Object.assign(newMeta(), (d && d.meta) || {});
  s.flags = Object.assign({ orders: false, auto: false, keyAuto: false }, (d && d.flags) || {});
  s.craft = Object.assign({ on: false, keep: 10 }, (d && d.craft) || {});
  s.eggs = (d && d.eggs) || s.eggs || []; s.dragons = (d && d.dragons) || s.dragons || [];
  s.teams.forEach(tm => { if (tm.autoOn == null) tm.autoOn = false; if (tm.autoMin == null) tm.autoMin = 5; });
  if (s.maxZone >= EXP.keyAutoZone) s.flags.keyAuto = true;
  if (s.maxZone >= EXP.orders.zone) s.flags.orders = true;
  if (s.up && s.up.auto) s.flags.auto = true;
  fitSlots(s);
  return s;
}

// ----- Teams and slots -----
function team2Zone(s) { return EXP.team2Zone - ((s.meta && s.meta.crew) || 0); }
function teamCount(s) { return s.maxZone >= team2Zone(s) ? 2 : 1; }
function partySize(s, ti) { return (ti || 0) === 0 ? EXP.partyStart + s.up.party : (teamCount(s) > 1 ? EXP.team2Size : 0); }
function barnSize(s) { return EXP.barnStart + s.up.pen + 2 * ((s.meta && s.meta.barn) || 0); }
function fitSlots(s) {
  s.teams.forEach((tm, ti) => { while (tm.party.length < partySize(s, ti)) tm.party.push(null); });
  while (s.barn.length < barnSize(s)) s.barn.push(null);
}
function zone(s, z) { return z === "party" ? s.teams[0].party : z === "party2" ? s.teams[1].party : s.barn; }
function allSlimes(s) { return s.teams[0].party.concat(s.teams[1].party, s.barn).filter(t => t !== null); }
function unitCount(s) { return allSlimes(s).length; }
function totalPartySlots(s) { let n = 0; for (let ti = 0; ti < teamCount(s); ti++) n += partySize(s, ti); return n; }

// ----- Power and zones -----
function levelPower(L) { return Math.pow(EXP.tierPower, tierOf(L)) * Math.pow(EXP.rankBonus, rankOf(L)); }
function trainMult(s) { return Math.pow(1.25, s.up.train) * Math.pow(1.25, (s.meta && s.meta.power) || 0) * (1 + dragonBonus(s, "earth")); }
function partyPower(s, ti) { let p = 0; for (const L of s.teams[ti || 0].party) if (L !== null) p += levelPower(L); return p * trainMult(s); }
function zoneNeed(z) { return z === 0 ? 1 : 3 * levelPower(Math.round(EXP.needStep * (z - 1)) + EXP.reqGap); }
function zoneDrop(z) { return EXP.dropStep * z; }
function zoneGold(s, z) { return EXP.goldBase * Math.pow(EXP.goldGrowth, z) * Math.pow(1.5, s.up.gold) * Math.pow(1.5, (s.meta && s.meta.gold) || 0) * (1 + dragonBonus(s, "gold")); }
function powerRatio(s, z, ti) { return partyPower(s, ti) / zoneNeed(z); }
// never fails: under-powered parties are slower (speed = power / need), over-powered faster (up to maxSpeed)
function zoneSpeed(s, z, ti) {
  const r = powerRatio(s, z, ti);
  return r >= 1 ? Math.min(EXP.maxSpeed, Math.pow(r, EXP.overSpeedPow)) : Math.max(r, 0.001);
}
function zoneTime(s, z, ti) { return EXP.baseTime * Math.pow(EXP.zoneTimeGrowth, z) * Math.pow(0.9, s.up.wagon) / zoneSpeed(s, z, ti) / (s.boostT > 0 ? EXP.orders.rationsSpeed : 1) / (1 + dragonBonus(s, "fire")); }
function slimeChance(s) { return EXP.slimeChance + 0.02 * s.up.nets + 0.05 * ((s.meta && s.meta.nets) || 0) + dragonBonus(s, "water"); }
function noteBest(s, L) { if (L > s.best) { if (tierOf(L) > tierOf(s.best)) s.lastDiscover = tierOf(L); s.best = L; } }

// ----- Expedition finishes: loot -----
function keysFor(s, z) { return z === 0 ? Infinity : (s.keys[z] || 0); }
// key chance for the next zone (1 = 100%): low when under-powered, higher when over-powered; past 100% each full 100% is a sure key
function keyYield(s, z, ti) {
  const r = powerRatio(s, z, ti);
  const c = EXP.keyBase * (r < 1 ? Math.pow(r, EXP.keyUnderPow) : Math.pow(r, EXP.keyOverPow)) * (1 + 0.2 * s.up.keys) * (1 + 0.15 * ((s.meta && s.meta.keys) || 0)) * (1 + dragonBonus(s, "wind"));
  return Math.min(EXP.keyMax, c);
}
function finishRun(s, rng, z, ti) {
  ti = ti || 0;
  if (z === undefined) z = s.teams[ti].zone;
  const g = zoneGold(s, z);
  s.gold += g; s.runs++;
  let got = null, got2 = null;
  const roll = () => { let L = zoneDrop(z) + (rng() < EXP.luckyUp ? 1 : 0); if (!place(s, L, ti)) return "full"; s.found++; noteBest(s, L); return L; };
  // slime chance: every full 100% is a sure slime, the rest a chance at one more
  const c = slimeChance(s), n = Math.floor(c) + (rng() < c - Math.floor(c) ? 1 : 0);
  if (n > 0) got = roll();
  if (n > 1) got2 = roll();
  for (let i = 2; i < n; i++) roll();
  // keys for the next zone
  let k = 0;
  if (z < EXP.zoneCap - 1) {
    { const c = keyYield(s, z, ti); k = Math.floor(c) + (rng() < c - Math.floor(c) ? 1 : 0); }
    if (k) s.keys[z + 1] = (s.keys[z + 1] || 0) + k;
  }
  // clearing your top zone unlocks the next (being badly under-powered just makes that run very slow)
  if (z === s.maxZone) s.clears = (s.clears || 0) + 1;   // clears of your newest zone count toward unlocking the next
  if (z === s.maxZone && z < EXP.zoneCap - 1 && s.clears >= EXP.unlockClears && (!EXP.unlockNeedsPower || partyPower(s, ti) >= zoneNeed(z))) {
    s.clears = 0;
    s.maxZone = z + 1; s.lastZone = z + 1;
    s.keys[z + 1] = (s.keys[z + 1] || 0) + EXP.unlockKeys;
    if (s.maxZone === EXP.orders.zone && !s.flags.orders) s.orderT = EXP.orders.every * EXP.orders.slots;   // the board opens with full orders
    fitSlots(s);
    if (s.maxZone === team2Zone(s)) equipBest(s);   // Team B starts with your next-best slimes
    if (s.maxZone >= EXP.orders.zone) s.flags.orders = true;   // the Orders board stays open after selling the ranch
    if (s.maxZone >= EXP.keyAutoZone) s.flags.keyAuto = true;  // so does key automation
    s.bestZoneEver = Math.max(s.bestZoneEver || 0, s.maxZone);
  }
  // Dragon Eggs: the first clear of Dragon's Nest ever gives one; after that a small chance per run in Zone 20+
  let egg = false;
  if (z >= EXP.dragons.nestZone && s.eggs.length < EXP.dragons.maxEggs) {
    if (!s.flags.firstEgg) { s.flags.firstEgg = true; egg = true; }
    else if (rng() < EXP.dragons.eggChance) egg = true;
    if (egg) { s.eggs.push({ warmth: 0 }); s.newEgg = true; }
  }
  s.lastLoot = { zone: z, team: ti, gold: g, slime: got, slime2: got2, keys: k, egg };
  (s.lastLoots = s.lastLoots || [])[ti] = s.lastLoot;
}
// new slime: an empty slot in the team that found it, then the other team, then the barn;
// if the barn is full, replace the weakest if the new one is better
function place(s, L, ti) {
  fitSlots(s);
  const order = (ti || 0) === 0 ? [0, 1] : [1, 0];
  for (const t of order) { const p = s.teams[t].party, i = p.indexOf(null); if (i >= 0) { p[i] = L; return true; } }
  let i = s.barn.indexOf(null); if (i >= 0) { s.barn[i] = L; return true; }
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
// best slimes fill Team A, the next best Team B, the rest go to the barn
function placeSorted(s, list) {
  list = list.slice().sort((x, y) => y - x);
  let k = 0;
  for (const tm of s.teams) tm.party = tm.party.map(() => k < list.length ? list[k++] : null);
  s.barn = s.barn.map(() => k < list.length ? list[k++] : null);
}
function equipBest(s) { fitSlots(s); placeSorted(s, allSlimes(s)); }
// merge pairs lowest first. Two equipped slimes never merge with each other: a pair needs at least one slime from the barn
// (a barn slime can merge into an equipped one to make it stronger). Never drops below full parties, and holds back slimes
// an open order asks for. Then equips your best.
function mergeAll(s) {
  const eq = [], bn = [];
  for (const tm of s.teams) for (const t of tm.party) if (t !== null) eq[t] = (eq[t] || 0) + 1;
  for (const t of s.barn) if (t !== null) bn[t] = (bn[t] || 0) + 1;
  const hold = [];
  for (const o of (s.orders || [])) hold[o.level] = (hold[o.level] || 0) + o.count;
  let left = allSlimes(s).length;
  const keep = totalPartySlots(s), top = Math.max(eq.length, bn.length) + 30;
  let n = 0;
  for (let t = 0; t < top; t++) {
    let b = bn[t] || 0, e = eq[t] || 0;
    const held = Math.min(hold[t] || 0, b + e);   // order slimes come out of the barn first
    let freeB = Math.max(0, b - held), freeE = e - Math.max(0, held - b);
    // barn + barn pairs
    while (freeB >= 2 && left > keep) { freeB -= 2; b -= 2; bn[t + 1] = (bn[t + 1] || 0) + 1; left--; n++; noteBest(s, t + 1); }
    // one barn slime left over: merge it into an equipped one
    if (freeB >= 1 && freeE >= 1 && left > keep) { b--; e--; eq[t + 1] = (eq[t + 1] || 0) + 1; left--; n++; noteBest(s, t + 1); }
    bn[t] = b; eq[t] = e;
  }
  if (!n) return 0;
  const list = [];
  for (let t = 0; t < top + 1; t++) { for (let k = 0; k < (bn[t] || 0) + (eq[t] || 0); k++) list.push(t); }
  placeSorted(s, list);
  return n;
}
function canMergeAny(s) { const seen = {}; for (const t of allSlimes(s)) { if (seen[t]) return true; seen[t] = 1; } return false; }

// ----- Upgrades -----
function upCost(s, id) { const u = EXP.upgrades[id]; return u.base * Math.pow(u.growth, s.up[id]); }
function upUnlocked(s, id) { return s.maxZone >= (EXP.upgrades[id].zone || 0) || (id === "auto" && s.flags && s.flags.auto); }
function canUpgrade(s, id) { const u = EXP.upgrades[id]; return upUnlocked(s, id) && s.up[id] < u.max && s.gold >= upCost(s, id); }
function upgrade(s, id) { if (!canUpgrade(s, id)) return false; s.gold -= upCost(s, id); s.up[id]++; if (id === "auto") s.flags.auto = true; fitSlots(s); return true; }

// ----- Selling the ranch -----
function canSell(s) { return s.maxZone >= EXP.sell.zone; }
function scalesFor(s) {
  if (!canSell(s)) return 0;
  return Math.floor(EXP.sell.base * Math.pow(EXP.sell.growth, s.maxZone - EXP.sell.zone) * (1 + EXP.sell.bestBonus * s.best));
}
// everything resets except Scales, the Scale shop, kept unlocks (Orders board, Auto-Merge) and your record
function sellRanch(s) {
  if (!canSell(s)) return null;
  const got = scalesFor(s);
  return newExpState({ scales: s.scales + got, sold: s.sold + 1, meta: s.meta, flags: s.flags, bestZoneEver: Math.max(s.bestZoneEver || 0, s.maxZone),
    craft: s.craft, eggs: s.eggs, dragons: s.dragons, autoSettings: s.teams.map(tm => ({ autoOn: tm.autoOn, autoMin: tm.autoMin })) });
}
function shopCost(s, id) { const u = EXP.shop[id]; return Math.ceil(u.base * Math.pow(u.growth, s.meta[id])); }
function canShop(s, id) { return s.meta[id] < EXP.shop[id].max && s.scales >= shopCost(s, id); }
function shopBuy(s, id) {
  if (!canShop(s, id)) return false;
  s.scales -= shopCost(s, id); s.meta[id]++;
  fitSlots(s);
  return true;
}

// ----- Keys: trade, choose the zone to run -----
function canTrade(s, z) { return z >= 1 && z < s.maxZone && (s.keys[z] || 0) >= EXP.tradeRate; }
function tradeKeys(s, z, times) {
  let n = 0;
  while (n < (times || 1) && canTrade(s, z)) { s.keys[z] -= EXP.tradeRate; s.keys[z + 1] = (s.keys[z + 1] || 0) + 1; n++; }
  return n;
}
// the team's zone if you have a key for it, otherwise the highest zone below it you have keys for (zone 1 is free)
function pickRunZone(s, ti) { for (let z = s.teams[ti || 0].zone; z > 0; z--) if ((s.keys[z] || 0) >= 1) return z; return 0; }
function setZone(s, z, ti) {
  const tm = s.teams[ti || 0];
  if (z > s.maxZone || z === tm.zone) return;
  if (tm.running && tm.runZone > 0) s.keys[tm.runZone] = (s.keys[tm.runZone] || 0) + 1;   // switching refunds the key of the run in progress
  tm.zone = z; tm.runT = 0; tm.running = false; tm.fellFrom = null;
}

// ----- Feeding: Breeding Pen slimes (not ones an order is holding) go to the egg or a dragon -----
function feedableSlimes(s) {
  const hold = []; for (const o of s.orders) hold[o.level] = (hold[o.level] || 0) + o.count;
  const out = []; s.barn.forEach((L, i) => { if (L === null) return; if (hold[L] > 0) { hold[L]--; return; } out.push(i); });
  return out;
}
function feedValue(s) { return feedableSlimes(s).reduce((a, i) => a + levelPower(s.barn[i]), 0); }
function feedTo(s, target) {   // target: { egg: index } or { dragon: index }
  const idx = feedableSlimes(s); if (!idx.length) return 0;
  let food = 0; for (const i of idx) { food += levelPower(s.barn[i]); s.barn[i] = null; }
  if (target.egg != null) {
    const e = s.eggs[target.egg]; if (!e) return 0;
    e.warmth += food;
    if (e.warmth >= EXP.dragons.hatchWarmth && s.dragons.length < EXP.dragons.maxDragons) hatchEgg(s, target.egg);
  } else if (target.dragon != null) {
    const d = s.dragons[target.dragon]; if (!d) return 0;
    const before = dragonStage(d); d.food += food; if (dragonStage(d) > before) s.dragonGrew = d.name;
  }
  return food;
}
const DRAGON_NAMES = ["Ember", "Brook", "Moss", "Gale", "Midas", "Cinder", "Tide", "Bramble", "Zephyr", "Nugget", "Ash", "Ripple"];
function hatchEgg(s, i) {
  const els = Object.keys(EXP.dragons.elements), el = els[Math.floor(Math.random() * els.length)];
  const d = { el, food: 0, name: DRAGON_NAMES[(s.dragons.length * 5 + els.indexOf(el)) % DRAGON_NAMES.length] };
  s.eggs.splice(i, 1); s.dragons.push(d); s.hatched = d;
  return d;
}

// ----- Key automation (Zone 8) -----
function keyAutoOpen(s) { return !!(s.flags && s.flags.keyAuto); }
// zone changer: move a team up to the highest zone where you hold at least autoMin keys
function autoZoneUp(s, ti) {
  const tm = s.teams[ti];
  if (!keyAutoOpen(s) || !tm.autoOn) return;
  let z = s.maxZone; while (z > 0 && (s.keys[z] || 0) < Math.max(1, tm.autoMin)) z--;
  if (z > tm.zone) { tm.zone = z; tm.fellFrom = null; }
}
// key crafting: trade spare keys up, keeping `keep` keys in every zone
function autoCraft(s) {
  if (!keyAutoOpen(s) || !s.craft.on) return;
  for (let z = 1; z < s.maxZone; z++) {
    const spare = (s.keys[z] || 0) - s.craft.keep;
    if (spare >= EXP.tradeRate) tradeKeys(s, z, Math.floor(spare / EXP.tradeRate));
  }
}

// ----- Orders board: buyers want specific slimes; sell them for gold or Trail Rations -----
function ordersOpen(s) { return s.maxZone >= EXP.orders.zone || !!(s.flags && s.flags.orders); }
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
// orders are filled from the Breeding Pen only: equipped slimes must be unequipped first
function barnCount(s, L) { return s.barn.filter(x => x === L).length; }
function canDeliver(s, i) { const o = s.orders[i]; return !!o && barnCount(s, o.level) >= o.count; }
// enough copies exist, but some are equipped in a team
function deliverTakesParty(s, i) { const o = s.orders[i]; return !!o && barnCount(s, o.level) < o.count && ownedCount(s, o.level) >= o.count; }
function deliver(s, i) {
  if (!canDeliver(s, i)) return false;
  const o = s.orders[i];
  let need = o.count;
  for (let k = 0; k < s.barn.length && need > 0; k++) if (s.barn[k] === o.level) { s.barn[k] = null; need--; }
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

// ----- Tick: each team's expedition progresses and repeats automatically -----
function stepTeam(s, ti, dt, rng) {
  const tm = s.teams[ti];
  if (!tm.party.some(x => x !== null)) return;   // nobody to send
  let left = dt, guard = 0;
  while (left > 0 && guard++ < 1000) {
    if (!tm.running) {   // start a run: pay its key
      autoZoneUp(s, ti);
      tm.runZone = pickRunZone(s, ti);
      // out of keys: the team moves down for good (one way) and stays there until you pick a zone again
      if (tm.runZone !== tm.zone) { if (tm.fellFrom == null) tm.fellFrom = tm.zone; tm.zone = tm.runZone; }
      if (tm.runZone > 0) s.keys[tm.runZone]--;
      tm.running = true;
    }
    const T = zoneTime(s, tm.runZone, ti), need = T - tm.runT;
    if (left < need) { tm.runT += left; break; }
    left -= need; tm.runT = 0; tm.running = false;
    finishRun(s, rng, tm.runZone, ti);
    if (s.up.auto && s.autoOn) mergeAll(s);
  }
}
function stepExp(s, dt, rng) {
  rng = rng || Math.random;
  fitSlots(s);
  s.time += dt;
  stepOrders(s, dt, rng);
  autoCraft(s);
  for (let ti = 0; ti < teamCount(s); ti++) stepTeam(s, ti, dt, rng);
  if (s.boostT > 0) s.boostT = Math.max(0, s.boostT - dt);
}

if (typeof module !== "undefined") module.exports = { EXP, dragonStage, dragonBonus, feedableSlimes, feedValue, feedTo, hatchEgg, keyAutoOpen, autoZoneUp, autoCraft, canSell, scalesFor, sellRanch, shopCost, canShop, shopBuy, team2Zone, newMeta, tierName, zoneName, tierOf, rankOf, levelName, newExpState, migrateExp, teamCount, totalPartySlots, partySize,
  barnSize, fitSlots, allSlimes, unitCount, levelPower, partyPower, zoneNeed, zoneDrop, zoneGold, zoneSpeed, zoneTime, slimeChance,
  finishRun, place, drop, equipBest, mergeAll, canMergeAny, upCost, upUnlocked, canUpgrade, upgrade, setZone, stepExp,
  keysFor, powerRatio, keyYield, canTrade, tradeKeys, pickRunZone,
  ordersOpen, newOrder, ownedCount, barnCount, canDeliver, deliverTakesParty, deliver, skipOrder };
