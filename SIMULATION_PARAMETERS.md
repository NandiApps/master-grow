# HydroGrow Simulation Parameters
**Last Updated:** 2026-05-16  
**Purpose:** Document all growth rates, decay rates, and mechanics for verification and tuning

---

## Plant Health System

### Daily Health Change
- **Baseline decay:** -0.5% per day (maintenance cost of plant care)
- **Good management bonus:** +0.3% per day (when nutrients, pH, and light are optimal)
- **High photosynthesis bonus:** +0.1% per day (photosynthesis rate > 70%)
- **Stress penalty:** -1% per 10% stress above 30%
- **Disease penalty:** -1.0% per day when symptomatic (powdery mildew or botrytis)

### Health Thresholds & Effects
- **Health > 80%:** Plant thriving, all growth rates at 100%
- **Health 50-80%:** Plant healthy, minor yield impact
- **Health 20-50%:** Plant struggling, visible stress effects (desaturation)
- **Health < 20%:** Plant critical, high disease risk, minimal growth
- **Health = 0%:** Plant dead, game over

---

## Nutrient System

### Starting Concentrations (20L Tank)
- **Nitrogen (N):** 150 mg/L
- **Phosphorus (P):** 45 mg/L
- **Potassium (K):** 150 mg/L
- **Calcium (Ca):** 120 mg/L
- **Magnesium (Mg):** 30 mg/L

### Daily Uptake Rates (mg/day)
**Scaled by:** Photosynthesis rate × pH lockout factor (0.4 if pH out of range)

#### Seedling (Days 0-7)
- N: 75 mg/day
- P: 40 mg/day
- K: 100 mg/day

#### Vegetative (Days 7+, 18h light)
- N: 100 mg/day
- P: 30 mg/day
- K: 90 mg/day

#### Flowering (Days 7+, 12h light)
- N: 50 mg/day (reduced)
- P: 60 mg/day (increased)
- K: 125 mg/day (increased)

### Nutrient Optimal Ranges
- **N:** 100-180 mg/L (warning at <100, deficiency at <80)
- **P:** 30-60 mg/L (warning at <30, deficiency at <20)
- **K:** 100-180 mg/L (warning at <100, deficiency at <80)

### Time to Deficiency (No Dosing, Vegetative)
- **N:** ~14-20 days (depending on photosynthesis rate)
- **P:** ~30+ days
- **K:** ~15-25 days

### Nutrient Dosing
- **Base nutrient cost:** $0.05/mL
- **Composition per mL:** N +50 mg/L, P +20 mg/L, K +40 mg/L (in 20L tank)
- **Example:** 10mL dose = +2.5 N, +1.0 P, +2.0 K mg/L

---

## Growth Rates

### Height Growth
- **Seedling:** 5 mm/day
- **Vegetative:** 15 mm/day (boosted by optimal nutrients)
- **Early Flower:** 8 mm/day (stretch phase)
- **Late Flower:** 2 mm/day (minimal height change)

### Root Mass Growth
- **Base:** 2 grams/day (dry weight)
- **N/P factor:** Increases with available nitrogen and phosphorus
- **Hypoxia penalty:** -50% if dissolved oxygen < 5 mg/L

### Leaf Development
- **Seedling:** Cotyledons only
- **Vegetative:** +1 leaf pair per 2-3 days (up to 8 leaves)
- **Flowering:** Minimal new leaf growth, focus on bud development

### Chlorophyll Development
- **Starting:** 50% (seedling baseline)
- **Growth rate:** +0.3-0.7% per day (depends on PAR, health, N availability)
- **Maximum:** 100%
- **Growth stage bonus:** +1.5× in seedling, +0.7× during flowering

### Cannabinoid Synthesis (Flowering Only)

#### THCA Accumulation
- **Base rate:** strain.thcPercent / strain.floweringTimeDays
- **Example:** Skywalker OG (20% THC, 65 day flower) = 0.31% per day
- **PAR boost:** +15% if PAR > 900 µmol
- **Chitosan boost:** +80% multiplier during optimal window (flower days 21-42, within 10 days of application)
- **Peak production window:** Flower days 21-42 (+30% boost)
- **Maximum cap:** Strain THC% × 1.1

#### CBDA Accumulation
- **Base rate:** 0.5% per day
- **Chitosan effect:** -5% if chitosan active (slight CBD suppression when THC boosted)

#### CBN Accumulation
- **Rate:** +0.1% per day after flower day (strain.floweringTimeDays - 7)
- **Late harvest effect:** Creates aged/sedating profile

### Trichome Maturation
- **Base rate:** 1% per day (clear → cloudy → amber progression)
- **Temperature modifier:** +1.2× if >26°C, -0.9× if <18°C
- **Humidity modifier:** -0.9× if >70% (mold risk)
- **PAR modifier:** +1.15× if >1000 µmol
- **Chitosan modifier:** +1.05× boost

---

## Stress System

### Photoinhibition (Light Stress)
- **Threshold:** PAR > 1200 µmol/m²/s
- **Damage rate:** -1% plant health per day
- **Visible symptom:** Light burn on leaves
- **Mitigation:** Silicon (SuperSi) reduces PAR tolerance penalty

### Temperature Stress
- **Optimal range:** 20-24°C
- **Below 15°C or above 30°C:** Temperature stress active
- **Penalty:** Linear stress increase outside optimal range
- **Effect on cannabinoid:** Slows THCA accumulation

### Humidity Stress
- **Optimal:** 40-70% RH
- **Below 40%:** Stress penalty (-1% per 1% below 40%)
- **Above 70%:** Disease risk (powdery mildew)
- **Above 75%:** Botrytis risk

