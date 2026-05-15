import { useState, useEffect } from 'react';
import { GameClient } from './client/GameClient';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { SessionManager } from './utils/SessionManager';
import './App.css';

export function App() {
  const [gameClient, setGameClient] = useState<GameClient | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const stored = SessionManager.getStoredSession();

      // Check for resume parameter in URL (?resume=gameId)
      const params = new URLSearchParams(window.location.search);
      const resumeGameId = params.get('resume') || params.get('gameId');

      let gameToLoad = stored;

      if (resumeGameId && !stored) {
        // Try to resume from URL parameter
        try {
          const client = new GameClient(import.meta.env.VITE_API_URL || 'http://localhost:3000');
          await client.loadGame(resumeGameId);
          setGameClient(client);
          setSessionCode(resumeGameId); // Use gameId as session code for display
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('Failed to resume game from URL:', error);
          // Fall through to normal startup
        }
      }

      if (gameToLoad) {
        try {
          const client = new GameClient(import.meta.env.VITE_API_URL || 'http://localhost:3000');
          await client.loadGame(gameToLoad.gameId);
          setGameClient(client);
          setSessionCode(gameToLoad.sessionCode);
        } catch (error) {
          console.error('Failed to resume game:', error);
          SessionManager.clearSession();
        }
      }
      setIsLoading(false);
    };

    loadSession();
  }, []);

  const handleStartGame = async (playerName: string, strainId: string) => {
    try {
      setIsLoading(true);
      const client = new GameClient(import.meta.env.VITE_API_URL || 'http://localhost:3000');
      const gameId = await client.startGame({
        playerName,
        selectedStrainId: strainId,
        difficulty: 'normal',
        electricityRateAudPerKwh: 0.28,
      });

      const code = SessionManager.generateSessionCode();
      SessionManager.saveSession(gameId, code);
      
      setGameClient(client);
      setSessionCode(code);
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Error starting game. Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuit = () => {
    setGameClient(null);
    setSessionCode(null);
  };

  if (isLoading) {
    return <div className="loading">Loading HydroGrow...</div>;
  }

  if (!gameClient || !sessionCode) {
    return <StartScreen onStartGame={handleStartGame} />;
  }

  return <GameScreen gameClient={gameClient} sessionCode={sessionCode} onQuit={handleQuit} />;
}
