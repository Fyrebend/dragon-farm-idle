// ===== Settings: tuning numbers =====
const SETTINGS = {
  startingSlimes: 1,        // free Tier 1 slimes at the start of a run (do not raise the price)
  unlockedTiers: 4,         // tiers available at the start (Render milestones unlock more)
  saveIntervalMs: 10000,    // autosave every 10 seconds
  maxOfflineHours: 8,       // cap on offline progress
  milestoneEvery: 25,       // every this many bought of a tier...
  milestoneMult: 1.5,       // ...multiplies that tier's production by this
  renderGoal: 1e15,         // coins needed in a run to unlock Render

  // Goo from a Render (called "essence" in the code) = (digits in total slimes owned / digitDivisor) ^ power × tierMult ^ (highest tier - 1)
  // Based on the number of digits (log10) so pushing longer helps steadily without exploding.
  // Always at least 1 when Render is unlocked.
  essence: { digitDivisor: 10, power: 3, tierMult: 1.5 },

  // Goo upgrades (permanent, kept through Render)
  essenceUpgrades: [
    { id: "gooPower",    name: "Goo Power",      desc: "All tiers ×2 per level",          baseCost: 1, costGrowth: 3, effect: 2,    maxLevel: null },
    { id: "cheapSlimes", name: "Slime Discount", desc: "Slime prices ×0.75 per level",    baseCost: 2, costGrowth: 4, effect: 0.75, maxLevel: 5 },
    { id: "headStart",   name: "Head Start",     desc: "Start runs with 10× more coins per level", baseCost: 3, costGrowth: 5, effect: 10, maxLevel: 5 },
    { id: "upgradeHelper", name: "Upgrade Helper", desc: "Auto-buys coin upgrades, cheapest first (one-time)", baseCost: 50, costGrowth: 1, effect: 1, maxLevel: 1 },
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
    { name: "Tier 5 Slime", baseCost: 1e9,  costGrowth: 1.35, rate: 0.15 },
    { name: "Tier 6 Slime", baseCost: 1e13, costGrowth: 1.40, rate: 0.1 },
    { name: "Tier 7 Slime", baseCost: 1e18, costGrowth: 1.45, rate: 0.1 },
    { name: "Tier 8 Slime", baseCost: 1e24, costGrowth: 1.50, rate: 0.1 },
  ],
};

