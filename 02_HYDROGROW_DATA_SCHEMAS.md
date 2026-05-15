# HydroGrow — Data Schemas (STEP 2)

**Purpose:** Define all JSON structures needed to implement the simulator framework.  
**Status:** Implementation-ready with examples.

---

# I. STRAIN SCHEMA

## Template

```json
{
  "id": "bruce-banner",
  "name": "Bruce Banner",
  "breeder": "ILGM",
  "seed_cost_aud": 83.85,
  "market_price_per_gram": 11.87,
  "seed_type": "feminized",
  "type_dominant": "hybrid",
  "sativa_indica_ratio": 60,
  
  "cannabinoid_genetics": {
    "thc_potential_percent": 31,
    "cbd_potential_percent": 0.1,
    "cbda_potential_percent": 31.5,
    "thc_synthesis_rate_per_day": 0.45
  },
  
  "terpene_genetics": {
    "primary_terpene": "limonene",
    "terpene_profile": {
      "limonene": 35,
      "myrcene": 25,
      "caryophyllene": 20,
      "pinene": 10,
      "humulene": 5,
      "others": 5
    },
    "base_terpene_total_percent": 2.5,
    "responsiveness_to_chitosan": 0.85,
    "responsiveness_to_par_stress": 0.80,
    "responsiveness_to_temperature": 0.75
  },
  
  "flowering_characteristics": {
    "flowering_time_min_days": 60,
    "flowering_time_max_days": 70,
    "flowering_time_average": 65,
    "light_schedule_requirement": "12/12"
  },
  
  "morphology": {
    "height_multiplier": 1.10,
    "max_height_cm": 180,
    "leaf_size": "large",
    "internodal_spacing_cm": 3.5,
    "bud_density_scale_1_to_10": 8,
    "bud_structure": "dense_compact"
  },
  
  "yield_genetics": {
    "base_yield_grams": 110,
    "yield_phenotypic_variation_percent": 15,
    "yield_per_watt": 1.2,
    "responsive_to_stress": true,
    "stress_yield_penalty_high_par_no_additive": 0.40
  },
  
  "tolerance_characteristics": {
    "par_tolerance_max_umol": 1100,
    "par_tolerance_no_supersi": 900,
    "temperature_tolerance_min_celsius": 15,
    "temperature_tolerance_max_celsius": 28,
    "temperature_optimal_celsius": 24,
    "humidity_tolerance_min_percent": 30,
    "humidity_tolerance_max_percent": 80,
    "humidity_optimal_percent": 55,
    "ec_tolerance_min_mscm": 1.0,
    "ec_tolerance_max_mscm": 2.2,
    "ph_tolerance_min": 5.3,
    "ph_tolerance_max": 7.0
  },
  
  "disease_susceptibility": {
    "powdery_mildew_susceptibility_scale_1_to_10": 6,
    "botrytis_susceptibility_scale_1_to_10": 5,
    "root_rot_susceptibility_scale_1_to_10": 4,
    "nutrient_deficiency_sensitivity": "medium"
  },
  
  "difficulty_level": "intermediate",
  "grow_time_total_days_seed_to_harvest": 100,
  "recommended_hydro_system": "dwc_or_nft"
}
```

## Examples

### Beginner Strain (Skywalker OG)

```json
{
  "id": "skywalker-og",
  "name": "Skywalker OG",
  "seed_cost_aud": 70.85,
  "market_price_per_gram": 10.00,
  "thc_potential_percent": 20,
  "base_yield_grams": 75,
  "responsiveness_to_chitosan": 0.65,
  "par_tolerance_max_umol": 950,
  "difficulty_level": "beginner"
}
```

### Premium Strain (Bruce Banner Auto)

```json
{
  "id": "bruce-banner-auto",
  "name": "Bruce Banner Autoflower",
  "seed_cost_aud": 129.00,
  "market_price_per_gram": 18.31,
  "thc_potential_percent": 29,
  "base_yield_grams": 85,
  "flowering_time_average": 60,
  "responsiveness_to_chitosan": 0.88,
  "par_tolerance_max_umol": 1150,
  "difficulty_level": "beginner"
}
```

---

# II. ADDITIVE PRODUCT SCHEMA

