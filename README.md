# HydroGrow 🌱

**Advanced Cannabis Hydroponic Simulator** - A research-backed, simulator-grade game teaching plant signaling biochemistry and precision growing.

## Overview

HydroGrow combines Dopewars-style game mechanics with peer-reviewed cannabis cultivation science. Players learn to optimize plant growth through:
- **PAR (Photosynthetically Active Radiation)** stress management
- **Plant signaling additives** (SuperSi, Chitosan) for cannabinoid/terpene enhancement
- **Trichome maturation** inspection for harvest timing
- **Nutrient uptake** and pH lockout handling
- **Real Australian market pricing** and economic management

**Key Innovation**: The meta-game centers on plant signaling biochemistry—not just "more light = more growth"—teaching players to become better growers.

## Game Mechanics

### Core Loop
1. **Monitor** plant growth, stress indicators, cannabinoid/trichome maturity
2. **Adjust** PAR, light schedule (18/6 → 12/12 triggers flowering), humidity, temperature
3. **Apply additives** strategically:
   - **SuperSi** (PowerSi): Stress tolerance via silica deposition; prevents photoinhibition at high PAR
   - **Chitosan**: Defense pathway activation; +78% CBDA, +95% terpene boost (weeks 3-6 flower)
   - **Kelp Extract**: General vigor booster
   - **MeJA**: Direct jasmonic acid pathway
4. **Inspect trichomes** (Clear → Cloudy → Amber progression) to decide harvest timing
5. **Harvest** and sell for profit

### Plant State Tracking

- **Morphology**: Height, stem diameter, leaf area, node/branch count
- **Physiology**: Chlorophyll %, health %, root mass, biomass
- **Cannabinoids**: THCA/CBDA/CBN accumulation (% of final)
- **Trichomes**: Clear/Cloudy/Amber distribution (harvest quality decision)
- **Stress**: Heat, cold, humidity, nutrient lockout, photoinhibition, hypoxia
- **Visible Symptoms**: Nutrient deficiencies, powdery mildew, botrytis, light burn

### Tank/Environment

- **Water Chemistry**: pH (optimal 5.5-6.5), EC, PPM, temperature, dissolved oxygen
- **Macro/Micro Nutrients**: N-P-K-Ca-Mg-S and Si-Fe-Mn-Zn-B-Mo tracking
- **Additives Active**: Chitosan concentration & days since application, MeJA, Kelp
- **Room**: Air temp, humidity, CO₂ ppm, PAR, air circulation
- **Alerts/Warnings**: pH lockout, high TDS, disease risk, light stress

## Tech Stack

**Backend** (Node.js/TypeScript)
- Express.js REST API
- 14-step daily simulation engine
- Comprehensive type system (40+ interfaces)
- Real ILGM strain database (12 strains)
- Real Australian supplier product database (4 additives)

**Frontend** (React/TypeScript/Vite)
- Mobile-first responsive UI
- Real-time game state monitoring
- Interactive controls (sliders for PAR, light, humidity, temp)
- Additive application interface
- Trichome inspector (pie chart visualization)
- Session persistence (code/email resumption)

**Deployment**
- Cloudflare Pages (frontend SPA)
- Cloudflare Workers or traditional server (backend API)
- Option: Docker containerization for any host

## File Structure

See [BUILD.md](BUILD.md) for detailed project structure and setup instructions.

## Quick Start

### Local Development

```bash
# Backend
cd engine
npm install
npm run dev
# Runs on http://localhost:3000

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Production Build

```bash
# Backend
cd engine
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve `dist/` folder via static hosting
```

### Deploy to Cloudflare

```bash
# Frontend: Connect GitHub repo to Cloudflare Pages
# (build command: `cd frontend && npm run build`, output: `frontend/dist`)

