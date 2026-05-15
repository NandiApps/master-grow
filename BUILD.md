# HydroGrow Build & Deployment Guide

## Project Structure

```
Master Grow/
├── engine/                 # Backend simulation engine (Node.js/Express)
│   ├── src/
│   │   ├── types/         # Type definitions
│   │   ├── data/          # Strain & additive databases
│   │   ├── engine/        # SimulationEngine & GameManager
│   │   └── server.ts      # Express API server
│   ├── package.json
│   └── tsconfig.json
├── frontend/              # Mobile-first React UI (Vite)
│   ├── src/
│   │   ├── screens/       # StartScreen, GameScreen
│   │   ├── components/    # UI components (Monitor, Controls, etc)
│   │   ├── client/        # GameClient API wrapper
│   │   ├── utils/         # SessionManager (persistence)
│   │   ├── styles/        # Mobile-first CSS
│   │   └── types.ts       # Frontend types
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── wrangler.toml          # Cloudflare Workers config (next)
```

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd engine
npm install
npm run build
npm run dev
# Server runs on http://localhost:3000
```

Endpoints:
- POST `/api/game/start` - Start new game
- POST `/api/game/:gameId/day` - Execute game day
- GET `/api/game/:gameId/state` - Get game state
- POST `/api/game/:gameId/harvest` - Harvest plant
- GET `/api/strains` - List all strains
- GET `/api/additives` - List all additives

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# UI runs on http://localhost:5173
# Proxies /api requests to http://localhost:3000
```

## Production Build

### Backend

```bash
cd engine
npm run build
npm start
# Serves on configured port (default 3000)
```

### Frontend

```bash
cd frontend
npm run build
# Creates optimized dist/ folder
```

## Cloudflare Deployment

### Option 1: Cloudflare Pages + Workers

**Frontend (Pages):**
1. Connect your GitHub repo to Cloudflare Pages
2. Build command: `cd frontend && npm install && npm run build`
3. Build output: `frontend/dist`

**Backend (Workers):**
1. Install Wrangler: `npm install -g wrangler`
2. Create `wrangler.toml` in project root:

```toml
name = "hydrogrow-api"
type = "javascript"
account_id = "your-account-id"
workers_dev = true
route = "https://api.yourdomain.com/*"
zone_id = "your-zone-id"

[env.production]
routes = [{ pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }]
```

3. Deploy:
```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

### Option 2: Docker + Any Host

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Build backend
COPY engine ./engine
WORKDIR /app/engine
RUN npm install && npm run build

# Build frontend
WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Final stage
WORKDIR /app/engine
EXPOSE 3000
CMD ["npm", "start"]
```

Deploy to any host supporting Docker (Heroku, DigitalOcean, Railway, etc)

## Game Persistence Architecture

### Session Management
- **Session Code**: 6-character alphanumeric code (e.g., `ABC123`)
- **Resumption Link**: URL with `?gameId=X&sessionCode=Y` params
- **Storage**: localStorage (browser) + backend game cache

### Player Workflow
1. Start game → auto-generated session code
2. Click "Session Code" button to copy or email link
3. Exit game (data persists server-side indefinitely)
4. Later: Click link or enter code → game resumes from last state

### Backend Considerations
- Currently: In-memory game cache (resets on server restart)
- Production: Add persistent database (PostgreSQL/MongoDB)
  - Store GameState, PlantState, TankState
  - Key by gameId
  - TTL: 90 days idle games auto-delete

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://api.yourdomain.com
```

### Backend (.env)
```
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

## Mobile Optimization

**Tested on:**
- iPhone 12/13/14 (375px - 390px)
- Android 12/13/14 (360px - 412px)
- iPad (768px - 1024px)

**Key Features:**
- Full-screen game experience (no address bar)
- Touch-optimized controls (min 44px tap targets)
- Collapsible sections for limited screen real estate
- Bottom sheets for modals
- Viewport meta: `viewport-fit=cover` for notch devices

## Performance Targets

- Page load: <2s (frontend)
- API response: <100ms (backend)
- Game day update: <500ms
- Session resume: <1s

## Monitoring & Logging

Backend logs to console (production: JSON format)
- Game start/end
- API errors
- Simulation performance metrics

Frontend error tracking (to be added):
- Sentry integration
- Network error reporting

## Next Steps

1. Add database layer for game persistence
2. Implement user authentication (email verification)
3. Add leaderboard/stats tracking
4. Mobile app wrappers (React Native / Flutter)
5. Multiplayer mechanics (co-op grows)

---

**Questions?** Check the source code comments or see the project README.
