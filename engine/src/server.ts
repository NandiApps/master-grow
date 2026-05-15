/**
 * HydroGrow API Server
 * Hono REST API for the simulation engine (optimized for Cloudflare Workers)
 */

import { Hono } from "hono";
import { GameManager } from "./engine/GameManager";
import {
  StartGameRequest,
  GameDayActionRequest,
  HarvestRequest,
} from "./types";
import { listStrains } from "./data/strains";
import { listAdditives } from "./data/additives";

const app = new Hono();

// Game manager instances (in production, use sessions/database)
const gameManagers = new Map<string, GameManager>();

// ==================== ENDPOINTS ====================

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start a new game
app.post("/api/game/start", async (c) => {
  try {
    const request: StartGameRequest = await c.req.json();
    const manager = new GameManager();
    const response = manager.startGame(request);

    gameManagers.set(response.gameState.gameId, manager);
    return c.json(response);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Execute a game day
app.post("/api/game/:gameId/day", async (c) => {
  try {
    const { gameId } = c.req.param();
    const manager = gameManagers.get(gameId);

    if (!manager) {
      return c.json({ error: "Game not found" }, 404);
    }

    const actions: GameDayActionRequest = await c.req.json();
    const response = manager.executeGameDay(actions);
    return c.json(response);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Get current game state
app.get("/api/game/:gameId/state", (c) => {
  try {
    const { gameId } = c.req.param();
    const manager = gameManagers.get(gameId);

    if (!manager) {
      return c.json({ error: "Game not found" }, 404);
    }

    const gameState = manager.getState();
    const plant = manager.getPlant();
    const tank = manager.getTank();

    return c.json({ gameState, plant, tank, timestamp: new Date().toISOString() });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Harvest the plant
app.post("/api/game/:gameId/harvest", async (c) => {
  try {
    const { gameId } = c.req.param();
    const manager = gameManagers.get(gameId);

    if (!manager) {
      return c.json({ error: "Game not found" }, 404);
    }

    const harvestData: HarvestRequest = await c.req.json();
    const result = manager.harvest(harvestData);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// List available strains
app.get("/api/strains", (c) => {
  try {
    const strains = listStrains();
    return c.json({ strains, count: strains.length });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Get specific strain
app.get("/api/strains/:strainId", (c) => {
  try {
    const { strainId } = c.req.param();
    const strains = listStrains();
    const strain = strains.find((s) => s.id === strainId);

    if (!strain) {
      return c.json({ error: "Strain not found" }, 404);
    }

    return c.json(strain);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// List available additives
app.get("/api/additives", (c) => {
  try {
    const additives = listAdditives();
    return c.json({ additives, count: additives.length });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Get specific additive
app.get("/api/additives/:additiveId", (c) => {
  try {
    const { additiveId } = c.req.param();
    const additives = listAdditives();
    const additive = additives.find((a) => a.id === additiveId);

    if (!additive) {
      return c.json({ error: "Additive not found" }, 404);
    }

    return c.json(additive);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// 404 handler
app.all("*", (c) => {
  return c.json({ error: "Endpoint not found" }, 404);
});

// Export for Cloudflare Workers
export default app;