# Backend: Use Cloudflare Workers or deploy container elsewhere
# See BUILD.md for detailed Cloudflare setup
```

## Game Features

### Strains (12 Available)
- **Beginner Tier** ($70.85): Skywalker OG, Godfather OG, Blue Dream, Granddaddy Purple, Super Lemon Haze
- **Intermediate Tier** ($83.85): GG4, Bruce Banner, Girl Scout Cookies
- **Autoflower Budget** ($99): OG Kush Auto, Blue Dream Auto
- **Autoflower Premium** ($129): Bruce Banner Auto

Each strain has: THC%, CBD%, flowering time, yield, terpene profile, Chitosan responsiveness, PAR tolerance

### Additives (4 Available)
- **PowerSi Original** ($18.50/500mL): Silicon stress buffer
- **Sea-K Kelp Extract** ($16.72/200g): General vigor, $67/cycle
- **Chitosan Foliar** ($45/500mL): Terpene/cannabinoid amplifier, $225/cycle
- **Methyl Jasmonate** ($55/250mL): Jasmonic acid pathway, $275/cycle

### Economics
- Starting budget: $1000 AUD
- Track spending: seeds, nutrients, additives, electricity
- Calculate profit: (yield in grams × market price/g) - total spent
- Market price volatility based on supply/demand (future feature)

### Mobile Optimization
- **Responsive**: 360px to 1440px
- **Touch-friendly**: 44px minimum tap targets
- **Modal sheets**: Harvest decision, session resume, full-screen gameplay
- **Native feel**: Status bar integration, no address bar interference

## Simulation Accuracy

All mechanics based on peer-reviewed cannabis growing literature (2015-2025):

- PAR photosynthesis curves: saturation at ~1000 µmol
- Photoinhibition threshold: 1100+ µmol (strain dependent)
- Cannabinoid synthesis: PAR stress >900 µmol triggers +15% THC
- Chitosan efficacy: 7-10 day active window, peaks weeks 3-6 of flower
- Trichome maturation: Temperature (+1.2x at >26°C), RH (-0.9x at >70%), PAR (+1.15x at >1000), Chitosan (+1.05x)
- pH drift: From nitrogen uptake (linear)
- Nutrient lockout: pH <5.0 or >7.0 reduces uptake to 40%
- Disease pressure: Powdery mildew (RH >70%, low airflow), Botrytis (RH >75%, <20°C), Chitosan -40% risk

## Persistence & Resumption

**Session Code System**:
- Auto-generated 6-char code on game start (e.g., `ABC123`)
- Player can copy code or email themselves resumption link
- Link format: `https://hydrogrow.yourdomain.com?gameId=X&sessionCode=Y`
- Click link or enter code → game resumes from last state

**Backend Storage**:
- Currently: In-memory (production ready with minor DB add)
- Production: Add PostgreSQL/MongoDB with gameId as key
- TTL: Auto-delete games idle >90 days

## API Endpoints

### Game Control
- `POST /api/game/start` - Start new game
- `POST /api/game/:gameId/day` - Execute game day with controls/additives
- `GET /api/game/:gameId/state` - Fetch current GameState + PlantState + TankState
- `POST /api/game/:gameId/harvest` - Harvest with trichome profile

### Data
- `GET /api/strains` - List all 12 strains
- `GET /api/strains/:strainId` - Get strain details
- `GET /api/additives` - List all 4 additives
- `GET /api/additives/:additiveId` - Get additive details

## Performance

- **Page Load**: <2s (frontend)
- **API Response**: <100ms (backend simulation)
- **Game Day Execution**: <500ms
- **Session Resume**: <1s

## Future Roadmap

- [ ] User authentication & leaderboard
- [ ] Persistent database (PostgreSQL)
- [ ] Multi-tank operations (manage 3-5 tanks concurrently)
- [ ] Advanced trichome inspector (3D zoom micro-view)
- [ ] Yield quality prediction algorithms
- [ ] Co-op grows (multiplayer)
- [ ] Strain breeding mechanics
- [ ] Mobile app (React Native / Flutter)

## Research Sources

Game mechanics grounded in peer-reviewed literature:
- Cannabis photosynthesis & PAR response (2018-2023)
- Chitosan plant defense signaling (2019-2024)
- Trichome maturation & cannabinoid synthesis (2017-2023)
- Hydroponic nutrient uptake & pH lockout (2015-2024)

See source code comments for specific citations.

## License

MIT

## Author

Built for educational purposes to teach hydroponic growing principles and plant biochemistry.

---

**Questions?** Start with [BUILD.md](BUILD.md) for setup instructions, or check source code comments for technical details.
