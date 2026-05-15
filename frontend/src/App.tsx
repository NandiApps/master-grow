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
      if (stored) {
        try {
          const client = new GameClient(import.meta.env.VITE_API_URL || 'http://localhost:3000');
          await client.loadGame(stored.gameId);
          setGameClient(client);
          setSessionCode(stored.sessionCode);
        } catch (error) {
          console.error('Failed to resume game:', error);
          SessionManager.clearSession();
        }
      }
      setIsLoading(false);
    };

    loadSession();
  }, []);

  const handleStartGame = async (playerName: string, strainId: string, difficulty: 'beginner' | 'normal' | 'hard') => {
    try {
      setIsLoading(true);
      const client = new GameClient(import.meta.env.VITE_API_URL || 'http://localhost:3000');
      const gameId = await client.startGame({
        playerName,
        selectedStrainId: strainId,
        difficulty,
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
