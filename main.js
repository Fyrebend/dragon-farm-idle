// Shown in Settings so you can tell you have the newest version. Update with every change.
const LATEST_UPDATE = "Test speed is now 10×, with small steps so automation behaves like normal speed";

// ===== Settings: tuning numbers =====
const SETTINGS = {
  startingSlimes: 1,        // free Tier 1 slimes at the start of a run (do not raise the price)
  unlockedTiers: 4,         // tiers available at the start (Render milestones unlock more)
  saveIntervalMs: 10000,    // autosave every 10 seconds
  maxOfflineHours: 8,       // cap on offline progress
  milestoneEvery: 25,       // every this many bought of a tier...
  milestoneMult: 1.2,       // ...multiplies that tier's production by this
  singlesBeforeChunks: 1,   // Milestone buying buys what it can afford for each tier's first this-many milestones
  // Rising price growth: on top of each tier's flat price growth, every purchase costs a little
  // MORE extra than the last. Extra factor = costRise ^ ((bought / 25) ^ 2).
  costRise: 1.01,
  compost: { perRender: 0.9, floor: 1e6 },   // Compost (Expand milestone 1): Render goal × perRender for each Render this Expand
  renderGoal: 1e8,          // Tier 1 slimes needed to unlock Render (also where base Goo reaches 1)
  // Farm capacity: how many slimes each tier can hold. It grows ×perGrowth each time you
  // Expand from a FULL farm, up to max. A full farm at max size can be sold (Sell the Farm).
  // Growth size: +flatDigits per growth (flatGrowths is set high, so every growth is the same +e10).
  // Lowering flatGrowths would make later growths ramp up (+11, +12, ...).
  farmCapacity: { base: 1e100, perGrowth: 1e10, flatDigits: 10, flatGrowths: 999, max: "1.8e308" },

  // Goo from a Render (called "essence" in the code) = (digits in Tier 1 slimes / digitDivisor) ^ power,
  // with the base at least 1, then × your Goo bonuses, rounded down. About 8 digits gives 1 base Goo,
  // 10 digits gives 2, 16 digits gives 8.
  essence: { digitDivisor: 7, power: 3 },
  // Price steps on uncapped Goo upgrades: from startLevel on, every `every` levels the
  // per-level price growth goes up by `step`. Goo Power: ×1.5 until 10, ×1.6 for 10–14, ×1.7 for 15–19...
  gooSteps: { startLevel: 10, every: 5, step: 0.1 },

  // Goo upgrades (permanent, kept through Render)
  essenceUpgrades: [
    // "tiers": which slime tiers the boost applies to (0 = Tier 1). Higher tiers multiply through
    // every tier below them, so boosts on high tiers are kept weaker.
    { id: "gooPower",    name: "Goo Power",      desc: "Tier 1 coins ×4 per level",       baseCost: 1,  costGrowth: 1.5, effect: 4,    maxLevel: null, tiers: [0] },
    { id: "slimeGrowth", name: "Slime Growth",   desc: "Tiers 2–4 ×2 per level",          baseCost: 3,  costGrowth: 1.5,   effect: 2,  maxLevel: null, tiers: [1, 2, 3] },
    { id: "deepGoo",     name: "Deep Goo",       desc: "Tiers 5–8 ×2 per level",          baseCost: 10, costGrowth: 1.6, effect: 2, maxLevel: null, tiers: [4, 5, 6, 7] },
    { id: "cheapSlimes", name: "Slime Discount", desc: "Slime prices ×0.65 per level",    baseCost: 2, costGrowth: 4, effect: 0.65, maxLevel: 5 },
    // Head Start: start each farm with (last farm's coins earned) ^ (effect × level), so 10% of the digits per level
    { id: "headStart",   name: "Head Start",     desc: "Start each new farm with coins, based on how far your last farm got", note: "Each level skips another 10% of the climb, up to half.", baseCost: 1, costGrowth: 3, effect: 0.1, maxLevel: 5 },
    { id: "upgradeHelper", name: "Upgrade Helper", desc: "Auto-buys coin upgrades, cheapest first", baseCost: 25, costGrowth: 1, effect: 1, maxLevel: 1 },
  ],

  // ----- Expand -----
  // Expand unlocks at expandGoal Tier 1 slimes and gives 1 Acre, plus 1 Acre for every
  // digitsPerAcre digits of Tier 1 slimes past the goal (up to the farm's capacity).
  // Expanding from a full farm also grows the farm.
  expandGoal: 1e100,
  acres: { digitsPerAcre: 10 },
  // Expanding also needs Goo: this many times the base Goo (before bonuses) a full farm gives.
  // A full-farm Render gets ×fullFarmBonus Goo, so the cost is about 5 full-farm Renders.
  expandGooTimes: 10,
  fullFarmBonus: 2,

  // Expand milestones: rewards for how many times you've Expanded (any Expand counts)
  expandMilestones: [
    { expands: 1, id: "autoRender",   text: "Auto-Render (settings in the Automation tab)" },
    { expands: 1, id: "gooStarter",   text: "Start each Expand with 1 level in every Goo upgrade (including Upgrade Helper)" },
    { expands: 1, id: "compost",      text: "Compost: each Render this Expand lowers the Render goal ×0.9 (down to 1e6)" },
    { expands: 2, id: "fasterMilestones", text: "Purchase milestones every 20 slimes instead of 25" },
    { expands: 3, id: "keepRenderMs", text: "Render milestones no longer reset when you Expand" },
    { expands: 4, id: "autoGoo",      text: "Auto-buy Goo upgrades" },
    { expands: 9, id: "gooStart",     text: "Start each Expand with Goo Power and Slime Growth at level 5" },
    { expands: 12, id: "doubleGoo",    text: "×2 Goo from every Render" },
  ],

  // Acre upgrades (permanent, kept through Expand)
  // Acre upgrades were removed: Acres now level the Estate buildings
  acreUpgrades: [],

  // ----- Plots and buildings -----
  // Plots open on their own when the farm has grown this many times (an Expand from a full farm
  // grows it). One plot per building.
  plotUnlocks: [1, 3, 5, 999],   // the 4th plot opens when your coins first hit the cap (for the Coin Silo)
  // Coins stop at coinCap; each Coin Silo level raises it ×silo effect
  coinCap: "1.8e308",

  // ----- The Market: Sell the Farm -----
  // Every sale pays a flat amount of Scales; Broker upgrades and sale milestones multiply it.
  scalesPerSale: 1,
  brokerUpgrades: [
    { id: "betterBroker", name: "Better Broker",  desc: "Scales from every sale ×2 per level",                    baseCost: 1, costGrowth: 3, effect: 2,   maxLevel: null },
    { id: "gooBuyers",    name: "Goo Buyers",     desc: "Goo from every Render ×2 per level",                     baseCost: 1, costGrowth: 2, effect: 2,   maxLevel: null },
    { id: "landDeals",    name: "Land Deals",     desc: "Acres from every Expand ×1.5 per level",                 baseCost: 2, costGrowth: 2, effect: 1.5, maxLevel: null },
    { id: "surveyed",     name: "Surveyed Land",  desc: "After a sale, your new farm starts grown 2 more times per level", baseCost: 3, costGrowth: 3, effect: 2, maxLevel: 5 },
    { id: "farmManager",  name: "Farm Manager",   desc: "Auto-Expands whenever your farm is full",                baseCost: 3, costGrowth: 1, effect: 1,   maxLevel: 1 },
    { id: "blueprints",   name: "Blueprints",     desc: "Keep your plots and buildings when you sell (levels go back to 1)", baseCost: 5, costGrowth: 1, effect: 1, maxLevel: 1 },
  ],
  // Rewards for how many farms you've sold
  saleMilestones: [
    { sales: 1,  id: "keepAutoRender", text: "Start every new farm with Auto-Render" },
    { sales: 2,  id: "earlyExpandMs",  text: "Start with Expand milestones 1–4 (Compost, Upgrade Helper, early Render milestones, auto-buy Goo upgrades)" },
    { sales: 3,  id: "allRenderMs",    text: "Start with every Render milestone" },
    { sales: 5,  id: "allPlots",       text: "Start with all 4 plots open" },
    { sales: 10, id: "doubleScales",   text: "×2 Scales from every sale" },
  ],
  // Building level cap: base + perGrowth × (times your farm has grown from a full Expand)
  buildingCap: { base: 0, perGrowth: 1 },
  // Buildings: placing one on a plot is free and permanent, and starts it at level 1.
  // Leveling up costs Goo; levels are kept through Expand. baseCost = Goo price of going from level 1 to 2.
  // Buildings: placing one is free and permanent (level 1). Levels cost Acres:
  // baseCost for level 2, then costStep more Acres for each level after that. No level cap.
  buildings: [
    { id: "gooVat",   name: "Goo Vat",   desc: "Goo from Render ×1.1 per level",            baseCost: 1, costStep: 1, effect: 1.1 },
    { id: "nursery",  name: "Nursery",   desc: "All slime tiers ×4 per level",        baseCost: 1, costStep: 1, effect: 4 },
    { id: "feedMill", name: "Feed Mill", desc: "Goo upgrade prices ×0.9 per level (max 10)", baseCost: 2, costStep: 1, effect: 0.9, maxLevel: 10 },
    // Hidden until your coins first reach the cap
    { id: "silo",     name: "Coin Silo", desc: "Coin cap ×1e10 per level",                  baseCost: 1, costStep: 0, effect: 1e10, hidden: true },
  ],

  // Rewards for total number of Renders. type "auto" = auto-buy for a tier, "tier" = unlocks a tier.
  // tier: 0 = Tier 1, 1 = Tier 2, ...
  renderMilestones: [
    { renders: 1,  type: "auto", tier: 0 },
    { renders: 2,  type: "tier", tier: 4 },
    { renders: 3,  type: "auto", tier: 1 },
    { renders: 5,  type: "tier", tier: 5 },
    { renders: 7,  type: "auto", tier: 2 },
    { renders: 10, type: "tier", tier: 6 },
    { renders: 13, type: "auto", tier: 3 },
    { renders: 16, type: "tier", tier: 7 },
    { renders: 20, type: "auto", tier: 4 },
    { renders: 25, type: "auto", tier: 5 },
    { renders: 30, type: "auto", tier: 6 },
    { renders: 35, type: "auto", tier: 7 },
  ],

  // Coin upgrades (reset on Render).
  // baseCost: price of level 1, costGrowth: price multiplier per level,
  // effect: strength per level, maxLevel: null = no cap
  upgrades: [
    { id: "richGoo",   name: "Shiny Coins",      desc: "Tier 1 coins ×1.5 per level", baseCost: 500,  costGrowth: 20, effect: 1.5,  maxLevel: null },
    { id: "digestion", name: "Fast Digestion",   desc: "All tiers ×1.1 per level",   baseCost: 2000, costGrowth: 15, effect: 1.1,  maxLevel: null },
    { id: "bargain",   name: "Bargain Pens",     desc: "Slime prices ×0.9 per level",baseCost: 5000, costGrowth: 10, effect: 0.9,  maxLevel: 5 },
  ],
  saveKey: "dragonFarmIdle_save",

  // One entry per slime tier.
  // baseCost: price of the first one bought
  // costGrowth: each purchase multiplies the price by this
  // rate: what each slime produces per second
  //       (Tier 1 makes coins, every other tier makes the tier below it)
  tiers: [
    { name: "Tier 1 Slime", baseCost: 10,   costGrowth: 1.15, rate: 1 },
    { name: "Tier 2 Slime", baseCost: 100,  costGrowth: 1.20, rate: 0.5 },
    { name: "Tier 3 Slime", baseCost: 1e4,  costGrowth: 1.25, rate: 0.3 },
    { name: "Tier 4 Slime", baseCost: 1e6,  costGrowth: 1.30, rate: 0.2 },
    { name: "Tier 5 Slime", baseCost: 1e9,  costGrowth: 1.45, rate: 0.15 },
    { name: "Tier 6 Slime", baseCost: 1e13, costGrowth: 1.55, rate: 0.1 },
    { name: "Tier 7 Slime", baseCost: 1e18, costGrowth: 1.65, rate: 0.1 },
    { name: "Tier 8 Slime", baseCost: 1e24, costGrowth: 1.75, rate: 0.1 },
  ],
};

// ===== Game state =====
// owned: total slimes of a tier (bought + produced by the tier above)
// bought: only the ones purchased; prices go up based on this number
function newGame() {
  const g = {
    // Permanent (kept through Expand)
    acres: new Decimal(0),
    expands: 0,
    acreUpgrades: Object.fromEntries(SETTINGS.acreUpgrades.map(u => [u.id, 0])),
    farmGrowths: 0,                             // how many times the farm has grown (Expands from a full farm)
    plotsOwned: 0,
    plots: [],                                  // building id placed on each owned plot (null = empty)
    autoGooOn: true,                            // on/off switch for auto-buying Goo upgrades
    buildingLevels: Object.fromEntries(SETTINGS.buildings.map(b => [b.id, 0])),
    autoRender: { on: true, mode: "goo", value: 10 },   // mode "goo": when gain ≥ value, "time": after value seconds
    totalEssence: new Decimal(0),
    autobuy: SETTINGS.tiers.map(() => true),   // on/off switch per tier (only works once unlocked)
    autoModes: SETTINGS.tiers.map(() => "ms"), // what each autobuyer buys: "ms" (full chunk to next milestone) or "max"
    buyModes: SETTINGS.tiers.map(() => "1"),   // what the Buy button on each slime row does: "1", "ms", or "max"
    buyMode: "1",                              // the Slimes switch: what Buy does on rows without a running autobuyer
    expandRevealed: false,                     // Expand button shows once Tier 1 first reaches 1e50 (or you've Expanded)
    autoSeen: [],                              // automations you've looked at (a dot marks new ones)
    autoUpgrades: true,                        // on/off switch for Upgrade Helper
    automationOn: true,                        // master switch: OFF pauses all automation
    prefs: { confirmRender: true, confirmExpand: true, openAfterRender: false, confirmPlace: true, offline: true, fastTest: false, confirmSell: true },
    stats: newStats(),
    siloUnlocked: false,                       // Coin Silo appears once coins first reach the cap
    // The Market (kept through Sell the Farm)
    scales: new Decimal(0),
    totalScales: new Decimal(0),
    sales: 0,
    brokerUpgrades: Object.fromEntries(SETTINGS.brokerUpgrades.map(u => [u.id, 0])),
    autoExpandOn: true,
    lastTick: Date.now(),
  };
  resetExpand(g);
  return g;
}
// Play statistics (kept forever, reset only by erasing the save)
function newStats() {
  return {
    started: Date.now(),
    playTime: 0,          // seconds with the game open and running (offline time not counted)
    offlineTime: 0,       // seconds of offline progress you received
    renders: 0,           // all-time Renders
    rendersThisExpand: 0,
    runStart: 0,          // playTime when this farm (Render run) started
    expandStart: 0,       // playTime when this Expand started
    firstRender: null,
    firstExpand: null,
    firstSale: null,
    saleStart: 0,         // playTime when this farm (since the last sale) started
    saleLog: [],
    bestGoo: "0",
    renderLog: [],        // first 10 + latest 50 Renders: [number, playTime, run seconds, Goo]
    expandLog: [],        // every Expand
    events: [],           // restarts, setting changes, etc.
  };
}
// Share of real time spent at 10× test speed since the last Expand ("0%" to "100%")
function fastShare(st) {
  const real = (st.realTime || 0) - (st.realAtExpand || 0);
  const fast = (st.fastReal || 0) - (st.fastAtExpand || 0);
  return real > 0 ? Math.round(fast / real * 100) : 0;
}
function statEvent(text) {
  const st = game.stats;
  st.events.push(formatTime(st.playTime) + " " + text);
  if (st.events.length > 40) st.events.shift();
}
// "1h 23m", "4m 05s", "12s"
function formatTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s2 = sec % 60;
  if (h > 0) return h + "h " + String(m).padStart(2, "0") + "m";
  if (m > 0) return m + "m " + String(s2).padStart(2, "0") + "s";
  return s2 + "s";
}