### pH Lockout
- **Optimal range:** 5.5-6.5
- **Outside range:** 60% nutrient uptake reduction
- **pH drift:** -0.1 per 100mg N uptake (natural acidification)

---

## Disease Pressure

### Powdery Mildew (PM)
- **Trigger conditions:** RH > 70% AND airflow < 4 ACH (air changes/hour)
- **Timeline:**
  - Day 1: Risk warning displayed
  - Day 2: At-risk alert (2/3 days)
  - Day 4: Symptoms appear
- **Health impact:** -2% per day (reduced to -1.2% with chitosan)
- **Prevention:** Keep humidity <70% or increase airflow

### Botrytis (Bud Rot)
- **Trigger conditions:** RH > 75% AND temperature < 20°C
- **Timeline:**
  - Day 1: Risk warning displayed
  - Day 2: At-risk alert (2/3 days)
  - Day 4: Symptoms appear
- **Health impact:** -2% per day (reduced to -1.2% with chitosan)
- **Prevention:** Maintain >20°C or reduce humidity

### Disease Resistance
- **Chitosan effect:** Reduces disease health penalty by 40% (costs $0.03/mL)
- **Efficacy window:** 7-10 days after application
- **Peak benefit:** Flower weeks 3-6

---

## Electricity & Economics

### LED Power Estimation
- **Formula:** (PAR µmol / 1000) × 400W
- **Example:** 600 µmol = 240W LED power
- **Daily usage:** LED watts × (light hours / 24)

### Heater Power Estimation
- **Baseline:** 500W (typical 500W aquarium heater)
- **Duty cycle:** ~50% (assumes temp control)
- **Daily usage:** 500W × 0.5 / 24 hours = ~10 Wh per day

### Electricity Cost
- **Default rate:** $0.28/kWh (Australian pricing)
- **Daily cost example:** (240W LED + 250W heater avg) × 18h light / 1000 = ~0.081 kWh = $0.023/day

---

## Yield Calculation

### Final Yield Formula
```
finalYield = baseYieldGrams 
           × healthFactor (0.3-1.0, based on health)
           × nutrientBalanceFactor (0.5-1.0, based on NPK)
           × lightEfficiencyFactor (0.3-1.0, based on PAR optimization)
           × stressPenaltyFactor (0.5-1.0, based on total stress)
           × qualityMultiplier (1.0-1.2, based on trichome profile)
```

### Quality Multiplier
- **Standard:** 1.0 (mixed trichome profile)
- **Premium:** 1.2 (>60% cloudy, <10% amber) - peak potency
- **Aged:** 1.1 (>30% amber) - sedating/full-spectrum

### Market Price Factors
- **Base strain price:** $8-15/gram (varies by strain)
- **Premium quality bonus:** +20% revenue
- **Aged quality bonus:** +10% revenue

---

## Growth Stage Durations

- **Seedling:** 7 days (0-7)
- **Vegetative:** ~21 days (7-28, can be extended)
- **Early Flower:** 21 days (28-49)
- **Late Flower:** Strain dependent - 7 days to harvest
- **Harvest Ready:** Triggered at day (seedlingDays + vegDays + floweringTimeDays)

---

## Test Scenarios for Verification

### Scenario 1: Perfect Management
**Setup:** 18h light, 700 PAR, 60% RH, 22°C, dosed nutrients daily
**Expected outcomes by day 31:**
- Health: 95-100% (stable or slight growth)
- Height: ~30-35cm
- N level: Maintained >120 mg/L
- Visible symptoms: None
- Plant appearance: Fully saturated green

**Actual results:** [To be filled after testing]

### Scenario 2: Nutrient Neglect
**Setup:** No nutrient dosing after day 0
**Expected outcomes by day 31:**
- N level: ~80-100 mg/L (deficiency zone) by day 20
- Health: -10-15% from baseline
- Plant appearance: Desaturated/yellowed
- Visible symptom: "Nitrogen deficiency" alert by day 18-20

**Actual results:** [To be filled after testing]

### Scenario 3: High Humidity Risk
**Setup:** 75% RH, <4 ACH, 18°C
**Expected outcomes by day 10:**
- Day 1-2: Risk/at-risk warnings
- Day 4: Botrytis symptoms appear
- Health: Decreased by 8-12% (2% per day × 4-6 days)
- Alerts: Progressive warnings visible

**Actual results:** [To be filled after testing]

### Scenario 4: Light Stress
**Setup:** 1200+ PAR µmol, no mitigation
**Expected outcomes by day 7:**
- Photoinhibition stress active
- Health: -1% per day = -7% by day 7
- Plant appearance: Visible stress (desaturation)
- Visible symptom: "Light burn" alert

**Actual results:** [To be filled after testing]

---

## Notes for Balance Adjustments

These parameters are designed for:
- **Realism:** Match real hydroponic growing cycles
- **Observability:** Changes visible within 14-31 day test windows
- **Education:** Players learn consequences of neglect within gameplay timeframe
- **Challenge:** Game requires active management; idling is not optimal strategy

If testing reveals issues:
- Health changes too slow → increase baseline decay (e.g., -1% instead of -0.5%)
- Nutrient depletion too fast → reduce uptake multiplier
- Disease triggers too easily → increase days-to-symptoms threshold (e.g., >4 instead of >3)
- Rewards don't incentivize good play → boost recovery bonus (+0.5% instead of +0.3%)

---

## Version History

| Date | Changes |
|------|---------|
| 2026-05-16 | Initial documentation with all updated mechanics including health decay, early disease warnings, visual stress effects |
