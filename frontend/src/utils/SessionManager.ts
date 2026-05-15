/**
 * Session persistence manager
 * Handles game code generation and resumption
 */

interface StoredSession {
  gameId: string;
  sessionCode: string;
  playerName: string;
  startedAt: number;
}

export class SessionManager {
  private static readonly STORAGE_KEY = 'hydrogrow_session';

  /**
   * Generate a 6-character alphanumeric session code
   */
  static generateSessionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Save current game session
   */
  static saveSession(gameId: string, sessionCode: string, playerName: string = 'Player'): void {
    const session: StoredSession = {
      gameId,
      sessionCode,
      playerName,
      startedAt: Date.now(),
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
  }

  /**
   * Retrieve stored session
   */
  static getStoredSession(): StoredSession | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Clear session (logout/new game)
   */
  static clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Generate resumption link (for email)
   */
  static generateResumptionLink(gameId: string, sessionCode: string, baseUrl: string): string {
    const params = new URLSearchParams({ gameId, sessionCode });
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Parse resumption link params
   */
  static parseResumptionLink(): { gameId?: string; sessionCode?: string } {
    const params = new URLSearchParams(window.location.search);
    return {
      gameId: params.get('gameId') || undefined,
      sessionCode: params.get('sessionCode') || undefined,
    };
  }
}