// Everything that Expand wipes (Goo layer + the run)
function resetExpand(g) {
  const has = id => expandMilestoneReached(id, g);
  g.essence = new Decimal(0);
  g.lastFarmCoins = new Decimal(0);   // Head Start's "last farm" (cleared on Expand)
  g.savingForExpand = false;
  g.expandRenders = 0;                // Renders this Expand (Compost counts these)          // auto-buy saves Goo for the Expand cost once the farm has been full
  g.essUpgrades = Object.fromEntries(SETTINGS.essenceUpgrades.map(u => [u.id, 0]));
  // Expand milestone 1: every Goo upgrade starts at level 1
  if (has("gooStarter")) SETTINGS.essenceUpgrades.forEach(u => { g.essUpgrades[u.id] = 1; });
  if (!has("keepRenderMs")) g.renders = 0;
  if (has("gooStart")) { g.essUpgrades.gooPower = Math.max(5, g.essUpgrades.gooPower); g.essUpgrades.slimeGrowth = Math.max(5, g.essUpgrades.slimeGrowth); }
  resetRun(g);
}
// Everything that Render wipes
function resetRun(g) {
  g.coins = startingCoins(g);
  g.runCoins = new Decimal(0);   // total coins earned this run (spending doesn't lower it)
  g.tiers = SETTINGS.tiers.map((t, i) => ({
    owned: new Decimal(i === 0 ? SETTINGS.startingSlimes : 0),
    bought: new Decimal(0),
  }));
  g.upgrades = Object.fromEntries(SETTINGS.upgrades.map(u => [u.id, 0]));
  g.runTime = 0;                 // seconds spent in this run (for Auto-Render timing)
}
function startingCoins(g) {
  const lvl = (g.essUpgrades && g.essUpgrades.headStart) || 0;
  return headStartFrom(g.lastFarmCoins || new Decimal(0), lvl);
}
// Head Start coins from a farm that earned `farmCoins`
function headStartFrom(farmCoins, lvl) {
  if (lvl <= 0 || farmCoins.lte(1)) return new Decimal(0);
  return farmCoins.pow(SETTINGS.essenceUpgrades.find(u => u.id === "headStart").effect * lvl).floor();
}
let game = newGame();

// ===== Number formatting =====
// Under 1 million: full number with commas (12,345)
// 1 million and up: short names (1.25M, 3.40B) until they run out, then scientific (1.23e36)
const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
function format(num, decimals = 2) {
  num = new Decimal(num);
  if (num.lt(1e6)) {
    const n = num.toNumber();
    const shown = Number.isInteger(n) ? n : Number(n.toFixed(decimals));
    return shown.toLocaleString("en-US", { maximumFractionDigits: decimals });
  }
  const exp = num.log10().floor().toNumber();
  const group = Math.floor(exp / 3);
  if (group < SUFFIXES.length) {
    const scaled = num.div(new Decimal(10).pow(group * 3)).toNumber();
    return scaled.toFixed(2) + SUFFIXES[group];
  }
  const mantissa = num.div(new Decimal(10).pow(exp)).toNumber();
  return mantissa.toFixed(2) + "e" + exp.toLocaleString("en-US");
}
function formatWhole(num) {
  return format(new Decimal(num).floor(), 0);
}

// ===== Costs and production =====
// Costs paid in whole-number currencies are rounded: the big-number library can return
// tiny errors like 3^3 = 27.000000000000004, which would block buying with exactly 27.
// ===== Upgrades =====
function upgradeDef(id) {
  return SETTINGS.upgrades.find(u => u.id === id);
}
function upgradeLevel(id) {
  return game.upgrades[id] || 0;
}
function upgradeEffect(id) {
  return new Decimal(upgradeDef(id).effect).pow(upgradeLevel(id));
}
function upgradeCost(id) {
  const u = upgradeDef(id);
  return new Decimal(u.costGrowth).pow(upgradeLevel(id)).mul(u.baseCost).round();
}
function upgradeMaxed(id) {
  const u = upgradeDef(id);
  return u.maxLevel !== null && upgradeLevel(id) >= u.maxLevel;
}
function buyUpgrade(id) {
  if (upgradeMaxed(id)) return;
  const cost = upgradeCost(id);
  if (game.coins.lt(cost)) return;
  game.coins = game.coins.sub(cost);
  game.upgrades[id] = upgradeLevel(id) + 1;
  render();
}

// ===== Essence upgrades =====
function essDef(id) { return SETTINGS.essenceUpgrades.find(u => u.id === id); }
function essLevel(id) { return game.essUpgrades[id] || 0; }
function essEffect(id) { return new Decimal(essDef(id).effect).pow(essLevel(id)); }
function essCost(id) {
  const u = essDef(id);
  const lvl = essLevel(id);
  const mill = buildingEffect("feedMill");   // Feed Mill: cheaper Goo upgrades
  if (u.maxLevel !== null) return new Decimal(u.costGrowth).pow(lvl).mul(u.baseCost).mul(mill).round().max(1);
  // Multiply each level's growth: plain growth below startLevel, then stepped up every few levels
  const st = SETTINGS.gooSteps;
  let cost = new Decimal(u.baseCost).mul(new Decimal(u.costGrowth).pow(Math.min(lvl, st.startLevel)));
  for (let from = st.startLevel, k = 1; from < lvl; from += st.every, k++) {
    const n = Math.min(st.every, lvl - from);
    cost = cost.mul(new Decimal(u.costGrowth + st.step * k).pow(n));
  }
  return cost.mul(mill).round().max(1);
}
function essMaxed(id) {
  const u = essDef(id);
  return u.maxLevel !== null && essLevel(id) >= u.maxLevel;
}
function buyEssUpgrade(id) {
  if (essMaxed(id)) return;
  const cost = essCost(id);
  if (game.essence.lt(cost)) return;
  game.essence = game.essence.sub(cost);
  levelUpEss(id);
  render();
}
// Raise a Goo upgrade by 1 (a new Head Start level applies from your next farm)
function levelUpEss(id) {
  game.essUpgrades[id] = essLevel(id) + 1;
}

// ===== Acre upgrades =====
function acreDef(id) { return SETTINGS.acreUpgrades.find(u => u.id === id); }
function acreLevel(id) { return (game.acreUpgrades && game.acreUpgrades[id]) || 0; }
function acreEffect(id) { return new Decimal(acreDef(id).effect).pow(acreLevel(id)); }
function acreCost(id) {
  const u = acreDef(id);
  if (u.costStep !== undefined) return new Decimal(u.baseCost + u.costStep * acreLevel(id));
  return new Decimal(u.costGrowth).pow(acreLevel(id)).mul(u.baseCost).round();
}
function acreMaxed(id) {
  const u = acreDef(id);
  return u.maxLevel !== null && acreLevel(id) >= u.maxLevel;
}
function buyAcreUpgrade(id) {
  if (!acreDef(id)) return;   // Acre upgrades were removed
  if (acreMaxed(id)) return;
  const cost = acreCost(id);
  if (game.acres.lt(cost)) return;
  game.acres = game.acres.sub(cost);
  game.acreUpgrades[id] = acreLevel(id) + 1;
  // Veteran Farmer counts right away for the current Expand too
  render();
}

// ===== Plots and buildings =====
function buildingDef(id) { return SETTINGS.buildings.find(b => b.id === id); }
// Buildings you can see and place (the Coin Silo appears once coins first hit the cap)
function buildingAvailable(b) { return !b.hidden || game.siloUnlocked; }
// Coins stop here: 1.8e308, raised by the Coin Silo
function coinCap() {
  return new Decimal(SETTINGS.coinCap).mul(buildingEffect("silo"));
}
function buildingOwned(id) { return buildingPlaced(id); }
function buildingPlaced(id) { return game.plots.includes(id); }
function buildingLevel(id) { return game.buildingLevels[id] || 0; }
// Effect only counts while the building is placed on a plot
function buildingEffect(id) {
  if (!buildingPlaced(id)) return new Decimal(1);
  return new Decimal(buildingDef(id).effect).pow(buildingLevel(id));
}
// Acres to go from the current level to the next
function buildingCost(id) {
  const b = buildingDef(id);
  return new Decimal(b.baseCost + b.costStep * Math.max(0, buildingLevel(id) - 1));
}
function buildingMaxLevel() { return Infinity; }   // no cap: Acres limit how fast buildings grow
// Some buildings also have their own max level (Training Grounds: 5)
function buildingMaxed(id) {
  const m = buildingDef(id).maxLevel;
  return m !== undefined && buildingLevel(id) >= m;
}
function buildingAtCap(id) {
  return buildingMaxed(id);
}
function upgradeBuilding(id) {
  const cost = buildingCost(id);
  if (buildingAtCap(id) || game.acres.lt(cost)) return;
  game.acres = game.acres.sub(cost);
  game.buildingLevels[id] = buildingLevel(id) + 1;
  render();
}
// Plots open on their own (first Expand, then farm growths). Plots you already have are never taken away.
function plotsUnlocked() {
  // Reaching the coin cap also opens the last plot, so there's always room for the Coin Silo
  if (saleMilestoneReached("allPlots")) return SETTINGS.plotUnlocks.length;
  return SETTINGS.plotUnlocks.filter((need, i) => game.farmGrowths >= need
    || (game.siloUnlocked && i === SETTINGS.plotUnlocks.length - 1)).length;
}
function syncPlots() {
  let opened = false;
  while (game.plots.length < Math.min(plotsUnlocked(), SETTINGS.plotUnlocks.length)) { game.plots.push(null); opened = true; }
  game.plotsOwned = game.plots.length;
  return opened;
}
function buyPlot() { syncPlots(); }   // kept for older code paths: plots can't be bought anymore
// Placing a building is free and permanent, starting at level 1
function placeBuilding(plotIndex, id) {
  const b = buildingDef(id);
  if (!b || !buildingAvailable(b) || buildingPlaced(id) || game.plots[plotIndex]) return;
  askConfirm("confirmPlace", "Place " + b.name + "?",
    "Buildings can't be moved once placed, so choose carefully.", () => {
      if (game.plots[plotIndex]) return;
      game.plots[plotIndex] = id;
      game.buildingLevels[id] = Math.max(1, buildingLevel(id));
      choosingPlot = null;
      render();
    });
}
function milestoneEveryValue() {
  return expandMilestoneReached("fasterMilestones") ? 20 : SETTINGS.milestoneEvery;
}

// ===== Expand =====
function farmCapacity() {
  const c = SETTINGS.farmCapacity;
  return Decimal.min(new Decimal(10).pow(capacityDigits(game.farmGrowths)), new Decimal(c.max));
}
// Digits of farm capacity after `growths` farm growths
function capacityDigits(growths) {
  const c = SETTINGS.farmCapacity;
  let d = new Decimal(c.base).log10().toNumber();
  for (let i = 1; i <= growths; i++) d += growthDigits(i);
  return d;
}
// How many digits growth number `i` adds (1st growth = 1)
function growthDigits(i) {
  const c = SETTINGS.farmCapacity;
  return i <= c.flatGrowths ? c.flatDigits : c.flatDigits + (i - c.flatGrowths);
}
// "1e10", "1e13", ... for the next growth
function nextGrowthText() {
  return "1e" + growthDigits(game.farmGrowths + 1);
}
function expandMilestoneReached(id, g = game) {
  const m = SETTINGS.expandMilestones.find(m => m.id === id);
  if (!m) return false;
  return g.expands >= m.expands || (saleMilestoneReached("earlyExpandMs", g) && m.expands <= 4);
}
// The farm has reached its largest possible size
function atTrueCap() {
  return farmCapacity().gte(new Decimal(SETTINGS.farmCapacity.max));
}
function tierFull(i) {
  return game.tiers[i].owned.gte(farmCapacity());
}
function farmFull() {
  return tierFull(0);
}
function coinsAtLimit() {
  return game.coins.gte(coinCap());
}
// Enough Tier 1 slimes to Expand (the Goo cost is checked separately)
function slimesReadyForExpand() {
  return game.tiers[0].owned.gte(SETTINGS.expandGoal);
}
// Base Goo (before bonuses) a Render with Tier 1 at `t1` slimes would give
function baseGooFor(t1) {
  const e = SETTINGS.essence;
  return Decimal.max(1, new Decimal(t1).max(1).log10().div(e.digitDivisor).pow(e.power).floor());
}
// Goo needed to Expand: a few full farms' worth, so it scales with your farm size
function expandGooCost() {
  return baseGooFor(farmCapacity()).mul(SETTINGS.expandGooTimes);
}
// Auto-buy for Goo upgrades only buys upgrades cheaper than this (half the Expand Goo cost)
function autoGooLimit() {
  return expandGooCost().div(2);
}
function expandGooMet() {
  return game.essence.gte(expandGooCost());
}
function expandUnlocked() {
  return slimesReadyForExpand() && expandGooMet();
}
// Expanding now would grow the farm (only from a full farm, and only until max size)
function expandWillGrow() {
  return farmFull() && !atTrueCap();
}
function tier1Digits() {
  return game.tiers[0].owned.max(1).log10();
}
function acreGain() {
  if (!slimesReadyForExpand()) return new Decimal(0);
  const past = tier1Digits().sub(new Decimal(SETTINGS.expandGoal).log10());
  return past.div(SETTINGS.acres.digitsPerAcre).floor().add(1).max(1).mul(brokerEffect("landDeals")).floor();
}
// Tier 1 slimes needed for one more Acre (can't go past the farm's capacity)
function tier1ForNextAcre() {
  const digits = new Decimal(SETTINGS.expandGoal).log10().add(acreGain().max(1).mul(SETTINGS.acres.digitsPerAcre));
  return new Decimal(10).pow(digits);
}
// 0 to 1: progress toward the next Acre (in digits, so it moves steadily)
function nextAcreProgress() {
  const per = SETTINGS.acres.digitsPerAcre;
  const past = tier1Digits().toNumber() - new Decimal(SETTINGS.expandGoal).log10().toNumber();
  return Math.max(0, Math.min(1, (past - (acreGain().max(1).toNumber() - 1) * per) / per));
}
function doExpand() {
  if (!expandUnlocked()) return;
  if (!expandUnlocked()) return;
  const growNote = expandWillGrow() ? "Your farm will grow ×" + nextGrowthText() + ".\n\n" : "Your farm isn't full, so it won't grow this time.\n\n";
  askConfirm("confirmExpand", "Expand for " + formatWhole(acreGain()) + " Acre" + (acreGain().eq(1) ? "" : "s") + "?\n",
    growNote + "You'll start fresh: coins, slimes, coin upgrades, Goo, Goo upgrades, and Render milestones reset (milestones can keep some of these).", finishExpand);
}
function finishExpand() {
  if (!expandUnlocked()) return;
  const gain = acreGain();
  const grew = expandWillGrow();
  const st = game.stats;
  st.expandLog.push({
    n: game.expands + 1, at: Math.round(st.playTime), took: Math.round(st.playTime - st.expandStart),
    renders: st.rendersThisExpand, acres: gain.toNumber(), grew,
    cap: Math.round(farmCapacity().log10().toNumber()), t1: Math.round(game.tiers[0].owned.max(1).log10().toNumber()),
    coins: Math.round(game.coins.max(1).log10().toNumber()),
    gp: essLevel("gooPower"), sg: essLevel("slimeGrowth"), dg: essLevel("deepGoo"),
    acre: formatWhole(game.acres) + " held",
    bld: ["gooVat", "nursery", "feedMill", "silo"].map(id => buildingPlaced(id) ? buildingLevel(id) : "-").join("/"),
    goo: Math.round(game.essence.max(1).log10().toNumber() * 10) / 10,
    offline: !!game.prefs.offline,
    fast: fastShare(st),
  });
  st.realAtExpand = st.realTime || 0;
  st.fastAtExpand = st.fastReal || 0;
  if (st.firstExpand === null) st.firstExpand = Math.round(st.playTime);
  st.expandStart = st.playTime;
  st.runStart = st.playTime;
  st.rendersThisExpand = 0;
  game.acres = game.acres.add(gain);
  game.expands += 1;
  if (grew) game.farmGrowths += 1;
  resetExpand(game);
  if (grew) toast("Your farm grew! Slimes can now reach " + formatWhole(farmCapacity()), true);
  if (syncPlots()) toast("A new building plot opened in your Estate", true);
  SETTINGS.expandMilestones.filter(m => m.expands === game.expands)
    .forEach(m => toast("Expand milestone: " + m.text, true));
  save();
  render();
  toast("Expanded for +" + formatWhole(gain) + " Acres", true);
}

