#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║  🚀 HydroGrow Deploy (GitHub + CF)    ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Build Engine
echo -e "${BLUE}[1/5]${NC} Building engine..."
cd engine
npm run build
cd ..
echo -e "${GREEN}✓ Engine built${NC}"

# Step 2: Build Frontend
echo -e "${BLUE}[2/5]${NC} Building frontend..."
cd frontend
# Fix esbuild platform mismatch
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps > /dev/null 2>&1
npm run build
cd ..
echo -e "${GREEN}✓ Frontend built${NC}"

# Step 3: Git commit and push
echo -e "${BLUE}[3/5]${NC} Pushing to GitHub..."
git add .
git commit -m "Deploy: Harvest flow, multi-day advancement, and seed shop" || echo "No changes to commit"
git push origin main
echo -e "${GREEN}✓ Pushed to GitHub${NC}"

# Step 4: Deploy engine to Cloudflare Workers
echo -e "${BLUE}[4/5]${NC} Deploying engine to Cloudflare Workers..."
cd engine
npm install wrangler --save-dev > /dev/null 2>&1
npx wrangler deploy
cd ..
echo -e "${GREEN}✓ Engine deployed${NC}"

# Step 5: Deploy frontend to Cloudflare Pages
echo -e "${BLUE}[5/5]${NC} Deploying frontend to Cloudflare Pages..."
cd frontend
npm install wrangler --save-dev > /dev/null 2>&1
npm run deploy
cd ..
echo -e "${GREEN}✓ Frontend deployed${NC}"

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║     ✨ Deployment Complete! ✨        ║"
echo "║                                        ║"
echo "║  Backend: Cloudflare Workers          ║"
echo "║  Frontend: Cloudflare Pages           ║"
echo "║  Code: GitHub main branch             ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
