# HydroGrow Testing Guide
**Date:** 2026-05-16  
**Purpose:** Verify game balance fixes and mechanics work as designed

---

## Overview of Changes Tested

1. ✅ **Single Difficulty Setting** - Removed beginner/normal/hard selector, hardcoded 'normal'
2. ✅ **Health Change Visibility** - Added daily health delta display in MonitorPanel
3. ✅ **Nutrient Sufficiency Meter** - NPK balance tracker showing overall nutrient health
4. ✅ **Plant Status Card** - Overview showing status, days to harvest, profit, recommendations
5. ✅ **Grow Cycle Milestones** - Visual tracker of key lifecycle events
6. ⏳ **Health Decay Mechanics** - Baseline -0.5%/day + recovery bonus system
7. ⏳ **Disease Prevention Warnings** - Early warnings before symptoms appear

---

## Test Scenario 1: Perfect Management (Baseline)

**Objective:** Verify health improves under optimal conditions

**Setup:**
- Start a new game with any strain
- Set PAR: 700 µmol, Light: 18h, Humidity: 60%, Temperature: 22°C
- Dose nutrients daily to keep N > 150, P > 45, K > 150

**Expected Results by Day 10:**
- Health: 100% → 98-100% (small baseline decay offset by good management bonus)
- Plant appearance: Fully saturated green, no stress effects
- MonitorPanel shows: Health change "~+0.1%" (positive green indicator)
- No warnings or alerts displayed

**Verification:**
- [ ] Health change indicator shows positive delta
- [ ] Plant visual remains vibrant (no desaturation)
- [ ] No warnings in alerts section
- [ ] Height growth visible (should see +mm growth per day)

---

## Test Scenario 2: Nutrient Neglect

**Objective:** Verify nutrient deficiency develops without dosing

**Setup:**
- Start a new game
- Set optimal light/temp/humidity (700 PAR, 18h, 60% RH, 22°C)
- **Do NOT dose any nutrients after day 0**

**Expected Results by Day 20:**
- N level: Drops from 150 → ~80-100 mg/L (deficiency range)
- Nutrient Sufficiency meter: Drops to ~65% by day 15, ~40% by day 20
- MonitorPanel shows: "🟡 Nitrogen low" alert around day 15-18
- Health decays: 100% → ~85% (no recovery bonus without good management)
- Plant visual: Desaturated/yellowed appearance (CSS saturation effect)

**Verification:**
- [ ] Nitrogen deficiency warning appears at expected time
- [ ] Nutrient Sufficiency meter reflects declining NPK
- [ ] Plant desaturates as health declines
- [ ] Health change shows negative delta (-0.5% ≈ -0.005 per day)

---

## Test Scenario 3: High Humidity Disease Risk

**Objective:** Verify progressive disease warnings and prevention

**Setup:**
- Start a new game
- Set humidity: 75% (above 70% threshold)
- Set temperature: 18°C (below 20°C, combined creates botrytis risk)
- Maintain airflow < 4 ACH
- Keep all other conditions optimal

**Expected Results:**
- Day 1: Risk warning appears ("⚠️ Botrytis risk")
- Day 2: At-risk alert displayed
- Day 4: Symptoms appear ("⚠️ Botrytis" in alerts)
- Health impact: -2% per day starting day 4

**Verification:**
- [ ] Progressive warnings appear on expected days
- [ ] Botrytis alert appears by day 4
- [ ] Health change shows negative delta from day 4 onward
- [ ] Reducing humidity below 70% should clear alert

---

## Test Scenario 4: Light Stress Photoinhibition

**Objective:** Verify excessive PAR causes measurable damage

**Setup:**
- Start a new game
- Set PAR: 1250 µmol (above 1200 threshold)
- All other conditions optimal (22°C, 60% RH, 18h light)
- Maintain good nutrients

**Expected Results by Day 7:**
- Photoinhibition alert: "🔴 Light stress" appears
- Health: 100% → ~93% (light stress penalty of -1% per day)
- Plant visual: Visible desaturation (CSS filter effect)
- MonitorPanel shows negative health change

