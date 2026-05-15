# HydroGrow — Simulator Framework (STEP 1)

**Version:** Complete Simulator Specification  
**Focus:** Peer-reviewed research, advanced grower simulator, Australian market  
**Target:** Educate players to become better hydroponic cultivators  

---

# I. CORE STATE VARIABLES

## A. Plant State (per plant)

| Variable | Range | Unit | Updates | Notes |
|----------|-------|------|---------|-------|
| **Growth Stage** | Seedling → Veg → Early Flower → Late Flower → Harvest-Ready | Phase | Daily | Determined by strain + light schedule + age |
| **Plant Height** | 5–200 | cm | Daily | Affected by light quality, nutrients, strain |
| **Leaf Area Index (LAI)** | 0.5–6.0 | m²/m² | Daily | Indicates canopy density; affects light penetration |
| **Stem Diameter** | 2–25 | mm | Daily | Affected by SuperSi, wind stress, genetics |
| **Root Mass** | 10–500 | g dry weight | Weekly | Affects nutrient/water uptake efficiency |
| **Chlorophyll Content** | 0–100 | % relative | Daily | Indicates N status; visual yellowing at <40% |
| **Plant Health** | 0–100 | % | Daily | Composite of nutrient status, stress, disease |
| **Flowering Progress** | 0–100 | % | Daily (after trigger) | Days since 12h/12h initiated; affects cannabinoid synthesis |
| **Bud Density** | Sparse–Dense | Scale 1–10 | Daily (flower) | Affected by PAR, K, P levels |
| **Trichome Maturity** | Clear → Cloudy → Amber | % distribution | Daily (weeks 6–10) | Player inspects via mini-game; determines THC/CBD ratio |

## B. Nutrient Solution State (per tank)

| Variable | Range | Unit | Updates | Notes |
|----------|-------|------|---------|-------|
| **pH** | 4.5–8.0 | Scale | Daily | Target: 5.5–6.5 veg, 6.0–7.0 flower; drift modeled |
| **EC (Electrical Conductivity)** | 0.5–3.0 | mS/cm | Daily | Target: 1.3–1.7 veg, 1.2–2.0 flower |
| **PPM (Parts Per Million)** | 200–2000 | ppm | Daily | Derived from EC; used for dosing calculations |
| **N (Nitrogen)** | 0–400 | mg/L | Daily | Depletion via plant uptake; input via nutrients |
| **P (Phosphorus)** | 0–150 | mg/L | Daily | Depletion + input tracked separately |
| **K (Potassium)** | 0–300 | mg/L | Daily | Critical for flower; depletion affects bud size |
| **Ca (Calcium)** | 0–200 | mg/L | Daily | Secondary nutrient; deficiency causes necrosis |
| **Mg (Magnesium)** | 0–80 | mg/L | Daily | Inter-vein chlorosis if low (<30 mg/L) |
| **Si (Silicon, from SuperSi)** | 0–50 | mg/L | Per dose | Affects plant stress tolerance; accumulates in tissue |
| **Chitosan Concentration** | 0–10 | mg/L | Per application | Triggers defense signaling; degrades over 7–10 days |
| **Tank Volume** | 5–100 | L | Static | Player selects; affects dosing precision and buffering |
| **Water Temperature** | 15–30 | °C | Daily | Optimal 18–22°C; >25°C = root rot risk, hypoxia |
| **Dissolved O₂** | 0–10 | mg/L | Daily | Root oxygen; affected by temp, aeration, microbial load |
| **Total Dissolved Solids (TDS)** | 200–2000 | ppm | Daily | Cumulative salt; triggers water changes at >1150 ppm |

## C. Environmental State (grow room)

