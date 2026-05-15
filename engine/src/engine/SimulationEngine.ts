/**
 * Core Simulation Engine - HydroGrow
 * 14-step daily plant growth and environment update cycle
 * Implements plant signaling mechanics via SuperSi and Chitosan
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
   * Main daily simulation step - orchestrates 14 sub-steps
   */
  updateDay(
    plant: PlantState,
    tank: TankState,
    parUmol: number,
    lightHoursOn: number,
    humidityTarget: number,
    temperatureTarget: number
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

    // Step 6: Root mass growth
    this.updateRootMass(plant, tank);

    // Step 7: Cannabinoid synthesis (CBDA during flower, PAR stress boost)
    this.updateCannabinoidsynthesis(plant, tank, strain);

    // Step 8: Trichome maturity progression
    this.updateTrichomeMaturity(plant, tank);

    // Step 9: Photoinhibition stress checking
    this.checkPhotoinhibition(plant, tank, strain);

    // Step 10: Nutrient deficiency symptoms
    this.updateDeficiencySymptoms(plant, tank);

    // Step 11: Disease pressure modeling
    this.updateDiseasePressure(plant, tank);

    // Step 12: Electricity usage tracking
    this.trackElectricity(plant, tank, parUmol);

    // Step 13: Tank chemistry drift
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

    // Recovery bonus if plant is well-managed
    const n = tank.macroNutrients.nitrogenNMgPerLiter;
    const p = tank.macroNutrients.phosphorusPMgPerLiter;
    const k = tank.macroNutrients.potassiumKMgPerLiter;
    const pH = tank.waterChemistry.ph;

    // Check if nutrients are in good ranges
    const nutrientsGood =
      n >= 100 && n <= 180 &&
      p >= 30 && p <= 60 &&
      k >= 100 && k <= 180;

    // Check if pH is optimal
    const pHGood = pH >= 5.5 && pH <= 6.5;

    // Check if light is reasonable
    const lightGood = plant.lightResponse.currentParUmol >= 400 && plant.lightResponse.currentParUmol <= 1000;

    // Bonus for good management (+0.3% per day)
    if (nutrientsGood && pHGood && lightGood) {
      healthChange += 0.3;
    }

    // Additional recovery if photosynthesis rate is high
    if (plant.lightResponse.photosynthesisRateRelative > 0.7) {
      healthChange += 0.1;
    }

    // Water temperature penalty: 2% health loss per 0.5°C above 23°C (root rot pathogen threshold)
    const waterTemp = tank.waterChemistry.waterTemperatureCelsius;
    if (waterTemp > 23) {
      const tempDegreeAboveThreshold = waterTemp - 23;
      const penaltyPerHalfDegree = 2.0; // 2% per 0.5°C
      const tempPenalty = (tempDegreeAboveThreshold / 0.5) * penaltyPerHalfDegree;
      healthChange -= Math.min(5.0, tempPenalty); // Cap at -5% per day to prevent instant death
    }

    // Penalty for stress conditions
    if (plant.stressIndicators.totalStressPercent > 30) {
      healthChange -= Math.min(1.0, plant.stressIndicators.totalStressPercent / 100);
    }

    // Penalty for disease
    if (plant.visibleSymptoms.powderyMildew || plant.visibleSymptoms.botrytis) {
      healthChange -= 1.0;
    }

    // Store the change for UI display
    plant.physiology.plantHealthChangeTodayPercent = healthChange;

    // Apply health change (cap at 0-100)
    plant.physiology.plantHealthPercent = Math.max(0, Math.min(100, plant.physiology.plantHealthPercent + healthChange));
  }

  private updateLightSchedule(plant: PlantState, lightHoursOn: number): void {
    plant.lightResponse.lightScheduleHoursOn = Math.min(24, lightHoursOn);
    plant.lightResponse.lightScheduleHoursOff = 24 - plant.lightResponse.lightScheduleHoursOn;

    // Trigger flowering if transitioned to 12/12
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
    const daysFromStart = plant.gameDay;
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

    // Calculate stage progress percentage
    const stageDurations: { [key: string]: number } = {
      seedling: 7,
      vegetative: 21,
      early_flower: 21,
      late_flower: strain.floweringTimeDays - 28,
      harvest_ready: 7,
    };
    const totalForStage = stageDurations[plant.growthStage.stage] || 7;
    plant.growthStage.stageProgressPercent = Math.min(
      100,
      (plant.growthStage.daysInStage / totalForStage) * 100
    );
  }

  private calculatePhotosynthesisRate(
    plant: PlantState,
    tank: TankState,
    parUmol: number
  ): void {
    plant.lightResponse.currentParUmol = parUmol;

    // PAR saturation at 1000 µmol
    const saturationPoint = 1000;
    const lightCurve = Math.min(1.0, parUmol / saturationPoint);

    // Chlorophyll modifier
    const chlorophyllModifier = plant.physiology.chlorophyllPercent / 100;

    // Temperature modifier (optimal 24°C)
    const tempOptimal = 24;
    const tempDiff = Math.abs(tank.roomEnvironment.airTemperatureCelsius - tempOptimal);
    const temperatureModifier = Math.max(0.3, 1 - tempDiff * 0.05);

    // CO2 modifier (optimal 600+ ppm, minimum atmospheric baseline 400 ppm)
    const co2 = tank.roomEnvironment.co2Ppm;
    const co2Modifier = co2 < 400 ? 0.5 : co2 > 1000 ? 0.8 : 1.0;

    plant.lightResponse.photosynthesisRateRelative =
      lightCurve * chlorophyllModifier * temperatureModifier * co2Modifier;
  }

  private updateNutrientUptake(
    plant: PlantState,
    tank: TankState,
    strain: StrainGenetics
  ): void {
    // Stage-dependent uptake rates (mg/day) - increased 5x for gameplay
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

    // pH lockout checking (optimal 5.5-6.5)
    const pH = tank.waterChemistry.ph;
    let phLockoutFactor = 1.0;
    if (pH < 5.0 || pH > 7.0) {
      phLockoutFactor = 0.4;
      plant.stressIndicators.nutrientLockoutActive = true;
    }

    nUptake *= phLockoutFactor;
    pUptake *= phLockoutFactor;
    kUptake *= phLockoutFactor;

    // Deduct from tank nutrients
    tank.macroNutrients.nitrogenNMgPerLiter = Math.max(
      0,
      tank.macroNutrients.nitrogenNMgPerLiter - nUptake / tank.specifications.volumeLiters
    );
    tank.macroNutrients.phosphorusPMgPerLiter = Math.max(
      0,
      tank.macroNutrients.phosphorusPMgPerLiter - pUptake / tank.specifications.volumeLiters
    );
    tank.macroNutrients.potassiumKMgPerLiter = Math.max(
      0,
      tank.macroNutrients.potassiumKMgPerLiter - kUptake / tank.specifications.volumeLiters
    );

    // Track daily uptake
    plant.nutrientUptakeToday.nMg = nUptake;
    plant.nutrientUptakeToday.pMg = pUptake;
    plant.nutrientUptakeToday.kMg = kUptake;
  }

  private updateMorphology(
    plant: PlantState,
    tank: TankState,
    strain: StrainGenetics
  ): void {
    // Height growth (stage-dependent)
    let heightGrowthMm = 15; // Base 15mm/day during veg
    if (plant.growthStage.stage === "seedling") {
      heightGrowthMm = 5;
    } else if (plant.growthStage.stage.includes("flower")) {
      heightGrowthMm = 8; // Reduced during flower
    }

    // SuperSi boost (stem strengthening, PAR tolerance)
    const siBoost = 1 + tank.microNutrients.siliconSiMgPerLiter / 100;
    heightGrowthMm *= siBoost * 0.1; // 10% boost per 100 mg/L Si

    plant.morphology.heightGrowthTodayMm = heightGrowthMm;
    plant.morphology.heightCm += heightGrowthMm / 10;
    plant.morphology.stemDiameterMm += heightGrowthMm * 0.15; // Proportional thickening

    // LAI growth
    if (plant.growthStage.stage === "vegetative") {
      plant.morphology.leafAreaIndex += 0.3;
    } else if (plant.growthStage.stage.includes("flower")) {
      plant.morphology.leafAreaIndex += 0.1;
    }

    // Node/branch development during veg
    if (plant.growthStage.stage === "vegetative") {
      plant.morphology.nodeCount += 2;
      if (plant.morphology.nodeCount % 3 === 0) {
        plant.morphology.branchCount += 1;
      }
    }
  }

  private updateChlorophyll(plant: PlantState, tank: TankState): void {
    // Chlorophyll development based on light and health
    let chlorophyllGrowth = 0.8; // Base 0.8% per day

    // Light-dependent (higher PAR = faster chlorophyll)
    const parModifier = Math.min(1.5, plant.lightResponse.currentParUmol / 600);
    chlorophyllGrowth *= parModifier;

    // Health-dependent
    const healthModifier = plant.physiology.plantHealthPercent / 100;
    chlorophyllGrowth *= healthModifier;

    // N-dependent (nitrogen is critical for chlorophyll synthesis)
    const nAvailable = tank.macroNutrients.nitrogenNMgPerLiter;
    if (nAvailable < 50) {
      chlorophyllGrowth *= 0.5; // Half growth if N is low
    } else if (nAvailable > 120) {
      chlorophyllGrowth *= 1.2; // Boost if N is abundant
    }

    // Stage-dependent
    if (plant.growthStage.stage === "seedling") {
      chlorophyllGrowth *= 1.5; // Seedlings need fast chlorophyll development
    } else if (plant.growthStage.stage.includes("flower")) {
      chlorophyllGrowth *= 0.7; // Reduced during flowering
    }

    // Cap at 100% and grow from base
    plant.physiology.chlorophyllPercent = Math.min(
      100,
      plant.physiology.chlorophyllPercent + chlorophyllGrowth
    );
  }

  private updateRootMass(plant: PlantState, tank: TankState): void {
    // Base root growth 2 grams/day
    let rootGrowth = 2;

    // N/P dependent
    const nAvailable = tank.macroNutrients.nitrogenNMgPerLiter;
    const pAvailable = tank.macroNutrients.phosphorusPMgPerLiter;
    const npFactor = Math.min(1.5, (nAvailable + pAvailable) / 100);
    rootGrowth *= npFactor;

    // Hypoxia penalty (DO < 5 mg/L)
    if (tank.waterChemistry.dissolvedOxygenMgPerLiter < 5) {
      rootGrowth *= 0.5;
      plant.stressIndicators.hypoxiaActive = true;
    }

    plant.physiology.rootMassDryWeightGrams += rootGrowth;
    plant.physiology.rootDevelopmentPercent = Math.min(
      100,
      plant.physiology.rootDevelopmentPercent + 2
    );
  }

  private updateCannabinoidsynthesis(
    plant: PlantState,
    tank: TankState,
    strain: StrainGenetics
  ): void {
    // Only during flowering
    if (!plant.flowering.floweringInitiated) return;

    // Base accumulation rate (0.5% per day during flower)
    let cbdaRate = 0.5;
    let thcaRate = strain.thcPercent / strain.floweringTimeDays;

    // PAR stress boost (>900 µmol triggers senescence)
    if (plant.lightResponse.currentParUmol > 900) {
      thcaRate *= 1.15; // 15% boost for high PAR
    }

    // Chitosan efficacy window (7-10 days active, peaks weeks 3-6 of flower)
    const daysInFlower = plant.flowering.daysInFlower;
    const chitosan = tank.additivesActive.chitosanMgPerLiter;
    const chitosanDaysSince = tank.additivesActive.chitosanDaysSinceApplication ?? 999;

    if (chitosan > 0 && chitosanDaysSince <= 10) {
      const chitosanBoost = 1 + strain.responsivityToChitosan * 0.8; // Up to 80% boost
      thcaRate *= chitosanBoost;
      cbdaRate *= 0.95; // Slight CBD suppression when THC is boosted

      // Terpene enhancement (STEP 1 called for 78% CBDA, 95% terpene boost)
      plant.flowering.budDensityScale1To10 *= 1.15; // Denser buds
    }

    // Peak production weeks 3-6 of flower
    if (daysInFlower >= 21 && daysInFlower <= 42) {
      thcaRate *= 1.3; // 30% boost during peak window
    }

    plant.cannabinoids.thcaAccumulationPercent = Math.min(
      strain.thcPercent * 1.1,
      plant.cannabinoids.thcaAccumulationPercent + thcaRate
    );
    plant.cannabinoids.cbdaAccumulationPercent = Math.min(
      strain.cbdPercent * 1.1,
      plant.cannabinoids.cbdaAccumulationPercent + cbdaRate
    );

    // CBN (oxidized THC, increases with late harvest)
    if (daysInFlower > strain.floweringTimeDays - 7) {
      plant.cannabinoids.cbnAccumulationPercent += 0.1;
    }
  }

  private updateTrichomeMaturity(plant: PlantState, tank: TankState): void {
    if (!plant.flowering.floweringInitiated) return;

    // Base maturation rate: 1% per day
    let maturationRate = 1.0;

    // Temperature modifier (+1.2x at >26°C, -0.9x at <18°C)
    const temp = tank.roomEnvironment.airTemperatureCelsius;
    if (temp > 26) maturationRate *= 1.2;
    if (temp < 18) maturationRate *= 0.9;

    // Humidity modifier (-0.9x at >70%, promoting mold risk)
    if (tank.roomEnvironment.relativeHumidityPercent > 70) {
      maturationRate *= 0.9;
    }

    // PAR modifier (+1.15x at >1000 µmol)
    if (plant.lightResponse.currentParUmol > 1000) {
      maturationRate *= 1.15;
    }

    // Chitosan boost (+1.05x)
    if (tank.additivesActive.chitosanMgPerLiter > 0) {
      maturationRate *= 1.05;
    }

    // Progression: Clear → Cloudy → Amber
    const totalMaturity =
      plant.trichomeMaturity.clearTrichomesPercent +
      plant.trichomeMaturity.cloudyTrichomesPercent +
      plant.trichomeMaturity.amberTrichomesPercent;

    if (totalMaturity < 100) {
      plant.trichomeMaturity.clearTrichomesPercent = Math.max(
        0,
        plant.trichomeMaturity.clearTrichomesPercent - maturationRate
      );
      plant.trichomeMaturity.cloudyTrichomesPercent = Math.min(
        100,
        plant.trichomeMaturity.cloudyTrichomesPercent + maturationRate * 0.9
      );

      if (plant.trichomeMaturity.cloudyTrichomesPercent > 60) {
        plant.trichomeMaturity.amberTrichomesPercent = Math.min(
          100,
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

      // Damage without SuperSi
      const siMitigation = Math.min(1.0, tank.microNutrients.siliconSiMgPerLiter / 100);
      const damageRate = (1 - siMitigation) * 0.5; // Up to 0.5% health loss/day without Si

      plant.physiology.plantHealthPercent = Math.max(
        0,
        plant.physiology.plantHealthPercent - damageRate
      );
      plant.visibleSymptoms.lightBurn = true;
    } else {
      plant.stressIndicators.photoinhibitionActive = false;
      plant.lightResponse.photoinhibitionRiskPercent = 0;
    }
  }

  private updateDeficiencySymptoms(plant: PlantState, tank: TankState): void {
    const n = tank.macroNutrients.nitrogenNMgPerLiter;
    const p = tank.macroNutrients.phosphorusPMgPerLiter;
    const k = tank.macroNutrients.potassiumKMgPerLiter;
    const ca = tank.macroNutrients.calciumCaMgPerLiter;
    const mg = tank.macroNutrients.magnesiumMgMgPerLiter;

    // Thresholds for visible symptoms (mg/L)
    plant.visibleSymptoms.nitrogenDeficiency = n < 80;
    plant.visibleSymptoms.phosphorusDeficiency = p < 30;
    plant.visibleSymptoms.potassiumDeficiency = k < 100;
    plant.visibleSymptoms.calciumDeficiency = ca < 120;
    plant.visibleSymptoms.magnesiumDeficiency = mg < 40;

    // Health penalty for deficiencies
    let healthPenalty = 0;
    if (plant.visibleSymptoms.nitrogenDeficiency) healthPenalty += 0.5;
    if (plant.visibleSymptoms.phosphorusDeficiency) healthPenalty += 0.3;
    if (plant.visibleSymptoms.potassiumDeficiency) healthPenalty += 0.4;
    if (plant.visibleSymptoms.calciumDeficiency) healthPenalty += 0.2;
    if (plant.visibleSymptoms.magnesiumDeficiency) healthPenalty += 0.2;

    plant.physiology.plantHealthPercent = Math.max(
      0,
      plant.physiology.plantHealthPercent - healthPenalty
    );
  }

  private updateDiseasePressure(plant: PlantState, tank: TankState): void {
    const humidity = tank.roomEnvironment.relativeHumidityPercent;
    const temp = tank.roomEnvironment.airTemperatureCelsius;
    const airFlow = tank.roomEnvironment.airChangesPerHour;

    // Initialize counters if needed
    if (!plant.stressIndicators.diseasePressureCounters) {
      plant.stressIndicators.diseasePressureCounters = {};
    }

    // Powdery mildew requires sustained bad conditions (>72 hours at >70% RH and <4 ACH)
    const pmConditionsActive = humidity > 70 && airFlow < 4;
    if (pmConditionsActive) {
      plant.stressIndicators.diseasePressureCounters.pmDaysExposed =
        (plant.stressIndicators.diseasePressureCounters.pmDaysExposed || 0) + 1;

      // Show warning at day 1 of bad conditions
      if (plant.stressIndicators.diseasePressureCounters.pmDaysExposed === 1) {
        if (!tank.warnings.includes("⚠️ Powdery mildew risk: High humidity & low airflow")) {
          tank.warnings.push("⚠️ Powdery mildew risk: High humidity & low airflow");
        }
      }

      // Show at-risk status at day 2
      if (plant.stressIndicators.diseasePressureCounters.pmDaysExposed === 2) {
        if (!tank.alerts.includes("🟡 PM at-risk (2/3 days bad conditions)")) {
          tank.alerts.push("🟡 PM at-risk (2/3 days bad conditions)");
        }
      }

      // Symptoms appear at day 4
      if (plant.stressIndicators.diseasePressureCounters.pmDaysExposed > 3) {
        plant.visibleSymptoms.powderyMildew = true;
        if (!tank.alerts.includes("🔴 Powdery mildew detected")) {
          tank.alerts.push("🔴 Powdery mildew detected");
        }
      }
    } else {
      plant.stressIndicators.diseasePressureCounters.pmDaysExposed = 0;
      plant.visibleSymptoms.powderyMildew = false;
    }

    // Botrytis requires sustained bad conditions (>72 hours at >75% RH and <20°C)
    const botrytisConditionsActive = humidity > 75 && temp < 20;
    if (botrytisConditionsActive) {
      plant.stressIndicators.diseasePressureCounters.botrytilsDaysExposed =
        (plant.stressIndicators.diseasePressureCounters.botrytilsDaysExposed || 0) + 1;

      // Show warning at day 1
      if (plant.stressIndicators.diseasePressureCounters.botrytilsDaysExposed === 1) {
        if (!tank.warnings.includes("⚠️ Botrytis risk: High humidity & cold temps")) {
          tank.warnings.push("⚠️ Botrytis risk: High humidity & cold temps");
        }
      }

      // Show at-risk status at day 2
      if (plant.stressIndicators.diseasePressureCounters.botrytilsDaysExposed === 2) {
        if (!tank.alerts.includes("🟡 Botrytis at-risk (2/3 days bad conditions)")) {
          tank.alerts.push("🟡 Botrytis at-risk (2/3 days bad conditions)");
        }
      }

      // Symptoms appear at day 4
      if (plant.stressIndicators.diseasePressureCounters.botrytilsDaysExposed > 3) {
        plant.visibleSymptoms.botrytis = true;
        if (!tank.alerts.includes("🔴 Botrytis detected")) {
          tank.alerts.push("🔴 Botrytis detected");
        }
      }
    } else {
      plant.stressIndicators.diseasePressureCounters.botrytilsDaysExposed = 0;
      plant.visibleSymptoms.botrytis = false;
    }

    // Chitosan reduces disease risk 40%
    const chitosanFactor = tank.additivesActive.chitosanMgPerLiter > 0 ? 0.6 : 1.0;

    if (plant.visibleSymptoms.powderyMildew || plant.visibleSymptoms.botrytis) {
      plant.physiology.plantHealthPercent -= 2 * chitosanFactor;
    }
  }

  private trackElectricity(
    plant: PlantState,
    tank: TankState,
    parUmol: number
  ): void {
    // Estimate LED wattage from PAR
    const estimatedLedWattage = (parUmol / 1000) * 400; // ~400W per 1000 µmol
    const dailyKwh = (estimatedLedWattage / 1000) * (plant.lightResponse.lightScheduleHoursOn / 24);

    // + heater usage (estimated)
    const heaterKwh = (tank.specifications.heaterWattage / 1000) * 0.5; // ~50% duty cycle
    const totalKwh = dailyKwh + heaterKwh;

    // Store for GameManager to deduct from cash
    plant.nutrientUptakeToday.siMg = totalKwh * 100; // Store in siMg temporarily (scaled by 100 for precision)
  }

  private updateTankChemistry(plant: PlantState, tank: TankState): void {
    // pH drift from nitrogen uptake
    const nUptakeRate = plant.nutrientUptakeToday.nMg / 100;
    tank.waterChemistry.phDriftPerDay = nUptakeRate * 0.1; // ~0.1 pH drop per 100mg N uptake
    tank.waterChemistry.ph = Math.max(4.5, Math.min(8.5, tank.waterChemistry.ph - tank.waterChemistry.phDriftPerDay));

    // EC drift from nutrient depletion
    const totalNutrientDepletion =
      plant.nutrientUptakeToday.nMg +
      plant.nutrientUptakeToday.pMg +
      plant.nutrientUptakeToday.kMg;
    tank.waterChemistry.ecMscm = Math.max(0, tank.waterChemistry.ecMscm - totalNutrientDepletion / 1000);
    tank.waterChemistry.ppm = tank.waterChemistry.ecMscm * 640; // EC to PPM conversion

    // Water age tracking
    tank.waterChemistry.waterAgeDays++;

    // Trigger water change warning at >1150 ppm TDS
    if (tank.waterChemistry.totalDissolvedSolidsPpm > 1150) {
      if (!tank.warnings.includes("High TDS - water change recommended")) {
        tank.warnings.push("High TDS - water change recommended");
      }
    }
  }

  private updateYieldModifiers(
    plant: PlantState,
    tank: TankState,
    strain: StrainGenetics,
    parUmol: number
  ): void {
    // healthFactor: 0.5 at 0% health, 1.0 at 80%+ health
    const health = plant.physiology.plantHealthPercent;
    plant.yieldModifiers.healthFactor = Math.max(0.3, health / 100);

    // nutrientBalanceFactor: penalty if N, P, or K are out of range
    const n = tank.macroNutrients.nitrogenNMgPerLiter;
    const p = tank.macroNutrients.phosphorusPMgPerLiter;
    const k = tank.macroNutrients.potassiumKMgPerLiter;

    // Optimal ranges: N 100-180, P 30-60, K 100-180
    const nOptimal = n >= 100 && n <= 180 ? 1.0 : Math.max(0.5, 1.0 - Math.abs(n - 140) / 200);
    const pOptimal = p >= 30 && p <= 60 ? 1.0 : Math.max(0.5, 1.0 - Math.abs(p - 45) / 60);
    const kOptimal = k >= 100 && k <= 180 ? 1.0 : Math.max(0.5, 1.0 - Math.abs(k - 140) / 200);
    plant.yieldModifiers.nutrientBalanceFactor = (nOptimal + pOptimal + kOptimal) / 3;

    // lightEfficiencyFactor: penalty if PAR is out of optimal range (600-1000 µmol)
    const parOptimalMin = 600;
    const parOptimalMax = 1000;
    let lightFactor = 1.0;
    if (parUmol < parOptimalMin) {
      lightFactor = 0.5 + (parUmol / parOptimalMin) * 0.5; // 0.5 at 0 PAR, 1.0 at 600
    } else if (parUmol > parOptimalMax) {
      lightFactor = 1.0 - ((parUmol - parOptimalMax) / 200) * 0.3; // Penalize high PAR
    }
    plant.yieldModifiers.lightEfficiencyFactor = Math.max(0.3, lightFactor);

    // stressPenaltyFactor: penalty based on total stress percentage
    const stressPercent = plant.stressIndicators.totalStressPercent || 0;
    plant.yieldModifiers.stressPenaltyFactor = Math.max(0.5, 1.0 - stressPercent / 100);
  }

  private resetDailyTracking(plant: PlantState): void {
    // Store previous day's growth for UI display (will be cleared at START of next day)
    // plant.morphology.heightGrowthTodayMm is intentionally NOT reset here

    plant.physiology.chlorophyllChangeTodayPercent = 0;
    plant.physiology.plantHealthChangeTodayPercent = 0;
    // nutrientUptakeToday kept for cycle end tracking

    // Decay additive presence
    if (plant.gameDay % 7 === 0) {
      // Fade additives weekly
    }
  }

  private updateYieldTracking(
    plant: PlantState,
    tank: TankState,
    strain: any
  ): void {
    const daysInFlower = plant.flowering.daysInFlower;
    const floweringDays = strain.floweringTimeDays;

    // Calculate current yield estimate
    const healthFactor = Math.max(0.3, plant.physiology.plantHealthPercent / 100);
    const nutrientFactor = plant.yieldModifiers.nutrientBalanceFactor;
    const lightFactor = plant.yieldModifiers.lightEfficiencyFactor;
    const stressFactor = plant.yieldModifiers.stressPenaltyFactor;

    // Get yield progression percentage for current day
    let progressionPercent = 0;
    if (daysInFlower <= 7) {
      progressionPercent = strain.yieldProfile.yieldProgressionWeek5Percent * 0.5;
    } else if (daysInFlower <= 14) {
      progressionPercent = strain.yieldProfile.yieldProgressionWeek5Percent * 0.7;
    } else if (daysInFlower <= 21) {
      progressionPercent = strain.yieldProfile.yieldProgressionWeek5Percent;
    } else if (daysInFlower <= 28) {
      progressionPercent = strain.yieldProfile.yieldProgressionWeek6Percent;
    } else if (daysInFlower <= 35) {
      progressionPercent = strain.yieldProfile.yieldProgressionWeek7Percent;
    } else {
      progressionPercent = strain.yieldProfile.yieldProgressionWeek8Percent;
    }

    let currentYield =
      strain.yieldProfile.yieldGramsTypical *
      (progressionPercent / 100) *
      healthFactor *
      nutrientFactor *
      lightFactor *
      stressFactor;

    // Post-peak degradation: yield decreases after optimal harvest day
    if (daysInFlower > floweringDays) {
      const daysOverdue = daysInFlower - floweringDays;
      const degradationRate = strain.yieldProfile.degradationPercentPerDay;
      const qualityLoss = 1 - (degradationRate / 100) ** daysOverdue;
      currentYield *= Math.max(0.5, qualityLoss);
    }

    // Update yield tracking
    const previousYield = plant.yieldTracking.currentEstimateGrams;
    plant.yieldTracking.currentEstimateGrams = Math.round(currentYield * 10) / 10;

    // Detect peak yield (yield stopped increasing)
    if (
      plant.yieldTracking.peakYieldDay === null &&
      previousYield > plant.yieldTracking.currentEstimateGrams
    ) {
      plant.yieldTracking.peakYieldDay = plant.flowering.daysInFlower - 1;
      plant.yieldTracking.peakYieldGrams = previousYield;
    }

    // Update days since peak
    if (plant.yieldTracking.peakYieldDay !== null) {
      plant.yieldTracking.daysSincePeak = daysInFlower - plant.yieldTracking.peakYieldDay;
    }

    // Calculate quality loss due to post-peak degradation
    if (plant.yieldTracking.daysSincePeak > 0) {
      const degradationRate = strain.yieldProfile.degradationPercentPerDay;
      plant.yieldTracking.qualityLossPercent = Math.min(
        100,
        (degradationRate / 100) ** plant.yieldTracking.daysSincePeak * 100
      );
    }

    // Update trichome maturity for quality estimation
    const clearPercent = plant.trichomeMaturity.clearTrichomesPercent;
    const cloudyPercent = plant.trichomeMaturity.cloudyTrichomesPercent;
    const amberPercent = plant.trichomeMaturity.amberTrichomesPercent;

    const peakClear = strain.yieldProfile.trichomePeakClearPercent;
    const peakCloudy = strain.yieldProfile.trichomePeakCloudyPercent;
    const peakAmber = strain.yieldProfile.trichomePeakAmberPercent;

    // Simple trichome quality score
    const clearDiff = Math.abs(clearPercent - peakClear);
    const cloudyDiff = Math.abs(cloudyPercent - peakCloudy);
    const amberDiff = Math.abs(amberPercent - peakAmber);
    const totalDiff = (clearDiff + cloudyDiff + amberDiff) / 3;
    plant.yieldTracking.harvestQualityScore = Math.max(
      0,
      100 - totalDiff * 5 - plant.yieldTracking.qualityLossPercent
    );

    // Set quality tier
    if (plant.yieldTracking.harvestQualityScore >= 90) {
      plant.yieldTracking.qualityTier = "S";
    } else if (plant.yieldTracking.harvestQualityScore >= 75) {
      plant.yieldTracking.qualityTier = "A";
    } else if (plant.yieldTracking.harvestQualityScore >= 60) {
      plant.yieldTracking.qualityTier = "B";
    } else {
      plant.yieldTracking.qualityTier = "C";
    }
  }
}
