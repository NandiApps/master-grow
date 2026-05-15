import { getMetricInfo } from '../data/metricInfo';
import '../styles/MetricInfoModal.css';

interface MetricInfoModalProps {
  metricKey: string;
  currentValue: number;
  min: number;
  max: number;
  onClose: () => void;
}

export function MetricInfoModal({
  metricKey,
  currentValue,
  min,
  max,
  onClose,
}: MetricInfoModalProps) {
  const info = getMetricInfo(metricKey);

  if (!info) return null;

  const getStatus = () => {
    if (currentValue < min) return { class: 'status-low', label: 'LOW' };
    if (currentValue > max) return { class: 'status-high', label: 'HIGH' };
    return { class: 'status-optimal', label: 'OPTIMAL' };
  };

  const status = getStatus();
  const optimalRange = info.optimal;

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
            <span className="range-label">Your range: {min} - {max} {info.unit}</span>
            <span className="optimal-label">Optimal: {optimalRange.min} - {optimalRange.max} {info.unit}</span>
          </div>
        </div>

        {/* Visual Range Bar */}
        <div className="range-visualization">
          <div className="range-track">
            <div
              className="range-fill"
              style={{
                left: `${((optimalRange.min - min) / (max - min)) * 100}%`,
                width: `${((optimalRange.max - optimalRange.min) / (max - min)) * 100}%`,
              }}
            ></div>
            <div
              className={`range-indicator ${status.class}`}
              style={{
                left: `${((currentValue - min) / (max - min)) * 100}%`,
              }}
            ></div>
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

          {/* Conditional warning based on status */}
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

          {status.class === 'status-optimal' && (
            <section className="info-section success">
              <h3>✅ You're in the optimal range!</h3>
              <p>Keep monitoring to maintain this level.</p>
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
            <h3>💊 Suggested Products</h3>
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
