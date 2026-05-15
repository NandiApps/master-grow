/**
 * HydroGrow Type Definitions
 * Complete type system for the simulator
 */

// ==================== STRAIN DATA ====================

export interface StrainGenetics {
  id: string;
  name: string;
  seedType: "feminized" | "autoflower";
  seedCostAud: number;
  marketPricePerGram: number;
  difficulty: "beginner" | "intermediate";
  thcPercent: number;
  cbdPercent: number;
  floweringTimeDays: number;
  heightMultiplier: number;
  budDensity1To10: number;
  baseYieldGrams: number;
  terpeneProfile: {
    dominant: string;
    limonene: number;
    myrcene: number;
    caryophyllene: number;
    pinene: number;
    humulene: number;
    others: number;
  };
  effectProfile: string;
  responsivityToChitosan: number;
  parToleranceMax: number;
  // Nutrient thresholds (strain-specific optimal ranges)
  nutrientThresholds: {
    // Vegetative stage ranges
    vegetative: {
      npkRatio: "3:1:2";
      ecMin: number; // 1.3
      ecMax: number; // 1.7
      ppmMin: number; // 800
      ppmMax: number; // 900
      nMin: number; // 160
      nMax: number; // 200
      pMin: number; // 30
      pMax: number; // 60
      kMin: number; // 60
      kMax: number; // 117
    };
    // Flowering stage ranges
    flowering: {
      npkRatio: "1:3:2";
      ecMin: number; // 1.6
      ecMax: number; // 2.0
      ppmMin: number; // 800
      ppmMax: number; // 1100
      nMin: number; // 50
      nMax: number; // 100
      pMin: number; // 60
      pMax: number; // 90
      kMin: number; // 117
      kMax: number; // 175
    };
    // Universal thresholds
    ph: { min: number; optimal: number; max: number }; // 5.5 - 5.7 - 6.5
    temperature: { min: number; max: number }; // 20-26
    humidity: { vegetative: { min: number; max: number }; flowering: { min: number; max: number } }; // 40-60 veg, 40-50 flower
  };
}

// ==================== ADDITIVE PRODUCTS ====================

export interface AdditiveProduct {
  id: string;
  name: string;
  type: "silicon" | "kelp" | "chitosan" | "meija";
  costAud: number;
  bottleSizeMl: number;
  costPerMl: number;
  dosagePerTank20L: number;
  applicationFrequencyDays: number;
}

// ==================== PLANT STATE ====================

export interface PlantMorphology {
  heightCm: number;
  heightGrowthTodayMm: number;
  stemDiameterMm: number;
  leafAreaIndex: number;
  nodeCount: number;
  branchCount: number;
}

export interface PlantPhysiology {
  chlorophyllPercent: number;
  chlorophyllChangeTodayPercent: number;
  plantHealthPercent: number;
  plantHealthChangeTodayPercent: number;
  rootMassDryWeightGrams: number;
  rootDevelopmentPercent: number;
  biomassDryWeightGrams: number;
}

export interface GrowthStage {
  stage: "seedling" | "vegetative" | "early_flower" | "late_flower" | "harvest_ready";
  daysInStage: number;
  stageProgressPercent: number;
  nextStage: string | null;
  daysToNextStage: number;
}

export interface LightResponse {
  currentParUmol: number;
  lightScheduleHoursOn: number;
  lightScheduleHoursOff: number;
  photosynthesisRateRelative: number;
  photoinhibitionRiskPercent: number;
  parStressResponseActive: boolean;
}

export interface FloweringState {
  floweringInitiated: boolean;
  floweringStartDay: number | null;
  daysInFlower: number;
  floweringProgressPercent: number;
  expectedHarvestDay: number | null;
  flowerStretchPhase: boolean;
  budDensityScale1To10: number;
}

export interface CannabinoidsState {
  cbdaAccumulationPercent: number;
  thcaAccumulationPercent: number;
  cbnAccumulationPercent: number;
  thcEquivalentPercentIfHarvested: number;
  cbdEquivalentPercentIfHarvested: number;
  totalCannabinoidsPercent: number;
}

export interface TrichomeMaturity {
  clearTrichomesPercent: number;
  cloudyTrichomesPercent: number;
  amberTrichomesPercent: number;
  maturationStartDay: number | null;
  daysTopeakMaturity: number;
  optimalHarvestDayLowPar: number;
  optimalHarvestDayHighPar: number;
}

