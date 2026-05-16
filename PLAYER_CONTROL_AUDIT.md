# HydroGrow Player Control Audit

**Audit Date:** 2026-05-16  
**Files Reviewed:** `ControlPanel.tsx`, `DashboardPanel.tsx`, `MonitorPanel.tsx`, `GameScreen.tsx`, `GameManager.ts`, `types/index.ts`, `additives.ts`, `server.ts`

---

## Current Player Capabilities

### 1. Light Intensity (PAR)
- **Control:** PAR slider
- **Range:** 200–1500 µmol/m²/s (step: 50)
- **Location:** `ControlPanel.tsx` (slider) → `GameScreen.tsx` state (`parUmol`) → `GameDayActionRequest.parUmol`
- **Engine:** Sets `tankState.roomEnvironment.lightParUmolPerM2PerS` in `GameManager.ts:294`
- **Scheduling:** No — applies the same value for all days, including multi-day advances
- **Notes:** DashboardPanel shows PAR with range 400–1200 for the MetricCard status; slider allows 200–1500

### 2. Light Schedule (Hours On/Off)
- **Control:** Hours-on slider
- **Range:** 8–24 hours ON (remainder is OFF)
- **Location:** `ControlPanel.tsx` (slider) → `GameDayActionRequest.lightScheduleHoursOn` / `lightScheduleHoursOff`
- **Engine:** Passed to `SimulationEngine.updateDay()` in `GameManager.ts:394`
- **Scheduling:** No — same schedule locked in for all days during multi-day advances
- **Notes:** `lightScheduleHoursOff` is computed as `24 - lightHours` in `GameScreen.tsx:77`

### 3. Air Temperature
- **Control:** "Air Temperature" slider (mislabeled `waterTemperatureTarget` in API)
- **Range:** 15–30°C (step: 0.5)
- **Location:** `ControlPanel.tsx` (slider) → `GameScreen.tsx` state (`temperature`) → `GameDayActionRequest.waterTemperatureTarget`
- **Engine:** Sets `tankState.roomEnvironment.airTemperatureCelsius` in `GameManager.ts:296`
- **Bug:** The API field is named `waterTemperatureTarget` but it sets **air** temperature. Water temperature (`waterChemistry.waterTemperatureCelsius`) is **never updated** by player action.
- **Scheduling:** No

### 4. Humidity
- **Control:** Humidity slider
- **Range:** 30–80% (step: 1)
- **Location:** `ControlPanel.tsx` (slider) → `GameDayActionRequest.humidityTarget`
- **Engine:** Sets `tankState.roomEnvironment.relativeHumidityPercent` in `GameManager.ts:295`
- **Scheduling:** No — same value used for all days in multi-day advances

### 5. Additives
- **Control:** Toggle card per additive + numeric dose input
- **Available Products (4 total from `additives.ts`):**
  | Name | Type | Default Dose | Bottle | Price |
  |------|------|-------------|--------|-------|
  | Power Si Original | silicon | 8 mL / 20L | 500 mL | $18.50 |
  | Sea-K Kelp Extract | kelp | 5 mL / 20L | 200 mL | $16.72 |
  | Chitosan Foliar Spray | chitosan | 10 mL / 20L | 500 mL | $45.00 |
  | Methyl Jasmonate Premium | meija | 5 mL / 20L | 250 mL | $55.00 |
- **Dose Range:** 0 to bottleSize (mL), player-editable
- **Location:** `ControlPanel.tsx` (card grid) → `GameDayActionRequest.additiveApplications[]`
- **Engine:** Updates `additivesActive` or `microNutrients.siliconSiMgPerLiter` in `GameManager.ts:343–374`
- **Scheduling:** **No** — additives are cleared after every day (`setSelectedAdditives([])` in `GameScreen.tsx:88`). The `applicationFrequencyDays` field on each additive exists as data but is **never enforced** by any game logic.
- **Limitation:** Player must manually re-select additives each day