## Template

```json
{
  "id": "supersi-powersi",
  "name": "Power Si Original",
  "type": "plant_signaling",
  "category": "stress_tolerance",
  "active_compound": "mono_silicic_acid",
  "supplier": "West Coast Hydroponics",
  "supplier_url": "wchydro.com.au",
  
  "pricing": {
    "cost_aud": 18.50,
    "bottle_size_ml": 500,
    "cost_per_ml_aud": 0.037
  },
  
  "dosage": {
    "dosage_ml_per_20l_tank": 8,
    "dosage_ml_per_liter": 0.4,
    "concentration_mg_per_liter": 40,
    "application_frequency_days": 14
  },
  
  "application": {
    "method": "nutrient_solution_additive",
    "timing": "every_water_change",
    "start_week": 2,
    "end_week": 10,
    "frequency_per_cycle": 4
  },
  
  "mechanism": {
    "description": "Silica deposition in vascular tissue, cell wall strengthening",
    "signaling_pathway": "none",
    "plant_perception": "structural_support"
  },
  
  "effects": {
    "stem_diameter_increase_percent": 8,
    "photoinhibition_tolerance_increase_percent": 50,
    "disease_resistance_increase_percent": 30,
    "root_development_increase_percent": 20,
    "nutrient_uptake_efficiency_increase_percent": 10,
    "terpene_boost_percent": 0,
    "cannabinoid_boost_percent": 0,
    "harvest_speed_reduction_days": 0
  },
  
  "accumulation": {
    "tissue_accumulation_model": "exponential",
    "half_life_days": 14,
    "max_tissue_concentration_mg_per_liter": 50,
    "effectiveness_requires_minimum_tissue_mg_per_liter": 25
  },
  
  "research_citations": [
    "RQS: Using Silicon for Healthier Cannabis",
    "Green Planet: Power Si Effects"
  ]
}
```

## Chitosan Example

```json
{
  "id": "chitosan-foliar",
  "name": "Chitosan Foliar Spray",
  "type": "plant_signaling",
  "category": "secondary_metabolite_booster",
  "active_compound": "chitosan_oligomers",
  "supplier": "Aqua Gardening Australia",
  
  "pricing": {
    "cost_aud": 25.00,
    "bottle_size_ml": 500,
    "cost_per_ml_aud": 0.050
  },
  
  "dosage": {
    "dosage_ml_per_foliar_application": 30,
    "concentration_mg_per_ml": 20,
    "frequency_per_week": 1.5,
    "applications_per_cycle": 6
  },
  
  "application": {
    "method": "foliar_spray",
    "timing": "flowering_phase",
    "optimal_start_week": 3,
    "optimal_end_week": 6,
    "efficacy_window_days": 10
  },
  
  "mechanism": {
    "description": "MAPK cascade activation, jasmonic acid synthesis, salicylic acid upregulation",
    "signaling_pathway": "plant_defense_response",
    "plant_perception": "pathogenic_threat",
    "secondary_metabolite_redirect": true
  },
  
  "effects": {
    "cbda_boost_percent": 78,
    "thca_boost_percent": 78,
    "terpene_boost_percent": 95,
    "flavonoid_boost_percent": 49,
    "phenolic_boost_percent": 21,
    "disease_resistance_percent": 40,
    "harvest_speed_reduction_days": 4,
    "stem_diameter_increase_percent": 0
  },
  
  "timing_sensitivity": {
    "too_early_efficacy_multiplier": 0.60,
    "optimal_window_efficacy_multiplier": 1.0,
    "too_late_efficacy_multiplier": 0.30,
    "overdose_penalty_multiplier": 0.80
  },
  
  "research_citations": [
    "ScienceDirect 2025: Chitosan + MeJA Effects on Hemp",
    "PMC 2023: Chitosan on Cannabis Defense Response"
  ]
}
```

---

# III. PLANT STATE SCHEMA

## Template

