/**
 * Core Simulation Engine - HydroGrow
 * 14-step daily plant growth and environment update cycle
 * Implements plant signaling mechanics via SuperSi and Chitosan
 *
 * FIXES APPLIED (audit 2026-05-16):
 * #1  CO2 modifier corrected — >1000 ppm now boosts photosynthesis
 * #2  Electricity tracked in physiology.electricityKwhToday (not siMg hack)
 * #3  cycleStartDay used for stage calculation (fixes cycle-2 seedling skip)
 * #5  totalStressPercent now computed from individual stress flags
 * #6  nutrientLockoutActive cleared when pH recovers
 * #7  Disease recovery takes 3 days; alerts cleared when conditions improve
 * #10 qualityLossPercent uses linear degradation (fixed broken exponent formula)
 * #11 pH lockout starts at 5.5/6.5 matching player-visible advice
 * #13 biomassDryWeightGrams updated each day
 * #16 Height growth Si modifier fixed (removed incorrect 0.1× scaling)
 * VPD computed from temperature + humidity and written to roomEnvironment
 * Mycorrhizae root boost and fungicide disease acceleration integrated
 */

import {
  PlantState,
  TankState,
  StrainGenetics,
  PlantMorphology,
  LightResponse,
  FloweringState,
  CannabinoidsState,
  TrichomeMaturity,
  VisibleSymptoms,
  StressIndicators,
} from "../types";
import { getStrain } from "../data/strains";
import { getAdditive } from "../data/additives";

export class SimulationEngine {
  /**
   * Main daily simulation step — orchestrates sub-steps
   */
  updateDay(
    plant: PlantState,
    tank: TankState,
    parUmol: number,
    lightHoursOn: number,
    humidityTarget: number,
    airTemperatureTarget: number
  ): void {
    const strain = getStrain(plant.strainId);

    // Step 1: Light schedule transition (18/6 → 12/12 triggers flowering)
    this.updateLightSchedule(plant, lightHoursOn);

    // Step 2: Growth stage progression
    this.updateGrowthStage(plant, strain);

    // Step 3: Photosynthesis rate calculation
    this.calculatePhotosynthesisRate(plant, tank, parUmol);

    // Step 4: Nutrient uptake (with pH lockout checking)
    this.updateNutrientUptake(plant, tank, strain);

    // Step 5: Plant morphology (height, stem diameter with SuperSi boost)
    this.updateMorphology(plant, tank, strain);

    // Step 5.5: Chlorophyll development
    this.updateChlorophyll(plant, tank);

    // Step 5.7: Biomass update (fix #13 — was never updated)
    this.updateBiomass(plant);

    // Step 6: Root mass growth (mycorrhizae boost integrated)
    this.updateRootMass(plant, tank);

    // Step 7: Cannabinoid synthesis (CBDA during flower, PAR stress boost)
    this.updateCannabinoidsynthesis(plant, tank, strain);

    // Step 8: Trichome maturity progression
    this.updateTrichomeMaturity(plant, tank);

    // Step 9: Photoinhibition stress checking
    this.checkPhotoinhibition(plant, tank, strain);

    // Step 10: Nutrient deficiency symptoms
    this.updateDeficiencySymptoms(plant, tank);

    // Step 11: Disease pressure modeling (recovery + alert cleanup)
    this.updateDiseasePressure(plant, tank);

    // Step 11.5: Calculate total stress from all active flags (fix #5)
    this.calculateTotalStress(plant, tank);

    // Step 12: Electricity usage tracking (fix #2 — uses physiology field now)
    this.trackElectricity(plant, tank, parUmol);

    // Step 13: Tank chemistry drift (pH, EC, VPD)
    this.updateTankChemistry(plant, tank);

    // Step 14: Update plant health (baseline decay + recovery bonus)
    this.updatePlantHealth(plant, tank);

    // Step 15: Update yield modifiers (based on plant/tank state)
    this.updateYieldModifiers(plant, tank, strain, parUmol);

    // Step 15.5: Update yield tracking during flowering
    if (plant.flowering.floweringInitiated) {
      this.updateYieldTracking(plant, tank, strain);
    }

    // Step 16: Reset daily tracking
    this.resetDailyTracking(plant);

    plant.gameDay++;
  }