### 6. Harvest Timing
- **Control:** "🌾 Harvest Now" button (visible when `floweringInitiated === true`)
- **Location:** `GameScreen.tsx`, `HarvestButton.tsx`
- **Scheduling:** Immediate — triggers `gameClient.harvestNow()`
- **Additional:** "🔬 Inspect Trichomes" modal allows alternate harvest path with trichome input

### 7. Day Advancement
- **Controls:** "→ Tomorrow" (1 day), "→ 3 Days", "→ Week" (7 days)
- **Location:** `GameScreen.tsx` action panel
- **Limitation:** Multi-day advances lock in the **same settings** for all days — no per-day variation, no conditional actions

---

## API Capabilities Present But NOT Wired to UI

These fields exist in `GameDayActionRequest` (types/index.ts:492–508) and are handled in `GameManager.ts` but have **no corresponding UI control in `ControlPanel.tsx` or `GameScreen.tsx`**:

### pH Up / pH Down
- **API fields:** `nutrientTopUp.phUpMl`, `nutrientTopUp.phDownMl`
- **Engine logic:** Each mL of pH Up raises pH by 0.1 (max 7.0); each mL of pH Down lowers by 0.1 (min 5.0). `GameManager.ts:329–340`
- **Cost:** $0.02/mL
- **UI Status:** **NOT IMPLEMENTED** — no sliders, inputs, or buttons in ControlPanel
- **Impact:** Player cannot correct pH drift without this UI. pH is tracked and affects nutrient lockout.

### Base Nutrient Top-Up
- **API field:** `nutrientTopUp.baseNutrientMl`
- **Engine logic:** Adds fixed NPK ratio per mL: N +50/L, P +20/L, K +40/L (all capped). `GameManager.ts:299–326`
- **Cost:** $0.05/mL
- **UI Status:** **NOT IMPLEMENTED** — no input in ControlPanel
- **Impact:** Player cannot replenish depleted nutrients. N, P, K decrease each day via plant uptake but there is no UI mechanism to top them up.

### Maintenance Actions
- **API field:** `maintenanceActions?: string[]`
- **Engine logic:** Accepted but not processed — no handler in `GameManager.ts`
- **UI Status:** **NOT IMPLEMENTED**
- **Impact:** Placeholder only; no functional effect

---

## Metrics Displayed But NOT Controllable

These metrics are tracked in game state and shown in the dashboard but have **no player-facing control**:

### CO₂
- **Displayed:** DashboardPanel MetricCard (400–1500 ppm)
- **State field:** `tankState.roomEnvironment.co2Ppm` (initialized at 400)
- **Control:** **NOT IMPLEMENTED** — no CO₂ input in UI, no CO₂ parameter in `GameDayActionRequest`, never updated in `executeGameDay()`
- **Impact:** CO₂ is static at ambient (400 ppm). Advice like "raise CO₂ to 1000 ppm to boost photosynthesis" is unactionable.

### Exhaust Fan / Air Circulation
- **Displayed:** NOT shown in UI (field exists only in state)
- **State field:** `tankState.roomEnvironment.airChangesPerHour` (initialized at 4, never changed)
- **Control:** **NOT IMPLEMENTED** — no fan control in UI or API
- **Impact:** Fan speed is the primary real-world lever for humidity and temperature management. "Run exhaust fan at 75% for 3 hours" style advice cannot be executed.

### Water Temperature (Distinct from Air Temp)
- **Displayed:** DashboardPanel MetricCard "Water Temp" (range 18–24°C), MonitorPanel shows `waterChemistry.waterTemperatureCelsius`
- **State field:** `tankState.waterChemistry.waterTemperatureCelsius` (initialized at 20°C)
- **Control:** **NOT IMPLEMENTED** — `waterTemperatureTarget` in the API maps to **air** temperature (GameManager.ts:296), not water temp. Water temp is never updated.
- **Bug:** The control label says "Air Temperature" but the API field is `waterTemperatureTarget`. These are two different things with different optimal ranges (air: 20–26°C, water: 18–24°C).

