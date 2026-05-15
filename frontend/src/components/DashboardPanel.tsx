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
  const plant = state.plant;
  const tank = state.tank;
  const gameState = state.gameState;

  // Get strain thresholds from gameState or use defaults
  const isFlowering = plant.flowering.floweringInitiated;
  const thresholds = (gameState as any).selectedStrain?.nutrientThresholds;

  const getThresholds = () => {
    if (thresholds) {
      return isFlowering ? thresholds.flowering : thresholds.vegetative;
    }
    // Defaults if not available
    return isFlowering
      ? {
          ecMin: 1.6, ecMax: 2.0, ppmMin: 800, ppmMax: 1100,
          nMin: 50, nMax: 100, pMin: 60, pMax: 90, kMin: 117, kMax: 175,
        }
      : {
          ecMin: 1.3, ecMax: 1.7, ppmMin: 800, ppmMax: 900,
          nMin: 160, nMax: 200, pMin: 30, pMax: 60, kMin: 60, kMax: 117,
        };
  };

  const thr = getThresholds();
  const phThresholds = thresholds?.ph || { min: 5.5, optimal: 5.7, max: 6.5 };
  const tempThresholds = thresholds?.temperature || { min: 20, max: 26 };
  const humThresholds = isFlowering
    ? thresholds?.humidity?.flowering || { min: 40, max: 50 }
    : thresholds?.humidity?.vegetative || { min: 40, max: 60 };

  // Helper to check if value is critical/warning
  const getStatus = (value: number, min: number, max: number) => ({
    isCritical: value < min || value > max,
    isWarning: (value < min * 1.1 && value >= min) || (value <= max && value > max * 0.9),
  });

  return (
    <div className="dashboard-panel">
      {/* Health Overview */}
      <div className="dashboard-section">
        <HealthBar
          healthPercent={plant.physiology.plantHealthPercent}
          healthChange={plant.physiology.plantHealthChangeTodayPercent}
          isCritical={plant.physiology.plantHealthPercent < 30}
        />
      </div>

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
      </div>

      {/* Nutrients */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">🧂 Macronutrients (mg/L)</h3>
        <div className="metrics-grid">
          <MetricCard
            label="Nitrogen (N)"
            value={tank.macroNutrients.nitrogenNMgPerLiter}
            unit=""
            min={thr.nMin}
            max={thr.nMax}
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