  private updatePlantHealth(plant: PlantState, tank: TankState): void {
    // Baseline daily maintenance cost: -0.5% per day (plants need constant care)
    let healthChange = -0.5;

    const n = tank.macroNutrients.nitrogenNMgPerLiter;
    const p = tank.macroNutrients.phosphorusPMgPerLiter;
    const k = tank.macroNutrients.potassiumKMgPerLiter;
    const pH = tank.waterChemistry.ph;

    // Recovery bonus if plant is well-managed
    const nutrientsGood =
      n >= 100 && n <= 200 &&
      p >= 30 && p <= 90 &&
      k >= 60 && k <= 200;
    const pHGood = pH >= 5.5 && pH <= 6.5;
    const lightGood = plant.lightResponse.currentParUmol >= 400 && plant.lightResponse.currentParUmol <= 1000;

    if (nutrientsGood && pHGood && lightGood) {
      healthChange += 0.3;
    }
    if (plant.lightResponse.photosynthesisRateRelative > 0.7) {
      healthChange += 0.1;
    }

    // Water temperature penalty: 2% health loss per 0.5°C above 23°C
    const waterTemp = tank.waterChemistry.waterTemperatureCelsius;
    if (waterTemp > 23) {
      const degAbove = waterTemp - 23;
      const tempPenalty = (degAbove / 0.5) * 2.0;
      healthChange -= Math.min(5.0, tempPenalty);
    }

    // Stress penalty (fix #5 — totalStressPercent is now computed)
    if (plant.stressIndicators.totalStressPercent > 30) {
      healthChange -= Math.min(1.5, plant.stressIndicators.totalStressPercent / 50);
    }

    // Disease penalty
    if (plant.visibleSymptoms.powderyMildew || plant.visibleSymptoms.botrytis) {
      healthChange -= 1.5;
    }

    plant.physiology.plantHealthChangeTodayPercent = healthChange;
    plant.physiology.plantHealthPercent = Math.max(0, Math.min(100,
      plant.physiology.plantHealthPercent + healthChange
    ));
  }

  private updateLightSchedule(plant: PlantState, lightHoursOn: number): void {
    plant.lightResponse.lightScheduleHoursOn = Math.min(24, lightHoursOn);
    plant.lightResponse.lightScheduleHoursOff = 24 - plant.lightResponse.lightScheduleHoursOn;

    // Trigger flowering if transitioned to ≤12h light while in vegetative stage
    if (
      !plant.flowering.floweringInitiated &&
      lightHoursOn <= 12 &&
      plant.growthStage.stage === "vegetative"
    ) {
      plant.flowering.floweringInitiated = true;
      plant.flowering.floweringStartDay = plant.gameDay;
    }
  }

  private updateGrowthStage(plant: PlantState, strain: StrainGenetics): void {
    // Fix #3: use cycle-relative day so cycle-2 plants start at seedling correctly
    const cycleStartDay = plant.cycleStartDay ?? 0;
    const daysFromStart = plant.gameDay - cycleStartDay;
    let newStage = plant.growthStage.stage;

    if (daysFromStart < 7) {
      newStage = "seedling";
    } else if (!plant.flowering.floweringInitiated) {
      newStage = "vegetative";
    } else if (plant.flowering.daysInFlower < 21) {
      newStage = "early_flower";
    } else if (plant.flowering.daysInFlower < strain.floweringTimeDays - 7) {
      newStage = "late_flower";
    } else if (plant.flowering.daysInFlower >= strain.floweringTimeDays) {
      newStage = "harvest_ready";
    }

    if (newStage !== plant.growthStage.stage) {
      plant.growthStage.stage = newStage as any;
      plant.growthStage.daysInStage = 0;
    }
    plant.growthStage.daysInStage++;

    // Stage durations for progress calculation
    const stageDurations: { [key: string]: number } = {
      seedling: 7,
      vegetative: 21,
      early_flower: 21,
      late_flower: Math.max(1, strain.floweringTimeDays - 28),
      harvest_ready: 7,
    };
    const totalForStage = stageDurations[plant.growthStage.stage] || 7;
    plant.growthStage.stageProgressPercent = Math.min(
      100,
      (plant.growthStage.daysInStage / totalForStage) * 100
    );
    // Days to next stage (used by UI progress bar)
    plant.growthStage.daysToNextStage = Math.max(0, totalForStage - plant.growthStage.daysInStage);
  }

