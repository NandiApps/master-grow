import { useState, useEffect } from 'react';
import { GameClient } from '../client/GameClient';
import '../styles/ControlPanel.css';

interface ControlPanelProps {
  parUmol: number;
  onParChange: (value: number) => void;
  lightHours: number;
  onLightChange: (value: number) => void;
  humidity: number;
  onHumidityChange: (value: number) => void;
  temperature: number;
  onTemperatureChange: (value: number) => void;
  waterTemperature: number;
  onWaterTemperatureChange: (value: number) => void;
  co2Ppm: number;
  onCo2Change: (value: number) => void;
  exhaustFanPercent: number;
  onExhaustFanChange: (value: number) => void;
  phUp: number;
  onPhUpChange: (value: number) => void;
  phDown: number;
  onPhDownChange: (value: number) => void;
  nutrientTopUp: number;
  onNutrientTopUpChange: (value: number) => void;
  selectedAdditives: Array<{ id: string; doseMl: number }>;
  onAdditivesChange: (additives: Array<{ id: string; doseMl: number }>) => void;
  gameClient: GameClient;
  growthStage?: string;
}

interface Additive {
  id: string;
  name: string;
  bottleSizeMl: number;
  dosagePerTank20L: number;
}

export function ControlPanel({ parUmol, onParChange, lightHours, onLightChange, humidity, onHumidityChange, temperature, onTemperatureChange, waterTemperature, onWaterTemperatureChange, co2Ppm, onCo2Change, exhaustFanPercent, onExhaustFanChange, phUp, onPhUpChange, phDown, onPhDownChange, nutrientTopUp, onNutrientTopUpChange, selectedAdditives, onAdditivesChange, gameClient, growthStage }: ControlPanelProps) {
  const [additives, setAdditives] = useState<Additive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdditives = async () => {
      try {
        const data = await gameClient.getAdditives();
        setAdditives(data);
      } catch (error) {
        console.error('Failed to load additives:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAdditives();
  }, [gameClient]);

  const toggleAdditive = (additiveId: string) => {
    const additive = additives.find(a => a.id === additiveId);
    if (!additive) return;
    const existingIndex = selectedAdditives.findIndex(a => a.id === additiveId);
    if (existingIndex >= 0) {
      onAdditivesChange(selectedAdditives.filter((_, i) => i !== existingIndex));
    } else {
      onAdditivesChange([...selectedAdditives, { id: additiveId, doseMl: additive.dosagePerTank20L }]);
    }
  };

  const updateAdditiveDose = (additiveId: string, doseMl: number) => {
    onAdditivesChange(selectedAdditives.map(a => a.id === additiveId ? { ...a, doseMl } : a));
  };

  const isAdditiveSelected = (additiveId: string) => selectedAdditives.some(a => a.id === additiveId);

  // Stage-specific guidance for the control panel banner (Polish #20)
  const stageHint: Record<string, { icon: string; text: string; color: string }> = {
    seedling:      { icon: '🌱', text: 'Seedling: Keep PAR low (200–400 µmol), EC 0.8–1.2, pH 5.8–6.2. Establish roots before pushing nutrients.', color: 'rgba(100,200,100,0.15)' },
    vegetative:    { icon: '🍃', text: 'Vegetative: Target 18h light. Boost N (Nutrient Top-Up + Grow Formula N+). Switch to 12h light to trigger flowering.', color: 'rgba(80,160,80,0.15)' },
    early_flower:  { icon: '🌸', text: 'Early Flower: Switch to 12h ON. Reduce N, add Bloom Formula to boost P/K. Maintain humidity 40–50%.', color: 'rgba(200,100,150,0.15)' },
    late_flower:   { icon: '🌺', text: 'Late Flower: Maintain P/K high, cut N further. Lower humidity to 40–45% to prevent botrytis. Inspect trichomes daily.', color: 'rgba(200,80,80,0.15)' },
    harvest_ready: { icon: '🌾', text: 'Harvest Ready: Flush tank (plain pH water only, 3–5 days). Harvest when 70%+ trichomes are cloudy.', color: 'rgba(240,180,50,0.15)' },
  };
  const hint = growthStage ? stageHint[growthStage] : null;

  return (
    <div className="control-panel">
      {hint && (
        <div style={{
          background: hint.color,
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '0.6rem 0.8rem',
          marginBottom: '0.75rem',
          fontSize: '0.8rem',
          color: '#ccc',
          lineHeight: '1.4',
        }}>
          <strong style={{ color: '#fff' }}>{hint.icon} {growthStage?.replace('_', ' ').toUpperCase()}</strong>
          <p style={{ margin: '0.25rem 0 0' }}>{hint.text}</p>
        </div>
      )}
      <h3 className="control-title">🎮 Daily Controls</h3>
      <div className="control-section">
        <label className="control-label"><span className="label-text">☀️ Light Intensity (PAR)</span><span className="value-display">{parUmol} µmol/m²/s</span></label>
        <input type="range" min="200" max="1500" step="50" value={parUmol} onChange={e => onParChange(Number(e.target.value))} className="control-slider" />
        <div className="range-hints"><small>200</small><small>800</small><small>1500</small></div>
      </div>
      <div className="control-section">
        <label className="control-label"><span className="label-text">🕐 Light Schedule</span><span className="value-display">{lightHours}h ON / {24 - lightHours}h OFF</span></label>
        <input type="range" min="8" max="24" step="1" value={lightHours} onChange={e => onLightChange(Number(e.target.value))} className="control-slider" />
        <div className="range-hints"><small>8h</small><small>12h</small><small>24h</small></div>
      </div>
      <div className="control-section">
        <label className="control-label"><span className="label-text">🌡️ Air Temperature</span><span className="value-display">{temperature}°C</span></label>
        <input type="range" min="15" max="30" step="0.5" value={temperature} onChange={e => onTemperatureChange(Number(e.target.value))} className="control-slider" />
        <div className="range-hints"><small>15°C</small><small>22°C</small><small>30°C</small></div>
      </div>
      <div className="control-section">
        <label className="control-label"><span className="label-text">💨 Humidity</span><span className="value-display">{humidity}%</span></label>
        <input type="range" min="30" max="80" step="1" value={humidity} onChange={e => onHumidityChange(Number(e.target.value))} className="control-slider" />
        <div className="range-hints"><small>30%</small><small>60%</small><small>80%</small></div>
      </div>
      <div className="control-section">
        <label className="control-label"><span className="label-text">🌊 Water Temperature</span><span className="value-display">{waterTemperature}°C</span></label>
        <input type="range" min="18" max="24" step="0.5" value={waterTemperature} onChange={e => onWaterTemperatureChange(Number(e.target.value))} className="control-slider" />
        <div className="range-hints"><small>18°C</small><small>21°C</small><small>24°C</small></div>
        <small style={{ color: '#999', display: 'block', marginTop: '0.5rem' }}>Optimal: 18–22°C (prevents root rot)</small>
      </div>
      <div className="control-section">
        <label className="control-label"><span className="label-text">🌫️ CO₂ (ppm)</span><span className="value-display">{co2Ppm} ppm</span></label>
        <input type="range" min="400" max="1500" step="50" value={co2Ppm} onChange={e => onCo2Change(Number(e.target.value))} className="control-slider" />
        <div className="range-hints"><small>400 (ambient)</small><small>1000</small><small>1500 (max)</small></div>
        <small style={{ color: '#999', display: 'block', marginTop: '0.5rem' }}>Higher CO₂ during flower boosts yield</small>
      </div>
      <div className="control-section">
        <label className="control-label"><span className="label-text">🌪️ Exhaust Fan</span><span className="value-display">{exhaustFanPercent}%</span></label>
        <input type="range" min="0" max="100" step="5" value={exhaustFanPercent} onChange={e => onExhaustFanChange(Number(e.target.value))} className="control-slider" />
        <div className="range-hints"><small>0% (off)</small><small>50%</small><small>100% (max)</small></div>
        <small style={{ color: '#999', display: 'block', marginTop: '0.5rem' }}>Raises air circulation, lowers humidity</small>
      </div>
      <div className="control-section">
        <label className="control-label"><span className="label-text">🧪 pH Adjustments</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}><span style={{ fontSize: '0.85rem' }}>pH Up (mL)</span><span style={{ float: 'right', fontWeight: 'bold' }}>{phUp}</span></label>
            <input type="range" min="0" max="50" step="1" value={phUp} onChange={e => onPhUpChange(Number(e.target.value))} className="control-slider" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}><span style={{ fontSize: '0.85rem' }}>pH Down (mL)</span><span style={{ float: 'right', fontWeight: 'bold' }}>{phDown}</span></label>
            <input type="range" min="0" max="50" step="1" value={phDown} onChange={e => onPhDownChange(Number(e.target.value))} className="control-slider" />
          </div>
        </div>
      </div>
      <div className="control-section">
        <label className="control-label"><span className="label-text">🌱 Nutrient Top-Up</span><span className="value-display">{nutrientTopUp} mL</span></label>
        <input type="range" min="0" max="100" step="1" value={nutrientTopUp} onChange={e => onNutrientTopUpChange(Number(e.target.value))} className="control-slider" />
        <div className="range-hints"><small>0 mL</small><small>50 mL</small><small>100 mL</small></div>
        <small style={{ color: '#999', display: 'block', marginTop: '0.5rem' }}>Base nutrient concentrate (NPK 50:20:40)</small>
      </div>
      <div className="control-section additives-section">
        <label className="control-label"><span className="label-text">💊 Additives</span></label>
        {loading ? <p className="loading-text">Loading products...</p> : additives.length > 0 ? <div className="additives-grid">{additives.map(additive => {
          const isSelected = isAdditiveSelected(additive.id);
          const selectedAdditive = selectedAdditives.find(a => a.id === additive.id);
          return <div key={additive.id} className={`additive-card ${isSelected ? 'selected' : ''}`}><button className="additive-toggle" onClick={() => toggleAdditive(additive.id)} title={additive.name}>{isSelected ? '✓' : '+'}</button><div className="additive-info"><span className="additive-name">{additive.name}</span>{isSelected && selectedAdditive && <div className="additive-dose"><label>Dose (mL):</label><input type="number" min="0" max={additive.bottleSizeMl} step="1" value={selectedAdditive.doseMl} onChange={e => updateAdditiveDose(additive.id, Number(e.target.value))} className="dose-input" onClick={e => e.stopPropagation()} /></div>}</div></div>;
        })}</div> : <p className="no-additives">No additives available</p>}
      </div>
      <div className="control-summary">
        <div className="summary-row"><span>Selected Additives:</span><span className="summary-value">{selectedAdditives.length}</span></div>
        <div className="summary-row"><span>Total Dose:</span><span className="summary-value">{selectedAdditives.reduce((sum, a) => sum + a.doseMl, 0)} mL</span></div>
      </div>

      <div className="control-section" style={{ backgroundColor: 'rgba(100, 150, 255, 0.1)', borderLeft: '4px solid #6496ff' }}>
        <label className="control-label"><span className="label-text">💧 Tank EC Management</span></label>
        <small style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
          <strong>EC dropping?</strong> Use 🌱 Nutrient Top-Up slider to add base nutrient (10-20 mL every 7-10 days)
        </small>
        <small style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
          <strong>EC too high?</strong> Use → Week button to skip 7 days and wait for plant uptake, OR reduce nutrient additions
        </small>
        <p style={{ fontSize: '11px', color: '#888', margin: '0.5rem 0' }}>
          Target: VEG 1.3–1.7 mS/cm | FLOWER 1.6–2.0 mS/cm | Use feedback in 📊 Dashboard to monitor
        </p>
      </div>
    </div>
  );
}
