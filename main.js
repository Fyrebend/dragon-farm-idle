// Shown in Settings so you can tell you have the newest version. Update with every change.
const LATEST_UPDATE = "Goal bar under the header shows coins to Render, then switches to the Expand unlock";

// ===== Settings: tuning numbers =====
const SETTINGS = {
  startingSlimes: 1,        // free Tier 1 slimes at the start of a run (do not raise the price)
  unlockedTiers: 4,         // tiers available at the start (Render milestones unlock more)
  saveIntervalMs: 10000,    // autosave every 10 seconds
  maxOfflineHours: 8,       // cap on offline progress
  milestoneEvery: 25,       // every this many bought of a tier...
  milestoneMult: 1.2,       // ...multiplies that tier's production by this
  // Rising price growth: on top of each tier's flat price growth, every purchase costs a little
  // MORE extra than the last. Extra factor = costRise ^ ((bought / 25) ^ 2).
  costRise: 1.01,
  renderGoal: 1e13,         // coins needed in a run to unlock Render
  // Farm capacity: how many slimes each tier can hold. It grows ×perGrowth each time you
  // Expand from a FULL farm, up to max. Coins only stop at 1.79e308 (the Market will break that).
  farmCapacity: { base: 1e100, perGrowth: 1e10, max: "1.79e308" },

  // Goo from a Render (called "essence" in the code) = (digits in total slimes owned / digitDivisor) ^ power,
  // with the base at least 1, then × your Goo bonuses, rounded down. About 8 digits gives 1 base Goo,
  // 10 digits gives 2, 16 digits gives 8.
  essence: { digitDivisor: 8, power: 3 },

  // Goo upgrades (permanent, kept through Render)
  essenceUpgrades: [
    // "tiers": which slime tiers the boost applies to (0 = Tier 1). Higher tiers multiply through
    // every tier below them, so boosts on high tiers are kept weaker.
    { id: "gooPower",    name: "Goo Power",      desc: "Tier 1 coins ×4 per level",       baseCost: 1,  costGrowth: 1.5, effect: 4,    maxLevel: null, tiers: [0] },
    { id: "slimeGrowth", name: "Slime Growth",   desc: "Tiers 2–4 ×2 per level",          baseCost: 3,  costGrowth: 1.5,   effect: 2,  maxLevel: null, tiers: [1, 2, 3] },
    { id: "deepGoo",     name: "Deep Goo",       desc: "Tiers 5–8 ×2 per level",          baseCost: 10, costGrowth: 1.6, effect: 2, maxLevel: null, tiers: [4, 5, 6, 7] },
    { id: "cheapSlimes", name: "Slime Discount", desc: "Slime prices ×0.75 per level",    baseCost: 2, costGrowth: 4, effect: 0.75, maxLevel: 5 },
    { id: "headStart",   name: "Head Start",     desc: "Start each new farm with 1,000× more coins per level", baseCost: 3, costGrowth: 5, effect: 1000, maxLevel: 5 },
    { id: "upgradeHelper", name: "Upgrade Helper", desc: "Auto-buys coin upgrades, cheapest first", baseCost: 25, costGrowth: 1, effect: 1, maxLevel: 1 },
  ],

  // ----- Expand -----
  // Expand unlocks at expandGoal Tier 1 slimes and gives 1 Acre, plus 1 Acre for every
  // digitsPerAcre digits of Tier 1 slimes past the goal (up to the farm's capacity).
  // Expanding from a full farm also grows the farm.
  expandGoal: 1e100,
  acres: { digitsPerAcre: 10 },

  // Expand milestones: rewards for how many times you've Expanded (any Expand counts)
  expandMilestones: [
    { expands: 1, id: "compost",      text: "Compost: Render goal ×0.1 for every Expand done (up to 10)" },
    { expands: 2, id: "keepHelper",   text: "Start each Expand with Upgrade Helper" },
    { expands: 3, id: "keepMs3",      text: "Keep Render milestones up to auto-buy Tier 2" },
    { expands: 4, id: "autoGoo",      text: "Auto-buy Goo upgrades" },
    { expands: 9, id: "keepRenderMs", text: "Expand no longer resets Render milestones" },
    { expands: 12, id: "doubleGoo",    text: "×2 Goo from every Render" },
  ],

  // Acre upgrades (permanent, kept through Expand)
  acreUpgrades: [
    { id: "autoRender", name: "Auto-Render",     desc: "Renders for you, with your own rules", baseCost: 1, costGrowth: 1, effect: 1, maxLevel: 1 },
    { id: "richSoil",   name: "Rich Soil",       desc: "Goo from Render ×1.5 per level",                 baseCost: 1, costGrowth: 2, effect: 1.5, maxLevel: null },
    { id: "fertile",    name: "Fertile Fields",  desc: "Tier 1 coins ×3 per level",                      baseCost: 2, costGrowth: 3, effect: 3,   maxLevel: null, tiers: [0] },
    { id: "sharpMilestones", name: "Sharper Milestones", desc: "Purchase milestones give +0.1× more per level", baseCost: 2, costGrowth: 3, effect: 0.1, maxLevel: 10 },
  ],

  // ----- Plots and buildings -----
  // Plots are bought with Acres: plotCosts[n] = price of plot n+1.
  plotCosts: [1, 2, 4, 8, 16],
  // Building level cap: base + perGrowth × (times your farm has grown from a full Expand)
  buildingCap: { base: 3, perGrowth: 2 },
  // Buildings: placing one on a plot is free and permanent, and starts it at level 1.
  // Leveling up costs Goo; levels are kept through Expand. baseCost = Goo price of going from level 1 to 2.
  buildings: [
    { id: "gooVat",    name: "Goo Vat",          desc: "Goo from Render ×1.1 per level",  baseCost: 25,  costGrowth: 2, effect: 1.1 },
    { id: "nursery",   name: "Nursery",          desc: "All slime tiers ×1.1 per level",  baseCost: 25,  costGrowth: 2, effect: 1.1 },
    { id: "coinPress", name: "Coin Press",       desc: "Tier 1 coins ×1.5 per level",      baseCost: 50,  costGrowth: 2, effect: 1.5, tiers: [0] },
    { id: "training",  name: "Training Grounds", desc: "Purchase milestones need 1 fewer slime per level (min 10)", baseCost: 500, costGrowth: 4, effect: 1 },
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
    autoUpgrades: true,                        // on/off switch for Upgrade Helper
    automationOn: true,                        // master switch: OFF pauses all automation
    prefs: { confirmRender: true, confirmExpand: true, openAfterRender: false, confirmPlace: true },
    lastTick: Date.now(),
  };
  resetExpand(g);
  return g;
}
// Everything that Expand wipes (Goo layer + the run)
function resetExpand(g) {
  const has = id => expandMilestoneReached(id, g);
  g.essence = new Decimal(0);
  g.essUpgrades = Object.fromEntries(SETTINGS.essenceUpgrades.map(u => [u.id, 0]));
  if (has("keepHelper")) g.essUpgrades.upgradeHelper = 1;
  if (!has("keepRenderMs")) g.renders = has("keepMs3") ? Math.min(g.renders || 0, 3) : 0;
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
  return lvl > 0 ? new Decimal(1000).pow(lvl) : new Decimal(0);
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
  return new Decimal(u.costGrowth).pow(essLevel(id)).mul(u.baseCost).round();
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
  game.essUpgrades[id] = essLevel(id) + 1;
  render();
}

