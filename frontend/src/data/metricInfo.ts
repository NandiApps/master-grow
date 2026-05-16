/**
 * Comprehensive metric information database
 * Sources: Coco for Cannabis, Grow Weed Easy, Lotus Nutrients, general hydroponic research
 */

export interface MetricInfoData {
  name: string;
  unit: string;
  what: string;
  why: string;
  optimal: { min: number; max: number; ideal: number };
  tooLow: string;
  tooHigh: string;
  terpeneImpact: string;
  adjustment: string;
  suggestedAdditives: string[];
}

export const metricInfoDatabase: Record<string, MetricInfoData> = {
  nitrogen: {
    name: 'Nitrogen (N)',
    unit: 'mg/L',
    what: 'Nitrogen is a macronutrient essential for building amino acids, proteins, and chlorophyll.',
    why: 'Nitrogen drives vegetative growth, leaf development, and overall plant structure. It\'s mobile within the plant, moving from older to newer growth.',
    optimal: { min: 160, max: 200, ideal: 180 },
    tooLow: 'Nitrogen deficiency causes yellowing of older leaves first, stunted growth, weak stems, and poor leaf development. The plant cannot produce enough chlorophyll or proteins for growth.',
    tooHigh: 'Excess nitrogen causes excessive vegetative growth, dark green foliage, delayed flowering, reduced resin production, and increased pest susceptibility. The plant becomes too "leafy" at the expense of buds.',
    terpeneImpact: 'Proper nitrogen supports balanced terpene profiles. Excess nitrogen can suppress aromatic compounds, while deficiency reduces overall terpene complexity.',
    adjustment: 'ACTION: Use the 🌱 Nutrient Top-Up control. Add 10-20 mL base nutrient to raise N by ~25-50 mg/L. Expected boost: 10 mL → +25 mg/L, 20 mL → +50 mg/L. Recheck pH after adding nutrients. For flowering, reduce to 50-100 mg/L.',
    suggestedAdditives: ['Base Nutrient (NPK 50:20:40)', 'Bloom Formula (low N for flower)', 'Kelp (natural N source)'],
  },

  phosphorus: {
    name: 'Phosphorus (P)',
    unit: 'mg/L',
    what: 'Phosphorus is a macronutrient critical for energy transfer (ATP), root development, and flower formation.',
    why: 'Phosphorus powers energy production in plants and is essential for strong root systems and flower/fruit development. It\'s immobile, so deficiencies appear on older leaves first.',
    optimal: { min: 30, max: 60, ideal: 45 },
    tooLow: 'Phosphorus deficiency causes purple/red discoloration (especially in cool conditions), weak roots, poor flower development, delayed flowering, and reduced bud density. Growth becomes stunted.',
    tooHigh: 'Excess phosphorus locks up other nutrients (especially zinc and iron), causing nutrient deficiencies. It can reduce potassium availability and interfere with flowering.',
    terpeneImpact: 'Adequate phosphorus enhances floral development and supports terpene synthesis during flowering. Deficiency reduces floral mass and terpene expression.',
    adjustment: 'VEGETATIVE: Use Base Nutrient (10-15 mL → +20-30 mg/L). FLOWERING: Apply 💊 Bloom Formula product. Standard dose: 8 mL per 20L tank raises P by ~24 mg/L. Target 60-90 mg/L during flower. Re-apply every 3 days for sustained P support.',
    suggestedAdditives: ['Bloom Formula (high P for flower)', 'Base Nutrient (NPK 50:20:40 for veg)', 'Chitosan (improved nutrient uptake)'],
  },

  potassium: {
    name: 'Potassium (K)',
    unit: 'mg/L',
    what: 'Potassium is a macronutrient that regulates water movement, photosynthesis, and enzyme activation.',
    why: 'Potassium controls stomatal opening for gas exchange, regulates water uptake, activates enzymes, and strengthens cell walls. It\'s critical for disease resistance and stress tolerance.',
    optimal: { min: 60, max: 175, ideal: 140 },
    tooLow: 'Potassium deficiency causes brown/scorched leaf edges (especially on older leaves), weak stems prone to breaking, poor root development, reduced water uptake, and increased disease susceptibility.',
    tooHigh: 'Excess potassium (>175 mg/L) interferes with calcium and magnesium uptake, causing nutrient lockout. Importantly: excess K dilutes cannabinoid and terpene concentration despite higher overall yield. It reduces potency and aromatic profile quality.',
    terpeneImpact: 'Proper potassium supports strong plant structure and enables plants to invest energy in terpene production. Excess K actually suppresses cannabinoid synthesis relative to biomass. Deficiency reduces aromatic complexity.',
    adjustment: 'VEGETATIVE: Base Nutrient (10-15 mL → +30-40 mg/L). FLOWERING: Apply 💊 Bloom Formula (8 mL raises K by ~32 mg/L). Target 117-175 mg/L in flower. ⚠️ CRITICAL: Do NOT exceed 175 mg/L or quality drops despite higher yield. Maintain K:Ca:Mg ratio.',
    suggestedAdditives: ['Bloom Formula (high K for flower)', 'Base Nutrient (for veg stage)', 'Cal-Mag (maintain Ca:Mg balance)'],
  },

  calcium: {
    name: 'Calcium (Ca)',
    unit: 'mg/L',
    what: 'Calcium is a secondary macronutrient that builds cell walls and regulates nutrient transport.',
    why: 'Calcium is immobile in plants and builds cell wall structure. It\'s essential for proper nutrient uptake and prevents blossom-end rot and tip burn.',
    optimal: { min: 100, max: 160, ideal: 130 },
    tooLow: 'Calcium deficiency causes tip burn on new leaves, distorted growth, weak cell walls, poor nutrient uptake (especially of potassium), and reduced yield.',
    tooHigh: 'Excess calcium blocks magnesium and potassium uptake, causing deficiencies in those nutrients and reducing plant vigor.',
    terpeneImpact: 'Adequate calcium supports healthy tissues needed for terpene synthesis. Deficiency reduces overall plant vigor and terpene expression.',
    adjustment: 'ACTION: Select 💊 Cal-Mag+ Supplement from additives. Standard dose: 10 mL per 20L tank raises Ca by ~25 mg/L. Target 100-160 mg/L. Apply every 7 days. Monitor Ca:Mg ratio (ideal 3:1). Maintain consistently throughout cycle.',
    suggestedAdditives: ['Cal-Mag+ Supplement (raises Ca & Mg)', 'Chitosan (improves nutrient mobility)', 'Bloom Formula (when flowering)'],
  },

  ph: {
    name: 'pH',
    unit: 'pH',
    what: 'pH measures how acidic or alkaline the growing medium is, affecting nutrient availability.',
    why: 'Different nutrients are available to plants only at specific pH ranges. In hydro, pH affects whether nutrients can be absorbed. Cannabis prefers slightly acidic conditions.',
    optimal: { min: 5.5, max: 6.5, ideal: 5.8 },
    tooLow: 'pH below 5.5 (too acidic) causes nutrient toxicity (especially manganese and iron), aluminum toxicity, nutrient lockout, and reduced root health.',
    tooHigh: 'pH above 6.5 (too alkaline) causes nutrient deficiencies (especially iron, manganese, zinc), reduced nutrient availability, and poor nutrient uptake.',
    terpeneImpact: 'Proper pH ensures all nutrients are available for terpene synthesis. pH drift prevents nutrient uptake needed for aromatic development.',
    adjustment: 'ACTION: Use 🧪 pH Up/Down controls in ControlPanel. If pH < 5.8: Use pH Up slider (each mL raises pH by ~0.1, so add 5-8 mL to raise by 0.5). If pH > 5.8: Use pH Down slider. Target 5.8 (ideal). Recheck after 1 day. Maintain 5.5-6.5 range.',
    suggestedAdditives: ['pH Up control (0-50 mL slider)', 'pH Down control (0-50 mL slider)', 'Cal-Mag (buffers pH swings)'],
  },

  ec: {
    name: 'EC (Electrical Conductivity)',
    unit: 'mS/cm',
    what: 'EC measures the total dissolved salts (nutrient concentration) in the water.',
    why: 'EC indicates overall nutrient concentration. Too low means insufficient nutrients; too high causes salt burn and nutrient lockout.',
    optimal: { min: 1.3, max: 1.7, ideal: 1.5 },
    tooLow: 'Low EC (below 1.3) causes nutrient deficiency symptoms, slow growth, pale foliage, and poor development.',
    tooHigh: 'High EC (above 1.7) causes salt burn, leaf tip burn, wilting, nutrient lockout, and reduced root health. Plant cannot absorb water properly.',
    terpeneImpact: 'Optimal EC supports healthy nutrient uptake for balanced terpene profiles. Both excess and deficiency reduce terpene complexity.',
    adjustment: 'ACTION: Use 🌱 Nutrient Top-Up control. If EC too low: add 10-20 mL base nutrient (raises EC ~0.3-0.6 per 20L). If EC too high: water change (dilute). VEGETATIVE target: 1.3-1.7. FLOWERING target: 1.6-2.0. Monitor daily for drift.',
    suggestedAdditives: ['Nutrient Top-Up (Base nutrient concentrate)', 'Bloom Formula (for flowering stage)', 'Chitosan (improves nutrient uptake)'],
  },

  ppm: {
    name: 'PPM (Parts Per Million)',
    unit: 'ppm',
    what: 'PPM is an alternative measure of nutrient concentration, expressing dissolved solids in parts per million.',
    why: 'PPM is useful for tracking nutrient levels. Cannabis typically needs 800-1100 ppm depending on growth stage and plant tolerance.',
    optimal: { min: 800, max: 900, ideal: 850 },
    tooLow: 'Low PPM causes nutrient deficiency, stunted growth, poor coloration, and weak development.',
    tooHigh: 'High PPM (above 1100) causes nutrient lockout, salt burn, wilting, and reduced yield.',
    terpeneImpact: 'Proper PPM supports nutrient availability for terpene synthesis. Imbalances reduce aromatic expression.',
    adjustment: 'Vegetative: 800-900 ppm. Flowering: 800-1100 ppm. Monitor weekly and adjust gradually.',
    suggestedAdditives: ['Nutrient solutions (adjust ppm)', 'Reverse osmosis water (dilute)', 'Chelated trace minerals'],
  },

  waterTemperature: {
    name: 'Water Temperature',
    unit: '°C',
    what: 'Water temperature affects nutrient uptake, dissolved oxygen, and microbial activity in the root zone.',
    why: 'Optimal water temperature ensures good dissolved oxygen levels, fast nutrient uptake, and healthy root health. Too warm causes root rot; too cold reduces uptake.',
    optimal: { min: 18, max: 23, ideal: 21 },
    tooLow: 'Water below 18°C reduces dissolved oxygen, slows nutrient uptake, inhibits root growth, and risks root disease.',
    tooHigh: 'Water above 23°C dramatically reduces dissolved oxygen and triggers root rot pathogens (Pythium and Fusarium thrive above 23°C). Above 23°C you lose 2% plant health per 0.5°C increase, quickly leading to root failure.',
    terpeneImpact: 'Optimal water temperature supports healthy roots needed for nutrient uptake and terpene synthesis.',
    adjustment: 'ACTION: Use 🌊 Water Temperature slider (18-24°C range). If WARM (>23°C): lower to 21-22°C immediately to prevent root rot. Each 0.5°C above 23°C = -2% health/day. If COLD (<18°C): raise to 20-21°C for faster nutrient uptake. Target 18-22°C optimal zone.',
    suggestedAdditives: ['Water Temperature slider (18-24°C)', 'Beneficial bacteria (if warm)', 'Enzyme products (root health)'],
  },

  airTemperature: {
    name: 'Air Temperature',
    unit: '°C',
    what: 'Air temperature affects photosynthesis, transpiration, and overall metabolic rates.',
    why: 'Plants have optimal temperature ranges. Cannabis grows best at 20-26°C. Too cold slows growth; too hot causes heat stress and reduced photosynthesis.',
    optimal: { min: 20, max: 26, ideal: 23 },
    tooLow: 'Temperatures below 20°C slow photosynthesis, reduce growth, increase pest issues, and delay flowering.',
    tooHigh: 'Temperatures above 26°C cause heat stress, reduced photosynthesis, wilting, increased transpiration demand, and potential bud degradation.',
    terpeneImpact: 'Temperature affects terpene volatility. Optimal temps preserve aromatic compounds. Heat causes terpene loss.',
    adjustment: 'Use fans for cooling. Insulate for warmth. Maintain 20-26°C. Consider 3-5°C drop at night for circadian rhythm.',
    suggestedAdditives: ['HVAC cooling/heating', 'Fans (air circulation)', 'Shade cloths (if too hot)'],
  },

  humidity: {
    name: 'Relative Humidity',
    unit: '%',
    what: 'Humidity is the amount of water vapor in the air, affecting transpiration and disease risk.',
    why: 'Optimal humidity supports transpiration for nutrient uptake while preventing fungal/mold diseases. Too high risks disease; too low causes stress.',
    optimal: { min: 40, max: 60, ideal: 50 },
    tooLow: 'Humidity below 40% causes excessive transpiration, water stress, wilting, slow growth, and reduced nutrient uptake.',
    tooHigh: 'Humidity above 60% promotes fungal diseases (botrytis, powdery mildew), root issues, and poor gas exchange.',
    terpeneImpact: 'Proper humidity supports transpiration needed for nutrient transport. Excess humidity increases disease risk and can degrade terpenes.',
    adjustment: 'ACTION: Use 🌪️ Exhaust Fan slider (0-100%). If humidity TOO HIGH (>60%): run fan at 75-100% for 2-3 hrs to dehumidify. Target: VEG 40-60%, FLOWER 40-50%. If too LOW (<40%): reduce fan speed. Fan at 0% = 0 ACH (no circulation), 100% = 10 ACH (strong ventilation).',
    suggestedAdditives: ['Exhaust Fan slider (0-100%)', 'Humidity slider (30-80% air target)', 'Fungicide (if humidity stays >65%)'],
  },

  par: {
    name: 'PAR (Photosynthetically Active Radiation)',
    unit: 'µmol/m²/s',
    what: 'PAR measures the light intensity available for photosynthesis (wavelengths 400-700 nm).',
    why: 'PAR drives photosynthesis. Too little light limits growth; too much can cause photoinhibition and light burn.',
    optimal: { min: 400, max: 1200, ideal: 800 },
    tooLow: 'PAR below 400 causes weak growth, pale foliage, poor bud development, and stretching.',
    tooHigh: 'PAR above 1200 causes light burn (bleaching), photoinhibition, reduced photosynthesis efficiency, and potential bud damage.',
    terpeneImpact: 'Optimal light supports photosynthesis for energy needed to produce terpenes. Light stress reduces aromatic production.',
    adjustment: 'Vegetative: 400-800 µmol. Flowering: 600-1200 µmol. Monitor for light burn. Adjust LED height or intensity.',
    suggestedAdditives: ['LED grow lights (intensity control)', 'Reflective materials (optimize light)', 'Cooling (manage heat from lights)'],
  },

  co2: {
    name: 'CO₂ (Carbon Dioxide)',
    unit: 'ppm',
    what: 'CO₂ is the primary carbon source for photosynthesis and plant growth.',
    why: 'Higher CO₂ increases photosynthesis rate, growing faster and producing more yield. Baseline is ~400 ppm from atmospheric air.',
    optimal: { min: 400, max: 1500, ideal: 1000 },
    tooLow: 'CO₂ below 400 ppm (below atmospheric baseline) restricts photosynthesis and limits growth potential. No growth benefit occurs below 400 ppm.',
    tooHigh: 'CO₂ above 1500 ppm provides diminishing returns and can damage foliage if combined with high heat/light.',
    terpeneImpact: 'Enhanced CO₂ (600+ ppm) increases overall plant biomass and can improve terpene yields through increased photosynthesis.',
    adjustment: 'ACTION: Use 🌫️ CO₂ slider (400-1500 ppm). For yield boost during flower: Raise to 1000-1200 ppm. Requires strong light (>800 µmol) and sealed room. Keep exhaust fan low when enriching. Target 400 (ambient) in veg, 1000+ in bloom. Monitor for heat stress.',
    suggestedAdditives: ['CO₂ slider (400-1500 ppm)', 'Exhaust Fan control (manage CO₂ loss)', 'Light intensity (needed for CO₂ boost)'],
  },

  chlorophyll: {
    name: 'Chlorophyll Content',
    unit: '%',
    what: 'Chlorophyll is the green pigment that captures light energy for photosynthesis.',
    why: 'Higher chlorophyll = more efficient photosynthesis and better growth. Measured as SPAD index or relative percentage.',
    optimal: { min: 40, max: 100, ideal: 75 },
    tooLow: 'Low chlorophyll (below 40) indicates nitrogen deficiency or light stress, reducing photosynthesis and growth.',
    tooHigh: 'Very high chlorophyll (above 100%) is rare and not typically problematic, though extremely dark leaves can reduce light penetration.',
    terpeneImpact: 'Chlorophyll efficiency directly correlates with energy available for terpene synthesis. Higher chlorophyll supports aromatic production.',
    adjustment: 'Increase nitrogen if low. Ensure optimal light, temperature, and humidity. Improve overall plant health.',
    suggestedAdditives: ['Nitrogen supplements', 'Foliar spray (quick chlorophyll boost)', 'Chelated iron (prevents yellowing)'],
  },

  rootMass: {
    name: 'Root Mass',
    unit: 'g (dry weight)',
    what: 'Root mass is the total weight of root tissue (measured as dry weight, water removed).',
    why: 'Larger root systems absorb more water and nutrients, supporting vigorous growth and yield. Strong roots = strong plant.',
    optimal: { min: 1, max: 100, ideal: 50 },
    tooLow: 'Weak roots (below 20g) indicate poor root development from disease, nutrient issues, or water temperature problems.',
    tooHigh: 'Large roots (above 100g) are generally positive but may indicate overcrowded root zone or need for larger container.',
    terpeneImpact: 'Robust roots absorb all necessary nutrients for terpene synthesis. Root problems limit nutrient uptake and reduce terpene expression.',
    adjustment: 'Optimize water temperature (18-24°C), pH, and dissolved oxygen. Use beneficial bacteria. Ensure good drainage.',
    suggestedAdditives: ['Mycorrhizae (beneficial fungi)', 'Root stimulant products', 'Beneficial bacteria', 'Proper aeration'],
  },

  height: {
    name: 'Plant Height',
    unit: 'cm',
    what: 'Plant height is the vertical distance from soil to the top of the plant.',
    why: 'Height indicates growth progress. Proper growth rates suggest healthy conditions. Excessive stretching indicates insufficient light.',
    optimal: { min: 0, max: 200, ideal: 100 },
    tooLow: 'Stunted growth (slow height gain) indicates poor growing conditions, nutrient issues, light stress, or disease.',
    tooHigh: 'Excessive stretching (rapid height gain with few leaves) indicates light insufficiency. Plant is searching for light.',
    terpeneImpact: 'Proper growth supports biomass and bud development. Stress from light/nutrients reduces terpene yield.',
    adjustment: 'Increase light intensity or move light closer. Check nitrogen levels. Ensure proper temperature and humidity.',
    suggestedAdditives: ['Stronger LED lights', 'Growth stimulants', 'Nitrogen (if deficient)'],
  },

  biomass: {
    name: 'Plant Biomass',
    unit: 'g (dry weight)',
    what: 'Biomass is the total dry weight of plant tissue (leaves, stems, roots, buds combined).',
    why: 'Higher biomass indicates healthy overall growth. Final yield is heavily dependent on biomass production during growth.',
    optimal: { min: 0, max: 500, ideal: 300 },
    tooLow: 'Low biomass (slow accumulation) indicates poor growing conditions, insufficient light/nutrients, or disease.',
    tooHigh: 'Large biomass (above 500g) is excellent and indicates strong growing conditions and high potential yield.',
    terpeneImpact: 'More biomass = more bud tissue = more terpenes overall (assuming proper nutrient uptake and conditions).',
    adjustment: 'Optimize all conditions: light, nutrients, temperature, humidity. Ensure strong roots and nutrient uptake.',
    suggestedAdditives: ['Comprehensive nutrient solution', 'Optimal lighting', 'Growth stimulants', 'All supporting additives'],
  },
};

export function getMetricInfo(metricKey: string): MetricInfoData | null {
  return metricInfoDatabase[metricKey] || null;
}