// ===== The Market: Sell the Farm =====
// Auto-Render comes from Expand milestone 1 (or the first sale milestone)
function hasAutoRender() {
  return expandMilestoneReached("autoRender") || saleMilestoneReached("keepAutoRender");
}
function brokerDef(id) { return SETTINGS.brokerUpgrades.find(u => u.id === id); }
function brokerLevel(id, g = game) { return (g.brokerUpgrades && g.brokerUpgrades[id]) || 0; }
function brokerEffect(id) { return new Decimal(brokerDef(id).effect).pow(brokerLevel(id)); }
function brokerMaxed(id) { const u = brokerDef(id); return u.maxLevel !== null && brokerLevel(id) >= u.maxLevel; }
function brokerCost(id) { const u = brokerDef(id); return new Decimal(u.costGrowth).pow(brokerLevel(id)).mul(u.baseCost).round(); }
function buyBroker(id) {
  if (brokerMaxed(id)) return;
  const cost = brokerCost(id);
  if (game.scales.lt(cost)) return;
  game.scales = game.scales.sub(cost);
  game.brokerUpgrades[id] = brokerLevel(id) + 1;
  render();
}
function saleMilestoneReached(id, g = game) {
  const m = SETTINGS.saleMilestones.find(m => m.id === id);
  return !!m && (g.sales || 0) >= m.sales;
}
// The farm is at its max size and full: it can be sold
function saleReady() {
  return atTrueCap() && game.tiers[0].owned.gte(farmCapacity());
}
function scalesForSale() {
  return new Decimal(SETTINGS.scalesPerSale).mul(brokerEffect("betterBroker"))
    .mul(saleMilestoneReached("doubleScales") ? 2 : 1).floor();
}
function doSell() {
  if (!saleReady()) return;
  const gain = scalesForSale();
  askConfirm("confirmSell", "Sell the Farm for " + formatWhole(gain) + " Scale" + (gain.eq(1) ? "" : "s") + "?",
    "Everything on the farm resets: coins, slimes, Goo, Acres, Expands, buildings, and all their upgrades and milestones.\n\nYou keep your Scales, Broker upgrades, and sale milestones.", finishSell);
}
function finishSell() {
  if (!saleReady()) return;
  const gain = scalesForSale();
  const st = game.stats;
  st.saleLog.push({ n: game.sales + 1, at: Math.round(st.playTime), took: Math.round(st.playTime - st.saleStart), expands: game.expands, scales: gain.toNumber() });
  if (st.firstSale === null) st.firstSale = Math.round(st.playTime);
  st.saleStart = st.expandStart = st.runStart = st.playTime;
  st.rendersThisExpand = 0;
  const first = game.sales === 0;
  const keepPlots = brokerLevel("blueprints") > 0 ? game.plots.slice() : null;
  const keep = {
    prefs: game.prefs, stats: game.stats, autobuy: game.autobuy, autoUpgrades: game.autoUpgrades,
    autoModes: game.autoModes, buyMode: game.buyMode, autoSeen: game.autoSeen,
    automationOn: game.automationOn, autoGooOn: game.autoGooOn, autoRender: game.autoRender, autoExpandOn: game.autoExpandOn,
    scales: game.scales.add(gain), totalScales: game.totalScales.add(gain), sales: game.sales + 1, brokerUpgrades: game.brokerUpgrades,
  };
  game = newGame();
  Object.assign(game, keep);
  startNewSale(keepPlots);
  save();
  render();
  toast("Sold the farm for +" + formatWhole(gain) + " Scale" + (gain.eq(1) ? "" : "s") + "!", true);
  SETTINGS.saleMilestones.filter(m => m.sales === game.sales).forEach(m => toast("Sale milestone: " + m.text, true));
  if (first) showTab("panel-market");
}
// Head starts for a new farm after a sale
function startNewSale(keepPlots) {
  const grown = SETTINGS.brokerUpgrades.find(u => u.id === "surveyed").effect * brokerLevel("surveyed");
  game.farmGrowths = grown;
  game.expands = grown;
  if (keepPlots) {
    game.plots = keepPlots;
    keepPlots.forEach(id => { if (id) game.buildingLevels[id] = 1; });
  }
  syncPlots();
  resetExpand(game);   // applies Expand milestones from the sale milestones
}
// Testing only: jump to a full farm at max size so Sell the Farm can be tried right away
function loadTestSave() {
  if (!confirm("Load a test farm that's ready to sell?\n\nThis replaces your current farm progress (Scales and Broker upgrades are kept).")) return;
  while (farmCapacity().lt(new Decimal(SETTINGS.farmCapacity.max))) game.farmGrowths++;
  game.expands = Math.max(game.expands, game.farmGrowths);
  game.siloUnlocked = true;
  game.tiers.forEach((t, i) => { if (i < 4) t.owned = farmCapacity(); });
  game.coins = coinCap();
  syncPlots();
  statEvent("Loaded test farm (ready to sell)");
  save();
  render();
  toast("Test farm loaded: Sell the Farm is ready", true);
}

// ===== Render milestones =====
function milestoneReached(m) { return game.renders >= m.renders || saleMilestoneReached("allRenderMs"); }
function unlockedTierCount() {
  const extra = SETTINGS.renderMilestones.filter(m => m.type === "tier" && milestoneReached(m)).length;
  return Math.min(SETTINGS.tiers.length, SETTINGS.unlockedTiers + extra);
}
function autoUnlocked(i) {
  return SETTINGS.renderMilestones.some(m => m.type === "auto" && m.tier === i && milestoneReached(m));
}
function milestoneText(m) {
  return (m.type === "auto" ? "Auto-buy Tier " : "Unlock Tier ") + (m.tier + 1);
}

// ===== Render =====
// Compost (Expand milestone): Render goal ×0.1 for every Expand done, up to 10
function renderGoalValue() {
  const goal = new Decimal(SETTINGS.renderGoal);
  if (!expandMilestoneReached("compost")) return goal;
  const c = SETTINGS.compost;
  return Decimal.max(new Decimal(c.floor), goal.mul(new Decimal(c.perRender).pow(game.expandRenders || 0)));
}
function renderUnlocked() {
  return game.tiers[0].owned.gte(renderGoalValue());
}
function highestTierOwned() {
  let h = 0;
  game.tiers.forEach((t, i) => { if (t.owned.gte(1)) h = i + 1; });
  return h;
}
function totalSlimes() {
  return game.tiers.reduce((sum, t) => sum.add(t.owned.floor()), new Decimal(0));
}
function gooMultiplier() {
  return buildingEffect("gooVat").mul(brokerEffect("gooBuyers")).mul(expandMilestoneReached("doubleGoo") ? 2 : 1);
}
// Goo is based on Tier 1 slimes (same stat that unlocks Render and Expand)
function gooSlimes() {
  return game.tiers[0].owned.floor();
}
// How many Tier 1 slimes you need for the next whole Goo (works the formula backwards)
function slimesForGoo(amount) {
  const e = SETTINGS.essence;
  // Base Goo is at least 1, so amounts up to the bonus only need the minimum slimes
  const digits = Decimal.max(1, new Decimal(amount).div(gooMultiplier()).ceil()).pow(1 / e.power).mul(e.digitDivisor);
  return new Decimal(10).pow(digits).ceil();
}
function slimesForNextGoo() {
  return slimesForGoo(essenceGain().add(1));
}
// 0 to 1: progress from the current Goo amount to the next one (log scale, so it moves steadily)
function nextGooProgress() {
  if (farmFull()) return 1;   // a full farm can't grow further this run
  const gain = essenceGain();
  const have = gooSlimes().max(1).log10();
  const from = slimesForGoo(gain).log10();
  const to = slimesForNextGoo().log10();
  const p = have.sub(from).div(to.sub(from)).toNumber();
  return Math.max(0, Math.min(1, p));
}
// "Base 125 Goo × 4.39 bonus = 549 Goo"
function gooBreakdown() {
  const e = SETTINGS.essence;
  const base = Decimal.max(1, gooSlimes().max(1).log10().div(e.digitDivisor).pow(e.power).floor());
  const mult = gooMultiplier();
  const baseText = formatWhole(base);
  const full = farmFull() ? "\nFull farm: ×" + SETTINGS.fullFarmBonus + " Goo!" : "";
  if (mult.lte(1)) return "Base " + baseText + " Goo (no Goo bonuses yet) = " + formatWhole(essenceGain()) + " Goo" + full;
  return "Base " + baseText + " Goo × " + format(mult, 2) + " bonus = " + formatWhole(essenceGain()) + " Goo" + full;
}
function essenceGain() {
  if (!renderUnlocked()) return new Decimal(0);
  const e = SETTINGS.essence;
  const digits = gooSlimes().max(1).log10().div(e.digitDivisor);
  // Base is at least 1 BEFORE bonuses, so your Goo bonus always counts (even on small Renders)
  const base = Decimal.max(1, digits.pow(e.power).floor());
  return base.mul(gooMultiplier()).mul(farmFull() ? SETTINGS.fullFarmBonus : 1).floor();
}
function doRender(auto = false) {
  if (!renderUnlocked()) return;
  if (auto) { finishRender(true); return; }
  askConfirm("confirmRender", "Render for " + formatWhole(essenceGain()) + " Goo?",
    "You'll start a fresh farm: coins, slimes, and coin upgrades reset.\n\n" + gooBreakdown(),
    () => finishRender(false));
}
function finishRender(auto) {
  if (!renderUnlocked()) return;
  const gain = essenceGain();
  game.essence = game.essence.add(gain);
  game.totalEssence = game.totalEssence.add(gain);
  game.renders += 1;
  game.expandRenders = (game.expandRenders || 0) + 1;
  game.lastFarmCoins = game.runCoins;
  const st = game.stats;
  st.renders += 1;
  st.rendersThisExpand += 1;
  if (st.firstRender === null) st.firstRender = Math.round(st.playTime);
  if (gain.gt(st.bestGoo)) st.bestGoo = gain.toString();
  // Keep the first 10 Renders plus the most recent 50
  st.renderLog.push([st.renders, Math.round(st.playTime), Math.round(st.playTime - st.runStart), gain.toString()]);
  if (st.renderLog.length > 60) st.renderLog.splice(10, 1);
  st.runStart = st.playTime;
  resetRun(game);
  if (!auto) {
    save();
    render();
    toast("Rendered for +" + formatWhole(gain) + " Goo");
    if (game.prefs.openAfterRender) showTab("panel-goo");
  }
  SETTINGS.renderMilestones
    .filter(m => m.renders === game.renders)
    .forEach(m => toast("Milestone reached: " + milestoneText(m) +
      (m.type === "auto" ? " (settings in the Automation tab)" : ""), true));
}

// ===== Confirm dialog with "don't ask again" =====
// Calls onYes right away if this kind of confirm is turned off in Settings.
function askConfirm(prefKey, title, text, onYes) {
  if (!game.prefs[prefKey]) { onYes(); return; }
  const modal = document.getElementById("confirm-modal");
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-text").textContent = text;
  const skip = document.getElementById("confirm-skip");
  skip.checked = false;
  modal.classList.add("open");
  const close = () => {
    modal.classList.remove("open");
    yes.onclick = null; no.onclick = null;
  };
  const yes = document.getElementById("confirm-yes");
  const no = document.getElementById("confirm-no");
  yes.onclick = () => {
    if (skip.checked) game.prefs[prefKey] = false;
    close();
    onYes();
  };
  no.onclick = close;
}

// ===== Pop-up messages =====
function toast(text, highlight = false) {
  const el = document.createElement("div");
  el.className = "toast" + (highlight ? " highlight" : "");
  el.textContent = text;
  document.getElementById("toasts").appendChild(el);
  setTimeout(() => el.classList.add("hide"), highlight ? 5000 : 2500);
  setTimeout(() => el.remove(), highlight ? 5600 : 3100);
}

