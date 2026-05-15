# HydroGrow — Cannabis Game Mechanics Framework

## Core Gameplay Loop
**Turn structure:** 1 turn = 1 day in-game time

Each day, the player:
1. **Monitor** — Check plant health, resource levels, market prices
2. **Adjust** — Tweak light schedule (veg 18h / flower 12h), nutrient ratios, water delivery
3. **Buy/Sell** — Purchase seeds from ILGM catalog; harvest and sell crop at strain-based market rate
4. **Advance** — Tick simulation forward (plant grows, resources deplete, time passes)

Repeat until harvest, then start new cycle with different strain (or replay same strain).

---

## Seed Catalog (Real ILGM Data)

Players select a strain at game start. Each strain has distinct properties:

| Strain | Seed Cost | THC% | Difficulty | Cycle | Base Yield (g/plant) | Price/g (AUD) |
|--------|-----------|------|------------|-------|----------------------|----------------|
| Skywalker OG | $70.85 | 20% | Beginner | 60-70d | 75 | $10.00 |
| Godfather OG | $70.85 | 28% | Beginner | 60-70d | 85 | $10.00 |
| Blue Dream | $70.85 | 29% | Beginner | 60-70d | 80 | $10.00 |
| G13 | $70.85 | 20% | Intermediate | 65-75d | 90 | $10.00 |
| GG4 (Gorilla Glue) | $83.85 | 20% | Beginner | 65-75d | 95 | $11.87 |
| Bruce Banner | $83.85 | 31% | Intermediate | 65-75d | 110 | $11.87 |
| Girl Scout Cookies | $83.85 | 30% | Beginner | 60-70d | 105 | $11.87 |
| OG Kush Auto | $99.00 | 27% | Beginner | 8-10w | 70 | $14.07 |
| Blue Dream Auto | $99.00 | 22% | Beginner | 8-10w | 65 | $14.07 |
| Afghan Auto | $99.00 | 17% | Beginner | 8-10w | 60 | $14.07 |
| Bruce Banner Auto | $129.00 | 29% | Beginner | 10-12w | 85 | $18.31 |
| Banana Kush Auto | $129.00 | 21% | Beginner | 10-12w | 80 | $18.31 |

**Pricing Formula:** `Market price per gram = $10 × (Seed cost / $70.85)` — higher-tier seeds command premium prices at harvest.

---

## Resources (Player-Managed)

| Resource | Unit | Decay/Use | Gameplay Role |
|----------|------|-----------|---------------|
| **Money** | AUD | Earnings only | Buy seeds; gate progression |
| **Water** | L/day | Consumed | Nutrient delivery; excess = root rot risk |
| **Nutrients (N-P-K)** | g/tank | Consumed | Plant health; imbalance = deficiency |
| **Light** | hours/day | Electricity cost | Critical: 18h veg / 12h flower triggers flowering |
| **Electricity** | kWh | Cost | Powers lights, pumps, climate control |
| **Time** | days | Always ticking | Crop lifecycle (60–130 days depending on strain) |
| **Tank Health** | % | Degrades if neglected | Equipment breakdowns; contamination |

---

## Growth Stages & Light Schedule

**Critical mechanic: Light hours trigger flowering.**

### Vegetative Stage (0–3 weeks typical)
- **Light:** 18h on / 6h off (mandatory)
- **Nutrients:** High Nitrogen (N-heavy ratio, e.g., 7-9-5)
- **Water:** 1.5–2L/day for single plant
- **Goal:** Grow root mass, leaf structure, plant size

### Flowering Stage (triggered by 12h light / 12h dark)
- **Light:** Switch to 12h on / 12h off (strict—no light leaks)
- **Nutrients:** Shift to high P/K (e.g., 3-8-8), reduce N
- **Water:** 1.5–2L/day (same, but more sensitive to pH/EC)
- **Duration:** 8–10 weeks for photoperiod strains; 8–10 weeks total for autoflowers

---

## Cause & Effect: Decisions → Outcomes

### Light Schedule Mistakes
| Decision | Effect |
|----------|--------|
| Keep 18h light during intended flowering | Plant never flowers; wasted weeks; 0 yield |
| Incorrect 12h (e.g., 13h or 11h) | Delayed/stunted flowering; yield ↓ 30% |
| Light leaks during dark period | Hermaphrodite risk (plant grows both pistils/pollen); ↓ quality |
| Perfect 12h/12h once flowering starts | Optimal progression; normal timeline |

### Nutrient Transitions
| Decision | Effect |
|----------|--------|
| Stay on vegetative N-heavy feed during flowering | Excess vegetative growth, minimal buds; yield ↓ 40% |
| Switch to flower nutrients at day 21 (before flower) | Stunted growth; poor final size; yield ↓ 20% |
| Perfect transition (week 3–4) | Optimal bud development; normal yield |
| Nutrient imbalance (e.g., K deficiency) | Brown leaf edges, slow bud growth; yield ↓ 15% |

