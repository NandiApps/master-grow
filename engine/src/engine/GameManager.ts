/**
 * Game Manager - Orchestrates game lifecycle
 * Handles start, day execution, harvest, state management
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

    // Initialize GameState
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
        expectedHarvestDay: 7 + strain.floweringTimeDays + 21, // Veg + flower + stretch
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
      tankRoster: [{ tankId: uuidv4(), plantId: "", status: "active" }],
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
      notifications: [
        {
          day: 0,
          message: `Started growing ${strain.name}. Germination in 3 days.`,
          severity: "info",
        },
      ],
    };

    // Initialize PlantState
    const plantId = this.gameState.plantRoster[0].plantId;
    this.plantState = {
      plantId,
      gameDay: 0,
      strainId: request.selectedStrainId,
      growCycleNumber: 1,
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

    // Initialize TankState
    const tankId = this.gameState.tankRoster[0].tankId;
    this.plantState.gameDay = 0;
    this.tankState = {
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

    this.gameState.tankRoster[0].plantId = plantId;

    return this.getGameState();
  }

  executeGameDay(actions: GameDayActionRequest): GameStateResponse {
    if (!this.gameState || !this.plantState || !this.tankState) {
      throw new Error("Game not started");
    }

    // Reset growth tracking from previous day (before simulation)
    this.plantState.morphology.heightGrowthTodayMm = 0;
    this.plantState.nutrientUptakeToday = { nMg: 0, pMg: 0, kMg: 0, caMg: 0, mgMg: 0, siMg: 0 };

    // Update environment
    this.tankState.roomEnvironment.lightParUmolPerM2PerS = actions.parUmol;
    this.tankState.roomEnvironment.relativeHumidityPercent = actions.humidityTarget;
    this.tankState.roomEnvironment.airTemperatureCelsius = actions.waterTemperatureTarget;

    // Apply nutrient top-up (base nutrients)
    if (actions.nutrientTopUp?.baseNutrientMl) {
      const ml = actions.nutrientTopUp.baseNutrientMl;
      const costPerMl = 0.05; // $50/L base nutrient concentrate
      const costAud = ml * costPerMl;

      this.gameState.economics.currentCashAud -= costAud;
      this.gameState.economics.totalSpentAud += costAud;
      this.gameState.economics.spendingBreakdown.nutrientsAud += costAud;
      this.gameState.statistics.nutrientDosedTimes++;

      // Raise tank nutrient levels (NPK concentrate)
      const nBoost = (ml * 50) / this.tankState.specifications.volumeLiters;
      const pBoost = (ml * 20) / this.tankState.specifications.volumeLiters;
      const kBoost = (ml * 40) / this.tankState.specifications.volumeLiters;

      this.tankState.macroNutrients.nitrogenNMgPerLiter = Math.min(
        200,
        this.tankState.macroNutrients.nitrogenNMgPerLiter + nBoost
      );
      this.tankState.macroNutrients.phosphorusPMgPerLiter = Math.min(
        80,
        this.tankState.macroNutrients.phosphorusPMgPerLiter + pBoost
      );
      this.tankState.macroNutrients.potassiumKMgPerLiter = Math.min(
        250,
        this.tankState.macroNutrients.potassiumKMgPerLiter + kBoost
      );
    }

    // Apply pH adjustments
    if (actions.nutrientTopUp?.phUpMl) {
      const ml = actions.nutrientTopUp.phUpMl;
      this.tankState.waterChemistry.ph = Math.min(7.0, this.tankState.waterChemistry.ph + ml * 0.1);
      this.gameState.economics.currentCashAud -= ml * 0.02;
      this.gameState.economics.totalSpentAud += ml * 0.02;
    }
    if (actions.nutrientTopUp?.phDownMl) {
      const ml = actions.nutrientTopUp.phDownMl;
      this.tankState.waterChemistry.ph = Math.max(5.0, this.tankState.waterChemistry.ph - ml * 0.1);
      this.gameState.economics.currentCashAud -= ml * 0.02;
      this.gameState.economics.totalSpentAud += ml * 0.02;
    }

    // Apply additives
    if (actions.additiveApplications) {
      for (const app of actions.additiveApplications) {
        const additive = getAdditive(app.additiveId);
        const costAud = (app.doseMl * additive.costPerMl);

        this.gameState.economics.currentCashAud -= costAud;
        this.gameState.economics.totalSpentAud += costAud;
        this.gameState.economics.spendingBreakdown.additivesAud += costAud;
        this.gameState.statistics.additiveApplications++;

        // Tank concentration update
        const concentration = (app.doseMl * 1000) / this.tankState.specifications.volumeLiters;

        if (additive.type === "chitosan") {
          this.tankState.additivesActive.chitosanMgPerLiter = concentration;
          this.tankState.additivesActive.chitosanDaysSinceApplication = 0;
        } else if (additive.type === "silicon") {
          this.tankState.microNutrients.siliconSiMgPerLiter += concentration;
        } else if (additive.type === "kelp") {
          this.tankState.additivesActive.kelpExtractConcentration += concentration;
        } else if (additive.type === "meija") {
          this.tankState.additivesActive.mejaMgPerLiter = concentration;
        }

        this.plantState.additiveHistory.push({
          day: this.plantState.gameDay,
          additiveId: app.additiveId,
          doseMl: app.doseMl,
          concentrationMgPerLiter: concentration,
          effectivenessMultiplier: 1.0,
        });
      }
    }

    // Increment flowering days BEFORE simulation (so stage checks use correct day count)
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
      actions.waterTemperatureTarget
    );

    // Deduct electricity costs (stored in siMg * 100 during simulation)
    const dailyKwhUsed = this.plantState.nutrientUptakeToday.siMg / 100;
    const electricityRate = this.gameState.settings.electricityRateAudPerKwh;
    const dailyCost = dailyKwhUsed * electricityRate;
    this.gameState.economics.currentCashAud -= dailyCost;
    this.gameState.economics.totalSpentAud += dailyCost;
    this.gameState.economics.spendingBreakdown.electricityAud += dailyCost;
    this.gameState.economics.electricityTracking.totalKwhUsed += dailyKwhUsed;
    this.gameState.economics.electricityTracking.totalElectricityCostAud += dailyCost;

    // Update game day
    this.gameState.currentGameDay++;
    this.tankState.gameDay++;
    this.gameState.statistics.totalDaysPlayed++;
    this.gameState.statistics.monitoringActionsPerformed++;

    // Decay chitosan application
    if (this.tankState.additivesActive.chitosanDaysSinceApplication !== null) {
      this.tankState.additivesActive.chitosanDaysSinceApplication++;
      if (this.tankState.additivesActive.chitosanDaysSinceApplication > 10) {
        this.tankState.additivesActive.chitosanMgPerLiter = 0;
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

  getState(): GameState | null {
    return this.gameState;
  }

  getPlant(): PlantState | null {
    return this.plantState;
  }

  getTank(): TankState | null {
    return this.tankState;
  }

  serialize(): string {
    const stateSnapshot = {
      gameState: this.gameState,
      plantState: this.plantState,
      tankState: this.tankState,
    };
    return JSON.stringify(stateSnapshot);
  }

  static deserialize(json: string): GameManager {
    const manager = new GameManager();
    try {
      const stateSnapshot = JSON.parse(json);
      manager.gameState = stateSnapshot.gameState;
      manager.plantState = stateSnapshot.plantState;
      manager.tankState = stateSnapshot.tankState;
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

    // Use HarvestAssessmentEngine to calculate complete assessment
    const assessmentEngine = new HarvestAssessmentEngine();
    const assessment = assessmentEngine.calculateHarvestAssessment(
      this.plantState,
      this.tankState
    );

    // Update game state with harvest results
    this.gameState.cycleInformation.harvestDay = this.gameState.currentGameDay;
    this.gameState.cycleInformation.harvestStatus = "harvested";
    this.gameState.cycleInformation.finalYieldGrams = assessment.yieldGrams;
    this.gameState.cycleInformation.finalYieldQuality = assessment.yieldQualityTier;

    // Apply payment
    this.gameState.economics.currentCashAud += assessment.finalPayment;
    this.gameState.economics.totalRevenueAud += assessment.finalPayment;
    this.gameState.economics.cumulativeProfitAud =
      this.gameState.economics.currentCashAud - this.gameState.economics.startingBudgetAud;

    return assessment;
  }

  /**
   * Advance game by multiple days (Tomorrow, 3 Days, or Week)
   * Locks controls during advancement
   */
  advanceDays(daysToAdvance: number, actions: GameDayActionRequest): GameStateResponse {
    if (!this.gameState || !this.plantState || !this.tankState) {
      throw new Error("Game not initialized");
    }

    // Advance days with provided settings locked in
    for (let i = 0; i < daysToAdvance; i++) {
      this.executeGameDay(actions);
    }

    return this.getGameState();
  }
}
