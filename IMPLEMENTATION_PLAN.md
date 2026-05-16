# HydroGrow Advice & Mechanics Implementation Plan

**Date:** 2026-05-16  
**Based on:** PLAYER_CONTROL_AUDIT.md  
**Objective:** Ensure every piece of gameplay advice is actionable by the player

---

## Metrics: Actionable vs. Needs Mechanics

### ✅ FULLY ACTIONABLE (Can advise now)
| Metric | Current Control | Advice Example | Effort |
|--------|-----------------|-----------------|---------|
| Air Temperature | Slider 15–30°C | "Lower temp to 22°C to reduce mold risk" | None |
| Humidity | Slider 30–80% | "Raise humidity to 55% for early veg" | None |
| PAR (Light Intensity) | Slider 200–1500 µmol | "Increase PAR to 900 during late veg" | None |
| Light Schedule | Slider 8–24 hrs | "Switch to 12/12 to trigger flowering" | None |
| Harvest Timing | Button + Trichome Inspector | "Harvest at 70% cloudy trichomes" | None |

---

### ⚠️ PARTIAL (Backend exists, UI missing)
| Metric | Gap | Action Needed | Priority | Effort |
|--------|-----|---------------|----------|--------|
| pH | No UI controls | Add pH Up/Down sliders (0–50 mL) | **HIGH** | Low |
| EC / NPK (Base) | No UI controls | Add nutrient top-up input (0–100 mL) | **HIGH** | Low |
| Calcium | No product | Add Cal-Mag additive product | **HIGH** | Low |
| Magnesium | No product | Add Cal-Mag additive product | **HIGH** | Low |
| Additives (multi-day) | No scheduling | Implement additive schedule system | **MEDIUM** | Medium |

---

### ❌ NOT ACTIONABLE (Need new mechanics)
| Metric | Why | Mechanic Needed | Priority | Effort |
|--------|-----|-----------------|----------|--------|
| Water Temperature | Static, control mislabeled | Separate water temp slider + bug fix | **HIGH** | Low |
| Phosphorus (flowering) | No bloom formula | Bloom nutrient product (20:60:80 NPK) | **MEDIUM** | Low |
| Potassium (flowering) | No bloom formula | Bloom nutrient product (20:60:80 NPK) | **MEDIUM** | Low |
| CO₂ | Static at 400 ppm | CO₂ slider + photosynthesis integration | **MEDIUM** | Medium |
| Humidity (via airflow) | No fan control | Exhaust fan speed slider + humidity coupling | **MEDIUM** | Medium |
| Dissolved Oxygen | Fixed aeration | Aeration control or auto-couple to fan | **MEDIUM** | Medium |

---

## Build Order (Token-Efficient Sequence)

### Phase 1: Quick Wins (Backend done, UI only) — ~4 tasks
1. **Bug fix:** `waterTemperatureTarget` → `waterChemistry.waterTemperatureCelsius` (1 line)
2. **Bug fix:** Multi-day additives apply only on day 1 (5 lines)
3. **pH UI:** Add pH Up/Down sliders to ControlPanel → wire to GameDayActionRequest
4. **Nutrient Top-Up UI:** Add base nutrient mL input → wire to GameDayActionRequest

**Impact:** Fixes 4 metrics to fully actionable (pH, EC, N, P from base formula, K from base formula)

---

### Phase 2: Low-Effort Products (~2 tasks)
5. **Cal-Mag product:** Add to additives.ts with calmag type → update additive handler in GameManager
6. **Bloom nutrient formula:** Add as second nutrient product option → update ControlPanel nutrient picker

**Impact:** Fixes Ca, Mg, P (bloom), K (bloom) to fully actionable

---

### Phase 3: Medium-Effort Controls (~3 tasks)
7. **Water Temperature slider:** Add separate control (18–24°C) → wire to GameDayActionRequest
8. **CO₂ slider:** Add (400–1500 ppm) → integrate into SimulationEngine photosynthesis
9. **Exhaust fan slider:** Add (0–100% or 0–10 ACH) → couple to humidity/temp dynamics in SimulationEngine

**Impact:** Fixes water temp, CO₂, humidity (via fan) to fully actionable

---

### Phase 4: Systems (~2 tasks)
10. **Additive scheduling:** Multi-day regimen UI + state tracking + only apply on target days
11. **MetricInfoModal updates:** For each metric, provide specific advice (current → target → action → frequency → outcome)

**Impact:** Completes advice system; enables multi-day protocols

---

### Phase 5: Polish
12. **New cycle logic:** Implement `/api/game/:gameId/new-cycle` in GameManager + server
13. **(Optional) Quick-fix buttons:** One-click actions on metric cards to pre-populate controls

---

## Advice Template for MetricInfoModal

Each metric needs **specific, actionable advice** only if mechanics exist:

```
### {Metric Name}

**Current:** {current_value} {unit}  
**Target:** {target_value} {unit}  
**Why:** {consequence_if_ignored}

**Action:**
- Product: {product_name}  
- Quantity: {amount} {unit}  
- Frequency: {daily / one-time / every N days}  
- Duration: {N days / until next harvest / etc}  
- Expected outcome: {benefit}

**Timing:** Apply {when in growth cycle}  
**Cost:** ${cost}
```

