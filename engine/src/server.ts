/**
 * HydroGrow API Server
 * Hono REST API for the simulation engine (optimized for Cloudflare Workers)
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { KVNamespace } from "@cloudflare/workers-types";
import { GameManager } from "./engine/GameManager";
import {
  StartGameRequest,
  GameDayActionRequest,
  HarvestRequest,
} from "./types";
import { listStrains } from "./data/strains";
import { listAdditives } from "./data/additives";

type Env = {
  GAME_STATE: KVNamespace;
};

const app = new Hono<{ Bindings: Env }>();

// CORS middleware - allow requests from Pages
app.use("*", cors());

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

    // Persist to KV
    await c.env.GAME_STATE.put(
      response.gameState.gameId,
      manager.serialize()
    );
    return c.json(response);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Execute a game day
app.post("/api/game/:gameId/day", async (c) => {
  try {
    const { gameId } = c.req.param();

    // Fetch from KV
    const stored = await c.env.GAME_STATE.get(gameId);
    if (!stored) {
      return c.json({ error: "Game not found" }, 404);
    }

    const manager = GameManager.deserialize(stored);
    const actions: GameDayActionRequest = await c.req.json();
    const response = manager.executeGameDay(actions);

    // Persist back to KV
    await c.env.GAME_STATE.put(gameId, manager.serialize());
    return c.json(response);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Get current game state
app.get("/api/game/:gameId/state", async (c) => {
  try {
    const { gameId } = c.req.param();

    // Fetch from KV
    const stored = await c.env.GAME_STATE.get(gameId);
    if (!stored) {
      return c.json({ error: "Game not found" }, 404);
    }

    const manager = GameManager.deserialize(stored);
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

    // Fetch from KV
    const stored = await c.env.GAME_STATE.get(gameId);
    if (!stored) {
      return c.json({ error: "Game not found" }, 404);
    }

    const manager = GameManager.deserialize(stored);
    const harvestData: HarvestRequest = await c.req.json();
    const result = manager.harvest(harvestData);

    // Persist back to KV
    await c.env.GAME_STATE.put(gameId, manager.serialize());
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
