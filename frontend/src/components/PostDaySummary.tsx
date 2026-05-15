import '../styles/PostDaySummary.css';

interface SummaryItem {
  label: string;
  icon: string;
  value: number;
  unit: string;
  delta: number;
  status: 'positive' | 'neutral' | 'negative';
}

interface PostDaySummaryProps {
  day: number;
  items: SummaryItem[];
  plantHealth: number;
  plantHealthDelta: number;
  onClose: () => void;
}

export function PostDaySummary({
  day,
  items,
  plantHealth,
  plantHealthDelta,
  onClose,
}: PostDaySummaryProps) {
  const positiveCount = items.filter(i => i.status === 'positive').length;
  const negativeCount = items.filter(i => i.status === 'negative').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="post-day-summary modal-content" onClick={e => e.stopPropagation()}>
        <div className="summary-header">
          <h2>📊 Day {day} Summary</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="health-overview">
          <div className="health-stat">
            <span className="stat-label">Plant Health</span>
            <span className="stat-value">{plantHealth.toFixed(1)}%</span>
            <span className={`stat-delta delta-${plantHealthDelta >= 0 ? 'positive' : 'negative'}`}>
              {plantHealthDelta >= 0 ? '+' : ''}{plantHealthDelta.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="summary-stats">
          <div className="stat-group stat-positive">
            <span className="group-icon">✅</span>
            <div>
              <span className="group-label">Good</span>
              <span className="group-count">{positiveCount}</span>
            </div>
          </div>
          <div className="stat-group stat-neutral">
            <span className="group-icon">➡️</span>
            <div>
              <span className="group-label">Neutral</span>
              <span className="group-count">{items.length - positiveCount - negativeCount}</span>
            </div>
          </div>
          <div className="stat-group stat-negative">
            <span className="group-icon">⚠️</span>
            <div>
              <span className="group-label">Warning</span>
              <span className="group-count">{negativeCount}</span>
            </div>
          </div>
        </div>

        <div className="summary-items">
          {items.map((item, idx) => (
            <div key={idx} className={`summary-item item-${item.status}`}>
              <div className="item-left">
                <span className="item-icon">{item.icon}</span>
                <div className="item-info">
                  <span className="item-label">{item.label}</span>
                  <span className="item-value">{item.value.toFixed(1)}{item.unit}</span>
                </div>
              </div>
              <span className={`item-delta delta-${item.status === 'positive' ? 'positive' : item.status === 'neutral' ? 'neutral' : 'negative'}`}>
                {item.delta >= 0 ? '+' : ''}{item.delta.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          Continue to Next Day
        </button>
      </div>
    </div>
  );
}