function tierCost(i, n = game.tiers[i].bought) {
  const t = SETTINGS.tiers[i];
  n = new Decimal(n);
  const blocks = n.div(25);
  const rise = new Decimal(SETTINGS.costRise).pow(blocks.mul(blocks));
  return new Decimal(t.costGrowth).pow(n).mul(t.baseCost).mul(rise)
    .mul(upgradeEffect("bargain")).mul(essEffect("cheapSlimes"));
}
// Only whole slimes produce; a slime that is still "growing" makes nothing yet
function milestoneCount(i) {
  return game.tiers[i].bought.div(milestoneEveryValue()).floor();
}
function milestoneMultValue() {
  return SETTINGS.milestoneMult;
}
function tierMultiplier(i) {
  return new Decimal(milestoneMultValue()).pow(milestoneCount(i));
}
function toNextMilestone(i) {
  const every = new Decimal(milestoneEveryValue());
  return every.sub(game.tiers[i].bought.mod(every));
}
function tierProduction(i) {
  let prod = game.tiers[i].owned.floor().mul(SETTINGS.tiers[i].rate).mul(tierMultiplier(i));
  prod = prod.mul(upgradeEffect("digestion")).mul(buildingEffect("nursery"));
  if (i === 0) prod = prod.mul(upgradeEffect("richGoo"));
  // Boosts that list which tiers they affect
  SETTINGS.essenceUpgrades.forEach(u => { if (u.tiers && u.tiers.includes(i)) prod = prod.mul(essEffect(u.id)); });
  SETTINGS.acreUpgrades.forEach(u => { if (u.tiers && u.tiers.includes(i)) prod = prod.mul(acreEffect(u.id)); });
  SETTINGS.buildings.forEach(b => { if (b.tiers && b.tiers.includes(i)) prod = prod.mul(buildingEffect(b.id)); });
  return prod;
}
// Shows production without fractions: "+3/sec", or "1 every 2s" when slower than 1/sec
function formatRate(perSec) {
  perSec = new Decimal(perSec);
  if (perSec.lte(0)) return "+0/sec";
  if (perSec.lt(1)) {
    const secs = new Decimal(1).div(perSec).toNumber();
    return "+1 every " + (Number.isInteger(secs) ? secs : secs.toFixed(1)) + "s";
  }
  return "+" + formatWhole(perSec) + "/sec";
}
function coinsPerSecond() {
  return tierProduction(0);
}
// A tier shows once it is unlocked and you own at least one of the tier below
function tierVisible(i) {
  if (i >= unlockedTierCount()) return false;
  return i === 0 || game.tiers[i - 1].owned.gte(1);
}

// ===== Player actions =====
function buyTier(i) {
  const cost = tierCost(i);
  // Full tiers can't take more slimes (so milestones can't keep stacking past capacity)
  if (!tierVisible(i) || tierFull(i) || game.coins.lt(cost)) return false;
  game.coins = game.coins.sub(cost);
  game.tiers[i].owned = game.tiers[i].owned.add(1);
  game.tiers[i].bought = game.tiers[i].bought.add(1);
  return true;
}
function buyOne(i) {
  buyTier(i);
  render();
}
// Cost of the next `count` slimes of a tier
function chunkCost(i, count) {
  let total = new Decimal(0);
  const n = game.tiers[i].bought;
  for (let k = 0; k < count; k++) total = total.add(tierCost(i, n.add(k)));
  return total;
}
// How many slimes of a tier you can afford right now (stops counting at `limit`)
function affordableCount(i, limit = 300) {
  let total = new Decimal(0), k = 0;
  const n = game.tiers[i].bought;
  while (k < limit) {
    total = total.add(tierCost(i, n.add(k)));
    if (total.gt(game.coins)) break;
    k++;
  }
  return k;
}
// Milestone mode: before a tier's first purchase milestone, buy as many as you can afford (stopping at
// the milestone); after that, only full chunks to the next milestone
function chunkSize(i) {
  const every = milestoneEveryValue();
  const toNext = toNextMilestone(i).toNumber();
  if (game.tiers[i].bought.lt(every * SETTINGS.singlesBeforeChunks)) return Math.max(1, Math.min(toNext, affordableCount(i, toNext)));
  return toNext;
}
// Buy a chunk (see chunkSize), only if all of it is affordable
function buyChunk(i) {
  const n = chunkSize(i);
  if (!tierVisible(i) || tierFull(i) || game.coins.lt(chunkCost(i, n))) return false;
  for (let k = 0; k < n; k++) if (!buyTier(i)) break;
  return true;
}
// The slime row's Buy button: ×1, to the next milestone, or max
// A row's buy mode follows its autobuyer while that autobuyer is running, unless you changed it by hand
function autobuyerRunning(i) {
  return game.automationOn && autoUnlocked(i) && !!game.autobuy[i];
}
// Rows with a running autobuyer buy like that autobuyer; every other row follows the Slimes switch
function effectiveBuyMode(i) {
  if (autobuyerRunning(i)) return game.autoModes[i] === "max" ? "max" : "ms";
  return game.buyMode;
}
function buyByMode(i) {
  const mode = effectiveBuyMode(i);
  if (mode === "ms") buyChunk(i);
  else if (mode === "max") { let c = 0; while (c < 1000 && buyTier(i)) c++; }
  else buyTier(i);
  render();
}
function cycleBuyMode() {
  const order = ["1", "ms", "max"];
  game.buyMode = order[(order.indexOf(game.buyMode) + 1) % order.length];
  render();
}
function buyMax(i) {
  let count = 0;
  while (count < 1000 && buyTier(i)) count++;
  render();
}

// ===== Game loop =====
// Work from the top tier down so each tier uses the amount from before this tick
function tick() {
  const now = Date.now();
  let seconds = Math.max(0, (now - game.lastTick) / 1000);
  game.lastTick = now;
  // Long gaps (closed, backgrounded, or asleep) are offline time. With offline progress OFF,
  // that time is skipped so everything is measured on real play time only.
  if (seconds > 5 || document.hidden) {
    if (game.prefs.offline) game.stats.offlineTime += seconds;
    else seconds = 0;
  } else {
    // 10× test speed: the game runs 10× faster, and stats count the normal-speed time a player would spend
    const speed = game.prefs.fastTest ? 10 : 1;
    game.stats.realTime = (game.stats.realTime || 0) + seconds;
    if (speed > 1) game.stats.fastReal = (game.stats.fastReal || 0) + seconds;
    seconds *= speed;
    game.stats.playTime += seconds;
  }

  // At test speed, advance in small steps so automation and production behave like normal speed
  const steps = (game.prefs.fastTest && seconds > 0.25) ? Math.min(60, Math.ceil(seconds / 0.2)) : 1;
  for (let k = 0; k < steps; k++) stepGame(seconds / steps);
  render();
}
// One step of the game: automation, production, caps, Auto-Render
function stepGame(seconds) {
  // Upgrade Helper: buy coin upgrades, cheapest first
  if (game.automationOn && essLevel("upgradeHelper") > 0 && game.autoUpgrades) {
    let bought = true, n = 0;
    while (bought && n < 100) {
      bought = false; n++;
      const options = SETTINGS.upgrades
        .filter(u => !upgradeMaxed(u.id))
        .sort((a, b) => upgradeCost(a.id).cmp(upgradeCost(b.id)));
      if (options.length && game.coins.gte(upgradeCost(options[0].id))) {
        game.coins = game.coins.sub(upgradeCost(options[0].id));
        game.upgrades[options[0].id] = upgradeLevel(options[0].id) + 1;
        bought = true;
      }
    }
  }

  // Expand milestone: auto-buy Goo upgrades, cheapest first
  // Auto-buy skips upgrades costing half the Expand Goo or more, so Goo builds up for the Expand
  if (game.automationOn && game.autoGooOn && expandMilestoneReached("autoGoo")) {
    const limit = autoGooLimit();
    for (let n = 0; n < 200; n++) {
      const options = SETTINGS.essenceUpgrades.filter(u => !essMaxed(u.id) && essCost(u.id).lt(limit))
        .sort((a, b) => essCost(a.id).cmp(essCost(b.id)));
      if (!options.length || game.essence.lt(essCost(options[0].id))) break;
      game.essence = game.essence.sub(essCost(options[0].id));
      levelUpEss(options[0].id);
    }
  }

  // Auto-buy: highest tier first, as many as affordable
  for (let i = game.tiers.length - 1; i >= 0; i--) {
    if (!game.automationOn || !autoUnlocked(i) || !game.autobuy[i]) continue;
    let n = 0;
    if (game.autoModes[i] === "max") while (n < 1000 && buyTier(i)) n++;
    else while (n < 40 && buyChunk(i)) n++;   // Milestone: only full chunks, saving up in between
  }

  const earned = coinsPerSecond().mul(seconds);
  game.coins = game.coins.add(earned);
  game.runCoins = game.runCoins.add(earned);
  for (let i = 1; i < game.tiers.length; i++) {
    const made = tierProduction(i).mul(seconds);
    game.tiers[i - 1].owned = game.tiers[i - 1].owned.add(made);
  }
  // Slimes can't go past the farm capacity; coins only stop at the true cap
  const cap = farmCapacity();
  game.tiers.forEach(t => { if (t.owned.gt(cap)) t.owned = cap; });
  const limit = coinCap();
  // First time coins hit the cap: the Coin Silo becomes a building option
  if (!game.siloUnlocked && game.coins.gte(limit)) {
    game.siloUnlocked = true;
    syncPlots();
    toast("Your coins hit the cap! A new building is available in your Estate: Coin Silo", true);
  }
  if (game.coins.gt(limit)) game.coins = limit;
  if (game.runCoins.gt(limit)) game.runCoins = limit;
  game.runTime += seconds;

  // Farm Manager (Broker): Auto-Expand whenever the farm is full
  if (game.automationOn && game.autoExpandOn && brokerLevel("farmManager") > 0 && expandUnlocked() && expandWillGrow()) {
    finishExpand();
    return;
  }

  // Auto-Render
  const ar = game.autoRender;
  if (game.automationOn && hasAutoRender() && ar.on && renderUnlocked()) {
    const ready = ar.mode === "goo" ? essenceGain().gte(ar.value) : game.runTime >= ar.value;
    if (ready) doRender(true);
  }
}

// ===== Building the tier list on screen =====
const tierRows = [];
function buildTierRows() {
  const container = document.getElementById("tiers");
  SETTINGS.tiers.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "tier-row";
    const makes = i === 0 ? "coins" : "Tier " + i;
    row.innerHTML = `
      <div class="tier-line">
        <div class="tier-name">
          <strong>T${i + 1}</strong>
          <span class="owned">0</span>
        </div>
        <div class="tier-mid">
          <span class="prod">+0/sec</span>
          <span class="muted tier-detail"><span class="makes">→ ${makes} · </span><span class="mult">×1</span> · <span class="next">0</span> to ×<span class="mval">${SETTINGS.milestoneMult}</span></span>
        </div>
        <div class="tier-buttons">
          <button class="buy-one"><span class="cost">0</span></button>

        </div>
      </div>
      <div class="mbar"><div class="mfill"></div></div>`;
    row.querySelector(".buy-one").addEventListener("click", () => buyByMode(i));
    container.appendChild(row);
    tierRows.push({
      row,
      owned: row.querySelector(".owned"),
      prod: row.querySelector(".prod"),
      cost: row.querySelector(".cost"),
      buyOne: row.querySelector(".buy-one"),
      mult: row.querySelector(".mult"),
      next: row.querySelector(".next"),
      mfill: row.querySelector(".mfill"),
      mval: row.querySelector(".mval"),
    });
  });
}

// ===== Building the upgrade list on screen =====
const upgradeRows = [];
function buildUpgradeRows() {
  const container = document.getElementById("upgrades");
  SETTINGS.upgrades.forEach(u => {
    const btn = document.createElement("button");
    btn.className = "upgrade-btn";
    btn.innerHTML = `
      <div class="up-top"><strong>${u.name}</strong><span class="chip lvl"></span></div>
      <div class="muted">${u.desc}</div>
      ${u.note ? `<div class="muted up-note">${u.note}</div>` : ""}
      <div class="up-bottom">
        <span>Now <span class="eff"></span></span>
        <span class="cost-line"></span>
      </div>`;
    btn.addEventListener("click", () => buyUpgrade(u.id));
    container.appendChild(btn);
    upgradeRows.push({
      id: u.id, btn,
      lvl: btn.querySelector(".lvl"),
      eff: btn.querySelector(".eff"),
      cost: btn.querySelector(".cost-line"),
    });
  });
}

