/**
 * Frontend type definitions (mirrors backend types)
 */

export interface StartGameRequest {
  playerName: string;
  selectedStrainId: string;
  difficulty: 'beginner' | 'normal' | 'hard';
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
  maintenanceActions?: string[];
}

export interface HarvestRequest {
  clearTrichomesPercent: number;
  cloudyTrichomesPercent: number;
  amberTrichomesPercent: number;
  harvestChoice: 'energetic' | 'balanced' | 'sedating';
}

export interface GameStateResponse {
  gameState: GameState;
  plant: PlantState;
  tank: TankState;
  timestamp: string;
}

export interface GameState {
  gameId: string;
  playerName: string;
  currentGameDay: number;
  gameStatus: 'in_progress' | 'completed' | 'failed';
  cycleInformation: CycleInformation;
  economics: Economics;
  statistics: GameStatistics;
  notifications: GameNotification[];
}

export interface CycleInformation {
  cycleNumber: number;
  selectedStrainId: string;
  selectedStrainName: string;
  expectedHarvestDay: number;
  harvestStatus: 'growing' | 'harvested' | 'failed';
  finalYieldGrams: number | null;
  finalYieldQuality: string | null;
}

export interface Economics {
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
}

export interface GameStatistics {
  totalDaysPlayed: number;
  additiveApplications: number;
  waterChangesPerformed: number;
}

export interface GameNotification {
  day: number;
  message: string;
  severity: 'info' | 'warning' | 'alert';
}

export interface PlantState {
  plantId: string;
  gameDay: number;
  strainId: string;
  morphology: {
    heightCm: number;
    heightGrowthTodayMm: number;
    stemDiameterMm: number;
  };
  physiology: {
    chlorophyllPercent: number;
    plantHealthPercent: number;
    rootMassDryWeightGrams: number;
    biomassDryWeightGrams: number;
  };
  growthStage: {
    stage: 'seedling' | 'vegetative' | 'early_flower' | 'late_flower' | 'harvest_ready';
    daysInStage: number;
    stageProgressPercent: number;
  };
  lightResponse: {
    currentParUmol: number;
    lightScheduleHoursOn: number;
    photosynthesisRateRelative: number;
    photoinhibitionRiskPercent: number;
  };
  flowering: {
    floweringInitiated: boolean;
    daysInFlower: number;
    floweringProgressPercent: number;
    budDensityScale1To10: number;
  };
  cannabinoids: {
    thcaAccumulationPercent: number;
    cbdaAccumulationPercent: number;
    cbnAccumulationPercent: number;
    thcEquivalentPercentIfHarvested: number;
  };
  trichomeMaturity: {
    clearTrichomesPercent: number;
    cloudyTrichomesPercent: number;
    amberTrichomesPercent: number;
  };
  visibleSymptoms: {
    nitrogenDeficiency: boolean;
    phosphorusDeficiency: boolean;
    potassiumDeficiency: boolean;
    powderyMildew: boolean;
    botrytis: boolean;
    lightBurn: boolean;
  };
  stressIndicators: {
    heatStressActive: boolean;
    coldStressActive: boolean;
    nutrientLockoutActive: boolean;
    photoinhibitionActive: boolean;
    totalStressPercent: number;
  };
}

export interface TankState {
  tankId: string;
  gameDay: number;
  waterChemistry: {
    ph: number;
    ecMscm: number;
    ppm: number;
    totalDissolvedSolidsPpm: number;
    waterTemperatureCelsius: number;
    dissolvedOxygenMgPerLiter: number;
  };
  macroNutrients: {
    nitrogenNMgPerLiter: number;
    phosphorusPMgPerLiter: number;
    potassiumKMgPerLiter: number;
    calciumCaMgPerLiter: number;
    magnesiumMgMgPerLiter: number;
  };
  roomEnvironment: {
    airTemperatureCelsius: number;
    relativeHumidityPercent: number;
    co2Ppm: number;
    lightParUmolPerM2PerS: number;
    airChangesPerHour: number;
  };
  alerts: string[];
  warnings: string[];
}

export interface StrainGenetics {
  id: string;
  name: string;
  seedType: 'feminized' | 'autoflower';
  seedCostAud: number;
  marketPricePerGram: number;
  difficulty: 'beginner' | 'intermediate';
  thcPercent: number;
  cbdPercent: number;
  floweringTimeDays: number;
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
  responsivityToChitosan: number;
  parToleranceMax: number;
}

export interface AdditiveProduct {
  id: string;
  name: string;
  type: 'silicon' | 'kelp' | 'chitosan' | 'meija';
  costAud: number;
  dosagePerTank20L: number;
  applicationFrequencyDays: number;
}
