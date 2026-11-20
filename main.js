// ===== Settings: tuning numbers =====
const SETTINGS = {
  startingSlimes: 1,        // free Tier 1 slimes at the start of a run (do not raise the price)
  unlockedTiers: 4,         // tiers available before Render (Render milestones will raise this later)
  saveIntervalMs: 10000,    // autosave every 10 seconds
  maxOfflineHours: 8,       // cap on offline progress
  milestoneEvery: 25,       // every this many bought of a tier...
  milestoneMult: 1.5,       // ...multiplies that tier's production by this
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
  return {
    coins: new Decimal(0),
    tiers: SETTINGS.tiers.map((t, i) => ({
      owned: new Decimal(i === 0 ? SETTINGS.startingSlimes : 0),
      bought: new Decimal(0),
    })),
    lastTick: Date.now(),
  };
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
function tierCost(i) {
  const t = SETTINGS.tiers[i];
  return new Decimal(t.costGrowth).pow(game.tiers[i].bought).mul(t.baseCost);
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
  return game.tiers[i].owned.floor().mul(SETTINGS.tiers[i].rate).mul(tierMultiplier(i));
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
  if (i >= SETTINGS.unlockedTiers) return false;
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

  game.coins = game.coins.add(coinsPerSecond().mul(seconds));
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
    const makes = i === 0 ? "coins" : SETTINGS.tiers[i - 1].name + "s";
    row.innerHTML = `
      <div class="tier-info">
        <strong>${t.name}</strong>
        <div class="small">Owned: <span class="owned">0</span> · makes ${makes}</div>
        <div class="small"><span class="prod">+0/sec</span> · <span class="mult">×1</span></div>
        <div class="small"><span class="next">0</span> more to ×${SETTINGS.milestoneMult}</div>
      </div>
      <div class="tier-buttons">
        <button class="buy-one">Buy<br><span class="cost">0</span></button>
        <button class="buy-max">Max</button>
      </div>`;
    row.querySelector(".buy-one").addEventListener("click", () => buyOne(i));
    row.querySelector(".buy-max").addEventListener("click", () => buyMax(i));
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
    });
  });
}

// ===== Screen updates =====
function render() {
  document.getElementById("coins").textContent = formatWhole(game.coins);
  document.getElementById("cps").textContent = formatWhole(coinsPerSecond());
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
  });
}

// ===== Save and load (stored on this device) =====
function save() {
  const data = {
    coins: game.coins.toString(),
    tiers: game.tiers.map(t => ({ owned: t.owned.toString(), bought: t.bought.toString() })),
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

// ===== Startup =====
buildTierRows();
document.getElementById("reset").addEventListener("click", resetSave);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

load();
tick();
setInterval(tick, 100);
setInterval(save, SETTINGS.saveIntervalMs);
