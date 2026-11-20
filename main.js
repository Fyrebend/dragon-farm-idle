// ===== Settings: tuning numbers for this step =====
const SETTINGS = {
  squishCoins: 1,          // coins per manual squish
  tier1BaseCost: 10,       // price of the first Tier 1 slime
  tier1CostGrowth: 1.15,   // each purchase multiplies the price by this
  tier1CoinsPerSec: 1,     // coins each Tier 1 slime makes per second
  saveIntervalMs: 10000,   // autosave every 10 seconds
  maxOfflineHours: 8,      // cap on offline progress
  saveKey: "dragonFarmIdle_save",
};

// ===== Game state =====
function newGame() {
  return {
    coins: new Decimal(0),
    tier1: new Decimal(0),
    lastTick: Date.now(),
  };
}
let game = newGame();

// ===== Number formatting =====
function format(num) {
  num = new Decimal(num);
  if (num.lt(1000)) return num.toNumber().toFixed(num.lt(100) ? 1 : 0);
  return num.toExponential(2).replace("+", "");
}

// ===== Costs and production =====
function tier1Cost() {
  return new Decimal(SETTINGS.tier1CostGrowth).pow(game.tier1).mul(SETTINGS.tier1BaseCost);
}
function coinsPerSecond() {
  return game.tier1.mul(SETTINGS.tier1CoinsPerSec);
}

// ===== Player actions =====
function squish() {
  game.coins = game.coins.add(SETTINGS.squishCoins);
  render();
}
function buyTier1() {
  const cost = tier1Cost();
  if (game.coins.gte(cost)) {
    game.coins = game.coins.sub(cost);
    game.tier1 = game.tier1.add(1);
    render();
  }
}

// ===== Game loop =====
function tick() {
  const now = Date.now();
  const seconds = (now - game.lastTick) / 1000;
  game.lastTick = now;
  game.coins = game.coins.add(coinsPerSecond().mul(seconds));
  render();
}

// ===== Screen updates =====
function render() {
  document.getElementById("coins").textContent = format(game.coins);
  document.getElementById("cps").textContent = format(coinsPerSecond());
  document.getElementById("tier1-count").textContent = format(game.tier1);
  document.getElementById("tier1-cost").textContent = format(tier1Cost());
  document.getElementById("buy-tier1").disabled = game.coins.lt(tier1Cost());
}

// ===== Save and load (stored on this device) =====
function save() {
  const data = {
    coins: game.coins.toString(),
    tier1: game.tier1.toString(),
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
  game.tier1 = new Decimal(data.tier1);
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
document.getElementById("squish").addEventListener("click", squish);
document.getElementById("buy-tier1").addEventListener("click", buyTier1);
document.getElementById("reset").addEventListener("click", resetSave);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

load();
tick();
setInterval(tick, 100);
setInterval(save, SETTINGS.saveIntervalMs);
