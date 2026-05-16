import { getMetricInfo } from '../data/metricInfo';
import '../styles/MetricInfoModal.css';

interface MetricInfoModalProps {
  metricKey: string;
  currentValue: number;
  min: number;
  max: number;
  /** Override the optimal range shown in the bar — used for stage-aware metrics (N/P/K/EC/PPM) */
  optimalOverride?: { min: number; max: number; ideal: number };
  onClose: () => void;
}

export function MetricInfoModal({
  metricKey,
  currentValue,
  min,
  max,
  optimalOverride,
  onClose,
}: MetricInfoModalProps) {
  const info = getMetricInfo(metricKey);
  if (!info) return null;

  // Use stage-aware override when provided, otherwise fall back to database value
  const optimalRange = optimalOverride ?? info.optimal;

  const getStatus = () => {
    if (currentValue < min) return { class: 'status-low',     label: 'LOW'     };
    if (currentValue > max) return { class: 'status-high',    label: 'HIGH'    };

    // Fix #9: "DRIFTING" warning when near the outer 20% of optimal range
    const rangeWidth = optimalRange.max - optimalRange.min;
    const isDrifting = rangeWidth > 0 && (
      (currentValue >= optimalRange.max - rangeWidth * 0.2 && currentValue <= optimalRange.max) ||
      (currentValue <= optimalRange.min + rangeWidth * 0.2 && currentValue >= optimalRange.min)
    );
    if (isDrifting) return { class: 'status-drifting', label: 'DRIFTING' };

    return { class: 'status-optimal', label: 'OPTIMAL' };
  };

  const status = getStatus();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="metric-info-modal modal-content" onClick={e => e.stopPropagation()}>
        <div className="info-header">
          <h2>💡 {info.name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Current Status */}
        <div className={`current-status ${status.class}`}>
          <div className="status-display">
            <span className="status-label">{status.label}</span>
            <span className="current-value">
              {currentValue.toFixed(1)} {info.unit}
            </span>
          </div>
          <div className="range-info">
            <span className="range-label">Stage range: {min} – {max} {info.unit}</span>
            <span className="optimal-label">Ideal: {optimalRange.min} – {optimalRange.max} {info.unit}</span>
          </div>
        </div>

        {/* Visual Range Bar */}
        <div className="range-visualization">
          <div className="range-track">
            <div
              className="range-fill"
              style={{
                left:  `${Math.max(0, ((optimalRange.min - min) / (max - min)) * 100)}%`,
                width: `${Math.min(100, ((optimalRange.max - optimalRange.min) / (max - min)) * 100)}%`,
              }}
            />
            <div
              className={`range-indicator ${status.class}`}
              style={{
                left: `${Math.max(0, Math.min(100, ((currentValue - min) / (max - min)) * 100))}%`,
              }}
            />
          </div>
          <div className="range-labels">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>

        {/* Info Sections */}
        <div className="info-content">
          <section className="info-section">
            <h3>📖 What is it?</h3>
            <p>{info.what}</p>
          </section>

          <section className="info-section">
            <h3>🌱 Why it matters</h3>
            <p>{info.why}</p>
          </section>

          {status.class === 'status-low' && (
            <section className="info-section warning">
              <h3>⚠️ Your value is LOW</h3>
              <p>{info.tooLow}</p>
            </section>
          )}

          {status.class === 'status-high' && (
            <section className="info-section warning">
              <h3>⚠️ Your value is HIGH</h3>
              <p>{info.tooHigh}</p>
            </section>
          )}

          {status.class === 'status-drifting' && (
            <section className="info-section drifting">
              <h3>🟡 Value is drifting toward the edge</h3>
              <p>Still within range, but trending toward a problem. Take corrective action now to avoid falling out of the optimal zone. See adjustment steps below.</p>
            </section>
          )}

          {status.class === 'status-optimal' && (
            <section className="info-section success">
              <h3>✅ You're in the optimal range!</h3>
              <p>Keep monitoring daily to maintain this level.</p>
            </section>
          )}

          <section className="info-section">
            <h3>🧬 Terpene Impact</h3>
            <p>{info.terpeneImpact}</p>
          </section>

          <section className="info-section">
            <h3>🔧 How to adjust</h3>
            <p>{info.adjustment}</p>
          </section>

          <section className="info-section">
            <h3>💊 Suggested Products / Controls</h3>
            <ul className="additive-list">
              {info.suggestedAdditives.map((additive, idx) => (
                <li key={idx}>
                  <span className="additive-icon">→</span>
                  {additive}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
