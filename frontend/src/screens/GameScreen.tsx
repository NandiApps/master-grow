import { useState, useEffect } from 'react';
import { GameClient } from '../client/GameClient';
import { GameStateResponse, GameDayActionRequest, HarvestAssessment, StrainGenetics } from '../types';
import { DashboardPanel } from '../components/DashboardPanel';
import { ControlPanel } from '../components/ControlPanel';
import { PlantVisual } from '../components/PlantVisual';
import { PlantStatusCard } from '../components/PlantStatusCard';
import { TrichomeInspector } from '../components/TrichomeInspector';
import { SessionModal } from '../components/SessionModal';
import { HarvestScreen } from '../components/HarvestScreen';
import { DaySummaryFooter } from '../components/DaySummaryFooter';
import { HarvestButton } from '../components/HarvestButton';
import { HarvestAssessmentModal } from '../components/HarvestAssessmentModal';
import { PaymentScreen } from '../components/PaymentScreen';
import { SeedShop } from '../components/SeedShop';
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
  const [harvestResult, setHarvestResult] = useState<any | null>(null);

  // Harvest flow state
  const [harvestFlowStage, setHarvestFlowStage] = useState<'none' | 'assessment' | 'payment' | 'seed-shop'>('none');
  const [harvestAssessment, setHarvestAssessment] = useState<HarvestAssessment | null>(null);

  // Multi-day advancement state
  const [isAdvancingDays, setIsAdvancingDays] = useState(false);

  // Strains state
  const [availableStrains, setAvailableStrains] = useState<StrainGenetics[]>([]);

  // Control states
  const [parUmol, setParUmol] = useState(600);
  const [lightHours, setLightHours] = useState(18);
  const [humidity, setHumidity] = useState(60);
  const [temperature, setTemperature] = useState(22);
  const [waterTemperature, setWaterTemperature] = useState(20);
  const [co2Ppm, setCo2Ppm] = useState(400);
  const [exhaustFanPercent, setExhaustFanPercent] = useState(50);
  const [phUp, setPhUp] = useState(0);
  const [phDown, setPhDown] = useState(0);
  const [nutrientTopUp, setNutrientTopUp] = useState(0);
  const [selectedAdditives, setSelectedAdditives] = useState<Array<{ id: string; doseMl: number }>>([]);

  useEffect(() => {
    const loadState = async () => {
      try {
        const data = await gameClient.getState();
        setState(data);

        // Load available strains
        const strains = await gameClient.getStrains();
        setAvailableStrains(strains);

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
        waterTemperatureCelsius: waterTemperature,
        co2TargetPpm: co2Ppm,
        exhaustFanPercent: exhaustFanPercent,
        humidityTarget: humidity,
        nutrientTopUp: {
          baseNutrientMl: nutrientTopUp,
          phUpMl: phUp,
          phDownMl: phDown,
        },
        additiveApplications: selectedAdditives.map(app => ({
          additiveId: app.id,
          doseMl: app.doseMl,
        })),
      };

      const newState = await gameClient.executeGameDay(actions);
      setState(newState);
      setSelectedAdditives([]); // Clear additives after application
      setPhUp(0); // Reset pH adjustments
      setPhDown(0);
      setNutrientTopUp(0); // Reset nutrient top-up
    } catch (err) {
      setError('Failed to execute day');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceDays = async (days: number) => {
    if (!state) return;

    try {
      setIsAdvancingDays(true);
      const actions: GameDayActionRequest = {
        parUmol,
        lightScheduleHoursOn: lightHours,
        lightScheduleHoursOff: 24 - lightHours,
        waterTemperatureTarget: temperature,
        waterTemperatureCelsius: waterTemperature,
        co2TargetPpm: co2Ppm,
        exhaustFanPercent: exhaustFanPercent,
        humidityTarget: humidity,
        nutrientTopUp: {
          baseNutrientMl: nutrientTopUp,
          phUpMl: phUp,
          phDownMl: phDown,
        },
        additiveApplications: selectedAdditives.map(app => ({
          additiveId: app.id,
          doseMl: app.doseMl,
        })),
      };

      // Call advanceDays on the game client
      const newState = await gameClient.advanceDays(days, actions);
      setState(newState);
      setSelectedAdditives([]); // Clear additives after application
      setPhUp(0); // Reset pH adjustments
      setPhDown(0);
      setNutrientTopUp(0); // Reset nutrient top-up
    } catch (err) {
      setError(`Failed to advance ${days} days`);
      console.error(err);
    } finally {
      setIsAdvancingDays(false);
    }
  };

  const handleDirectHarvest = async () => {
    if (!state) return;

    try {
      setLoading(true);
      // Call the new harvest endpoint on GameClient
      const assessment = await gameClient.harvestNow();
      setHarvestAssessment(assessment);
      setHarvestFlowStage('assessment');
      // Update state with the harvest result
      const newState = await gameClient.getState();
      setState(newState);
    } catch (err) {
      setError('Failed to harvest');
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

      setHarvestResult(result);
      setShowTrichomeModal(false);
    } catch (err) {
      setError('Failed to harvest');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHarvestQuit = () => {
    setHarvestResult(null);
    onQuit();
  };

  const handleNextCycle = () => {
    setHarvestResult(null);
    // Reset for next cycle would go here
    // For now, just clear the harvest result
  };

  const handleAssessmentContinue = () => {
    setHarvestFlowStage('payment');
  };

  const handlePaymentContinue = () => {
    setHarvestFlowStage('seed-shop');
  };

  const handleSelectNewStrain = async (strainId: string) => {
    if (!state) return;

    try {
      setLoading(true);
      // Start a new game cycle with the selected strain
      await gameClient.startNewCycle(strainId);
      const newState = await gameClient.getState();
      setState(newState);

      // Reset harvest flow
      setHarvestFlowStage('none');
      setHarvestAssessment(null);
    } catch (err) {
      setError('Failed to start new cycle');
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

  const isFlowering = state.plant.flowering.floweringInitiated || state.plant.growthStage.stage.includes('flower');
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
            💾 Save Game
          </button>
          <button className="quit-btn" onClick={onQuit}>✕</button>
        </div>
      </div>

      <div className="game-body">
        <div className="left-panel">
          <PlantVisual plant={state.plant} />

          <PlantStatusCard state={state} />

          <ControlPanel
            parUmol={parUmol}
            onParChange={setParUmol}
            lightHours={lightHours}
            onLightChange={setLightHours}
            humidity={humidity}
            onHumidityChange={setHumidity}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            waterTemperature={waterTemperature}
            onWaterTemperatureChange={setWaterTemperature}
            co2Ppm={co2Ppm}
            onCo2Change={setCo2Ppm}
            exhaustFanPercent={exhaustFanPercent}
            onExhaustFanChange={setExhaustFanPercent}
            phUp={phUp}
            onPhUpChange={setPhUp}
            phDown={phDown}
            onPhDownChange={setPhDown}
            nutrientTopUp={nutrientTopUp}
            onNutrientTopUpChange={setNutrientTopUp}
            selectedAdditives={selectedAdditives}
            onAdditivesChange={setSelectedAdditives}
            gameClient={gameClient}
          />
        </div>

        <div className="right-panel">
          <DashboardPanel state={state} />
        </div>
      </div>

      <div className="action-panel">
        <div className="day-control-buttons">
          <button
            className="primary-btn"
            onClick={handleExecuteDay}
            disabled={loading || isAdvancingDays}
          >
            {loading ? 'Processing...' : '→ Tomorrow'}
          </button>

          <button
            className="secondary-btn"
            onClick={() => handleAdvanceDays(3)}
            disabled={isAdvancingDays || loading}
          >
            {isAdvancingDays ? 'Advancing...' : '→ 3 Days'}
          </button>

          <button
            className="secondary-btn"
            onClick={() => handleAdvanceDays(7)}
            disabled={isAdvancingDays || loading}
          >
            {isAdvancingDays ? 'Advancing...' : '→ Week'}
          </button>
        </div>

        {isFlowering && (
          <HarvestButton
            gameState={state}
            onHarvest={handleDirectHarvest}
            disabled={loading}
          />
        )}

        {isFlowering && (
          <button
            className="secondary-btn"
            onClick={() => setShowTrichomeModal(true)}
          >
            🔬 Inspect Trichomes
          </button>
        )}
      </div>

      {state && (
        <DaySummaryFooter
          healthDelta={state.plant.physiology.plantHealthChangeTodayPercent}
          nutrientsOk={
            state.tank.macroNutrients.nitrogenNMgPerLiter > 0 &&
            state.tank.macroNutrients.phosphorusPMgPerLiter > 0 &&
            state.tank.macroNutrients.potassiumKMgPerLiter > 0
          }
          humidityOk={
            state.tank.roomEnvironment.relativeHumidityPercent >= 40 &&
            state.tank.roomEnvironment.relativeHumidityPercent <= 70
          }
          temperatureOk={
            state.tank.roomEnvironment.airTemperatureCelsius >= 18 &&
            state.tank.roomEnvironment.airTemperatureCelsius <= 28
          }
          lightingOk={state.tank.roomEnvironment.lightParUmolPerM2PerS > 200}
        />
      )}

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

      {harvestResult && (
        <HarvestScreen
          result={harvestResult}
          onNextCycle={handleNextCycle}
          onQuit={handleHarvestQuit}
        />
      )}

      {harvestFlowStage === 'assessment' && harvestAssessment && state && (
        <HarvestAssessmentModal
          assessment={harvestAssessment}
          strainName={state.gameState.cycleInformation.selectedStrainName}
          onClose={handleAssessmentContinue}
        />
      )}

      {harvestFlowStage === 'payment' && harvestAssessment && state && (
        <PaymentScreen
          assessment={harvestAssessment}
          strainName={state.gameState.cycleInformation.selectedStrainName}
          currentCash={state.gameState.economics.currentCashAud}
          onContinue={handlePaymentContinue}
        />
      )}

      {harvestFlowStage === 'seed-shop' && state && (
        <SeedShop
          strains={availableStrains.map(strain => ({
            id: strain.id,
            name: strain.name,
            thcPercent: strain.thcPercent,
            cbdPercent: strain.cbdPercent,
            yieldGramsTypical: strain.baseYieldGrams,
            floweringTimeDays: strain.floweringTimeDays,
            seedCostAud: strain.seedCostAud,
            difficulty: (strain.difficulty === 'beginner' ? 'easy' :
                        strain.difficulty === 'intermediate' ? 'medium' : 'hard') as 'easy' | 'medium' | 'hard',
          }))}
          currentCash={state.gameState.economics.currentCashAud}
          onSelectStrain={handleSelectNewStrain}
          onClose={() => {
            setHarvestFlowStage('none');
            setHarvestAssessment(null);
          }}
        />
      )}
    </div>
  );
}
