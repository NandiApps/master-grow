import '../styles/HealthBar.css';

interface HealthBarProps {
  healthPercent: number;
  healthChange?: number;
  isCritical?: boolean;
}

export function HealthBar({ healthPercent, healthChange, isCritical }: HealthBarProps) {
  const getHealthStatus = (health: number) => {
    if (health > 80) return { label: 'Thriving', emoji: '🌟', class: 'status-thriving' };
    if (health > 50) return { label: 'Healthy', emoji: '💚', class: 'status-healthy' };
    if (health > 20) return { label: 'Stressed', emoji: '⚠️', class: 'status-stressed' };
    return { label: 'Critical', emoji: '🔴', class: 'status-critical' };
  };

  const status = getHealthStatus(healthPercent);

  return (
    <div className={`health-bar-container ${status.class} ${isCritical ? 'is-critical' : ''}`}>
      <div className="health-header">
        <div className="health-label-area">
          <span className="health-emoji">{status.emoji}</span>
          <span className="health-label">Plant Health</span>
        </div>
        <span className="health-status-text">{status.label}</span>
      </div>

      <div className="health-bar">
        <div
          className={`health-fill health-fill-${status.class.replace('status-', '')}`}
          style={{ width: `${healthPercent}%` }}
        />
      </div>

      <div className="health-footer">
        <span className="health-percentage">{healthPercent.toFixed(0)}%</span>
        {healthChange !== undefined && (
          <span className={`health-change change-${healthChange >= 0 ? 'positive' : 'negative'}`}>
            {healthChange >= 0 ? '+' : ''}{healthChange.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}
