/**
 * Game Manager - Orchestrates game lifecycle
 * Handles start, day execution, harvest, state management
 *
 * FIXES APPLIED (audit 2026-05-16):
 * #2  Electricity read from physiology.electricityKwhToday (not siMg hack)
 * #3  cycleStartDay set on PlantState so cycle-2 plants start at seedling
 * #8  Additive concentrations calibrated to realistic mg/L boosts
 * #14 New Grow Formula (N Boost) additive type handled
 * #18 airTemperatureTarget replaces the mislabelled waterTemperatureTarget
 * New: exhaust fan reduces effective humidity by up to 5 RH points at max ACH
 * New: mycorrhizae and fungicide additive types handled
 * New: fungicide decays after 7 days
 */

import { v4 as uuidv4 } from "uuid";
import {
  GameState,
  PlantState,
  TankState,
  StartGameRequest,
  GameDayActionRequest,
  HarvestRequest,
  HarvestAssessment,
  GameStateResponse,
  PlantMorphology,
  PlantPhysiology,
  GrowthStage,
  LightResponse,
  FloweringState,
  CannabinoidsState,
  TrichomeMaturity,
  VisibleSymptoms,
  StressIndicators,
  TankSpecifications,
  WaterChemistry,
  MacroNutrients,
  MicroNutrients,
  AdditivesActive,
  RoomEnvironment,
  Economics,
  CycleInformation,
} from "../types";
import { SimulationEngine } from "./SimulationEngine";
import { HarvestAssessmentEngine } from "./HarvestAssessmentEngine";
import { getStrain, getAllStrains } from "../data/strains";
import { getAdditive, listAdditives } from "../data/additives";

export class GameManager {
  private simulationEngine = new SimulationEngine();
  private gameState: GameState | null = null;
  private plantState: PlantState | null = null;
  private tankState: TankState | null = null;

  startGame(request: StartGameRequest): GameStateResponse {
    const gameId = uuidv4();
    const strain = getStrain(request.selectedStrainId);

    this.gameState = {
      gameId,
      playerName: request.playerName,
      gameStartDay: 0,
      currentGameDay: 0,
      gameStatus: "in_progress",
      cycleInformation: {
        cycleNumber: 1,
        selectedStrainId: request.selectedStrainId,
        selectedStrainName: strain.name,
        seedPurchasedDay: 0,
        seedCostAud: strain.seedCostAud,
        germinationDay: 3,
        seedlingTransplantDay: 7,
        expectedHarvestDay: 7 + strain.floweringTimeDays + 21,
        harvestStatus: "growing",
        harvestDay: null,
        finalYieldGrams: null,
        finalYieldQuality: null,
      },
      economics: {
        startingBudgetAud: 1000,
        currentCashAud: 1000 - strain.seedCostAud,
        totalSpentAud: strain.seedCostAud,
        totalRevenueAud: 0,
        cumulativeProfitAud: 0,
        spendingBreakdown: {
          seedsAud: strain.seedCostAud,
          nutrientsAud: 0,
          additivesAud: 0,
          electricityAud: 0,
        },
        electricityTracking: {
          totalKwhUsed: 0,
          ratePerKwhAud: request.electricityRateAudPerKwh,
          totalElectricityCostAud: 0,
        },
      },
      plantRoster: [{ plantId: uuidv4(), status: "growing", strainId: request.selectedStrainId }],
      tankRoster:  [{ tankId: uuidv4(),  plantId: "",       status: "active" }],
      settings: {
        difficulty: request.difficulty,
        electricityRateAudPerKwh: request.electricityRateAudPerKwh,
        location: "Australia",
      },
      statistics: {
        totalDaysPlayed: 0,
        monitoringActionsPerformed: 0,
        additiveApplications: 0,
        waterChangesPerformed: 0,
        nutrientDosedTimes: 0,
        trichomeInspections: 0,
      },
      notifications: [{
        day: 0,
        message: `Started growing ${strain.name}. Germination in 3 days.`,
        severity: "info",
      }],
    };

    const plantId = this.gameState.plantRoster[0].plantId;
    this.plantState = this.createInitialPlantState(plantId, request.selectedStrainId, 0, 1, strain);

    const tankId = this.gameState.tankRoster[0].tankId;
    this.tankState  = this.createInitialTankState(tankId);
    this.gameState.tankRoster[0].plantId = plantId;

    return this.getGameState();
  }

