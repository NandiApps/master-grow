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

    // Step 14: Reset daily tracking
    this.resetDailyTracking(plant);

    plant.gameDay++;
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

    // CO2 modifier (optimal 400-600 ppm)
    const co2 = tank.roomEnvironment.co2Ppm;
    const co2Modifier = co2 < 300 ? 0.5 : co2 > 1000 ? 0.8 : 1.0;

    plant.lightResponse.photosynthesisRateRelative =
      lightCurve * chlorophyllModifier * temperatureModifier * co2Modifier;
  }

  private updateNutrientUptake(
    plant: PlantState,
    tank: TankState,
    strain: StrainGenetics
  ): void {
    // Stage-dependent uptake rates (mg/day)
    let nUptake = 15;
    let pUptake = 8;
    let kUptake = 20;

    if (plant.growthStage.stage === "vegetative") {
      nUptake = 20;
      pUptake = 6;
      kUptake = 18;
    } else if (plant.growthStage.stage.includes("flower")) {
      nUptake = 10;
      pUptake = 12;
      kUptake = 25;
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
    let thcaRate = (strain.thcPercent / strain.floweringTimeDays) * 100;

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

    // Powdery mildew risk (high humidity, low airflow)
    const pmRisk = humidity > 70 && airFlow < 4 ? 0.15 : 0.02;
    plant.visibleSymptoms.powderyMildew = Math.random() < pmRisk;

    // Botrytis risk (high humidity, cool temps)
    const botrytisRisk = humidity > 75 && temp < 20 ? 0.2 : 0.03;
    plant.visibleSymptoms.botrytis = Math.random() < botrytisRisk;

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

    plant.nutrientUptakeToday.siMg = 0; // Placeholder for tracking
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

  private resetDailyTracking(plant: PlantState): void {
    plant.morphology.heightGrowthTodayMm = 0;
    plant.physiology.chlorophyllChangeTodayPercent = 0;
    plant.physiology.plantHealthChangeTodayPercent = 0;
    plant.nutrientUptakeToday = { nMg: 0, pMg: 0, kMg: 0, caMg: 0, mgMg: 0, siMg: 0 };

    // Decay additive presence
    if (plant.gameDay % 7 === 0) {
      // Fade additives weekly
    }
  }
}