// ===== Building the Render panel =====
const essRows = [];
const milestoneRows = [];
function buildRenderPanel() {
  const container = document.getElementById("ess-upgrades");
  SETTINGS.essenceUpgrades.forEach(u => {
    const btn = document.createElement("button");
    btn.className = "upgrade-btn ess";
    btn.innerHTML = `
      <div class="up-top"><strong>${u.name}</strong><span class="chip lvl"></span></div>
      <div class="muted">${u.desc}</div>
      ${u.note ? `<div class="muted up-note">${u.note}</div>` : ""}
      ${u.id === "headStart" ? `<div class="muted hs-last"></div>` : ""}
      <div class="up-bottom">
        <span>${u.id === "headStart" ? "Next farm starts with" : "Now"} <span class="eff"></span></span>
        <span class="cost-line"></span>
      </div>`;
    btn.addEventListener("click", () => buyEssUpgrade(u.id));
    container.appendChild(btn);
    essRows.push({
      id: u.id, btn,
      lvl: btn.querySelector(".lvl"),
      eff: btn.querySelector(".eff"),
      cost: btn.querySelector(".cost-line"),
      last: btn.querySelector(".hs-last"),
    });
  });
  const list = document.getElementById("milestones");
  SETTINGS.renderMilestones.forEach(m => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="m-req">${m.renders} Render${m.renders > 1 ? "s" : ""}</span><span>${milestoneText(m)}</span>`;
    list.appendChild(li);
    milestoneRows.push({ m, li });
  });
}

// ===== Automation tab =====
const autoTierRows = [];
function buildAutoPanel() {
  const list = document.getElementById("auto-tier-list");
  SETTINGS.tiers.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "auto-row";
    row.innerHTML = `<span>Tier ${i + 1}</span><span class="auto-ctrls"><button class="auto-btn mode"></button><button class="auto-btn onoff"></button></span>`;
    row.querySelector(".onoff").addEventListener("click", () => { game.autobuy[i] = !game.autobuy[i]; render(); });
    row.querySelector(".mode").addEventListener("click", () => { game.autoModes[i] = game.autoModes[i] === "max" ? "ms" : "max"; render(); });
    list.appendChild(row);
    autoTierRows.push({ row, onoff: row.querySelector(".onoff"), mode: row.querySelector(".mode") });
  });
}
// Every automation you've unlocked, by key (used for the "something new" dot)
function unlockedAutomations() {
  const keys = [];
  SETTINGS.tiers.forEach((t, i) => { if (autoUnlocked(i)) keys.push("t" + i); });
  if (essLevel("upgradeHelper") > 0) keys.push("helper");
  if (expandMilestoneReached("autoGoo")) keys.push("goo");
  if (hasAutoRender()) keys.push("render");
  if (brokerLevel("farmManager") > 0) keys.push("expand");
  return keys;
}
function renderAuto() {
  const keys = unlockedAutomations();
  const tab = document.getElementById("auto-tab");
  tab.style.display = keys.length ? "" : "none";
  if (currentTier === "auto") keys.forEach(k => { if (!game.autoSeen.includes(k)) game.autoSeen.push(k); });
  document.getElementById("auto-dot").style.display = keys.some(k => !game.autoSeen.includes(k)) ? "" : "none";
  if (currentTier !== "auto") return;
  document.getElementById("auto-paused-note").style.display = game.automationOn ? "none" : "";
  const anyTier = SETTINGS.tiers.some((t, i) => autoUnlocked(i));
  document.getElementById("auto-slimes-sec").style.display = anyTier ? "" : "none";
  autoTierRows.forEach((r, i) => {
    r.row.style.display = autoUnlocked(i) ? "" : "none";
    r.onoff.textContent = game.autobuy[i] ? "ON" : "OFF";
    r.onoff.classList.toggle("on", !!game.autobuy[i]);
    r.mode.textContent = (game.autoModes[i] === "max" ? "Max" : "Milestone") + " ⇄";
  });
  document.getElementById("auto-expand-sec").style.display = brokerLevel("farmManager") > 0 ? "" : "none";
  const ae = document.getElementById("auto-expand");
  ae.textContent = game.autoExpandOn ? "ON" : "OFF";
  ae.classList.toggle("on", game.autoExpandOn);
  document.getElementById("auto-goo-note").textContent = document.getElementById("goo-reserve").textContent || "Cheapest first";
}

// ===== Market panel =====
const brokerRows = [];
const saleMsRows = [];
function buildMarketPanel() {
  const container = document.getElementById("broker-upgrades");
  SETTINGS.brokerUpgrades.forEach(u => {
    const btn = document.createElement("button");
    btn.className = "upgrade-btn market";
    btn.innerHTML = `
      <div class="up-top"><strong>${u.name}</strong><span class="chip lvl"></span></div>
      <div class="muted">${u.desc}</div>
      <div class="up-bottom"><span>Now <span class="eff"></span></span><span class="cost-line"></span></div>`;
    btn.addEventListener("click", () => buyBroker(u.id));
    container.appendChild(btn);
    brokerRows.push({ id: u.id, btn, lvl: btn.querySelector(".lvl"), eff: btn.querySelector(".eff"), cost: btn.querySelector(".cost-line") });
  });
  const list = document.getElementById("sale-milestones");
  SETTINGS.saleMilestones.forEach(m => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="m-req">${m.sales} sale${m.sales > 1 ? "s" : ""}</span><span>${m.text}</span>`;
    list.appendChild(li);
    saleMsRows.push({ m, li });
  });
}
function brokerEffectText(id) {
  const lvl = brokerLevel(id);
  if (id === "farmManager" || id === "blueprints") return lvl > 0 ? "Owned" : "Not owned";
  if (id === "surveyed") return "starts grown " + (brokerDef(id).effect * lvl) + "×";
  return "×" + format(brokerEffect(id), 2);
}
function renderMarket() {
  const ready = saleReady();
  const showMarket = game.sales > 0 || ready;
  document.getElementById("market-tab").style.display = showMarket ? "" : "none";
  document.getElementById("scale-chip").style.display = game.sales > 0 ? "" : "none";
  document.getElementById("scale-chip-amount").textContent = formatWhole(game.scales);
  const sell = document.getElementById("sell-btn");
  sell.style.display = ready ? "" : "none";
  if (ready) document.getElementById("top-expand").style.display = "none";
  const gain = scalesForSale();
  document.getElementById("sell-sub").textContent = "+" + formatWhole(gain) + " Scale" + (gain.eq(1) ? "" : "s");
  if (!showMarket) { document.getElementById("market-dot").style.display = "none"; return; }
  document.getElementById("scale-amount").textContent = formatWhole(game.scales);
  document.getElementById("sale-count").textContent = game.sales;
  brokerRows.forEach(r => {
    const maxed = brokerMaxed(r.id);
    const cost = brokerCost(r.id);
    const max = brokerDef(r.id).maxLevel;
    r.lvl.textContent = "Lv " + brokerLevel(r.id) + (max !== null ? "/" + max : "");
    r.eff.textContent = brokerEffectText(r.id);
    r.cost.textContent = maxed ? (max === 1 ? "OWNED" : "MAXED") : formatWhole(cost) + " Scale" + (cost.eq(1) ? "" : "s");
    r.btn.disabled = maxed || game.scales.lt(cost);
    r.btn.classList.toggle("affordable", !r.btn.disabled);
    r.btn.classList.toggle("maxed", maxed);
  });
  saleMsRows.forEach(r => r.li.classList.toggle("done", game.sales >= r.m.sales));
  document.getElementById("market-dot").style.display =
    SETTINGS.brokerUpgrades.some(u => !brokerMaxed(u.id) && game.scales.gte(brokerCost(u.id))) ? "" : "none";
  const nextSale = SETTINGS.saleMilestones.find(m => game.sales < m.sales);
  document.getElementById("next-salems").textContent = nextSale ? "Next at " + nextSale.sales + " sales" : "All done";
  document.getElementById("salems-badge").textContent =
    SETTINGS.saleMilestones.filter(m => game.sales >= m.sales).length + "/" + SETTINGS.saleMilestones.length;
}

