import axios, { AxiosInstance } from 'axios';
import { StartGameRequest, GameDayActionRequest, HarvestRequest, GameStateResponse, StrainGenetics, AdditiveProduct } from '../types';

export class GameClient {
  private api: AxiosInstance;
  private gameId: string | null = null;

  constructor(apiUrl: string) {
    this.api = axios.create({
      baseURL: apiUrl,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async startGame(request: StartGameRequest): Promise<string> {
    const response = await this.api.post<GameStateResponse>('/api/game/start', request);
    this.gameId = response.data.gameState.gameId;
    return this.gameId;
  }

  async loadGame(gameId: string): Promise<GameStateResponse> {
    this.gameId = gameId;
    return this.api.get<GameStateResponse>(`/api/game/${gameId}/state`).then(r => r.data);
  }

  async executeGameDay(actions: GameDayActionRequest): Promise<GameStateResponse> {
    if (!this.gameId) throw new Error('No game loaded');
    return this.api.post<GameStateResponse>(`/api/game/${this.gameId}/day`, actions).then(r => r.data);
  }

  async harvest(request: HarvestRequest): Promise<any> {
    if (!this.gameId) throw new Error('No game loaded');
    return this.api.post(`/api/game/${this.gameId}/harvest`, request).then(r => r.data);
  }

  async getStrains(): Promise<StrainGenetics[]> {
    return this.api.get('/api/strains').then(r => r.data.strains);
  }

  async getAdditives(): Promise<AdditiveProduct[]> {
    return this.api.get('/api/additives').then(r => r.data.additives);
  }

  async getState(): Promise<GameStateResponse> {
    if (!this.gameId) throw new Error('No game loaded');
    return this.api.get<GameStateResponse>(`/api/game/${this.gameId}/state`).then(r => r.data);
  }

  getGameId(): string | null {
    return this.gameId;
  }
}
