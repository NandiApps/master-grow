import { PlantState } from '../types';
import '../styles/PlantVisual.css';

interface Props {
  plant: PlantState;
}

export function PlantVisual({ plant }: Props) {
  const stage = plant.growthStage.stage;
  const progress = plant.growthStage.stageProgressPercent;
  const height = plant.morphology.heightCm;

  const getStageName = (s: string) => {
    return s.replace(/_/g, ' ').toUpperCase();
  };

  const getPlantSVG = () => {
    const healthOpacity = Math.max(0.6, plant.physiology.plantHealthPercent / 100);

    switch (stage) {
      case 'seedling':
        // Tiny sprout with 2 cotyledon leaves
        return (
          <svg viewBox="0 0 100 150" className="plant-svg">
            {/* Soil */}
            <ellipse cx="50" cy="140" rx="40" ry="15" fill="#8B7355" opacity="0.6" />
            {/* Root */}
            <line x1="50" y1="140" x2="50" y2="130" stroke="#8B6F47" strokeWidth="2" />
            {/* Stem */}
            <line
              x1="50"
              y1="130"
              x2="50"
              y2="80"
              stroke="#2D5016"
              strokeWidth="3"
              opacity={healthOpacity}
            />
            {/* Left cotyledon */}
            <ellipse
              cx="35"
              cy="100"
              rx="12"
              ry="18"
              fill="#4CAF50"
              opacity={healthOpacity}
              transform="rotate(-30 35 100)"
            />
            {/* Right cotyledon */}
            <ellipse
              cx="65"
              cy="100"
              rx="12"
              ry="18"
              fill="#4CAF50"
              opacity={healthOpacity}
              transform="rotate(30 65 100)"
            />
            {/* Growth tip */}
            <circle cx="50" cy="70" r="3" fill="#7CB342" />
          </svg>
        );

      case 'vegetative':
        // Full leafy plant with multiple nodes
        const leafCount = Math.min(8, Math.floor(3 + progress / 15));
        const leafAngles = Array.from({ length: leafCount }, (_, i) => (i * 360) / leafCount);

        return (
          <svg viewBox="0 0 100 160" className="plant-svg">
            {/* Soil */}
            <ellipse cx="50" cy="150" rx="45" ry="18" fill="#8B7355" opacity="0.6" />
            {/* Main stem */}
            <line
              x1="50"
              y1="150"
              x2="50"
              y2="40"
              stroke="#2D5016"
              strokeWidth="4"
              opacity={healthOpacity}
            />
            {/* Leaves radiating from stem */}
            {leafAngles.map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const nodeHeight = 150 - (i * 110) / leafCount;
              const leafTipX = 50 + Math.cos(rad) * 25;
              const leafTipY = nodeHeight + Math.sin(rad) * 20;

              return (
                <g key={i}>
                  {/* Leaf stem */}
                  <line
                    x1="50"
                    y1={nodeHeight}
                    x2={leafTipX}
                    y2={leafTipY}
                    stroke="#2D5016"
                    strokeWidth="1.5"
                    opacity={healthOpacity}
                  />
                  {/* Leaf blade (fan shape) */}
                  <ellipse
                    cx={leafTipX}
                    cy={leafTipY}
                    rx="12"
                    ry="16"
                    fill="#66BB6A"
                    opacity={healthOpacity}
                    transform={`rotate(${angle} ${leafTipX} ${leafTipY})`}
                  />
                </g>
              );
            })}
            {/* Growing tip */}
            <circle cx="50" cy="35" r="4" fill="#7CB342" />
          </svg>
        );

      case 'early_flower':
        // Plant with small flower clusters forming
        return (
          <svg viewBox="0 0 100 170" className="plant-svg">
            {/* Soil */}
            <ellipse cx="50" cy="155" rx="45" ry="18" fill="#8B7355" opacity="0.6" />
            {/* Main stem */}
            <line
              x1="50"
              y1="155"
              x2="50"
              y2="30"
              stroke="#2D5016"
              strokeWidth="4"
              opacity={healthOpacity}
            />
            {/* Remaining fan leaves */}
            {[0, 120, 240].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const leafTipX = 50 + Math.cos(rad) * 22;
              const leafTipY = 90 + Math.sin(rad) * 18;

              return (
                <ellipse
                  key={`leaf-${i}`}
                  cx={leafTipX}
                  cy={leafTipY}
                  rx="11"
                  ry="14"
                  fill="#558B2F"
                  opacity={healthOpacity}
                  transform={`rotate(${angle} ${leafTipX} ${leafTipY})`}
                />
              );
            })}
            {/* Flower clusters forming */}
            {[0, 90, 180, 270].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 15;
              const cy = 60 + Math.sin(rad) * 12;

              return (
                <g key={`flower-${i}`}>
                  <circle cx={cx} cy={cy} r="5" fill="#E8B4B8" opacity={0.7 * healthOpacity} />
                  <circle cx={cx - 3} cy={cy - 2} r="3" fill="#E8B4B8" opacity={0.5 * healthOpacity} />
                  <circle cx={cx + 3} cy={cy + 2} r="3" fill="#E8B4B8" opacity={0.5 * healthOpacity} />
                </g>
              );
            })}
            {/* Growing tip */}
            <circle cx="50" cy="25" r="4" fill="#D81B60" />
          </svg>
        );

      case 'late_flower':
        // Dense flower development
        return (
          <svg viewBox="0 0 100 170" className="plant-svg">
            {/* Soil */}
            <ellipse cx="50" cy="155" rx="45" ry="18" fill="#8B7355" opacity="0.6" />
            {/* Main stem */}
            <line
              x1="50"
              y1="155"
              x2="50"
              y2="20"
              stroke="#2D5016"
              strokeWidth="4"
              opacity={healthOpacity}
            />
            {/* Minimal leaves */}
            {[0, 180].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const leafTipX = 50 + Math.cos(rad) * 18;
              const leafTipY = 100 + Math.sin(rad) * 12;

              return (
                <ellipse
                  key={`leaf-${i}`}
                  cx={leafTipX}
                  cy={leafTipY}
                  rx="9"
                  ry="12"
                  fill="#33691E"
                  opacity={healthOpacity}
                  transform={`rotate(${angle} ${leafTipX} ${leafTipY})`}
                />
              );
            })}
            {/* Large dense flower buds */}
            {[0, 90, 180, 270].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 18;
              const cy = 70 + Math.sin(rad) * 15;

              return (
                <g key={`bud-${i}`}>
                  <ellipse cx={cx} cy={cy} rx="8" ry="12" fill="#D81B60" opacity={0.8 * healthOpacity} />
                  <circle cx={cx - 2} cy={cy - 5} r="2" fill="#F48FB1" opacity={0.6 * healthOpacity} />
                  <circle cx={cx + 3} cy={cy + 3} r="2" fill="#F48FB1" opacity={0.6 * healthOpacity} />
                </g>
              );
            })}
            {/* Central cola (main bud) */}
            <ellipse cx="50" cy="50" rx="9" ry="15" fill="#E91E63" opacity={0.9 * healthOpacity} />
            <circle cx="47" cy="42" r="2" fill="#F48FB1" opacity={0.7 * healthOpacity} />
            <circle cx="53" cy="55" r="2" fill="#F48FB1" opacity={0.7 * healthOpacity} />
          </svg>
        );

      case 'harvest_ready':
        // Fully mature plant ready for harvest
        return (
          <svg viewBox="0 0 100 170" className="plant-svg">
            {/* Soil */}
            <ellipse cx="50" cy="155" rx="45" ry="18" fill="#8B7355" opacity="0.6" />
            {/* Main stem */}
            <line
              x1="50"
              y1="155"
              x2="50"
              y2="15"
              stroke="#2D5016"
              strokeWidth="4"
              opacity={healthOpacity}
            />
            {/* Amber/brown tones indicating mature trichomes */}
            {[0, 90, 180, 270].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 18;
              const cy = 70 + Math.sin(rad) * 15;

              return (
                <g key={`mature-bud-${i}`}>
                  <ellipse cx={cx} cy={cy} rx="9" ry="13" fill="#C8A76F" opacity={0.9 * healthOpacity} />
                  <circle cx={cx - 2} cy={cy - 4} r="2" fill="#E6D5B8" opacity={0.7 * healthOpacity} />
                  <circle cx={cx + 3} cy={cy + 4} r="2" fill="#E6D5B8" opacity={0.7 * healthOpacity} />
                  <circle cx={cx} cy={cy} r="1.5" fill="#8B7355" opacity={0.5} />
                </g>
              );
            })}
            {/* Mature cola */}
            <ellipse cx="50" cy="48" rx="10" ry="16" fill="#B8860B" opacity={0.95 * healthOpacity} />
            <circle cx="46" cy="38" r="2" fill="#E6D5B8" opacity={0.8 * healthOpacity} />
            <circle cx="54" cy="56" r="2" fill="#E6D5B8" opacity={0.8 * healthOpacity} />
            {/* Harvest indicator glow */}
            <circle
              cx="50"
              cy="48"
              r="12"
              fill="none"
              stroke="#FFD700"
              strokeWidth="1"
              opacity="0.4"
            />
          </svg>
        );

      default:
        return <svg viewBox="0 0 100 150" />;
    }
  };

  return (
    <div className="plant-visual">
      <div className="plant-container">{getPlantSVG()}</div>

      <div className="plant-info">
        <div className="stage-label">
          <span className="stage-icon">
            {stage === 'seedling' && '🌱'}
            {stage === 'vegetative' && '🌿'}
            {stage === 'early_flower' && '🌸'}
            {stage === 'late_flower' && '🌺'}
            {stage === 'harvest_ready' && '🌾'}
          </span>
          <div className="stage-text">
            <div className="stage-name">{getStageName(stage)}</div>
            <div className="height-info">{height.toFixed(1)}cm</div>
          </div>
        </div>

        <div className="stage-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>
      </div>
    </div>
  );
}