| Variable | Range | Unit | Updates | Notes |
|----------|-------|------|---------|-------|
| **PAR (PPFD)** | 0–1500 | µmol/m²/s | Per adjustment | Player sets; affects photosynthesis, stress, terpenes |
| **Light Spectrum** | VEG/FLOWER | Mode | Per schedule | VEG = blue-heavy (18h); FLOWER = red-heavy (12h) |
| **Light Schedule** | 0–24 | hours on/day | Per schedule | 18/6 veg → 12/12 flower transition triggers flowering |
| **Room Temperature** | 15–35 | °C | Daily | Optimal: 22–26°C day, 18–21°C night |
| **Relative Humidity (RH)** | 20–95 | % | Daily | Optimal: 50–70% veg, 40–60% flower; high RH = mold risk |
| **CO₂ Concentration** | 400–2000 | ppm | Daily | Ambient 400; elevated (1000–1500) can increase growth 10–30% |
| **Air Circulation** | 0–5 | Air Changes/Hour (ACH) | Per setup | Affects humidity, temperature, stem strength |
| **Vapor Pressure Deficit (VPD)** | 0.5–4.0 | kPa | Calculated | = (Sat. VP at temp) − (RH × Sat. VP); drives transpiration |

## D. Additive Application History

| Variable | Range | Unit | Tracked | Notes |
|----------|-------|------|---------|-------|
| **SuperSi Dose Dates** | List | [Day, mL/tank] | Per application | Accumulates in plant tissue; half-life ~14 days |
| **Chitosan Dose Dates** | List | [Day, mL/tank, concentration] | Per application | Triggers jasmonic acid; active window ~7–10 days |
| **Other Additive Doses** | List | [Day, mL/tank, type] | Per application | Kelp, MeJA, triacontanol, etc. |
| **Last Water Change** | Day | Day # | Last change | Triggers EC/salt tracking; water age affects microbial load |

## E. Market & Economics

| Variable | Range | Unit | Updates | Notes |
|----------|-------|------|---------|-------|
| **Market Price/Gram** | 10–20 | AUD/g | Static (per strain) | Locked at harvest based on seed tier |
| **Electricity Cost/kWh** | 0.25–0.35 | AUD/kWh | Static | Player-set at game start (regional variation) |
| **Water Cost/100L** | 0.30–0.50 | AUD | Static | Minimal; varies by region |
| **Cumulative Spend** | 0–∞ | AUD | Ongoing | Nutrients, additives, electricity, equipment |
| **Cumulative Revenue** | 0–∞ | AUD | Per harvest | Yield (g) × Market Price/g |

---

# II. GROWTH SIMULATION ENGINE

## A. Daily Update Loop

Each in-game day, the simulator performs:

