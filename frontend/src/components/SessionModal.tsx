import { useState } from 'react';
import { SessionManager } from '../utils/SessionManager';
import '../styles/SessionModal.css';

interface Props {
  sessionCode: string;
  gameId: string;
  onClose: () => void;
}

export function SessionModal({ sessionCode, gameId, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumptionLink = SessionManager.generateResumptionLink(
    gameId,
    sessionCode,
    window.location.origin + '/'
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    alert('Session code copied!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resumptionLink);
    alert('Resumption link copied!');
  };

  const handleEmailLink = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    try {
      // In production, this would call a backend endpoint
      // For now, show instructions
      const mailtoLink = `mailto:${email}?subject=HydroGrow Game Link&body=${encodeURIComponent(
        `Click here to resume your game:\n\n${resumptionLink}`
      )}`;
      window.location.href = mailtoLink;
      setEmailSent(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError('Failed to send email');
    }
  };

  return (
    <div className="session-modal-overlay" onClick={onClose}>
      <div className="session-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 Game Session</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          <div className="session-section">
            <h3>Session Code</h3>
            <p className="description">Use this code to resume your game on any device.</p>
            <div className="code-display">
              <input type="text" readOnly value={sessionCode} />
              <button className="copy-btn" onClick={handleCopyCode}>📋 Copy</button>
            </div>
          </div>

          <div className="session-section">
            <h3>📧 Email Resumption Link</h3>
            <p className="description">Send yourself a link to resume your game anytime.</p>
            <div className="email-input-group">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="send-btn"
                onClick={handleEmailLink}
                disabled={!email}
              >
                {emailSent ? '✓ Sent' : 'Send'}
              </button>
            </div>
          </div>

          <div className="session-section">
            <h3>Direct Link</h3>
            <div className="link-display">
              <input type="text" readOnly value={resumptionLink} />
              <button className="copy-btn" onClick={handleCopyLink}>📋 Copy</button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="instructions">
            <h4>How to Resume:</h4>
            <ol>
              <li>Enter your session code when prompted</li>
              <li>Or click the email link sent to you</li>
              <li>Your game will load automatically</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