### Dissolved Oxygen (DO)
- **Displayed:** MonitorPanel (mg/L)
- **State field:** `tankState.waterChemistry.dissolvedOxygenMgPerLiter` (initialized at 7.5)
- **Control:** **NOT IMPLEMENTED** — no aeration control. `airstoneCount: 2` is fixed in TankSpecifications.
- **Impact:** DO cannot be managed; player cannot respond to hypoxia alerts.

### VPD (Vapor Pressure Deficit)
- **Displayed:** NOT shown in UI (field exists in state)
- **State field:** `tankState.roomEnvironment.vaporPressureDeficitKpa` (initialized at 1.0, never updated)
- **Control:** **NOT IMPLEMENTED**

### Calcium (Ca) and Magnesium (Mg) — Independent Dosing
- **Displayed:** DashboardPanel shows Ca. Mg tracked in state and uptake.
- **State fields:** `macroNutrients.calciumCaMgPerLiter`, `macroNutrients.magnesiumMgMgPerLiter`
- **Control:** No Ca-only or Mg-only product exists. Base nutrient top-up only affects N, P, K.
- **Impact:** Ca deficiency (shown as symptom `calciumDeficiency`) cannot be corrected by the player. Mg deficiency likewise unaddressable.

### Individual NPK Targeting
- **Current:** Only one base nutrient product with a fixed N:P:K ratio (~50:20:40)
- **Missing:** No bloom formula (low N, high P/K), no nitrogen-only, no potassium booster
- **Impact:** Cannot shift nutrient ratios for flowering stage. Advice like "switch to 1:3:2 NPK for flower" is unexecutable.

### Micronutrients (Fe, Mn, Zn, B, Mo)
- **State fields:** All tracked in `microNutrients`
- **Control:** None (Silicon is handled via Power Si additive, but Fe, Mn, Zn, B, Mo are static and never depleted or replenished)

---

## Missing Mechanics (Priority Order)

### HIGH PRIORITY

#### 1. pH Control UI
- **What's needed:** pH Up / pH Down inputs (mL sliders or number inputs) in ControlPanel
- **Why:** pH is the most critical daily adjustment. Nutrient lockout triggers at pH <5.0 or >7.0. The engine logic (`phUpMl`/`phDownMl`) already exists in `GameManager.ts:329–340`; only the UI is missing.
- **Files to modify:** `ControlPanel.tsx`, `GameScreen.tsx` (wire `nutrientTopUp` into `actions`)
- **Effort:** Low — backend done, frontend wiring only

#### 2. Nutrient Top-Up UI (Base Nutrients)
- **What's needed:** A "Add nutrients" input (mL) in ControlPanel for base nutrient concentrate
- **Why:** N, P, K deplete daily via plant uptake. Without top-up UI, solution becomes deficient with no player recourse. Engine logic exists in `GameManager.ts:299–326`; only the UI is missing.
- **Files to modify:** `ControlPanel.tsx`, `GameScreen.tsx`
- **Effort:** Low — backend done, frontend wiring only

#### 3. Additive Scheduling System
- **What's needed:** Allow players to schedule "Apply 5 mL Chitosan every 3 days for 9 days" (start day, frequency, duration)
- **Why:** Real hydro protocol involves multi-day additive regimens. `applicationFrequencyDays` already exists on each `AdditiveProduct` as data but is unused. Currently additives reset every day.
- **Files to modify:** `GameManager.ts` (add schedule state), `GameDayActionRequest` (add schedule fields), `ControlPanel.tsx` (schedule UI), possibly new `ScheduledActions` state type
- **Effort:** Medium

#### 4. Water Temperature as Separate Control
- **What's needed:** Separate control for `waterChemistry.waterTemperatureCelsius` (heater/chiller)
- **Why:** Water temp affects DO, root health, and pathogen risk differently from air temp. Currently the API param `waterTemperatureTarget` is misrouted to air temperature — a bug.
- **Files to modify:** `GameManager.ts` (fix routing bug at line 296), `GameDayActionRequest` (add `waterTempTargetCelsius`), `ControlPanel.tsx`
- **Effort:** Low (bug fix) + Medium (UI)

### MEDIUM PRIORITY

