import { useState, useEffect } from 'react';
import { GameClient } from '../client/GameClient';
import { GameStateResponse, GameDayActionRequest } from '../types';
import { MonitorPanel } from '../components/MonitorPanel';
import { ControlPanel } from '../components/ControlPanel';
import { TrichomeInspector } from '../components/TrichomeInspector';
import { SessionModal } from '../components/SessionModal';
import '../styles/GameScreen.css';

interface Props {
  gameClient: GameClient;
  sessionCode: string;
  onQuit: () => void;
}

export function GameScreen({ gameClient, sessionCode, onQuit }: Props) {
  const [state, setState] = useState<GameStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTrichomeModal, setShowTrichomeModal] = useState(false);

  // Control states
  const [parUmol, setParUmol] = useState(600);
  const [lightHours, setLightHours] = useState(18);
  const [humidity, setHumidity] = useState(60);
  const [temperature, setTemperature] = useState(22);
  const [selectedAdditives, setSelectedAdditives] = useState<Array<{ id: string; doseMl: number }>>([]);

  useEffect(() => {
    const loadState = async () => {
      try {
        const data = await gameClient.getState();
        setState(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load game state');
        console.error(err);
      }
    };

    loadState();
  }, [gameClient]);

  const handleExecuteDay = async () => {
    if (!state) return;

    try {
      setLoading(true);
      const actions: GameDayActionRequest = {
        parUmol,
        lightScheduleHoursOn: lightHours,
        lightScheduleHoursOff: 24 - lightHours,
        waterTemperatureTarget: temperature,
        humidityTarget: humidity,
        additiveApplications: selectedAdditives.map(app => ({
          additiveId: app.id,
          doseMl: app.doseMl,
        })),
      };

      const newState = await gameClient.executeGameDay(actions);
      setState(newState);
      setSelectedAdditives([]); // Clear additives after application
    } catch (err) {
      setError('Failed to execute day');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHarvest = async (trichomes: { clear: number; cloudy: number; amber: number }) => {
    if (!state) return;

    try {
      setLoading(true);
      const result = await gameClient.harvest({
        clearTrichomesPercent: trichomes.clear,
        cloudyTrichomesPercent: trichomes.cloudy,
        amberTrichomesPercent: trichomes.amber,
        harvestChoice: 'balanced',
      });

      alert(`Harvest complete!\n\nYield: ${result.finalYieldGrams}g (${result.harvestQuality})\nRevenue: $${result.revenue}\nProfit: $${result.profit}`);
      onQuit();
    } catch (err) {
      setError('Failed to harvest');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !state) {
    return <div className="game-screen"><p>Loading game...</p></div>;
  }

  if (error) {
    return (
      <div className="game-screen">
        <div className="error-panel">{error}</div>
      </div>
    );
  }

  if (!state) return null;

  const isFlowering = state.plant.flowering.floweringInitiated;
  const isHarvestReady = state.plant.growthStage.stage === 'harvest_ready';

  return (
    <div className="game-screen">
      <div className="game-header">
        <h2>{state.gameState.cycleInformation.selectedStrainName}</h2>
        <div className="header-stats">
          <span className="day-counter">Day {state.gameState.currentGameDay}</span>
          <span className="cash">${state.gameState.economics.currentCashAud.toFixed(0)}</span>
        </div>
        <div className="header-buttons">
          <button className="session-btn" onClick={() => setShowSessionModal(true)}>
            Code: {sessionCode}
          </button>
          <button className="quit-btn" onClick={onQuit}>✕</button>
        </div>
      </div>

      <MonitorPanel state={state} />

      <ControlPanel
        parUmol={parUmol}
        onParChange={setParUmol}
        lightHours={lightHours}
        onLightChange={setLightHours}
        humidity={humidity}
        onHumidityChange={setHumidity}
        temperature={temperature}
        onTemperatureChange={setTemperature}
        selectedAdditives={selectedAdditives}
        onAdditivesChange={setSelectedAdditives}
        gameClient={gameClient}
      />

      <div className="action-panel">
        <button
          className="primary-btn"
          onClick={handleExecuteDay}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Execute Day'}
        </button>

        {isFlowering && (
          <button
            className="secondary-btn"
            onClick={() => setShowTrichomeModal(true)}
          >
            🔬 Inspect Trichomes
          </button>
        )}

        {isHarvestReady && (
          <button
            className="harvest-btn"
            onClick={() => setShowTrichomeModal(true)}
          >
            🌾 Harvest Ready
          </button>
        )}
      </div>

      {showSessionModal && (
        <SessionModal
          sessionCode={sessionCode}
          gameId={gameClient.getGameId() || ''}
          onClose={() => setShowSessionModal(false)}
        />
      )}

      {showTrichomeModal && (
        <TrichomeInspector
          trichomes={state.plant.trichomeMaturity}
          onHarvest={handleHarvest}
          onClose={() => setShowTrichomeModal(false)}
          isHarvestReady={isHarvestReady}
        />
      )}
    </div>
  );
}
