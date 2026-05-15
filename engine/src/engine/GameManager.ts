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
import { getStrain, listStrains } from "../data/strains";
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

    // Update environment
    this.tankState.roomEnvironment.lightParUmolPerM2PerS = actions.parUmol;
    this.tankState.roomEnvironment.relativeHumidityPercent = actions.humidityTarget;
    this.tankState.roomEnvironment.airTemperatureCelsius = actions.waterTemperatureTarget;

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

    // Run simulation
    this.simulationEngine.updateDay(
      this.plantState,
      this.tankState,
      actions.parUmol,
      actions.lightScheduleHoursOn,
      actions.humidityTarget,
      actions.waterTemperatureTarget
    );

    // Increment flowering days
    if (this.plantState.flowering.floweringInitiated) {
      this.plantState.flowering.daysInFlower++;
      const strain = getStrain(this.plantState.strainId);
      this.plantState.flowering.floweringProgressPercent = Math.min(
        100,
        (this.plantState.flowering.daysInFlower / strain.floweringTimeDays) * 100
      );
    }

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

  harvest(request: HarvestRequest): any {
    if (!this.gameState || !this.plantState || !this.tankState) {
      throw new Error("Game not started");
    }

    const strain = getStrain(this.plantState.strainId);
    
    // Calculate final yield based on trichome quality
    const totalTrichomes =
      request.clearTrichomesPercent +
      request.cloudyTrichomesPercent +
      request.amberTrichomesPercent;

    // Quality multiplier based on trichome profile
    let qualityMultiplier = 1.0;
    let harvestQuality = "standard";

    if (request.cloudyTrichomesPercent > 60 && request.amberTrichomesPercent < 10) {
      qualityMultiplier = 1.2; // Peak potency
      harvestQuality = "premium";
    } else if (request.amberTrichomesPercent > 30) {
      qualityMultiplier = 1.1; // Aged, more sedating
      harvestQuality = "aged";
    }

    // Apply all yield modifiers
    const finalYield = Math.round(
      strain.baseYieldGrams *
        this.plantState.yieldModifiers.geneticBase *
        this.plantState.yieldModifiers.healthFactor *
        this.plantState.yieldModifiers.nutrientBalanceFactor *
        this.plantState.yieldModifiers.lightEfficiencyFactor *
        this.plantState.yieldModifiers.stressPenaltyFactor *
        qualityMultiplier
    );

    const revenue = finalYield * strain.marketPricePerGram;
    const profit = revenue - this.gameState.economics.totalSpentAud;

    // Update state
    this.gameState.cycleInformation.harvestStatus = "harvested";
    this.gameState.cycleInformation.harvestDay = this.gameState.currentGameDay;
    this.gameState.cycleInformation.finalYieldGrams = finalYield;
    this.gameState.cycleInformation.finalYieldQuality = harvestQuality;

    this.gameState.economics.currentCashAud += revenue;
    this.gameState.economics.totalRevenueAud += revenue;
    this.gameState.economics.cumulativeProfitAud = profit;

    this.plantState.cumulativeYieldEstimateGrams = finalYield;
    this.gameState.gameStatus = "completed";

    return {
      finalYieldGrams: finalYield,
      harvestQuality,
      revenue: revenue.toFixed(2),
      profit: profit.toFixed(2),
      trichomeBreakdown: {
        clear: request.clearTrichomesPercent,
        cloudy: request.cloudyTrichomesPercent,
        amber: request.amberTrichomesPercent,
      },
    };
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
}