  /** Shared factory — used by startGame and startNewCycle to ensure identical initial state */
  private createInitialPlantState(
    plantId: string,
    strainId: string,
    cycleStartDay: number,
    cycleNumber: number,
    strain: any
  ): PlantState {
    return {
      plantId,
      gameDay: cycleStartDay,
      cycleStartDay,                  // Fix #3
      strainId,
      growCycleNumber: cycleNumber,
      morphology: {
        heightCm: 1,
        heightGrowthTodayMm: 0,
        stemDiameterMm: 2,
        leafAreaIndex: 0.5,
        nodeCount: 2,
        branchCount: 0,
      },
      physiology: {
        chlorophyllPercent: 50,
        chlorophyllChangeTodayPercent: 0,
        plantHealthPercent: 100,
        plantHealthChangeTodayPercent: 0,
        rootMassDryWeightGrams: 5,
        rootDevelopmentPercent: 10,
        biomassDryWeightGrams: 2,
        electricityKwhToday: 0,       // Fix #2
      },
      growthStage: {
        stage: "seedling",
        daysInStage: 0,
        stageProgressPercent: 0,
        nextStage: "vegetative",
        daysToNextStage: 7,
      },
      lightResponse: {
        currentParUmol: 600,
        lightScheduleHoursOn: 18,
        lightScheduleHoursOff: 6,
        photosynthesisRateRelative: 0.6,
        photoinhibitionRiskPercent: 0,
        parStressResponseActive: false,
      },
      flowering: {
        floweringInitiated: false,
        floweringStartDay: null,
        daysInFlower: 0,
        floweringProgressPercent: 0,
        expectedHarvestDay: null,
        flowerStretchPhase: false,
        budDensityScale1To10: strain.budDensity1To10,
      },
      cannabinoids: {
        cbdaAccumulationPercent: 0,
        thcaAccumulationPercent: 0,
        cbnAccumulationPercent: 0,
        thcEquivalentPercentIfHarvested: 0,
        cbdEquivalentPercentIfHarvested: 0,
        totalCannabinoidsPercent: 0,
      },
      trichomeMaturity: {
        clearTrichomesPercent: 100,
        cloudyTrichomesPercent: 0,
        amberTrichomesPercent: 0,
        maturationStartDay: null,
        daysTopeakMaturity: 14,
        optimalHarvestDayLowPar: 0,
        optimalHarvestDayHighPar: 0,
      },
      visibleSymptoms: {
        nitrogenDeficiency: false,
        phosphorusDeficiency: false,
        potassiumDeficiency: false,
        calciumDeficiency: false,
        magnesiumDeficiency: false,
        powderyMildew: false,
        botrytis: false,
        nutrientBurn: false,
        lightBurn: false,
      },
      stressIndicators: {
        heatStressActive: false,
        coldStressActive: false,
        humidityStressActive: false,
        nutrientLockoutActive: false,
        photoinhibitionActive: false,
        hypoxiaActive: false,
        totalStressPercent: 0,
      },
      additiveHistory: [],
      nutrientUptakeToday: { nMg: 0, pMg: 0, kMg: 0, caMg: 0, mgMg: 0, siMg: 0 },
      cumulativeYieldEstimateGrams: strain.baseYieldGrams,
      yieldTracking: {
        currentEstimateGrams: strain.yieldProfile.yieldGramsTypical,
        peakYieldDay: null,
        peakYieldGrams: 0,
        harvestQualityScore: 0,
        qualityTier: "C",
        daysSincePeak: 0,
        qualityLossPercent: 0,
      },
      yieldModifiers: {
        geneticBase: 1.0,
        healthFactor: 1.0,
        nutrientBalanceFactor: 1.0,
        lightEfficiencyFactor: 1.0,
        stressPenaltyFactor: 1.0,
      },
    };
  }

