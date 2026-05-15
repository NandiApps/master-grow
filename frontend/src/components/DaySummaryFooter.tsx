import '../styles/DaySummaryFooter.css';

interface DaySummaryFooterProps {
  healthDelta: number;
  nutrientsOk: boolean;
  humidityOk: boolean;
  temperatureOk: boolean;
  lightingOk: boolean;
}

export function DaySummaryFooter({
  healthDelta,
  nutrientsOk,
  humidityOk,
  temperatureOk,
  lightingOk,
}: DaySummaryFooterProps) {
  const getHealthIcon = () => {
    if (healthDelta > 0) return '📈';
    if (healthDelta < 0) return '📉';
    return '➡️';
  };

  const getStatusIcon = (ok: boolean) => ok ? '✅' : '⚠️';

  return (
    <div className="day-summary-footer">
      <div className="footer-item">
        <span className="footer-icon">{getHealthIcon()}</span>
        <span className="footer-label">Health</span>
        <span className={`footer-value value-${healthDelta > 0 ? 'positive' : healthDelta < 0 ? 'negative' : 'neutral'}`}>
          {healthDelta > 0 ? '+' : ''}{healthDelta.toFixed(2)}%
        </span>
      </div>

      <div className="footer-divider"></div>

      <div className="footer-item">
        <span className="footer-icon">{getStatusIcon(nutrientsOk)}</span>
        <span className="footer-label">Nutrients</span>
      </div>

      <div className="footer-divider"></div>

      <div className="footer-item">
        <span className="footer-icon">{getStatusIcon(humidityOk)}</span>
        <span className="footer-label">Humidity</span>
      </div>

      <div className="footer-divider"></div>

      <div className="footer-item">
        <span className="footer-icon">{getStatusIcon(temperatureOk)}</span>
        <span className="footer-label">Temp</span>
      </div>

      <div className="footer-divider"></div>

      <div className="footer-item">
        <span className="footer-icon">{getStatusIcon(lightingOk)}</span>
        <span className="footer-label">Lighting</span>
      </div>
    </div>
  );
}