### Water & pH Management
| Decision | Effect |
|----------|--------|
| Optimal pH (5.5–6.5) + 1.5–2L/day | Nutrient uptake perfect; stable health |
| pH too high (>6.8) | Nutrient lockout; yellowing leaves; health ↓ 20%/day |
| pH too low (<5.5) | Calcium/magnesium issues; twisted leaves; health ↓ 10%/day |
| Overwatering (>3L/day) | Root rot, oxygen deprivation; health ↓ 5%/day |
| No water change for 30+ days | Salt buildup, EC rises; nutrient lockout |

### Difficulty Impact
| Difficulty | Forgiveness | Symptom Speed |
|------------|-------------|---------------|
| Beginner strains | +20% health buffer, slower deficiency onset | Symptoms appear day 2–3 |
| Intermediate strains | Normal | Symptoms appear day 1–2 |
| Autoflower strains | Shorter cycle (10–12 weeks) but less forgiving mid-flower | Less time to recover from mistakes |

---

## Yield Calculation

```
Final Yield (g) = Base Yield × Health Multiplier × Nutrient Balance × Light Efficiency × Difficulty Modifier
```

**Base Yield:** Strain-dependent (60–110g per plant, raw).

**Health Multiplier:** Avg plant health over entire cycle (0–1.0 scale, starts at 1.0).
- Perfect conditions → 1.0
- Minor stress → 0.95
- Deficiency/lockout → 0.85
- Severe stress → 0.7

**Nutrient Balance:** Penalty for ratios far from ideal.
- Perfect N:P:K ratio for stage → 1.0
- Off-ratio → 0.9–0.95

**Light Efficiency:** Based on light schedule adherence.
- Perfect 18h veg / 12h flower → 1.0
- Slightly wrong (e.g., 17h or 13h) → 0.85
- Way off (e.g., 20h or 10h) → 0.5–0.6

**Difficulty Modifier:** Beginner strains get +10% yield cushion.

---

## Market & Sales

**Harvest window:** Day 45–70 (photoperiod), Day 50–75 (autoflower), depending on strain.

Player can harvest any time after "ready" status. Early harvest = lower potency/yield; late harvest = peak yield but risk of bud rot (2%/day after peak).

**Sell price per gram:** Strain-based (locked at harvest).
- Cheapest strains (e.g., Skywalker OG): $10/g
- Premium strains (e.g., Bruce Banner): $11.87/g
- Highest-tier autos (e.g., Bruce Banner Auto): $18.31/g

**Revenue example:**
- Grow Bruce Banner (base yield 110g) with perfect conditions
- Final yield: 110g × 1.0 × 1.0 × 1.0 × 1.0 = 110g
- Revenue: 110g × $11.87/g = **$1,305.70 AUD**
- Seed cost: $83.85
- Nutrient/electricity cost (estimate): $80
- **Net profit: ~$1,140**

---

## Win Condition & Progression

### Win (Single Cycle)
**Complete 1 successful harvest (60–130 days depending on strain):**
- Plant reaches harvest stage (strain-dependent day threshold)
- Yield ≥ 50g (minimum viable)
- Profit ≥ +$200 AUD after all costs

### Progression (Multiple Cycles)
- Unlock better equipment (better pumps, sensors, climate control) as money accumulates
- Unlock access to premium strains (e.g., can't buy $129 Bruce Banner Auto until you've earned $500+)
- Expand to 2–3 simultaneous crops (multi-grow progression)
- Master all strains (grow each at least once; each strain teaches different lessons)

### Mastery (Long-term)
- Reach "Master Grower" rank: 5+ successful harvests, cumulative profit $5,000 AUD
- Challenge modes: Grow highest-THC strain, fastest autoflower finish, biggest yield, etc.

---

## Difficulty Modifiers (Future)

### Beginner
- No random events
- Stable market prices
- Health degradation slower
- +10% yield cushion per harvest

### Normal
- Random equipment failures (5% chance/day): pump/heater/sensor breaks; repair $50–150
- Market prices ±10% volatility
- Health degrades at normal rate
- Standard yield calculation

### Hard
- Equipment failures (8% chance/day)
- Market ±20% volatility
- Algae/root rot pressure (3% chance/week if water quality poor)
- Health degrades faster
- No yield cushion

---

## Resource Economy (Starter Setup)

| Item | Cost (AUD) |
|------|-----------|
| Starter hydro kit (tank, lights, pump, pH kit) | $500 |
| Cannabis seed (10-pack, cheapest tier) | $70.85 |
| Nutrient set (veg + flower formulas) | $80 |
| Electricity (per 90-day cycle @ 600W) | ~$80 |
| Water (negligible) | <$5 |

**Break-even timeline:**
- Cycle 1 (Skywalker OG, 75g yield): $750 revenue – $80 costs – $500 kit amortized = **Loss, ~$50**
- Cycle 2 (same strain, reuse kit): $750 revenue – $80 costs = **+$670 profit**
- Cycle 3+ (premium strain): $1,200+ revenue – $80 costs = **+$1,100+ profit**

---

## Next Steps
1. Confirm mechanics feel right (strain selection, light schedule trigger, yield formula)
2. Refine nutrient costs and equipment pricing
3. Lock in JSON data structures (Crop, NutrientProduct, PlayerState, GrowthSimulation)
4. Build web scraper for nutrient products (General Hydroponics, Masterblend, etc.)