// ===== Building the Expand popup =====
const acreRows = [];
const expandMsRows = [];
function expandMilestones() {
  return SETTINGS.expandMilestones;
}
function buildExpandPanel() {
  const msList = document.getElementById("expand-milestones");
  expandMilestones().forEach(m => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="m-req">${m.expands} Expand${m.expands > 1 ? "s" : ""}</span><span>${m.text}</span>`;
    msList.appendChild(li);
    expandMsRows.push({ m, li });
  });
  const container = document.getElementById("acre-upgrades");
  SETTINGS.acreUpgrades.forEach(u => {
    const btn = document.createElement("button");
    btn.className = "upgrade-btn acre";
    btn.innerHTML = `
      <div class="up-top"><strong>${u.name}</strong><span class="chip lvl"></span></div>
      <div class="muted">${u.desc}</div>
      <div class="up-bottom">
        <span>Now <span class="eff"></span></span>
        <span class="cost-line"></span>
      </div>`;
    btn.addEventListener("click", () => buyAcreUpgrade(u.id));
    container.appendChild(btn);
    acreRows.push({ id: u.id, btn, lvl: btn.querySelector(".lvl"), eff: btn.querySelector(".eff"), cost: btn.querySelector(".cost-line") });
  });
}
function acreEffectText(id) {
  const lvl = acreLevel(id);
  if (id === "autoRender") return lvl > 0 ? "Owned" : "Not owned";
  if (id === "sharpMilestones") return "×" + format(milestoneMultValue(), 1) + " per milestone";
  return "×" + format(acreEffect(id), 2);
}

// ===== Farm panel (plots) =====
let farmKey = "";
let choosingPlot = null;
// "All buildings" list: lets you see what's available before buying a plot
let catalogBuilt = false;
function renderCatalog() {
  const list = document.getElementById("catalog");
  if (!catalogBuilt) {
    catalogBuilt = true;
    SETTINGS.buildings.forEach(b => {
      const row = document.createElement("div");
      row.className = "catalog-item";
      row.dataset.building = b.id;
      row.innerHTML = `<div class="plot-head"><strong>${b.name}</strong><span class="chip status"></span></div>
        <div class="muted">${b.desc}</div>
        <div class="muted">Level-ups cost Acres: ${b.baseCost}${b.costStep ? ", then +" + b.costStep + " per level" : " each"}</div>`;
      list.appendChild(row);
    });
  }
  list.querySelectorAll(".catalog-item").forEach(row => {
    const id = row.dataset.building;
    row.style.display = buildingAvailable(buildingDef(id)) ? "" : "none";
    row.querySelector(".status").textContent = buildingPlaced(id) ? "Placed · Lv " + buildingLevel(id) : "Not placed";
    row.classList.toggle("placed", buildingPlaced(id));
  });
}
function renderFarm() {
  const panelVisible = game.plots.length > 0 || game.expands > 0 || game.acres.gt(0);
  // (Acres tab visibility is handled in render())
  if (!panelVisible) return;
  const grid = document.getElementById("plots");
  // Rebuild the plot cards only when something structural changes
  const key = JSON.stringify([game.plots, game.plotsOwned, game.expands, game.farmGrowths, game.siloUnlocked, choosingPlot]);
  if (key !== farmKey) {
    farmKey = key;
    grid.innerHTML = "";
    game.plots.forEach((id, pi) => {
      const card = document.createElement("div");
      card.className = "plot";
      if (choosingPlot === pi) {
        card.classList.add("choosing");
        card.innerHTML = `<div class="plot-head"><strong>Choose a building</strong><button class="small-btn cancel">Cancel</button></div>`;
        SETTINGS.buildings.filter(buildingAvailable).forEach(b => {
          const opt = document.createElement("button");
          opt.className = "plot-option";
          opt.dataset.building = b.id;
          opt.innerHTML = `<div class="plot-head"><strong>${b.name}</strong><span class="opt-cost"></span></div><div class="muted">${b.desc}</div>`;
          opt.addEventListener("click", () => placeBuilding(pi, b.id));
          card.appendChild(opt);
        });
        card.querySelector(".cancel").addEventListener("click", () => { choosingPlot = null; render(); });
      } else if (!id && !SETTINGS.buildings.some(b => buildingAvailable(b) && !buildingPlaced(b.id))) {
        // Every building you can place is placed: hint at the one that's still hidden
        card.classList.add("empty");
        card.innerHTML = `<div class="muted">Empty plot</div><div class="lock-note">Reach ${formatWhole(new Decimal(SETTINGS.coinCap))} coins to unlock a new building for this plot</div>`;
      } else if (!id) {
        card.classList.add("empty");
        card.innerHTML = `<div class="muted">Empty plot</div><button class="place-btn">Place a building</button>`;
        card.querySelector(".place-btn").addEventListener("click", () => { choosingPlot = pi; render(); });
      } else {
        const b = buildingDef(id);
        card.innerHTML = `
          <div class="plot-head"><strong>${b.name}</strong><span class="chip lvl"></span></div>
          <div class="muted">${b.desc}</div>
          <div class="up-bottom"><span>Now <span class="eff"></span></span></div>
          <div class="plot-buttons">
            <button class="lvl-btn"></button>
          </div>`;
        card.dataset.building = id;
        card.querySelector(".lvl-btn").addEventListener("click", () => upgradeBuilding(id));
      }
      grid.appendChild(card);
    });
    if (game.plots.length < SETTINGS.plotUnlocks.length) {
      const locked = document.createElement("div");
      locked.className = "plot locked";
      const need = SETTINGS.plotUnlocks[game.plots.length];
      const more = Math.max(1, need - game.farmGrowths);
      locked.innerHTML = need >= 999
        ? `<div class="muted">More land</div><div class="lock-note">Opens when your coins first reach ${formatWhole(new Decimal(SETTINGS.coinCap))}</div>`
        : `<div class="muted">More land</div><div class="lock-note">Opens after your farm grows ${more} more time${more === 1 ? "" : "s"}</div>`;
      grid.appendChild(locked);
    }
  }
  // Live numbers
  grid.querySelectorAll(".plot[data-building]").forEach(card => {
    const id = card.dataset.building;
    const cost = buildingCost(id);
    const capped = buildingAtCap(id);
    card.querySelector(".lvl").textContent = "Lv " + buildingLevel(id) + (buildingDef(id).maxLevel !== undefined ? "/" + buildingDef(id).maxLevel : "");
    card.querySelector(".eff").textContent = buildingEffectText(id);
    const btn = card.querySelector(".lvl-btn");
    btn.textContent = buildingMaxed(id) ? "Fully upgraded" : "Level up: " + formatWhole(cost) + " Acre" + (cost.eq(1) ? "" : "s");
    btn.disabled = capped || game.acres.lt(cost);
  });
  // Building choices: price, and whether you can afford it
  grid.querySelectorAll(".plot-option").forEach(opt => {
    const b = buildingDef(opt.dataset.building);
    const placed = buildingPlaced(b.id);
    opt.querySelector(".opt-cost").textContent = placed ? "Already placed" : "Free";
    opt.disabled = placed;
  });
  document.getElementById("plot-count").textContent = game.plots.length + "/" + SETTINGS.plotUnlocks.length;
  renderCatalog();
}
function buildingEffectText(id) {
  const lvl = buildingLevel(id);
  if (id === "feedMill") return "Goo upgrades ×" + format(buildingEffect(id), 2);
  if (id === "silo") return "coins stop at " + formatWhole(coinCap());
  return "×" + format(buildingEffect(id), 2);
}

// ===== Screen updates =====
// Expand is shown (button and goal bar) after your first Render, or once you've Expanded or are close
function expandTeased() {
  if (game.tiers[0].owned.gte(new Decimal(SETTINGS.expandGoal).sqrt())) game.expandRevealed = true;
  return game.expandRevealed || game.expands > 0 || game.acres.gt(0)
    || game.tiers[0].owned.gte(new Decimal(SETTINGS.expandGoal).sqrt());
}

// ===== Stats screen =====
function statsSummary() {
  const st = game.stats;
  const t = x => x === null ? "not yet" : formatTime(x);
  return [
    ["Play time (at normal speed)", formatTime(st.playTime)],
    ["Real time spent", formatTime(st.realTime || st.playTime) + (game.prefs.fastTest ? " · 10× test speed ON" : "")],
    ["10× share this Expand", fastShare(st) + "% of real time"],
    ["Offline time received", formatTime(st.offlineTime)],
    ["Offline progress", game.prefs.offline ? "ON" : "OFF"],
    ["First Render at", t(st.firstRender)],
    ["First Expand at", t(st.firstExpand)],
    ["This farm (since last Render)", formatTime(st.playTime - st.runStart)],
    ["This Expand so far", formatTime(st.playTime - st.expandStart) + " · " + st.rendersThisExpand + " Renders"],
    ["Renders (all time)", String(st.renders)],
    ["Expands", String(game.expands) + " (farm grew " + game.farmGrowths + "×)"],
    ["Farms sold", String(game.sales) + (st.firstSale !== null ? " · first at " + formatTime(st.firstSale) : "")],
    ["This farm since last sale", formatTime(st.playTime - (st.saleStart || 0))],
    ["Best Goo from one Render", formatWhole(new Decimal(st.bestGoo))],
    ["Farm capacity", formatWhole(farmCapacity())],
    ["Coins", formatWhole(game.coins)],
    ["Goo levels (Power / Growth / Deep)", essLevel("gooPower") + " / " + essLevel("slimeGrowth") + " / " + essLevel("deepGoo")],
  ];
}
function statsText() {
  const st = game.stats;
  const lines = ["Dragon Farm Idle stats (" + LATEST_UPDATE + ")"];
  statsSummary().forEach(([k, v]) => lines.push(k + ": " + v));
  lines.push("", "Expands: # | at | took | renders | acres | grew | cap | T1 | coins | GP/SG/DG | Acres held | Vat/Nursery/FeedMill/Silo | offline | 10× share");
  st.expandLog.forEach(e => lines.push([e.n, formatTime(e.at), formatTime(e.took), e.renders, "+" + e.acres, e.grew ? "yes" : "no",
    "e" + e.cap, "e" + e.t1, "e" + e.coins, e.gp + "/" + e.sg + "/" + e.dg, e.acre || "?", e.bld || "?", e.offline ? "on" : "off", (e.fast ?? "?") + "%"].join(" | ")));
  if (st.saleLog && st.saleLog.length) {
    lines.push("", "Sales: # | at | took | expands | scales");
    st.saleLog.forEach(e => lines.push([e.n, formatTime(e.at), formatTime(e.took), e.expands, "+" + e.scales].join(" | ")));
  }
  lines.push("", "Renders (first 10, then the latest 50): # | at | run | Goo");
  st.renderLog.forEach(r => lines.push([r[0], formatTime(r[1]), formatTime(r[2]), formatWhole(new Decimal(r[3]))].join(" | ")));
  if (st.events.length) lines.push("", "Events:", ...st.events);
  return lines.join("\n");
}
let statsHash = "";
function renderStats() {
  const panel = document.getElementById("sub-stats");
  if (!panel || !panel.classList.contains("active")) return;
  document.getElementById("stats-summary").innerHTML = statsSummary()
    .map(([k, v]) => `<div class="stat-row"><span>${k}</span><b>${v}</b></div>`).join("");
  const st = game.stats;
  const hash = st.expandLog.length + ":" + st.renderLog.length;
  if (hash === statsHash) return;
  statsHash = hash;
  document.getElementById("stats-expands").innerHTML = st.expandLog.length
    ? `<tr><th>#</th><th>Took</th><th>Renders</th><th>Acres</th><th>Cap</th><th>GP/SG/DG</th></tr>` +
      st.expandLog.map(e => `<tr><td>${e.n}</td><td>${formatTime(e.took)}</td><td>${e.renders}</td><td>+${e.acres}${e.grew ? "" : " (no grow)"}</td><td>e${e.cap}</td><td>${e.gp}/${e.sg}/${e.dg}</td></tr>`).join("")
    : `<tr><td class="muted">No Expands yet</td></tr>`;
  document.getElementById("stats-renders").innerHTML = st.renderLog.length
    ? `<tr><th>#</th><th>At</th><th>Run</th><th>Goo</th></tr>` +
      st.renderLog.slice(-20).reverse().map(r => `<tr><td>${r[0]}</td><td>${formatTime(r[1])}</td><td>${formatTime(r[2])}</td><td>${formatWhole(new Decimal(r[3]))}</td></tr>`).join("")
    : `<tr><td class="muted">No Renders yet</td></tr>`;
}

function render() {
  document.getElementById("coins").textContent = formatWhole(game.coins);
  document.getElementById("cps").textContent = formatWhole(coinsPerSecond());
  // Upgrades (steady look while Upgrade Helper is buying them, so nothing flashes)
  const helperActive = game.automationOn && essLevel("upgradeHelper") > 0 && game.autoUpgrades;
  upgradeRows.forEach(r => {
    r.btn.classList.toggle("auto-handled", helperActive);
    const maxed = upgradeMaxed(r.id);
    const cost = upgradeCost(r.id);
    const lvl = upgradeLevel(r.id);
    const max = upgradeDef(r.id).maxLevel;
    r.lvl.textContent = "Lv " + lvl + (max !== null ? "/" + max : "");
    r.eff.textContent = "×" + format(upgradeEffect(r.id), 2);
    r.cost.textContent = maxed ? "MAXED" : formatWhole(cost.ceil());
    r.btn.disabled = maxed || game.coins.lt(cost);
    r.btn.classList.toggle("affordable", !r.btn.disabled);
    r.btn.classList.toggle("maxed", maxed);
  });

  // Master automation switch (shows once any automation is unlocked)
  const anyAuto = SETTINGS.tiers.some((t, i) => autoUnlocked(i)) || essLevel("upgradeHelper") > 0
    || hasAutoRender() || expandMilestoneReached("autoGoo");
  const master = document.getElementById("master-auto");
  master.style.display = anyAuto ? "" : "none";
  master.textContent = game.automationOn ? "⏸" : "▶";
  master.title = game.automationOn ? "Automation is on: tap to pause it all" : "Automation is paused: tap to resume";
  master.classList.toggle("paused", !game.automationOn);
  document.body.classList.toggle("auto-paused", !game.automationOn);

  // Farm capacity notice under the coin counter
  const notice = document.getElementById("farm-notice");
  // Farm complete = slimes at max size: Sell the Farm is ready
  if (saleReady()) notice.textContent = "Farm complete";
  else if (coinsAtLimit()) notice.textContent = buildingPlaced("silo") ? "Coins full · level your Coin Silo" : game.siloUnlocked ? "Coins full · build a Coin Silo" : "Coins full";
  else if (farmFull()) notice.textContent = "Farm full · ×" + SETTINGS.fullFarmBonus + " Goo";
  else notice.textContent = "";
  notice.style.display = notice.textContent ? "" : "none";

  // Expand button, popup, and Auto-Render settings
  const showExpand = expandTeased();
  const showAcres = game.expands > 0 || game.acres.gt(0);
  // The Farm tab card only appears once Expand is actually available
  document.getElementById("expand-row").style.display = slimesReadyForExpand() ? "" : "none";
  document.getElementById("expand-btn").style.display = showAcres ? "" : "none";
  document.getElementById("farm-tab").style.display = showAcres ? "" : "none";
  document.getElementById("expand-btn-amount").textContent = formatWhole(game.acres);
  // Dots: something to do in the Estate (an affordable Acre upgrade, or an empty plot with a building to place)
  const canPlace = game.plots.includes(null) && SETTINGS.buildings.some(b => buildingAvailable(b) && !buildingPlaced(b.id));
  const estateDot = canPlace || game.plots.some(id => id && !buildingMaxed(id) && game.acres.gte(buildingCost(id)));
  document.getElementById("expand-dot").style.display = estateDot ? "" : "none";
  document.getElementById("estate-sub-dot").style.display = estateDot ? "" : "none";
  document.getElementById("bld-dot").style.display = canPlace ? "" : "none";
  document.getElementById("acre-amount").textContent = formatWhole(game.acres);
  document.getElementById("expand-count").textContent = game.expands;
  const capNow = farmCapacity();
  const t1 = game.tiers[0].owned;
  const expPct = t1.lte(1) ? 0 : Math.min(100, t1.log10().div(capNow.log10()).toNumber() * 100);
  document.getElementById("expand-fill").style.width = expPct.toFixed(1) + "%";
  document.getElementById("expand-text").textContent = atTrueCap()
    ? "Your farm is at its maximum size."
    : !slimesReadyForExpand() ? "Expand unlocks at " + formatWhole(SETTINGS.expandGoal) + " Tier 1 slimes (you have " + formatWhole(t1) + ")"
    : "Tier 1 slimes: " + formatWhole(t1) + " / " + formatWhole(capNow) + " (farm capacity) · Goo: " + formatWhole(game.essence) + " / " + formatWhole(expandGooCost()) + " needed";
  // Quiet hint about whether this Expand will grow the farm (only once Expand is available)
  document.getElementById("grow-hint").textContent = (atTrueCap() || !slimesReadyForExpand()) ? ""
    : expandWillGrow() ? "Your farm is full: Expanding now will grow it ×" + nextGrowthText() + "."
    : "Fill your farm to " + formatWhole(capNow) + " Tier 1 slimes for it to grow when you Expand.";
  // Big Expand button in the top bar: only shows once Expand is unlocked
  const topExp = document.getElementById("top-expand");
  // Shows (greyed out) once you're near Expand or have Expanded before
  topExp.style.display = showExpand ? "" : "none";
  topExp.disabled = !expandUnlocked();
  const gainTop = acreGain();
  const t1Log = game.tiers[0].owned.lte(1) ? 0 : game.tiers[0].owned.log10().toNumber();
  const goalLog = new Decimal(SETTINGS.expandGoal).log10().toNumber();
  // Ready: show the reward. Not ready: list both needs (farm full, Goo), each with a check when met
  const subEl = document.getElementById("top-expand-sub");
  if (expandUnlocked()) {
    subEl.textContent = "+" + formatWhole(gainTop) + " Acre" + (gainTop.eq(1) ? "" : "s") + (expandWillGrow() ? " · grows" : "");
  } else {
    const farmOk = farmFull() || (slimesReadyForExpand() && atTrueCap());
    const gooOk = expandGooMet();
    subEl.innerHTML = `<span class="req${farmOk ? " ok" : ""}">Farm full ${farmOk ? "✓" : "✗"}</span>` +
      `<span class="req${gooOk ? " ok" : ""}">Goo ${formatWhole(game.essence)}/${formatWhole(expandGooCost())}${gooOk ? " ✓" : ""}</span>`;
  }
  // Bar on the button: progress to the next Acre (the goal bar below covers the unlock)
  document.getElementById("top-expand-fill").style.width = (expandUnlocked()
    ? nextAcreProgress() * 100 : 0).toFixed(1) + "%";
  topExp.title = !expandUnlocked() ? "Needs a full farm and " + formatWhole(expandGooCost()) + " Goo (about 5 full-farm Renders)"
    : expandWillGrow() ? "Your farm is full: this Expand grows it ×" + nextGrowthText() : "Bar shows progress to the next Acre";
  const ebtn = document.getElementById("expand-action");
  ebtn.disabled = !expandUnlocked();
  // Once unlocked, the big top bar button does the Expanding; the card just explains
  ebtn.style.display = expandUnlocked() ? "none" : "";
  ebtn.classList.toggle("ready", expandUnlocked());
  const acresNow = acreGain();
  document.getElementById("expand-label").textContent = expandUnlocked()
    ? "Expand +" + formatWhole(acresNow) + " Acre" + (acresNow.eq(1) ? "" : "s") + (expandWillGrow() ? " · farm grows" : "")
    : "Expand (locked)";
  document.getElementById("expand-next-fill").style.width = expandUnlocked() ? (nextAcreProgress() * 100).toFixed(1) + "%" : "0%";
  const nextAcreAt = tier1ForNextAcre();
  document.getElementById("next-acre").textContent = !expandUnlocked() ? ""
    : nextAcreAt.gt(capNow) ? ""
    : "Next Acre at " + formatWhole(nextAcreAt) + " Tier 1 slimes";
  acreRows.forEach(r => {
    const maxed = acreMaxed(r.id);
    const cost = acreCost(r.id);
    const max = acreDef(r.id).maxLevel;
    r.lvl.textContent = "Lv " + acreLevel(r.id) + (max !== null ? "/" + max : "");
    r.eff.textContent = acreEffectText(r.id);
    r.cost.textContent = maxed ? (max === 1 ? "OWNED" : "MAXED") : formatWhole(cost) + " Acre" + (cost.eq(1) ? "" : "s");
    r.btn.disabled = maxed || game.acres.lt(cost);
    r.btn.classList.toggle("affordable", !r.btn.disabled);
    r.btn.classList.toggle("maxed", maxed);
  });
  expandMsRows.forEach(r => r.li.classList.toggle("done", game.expands >= r.m.expands));
  const emsDone = SETTINGS.expandMilestones.filter(m => game.expands >= m.expands).length;
  document.getElementById("ems-badge").textContent = emsDone + "/" + SETTINGS.expandMilestones.length;
  const nextEms = SETTINGS.expandMilestones.find(m => game.expands < m.expands);
  document.getElementById("next-ems").textContent = nextEms ? "Next at " + nextEms.expands + ": " + nextEms.text.split(":")[0].replace("Start each Expand with ", "Keep ") : "All done";
  const arBox = document.getElementById("auto-render-box");
  document.getElementById("auto-render-sec").style.display = hasAutoRender() ? "" : "none";
  const arToggle = document.getElementById("ar-toggle");
  arToggle.textContent = game.autoRender.on ? "ON" : "OFF";
  arToggle.classList.toggle("on", game.autoRender.on);
  document.getElementById("ar-unit").textContent = game.autoRender.mode === "goo" ? "Goo or more" : "seconds";

  syncPlots();   // open any plots you've earned (cheap: does nothing if they're already open)
  renderFarm();
  renderStats();
  renderMarket();
  renderAuto();
  document.getElementById("buy-mode").textContent = "Buy: " + (game.buyMode === "ms" ? "Next" : game.buyMode === "max" ? "Max" : "×1") + " ⇄";
  updateSubnav();
  const sp = document.getElementById("speed-btn");
  sp.classList.toggle("on", !!game.prefs.fastTest);
  sp.title = game.prefs.fastTest ? "10× test speed is ON (stats still count normal-speed time)" : "Turn on 10× test speed";

  // Settings switches
  document.querySelectorAll(".pref-toggle").forEach(btn => {
    const on = !!game.prefs[btn.dataset.pref];
    btn.textContent = on ? "ON" : "OFF";
    btn.classList.toggle("on", on);
  });

  // Note while auto-buy is saving Goo for the Expand cost
  document.getElementById("goo-reserve").textContent = expandMilestoneReached("autoGoo") && game.autoGooOn
    ? "Auto-buy skips upgrades costing " + formatWhole(autoGooLimit()) + "+ Goo (half the Expand cost)" : "";
  // Auto-buy Goo upgrades switch (Expand milestone)
  const gooAuto = document.getElementById("auto-goo");
  document.getElementById("auto-goo-sec").style.display = expandMilestoneReached("autoGoo") ? "" : "none";
  gooAuto.textContent = game.autoGooOn ? "ON" : "OFF";
  gooAuto.classList.toggle("on", game.autoGooOn);

  // Upgrade Helper switch
  const helperBtn = document.getElementById("auto-upgrades");
  document.getElementById("auto-helper-sec").style.display = essLevel("upgradeHelper") > 0 ? "" : "none";
  helperBtn.textContent = game.autoUpgrades ? "ON" : "OFF";
  helperBtn.classList.toggle("on", game.autoUpgrades);

  // Essence and Render panel
  // Goo stays visible once you've reached it (an Expand or sale resets Renders but not your progress)
  const showGoo = game.renders > 0 || game.essence.gt(0) || game.expands > 0 || game.sales > 0;
  document.getElementById("goo-btn").style.display = showGoo ? "" : "none";
  document.getElementById("goo-tab").style.display = showGoo ? "" : "none";
  document.getElementById("goo-btn-amount").textContent = formatWhole(game.essence);
  const canBuyGoo = SETTINGS.essenceUpgrades.some(u => !essMaxed(u.id) && game.essence.gte(essCost(u.id)));
  const gooDot = canBuyGoo && !(game.automationOn && game.autoGooOn && expandMilestoneReached("autoGoo"));
  document.getElementById("goo-dot").style.display = gooDot ? "" : "none";
  document.getElementById("goo-sub-dot").style.display = gooDot ? "" : "none";
  document.getElementById("ess-amount").textContent = formatWhole(game.essence);
  document.getElementById("render-count").textContent = game.renders;
  const gooAutoActive = game.automationOn && game.autoGooOn && expandMilestoneReached("autoGoo");
  essRows.forEach(r => {
    const maxed = essMaxed(r.id);
    const cost = essCost(r.id);
    const lvl = essLevel(r.id);
    const max = essDef(r.id).maxLevel;
    r.lvl.textContent = "Lv " + lvl + (max !== null ? "/" + max : "");
    // Live: a Render right now makes this farm the "last farm", so show what that would give
    if (r.last) r.last.textContent = "This farm has earned " + formatWhole(game.runCoins) + " coins";
    r.eff.textContent = r.id === "headStart"
      ? (lvl === 0 ? "no head start" : formatWhole(headStartFrom(game.runCoins, lvl)) + " coins")
      : r.id === "upgradeHelper" ? (lvl > 0 ? "Owned" : "Not owned")
      : "×" + format(essEffect(r.id), 2);
    r.cost.textContent = maxed ? (max === 1 ? "OWNED" : "MAXED") : formatWhole(cost) + " Goo";
    r.btn.classList.toggle("auto-handled", gooAutoActive);
    r.btn.disabled = maxed || game.essence.lt(cost);
    r.btn.classList.toggle("affordable", !r.btn.disabled);
    r.btn.classList.toggle("maxed", maxed);
  });
  milestoneRows.forEach(r => r.li.classList.toggle("done", milestoneReached(r.m)));

  // Render goal progress (log scale so the bar moves steadily)
  const goal = renderGoalValue();
  const t1Now = game.tiers[0].owned;
  const pct = goal.lte(1) ? 100 : t1Now.lte(1) ? 0 :
    Math.min(100, t1Now.log10().div(goal.log10()).toNumber() * 100);
  const reached = renderUnlocked();
  // One goal bar under the header: coins toward Render, then Tier 1 toward the Expand unlock
  const goalBar = document.getElementById("render-progress");
  // The goal bar shows the Expand goal from your first Render on (the Expand button waits until 1e50)
  const expandGoalMode = reached && !slimesReadyForExpand() && (game.renders > 0 || game.expands > 0 || game.sales > 0);
  // Last stage: Expand goal reached but the farm isn't full yet (a full farm grows when you Expand)
  const fillMode = reached && slimesReadyForExpand() && !farmFull() && !atTrueCap();
  goalBar.classList.toggle("expand-mode", expandGoalMode || fillMode);
  if (!reached) {
    document.getElementById("render-fill").style.width = pct.toFixed(1) + "%";
    document.getElementById("render-text").textContent =
      "Tier 1 slimes to unlock Render: " + formatWhole(t1Now) + " / " + formatWhole(goal);
  } else if (expandGoalMode) {
    const t1 = game.tiers[0].owned;
    const eg = new Decimal(SETTINGS.expandGoal);
    const ePct = t1.lte(1) ? 0 : Math.min(100, t1.log10().div(eg.log10()).toNumber() * 100);
    document.getElementById("render-fill").style.width = ePct.toFixed(1) + "%";
    document.getElementById("render-text").textContent =
      "Tier 1 slimes to unlock Expand: " + formatWhole(t1) + " / " + formatWhole(eg);
  }
  if (fillMode) {
    const t1f = game.tiers[0].owned, capF = farmCapacity();
    document.getElementById("render-fill").style.width = Math.min(100, t1f.max(1).log10().div(capF.log10()).toNumber() * 100).toFixed(1) + "%";
    document.getElementById("render-text").textContent = "Tier 1 slimes to fill the farm: " + formatWhole(t1f) + " / " + formatWhole(capF);
  }
  goalBar.style.display = (!reached || expandGoalMode || fillMode) ? "" : "none";
  const rbtn = document.getElementById("render-btn");
  rbtn.disabled = !reached;
  rbtn.classList.toggle("ready", reached);
  document.getElementById("render-label").textContent = reached ? "+" + formatWhole(essenceGain()) + " Goo" : "Locked";
  // Bar along the bottom of the button: progress toward the next +1 Goo
  document.getElementById("render-next-fill").style.width = reached ? (nextGooProgress() * 100).toFixed(1) + "%" : "0%";
  rbtn.title = reached ? "Bar shows progress to the next Goo" : "";

  // Milestone button and "next milestone" hint
  const done = SETTINGS.renderMilestones.filter(milestoneReached).length;
  document.getElementById("ms-badge").textContent = done + "/" + SETTINGS.renderMilestones.length;
  const next = SETTINGS.renderMilestones.find(m => !milestoneReached(m));
  document.getElementById("next-milestone").textContent = next
    ? "Next at " + next.renders + ": " + milestoneText(next) : "All done";

  tierRows.forEach((r, i) => {
    const visible = tierVisible(i);
    r.row.style.display = visible ? "" : "none";
    if (!visible) return;
    const cost = tierCost(i);
    const full = tierFull(i);
    const canAfford = !full && game.coins.gte(cost);
    r.owned.textContent = formatWhole(game.tiers[i].owned);
    r.prod.textContent = formatRate(tierProduction(i));
    r.cost.textContent = full ? "Full" : formatWhole(cost.ceil());
    r.row.classList.toggle("full", full);
    // Steady look while auto-buy is running this tier, so the buttons don't flash
    r.row.classList.toggle("auto-handled", game.automationOn && autoUnlocked(i) && !!game.autobuy[i]);
    r.buyOne.disabled = !canAfford;
    r.mult.textContent = "×" + format(tierMultiplier(i), 2);
    r.next.textContent = formatWhole(toNextMilestone(i));
    r.mval.textContent = format(milestoneMultValue(), 1);
    const every = milestoneEveryValue();
    // Buy button follows the row's mode
    const mode = effectiveBuyMode(i);
    if (!full) {
      if (mode === "ms") {
        const n = chunkSize(i);
        const c = chunkCost(i, n);
        r.cost.textContent = n + " · " + formatWhole(c.ceil());
        r.buyOne.disabled = game.coins.lt(c);
      } else if (mode === "max") {
        const n = affordableCount(i);
        r.cost.textContent = n > 0 ? (n >= 300 ? "300+" : n) + " · " + formatWhole(chunkCost(i, Math.max(1, Math.min(n, 300))).ceil()) : formatWhole(cost.ceil());
        r.buyOne.disabled = n === 0;
      }
    }

    r.mfill.style.width = ((every - toNextMilestone(i).toNumber()) / every * 100) + "%";
  });
}

// ===== Save and load (stored on this device) =====
let importing = false;   // stops the old save from overwriting an import while the page reloads
function save() {
  if (importing) return;
  const data = {
    coins: game.coins.toString(),
    runCoins: game.runCoins.toString(),
    upgrades: game.upgrades,
    tiers: game.tiers.map(t => ({ owned: t.owned.toString(), bought: t.bought.toString() })),
    essence: game.essence.toString(),
    lastFarmCoins: game.lastFarmCoins.toString(),
    expandRenders: game.expandRenders,
    savingForExpand: game.savingForExpand,
    acres: game.acres.toString(),
    expands: game.expands,
    acreUpgrades: game.acreUpgrades,
    plotsOwned: game.plotsOwned,
    plotsFromMilestones: true,
    plotsBought: true,
    buildingsFree: true,
    acreRework: true,
    plotsByGrowth: true,
    noCoinPress: true,
    estateRework: true,
    siloUnlocked: game.siloUnlocked,
    scales: game.scales.toString(),
    totalScales: game.totalScales.toString(),
    sales: game.sales,
    brokerUpgrades: game.brokerUpgrades,
    autoExpandOn: game.autoExpandOn,
    farmGrowths: game.farmGrowths,
    autoGooOn: game.autoGooOn,
    plots: game.plots,
    buildingLevels: game.buildingLevels,
    autoRender: game.autoRender,
    runTime: game.runTime,
    totalEssence: game.totalEssence.toString(),
    renders: game.renders,
    essUpgrades: game.essUpgrades,
    autobuy: game.autobuy,
    autoModes: game.autoModes,
    buyModes: game.buyModes,
    buyMode: game.buyMode,
    expandRevealed: game.expandRevealed,
    autoSeen: game.autoSeen,
    autoUpgrades: game.autoUpgrades,
    automationOn: game.automationOn,
    prefs: game.prefs,
    stats: game.stats,
    lastTick: game.lastTick,
  };
  try { localStorage.setItem(SETTINGS.saveKey, JSON.stringify(data)); } catch (e) {}
}
function load() {
  let raw = null;
  try { raw = localStorage.getItem(SETTINGS.saveKey); } catch (e) {}
  if (!raw) return;
  const data = JSON.parse(raw);
  game.coins = new Decimal(data.coins);
  game.runCoins = new Decimal(data.runCoins || data.coins);
  if (data.upgrades) Object.assign(game.upgrades, data.upgrades);
  if (data.essence) game.essence = new Decimal(data.essence);
  if (data.lastFarmCoins) game.lastFarmCoins = new Decimal(data.lastFarmCoins);
  if (data.expandRenders) game.expandRenders = data.expandRenders;
  if (data.savingForExpand) game.savingForExpand = true;
  if (data.acres) game.acres = new Decimal(data.acres);
  if (data.expands) game.expands = data.expands;
  if (data.acreUpgrades) Object.assign(game.acreUpgrades, data.acreUpgrades);
  if (data.plotsOwned) game.plotsOwned = data.plotsOwned;
  if (data.plots) game.plots = data.plots;
  if (data.buildingLevels) Object.assign(game.buildingLevels, data.buildingLevels);
  // Placed buildings start at level 1 (older saves could have level 0)
  game.plots.forEach(id => { if (id) game.buildingLevels[id] = Math.max(1, game.buildingLevels[id] || 0); });
  // Plots now come from Expand milestones (refund Acres spent on bought plots: 2, 4, 8, ...)
  if (data.plotsOwned > 1 && !data.plotsFromMilestones) {
    let refund = 0;
    for (let n = 1; n < data.plotsOwned; n++) refund += 2 * Math.pow(2, n - 1);
    game.acres = game.acres.add(refund);
  }
  // Before this version every Expand grew the farm
  game.farmGrowths = data.farmGrowths !== undefined ? data.farmGrowths : (data.expands || 0);
  if (data.autoGooOn !== undefined) game.autoGooOn = data.autoGooOn;
  // Buildings briefly cost Acres: refund what was paid (Goo Vat 1, Nursery 1, Coin Press 3, Training 8)
  if (data.plotsBought && !data.buildingsFree) {
    const paid = { gooVat: 1, nursery: 1, coinPress: 3, training: 8 };
    (data.plots || []).forEach(id => { if (paid[id]) game.acres = game.acres.add(paid[id]); });
  }
  // Storehouse was removed: free its plot and refund its Goo levels' worth as nothing (Goo resets anyway)
  game.plots = game.plots.map(id => (id && buildingDef(id)) ? id : null);
  // (extra plots are trimmed below, after Coin Press is removed, so no placed building is lost)
  // Compost moved from an Acre upgrade to an Expand milestone: refund its Acres (3, 12, 48, ...)
  if (game.acreUpgrades.compost) {
    let refund = 0;
    for (let l = 0; l < game.acreUpgrades.compost; l++) refund += 3 * Math.pow(4, l);
    game.acres = game.acres.add(refund);
    delete game.acreUpgrades.compost;
  }
  // Estate rework: Acre upgrades and Training Grounds removed, buildings now leveled with Acres.
  // Refund Acres spent on Acre upgrades; placed buildings go back to level 1 (their old levels were bought with Goo).
  if (!data.estateRework) {
    const au = game.acreUpgrades || {};
    let refund = au.autoRender ? 1 : 0;
    for (let l = 0; l < (au.richSoil || 0); l++) refund += 1 + l;
    for (let l = 0; l < (au.fertile || 0); l++) refund += 2 + 2 * l;
    for (let l = 0; l < (au.sharpMilestones || 0); l++) refund += 2 + l;
    game.acres = game.acres.add(refund);
    game.acreUpgrades = {};
    game.plots = game.plots.map(id => (id === "training" || id === "coinPress") ? null : id);
    game.plots.forEach(id => { if (id) game.buildingLevels[id] = 1; });
    delete game.buildingLevels.training;
  }
  // Coin Press was removed: refund the Goo its levels cost, free its plot, and trim to one plot per building
  if (!data.noCoinPress) {
    const lvl = game.buildingLevels.coinPress || 0;
    for (let l = 1; l < lvl; l++) game.essence = game.essence.add(Math.round(50 * Math.pow(3, l - 1)));
    game.plots = game.plots.map(id => id === "coinPress" ? null : id);
    while (game.plots.length > SETTINGS.plotUnlocks.length && game.plots.includes(null)) game.plots.splice(game.plots.lastIndexOf(null), 1);
  }
  delete game.buildingLevels.coinPress;
  while (game.plots.length > SETTINGS.plotUnlocks.length && game.plots.includes(null)) game.plots.splice(game.plots.lastIndexOf(null), 1);
  syncPlots();
  // Plots now open with farm growth: refund the Acres paid for plots (plot 1 was always 1 Acre)
  if (data.plotsBought && !data.plotsByGrowth) {
    const paid = data.acreRework ? [1, 3, 6, 10, 15] : [1, 2, 4, 8, 16];
    for (let n = 0; n < (data.plots || []).length; n++) game.acres = game.acres.add(paid[n] || 0);
  }
  // Acre upgrades were repriced (steady steps instead of doubling): refund what they cost and reset them
  if (!data.acreRework) {
    const old = { richSoil: [1, 2], fertile: [2, 3], sharpMilestones: [2, 3] };
    Object.entries(old).forEach(([id, [base, growth]]) => {
      for (let l = 0; l < (game.acreUpgrades[id] || 0); l++) game.acres = game.acres.add(Math.round(base * Math.pow(growth, l)));
      game.acreUpgrades[id] = 0;
    });
  }
  // Veteran Farmer was removed: refund the Acres spent on it (3, 9, 27, ...)
  if (game.acreUpgrades.veteran) {
    let refund = 0;
    for (let l = 0; l < game.acreUpgrades.veteran; l++) refund += 3 * Math.pow(3, l);
    game.acres = game.acres.add(refund);
    delete game.acreUpgrades.veteran;
  }
  // Surveyor was removed: refund the Acres spent on it (3, 12, 48, ...)
  if (game.acreUpgrades.surveyor) {
    let refund = 0;
    for (let l = 0; l < game.acreUpgrades.surveyor; l++) refund += 3 * Math.pow(4, l);
    game.acres = game.acres.add(refund);
    delete game.acreUpgrades.surveyor;
  }
  // Hired Help was removed: refund its 5 Acres if it was bought
  if (game.acreUpgrades.hiredHelp) {
    game.acres = game.acres.add(5);
    delete game.acreUpgrades.hiredHelp;
  }
  if (data.autoRender) Object.assign(game.autoRender, data.autoRender);
  if (data.runTime) game.runTime = data.runTime;
  if (data.totalEssence) game.totalEssence = new Decimal(data.totalEssence);
  if (data.renders) game.renders = data.renders;
  if (data.essUpgrades) Object.assign(game.essUpgrades, data.essUpgrades);
  if (data.autoUpgrades !== undefined) game.autoUpgrades = data.autoUpgrades;
  if (data.automationOn !== undefined) game.automationOn = data.automationOn;
  if (data.prefs) Object.assign(game.prefs, data.prefs);
  if (data.autobuy) data.autobuy.forEach((v, i) => { if (i < game.autobuy.length) game.autobuy[i] = v; });
  if (data.autoModes) data.autoModes.forEach((v, i) => { if (i < game.autoModes.length) game.autoModes[i] = v; });
  if (data.buyModes) data.buyModes.forEach((v, i) => { if (i < game.buyModes.length) game.buyModes[i] = v; });
  if (data.buyMode) game.buyMode = data.buyMode;
  if (data.expandRevealed) game.expandRevealed = true;
  if (data.autoSeen) game.autoSeen = data.autoSeen;
  if (data.tiers) {
    data.tiers.forEach((t, i) => {
      if (!game.tiers[i]) return;
      game.tiers[i].owned = new Decimal(t.owned);
      game.tiers[i].bought = new Decimal(t.bought);
    });
  } else if (data.tier1) {
    // Older save from step 2, before the tier chain existed
    game.tiers[0].owned = new Decimal(data.tier1);
    game.tiers[0].bought = new Decimal(data.tier1);
  }
  if (data.stats) game.stats = Object.assign(newStats(), data.stats);
  if (data.siloUnlocked) game.siloUnlocked = true;
  if (data.scales) game.scales = new Decimal(data.scales);
  if (data.totalScales) game.totalScales = new Decimal(data.totalScales);
  if (data.sales) game.sales = data.sales;
  if (data.brokerUpgrades) Object.assign(game.brokerUpgrades, data.brokerUpgrades);
  if (data.autoExpandOn !== undefined) game.autoExpandOn = data.autoExpandOn;
  // Offline progress: count time away, up to the cap (none if switched off in Settings)
  const maxMs = SETTINGS.maxOfflineHours * 3600 * 1000;
  game.lastTick = game.prefs.offline ? Math.max(data.lastTick, Date.now() - maxMs) : Date.now();
}
// Testing: jump to the start of a run after `n` full Expands, with the Acres those Expands would have
// given (unspent, buildings unplaced). Scales, Broker upgrades, settings, and stats are kept.
function jumpToExpand() {
  const n = Math.max(0, Math.floor(+document.getElementById("jump-n").value || 0));
  if (!confirm("Jump to the start of a run after " + n + " full Expands?\n\nYou'll get the Acres those Expands give (unspent) and empty plots. Your current farm, Goo, and buildings reset. Scales, Broker upgrades, settings, and stats are kept.")) return;
  const keep = { prefs: game.prefs, stats: game.stats, autobuy: game.autobuy, autoUpgrades: game.autoUpgrades, automationOn: game.automationOn,
    autoGooOn: game.autoGooOn, autoRender: game.autoRender, autoModes: game.autoModes, buyMode: game.buyMode, autoSeen: game.autoSeen,
    scales: game.scales, totalScales: game.totalScales, sales: game.sales, brokerUpgrades: game.brokerUpgrades, autoExpandOn: game.autoExpandOn };
  game = newGame();
  Object.assign(game, keep);
  game.expands = n;
  game.farmGrowths = n;
  game.acres = new Decimal(n * (n + 1) / 2);   // Expand k (from a full farm) gives k Acres
  game.renders = n >= 3 ? 40 : 0;              // Render milestones are kept from Expand 3 on
  game.expandRevealed = n > 0;
  resetExpand(game);
  syncPlots();
  statEvent("Jumped to Expand " + n + " (testing)");
  farmKey = "";
  save();
  render();
  toast("Jumped to the start of a run after " + n + " Expands", true);
}
// Restart the current Expand: like Expanding but with no Acres and no farm growth.
// Keeps Acres, Acre upgrades, plots, buildings, Expand count, and milestones.
function restartExpand() {
  if (!confirm("Restart this Expand?\n\nCoins, slimes, coin upgrades, Goo, Goo upgrades, and Render milestones reset (Expand milestones still apply). You keep your Acres, upgrades, plots, and buildings, and you don't earn any Acres.")) return;
  resetExpand(game);
  game.stats.expandStart = game.stats.playTime;
  game.stats.runStart = game.stats.playTime;
  game.stats.rendersThisExpand = 0;
  statEvent("Restarted Expand " + (game.expands + 1));
  save();
  render();
  toast("Expand restarted");
}
// Back to the state right after a first Expand (from a full farm). Keeps settings.
function backToFirstExpand() {
  if (!confirm("Go back to your first Expand?\n\nYou'll have 1 Expand done, 1 Acre, and a farm grown once. Acre upgrades, plots, buildings, Goo, and everything else reset. Your settings are kept.")) return;
  const keep = { prefs: game.prefs, autobuy: game.autobuy, autoUpgrades: game.autoUpgrades,
    automationOn: game.automationOn, autoGooOn: game.autoGooOn, autoRender: game.autoRender,
    autoModes: game.autoModes, buyMode: game.buyMode, autoSeen: game.autoSeen };
  game = newGame();
  Object.assign(game, keep);
  game.stats = newStats();             // fresh stats for the new test run
  statEvent("Went back to first Expand (stats cleared)");
  game.expands = 1;
  game.farmGrowths = 1;
  game.acres = new Decimal(1);
  resetExpand(game);
  syncPlots();
  farmKey = "";
  save();
  render();
  toast("Back to your first Expand");
}
function resetSave() {
  if (!confirm("Erase all progress?\n\nYour settings (confirm pop-ups, offline progress, test speed) are kept.")) return;
  const prefs = game.prefs;
  try { localStorage.removeItem(SETTINGS.saveKey); } catch (e) {}
  game = newGame();
  game.prefs = prefs;        // keep settings
  farmKey = "";
  save();
  render();
  showTab("panel-slimes");
}

// ===== Export / import save code =====
const SAVE_PREFIX = "DFI1:";
function exportSave() {
  save();
  let raw = null;
  try { raw = localStorage.getItem(SETTINGS.saveKey); } catch (e) {}
  if (!raw) return "";
  // Base64 so the code is one safe line of text
  return SAVE_PREFIX + btoa(unescape(encodeURIComponent(raw)));
}
function importSave(code) {
  code = (code || "").trim();
  if (!code.startsWith(SAVE_PREFIX)) return "That doesn't look like a Dragon Farm Idle save code.";
  let raw;
  try {
    raw = decodeURIComponent(escape(atob(code.slice(SAVE_PREFIX.length))));
    const data = JSON.parse(raw);
    if (!data || data.coins === undefined) throw new Error("missing data");
  } catch (e) {
    return "That save code is damaged or incomplete. Try copying it again.";
  }
  importing = true;
  try { localStorage.setItem(SETTINGS.saveKey, raw); } catch (e) { importing = false; return "Couldn't store the save on this device."; }
  location.reload();
  return "";
}
function setupSaveCode() {
  const box = document.getElementById("save-code");
  const status = document.getElementById("save-status");
  document.getElementById("export-btn").addEventListener("click", async () => {
    box.value = exportSave();
    box.select();
    try { await navigator.clipboard.writeText(box.value); status.textContent = "Save code copied. Paste it into Import on your other device."; }
    catch (e) { status.textContent = "Save code is in the box below. Copy it and paste it into Import on your other device."; }
  });
  document.getElementById("import-btn").addEventListener("click", () => {
    if (!box.value.trim()) { status.textContent = "Paste a save code into the box first, then press Import."; return; }
    if (!confirm("Import this save? Your current progress on this device will be replaced.")) return;
    const err = importSave(box.value);
    if (err) status.textContent = err;
  });
}

// ===== Tabs (phone layout) =====
// Bottom tabs are tiers (Farm, Market, Settings). Farm has sub-tabs: Slimes, Goo, Estate.
const TIER_OF = { "panel-slimes": "farm", "panel-goo": "farm", "panel-acres": "farm", "panel-market": "market", "panel-auto": "auto", "panel-settings": "settings" };
const lastPanel = { farm: "panel-slimes", market: "panel-market", auto: "panel-auto", settings: "panel-settings" };
let currentTier = "farm";
function showTab(panelId) {
  const tier = TIER_OF[panelId] || "farm";
  currentTier = tier;
  lastPanel[tier] = panelId;
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tier === tier));
  document.querySelectorAll(".subnav-btn").forEach(b => b.classList.toggle("active", b.dataset.panel === panelId));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === panelId));
  document.body.dataset.tier = tier;
  updateSubnav();
  if (tier === "auto") render();
  window.scrollTo(0, 0);
}
// Sub-tab row shows on the Farm tab once there's more than Slimes to see
function updateSubnav() {
  const more = ["goo-tab", "farm-tab"].some(id => document.getElementById(id).style.display !== "none");
  document.getElementById("subnav").style.display = currentTier === "farm" && more ? "" : "none";
}
function setupTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => showTab(lastPanel[tab.dataset.tier]));
  });
  document.querySelectorAll(".subnav-btn").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.panel));
  });
}