```
1. Check light schedule (18h/6h veg vs. 12h/12h flower)
   - If transition to 12h/12h triggered, set flowering_start_day
   
2. Update plant stage (Seedling → Veg → Early Flower → Late Flower)
   - Days in stage determine morphology, metabolic rate
   
3. Calculate Photosynthesis Rate
   photosynthesis_rate = f(PAR, chlorophyll%, temperature, CO2, leaf_area)
   - Higher PAR → higher photosynthesis (until saturation ~1000 µmol)
   - Lower temp (<18°C) → reduced enzyme activity
   - Higher CO2 (1000+ ppm) → +10–30% photosynthesis
   
4. Update Nutrient Uptake
   uptake_N = chlorophyll% × photosynthesis_rate × (growth_rate_multiplier)
   uptake_P = flowering_progress × (uptake_N × 0.3)
   uptake_K = flowering_progress × (uptake_N × 0.4)
   uptake_Ca, uptake_Mg, uptake_Si calculated similarly
   - Uptake inhibited if pH out of range (see lockout section)
   
5. Update Plant Morphology
   height_increase_cm = growth_stage_rate × nutrient_balance × (PAR_efficiency) × temp_factor
   LAI_increase = (leaf_formation_rate) × veg_phase_indicator
   stem_diameter_increase = base_rate × (SuperSi_concentration / 10) × root_mass
   - SuperSi increases stem strength (less lodging risk)
   
6. Update Root Mass
   root_growth = (nitrogen_uptake × 0.15) + (phosphorus × 0.08) + base_respiration
   root_mass *= (dissolved_O2 / 8)  # Hypoxia penalty
   - Low O2 (<3 mg/L) kills fine roots; reduces uptake 50%
   
7. Update Cannabinoid Synthesis (flowering only)
   CBDA_accumulation = base_cannabinoid_potential × (PAR_stress_factor) × (chitosan_signaling) × (time_in_flower)
   - Higher PAR (>900) triggers stress response: +10–20% CBDA
   - Chitosan applied days 21–35 of flower: +40–80% CBDA/THCA
   - Synthesis timeline: Week 6–9 of flower is peak production
   
8. Update Trichome Maturity (week 6 onward)
   If flowering_progress >= 40%:
      clear_trichomes = (100 - cloudy - amber)
      cloudy_trichomes = (flowering_progress × 2.5) capped at 80%
      amber_trichomes = max(0, flowering_progress - 75)
   - Player inspects to determine harvest timing
   - Clear trichomes = higher THCV (racy), Amber = higher CBN (sedating)
   
9. Update Environmental Stress
   photoinhibition_risk = (PAR > 1100) AND (SuperSi_level < 30 mg/L)
   if photoinhibition_risk:
      plant_health -= 5%
      chlorophyll% -= 10%
      photosynthesis_rate *= 0.7
   - SuperSi mitigates photoinhibition; prevents damage at high PAR
   
10. Update Nutrient Deficiency Symptoms
    if N_mg/L < 80:
       chlorophyll% -= 2%  # Yellowing visible
       plant_health -= 3%
    if P_mg/L < 20 (flower):
       flowering_rate *= 0.9  # Slowed maturation
       plant_health -= 2%
    if K_mg/L < 50 (flower):
       bud_density -= 1 pt  # Smaller buds
       plant_health -= 2%
    if Ca_mg/L < 40:
       leaf_tip_burn = True  # Visual indicator
    if Mg_mg/L < 20:
       inter_vein_chlorosis = True  # Magenta/yellow
    
11. Update Disease/Pest Pressure
    powdery_mildew_risk = (RH > 70%) AND (air_circulation < 2 ACH)
    if powdery_mildew_risk > 50%:
       plant_health -= 5% per day
       photosynthesis_rate *= 0.8
    botrytis_risk = (RH > 60%) AND (temp > 24°C) AND (air_circulation < 2)
    if botrytis_risk > 70% (in flower):
       yield_loss = 20%+
    - Chitosan application reduces disease risk by 40% (immune signaling)
    
12. Update Electricity Usage
    daily_kwh = (PAR_watts / 1000) × (light_hours / 24) + support_equipment_kw
    daily_cost_AUD = daily_kwh × electricity_rate_AUD_per_kWh
    
13. Update Tank Chemistry Drift
    EC_drift = (uptake_total / tank_volume) × (-0.05)  # Nutrient depletion
    EC_drift += (water_top_off / tank_volume) × 0.02  # Salt accumulation
    If EC > 2.0: water_change_recommended = True
    pH_drift = base_drift + (N_uptake × 0.001)  # N uptake acidifies solution
    if pH < 5.2: nutrient_lockout_N = True
    if pH > 7.0: nutrient_lockout_P = True
    
14. Output: Updated plant state, tank state, costs, visible symptoms
```

## B. Nutrient Uptake & Lockout

**Nutrient availability depends on pH:**

