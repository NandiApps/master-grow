# HydroGrow Game Design Audit
**Date:** 2026-05-15  
**Analyst:** Claude (Cowork)  
**Codebase:** Master Grow project — frontend (React/Vite/TS) + engine (Hono/Cloudflare Workers/TS)  
**Live URL:** https://hydrogrow.pages.dev  
**API:** https://hydrogrow-api.babygrug.workers.dev

---

## A. EXECUTIVE SUMMARY

HydroGrow is a browser-based cannabis hydroponics simulator with a server-side TypeScript simulation engine (Cloudflare Workers) and a React frontend. The engine is architecturally sound — 14-step daily simulation, realistic nutrient chemistry, trichome maturity progression, disease pressure modeling, cannabinoid accumulation. The code reflects genuine domain research and serious structural effort.

The game fails to function at the player experience level. The simulation runs but produces no meaningful player signals: nutrient depletion is calibrated so slowly that N/P/K will never hit deficiency thresholds within a real grow cycle, progress bars never move (stageProgressPercent stuck at 0%), the economy is cosmetic (electricity costs are calculated but never deducted, cash never moves), THCA maxes out to its strain ceiling in one day due to a ×100 rate formula error, and there is no mechanism for the player to add nutrients back to the tank. Players can idle for 180 days without consequences.

**Five biggest failures:**
1. **No consequences for inaction** — nutrients never deplete critically, health stays near 100% by default, cash never decreases. There is literally nothing to respond to.
2. **Broken feedback loops** — stageProgressPercent always 0%, THCA formula error means cannabinoids peak immediately, chlorophyll locked at 50% permanently.
3. **No nutrient dosing system** — nutrients deplete but the `GameDayActionRequest` has no field to add them back. The core hydroponics mechanic (feeding your plants) does not exist.
4. **Serverless state collapse** — game state is in an in-memory `Map` on Cloudflare Workers. Any Worker restart (common at this tier) silently destroys all sessions. The resume-game feature is dead in production.
5. **No visual plant** — there is zero graphical representation of the plant or grow space. Growth is a counter incrementing. The game has no visual soul.

**Is it salvageable?** Yes, without a full rewrite. The engine simulation logic is the hard part and it's done well. What's missing is: calibration fixes, hooking up the economics, adding a nutrient dosing API endpoint, fixing three arithmetic bugs, and building a plant visual layer. The fix list is specific and bounded.

**One sentence:** Add a nutrient-dosing action, fix the THCA rate formula, connect electricity costs to cash, and give the player something that dies if they ignore it.

---

## B. DETAILED SYSTEMS BREAKDOWN

### 1. Gameplay Loop & Progression

**Current State:** The loop is: load game → Execute Day (repeat indefinitely) → eventually harvest. Controls exist for PAR, light hours, temperature, humidity, and additives. Each day advances numbers.

**What's Wrong:**
- No short-term goals. Nothing tells the player what to do today.
- No urgency. Nutrients deplete so slowly (N: ~0.2mg/L/day at optimal conditions, deficiency threshold at 80mg/L from a starting value of 150mg/L = ~350 days to any symptom) that inaction is the optimal strategy.
- No failure state is reachable within a realistic play session. Disease checks exist but are random 2-3% noise, not predictable responses to player choices.
- The `stageProgressPercent` field is initialized at 0 in `GameManager` and the `updateGrowthStage` method transitions stages but **never sets this field**. Every progress bar in the game permanently shows 0%.
- The day counter advances but the experience is identical on day 1 and day 50.

**Why It Matters:** Without a loop that creates tension, there is no game. Players need to feel that time passing costs them something.

**Comparison:** Stardew Valley solves this with seasonal deadlines — crops die if not harvested before winter, creating a ticking clock. FarmVille used crop death as a retention mechanic. Even the simplest idle games show visible number growth. HydroGrow provides none of these.

---

### 2. Economy & Resource Management

**Current State:** Economics state exists with `currentCashAud`, `totalSpentAud`, `electricityTracking`. Starting cash: $1,000 minus seed cost (~$929). Harvest yields revenue based on yield × market price.