// ===== Startup =====
setupTabs();
document.getElementById("latest-update").textContent = LATEST_UPDATE;
setupSaveCode();
buildTierRows();
buildUpgradeRows();
buildRenderPanel();
buildMarketPanel();
buildAutoPanel();
buildExpandPanel();
document.getElementById("render-btn").addEventListener("click", () => doRender(false));
document.getElementById("auto-goo").addEventListener("click", e => {
  e.stopPropagation();
  game.autoGooOn = !game.autoGooOn;
  render();
});
document.getElementById("master-auto").addEventListener("click", () => {
  game.automationOn = !game.automationOn;
  toast(game.automationOn ? "Automation resumed" : "All automation paused");
  render();
});
document.getElementById("auto-upgrades").addEventListener("click", () => {
  game.autoUpgrades = !game.autoUpgrades;
  render();
});

// Settings switches
document.querySelectorAll(".pref-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    game.prefs[btn.dataset.pref] = !game.prefs[btn.dataset.pref];
    if (btn.dataset.pref === "offline") statEvent("Offline progress " + (game.prefs.offline ? "ON" : "OFF"));
    render();
  });
});

// Stats: start fresh (keeps the game itself as it is)
document.getElementById("stats-reset").addEventListener("click", () => {
  if (!confirm("Clear all stats and start measuring from now?\n\nYour game progress isn't affected.")) return;
  game.stats = newStats();
  statsHash = "";
  statEvent("Stats cleared");
  save();
  render();
  toast("Stats cleared");
});
// Stats: copy all stats as text to share
document.getElementById("stats-copy").addEventListener("click", async () => {
  const box = document.getElementById("stats-text");
  box.value = statsText();
  box.style.display = "";
  box.select();
  try { await navigator.clipboard.writeText(box.value); toast("Stats copied"); }
  catch (e) { toast("Stats are in the box: copy them from there"); }
});
document.querySelector('[data-sub="sub-stats"]').addEventListener("click", () => { statsHash = ""; setTimeout(renderStats, 0); });

