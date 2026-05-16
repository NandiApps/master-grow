import { GameStateResponse } from '../types';
import { MetricCard } from './MetricCard';
import { HealthBar } from './HealthBar';
import { NutrientPieChart } from './NutrientPieChart';
import { EnvironmentRings } from './EnvironmentRings';
import '../styles/DashboardPanel.css';

interface Props {
  state: GameStateResponse;
}

export function DashboardPanel({ state }: Props) {
  const plant     = state.plant;
  const tank      = state.tank;
  const gameState = state.gameState;

  const isFlowering = plant.flowering.floweringInitiated;
  const stage       = plant.growthStage.stage;
  const thresholds  = (gameState as any).selectedStrain?.nutrientThresholds;

  // Stage-aware nutrient thresholds (same logic as before, now also drives optimalOverride)
  const getThresholds = () => {
    if (thresholds) {
      return isFlowering ? thresholds.flowering : thresholds.vegetative;
    }
    return isFlowering
      ? { ecMin: 1.6, ecMax: 2.0, ppmMin: 800, ppmMax: 1100, nMin: 50,  nMax: 100, pMin: 60, pMax: 90, kMin: 117, kMax: 175 }
      : { ecMin: 1.3, ecMax: 1.7, ppmMin: 800, ppmMax: 900,  nMin: 160, nMax: 200, pMin: 30, pMax: 60, kMin: 60,  kMax: 117 };
  };

  const thr          = getThresholds();
  const phThresholds = thresholds?.ph || { min: 5.5, optimal: 5.7, max: 6.5 };
  const tempThresholds = thresholds?.temperature || { min: 20, max: 26 };
  const humThresholds  = isFlowering
    ? (thresholds?.humidity?.flowering || { min: 40, max: 50 })
    : (thresholds?.humidity?.vegetative || { min: 40, max: 60 });

  // Stage label for the banner
  const stageLabel: Record<string, string> = {
    seedling:      '🌱 SEEDLING',
    vegetative:    '🍃 VEGETATIVE',
    early_flower:  '🌸 EARLY FLOWER',
    late_flower:   '🌺 LATE FLOWER',
    harvest_ready: '🌾 HARVEST READY',
  };

  // Stage-specific nutrient guidance for the banner
  const stageNutrientGuide: Record<string, string> = {
    seedling:      'Keep all nutrients low — pH 5.8–6.2, EC 0.8–1.2. Plant is establishing roots.',
    vegetative:    'Target N 160–200 mg/L, P 30–60, K 60–117. Switch to 12h light to trigger flowering.',
    early_flower:  '⬇️ Reduce N to 50–100 mg/L. ⬆️ Boost P (60–90) and K (117–175) with Bloom Formula.',
    late_flower:   'Maintain P 60–90, K 117–175. Lower N further (<80). Monitor trichomes daily.',
    harvest_ready: '🔬 Inspect trichomes — harvest when 70%+ cloudy. Flush 3–5 days before cutting.',
  };

  const getStatus = (value: number, min: number, max: number) => ({
    isCritical: value < min || value > max,
    isWarning:  (value < min * 1.1 && value >= min) || (value <= max && value > max * 0.9),
  });

  // Active additive indicators
  const chitosanDays = tank.additivesActive.chitosanDaysSinceApplication;
  const chitosanActive = chitosanDays !== null && chitosanDays <= 10;
  const fungicideActive = tank.additivesActive.fungicideApplied;
  const mycorrhizaeApplied = tank.additivesActive.mycorrhizaeApplied;

  // Stage progress
  const progressPct = plant.growthStage.stageProgressPercent;
  const daysToNext  = plant.growthStage.daysToNextStage;

  return (
    <div className="dashboard-panel">

      {/* Stage Banner — Fix #22 + Polish #20 */}
      <div className="dashboard-section stage-banner" style={{
        background: 'rgba(100,200,100,0.08)',
        border: '1px solid rgba(100,200,100,0.25)',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '0.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
            {stageLabel[stage] ?? stage.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
            Day {plant.growthStage.daysInStage} / {daysToNext > 0 ? `${daysToNext}d to next` : 'stage complete'}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '6px', marginBottom: '0.5rem' }}>
          <div style={{
            background: stage === 'harvest_ready' ? '#f5a623' : '#4caf50',
            width: `${progressPct}%`,
            height: '100%',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <p style={{ fontSize: '0.75rem', color: '#bbb', margin: 0 }}>
          {stageNutrientGuide[stage] ?? ''}
        </p>
      </div>

      {/* Health Overview */}
      <div className="dashboard-section">
        <HealthBar
          healthPercent={plant.physiology.plantHealthPercent}
          healthChange={plant.physiology.plantHealthChangeTodayPercent}
          isCritical={plant.physiology.plantHealthPercent < 30}
        />
      </div>

      {/* Active Additives Status — Fix #19 */}
      {(chitosanActive || fungicideActive || mycorrhizaeApplied) && (
        <div className="dashboard-section" style={{ fontSize: '0.75rem', color: '#8bc34a', padding: '0.4rem 0' }}>
          {chitosanActive   && <span style={{ marginRight: '0.75rem' }}>🧬 Chitosan active: Day {chitosanDays}/10</span>}
          {fungicideActive  && <span style={{ marginRight: '0.75rem' }}>🛡️ Fungicide active: Day {tank.additivesActive.fungicideDaysSince}/7</span>}
          {mycorrhizaeApplied && <span>🍄 Mycorrhizae: Root boost active</span>}
        </div>
      )}

      {/* Water Chemistry */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">💧 Water Chemistry</h3>
        <div className="metrics-grid">
          <MetricCard
            label="pH"
            value={tank.waterChemistry.ph}
            unit=""
            min={phThresholds.min}
            max={phThresholds.max}
            optimal={phThresholds.optimal}
            {...getStatus(tank.waterChemistry.ph, phThresholds.min, phThresholds.max)}
            icon="🧪"
            metricKey="ph"
          />
          <MetricCard
            label="EC (Conductivity)"
            value={tank.waterChemistry.ecMscm}
            unit=" mS/cm"
            min={thr.ecMin}
            max={thr.ecMax}
            optimalOverride={{ min: thr.ecMin, max: thr.ecMax, ideal: (thr.ecMin + thr.ecMax) / 2 }}
            {...getStatus(tank.waterChemistry.ecMscm, thr.ecMin, thr.ecMax)}
            icon="⚡"
            metricKey="ec"
          />
          <MetricCard
            label="PPM"
            value={tank.waterChemistry.ppm}
            unit=""
            min={thr.ppmMin}
            max={thr.ppmMax}
            optimalOverride={{ min: thr.ppmMin, max: thr.ppmMax, ideal: (thr.ppmMin + thr.ppmMax) / 2 }}
            {...getStatus(tank.waterChemistry.ppm, thr.ppmMin, thr.ppmMax)}
            icon="📊"
            metricKey="ppm"
          />
          <MetricCard
            label="Water Temp"
            value={tank.waterChemistry.waterTemperatureCelsius}
            unit="°C"
            min={18}
            max={24}
            {...getStatus(tank.waterChemistry.waterTemperatureCelsius, 18, 24)}
            icon="🌡️"
            metricKey="waterTemperature"
          />
        </div>
        {/* Fix #21: pH drift indicator */}
        {tank.waterChemistry.phDriftPerDay > 0.03 && (
          <p style={{ fontSize: '11px', color: '#f5a623', margin: '0.4rem 0 0', padding: '0 0.2rem' }}>
            ⚠️ pH drifting −{tank.waterChemistry.phDriftPerDay.toFixed(3)}/day — use pH Up to compensate daily
          </p>
        )}
      </div>

      {/* Macronutrients */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">🧂 Macronutrients (mg/L)</h3>
        <div className="metrics-grid">
          <MetricCard
            label="Nitrogen (N)"
            value={tank.macroNutrients.nitrogenNMgPerLiter}
            unit=""
            min={thr.nMin}
            max={thr.nMax}
            optimalOverride={{ min: thr.nMin, max: thr.nMax, ideal: (thr.nMin + thr.nMax) / 2 }}
            {...getStatus(tank.macroNutrients.nitrogenNMgPerLiter, thr.nMin, thr.nMax)}
            icon="N"
            metricKey="nitrogen"
          />
          <MetricCard
            label="Phosphorus (P)"
            value={tank.macroNutrients.phosphorusPMgPerLiter}
            unit=""
            min={thr.pMin}
            max={thr.pMax}
            optimalOverride={{ min: thr.pMin, max: thr.pMax, ideal: (thr.pMin + thr.pMax) / 2 }}
            {...getStatus(tank.macroNutrients.phosphorusPMgPerLiter, thr.pMin, thr.pMax)}
            icon="P"
            metricKey="phosphorus"
          />
          <MetricCard
            label="Potassium (K)"
            value={tank.macroNutrients.potassiumKMgPerLiter}
            unit=""
            min={thr.kMin}
            max={thr.kMax}
            optimalOverride={{ min: thr.kMin, max: thr.kMax, ideal: (thr.kMin + thr.kMax) / 2 }}
            {...getStatus(tank.macroNutrients.potassiumKMgPerLiter, thr.kMin, thr.kMax)}
            icon="K"
            metricKey="potassium"
          />
          <MetricCard
            label="Calcium (Ca)"
            value={tank.macroNutrients.calciumCaMgPerLiter}
            unit=""
            min={100}
            max={160}
            {...getStatus(tank.macroNutrients.calciumCaMgPerLiter, 100, 160)}
            icon="🥛"
            metricKey="calcium"
          />
          {/* Fix #17: Magnesium MetricCard was missing */}
          <MetricCard
            label="Magnesium (Mg)"
            value={tank.macroNutrients.magnesiumMgMgPerLiter}
            unit=""
            min={40}
            max={80}
            {...getStatus(tank.macroNutrients.magnesiumMgMgPerLiter, 40, 80)}
            icon="🔋"
            metricKey="magnesium"
          />
        </div>
      </div>

      {/* Environment */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">🌍 Environment</h3>
        <div className="metrics-grid">
          <MetricCard
            label="Air Temp"
            value={tank.roomEnvironment.airTemperatureCelsius}
            unit="°C"
            min={tempThresholds.min}
            max={tempThresholds.max}
            {...getStatus(tank.roomEnvironment.airTemperatureCelsius, tempThresholds.min, tempThresholds.max)}
            icon="🌡️"
            metricKey="airTemperature"
          />
          <MetricCard
            label="Humidity"
            value={tank.roomEnvironment.relativeHumidityPercent}
            unit="%"
            min={humThresholds.min}
            max={humThresholds.max}
            {...getStatus(tank.roomEnvironment.relativeHumidityPercent, humThresholds.min, humThresholds.max)}
            icon="💨"
            metricKey="humidity"
          />
          <MetricCard
            label="PAR"
            value={tank.roomEnvironment.lightParUmolPerM2PerS}
            unit=" µmol/m²/s"
            min={400}
            max={1200}
            {...getStatus(tank.roomEnvironment.lightParUmolPerM2PerS, 400, 1200)}
            icon="☀️"
            metricKey="par"
          />
          <MetricCard
            label="CO₂"
            value={tank.roomEnvironment.co2Ppm}
            unit=" ppm"
            min={400}
            max={1500}
            {...getStatus(tank.roomEnvironment.co2Ppm, 400, 1500)}
            icon="🔬"
            metricKey="co2"
          />
          {/* VPD MetricCard — new metric combining temp + humidity */}
          <MetricCard
            label="VPD"
            value={tank.roomEnvironment.vaporPressureDeficitKpa}
            unit=" kPa"
            min={0.4}
            max={2.0}
            optimalOverride={
              isFlowering
                ? { min: 1.0, max: 1.5, ideal: 1.2 }
                : { min: 0.8, max: 1.2, ideal: 1.0 }
            }
            {...getStatus(
              tank.roomEnvironment.vaporPressureDeficitKpa,
              isFlowering ? 1.0 : 0.8,
              isFlowering ? 1.5 : 1.2
            )}
            icon="💧"
            metricKey="vpd"
          />
        </div>
      </div>

      {/* Plant Physiology */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">🌱 Plant Physiology</h3>
        <div className="metrics-grid">
          <MetricCard
            label="Chlorophyll"
            value={plant.physiology.chlorophyllPercent}
            unit="%"
            min={40}
            max={100}
            {...getStatus(plant.physiology.chlorophyllPercent, 40, 100)}
            icon="🍃"
            delta={plant.physiology.chlorophyllChangeTodayPercent}
            metricKey="chlorophyll"
          />
          <MetricCard
            label="Root Mass"
            value={plant.physiology.rootMassDryWeightGrams}
            unit="g"
            min={1}
            max={100}
            {...getStatus(plant.physiology.rootMassDryWeightGrams, 1, 100)}
            icon="🌿"
            metricKey="rootMass"
          />
          <MetricCard
            label="Height"
            value={plant.morphology.heightCm}
            unit="cm"
            min={0}
            max={200}
            {...getStatus(plant.morphology.heightCm, 0, 200)}
            icon="📏"
            delta={plant.morphology.heightGrowthTodayMm / 10}
            metricKey="height"
          />
          <MetricCard
            label="Biomass"
            value={plant.physiology.biomassDryWeightGrams}
            unit="g"
            min={0}
            max={500}
            {...getStatus(plant.physiology.biomassDryWeightGrams, 0, 500)}
            icon="⚖️"
            metricKey="biomass"
          />
        </div>
      </div>

      {/* NPK Ratio Chart */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">🥗 NPK Ratio</h3>
        <NutrientPieChart
          nitrogen={tank.macroNutrients.nitrogenNMgPerLiter}
          phosphorus={tank.macroNutrients.phosphorusPMgPerLiter}
          potassium={tank.macroNutrients.potassiumKMgPerLiter}
        />
      </div>

      {/* Environment Rings */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">🌍 Environment Status</h3>
        <EnvironmentRings
          temperature={tank.roomEnvironment.airTemperatureCelsius}
          humidity={tank.roomEnvironment.relativeHumidityPercent}
          co2={tank.roomEnvironment.co2Ppm}
          tempMin={tempThresholds.min}
          tempMax={tempThresholds.max}
          humidityMin={humThresholds.min}
          humidityMax={humThresholds.max}
          co2Min={300}
          co2Max={1500}
        />
      </div>
    </div>
  );
}
