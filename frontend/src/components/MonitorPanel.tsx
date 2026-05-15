import { GameStateResponse } from '../types';
import '../styles/MonitorPanel.css';

interface Props {
  state: GameStateResponse;
}

export function MonitorPanel({ state }: Props) {
  const plant = state.plant;
  const tank = state.tank;

  const getStageEmoji = (stage: string) => {
    switch (stage) {
      case 'seedling':
        return '🌱';
      case 'vegetative':
        return '🌿';
      case 'early_flower':
        return '🌸';
      case 'late_flower':
        return '🌺';
      case 'harvest_ready':
        return '🌾';
      default:
        return '❓';
    }
  };

  const getHealthColor = (health: number) => {
    if (health > 80) return 'health-good';
    if (health > 50) return 'health-ok';
    if (health > 20) return 'health-poor';
    return 'health-critical';
  };

  const getWarnings = () => {
    const warnings = [];
    if (plant.visibleSymptoms.nitrogenDeficiency) warnings.push('🟡 Nitrogen low');
    if (plant.visibleSymptoms.powderyMildew) warnings.push('⚠️ Powdery mildew');
    if (plant.visibleSymptoms.botrytis) warnings.push('⚠️ Botrytis risk');
    if (plant.stressIndicators.photoinhibitionActive) warnings.push('🔴 Light stress');
    if (plant.stressIndicators.nutrientLockoutActive) warnings.push('🔴 pH lockout');
    return warnings;
  };

  const warnings = getWarnings();

  return (
    <div className="monitor-panel">
      {/* Growth Stage */}
      <div className="monitor-section">
        <h3>Growth Status</h3>
        <div className="stage-display">
          <span className="stage-emoji">{getStageEmoji(plant.growthStage.stage)}</span>
          <div className="stage-info">
            <div className="stage-name">{plant.growthStage.stage.replace(/_/g, ' ').toUpperCase()}</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${plant.growthStage.stageProgressPercent}%` }}
              />
            </div>
            <div className="progress-text">{Math.round(plant.growthStage.stageProgressPercent)}%</div>
          </div>
        </div>
      </div>

      {/* Plant Metrics */}
      <div className="monitor-section">
        <h3>Plant Metrics</h3>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-label">Height</span>
            <span className="metric-value">{plant.morphology.heightCm.toFixed(1)}cm</span>
            <span className="metric-growth">+{plant.morphology.heightGrowthTodayMm.toFixed(1)}mm</span>
          </div>
          <div className="metric">
            <span className="metric-label">Health</span>
            <div className={`health-bar ${getHealthColor(plant.physiology.plantHealthPercent)}`}>
              <div style={{ width: `${plant.physiology.plantHealthPercent}%` }} />
            </div>
            <span className="metric-value">{plant.physiology.plantHealthPercent.toFixed(0)}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">Chlorophyll</span>
            <span className="metric-value">{plant.physiology.chlorophyllPercent.toFixed(0)}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">Root Mass</span>
            <span className="metric-value">{plant.physiology.rootMassDryWeightGrams.toFixed(1)}g</span>
          </div>
        </div>
      </div>

      {/* Cannabinoids (if flowering) */}
      {plant.flowering.floweringInitiated && (
        <div className="monitor-section">
          <h3>Cannabinoids (Day {plant.flowering.daysInFlower})</h3>
          <div className="cannabinoid-bars">
            <div className="cannabinoid">
              <label>THCA</label>
              <div className="bar">
                <div
                  className="fill thca"
                  style={{ width: `${(plant.cannabinoids.thcaAccumulationPercent / 30) * 100}%` }}
                />
              </div>
              <span>{plant.cannabinoids.thcaAccumulationPercent.toFixed(1)}%</span>
            </div>
            <div className="cannabinoid">
              <label>CBDA</label>
              <div className="bar">
                <div
                  className="fill cbda"
                  style={{ width: `${(plant.cannabinoids.cbdaAccumulationPercent / 5) * 100}%` }}
                />
              </div>
              <span>{plant.cannabinoids.cbdaAccumulationPercent.toFixed(1)}%</span>
            </div>
            <div className="cannabinoid">
              <label>CBN</label>
              <div className="bar">
                <div
                  className="fill cbn"
                  style={{ width: `${plant.cannabinoids.cbnAccumulationPercent * 20}%` }}
                />
              </div>
              <span>{plant.cannabinoids.cbnAccumulationPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Water Chemistry */}
      <div className="monitor-section">
        <h3>Water Chemistry</h3>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-label">pH</span>
            <span className="metric-value">{tank.waterChemistry.ph.toFixed(2)}</span>
            <span className="metric-range">(5.5-6.5)</span>
          </div>
          <div className="metric">
            <span className="metric-label">EC</span>
            <span className="metric-value">{tank.waterChemistry.ecMscm.toFixed(2)}</span>
            <span className="metric-range">mS/cm</span>
          </div>
          <div className="metric">
            <span className="metric-label">PPM</span>
            <span className="metric-value">{tank.waterChemistry.ppm.toFixed(0)}</span>
            <span className="metric-range">&lt;1150</span>
          </div>
          <div className="metric">
            <span className="metric-label">Temp</span>
            <span className="metric-value">{tank.waterChemistry.waterTemperatureCelsius.toFixed(1)}°C</span>
            <span className="metric-range">18-24°C</span>
          </div>
          <div className="metric">
            <span className="metric-label">DO</span>
            <span className="metric-value">{tank.waterChemistry.dissolvedOxygenMgPerLiter.toFixed(1)}</span>
            <span className="metric-range">mg/L</span>
          </div>
        </div>
      </div>

      {/* Macronutrients */}
      <div className="monitor-section">
        <h3>Nutrients (mg/L)</h3>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-label">N</span>
            <span className={`metric-value ${tank.macroNutrients.nitrogenNMgPerLiter < 80 ? 'danger' : ''}`}>
              {tank.macroNutrients.nitrogenNMgPerLiter.toFixed(0)}
            </span>
            <span className="metric-range">&gt;80</span>
          </div>
          <div className="metric">
            <span className="metric-label">P</span>
            <span className={`metric-value ${tank.macroNutrients.phosphorusPMgPerLiter < 30 ? 'danger' : ''}`}>
              {tank.macroNutrients.phosphorusPMgPerLiter.toFixed(0)}
            </span>
            <span className="metric-range">&gt;30</span>
          </div>
          <div className="metric">
            <span className="metric-label">K</span>
            <span className={`metric-value ${tank.macroNutrients.potassiumKMgPerLiter < 100 ? 'danger' : ''}`}>
              {tank.macroNutrients.potassiumKMgPerLiter.toFixed(0)}
            </span>
            <span className="metric-range">&gt;100</span>
          </div>
          <div className="metric">
            <span className="metric-label">Ca</span>
            <span className={`metric-value ${tank.macroNutrients.calciumCaMgPerLiter < 120 ? 'danger' : ''}`}>
              {tank.macroNutrients.calciumCaMgPerLiter.toFixed(0)}
            </span>
            <span className="metric-range">&gt;120</span>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="monitor-section">
        <h3>Environment</h3>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-label">Air Temp</span>
            <span className="metric-value">{tank.roomEnvironment.airTemperatureCelsius.toFixed(1)}°C</span>
          </div>
          <div className="metric">
            <span className="metric-label">Humidity</span>
            <span className="metric-value">{tank.roomEnvironment.relativeHumidityPercent.toFixed(0)}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">PAR</span>
            <span className="metric-value">{tank.roomEnvironment.lightParUmolPerM2PerS.toFixed(0)}</span>
            <span className="metric-range">µmol/m²/s</span>
          </div>
          <div className="metric">
            <span className="metric-label">CO₂</span>
            <span className="metric-value">{tank.roomEnvironment.co2Ppm.toFixed(0)}</span>
            <span className="metric-range">ppm</span>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="monitor-section warnings-section">
          <h3>⚠️ Alerts</h3>
          <div className="warnings-list">
            {warnings.map((w, i) => (
              <div key={i} className="warning-item">{w}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