  private createInitialTankState(tankId: string): TankState {
    return {
      tankId,
      gameDay: 0,
      specifications: {
        tankId,
        volumeLiters: 20,
        systemType: "dwc",
        airstoneCount: 2,
        heaterWattage: 300,
        temperatureControllerActive: true,
      },
      waterChemistry: {
        ph: 6.0,
        phDriftPerDay: 0,
        ecMscm: 1.2,
        ppm: 768,
        totalDissolvedSolidsPpm: 768,
        waterTemperatureCelsius: 20,
        dissolvedOxygenMgPerLiter: 7.5,
        waterAgeDays: 0,
      },
      macroNutrients: {
        nitrogenNMgPerLiter: 150,
        phosphorusPMgPerLiter: 50,
        potassiumKMgPerLiter: 180,
        calciumCaMgPerLiter: 140,
        magnesiumMgMgPerLiter: 60,
        sulfurSMgPerLiter: 80,
      },
      microNutrients: {
        siliconSiMgPerLiter: 0,
        ironFeMgPerLiter: 3,
        manganeseMnMgPerLiter: 2,
        zincZnMgPerLiter: 1,
        boronBMgPerLiter: 0.5,
        molybdenumMoMgPerLiter: 0.1,
      },
      additivesActive: {
        chitosanMgPerLiter: 0,
        chitosanDaysSinceApplication: null,
        mejaMgPerLiter: 0,
        kelpExtractConcentration: 0,
        mycorrhizaeApplied: false,
        fungicideApplied: false,
        fungicideDaysSince: null,
      },
      roomEnvironment: {
        airTemperatureCelsius: 22,
        airTemperatureMinCelsius: 20,
        airTemperatureMaxCelsius: 26,
        relativeHumidityPercent: 60,
        vaporPressureDeficitKpa: 1.0,
        co2Ppm: 400,
        lightParUmolPerM2PerS: 600,
        airChangesPerHour: 4,
      },
      maintenanceLog: [],
      alerts: [],
      warnings: [],
    };
  }

