/**
 * HarvestAssessmentEngine - Calculates yield, quality, and payments at harvest time
 * Implements realistic cannabinoid progression, trichome maturity assessment, and market pricing
 */

import { PlantState, TankState, HarvestAssessment } from "../types";
import { getStrain } from "../data/strains";

export class HarvestAssessmentEngine {
  /**
   * Calculate complete harvest assessment including yield, quality, and payment
   */
  calculateHarvestAssessment(
    plant: PlantState,
    tank: TankState
  ): HarvestAssessment {
    const strain = getStrain(plant.strainId);
    const daysInFlower = plant.flowering.daysInFlower;

    // 1. Calculate actual yield based on growth progression
    const yieldGrams = this.calculateYieldGrams(
      plant,
      strain,
      daysInFlower
    );

    // 2. Calculate quality score based on trichome maturity & cannabinoid profile
    const qualityScore = this.calculateQualityScore(
      plant,
      strain,
      daysInFlower
    );
    const qualityTier = this.getQualityTier(qualityScore);
    const qualityMultiplier = this.getQualityMultiplier(qualityScore);

    // 3. Calculate penalties for deficiencies and disease
    const deficiencyPenalties = this.calculateDeficiencyPenalties(tank);
    const diseasePenalties = this.calculateDiseasePenalties(plant);

    // 4. Calculate revenue
    const baseRevenue = yieldGrams * strain.yieldProfile.priceAudPerGram;
    const qualityAdjustedRevenue = baseRevenue * qualityMultiplier;
    const finalPayment = qualityAdjustedRevenue - deficiencyPenalties - diseasePenalties;

    // 5. Calculate what optimal harvest would have achieved
    const optimalHarvest = this.calculateOptimalHarvestScenario(
      plant,
      strain,
      daysInFlower
    );

    // 6. Generate advice
    const advice = this.generateAdvice(
      plant,
      strain,
      tank,
      daysInFlower,
      qualityScore
    );

    return {
      yieldGrams,
      yieldQualityTier: qualityTier,
      yieldQualityScore: qualityScore,
      cannabinoidPercent: plant.cannabinoids.thcaAccumulationPercent,
      trichomeProfile: {
        clearPercent: plant.trichomeMaturity.clearTrichomesPercent,
        cloudyPercent: plant.trichomeMaturity.cloudyTrichomesPercent,
        amberPercent: plant.trichomeMaturity.amberTrichomesPercent,
      },
      deficiencyPenalties,
      diseasePenalties,
      qualityMultiplier,
      harvestDaysPostPeak: plant.yieldTracking.daysSincePeak,
      postPeakQualityLoss: plant.yieldTracking.qualityLossPercent,
      baseRevenue,
      qualityAdjustedRevenue,
      finalPayment: Math.max(0, finalPayment),
      advice,
      optimalHarvestWould: optimalHarvest,
    };
  }