**Verification:**
- [ ] Light stress alert appears
- [ ] Health degradation matches expected rate
- [ ] Plant appearance shows stress (desaturated)
- [ ] Reducing PAR below 1000 should resolve alert

---

## Test Scenario 5: Flowering Transition & Cannabinoid Production

**Objective:** Verify cannabinoid accumulation and trichome maturation

**Setup:**
- Start game with feminized strain (e.g., Skywalker OG - 65 day flowering)
- Maintain optimal conditions through vegetative and into flowering
- Trigger flowering around day 28-30 by reducing light to 12h

**Expected Progression:**
- **Day 7-28:** Vegetative growth (seedling days + veg days)
- **Day 28:** Flowering initiation triggered
- **Days 28-49:** Early flower, THCA accumulation begins
- **Days 50-65:** Late flower, peak cannabinoid production (days 21-42 of flower)
- **Day 93:** Harvest ready

**Verification:**
- [ ] Growth stages progress correctly
- [ ] Flowering initiated at expected time
- [ ] THCA % visible in MonitorPanel once flowering starts
- [ ] Trichome inspector shows progression (clear → cloudy → amber)
- [ ] Milestones tracker shows completed milestones in green
- [ ] "Days to Harvest" countdown accurate

---

## Test Scenario 6: Difficulty Unification

**Objective:** Verify single difficulty setting is used

**Setup:**
- Start a new game
- Verify StartScreen does NOT show difficulty selector buttons
- Verify game starts without difficulty selection

**Expected Results:**
- StartScreen only shows: Player Name, Strain Selection, "Start Growing" button
- Game starts with 'normal' difficulty automatically
- GameManager receives difficulty: 'normal' in request

**Verification:**
- [ ] No difficulty selector visible
- [ ] Game starts successfully
- [ ] Console shows no difficulty-related errors

---

## Test Scenario 7: UI Enhancements

**Objective:** Verify new UI components display correctly

**Setup:**
- Start a new game and reach day 5+

**PlantStatusCard Checks:**
- [ ] Status badge shows current status (Thriving/Healthy/Struggling/Critical)
- [ ] Days to harvest count down correctly
- [ ] Profit/Loss displays with correct color (green if positive, red if negative)
- [ ] Focus areas show 1-2 relevant recommendations
- [ ] Milestones show completed in green, upcoming grayed out

**MonitorPanel Enhancements:**
- [ ] Health metric shows daily change (e.g., "+0.15%" or "-0.50%")
- [ ] Change indicator is green for positive, red for negative
- [ ] Nutrient Sufficiency meter updates as NPK changes
- [ ] All nutrient fields still display correctly

---

## Quick Validation Checklist

Run through each item to verify system is working:

### Frontend Build
- [ ] `npm run build` completes without errors
- [ ] No TypeScript compilation errors
- [ ] CSS loads correctly (no layout issues)
- [ ] Components render without console errors

### Backend Build
- [ ] `npm run build` in engine/ completes without errors
- [ ] No TypeScript compilation errors

### Game Flow
- [ ] Can start new game
- [ ] Can execute days without crashing
- [ ] Can harvest when ready
- [ ] Session persistence works (save/resume)

### Simulation Accuracy
- [ ] Health changes visible daily
- [ ] Nutrient depletion happens on realistic timeline (~14-20 days for N)
- [ ] Disease warnings appear before symptoms
- [ ] Stress effects visible on plant appearance

---

## Notes for Balance Adjustment

If testing reveals issues:

| Issue | Adjustment |
|-------|-----------|
| Health changes too slow | Increase baseline decay from -0.5% to -1% |
| Nutrient depletion too fast | Reduce uptake multiplier (scale by 0.8) |
| Disease triggers too easily | Increase days-to-symptoms threshold |
| Disease triggers too late | Decrease days-to-symptoms threshold |
| Recovery bonus insufficient | Increase from +0.3% to +0.5% |
| Game too easy | Reduce good management bonus or increase decay |
| Game too hard | Increase good management bonus or reduce decay |

---

## Version History

| Date | Status | Notes |
|------|--------|-------|
| 2026-05-16 | Created | Initial testing guide for balance fixes |