#### 5. CO₂ Control
- **What's needed:** CO₂ ppm input/slider (400–1500 ppm) + engine logic to apply it to photosynthesis rate
- **Why:** CO₂ is displayed as a metric tile but is static at 400 ppm. Advice to "elevate CO₂ for increased yield" is currently unactionable.
- **Files to modify:** `GameDayActionRequest` (add `co2TargetPpm`), `GameManager.ts` (set `co2Ppm`), `SimulationEngine.ts` (consume CO₂ in photosynthesis calc), `ControlPanel.tsx`
- **Effort:** Medium (engine logic needed)

#### 6. Exhaust Fan / Airflow Control
- **What's needed:** Fan speed or air changes per hour slider (0–10 ACH)
- **Why:** Primary real-world tool for humidity and temperature management. `airChangesPerHour` exists in TankState but is fixed. Humidity advice ("run fan at 75%") is unactionable.
- **Files to modify:** `GameDayActionRequest` (add `exhaustFanPercent`), `GameManager.ts`, `SimulationEngine.ts` (couple fan to humidity/temp dynamics), `ControlPanel.tsx`
- **Effort:** Medium

#### 7. Flowering / Bloom Nutrient Formula
- **What's needed:** A second nutrient product with high P/K, low N (e.g., bloom formula at ~20:60:80 per mL ratio)
- **Why:** The single base nutrient product has a fixed vegetative NPK ratio. Flowering requires a fundamentally different ratio (low N, high P+K). Without this, nutrient balance advice for flower is unactionable.
- **Files to modify:** Add bloom product to `additives.ts` (or nutrient product registry), `GameManager.ts` (handle new nutrient type), `ControlPanel.tsx` (nutrient product picker)
- **Effort:** Medium

#### 8. Calcium / Magnesium Supplementation
- **What's needed:** CaMg+ product (e.g., Cal-Mag concentrate) — adds directly to `calciumCaMgPerLiter` and `magnesiumMgMgPerLiter`
- **Why:** Ca and Mg are depleted via uptake but no product restores them. Ca deficiency is tracked as a symptom but is unresolvable by the player.
- **Files to modify:** `additives.ts` (add CaMg product type), `GameManager.ts` (handle `calmag` type in additive application loop), `ControlPanel.tsx`
- **Effort:** Low

### LOW PRIORITY

#### 9. "Quick Fix" Action Buttons
- **What's needed:** One-click context buttons on metric cards (e.g., "Raise pH", "Add nutrients", "Apply Cal-Mag") that pre-populate ControlPanel values
- **Why:** Reduces friction between diagnosis and action. MetricCards already have `metricKey` props — these could route to specific control pre-fills.
- **Files to modify:** `MetricCard.tsx`, `MetricInfoModal.tsx`, `ControlPanel.tsx`, `GameScreen.tsx` (shared state callback)
- **Effort:** Medium (UX pattern work)

#### 10. Duration / Effect Tracking for Additives
- **What's needed:** Show player how many days since last additive application and when to reapply (e.g., "Chitosan: applied day 35 — reapply in 2 days")
- **Why:** `chitosanDaysSinceApplication` is already tracked in `additivesActive`. The `applicationFrequencyDays` is on each product. Just needs UI display.
- **Files to modify:** `ControlPanel.tsx` or new `AdditiveStatusPanel.tsx`
- **Effort:** Low

#### 11. New Cycle Logic
- **What's needed:** Implement `new-cycle` endpoint logic in `GameManager.ts`
- **Why:** `/api/game/:gameId/new-cycle` currently returns the old state with a TODO comment (`GameManager.ts` server.ts:179, `server.ts` line 179). Selecting a new strain after harvest doesn't actually start a new cycle.
- **Files to modify:** `GameManager.ts` (add `startNewCycle()` method), `server.ts`
- **Effort:** Medium

---

## Advice Feasibility Matrix

