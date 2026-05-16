import { GameStateResponse } from '../types';
import '../styles/HarvestButton.css';

interface HarvestButtonProps {
  gameState: GameStateResponse;
  onHarvest: () => void;
  disabled: boolean;
}

export function HarvestButton({ gameState, onHarvest, disabled }: HarvestButtonProps) {
  const plant = gameState.plant;
  const daysInFlower = plant.flowering.daysInFlower;
  // Fix #12: gate harvest behind minimum 35 flower days to prevent premature harvest
  const canHarvest = plant.flowering.floweringInitiated && daysInFlower >= 35 && !disabled;
  const strain = gameState.gameState.cycleInformation.selectedStrainName;
  const yieldTracking = plant.yieldTracking;

  const getHarvestStatus = () => {
    if (!plant.flowering.floweringInitiated) {
      return { text: 'Waiting for Flower Phase', color: 'gray' };
    }
    if (yieldTracking && yieldTracking.daysSincePeak > 0) {
      return { text: `${yieldTracking.daysSincePeak} days past peak`, color: 'orange' };
    }
    if (daysInFlower < 35) {
      return { text: `${35 - daysInFlower} more days until harvestable`, color: 'blue' };
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
            : daysInFlower < 35
            ? `Minimum harvest age is day 35 of flower (${35 - daysInFlower} days remaining)`
            : 'Click to harvest and see quality assessment'
        }
      >
        {/* Polish #23: contextual harvest button label */}
        {!plant.flowering.floweringInitiated
          ? '🔒 Harvest Locked'
          : daysInFlower < 35
          ? `⏳ Too Early (Day ${daysInFlower}/35)`
          : yieldTracking && yieldTracking.daysSincePeak > 5
          ? '🚨 Harvest Now! (Over-ripe)'
          : yieldTracking && yieldTracking.daysSincePeak > 0
          ? '⚠️ Harvest (Past Peak)'
          : plant.growthStage?.stage === 'harvest_ready'
          ? '🌾 Harvest Now!'
          : '🌾 Harvest'}
      </button>
    </div>
  );
}