  private calculatePhotosynthesisRate(
    plant: PlantState,
    tank: TankState,
    parUmol: number
  ): void {
    plant.lightResponse.currentParUmol = parUmol;

    // PAR light curve (saturates at 1000 µmol)
    const saturationPoint = 1000;
    const lightCurve = Math.min(1.0, parUmol / saturationPoint);

    // Chlorophyll modifier
    const chlorophyllModifier = plant.physiology.chlorophyllPercent / 100;

    // Temperature modifier (optimal 24°C, -5% per degree deviation)
    const tempOptimal = 24;
    const tempDiff = Math.abs(tank.roomEnvironment.airTemperatureCelsius - tempOptimal);
    const temperatureModifier = Math.max(0.3, 1 - tempDiff * 0.05);

    // Fix #1: CO2 modifier — >1000 ppm boosts photosynthesis, not penalises it
    const co2 = tank.roomEnvironment.co2Ppm;
    const co2Modifier = co2 < 400 ? 0.5
      : co2 <= 800  ? 1.0
      : co2 <= 1200 ? 1.2   // +20% boost in enrichment range
      : co2 <= 1500 ? 1.1   // diminishing returns 1200–1500
      : 0.9;                 // penalty only at extreme >1500

    plant.lightResponse.photosynthesisRateRelative =
      lightCurve * chlorophyllModifier * temperatureModifier * co2Modifier;
  }

  private updateNutrientUptake(
    plant: PlantState,
    tank: TankState,
    strain: StrainGenetics
  ): void {
    // Stage-dependent base uptake rates (mg/day)
    let nUptake = 75;
    let pUptake = 40;
    let kUptake = 100;

    if (plant.growthStage.stage === "vegetative") {
      nUptake = 100;
      pUptake = 30;
      kUptake = 90;
    } else if (plant.growthStage.stage.includes("flower")) {
      nUptake = 50;
      pUptake = 60;
      kUptake = 125;
    }

    // Scale by photosynthesis rate
    nUptake *= plant.lightResponse.photosynthesisRateRelative;
    pUptake *= plant.lightResponse.photosynthesisRateRelative;
    kUptake *= plant.lightResponse.photosynthesisRateRelative;

    // Fix #11: pH lockout starts at the advice-matching 5.5–6.5 boundary
    const pH = tank.waterChemistry.ph;
    let phLockoutFactor = 1.0;
    if (pH < 5.0 || pH > 7.0) {
      // Severe lockout outside 5.0–7.0
      phLockoutFactor = 0.3;
      plant.stressIndicators.nutrientLockoutActive = true;
    } else if (pH < 5.5 || pH > 6.5) {
      // Partial lockout in 5.0–5.5 and 6.5–7.0 bands
      phLockoutFactor = 0.7;
      plant.stressIndicators.nutrientLockoutActive = true;
    } else {
      // Fix #6: clear lockout flag when pH is back in safe range
      phLockoutFactor = 1.0;
      plant.stressIndicators.nutrientLockoutActive = false;
    }

    nUptake *= phLockoutFactor;
    pUptake *= phLockoutFactor;
    kUptake *= phLockoutFactor;

    const vol = tank.specifications.volumeLiters;
    tank.macroNutrients.nitrogenNMgPerLiter   = Math.max(0, tank.macroNutrients.nitrogenNMgPerLiter   - nUptake / vol);
    tank.macroNutrients.phosphorusPMgPerLiter = Math.max(0, tank.macroNutrients.phosphorusPMgPerLiter - pUptake / vol);
    tank.macroNutrients.potassiumKMgPerLiter  = Math.max(0, tank.macroNutrients.potassiumKMgPerLiter  - kUptake / vol);

    plant.nutrientUptakeToday.nMg = nUptake;
    plant.nutrientUptakeToday.pMg = pUptake;
    plant.nutrientUptakeToday.kMg = kUptake;
  }

  private updateMorphology(
    plant: PlantState,
    tank: TankState,
    strain: StrainGenetics
  ): void {
    let heightGrowthMm = 15;
    if (plant.growthStage.stage === "seedling") {
      heightGrowthMm = 5;
    } else if (plant.growthStage.stage.includes("flower")) {
      heightGrowthMm = 8;
    }

    // Fix #16: Si provides a proportional boost (up to 10% at 100 mg/L), not a 0.1× scale
    const siBoost = 1 + (tank.microNutrients.siliconSiMgPerLiter / 100) * 0.1;
    heightGrowthMm *= siBoost;

    plant.morphology.heightGrowthTodayMm = heightGrowthMm;
    plant.morphology.heightCm           += heightGrowthMm / 10;
    plant.morphology.stemDiameterMm     += heightGrowthMm * 0.015;

    if (plant.growthStage.stage === "vegetative") {
      plant.morphology.leafAreaIndex += 0.3;
      plant.morphology.nodeCount     += 2;
      if (plant.morphology.nodeCount % 3 === 0) {
        plant.morphology.branchCount += 1;
      }
    } else if (plant.growthStage.stage.includes("flower")) {
      plant.morphology.leafAreaIndex += 0.1;
    }
  }