  executeGameDay(actions: GameDayActionRequest): GameStateResponse {
    if (!this.gameState || !this.plantState || !this.tankState) {
      throw new Error("Game not started");
    }

    // Reset growth tracking from previous day
    this.plantState.morphology.heightGrowthTodayMm = 0;
    this.plantState.nutrientUptakeToday = { nMg: 0, pMg: 0, kMg: 0, caMg: 0, mgMg: 0, siMg: 0 };

    // Apply environment controls
    this.tankState.roomEnvironment.lightParUmolPerM2PerS = actions.parUmol;
    this.tankState.roomEnvironment.relativeHumidityPercent = actions.humidityTarget;

    // Fix #18: airTemperatureTarget replaces mislabelled waterTemperatureTarget
    this.tankState.roomEnvironment.airTemperatureCelsius = actions.airTemperatureTarget;

    if (actions.waterTemperatureCelsius !== undefined) {
      this.tankState.waterChemistry.waterTemperatureCelsius = actions.waterTemperatureCelsius;
    }

    if (actions.co2TargetPpm !== undefined) {
      this.tankState.roomEnvironment.co2Ppm = Math.max(400, Math.min(1500, actions.co2TargetPpm));
    }

    if (actions.exhaustFanPercent !== undefined) {
      const ach = (actions.exhaustFanPercent / 100) * 10;
      this.tankState.roomEnvironment.airChangesPerHour = ach;

      // Exhaust fan reduces effective humidity — up to 5 RH points at 100% fan (10 ACH)
      const fanHumidityReduction = ach * 0.5;
      this.tankState.roomEnvironment.relativeHumidityPercent = Math.max(
        20,
        this.tankState.roomEnvironment.relativeHumidityPercent - fanHumidityReduction
      );
    }

    // ─── Nutrient top-up ───────────────────────────────────────────────────
    if (actions.nutrientTopUp?.baseNutrientMl) {
      const ml = actions.nutrientTopUp.baseNutrientMl;
      const costAud = ml * 0.05;
      this.gameState.economics.currentCashAud -= costAud;
      this.gameState.economics.totalSpentAud  += costAud;
      this.gameState.economics.spendingBreakdown.nutrientsAud += costAud;
      this.gameState.statistics.nutrientDosedTimes++;

      // Fix #8: calibrated boosts — 10 mL raises N +25, P +10, K +20 mg/L in 20L
      const vol = this.tankState.specifications.volumeLiters;
      const nBoost = (ml * 50) / vol;
      const pBoost = (ml * 20) / vol;
      const kBoost = (ml * 40) / vol;

      this.tankState.macroNutrients.nitrogenNMgPerLiter   = Math.min(200, this.tankState.macroNutrients.nitrogenNMgPerLiter   + nBoost);
      this.tankState.macroNutrients.phosphorusPMgPerLiter = Math.min(100, this.tankState.macroNutrients.phosphorusPMgPerLiter + pBoost);
      this.tankState.macroNutrients.potassiumKMgPerLiter  = Math.min(250, this.tankState.macroNutrients.potassiumKMgPerLiter  + kBoost);
    }

    // pH adjustments
    if (actions.nutrientTopUp?.phUpMl) {
      const ml = actions.nutrientTopUp.phUpMl;
      this.tankState.waterChemistry.ph = Math.min(7.0, this.tankState.waterChemistry.ph + ml * 0.1);
      this.gameState.economics.currentCashAud -= ml * 0.02;
      this.gameState.economics.totalSpentAud  += ml * 0.02;
    }
    if (actions.nutrientTopUp?.phDownMl) {
      const ml = actions.nutrientTopUp.phDownMl;
      this.tankState.waterChemistry.ph = Math.max(5.0, this.tankState.waterChemistry.ph - ml * 0.1);
      this.gameState.economics.currentCashAud -= ml * 0.02;
      this.gameState.economics.totalSpentAud  += ml * 0.02;
    }

    // ─── Additives ─────────────────────────────────────────────────────────
    if (actions.additiveApplications) {
      for (const app of actions.additiveApplications) {
        const additive = getAdditive(app.additiveId);
        const costAud  = app.doseMl * additive.costPerMl;

        this.gameState.economics.currentCashAud -= costAud;
        this.gameState.economics.totalSpentAud  += costAud;
        this.gameState.economics.spendingBreakdown.additivesAud += costAud;
        this.gameState.statistics.additiveApplications++;

        const vol = this.tankState.specifications.volumeLiters;

        if (additive.type === "chitosan") {
          // Chitosan: concentration for biological signalling (mg/L product)
          const concentration = (app.doseMl * 1000) / vol;
          this.tankState.additivesActive.chitosanMgPerLiter = concentration;
          this.tankState.additivesActive.chitosanDaysSinceApplication = 0;

        } else if (additive.type === "silicon") {
          // Fix #8: 5 mL in 20L → +10 mg/L Si
          const siBoost = (app.doseMl * 40) / vol;
          this.tankState.microNutrients.siliconSiMgPerLiter = Math.min(
            200,
            this.tankState.microNutrients.siliconSiMgPerLiter + siBoost
          );

        } else if (additive.type === "kelp") {
          const concentration = (app.doseMl * 1000) / vol;
          this.tankState.additivesActive.kelpExtractConcentration += concentration;

        } else if (additive.type === "meija") {
          const concentration = (app.doseMl * 1000) / vol;
          this.tankState.additivesActive.mejaMgPerLiter = concentration;

        } else if (additive.type === "calmag") {
          // Fix #8: 10 mL in 20L → +25 mg/L Ca, +12 mg/L Mg (was 1000× too high)
          const caBoost = (app.doseMl * 50) / vol;
          const mgBoost = (app.doseMl * 25) / vol;
          this.tankState.macroNutrients.calciumCaMgPerLiter   = Math.min(200, this.tankState.macroNutrients.calciumCaMgPerLiter   + caBoost);
          this.tankState.macroNutrients.magnesiumMgMgPerLiter = Math.min(100, this.tankState.macroNutrients.magnesiumMgMgPerLiter + mgBoost);

        } else if (additive.type === "bloom") {
          // Fix #8: 8 mL in 20L → +24 mg/L P, +32 mg/L K
          const pBoost = (app.doseMl * 60) / vol;
          const kBoost = (app.doseMl * 80) / vol;
          this.tankState.macroNutrients.phosphorusPMgPerLiter = Math.min(150, this.tankState.macroNutrients.phosphorusPMgPerLiter + pBoost);
          this.tankState.macroNutrients.potassiumKMgPerLiter  = Math.min(300, this.tankState.macroNutrients.potassiumKMgPerLiter  + kBoost);

        } else if (additive.type === "grow") {
          // New — Grow Formula N+: high N, minimal P/K — 10 mL → +40 N, +5 P, +8 K mg/L
          const nBoost = (app.doseMl * 80) / vol;
          const pBoost = (app.doseMl * 10) / vol;
          const kBoost = (app.doseMl * 16) / vol;
          this.tankState.macroNutrients.nitrogenNMgPerLiter   = Math.min(220, this.tankState.macroNutrients.nitrogenNMgPerLiter   + nBoost);
          this.tankState.macroNutrients.phosphorusPMgPerLiter = Math.min(100, this.tankState.macroNutrients.phosphorusPMgPerLiter + pBoost);
          this.tankState.macroNutrients.potassiumKMgPerLiter  = Math.min(250, this.tankState.macroNutrients.potassiumKMgPerLiter  + kBoost);

        } else if (additive.type === "mycorrhizae") {
          // One-time per cycle — permanent root growth boost via mycorrhizaeApplied flag
          this.tankState.additivesActive.mycorrhizaeApplied = true;

        } else if (additive.type === "fungicide") {
          // Active for 7 days — halves disease recovery time in SimulationEngine
          this.tankState.additivesActive.fungicideApplied    = true;
          this.tankState.additivesActive.fungicideDaysSince  = 0;
        }

        this.plantState.additiveHistory.push({
          day: this.plantState.gameDay,
          additiveId: app.additiveId,
          doseMl: app.doseMl,
          concentrationMgPerLiter: (app.doseMl * 1000) / vol,
          effectivenessMultiplier: 1.0,
        });
      }
    }

    // Increment flowering days BEFORE simulation
    if (this.plantState.flowering.floweringInitiated) {
      this.plantState.flowering.daysInFlower++;
      const strain = getStrain(this.plantState.strainId);
      this.plantState.flowering.floweringProgressPercent = Math.min(
        100,
        (this.plantState.flowering.daysInFlower / strain.floweringTimeDays) * 100
      );
    }

    // Run simulation
    this.simulationEngine.updateDay(
      this.plantState,
      this.tankState,
      actions.parUmol,
      actions.lightScheduleHoursOn,
      actions.humidityTarget,
      actions.airTemperatureTarget      // Fix #18
    );

    // Fix #2: deduct electricity from physiology.electricityKwhToday
    const dailyKwhUsed  = this.plantState.physiology.electricityKwhToday;
    const electricityRate = this.gameState.settings.electricityRateAudPerKwh;
    const dailyCost      = dailyKwhUsed * electricityRate;
    this.gameState.economics.currentCashAud -= dailyCost;
    this.gameState.economics.totalSpentAud  += dailyCost;
    this.gameState.economics.spendingBreakdown.electricityAud += dailyCost;
    this.gameState.economics.electricityTracking.totalKwhUsed += dailyKwhUsed;
    this.gameState.economics.electricityTracking.totalElectricityCostAud += dailyCost;

    // Update game day counters
    this.gameState.currentGameDay++;
    this.tankState.gameDay++;
    this.gameState.statistics.totalDaysPlayed++;
    this.gameState.statistics.monitoringActionsPerformed++;

    // Decay chitosan
    if (this.tankState.additivesActive.chitosanDaysSinceApplication !== null) {
      this.tankState.additivesActive.chitosanDaysSinceApplication++;
      if (this.tankState.additivesActive.chitosanDaysSinceApplication > 10) {
        this.tankState.additivesActive.chitosanMgPerLiter = 0;
      }
    }

    // Decay fungicide (active 7 days)
    if (this.tankState.additivesActive.fungicideDaysSince !== null) {
      this.tankState.additivesActive.fungicideDaysSince++;
      if (this.tankState.additivesActive.fungicideDaysSince > 7) {
        this.tankState.additivesActive.fungicideApplied   = false;
        this.tankState.additivesActive.fungicideDaysSince = null;
      }
    }

    return this.getGameState();
  }

