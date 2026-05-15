import { useState } from 'react';
import '../styles/SeedShop.css';

interface Strain {
  id: string;
  name: string;
  thcPercent: number;
  cbdPercent: number;
  yieldGramsTypical: number;
  floweringTimeDays: number;
  seedCostAud: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SeedShopProps {
  strains: Strain[];
  currentCash: number;
  onSelectStrain: (strainId: string) => void;
  onClose: () => void;
}

export function SeedShop({
  strains,
  currentCash,
  onSelectStrain,
  onClose,
}: SeedShopProps) {
  const [selectedStrain, setSelectedStrain] = useState<string | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#27ae60';
      case 'medium':
        return '#f39c12';
      case 'hard':
        return '#e74c3c';
      default:
        return '#808080';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '✓ Easy';
      case 'medium':
        return '⚠ Medium';
      case 'hard':
        return '🔥 Hard';
      default:
        return '❓ Unknown';
    }
  };

  const handleSelect = (strainId: string) => {
    const strain = strains.find(s => s.id === strainId);
    if (strain && strain.seedCostAud <= currentCash) {
      onSelectStrain(strainId);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="seed-shop modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="shop-header">
          <h2>🌱 Seed Shop</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="shop-intro">
          <p>Select your next strain. You have <strong>${Math.round(currentCash)}</strong> AUD available.</p>
        </div>

        <div className="strain-grid">
          {strains.map((strain) => {
            const isAffordable = strain.seedCostAud <= currentCash;
            const isSelected = selectedStrain === strain.id;

            return (
              <div
                key={strain.id}
                className={`strain-card ${isSelected ? 'selected' : ''} ${!isAffordable ? 'disabled' : ''}`}
                onClick={() => isAffordable && setSelectedStrain(strain.id)}
              >
                <div className="strain-name">{strain.name}</div>

                <div className="strain-stats">
                  <div className="stat-row">
                    <span className="stat-label">THC</span>
                    <span className="stat-value">{strain.thcPercent}%</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">CBD</span>
                    <span className="stat-value">{strain.cbdPercent}%</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Yield</span>
                    <span className="stat-value">{strain.yieldGramsTypical}g</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Flower</span>
                    <span className="stat-value">{strain.floweringTimeDays}d</span>
                  </div>
                </div>

                <div className="strain-meta">
                  <div className="difficulty" style={{ color: getDifficultyColor(strain.difficulty) }}>
                    {getDifficultyLabel(strain.difficulty)}
                  </div>
                  <div className={`cost ${isAffordable ? 'affordable' : 'unaffordable'}`}>
                    ${strain.seedCostAud.toFixed(2)}
                  </div>
                </div>

                {!isAffordable && (
                  <div className="insufficient-funds">
                    Need ${(strain.seedCostAud - currentCash).toFixed(2)} more
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedStrain && (
          <button
            className="purchase-button"
            onClick={() => handleSelect(selectedStrain)}
          >
            Purchase & Start Growing
          </button>
        )}

        {!selectedStrain && (
          <button
            className="purchase-button disabled"
            disabled
          >
            Select a strain to continue
          </button>
        )}
      </div>
    </div>
  );
}