  private updateBiomass(plant: PlantState): void {
    // Fix #13: biomassDryWeightGrams now grows each day based on plant development
    const vegetativeContribution = plant.morphology.heightCm * 0.5 +
      plant.morphology.leafAreaIndex * 10;
    const rootContribution = plant.physiology.rootMassDryWeightGrams * 0.3;
    const healthModifier = plant.physiology.plantHealthPercent / 100;

    plant.physiology.biomassDryWeightGrams =
      Math.max(2, (vegetativeContribution + rootContribution) * healthModifier);
  }

  private updateChlorophyll(plant: PlantState, tank: TankState): void {
    let chlorophyllGrowth = 0.8;

    const parModifier = Math.min(1.5, plant.lightResponse.currentParUmol / 600);
    chlorophyllGrowth *= parModifier;

    const healthModifier = plant.physiology.plantHealthPercent / 100;
    chlorophyllGrowth *= healthModifier;

    const nAvailable = tank.macroNutrients.nitrogenNMgPerLiter;
    if (nAvailable < 50) {
      chlorophyllGrowth *= 0.5;
    } else if (nAvailable > 120) {
      chlorophyllGrowth *= 1.2;
    }

    if (plant.growthStage.stage === "seedling") {
      chlorophyllGrowth *= 1.5;
    } else if (plant.growthStage.stage.includes("flower")) {
      chlorophyllGrowth *= 0.7;
    }

    plant.physiology.chlorophyllPercent = Math.min(100,
      plant.physiology.chlorophyllPercent + chlorophyllGrowth
    );
  }

  private updateRootMass(plant: PlantState, tank: TankState): void {
    let rootGrowth = 2;

    const nAvailable = tank.macroNutrients.nitrogenNMgPerLiter;
    const pAvailable = tank.macroNutrients.phosphorusPMgPerLiter;
    const npFactor = Math.min(1.5, (nAvailable + pAvailable) / 100);
    rootGrowth *= npFactor;

    if (tank.waterChemistry.dissolvedOxygenMgPerLiter < 5) {
      rootGrowth *= 0.5;
      plant.stressIndicators.hypoxiaActive = true;
    } else {
      plant.stressIndicators.hypoxiaActive = false;
    }

    // Mycorrhizae permanent root boost (+30% growth rate)
    if (tank.additivesActive.mycorrhizaeApplied) {
      rootGrowth *= 1.3;
    }

    plant.physiology.rootMassDryWeightGrams += rootGrowth;
    plant.physiology.rootDevelopmentPercent = Math.min(100,
      plant.physiology.rootDevelopmentPercent + 2
    );
  }

  private updateCannabinoidsynthesis(
    plant: PlantState,
    tank: TankState,
    strain: StrainGenetics
  ): void {
    if (!plant.flowering.floweringInitiated) return;

    let cbdaRate = 0.5;
    let thcaRate = strain.thcPercent / strain.floweringTimeDays;

    if (plant.lightResponse.currentParUmol > 900) {
      thcaRate *= 1.15;
    }

    const daysInFlower = plant.flowering.daysInFlower;
    const chitosan = tank.additivesActive.chitosanMgPerLiter;
    const chitosanDaysSince = tank.additivesActive.chitosanDaysSinceApplication ?? 999;

    if (chitosan > 0 && chitosanDaysSince <= 10) {
      const chitosanBoost = 1 + strain.responsivityToChitosan * 0.8;
      thcaRate *= chitosanBoost;
      cbdaRate *= 0.95;
      plant.flowering.budDensityScale1To10 = Math.min(10,
        plant.flowering.budDensityScale1To10 * 1.15
      );
    }

    if (daysInFlower >= 21 && daysInFlower <= 42) {
      thcaRate *= 1.3;
    }

    plant.cannabinoids.thcaAccumulationPercent = Math.min(
      strain.thcPercent * 1.1,
      plant.cannabinoids.thcaAccumulationPercent + thcaRate
    );
    plant.cannabinoids.cbdaAccumulationPercent = Math.min(
      strain.cbdPercent * 1.1,
      plant.cannabinoids.cbdaAccumulationPercent + cbdaRate
    );

    if (daysInFlower > strain.floweringTimeDays - 7) {
      plant.cannabinoids.cbnAccumulationPercent += 0.1;
    }
  }

