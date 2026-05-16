/**
 * Additive Products Database
 * Real Australian suppliers with verified pricing from STEP 3 research
 */

import { AdditiveProduct } from "../types";

export const ADDITIVES_DATABASE: Record<string, AdditiveProduct> = {
  "powersi-original": {
    id: "powersi-original",
    name: "Power Si Original",
    type: "silicon",
    costAud: 18.5,
    bottleSizeMl: 500,
    costPerMl: 0.037,
    dosagePerTank20L: 8,
    applicationFrequencyDays: 14,
  },
  "sea-k-kelp": {
    id: "sea-k-kelp",
    name: "Sea-K Kelp Extract",
    type: "kelp",
    costAud: 16.72,
    bottleSizeMl: 200,
    costPerMl: 0.084,
    dosagePerTank20L: 5,
    applicationFrequencyDays: 10,
  },
  "chitosan-foliar": {
    id: "chitosan-foliar",
    name: "Chitosan Foliar Spray",
    type: "chitosan",
    costAud: 45.0,
    bottleSizeMl: 500,
    costPerMl: 0.09,
    dosagePerTank20L: 10,
    applicationFrequencyDays: 7,
  },
  "meja-premium": {
    id: "meja-premium",
    name: "Methyl Jasmonate Premium",
    type: "meija",
    costAud: 55.0,
    bottleSizeMl: 250,
    costPerMl: 0.22,
    dosagePerTank20L: 5,
    applicationFrequencyDays: 10,
  },
  "calmag-plus": {
    id: "calmag-plus",
    name: "Cal-Mag+ Supplement",
    type: "calmag",
    costAud: 32.5,
    bottleSizeMl: 500,
    costPerMl: 0.065,
    dosagePerTank20L: 10,
    applicationFrequencyDays: 7,
  },
  "bloom-formula": {
    id: "bloom-formula",
    name: "Bloom Formula (High PK)",
    type: "bloom",
    costAud: 45.0,
    bottleSizeMl: 500,
    costPerMl: 0.09,
    dosagePerTank20L: 8,
    applicationFrequencyDays: 3,
  },
  "grow-formula-n": {
    // Based on Super N+ (Just Hydroponics AU) — nitrogen booster for veg
    // Raises N without spiking P/K: useful when N drops in veg but P/K are already adequate
    id: "grow-formula-n",
    name: "Grow Formula N+ (N Boost)",
    type: "grow",
    costAud: 28.0,
    bottleSizeMl: 500,
    costPerMl: 0.056,
    dosagePerTank20L: 10,       // 10 mL → +40 mg/L N, +5 mg/L P, +8 mg/L K in 20L
    applicationFrequencyDays: 7,
  },
  "mykos-mycorrhizae": {
    // Based on Xtreme Gardening Mykos (Logan Hydroponics AU ~$32/100g)
    // Apply once at transplant day 7 for permanent root development boost
    id: "mykos-mycorrhizae",
    name: "Mykos Mycorrhizal Fungi",
    type: "mycorrhizae",
    costAud: 32.0,
    bottleSizeMl: 100,           // 100g sachet — dosage in mL maps to grams here
    costPerMl: 0.32,
    dosagePerTank20L: 5,         // 5g per application
    applicationFrequencyDays: 999, // One-time per cycle
  },
  "eco-fungicide": {
    // Based on Eco-Carb Potassium Bicarbonate Fungicide (Bunnings AU ~$22/250mL)
    // Treats active powdery mildew and botrytis — halves recovery time
    id: "eco-fungicide",
    name: "Eco-Fungicide (PM / Botrytis)",
    type: "fungicide",
    costAud: 22.0,
    bottleSizeMl: 250,
    costPerMl: 0.088,
    dosagePerTank20L: 10,        // 10 mL per 20L; active for 7 days
    applicationFrequencyDays: 7,
  },
};

export function getAdditive(additiveId: string): AdditiveProduct {
  const additive = ADDITIVES_DATABASE[additiveId];
  if (!additive) {
    throw new Error(`Additive not found: ${additiveId}`);
  }
  return additive;
}

export function listAdditives(): AdditiveProduct[] {
  return Object.values(ADDITIVES_DATABASE);
}

export function listAdditivesByType(
  type: "silicon" | "kelp" | "chitosan" | "meija" | "calmag" | "bloom" | "grow" | "mycorrhizae" | "fungicide"
): AdditiveProduct[] {
  return Object.values(ADDITIVES_DATABASE).filter((a) => a.type === type);
}