// Top bar chips jump to their tabs
document.getElementById("expand-btn").addEventListener("click", () => showTab("panel-acres"));
document.getElementById("expand-action").addEventListener("click", doExpand);
document.getElementById("top-expand").addEventListener("click", doExpand);

// Auto-Render settings
document.getElementById("ar-toggle").addEventListener("click", () => {
  game.autoRender.on = !game.autoRender.on;
  render();
});
const arMode = document.getElementById("ar-mode");
const arValue = document.getElementById("ar-value");
arMode.addEventListener("change", () => {
  game.autoRender.mode = arMode.value;
  game.autoRender.value = arMode.value === "goo" ? 10 : 60;
  arValue.value = game.autoRender.value;
  render();
});
arValue.addEventListener("change", () => {
  const v = Math.max(1, Number(arValue.value) || 1);
  game.autoRender.value = v;
  arValue.value = v;
});

document.getElementById("goo-btn").addEventListener("click", () => showTab("panel-goo"));
document.querySelectorAll(".subtab").forEach(tab => {
  tab.addEventListener("click", () => {
    // Only switch tabs inside the same popup
    const modal = tab.closest(".modal, .panel");
    modal.querySelectorAll(".subtab").forEach(t => t.classList.toggle("active", t === tab));
    modal.querySelectorAll(".subpanel").forEach(p => p.classList.toggle("active", p.id === tab.dataset.sub));
  });
});
document.getElementById("reset").addEventListener("click", resetSave);
document.getElementById("restart-expand").addEventListener("click", restartExpand);
document.getElementById("first-expand").addEventListener("click", backToFirstExpand);
document.getElementById("test-sale").addEventListener("click", loadTestSave);
document.getElementById("jump-btn").addEventListener("click", jumpToExpand);
document.getElementById("sell-btn").addEventListener("click", doSell);
document.getElementById("scale-chip").addEventListener("click", () => showTab("panel-market"));
document.getElementById("buy-mode").addEventListener("click", cycleBuyMode);
document.getElementById("auto-expand").addEventListener("click", () => { game.autoExpandOn = !game.autoExpandOn; render(); });
document.getElementById("auto-all-ms").addEventListener("click", () => { game.autoModes = game.autoModes.map(() => "ms"); render(); });
document.getElementById("auto-all-max").addEventListener("click", () => { game.autoModes = game.autoModes.map(() => "max"); render(); });
document.getElementById("speed-btn").addEventListener("click", () => {
  game.prefs.fastTest = !game.prefs.fastTest;
  toast("10× test speed " + (game.prefs.fastTest ? "ON" : "OFF"));
  render();
});
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

load();
arMode.value = game.autoRender.mode;
arValue.value = game.autoRender.value;
tick();
setInterval(tick, 100);
setInterval(save, SETTINGS.saveIntervalMs);