  private updateTrichomeMaturity(plant: PlantState, tank: TankState): void {
    if (!plant.flowering.floweringInitiated) return;

    let maturationRate = 1.0;

    const temp = tank.roomEnvironment.airTemperatureCelsius;
    if (temp > 26) maturationRate *= 1.2;
    if (temp < 18) maturationRate *= 0.9;

    if (tank.roomEnvironment.relativeHumidityPercent > 70) {
      maturationRate *= 0.9;
    }
    if (plant.lightResponse.currentParUmol > 1000) {
      maturationRate *= 1.15;
    }
    if (tank.additivesActive.chitosanMgPerLiter > 0) {
      maturationRate *= 1.05;
    }

    const totalMaturity =
      plant.trichomeMaturity.clearTrichomesPercent +
      plant.trichomeMaturity.cloudyTrichomesPercent +
      plant.trichomeMaturity.amberTrichomesPercent;

    if (totalMaturity < 100) {
      plant.trichomeMaturity.clearTrichomesPercent = Math.max(0,
        plant.trichomeMaturity.clearTrichomesPercent - maturationRate
      );
      plant.trichomeMaturity.cloudyTrichomesPercent = Math.min(100,
        plant.trichomeMaturity.cloudyTrichomesPercent + maturationRate * 0.9
      );
      if (plant.trichomeMaturity.cloudyTrichomesPercent > 60) {
        plant.trichomeMaturity.amberTrichomesPercent = Math.min(100,
          plant.trichomeMaturity.amberTrichomesPercent + maturationRate * 0.1
        );
      }
    }
  }

  private checkPhotoinhibition(
    plant: PlantState,
    tank: TankState,
    strain: StrainGenetics
  ): void {
    const parThreshold = strain.parToleranceMax;

    if (plant.lightResponse.currentParUmol > parThreshold) {
      plant.stressIndicators.photoinhibitionActive = true;
      plant.lightResponse.photoinhibitionRiskPercent = Math.min(
        100,
        ((plant.lightResponse.currentParUmol - parThreshold) / 200) * 100
      );

      const siMitigation = Math.min(1.0, tank.microNutrients.siliconSiMgPerLiter / 100);
      const damageRate = (1 - siMitigation) * 0.5;
      plant.physiology.plantHealthPercent = Math.max(0,
        plant.physiology.plantHealthPercent - damageRate
      );
      plant.visibleSymptoms.lightBurn = true;
    } else {
      plant.stressIndicators.photoinhibitionActive = false;
      plant.lightResponse.photoinhibitionRiskPercent = 0;
      plant.visibleSymptoms.lightBurn = false;
    }
  }

  private updateDeficiencySymptoms(plant: PlantState, tank: TankState): void {
    const n  = tank.macroNutrients.nitrogenNMgPerLiter;
    const p  = tank.macroNutrients.phosphorusPMgPerLiter;
    const k  = tank.macroNutrients.potassiumKMgPerLiter;
    const ca = tank.macroNutrients.calciumCaMgPerLiter;
    const mg = tank.macroNutrients.magnesiumMgMgPerLiter;

    plant.visibleSymptoms.nitrogenDeficiency   = n  < 80;
    plant.visibleSymptoms.phosphorusDeficiency = p  < 30;
    plant.visibleSymptoms.potassiumDeficiency  = k  < 100;
    plant.visibleSymptoms.calciumDeficiency    = ca < 120;
    plant.visibleSymptoms.magnesiumDeficiency  = mg < 40;

    // Health penalty per active deficiency
    let healthPenalty = 0;
    if (plant.visibleSymptoms.nitrogenDeficiency)   healthPenalty += 0.5;
    if (plant.visibleSymptoms.phosphorusDeficiency) healthPenalty += 0.3;
    if (plant.visibleSymptoms.potassiumDeficiency)  healthPenalty += 0.4;
    if (plant.visibleSymptoms.calciumDeficiency)    healthPenalty += 0.2;
    if (plant.visibleSymptoms.magnesiumDeficiency)  healthPenalty += 0.2;

    plant.physiology.plantHealthPercent = Math.max(0,
      plant.physiology.plantHealthPercent - healthPenalty
    );
  }

