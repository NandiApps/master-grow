import { useState } from 'react';
import { MetricInfoModal } from './MetricInfoModal';
import '../styles/MetricCard.css';

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  delta?: number; // Change since last day
  min: number;
  max: number;
  optimal?: number;
  isCritical: boolean;
  isWarning: boolean;
  icon?: string;
  sparklineData?: number[]; // For trend visualization
  metricKey?: string; // For info modal lookup
}

export function MetricCard({
  label,
  value,
  unit,
  delta,
  min,
  max,
  optimal,
  isCritical,
  isWarning,
  icon,
  sparklineData,
  metricKey,
}: MetricCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  // Calculate percentage for threshold slider
  const range = max - min;
  const percentage = ((value - min) / range) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Determine status color
  const getStatusColor = () => {
    if (isCritical) return 'critical';
    if (isWarning) return 'warning';
    return 'optimal';
  };

  const status = getStatusColor();

  return (
    <>
      <div className={`metric-card metric-${status}`}>
        <div className="metric-header">
          <div className="metric-label-area">
            {icon && <span className="metric-icon">{icon}</span>}
            <span className="metric-label">{label}</span>
          </div>
          <div className="metric-header-right">
            {metricKey && (
              <button
                className="metric-info-btn"
                onClick={() => setShowInfo(true)}
                title="Learn more about this metric"
              >
                💡
              </button>
            )}
            <span className={`metric-status-badge status-${status}`}>
              {isCritical && '🔴'}
              {isWarning && '🟡'}
              {!isCritical && !isWarning && '✅'}
            </span>
          </div>
        </div>

      <div className="metric-value-area">
        <span className={`metric-value value-${status}`}>
          {value.toFixed(1)}{unit}
        </span>
        {delta !== undefined && (
          <span className={`metric-delta delta-${delta >= 0 ? 'positive' : 'negative'}`}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(2)}{unit}
          </span>
        )}
      </div>

      {/* Threshold slider */}
      <div className="metric-threshold-slider">
        <div className="slider-track">
          <div
            className={`slider-fill slider-fill-${status}`}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
        <div className="slider-labels">
          <span className="slider-min">{min}</span>
          {optimal && <span className="slider-optimal">{optimal}</span>}
          <span className="slider-max">{max}</span>
        </div>
      </div>

      {/* Sparkline trend */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="metric-sparkline">
          <svg viewBox="0 0 60 20" className="sparkline-chart">
            {sparklineData.map((v, i) => {
              const x = (i / (sparklineData.length - 1)) * 60;
              const normalizedV = Math.max(0, Math.min(1, (v - min) / (max - min)));
              const y = 20 - normalizedV * 18;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.5"
                  className="sparkline-point"
                  fill={isCritical ? '#E74C3C' : isWarning ? '#F39C12' : '#27AE60'}
                />
              );
            })}
          </svg>
          <span className="sparkline-label">
            {sparklineData[sparklineData.length - 1] > sparklineData[0] ? '↑' : '↓'}
          </span>
        </div>
      )}
      </div>

      {showInfo && metricKey && (
        <MetricInfoModal
          metricKey={metricKey}
          currentValue={value}
          min={min}
          max={max}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  );
}