// ===== Game state =====
// owned: total slimes of a tier (bought + produced by the tier above)
// bought: only the ones purchased; prices go up based on this number
function newGame() {
  const g = {
    // Permanent (kept through Render)
    essence: new Decimal(0),
    totalEssence: new Decimal(0),
    renders: 0,
    essUpgrades: Object.fromEntries(SETTINGS.essenceUpgrades.map(u => [u.id, 0])),
    autobuy: SETTINGS.tiers.map(() => true),   // on/off switch per tier (only works once unlocked)
    autoUpgrades: true,                        // on/off switch for Upgrade Helper
    lastTick: Date.now(),
  };
  resetRun(g);
  return g;
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
}
function startingCoins(g) {
  const lvl = (g.essUpgrades && g.essUpgrades.headStart) || 0;
  return lvl > 0 ? new Decimal(10).pow(lvl + 1) : new Decimal(0);
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
  return new Decimal(u.costGrowth).pow(upgradeLevel(id)).mul(u.baseCost);
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
  return new Decimal(u.costGrowth).pow(essLevel(id)).mul(u.baseCost);
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
function renderUnlocked() {
  return game.runCoins.gte(SETTINGS.renderGoal);
}
function highestTierOwned() {
  let h = 0;
  game.tiers.forEach((t, i) => { if (t.owned.gte(1)) h = i + 1; });
  return h;
}
function essenceGain() {
  if (!renderUnlocked()) return new Decimal(0);
  const e = SETTINGS.essence;
  const total = game.tiers.reduce((sum, t) => sum.add(t.owned.floor()), new Decimal(0));
  const digits = total.max(1).log10().div(e.digitDivisor);
  const gain = digits.pow(e.power).mul(new Decimal(e.tierMult).pow(highestTierOwned() - 1));
  return Decimal.max(1, gain.floor());
}
function doRender() {
  if (!renderUnlocked()) return;
  const gain = essenceGain();
  if (!confirm("Render your slimes into " + formatWhole(gain) + " Goo?\n\nCoins, slimes, and coin upgrades will reset.")) return;
  game.essence = game.essence.add(gain);
  game.totalEssence = game.totalEssence.add(gain);
  game.renders += 1;
  resetRun(game);
  save();
  render();
  toast("Rendered for +" + formatWhole(gain) + " Goo");
  document.getElementById("render-modal").classList.add("open");
  SETTINGS.renderMilestones
    .filter(m => m.renders === game.renders)
    .forEach(m => toast("Milestone reached: " + milestoneText(m) +
      (m.type === "auto" ? " (switch it on/off on the slime card)" : ""), true));
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
  return new Decimal(t.costGrowth).pow(game.tiers[i].bought).mul(t.baseCost)
    .mul(upgradeEffect("bargain")).mul(essEffect("cheapSlimes"));
}
// Only whole slimes produce; a slime that is still "growing" makes nothing yet
function milestoneCount(i) {
  return game.tiers[i].bought.div(SETTINGS.milestoneEvery).floor();
}
function tierMultiplier(i) {
  return new Decimal(SETTINGS.milestoneMult).pow(milestoneCount(i));
}
function toNextMilestone(i) {
  const every = new Decimal(SETTINGS.milestoneEvery);
  return every.sub(game.tiers[i].bought.mod(every));
}
function tierProduction(i) {
  let prod = game.tiers[i].owned.floor().mul(SETTINGS.tiers[i].rate).mul(tierMultiplier(i));
  prod = prod.mul(upgradeEffect("digestion")).mul(essEffect("gooPower"));
  if (i === 0) prod = prod.mul(upgradeEffect("richGoo"));
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
  if (!tierVisible(i) || game.coins.lt(cost)) return false;
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
  if (essLevel("upgradeHelper") > 0 && game.autoUpgrades) {
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

  // Auto-buy: highest tier first, as many as affordable
  for (let i = game.tiers.length - 1; i >= 0; i--) {
    if (!autoUnlocked(i) || !game.autobuy[i]) continue;
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
      <div class="tier-info">
        <div class="tier-top">
          <strong>${t.name}</strong>
          <span class="owned">0</span>
        </div>
        <div class="tier-meta">
          <span class="prod">+0/sec</span> <span class="muted">→ ${makes}</span>
          <span class="chip mult">×1</span>
        </div>
        <div class="milestone">
          <div class="mbar"><div class="mfill"></div></div>
          <span class="muted"><span class="next">0</span> to ×${SETTINGS.milestoneMult}</span>
        </div>
      </div>
      <div class="tier-buttons">
        <button class="buy-one"><span class="cost">0</span></button>
        <button class="buy-max">Max</button>
        <button class="auto-btn">Auto</button>
      </div>`;
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

// ===== Screen updates =====
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

  // Upgrade Helper switch
  const helperBtn = document.getElementById("auto-upgrades");
  helperBtn.style.display = essLevel("upgradeHelper") > 0 ? "" : "none";
  helperBtn.textContent = "Auto " + (game.autoUpgrades ? "ON" : "OFF");
  helperBtn.classList.toggle("on", game.autoUpgrades);

  // Essence and Render panel
  const showGoo = game.renders > 0 || game.essence.gt(0);
  document.getElementById("goo-btn").style.display = showGoo ? "" : "none";
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
  const goal = new Decimal(SETTINGS.renderGoal);
  const pct = game.runCoins.lte(1) ? 0 :
    Math.min(100, game.runCoins.log10().div(goal.log10()).toNumber() * 100);
  document.getElementById("render-fill").style.width = pct.toFixed(1) + "%";
  document.getElementById("render-text").textContent =
    "Earned this run: " + formatWhole(game.runCoins) + " / " + formatWhole(goal);
  const reached = renderUnlocked();
  document.getElementById("render-progress").style.display = reached ? "none" : "";
  const rbtn = document.getElementById("render-btn");
  rbtn.disabled = !reached;
  rbtn.classList.toggle("ready", reached);
  rbtn.textContent = reached ? "Render +" + formatWhole(essenceGain()) + " Goo" : "Render (locked)";

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
    const canAfford = game.coins.gte(cost);
    r.owned.textContent = formatWhole(game.tiers[i].owned);
    r.prod.textContent = formatRate(tierProduction(i));
    r.cost.textContent = formatWhole(cost.ceil());
    r.buyOne.disabled = !canAfford;
    r.buyMax.disabled = !canAfford;
    r.mult.textContent = "×" + format(tierMultiplier(i), 2);
    r.next.textContent = formatWhole(toNextMilestone(i));
    const every = SETTINGS.milestoneEvery;
    r.auto.style.display = autoUnlocked(i) ? "" : "none";
    r.auto.textContent = "Auto " + (game.autobuy[i] ? "ON" : "OFF");
    r.auto.classList.toggle("on", !!game.autobuy[i]);
    r.mfill.style.width = ((every - toNextMilestone(i).toNumber()) / every * 100) + "%";
  });
}

// ===== Save and load (stored on this device) =====
function save() {
  const data = {
    coins: game.coins.toString(),
    runCoins: game.runCoins.toString(),
    upgrades: game.upgrades,
    tiers: game.tiers.map(t => ({ owned: t.owned.toString(), bought: t.bought.toString() })),
    essence: game.essence.toString(),
    totalEssence: game.totalEssence.toString(),
    renders: game.renders,
    essUpgrades: game.essUpgrades,
    autobuy: game.autobuy,
    autoUpgrades: game.autoUpgrades,
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
  if (data.totalEssence) game.totalEssence = new Decimal(data.totalEssence);
  if (data.renders) game.renders = data.renders;
  if (data.essUpgrades) Object.assign(game.essUpgrades, data.essUpgrades);
  if (data.autoUpgrades !== undefined) game.autoUpgrades = data.autoUpgrades;
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
function resetSave() {
  if (!confirm("Erase all progress?")) return;
  try { localStorage.removeItem(SETTINGS.saveKey); } catch (e) {}
  game = newGame();
  render();
}

// ===== Tabs (phone layout) =====
function setupTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".panel").forEach(p =>
        p.classList.toggle("active", p.id === tab.dataset.panel));
    });
  });
}

// ===== Startup =====
setupTabs();
buildTierRows();
buildUpgradeRows();
buildRenderPanel();
document.getElementById("render-btn").addEventListener("click", doRender);
document.getElementById("auto-upgrades").addEventListener("click", () => {
  game.autoUpgrades = !game.autoUpgrades;
  render();
});

// Render popup
const renderModal = document.getElementById("render-modal");
document.getElementById("goo-btn").addEventListener("click", () => renderModal.classList.add("open"));
document.getElementById("render-close").addEventListener("click", () => renderModal.classList.remove("open"));
renderModal.addEventListener("click", e => { if (e.target === renderModal) renderModal.classList.remove("open"); });
document.querySelectorAll(".subtab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".subtab").forEach(t => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".subpanel").forEach(p => p.classList.toggle("active", p.id === tab.dataset.sub));
  });
});
document.getElementById("reset").addEventListener("click", resetSave);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

load();
tick();
setInterval(tick, 100);
setInterval(save, SETTINGS.saveIntervalMs);
