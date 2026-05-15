import { HarvestAssessment } from '../types';
import '../styles/HarvestAssessmentModal.css';

interface HarvestAssessmentModalProps {
  assessment: HarvestAssessment;
  strainName: string;
  onClose: () => void;
}

export function HarvestAssessmentModal({
  assessment,
  onClose,
}: HarvestAssessmentModalProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S':
        return '#FFD700';
      case 'A':
        return '#90EE90';
      case 'B':
        return '#87CEEB';
      case 'C':
        return '#FFB6C1';
      default:
        return '#808080';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="harvest-assessment-modal modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="assessment-header">
          <h2>🌾 Harvest Assessment</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Quality Tier */}
        <div className="quality-section">
          <div className="quality-tier-display" style={{ color: getTierColor(assessment.yieldQualityTier) }}>
            <div className="tier-letter">{assessment.yieldQualityTier}</div>
            <div className="tier-label">Grade</div>
          </div>
          <div className="quality-score">
            Quality Score: <strong>{Math.round(assessment.yieldQualityScore)}/100</strong>
          </div>
        </div>

        {/* Yield Information */}
        <div className="yield-section">
          <h3>📊 Yield Information</h3>
          <div className="yield-grid">
            <div className="yield-stat">
              <span className="label">Actual Yield:</span>
              <span className="value">{Math.round(assessment.yieldGrams * 10) / 10}g</span>
            </div>
            <div className="yield-stat">
              <span className="label">Days Past Peak:</span>
              <span className="value">{assessment.harvestDaysPostPeak}</span>
            </div>
            <div className="yield-stat">
              <span className="label">Quality Loss:</span>
              <span className="value">-{Math.round(assessment.postPeakQualityLoss)}%</span>
            </div>
          </div>
        </div>

        {/* Cannabinoid & Trichome Profile */}
        <div className="cannabinoid-section">
          <h3>🧪 Cannabinoid & Trichome Profile</h3>
          <div className="profile-grid">
            <div className="profile-stat">
              <span className="label">THC:</span>
              <span className="value">{Math.round(assessment.cannabinoidPercent * 10) / 10}%</span>
            </div>
            <div className="profile-stat">
              <span className="label">Clear Trichomes:</span>
              <span className="value">{Math.round(assessment.trichomeProfile.clearPercent)}%</span>
            </div>
            <div className="profile-stat">
              <span className="label">Cloudy Trichomes:</span>
              <span className="value">{Math.round(assessment.trichomeProfile.cloudyPercent)}%</span>
            </div>
            <div className="profile-stat">
              <span className="label">Amber Trichomes:</span>
              <span className="value">{Math.round(assessment.trichomeProfile.amberPercent)}%</span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="revenue-section">
          <h3>💰 Revenue Breakdown</h3>
          <div className="revenue-breakdown">
            <div className="revenue-line">
              <span>Base Price × Yield:</span>
              <span className="value">${Math.round(assessment.baseRevenue)}</span>
            </div>
            <div className="revenue-line">
              <span>Quality Multiplier ({assessment.qualityMultiplier.toFixed(2)}x):</span>
              <span className="value">${Math.round(assessment.qualityAdjustedRevenue)}</span>
            </div>
            {assessment.deficiencyPenalties > 0 && (
              <div className="revenue-line penalty">
                <span>Deficiency Penalties:</span>
                <span className="value">-${Math.round(assessment.deficiencyPenalties)}</span>
              </div>
            )}
            {assessment.diseasePenalties > 0 && (
              <div className="revenue-line penalty">
                <span>Disease Penalties:</span>
                <span className="value">-${Math.round(assessment.diseasePenalties)}</span>
              </div>
            )}
            <div className="revenue-line total">
              <span>💵 Final Payment:</span>
              <span className="value total-amount">${Math.round(assessment.finalPayment)}</span>
            </div>
          </div>
        </div>

        {/* Optimal Comparison */}
        <div className="optimal-section">
          <h3>🎯 Optimal Scenario</h3>
          <p className="optimal-text">
            With perfect conditions, this grow could have achieved:
          </p>
          <div className="optimal-stats">
            <div className="stat">
              <span className="label">Optimal Yield:</span>
              <span className="value">{Math.round(assessment.optimalHarvestWould.yieldGrams * 10) / 10}g</span>
            </div>
            <div className="stat">
              <span className="label">Optimal Quality:</span>
              <span className="value">{assessment.optimalHarvestWould.qualityScore}/100</span>
            </div>
            <div className="stat">
              <span className="label">Optimal Revenue:</span>
              <span className="value">${Math.round(assessment.optimalHarvestWould.revenue)}</span>
            </div>
          </div>
        </div>

        {/* Advice */}
        <div className="advice-section">
          <div className="advice-subsection">
            <h4>✅ What Went Well</h4>
            <ul>
              {assessment.advice.whatWentWell.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="advice-subsection">
            <h4>📋 What to Improve</h4>
            <ul>
              {assessment.advice.whatToImprove.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="advice-subsection">
            <h4>🌱 Next Grow Suggestions</h4>
            <ul>
              {assessment.advice.nextGrowSuggestions.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <button className="close-button" onClick={onClose}>
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