```json
{
  "plant_id": "plant_001",
  "game_day": 45,
  "strain_id": "bruce-banner",
  "grow_cycle_number": 1,
  
  "morphology": {
    "height_cm": 85,
    "height_growth_today_cm": 2.1,
    "stem_diameter_mm": 12,
    "leaf_area_index_m2_per_m2": 3.5,
    "node_count": 18,
    "branch_count": 12
  },
  
  "physiology": {
    "chlorophyll_percent": 95,
    "chlorophyll_change_today_percent": 0,
    "plant_health_percent": 98,
    "plant_health_change_today_percent": 0,
    "root_mass_grams_dry_weight": 145,
    "root_development_percent": 75,
    "biomass_grams_dry_weight": 230
  },
  
  "growth_stage": {
    "stage": "vegetative",
    "days_in_stage": 32,
    "stage_progress_percent": 0,
    "next_stage": "early_flower",
    "days_to_next_stage": 5
  },
  
  "light_response": {
    "current_par_umol_per_m2_per_s": 750,
    "light_schedule_hours_on": 18,
    "light_schedule_hours_off": 6,
    "photosynthesis_rate_relative": 1.0,
    "photoinhibition_risk_percent": 0,
    "par_stress_response_active": false
  },
  
  "flowering": {
    "flowering_initiated": false,
    "flowering_start_day": null,
    "days_in_flower": 0,
    "flowering_progress_percent": 0,
    "expected_harvest_day": null,
    "flower_stretch_phase": false,
    "bud_density_scale_1_to_10": 0
  },
  
  "cannabinoid_synthesis": {
    "cbda_accumulation_percent": 0.0,
    "thca_accumulation_percent": 0.0,
    "cbn_accumulation_percent": 0.0,
    "thc_equivalent_percent_if_harvested_today": 0.0,
    "cbd_equivalent_percent_if_harvested_today": 0.0,
    "total_cannabinoid_percent": 0.0
  },
  
  "trichome_maturity": {
    "clear_trichomes_percent": 100,
    "cloudy_trichomes_percent": 0,
    "amber_trichomes_percent": 0,
    "maturation_start_day": null,
    "days_to_peak_maturity": 35,
    "optimal_harvest_day_low_par": 75,
    "optimal_harvest_day_high_par": 70
  },
  
  "visible_symptoms": {
    "nitrogen_deficiency": false,
    "phosphorus_deficiency": false,
    "potassium_deficiency": false,
    "calcium_deficiency": false,
    "magnesium_deficiency": false,
    "powdery_mildew": false,
    "botrytis": false,
    "nutrient_burn": false,
    "light_burn": false
  },
  
  "stress_indicators": {
    "heat_stress_active": false,
    "cold_stress_active": false,
    "humidity_stress_active": false,
    "nutrient_lockout_active": false,
    "photoinhibition_active": false,
    "hypoxia_active": false,
    "total_stress_percent": 0
  },
  
  "additive_history": [
    {
      "day": 14,
      "additive_id": "supersi-powersi",
      "dose_ml": 8,
      "concentration_mg_per_liter": 40,
      "effectiveness_multiplier": 1.0
    }
  ],
  
  "nutrient_uptake_today": {
    "n_mg": 2.5,
    "p_mg": 0.8,
    "k_mg": 2.1,
    "ca_mg": 1.2,
    "mg_mg": 0.4,
    "si_mg": 0.3
  },
  
  "cumulative_yield_estimate_grams": 110,
  "yield_modifiers": {
    "genetic_base": 1.0,
    "health_factor": 0.98,
    "nutrient_balance_factor": 0.99,
    "light_efficiency_factor": 0.95,
    "stress_penalty_factor": 1.0
  }
}
```

---

# IV. TANK/ENVIRONMENT STATE SCHEMA

## Template