| Metric | Example Advice | Currently Possible? | Mechanic Needed |
|--------|---------------|---------------------|-----------------|
| pH | "Add 10 mL pH Up, target 5.8, recheck in 30 min" | **PARTIAL** — engine logic exists, no UI | pH Up/Down inputs in ControlPanel |
| EC | "Add 15 mL base nutrient to reach target EC" | **PARTIAL** — engine logic exists, no UI | Nutrient top-up input in ControlPanel |
| N | "Nitrogen low — dose base nutrient" | **PARTIAL** — engine exists, no UI | Same as EC |
| P | "Add bloom formula for flowering P levels" | **NO** — no bloom product | Bloom nutrient product + UI |
| K | "Add bloom formula for K target" | **NO** — no bloom product | Bloom nutrient product + UI |
| Ca | "Add Cal-Mag — calcium at 80 mg/L, needs 140" | **NO** — no Ca product | CaMg product in additives.ts |
| Mg | "Add Cal-Mag — magnesium deficient" | **NO** — no Mg product | CaMg product in additives.ts |
| Air Temp | "Lower temp to 22°C" | **YES** — air temp slider works | None |
| Water Temp | "Lower water temp to 18°C to raise DO" | **NO** — water temp is static, control mislabeled | Separate water temp control + GameManager bug fix |
| Humidity | "Raise humidity to 55% for veg" | **YES** — humidity slider works | None |
| PAR | "Increase PAR to 800 µmol during late veg" | **YES** — PAR slider works | None |
| Light Hours | "Switch to 12/12 to trigger flowering" | **YES** — light hours slider works | None |
| CO₂ | "Raise CO₂ to 1000 ppm for yield boost" | **NO** — CO₂ static at 400 ppm | CO₂ control + SimulationEngine integration |
| Humidity (fan) | "Run exhaust fan 75% for 3 hrs to lower RH" | **NO** — no fan control | Exhaust fan control |
| Chitosan | "Apply 10 mL every 3 days starting day 35" | **PARTIAL** — single-day apply works, no scheduling | Additive scheduling system |
| Silicon | "Apply Power Si every 14 days" | **PARTIAL** — single-day works, no scheduling | Additive scheduling system |
| DO | "Add airstone / increase aeration to raise DO" | **NO** — aeration is fixed | Aeration control or auto from fan control |
| Harvest Timing | "Harvest at 70% cloudy trichomes" | **YES** — trichome inspector + harvest button work | None |
| Flowering Trigger | "Switch to 12/12 to begin flowering" | **YES** — light hours slider triggers via SimulationEngine | None |

---

## Known Bugs

| # | Location | Description |
|---|----------|-------------|
| 1 | `GameManager.ts:296` | `actions.waterTemperatureTarget` is applied to `airTemperatureCelsius` — wrong field. Water temperature is never updated. |
| 2 | `server.ts:179` | `/new-cycle` endpoint has `// TODO: Implement new cycle logic` — returns stale state. New strain selection after harvest is broken. |
| 3 | `GameDayActionRequest` | `nutrientTopUp` is always `undefined` from the frontend (`handleExecuteDay` never passes it) — nutrient top-up is dead code. |
| 4 | `additiveApplications` in `advanceDays` | Multi-day advances apply additives **every day** of the advance period (same array passed to each `executeGameDay` call). A 7-day advance with Chitosan selected applies and charges for it 7 times. |

---

## Recommended Build Order

1. **pH Up/Down UI** — backend already done, highest gameplay impact, lowest effort
2. **Nutrient Top-Up UI** — backend already done, prevents solution crash
3. **Fix `waterTemperatureTarget` bug** — one-line fix, improves correctness
4. **Fix multi-day additive bug** — additives should only apply on day 1 of an advance
5. **CaMg+ product** — adds `calmag` type to additives, enables Ca/Mg advice
6. **Bloom nutrient formula** — enables flowering stage nutrient management
7. **Additive scheduling system** — enables multi-day protocols
8. **Exhaust fan control** — enables humidity/temp management via airflow
9. **CO₂ control** — enables yield optimization advice
10. **Quick-fix buttons on MetricCards** — UX polish, reduces action friction
11. **Additive duration/frequency display** — UX polish
12. **New cycle logic** — fix post-harvest flow
