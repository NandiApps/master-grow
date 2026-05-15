import { GameStateResponse } from '../types';
import '../styles/PlantStatusCard.css';

interface Props {
  state: GameStateResponse;
}

export function PlantStatusCard({ state }: Props) {
  const plant = state.plant;
  const gameState = state.gameState;
  const tank = state.tank;

  // Determine overall status
  const getStatus = () => {
    const health = plant.physiology.plantHealthPercent;
    if (health > 80) return { label: 'Thriving', emoji: '🌟', color: 'status-excellent' };
    if (health > 50) return { label: 'Healthy', emoji: '💚', color: 'status-good' };
    if (health > 20) return { label: 'Struggling', emoji: '⚠️', color: 'status-warning' };
    return { label: 'Critical', emoji: '🔴', color: 'status-critical' };
  };

  // Calculate days to harvest
  const getDaysToHarvest = () => {
    const expectedHarvest = gameState.cycleInformation.expectedHarvestDay;
    const daysRemaining = Math.max(0, expectedHarvest - gameState.currentGameDay);
    return daysRemaining;
  };

  // Get key recommendations
  const getRecommendations = () => {
    const recommendations = [];
    const health = plant.physiology.plantHealthPercent;
    const n = tank.macroNutrients.nitrogenNMgPerLiter;
    const humidity = tank.roomEnvironment.relativeHumidityPercent;
    const temp = tank.roomEnvironment.airTemperatureCelsius;
    const par = tank.roomEnvironment.lightParUmolPerM2PerS;

    if (health < 50) {
      recommendations.push('🏥 Focus on recovery - improve environment conditions');
    }
    if (n < 100) {
      recommendations.push('🧂 Nitrogen low - dose nutrients soon');
    }
    if (humidity > 70) {
      recommendations.push('💨 High humidity - increase airflow to prevent mold');
    }
    if (temp < 18 || temp > 26) {
      recommendations.push('🌡️ Temperature outside optimal range');
    }
    if (par > 1200) {
      recommendations.push('☀️ Light too intense - risk of photoinhibition');
    }
    if (recommendations.length === 0) {
      recommendations.push('✅ Conditions optimal - continue current management');
    }

    return recommendations;
  };

  const status = getStatus();
  const daysToHarvest = getDaysToHarvest();
  const recommendations = getRecommendations();
  const profit = gameState.economics.cumulativeProfitAud;
  const profitColor = profit >= 0 ? 'positive' : 'negative';

  return (
    <div className={`plant-status-card ${status.color}`}>
      <div className="status-header">
        <div className="status-display">
          <span className="status-emoji">{status.emoji}</span>
          <div>
            <h3>Plant Status</h3>
            <p className="status-label">{status.label}</p>
          </div>
        </div>
        <div className="stage-badge">
          <span className="stage-text">{plant.growthStage.stage.replace(/_/g, ' ')}</span>
          <span className="day-text">Day {gameState.currentGameDay}</span>
        </div>
      </div>

      <div className="status-metrics">
        <div className="metric-pair">
          <div className="metric-item">
            <span className="label">Days to Harvest</span>
            <span className="value">{daysToHarvest}d</span>
          </div>
          <div className="metric-item">
            <span className="label">Cumulative Profit</span>
            <span className={`value ${profitColor}`}>${profit.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="recommendations">
        <h4>📋 Focus Areas</h4>
        <ul>
          {recommendations.slice(0, 2).map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