```json
{
  "tank_id": "tank_001",
  "game_day": 45,
  
  "tank_specifications": {
    "volume_liters": 20,
    "system_type": "dwc",
    "air_stone_count": 1,
    "heater_wattage": 300,
    "temperature_controller_active": true
  },
  
  "water_chemistry": {
    "ph": 6.1,
    "ph_drift_per_day": -0.05,
    "ec_mscm": 1.45,
    "ppm": 725,
    "total_dissolved_solids_ppm": 725,
    "water_temperature_celsius": 19.5,
    "dissolved_oxygen_mg_per_liter": 7.2,
    "water_age_days": 9
  },
  
  "macronutrients": {
    "nitrogen_n_mg_per_liter": 95,
    "phosphorus_p_mg_per_liter": 45,
    "potassium_k_mg_per_liter": 120,
    "calcium_ca_mg_per_liter": 80,
    "magnesium_mg_mg_per_liter": 35,
    "sulfur_s_mg_per_liter": 25
  },
  
  "micronutrients": {
    "silicon_si_mg_per_liter": 12,
    "iron_fe_mg_per_liter": 2.5,
    "manganese_mn_mg_per_liter": 1.2,
    "zinc_zn_mg_per_liter": 0.5,
    "boron_b_mg_per_liter": 0.3,
    "molybdenum_mo_mg_per_liter": 0.05
  },
  
  "additives_active": {
    "chitosan_mg_per_liter": 0,
    "chitosan_days_since_application": null,
    "meija_mg_per_liter": 0,
    "kelp_extract_concentration": 0
  },
  
  "room_environment": {
    "air_temperature_celsius": 24,
    "air_temperature_min_celsius": 18,
    "air_temperature_max_celsius": 28,
    "relative_humidity_percent": 55,
    "vapor_pressure_deficit_kpa": 1.2,
    "co2_ppm": 450,
    "light_par_umol_per_m2_per_s": 750,
    "air_changes_per_hour": 3
  },
  
  "maintenance_log": [
    {
      "day": 14,
      "action": "water_change",
      "volume_replaced_liters": 20,
      "ec_before_change": 1.68,
      "ec_after_change": 1.45
    },
    {
      "day": 28,
      "action": "nutrient_dose",
      "additive": "supersi-powersi",
      "amount_ml": 8
    }
  ],
  
  "alerts": [],
  "warnings": [
    "pH drifting downward (−0.05/day); monitor for nitrogen lockout"
  ]
}
```

---

# V. GAME STATE SCHEMA

## Template

```json
{
  "game_id": "game_001",
  "player_name": "Grower",
  "game_start_day": 0,
  "current_game_day": 45,
  "game_status": "in_progress",
  
  "cycle_information": {
    "cycle_number": 1,
    "selected_strain_id": "bruce-banner",
    "selected_strain_name": "Bruce Banner",
    "seed_purchased_day": 0,
    "seed_cost_aud": 83.85,
    "germination_day": 1,
    "seedling_transplant_day": 10,
    "expected_harvest_day": 100,
    "harvest_status": "growing",
    "harvest_day": null,
    "final_yield_grams": null,
    "final_yield_quality": null
  },
  
  "economics": {
    "starting_budget_aud": 1000.00,
    "current_cash_aud": 687.43,
    "total_spent_aud": 312.57,
    "total_revenue_aud": 0.0,
    "cumulative_profit_aud": -312.57,
    
    "spending_breakdown": {
      "seeds_aud": 83.85,
      "nutrients_aud": 32.14,
      "additives_aud": 18.50,
      "electricity_aud": 178.08
    },
    
    "electricity_tracking": {
      "total_kwh_used": 321.2,
      "rate_per_kwh_aud": 0.28,
      "total_electricity_cost_aud": 89.94
    }
  },
  
  "plant_roster": [
    {
      "plant_id": "plant_001",
      "status": "growing",
      "strain_id": "bruce-banner"
    }
  ],
  
  "tank_roster": [
    {
      "tank_id": "tank_001",
      "plant_id": "plant_001",
      "status": "active"
    }
  ],
  
  "settings": {
    "difficulty": "normal",
    "electricity_rate_aud_per_kwh": 0.28,
    "location": "fictional_jurisdiction"
  },
  
  "statistics": {
    "total_days_played": 45,
    "monitoring_actions_performed": 89,
    "additive_applications": 3,
    "water_changes_performed": 3,
    "nutrients_dosed_times": 12,
    "trichome_inspections": 0
  },
  
  "notifications": [
    {
      "day": 42,
      "message": "pH trending below 5.5 — nitrogen lockout risk in 3 days"
    },
    {
      "day": 45,
      "message": "Plant entered flowering phase. Adjust nutrient ratios towards P/K."
    }
  ]
}
```

---

# VI. SIMULATION PARAMETERS SCHEMA

## Global Constants

