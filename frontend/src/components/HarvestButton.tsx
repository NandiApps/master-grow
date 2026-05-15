import { GameStateResponse } from '../types';
import '../styles/HarvestButton.css';

interface HarvestButtonProps {
  gameState: GameStateResponse;
  onHarvest: () => void;
  disabled: boolean;
}

export function HarvestButton({ gameState, onHarvest, disabled }: HarvestButtonProps) {
  const plant = gameState.plant;
  const canHarvest = plant.flowering.floweringInitiated && !disabled;
  const daysInFlower = plant.flowering.daysInFlower;
  const strain = gameState.gameState.cycleInformation.selectedStrainName;
  const yieldTracking = plant.yieldTracking;

  const getHarvestStatus = () => {
    if (!plant.flowering.floweringInitiated) {
      return { text: 'Waiting for Flower Phase', color: 'gray' };
    }
    if (yieldTracking && yieldTracking.daysSincePeak > 0) {
      return { text: `${yieldTracking.daysSincePeak} days past peak`, color: 'orange' };
    }
    if (daysInFlower < 30) {
      return { text: 'Still developing', color: 'blue' };
    }
    return { text: 'Ready to harvest', color: 'green' };
  };

  const status = getHarvestStatus();

  return (
    <div className="harvest-button-container">
      <div className="yield-estimate">
        <div className="yield-value">
          {yieldTracking ? Math.round(yieldTracking.currentEstimateGrams * 10) / 10 : '0'}g
        </div>
        <div className="yield-label">Estimated Yield</div>
        <div className={`quality-tier tier-${yieldTracking?.qualityTier || 'C'}`}>
          {yieldTracking?.qualityTier || 'C'} Grade
        </div>
      </div>

      <div className="harvest-info">
        <div className="days-in-flower">
          Day {daysInFlower} of {plant.flowering.expectedHarvestDay || gameState.gameState.cycleInformation.expectedHarvestDay || '?'} {strain}
        </div>
        <div className={`status status-${status.color}`}>
          {status.text}
        </div>
        {yieldTracking && yieldTracking.daysSincePeak > 0 && (
          <div className="quality-loss-warning">
            Quality: -{Math.round(yieldTracking.qualityLossPercent)}%
          </div>
        )}
      </div>

      <button
        className={`harvest-btn ${canHarvest ? 'active' : 'disabled'}`}
        onClick={onHarvest}
        disabled={!canHarvest}
        title={
          !plant.flowering.floweringInitiated
            ? 'Wait for flowering to start'
            : 'Click to harvest and see quality assessment'
        }
      >
        🌾 Harvest Now
      </button>
    </div>
  );
}