export interface VisibleSymptoms {
  nitrogenDeficiency: boolean;
  phosphorusDeficiency: boolean;
  potassiumDeficiency: boolean;
  calciumDeficiency: boolean;
  magnesiumDeficiency: boolean;
  powderyMildew: boolean;
  botrytis: boolean;
  nutrientBurn: boolean;
  lightBurn: boolean;
}

export interface StressIndicators {
  heatStressActive: boolean;
  coldStressActive: boolean;
  humidityStressActive: boolean;
  nutrientLockoutActive: boolean;
  photoinhibitionActive: boolean;
  hypoxiaActive: boolean;
  totalStressPercent: number;
  diseasePressureCounters?: {
    pmDaysExposed?: number;
    botrytilsDaysExposed?: number;
  };
}

export interface AdditiveApplication {
  day: number;
  additiveId: string;
  doseMl: number;
  concentrationMgPerLiter: number;
  effectivenessMultiplier: number;
}

export interface NutrientUptakeToday {
  nMg: number;
  pMg: number;
  kMg: number;
  caMg: number;
  mgMg: number;
  siMg: number;
}

export interface PlantState {
  plantId: string;
  gameDay: number;
  strainId: string;
  growCycleNumber: number;

  morphology: PlantMorphology;
  physiology: PlantPhysiology;
  growthStage: GrowthStage;
  lightResponse: LightResponse;
  flowering: FloweringState;
  cannabinoids: CannabinoidsState;
  trichomeMaturity: TrichomeMaturity;
  visibleSymptoms: VisibleSymptoms;
  stressIndicators: StressIndicators;

  additiveHistory: AdditiveApplication[];
  nutrientUptakeToday: NutrientUptakeToday;

  cumulativeYieldEstimateGrams: number;
  yieldModifiers: {
    geneticBase: number;
    healthFactor: number;
    nutrientBalanceFactor: number;
    lightEfficiencyFactor: number;
    stressPenaltyFactor: number;
  };
}

// ==================== TANK/ENVIRONMENT STATE ====================

export interface TankSpecifications {
  tankId: string;
  volumeLiters: number;
  systemType: "dwc" | "nft" | "flood_drain";
  airstoneCount: number;
  heaterWattage: number;
  temperatureControllerActive: boolean;
}

export interface WaterChemistry {
  ph: number;
  phDriftPerDay: number;
  ecMscm: number;
  ppm: number;
  totalDissolvedSolidsPpm: number;
  waterTemperatureCelsius: number;
  dissolvedOxygenMgPerLiter: number;
  waterAgeDays: number;
}

export interface MacroNutrients {
  nitrogenNMgPerLiter: number;
  phosphorusPMgPerLiter: number;
  potassiumKMgPerLiter: number;
  calciumCaMgPerLiter: number;
  magnesiumMgMgPerLiter: number;
  sulfurSMgPerLiter: number;
}

export interface MicroNutrients {
  siliconSiMgPerLiter: number;
  ironFeMgPerLiter: number;
  manganeseMnMgPerLiter: number;
  zincZnMgPerLiter: number;
  boronBMgPerLiter: number;
  molybdenumMoMgPerLiter: number;
}

export interface AdditivesActive {
  chitosanMgPerLiter: number;
  chitosanDaysSinceApplication: number | null;
  mejaMgPerLiter: number;
  kelpExtractConcentration: number;
}

export interface RoomEnvironment {
  airTemperatureCelsius: number;
  airTemperatureMinCelsius: number;
  airTemperatureMaxCelsius: number;
  relativeHumidityPercent: number;
  vaporPressureDeficitKpa: number;
  co2Ppm: number;
  lightParUmolPerM2PerS: number;
  airChangesPerHour: number;
}

export interface MaintenanceLog {
  day: number;
  action: string;
  details: Record<string, any>;
}

export interface TankState {
  tankId: string;
  gameDay: number;

  specifications: TankSpecifications;
  waterChemistry: WaterChemistry;
  macroNutrients: MacroNutrients;
  microNutrients: MicroNutrients;
  additivesActive: AdditivesActive;
  roomEnvironment: RoomEnvironment;

  maintenanceLog: MaintenanceLog[];
  alerts: string[];
  warnings: string[];
}

// ==================== GAME STATE ====================