  private getGameState(): GameStateResponse {
    if (!this.gameState || !this.plantState || !this.tankState) {
      throw new Error("Game not initialized");
    }
    return {
      gameState: this.gameState,
      plant: this.plantState,
      tank: this.tankState,
      timestamp: new Date().toISOString(),
    };
  }

  getState(): GameState | null  { return this.gameState;  }
  getPlant(): PlantState | null { return this.plantState; }
  getTank(): TankState | null   { return this.tankState;  }

  serialize(): string {
    return JSON.stringify({
      gameState: this.gameState,
      plantState: this.plantState,
      tankState: this.tankState,
    });
  }

  static deserialize(json: string): GameManager {
    const manager = new GameManager();
    try {
      const snap = JSON.parse(json);
      manager.gameState  = snap.gameState;
      manager.plantState = snap.plantState;
      manager.tankState  = snap.tankState;

      // Back-compat: add missing fields for saves created before audit fixes
      if (manager.plantState && manager.plantState.cycleStartDay === undefined) {
        manager.plantState.cycleStartDay = 0;
      }
      if (manager.plantState && manager.plantState.physiology.electricityKwhToday === undefined) {
        (manager.plantState.physiology as any).electricityKwhToday = 0;
      }
      if (manager.tankState && manager.tankState.additivesActive.mycorrhizaeApplied === undefined) {
        (manager.tankState.additivesActive as any).mycorrhizaeApplied  = false;
        (manager.tankState.additivesActive as any).fungicideApplied    = false;
        (manager.tankState.additivesActive as any).fungicideDaysSince  = null;
      }
    } catch (error) {
      throw new Error(`Failed to deserialize game state: ${error}`);
    }
    return manager;
  }