  /**
   * Calculate yield in grams based on strain profile and growth progression
   */
  private calculateYieldGrams(
    plant: PlantState,
    strain: any,
    daysInFlower: number
  ): number {
    const floweringDays = strain.floweringTimeDays;
    const maxYield = strain.yieldProfile.yieldGramsTypical;

    // Map day of flower to progression percentage
    let progressionPercent = this.getYieldProgression(
      daysInFlower,
      floweringDays,
      strain.yieldProfile
    );

    // Apply health factor
    const healthFactor = Math.max(0.3, plant.physiology.plantHealthPercent / 100);

    // Apply nutrient balance factor
    const nutrientFactor = plant.yieldModifiers.nutrientBalanceFactor;

    // Apply light efficiency factor
    const lightFactor = plant.yieldModifiers.lightEfficiencyFactor;

    // Calculate final yield
    let yieldAmount = maxYield * (progressionPercent / 100) * healthFactor * nutrientFactor * lightFactor;

    // Post-peak degradation: if beyond flowering days, reduce yield
    if (daysInFlower > floweringDays) {
      const daysOverdue = daysInFlower - floweringDays;
      const degradationRate = strain.yieldProfile.degradationPercentPerDay;
      const qualityLoss = 1 - (degradationRate / 100) ** daysOverdue;
      yieldAmount *= Math.max(0.5, qualityLoss); // Never drop below 50% from degradation
    }

    return Math.round(yieldAmount * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get yield progression percentage based on flowering stage
   */
  private getYieldProgression(
    daysInFlower: number,
    floweringDays: number,
    yieldProfile: any
  ): number {
    if (daysInFlower <= 0) return 0;

    const week = Math.ceil(daysInFlower / 7);

    // Map weeks to progression percentages from strain profile
    if (daysInFlower <= 7) {
      return yieldProfile.yieldProgressionWeek5Percent * 0.5; // Weeks 1-2 are slow
    } else if (daysInFlower <= 14) {
      return yieldProfile.yieldProgressionWeek5Percent * 0.7; // Weeks 3-4
    } else if (daysInFlower <= 21) {
      return yieldProfile.yieldProgressionWeek5Percent; // Week 5
    } else if (daysInFlower <= 28) {
      return yieldProfile.yieldProgressionWeek6Percent; // Week 6
    } else if (daysInFlower <= 35) {
      return yieldProfile.yieldProgressionWeek7Percent; // Week 7
    } else {
      return yieldProfile.yieldProgressionWeek8Percent; // Week 8+
    }
  }

  /**
   * Calculate quality score (0-100) based on trichome maturity and cannabinoid profile
   */
  private calculateQualityScore(
    plant: PlantState,
    strain: any,
    daysInFlower: number
  ): number {
    const trichomeProfile = plant.trichomeMaturity;
    const cannabinoidPercent = plant.cannabinoids.thcaAccumulationPercent;
    const strainPeakProfile = strain.yieldProfile;

    // 1. Trichome quality score (0-100)
    const trichomeScore = this.calculateTrichomeQualityScore(
      trichomeProfile.clearTrichomesPercent,
      trichomeProfile.cloudyTrichomesPercent,
      trichomeProfile.amberTrichomesPercent,
      strainPeakProfile.trichomePeakClearPercent,
      strainPeakProfile.trichomePeakCloudyPercent,
      strainPeakProfile.trichomePeakAmberPercent
    );

    // 2. Cannabinoid quality score (0-100)
    const cannabinoidScore = this.calculateCannabinoidsQualityScore(
      cannabinoidPercent,
      strain.yieldProfile.thcRangeMin,
      strain.yieldProfile.thcRangeMax
    );

    // 3. Health/appearance score (0-100)
    const healthScore = plant.physiology.plantHealthPercent;

    // 4. Disease penalty
    let diseasePenalty = 0;
    if (plant.visibleSymptoms.botrytis || plant.visibleSymptoms.powderyMildew) {
      diseasePenalty = 20; // -20 points for disease
    }

    // 5. Nutrient deficiency penalty
    let deficiencyPenalty = 0;
    if (plant.visibleSymptoms.nitrogenDeficiency) deficiencyPenalty += 5;
    if (plant.visibleSymptoms.phosphorusDeficiency) deficiencyPenalty += 3;
    if (plant.visibleSymptoms.potassiumDeficiency) deficiencyPenalty += 5;
    if (plant.visibleSymptoms.calciumDeficiency) deficiencyPenalty += 3;
    if (plant.visibleSymptoms.magnesiumDeficiency) deficiencyPenalty += 2;

    // Weighted average: 40% trichome, 30% cannabinoid, 20% health, minus penalties
    const baseScore =
      trichomeScore * 0.4 + cannabinoidScore * 0.3 + healthScore * 0.2;

    const finalScore = Math.max(0, Math.min(100, baseScore - diseasePenalty - deficiencyPenalty));

    return Math.round(finalScore);
  }

  /**
   * Score trichome maturity against strain's peak profile
   */
  private calculateTrichomeQualityScore(
    clearPercent: number,
    cloudyPercent: number,
    amberPercent: number,
    peakClear: number,
    peakCloudy: number,
    peakAmber: number
  ): number {
    // Perfect score if within ±5% of peak profile
    const clearDiff = Math.abs(clearPercent - peakClear);
    const cloudyDiff = Math.abs(cloudyPercent - peakCloudy);
    const amberDiff = Math.abs(amberPercent - peakAmber);

    const totalDiff = (clearDiff + cloudyDiff + amberDiff) / 3;

    // Convert diff to score: 0 diff = 100, 20 diff = 0
    return Math.max(0, 100 - totalDiff * 5);
  }

  /**
   * Score cannabinoid percentage against strain's range
   */
  private calculateCannabinoidsQualityScore(
    thcPercent: number,
    minThc: number,
    maxThc: number
  ): number {
    if (thcPercent < minThc) {
      // Under-developed: linear penalty
      return Math.max(0, (thcPercent / minThc) * 70);
    } else if (thcPercent <= maxThc) {
      // Within range: score based on position
      const progress = (thcPercent - minThc) / (maxThc - minThc);
      return 70 + progress * 30; // 70-100 within range
    } else {
      // Over-matured: slight penalty
      return Math.max(0, 100 - (thcPercent - maxThc) * 5);
    }
  }

  /**
   * Map quality score to letter tier
   */
  private getQualityTier(score: number): "S" | "A" | "B" | "C" {
    if (score >= 90) return "S";
    if (score >= 75) return "A";
    if (score >= 60) return "B";
    return "C";
  }

  /**
   * Calculate quality multiplier for payment (0.4x to 1.3x)
   */
  private getQualityMultiplier(score: number): number {
    if (score >= 90) return 1.3; // S tier = +30%
    if (score >= 75) return 1.1; // A tier = +10%
    if (score >= 60) return 1.0; // B tier = base
    if (score >= 40) return 0.8; // C tier = -20%
    return 0.4; // F tier = -60%
  }

  /**
   * Calculate penalty for nutrient deficiencies
   */
  private calculateDeficiencyPenalties(tank: TankState): number {
    let penalty = 0;

    // Each deficiency costs money based on severity
    const n = tank.macroNutrients.nitrogenNMgPerLiter;
    const p = tank.macroNutrients.phosphorusPMgPerLiter;
    const k = tank.macroNutrients.potassiumKMgPerLiter;

    if (n < 80) penalty += 15; // Nitrogen deficiency
    if (p < 30) penalty += 10; // Phosphorus deficiency
    if (k < 100) penalty += 15; // Potassium deficiency
    if (tank.macroNutrients.calciumCaMgPerLiter < 120) penalty += 8;
    if (tank.macroNutrients.magnesiumMgMgPerLiter < 40) penalty += 8;

    return penalty;
  }

  /**
   * Calculate penalty for disease
   */
  private calculateDiseasePenalties(plant: PlantState): number {
    let penalty = 0;

    if (plant.visibleSymptoms.botrytis) {
      penalty += 25; // Botrytis ruins quality
    }
    if (plant.visibleSymptoms.powderyMildew) {
      penalty += 15; // Powdery mildew reduces value
    }

    return penalty;
  }

  /**
   * Calculate what optimal harvest would have achieved
   */
  private calculateOptimalHarvestScenario(
    plant: PlantState,
    strain: any,
    daysInFlower: number
  ): { yieldGrams: number; qualityScore: number; revenue: number } {
    // Optimal would be at peak flowering without degradation
    const optimalYield = strain.yieldProfile.yieldGramsTypical * 0.95; // 95% of theoretical max

    // Perfect trichome profile = 95 quality score
    const optimalQuality = 95;
    const optimalMultiplier = 1.15; // Small bonus for perfect conditions

    const optimalRevenue =
      optimalYield * strain.yieldProfile.priceAudPerGram * optimalMultiplier;

    return {
      yieldGrams: optimalYield,
      qualityScore: optimalQuality,
      revenue: optimalRevenue,
    };
  }

  /**
   * Generate personalized advice for the player
   */
  private generateAdvice(
    plant: PlantState,
    strain: any,
    tank: TankState,
    daysInFlower: number,
    qualityScore: number
  ): { whatWentWell: string[]; whatToImprove: string[]; nextGrowSuggestions: string[] } {
    const whatWentWell: string[] = [];
    const whatToImprove: string[] = [];
    const nextGrowSuggestions: string[] = [];

    // Analyze what went well
    if (plant.physiology.plantHealthPercent > 80) {
      whatWentWell.push("Excellent plant health throughout grow");
    }
    if (tank.waterChemistry.ph >= 5.5 && tank.waterChemistry.ph <= 6.5) {
      whatWentWell.push("pH management was spot on");
    }
    if (plant.trichomeMaturity.cloudyTrichomesPercent >= 70) {
      whatWentWell.push("Trichome development reached optimal cloudiness");
    }

    // Analyze what to improve
    if (plant.visibleSymptoms.nitrogenDeficiency) {
      whatToImprove.push("Nitrogen deficiency detected - increase N during vegetative stage next time");
    }
    if (plant.visibleSymptoms.phosphorusDeficiency) {
      whatToImprove.push("Phosphorus was low - increase P dosing in flowering");
    }
    if (tank.roomEnvironment.relativeHumidityPercent > 65) {
      whatToImprove.push("High humidity increased mold risk - target 40-50% during flowering");
    }
    if (plant.yieldTracking.daysSincePeak > 3) {
      whatToImprove.push(`Harvested ${plant.yieldTracking.daysSincePeak} days past peak - harvest earlier next time`);
    }

    // Next grow suggestions
    if (qualityScore < 75) {
      nextGrowSuggestions.push("Target better nutrient balance next grow - consider strain-specific feeding guides");
    }
    if (daysInFlower < strain.floweringTimeDays - 10) {
      nextGrowSuggestions.push("Next grow: give plants full flowering time to reach potential");
    }
    if (plant.yieldTracking.currentEstimateGrams < strain.yieldProfile.yieldGramsTypical * 0.8) {
      nextGrowSuggestions.push("Yield was below potential - check light intensity and nutrient uptake");
    }

    return {
      whatWentWell: whatWentWell.length > 0 ? whatWentWell : ["Grow completed successfully"],
      whatToImprove: whatToImprove.length > 0 ? whatToImprove : ["No major issues detected"],
      nextGrowSuggestions:
        nextGrowSuggestions.length > 0
          ? nextGrowSuggestions
          : ["Continue current approach - very solid grow"],
    };
  }
}
