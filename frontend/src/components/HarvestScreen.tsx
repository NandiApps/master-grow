import { useState } from 'react';
import '../styles/HarvestScreen.css';

interface HarvestResult {
  finalYieldGrams: number;
  harvestQuality: string;
  revenue: string;
  profit: string;
  trichomeBreakdown: {
    clear: number;
    cloudy: number;
    amber: number;
  };
}

interface Props {
  result: HarvestResult;
  onNextCycle: () => void;
  onQuit: () => void;
}

export function HarvestScreen({ result, onNextCycle, onQuit }: Props) {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'breakdown'>('summary');

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'premium':
        return '#FFD700';
      case 'aged':
        return '#B8860B';
      default:
        return '#66BB6A';
    }
  };

  const getQualityEmoji = (quality: string) => {
    switch (quality) {
      case 'premium':
        return '⭐';
      case 'aged':
        return '🍂';
      default:
        return '✓';
    }
  };

  const profitNum = parseFloat(result.profit);
  const isProfitable = profitNum > 0;

  return (
    <div className="harvest-screen-overlay">
      <div className="harvest-screen">
        <div className="harvest-header">
          <div className="harvest-title">🌾 Harvest Complete</div>
          <div className="harvest-subtitle">End of Cycle</div>
        </div>

        <div className="harvest-quality">
          <div className="quality-badge" style={{ borderColor: getQualityColor(result.harvestQuality) }}>
            <span className="quality-emoji">{getQualityEmoji(result.harvestQuality)}</span>
            <div className="quality-text">
              <div className="quality-label">{result.harvestQuality.toUpperCase()}</div>
              <div className="quality-desc">
                {result.harvestQuality === 'premium' && 'Peak potency harvest'}
                {result.harvestQuality === 'aged' && 'Full trichome maturity'}
                {result.harvestQuality === 'standard' && 'Standard maturity'}
              </div>
            </div>
          </div>
        </div>

        <div className="harvest-tabs">
          <button
            className={`tab-button ${selectedTab === 'summary' ? 'active' : ''}`}
            onClick={() => setSelectedTab('summary')}
          >
            Summary
          </button>
          <button
            className={`tab-button ${selectedTab === 'breakdown' ? 'active' : ''}`}
            onClick={() => setSelectedTab('breakdown')}
          >
            Details
          </button>
        </div>

        {selectedTab === 'summary' && (
          <div className="harvest-summary">
            <div className="stat-group">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-label">Final Yield</div>
                  <div className="stat-value">{result.finalYieldGrams}g</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-label">Revenue</div>
                  <div className="stat-value">${result.revenue}</div>
                </div>
              </div>
            </div>

            <div className="profit-card" style={{ borderColor: isProfitable ? '#4CAF50' : '#F44336' }}>
              <div className="profit-label">
                {isProfitable ? 'Profit' : 'Loss'}
              </div>
              <div
                className="profit-value"
                style={{ color: isProfitable ? '#4CAF50' : '#F44336' }}
              >
                {isProfitable ? '+' : ''} ${result.profit}
              </div>
              {isProfitable ? (
                <div className="profit-sentiment">🎉 Successful grow!</div>
              ) : (
                <div className="profit-sentiment">💧 Break even next time</div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'breakdown' && (
          <div className="harvest-breakdown">
            <div className="trichome-section">
              <h3>Trichome Profile</h3>
              <div className="trichome-bars">
                <div className="trichome-bar">
                  <div className="trichome-label">
                    <span>Clear</span>
                    <span>{result.trichomeBreakdown.clear}%</span>
                  </div>
                  <div className="bar-container">
                    <div
                      className="bar-fill clear"
                      style={{ width: `${result.trichomeBreakdown.clear}%` }}
                    />
                  </div>
                </div>

                <div className="trichome-bar">
                  <div className="trichome-label">
                    <span>Cloudy</span>
                    <span>{result.trichomeBreakdown.cloudy}%</span>
                  </div>
                  <div className="bar-container">
                    <div
                      className="bar-fill cloudy"
                      style={{ width: `${result.trichomeBreakdown.cloudy}%` }}
                    />
                  </div>
                </div>

                <div className="trichome-bar">
                  <div className="trichome-label">
                    <span>Amber</span>
                    <span>{result.trichomeBreakdown.amber}%</span>
                  </div>
                  <div className="bar-container">
                    <div
                      className="bar-fill amber"
                      style={{ width: `${result.trichomeBreakdown.amber}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="insights">
              <h3>Insights</h3>
              <ul className="insights-list">
                {result.trichomeBreakdown.cloudy > 50 && (
                  <li>✓ Excellent cannabinoid profile for potency</li>
                )}
                {result.trichomeBreakdown.amber > 20 && (
                  <li>✓ Higher CBN content for relaxation</li>
                )}
                {result.finalYieldGrams > 50 && (
                  <li>✓ Strong yield — optimize next cycle for quality</li>
                )}
                {isProfitable && (
                  <li>✓ Profitable grow — expenses well managed</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="harvest-actions">
          <button className="action-button primary" onClick={onNextCycle}>
            Start Next Cycle
          </button>
          <button className="action-button secondary" onClick={onQuit}>
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
