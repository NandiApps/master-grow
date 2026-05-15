import React, { useState } from 'react';
import { TrichomeMaturity } from '../types';
import '../styles/TrichomeInspector.css';

interface Props {
  trichomes: TrichomeMaturity;
  onHarvest: (trichomes: { clear: number; cloudy: number; amber: number }) => void;
  onClose: () => void;
  isHarvestReady: boolean;
}

export function TrichomeInspector({ trichomes, onHarvest, onClose, isHarvestReady }: Props) {
  const [clearPercent, setClearPercent] = useState(trichomes.clearTrichomesPercent);
  const [cloudyPercent, setCloudyPercent] = useState(trichomes.cloudyTrichomesPercent);
  const [amberPercent, setAmberPercent] = useState(trichomes.amberTrichomesPercent);
  const [harvesting, setHarvesting] = useState(false);

  const handleClearChange = (value: number) => {
    const newClear = value;
    const remaining = 100 - newClear;
    setClearPercent(newClear);
    const newCloudy = Math.min(cloudyPercent, remaining);
    setCloudyPercent(newCloudy);
    setAmberPercent(Math.max(0, remaining - newCloudy));
  };

  const handleCloudyChange = (value: number) => {
    const newCloudy = value;
    const remaining = 100 - clearPercent - newCloudy;
    setCloudyPercent(newCloudy);
    setAmberPercent(Math.max(0, remaining));
  };

  const handleHarvestClick = async () => {
    if (clearPercent + cloudyPercent + amberPercent !== 100) {
      alert('Trichome percentages must total 100%');
      return;
    }

    setHarvesting(true);
    try {
      await onHarvest({
        clear: clearPercent,
        cloudy: cloudyPercent,
        amber: amberPercent,
      });
    } finally {
      setHarvesting(false);
    }
  };

  const getHarvestRecommendation = () => {
    if (cloudyPercent >= 50 && amberPercent < 15) {
      return 'Peak Potency - 60-70% cloudy, <10% amber';
    } else if (cloudyPercent >= 30 && amberPercent >= 15) {
      return 'Balanced - 30-60% cloudy, 10-20% amber';
    } else if (amberPercent > 20) {
      return 'Sedating - <30% cloudy, >20% amber';
    }
    return 'Not yet ready - too many clear';
  };

  return (
    <div className="trichome-modal-overlay">
      <div className="trichome-modal">
        <div className="modal-header">
          <h2>🔬 Trichome Inspector</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {/* Trichome Visualization */}
          <div className="trichome-visual">
            <div className="trichome-display">
              <div className="trichome-circle">
                <svg viewBox="0 0 200 200">
                  {/* Draw pie chart of trichome maturity */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="white"
                    stroke="#ddd"
                    strokeWidth="2"
                  />
                  
                  {/* Clear segment */}
                  {clearPercent > 0 && (
                    <path
                      d={getPiePath(0, clearPercent, 100)}
                      fill="#e8d4a0"
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}

                  {/* Cloudy segment */}
                  {cloudyPercent > 0 && (
                    <path
                      d={getPiePath(clearPercent, clearPercent + cloudyPercent, 100)}
                      fill="#b8956e"
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}

                  {/* Amber segment */}
                  {amberPercent > 0 && (
                    <path
                      d={getPiePath(clearPercent + cloudyPercent, 100, 100)}
                      fill="#d4a574"
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </div>
            </div>

            <div className="trichome-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#e8d4a0' }} />
                <span>Clear: {clearPercent.toFixed(0)}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#b8956e' }} />
                <span>Cloudy: {cloudyPercent.toFixed(0)}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#d4a574' }} />
                <span>Amber: {amberPercent.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="trichome-controls">
            <div className="control-item">
              <label>Clear Trichomes: {clearPercent.toFixed(0)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={clearPercent}
                onChange={(e) => handleClearChange(parseInt(e.target.value))}
                className="slider"
              />
            </div>

            <div className="control-item">
              <label>Cloudy Trichomes: {cloudyPercent.toFixed(0)}%</label>
              <input
                type="range"
                min="0"
                max={100 - clearPercent}
                value={cloudyPercent}
                onChange={(e) => handleCloudyChange(parseInt(e.target.value))}
                className="slider"
              />
            </div>

            <div className="control-item">
              <label>Amber Trichomes: {amberPercent.toFixed(0)}%</label>
              <div className="amber-display">{amberPercent.toFixed(0)}% (auto-calculated)</div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="recommendation-box">
            <h4>Harvest Profile</h4>
            <p>{getHarvestRecommendation()}</p>
          </div>

          {/* Buttons */}
          <div className="modal-buttons">
            <button className="cancel-btn" onClick={onClose}>
              Not Yet
            </button>
            <button
              className="harvest-btn"
              onClick={handleHarvestClick}
              disabled={harvesting || !isHarvestReady}
            >
              {harvesting ? 'Harvesting...' : '🌾 Harvest'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPiePath(startPercent: number, endPercent: number, total: number): string {
  const startAngle = (startPercent / total) * 360 - 90;
  const endAngle = (endPercent / total) * 360 - 90;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = 100 + 80 * Math.cos(startRad);
  const y1 = 100 + 80 * Math.sin(startRad);
  const x2 = 100 + 80 * Math.cos(endRad);
  const y2 = 100 + 80 * Math.sin(endRad);

  const largeArc = endPercent - startPercent > 50 ? 1 : 0;

  return `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
}
