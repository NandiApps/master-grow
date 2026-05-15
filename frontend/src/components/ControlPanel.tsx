import { useState, useEffect } from 'react';
import { GameClient } from '../client/GameClient';
import { AdditiveProduct } from '../types';
import '../styles/ControlPanel.css';

interface Props {
  parUmol: number;
  onParChange: (value: number) => void;
  lightHours: number;
  onLightChange: (value: number) => void;
  humidity: number;
  onHumidityChange: (value: number) => void;
  temperature: number;
  onTemperatureChange: (value: number) => void;
  selectedAdditives: Array<{ id: string; doseMl: number }>;
  onAdditivesChange: (additives: Array<{ id: string; doseMl: number }>) => void;
  onNutrientTopUp?: (topUp: { baseNutrientMl: number; phUpMl?: number; phDownMl?: number }) => void;
  gameClient: GameClient;
}

export function ControlPanel({
  parUmol,
  onParChange,
  lightHours,
  onLightChange,
  humidity,
  onHumidityChange,
  temperature,
  onTemperatureChange,
  selectedAdditives,
  onAdditivesChange,
  onNutrientTopUp,
  gameClient,
}: Props) {
  const [additives, setAdditives] = useState<AdditiveProduct[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('light');
  const [loading, setLoading] = useState(true);
  const [baseNutrientMl, setBaseNutrientMl] = useState(0);
  const [phUpMl, setPhUpMl] = useState(0);
  const [phDownMl, setPhDownMl] = useState(0);

  useEffect(() => {
    const loadAdditives = async () => {
      try {
        const data = await gameClient.getAdditives();
        setAdditives(data);
      } catch (err) {
        console.error('Failed to load additives:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAdditives();
  }, [gameClient]);

  const toggleAdditive = (additiveId: string) => {
    const existing = selectedAdditives.find(a => a.id === additiveId);
    if (existing) {
      onAdditivesChange(selectedAdditives.filter(a => a.id !== additiveId));
    } else {
      const additive = additives.find(a => a.id === additiveId);
      if (additive) {
        onAdditivesChange([
          ...selectedAdditives,
          { id: additiveId, doseMl: additive.dosagePerTank20L },
        ]);
      }
    }
  };

  const updateAdditiveDose = (additiveId: string, doseMl: number) => {
    onAdditivesChange(
      selectedAdditives.map(a =>
        a.id === additiveId ? { ...a, doseMl } : a
      )
    );
  };

  const getAdditiveCost = (additiveId: string, doseMl: number): number => {
    const additive = additives.find(a => a.id === additiveId);
    if (!additive) return 0;
    return doseMl * additive.costAud / additive.bottleSizeMl;
  };

  const totalAdditiveCost = selectedAdditives.reduce(
    (sum, app) => sum + getAdditiveCost(app.id, app.doseMl),
    0
  );

  return (
    <div className="control-panel">
      {/* Light Controls */}
      <div className="control-section">
        <button
          className="section-header"
          onClick={() => setExpandedSection(expandedSection === 'light' ? null : 'light')}
        >
          <span className="section-title">💡 Light Schedule & PAR</span>
          <span className="expand-icon">{expandedSection === 'light' ? '▼' : '▶'}</span>
        </button>

        {expandedSection === 'light' && (
          <div className="section-content">
            <div className="control-item">
              <label>Light Hours: {lightHours}h</label>
              <input
                type="range"
                min="6"
                max="24"
                value={lightHours}
                onChange={(e) => onLightChange(parseInt(e.target.value))}
                className="slider"
              />
              <div className="control-hint">
                {lightHours > 14 ? '🌱 Vegetative' : lightHours <= 12 ? '🌸 Flowering' : '⚖️ Transition'}
              </div>
            </div>

            <div className="control-item">
              <label>PAR: {parUmol} µmol/m²/s</label>
              <input
                type="range"
                min="300"
                max="1200"
                value={parUmol}
                onChange={(e) => onParChange(parseInt(e.target.value))}
                className="slider"
              />
              <div className="control-hint">
                {parUmol < 600 ? '⚠️ Low' : parUmol < 1000 ? '✓ Optimal' : '⚡ High stress'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Environment Controls */}
      <div className="control-section">
        <button
          className="section-header"
          onClick={() => setExpandedSection(expandedSection === 'env' ? null : 'env')}
        >
          <span className="section-title">🌡️ Environment</span>
          <span className="expand-icon">{expandedSection === 'env' ? '▼' : '▶'}</span>
        </button>

        {expandedSection === 'env' && (
          <div className="section-content">
            <div className="control-item">
              <label>Temperature: {temperature}°C</label>
              <input
                type="range"
                min="15"
                max="30"
                value={temperature}
                onChange={(e) => onTemperatureChange(parseInt(e.target.value))}
                className="slider"
              />
              <div className="control-hint">Optimal: 20-24°C</div>
            </div>

            <div className="control-item">
              <label>Humidity: {humidity}%</label>
              <input
                type="range"
                min="30"
                max="80"
                value={humidity}
                onChange={(e) => onHumidityChange(parseInt(e.target.value))}
                className="slider"
              />
              <div className="control-hint">
                {humidity > 70 ? '⚠️ Mold risk' : humidity < 40 ? '⚠️ Stress' : '✓ Good'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additives */}
      <div className="control-section">
        <button
          className="section-header"
          onClick={() => setExpandedSection(expandedSection === 'additives' ? null : 'additives')}
        >
          <span className="section-title">
            💊 Additives {selectedAdditives.length > 0 && `(${selectedAdditives.length})`}
          </span>
          <span className="expand-icon">{expandedSection === 'additives' ? '▼' : '▶'}</span>
        </button>

        {expandedSection === 'additives' && (
          <div className="section-content">
            {loading ? (
              <p className="loading-text">Loading additives...</p>
            ) : (
              <>
                <div className="additives-list">
                  {additives.map((additive) => {
                    const isSelected = selectedAdditives.some(a => a.id === additive.id);
                    const selectedApp = selectedAdditives.find(a => a.id === additive.id);
                    const cost = selectedApp ? getAdditiveCost(additive.id, selectedApp.doseMl) : 0;

                    return (
                      <div key={additive.id} className="additive-item">
                        <div className="additive-header">
                          <label className="additive-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAdditive(additive.id)}
                            />
                            <span className="additive-name">{additive.name}</span>
                          </label>
                          <span className="additive-type">{additive.type}</span>
                        </div>

                        {isSelected && selectedApp && (
                          <div className="additive-controls">
                            <input
                              type="range"
                              min="0"
                              max={additive.dosagePerTank20L * 2}
                              step="0.5"
                              value={selectedApp.doseMl}
                              onChange={(e) => updateAdditiveDose(additive.id, parseFloat(e.target.value))}
                              className="additive-slider"
                            />
                            <div className="additive-dose">
                              {selectedApp.doseMl.toFixed(1)}mL / ${cost.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedAdditives.length > 0 && (
                  <div className="additive-total">
                    Total Cost: ${totalAdditiveCost.toFixed(2)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Nutrient Dosing */}
      <div className="control-section">
        <button
          className="section-header"
          onClick={() => setExpandedSection(expandedSection === 'nutrients' ? null : 'nutrients')}
        >
          <span className="section-title">💧 Feed Tank</span>
          <span className="expand-icon">{expandedSection === 'nutrients' ? '▼' : '▶'}</span>
        </button>

        {expandedSection === 'nutrients' && (
          <div className="section-content">
            <div className="control-item">
              <label>Base Nutrient: {baseNutrientMl}mL (~${(baseNutrientMl * 0.05).toFixed(2)})</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={baseNutrientMl}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setBaseNutrientMl(val);
                  if (onNutrientTopUp) onNutrientTopUp({ baseNutrientMl: val, phUpMl, phDownMl });
                }}
                className="slider"
              />
              <div className="control-hint">Balanced NPK concentrate for 20L tank</div>
            </div>

            <div className="control-item">
              <label>pH Up: {phUpMl}mL</label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={phUpMl}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPhUpMl(val);
                  if (onNutrientTopUp) onNutrientTopUp({ baseNutrientMl, phUpMl: val, phDownMl });
                }}
                className="slider"
              />
            </div>

            <div className="control-item">
              <label>pH Down: {phDownMl}mL</label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={phDownMl}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPhDownMl(val);
                  if (onNutrientTopUp) onNutrientTopUp({ baseNutrientMl, phUpMl, phDownMl: val });
                }}
                className="slider"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