// ===== Acre upgrades =====
function acreDef(id) { return SETTINGS.acreUpgrades.find(u => u.id === id); }
function acreLevel(id) { return game.acreUpgrades[id] || 0; }
function acreEffect(id) { return new Decimal(acreDef(id).effect).pow(acreLevel(id)); }
function acreCost(id) {
  const u = acreDef(id);
  return new Decimal(u.costGrowth).pow(acreLevel(id)).mul(u.baseCost).round();
}
function acreMaxed(id) {
  const u = acreDef(id);
  return u.maxLevel !== null && acreLevel(id) >= u.maxLevel;
}
function buyAcreUpgrade(id) {
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
function buildingOwned(id) { return buildingPlaced(id); }
function buildingPlaced(id) { return game.plots.includes(id); }
function buildingLevel(id) { return game.buildingLevels[id] || 0; }
// Effect only counts while the building is placed on a plot
function buildingEffect(id) {
  if (!buildingPlaced(id)) return new Decimal(1);
  return new Decimal(buildingDef(id).effect).pow(buildingLevel(id));
}
function buildingCost(id) {
  const b = buildingDef(id);
  return new Decimal(b.costGrowth).pow(Math.max(0, buildingLevel(id) - 1)).mul(b.baseCost).round();
}
function buildingMaxLevel() {
  const c = SETTINGS.buildingCap;
  return c.base + c.perGrowth * game.farmGrowths;
}
function buildingAtCap(id) {
  return buildingLevel(id) >= buildingMaxLevel();
}
function upgradeBuilding(id) {
  const cost = buildingCost(id);
  if (buildingAtCap(id) || game.essence.lt(cost)) return;
  game.essence = game.essence.sub(cost);
  game.buildingLevels[id] = buildingLevel(id) + 1;
  render();
}
// Plots are bought with Acres
function plotCost() {
  return new Decimal(SETTINGS.plotCosts[game.plots.length] ?? Infinity);
}
function buyPlot() {
  if (game.plots.length >= SETTINGS.plotCosts.length) return;
  const cost = plotCost();
  if (game.acres.lt(cost)) return;
  game.acres = game.acres.sub(cost);
  game.plots.push(null);
  game.plotsOwned = game.plots.length;
  render();
}
// Placing a building is free and permanent, starting at level 1
function placeBuilding(plotIndex, id) {
  const b = buildingDef(id);
  if (!b || buildingPlaced(id) || game.plots[plotIndex]) return;
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
  const cut = buildingPlaced("training") ? buildingLevel("training") : 0;
  return Math.max(10, SETTINGS.milestoneEvery - cut);
}

// ===== Expand =====
function farmCapacity() {
  const c = SETTINGS.farmCapacity;
  return Decimal.min(new Decimal(c.base).mul(new Decimal(c.perGrowth).pow(game.farmGrowths)), new Decimal(c.max));
}
function expandMilestoneReached(id, g = game) {
  const m = SETTINGS.expandMilestones.find(m => m.id === id);
  return !!m && g.expands >= m.expands;
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
  return game.coins.gte(new Decimal(SETTINGS.farmCapacity.max));
}
function expandUnlocked() {
  return game.tiers[0].owned.gte(SETTINGS.expandGoal);
}
// Expanding now would grow the farm (only from a full farm, and only until max size)
function expandWillGrow() {
  return farmFull() && !atTrueCap();
}
function tier1Digits() {
  return game.tiers[0].owned.max(1).log10();
}
function acreGain() {
  if (!expandUnlocked()) return new Decimal(0);
  const past = tier1Digits().sub(new Decimal(SETTINGS.expandGoal).log10());
  return past.div(SETTINGS.acres.digitsPerAcre).floor().add(1).max(1);
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
  const growNote = expandWillGrow() ? "Your farm will grow ×1e10.\n\n" : "Your farm isn't full, so it won't grow this time.\n\n";
  askConfirm("confirmExpand", "Expand for " + formatWhole(acreGain()) + " Acre" + (acreGain().eq(1) ? "" : "s") + "?\n",
    growNote + "You'll start fresh: coins, slimes, coin upgrades, Goo, Goo upgrades, and Render milestones reset (milestones can keep some of these).", finishExpand);
}
function finishExpand() {
  if (!expandUnlocked()) return;
  const gain = acreGain();
  const grew = expandWillGrow();
  game.acres = game.acres.add(gain);
  game.expands += 1;
  if (grew) game.farmGrowths += 1;
  resetExpand(game);
  if (grew) toast("Your farm grew! Slimes can now reach " + formatWhole(farmCapacity()), true);
  SETTINGS.expandMilestones.filter(m => m.expands === game.expands)
    .forEach(m => toast("Expand milestone: " + m.text, true));
  save();
  render();
  toast("Expanded for +" + formatWhole(gain) + " Acres", true);
}

// ===== Render milestones =====
function milestoneReached(m) { return game.renders >= m.renders; }
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
  const steps = expandMilestoneReached("compost") ? Math.min(game.expands, 10) : 0;
  return new Decimal(SETTINGS.renderGoal).mul(new Decimal(0.1).pow(steps));
}
function renderUnlocked() {
  return game.runCoins.gte(renderGoalValue());
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
  return acreEffect("richSoil").mul(buildingEffect("gooVat")).mul(expandMilestoneReached("doubleGoo") ? 2 : 1);
}
// How many total slimes you need for the next whole Goo (works the formula backwards)
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
  const gain = essenceGain();
  const have = totalSlimes().max(1).log10();
  const from = slimesForGoo(gain).log10();
  const to = slimesForNextGoo().log10();
  const p = have.sub(from).div(to.sub(from)).toNumber();
  return Math.max(0, Math.min(1, p));
}
// "Base 125 Goo × 4.39 bonus = 549 Goo"
function gooBreakdown() {
  const e = SETTINGS.essence;
  const base = Decimal.max(1, totalSlimes().max(1).log10().div(e.digitDivisor).pow(e.power).floor());
  const mult = gooMultiplier();
  const baseText = formatWhole(base);
  if (mult.lte(1)) return "Base " + baseText + " Goo (no Goo bonuses yet)";
  return "Base " + baseText + " Goo × " + format(mult, 2) + " bonus = " + formatWhole(essenceGain()) + " Goo";
}
function essenceGain() {
  if (!renderUnlocked()) return new Decimal(0);
  const e = SETTINGS.essence;
  const total = totalSlimes();
  const digits = total.max(1).log10().div(e.digitDivisor);
  // Base is at least 1 BEFORE bonuses, so your Goo bonus always counts (even on small Renders)
  const base = Decimal.max(1, digits.pow(e.power).floor());
  return base.mul(gooMultiplier()).floor();
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
      (m.type === "auto" ? " (switch it on/off on the slime card)" : ""), true));
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