  harvest(): HarvestAssessment {
    if (!this.gameState || !this.plantState || !this.tankState) {
      throw new Error("Game not initialized");
    }
    if (!this.plantState.flowering.floweringInitiated) {
      throw new Error("Plant has not started flowering yet");
    }

    const assessmentEngine = new HarvestAssessmentEngine();
    const assessment = assessmentEngine.calculateHarvestAssessment(
      this.plantState,
      this.tankState
    );

    this.gameState.cycleInformation.harvestDay     = this.gameState.currentGameDay;
    this.gameState.cycleInformation.harvestStatus  = "harvested";
    this.gameState.cycleInformation.finalYieldGrams = assessment.yieldGrams;
    this.gameState.cycleInformation.finalYieldQuality = assessment.yieldQualityTier;

    this.gameState.economics.currentCashAud    += assessment.finalPayment;
    this.gameState.economics.totalRevenueAud   += assessment.finalPayment;
    this.gameState.economics.cumulativeProfitAud =
      this.gameState.economics.currentCashAud - this.gameState.economics.startingBudgetAud;

    return assessment;
  }

  advanceDays(daysToAdvance: number, actions: GameDayActionRequest): GameStateResponse {
    if (!this.gameState || !this.plantState || !this.tankState) {
      throw new Error("Game not initialized");
    }

    for (let i = 0; i < daysToAdvance; i++) {
      const actionsForDay = i === 0
        ? actions
        : { ...actions, additiveApplications: undefined };
      this.executeGameDay(actionsForDay);
    }

    return this.getGameState();
  }

  startNewCycle(newStrainId: string): GameStateResponse {
    if (!this.gameState || !this.plantState || !this.tankState) {
      throw new Error("Game not initialized");
    }

    const newStrain = getStrain(newStrainId);
    const currentDay = this.gameState.currentGameDay;

    this.gameState.cycleInformation.cycleNumber++;
    this.gameState.cycleInformation.selectedStrainId   = newStrainId;
    this.gameState.cycleInformation.selectedStrainName = newStrain.name;
    this.gameState.cycleInformation.seedPurchasedDay   = currentDay;
    this.gameState.cycleInformation.seedCostAud        = newStrain.seedCostAud;
    this.gameState.cycleInformation.germinationDay     = currentDay + 3;
    this.gameState.cycleInformation.seedlingTransplantDay = currentDay + 7;
    this.gameState.cycleInformation.expectedHarvestDay =
      currentDay + 7 + newStrain.floweringTimeDays + 21;
    this.gameState.cycleInformation.harvestStatus   = "growing";
    this.gameState.cycleInformation.harvestDay      = null;
    this.gameState.cycleInformation.finalYieldGrams = null;
    this.gameState.cycleInformation.finalYieldQuality = null;

    this.gameState.economics.currentCashAud -= newStrain.seedCostAud;
    this.gameState.economics.totalSpentAud  += newStrain.seedCostAud;
    this.gameState.economics.spendingBreakdown.seedsAud += newStrain.seedCostAud;

    // Fix #3: cycleStartDay = current game day so stage calc starts from 0
    const plantId = uuidv4();
    this.plantState = this.createInitialPlantState(
      plantId,
      newStrainId,
      currentDay,
      this.gameState.cycleInformation.cycleNumber,
      newStrain
    );

    // Keep the same tank but reset additive state for new cycle
    this.tankState.additivesActive = {
      chitosanMgPerLiter: 0,
      chitosanDaysSinceApplication: null,
      mejaMgPerLiter: 0,
      kelpExtractConcentration: 0,
      mycorrhizaeApplied: false,
      fungicideApplied: false,
      fungicideDaysSince: null,
    };
    this.tankState.alerts   = [];
    this.tankState.warnings = [];

    this.gameState.plantRoster.push({ plantId, status: "growing", strainId: newStrainId });

    this.gameState.notifications.push({
      day: currentDay,
      message: `Started new cycle with ${newStrain.name}. Germination in 3 days.`,
      severity: "info",
    });

    return this.getGameState();
  }
}
