/**
 * HydroGrow API Server
 * Express.js REST API for the simulation engine
 */

import express, { Request, Response } from "express";
import { GameManager } from "./engine/GameManager";
import {
  StartGameRequest,
  GameDayActionRequest,
  HarvestRequest,
} from "./types";
import { listStrains } from "./data/strains";
import { listAdditives } from "./data/additives";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Game manager instances (in production, use sessions/database)
const gameManagers = new Map<string, GameManager>();

// ==================== ENDPOINTS ====================

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start a new game
app.post("/api/game/start", (req: Request, res: Response) => {
  try {
    const request: StartGameRequest = req.body;
    const manager = new GameManager();
    const response = manager.startGame(request);
    
    gameManagers.set(response.gameState.gameId, manager);
    res.json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Execute a game day
app.post("/api/game/:gameId/day", (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const manager = gameManagers.get(gameId);
    
    if (!manager) {
      return res.status(404).json({ error: "Game not found" });
    }

    const actions: GameDayActionRequest = req.body;
    const response = manager.executeGameDay(actions);
    res.json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get current game state
app.get("/api/game/:gameId/state", (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const manager = gameManagers.get(gameId);
    
    if (!manager) {
      return res.status(404).json({ error: "Game not found" });
    }

    const gameState = manager.getState();
    const plant = manager.getPlant();
    const tank = manager.getTank();

    res.json({ gameState, plant, tank, timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Harvest the plant
app.post("/api/game/:gameId/harvest", (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const manager = gameManagers.get(gameId);
    
    if (!manager) {
      return res.status(404).json({ error: "Game not found" });
    }

    const harvestData: HarvestRequest = req.body;
    const result = manager.harvest(harvestData);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List available strains
app.get("/api/strains", (req: Request, res: Response) => {
  try {
    const strains = listStrains();
    res.json({ strains, count: strains.length });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific strain
app.get("/api/strains/:strainId", (req: Request, res: Response) => {
  try {
    const { strainId } = req.params;
    const strains = listStrains();
    const strain = strains.find((s) => s.id === strainId);
    
    if (!strain) {
      return res.status(404).json({ error: "Strain not found" });
    }
    
    res.json(strain);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List available additives
app.get("/api/additives", (req: Request, res: Response) => {
  try {
    const additives = listAdditives();
    res.json({ additives, count: additives.length });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific additive
app.get("/api/additives/:additiveId", (req: Request, res: Response) => {
  try {
    const { additiveId } = req.params;
    const additives = listAdditives();
    const additive = additives.find((a) => a.id === additiveId);
    
    if (!additive) {
      return res.status(404).json({ error: "Additive not found" });
    }
    
    res.json(additive);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Export for Cloudflare Workers
export default {
  fetch: app,
};

// Also support Node.js local development
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`HydroGrow API running on http://localhost:${port}`);
    console.log(`POST   /api/game/start - Start new game`);
    console.log(`POST   /api/game/:gameId/day - Execute game day`);
    console.log(`GET    /api/game/:gameId/state - Get game state`);
    console.log(`POST   /api/game/:gameId/harvest - Harvest plant`);
    console.log(`GET    /api/strains - List all strains`);
    console.log(`GET    /api/additives - List all additives`);
  });
}