function tierCost(i) {
  const t = SETTINGS.tiers[i];
  const n = game.tiers[i].bought;
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
  return SETTINGS.milestoneMult + acreLevel("sharpMilestones") * acreDef("sharpMilestones").effect;
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
function buyMax(i) {
  let count = 0;
  while (count < 1000 && buyTier(i)) count++;
  render();
}

// ===== Game loop =====
// Work from the top tier down so each tier uses the amount from before this tick
function tick() {
  const now = Date.now();
  const seconds = (now - game.lastTick) / 1000;
  game.lastTick = now;

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
  if (game.automationOn && game.autoGooOn && expandMilestoneReached("autoGoo")) {
    for (let n = 0; n < 200; n++) {
      const options = SETTINGS.essenceUpgrades.filter(u => !essMaxed(u.id))
        .sort((a, b) => essCost(a.id).cmp(essCost(b.id)));
      if (!options.length || game.essence.lt(essCost(options[0].id))) break;
      game.essence = game.essence.sub(essCost(options[0].id));
      game.essUpgrades[options[0].id] = essLevel(options[0].id) + 1;
    }
  }

  // Auto-buy: highest tier first, as many as affordable
  for (let i = game.tiers.length - 1; i >= 0; i--) {
    if (!game.automationOn || !autoUnlocked(i) || !game.autobuy[i]) continue;
    let n = 0;
    while (n < 1000 && buyTier(i)) n++;
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
  const limit = new Decimal(SETTINGS.farmCapacity.max);
  if (game.coins.gt(limit)) game.coins = limit;
  if (game.runCoins.gt(limit)) game.runCoins = limit;
  game.runTime += seconds;

  // Auto-Render
  const ar = game.autoRender;
  if (game.automationOn && acreLevel("autoRender") > 0 && ar.on && renderUnlocked()) {
    const ready = ar.mode === "goo" ? essenceGain().gte(ar.value) : game.runTime >= ar.value;
    if (ready) doRender(true);
  }
  render();
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
          <button class="buy-max">Max</button>
          <button class="auto-btn">Auto</button>
        </div>
      </div>
      <div class="mbar"><div class="mfill"></div></div>`;
    row.querySelector(".buy-one").addEventListener("click", () => buyOne(i));
    row.querySelector(".buy-max").addEventListener("click", () => buyMax(i));
    row.querySelector(".auto-btn").addEventListener("click", () => {
      game.autobuy[i] = !game.autobuy[i];
      render();
    });
    container.appendChild(row);
    tierRows.push({
      row,
      owned: row.querySelector(".owned"),
      prod: row.querySelector(".prod"),
      cost: row.querySelector(".cost"),
      buyOne: row.querySelector(".buy-one"),
      buyMax: row.querySelector(".buy-max"),
      mult: row.querySelector(".mult"),
      next: row.querySelector(".next"),
      mfill: row.querySelector(".mfill"),
      mval: row.querySelector(".mval"),
      auto: row.querySelector(".auto-btn"),
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
      <div class="up-bottom">
        <span>Now <span class="eff"></span></span>
        <span class="cost-line"></span>
      </div>`;
    btn.addEventListener("click", () => buyEssUpgrade(u.id));
    container.appendChild(btn);
    essRows.push({
      id: u.id, btn,
      lvl: btn.querySelector(".lvl"),
      eff: btn.querySelector(".eff"),
      cost: btn.querySelector(".cost-line"),
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
        <div class="muted">First level-up: ${formatWhole(b.baseCost)} Goo, then ×${b.costGrowth} per level</div>`;
      list.appendChild(row);
    });
  }
  list.querySelectorAll(".catalog-item").forEach(row => {
    const id = row.dataset.building;
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
  const key = JSON.stringify([game.plots, game.plotsOwned, game.expands, choosingPlot]);
  if (key !== farmKey) {
    farmKey = key;
    grid.innerHTML = "";
    game.plots.forEach((id, pi) => {
      const card = document.createElement("div");
      card.className = "plot";
      if (choosingPlot === pi) {
        card.classList.add("choosing");
        card.innerHTML = `<div class="plot-head"><strong>Choose a building</strong><button class="small-btn cancel">Cancel</button></div>`;
        SETTINGS.buildings.forEach(b => {
          const opt = document.createElement("button");
          opt.className = "plot-option";
          opt.dataset.building = b.id;
          opt.innerHTML = `<div class="plot-head"><strong>${b.name}</strong><span class="opt-cost"></span></div><div class="muted">${b.desc}</div>`;
          opt.addEventListener("click", () => placeBuilding(pi, b.id));
          card.appendChild(opt);
        });
        card.querySelector(".cancel").addEventListener("click", () => { choosingPlot = null; render(); });
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
    if (game.plots.length < SETTINGS.plotCosts.length) {
      const locked = document.createElement("div");
      locked.className = "plot locked";
      locked.innerHTML = `<div class="muted">More land</div><button class="buy-plot"></button>`;
      locked.querySelector(".buy-plot").addEventListener("click", buyPlot);
      grid.appendChild(locked);
    }
  }
  // Live numbers
  grid.querySelectorAll(".plot[data-building]").forEach(card => {
    const id = card.dataset.building;
    const cost = buildingCost(id);
    const capped = buildingAtCap(id);
    card.querySelector(".lvl").textContent = "Lv " + buildingLevel(id) + "/" + buildingMaxLevel();
    card.querySelector(".eff").textContent = buildingEffectText(id);
    const btn = card.querySelector(".lvl-btn");
    btn.textContent = capped ? "Max level · grow your farm to raise" : "Level up: " + formatWhole(cost) + " Goo";
    btn.disabled = capped || game.essence.lt(cost);
  });
  // Building choices: price, and whether you can afford it
  grid.querySelectorAll(".plot-option").forEach(opt => {
    const b = buildingDef(opt.dataset.building);
    const placed = buildingPlaced(b.id);
    opt.querySelector(".opt-cost").textContent = placed ? "Already placed" : "Free";
    opt.disabled = placed;
  });
  const buyBtn = grid.querySelector(".buy-plot");
  if (buyBtn) {
    const cost = plotCost();
    buyBtn.textContent = "Buy plot: " + formatWhole(cost) + " Acre" + (cost.eq(1) ? "" : "s");
    buyBtn.disabled = game.acres.lt(cost);
  }
  document.getElementById("plot-count").textContent = game.plots.length + "/" + SETTINGS.plotCosts.length;
  renderCatalog();
}
function buildingEffectText(id) {
  const lvl = buildingLevel(id);
  if (id === "training") return "milestone every " + milestoneEveryValue();
  return "×" + format(buildingEffect(id), 2);
}

// ===== Screen updates =====
// Expand is shown (button and goal bar) after your first Render, or once you've Expanded or are close
function expandTeased() {
  return game.renders > 0 || game.expands > 0 || game.acres.gt(0)
    || game.tiers[0].owned.gte(new Decimal(SETTINGS.expandGoal).sqrt());
}

function render() {
  document.getElementById("coins").textContent = formatWhole(game.coins);
  document.getElementById("cps").textContent = formatWhole(coinsPerSecond());
  // Upgrades
  upgradeRows.forEach(r => {
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
    || acreLevel("autoRender") > 0 || expandMilestoneReached("autoGoo");
  const master = document.getElementById("master-auto");
  master.style.display = anyAuto ? "" : "none";
  master.textContent = game.automationOn ? "⏸" : "▶";
  master.title = game.automationOn ? "Automation is on: tap to pause it all" : "Automation is paused: tap to resume";
  master.classList.toggle("paused", !game.automationOn);
  document.body.classList.toggle("auto-paused", !game.automationOn);

  // Farm capacity notice under the coin counter
  const notice = document.getElementById("farm-notice");
  // Sell the Farm (v0.2) unlocks at 1.79e308 coins
  if (coinsAtLimit()) notice.textContent = "Coins at the limit · Sell the Farm in v0.2";
  else if (atTrueCap() && farmFull()) notice.textContent = "Farm at max size";
  else if (farmFull()) notice.textContent = "Farm full";
  else notice.textContent = "";
  notice.style.display = notice.textContent ? "" : "none";

  // Expand button, popup, and Auto-Render settings
  const showExpand = expandTeased();
  const showAcres = game.expands > 0 || game.acres.gt(0) || game.tiers[0].owned.gte(new Decimal(SETTINGS.expandGoal).sqrt());
  // The Farm tab card only appears once Expand is actually available
  document.getElementById("expand-row").style.display = expandUnlocked() ? "" : "none";
  document.getElementById("expand-btn").style.display = showAcres ? "" : "none";
  document.getElementById("farm-tab").style.display = showAcres ? "" : "none";
  document.getElementById("expand-btn-amount").textContent = formatWhole(game.acres);
  document.getElementById("expand-dot").style.display =
    (SETTINGS.acreUpgrades.some(u => !acreMaxed(u.id) && game.acres.gte(acreCost(u.id))) ||
     (game.plots.length < SETTINGS.plotCosts.length && game.acres.gte(plotCost()))) ? "" : "none";
  document.getElementById("acre-amount").textContent = formatWhole(game.acres);
  document.getElementById("expand-count").textContent = game.expands;
  const capNow = farmCapacity();
  const t1 = game.tiers[0].owned;
  const expPct = t1.lte(1) ? 0 : Math.min(100, t1.log10().div(capNow.log10()).toNumber() * 100);
  document.getElementById("expand-fill").style.width = expPct.toFixed(1) + "%";
  document.getElementById("expand-text").textContent = atTrueCap()
    ? "Your farm is at its maximum size."
    : !expandUnlocked() ? "Expand unlocks at " + formatWhole(SETTINGS.expandGoal) + " Tier 1 slimes (you have " + formatWhole(t1) + ")"
    : "Tier 1 slimes: " + formatWhole(t1) + " / " + formatWhole(capNow) + " (farm capacity)";
  // Quiet hint about whether this Expand will grow the farm (only once Expand is available)
  document.getElementById("grow-hint").textContent = (atTrueCap() || !expandUnlocked()) ? ""
    : expandWillGrow() ? "Your farm is full: Expanding now will grow it ×1e10."
    : "Fill your farm to " + formatWhole(capNow) + " Tier 1 slimes for it to grow when you Expand.";
  // Big Expand button in the top bar: only shows once Expand is unlocked
  const topExp = document.getElementById("top-expand");
  // Shows (greyed out) once you're near Expand or have Expanded before
  topExp.style.display = showExpand ? "" : "none";
  topExp.disabled = !expandUnlocked();
  const gainTop = acreGain();
  const t1Log = game.tiers[0].owned.lte(1) ? 0 : game.tiers[0].owned.log10().toNumber();
  const goalLog = new Decimal(SETTINGS.expandGoal).log10().toNumber();
  document.getElementById("top-expand-sub").textContent = expandUnlocked()
    ? "+" + formatWhole(gainTop) + " Acre" + (gainTop.eq(1) ? "" : "s") + (expandWillGrow() ? " · grows" : "")
    : "Locked";
  // Bar on the button: progress to the next Acre (the goal bar below covers the unlock)
  document.getElementById("top-expand-fill").style.width = (expandUnlocked()
    ? nextAcreProgress() * 100 : 0).toFixed(1) + "%";
  topExp.title = !expandUnlocked() ? "Unlocks at " + formatWhole(SETTINGS.expandGoal) + " Tier 1 slimes (you have " + formatWhole(game.tiers[0].owned) + ")"
    : expandWillGrow() ? "Your farm is full: this Expand grows it ×1e10" : "Bar shows progress to the next Acre";
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
  const arBox = document.getElementById("auto-render-box");
  arBox.style.display = acreLevel("autoRender") > 0 ? "" : "none";
  const arToggle = document.getElementById("ar-toggle");
  arToggle.textContent = "Auto-Render " + (game.autoRender.on ? "ON" : "OFF");
  arToggle.classList.toggle("on", game.autoRender.on);
  document.getElementById("ar-unit").textContent = game.autoRender.mode === "goo" ? "Goo or more" : "seconds";

  renderFarm();

  // Settings switches
  document.querySelectorAll(".pref-toggle").forEach(btn => {
    const on = !!game.prefs[btn.dataset.pref];
    btn.textContent = on ? "ON" : "OFF";
    btn.classList.toggle("on", on);
  });

  // Auto-buy Goo upgrades switch (Expand milestone)
  const gooAuto = document.getElementById("auto-goo");
  gooAuto.style.display = expandMilestoneReached("autoGoo") ? "" : "none";
  gooAuto.textContent = "Auto " + (game.autoGooOn ? "ON" : "OFF");
  gooAuto.classList.toggle("on", game.autoGooOn);

  // Upgrade Helper switch
  const helperBtn = document.getElementById("auto-upgrades");
  helperBtn.style.display = essLevel("upgradeHelper") > 0 ? "" : "none";
  helperBtn.textContent = "Auto " + (game.autoUpgrades ? "ON" : "OFF");
  helperBtn.classList.toggle("on", game.autoUpgrades);

  // Essence and Render panel
  const showGoo = game.renders > 0 || game.essence.gt(0);
  document.getElementById("goo-btn").style.display = showGoo ? "" : "none";
  document.getElementById("goo-tab").style.display = showGoo ? "" : "none";
  document.getElementById("goo-btn-amount").textContent = formatWhole(game.essence);
  const canBuyGoo = SETTINGS.essenceUpgrades.some(u => !essMaxed(u.id) && game.essence.gte(essCost(u.id)));
  document.getElementById("goo-dot").style.display = canBuyGoo ? "" : "none";
  document.getElementById("ess-amount").textContent = formatWhole(game.essence);
  document.getElementById("render-count").textContent = game.renders;
  essRows.forEach(r => {
    const maxed = essMaxed(r.id);
    const cost = essCost(r.id);
    const lvl = essLevel(r.id);
    const max = essDef(r.id).maxLevel;
    r.lvl.textContent = "Lv " + lvl + (max !== null ? "/" + max : "");
    r.eff.textContent = r.id === "headStart" ? formatWhole(startingCoins(game)) + " coins"
      : r.id === "upgradeHelper" ? (lvl > 0 ? "Owned" : "Not owned")
      : "×" + format(essEffect(r.id), 2);
    r.cost.textContent = maxed ? (max === 1 ? "OWNED" : "MAXED") : formatWhole(cost) + " Goo";
    r.btn.disabled = maxed || game.essence.lt(cost);
    r.btn.classList.toggle("affordable", !r.btn.disabled);
    r.btn.classList.toggle("maxed", maxed);
  });
  milestoneRows.forEach(r => r.li.classList.toggle("done", milestoneReached(r.m)));

  // Render goal progress (log scale so the bar moves steadily)
  const goal = renderGoalValue();
  const pct = game.runCoins.lte(1) ? 0 :
    Math.min(100, game.runCoins.log10().div(goal.log10()).toNumber() * 100);
  const reached = renderUnlocked();
  // One goal bar under the header: coins toward Render, then Tier 1 toward the Expand unlock
  const goalBar = document.getElementById("render-progress");
  const expandGoalMode = reached && !expandUnlocked() && expandTeased();
  goalBar.classList.toggle("expand-mode", expandGoalMode);
  if (!reached) {
    document.getElementById("render-fill").style.width = pct.toFixed(1) + "%";
    document.getElementById("render-text").textContent =
      "Earned this farm: " + formatWhole(game.runCoins) + " / " + formatWhole(goal);
  } else if (expandGoalMode) {
    const t1 = game.tiers[0].owned;
    const eg = new Decimal(SETTINGS.expandGoal);
    const ePct = t1.lte(1) ? 0 : Math.min(100, t1.log10().div(eg.log10()).toNumber() * 100);
    document.getElementById("render-fill").style.width = ePct.toFixed(1) + "%";
    document.getElementById("render-text").textContent =
      "Tier 1 slimes to unlock Expand: " + formatWhole(t1) + " / " + formatWhole(eg);
  }
  goalBar.style.display = (!reached || expandGoalMode) ? "" : "none";
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
    ? "Next at " + next.renders + " Render" + (next.renders > 1 ? "s" : "") + ": " + milestoneText(next)
    : "All milestones reached";

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
    r.buyOne.disabled = !canAfford;
    r.buyMax.disabled = !canAfford;
    r.mult.textContent = "×" + format(tierMultiplier(i), 2);
    r.next.textContent = formatWhole(toNextMilestone(i));
    r.mval.textContent = format(milestoneMultValue(), 1);
    const every = milestoneEveryValue();
    r.auto.style.display = autoUnlocked(i) ? "" : "none";
    r.auto.textContent = "Auto " + (game.autobuy[i] ? "ON" : "OFF");
    r.auto.classList.toggle("on", !!game.autobuy[i]);
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
    acres: game.acres.toString(),
    expands: game.expands,
    acreUpgrades: game.acreUpgrades,
    plotsOwned: game.plotsOwned,
    plotsFromMilestones: true,
    plotsBought: true,
    buildingsFree: true,
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
    autoUpgrades: game.autoUpgrades,
    automationOn: game.automationOn,
    prefs: game.prefs,
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
  game.plots = game.plots.slice(0, SETTINGS.plotCosts.length);
  game.plotsOwned = game.plots.length;
  // Compost moved from an Acre upgrade to an Expand milestone: refund its Acres (3, 12, 48, ...)
  if (game.acreUpgrades.compost) {
    let refund = 0;
    for (let l = 0; l < game.acreUpgrades.compost; l++) refund += 3 * Math.pow(4, l);
    game.acres = game.acres.add(refund);
    delete game.acreUpgrades.compost;
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
  // Offline progress: count time away, up to the cap
  const maxMs = SETTINGS.maxOfflineHours * 3600 * 1000;
  game.lastTick = Math.max(data.lastTick, Date.now() - maxMs);
}
// Restart the current Expand: like Expanding but with no Acres and no farm growth.
// Keeps Acres, Acre upgrades, plots, buildings, Expand count, and milestones.
function restartExpand() {
  if (!confirm("Restart this Expand?\n\nCoins, slimes, coin upgrades, Goo, Goo upgrades, and Render milestones reset (Expand milestones still apply). You keep your Acres, upgrades, plots, and buildings, and you don't earn any Acres.")) return;
  resetExpand(game);
  save();
  render();
  toast("Expand restarted");
}
// Back to the state right after a first Expand (from a full farm). Keeps settings.
function backToFirstExpand() {
  if (!confirm("Go back to your first Expand?\n\nYou'll have 1 Expand done, 1 Acre, and a farm grown once. Acre upgrades, plots, buildings, Goo, and everything else reset. Your settings are kept.")) return;
  const keep = { prefs: game.prefs, autobuy: game.autobuy, autoUpgrades: game.autoUpgrades,
    automationOn: game.automationOn, autoGooOn: game.autoGooOn, autoRender: game.autoRender };
  game = newGame();
  Object.assign(game, keep);
  game.expands = 1;
  game.farmGrowths = 1;
  game.acres = new Decimal(1);
  resetExpand(game);
  farmKey = "";
  save();
  render();
  toast("Back to your first Expand");
}
function resetSave() {
  if (!confirm("Erase all progress?")) return;
  try { localStorage.removeItem(SETTINGS.saveKey); } catch (e) {}
  game = newGame();
  render();
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
function showTab(panelId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.panel === panelId));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === panelId));
  window.scrollTo(0, 0);
}
function setupTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => showTab(tab.dataset.panel));
  });
}

// ===== Startup =====
setupTabs();
document.getElementById("latest-update").textContent = LATEST_UPDATE;
setupSaveCode();
buildTierRows();
buildUpgradeRows();
buildRenderPanel();
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
    render();
  });
});

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
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

load();
arMode.value = game.autoRender.mode;
arValue.value = game.autoRender.value;
tick();
setInterval(tick, 100);
setInterval(save, SETTINGS.saveIntervalMs);
