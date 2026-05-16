# HydroGrow — Full Game Audit Report
**Date:** 2026-05-16  
**Auditor:** Lead Dev AI  
**Files Reviewed:** SimulationEngine.ts, GameManager.ts, HarvestAssessmentEngine.ts, types/index.ts, metricInfo.ts, MetricInfoModal.tsx, DashboardPanel.tsx, ControlPanel.tsx, GameScreen.tsx, strains.ts

---

## METRIC → CONTROL MAP

| Metric | Control(s) | Can Player Fix It? | MetricInfo Advice Accurate? |
|---|---|---|---|
| pH | pH Up / pH Down sliders | ✅ Yes | ⚠️ Partially — metricInfo says `ideal: 5.8` but the status bar shows OPTIMAL from 5.5–6.5, so 6.4 appears fine |
| EC | Nutrient Top-Up | ⚠️ Raise only — no water-change button | ✅ Yes (text warns about this) |
| Nitrogen (N) | Nutrient Top-Up (NPK balanced) | ⚠️ Can't raise N alone without also raising P/K | ✅ Yes for veg — **WRONG during flower** (see Bug #4) |
| Phosphorus (P) | Bloom additive + Top-Up | ✅ Yes | ✅ Yes |
| Potassium (K) | Bloom additive + Top-Up | ✅ Yes | ✅ Yes |
| Calcium (Ca) | Cal-Mag additive | ✅ Yes (but dose spikes to cap — see Bug #8) | ✅ Yes |
| Magnesium (Mg) | Cal-Mag additive | ✅ Yes | ⚠️ No Mg MetricCard visible in DashboardPanel |
| Air Temperature | Temperature slider | ✅ Yes | ⚠️ "Use fans / HVAC" — no fan or heater toggle in-game |
| Water Temperature | Water Temperature slider | ✅ Yes | ✅ Yes |
| Humidity | Humidity slider + Exhaust Fan | ✅ Yes (two sliders) | ✅ Yes |
| CO₂ | CO₂ slider | ✅ Yes | ❌ **WRONG** — code penalizes CO₂ >1000 ppm (see Bug #1) |
| PAR | PAR slider | ✅ Yes | ✅ Yes |
| Chlorophyll | No direct control | ❌ No | ❌ Suggests "foliar spray" — no such mechanic exists |
| Root Mass | No direct control | ❌ No | ❌ Suggests "mycorrhizae" — no such additive |
| Biomass | No control | ❌ No | ❌ `biomassDryWeightGrams` never updated in engine |
| Plant Health | Indirect only | ❌ No direct fix | ❌ No MetricCard for health delta advice |
| Silicon stress | Silicon additive | ✅ Yes | ✅ Yes |
| Total Stress % | Multiple | ❌ Never calculated | ❌ Always 0 — penalties disabled |

---

## CRITICAL BUGS (Game-Breaking)

---

### BUG #1 — CO₂ >1000 ppm *penalises* photosynthesis instead of boosting it

**File:** `engine/src/engine/SimulationEngine.ts` line 226  
**Impact:** Every player who cranks CO₂ during flower (as the game instructs) gets a 20% photosynthesis penalty. Yield and quality suffer for "doing the right thing."

```typescript
// CURRENT (WRONG)
const co2Modifier = co2 < 400 ? 0.5 : co2 > 1000 ? 0.8 : 1.0;

// FIX
const co2Modifier = co2 < 400 ? 0.5
  : co2 <= 800  ? 1.0
  : co2 <= 1200 ? 1.2   // +20% boost in enrichment range
  : co2 <= 1500 ? 1.1   // diminishing returns above 1200
  : 0.9;                 // penalty only at extreme >1500 ppm
```

**Test:** Set CO₂ to 1200 ppm, run a day, observe `plant.lightResponse.photosynthesisRateRelative` is higher than at 800 ppm.

---

### BUG #2 — `plant.nutrientUptakeToday.siMg` is hijacked for electricity tracking

**File:** `engine/src/engine/SimulationEngine.ts` lines 624–638  
**Impact:** The `siMg` field that should track silicon uptake is overwritten with `kWh * 100` every day. Silicon-dependent photoinhibition mitigation reads `tank.microNutrients.siliconSiMgPerLiter` (correct), but if any future code reads `nutrientUptakeToday.siMg` for silicon, it gets gibberish. Also semantically corrupts the data model.

```typescript
// CURRENT (WRONG - in trackElectricity)
plant.nutrientUptakeToday.siMg = totalKwh * 100; // ← HACK

// FIX — add a dedicated field to PlantState
// In types/index.ts, add to PlantPhysiology or a new ElectricityTracking interface:
electricityKwhToday: number;

// In SimulationEngine.trackElectricity:
plant.physiology.electricityKwhToday = totalKwh;
```

**Test:** Apply Silicon additive, then check `nutrientUptakeToday.siMg` is not overwritten with electricity data.

---

### BUG #3 — Cycle 2 plants skip the seedling stage entirely

**File:** `engine/src/engine/GameManager.ts` line 606 + `SimulationEngine.ts` line 169  
**Impact:** In `startNewCycle`, `plantState.gameDay` is set to `this.gameState.currentGameDay` (e.g., 70). Since `updateGrowthStage` uses `plant.gameDay` as `daysFromStart`, any plant started after day 7 immediately enters vegetative. Second grows never have a seedling stage.

```typescript
// In SimulationEngine.updateGrowthStage (line 169):
const daysFromStart = plant.gameDay; // ← absolute day, not cycle-relative

// FIX — track relative cycle day separately
// In PlantState, add:
cycleStartDay: number;

// In startNewCycle and startGame, set:
this.plantState.cycleStartDay = this.gameState.currentGameDay;

// In updateGrowthStage:
const daysFromStart = plant.gameDay - plant.cycleStartDay;
```

**Test:** Complete a harvest, start a new cycle, verify `growthStage.stage === 'seedling'` on day 1 of cycle 2.

---

### BUG #4 — `metricInfo.ts` nitrogen optimal range is wrong during flowering

**File:** `frontend/src/data/metricInfo.ts` line 25  
**Impact:** The MetricInfoModal shows `optimal: { min: 160, max: 200 }` for nitrogen regardless of stage. During flowering, optimal N is 50–100 mg/L. A player following this advice will over-nitrogen their plant in flower, delaying/damaging yield. This is the most damaging player-facing bug.

```typescript
// CURRENT (WRONG — single static range)
nitrogen: {
  optimal: { min: 160, max: 200, ideal: 180 },
  ...
}

// FIX — MetricInfoModal must receive currentStage and show stage-appropriate ranges
// Option A (simple): Pass stage-specific ranges from DashboardPanel as props
// The DashboardPanel already has correct stage-aware thresholds via getThresholds().
// Just pass them down:
<MetricInfoModal
  metricKey="nitrogen"
  currentValue={n}
  min={thr.nMin}      // ← already stage-aware (50 in flower, 160 in veg)
  max={thr.nMax}      // ← already stage-aware
  optimalOverride={{ min: thr.nMin, max: thr.nMax, ideal: (thr.nMin + thr.nMax) / 2 }}
/>
// MetricInfoModal should prefer optimalOverride over metricInfoDatabase when provided.
```

**Also fix for EC/PPM/K/P** — same stage-unawareness problem exists for all macronutrients.

**Test:** Enter flowering, click a Nitrogen MetricCard, verify modal says "optimal 50–100 mg/L" not "160–200 mg/L."

---

### BUG #5 — `stressIndicators.totalStressPercent` is never calculated (always 0)

**File:** `engine/src/engine/SimulationEngine.ts` — missing step  
**Impact:** Health penalty `healthChange -= stress/100` and yield `stressPenaltyFactor` calculations both reference `totalStressPercent`. Since it's always 0, heat stress, cold stress, and hypoxia never reduce health or yield. The game is too forgiving.

```typescript
// ADD at end of updateDay, before updatePlantHealth:
private calculateTotalStress(plant: PlantState, tank: TankState): void {
  let stress = 0;
  const temp = tank.roomEnvironment.airTemperatureCelsius;

  // Heat stress: >26°C
  if (temp > 26) {
    plant.stressIndicators.heatStressActive = true;
    stress += Math.min(40, (temp - 26) * 5);
  } else {
    plant.stressIndicators.heatStressActive = false;
  }

  // Cold stress: <18°C
  if (temp < 18) {
    plant.stressIndicators.coldStressActive = true;
    stress += Math.min(30, (18 - temp) * 5);
  } else {
    plant.stressIndicators.coldStressActive = false;
  }

  // Humidity stress: <30% or >75%
  const rh = tank.roomEnvironment.relativeHumidityPercent;
  if (rh < 30 || rh > 75) {
    plant.stressIndicators.humidityStressActive = true;
    stress += 15;
  } else {
    plant.stressIndicators.humidityStressActive = false;
  }

  // Photoinhibition
  if (plant.stressIndicators.photoinhibitionActive) {
    stress += plant.lightResponse.photoinhibitionRiskPercent * 0.3;
  }

  // Nutrient lockout
  if (plant.stressIndicators.nutrientLockoutActive) {
    stress += 20;
  }

  // Hypoxia
  if (plant.stressIndicators.hypoxiaActive) {
    stress += 15;
  }

  plant.stressIndicators.totalStressPercent = Math.min(100, stress);
}
```

**Test:** Set air temp to 32°C, run a day, verify `totalStressPercent > 0` and health declines faster.

---

## HIGH PRIORITY (Gameplay Friction)

---

### BUG #6 — `nutrientLockoutActive` is set but never cleared

**File:** `engine/src/engine/SimulationEngine.ts` line 263  
**Impact:** Once pH goes below 5.0 or above 7.0, `nutrientLockoutActive` is permanently true for the rest of the game, even after the player corrects pH. Lockout penalties persist forever.

```typescript
// CURRENT
if (pH < 5.0 || pH > 7.0) {
  phLockoutFactor = 0.4;
  plant.stressIndicators.nutrientLockoutActive = true;
  // ← never set back to false
}

// FIX
if (pH < 5.0 || pH > 7.0) {
  phLockoutFactor = 0.4;
  plant.stressIndicators.nutrientLockoutActive = true;
} else {
  plant.stressIndicators.nutrientLockoutActive = false; // ← ADD THIS
}
```

---

### BUG #7 — Disease alerts accumulate indefinitely; disease clears instantly

**File:** `engine/src/engine/SimulationEngine.ts` lines 578–614  
**Impact A:** `tank.alerts` and `tank.warnings` are pushed but never removed. After PM/botrytis clears, the alerts "🔴 Powdery mildew detected" persist in the array forever, confusing the player.  
**Impact B:** Disease vanishes the instant conditions improve (`pmDaysExposed = 0; powderyMildew = false`). It should take 3–5 days to recover, creating meaningful consequence and requiring real action.

```typescript
// FIX A — clear stale alerts when conditions improve:
} else {
  plant.stressIndicators.diseasePressureCounters.pmDaysExposed = 0;
  if (plant.visibleSymptoms.powderyMildew) {
    plant.visibleSymptoms.powderyMildew = false;
    // Remove alert
    tank.alerts = tank.alerts.filter(a => !a.includes('Powdery mildew'));
    tank.warnings = tank.warnings.filter(w => !w.includes('Powdery mildew'));
  }
}

// FIX B — add recovery counter: disease doesn't clear until 3 days of good conditions
// Add diseasePressureCounters.pmRecoveryDays
if (!pmConditionsActive && plant.visibleSymptoms.powderyMildew) {
  counters.pmRecoveryDays = (counters.pmRecoveryDays || 0) + 1;
  if (counters.pmRecoveryDays >= 3) {
    plant.visibleSymptoms.powderyMildew = false;
    // remove alerts
  }
} else if (pmConditionsActive) {
  counters.pmRecoveryDays = 0;
}
```

---

### BUG #8 — Additive concentration formula is ~50–1000× too high

**File:** `engine/src/engine/GameManager.ts` lines 371–408  
**Impact:** `concentration = (doseMl * 1000) / volumeLiters`. For 8 mL in a 20L tank this gives 400 units. With Cal-Mag's `caBoost = concentration * 2.5 = 1000`, which immediately maxes Ca at the 200 mg/L cap. Intended gameplay: multiple doses over time to gradually raise levels. Actual gameplay: one dose → instant max. The caps mask this but break the progression.

**Expected effect (from metricInfo text):** 10 mL Cal-Mag → +25 mg/L Ca.  
**Actual effect:** 10 mL Cal-Mag → +1250 mg/L Ca (capped at 200).

```typescript
// CURRENT
const concentration = (app.doseMl * 1000) / this.tankState.specifications.volumeLiters;
// ...
const caBoost = concentration * 2.5;   // Way too high

// FIX — calibrate to realistic mg/L increases:
// For Cal-Mag: 10 mL in 20L → +25 mg/L Ca, +12 mg/L Mg
const caBoost = (app.doseMl * 50) / this.tankState.specifications.volumeLiters;
const mgBoost = (app.doseMl * 25) / this.tankState.specifications.volumeLiters;

// For Bloom: 8 mL in 20L → +24 mg/L P, +32 mg/L K (matching metricInfo text)
const pBoost = (app.doseMl * 60) / this.tankState.specifications.volumeLiters;
const kBoost = (app.doseMl * 80) / this.tankState.specifications.volumeLiters;

// For Silicon: 5 mL in 20L → +10 mg/L Si
const siBoost = (app.doseMl * 40) / this.tankState.specifications.volumeLiters;
```

**Test:** Add 10 mL Cal-Mag, verify Ca rises by ~25 mg/L (from ~140 to ~165), not to cap.

---

### BUG #9 — `metricInfo.ts` modal shows wrong pH advice direction

**File:** `frontend/src/data/metricInfo.ts` lines 81–82  
**Impact (subtle):** The adjustment text correctly says "If pH < 5.8: Use pH Up." But the status indicator in the modal compares `currentValue` against the props `min/max` (5.5–6.5), not against the ideal of 5.8. So at pH 6.4, the status badge says "OPTIMAL" but the plant is drifting toward the lockout zone. Players don't feel urgency to correct until it's too late.

```typescript
// FIX — in MetricInfoModal, add a "drift warning" band:
// If currentValue is in the outer 20% of the optimal range, show "DRIFTING" warning
const rangeWidth = info.optimal.max - info.optimal.min;
const isDrifting =
  (currentValue >= info.optimal.max - rangeWidth * 0.2 && currentValue <= info.optimal.max) ||
  (currentValue <= info.optimal.min + rangeWidth * 0.2 && currentValue >= info.optimal.min);

// Add a 'status-drifting' CSS class and yellow indicator
```

---

### BUG #10 — `qualityLossPercent` formula is mathematically inverted

**File:** `engine/src/engine/SimulationEngine.ts` lines 782–787  
**Impact:** Post-peak quality loss calculation:
```typescript
plant.yieldTracking.qualityLossPercent = Math.min(100,
  (degradationRate / 100) ** plant.yieldTracking.daysSincePeak * 100
);
```
With `degradationRate = 2.5` and `daysSincePeak = 1`:  
`(2.5/100)^1 * 100 = 2.5%` — reasonable.  
With `daysSincePeak = 5`:  
`(0.025)^5 * 100 = 0.0000000098%` — effectively zero forever. Degradation disappears after day 1.

```typescript
// FIX — simple cumulative linear degradation
plant.yieldTracking.qualityLossPercent = Math.min(
  100,
  plant.yieldTracking.daysSincePeak * strain.yieldProfile.degradationPercentPerDay
);
```

---

### BUG #11 — pH lockout range in engine (5.0–7.0) vs optimal range in metricInfo (5.5–6.5)

**File:** `engine/src/engine/SimulationEngine.ts` line 260; `frontend/src/data/metricInfo.ts` line 77  
**Impact:** The engine only applies nutrient lockout outside 5.0–7.0. The metricInfo says anything outside 5.5–6.5 is suboptimal. A player at pH 5.2 sees "LOW" in the modal but the engine treats them as fine. The player's corrections have no visible effect on lockout.

```typescript
// FIX — align the lockout range to match the advice:
const pH = tank.waterChemistry.ph;
if (pH < 5.5 || pH > 6.5) {
  phLockoutFactor = pH < 5.0 || pH > 7.0 ? 0.3 : 0.7; // Partial lockout 5.5-5.0, full below 5.0
  plant.stressIndicators.nutrientLockoutActive = true;
} else {
  phLockoutFactor = 1.0;
  plant.stressIndicators.nutrientLockoutActive = false;
}
```

---

### BUG #12 — Harvest button appears on Day 1 of flowering

**File:** `frontend/src/screens/GameScreen.tsx` line 334  
**Impact:** The harvest button renders as soon as `floweringInitiated = true`, potentially on day 7–14 of the game. Yield at day 1 of flower is near 0. Players may accidentally harvest for almost nothing and lose the run.

```typescript
// CURRENT
{isFlowering && <HarvestButton ... />}

// FIX — gate behind minimum flower days (at least week 5, day 35)
const canHarvest = state.plant.flowering.floweringInitiated &&
  state.plant.flowering.daysInFlower >= 35;

{canHarvest && <HarvestButton ... />}
```

---

### BUG #13 — `biomassDryWeightGrams` initialized but never updated

**File:** `engine/src/engine/SimulationEngine.ts` — missing  
**Impact:** The biomass MetricCard in DashboardPanel always shows 2g (initial value). A player clicking it gets advice about "biomass is too low" with no way to understand it's a tracking bug.

```typescript
// ADD to updateMorphology or a new updateBiomass step:
private updateBiomass(plant: PlantState, tank: TankState): void {
  // Biomass = function of height, LAI, root mass, and health
  const vegetativeContribution = plant.morphology.heightCm * 0.5 +
    plant.morphology.leafAreaIndex * 10;
  const rootContribution = plant.physiology.rootMassDryWeightGrams * 0.3;
  const healthModifier = plant.physiology.plantHealthPercent / 100;

  plant.physiology.biomassDryWeightGrams =
    (vegetativeContribution + rootContribution) * healthModifier;
}
```

---

## MEDIUM PRIORITY (Clarity & Balance)

---

### ISSUE #14 — Cannot raise N without also raising P and K

**Context:** Base nutrient ratio is NPK 50:20:40. During veg, if N drops to 80 mg/L but P and K are still high, adding 20 mL of base nutrient raises N by 50 mg/L but also raises P by 20 mg/L (potentially capping it) and K by 40 mg/L.

**Fix:** Add a "Grow Formula" (N-boost) additive:
```typescript
// In additives data:
{
  id: "grow-formula",
  name: "Grow Formula (N Boost)",
  type: "grow",
  description: "High-nitrogen, low-P/K formula for vegetative stage. Use when N is low but P/K are already adequate.",
  dosagePerTank20L: 10,
  // Effect: +40 mg/L N, +5 mg/L P, +8 mg/L K per 10 mL in 20L
}
// In GameManager additive handling:
} else if (additive.type === "grow") {
  const nBoost = (app.doseMl * 80) / this.tankState.specifications.volumeLiters;
  const pBoost = (app.doseMl * 10) / this.tankState.specifications.volumeLiters;
  const kBoost = (app.doseMl * 16) / this.tankState.specifications.volumeLiters;
  // apply...
}
```

---

### ISSUE #15 — Exhaust fan is the only humidity control but the slider has no feedback

**Context:** Two separate controls affect humidity: the "Humidity" slider (directly sets `relativeHumidityPercent`) and the "Exhaust Fan" (affects `airChangesPerHour`, which affects disease pressure but not humidity directly). The ControlPanel hint says "Raises air circulation, lowers humidity" for the fan, but humidity is set directly by the humidity slider, not by the fan.

**Fix:** Either make the exhaust fan *actually* modify humidity in the simulation, or remove the misleading tooltip. Ideally: exhaust fan reduces RH by a formula based on ACH and current humidity.

```typescript
// In SimulationEngine or GameManager, after applying exhaustFanPercent:
const achEffect = (actions.exhaustFanPercent / 100) * 5; // 0–5 RH points reduction per day
this.tankState.roomEnvironment.relativeHumidityPercent = Math.max(
  30,
  this.tankState.roomEnvironment.relativeHumidityPercent - achEffect * 0.5
);
```

---

### ISSUE #16 — Height growth formula scales down by 0.1 regardless of silicon

**File:** `engine/src/engine/SimulationEngine.ts` line 304  
```typescript
const siBoost = 1 + tank.microNutrients.siliconSiMgPerLiter / 100;
heightGrowthMm *= siBoost * 0.1; // ← multiplied by 0.1 always
```
At Si=0: growth = `base * 1 * 0.1 = base/10`.  
In veg: `15mm * 0.1 = 1.5mm/day`. Over 21 days veg: 3.15cm. Total realistic height: ~10–15cm. Too slow.

**Fix:** Separate the scaling factor from the silicon boost:
```typescript
const siBoost = 1 + (tank.microNutrients.siliconSiMgPerLiter / 100) * 0.1; // Up to 10% bonus
heightGrowthMm *= siBoost; // Don't scale down the base
```

---

### ISSUE #17 — Magnesium MetricCard is missing from DashboardPanel

**File:** `frontend/src/components/DashboardPanel.tsx`  
**Impact:** Mg shows up in metricInfo but isn't displayed as a MetricCard. A player with Mg deficiency sees the symptom on the plant but can't find where to look up what Mg is or how to fix it.

**Fix:** Add Mg MetricCard to the Macronutrients section. Use hardcoded thresholds for now:
```tsx
<MetricCard
  label="Magnesium (Mg)"
  value={tank.macroNutrients.magnesiumMgMgPerLiter}
  unit=""
  min={40}
  max={80}
  {...getStatus(tank.macroNutrients.magnesiumMgMgPerLiter, 40, 80)}
  icon="🔋"
  metricKey="magnesium"
/>
```

---

### ISSUE #18 — `GameDayActionRequest.waterTemperatureTarget` controls air temperature

**File:** `engine/src/engine/GameManager.ts` line 297  
**Impact:** The field is labeled `waterTemperatureTarget` but used for air temperature. A separate `waterTemperatureCelsius` exists for water. This naming confusion has a comment acknowledging it but is a maintenance hazard.

**Fix:** Rename `waterTemperatureTarget` to `airTemperatureTarget` across GameManager.ts, types/index.ts, and GameScreen.tsx.

---

### ISSUE #19 — Chitosan application cost tracking missing from additiveHistory

**File:** `engine/src/engine/GameManager.ts` lines 410–415  
**Context:** `additiveHistory` records chitosan applications but `effectivenessMultiplier` is always hardcoded 1.0. The chitosan effectiveness window (days 3–6 of flower, peak response) in SimulationEngine is checked via `chitosanDaysSinceApplication`, but this is independent of `additiveHistory`. There's no UI for "when did I last apply chitosan" — the player can't see it.

**Fix:** Display `chitosanDaysSinceApplication` in DashboardPanel when > 0:
```tsx
{tank.additivesActive.chitosanDaysSinceApplication !== null && (
  <p className="additive-status">
    🧬 Chitosan active: Day {tank.additivesActive.chitosanDaysSinceApplication}/10
  </p>
)}
```

---

## LOW PRIORITY (Polish & Onboarding)

---

### POLISH #20 — No stage-aware hints in ControlPanel

The ControlPanel shows the same controls in veg as in flower with no guidance. A new player at day 7 entering veg doesn't know they need to:
- Switch from 18h to 12h light to trigger flowering
- Shift from base nutrient to bloom formula at flower initiation
- Reduce N from 180 to 80 mg/L when flowering begins

**Fix:** Add a stage-banner above the ControlPanel:
```tsx
<div className="stage-guidance">
  {stage === 'vegetative' && (
    <p>🌱 <strong>Vegetative Mode:</strong> Switch to 12h light to trigger flowering.</p>
  )}
  {stage === 'early_flower' && (
    <p>🌸 <strong>Early Flower:</strong> Reduce N top-ups. Add Bloom Formula for P/K. Target N: 50–100 mg/L.</p>
  )}
  {stage === 'late_flower' && (
    <p>🍯 <strong>Late Flower:</strong> Keep P/K high. Inspect trichomes daily.</p>
  )}
</div>
```

---

### POLISH #21 — pH Up/Down sliders reset to 0 each day but players can't see daily drift

**Context:** Every time "→ Tomorrow" is clicked, the pH Up/Down sliders reset to 0. But pH drifts ~0.05–0.15 per day automatically. Players don't know they need to correct pH every 1–2 days.

**Fix:** Add a pH drift indicator to the DashboardPanel:
```tsx
<p style={{ fontSize: '11px', color: '#f90' }}>
  pH drift: −{tank.waterChemistry.phDriftPerDay.toFixed(2)}/day
</p>
```
And add a one-time notification on day 3: "Your pH is drifting. Use the pH controls daily to stay in range."

---

### POLISH #22 — No "Next Stage" progress bar on DashboardPanel

Players don't know how many days until flowering or until harvest. `growthStage.stageProgressPercent` exists but isn't displayed.

**Fix:** Show a progress bar and ETA in DashboardPanel or PlantStatusCard:
```
Stage: VEGETATIVE ▓▓▓▓▓░░░░░ 50% → 11 days to flower (set 12h light)
```

---

### POLISH #23 — Harvest button label doesn't communicate urgency

Current button text: "🌾 Harvest Now" — doesn't tell the player whether they're early, at peak, or overdue.

**Fix:** Make the button contextual:
```tsx
const harvestLabel =
  daysInFlower < floweringDays - 5 ? '🌾 Harvest (Early)' :
  daysInFlower <= floweringDays + 3 ? '🌾 Harvest (PEAK ✓)' :
  `🌾 Harvest (${daysInFlower - floweringDays}d overdue)`;
```

---

## PLAYER FLOW WALKTHROUGH — Mental Cycle Test

**Day 0–3 (Seedling):** Plant starts at 100% health, pH 6.0, EC 1.2. Nothing is wrong yet. No prompts. New player opens all the sliders and adjusts things randomly. **Problem:** No guidance on what to do. No "goals for this stage" display.

**Day 7 (Enter Veg):** Player is still on 18h light. Nothing will happen. **Problem:** The game never tells you to switch to 12/12 for flowering. A new player may run veg for 60 days with no flowering, wondering why the game isn't progressing.

**Day 10–14 (Veg, nutrients dropping):** N has dropped from 150 → ~80 mg/L (100 mg/day uptake × ~14 days / 20L = ~70 mg/L total drain). The MetricCard shows N "LOW." Player clicks it → modal says "optimal: 160–200 mg/L, add 10–20 mL base nutrient." Player adds 20 mL. **This works correctly.** ✅

**Day 15 (Player switches to 12/12):** Flowering initiates. **Problem:** Stage changes from Vegetative → Early Flower. Nitrogen threshold immediately changes from 160–200 to 50–100. If the player just dosed N to 180 mg/L, they now have excess N going into flower, slowing cannabinoid synthesis. But the MetricCard still shows N as "OPTIMAL" (because metricInfo has a static veg range). Player has no idea they over-nuted.

**Day 20 (Early flower, pH drifting):** pH has drifted from 6.0 → 5.7 (−0.03/day × 10 days of heavy N uptake). Player sees pH 5.7 as "OPTIMAL" in the bar. But at 5.7, we're near the lockout boundary. **Problem:** No drift warning, no urgency.

**Day 25 (First problem visible):** If player hasn't been dosing pH Up, pH reaches 5.5. MetricCard shows amber/critical. Player clicks → modal gives correct advice ("Add 5–8 mL pH Up"). Player adds 8 mL → pH = 5.5 + 0.8 = 6.3. **Works correctly.** ✅

**Day 30 (Bloom phase):** Player needs P 60–90 mg/L and K 117–175 mg/L. P has dropped to 15 mg/L. Modal correctly says "Apply Bloom Formula." Player applies 8 mL Bloom. **Problem (Bug #8):** At current calibration, this dumps P to the cap immediately. With the fix, it correctly raises P by ~24 mg/L and K by ~32 mg/L. ✅ after fix.

**Day 56 (Harvest window):** `growthStage.stage = 'harvest_ready'`. Harvest button visible (it was visible from day 15 — Bug #12). Player has been seeing it for 40 days. They may have already harvested too early. After fix, button only appears at day 35+.

**Post-harvest (Payment):** Payment calculation is correct and transparent via HarvestAssessmentModal. Quality tiers, penalties, and "what optimal would have achieved" are all shown. **This part works well.** ✅

**First time a new player encounters a real problem:** Day 14–20 (nitrogen deficiency or pH drift). Advice is accessible via MetricCard click. **The advice is correct for most cases but the N optimal range bug (Bug #4) will mislead players in flower.**

---

## BONUS: 5 NEW MECHANICS TO CLOSE GAPS

---

### 1. **Grow Formula Additive** — Closes the "can't raise N alone" gap
**Problem solved:** Base nutrient raises N/P/K together. In flower, if only N is low, adding base nutrient also spikes P and K.  
**Mechanic:** A "Grow Formula" additive with NPK 10:2:2 ratio. High N, minimal P/K impact. Available in the additive shop.  
**Fits theme:** N deficiency during flower is a real challenge growers face. Having the tool to address it specifically feels empowering.

---

### 2. **Mycorrhizae Additive** — Closes the "root mass has no control" gap
**Problem solved:** Root mass is visible as a metric but players can't do anything about it.  
**Mechanic:** Apply once at transplant (day 7). Permanently boosts root growth rate by 1.3× and increases nutrient uptake efficiency by 10%.  
**Code hook:** In `updateRootMass`, check `tank.additivesActive.mycorrhizaeApplied`. In `updateNutrientUptake`, apply uptake efficiency boost.  
**Fits theme:** Closes a gap between "observable metric" and "actionable fix."

---

### 3. **Stage Dashboard Banner** — Closes the "player doesn't know what stage needs" gap
**Problem solved:** The game shows metrics but doesn't tell players which metrics matter right now or what to target.  
**Mechanic:** A persistent banner above the metrics grid: "🌸 FLOWER WEEK 3 — Priority: P 60–90, K 117–175. Watch for PM (RH <50%). Trichomes developing."  
**Fits theme:** Every metric becomes an invitation when the player knows which invitations to answer first.

---

### 4. **Fungicide Additive** — Closes the "disease is either trivial or permanent" gap
**Problem solved:** With Bug #7 fixed (disease doesn't clear instantly), players need a way to actively fight active infections.  
**Mechanic:** Apply Fungicide when PM/botrytis is active. Reduces `pmRecoveryDays` by 2 (halves recovery time). Costs $15 per dose. Cannot prevent disease — only cure it.  
**Code hook:** In `updateDiseasePressure`, if `additivesActive.fungicideApplied`, double the recovery rate.  
**Fits theme:** Creates a "pay to fix faster" tradeoff (cost vs. quality loss from disease).

---

### 5. **VPD Display** — Unifies temperature + humidity into one strategic metric
**Problem solved:** Players manage temp and humidity as separate sliders without understanding their interaction. VPD (Vapor Pressure Deficit) encodes both into a single actionable number.  
**Mechanic:** Add a VPD MetricCard (calculated in SimulationEngine from temp + RH). Optimal: 0.8–1.2 kPa veg, 1.0–1.5 kPa flower.  
**Calculation:**
```typescript
// In updateTankChemistry or a new step:
const svp = 0.6108 * Math.exp(17.27 * temp / (temp + 237.3)); // kPa sat vapor pressure
tank.roomEnvironment.vaporPressureDeficitKpa = svp * (1 - rh / 100);
```
(This field already exists in `RoomEnvironment` but is initialized to 1.0 and never updated.)  
**Fits theme:** Two metrics your player already manages combine into one elegant KPI. Better understanding = better gameplay.

---

## PRIORITISED FIX ORDER

| Priority | Bug/Issue | Effort | Impact |
|---|---|---|---|
| 🔴 Critical | #1 CO₂ modifier inverted | 1 line | Breaks yield math |
| 🔴 Critical | #3 Cycle 2 plants skip seedling | 5 lines | Breaks progression |
| 🔴 Critical | #4 Nitrogen metricInfo wrong in flower | 10 lines | Misleads player every grow |
| 🔴 Critical | #8 Additive concentration 50–1000× too high | 10 lines | Breaks nutrient economy |
| 🟠 High | #5 totalStressPercent never calculated | 30 lines | All stress penalties disabled |
| 🟠 High | #6 nutrientLockoutActive never cleared | 1 line | Permanent penalty bug |
| 🟠 High | #7 Disease clears instantly + alerts persist | 20 lines | Disease is trivial |
| 🟠 High | #10 qualityLossPercent formula wrong | 1 line | Post-peak penalties disabled |
| 🟠 High | #11 pH lockout vs metricInfo range mismatch | 5 lines | Advice doesn't match simulation |
| 🟠 High | #12 Harvest button visible day 1 of flower | 1 line | Early harvest destroys runs |
| 🟠 High | #13 biomass never updated | 15 lines | MetricCard always shows 2g |
| 🟡 Medium | #2 siMg field collision | 5 lines | Data model corruption |
| 🟡 Medium | #9 pH drift warning missing | 10 lines | Player never sees drift urgency |
| 🟡 Medium | #14 No N-only boost additive | 30 lines | N correction too blunt |
| 🟡 Medium | #17 Mg MetricCard missing | 5 lines | Mg deficiency invisible |
| 🟡 Medium | #16 Height growth 0.1× scaling | 1 line | Plant too short |
| 🟢 Low | #20 Stage hints in ControlPanel | 20 lines | Onboarding gap |
| 🟢 Low | #21 pH drift indicator | 5 lines | Polish |
| 🟢 Low | #22 Stage progress bar | 10 lines | Polish |
| 🟢 Low | #23 Harvest button urgency label | 5 lines | Polish |

---

*End of Audit Report.*