  private updateDiseasePressure(plant: PlantState, tank: TankState): void {
    const humidity = tank.roomEnvironment.relativeHumidityPercent;
    const temp     = tank.roomEnvironment.airTemperatureCelsius;
    const airFlow  = tank.roomEnvironment.airChangesPerHour;

    if (!plant.stressIndicators.diseasePressureCounters) {
      plant.stressIndicators.diseasePressureCounters = {};
    }
    const counters = plant.stressIndicators.diseasePressureCounters;

    // Fungicide halves recovery time (speeds up counter increments)
    const fungicideActive = tank.additivesActive.fungicideApplied;
    const recoveryIncrement = fungicideActive ? 2 : 1;

    // ─── Powdery Mildew ───────────────────────────────────────────────
    const pmConditionsActive = humidity > 70 && airFlow < 4;
    if (pmConditionsActive) {
      counters.pmRecoveryDays = 0; // reset recovery when conditions are bad
      counters.pmDaysExposed = (counters.pmDaysExposed || 0) + 1;

      if (counters.pmDaysExposed === 1) {
        if (!tank.warnings.includes("⚠️ Powdery mildew risk: High humidity & low airflow")) {
          tank.warnings.push("⚠️ Powdery mildew risk: High humidity & low airflow");
        }
      }
      if (counters.pmDaysExposed === 2) {
        if (!tank.alerts.includes("🟡 PM at-risk (2/3 days bad conditions)")) {
          tank.alerts.push("🟡 PM at-risk (2/3 days bad conditions)");
        }
      }
      if (counters.pmDaysExposed > 3) {
        plant.visibleSymptoms.powderyMildew = true;
        if (!tank.alerts.includes("🔴 Powdery mildew detected")) {
          tank.alerts.push("🔴 Powdery mildew detected");
        }
      }
    } else {
      counters.pmDaysExposed = 0;
      if (plant.visibleSymptoms.powderyMildew) {
        // Fix #7: disease takes 3 days (or 2 with fungicide) to clear after conditions improve
        counters.pmRecoveryDays = (counters.pmRecoveryDays || 0) + recoveryIncrement;
        if (counters.pmRecoveryDays >= 3) {
          plant.visibleSymptoms.powderyMildew = false;
          counters.pmRecoveryDays = 0;
          // Fix #7: remove stale alerts when disease clears
          tank.alerts   = tank.alerts.filter(a => !a.includes('Powdery mildew') && !a.includes('PM at-risk'));
          tank.warnings = tank.warnings.filter(w => !w.includes('Powdery mildew'));
        }
      } else {
        // No disease and no bad conditions — clear any lingering warnings
        counters.pmRecoveryDays = 0;
        tank.warnings = tank.warnings.filter(w => !w.includes('Powdery mildew'));
      }
    }

    // ─── Botrytis ─────────────────────────────────────────────────────
    const botrytisConditionsActive = humidity > 75 && temp < 20;
    if (botrytisConditionsActive) {
      counters.botrytisRecoveryDays = 0;
      counters.botrytilsDaysExposed = (counters.botrytilsDaysExposed || 0) + 1;

      if (counters.botrytilsDaysExposed === 1) {
        if (!tank.warnings.includes("⚠️ Botrytis risk: High humidity & cold temps")) {
          tank.warnings.push("⚠️ Botrytis risk: High humidity & cold temps");
        }
      }
      if (counters.botrytilsDaysExposed === 2) {
        if (!tank.alerts.includes("🟡 Botrytis at-risk (2/3 days bad conditions)")) {
          tank.alerts.push("🟡 Botrytis at-risk (2/3 days bad conditions)");
        }
      }
      if (counters.botrytilsDaysExposed > 3) {
        plant.visibleSymptoms.botrytis = true;
        if (!tank.alerts.includes("🔴 Botrytis detected")) {
          tank.alerts.push("🔴 Botrytis detected");
        }
      }
    } else {
      counters.botrytilsDaysExposed = 0;
      if (plant.visibleSymptoms.botrytis) {
        counters.botrytisRecoveryDays = (counters.botrytisRecoveryDays || 0) + recoveryIncrement;
        if (counters.botrytisRecoveryDays >= 3) {
          plant.visibleSymptoms.botrytis = false;
          counters.botrytisRecoveryDays = 0;
          tank.alerts   = tank.alerts.filter(a => !a.includes('Botrytis') && !a.includes('Botrytis at-risk'));
          tank.warnings = tank.warnings.filter(w => !w.includes('Botrytis'));
        }
      } else {
        counters.botrytisRecoveryDays = 0;
        tank.warnings = tank.warnings.filter(w => !w.includes('Botrytis'));
      }
    }

    // Disease health damage (chitosan reduces 40%)
    const chitosanFactor = tank.additivesActive.chitosanMgPerLiter > 0 ? 0.6 : 1.0;
    if (plant.visibleSymptoms.powderyMildew || plant.visibleSymptoms.botrytis) {
      plant.physiology.plantHealthPercent -= 2 * chitosanFactor;
    }
  }