| pH Range | Status | Affected Nutrients |
|----------|--------|-------------------|
| <5.2 | Too Acidic | Ca, Mg, P locked (can't absorb) |
| 5.5–6.5 | Optimal | All nutrients available |
| 6.8–7.5 | Slightly High | P, Fe, Mn reduced availability |
| >7.5 | Too High | Most micronutrients locked |

**EC/PPM Effects:**

| EC Level | Status | Plant Response |
|----------|--------|-----------------|
| <0.8 | Too Low | Slow growth, pale leaves |
| 1.3–1.7 (veg) | Optimal | Normal growth, stable health |
| 1.2–2.0 (flower) | Optimal | Peak bud development |
| >2.2 | Nutrient Burn | Leaf burn, reduced uptake, health ↓ |

---

# III. ADDITIVE MECHANICS (Research-Backed)

## A. SuperSi (Mono Silicic Acid)

**Dosage:** 5–10 mL per 20L tank, every water change (every 10–14 days)

**Mechanism:**
- Silica deposits in plant vascular tissue (xylem walls, epidermal cells)
- Increases cell wall strength, stem diameter, photosynthetic efficiency
- Enhances stress tolerance (osmotic stress, photoinhibition, disease)

**Game Effects:**

| Effect | Magnitude | Research Basis |
|--------|-----------|-----------------|
| Stem Diameter +5–10% | Per dose | [GreenPlanet Power Si, RQS Silicon] |
| Photoinhibition Tolerance | -50% damage at PAR >1000 | [Cell wall strengthening] |
| Disease Resistance | -30% powdery mildew/botrytis risk | [Silicon antimicrobial properties] |
| Root Health | +20% fine root density | [Enhanced root development] |
| Nutrient Uptake | +10% overall uptake efficiency | [Silicon enhances nutrient transport] |

**Accumulation Model:**
```
Si_tissue_level = accumulated_Si_doses × 0.8 ^ (days_since_dose / 14)
  - Half-life ~14 days in tissue
  - Effects persist but decay if dosing stops
  - Max tissue Si ~50 mg/L before saturation
```

**Optimal Timing:**
- Start at veg (week 2)
- Continue through entire cycle
- Especially critical during high-PAR phases (flower)

## B. Chitosan (Plant Defense Signaling)

**Dosage:** 10–50 mL foliar spray OR 5–10 mL tank additive, applied 1–2 times per week, weeks 3–6 of flower

**Mechanism:**
- Chitosan oligomers trigger MAPK signaling cascades in plant cells
- Activates jasmonic acid (JA), salicylic acid (SA), ethylene pathways
- Plant perception: "Under pathogenic threat" → allocate resources to secondary metabolites
- Terpene/cannabinoid synthesis increases as "defense chemistry"

**Game Effects (Research-Backed):**

| Effect | Magnitude | Research Basis |
|--------|-----------|-----------------|
| CBDA Production | +40–80% (peak) | [Chitosan + MeJA: +78.4% CBDA, ScienceDirect 2025] |
| Terpene Production | +60–95% (peak) | [Chitosan + MeJA: +94.7% terpenes] |
| Flavonoid Content | +30–50% | [Foliar chitosan hemp study] |
| Phenolic Compounds | +36–69% | [Field hemp chitosan trials] |
| Harvest Speed | -3–5 days | [Accelerated flower maturation via JA signaling] |
| Disease Resistance | -40% pathogen risk | [Immune signaling activation] |

**Application Window:**
- **Too early (weeks 0–2):** Plant immature, signaling ineffective → wasted dose
- **Weeks 3–4 (Early Flower):** Optimal; 70–80% efficacy
- **Weeks 5–6 (Peak Bud Development):** 60–70% efficacy; still effective
- **Weeks 7+ (Late Flower):** 20–30% efficacy; diminishing returns

**Dosage Sensitivity:**
```
efficacy_ratio = 1.0 if (dose_optimal)
efficacy_ratio *= 0.6 if (dose_low: <5 mL/tank)
efficacy_ratio *= 0.8 if (dose_high: >20 mL/tank)  # Oversaturation penalty
efficacy_ratio *= 0.9 if (applied_too_early)
efficacy_ratio *= 0.7 if (applied_too_late: week 8+)
```

**Stress Response Curve:**
```
terpene_boost = base_boost × (1 + chitosan_concentration × 0.05) × efficacy_ratio
  - Concentration 10 mg/L: +50% terpenes
  - Concentration 20 mg/L: +75% terpenes
  - Concentration >30 mg/L: diminishing returns, risk of plant stress
```

## C. Methyl Jasmonate (MeJA) - Premium Additive

**Dosage:** 5 mL per 20L tank, applied 1–2 times (weeks 4–5 of flower)

**Mechanism:**
- Synthetic jasmonic acid (plant hormone)
- Directly activates JA signaling pathway (faster than chitosan)
- Maximal terpene/cannabinoid induction

**Game Effects:**

| Effect | Magnitude | Research Basis |
|--------|-----------|-----------------|
| CBDA/THCA Boost | +50–100% | [Direct JA activation] |
| Terpene Boost | +70–100% | [Fastest terpene induction] |
| Cannabinoid Potency | +5–10% THC | [Upregulation of THC synthase] |
| Cost (AUD) | $30–50 per 250mL | [AU suppliers] |

**Trade-off:** Expensive, narrow application window, high sensitivity to timing.

## D. Kelp Extract (Budget Alternative)

**Dosage:** 10 mL per 20L tank, every water change

**Mechanism:**
- Natural plant hormones (auxins, cytokinins, gibberellins)
- Trace minerals (Mn, Zn, B, Mo)
- Mild stress resilience boost

**Game Effects:**

| Effect | Magnitude | Research Basis |
|--------|-----------|-----------------|
| Growth Rate | +5–10% | [Natural hormone content] |
| Terpene Boost | +5–15% | [Mild, indirect] |
| Disease Resistance | +10% | [Trace minerals, immune support] |
| Cost (AUD) | $10–15 per 500mL | [AU suppliers] |

**Use Case:** Beginner-friendly, low-risk, consistent mild benefits.

---

# IV. PAR STRATEGY (Tension Variable)

## A. PAR Zones & Plant Response

| PAR Level | Zone | Growth | Stress | Terpenes | Risk |
|-----------|------|--------|--------|----------|------|
| 400–600 | Safe Low | Slow | None | Baseline | None |
| 600–800 | Optimal | Normal | Minimal | Baseline | Low |
| 800–1000 | Aggressive | Fast | Moderate | +10–20% | Moderate |
| 1000–1200 | High Stress | Very Fast | High | +30–50% | High |
| >1200 | Photoinhibition | Damage | Severe Stress | Risk of burn | Critical |

## B. Photoinhibition Mechanism

**Without SuperSi:**
```
If PAR > 1000 AND SuperSi_tissue < 25 mg/L:
  daily_health_loss = (PAR - 1000) × 0.005  # ~5% loss/day at PAR 1000
  daily_chlorophyll_loss = (PAR - 1000) × 0.008
  photosynthesis_rate *= 0.8 (reduced by damage)
```

**With SuperSi:**
```
If PAR > 1000 AND SuperSi_tissue >= 25 mg/L:
  daily_health_loss = max(0, (PAR - 1000) × 0.001)  # ~80% reduction in damage
  photosynthesis_rate *= 0.95 (minimal impact)
  stress_response += 10  # Triggers secondary metabolite production
```

## C. Secondary Metabolite Induction via Stress

**Terpene production under controlled PAR stress:**
```
stress_factor = (PAR - 800) / 400, capped at 1.0
terpene_synthesis_boost = stress_factor × 0.3  # Up to +30% at PAR 1200
  - Requires SuperSi to avoid plant damage
  - Requires Chitosan to fully unlock (synergistic effect)
  
terpene_with_chitosan = terpene_synthesis_boost × (1 + chitosan_signaling × 1.5)
  - High PAR (1000) + SuperSi + Chitosan = +50–80% terpenes (research-backed)
```

## D. Player PAR Decision Points

Each week, player adjusts PAR intensity:
- **Low (600):** Safe, consistent yields, baseline terpenes, no additive need
- **Medium (800):** Balanced, normal yields, mild terpene boost
- **High (1000):** Aggressive, requires SuperSi, stress response begins
- **Very High (1100+):** Requires both SuperSi + Chitosan timing; high yield potential but complex management

---

# V. TRICHOME MINI-GAME

## A. Mechanics

**Activation:** Triggered at week 6 of flower (flowering_progress >= 40%)

**Interface:**
- Player zooms into bud (3D model, magnified view)
- Sees individual trichome heads (glass-like spheres)
- Can inspect trichome color: Clear → Cloudy → Amber

**Maturity States & Effects:**

| State | Color | THC/CBD Profile | High Sensation | Time to Next State |
|-------|-------|-----------------|-----------------|-------------------|
| Clear | Transparent | High THCV, low THC | Racy, energetic | ~7 days |
| Cloudy | Milky-white | High THC, minimal CBD | Balanced, euphoric | ~5 days |
| Amber | Brownish-gold | High CBN, declining THC | Sedating, couch-lock | Degradation begins |

**Harvest Readiness:**

| Target | Clear % | Cloudy % | Amber % | Recommendation |
|--------|---------|----------|---------|-----------------|
| Energetic | 30 | 60 | 10 | "Ready for daytime effect" |
| Balanced | 10 | 70 | 20 | "Peak potency & balance" |
| Sedating | 0 | 30 | 70 | "Ready for nighttime effect" |

## B. Game Logic

```
daily_trichome_update (flower week 6+):
  days_in_flower = current_day - flowering_start_day
  base_maturation_rate = 0.5% per day  # Baseline progression
  
  # Modifiers
  if temperature > 26°C:
    maturation_rate *= 1.2  # Heat accelerates ripening
  if RH > 70%:
    maturation_rate *= 0.9  # High humidity slows ripening
  if PAR > 1000:
    maturation_rate *= 1.15  # High light accelerates ripening
  if last_chitosan_applied < 14_days_ago:
    maturation_rate *= 1.05  # Chitosan signals accelerated maturation
    
  cloudy_trichomes += base_maturation_rate × maturation_rate
  amber_trichomes = max(0, cloudy_trichomes - 80)  # Clear → Cloudy → Amber
  
  if amber_trichomes > 60%:
    THC_potency *= 0.95 per day  # THC degrades to CBN
    yield_loss_per_day = 0.3%  # Bud degradation risk
```

**Player Decision:**
- Inspect trichomes every 2–3 days (optional)
- Choose harvest timing based on desired effect & potency
- Early harvest = higher THCV (energetic) but lower overall yield
- Late harvest = higher CBN (sedating), risk of mold/degradation

---

# VI. STRAIN GENETICS MODEL

## A. Strain Template (ILGM Catalog)

Each strain is defined by:

```json
{
  "name": "Bruce Banner",
  "seed_cost_AUD": 83.85,
  "market_price_per_gram": 11.87,
  "type": "feminized",
  "thc_potential": 31,
  "cbd_potential": 0.5,
  "flowering_time_days": 65,
  "difficulty": "Intermediate",
  "base_yield_grams": 110,
  "terpene_profile": {
    "limonene": 35,
    "myrcene": 25,
    "caryophyllene": 20,
    "others": 20
  },
  "growth_characteristics": {
    "height_multiplier": 1.1,
    "leaf_size": "large",
    "internodal_spacing": "medium",
    "bud_density": "high"
  },
  "responsive_to_stress": true,
  "par_tolerance": 1100,
  "chitosan_responsiveness": 0.85
}
```

## B. Phenotypic Variation

Each strain has inherent variation:
```
actual_yield = base_yield × (0.85 + random(0, 0.3))  # ±15% natural variation
actual_thc = thc_potential × (0.8 + random(0, 0.4))
actual_terpenes = terpene_profile × (0.8 + random(0, 0.4))
```

## C. Strain × Strategy Interactions

**High PAR + Chitosan responsiveness:**
- "Bruce Banner" (responsive: 0.85): Gets full 78% CBDA boost from optimal Chitosan timing
- "Godfather OG" (responsive: 0.70): Gets ~55% CBDA boost (less responsive strain)
- "Low-Terp Strain" (responsive: 0.40): Gets ~30% boost (poor responder)

**Stress Tolerance:**
- Some strains (e.g., indica-dominant) tolerate high PAR better
- Sativa strains may show photoinhibition sooner (require more SuperSi)

---

# VII. AUSTRALIAN MARKET CONTEXT

## A. Real Suppliers & Pricing

### Terra Aquatica (GH) Flora Series

**Supplier:** West Coast Hydroponics (wchydro.com.au)

| Product | Size | Cost AUD | Cost per mL |
|---------|------|----------|------------|
| TriPart Micro (1L) | 1L | $99 | $0.099 |
| TriPart Grow (1L) | 1L | $99 | $0.099 |
| TriPart Bloom (1L) | 1L | $99 | $0.099 |

**Per 90-day cycle (4 water changes @ 20L each):**
- 3 bottles × 1L = $297 AUD
- Usage: ~100 mL total per cycle
- Cost per cycle: ~$30–40

### SuperSi/PowerSi

**Typical Cost:** $15–25 per 500mL bottle  
**Dosage:** 5–10 mL per 20L tank  
**Per 90-day cycle (4 water changes):** ~$60–80 total

### Chitosan

**Typical Cost:** $20–30 per 500g powder  
**Dosage:** 10–50 mL per foliar spray (1–2× per week)  
**Per 90-day cycle:** ~$50–80 total

### Electricity (AU Average)

**Rate:** $0.28–0.35 AUD per kWh  
**600W LED @ 18h veg (21 days):** 227.6 kWh = $64–80 AUD  
**600W LED @ 12h flower (69 days):** 497.2 kWh = $139–174 AUD  
**Total per cycle:** ~$200–250 AUD

## B. Seed Availability

All ILGM strains are:
- Available via ILGM direct shipping to Australia (where legal)
- Priced in AUD equivalent (~$70–130 per 10-seed pack)
- Feminized seeds (no male plants)
- Guaranteed germination

---

# VIII. COMPLETE GAMEPLAY LOOP

## Turn Structure: Daily (In-Game Day)

**Morning (Player Action Phase):**
1. **Monitor** plant state:
   - View plant height, leaf color, health %
   - Check tank parameters (pH, EC, temp)
   - See growth rate (cm/day), flowering progress (%)
   - Optional: Inspect trichomes (week 6+)
2. **Adjust** growing conditions:
   - Set PAR intensity (0–1200 µmol/m²/s)
   - Adjust light schedule (maintain 18/6 or switch to 12/12)
   - Set water temperature target (16–26°C)
   - Set humidity target (40–75% RH)
3. **Apply Additives** (optional):
   - SuperSi dose (mL, per water change)
   - Chitosan spray (mL, timing critical)
   - Other supplements
4. **Perform Maintenance:**
   - Water top-off (if EC drifting high)
   - Full water change (if TDS >1150 ppm)
   - Check for disease/deficiency symptoms

**Afternoon (Simulation Phase):**
- Simulator runs daily update loop (see Section II)
- Plants grow, absorb nutrients, produce cannabinoids
- Additives take effect over days/weeks
- Trichomes mature

**Evening (Results Phase):**
- Player sees daily growth metrics
- Gets notifications:
  - "pH drifting below 5.5 — nitrogen lockout risk!"
  - "Powdery mildew detected — increase air circulation"
  - "Chitosan efficacy window closing (5 days remaining)"
- Electricity costs accumulate
- Market prices fluctuate (±10% volatility)

## Win Condition (Single Cycle)

**Complete a harvest with:**
- Yield ≥ 50g (minimum viable)
- Trichomes inspected (player made harvest decision)
- Profit ≥ $0 (break-even acceptable for first cycle)

## Progression (Multiple Cycles)

**Cycle 1:** Learn basics, break even
**Cycle 2+:** Optimize strategy (high PAR + SuperSi + Chitosan timing)
**Master Grower:** 5+ cycles, cumulative profit $5000+ AUD, consistent 100g+ yields with >30% terpene boost

---

# IX. EDUCATIONAL OUTCOMES

By playing HydroGrow, a grower learns:

1. **PAR Optimization:** How light intensity affects yield and secondary metabolites
2. **EC/pH Management:** Real-time feedback on nutrient availability
3. **Trichome Assessment:** When to harvest for desired effect/potency
4. **Plant Signaling Chemistry:** How chitosan/jasmonic acid trigger terpene production
5. **Stress Management:** Using SuperSi to enable controlled stress strategies
6. **Cost-Benefit Analysis:** Balancing expensive additives against yield gains
7. **Strain Selection:** Different genetics respond differently to same strategies
8. **Real-World Budgeting:** Actual AU supplier prices, electricity costs

---

# X. RESEARCH CITATIONS

**PAR & Light:**
1. [Frontiers Plant Science 2022] Indoor-grown cannabis yield increased proportionally with light intensity  
   https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2022.974018

2. [Seed Bank, 2024] Understanding PAR, PPFD, DLI for Cannabis Growth  
   https://www.seedbank.com/understanding-par-ppfd-and-measuring-grow-light-intensity

3. [Frontiers Plant Science 2021] Cannabinoids and Terpenes as Photo-Protectants  
   https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2021.620021

**Chitosan & Plant Signaling:**
4. [ScienceDirect 2025] Effects of MeJA + Chitosan on Hemp Inflorescences  
   https://www.sciencedirect.com/science/article/pii/S0926669025012956

5. [PMC 2023] Chitosan on Cannabis Root Growth & Defense Response  
   https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10290428/

6. [MDPI 2023] Chitosan-Based Foliar Application on Hemp Phytochemical Content  
   https://www.mdpi.com/2223-7747/12/21/3692

**Silicon/SuperSi:**
7. [RQS Blog, 2024] Using Silicon Supplements for Healthier Cannabis  
   https://www.royalqueenseeds.com/blog-using-silicon-supplements-to-cultivate-healthier-cannabis-plants-n199

8. [DudeGrows, 2024] How to Use Silica in Cannabis Garden  
   https://dudegrows.com/use-silica-cannabis-garden/

**Nutrient Management:**
9. [Royal Queen Seeds, 2024] Cannabis Water Quality: PPM & EC  
   https://www.royalqueenseeds.com/blog-cannabis-water-quality-part-2-ppm-ec-n298

10. [ILGM, 2024] pH and EC/PPM Levels for Cannabis Plants  
    https://www.ilovegrowingmarijuana.com/growing/ph-and-ecppm-levels-for-cannabis-plants/

**PGR Comparison:**
11. [RQS Blog, 2024] What are PGRs and How Do They Affect Cannabis  
    https://www.royalqueenseeds.com/us/blog-what-are-pgrs-and-how-do-they-affect-your-weed-n1417

12. [Humboldt Seeds, 2024] Plant Growth Regulators on Cannabis  
    https://www.humboldtseeds.net/en/blog/plant-growth-regulators-weed/

---

## NEXT: STEP 2

**Create JSON data structures to model:**
- Strain genetics (all ILGM catalog entries)
- Additive products (real AU suppliers)
- Plant state variables
- Growth simulation parameters
- Market data

**Then:** STEP 3 expands supplier database + finalizes economic model.