```json
{
  "simulation_parameters": {
    "game_speed_multiplier": 1.0,
    "day_length_real_seconds": 1,
    
    "growth_rates": {
      "vegetative_height_growth_cm_per_day_base": 1.5,
      "flowering_bud_formation_rate_percent_per_day": 1.2,
      "root_growth_grams_per_day_base": 0.8,
      "trichome_maturation_rate_percent_per_day": 0.5
    },
    
    "metabolic_rates": {
      "nitrogen_uptake_mg_per_gram_biomass": 0.018,
      "phosphorus_uptake_mg_per_gram_biomass": 0.005,
      "potassium_uptake_mg_per_gram_biomass": 0.015,
      "respiration_rate_percent_biomass_per_day": 0.5
    },
    
    "par_effectiveness": {
      "saturation_point_umol": 1000,
      "light_compensation_point_umol": 50,
      "photoinhibition_threshold_umol": 1100,
      "photoinhibition_damage_per_day_percent": 5
    },
    
    "environmental_tolerances": {
      "temperature_damage_below_celsius": 15,
      "temperature_damage_above_celsius": 30,
      "humidity_mold_risk_above_percent": 70,
      "humidity_stress_below_percent": 30
    },
    
    "nutrient_lockout_thresholds": {
      "ph_too_low": 5.2,
      "ph_too_high": 7.0,
      "ec_too_low": 0.8,
      "ec_too_high": 2.2
    },
    
    "market_dynamics": {
      "price_volatility_percent": 10,
      "supply_demand_sensitivity": 0.05,
      "base_market_price_per_gram_aud": 10.0
    }
  }
}
```

---

# VII. HARVEST & RESULTS SCHEMA

## Template

```json
{
  "harvest_record": {
    "harvest_id": "harvest_001",
    "cycle_number": 1,
    "strain_id": "bruce-banner",
    "strain_name": "Bruce Banner",
    
    "timing": {
      "flowering_start_day": 32,
      "harvest_day": 100,
      "days_in_flower": 68,
      "plant_age_days": 100
    },
    
    "trichome_assessment": {
      "clear_percent_at_harvest": 10,
      "cloudy_percent_at_harvest": 75,
      "amber_percent_at_harvest": 15,
      "harvest_choice": "balanced_peak_potency"
    },
    
    "yield": {
      "wet_weight_grams": 285,
      "dry_weight_grams_estimated": 95,
      "actual_dry_weight_grams": 92,
      "yield_vs_genetic_baseline_percent": 83,
      "yield_vs_strain_potential_percent": 83
    },
    
    "potency": {
      "thc_percent_measured": 28.5,
      "cbd_percent_measured": 0.1,
      "total_cannabinoid_percent": 28.6,
      "thc_vs_strain_potential_percent": 92,
      "terpene_profile_boost_percent": 45
    },
    
    "quality_metrics": {
      "bud_density_rating_1_to_10": 8,
      "trichome_coverage_rating_1_to_10": 8,
      "color_appeal_rating_1_to_10": 7,
      "aroma_intensity_rating_1_to_10": 8,
      "disease_presence": false,
      "mold_presence": false
    },
    
    "market_performance": {
      "market_price_per_gram_aud": 11.87,
      "total_revenue_aud": 1092.04,
      "costs_total_aud": 312.57,
      "profit_aud": 779.47,
      "roi_percent": 249
    },
    
    "learning_outcomes": [
      "Chitosan timing: Applied weeks 4–5; +45% terpenes achieved",
      "PAR strategy: Used 850 µmol with SuperSi; no photoinhibition",
      "Harvest timing: Waited for 75% cloudy; optimal potency window"
    ]
  }
}
```

---

# VIII. COMPLETE EXAMPLE GAME STATE

See `/examples/game_state_day45.json` (saved separately, full populated example).

---

## NEXT: STEP 3

**Build product & strain databases:**
1. Expand ILGM strain catalog to full ~30 strains with all fields
2. Add real AU suppliers (WC Hydro, Aqua Gardening, Happy Hydroponics)
3. Price out all additive products in AUD
4. Create lookup tables for market dynamics, cost data

**Then: Finalize and commit schemas to implementation.**