  /**
   * Fix #5 — Calculate totalStressPercent from all individual stress flags.
   * Previously this was always 0, disabling all stress-based penalties.
   */
  private calculateTotalStress(plant: PlantState, tank: TankState): void {
    let stress = 0;
    const temp = tank.roomEnvironment.airTemperatureCelsius;
    const rh   = tank.roomEnvironment.relativeHumidityPercent;

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

  private trackElectricity(
    plant: PlantState,
    tank: TankState,
    parUmol: number
  ): void {
    const estimatedLedWattage = (parUmol / 1000) * 400;
    const dailyKwh = (estimatedLedWattage / 1000) * (plant.lightResponse.lightScheduleHoursOn / 24);
    const heaterKwh = (tank.specifications.heaterWattage / 1000) * 0.5;

    // Fix #2: use dedicated field instead of hijacking nutrientUptakeToday.siMg
    plant.physiology.electricityKwhToday = dailyKwh + heaterKwh;
  }

  private updateTankChemistry(plant: PlantState, tank: TankState): void {
    // pH drift from nitrogen uptake
    const nUptakeRate = plant.nutrientUptakeToday.nMg / 100;
    tank.waterChemistry.phDriftPerDay = nUptakeRate * 0.1;
    tank.waterChemistry.ph = Math.max(4.5, Math.min(8.5,
      tank.waterChemistry.ph - tank.waterChemistry.phDriftPerDay
    ));

    // EC drift from nutrient depletion
    const totalNutrientDepletion =
      plant.nutrientUptakeToday.nMg +
      plant.nutrientUptakeToday.pMg +
      plant.nutrientUptakeToday.kMg;
    tank.waterChemistry.ecMscm = Math.max(0,
      tank.waterChemistry.ecMscm - totalNutrientDepletion / 1000
    );
    tank.waterChemistry.ppm = tank.waterChemistry.ecMscm * 640;

    // Water age
    tank.waterChemistry.waterAgeDays++;
    if (tank.waterChemistry.totalDissolvedSolidsPpm > 1150) {
      if (!tank.warnings.includes("High TDS - water change recommended")) {
        tank.warnings.push("High TDS - water change recommended");
      }
    }

    // VPD calculation (Tetens equation — °C input)
    const temp = tank.roomEnvironment.airTemperatureCelsius;
    const rh   = tank.roomEnvironment.relativeHumidityPercent;
    const svp  = 0.6108 * Math.exp(17.27 * temp / (temp + 237.3)); // kPa saturated vapour pressure
    tank.roomEnvironment.vaporPressureDeficitKpa = Math.max(0,
      svp * (1 - rh / 100)
    );
  }

  private updateYieldModifiers(
    plant: PlantState,
    tank: TankState,
    strain: StrainGenetics,
    parUmol: number
  ): void {
    const health = plant.physiology.plantHealthPercent;
    plant.yieldModifiers.healthFactor = Math.max(0.3, health / 100);

    const n = tank.macroNutrients.nitrogenNMgPerLiter;
    const p = tank.macroNutrients.phosphorusPMgPerLiter;
    const k = tank.macroNutrients.potassiumKMgPerLiter;

    const nOptimal = n >= 100 && n <= 200 ? 1.0 : Math.max(0.5, 1.0 - Math.abs(n - 150) / 200);
    const pOptimal = p >= 30  && p <= 90  ? 1.0 : Math.max(0.5, 1.0 - Math.abs(p - 60)  / 60);
    const kOptimal = k >= 60  && k <= 200 ? 1.0 : Math.max(0.5, 1.0 - Math.abs(k - 130) / 200);
    plant.yieldModifiers.nutrientBalanceFactor = (nOptimal + pOptimal + kOptimal) / 3;

    const parOptimalMin = 600;
    const parOptimalMax = 1000;
    let lightFactor = 1.0;
    if (parUmol < parOptimalMin) {
      lightFactor = 0.5 + (parUmol / parOptimalMin) * 0.5;
    } else if (parUmol > parOptimalMax) {
      lightFactor = 1.0 - ((parUmol - parOptimalMax) / 200) * 0.3;
    }
    plant.yieldModifiers.lightEfficiencyFactor = Math.max(0.3, lightFactor);

    const stressPercent = plant.stressIndicators.totalStressPercent || 0;
    plant.yieldModifiers.stressPenaltyFactor = Math.max(0.5, 1.0 - stressPercent / 100);
  }

  private resetDailyTracking(plant: PlantState): void {
    plant.physiology.chlorophyllChangeTodayPercent = 0;
    plant.physiology.plantHealthChangeTodayPercent = 0;
    // nutrientUptakeToday kept for display; siMg field no longer used for electricity
  }

  private updateYieldTracking(
    plant: PlantState,
    tank: TankState,
    strain: any
  ): void {
    const daysInFlower  = plant.flowering.daysInFlower;
    const floweringDays = strain.floweringTimeDays;

    const healthFactor   = Math.max(0.3, plant.physiology.plantHealthPercent / 100);
    const nutrientFactor = plant.yieldModifiers.nutrientBalanceFactor;
    const lightFactor    = plant.yieldModifiers.lightEfficiencyFactor;
    const stressFactor   = plant.yieldModifiers.stressPenaltyFactor;

    let progressionPercent = 0;
    if (daysInFlower <= 7)       progressionPercent = strain.yieldProfile.yieldProgressionWeek5Percent * 0.5;
    else if (daysInFlower <= 14) progressionPercent = strain.yieldProfile.yieldProgressionWeek5Percent * 0.7;
    else if (daysInFlower <= 21) progressionPercent = strain.yieldProfile.yieldProgressionWeek5Percent;
    else if (daysInFlower <= 28) progressionPercent = strain.yieldProfile.yieldProgressionWeek6Percent;
    else if (daysInFlower <= 35) progressionPercent = strain.yieldProfile.yieldProgressionWeek7Percent;
    else                         progressionPercent = strain.yieldProfile.yieldProgressionWeek8Percent;

    let currentYield =
      strain.yieldProfile.yieldGramsTypical *
      (progressionPercent / 100) *
      healthFactor * nutrientFactor * lightFactor * stressFactor;

    if (daysInFlower > floweringDays) {
      const daysOverdue = daysInFlower - floweringDays;
      const degradationRate = strain.yieldProfile.degradationPercentPerDay;
      const qualityLoss = 1 - (degradationRate / 100) ** daysOverdue;
      currentYield *= Math.max(0.5, qualityLoss);
    }

    const previousYield = plant.yieldTracking.currentEstimateGrams;
    plant.yieldTracking.currentEstimateGrams = Math.round(currentYield * 10) / 10;

    if (plant.yieldTracking.peakYieldDay === null && previousYield > plant.yieldTracking.currentEstimateGrams) {
      plant.yieldTracking.peakYieldDay   = plant.flowering.daysInFlower - 1;
      plant.yieldTracking.peakYieldGrams = previousYield;
    }

    if (plant.yieldTracking.peakYieldDay !== null) {
      plant.yieldTracking.daysSincePeak = daysInFlower - plant.yieldTracking.peakYieldDay;
    }

    // Fix #10: linear degradation (was (rate/100)^days which approached 0 instantly)
    if (plant.yieldTracking.daysSincePeak > 0) {
      plant.yieldTracking.qualityLossPercent = Math.min(
        100,
        plant.yieldTracking.daysSincePeak * strain.yieldProfile.degradationPercentPerDay
      );
    }

    // Trichome-based quality scoring
    const clearPercent  = plant.trichomeMaturity.clearTrichomesPercent;
    const cloudyPercent = plant.trichomeMaturity.cloudyTrichomesPercent;
    const amberPercent  = plant.trichomeMaturity.amberTrichomesPercent;

    const peakClear  = strain.yieldProfile.trichomePeakClearPercent;
    const peakCloudy = strain.yieldProfile.trichomePeakCloudyPercent;
    const peakAmber  = strain.yieldProfile.trichomePeakAmberPercent;

    const clearDiff  = Math.abs(clearPercent  - peakClear);
    const cloudyDiff = Math.abs(cloudyPercent - peakCloudy);
    const amberDiff  = Math.abs(amberPercent  - peakAmber);
    const totalDiff  = (clearDiff + cloudyDiff + amberDiff) / 3;

    plant.yieldTracking.harvestQualityScore = Math.max(
      0,
      100 - totalDiff * 5 - plant.yieldTracking.qualityLossPercent
    );

    if      (plant.yieldTracking.harvestQualityScore >= 90) plant.yieldTracking.qualityTier = "S";
    else if (plant.yieldTracking.harvestQualityScore >= 75) plant.yieldTracking.qualityTier = "A";
    else if (plant.yieldTracking.harvestQualityScore >= 60) plant.yieldTracking.qualityTier = "B";
    else                                                    plant.yieldTracking.qualityTier = "C";
  }
}