export interface CycleInformation {
  cycleNumber: number;
  selectedStrainId: string;
  selectedStrainName: string;
  seedPurchasedDay: number;
  seedCostAud: number;
  germinationDay: number;
  seedlingTransplantDay: number;
  expectedHarvestDay: number;
  harvestStatus: "growing" | "harvested" | "failed";
  harvestDay: number | null;
  finalYieldGrams: number | null;
  finalYieldQuality: string | null;
}

export interface Economics {
  startingBudgetAud: number;
  currentCashAud: number;
  totalSpentAud: number;
  totalRevenueAud: number;
  cumulativeProfitAud: number;

  spendingBreakdown: {
    seedsAud: number;
    nutrientsAud: number;
    additivesAud: number;
    electricityAud: number;
  };

  electricityTracking: {
    totalKwhUsed: number;
    ratePerKwhAud: number;
    totalElectricityCostAud: number;
  };
}

export interface PlantRosterItem {
  plantId: string;
  status: "growing" | "harvested" | "dead";
  strainId: string;
}

export interface TankRosterItem {
  tankId: string;
  plantId: string;
  status: "active" | "idle" | "cleaning";
}

export interface GameSettings {
  difficulty: "beginner" | "normal" | "hard";
  electricityRateAudPerKwh: number;
  location: string;
}

export interface GameStatistics {
  totalDaysPlayed: number;
  monitoringActionsPerformed: number;
  additiveApplications: number;
  waterChangesPerformed: number;
  nutrientDosedTimes: number;
  trichomeInspections: number;
}

export interface GameNotification {
  day: number;
  message: string;
  severity: "info" | "warning" | "alert";
}

export interface GameState {
  gameId: string;
  playerName: string;
  gameStartDay: number;
  currentGameDay: number;
  gameStatus: "in_progress" | "completed" | "failed";

  cycleInformation: CycleInformation;
  economics: Economics;

  plantRoster: PlantRosterItem[];
  tankRoster: TankRosterItem[];

  settings: GameSettings;
  statistics: GameStatistics;
  notifications: GameNotification[];
}

// ==================== SIMULATION PARAMETERS ====================

export interface SimulationParameters {
  gameSpeedMultiplier: number;
  dayLengthRealSeconds: number;

  growthRates: {
    vegetativeHeightGrowthCmPerDayBase: number;
    floweringBudFormationRatePercentPerDay: number;
    rootGrowthGramsPerDayBase: number;
    trichomeMaturationRatePercentPerDay: number;
  };

  metabolicRates: {
    nitrogenUptakeMgPerGramBiomass: number;
    phosphorusUptakeMgPerGramBiomass: number;
    potassiumUptakeMgPerGramBiomass: number;
    respirationRatePercentBiomassPerDay: number;
  };

  parEffectiveness: {
    saturationPointUmol: number;
    lightCompensationPointUmol: number;
    photoinhibitionThresholdUmol: number;
    photoinhibitionDamagePerDayPercent: number;
  };

  environmentalTolerances: {
    temperatureDamagebelowCelsius: number;
    temperatureDamageAboveCelsius: number;
    humidityMoldRiskAbovePercent: number;
    humidityStressBelowPercent: number;
  };

  nutrientLockoutThresholds: {
    phTooLow: number;
    phTooHigh: number;
    ecTooLow: number;
    ecTooHigh: number;
  };

  marketDynamics: {
    priceVolatilityPercent: number;
    supplyDemandSensitivity: number;
    baseMarketPricePerGramAud: number;
  };
}

// ==================== API REQUEST/RESPONSE ====================

export interface StartGameRequest {
  playerName: string;
  selectedStrainId: string;
  difficulty: "beginner" | "normal" | "hard";
  electricityRateAudPerKwh: number;
}

export interface GameDayActionRequest {
  parUmol: number;
  lightScheduleHoursOn: number;
  lightScheduleHoursOff: number;
  waterTemperatureTarget: number;
  humidityTarget: number;
  additiveApplications?: Array<{
    additiveId: string;
    doseMl: number;
  }>;
  nutrientTopUp?: {
    baseNutrientMl: number;  // mL of balanced base nutrient (NPK concentrate)
    phUpMl?: number;
    phDownMl?: number;
  };
  maintenanceActions?: string[];
}

export interface HarvestRequest {
  clearTrichomesPercent: number;
  cloudyTrichomesPercent: number;
  amberTrichomesPercent: number;
  harvestChoice: "energetic" | "balanced" | "sedating";
}

export interface GameStateResponse {
  gameState: GameState;
  plant: PlantState;
  tank: TankState;
  timestamp: string;
}
