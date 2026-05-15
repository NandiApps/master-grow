import { HarvestAssessment } from '../types';
import '../styles/PaymentScreen.css';

interface PaymentScreenProps {
  assessment: HarvestAssessment;
  strainName: string;
  currentCash: number;
  onContinue: () => void;
}

export function PaymentScreen({
  assessment,
  strainName,
  currentCash,
  onContinue,
}: PaymentScreenProps) {
  const isExcellent = assessment.yieldQualityScore >= 90;
  const isGood = assessment.yieldQualityScore >= 75;
  const isAverage = assessment.yieldQualityScore >= 60;

  return (
    <div className="modal-overlay" onClick={onContinue}>
      <div className="payment-screen modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="payment-header">
          <h1>💵 Harvest Payment</h1>
          <p className="harvest-summary">
            {strainName} | {Math.round(assessment.yieldGrams * 10) / 10}g | Grade {assessment.yieldQualityTier}
          </p>
        </div>

        {/* Payment Message */}
        <div className={`payment-message ${isExcellent ? 'excellent' : isGood ? 'good' : isAverage ? 'average' : 'poor'}`}>
          {isExcellent && (
            <div>
              <h2>🏆 Excellent Harvest!</h2>
              <p>Outstanding quality and yield. Premium market prices achieved!</p>
            </div>
          )}
          {!isExcellent && isGood && (
            <div>
              <h2>😊 Good Harvest</h2>
              <p>Quality production with solid returns. Well managed grow!</p>
            </div>
          )}
          {!isExcellent && !isGood && isAverage && (
            <div>
              <h2>📊 Average Harvest</h2>
              <p>Acceptable yield and quality. Room for improvement next cycle.</p>
            </div>
          )}
          {!isAverage && (
            <div>
              <h2>⚠️ Below Average Harvest</h2>
              <p>Lower yields and quality. Consider adjustments for next grow.</p>
            </div>
          )}
        </div>

        {/* Payment Breakdown */}
        <div className="payment-breakdown">
          <div className="breakdown-row base">
            <span className="label">Base Value</span>
            <span className="amount">${Math.round(assessment.baseRevenue)}</span>
          </div>

          <div className="breakdown-section">
            <h3>Quality Adjustments</h3>
            <div className="breakdown-row modifier">
              <span className="label">Quality Score: {Math.round(assessment.yieldQualityScore)}/100</span>
              <span className="amount multiplier">×{assessment.qualityMultiplier.toFixed(2)}</span>
            </div>
            <div className="breakdown-row adjusted">
              <span className="label">Quality-Adjusted Value</span>
              <span className="amount">${Math.round(assessment.qualityAdjustedRevenue)}</span>
            </div>
          </div>

          {(assessment.deficiencyPenalties > 0 || assessment.diseasePenalties > 0) && (
            <div className="breakdown-section penalties">
              <h3>Deductions</h3>
              {assessment.deficiencyPenalties > 0 && (
                <div className="breakdown-row deduction">
                  <span className="label">Nutrient Deficiencies</span>
                  <span className="amount">-${Math.round(assessment.deficiencyPenalties)}</span>
                </div>
              )}
              {assessment.diseasePenalties > 0 && (
                <div className="breakdown-row deduction">
                  <span className="label">Disease Damage</span>
                  <span className="amount">-${Math.round(assessment.diseasePenalties)}</span>
                </div>
              )}
            </div>
          )}

          <div className="breakdown-row final-payment">
            <span className="label">💰 Final Payment</span>
            <span className="amount final">${Math.round(assessment.finalPayment)}</span>
          </div>
        </div>

        {/* Cash Update */}
        <div className="cash-update">
          <div className="cash-stat">
            <span className="label">Previous Cash:</span>
            <span className="amount">${Math.round(currentCash - assessment.finalPayment)}</span>
          </div>
          <div className="cash-stat">
            <span className="label">Payment Received:</span>
            <span className="amount positive">+${Math.round(assessment.finalPayment)}</span>
          </div>
          <div className="cash-stat total">
            <span className="label">Current Cash:</span>
            <span className="amount">${Math.round(currentCash)}</span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h3>🌱 Next Steps</h3>
          <p>Your harvest has been sold. Ready to start a new grow cycle?</p>
          <p className="subtext">Next: Select a new strain and begin another cycle.</p>
        </div>

        <button className="continue-button" onClick={onContinue}>
          Continue to Seed Shop →
        </button>
      </div>
    </div>
  );
}