**What's Wrong:**
- **Electricity costs calculated, never deducted.** `trackElectricity()` computes `dailyKwh` and `heaterKwh` correctly but assigns the value to `plant.nutrientUptakeToday.siMg` (a nutrient placeholder!) and never touches `economics.electricityTracking` or `economics.currentCashAud`. Cash is permanently static.
- **No operational expenses.** Nutrients, pH up/down, water changes — none have costs attached to player actions (because those actions don't exist yet).
- **Revenue only at harvest.** With no mid-game costs and no harvest for 90+ days, money is irrelevant for the entire play session.
- **Yield modifiers never updated.** `healthFactor`, `nutrientBalanceFactor`, `lightEfficiencyFactor`, `stressPenaltyFactor` are all initialized to 1.0 in `GameManager.startGame()` and **never modified by SimulationEngine**. Yield is always exactly `strain.baseYieldGrams × qualityMultiplier`.

**Why It Matters:** Economic strategy is the core of tycoon/management games. Without meaningful costs, there are no decisions to make.

**Comparison:** Game Dev Tycoon charges you salary every month whether you ship or not — that pressure forces engagement. Two Point Hospital has ongoing staff costs that demand player attention. HydroGrow's economy is a facade.

---

### 3. Feeding & Nutrient Management

**Current State:** Tank nutrients (N, P, K, Ca, Mg, S) deplete each day via `updateNutrientUptake()`. pH drifts down via `updateTankChemistry()`. PPM (calculated from EC) drifts down. The UI shows pH, EC, PPM, temperature, and DO.

**What's Wrong:**
- **No way to add nutrients.** `GameDayActionRequest` has `additiveApplications[]` (for chitosan, silicon, kelp, MeJA) but no nutrient dosing field. There is no API endpoint or UI for adding base nutrients (N/P/K concentrate). The core hydroponic mechanic — feeding your plants — is absent.
- **No way to adjust pH.** pH drifts slowly downward and there is no pH up/down action.
- **No way to change the water.** `waterAgeDays` increments and a TDS warning fires at >1150 PPM, but there's no water change action.
- **Individual macronutrient levels not displayed.** MonitorPanel shows pH/EC/PPM but not N/P/K mg/L. Players can't diagnose which nutrient is deficient even if they could act on it.
- **Depletion rates are wildly under-calibrated.** At chlorophyll=50% (permanent), PAR=600, 22°C: photosynthesisRate = 0.27. N uptake = 15mg/day × 0.27 = 4mg/day / 20L = 0.2mg/L/day. N deficiency triggers at <80mg/L from a start of 150mg/L = **350 days to any symptom**. A full grow cycle is 90 days.
- **Chlorophyll starts and stays at 50%.** Never increases, so photosynthesis rate is permanently capped at ~50% of potential.

**Why It Matters:** This is the game's stated educational core — hydroponics is about managing nutrient solutions. The mechanic doesn't exist.

**Comparison:** Kerbal Space Program teaches orbital mechanics by letting you crash rockets. The learning comes from failure. HydroGrow never lets the player fail at hydroponics because there's no way to do it wrong, and no way to do it right.

---

### 4. Plant Growth Visualization

**Current State:** The entire game UI is a text/number dashboard. Plant status = four metric cards (height, health, chlorophyll, root mass). Growth stage = a label with a progress bar that always shows 0%.

**What's Wrong:**
- No graphical plant representation. A seedling, a vegetating plant, a flowering plant — none depicted visually.
- The single most rewarding thing in gardening games is watching something grow. Here it literally doesn't happen.
- Height grows from 1.0cm at day 0 to about 6cm by day 50 (at the rate in the code — `heightGrowthMm * siBoost * 0.1`). But since there's no visual, this is just a number.
- The `+0.0mm` daily growth indicator shows because growth today resets to 0 in `resetDailyTracking()` and the growth computed by `updateMorphology()` is already added to `heightCm` — so by the time the player sees the screen it's always 0.
- Stage progress bar always 0% due to unimplemented `stageProgressPercent` calculation.

**Why It Matters:** Dopewars works without visuals because it's turn-based decision-making. A horticulture game has to show horticultural growth or it's just a spreadsheet.

**Comparison:** Stardew Valley shows crops at 4 distinct growth stages with satisfying day-1 sprout animations. Even FarmVille's simple 2D crops gave visual feedback. HydroGrow gives you a number that says "1.1cm."

---

### 5. Cannabinoid & Harvest Systems

**Current State:** THCA, CBDA, CBN tracked in `CannabinoidsState`. Trichome maturity (clear/cloudy/amber %) tracked and displayed after flowering. Harvest is accessible via TrichomeInspector modal when `stage === 'harvest_ready'`.

**What's Wrong — Critical Bug:**
```typescript
// SimulationEngine.ts line 273 - WRONG:
let thcaRate = (strain.thcPercent / strain.floweringTimeDays) * 100;
// For Skywalker OG: (20 / 65) * 100 = 30.77% per day
// Should be:
let thcaRate = strain.thcPercent / strain.floweringTimeDays;
// = 0.31% per day
```
The `* 100` multiplier causes THCA to reach its maximum value (strain.thcPercent × 1.1) within a **single day** of entering flower. Confirmed via simulation: THCA goes 0% → 22% (capped) between day 30 and day 31. Cannabinoid progression is non-functional.

**Additional harvest issues:**
- TrichomeInspector lets the player **manually adjust** trichome percentages before harvesting. This is backwards — the player should observe the simulated values and decide when to harvest, not set the values themselves. The sliders imply you're "choosing" the trichome profile rather than reading it.
- `cloudyTrichomesPercent` stays at 0 for most of the grow (Clear slowly transitions to Cloudy after flower day 60 due to correct progression logic), but with the stage progression broken it's hard to reach harvest_ready reliably.
- Harvest result uses `alert()` — a blocking browser dialog — to display yield, revenue, and profit. Then `onQuit()` fires immediately, killing the session. There's no harvest celebration screen, no stats review, no cycle summary.

---

### 6. Onboarding & Player Understanding

**Current State:** Start screen with strain selection is clean and functional. No tutorial. No contextual help in-game. The game drops you into the dashboard.

**What's Wrong:**
- New player sees a wall of metrics with no explanation. What is PPM? What should I do with it? What happens if it drops?
- No goals are communicated. "It is day 0. Here are some numbers. There is a button called Execute Day."
- The session code system is prominent in the header but unexplained. What does it do? Why should I care?
- Controls (light hours, PAR, temperature) have range hints ("✓ Optimal", "⚠️ Mold risk") but no explanation of *consequences* — what happens if I leave PAR in the high-stress zone?
- Because nothing bad happens regardless of settings, players don't learn from experimentation.

---

### 7. Technical Architecture

**What's Wrong — Critical:**
The engine uses in-memory storage:
```typescript
// server.ts
const gameManagers = new Map<string, GameManager>();
```
Cloudflare Workers are stateless. They scale, restart, and cold-start constantly. Any Worker restart destroys all active sessions. The frontend saves gameId to localStorage and attempts to resume, but `GET /api/game/:id/state` returns 404 after a Worker restart. The resume feature is broken in production. This is the most user-hostile technical failure — players lose progress without warning.

**What's Wrong — Significant:**
- `stageProgressPercent` initialized to 0 and never written. Every growth stage progress bar shows 0%.
- `yieldModifiers.healthFactor` and other yield modifiers initialized to 1.0 and never updated by SimulationEngine. Yield is always base yield regardless of how the player managed nutrients, light, or stress.
- `trackElectricity()` writes to `plant.nutrientUptakeToday.siMg` (a placeholder comment says "placeholder for tracking") instead of `economics.electricityTracking`. Costs never reach the economics state.
- `heightGrowthTodayMm` is reset to 0 in `resetDailyTracking()` which runs at the end of `updateDay()`. So when the UI renders, growth today always shows 0.0mm.
- `plant.flowering.daysInFlower` is incremented in `GameManager.executeGameDay()` AFTER `simulationEngine.updateDay()` runs. The simulation checks `daysInFlower` for `updateGrowthStage` stage transitions — so the stage is always calculated against a value that's one day behind.

---

### 8. UI/UX

**Current State:** Dark theme, clean, functional. Metric cards are readable. Collapsed sections for light/environment/additives reduce cognitive load. The TrichomeInspector SVG pie chart is a nice touch.

**What's Wrong:**
- Monitor and controls share the same scrollable column. On a laptop viewport (1568×756 in testing), the Execute Day button is off-screen unless scrolled down. Players might not find it.
- Alerts (Botrytis risk, etc.) appear randomly due to 2-3% random checks even at optimal conditions. A player at 60% humidity, day 1, received a "⚠️ Botrytis risk" alert. This is noise, not signal. Random alerts without player-correctable causes erode trust in the feedback system.
- Water Chemistry shows pH, EC, PPM, Temp, DO — but no N/P/K. The two most actionable metrics for a hydroponic grower (individual nutrient levels and recommended top-up amounts) are invisible.
- No historical charts. PPM dropping over time is important — but you only see today's value, not the trend.
- No cost/profit summary visible during play. Player can't see what the grow is costing or earning in real time.
- TrichomeInspector sliders let the player adjust values they shouldn't control. Should be read-only, with only a "Harvest Now" decision.

---

## C. PRIORITY FIX LIST

### CRITICAL — Blocks Fun / Learning

| System | Current State | Core Problem | Recommended Fix | Effort | Player Impact |
|--------|---------------|--------------|-----------------|--------|---------------|
| Nutrient Dosing | No mechanism exists | Players can't feed plants — core hydro mechanic missing | Add `nutrientDosing?: { nMl, pMl, kMl, base }` to `GameDayActionRequest`; implement in `executeGameDay` to raise tank nutrient levels; add "Feed Tank" UI section in ControlPanel | Medium | Unlocks the entire educational mechanic |
| THCA Rate Formula | `* 100` error, maxes in 1 day | Cannabinoid progression non-functional | Remove `* 100` from `thcaRate` calculation in SimulationEngine.ts line 273 | Low (1 line) | Restores a 60-day progression arc to flowering |
| stageProgressPercent | Always 0 | Progress bars broken everywhere | In `updateGrowthStage`, calculate: `plant.growthStage.stageProgressPercent = (daysInStage / daysInCurrentStageTotal) * 100` | Low | All progress bars actually work |
| Electricity Costs | Calculated but discarded | Cash never decreases | In `trackElectricity()`, deduct from `gameState.economics.currentCashAud` and update `electricityTracking.totalElectricityCostAud` | Low | Economy becomes real; player has finite cash |
| Session Persistence | In-memory Map on Worker | Sessions lost on Worker restart | Migrate to Cloudflare KV or D1 for game state storage; serialize/deserialize GameManager state | High | Sessions survive; resume feature works |
| Nutrient Calibration | Never deplete critically in a 90-day cycle | No reason to act on tank management | Raise uptake rates 5-10×, OR reduce initial nutrient concentrations by 70% | Low (config change) | Nutrients hit warning levels, player must dose |

### IMPORTANT — Major Gaps

| System | Current State | Core Problem | Recommended Fix | Effort | Player Impact |
|--------|---------------|--------------|-----------------|--------|---------------|
| Plant Visual | No graphical representation | Game has no visual identity or growth satisfaction | Build SVG/CSS plant that changes at each stage; even 5 rough drawings transforms the experience | High | Core emotional hook |
| Yield Modifiers | All stuck at 1.0 | Harvest yield identical regardless of player decisions | Connect healthFactor, nutrientBalanceFactor, lightEfficiencyFactor to actual simulation state in SimulationEngine | Medium | Player optimization has consequence |
| Water Change / pH Adj | No actions exist | pH drifts, TDS accumulates, no player response possible | Add `waterChange?: boolean` and `phAdjustment?: number` to `GameDayActionRequest` | Medium | Completes tank management loop |
| heightGrowthTodayMm | Always shows 0.0mm | Reset before player sees it | Move `resetDailyTracking()` to the START of `updateDay()`, not end (or store previousHeight) | Low | Daily growth feedback works |
| Random Disease Alerts | Fires at day 1, 60% humidity | Noise without player agency | Gate random checks behind meaningful thresholds; add clear remediation instructions | Low | Alerts become actionable signals |
| N/P/K Display | Hidden from UI | Players can't diagnose deficiencies | Add macronutrient section to MonitorPanel showing N/P/K mg/L with target ranges | Low | Players understand what to feed |
| Chlorophyll | Stuck at 50% | Photosynthesis permanently capped at ~27% | Add chlorophyll growth mechanic tied to health and light stage; should reach 80-100% in healthy veg | Low | Realistic efficiency curve |
| Harvest UX | browser `alert()` then session kill | No harvest satisfaction or post-game stats | Add HarvestScreen component with yield breakdown, profit/loss, trichome profile, next-cycle CTA | Medium | Session completion feels rewarding |

### ENHANCEMENT — Polish

| System | Current State | Core Problem | Recommended Fix | Effort | Player Impact |
|--------|---------------|--------------|-----------------|--------|---------------|
| Goals / Quests | None | No short-term direction | Add notification goals: "Your plant needs feeding" / "Switch to 12/12 for flowering" | Low | New players have direction |
| Historical Charts | Point-in-time values only | No trend visibility | Add sparkline charts for PPM, pH, health over last 14 days | Medium | Players spot problems earlier |
| TrichomeInspector | Player adjusts own trichomes | Backwards — observation, not input | Make trichome display read-only; harvest button confirms decision | Low | Removes design confusion |
| CO2 Control | Displayed but not adjustable | Environmental parameter locked | Add CO2 slider to environment controls (400–1500 ppm) | Low | Depth for advanced players |
| Tutorial | None | Players have no context | 3-step onboarding overlay: what PPM is, what Execute Day does, what your goal is | Medium | Massively improves retention |
| Difficulty scaling | Exists in start screen | No actual effect on gameplay | Wire difficulty to: nutrient depletion rate multiplier, random disease probability, starting budget | Low | Difficulty selection is meaningful |

---

## D. RECOMMENDED FEATURE ROADMAP

### Phase 1: Make It Functional (Foundation)
*Goal: The game must have cause and effect. Player actions must matter.*

1. **Fix the 6 one-liners** (stageProgressPercent, THCA rate, heightGrowthTodayMm, electricity deduction, chlorophyll growth, yield modifier hookup). Combined effort: ~2 hours.
2. **Add nutrient dosing to API and UI.** New field in `GameDayActionRequest`, new UI section in ControlPanel ("💧 Feed Tank"). Cost-per-dose from a nutrient concentrate product. This is the single most impactful feature.
3. **Recalibrate nutrient depletion.** Nutrients should hit warning levels around day 20-30 in veg. Either: reduce starting concentrations to 30-40mg/L for N (rather than 150mg/L), OR increase uptake rates 5×.
4. **Wire electricity costs to economics.** One function change. Cash should drop ~$2-4/day.
5. **Add pH up/down and water change actions.**

*Why this order: None of the engagement or visual systems matter if clicking Execute Day produces no consequences. Phase 1 creates a functional feedback loop.*

### Phase 2: Make It Engaging (Hooks)
*Goal: Players have reasons to return tomorrow.*

1. **Plant visual.** SVG cannabis plant with 5 growth stages. Even simple silhouettes with different leaf counts and bud representations. This is the biggest return-on-investment visual change possible.
2. **Notification goals.** "Your PPM has dropped below 500 — your plant needs feeding." "Day 25 approaching — time to flip to 12/12." These create session triggers.
3. **HarvestScreen.** Replace `alert()` with a proper end-of-cycle screen: final yield, revenue, profit/loss breakdown, best decisions made, worst decisions made, next cycle CTA.
4. **N/P/K display in MonitorPanel.** Show individual nutrient levels with colored range indicators.
5. **Random disease gates.** Disease checks should require sustained bad conditions (>72 hours above 75% humidity) before triggering, not 2% random each day.

*Why this order: Players return because something changed since yesterday. Without visual feedback and clear goals, the notification only drives return if there's something visible to return to.*

### Phase 3+: Depth & Replayability
*Goal: 30-day+ engagement and mastery.*

1. **Cloudflare KV persistence.** Without this, none of the above matters for multi-session play.
2. **Multiple plants / tanks.** The data model already has `plantRoster[]` and `tankRoster[]` — implement multi-plant grows.
3. **Market dynamics.** `SimulationParameters.marketDynamics` is defined but unused. Add price fluctuation so players must time their harvest.
4. **Difficulty effects.** Wire `difficulty` setting to actual parameters: nutrient depletion rate, disease frequency, starting budget, electricity rate.
5. **Historical charts.** PPM/pH/health sparklines for the last 14 days.
6. **Tutorial overlay.** 3-screen onboarding explaining PPM, the day cycle, and the goal.
7. **Upgrade system.** Better lights (higher PAR ceiling), larger tanks (more plants), CO2 enrichment. Gives the economy something to spend on between harvests.

---

## E. SPECIFIC IMPLEMENTATION GUIDANCE

### Architecture Priorities (Build in This Order)

**1. State persistence (before shipping to real users)**
```typescript
// Replace in-memory Map with Cloudflare KV:
// server.ts
import { KVNamespace } from '@cloudflare/workers-types'
// Binding in wrangler.toml:
// [[kv_namespaces]]
// binding = "GAME_STATE"
// id = "..."

// Serialize full GameManager state as JSON on each write:
app.post("/api/game/:gameId/day", async (c) => {
  const stored = await c.env.GAME_STATE.get(gameId);
  const manager = stored ? GameManager.deserialize(stored) : null;
  // ...
  await c.env.GAME_STATE.put(gameId, manager.serialize());
});
```

**2. Nutrient dosing action**
```typescript
// Add to GameDayActionRequest in types/index.ts:
nutrientTopUp?: {
  baseNutrientMl: number;  // mL of base nutrient concentrate
  phUpMl?: number;
  phDownMl?: number;
};

// Add to executeGameDay() in GameManager.ts:
if (actions.nutrientTopUp?.baseNutrientMl) {
  const ml = actions.nutrientTopUp.baseNutrientMl;
  const costPerMl = 0.05; // $50/L base nutrient
  this.tankState.macroNutrients.nitrogenNMgPerLiter += (ml * 50) / this.tankState.specifications.volumeLiters;
  this.tankState.macroNutrients.phosphorusPMgPerLiter += (ml * 20) / this.tankState.specifications.volumeLiters;
  this.tankState.macroNutrients.potassiumKMgPerLiter += (ml * 40) / this.tankState.specifications.volumeLiters;
  this.gameState.economics.currentCashAud -= ml * costPerMl;
}
```

### Quick Wins (Under 30 Minutes Each)

**Fix THCA rate (1 line):**
```typescript
// SimulationEngine.ts ~line 273 — REMOVE the * 100:
let thcaRate = (strain.thcPercent / strain.floweringTimeDays); // was * 100
```

**Fix electricity cost deduction:**
```typescript
// SimulationEngine.ts trackElectricity():
private trackElectricity(plant: PlantState, tank: TankState, parUmol: number): void {
  const estimatedLedWattage = (parUmol / 1000) * 400;
  const dailyKwh = (estimatedLedWattage / 1000) * plant.lightResponse.lightScheduleHoursOn;
  const heaterKwh = (tank.specifications.heaterWattage / 1000) * 0.5;
  const totalKwh = dailyKwh + heaterKwh;
  // Pass gameState in or return for GameManager to apply:
  plant.nutrientUptakeToday.siMg = totalKwh; // use as electricity tracker
  // Then in GameManager.executeGameDay():
  const electricityRate = this.gameState.settings.electricityRateAudPerKwh;
  const dailyCost = totalKwh * electricityRate;
  this.gameState.economics.currentCashAud -= dailyCost;
  this.gameState.economics.totalSpentAud += dailyCost;
  this.gameState.economics.spendingBreakdown.electricityAud += dailyCost;
}
```

**Fix stageProgressPercent:**
```typescript
// SimulationEngine.ts updateGrowthStage() - add at end:
const daysInStage = plant.growthStage.daysInStage;
const totalForStage = plant.growthStage.stage === 'seedling' ? 7 :
  plant.growthStage.stage === 'vegetative' ? 21 :
  plant.growthStage.stage === 'early_flower' ? 21 :
  strain.floweringTimeDays - 7 : 7;
plant.growthStage.stageProgressPercent = Math.min(100, (daysInStage / totalForStage) * 100);
```

**Fix heightGrowthTodayMm display:**
```typescript
// In resetDailyTracking(), DON'T reset heightGrowthTodayMm to 0.
// Instead, store it and reset at the START of the next updateDay() call.
// In updateDay(), first line:
plant.morphology.heightGrowthTodayMm = 0; // reset previous day's before calculating new
```

**Add N/P/K to MonitorPanel:**
```tsx
// In MonitorPanel.tsx, add after Water Chemistry section:
<div className="monitor-section">
  <h3>Nutrients (mg/L)</h3>
  <div className="metrics-grid">
    <div className="metric">
      <span className="metric-label">N</span>
      <span className={`metric-value ${tank.macroNutrients.nitrogenNMgPerLiter < 80 ? 'danger' : ''}`}>
        {tank.macroNutrients.nitrogenNMgPerLiter.toFixed(0)}
      </span>
      <span className="metric-range">&gt;80</span>
    </div>
    {/* P, K similarly */}
  </div>
</div>
```

### Technical Debt to Address

1. **Session persistence is the single biggest risk.** Every other improvement is destroyed when the Worker restarts. Add Cloudflare KV before any new features.
2. **`yieldModifiers` being hardcoded 1.0** means the entire yield optimization system is fake. These need to be calculated from actual plant/tank state in SimulationEngine or GameManager.
3. **Additive decay not implemented.** `resetDailyTracking()` has a comment `// Fade additives weekly` with nothing inside. Additives currently persist indefinitely. Add `chitosanDaysSinceApplication` decay (already tracked) to also zero out the concentration after 10 days.
4. **`daysInFlower` incremented after simulation.** Stage checks during simulation are always one day behind. Move `flowering.daysInFlower++` to before `simulationEngine.updateDay()`.

### Recommended Libraries

- **Recharts** — already available in the React environment; use for PPM/pH sparklines
- **Framer Motion** — CSS transitions for plant growth stages would add significant feel without complexity
- **Cloudflare KV** — for persistence (already in the Workers ecosystem, zero new infrastructure)
- **Cloudflare D1** — if you want multi-session leaderboards or market price history later

### Solo Developer Ruthless Scope

**Keep and ship fast:**
- Fix the 6 quick-win bugs (2 hours)
- Add nutrient dosing (1 day)
- Add KV persistence (1 day)
- Add N/P/K display to MonitorPanel (30 minutes)
- Fix random disease gates (30 minutes)
- Recalibrate nutrient starting values (15 minutes)

**Push to Phase 2:**
- Plant visual (significant effort, high return — but not blocking Phase 1 playability)
- HarvestScreen (nice but the game isn't being played long enough to reach it yet)

**Cut for now:**
- Market dynamics (no point until economy works)
- Multiple plants (complexity without foundation)
- CO2 controls (minor optimization lever)
- Tutorial (document the fixes first, then a tutorial becomes worth writing)

---

## F. WHAT'S WORKING

**The engine simulation is genuinely good.** The 14-step daily cycle is well-structured. The pH lockout mechanism, photoinhibition with SuperSi mitigation, chitosan efficacy window, and trichome maturity progression (Clear → Cloudy → Amber) are all correctly modeled. This is not throwaway code — it reflects real domain knowledge and it works correctly when called. The bugs are in the bookkeeping layer (what gets displayed, what gets deducted), not the simulation itself.

**The strain database is solid.** 11 strains with differentiated terpene profiles, chitosan responsivity, PAR tolerance ceilings, and yield economics. The seed cost / market price / yield math gives meaningful economic decisions once the economy is connected.

**The Start Screen works well.** Clean, functional, strain cards are readable, the detail panel updates on selection, difficulty selection is clear. This is shippable onboarding for a game where the in-game experience works.

**The additive system concept is right.** Power Si, Chitosan, Sea-K, MeJA — these are real products used in real grows. The timing mechanics (chitosan 7-10 day efficacy window, daysInFlower peak window for chitosan at weeks 3-6) are research-grounded. When the game is playable, this layer adds genuine strategic depth.

**The TrichomeInspector SVG pie chart** is visually the most satisfying element in the game. The concept of inspecting trichomes to decide harvest timing is exactly the right educational mechanic — it just needs to be read-only rather than player-adjustable.

**Session code system** — the concept of sharing a session code so a grow can be resumed is good UX for a multi-session game. It just needs to survive Worker restarts (KV persistence) to work.

---

## APPENDIX: Confirmed Bugs (From Live Simulation Testing)

| Bug | Location | Evidence |
|-----|----------|---------|
| THCA rate ×100 error | SimulationEngine.ts:273 | THCA 0% → 22% between day 30 and day 31 in simulation |
| stageProgressPercent never set | SimulationEngine.ts `updateGrowthStage` | All 100 tested days returned stagePct=0 |
| Cash never decreases | SimulationEngine.ts `trackElectricity` | Cash remained $929.00 across all 100+ simulated days |
| heightGrowthTodayMm always 0 | SimulationEngine.ts `resetDailyTracking` | All API responses show heightGrowthTodayMm=0.0 |
| Session loss on Worker restart | server.ts in-memory Map | Manually confirmed: game 404s after Worker cold start |
| yieldModifiers all 1.0 | GameManager.ts, SimulationEngine.ts | No modifier fields written anywhere in simulation |
| Additive decay incomplete | SimulationEngine.ts `resetDailyTracking` | Comment says "Fade additives weekly" with empty block |
| daysInFlower incremented after simulation | GameManager.ts `executeGameDay` | Stage transitions always one day behind flower day |
| Botrytis fires at day 1, 60% humidity | SimulationEngine.ts `updateDiseasePressure` | 3% random check; confirmed in live play session day 1 |
| Chlorophyll stuck at 50% | GameManager.ts init, SimulationEngine | chlorophyllPercent initialized 50, never updated |
