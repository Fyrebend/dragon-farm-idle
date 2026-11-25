// Shown in Settings so you can tell you have the newest version. Update with every change.
const LATEST_UPDATE = "Scale Hoarder now gives offline cap ×1.5 (12 hours with every offline achievement)";

// ===== Settings: tuning numbers =====
const SETTINGS = {
  startingSlimes: 1,        // free Tier 1 slimes at the start of a run (do not raise the price)
  unlockedTiers: 8,         // every tier is open from the start (prices hold the high ones back)
  saveIntervalMs: 10000,    // autosave every 10 seconds
  maxOfflineHours: 1,       // base cap on offline progress; each "offline" achievement doubles it (never reset)
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
    { id: "richerRender", name: "Richer Render", desc: "+1 base Goo per Render per level (added before Goo bonuses)", baseCost: 1, costGrowth: 3, effect: 1, maxLevel: 5 },
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
  fullFarmBonus: 2,         // a full farm gives ×2 Acres when you Expand

  // Expand milestones: rewards for how many times you've Expanded (any Expand counts)
  expandMilestones: [
    { expands: 1,  id: "gooStarter",   text: "Start each Expand with 1 level in every Goo upgrade (including Upgrade Helper)" },
    { expands: 2,  id: "keepRenderMs", text: "Render milestones no longer reset when you Expand" },
    { expands: 3,  id: "autoGoo",      text: "Auto-buy Goo upgrades" },
    { expands: 5,  id: "fasterMilestones", text: "Purchase milestones every 20 slimes instead of 25" },
    { expands: 8,  id: "gooStart",     text: "Start each Expand with Goo Power and Slime Growth at level 5" },
    { expands: 10, id: "gooPerExpand", text: "+10% Goo from every Render for each time your farm has grown" },
    { expands: 12, id: "autoAcres",    text: "Auto-Expand for Acres (settings in Automation)" },
    { expands: 20, id: "autoBuild",    text: "Auto-level buildings, cheapest first (settings in Automation)" },
  ],

  // Acre upgrades (permanent, kept through Expand)
  // Acre upgrades were removed: Acres now level the Estate buildings
  acreUpgrades: [],

  // ----- Plots and buildings -----
  // Plots open on their own when the farm has grown this many times (an Expand from a full farm
  // grows it). One plot per building.
  // Plots: buy the first three with Acres; the 4th opens free when your coins first hit the cap (for the Coin Silo)
  plotCosts: [1, 3, 5],
  plotUnlocks: [0, 0, 0, 999],
  // Coins stop at coinCap; each Coin Silo level raises it ×silo effect
  coinCap: "1.8e308",

  // ----- The Market: Sell the Farm -----
  // Every sale pays a flat amount of Scales; Path upgrades and sale milestones multiply it.
  scalesPerSale: 1,
  // Scale income grows with the Market: every merchant signed and every Stall item owned multiplies it
  scaleDealMult: 1.3,
  scaleStallMult: 1.2,
  // Market Stall: one-time buys (automation). soon: shown but not buyable yet.
  stall: [
    // Ordered so each item lands just before the contract it helps. bad: what it does during Bad Market
    { id: "fertileSoil", name: "Fertile Soil",        desc: "Acres from every Expand ×1.2", cost: 5, bad: "Acres ×0.8" },
    { id: "acrePurse",   name: "Acre Purse",          desc: "Every new farm starts with 5% of the most Acres you've earned on one farm", cost: 20, bad: "Building prices ×1.25" },
    { id: "starterHerd", name: "Starter Herd",        desc: "Free purchase milestones on every tier: Tier 1 gets 8, Tier 2 gets 7 … Tier 8 gets 1", cost: 70, bad: "Tier 1 loses 8 purchase milestones … Tier 8 loses 1" },
    { id: "barnRaising", name: "Barn Raising",        desc: "Buildings start every farm +1 level for every 2 farms you've sold", cost: 150, bad: "Goo from every Render ×0.5" },
    { id: "siloSpill",   name: "Silo Spill",          desc: "While your coins are at the cap: Acres ×(1 + 0.1 per Coin Silo level)", cost: 400, bad: "Coin cap ÷1e20" },
    { id: "gooSeed",     name: "Goo Seed",            desc: "Goo Power, Slime Growth and Deep Goo start every Expand with extra levels: 20% of your best", cost: 1200, bad: "Goo upgrade prices ×2" },
    { id: "ledger",      name: "Contractor's Ledger", desc: "Buildings start every farm +1 level for each Contract you've finished", cost: 2500, bad: "Slime prices ×10" },
  ],
  // Upgrade Path: rows of one-time upgrades. Pick 1 per row (a sale milestone lifts the limit).
  // Buying anything in a row opens the next one. Rows where everything is "soon" are skipped.
  marketPath: [
    { cost: 1, nodes: [
      { id: "veteranBreeder", name: "Veteran Breeder", desc: "All slimes ×(1 + 1 per farm sold)" } ] },
    { cost: 3, nodes: [
      { id: "gooBuyers",      name: "Goo Buyers",      desc: "Goo from every Render ×3" },
      { id: "landDeals",      name: "Land Deals",      desc: "Acres from every Expand ×2" } ] },
    { cost: 10, nodes: [
      { id: "betterBroker",   name: "Better Broker",   desc: "Scales from every sale ×2" },
      { id: "surveyed",       name: "Surveyed Land",   desc: "New farms start grown 5 times" } ] },
    { cost: 45, nodes: [
      { id: "goldenVats",     name: "Golden Vats",     desc: "Goo Vat gives ×1.15 per level instead of ×1.1" },
      { id: "cheapLand",      name: "Cheap Land",      desc: "Building prices −25%" } ] },
    { cost: 200, nodes: [
      { id: "goldenGoo",      name: "Golden Goo",      desc: "Goo from every Render ×(1 + 1 per farm sold)" },
      { id: "deepPockets",    name: "Deep Pockets",    desc: "Coin cap ×1e20" } ] },
    { cost: 900, nodes: [
      { id: "breederII",      name: "Master Breeder",  desc: "Veteran Breeder's bonus doubles: ×(1 + 2 per farm sold)" },
      { id: "landBaron",      name: "Land Baron",      desc: "Acres from every Expand ×(1 + 0.25 per farm sold)" },
      { id: "topBroker",      name: "Top Broker",      desc: "Scales from every sale ×2" } ] },
    // The last deal opens Act 2 (not built yet)
    { cost: 25000, nodes: [
      { id: "biggerPens",     name: "Bigger Pens",     desc: "Your farm can grow past 1.8e308 (Act 2)", soon: true } ] },
  ],
  // Rewards for how many farms you've sold
  saleMilestones: [
    { sales: 1,  id: "gooDouble",      text: "×2 Goo from every Render" },
    { sales: 2,  id: "contracts",      text: "Unlocks Contracts (Market tab)" },
    { sales: 4,  id: "buildingsStart", text: "Start every farm with the Nursery, Goo Vat, and Feed Mill at level 5" },
    { sales: 6,  id: "strongMilestones", text: "Purchase milestones ×1.25 instead of ×1.2" },
    { sales: 10, id: "doubleScales",   text: "×2 Scales from every sale" },
    { sales: 15, id: "autoSell",       text: "Auto-Sell: sells the farm as soon as it's ready (switch in the Auto tab)" },
    { sales: 25, id: "allInRow",       text: "Sign with every merchant in a Deal (no more pick one)" },
  ],
  // Contracts: one at a time. Each has a goal and a rule; finishing one gives its reward forever
  // plus +1 Scale on every sale. goal types: expands, t1, coins, growths (this farm), sale.
  contracts: [
    // payout: one-time Scales when finished. mastered: stronger reward once Silent Partner is done
    { id: "handRaised", name: "Hand-Raised",   goal: "t1",      target: "1e50", rule: "noAuto",     payout: 3,    goalText: "Reach 1e50 Tier 1 slimes", ruleText: "All automation off", reward: "Render milestones are kept through sales" },
    { id: "roomToGrow", name: "Room to Grow",  goal: "expands", target: 5,      rule: "growOnly",   payout: 8,    goalText: "Reach 5 Expands", ruleText: "Every Expand must grow the farm", reward: "Expand milestones are kept through sales" },
    { id: "smallPens",  name: "Small Pens",    goal: "t1",      target: "1e57", rule: "lowTiers",   payout: 30,   goalText: "Reach 1e57 Tier 1 slimes", ruleText: "Tiers 5–8 locked", reward: "Tiers 1–4 production ×3", mastered: "×5" },
    { id: "rawSlime",   name: "Raw Slime",     goal: "coins",   target: "1e82", rule: "noGoo",      payout: 100,  goalText: "Reach 1e82 coins", ruleText: "Goo upgrades have no effect", tip: "Goo does nothing here, so each Render only resets you", reward: "×2 Goo from every Render", mastered: "×3" },
    { id: "frugal",     name: "Frugal Farmer", goal: "growths", target: 10,     rule: "bld10",      payout: 300,  goalText: "Grow your farm 10 times", ruleText: "No building past level 10", reward: "×1.5 Acres from every Expand", mastered: "×2" },
    { id: "quickFlip",  name: "Quick Flip",    goal: "sale",                     rule: "timed", limit: 600, payout: 800, goalText: "Sell a farm", ruleText: "Within 10 minutes of starting it", reward: "×2 Scales from every sale", mastered: "×3" },
    { id: "silentPartner", name: "Silent Partner", goal: "sale",                 rule: "noSpend",    payout: 2000, goalText: "Sell a farm", ruleText: "No buying Goo upgrades or building levels", tip: "Starting levels from milestones and the Stall still count", reward: "Contract Mastery: the other contract rewards get stronger" },
    { id: "badMarket",  name: "Bad Market",    goal: "sale",                     rule: "badMarket",  payout: 0,    goalText: "Sell a farm", ruleText: "Every Stall item works against you, owned or not", reward: "Opens the Premium Shelf in the Stall" },
  ],
  // Achievements: kept forever. kind "life" = lifetime goal (stat >= target); "challenge" = do something
  // under a condition (nothing is blocked: set things up yourself). reward: buff (small multiplier), qol, or smart.
  achievements: [
    // Listed in the rough order players earn them (an unspoken guide, nothing is locked).
    // kind "life" = lifetime goal (stat >= target); "challenge" = do something under a condition.
    { id: "gooApprentice", kind: "life", stat: "renders",  target: 100,  name: "Goo Apprentice", goal: "Render 100 times (lifetime)", reward: "+5% Goo", buff: { goo: 1.05 } },
    { id: "bigRender",     kind: "life", stat: "bestGoo",  target: 1e6,  name: "Big Batch",      goal: "Earn 1M Goo from one Render", reward: "+5% Goo", buff: { goo: 1.05 } },
    { id: "noTier8",       kind: "challenge", name: "Short Stack",  goal: "Expand without buying any Tier 8 slimes in that Expand", reward: "+10% all slimes", buff: { slimes: 1.1 } },
    { id: "pureCoins",     kind: "challenge", name: "Bare Hands",   goal: "Render without buying any coin upgrades that run (needs 1e20 Tier 1)", reward: "+10% coin upgrade power", buff: { coinUps: 1.1 } },
    { id: "handsOff",      kind: "challenge", name: "Hands Off",    goal: "Expand with no automation running for that whole Expand", reward: "+10% Acres", buff: { acres: 1.1 } },
    { id: "landOwner",     kind: "life", stat: "expands",  target: 25,   name: "Land Owner",     goal: "Expand 25 times (lifetime)", reward: "+5% Acres", buff: { acres: 1.05 } },
    { id: "packedPens",    kind: "challenge", name: "Packed Pens",  goal: "Render with a full farm 10 times in one Expand", reward: "+10% Goo", buff: { goo: 1.1 } },
    { id: "growthSpurt",   kind: "life", stat: "growths",  target: 50,   name: "Growth Spurt",   goal: "Grow your farm 50 times (lifetime)", reward: "Auto-Expand gets the \"within N digits of your cap\" mode and Smart wait for full", smart: "capMode" },
    { id: "bigSpender",    kind: "life", stat: "gooLevels", target: 500, name: "Big Spender",    goal: "Buy 500 Goo upgrade levels (lifetime)", reward: "Star Goo upgrades in Automation (30% price edge)", smart: "gooStars" },
    { id: "builder",       kind: "life", stat: "buildLevels", target: 150, name: "Master Builder", goal: "Level buildings 150 times (lifetime)", reward: "Star buildings in Automation (30% price edge)", smart: "buildStars" },
    { id: "merchant",      kind: "life", stat: "sales",    target: 1,    name: "Merchant",       goal: "Sell a farm", reward: "+5% all slimes", buff: { slimes: 1.05 } },
    { id: "gooMaster",     kind: "life", stat: "renders",  target: 500,  name: "Goo Master",     goal: "Render 500 times (lifetime)", reward: "Offline time cap ×2", qol: "offline" },
    { id: "surveyor",      kind: "life", stat: "expands",  target: 100,  name: "Surveyor",       goal: "Expand 100 times (lifetime)", reward: "Offline time cap ×2", qol: "offline" },
    { id: "deepBreeder",   kind: "life", stat: "t8",       target: 1e50, name: "Deep Breeder",   goal: "Own 1e50 Tier 8 slimes at once", reward: "+10% all slimes", buff: { slimes: 1.1 } },
    { id: "trader",        kind: "life", stat: "sales",    target: 5,    name: "Trader",         goal: "Sell 5 farms", reward: "Offline time cap ×2", qol: "offline" },
    { id: "speedRender",   kind: "challenge", name: "Quick Draw",   goal: "Render within 1 second of a run starting", reward: "Auto-Render gets Auto-adjust and Rising target modes, plus the fill pause", smart: "renderModes" },
    { id: "contractor",    kind: "life", stat: "contracts", target: 3,   name: "Contractor",     goal: "Finish 3 Contracts", reward: "+10% Goo", buff: { goo: 1.1 } },
    { id: "fastFarm",      kind: "challenge", name: "Flipper",      goal: "Sell a farm within 90 minutes of starting it", reward: "+10% Scales from every sale", buff: { scales: 1.1 } },
    { id: "lightningSale", kind: "challenge", name: "Lightning Sale", goal: "Sell a farm within 5 minutes of starting it", reward: "+10% Scales from every sale", buff: { scales: 1.1 } },
    { id: "dealMaker",     kind: "life", stat: "merchants", target: 10, name: "Deal Maker",     goal: "Sign 10 merchants in Trade Deals", reward: "+5% Scales from every sale", buff: { scales: 1.05 } },
    { id: "scaleHoarder",  kind: "life", stat: "scalesEarned", target: 10000, name: "Scale Hoarder", goal: "Earn 10,000 Scales (lifetime)", reward: "Offline time cap ×1.5", qol: "offlineHalf" },
    { id: "shopFriend",    kind: "life", stat: "stallItems", target: 7, name: "Shopkeeper's Friend", goal: "Own every Market Stall item", reward: "+10% Acres", buff: { acres: 1.1 } },
    { id: "contractMaster", kind: "life", stat: "contracts", target: 8, name: "Contract Master", goal: "Finish all 8 Contracts", reward: "+25% Scales from every sale", buff: { scales: 1.25 } },
    { id: "fullShelf",     kind: "life", stat: "premiumItems", target: 3, name: "Full Shelf", goal: "Own every Premium Shelf item", reward: "+10% Goo", buff: { goo: 1.1 } },
  ],
  // Premium Shelf (opened by the Bad Market contract): big one-time buys
  premium: [
    { id: "surveyTeam", name: "Survey Team", desc: "New farms start grown 10 more times", cost: 5000 },
    { id: "deepVats",   name: "Deep Vats",   desc: "×5 Goo from every Render", cost: 8000 },
    { id: "goldenPens", name: "Golden Pens", desc: "All slimes ×10", cost: 12000 },
  ],
  // Building level cap: base + perGrowth × (times your farm has grown from a full Expand)
  buildingCap: { base: 0, perGrowth: 1 },
  // Buildings: placing one on a plot is free and permanent, and starts it at level 1.
  // Leveling up costs Goo; levels are kept through Expand. baseCost = Goo price of going from level 1 to 2.
  // Buildings: placing one is free and permanent (level 1). Levels cost Acres:
  // baseCost for level 2, then costStep more Acres for each level after that. No level cap.
  buildings: [
    { id: "gooVat",   name: "Goo Vat",   desc: "Goo from Render ×1.1 per level",            baseCost: 1, costStep: 1, stepEvery: 10, effect: 1.1 },
    // Nursery: placing it gives no bonus yet; every level after that is ×6 on every slime tier
    { id: "nursery",  name: "Nursery",   desc: "All slime tiers ×2 per level",           baseCost: 1, costStep: 1, stepEvery: 10, effect: 2 },
    { id: "feedMill", name: "Feed Mill", desc: "Goo upgrade prices ×0.9 per level (max 10)", baseCost: 2, costStep: 2, effect: 0.9, maxLevel: 10 },
    // Hidden until your coins first reach the cap
    { id: "silo",     name: "Coin Silo", desc: "Coin cap ×1e10 per level",                  baseCost: 10, costStep: 1, stepEvery: 10, effect: 1e10, hidden: true },
  ],

  // Rewards for total number of Renders. type "auto" = auto-buy for a tier, "tier" = unlocks a tier.
  // tier: 0 = Tier 1, 1 = Tier 2, ...
  // Render milestones: autobuyers for each tier, plus a few bonuses that speed up the early Renders
  renderMilestones: [
    { renders: 1,  type: "auto", tier: 0 },
    { renders: 2,  type: "bonus", id: "t1Coins",   text: "Tier 1 coins ×2" },
    { renders: 3,  type: "auto", tier: 1 },
    { renders: 5,  type: "bonus", id: "moreGoo",   text: "+25% Goo from every Render" },
    { renders: 7,  type: "auto", tier: 2 },
    { renders: 10, type: "bonus", id: "cheaperSlimes", text: "Slime prices ×0.8" },
    { renders: 13, type: "auto", tier: 3 },
    { renders: 16, type: "bonus", id: "headStart", text: "Head Start: each new farm starts with coins (skips 30% of your last farm's climb)" },
    { renders: 20, type: "auto", tier: 4 },
    { renders: 25, type: "auto", tier: 5 },
    { renders: 30, type: "auto", tier: 6 },
    { renders: 35, type: "auto", tier: 7 },
    { renders: 40, type: "bonus", id: "autoRender", text: "Auto-Render (settings in the Automation tab)" },
  ],
  arWaitMult: 1.5,         // Auto-Render "best": after Goo/sec peaks, wait until the run is this many × the time to reach the peak (1.4 gets stuck at 10×)
  gooSeedShare: 0.2,        // Stall Goo Seed: extra starting levels = this share of each main Goo upgrade's best level
  headStartPower: 0.3,      // Head Start milestone: start with (last farm's coins) ^ 0.3

  // Coin upgrades (reset on Render).
  // baseCost: price of level 1, costGrowth: price multiplier per level,
  // effect: strength per level, maxLevel: null = no cap
  upgrades: [
    { id: "richGoo",   name: "Shiny Coins",      short: "T1 coins", desc: "Tier 1 coins ×1.5 per level", baseCost: 500,  costGrowth: 20, effect: 1.5,  maxLevel: null },
    { id: "digestion", name: "Fast Digestion",   short: "All tiers", desc: "All tiers ×1.1 per level",   baseCost: 2000, costGrowth: 15, effect: 1.1,  maxLevel: null },
    { id: "bargain",   name: "Bargain Pens",     short: "Prices", desc: "Slime prices ×0.9 per level",baseCost: 5000, costGrowth: 10, effect: 0.9,  maxLevel: 5 },
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
    paidPlots: 0,                               // plots bought with Acres (up to 3)
    autoGooOn: true,                            // on/off switch for auto-buying Goo upgrades
    buildingLevels: Object.fromEntries(SETTINGS.buildings.map(b => [b.id, 0])),
    autoRender: { on: false, mode: "goo", value: 10, riseX: 1.2, lastGain: 0, pauseOn: false, pausePct: 80 },   // starts OFF: Auto-Render arrives before the first Expand and would keep resetting the farm   // mode "goo": when gain ≥ value, "time": after value seconds
    totalEssence: new Decimal(0),
    autobuy: SETTINGS.tiers.map(() => true),   // on/off switch per tier (only works once unlocked)
    autoModes: SETTINGS.tiers.map(() => "ms"), // what each autobuyer buys: "ms" (full chunk to next milestone) or "max"
    buyModes: SETTINGS.tiers.map(() => "1"),   // what the Buy button on each slime row does: "1", "ms", or "max"
    buyMode: "1",                              // the Slimes switch: what Buy does on rows without a running autobuyer
    expandRevealed: false,                     // Expand button shows once Tier 1 first reaches 1e50 (or you've Expanded)
    autoSeen: [],                              // automations you've looked at (a dot marks new ones)
    autoUpgrades: true,                        // on/off switch for Upgrade Helper
    automationOn: true,                        // master switch: OFF pauses all automation
    prefs: { confirmRender: true, confirmExpand: true, openAfterRender: false, confirmPlace: true, offline: true, fastTest: false, confirmSell: true, allNames: false },
    stats: newStats(),
    siloUnlocked: false,                       // Coin Silo appears once coins first reach the cap
    // The Market (kept through Sell the Farm)
    scales: new Decimal(0),
    totalScales: new Decimal(0),
    sales: 0,
    stall: {},                                 // Market Stall one-time buys: { id: true }
    marketPath: [],                            // Upgrade Path nodes owned (ids)
    respecOpen: true,
    seenIntros: [],                            // one-time unlock cards already shown
    contract: null,                            // active contract id (one at a time)
    contractsDone: [],                         // finished contracts (rewards kept forever)
    contractBest: {},                          // best try on each contract (see contractProgressValue)
    maxExpandsEver: 0,                         // highest Expand count reached (Room to Grow keeps those milestones)
    bestRenderGoo: new Decimal(0),             // best single Render ever (Goo Seed)
    maxRendersEver: 0,                         // highest Render count reached
    achievements: [],                          // earned achievements (kept forever)
    achSeen: 0,                                // how many were earned when you last opened the tab (for the dot)
    lifetime: { renders: 0, expands: 0, growths: 0, gooLevels: 0, buildLevels: 0, sales: 0, bestGoo: { gooPower: 0, slimeGrowth: 0, deepGoo: 0 } },   // never reset
    expandFlags: { t8Bought: false, autoUsed: false, fullRenders: 0 },   // this Expand only (challenges)
    runFlags: { coinUpBought: false },         // this run (since last Render) only
    farm: { age: 0, autoUsed: false, gooBought: false, nonGrow: 0, growths: 0, expandsDone: 0, acresEarned: 0 },   // this farm only (for contracts)                          // free respec until the first Render of a farm
    autoExpandOn: true,
    autoAcres: { on: true, value: 10, mode: "acres", waitFull: false, smartWait: false, smartSecs: 60 },   // smartWait: wait for full only if it fills within smartSecs   // mode "acres": gain ≥ value; "cap": within value digits of the farm cap
    autoBuildOn: true,
    autoSellOn: false,   // Sale milestone 15 (starts OFF so you can pick contracts and deals first)
    gooStars: [],                              // Goo upgrades starred for Goo Steward
    buildStars: [],                            // buildings starred for Estate Keeper   // Land Agent: Expand once an Expand would give at least `value` Acres
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
  if (g.autoRender) g.autoRender.lastGain = 0;   // Rising target starts over every Expand and sale
  g.essence = new Decimal(0);
  g.lastFarmCoins = new Decimal(0);   // Head Start's "last farm" (cleared on Expand)
  g.savingForExpand = false;
  g.expandRenders = 0;                // Renders this Expand (Compost counts these)          // auto-buy saves Goo for the Expand cost once the farm has been full
  g.essUpgrades = Object.fromEntries(SETTINGS.essenceUpgrades.map(u => [u.id, 0]));
  // Expand milestone 1: every Goo upgrade starts at level 1
  if (has("gooStarter")) SETTINGS.essenceUpgrades.forEach(u => { g.essUpgrades[u.id] = 1; });
  if (!has("keepRenderMs") && !contractDone("handRaised", g)) g.renders = 0;   // Hand-Raised keeps them for good
  if (has("gooStart")) { g.essUpgrades.gooPower = Math.max(5, g.essUpgrades.gooPower); g.essUpgrades.slimeGrowth = Math.max(5, g.essUpgrades.slimeGrowth); }
  applyGooSeed(g);
  resetRun(g);
}
// Farm fill rate (Tier 1 digits per second, last ~15s of farm time) for Auto-Expand's smart wait
let fillSamples = [];
function trackFillRate() {
  const t = game.farm.age, d = tier1Digits().toNumber();
  const last = fillSamples[fillSamples.length - 1];
  if (last && (d < last.d - 1e-9 || t < last.t)) fillSamples = [];   // Render, Expand, or new farm: start over
  const prev = fillSamples[fillSamples.length - 1];
  if (!prev || t - prev.t >= 1) fillSamples.push({ t, d });
  while (fillSamples.length > 2 && t - fillSamples[0].t > 15) fillSamples.shift();
}
function fillRateReady() {   // at least 3s of samples before predicting
  return fillSamples.length >= 2 && fillSamples[fillSamples.length - 1].t - fillSamples[0].t >= 3;
}
function fillRate() {
  if (fillSamples.length < 2) return 0;
  const a = fillSamples[0], b = fillSamples[fillSamples.length - 1];
  return b.t > a.t ? Math.max(0, (b.d - a.d) / (b.t - a.t)) : 0;
}
function fillEta() {   // seconds until the farm is full at the current pace (Infinity if not growing)
  const left = farmCapacity().log10().toNumber() - tier1Digits().toNumber();
  if (left <= 0) return 0;
  const rate = fillRate();
  return rate > 0 ? left / rate : Infinity;
}
// Stall Goo Seed: the main Goo upgrades get extra starting levels = 20% of their best-ever level (every Expand and farm)
const GOO_SEED_IDS = ["gooPower", "slimeGrowth", "deepGoo"];
function gooSeedLevel(id, g = game) {
  const best = (g.lifetime && g.lifetime.bestGoo && g.lifetime.bestGoo[id]) || 0;
  return Math.floor(best * SETTINGS.gooSeedShare);
}
function applyGooSeed(g) {
  if (!hasStall("gooSeed", g)) return;
  GOO_SEED_IDS.forEach(id => { g.essUpgrades[id] = (g.essUpgrades[id] || 0) + gooSeedLevel(id, g); });   // stacks on milestone starts; real levels, so prices rise too
}
function noteBestGoo(id, g = game) {
  if (!GOO_SEED_IDS.includes(id)) return;
  if (!g.lifetime.bestGoo) g.lifetime.bestGoo = { gooPower: 0, slimeGrowth: 0, deepGoo: 0 };
  g.lifetime.bestGoo[id] = Math.max(g.lifetime.bestGoo[id] || 0, g.essUpgrades[id] || 0);
}
// Everything that Render wipes
function resetRun(g) {
  arPeak = 0; arPeakAt = 0;   // every Render/Expand/sale starts a fresh Goo/sec peak
  g.coins = startingCoins(g);
  g.runCoins = new Decimal(0);   // total coins earned this run (spending doesn't lower it)
  g.tiers = SETTINGS.tiers.map((t, i) => ({
    owned: new Decimal(i === 0 ? SETTINGS.startingSlimes : 0),
    bought: new Decimal(0),
  }));
  g.upgrades = Object.fromEntries(SETTINGS.upgrades.map(u => [u.id, 0]));
  g.runTime = 0;                 // seconds spent in this run (for Auto-Render timing)
  g.runFlags = { coinUpBought: false };
}
function startingCoins(g) {
  const m = SETTINGS.renderMilestones.find(x => x.id === "headStart");
  const on = (g.renders || 0) >= m.renders;
  return on ? headStartFrom(g.lastFarmCoins || new Decimal(0)) : new Decimal(0);
}
// Head Start coins from a farm that earned `farmCoins`
function headStartFrom(farmCoins) {
  if (farmCoins.lte(1)) return new Decimal(0);
  return farmCoins.pow(SETTINGS.headStartPower).floor();
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
  if (group < (game.prefs.allNames ? SUFFIXES.length : 5)) {
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
function upgradeEffectRaw(id) {
  return new Decimal(upgradeDef(id).effect).pow(upgradeLevel(id));
}
// Bare Hands achievement: coin upgrades that boost production get +10%
function upgradeEffect(id) {
  const raw = upgradeEffectRaw(id);
  return upgradeDef(id).effect > 1 && upgradeLevel(id) > 0 ? raw.mul(achBuff("coinUps")) : raw;
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
  game.runFlags.coinUpBought = true;
  render();
}

// ===== Essence upgrades =====
function essDef(id) { return SETTINGS.essenceUpgrades.find(u => u.id === id); }
function essLevel(id) { return game.essUpgrades[id] || 0; }
// Goo upgrade levels that count right now (Raw Slime contract: Goo upgrades have no effect, free levels included)
function essPower(id) { return contractRule("noGoo") ? 0 : essLevel(id); }
function essEffect(id) { return new Decimal(essDef(id).effect).pow(essPower(id)); }
function essCost(id) {
  const u = essDef(id);
  const lvl = essLevel(id);
  const mill = buildingEffect("feedMill");   // Feed Mill: cheaper Goo upgrades
  const bad = badPenalty("gooSeed") ? 2 : 1;
  if (u.maxLevel !== null) return new Decimal(u.costGrowth).pow(lvl).mul(u.baseCost).mul(mill).mul(bad).round().max(1);
  // Multiply each level's growth: plain growth below startLevel, then stepped up every few levels
  const st = SETTINGS.gooSteps;
  let cost = new Decimal(u.baseCost).mul(new Decimal(u.costGrowth).pow(Math.min(lvl, st.startLevel)));
  for (let from = st.startLevel, k = 1; from < lvl; from += st.every, k++) {
    const n = Math.min(st.every, lvl - from);
    cost = cost.mul(new Decimal(u.costGrowth + st.step * k).pow(n));
  }
  return cost.mul(mill).mul(bad).round().max(1);
}
function essMaxed(id) {
  const u = essDef(id);
  return u.maxLevel !== null && essLevel(id) >= u.maxLevel;
}
function buyEssUpgrade(id) {
  if (essMaxed(id) || contractRule("noGoo") || contractRule("noSpend")) return;   // Raw Slime / Silent Partner: no Goo upgrades
  game.farm.gooBought = true;
  const cost = essCost(id);
  if (game.essence.lt(cost)) return;
  game.essence = game.essence.sub(cost);
  levelUpEss(id);
  render();
}
// Raise a Goo upgrade by 1 (a new Head Start level applies from your next farm)
function levelUpEss(id) {
  game.essUpgrades[id] = essLevel(id) + 1;
  game.lifetime.gooLevels += 1;
  noteBestGoo(id);
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
  return new Decimal(SETTINGS.coinCap).mul(buildingEffect("silo")).mul(hasNode("deepPockets") ? 1e20 : 1).div(badPenalty("siloSpill") ? 1e20 : 1);
}
function buildingOwned(id) { return buildingPlaced(id); }
// Every building sits on the Estate at level 0; it counts as built from level 1
function buildingPlaced(id) { return buildingLevel(id) >= 1 && buildingAvailable(buildingDef(id)); }
function buildingLevel(id) { return game.buildingLevels[id] || 0; }
// Effect only counts while the building is placed on a plot
function buildingEffect(id) {
  if (!buildingPlaced(id)) return new Decimal(1);
  const b = buildingDef(id);
  const eff = id === "gooVat" && hasNode("goldenVats") ? 1.15 : b.effect;
  return new Decimal(eff).pow(Math.max(0, buildingLevel(id) - (b.firstLevelFree ? 1 : 0)));
}
// Acres to go from the current level to the next
// stepEvery (Nursery): the price rise itself grows by 1 every stepEvery levels (+1 per level up to 10, then +2, then +3...)
function buildingCost(id) {
  const base = buildingCostBase(id);
  const b2 = badPenalty("acrePurse") ? base.mul(1.25).ceil() : base;
  return hasNode("cheapLand") ? b2.mul(0.75).ceil().max(1) : b2;
}
function buildingCostBase(id) {
  const b = buildingDef(id);
  // Building from level 0: your 1st, 2nd, 3rd building costs 1, 3, 5 Acres (the Coin Silo uses its own price)
  if (buildingLevel(id) === 0 && !b.hidden) {
    const built = SETTINGS.buildings.filter(x => !x.hidden && buildingLevel(x.id) >= 1).length;
    return new Decimal(SETTINGS.plotCosts[Math.min(built, SETTINGS.plotCosts.length - 1)]);
  }
  const lvl = Math.max(1, buildingLevel(id));
  if (!b.stepEvery) return new Decimal(b.baseCost + b.costStep * (lvl - 1));
  let cost = b.baseCost;
  for (let k = 1; k < lvl; k++) cost += b.costStep + Math.floor((k - 1) / b.stepEvery);
  return new Decimal(cost);
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
  if (contractRule("bld10") && buildingLevel(id) >= 10) return;   // Frugal Farmer: no building past level 10
  if (contractRule("noSpend")) return;                             // Silent Partner: no building levels
  const cost = buildingCost(id);
  if (buildingAtCap(id) || game.acres.lt(cost)) return;
  game.acres = game.acres.sub(cost);
  game.farm.bldBought = true;
  game.buildingLevels[id] = buildingLevel(id) + 1;
  game.lifetime.buildLevels += 1;
  syncPlots();
  render();
}
// Plots open on their own (first Expand, then farm growths). Plots you already have are never taken away.
// Plots: the first three are bought with Acres; the Coin Silo's plot opens free at the coin cap
function paidPlots() { return game.paidPlots || 0; }
function plotCost() { return new Decimal(SETTINGS.plotCosts[paidPlots()] ?? Infinity); }
function buyPlot() {
  if (paidPlots() >= SETTINGS.plotCosts.length) return;
  const cost = plotCost();
  if (game.acres.lt(cost)) return;
  game.acres = game.acres.sub(cost);
  game.paidPlots = paidPlots() + 1;
  syncPlots();
  render();
}
// Plots are gone: every building shows at level 0. game.plots now just lists built buildings (for stats and saves).
function syncPlots() {
  // Sale milestone: start with the three main buildings built (level 1)
  game.plots = SETTINGS.buildings.filter(b => buildingPlaced(b.id)).map(b => b.id);
  return false;
}
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
  return g.expands >= m.expands || expandMsKeptBySale(m, g);
}
// Sale milestones hand out some Expand milestones from the start of every farm
function expandMsKeptBySale(m, g = game) {
  // Room to Grow contract: Expand milestones you've reached before are kept; Seasoned Hands (Path) gives them all
  return (contractDone("roomToGrow", g) && (g.maxExpandsEver || 0) >= m.expands) ;
}
function expandMsDone(m) { return game.expands >= m.expands || expandMsKeptBySale(m); }
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
  return new Decimal(Infinity);   // no Expand Goo cost anymore, so auto-buy can spend freely
}
function expandGooMet() {
  return game.essence.gte(expandGooCost());
}
// The Goo cost only applies to an Expand that grows the farm; a non-growing Expand (farm not full)
// just needs the Tier 1 goal and gives Acres
// Expanding only needs the Tier 1 goal (a full farm also grows). The Goo cost was removed.
function expandUnlocked() {
  // Room to Grow: every Expand must grow the farm, so only a full farm can Expand
  if (contractRule("growOnly") && !farmFull()) return false;
  return slimesReadyForExpand();
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
  return past.div(SETTINGS.acres.digitsPerAcre).floor().add(1).max(1).mul(pathAcreMult())
    .mul(farmFull() ? SETTINGS.fullFarmBonus : 1).floor();
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
  const growNote = expandWillGrow() ? "Your farm will grow ×" + nextGrowthText() + ".\n\n" : "Your farm isn't full, so it won't grow this time. You still get Acres.\n\n";
  askConfirm("confirmExpand", "Expand for " + formatWhole(acreGain()) + " Acre" + (acreGain().eq(1) ? "" : "s") + "?\n",
    growNote + "You'll start fresh: coins, slimes, coin upgrades, Goo, Goo upgrades, and Render milestones reset (milestones can keep some of these).", finishExpand);
}
function finishExpand(auto = false) {
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
  game.maxExpandsEver = Math.max(game.maxExpandsEver || 0, game.expands);
  // Achievements: lifetime Expands/growths and Expand challenges, then a fresh slate for the next Expand
  game.lifetime.expands += 1;
  if (grew) game.lifetime.growths += 1;
  if (!game.expandFlags.t8Bought) earnAch("noTier8");
  if (!game.expandFlags.autoUsed) earnAch("handsOff");
  game.expandFlags = { t8Bought: false, autoUsed: false, fullRenders: 0 };
  game.farm.expandsDone += 1;
  game.farm.acresEarned = (game.farm.acresEarned || 0) + gain.toNumber();
  if (grew) game.farm.growths += 1; else game.farm.nonGrow += 1;
  tally.expands += 1;
  tally.acres = tally.acres.add(gain);
  if (grew) game.farmGrowths += 1;
  resetExpand(game);
  if (grew) toast("Your farm grew! Slimes can now reach " + formatWhole(farmCapacity()), true);
  if (syncPlots()) toast("A new building plot opened in your Estate", true);
  SETTINGS.expandMilestones.filter(m => m.expands === game.expands && !expandMsKeptBySale(m))
    .forEach(m => toast("Expand milestone: " + m.text, true));
  save();
  render();
  if (!auto) toast("Expanded for +" + formatWhole(gain) + " Acres");
}

// ===== The Market: Sell the Farm =====
// Auto-Render comes from Expand milestone 1 (or the first sale milestone)
function hasAutoRender() {
  return renderBonus("autoRender");
}
// ----- Market Stall and Upgrade Path -----
function ownsStall(id, g = game) { return !!(g.stall && g.stall[id]); }
// Bad Market contract: regular Stall items stop helping and every one (owned or not) gives its penalty instead
function badMarket(g = game) { const c = g.contract && SETTINGS.contracts.find(x => x.id === g.contract); return !!c && c.rule === "badMarket"; }
function hasStall(id, g = game) { return ownsStall(id, g) && !(badMarket(g) && !isPremium(id)); }
function badPenalty(id) { return badMarket(); }   // every item's penalty applies, bought or not
function hasNode(id, g = game) { return !!(g.marketPath && g.marketPath.includes(id)); }
function stallDef(id) { return SETTINGS.stall.find(u => u.id === id) || SETTINGS.premium.find(u => u.id === id); }
function isPremium(id) { return SETTINGS.premium.some(u => u.id === id); }
function nodeRow(id) { return SETTINGS.marketPath.findIndex(r => r.nodes.some(n => n.id === id)); }
function nodeDef(id) { const r = SETTINGS.marketPath[nodeRow(id)]; return r && r.nodes.find(n => n.id === id); }
function rowSoon(r) { return r.nodes.every(n => n.soon); }
function rowPicks(i) { return SETTINGS.marketPath[i].nodes.filter(n => hasNode(n.id)).length; }
// A row is open when every earlier row (that isn't all "coming soon") has at least one pick
function rowOpen(i) {
  for (let k = 0; k < i; k++) if (!rowSoon(SETTINGS.marketPath[k]) && rowPicks(k) === 0) return false;
  return true;
}
function rowFull(i) { return !saleMilestoneReached("allInRow") && rowPicks(i) >= 1; }
function canBuyNode(id) {
  const i = nodeRow(id), n = nodeDef(id);
  return !n.soon && !hasNode(id) && rowOpen(i) && !rowFull(i) && game.scales.gte(SETTINGS.marketPath[i].cost);
}
function buyNode(id) {
  if (!canBuyNode(id)) return;
  game.scales = game.scales.sub(SETTINGS.marketPath[nodeRow(id)].cost);
  game.marketPath.push(id);
  syncPlots();
  render();
}
function canBuyStall(id) {
  const u = stallDef(id);
  if (isPremium(id) && !contractDone("badMarket")) return false;
  return !u.soon && !ownsStall(id) && game.scales.gte(u.cost);
}
function buyStall(id) {
  if (!canBuyStall(id)) return;
  game.scales = game.scales.sub(stallDef(id).cost);
  game.stall[id] = true;
  // Bought before the first Render of a farm: start-of-farm items count for this farm too
  if (game.respecOpen) applyFarmStartItem(id);
  render();
}
function pathSpent() {
  return game.marketPath.reduce((sum, id) => sum + (nodeRow(id) >= 0 ? SETTINGS.marketPath[nodeRow(id)].cost : 0), 0);
}
function applyFarmStartItem(id) {
  const bumpBuildings = n => SETTINGS.buildings.forEach(b => {
    if (b.hidden || n <= 0) return;
    let lvl = buildingLevel(b.id) + n;
    if (b.maxLevel !== undefined) lvl = Math.min(lvl, b.maxLevel);
    if (contractRule("bld10")) lvl = Math.min(lvl, 10);
    game.buildingLevels[b.id] = Math.max(buildingLevel(b.id), lvl);
  });
  let msg = "";
  if (id === "gooSeed") { applyGooSeed(game); msg = "Goo upgrades " + GOO_SEED_IDS.map(i => essLevel(i)).join(" / "); }
  if (id === "acrePurse") { noteFarmAcres(); const a = acrePurseAmount(); game.acres = game.acres.add(a); if (a > 0) msg = "+" + formatWhole(a) + " Acres"; }
  if (id === "barnRaising") { const n = Math.floor(game.sales / 2); bumpBuildings(n); if (n > 0) msg = "buildings +" + n + " levels"; }
  if (id === "ledger") { const n = game.contractsDone.length; bumpBuildings(n); if (n > 0) msg = "buildings +" + n + " levels"; }
  syncPlots();
  if (msg) toast(stallDef(id).name + " applies to this farm too: " + msg, true);
}
// Free respec: refunds every Path upgrade. Open at the start of each farm (until the first Render).
function respecPath() {
  if (!game.marketPath.length) return;
  if (game.respecOpen) {
    if (!confirm("Respec your Trade Deals now?\n\nAll " + pathSpent() + " Scales spent on deals come back, and you can sign again.")) return;
    game.scales = game.scales.add(pathSpent());
    game.marketPath = [];
  } else {
    game.respecQueued = !game.respecQueued;   // tap again to cancel
    toast(game.respecQueued ? "Your Trade Deals will reset at your next sale, with every Scale refunded" : "Deals respec cancelled");
  }
  render();
}
function veteranBonus() {
  if (!hasNode("veteranBreeder")) return new Decimal(1);
  return new Decimal(1 + (hasNode("breederII") ? 2 : 1) * game.sales);
}
function pathGooMult() {
  return new Decimal(hasNode("gooBuyers") ? 3 : 1).mul(hasNode("goldenGoo") ? 1 + game.sales : 1);
}
function pathAcreMult() {
  return new Decimal(hasNode("landDeals") ? 2 : 1).mul(hasNode("landBaron") ? 1 + 0.25 * game.sales : 1).mul(contractMult("frugal", 1.5, 2)).mul(achBuff("acres"))
    .mul(hasStall("fertileSoil") ? 1.2 : 1).mul(badPenalty("fertileSoil") ? 0.8 : 1)
    .mul(hasStall("siloSpill") && coinsAtLimit() ? 1 + 0.1 * buildingLevel("silo") : 1);
}
function saleMilestoneReached(id, g = game) {
  const m = SETTINGS.saleMilestones.find(m => m.id === id);
  return !!m && (g.sales || 0) >= m.sales;
}
// The farm is at its max size and full: it can be sold
function saleReady() {
  return atTrueCap() && game.tiers[0].owned.gte(farmCapacity());
}
function stallOwnedCount() {
  return SETTINGS.stall.concat(SETTINGS.premium).filter(u => ownsStall(u.id)).length;
}
function scalesForSale() {
  // Base: 1, +1 for every finished contract. Grows with the Market: ×1.3 per merchant signed, ×1.2 per Stall item
  return new Decimal(SETTINGS.scalesPerSale + game.contractsDone.length)
    .mul(Decimal.pow(SETTINGS.scaleDealMult, game.marketPath.length)).mul(Decimal.pow(SETTINGS.scaleStallMult, stallOwnedCount()))
    .mul(hasNode("betterBroker") ? 2 : 1).mul(hasNode("topBroker") ? 2 : 1).mul(contractMult("quickFlip", 2, 3)).mul(achBuff("scales"))
    .mul(saleMilestoneReached("doubleScales") ? 2 : 1).floor();
}
function doSell() {
  if (!saleReady()) return;
  const gain = scalesForSale();
  askConfirm("confirmSell", "Sell the Farm for " + formatWhole(gain) + " Scale" + (gain.eq(1) ? "" : "s") + "?",
    "Everything on the farm resets: coins, slimes, Goo, Acres, Expands, buildings, and all their upgrades and milestones.\n\nYou keep your Scales, Stall upgrades, Trade Deals, Contracts, and sale milestones. Render and Expand milestones reset unless a Contract keeps them.", finishSell);
}
function finishSell() {
  if (!saleReady()) return;
  // Sale contracts finish (or fail) as you sell
  const sc = activeContract();
  const ctAtSale = sc ? sc.name : "";
  if (sc && sc.goal === "sale") { if (contractConditionsMet(sc)) completeContract(sc); else failContract(sc, "rule broken"); }
  const gain = scalesForSale();
  const st = game.stats;
  st.saleLog.push({ n: game.sales + 1, at: Math.round(st.playTime), took: Math.round(st.playTime - st.saleStart), expands: game.expands, scales: gain.toNumber(),
    growths: game.farmGrowths, renders: st.renders - (st.rendersAtSale || 0), acres: Math.round(game.farm.acresEarned || 0), contract: ctAtSale,
    real: Math.round((st.realTime || 0) - (st.realAtSale || 0)) });
  st.rendersAtSale = st.renders; st.realAtSale = st.realTime || 0;
  if (st.firstSale === null) st.firstSale = Math.round(st.playTime);
  st.saleStart = st.expandStart = st.runStart = st.playTime;
  st.rendersThisExpand = 0;
  const first = game.sales === 0;
  // A queued respec happens as you sell: Scales come back so you can re-pick for the new farm
  if (game.respecQueued) { game.scales = game.scales.add(pathSpent()); game.marketPath = []; game.respecQueued = false; }
  const keepPlots = hasStall("blueprints") ? SETTINGS.buildings.filter(b => !b.hidden && buildingPlaced(b.id)).map(b => b.id) : null;
  game.lifetime.sales += 1;
  if (game.farm.age <= 5400) earnAch("fastFarm");
  if (game.farm.age <= 300) earnAch("lightningSale");
  noteFarmAcres();
  const keep = Object.assign(farmKeep(), { scales: game.scales.add(gain), totalScales: game.totalScales.add(gain), sales: game.sales + 1 });
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
  const grown = (hasNode("surveyed") ? 5 : 0) + (hasStall("surveyTeam") ? 10 : 0);
  game.farmGrowths = grown;
  game.expands = grown;
  if (keepPlots) keepPlots.forEach(id => { game.buildingLevels[id] = 1; });
  // Sale milestone: the three main buildings start at level 5
  if (saleMilestoneReached("buildingsStart")) SETTINGS.buildings.forEach(b => { if (!b.hidden) game.buildingLevels[b.id] = Math.max(5, buildingLevel(b.id)); });
  const extra = (hasStall("barnRaising") ? Math.floor(game.sales / 2) : 0) + (hasStall("ledger") ? game.contractsDone.length : 0);
  SETTINGS.buildings.forEach(b => {
    if (b.hidden) return;
    let lvl = buildingLevel(b.id) + extra;
    if (b.maxLevel !== undefined) lvl = Math.min(lvl, b.maxLevel);
    if (contractRule("bld10")) lvl = Math.min(lvl, 10);   // Frugal Farmer: never start past level 10
    game.buildingLevels[b.id] = lvl;
  });
  syncPlots();
  resetExpand(game);   // applies Expand milestones from the sale milestones
  if (badMarket()) game.farm.badStart = true;
  game.contractStart = { expandsDone: 0, growths: 0 };
  const purse = acrePurseAmount();
  if (purse > 0) { game.acres = game.acres.add(purse); toast("Acre Purse: this farm starts with " + formatWhole(purse) + " Acres"); }
}
// Testing only: jump to a full farm at max size so Sell the Farm can be tried right away
function loadTestSave() {
  if (!confirm("Load a test farm that's ready to sell?\n\nThis replaces your current farm progress (Scales and Market upgrades are kept).")) return;
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
function milestoneReached(m) { return game.renders >= m.renders; }
function unlockedTierCount() {
  const extra = SETTINGS.renderMilestones.filter(m => m.type === "tier" && milestoneReached(m)).length;
  return Math.min(SETTINGS.tiers.length, SETTINGS.unlockedTiers + extra);
}
function autoUnlocked(i) {
  return SETTINGS.renderMilestones.some(m => m.type === "auto" && m.tier === i && milestoneReached(m));
}
function milestoneText(m) {
  return m.type === "auto" ? "Auto-buy Tier " + (m.tier + 1) : m.text;
}
// A Render milestone bonus you've reached (by id)
function renderBonus(id) {
  const m = SETTINGS.renderMilestones.find(x => x.id === id);
  return !!m && milestoneReached(m);
}

// ===== Render =====
// Compost (Expand milestone): Render goal ×0.1 for every Expand done, up to 10
function renderGoalValue() {
  return new Decimal(SETTINGS.renderGoal);   // Compost was removed: the Render goal is always the same
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
  return buildingEffect("gooVat").mul(pathGooMult()).mul(expandMilestoneReached("gooPerExpand") ? 1 + 0.1 * game.farmGrowths : 1).mul(renderBonus("moreGoo") ? 1.25 : 1)
    .mul(saleMilestoneReached("gooDouble") ? 2 : 1).mul(contractMult("rawSlime", 2, 3)).mul(hasStall("deepVats") ? 5 : 1).mul(badPenalty("barnRaising") ? 0.5 : 1).mul(achBuff("goo"));
}
// Goo is based on Tier 1 slimes (same stat that unlocks Render and Expand)
function gooSlimes() {
  return game.tiers[0].owned.floor();
}
// How many Tier 1 slimes you need for the next whole Goo (works the formula backwards)
function slimesForGoo(amount) {
  const e = SETTINGS.essence;
  // Base Goo is at least 1, so amounts up to the bonus only need the minimum slimes
  // Richer Render adds flat base Goo, so take it off before working back to slimes
  const base = new Decimal(amount).div(gooMultiplier()).ceil().sub(essPower("richerRender"));
  const digits = Decimal.max(1, base).pow(1 / e.power).mul(e.digitDivisor);
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
  const base = Decimal.max(1, gooSlimes().max(1).log10().div(e.digitDivisor).pow(e.power).floor()).add(essPower("richerRender"));
  const mult = gooMultiplier();
  const baseText = formatWhole(base);
  const full = "";
  if (mult.lte(1)) return "Base " + baseText + " Goo (no Goo bonuses yet) = " + formatWhole(essenceGain()) + " Goo" + full;
  return "Base " + baseText + " Goo × " + format(mult, 2) + " bonus = " + formatWhole(essenceGain()) + " Goo" + full;
}
function essenceGain() {
  if (!renderUnlocked()) return new Decimal(0);
  const e = SETTINGS.essence;
  const digits = gooSlimes().max(1).log10().div(e.digitDivisor);
  // Base is at least 1 BEFORE bonuses, so your Goo bonus always counts (even on small Renders)
  const base = Decimal.max(1, digits.pow(e.power).floor()).add(essPower("richerRender"));
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
  game.respecOpen = false;
  game.renders += 1;
  tally.renders += 1;
  if (game.renders > (game.maxRendersEver || 0)) game.maxRendersEver = game.renders;
  // Achievements: lifetime Renders and Render challenges (checked before the run resets)
  game.lifetime.renders += 1;
  if (game.runTime <= 1) earnAch("speedRender");
  if (!game.runFlags.coinUpBought && game.tiers[0].owned.gte(1e20)) earnAch("pureCoins");
  if (farmFull()) { game.expandFlags.fullRenders += 1; if (game.expandFlags.fullRenders >= 10) earnAch("packedPens"); }
  game.expandRenders = (game.expandRenders || 0) + 1;
  game.lastFarmCoins = game.runCoins;
  const st = game.stats;
  st.renders += 1;
  st.rendersThisExpand += 1;
  if (st.firstRender === null) st.firstRender = Math.round(st.playTime);
  if (gain.gt(st.bestGoo)) st.bestGoo = gain.toString();
  if (gain.gt(game.bestRenderGoo || 0)) game.bestRenderGoo = gain;   // kept forever (Goo Seed)
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
  if (catchingUp) return;
  const box = document.getElementById("toasts");
  // Routine messages replace each other; important ones (milestones, unlocks) stay longer and up to 3 at once
  if (!highlight) box.querySelectorAll(".toast:not(.highlight)").forEach(t => t.remove());
  else { const hl = box.querySelectorAll(".toast.highlight"); if (hl.length >= 3) hl[0].remove(); }
  const el = document.createElement("div");
  el.className = "toast" + (highlight ? " highlight" : "");
  el.textContent = text;
  box.appendChild(el);
  setTimeout(() => el.classList.add("hide"), highlight ? 7000 : 2500);
  setTimeout(() => el.remove(), highlight ? 7600 : 3100);
}

function tierCost(i, n = game.tiers[i].bought) {
  const t = SETTINGS.tiers[i];
  n = new Decimal(n);
  const blocks = n.div(25);
  const rise = new Decimal(SETTINGS.costRise).pow(blocks.mul(blocks));
  return new Decimal(t.costGrowth).pow(n).mul(t.baseCost).mul(rise)
    .mul(upgradeEffect("bargain")).mul(essEffect("cheapSlimes")).mul(renderBonus("cheaperSlimes") ? 0.8 : 1).mul(badPenalty("ledger") ? 10 : 1);
}
// Only whole slimes produce; a slime that is still "growing" makes nothing yet
function freeMilestones(i) { return hasStall("starterHerd") ? SETTINGS.tiers.length - i : badPenalty("starterHerd") ? -(SETTINGS.tiers.length - i) : 0; }   // Tier 1: 8 … Tier 8: 1 (Bad Market: lost instead)
function milestoneCount(i) {
  return game.tiers[i].bought.div(milestoneEveryValue()).floor().add(freeMilestones(i)).max(0);
}
function milestoneMultValue() {
  return saleMilestoneReached("strongMilestones") ? 1.25 : SETTINGS.milestoneMult;
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
  prod = prod.mul(upgradeEffect("digestion")).mul(buildingEffect("nursery")).mul(veteranBonus())
    .mul(i < 4 ? contractMult("smallPens", 3, 5) : 1).mul(hasStall("goldenPens") ? 10 : 1).mul(achBuff("slimes"));
  if (i === 0) prod = prod.mul(upgradeEffect("richGoo")).mul(renderBonus("t1Coins") ? 2 : 1);
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
  return i === 0 || game.tiers[i - 1].owned.gte(1);   // each tier appears once you own the one before it
}

// ===== Player actions =====
function buyTier(i) {
  const cost = tierCost(i);
  // Full tiers can't take more slimes (so milestones can't keep stacking past capacity)
  if (!tierVisible(i) || tierFull(i) || game.coins.lt(cost)) return false;
  if (i >= 4 && contractRule("lowTiers")) return false;   // Small Pens: Tiers 5–8 locked
  game.coins = game.coins.sub(cost);
  game.tiers[i].owned = game.tiers[i].owned.add(1);
  game.tiers[i].bought = game.tiers[i].bought.add(1);
  if (i === 7) game.expandFlags.t8Bought = true;
  if (i >= 4) game.farm.highTiers = true;
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
  return autoActive() && autoUnlocked(i) && !!game.autobuy[i];
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
  if (catchingUp) return;          // offline catch-up is running in batches
  const now = Date.now();
  let seconds = Math.max(0, (now - game.lastTick) / 1000);
  game.lastTick = now;
  // Long gaps (closed, backgrounded, or asleep) are offline time: simulated in small steps so
  // automation keeps working. With offline progress OFF, that time is skipped.
  if (seconds > 5) {
    if (game.prefs.offline) { game.stats.offlineTime += seconds; startCatchUp(Math.min(seconds, offlineCapHours() * 3600)); }
    return;
  } else if (document.hidden) {
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
// ===== Contracts =====
function contractDef(id) { return SETTINGS.contracts.find(c => c.id === id); }
function activeContract() { return game.contract ? contractDef(game.contract) : null; }
function contractRule(rule) { const c = activeContract(); return !!c && c.rule === rule; }
function contractDone(id, g = game) { return !!(g.contractsDone && g.contractsDone.includes(id)); }
// A contract's reward multiplier: normal once done, stronger with Contract Mastery (Silent Partner)
function contractMult(id, normal, mastered) { return contractDone(id) ? (contractDone("silentPartner") ? mastered : normal) : 1; }
function contractsUnlocked() { return saleMilestoneReached("contracts"); }
// Has this farm kept to the contract's rule so far?
// Progress counts from when the contract was taken (not from the start of the farm)
function contractBase(key) { return (game.contractStart && game.contractStart[key]) || 0; }
function contractConditionsMet(c) {
  const f = game.farm;
  switch (c.rule) {
    case "noAuto": return !f.autoUsed;
    case "growOnly": return f.nonGrow === 0;
    case "lowTiers": return !f.highTiers && game.tiers.slice(4).every(t => t.bought.lte(0) && t.owned.lt(1));   // none bought all farm
    case "noGoo": return !f.gooBought;
    case "bld10": return SETTINGS.buildings.every(b => buildingLevel(b.id) <= 10);
    case "timed": return f.age < c.limit;
    case "maxExpands": return f.expandsDone <= c.limit;
    case "noSpend": return !f.gooBought && !f.bldBought;
    case "badMarket": return !!f.badStart;   // must start the farm under Bad Market (no Stall head start)
  }
  return true;
}
function contractGoalMet(c) {
  const f = game.farm;
  switch (c.goal) {
    case "expands": return f.expandsDone - contractBase("expandsDone") >= c.target;
    case "t1": return game.tiers[0].owned.gte(c.target);
    case "coins": return game.coins.gte(c.target);
    case "growths": return f.growths - contractBase("growths") >= c.target;
  }
  return false;   // "sale" goals finish when you sell
}
function contractProgressText(c) {
  const f = game.farm;
  switch (c.goal) {
    case "expands": return (f.expandsDone - contractBase("expandsDone")) + " / " + c.target + " Expands";
    case "t1": return formatWhole(game.tiers[0].owned) + " / " + formatWhole(new Decimal(c.target)) + " Tier 1";
    case "coins": return formatWhole(game.coins) + " / " + formatWhole(new Decimal(c.target)) + " coins";
    case "growths": return (f.growths - contractBase("growths")) + " / " + c.target + " growths";
    case "sale": return c.rule === "timed" ? formatTime(f.age) + " of " + formatTime(c.limit) + " used"
      : c.rule === "maxExpands" ? f.expandsDone + " / " + c.limit + " Expands used"
      : "Farm size " + formatWhole(farmCapacity()) + (saleReady() ? " · ready to sell" : "");
  }
  return "";
}
function takeContract(id) {
  const c = contractDef(id);
  if (!c || game.contract || contractDone(id) || !contractsUnlocked()) return;
  if (!contractConditionsMet(c)) {
    if (!confirm(c.name + ": this farm doesn't meet the conditions (" + c.ruleText.toLowerCase() + ").\n\nStart a new farm to take this contract? Your current farm resets like a sale, but you get no Scales.")) return;
    game.contract = id;
    restartFarm();
  }
  game.contract = id;
  game.contractStart = { expandsDone: game.farm.expandsDone, growths: game.farm.growths };
  toast("Contract started: " + c.name + " (" + c.goalText.toLowerCase() + ")", true);
  render();
}
function dropContract() {
  const c = activeContract();
  if (!c || !confirm("Drop " + c.name + "? Its rule stops applying. You can take it again later.")) return;
  game.contract = null;
  render();
}
function completeContract(c) {
  game.contractsDone.push(c.id);
  game.contract = null;
  const pay = c.payout || 0;
  if (pay) { game.scales = game.scales.add(pay); game.totalScales = game.totalScales.add(pay); }
  toast("Contract complete: " + c.name + "! " + c.reward + ", +1 Scale per sale" + (pay ? ", and +" + formatWhole(pay) + " Scales" : ""), true);
}
// Best try on each contract: how close you got (Tier 1 or coin digits, Expand/growth counts, farm size for sales)
function contractProgressValue(c) {
  const f = game.farm;
  switch (c.goal) {
    case "t1": return tier1Digits().toNumber();
    case "coins": return game.coins.max(1).log10().toNumber();
    case "expands": return f.expandsDone - contractBase("expandsDone");
    case "growths": return f.growths - contractBase("growths");
    case "sale": return farmCapacity().log10().toNumber() + (saleReady() ? 1 : 0);
  }
  return 0;
}
function contractBestText(c) {
  const b = (game.contractBest || {})[c.id];
  if (b === undefined) return "";
  switch (c.goal) {
    case "t1": case "coins": return "Best try: 1e" + Math.floor(b) + " of " + formatWhole(new Decimal(c.target));
    case "expands": return "Best try: " + b + " of " + c.target + " Expands";
    case "growths": return "Best try: " + b + " of " + c.target + " growths";
    case "sale": return "Best try: farm grew to 1e" + Math.floor(b);
  }
  return "";
}
function failContract(c, why) {
  game.contract = null;
  toast("Contract failed: " + c.name + " (" + why + ")", true);
}
// Called every step: finish or fail the active contract
function checkContract() {
  const c = activeContract();
  if (!c) return;
  if (!game.contractBest) game.contractBest = {};
  const v = contractProgressValue(c);
  if (!(game.contractBest[c.id] >= v)) game.contractBest[c.id] = v;
  if (c.rule === "timed" && game.farm.age >= c.limit) return failContract(c, "out of time");
  if (c.rule === "maxExpands" && game.farm.expandsDone > c.limit) return failContract(c, "too many Expands");
  if (contractGoalMet(c)) completeContract(c);
}
// Something automated just happened (breaks Hand-Raised's "not met yet" and the Hands Off challenge)
function markAuto() { game.farm.autoUsed = true; game.expandFlags.autoUsed = true; }
// Automation runs only when switched on and no contract forbids it
function autoActive() { return game.automationOn && !contractRule("noAuto"); }
// A new farm without selling (to qualify for a contract). Keeps everything a sale keeps; no Scales.
// Best Acres earned on a single farm (Acre Purse)
function noteFarmAcres() { game.bestFarmAcres = Math.max(game.bestFarmAcres || 0, game.farm.acresEarned || 0); }
function acrePurseAmount() { return hasStall("acrePurse") ? Math.floor((game.bestFarmAcres || 0) * 0.05) : 0; }
function restartFarm() {
  noteFarmAcres();
  const keepPlots = hasStall("blueprints") ? SETTINGS.buildings.filter(b => !b.hidden && buildingPlaced(b.id)).map(b => b.id) : null;
  const keep = farmKeep();
  game = newGame();
  Object.assign(game, keep);
  startNewSale(keepPlots);
  statEvent("Started a new farm (contract)");
  save();
}
// What carries over to a new farm (sale or restart)
function farmKeep() {
  return {
    prefs: game.prefs, stats: game.stats, autobuy: game.autobuy, autoUpgrades: game.autoUpgrades,
    autoModes: game.autoModes, buyMode: game.buyMode, autoSeen: game.autoSeen,
    automationOn: game.automationOn, autoGooOn: game.autoGooOn, autoRender: game.autoRender, autoExpandOn: game.autoExpandOn,
    autoAcres: game.autoAcres, autoBuildOn: game.autoBuildOn, autoSellOn: game.autoSellOn, gooStars: game.gooStars, buildStars: game.buildStars,
    scales: game.scales, totalScales: game.totalScales, sales: game.sales, stall: game.stall, marketPath: game.marketPath,
    seenIntros: game.seenIntros, contract: game.contract, contractsDone: game.contractsDone, maxExpandsEver: game.maxExpandsEver,
    bestRenderGoo: game.bestRenderGoo, maxRendersEver: game.maxRendersEver, bestFarmAcres: game.bestFarmAcres,
    achievements: game.achievements, achSeen: game.achSeen, lifetime: game.lifetime,
    respecQueued: game.respecQueued, contractBest: game.contractBest,
    // Hand-Raised: Render milestones are kept through sales
    renders: contractDone("handRaised") ? game.renders : 0,
  };
}
// ===== Automation ladder: simple version from a milestone, permanent version from the Market Stall =====
function hasAutoAcres() { return expandMilestoneReached("autoAcres"); }
function hasAutoGrow() { return false; }   // removed: auto-Expand for Acres handles growing
function hasAutoBuild() { return expandMilestoneReached("autoBuild"); }
function hasAutoSell() { return saleMilestoneReached("autoSell"); }
const STAR_EDGE = 0.7;   // starred items are compared at 70% of their price
// Pick the next item to buy: cheapest by compared price (starred get the edge). Waits for it if not affordable.
function pickNext(items, costOf, starred) {
  let best = null, bestCmp = null;
  items.forEach(id => {
    const c = costOf(id).mul(starred.includes(id) ? STAR_EDGE : 1);
    if (best === null || c.lt(bestCmp)) { best = id; bestCmp = c; }
  });
  return best;
}
// Goo from a Render right now, without rounding (for the smooth "best Goo per minute" rule)
function essenceRaw() {
  if (!renderUnlocked()) return 0;
  const e = SETTINGS.essence;
  const base = Math.max(1, Math.pow(gooSlimes().max(1).log10().toNumber() / e.digitDivisor, e.power));
  return (base + essPower("richerRender")) * gooMultiplier().toNumber();
}
var arPeak = 0;     // best Goo/sec this run (Auto-Render "best" mode); var so resets can clear it before this line runs
var arPeakAt = 0;   // run time when that peak happened
// Auto-Render "best": Render when this run's Goo per second has peaked. Judged on this run alone (no history).
// After the peak it waits a short while (arWaitMult × the time it took to reach the peak, in total run length):
// a start-of-run burst that recovers sets a new peak and the run goes on.
// Rising target: first Render of an Expand at `value` Goo, then each one needs the last Render's Goo × riseX
function riseTarget() {
  const ar = game.autoRender;
  return new Decimal(ar.lastGain > 0 ? ar.lastGain * ar.riseX : ar.value).ceil();
}
function arBestReady() {
  const t = game.runTime;
  if (t <= 0 || !renderUnlocked()) return false;
  const rate = essenceRaw() / t;
  if (rate > arPeak) { arPeak = rate; arPeakAt = t; }
  if (essenceGain().lt(1) || rate >= arPeak * 0.995) return false;
  return t >= arPeakAt * SETTINGS.arWaitMult;
}
// How full the farm is, 0–100, measured like the fill bar (from 1e100 to the farm cap). 0 below 1e100.
function farmFillPct() {
  const base = new Decimal(SETTINGS.expandGoal).log10().toNumber();
  const t1 = game.tiers[0].owned.max(1).log10().toNumber();
  if (t1 < base) return 0;
  return Math.min(100, (t1 - base) / Math.max(1, farmCapacity().log10().toNumber() - base) * 100);
}   // best Goo-per-second seen this run (Render Foreman's "best" mode)
// ===== One-time unlock cards =====
// The first time each layer opens, a short card explains it. Each shows once, ever.
const INTROS = {
  render: ["Render", "Turn your farm into Goo. Rendering starts a new farm (coins, slimes, and coin upgrades reset), and Goo buys permanent upgrades on the Goo tab. More Tier 1 slimes means more Goo."],
  auto: ["Automation", "Something now runs on its own. Every automation setting is in the \u27f3 Auto tab, along with a switch to pause it all."],
  expand: ["Expand", "Turn your farm into Acres. Expanding resets coins, slimes, Goo, and Goo upgrades. Acres build and level buildings in the Estate. If your farm is full when you Expand, it also grows, so it can hold more slimes."],
  sell: ["Sell the Farm", "Your farm is full at its largest size. Selling resets everything on the farm for Scales. Scales buy one-time helpers in the Stall and Trade Deals, and they're kept forever."],
};
function checkIntros() {
  if (catchingUp || document.getElementById("intro-modal").classList.contains("open")) return;
  const seen = game.seenIntros;
  const due = [
    ["render", renderUnlocked()],
    ["auto", unlockedAutomations().length > 0],
    ["expand", expandUnlocked()],
    ["sell", saleReady()],
  ].find(([k, ok]) => ok && !seen.includes(k));
  if (!due) return;
  seen.push(due[0]);
  document.getElementById("intro-title").textContent = INTROS[due[0]][0];
  document.getElementById("intro-text").textContent = INTROS[due[0]][1];
  document.getElementById("intro-modal").classList.add("open");
}
// ===== Achievements =====
function achDef(id) { return SETTINGS.achievements.find(a => a.id === id); }
function hasAch(id, g = game) { return !!(g.achievements && g.achievements.includes(id)); }
// Smart automation features come from achievements
function smartUnlocked(feature) { return SETTINGS.achievements.some(a => a.smart === feature && hasAch(a.id)); }
// Product of every earned achievement's buff of one kind (slimes, goo, acres, scales, coinUps)
function achBuff(kind) {
  let m = 1;
  SETTINGS.achievements.forEach(a => { if (a.buff && a.buff[kind] && hasAch(a.id)) m *= a.buff[kind]; });
  return m;
}
// Current value of a lifetime stat
function achStat(a) {
  const L = game.lifetime;
  switch (a.stat) {
    case "renders": return L.renders;
    case "expands": return L.expands;
    case "growths": return L.growths;
    case "gooLevels": return L.gooLevels;
    case "buildLevels": return L.buildLevels;
    case "sales": return L.sales;
    case "contracts": return game.contractsDone.length;
    case "t8": return game.tiers[7].owned;
    case "bestGoo": return game.bestRenderGoo || 0;
    case "merchants": return game.marketPath.length;
    case "scalesEarned": return game.totalScales;
    case "stallItems": return SETTINGS.stall.filter(u => ownsStall(u.id)).length;
    case "premiumItems": return SETTINGS.premium.filter(u => ownsStall(u.id)).length;
  }
  return 0;
}
function earnAch(id) {
  if (hasAch(id)) return;
  game.achievements.push(id);
  const a = achDef(id);
  toast("Achievement: " + a.name + "! " + a.reward, true);
}
// Lifetime goals: checked often (cheap)
function checkLifetimeAch() {
  SETTINGS.achievements.forEach(a => {
    if (a.kind === "life" && !hasAch(a.id) && new Decimal(achStat(a)).gte(a.target)) earnAch(a.id);
  });
}
// ===== Offline cap: 1h, doubled once by each "offline" achievement (permanent, never reset) =====
function offlineDoublers(g = game) {
  return SETTINGS.achievements.filter(a => a.qol === "offline").map(a => [a.name, hasAch(a.id, g)]);
}
function offlineCapHours(g = game) {
  const boost = SETTINGS.achievements.some(a => a.qol === "offlineHalf" && hasAch(a.id, g)) ? 1.5 : 1;   // Scale Hoarder: ×1.5
  return SETTINGS.maxOfflineHours * Math.pow(2, offlineDoublers(g).filter(([, on]) => on).length) * boost;
}
// ===== Offline catch-up =====
// Time away is played out in up to 10,000 small steps (in batches, so the page stays responsive),
// then a "While you were away" summary shows what happened.
let catchingUp = false;
const tally = { renders: 0, expands: 0, acres: new Decimal(0) };   // counts actions (used for the summary)
function startCatchUp(seconds) {
  catchingUp = true;
  const before = { goo: game.totalEssence, renders: tally.renders, expands: tally.expands, acres: tally.acres,
    t1: game.tiers[0].owned, scales: game.scales };
  const total = Math.min(10000, Math.max(1, Math.ceil(seconds / 0.5)));
  const dt = seconds / total;
  const overlay = document.getElementById("catchup");
  const fill = document.getElementById("catchup-fill");
  if (total > 1500) overlay.classList.add("open");
  let done = 0;
  const batch = () => {
    const end = Math.min(total, done + 300);
    for (; done < end; done++) stepGame(dt);
    fill.style.width = (done / total * 100).toFixed(0) + "%";
    if (done < total) { setTimeout(batch, 0); return; }
    catchingUp = false;
    overlay.classList.remove("open");
    game.lastTick = Date.now();
    save();
    render();
    if (seconds >= 60) showAwaySummary(seconds, before);
  };
  batch();
}
function showAwaySummary(seconds, before) {
  const lines = [];
  const goo = game.totalEssence.sub(before.goo);
  if (goo.gt(0)) lines.push(["Goo earned", formatWhole(goo)]);
  if (tally.renders > before.renders) lines.push(["Renders", formatWhole(tally.renders - before.renders)]);
  if (tally.expands > before.expands) lines.push(["Expands", formatWhole(tally.expands - before.expands)]);
  const acres = tally.acres.sub(before.acres);
  if (acres.gt(0)) lines.push(["Acres earned", formatWhole(acres)]);
  lines.push(["Tier 1 slimes", formatWhole(before.t1) + " → " + formatWhole(game.tiers[0].owned)]);
  document.getElementById("away-time").textContent = "You were away for " + formatTime(seconds) + ".";
  document.getElementById("away-list").innerHTML = lines.map(([k, v]) => `<div class="ms-row"><span class="muted">${k}</span><strong>${v}</strong></div>`).join("");
  document.getElementById("away-modal").classList.add("open");
}
// One step of the game: automation, production, caps, Auto-Render
function stepGame(seconds) {
  game.farm.age += seconds;
  // Upgrade Helper: buy coin upgrades, cheapest first
  if (autoActive() && essPower("upgradeHelper") > 0 && game.autoUpgrades) {
    let bought = true, n = 0;
    while (bought && n < 100) {
      bought = false; n++;
      const options = SETTINGS.upgrades
        .filter(u => !upgradeMaxed(u.id))
        .sort((a, b) => upgradeCost(a.id).cmp(upgradeCost(b.id)));
      if (options.length && game.coins.gte(upgradeCost(options[0].id))) {
        markAuto(); game.runFlags.coinUpBought = true;
        game.coins = game.coins.sub(upgradeCost(options[0].id));
        game.upgrades[options[0].id] = upgradeLevel(options[0].id) + 1;
        bought = true;
      }
    }
  }

  // Expand milestone: auto-buy Goo upgrades, cheapest first
  // Auto-buy skips upgrades costing half the Expand Goo or more, so Goo builds up for the Expand
  if (autoActive() && game.autoGooOn && expandMilestoneReached("autoGoo")) {
    const limit = autoGooLimit();
    const stars = smartUnlocked("gooStars") ? game.gooStars : [];
    for (let n = 0; n < 200; n++) {
      const ids = SETTINGS.essenceUpgrades.filter(u => !essMaxed(u.id) && essCost(u.id).lt(limit)).map(u => u.id);
      const next = pickNext(ids, essCost, stars);
      if (!next || game.essence.lt(essCost(next))) break;
      if (contractRule("noGoo") || contractRule("noSpend")) break;
      game.essence = game.essence.sub(essCost(next));
      levelUpEss(next);
      markAuto(); game.farm.gooBought = true;
    }
  }
  // Auto-level buildings (Expand milestone 15, or Estate Keeper): cheapest first, starred favored
  if (autoActive() && game.autoBuildOn && hasAutoBuild() && !contractRule("noSpend")) {
    const stars = smartUnlocked("buildStars") ? game.buildStars : [];
    for (let n = 0; n < 200; n++) {
      const ids = SETTINGS.buildings.filter(b => buildingAvailable(b) && !buildingMaxed(b.id)
        && !(contractRule("bld10") && buildingLevel(b.id) >= 10)).map(b => b.id);
      const next = pickNext(ids, buildingCost, stars);
      if (!next || game.acres.lt(buildingCost(next))) break;
      game.acres = game.acres.sub(buildingCost(next));
      game.farm.bldBought = true;
      game.buildingLevels[next] = buildingLevel(next) + 1;
      game.lifetime.buildLevels += 1;
      markAuto();
      syncPlots();
    }
  }

  // Auto-buy: highest tier first, as many as affordable
  for (let i = game.tiers.length - 1; i >= 0; i--) {
    if (!autoActive() || !autoUnlocked(i) || !game.autobuy[i]) continue;
    let n = 0;
    if (game.autoModes[i] === "max") while (n < 1000 && buyTier(i)) n++;
    else while (n < 40 && buyChunk(i)) n++;   // Milestone: only full chunks, saving up in between
    if (n > 0) markAuto();
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

  // Sale milestone 15: Auto-Sell as soon as the farm is ready
  if (autoActive() && game.autoSellOn && hasAutoSell() && saleReady()) {
    markAuto();
    finishSell();
    return;
  }

  // Farm Manager (Market Stall): Auto-Expand whenever the farm is full
  if (autoActive() && game.autoExpandOn && hasAutoGrow() && expandUnlocked() && expandWillGrow()) {
    markAuto();
    finishExpand(true);
    return;
  }

  // Land Agent (Market Stall): Expand for Acres once the gain reaches the chosen amount (growing Expands are Farm Manager's job)
  // Auto-Expand for Acres: also grows the farm. A goal only a full farm can reach (full farms give ×2 Acres),
  // or "Wait for full", makes it wait and grow. Never fires on a farm that's ready to sell.
  // Smart wait (Growth Spurt): predicts when the farm fills. Fills within smartSecs: wait and grow it.
  // Won't fill in time: Expand by the rule above instead.
  trackFillRate();
  const capMode = game.autoAcres.mode === "cap" && smartUnlocked("capMode");
  const aa = game.autoAcres;
  const ruleMet = () => capMode ? tier1Digits().gte(farmCapacity().log10().sub(aa.value)) : acreGain().gte(aa.value);
  const smartWait = aa.waitFull && aa.smartWait && smartUnlocked("capMode");
  const goNow = smartWait ? (farmFull() || (ruleMet() && fillRateReady() && fillEta() > aa.smartSecs))
    : aa.waitFull ? farmFull() : ruleMet();
  if (autoActive() && aa.on && hasAutoAcres() && expandUnlocked() && !saleReady() && goNow) {
    markAuto();
    finishExpand(true);
    return;
  }

  // Auto-Render
  const ar = game.autoRender;
  if (autoActive() && hasAutoRender() && ar.on && renderUnlocked()) {
    const smart = smartUnlocked("renderModes");
    let ready;
    const paused = smart && ar.pauseOn && farmFillPct() >= ar.pausePct;
    if (smart && ar.mode === "best") {
      ready = arBestReady();
    } else if (smart && ar.mode === "rise") ready = essenceGain().gte(riseTarget());
    else if (ar.mode === "time") ready = game.runTime >= ar.value;
    else ready = essenceGain().gte(ar.value);
    if (ready && !paused) {
      if (ar.mode === "rise") ar.lastGain = essenceGain().toNumber();   // the next Render must beat this × riseX
      arPeak = 0; markAuto(); doRender(true);
    }
  }
  checkLifetimeAch();
  checkContract();
}

// ===== Icons (simple inline SVG, no image files) =====
const SLIME_COLORS = ["#7ccf6a", "#4fb3c9", "#8f7be0", "#d97bb5", "#e0a84f", "#d9604f", "#b8c4cf", "#5a5f8a"];
// A slime: a soft blob with a wavy bottom, two eyes, and a shine
function slimeSVG(color, size = 26) {
  return `<svg class="slime-icon" viewBox="0 0 24 20" width="${size}" height="${Math.round(size * 20 / 24)}" aria-hidden="true">
    <path d="M1.5 18.5 C1.5 11 6 7 10.6 6.2 Q12 2.6 13.4 6.2 C18 7 22.5 11 22.5 18.5 Q12 19.6 1.5 18.5 Z" fill="${color}" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
    <ellipse cx="7.5" cy="10" rx="2.2" ry="1.2" fill="#fff" opacity="0.35"/>
    <circle cx="9.4" cy="13.2" r="1.5" fill="#1b1d22"/><circle cx="14.6" cy="13.2" r="1.5" fill="#1b1d22"/>
  </svg>`;
}
const ICONS = {
  goo: `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 C8 1.5 3 7.3 3 10.3 A5 5 0 0 0 13 10.3 C13 7.3 8 1.5 8 1.5 Z" fill="#a77ee8"/><ellipse cx="6.3" cy="10" rx="1.1" ry="1.6" fill="#fff" opacity="0.35"/></svg>`,
  acres: `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14 V7" stroke="#6fcf7f" stroke-width="1.6" stroke-linecap="round"/><path d="M8 8 C8 5 5.5 3.5 2.5 3.8 C2.6 6.6 5 8.3 8 8 Z" fill="#6fcf7f"/><path d="M8 9.5 C8 6.8 10.3 5.4 13.3 5.6 C13.2 8.3 11 9.8 8 9.5 Z" fill="#4fb864"/><path d="M3 14.2 H13" stroke="#8a6a43" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  scales: `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 C11.6 3.6 13.4 6.8 13 10 C12.4 13 10.2 14.4 8 14.4 C5.8 14.4 3.6 13 3 10 C2.6 6.8 4.4 3.6 8 1.8 Z" fill="#e2b345" stroke="#8a6416" stroke-width="0.8"/><path d="M8 4.5 C10 5.8 10.9 7.8 10.6 10" stroke="#fff3cf" stroke-width="0.9" fill="none" opacity="0.6"/></svg>`,
};
// Buildings and Stall items (24px, flat colors that match each layer)
const BUILDING_ICONS = {
  nursery: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 L12 4 L21 11 V21 H3 Z" fill="#b5523f"/><path d="M2 11.5 L12 3.5 L22 11.5" stroke="#e8d9c0" stroke-width="1.6" fill="none" stroke-linejoin="round"/><rect x="9" y="13" width="6" height="8" fill="#6e2f24"/><path d="M9 13 L15 21 M15 13 L9 21" stroke="#e8d9c0" stroke-width="1.1"/><rect x="10.5" y="8" width="3" height="2.6" fill="#e8d9c0"/></svg>`,
  gooVat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7 H19 L18 20 Q12 22 6 20 Z" fill="#6b5a7d"/><path d="M5 7 H19" stroke="#a593b8" stroke-width="2" stroke-linecap="round"/><path d="M6.2 10.5 H17.8" stroke="#4e4060" stroke-width="1.2"/><path d="M6.6 16 H17.4" stroke="#4e4060" stroke-width="1.2"/><path d="M7 7 Q8 4.5 10 6 Q12 3.5 14 6 Q16 4.5 17 7 Z" fill="#a77ee8"/><path d="M15.5 7 V10.5" stroke="#a77ee8" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  feedMill: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 21 L10 10 H14 L15.5 21 Z" fill="#c9a46a"/><rect x="11" y="16.5" width="2" height="4.5" fill="#6e5230"/><g stroke="#e8d9c0" stroke-width="1.8" stroke-linecap="round"><path d="M12 10 L6 4"/><path d="M12 10 L18 4"/><path d="M12 10 L6 16"/><path d="M12 10 L18 16"/></g><circle cx="12" cy="10" r="1.6" fill="#6e5230"/></svg>`,
  silo: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9 Q7 3.5 12 3.5 Q17 3.5 17 9 V21 H7 Z" fill="#9aa6b2"/><path d="M7 9 Q7 3.5 12 3.5 Q17 3.5 17 9" fill="#c3ccd5"/><path d="M7 13 H17 M7 17 H17" stroke="#7a8592" stroke-width="1"/><circle cx="12" cy="15" r="2.6" fill="#e2b345" stroke="#8a6416" stroke-width="0.8"/></svg>`,
  empty: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="9" width="17" height="11" rx="1.5" fill="none" stroke="#6b5034" stroke-width="1.4" stroke-dasharray="2.5 2"/><path d="M12 18 V13.5" stroke="#4fb864" stroke-width="1.4" stroke-linecap="round"/><path d="M12 14.5 C12 12.6 10.6 11.7 8.8 11.8 C8.9 13.6 10.3 14.6 12 14.5 Z" fill="#6fcf7f"/></svg>`,
  landAgent: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4 V21" stroke="#8f6c43" stroke-width="2" stroke-linecap="round"/><path d="M5 6 H16 L19 8.5 L16 11 H5 Z" fill="#c9a46a"/><path d="M13 13 H8 L5.5 15.5 L8 18 H13 Z" fill="#a8844f"/></svg>`,
  farmManager: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4.5" width="14" height="17" rx="2" fill="#a8844f"/><rect x="7" y="7" width="10" height="12.5" fill="#efe6d2"/><rect x="9" y="3" width="6" height="3" rx="1" fill="#6e5230"/><path d="M8.5 10 L9.5 11 L11.2 9.2 M12.5 10 H15.5 M8.5 14 L9.5 15 L11.2 13.2 M12.5 14 H15.5" stroke="#4fb864" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>`,
  gooSteward: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3 H15 M10 3 V9 L5 19 Q4.5 21 7 21 H17 Q19.5 21 19 19 L14 9 V3" fill="#3a2a5a" stroke="#c7a6f5" stroke-width="1.3" stroke-linejoin="round"/><path d="M7 15 H17 L19 19 Q19.5 21 17 21 H7 Q4.5 21 5 19 Z" fill="#a77ee8"/><path d="M12 11.5 L12.8 13.2 L14.6 13.4 L13.2 14.6 L13.6 16.4 L12 15.5 L10.4 16.4 L10.8 14.6 L9.4 13.4 L11.2 13.2 Z" fill="#f3cf74"/></svg>`,
  estateKeeper: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="12" r="4.5" fill="none" stroke="#e2b345" stroke-width="2.2"/><path d="M12 12 H21 M18 12 V16 M21 12 V15" stroke="#e2b345" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  nightShift: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3 A8 8 0 1 0 21 14 A6.5 6.5 0 1 1 15 3 Z" fill="#e8d9a0"/><circle cx="6" cy="5" r="0.9" fill="#e8d9a0"/><circle cx="4" cy="10" r="0.6" fill="#e8d9a0"/><path d="M2 21 H22" stroke="#4fb864" stroke-width="2" stroke-linecap="round"/></svg>`,
  acrePurse: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8 Q12 5 17 8 L19 19 Q12 22 5 19 Z" fill="#a8844f" stroke="#6e5230"/><path d="M8.5 8 Q12 4 15.5 8" stroke="#6e5230" stroke-width="1.6" fill="none"/><path d="M12 18 V13" stroke="#4fb864" stroke-width="1.5" stroke-linecap="round"/><path d="M12 14 C12 12 10.5 11 8.8 11.2 C8.9 13 10.3 14 12 14 Z" fill="#6fcf7f"/><path d="M12 15 C12 13.2 13.4 12.3 15.1 12.4 C15 14.1 13.7 15.1 12 15 Z" fill="#4fb864"/></svg>`,
  starterHerd: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 21 C1 16 3.5 13.5 6 13.3 Q7 11.5 8 13.3 C10.5 13.5 13 16 13 21 Z" fill="#7ccf6a"/><path d="M11 21 C11 15 14 12 17 11.8 Q18 9.8 19 11.8 C22 12 23 15 23 21 Z" fill="#4fb3c9"/><path d="M6 21 C6 17.5 8 16 10 15.9 Q11 14.5 12 15.9 C14 16 16 17.5 16 21 Z" fill="#8f7be0"/><path d="M17 7 V2 M14.8 4.2 L17 2 L19.2 4.2" stroke="#f3cf74" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  barnRaising: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12 L11 5.5 L19 12 V21 H3 Z" fill="#b5523f"/><path d="M2 12.5 L11 5 L20 12.5" stroke="#e8d9c0" stroke-width="1.4" fill="none"/><rect x="8.5" y="14" width="5" height="7" fill="#6e2f24"/><path d="M20 9 V2 M17.6 4.4 L20 2 L22.4 4.4" stroke="#f3cf74" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  siloSpill: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9 Q5 4 10 4 Q15 4 15 9 V21 H5 Z" fill="#9aa6b2"/><path d="M5 13 H15 M5 17 H15" stroke="#7a8592"/><circle cx="18" cy="8" r="2.4" fill="#e2b345" stroke="#8a6416" stroke-width="0.7"/><circle cx="20" cy="13" r="2" fill="#e2b345" stroke="#8a6416" stroke-width="0.7"/><path d="M18 18 V21 M16.8 19 L18 18 L19.2 19" stroke="#6fcf7f" stroke-width="1.3" fill="none"/></svg>`,
  ledger: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3 H18 V21 H5 Q3.5 21 3.5 19.5 V4.5 Q3.5 3 5 3 Z" fill="#6e2f24"/><rect x="7" y="5.5" width="9" height="13" fill="#efe6d2"/><path d="M8.5 9 L9.5 10 L11 8.4 M12 9 H15 M8.5 13 L9.5 14 L11 12.4 M12 13 H15" stroke="#4fb864" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M18 5 H20 V21 H18" fill="#8a3a2a"/></svg>`,
  fertileSoil: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16 Q12 12 21 16 V21 H3 Z" fill="#7a5532"/><path d="M5 18 h2 M10 19 h2 M15 18 h2" stroke="#5a3d22" stroke-width="1.2" stroke-linecap="round"/><path d="M12 15 V8" stroke="#4fb864" stroke-width="1.6" stroke-linecap="round"/><path d="M12 10 C12 7 9.5 5.6 6.8 5.9 C6.9 8.5 9.2 10.1 12 10 Z" fill="#6fcf7f"/><path d="M12 11 C12 8.4 14.3 7 17 7.2 C16.9 9.7 14.8 11.2 12 11 Z" fill="#4fb864"/></svg>`,
  gooSeed: `<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="17" rx="6" ry="4.5" fill="#a77ee8" stroke="#5b3f8a" stroke-width="1"/><ellipse cx="10" cy="15.5" rx="1.5" ry="1" fill="#fff" opacity="0.35"/><path d="M12 13 V7" stroke="#4fb864" stroke-width="1.6" stroke-linecap="round"/><path d="M12 8.5 C12 5.5 9.5 4 6.5 4.3 C6.6 7 9 8.6 12 8.5 Z" fill="#6fcf7f"/><path d="M12 9.5 C12 7 14.2 5.6 17 5.8 C16.9 8.3 14.8 9.8 12 9.5 Z" fill="#4fb864"/></svg>`,
  renderForeman: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15 Q4 6 12 6 Q20 6 20 15 Z" fill="#f3cf74" stroke="#8a6416" stroke-width="1"/><rect x="2.5" y="15" width="19" height="3" rx="1.2" fill="#d9a93c"/><path d="M12 6 V12" stroke="#8a6416" stroke-width="1.4"/><path d="M8 21 Q12 19 16 21" stroke="#a77ee8" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  surveyTeam: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9 L15 5 L16.5 9.5 L4.5 13.5 Z" fill="#c9a46a" stroke="#6e5230"/><circle cx="16.8" cy="7.2" r="2.6" fill="#3d6fa8" stroke="#cfe2f7" stroke-width="0.8"/><path d="M9 12 L6 21 M9 12 L12 21" stroke="#8f6c43" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  deepVats: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8 H21 L19.5 21 Q12 23 4.5 21 Z" fill="#8a6416"/><path d="M3 8 H21" stroke="#f3cf74" stroke-width="2.2" stroke-linecap="round"/><path d="M4.5 11.5 H19.5 M5 16.5 H19" stroke="#e2b345" stroke-width="1.2"/><path d="M5 8 Q6.5 4 9 6.3 Q12 2.5 15 6.3 Q17.5 4 19 8 Z" fill="#a77ee8"/></svg>`,
  goldenPens: `<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="#e2b345" stroke="#8a6416" stroke-width="0.8"><path d="M3 21 V8 L5 5.5 L7 8 V21 Z"/><path d="M10 21 V8 L12 5.5 L14 8 V21 Z"/><path d="M17 21 V8 L19 5.5 L21 8 V21 Z"/></g><path d="M2 11 H22 M2 17 H22" stroke="#f3cf74" stroke-width="2"/></svg>`,
  blueprints: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6 H17 V19 H4 Z" fill="#3d6fa8"/><path d="M17 6 Q20 6 20 9 V19 Q20 16 17 16" fill="#2c5384"/><path d="M6.5 9 H14.5 V16.5 H6.5 Z M10.5 9 V16.5 M6.5 12.5 H10.5" stroke="#cfe2f7" stroke-width="0.9" fill="none"/></svg>`,
};
// Goo upgrade pictures
const GOO_ICONS = {
  gooPower: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="13" r="7" fill="#e2b345" stroke="#8a6416" stroke-width="1"/><circle cx="10" cy="13" r="4" fill="none" stroke="#fff3cf" stroke-width="1" opacity="0.5"/><path d="M18 3 C18 3 14.5 7.3 14.5 9.5 A3.5 3.5 0 0 0 21.5 9.5 C21.5 7.3 18 3 18 3 Z" fill="#a77ee8" stroke="#5b3f8a" stroke-width="0.8"/></svg>`,
  slimeGrowth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 21 C2 15 5.5 12 9.5 11.5 Q11 9 12.5 11.5 C16.5 12 20 15 20 21 Q11 22 2 21 Z" fill="#4fb3c9" stroke="rgba(0,0,0,0.35)"/><circle cx="8.6" cy="17" r="1.2" fill="#1b1d22"/><circle cx="13.4" cy="17" r="1.2" fill="#1b1d22"/><path d="M19 9 V2.5 M16.3 5.2 L19 2.5 L21.7 5.2" stroke="#a77ee8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  deepGoo: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 21 C2 13 6.5 8.5 11 8 Q12 4.5 13 8 C17.5 8.5 22 13 22 21 Q12 22.3 2 21 Z" fill="#4a3478" stroke="#a77ee8" stroke-width="0.8"/><circle cx="9.4" cy="15.5" r="1.4" fill="#e3d2ff"/><circle cx="14.6" cy="15.5" r="1.4" fill="#e3d2ff"/><circle cx="18" cy="5" r="1.4" fill="#a77ee8"/><circle cx="20.5" cy="2.5" r="0.9" fill="#a77ee8"/></svg>`,
  cheapSlimes: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12 L12 3 H20 V11 L11 20 Z" fill="#a77ee8" stroke="#5b3f8a" stroke-width="1" stroke-linejoin="round"/><circle cx="16.5" cy="6.5" r="1.6" fill="#1f1830"/><path d="M8.5 13.5 L13.5 8.5 M10.5 15.5 L15.5 10.5" stroke="#efe6ff" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  richerRender: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8 H20 L18 21 H6 Z" fill="#8b95a3" stroke="#5b6470" stroke-width="1"/><path d="M4 8 H20" stroke="#c3ccd5" stroke-width="2" stroke-linecap="round"/><path d="M5.5 8 Q7 4 9 6.5 Q11 3 13 6.5 Q15.5 3.5 18.5 8 Z" fill="#a77ee8"/><path d="M12 12 V18 M9 15 H15" stroke="#efe6ff" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  upgradeHelper: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L13.8 4.6 L16.9 4 L17.4 7.1 L20.3 8.3 L19.1 11.2 L21 13.7 L18.4 15.4 L18.4 18.6 L15.3 18.4 L13.6 21 L12 18.7 L10.4 21 L8.7 18.4 L5.6 18.6 L5.6 15.4 L3 13.7 L4.9 11.2 L3.7 8.3 L6.6 7.1 L7.1 4 L10.2 4.6 Z" fill="#6b5a7d"/><circle cx="12" cy="11.5" r="4" fill="#e2b345" stroke="#8a6416" stroke-width="0.8"/></svg>`,
};
const TAB_ICONS = {
  coin: `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="#e2b345" stroke="#8a6416" stroke-width="1"/><circle cx="8" cy="8" r="3.4" fill="none" stroke="#fff3cf" stroke-width="0.9" opacity="0.6"/></svg>`,
  stall: `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6 L3.5 2.5 H12.5 L14 6 Z" fill="#d9a93c"/><path d="M2 6 Q3.5 8 5 6 Q6.5 8 8 6 Q9.5 8 11 6 Q12.5 8 14 6" fill="#f3cf74"/><rect x="3" y="7.5" width="10" height="6" fill="#8f6c43"/><rect x="6" y="9.5" width="4" height="4" fill="#5a4229"/></svg>`,
  gear: `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 L9.3 3.2 L11.4 2.6 L11.7 4.7 L13.7 5.5 L12.9 7.5 L14.3 9.1 L12.5 10.3 L12.5 12.4 L10.4 12.3 L9.2 14.1 L8 12.5 L6.8 14.1 L5.6 12.3 L3.5 12.4 L3.5 10.3 L1.7 9.1 L3.1 7.5 L2.3 5.5 L4.3 4.7 L4.6 2.6 L6.7 3.2 Z" fill="#8b95a3"/><circle cx="8" cy="8" r="2.3" fill="#1b1f26"/></svg>`,
};
// Puts icons on the tabs, sub-tabs, chips, and section headings (once, at start)
function addTabIcons() {
  const put = (sel, html) => { const el = document.querySelector(sel); if (el) el.insertAdjacentHTML("afterbegin", html); };
  put('.tab[data-tier="farm"]', slimeSVG(SLIME_COLORS[0], 16));
  put('#market-tab', TAB_ICONS.stall);
  put('.tab[data-tier="settings"]', TAB_ICONS.gear);
  put('.subnav-btn[data-panel="panel-market"]', TAB_ICONS.stall);
  put('.subnav-btn[data-panel="panel-path"]', `<span class="ico">${BUILDING_ICONS.landAgent}</span>`);
  put('.subnav-btn[data-panel="panel-contracts"]', `<span class="ico">${BUILDING_ICONS.farmManager}</span>`);
  put('.subnav-btn[data-panel="panel-slimes"]', slimeSVG(SLIME_COLORS[0], 15));
  put('.subnav-btn[data-panel="panel-goo"]', ICONS.goo);
  put('.subnav-btn[data-panel="panel-acres"]', `<span class="ico">${BUILDING_ICONS.nursery}</span>`);
}
// ===== Building the tier list on screen =====
const tierRows = [];
function addChipIcons() {
  [["goo-btn", "goo"], ["expand-btn", "acres"], ["scale-chip", "scales"]].forEach(([id, ico]) =>
    document.getElementById(id).insertAdjacentHTML("afterbegin", ICONS[ico]));
}
function buildTierRows() {
  addChipIcons();
  addTabIcons();
  const container = document.getElementById("tiers");
  SETTINGS.tiers.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "tier-row";
    const makes = i === 0 ? "coins" : "Tier " + i;
    row.innerHTML = `
      <div class="tier-line">
        <span class="tier-icon">${slimeSVG(SLIME_COLORS[i])}</span>
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

// Tile: big picture, name + level, "desc · now X", cost along the bottom (Goo upgrades, Stall)
function tileHTML(name, desc, icon, nowWord = "now", extra = "") {
  return `<span class="tile-icon">${icon}</span>
    <div class="tile-name"><strong>${name}</strong> <span class="lvl"></span></div>
    <div class="muted tile-desc">${desc}${nowWord ? ` · ${nowWord} <span class="eff"></span>` : ""}</div>${extra}
    <span class="cost-line"></span>`;
}
// Compact upgrade row: name + level on top, "desc · now X" below, cost on the right
function rowHTML(name, desc, nowWord, extra = "", icon = "") {
  return `${icon ? `<span class="row-icon">${icon}</span>` : ""}<div class="ur-main">
      <div class="ur-top"><strong>${name}</strong><span class="lvl"></span></div>
      <div class="muted ur-sub">${desc}${nowWord ? ` · ${nowWord} <span class="eff"></span>` : ""}</div>${extra}
    </div>
    <span class="cost-line"></span>`;
}
// ===== Building the upgrade list on screen =====
const upgradeRows = [];
function buildUpgradeRows() {
  const container = document.getElementById("upgrades");
  SETTINGS.upgrades.forEach(u => {
    const btn = document.createElement("button");
    // Coin strip: name + level, what it boosts and the current total, then the cost
    btn.className = "upgrade-btn coin-card";
    btn.title = u.desc;
    btn.innerHTML = `<div class="cs-top"><strong>${u.name}</strong> <span class="lvl"></span></div>
      <div class="cs-eff">${u.short} <span class="eff"></span></div>
      <span class="cost-line"></span>`;
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
    btn.className = "upgrade-btn ess tile goo-tile";
    btn.innerHTML = tileHTML(u.name, u.desc, GOO_ICONS[u.id] || ICONS.goo);
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
  if (hasAutoGrow()) keys.push("expand");
  if (hasAutoAcres()) keys.push("acres");
  if (hasAutoBuild()) keys.push("build");
  if (hasAutoSell()) keys.push("sell");
  return keys;
}
// One plain line per reset card saying what the automation is doing right now
function renderAutoStatus() {
  const off = (id, isOff) => document.getElementById(id).classList.toggle("off", isOff);
  off("auto-render-sec", !game.autoRender.on); off("auto-expand-sec", !game.autoAcres.on);
  off("auto-goo-sec", !game.autoGooOn); off("auto-build-sec", !game.autoBuildOn);
  const set = (id, text, state) => { const el = document.getElementById(id); el.textContent = text; el.dataset.state = state; };
  const ar = game.autoRender;
  if (!ar.on) set("ar-status", "Off", "off");
  else if (!autoActive()) set("ar-status", "Paused with all automation", "wait");
  else if (smartUnlocked("renderModes") && ar.pauseOn && farmFillPct() >= ar.pausePct) set("ar-status", "Stopped: farm is " + Math.floor(farmFillPct()) + "% full", "wait");
  else if (!renderUnlocked()) set("ar-status", "Waiting for Render to unlock", "wait");
  else set("ar-status", { goo: "Next Render: +" + formatWhole(essenceGain()) + " of " + formatWhole(ar.value) + " Goo",
    time: "Next Render in " + formatTime(Math.max(0, ar.value - game.runTime)),
    best: "Auto-adjusting · now +" + formatWhole(essenceGain()) + " Goo",
    rise: "Next Render: +" + formatWhole(essenceGain()) + " of " + formatWhole(riseTarget()) + " Goo" }[ar.mode] || "Running", "run");
  const aa = game.autoAcres;
  if (!aa.on) set("ae-status", "Off", "off");
  else if (!autoActive()) set("ae-status", "Paused with all automation", "wait");
  else if (saleReady()) set("ae-status", "Holding: farm is ready to sell", "wait");
  else if (!expandUnlocked()) set("ae-status", "Waiting for the Expand goal", "wait");
  else if (aa.waitFull && aa.smartWait && smartUnlocked("capMode")) {
    const eta = fillEta();
    set("ae-status", farmFull() ? "Expanding: farm is full" : !fillRateReady() ? "Measuring fill speed…"
      : eta <= aa.smartSecs ? "Waiting: full in " + formatTime(eta) : "Too slow to fill: Expands by the rule", "run");
  } else if (aa.waitFull) set("ae-status", "Waiting: farm " + Math.floor(farmFillPct()) + "% full", "run");
  else set("ae-status", "Running · farm " + Math.floor(farmFillPct()) + "% full", "run");
  if (hasAutoSell()) {
    if (!game.autoSellOn) set("as-status", "Off", "off");
    else if (!autoActive()) set("as-status", "Paused with all automation", "wait");
    else set("as-status", saleReady() ? "Selling…" : atTrueCap() ? "Waiting: farm " + Math.floor(farmFillPct()) + "% full" : "Waiting: farm not at max size", "run");
  }
  document.getElementById("auto-sell-sec").style.display = hasAutoSell() ? "" : "none";
  const sb = document.getElementById("auto-sell");
  sb.textContent = game.autoSellOn ? "ON" : "OFF";
  sb.classList.toggle("on", game.autoSellOn);
}
function renderAuto() {
  const keys = unlockedAutomations();
  const tab = document.getElementById("auto-tab");
  tab.style.display = keys.length ? "" : "none";
  if (currentTier === "auto") keys.forEach(k => { if (!game.autoSeen.includes(k)) game.autoSeen.push(k); });
  document.getElementById("auto-dot").style.display = keys.some(k => !game.autoSeen.includes(k)) ? "" : "none";
  if (currentTier !== "auto") return;
  const pn = document.getElementById("auto-paused-note");
  pn.style.display = autoActive() ? "none" : "";
  pn.textContent = contractRule("noAuto") ? "Contract Hand-Raised: all automation is off until it's finished or dropped." : "Automation is paused. Turn it back on above.";
  const anyTier = SETTINGS.tiers.some((t, i) => autoUnlocked(i));
  document.getElementById("auto-slimes-sec").style.display = anyTier ? "" : "none";
  const tiersOpen = SETTINGS.tiers.filter((t, i) => autoUnlocked(i)).length;
  document.getElementById("auto-slimes-status").textContent = game.autobuy.filter((on, i) => on && autoUnlocked(i)).length + " of " + tiersOpen + " on";
  renderAutoStatus();
  autoTierRows.forEach((r, i) => {
    r.row.style.display = autoUnlocked(i) ? "" : "none";
    r.onoff.textContent = game.autobuy[i] ? "ON" : "OFF";
    r.onoff.classList.toggle("on", !!game.autobuy[i]);
    r.mode.textContent = (game.autoModes[i] === "max" ? "Max" : "Milestone") + " ⇄";
  });
  const fm = hasAutoGrow(), la = hasAutoAcres();
  document.getElementById("auto-expand-sec").style.display = fm || la ? "" : "none";
  document.getElementById("auto-expand-row").style.display = "none";
  const wf = document.getElementById("auto-wait-full");
  const smartOk = smartUnlocked("capMode");
  const isSmart = game.autoAcres.waitFull && game.autoAcres.smartWait && smartOk;
  const wfVal = isSmart ? "smart" : game.autoAcres.waitFull ? "full" : "off";
  wf.querySelector('option[value="smart"]').hidden = !smartOk;
  if (wf.value !== wfVal && document.activeElement !== wf) wf.value = wfVal;
  document.getElementById("auto-acres-rule").style.opacity = game.autoAcres.waitFull && !isSmart ? 0.4 : 1;
  document.getElementById("auto-wait-note").textContent = isSmart
    ? "Waits for full only if the farm fills soon; otherwise Expands by the rule above"
    : game.autoAcres.waitFull ? "Only Expands a full farm (grows it, ×2 Acres)" : "Expands by the rule above, full or not";
  document.getElementById("auto-smart-row").style.display = isSmart ? "" : "none";
  const ssv = document.getElementById("auto-smart-secs");
  if (document.activeElement !== ssv && Number(ssv.value) !== game.autoAcres.smartSecs) ssv.value = game.autoAcres.smartSecs;
  const eta = fillEta();
  document.getElementById("auto-smart-eta").textContent = farmFull() ? "Farm is full"
    : !fillRateReady() ? "Measuring fill speed…" : eta === Infinity ? "Not filling right now" : "Full in about " + formatTime(eta);
  const fo2 = smartUnlocked("renderModes");
  document.getElementById("ar-pause-row").style.display = fo2 ? "" : "none";
  const ps = document.getElementById("ar-pause");
  ps.textContent = game.autoRender.pauseOn ? "ON" : "OFF";
  ps.classList.toggle("on", !!game.autoRender.pauseOn);
  const pv = document.getElementById("ar-pause-pct");
  if (document.activeElement !== pv && Number(pv.value) !== game.autoRender.pausePct) pv.value = game.autoRender.pausePct;
  document.getElementById("auto-acres-row").style.display = la ? "" : "none";
  const capOk = smartUnlocked("capMode");
  const am = document.getElementById("auto-acres-mode");
  document.getElementById("auto-acres-label").style.display = "none";
  am.querySelector('option[value="cap"]').hidden = !capOk;
  const mode = capOk ? game.autoAcres.mode : "acres";
  if (am.value !== mode) am.value = mode;
  document.getElementById("auto-acres-unit").textContent = mode === "cap" ? "digits of cap" : "Acres";
  const aav = document.getElementById("auto-acres-value");
  if (document.activeElement !== aav && Number(aav.value) !== game.autoAcres.value) aav.value = game.autoAcres.value;
  // Buildings
  document.getElementById("auto-build-sec").style.display = hasAutoBuild() ? "" : "none";
  const ab = document.getElementById("auto-build");
  ab.textContent = game.autoBuildOn ? "ON" : "OFF";
  ab.classList.toggle("on", game.autoBuildOn);
  document.getElementById("auto-build-note").textContent = smartUnlocked("buildStars") ? "Cheapest first · starred get a 30% edge" : "Cheapest first";
  renderStars("build-stars", SETTINGS.buildings.filter(buildingAvailable), game.buildStars, smartUnlocked("buildStars"));
  renderStars("goo-stars", SETTINGS.essenceUpgrades.filter(u => !essMaxed(u.id)), game.gooStars, smartUnlocked("gooStars"));
  // Render Foreman modes
  const fo = smartUnlocked("renderModes");
  document.querySelectorAll("#ar-mode .smart").forEach(o => { o.hidden = !fo; o.disabled = !fo; });
  const aa = document.getElementById("auto-acres");
  aa.textContent = game.autoAcres.on ? "ON" : "OFF";
  aa.classList.toggle("on", game.autoAcres.on);
  const ae = document.getElementById("auto-expand");
  ae.textContent = game.autoExpandOn ? "ON" : "OFF";
  ae.classList.toggle("on", game.autoExpandOn);
  document.getElementById("auto-goo-note").textContent = document.getElementById("goo-reserve").textContent || "Cheapest first";
}

// Star chips for Goo Steward / Estate Keeper (tap to star or unstar)
function renderStars(boxId, items, list, owned) {
  const box = document.getElementById(boxId);
  box.style.display = owned ? "" : "none";
  if (!owned) return;
  const key = items.map(x => x.id + (list.includes(x.id) ? "*" : "")).join();
  if (box.dataset.key === key) return;
  box.dataset.key = key;
  box.innerHTML = `<span class="muted">Star:</span>` + items.map(x =>
    `<button class="star-chip${list.includes(x.id) ? " on" : ""}" data-id="${x.id}">${list.includes(x.id) ? "★" : "☆"} ${x.name}</button>`).join("");
  box.querySelectorAll(".star-chip").forEach(b => b.addEventListener("click", () => {
    const i = list.indexOf(b.dataset.id);
    if (i >= 0) list.splice(i, 1); else list.push(b.dataset.id);
    render();
  }));
}
// ===== Market panel =====
const stallRows = [];
const contractRows = [];
const pathRows = [];
const saleMsRows = [];
function marketCard(name, desc, onClick, row = false, icon = "") {
  const btn = document.createElement("button");
  btn.className = "upgrade-btn market" + (row ? " tile stall-tile" : "");
  btn.innerHTML = row ? tileHTML(name, desc, icon, "", `<div class="muted ur-extra node-note"></div>`) : `
    <div class="up-top"><strong>${name}</strong></div>
    <div class="muted">${desc}</div>
    <div class="up-bottom"><span class="node-note"></span><span class="cost-line"></span></div>`;
  btn.addEventListener("click", onClick);
  return btn;
}
function buildMarketPanel() {
  const stall = document.getElementById("market-stall");
  SETTINGS.stall.forEach(u => {
    const btn = marketCard(u.name, u.desc, () => buyStall(u.id), true, BUILDING_ICONS[u.id === "foreman" ? "renderForeman" : u.id] || "");
    stall.appendChild(btn);
    stallRows.push({ u, btn, cost: btn.querySelector(".cost-line"), note: btn.querySelector(".node-note") });
  });
  const shelf = document.getElementById("premium-shelf");
  SETTINGS.premium.forEach(u => {
    const btn = marketCard(u.name, u.desc, () => buyStall(u.id), true, BUILDING_ICONS[u.id] || "★");
    btn.classList.add("premium");
    shelf.appendChild(btn);
    stallRows.push({ u, btn, cost: btn.querySelector(".cost-line"), note: btn.querySelector(".node-note") });
  });
  // Contracts board
  const board = document.getElementById("contract-list");
  SETTINGS.contracts.forEach(c => {
    const row = document.createElement("div");
    row.className = "contract-row";
    const tip = c.rule === "badMarket" ? "Penalties: " + SETTINGS.stall.map(u => u.name + ": " + u.bad).join(" · ") : c.tip;
    row.innerHTML = `<div class="ur-main"><div class="ur-top"><strong>${c.name}</strong>${c.payout ? `<span class="ct-pay">+${c.payout} Scales once</span>` : ""}</div>
      <div class="muted ur-sub">${c.goalText} · <b>${c.ruleText}</b></div>
      ${tip ? `<div class="muted ur-sub ct-tip">${tip}</div>` : ""}
      <div class="ur-sub ct-reward"></div>
      <div class="ur-sub ct-best muted"></div></div>
      <button class="auto-btn ct-take">Take</button>`;
    row.querySelector(".ct-take").addEventListener("click", () => takeContract(c.id));
    board.appendChild(row);
    contractRows.push({ c, row, btn: row.querySelector(".ct-take") });
  });
  const path = document.getElementById("market-path");
  SETTINGS.marketPath.forEach((row, i) => {
    const box = document.createElement("div");
    box.className = "path-row";
    box.innerHTML = `<div class="path-head"><span class="path-num">Deal ${i + 1}</span><span class="muted path-rule"></span><span class="path-cost">${row.cost} Scale${row.cost > 1 ? "s" : ""}</span></div><div class="path-nodes"></div>`;
    const nodesEl = box.querySelector(".path-nodes");
    nodesEl.classList.toggle("choice", row.nodes.length > 1);
    const nodes = row.nodes.map((n, k) => {
      if (k > 0) nodesEl.insertAdjacentHTML("beforeend", `<span class="path-or">or</span>`);
      const btn = marketCard(n.name, n.desc, () => buyNode(n.id));
      btn.classList.add("deal-card");
      nodesEl.appendChild(btn);
      return { n, btn, cost: btn.querySelector(".cost-line"), note: btn.querySelector(".node-note") };
    });
    path.appendChild(box);
    pathRows.push({ row, i, box, rule: box.querySelector(".path-rule"), nodes });
  });
  const list = document.getElementById("sale-milestones");
  SETTINGS.saleMilestones.forEach(m => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="m-req">${m.sales} sale${m.sales > 1 ? "s" : ""}</span><span>${m.text}</span>`;
    list.appendChild(li);
    saleMsRows.push({ m, li });
  });
}
function setCard(btn, state) {
  btn.disabled = state !== "buy";
  btn.classList.toggle("affordable", state === "buy");
  btn.classList.toggle("owned", state === "owned");
  btn.classList.toggle("soon", state === "soon");
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
  stallRows.forEach(r => {
    const owned = ownsStall(r.u.id);
    setCard(r.btn, owned ? "owned" : r.u.soon ? "soon" : canBuyStall(r.u.id) ? "buy" : "locked");
    r.cost.textContent = owned ? "OWNED" : formatWhole(r.u.cost) + " Scales";
  });
  document.getElementById("premium-sec").classList.toggle("locked", !contractDone("badMarket"));
  document.getElementById("premium-note").textContent = contractDone("badMarket") ? "Top-shelf buys" : "Finish the Bad Market contract to open";
  // Contracts
  const cu = contractsUnlocked();
  document.getElementById("contracts-tab").style.display = cu ? "" : "none";
  if (cu) {
    const ac = activeContract();
    document.getElementById("ct-count").textContent = game.contractsDone.length + "/" + SETTINGS.contracts.length;
    document.getElementById("ct-bonus").textContent = game.contractsDone.length;
    const box = document.getElementById("ct-active");
    box.style.display = ac ? "" : "none";
    if (ac) {
      document.getElementById("ct-active-name").textContent = ac.name;
      document.getElementById("ct-active-goal").textContent = ac.goalText + " · " + ac.ruleText;
      document.getElementById("ct-active-progress").textContent = contractProgressText(ac);
    }
    contractRows.forEach(r => {
      const done = contractDone(r.c.id), active = game.contract === r.c.id;
      r.row.classList.toggle("done", done);
      r.row.classList.toggle("active", active);
      r.btn.textContent = done ? "✓ Done" : active ? "Active" : "Take";
      const rew = r.c.reward + (r.c.mastered ? (contractDone("silentPartner") ? " → " + r.c.mastered + " (Mastery)" : "") : "") + " · +1 Scale per sale";
      r.row.querySelector(".ct-reward").textContent = done ? "Reward active: " + rew : rew;
      r.row.querySelector(".ct-best").textContent = done ? "" : contractBestText(r.c);
      r.btn.disabled = done || active || !!game.contract;
    });
  }
  const all = saleMilestoneReached("allInRow");
  pathRows.forEach(pr => {
    const open = rowOpen(pr.i), soonRow = rowSoon(pr.row);
    pr.box.classList.toggle("locked", !open);
    pr.box.querySelector(".path-cost").style.display = soonRow ? "none" : "";
    const choice = pr.row.nodes.length > 1;
    const chosen = rowPicks(pr.i) > 0;
    pr.rule.textContent = soonRow ? "Coming soon" : !open ? "Sealed" : chosen && !all ? "✓ Signed" : !choice ? "" : all ? "Sign with any" : "Pick one merchant";
    pr.rule.classList.toggle("chosen", chosen && !all);
    pr.box.classList.toggle("signed", chosen);
    pr.nodes.forEach(r => {
      const owned = hasNode(r.n.id);
      // Passed over: another option in this row was chosen (only Respec, or the sale-25 milestone, reopens it)
      const passed = !owned && choice && chosen && !all && !r.n.soon;
      setCard(r.btn, owned ? "owned" : r.n.soon ? "soon" : canBuyNode(r.n.id) ? "buy" : "locked");
      r.btn.classList.toggle("passed", passed);
      r.cost.textContent = owned || passed ? "" : r.n.soon ? "Soon" : open ? "Sign · " + formatWhole(pr.row.cost) : "";
      r.note.textContent = r.n.id === "veteranBreeder" && !passed ? "×" + format(veteranBonus(), 2) + " now" : "";
    });
  });
  const respec = document.getElementById("respec-btn");
  respec.disabled = !game.marketPath.length;
  respec.textContent = game.respecQueued ? "Cancel respec" : "Respec";
  respec.classList.toggle("on", !!game.respecQueued);
  document.getElementById("respec-note").textContent = game.respecQueued ? "Resets at your next sale" : game.respecOpen ? "Free now" : "Free, at your next sale";
  saleMsRows.forEach(r => r.li.classList.toggle("done", game.sales >= r.m.sales));
  document.getElementById("sale-pay").textContent = "+" + formatWhole(gain) + " Scale" + (gain.eq(1) ? "" : "s");
  const stallBuy = SETTINGS.stall.some(u => canBuyStall(u.id));
  const pathBuy = SETTINGS.marketPath.some(r => r.nodes.some(n => canBuyNode(n.id)));
  document.getElementById("stall-dot").style.display = stallBuy ? "" : "none";
  document.getElementById("path-dot").style.display = pathBuy ? "" : "none";
  document.getElementById("market-dot").style.display =
    SETTINGS.stall.some(u => canBuyStall(u.id)) || SETTINGS.marketPath.some(r => r.nodes.some(n => canBuyNode(n.id))) ? "" : "none";
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
        <div class="muted">Level-ups cost Acres: ${b.baseCost}${b.stepEvery ? ", rising +1 per level, and the rise grows by 1 every " + b.stepEvery + " levels" : b.costStep ? ", then +" + b.costStep + " per level" : " each"}</div>`;
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
  const panelVisible = game.expands > 0 || game.acres.gt(0) || game.plots.length > 0;
  if (!panelVisible) return;
  const grid = document.getElementById("plots");
  const key = JSON.stringify([game.siloUnlocked]);
  if (key !== farmKey) {
    farmKey = key;
    grid.innerHTML = "";
    SETTINGS.buildings.forEach(b => {
      const card = document.createElement("div");
      if (!buildingAvailable(b)) {
        card.className = "plot locked";
        card.innerHTML = `<span class="bld-icon">${BUILDING_ICONS.empty}</span><div class="ur-main"><div class="ur-top"><strong>Empty plot</strong></div>
          <div class="muted ur-sub">A new building appears when your coins first reach ${formatWhole(new Decimal(SETTINGS.coinCap))}</div></div>`;
      } else {
        card.className = "plot plot-row";
        card.dataset.building = b.id;
        card.innerHTML = `
          <span class="bld-icon">${BUILDING_ICONS[b.id] || ""}</span>
          <div class="ur-main">
            <div class="ur-top"><strong>${b.name}</strong><span class="lvl"></span></div>
            <div class="muted ur-sub">${b.desc} · now <span class="eff"></span></div>
          </div>
          <button class="lvl-btn"></button>`;
        card.querySelector(".lvl-btn").addEventListener("click", () => upgradeBuilding(b.id));
      }
      grid.appendChild(card);
    });
  }
  grid.querySelectorAll(".plot[data-building]").forEach(card => {
    const id = card.dataset.building;
    const cost = buildingCost(id);
    const lvl = buildingLevel(id);
    card.classList.toggle("unbuilt", lvl === 0);
    card.querySelector(".lvl").textContent = "Lv " + lvl + (buildingDef(id).maxLevel !== undefined ? "/" + buildingDef(id).maxLevel : "");
    card.querySelector(".eff").textContent = buildingEffectText(id);
    const btn = card.querySelector(".lvl-btn");
    btn.textContent = buildingMaxed(id) ? "Max" : (lvl === 0 ? "Build · " : "+1 · ") + formatWhole(cost) + " Acre" + (cost.eq(1) ? "" : "s");
    btn.disabled = buildingAtCap(id) || game.acres.lt(cost) || (contractRule("bld10") && lvl >= 10);
  });
  const avail = SETTINGS.buildings.filter(buildingAvailable);
  document.getElementById("plot-count").textContent = avail.filter(b => buildingPlaced(b.id)).length + "/" + avail.length;
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
  return game.expandRevealed || game.expands > 0 || game.acres.gt(0) || game.sales > 0
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
    ["Offline cap", offlineCapHours() + "h"],
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
    ["Best Goo levels (Goo Seed)", GOO_SEED_IDS.map(id => (game.lifetime.bestGoo || {})[id] || 0).join(" / ")],
    ["Scales: have / earned / per sale now", formatWhole(game.scales) + " / " + formatWhole(game.totalScales) + " / " + formatWhole(scalesForSale())],
    ["Contracts done", game.contractsDone.length + "/" + SETTINGS.contracts.length + (activeContract() ? " · active: " + activeContract().name : "")],
    ["Auto settings", "Render " + (game.autoRender.on ? game.autoRender.mode + (game.autoRender.pauseOn ? " pause " + game.autoRender.pausePct + "%" : "") : "off")
      + " · Expand " + (game.autoAcres.on ? game.autoAcres.mode + " " + game.autoAcres.value + (game.autoAcres.waitFull ? (game.autoAcres.smartWait ? " smart " + game.autoAcres.smartSecs + "s" : " wait full") : "") : "off")],
  ];
}
// Stats screen: short grouped cards (the long Render/Expand logs only go into Copy stats)
function statsSections() {
  const st = game.stats, sales = st.saleLog || [];
  const t = x => x === null || x === undefined ? "not yet" : formatTime(x);
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const last5 = sales.slice(-5);
  const fastest = sales.length ? sales.reduce((a, b) => b.took < a.took ? b : a) : null;
  return [
    { title: "This farm", rows: [
      ["Time since last sale", formatTime(st.playTime - (st.saleStart || 0))],
      ["Expands · farm growths", game.expands + " · " + game.farmGrowths],
      ["Farm filled", Math.floor(farmFillPct()) + "% of " + formatWhole(farmCapacity())],
      ["This Expand", formatTime(st.playTime - st.expandStart) + " · " + st.rendersThisExpand + " Renders"],
      ["This run (since last Render)", formatTime(st.playTime - st.runStart)],
      ["Acres earned this farm", formatWhole(game.farm.acresEarned || 0)],
      ["Goo levels (Power / Growth / Deep)", essLevel("gooPower") + " / " + essLevel("slimeGrowth") + " / " + essLevel("deepGoo")],
      ...(activeContract() ? [["Active contract", activeContract().name + " · " + contractProgressText(activeContract())]] : []),
    ] },
    { title: "Sales", rows: [
      ["Farms sold", String(game.sales) + (st.firstSale !== null ? " · first at " + formatTime(st.firstSale) : "")],
      ["Last sale took", sales.length ? formatTime(sales[sales.length - 1].took) + " · " + sales[sales.length - 1].expands + " Expands" : "not yet"],
      ["Average of last 5", last5.length ? formatTime(avg(last5.map(e => e.took))) : "not yet"],
      ["Fastest sale", fastest ? formatTime(fastest.took) + " (sale " + fastest.n + ")" : "not yet"],
      ["Scales per sale now", formatWhole(scalesForSale())],
      ["Scales have / earned", formatWhole(game.scales) + " / " + formatWhole(game.totalScales)],
      ["Contracts done", game.contractsDone.length + " / " + SETTINGS.contracts.length],
    ], table: last5.length ? `<tr><th>#</th><th>Took</th><th>Expands</th><th>Scales</th></tr>` +
      last5.slice().reverse().map(e => `<tr><td>${e.n}</td><td>${formatTime(e.took)}</td><td>${e.expands}</td><td>+${e.scales}</td></tr>`).join("") : "" },
    { title: "Records", rows: [
      ["Best Goo from one Render", formatWhole(new Decimal(game.bestRenderGoo || st.bestGoo))],
      ["Best Goo levels", GOO_SEED_IDS.map(id => (game.lifetime.bestGoo || {})[id] || 0).join(" / ")],
      ["Most Acres from one farm", formatWhole(game.bestFarmAcres || 0)],
      ["Most Expands on one farm", String(game.maxExpandsEver || 0)],
      ["Renders · Expands · growths (lifetime)", game.lifetime.renders + " · " + game.lifetime.expands + " · " + game.lifetime.growths],
      ["First Render · Expand", t(st.firstRender) + " · " + t(st.firstExpand)],
    ] },
    { title: "Time", rows: [
      ["Play time (normal speed)", formatTime(st.playTime)],
      ["Real time spent", formatTime(st.realTime || st.playTime) + (game.prefs.fastTest ? " · 10× ON" : "")],
      ["Offline time received", formatTime(st.offlineTime) + " · cap " + offlineCapHours() + "h" + (game.prefs.offline ? "" : " (off)")],
    ] },
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
    lines.push("", "Sales: # | at | took | real time | expands | growths | renders | acres earned | scales | contract");
    st.saleLog.forEach(e => lines.push([e.n, formatTime(e.at), formatTime(e.took), e.real !== undefined ? formatTime(e.real) : "?", e.expands, e.growths ?? "?",
      e.renders ?? "?", e.acres ?? "?", "+" + e.scales, e.contract || "-"].join(" | ")));
  }
  lines.push("", "Renders (first 10, then the latest 50): # | at | run | Goo");
  st.renderLog.forEach(r => lines.push([r[0], formatTime(r[1]), formatTime(r[2]), formatWhole(new Decimal(r[3]))].join(" | ")));
  if (st.events.length) lines.push("", "Events:", ...st.events);
  return lines.join("\n");
}
// Where every bonus comes from (Settings > Stats). Only active ones (not ×1) are listed.
function bonusBreakdown() {
  const D = x => new Decimal(x);
  const groups = [];
  const add = (title, rows, total) => {
    const shown = rows.filter(([, v]) => v !== null && !D(v).eq(1));
    groups.push({ title, rows: shown, total });
  };
  const m = id => expandMilestoneReached(id);
  add("All slime tiers", [
    ["Fast Digestion (coin upgrade)", upgradeEffect("digestion")],
    ["Nursery (building)", buildingEffect("nursery")],
    ["Veteran Breeder (Deal)", veteranBonus()],
    ["Golden Pens (Premium Shelf)", hasStall("goldenPens") ? 10 : 1],
  ]);
  add("Tier 1 coins (extra)", [
    ["Shiny Coins (coin upgrade)", upgradeEffect("richGoo")],
    ["Render milestone 2", renderBonus("t1Coins") ? 2 : 1],
    ["Goo Power (Goo upgrade)", essEffect("gooPower")],
  ]);
  add("Other tier boosts", [
    ["Slime Growth, Tiers 2–4 (Goo)", essEffect("slimeGrowth")],
    ["Deep Goo, Tiers 5–8 (Goo)", essEffect("deepGoo")],
    ["Small Pens, Tiers 1–4 (Contract)", contractMult("smallPens", 3, 5)],
    ["Purchase milestones, each", milestoneMultValue()],
  ]);
  add("Slime prices", [
    ["Bargain Pens (coin upgrade)", upgradeEffect("bargain")],
    ["Slime Discount (Goo upgrade)", essEffect("cheapSlimes")],
    ["Render milestone 10", renderBonus("cheaperSlimes") ? 0.8 : 1],
  ]);
  add("Goo from every Render", [
    ["Goo Vat (building)", buildingEffect("gooVat")],
    ["Trade Deals", pathGooMult()],
    ["Farm growths (Expand milestone 10)", m("gooPerExpand") ? 1 + 0.1 * game.farmGrowths : 1],
    ["Render milestone 5", renderBonus("moreGoo") ? 1.25 : 1],
    ["Sale milestone 1", saleMilestoneReached("gooDouble") ? 2 : 1],
    ["Raw Slime (Contract)", contractMult("rawSlime", 2, 3)],
    ["Deep Vats (Premium Shelf)", hasStall("deepVats") ? 5 : 1],
  ], "×" + format(gooMultiplier(), 2) + (essPower("richerRender") ? " · +" + essPower("richerRender") + " base Goo (Richer Render)" : ""));
  add("Acres from every Expand", [
    ["Trade Deals, Stall, Contracts", pathAcreMult()],
    ["Full farm", farmFull() ? SETTINGS.fullFarmBonus : 1],
  ]);
  const base = SETTINGS.scalesPerSale + game.contractsDone.length;
  add("Scales from every sale", [
    ["Better Broker (Deal)", hasNode("betterBroker") ? 2 : 1],
    ["Top Broker (Deal)", hasNode("topBroker") ? 2 : 1],
    ["Quick Flip (Contract)", contractMult("quickFlip", 2, 3)],
    ["Merchants signed (×" + SETTINGS.scaleDealMult + " each)", Math.pow(SETTINGS.scaleDealMult, game.marketPath.length)],
    ["Stall items owned (×" + SETTINGS.scaleStallMult + " each)", Math.pow(SETTINGS.scaleStallMult, stallOwnedCount())],
    ["Sale milestone 10", saleMilestoneReached("doubleScales") ? 2 : 1],
  ], "Base " + base + " (1 + " + game.contractsDone.length + " from Contracts) → " + formatWhole(scalesForSale()) + " per sale");
  return groups;
}
function renderBonusBreakdown() {
  const html = bonusBreakdown().map(g => {
    const rows = g.rows.length ? g.rows.map(([k, v]) => `<div class="stat-row"><span>${k}</span><b>×${format(new Decimal(v), 2)}</b></div>`).join("")
      : `<div class="stat-row muted"><span>Nothing yet</span></div>`;
    return `<div class="bonus-group"><div class="bonus-title">${g.title}${g.total ? `<span class="muted"> · ${g.total}</span>` : ""}</div>${rows}</div>`;
  }).join("");
  const box = document.getElementById("stats-bonuses");
  if (box.innerHTML !== html) box.innerHTML = html;
}
// ===== Achievements tab (Settings) =====
const achRows = [];
function buildAchievements() {
  const list = document.getElementById("ach-list");
  SETTINGS.achievements.forEach(a => {
    const el = document.createElement("div");
    el.className = "ach-card " + a.kind;
    el.innerHTML = `<div class="ach-top"><span class="ach-badge"></span><strong>${a.name}</strong>${a.kind === "challenge" ? `<span class="ach-tag">Challenge</span>` : ""}</div>
      <div class="muted ach-goal">${a.goal}</div>
      <div class="ach-reward">${a.reward}</div>
      ${a.kind === "life" ? `<div class="bar ach-bar"><div class="fill"></div></div><div class="muted ach-prog"></div>` : ""}`;
    list.appendChild(el);
    achRows.push({ a, el, fill: el.querySelector(".fill"), prog: el.querySelector(".ach-prog"), badge: el.querySelector(".ach-badge") });
  });
}
function achPanelOpen() {
  const p = document.getElementById("sub-ach");
  return currentTier === "settings" && p && p.classList.contains("active");
}
function renderAchievements() {
  const earned = game.achievements.length;
  // Dot on the Settings tab for achievements you haven't looked at yet
  if (achPanelOpen()) game.achSeen = earned;
  const newOnes = earned > (game.achSeen || 0);
  document.getElementById("settings-dot").style.display = newOnes ? "" : "none";
  document.getElementById("ach-dot").style.display = newOnes ? "" : "none";
  if (!achPanelOpen()) return;
  const parts = [["all slimes", achBuff("slimes")], ["Goo", achBuff("goo")], ["Acres", achBuff("acres")], ["Scales", achBuff("scales")], ["coin upgrades", achBuff("coinUps")]]
    .filter(([, m]) => m > 1).map(([k, m]) => k + " ×" + format(new Decimal(m), 2));
  document.getElementById("ach-summary").textContent = earned + "/" + SETTINGS.achievements.length + " earned" +
    (parts.length ? " · " + parts.join(" · ") : "") + " · offline cap " + offlineCapHours() + "h";
  achRows.forEach(r => {
    const done = hasAch(r.a.id);
    r.el.classList.toggle("done", done);
    r.badge.textContent = done ? "✓" : r.a.kind === "challenge" ? "★" : "○";
    if (r.fill) {
      const v = new Decimal(achStat(r.a)), t = new Decimal(r.a.target);
      const p = done ? 1 : (t.gt(1e6) ? Math.min(1, v.max(1).log10().div(t.log10()).toNumber()) : Math.min(1, v.div(t).toNumber()));
      r.fill.style.width = (p * 100).toFixed(1) + "%";
      r.prog.textContent = done ? "Done" : formatWhole(v.min(t)) + " / " + formatWhole(t);
    }
  });
}
function renderStats() {
  const panel = document.getElementById("sub-stats");
  if (!panel || !panel.classList.contains("active")) return;
  renderBonusBreakdown();
  const html = statsSections().map(sec => `<div class="stats-box"><div class="bonus-title">${sec.title}</div>` +
    sec.rows.map(([k, v]) => `<div class="stat-row"><span>${k}</span><b>${v}</b></div>`).join("") +
    (sec.table ? `<div class="table-wrap"><table class="stats-table">${sec.table}</table></div>` : "") + `</div>`).join("");
  const box = document.getElementById("stats-summary");
  if (box.innerHTML !== html) box.innerHTML = html;
}

function render() {
  if (catchingUp) return;
  checkIntros();
  renderAchievements();
  document.getElementById("coins").textContent = formatWhole(game.coins);
  document.getElementById("cps").textContent = formatWhole(coinsPerSecond());
  // Upgrades (steady look while Upgrade Helper is buying them, so nothing flashes)
  const helperActive = autoActive() && essLevel("upgradeHelper") > 0 && game.autoUpgrades;
  upgradeRows.forEach(r => {
    r.btn.classList.toggle("auto-handled", helperActive);
    const maxed = upgradeMaxed(r.id);
    const cost = upgradeCost(r.id);
    const lvl = upgradeLevel(r.id);
    const max = upgradeDef(r.id).maxLevel;
    r.lvl.textContent = lvl + (max !== null ? "/" + max : "");   // strip: just the number
    r.eff.textContent = "×" + format(upgradeEffect(r.id), 2);
    r.cost.textContent = maxed ? "MAXED" : formatWhole(cost.ceil());
    r.btn.disabled = maxed || game.coins.lt(cost);
    r.btn.classList.toggle("affordable", !r.btn.disabled);
    r.btn.classList.toggle("maxed", maxed);
  });

  // Master automation switch (shows once any automation is unlocked)
  const anyAuto = SETTINGS.tiers.some((t, i) => autoUnlocked(i)) || essLevel("upgradeHelper") > 0
    || hasAutoRender() || expandMilestoneReached("autoGoo");
  const capNote = document.getElementById("offline-cap-note");
  const capText = "Up to " + offlineCapHours() + "h away. Doubled by achievements: Goo Master, Surveyor, Trader (" +
    offlineDoublers().filter(([, on]) => on).length + "/3 so far).";
  if (capNote.textContent !== capText) capNote.textContent = capText;
  const master = document.getElementById("master-auto");
  master.textContent = game.automationOn ? "ON" : "OFF";
  master.classList.toggle("on", game.automationOn);
  document.body.classList.toggle("auto-paused", !autoActive());

  // Farm capacity notice under the coin counter
  const notice = document.getElementById("farm-notice");
  // Farm complete = slimes at max size: Sell the Farm is ready
  if (saleReady()) notice.textContent = "Farm complete";
  else if (coinsAtLimit()) notice.textContent = buildingPlaced("silo") ? "Coins full · level your Coin Silo" : game.siloUnlocked ? "Coins full · build a Coin Silo" : "Coins full";
  else if (farmFull()) notice.textContent = "Farm full · ×" + SETTINGS.fullFarmBonus + " Acres";
  else notice.textContent = "";
  notice.style.display = notice.textContent ? "" : "none";

  // Expand button, popup, and Auto-Render settings
  const showExpand = expandTeased();
  // Estate stays visible once you've sold a farm (you've already played through it)
  const showAcres = game.expands > 0 || game.acres.gt(0) || game.sales > 0;
  // The Farm tab card only appears once Expand is actually available
  document.getElementById("expand-row").style.display = slimesReadyForExpand() ? "" : "none";
  document.getElementById("expand-btn").style.display = showAcres ? "" : "none";
  document.getElementById("farm-tab").style.display = showAcres ? "" : "none";
  document.getElementById("expand-btn-amount").textContent = formatWhole(game.acres);
  // Dots: something to do in the Estate (an affordable Acre upgrade, or an empty plot with a building to place)
  const canPlace = false;
  const estateDot = SETTINGS.buildings.some(b => buildingAvailable(b) && !buildingMaxed(b.id) && game.acres.gte(buildingCost(b.id)));
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
    : "Tier 1 slimes: " + formatWhole(t1) + " / " + formatWhole(capNow) + " (farm capacity)";
  // Quiet hint about whether this Expand will grow the farm (only once Expand is available)
  document.getElementById("grow-hint").textContent = (atTrueCap() || !slimesReadyForExpand()) ? ""
    : expandWillGrow() ? "Your farm is full: Expanding now will grow it ×" + nextGrowthText() + "."
    : "Fill your farm to " + formatWhole(capNow) + " Tier 1 slimes for it to grow when you Expand.";
  // Big Expand button in the top bar: only shows once Expand is unlocked
  const topExp = document.getElementById("top-expand");
  // Shows (greyed out) once you're near Expand or have Expanded before
  topExp.style.display = showExpand && expandUnlocked() ? "" : "none";
  topExp.disabled = !expandUnlocked();
  const gainTop = acreGain();
  const t1Log = game.tiers[0].owned.lte(1) ? 0 : game.tiers[0].owned.log10().toNumber();
  const goalLog = new Decimal(SETTINGS.expandGoal).log10().toNumber();
  // Ready: show the reward. Not ready: list both needs (farm full, Goo), each with a check when met
  const subEl = document.getElementById("top-expand-sub");
  if (expandUnlocked()) {
    subEl.textContent = "+" + formatWhole(gainTop) + " Acre" + (gainTop.eq(1) ? "" : "s") + (expandWillGrow() ? " · grows" : " · no growth");
  } else {
    subEl.textContent = "Locked";
  }
  // Bar on the button: progress to the next Acre (the goal bar below covers the unlock)
  document.getElementById("top-expand-fill").style.width = (expandUnlocked()
    ? nextAcreProgress() * 100 : 0).toFixed(1) + "%";
  topExp.title = !expandUnlocked() ? "Expand unlocks at " + formatWhole(SETTINGS.expandGoal) + " Tier 1 slimes. A full farm also grows when you Expand."
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
  expandMsRows.forEach(r => r.li.classList.toggle("done", expandMsDone(r.m)));
  const emsDone = SETTINGS.expandMilestones.filter(expandMsDone).length;
  document.getElementById("ems-badge").textContent = emsDone + "/" + SETTINGS.expandMilestones.length;
  const nextEms = SETTINGS.expandMilestones.find(m => !expandMsDone(m));
  document.getElementById("next-ems").textContent = nextEms ? "Next at " + nextEms.expands + ": " + nextEms.text.split(":")[0].replace("Start each Expand with ", "Keep ") : "All done";
  const arBox = document.getElementById("auto-render-box");
  document.getElementById("auto-render-sec").style.display = hasAutoRender() ? "" : "none";
  const arToggle = document.getElementById("ar-toggle");
  arToggle.textContent = game.autoRender.on ? "ON" : "OFF";
  arToggle.classList.toggle("on", game.autoRender.on);
  const arm = game.autoRender.mode;
  const arv = document.getElementById("ar-value");
  if (document.activeElement !== arv && Number(arv.value) !== game.autoRender.value) arv.value = game.autoRender.value;
  const armSel = document.getElementById("ar-mode");
  if (armSel.value !== arm) armSel.value = arm;
  document.getElementById("ar-unit").textContent = { goo: "Goo", time: "sec", best: "", rise: "Goo first" }[arm] || "";
  document.getElementById("ar-value").style.display = arm === "best" ? "none" : "";
  document.getElementById("ar-rise-row").style.display = arm === "rise" ? "" : "none";
  const rx = document.getElementById("ar-rise-x");
  if (document.activeElement !== rx && Number(rx.value) !== game.autoRender.riseX) rx.value = game.autoRender.riseX;

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
  document.getElementById("goo-reserve").textContent = "";
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
  const gooDot = canBuyGoo && !(autoActive() && game.autoGooOn && expandMilestoneReached("autoGoo"));
  document.getElementById("goo-dot").style.display = gooDot ? "" : "none";
  document.getElementById("goo-sub-dot").style.display = gooDot ? "" : "none";
  document.getElementById("ess-amount").textContent = formatWhole(game.essence);
  document.getElementById("render-count").textContent = game.renders;
  const gooAutoActive = autoActive() && game.autoGooOn && expandMilestoneReached("autoGoo");
  essRows.forEach(r => {
    const maxed = essMaxed(r.id);
    const cost = essCost(r.id);
    const lvl = essLevel(r.id);
    const max = essDef(r.id).maxLevel;
    r.lvl.textContent = "Lv " + lvl + (max !== null ? "/" + max : "");
    // Live: a Render right now makes this farm the "last farm", so show what that would give
    r.eff.textContent = r.id === "richerRender" ? "+" + lvl + " Goo"
      : r.id === "upgradeHelper" ? (lvl > 0 ? "Owned" : "Not owned")
      : "×" + format(essEffect(r.id), 2);
    r.cost.textContent = maxed ? (max === 1 ? "OWNED" : "MAXED") : formatWhole(cost) + " Goo";
    r.btn.classList.toggle("auto-handled", gooAutoActive);
    r.btn.disabled = maxed || game.essence.lt(cost) || contractRule("noGoo");
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
  // At max size: fill the farm to sell it
  const sellMode = reached && slimesReadyForExpand() && atTrueCap() && !saleReady();
  goalBar.classList.toggle("expand-mode", expandGoalMode || fillMode);
  goalBar.classList.toggle("sell-mode", sellMode);
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
    const base = new Decimal(SETTINGS.expandGoal).log10().toNumber();
    const fillPct = (t1f.max(1).log10().toNumber() - base) / Math.max(1, capF.log10().toNumber() - base) * 100;
    document.getElementById("render-fill").style.width = Math.max(0, Math.min(100, fillPct)).toFixed(1) + "%";
    document.getElementById("render-text").textContent = "Tier 1 slimes to fill the farm: " + formatWhole(t1f) + " / " + formatWhole(capF);
  }
  if (sellMode) {
    const t1s = game.tiers[0].owned, capS = farmCapacity();
    const base = new Decimal(SETTINGS.expandGoal).log10().toNumber();
    const sp = (t1s.max(1).log10().toNumber() - base) / Math.max(1, capS.log10().toNumber() - base) * 100;
    document.getElementById("render-fill").style.width = Math.max(0, Math.min(100, sp)).toFixed(1) + "%";
    document.getElementById("render-text").textContent = "Tier 1 slimes to sell the farm: " + formatWhole(t1s) + " / " + formatWhole(capS);
  }
  // Active contract: show its goal instead when it comes sooner (Tier 1 or coin goals, once Render is unlocked)
  const ct = activeContract();
  let contractMode = false;
  if (reached && ct && (ct.goal === "t1" || ct.goal === "coins") && !contractGoalMet(ct)) {
    const target = new Decimal(ct.target);
    const nextGoal = slimesReadyForExpand() ? farmCapacity() : new Decimal(SETTINGS.expandGoal);
    contractMode = ct.goal === "coins" || target.lte(nextGoal);   // same target as the next goal: show the contract
    if (contractMode) {
      const have = ct.goal === "t1" ? game.tiers[0].owned : game.coins;
      const pctC = have.lte(1) ? 0 : Math.min(100, have.log10().div(target.log10()).toNumber() * 100);
      document.getElementById("render-fill").style.width = pctC.toFixed(1) + "%";
      document.getElementById("render-text").textContent = "Contract " + ct.name + ": " + formatWhole(have) + " / " + formatWhole(target) + (ct.goal === "t1" ? " Tier 1" : " coins");
    }
  }
  goalBar.classList.toggle("contract-mode", contractMode);
  goalBar.style.display = (!reached || expandGoalMode || fillMode || sellMode || contractMode) ? "" : "none";
  const rbtn = document.getElementById("render-btn");
  rbtn.disabled = !reached;
  rbtn.style.display = reached ? "" : "none";
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
    r.row.classList.toggle("contract-locked", i >= 4 && contractRule("lowTiers"));
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
    r.row.classList.toggle("auto-handled", autoActive() && autoUnlocked(i) && !!game.autobuy[i]);
    r.buyOne.disabled = !canAfford;
    r.mult.textContent = "×" + format(tierMultiplier(i), 2) + (freeMilestones(i) ? " (" + freeMilestones(i) + " free)" : "");
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
  if (catchingUp) return;
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
    buildingsAtZero: true,
    siloUnlocked: game.siloUnlocked,
    scales: game.scales.toString(),
    totalScales: game.totalScales.toString(),
    sales: game.sales,
    stall: game.stall,
    marketPath: game.marketPath,
    respecOpen: game.respecOpen,
    respecQueued: !!game.respecQueued,
    seenIntros: game.seenIntros,
    contract: game.contract,
    contractStart: game.contractStart,
    contractsDone: game.contractsDone,
    contractBest: game.contractBest,
    maxExpandsEver: game.maxExpandsEver,
    bestRenderGoo: new Decimal(game.bestRenderGoo || 0).toString(),
    maxRendersEver: game.maxRendersEver, bestFarmAcres: game.bestFarmAcres || 0,
    achievements: game.achievements, achSeen: game.achSeen, lifetime: game.lifetime,
    expandFlags: game.expandFlags, runFlags: game.runFlags,
    farm: game.farm,
    marketPathRework: true,
    autoExpandOn: game.autoExpandOn,
    autoAcres: game.autoAcres,
    autoBuildOn: game.autoBuildOn,
    autoSellOn: game.autoSellOn,
    gooStars: game.gooStars,
    buildStars: game.buildStars,
    farmGrowths: game.farmGrowths,
    autoGooOn: game.autoGooOn,
    plots: game.plots,
    paidPlots: game.paidPlots,
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
  // Plots are bought again: older saves keep the plots they already had
  game.paidPlots = data.paidPlots !== undefined ? data.paidPlots : Math.min(SETTINGS.plotCosts.length, (data.plots || []).length);
  if (data.buildingLevels) Object.assign(game.buildingLevels, data.buildingLevels);
  // Buildings at level 0 rework: Acres spent on plots that never got a building come back
  if (!data.buildingsAtZero) {
    const placed = (data.plots || []).filter(Boolean).filter(id => id !== "silo").length;
    const paid = data.paidPlots !== undefined ? data.paidPlots : placed;
    let refund = 0;
    for (let k = placed; k < paid; k++) refund += SETTINGS.plotCosts[k] || 0;
    if (refund) game.acres = game.acres.add(refund);
    SETTINGS.buildings.forEach(b => { if (!(data.plots || []).includes(b.id)) game.buildingLevels[b.id] = 0; });
  }
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
  if (game.autoRender.mode === "mult") { game.autoRender.mode = "rise"; game.autoRender.value = 10; }   // "Goo ×" became Rising target
  if (!game.autoRender.riseX) game.autoRender.riseX = 1.2;
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
  if (data.stall) game.stall = data.stall;
  if (data.marketPath) game.marketPath = data.marketPath;
  if (data.respecOpen !== undefined) game.respecOpen = data.respecOpen;
  if (data.respecQueued) game.respecQueued = true;
  // Unlock cards: older saves skip the ones for layers they've already reached
  if (data.seenIntros) game.seenIntros = data.seenIntros;
  else {
    if (game.renders > 0 || game.expands > 0 || game.sales > 0) game.seenIntros.push("render", "auto");
    if (game.expands > 0 || game.sales > 0) game.seenIntros.push("expand");
    if (game.sales > 0) game.seenIntros.push("sell");
  }
  if (data.contract !== undefined) game.contract = data.contract;
  if (data.contractStart) game.contractStart = data.contractStart;
  if (data.contractsDone) game.contractsDone = data.contractsDone;
  if (data.contractBest) game.contractBest = data.contractBest;
  // Contract rework: Lean Farm became Bad Market (it opened the Premium Shelf, so a finished one counts as Bad Market)
  if (game.contractsDone.includes("leanFarm")) game.contractsDone = game.contractsDone.filter(id => id !== "leanFarm").concat(game.contractsDone.includes("badMarket") ? [] : ["badMarket"]);
  if (game.contract === "leanFarm") game.contract = null;
  if (game.marketPath.includes("seasoned")) { game.marketPath = game.marketPath.filter(id => id !== "seasoned"); game.scales = game.scales.add(6); }
  if (game.marketPath.includes("oldMoney")) { game.marketPath = game.marketPath.filter(id => id !== "oldMoney"); game.scales = game.scales.add(25); }
  game.maxExpandsEver = Math.max(data.maxExpandsEver || 0, game.expands || 0);
  if (data.farm) Object.assign(game.farm, data.farm);
  game.bestRenderGoo = new Decimal(data.bestRenderGoo || (data.stats && data.stats.bestGoo) || 0);
  game.maxRendersEver = Math.max(data.maxRendersEver || 0, game.renders || 0);
  game.bestFarmAcres = Math.max(data.bestFarmAcres || 0, data.lastFarmAcres || 0);
  if (data.achievements) game.achievements = data.achievements;
  if (data.achSeen !== undefined) game.achSeen = data.achSeen;
  if (data.lifetime) Object.assign(game.lifetime, data.lifetime);
  else {   // older saves: start lifetime counts from what the save already shows
    game.lifetime.renders = (game.stats && game.stats.renderLog ? game.stats.renderLog.length : 0) || game.maxRendersEver || 0;
    game.lifetime.expands = (game.stats && game.stats.expandLog ? game.stats.expandLog.length : 0);
    game.lifetime.sales = game.sales || 0;
  }
  if (!game.lifetime.bestGoo) game.lifetime.bestGoo = { gooPower: 0, slimeGrowth: 0, deepGoo: 0 };
  GOO_SEED_IDS.forEach(id => noteBestGoo(id));   // older saves: start from the current levels
  if (data.expandFlags) Object.assign(game.expandFlags, data.expandFlags);
  if (data.runFlags) Object.assign(game.runFlags, data.runFlags);
  // Stall rework: the four separate smart-automation buys became Farm Foreman. Refund them.
  const oldStall = { landAgent: 2, gooSteward: 4, estateKeeper: 4, renderForeman: 6, blueprints: 8, foreman: 6, nightShift: 5 };
  Object.entries(oldStall).forEach(([id, cost]) => { if (game.stall[id]) { delete game.stall[id]; game.scales = game.scales.add(cost); } });
  // Market rework: Broker upgrades removed. Automation ones become Stall buys; Scales spent on the rest come back.
  if (!data.marketPathRework && data.brokerUpgrades) {
    const b = data.brokerUpgrades, old = { betterBroker: [1, 3], gooBuyers: [1, 2], landDeals: [2, 2], surveyed: [3, 3] };
    let refund = 0;
    Object.entries(old).forEach(([id, [base, growth]]) => { for (let l = 0; l < (b[id] || 0); l++) refund += Math.round(base * Math.pow(growth, l)); });
    game.scales = game.scales.add(refund);
  }
  if (data.autoExpandOn !== undefined) game.autoExpandOn = data.autoExpandOn;
  if (data.autoAcres) Object.assign(game.autoAcres, data.autoAcres);
  if (data.autoBuildOn !== undefined) game.autoBuildOn = data.autoBuildOn;
  if (data.autoSellOn !== undefined) game.autoSellOn = data.autoSellOn;
  if (game.essUpgrades) delete game.essUpgrades.headStart;
  if (game.stall && game.stall.farmManager) { delete game.stall.farmManager; game.scales = game.scales.add(3); }
  if (data.gooStars) game.gooStars = data.gooStars;
  if (data.buildStars) game.buildStars = data.buildStars;
  // Offline progress: count time away, up to the cap (none if switched off in Settings)
  const maxMs = offlineCapHours() * 3600 * 1000;
  game.lastTick = game.prefs.offline ? Math.max(data.lastTick, Date.now() - maxMs) : Date.now();
}
// Testing: jump to the start of a run after `n` full Expands, with the Acres those Expands would have
// given (unspent, buildings unplaced). Scales, Market upgrades, settings, and stats are kept.
function jumpToExpand() {
  const n = Math.max(0, Math.floor(+document.getElementById("jump-n").value || 0));
  if (!confirm("Jump to the start of a run after " + n + " full Expands?\n\nYou'll get the Acres those Expands give (unspent) and empty plots. Your current farm, Goo, and buildings reset. Scales, Market upgrades, settings, and stats are kept.")) return;
  const keep = { prefs: game.prefs, stats: game.stats, autobuy: game.autobuy, autoUpgrades: game.autoUpgrades, automationOn: game.automationOn,
    autoGooOn: game.autoGooOn, autoRender: game.autoRender, autoModes: game.autoModes, buyMode: game.buyMode, autoSeen: game.autoSeen,
    scales: game.scales, totalScales: game.totalScales, sales: game.sales, stall: game.stall, marketPath: game.marketPath, respecOpen: game.respecOpen, seenIntros: game.seenIntros, contract: game.contract, contractsDone: game.contractsDone, contractBest: game.contractBest, maxExpandsEver: game.maxExpandsEver, autoExpandOn: game.autoExpandOn, autoAcres: game.autoAcres, autoBuildOn: game.autoBuildOn, autoSellOn: game.autoSellOn, gooStars: game.gooStars, buildStars: game.buildStars };
  game = newGame();
  Object.assign(game, keep);
  game.expands = n;
  game.farmGrowths = n;
  game.acres = new Decimal(n * (n + 1) / 2);   // Expand k (from a full farm) gives k Acres
  game.renders = n >= 2 ? 40 : 0;              // Render milestones are kept from Expand 2 on
  game.expandRevealed = n > 0;
  resetExpand(game);
  syncPlots();
  statEvent("Jumped to Expand " + n + " (testing)");
  farmKey = "";
  save();
  render();
  toast("Jumped to the start of a run after " + n + " Expands", true);
}
// Testing: start a fresh farm as if you'd sold `n` farms. Going forward adds the Scales those extra
// sales would pay at your current rate. Scales, Market buys, contracts, and achievements are kept.
function jumpToSale() {
  const n = Math.max(0, Math.floor(+document.getElementById("jump-sale-n").value || 0));
  const extra = Math.max(0, n - game.sales);
  if (!confirm("Jump to a fresh farm after " + n + " sales?\n\nYour current farm resets." + (extra ? " You get the Scales " + extra + " more sale" + (extra === 1 ? "" : "s") + " would pay." : " No Scales are given or taken.") + " Scales, Market buys, contracts, settings, and stats are kept.")) return;
  let gain = new Decimal(0);
  for (let k = game.sales; k < n; k++) { game.sales = k; gain = gain.add(scalesForSale()); }   // sale milestones (×2 at 10) count as you pass them
  const keep = Object.assign(farmKeep(), { scales: game.scales.add(gain), totalScales: game.totalScales.add(gain), sales: n });
  keep.lifetime.sales = Math.max(keep.lifetime.sales || 0, n);
  game = newGame();
  Object.assign(game, keep);
  startNewSale(null);
  game.stats.saleStart = game.stats.expandStart = game.stats.runStart = game.stats.playTime;
  statEvent("Jumped to sale " + n + " (testing)");
  farmKey = "";
  save();
  render();
  toast("Jumped to a fresh farm after " + n + " sales" + (gain.gt(0) ? " (+" + formatWhole(gain) + " Scales)" : ""), true);
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
const TIER_OF = { "panel-slimes": "farm", "panel-goo": "farm", "panel-acres": "farm", "panel-market": "market", "panel-path": "market", "panel-contracts": "market", "panel-auto": "auto", "panel-settings": "settings" };
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
  document.getElementById("subnav-market").style.display = currentTier === "market" ? "" : "none";
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
buildAchievements();
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
document.querySelector('[data-sub="sub-stats"]').addEventListener("click", () => setTimeout(renderStats, 0));

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
  game.autoRender.value = { goo: 10, time: 60, best: 0, rise: 10 }[arMode.value];
  game.autoRender.lastGain = 0;
  arValue.value = game.autoRender.value;
  render();
});
document.getElementById("ar-rise-x").addEventListener("change", e => {
  const v = Math.max(1.01, Math.min(100, Number(e.target.value) || 1.2));
  game.autoRender.riseX = v; e.target.value = v;
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
document.getElementById("jump-sale-btn").addEventListener("click", jumpToSale);
document.getElementById("test-sale").addEventListener("click", loadTestSave);
document.getElementById("jump-btn").addEventListener("click", jumpToExpand);
document.getElementById("sell-btn").addEventListener("click", doSell);
document.getElementById("scale-chip").addEventListener("click", () => showTab("panel-market"));
document.getElementById("buy-mode").addEventListener("click", cycleBuyMode);
document.getElementById("auto-expand").addEventListener("click", () => { game.autoExpandOn = !game.autoExpandOn; render(); });
document.getElementById("respec-btn").addEventListener("click", respecPath);
document.getElementById("ct-drop").addEventListener("click", dropContract);
document.getElementById("intro-ok").addEventListener("click", () => document.getElementById("intro-modal").classList.remove("open"));
document.getElementById("away-ok").addEventListener("click", () => document.getElementById("away-modal").classList.remove("open"));
// Wait for full: Off / Always / Smart (Smart needs Growth Spurt)
document.getElementById("auto-wait-full").addEventListener("change", e => {
  const a = game.autoAcres, v = e.target.value;
  a.waitFull = v !== "off";
  a.smartWait = v === "smart" && smartUnlocked("capMode");
  render();
});
document.getElementById("auto-sell").addEventListener("click", () => { game.autoSellOn = !game.autoSellOn; render(); });
document.getElementById("auto-smart-secs").addEventListener("change", e => {
  const v = Math.max(5, Math.min(3600, Math.floor(+e.target.value || 60)));
  game.autoAcres.smartSecs = v; e.target.value = v;
});
document.getElementById("ar-pause").addEventListener("click", () => { game.autoRender.pauseOn = !game.autoRender.pauseOn; render(); });
document.getElementById("ar-pause-pct").addEventListener("change", e => {
  const v = Math.min(100, Math.max(1, Math.round(Number(e.target.value) || 80)));
  game.autoRender.pausePct = v; e.target.value = v;
});
document.getElementById("auto-build").addEventListener("click", () => { game.autoBuildOn = !game.autoBuildOn; render(); });
document.getElementById("auto-acres-mode").addEventListener("change", e => {
  game.autoAcres.mode = e.target.value;
  game.autoAcres.value = e.target.value === "cap" ? 20 : 10;
  document.getElementById("auto-acres-value").value = game.autoAcres.value;
  render();
});
document.getElementById("auto-acres").addEventListener("click", () => { game.autoAcres.on = !game.autoAcres.on; render(); });
const acresValue = document.getElementById("auto-acres-value");
acresValue.value = game.autoAcres.value;
acresValue.addEventListener("change", () => {
  const v = Math.max(1, Math.floor(Number(acresValue.value) || 1));
  game.autoAcres.value = v;
  acresValue.value = v;
});
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
