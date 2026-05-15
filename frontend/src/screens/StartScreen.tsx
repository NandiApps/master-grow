import React, { useState, useEffect } from 'react';
import { GameClient } from '../client/GameClient';
import { StrainGenetics } from '../types';
import '../styles/StartScreen.css';

interface Props {
  onStartGame: (playerName: string, strainId: string, difficulty: 'beginner' | 'normal' | 'hard') => void;
}

export function StartScreen({ onStartGame }: Props) {
  const [playerName, setPlayerName] = useState('');
  const [selectedStrain, setSelectedStrain] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'normal' | 'hard'>('beginner');
  const [strains, setStrains] = useState<StrainGenetics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStrains = async () => {
      try {
        const client = new GameClient(import.meta.env.VITE_API_URL || 'http://localhost:3000');
        const data = await client.getStrains();
        setStrains(data);
        if (data.length > 0) {
          setSelectedStrain(data[0].id);
        }
      } catch (err) {
        setError('Failed to load strains');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStrains();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !selectedStrain) {
      setError('Please fill in all fields');
      return;
    }
    onStartGame(playerName, selectedStrain, difficulty);
  };

  const selectedStrainData = strains.find(s => s.id === selectedStrain);

  if (loading) {
    return <div className="start-screen"><p>Loading strains...</p></div>;
  }

  return (
    <div className="start-screen">
      <div className="start-container">
        <h1>🌱 HydroGrow</h1>
        <p className="subtitle">Cannabis Hydroponic Simulator</p>

        <form onSubmit={handleSubmit} className="start-form">
          <div className="form-group">
            <label>Player Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Select Strain</label>
            <div className="strain-list">
              {strains.map((strain) => (
                <button
                  key={strain.id}
                  type="button"
                  className={`strain-card ${selectedStrain === strain.id ? 'active' : ''}`}
                  onClick={() => setSelectedStrain(strain.id)}
                >
                  <div className="strain-name">{strain.name}</div>
                  <div className="strain-stats">
                    <span>{strain.thcPercent}% THC</span>
                    <span>{strain.floweringTimeDays}d flower</span>
                  </div>
                  <div className="strain-yield">${strain.seedCostAud}</div>
                </button>
              ))}
            </div>

            {selectedStrainData && (
              <div className="strain-detail">
                <h3>{selectedStrainData.name}</h3>
                <p className="description">
                  {selectedStrainData.seedType === 'feminized' ? '👸 Feminized' : '⚡ Autoflower'}
                  {' • '}
                  {selectedStrainData.difficulty === 'beginner' ? '🟢 Beginner' : '🟡 Intermediate'}
                </p>
                <div className="detail-grid">
                  <div>
                    <strong>THC:</strong> {selectedStrainData.thcPercent}%
                  </div>
                  <div>
                    <strong>CBD:</strong> {selectedStrainData.cbdPercent}%
                  </div>
                  <div>
                    <strong>Yield:</strong> {selectedStrainData.baseYieldGrams}g avg
                  </div>
                  <div>
                    <strong>Price:</strong> ${selectedStrainData.marketPricePerGram}/g
                  </div>
                </div>
                <p className="dominant">Dominant terpene: {selectedStrainData.terpeneProfile.dominant}</p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <div className="difficulty-buttons">
              {(['beginner', 'normal', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
                  onClick={() => setDifficulty(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="start-button">
            Start Growing
          </button>
        </form>
      </div>
    </div>
  );
}