---

## Metrics Advice Mapping

### ✅ Air Temperature
- **Current control:** Slider 15–30°C
- **Advice:** "Maintain 22–24°C during veg, drop to 20–22°C during flower to increase trichome density"

### ✅ Humidity
- **Current control:** Slider 30–80%
- **Advice:** "Vegetative: 55–70%, Flowering: 45–55% to prevent mold and boost oil production"

### ✅ PAR
- **Current control:** Slider 200–1500 µmol
- **Advice:** "Early veg: 400 µmol, Late veg: 800–1000 µmol, Flower: 1000–1200 µmol for max yield"

### ✅ Light Hours
- **Current control:** Slider 8–24 hours
- **Advice:** "Use 18/6 (18 hrs on) for veg, switch to 12/12 to trigger flowering"

### ✅ Harvest Timing
- **Current control:** Trichome inspector + harvest button
- **Advice:** "Harvest at 70% cloudy trichomes for balanced THC/CBD, 90% amber for sedative effect"

---

### ⚠️ pH (After UI added)
- **Action:** pH Up/Down sliders in ControlPanel
- **Advice:** "Current pH {X}, target 5.8. Add {N} mL pH Up/Down, recheck in 1 day. Maintain 5.5–6.5 to prevent lockout."

### ⚠️ EC / Base Nutrients (After UI added)
- **Action:** Nutrient Top-Up input in ControlPanel
- **Advice:** "EC low ({X}). Add 15 mL base nutrient, expect EC +0.3. Maintain EC 1.2–1.8 during veg, 1.4–2.0 during flower."

### ⚠️ Calcium (After Cal-Mag product)
- **Action:** Cal-Mag additive product
- **Advice:** "Calcium deficiency detected. Apply 8 mL Cal-Mag product. Target 80–120 mg/L. Reapply every 2 weeks."

### ⚠️ Magnesium (After Cal-Mag product)
- **Action:** Cal-Mag additive product
- **Advice:** "Magnesium low ({X} mg/L). Apply 8 mL Cal-Mag product. Target 40–60 mg/L. Pair with calcium adjustment."

### ⚠️ Phosphorus (Bloom) (After Bloom product)
- **Action:** Bloom nutrient formula selector + dose input
- **Advice:** "Flowering: Switch to Bloom formula (20:60:80 NPK). Apply 10 mL, target P level {X} mg/L. Reapply every 3 days."

### ⚠️ Potassium (Bloom) (After Bloom product)
- **Action:** Bloom nutrient formula selector
- **Advice:** "Potassium critical for flower density. Use Bloom formula (high K). Maintain K at 150–200 mg/L during flower."

---

### ❌→✅ Water Temperature (After separate control added)
- **Action:** Water Temperature slider 18–24°C (separate from air temp)
- **Advice:** "Water temp {X}°C. Optimal: 18–22°C. Lower by 2°C to increase DO and prevent root rot. Use chiller if needed."

### ❌→✅ CO₂ (After slider + engine integration)
- **Action:** CO₂ ppm slider 400–1500 ppm
- **Advice:** "CO₂ at 400 ppm (ambient). Raise to 1000 ppm during flower to boost photosynthesis +15% yield. Requires ventilation."

### ❌→✅ Humidity via Fan (After fan control added)
- **Action:** Exhaust fan speed slider 0–100%
- **Advice:** "Humidity {X}%. Run exhaust fan at 75% for 2 hours to drop to 55%. Monitor for mold if RH >60% + low airflow."

### ❌ Dissolved Oxygen
- **Current:** Static at 7.5 mg/L (no control)
- **Advice:** *Deferred pending aeration control implementation*

---

## Implementation Checklist

- [ ] Phase 1a: Fix waterTemperatureTarget bug
- [ ] Phase 1b: Fix multi-day additive bug
- [ ] Phase 1c: Add pH Up/Down UI
- [ ] Phase 1d: Add nutrient top-up UI
- [ ] Phase 2a: Add Cal-Mag product
- [ ] Phase 2b: Add Bloom nutrient formula
- [ ] Phase 3a: Add water temp slider
- [ ] Phase 3b: Add CO₂ slider + SimulationEngine integration
- [ ] Phase 3c: Add exhaust fan slider + humidity/temp coupling
- [ ] Phase 4a: Implement additive scheduling system
- [ ] Phase 4b: Update MetricInfoModal with all advice
- [ ] Phase 5a: Implement /new-cycle endpoint
- [ ] Phase 5b: (Optional) Quick-fix buttons on metric cards

---

## Notes for Advice Writing

1. **Only advise what's actionable.** If a metric has no UI control, don't mention it in advice (e.g., avoid CO₂ advice until slider is added).
2. **Be specific.** Instead of "adjust nutrients," say "add 15 mL base nutrient to raise EC from 1.1 to 1.4."
3. **Include timing.** Tell player when to apply (daily, every 3 days, once during flower, etc.).
4. **Link to game mechanics.** Every recommendation should map to exactly one UI control or product.
5. **Quantify outcomes.** "Reapply every 3 days" vs. "keep applying"—be precise about frequency.

