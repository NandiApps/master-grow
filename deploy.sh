#!/bin/bash

# HydroGrow Quick Deploy Script
# Usage: ./deploy.sh

set -e

echo "🌱 HydroGrow Deployment Script"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install Node 18+: https://nodejs.org"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# Check Wrangler
if ! command -v wrangler &> /dev/null; then
  echo "📦 Installing Wrangler..."
  npm install -g wrangler
fi
echo "✅ Wrangler ready"

# Build backend
echo ""
echo "🔨 Building backend..."
cd engine
npm install
npm run build
cd ..
echo "✅ Backend built"

# Deploy backend
echo ""
echo "🚀 Deploying backend to Cloudflare Workers..."
echo "   (You may be asked to login to Cloudflare)"
wrangler deploy --config wrangler.toml

BACKEND_URL=$(wrangler deployments list --name hydrogrow-api | head -1 | awk '{print $2}')
echo "✅ Backend deployed: $BACKEND_URL"

# Build frontend
echo ""
echo "🔨 Building frontend..."
cd frontend
npm install
VITE_API_URL="$BACKEND_URL" npm run build
cd ..
echo "✅ Frontend built at frontend/dist/"

# Offer to deploy frontend
echo ""
echo "📋 Frontend deployment options:"
echo "   1. Manually upload frontend/dist to Cloudflare Pages (recommended)"
echo "   2. Use GitHub Actions for auto-deploy (requires secrets setup)"
echo "   3. Skip frontend deployment (already have it hosted)"
read -p "Choose (1/2/3): " choice

if [ "$choice" = "1" ]; then
  echo ""
  echo "📝 Manual upload to Cloudflare Pages:"
  echo "   1. Go to https://dash.cloudflare.com → Pages → Create project"
  echo "   2. Choose GitHub repo and follow prompts"
  echo "   3. Build command: cd frontend && npm run build"
  echo "   4. Output dir: frontend/dist"
  echo "   5. Add env var: VITE_API_URL=$BACKEND_URL"
  echo "   6. Deploy!"
  echo ""
  echo "⏳ Waiting for you to deploy..."
  read -p "Press ENTER when Pages deployment is complete: "
elif [ "$choice" = "2" ]; then
  echo ""
  echo "🔑 Setting up GitHub Actions auto-deploy:"
  echo "   1. Go to GitHub Repo → Settings → Secrets and variables → Actions"
  echo "   2. Add 3 new repository secrets (see GITHUB_SECRETS.md):"
  echo "      - CLOUDFLARE_API_TOKEN (from https://dash.cloudflare.com)"
  echo "      - CLOUDFLARE_ACCOUNT_ID"
  echo "      - VITE_API_URL=$BACKEND_URL"
  echo "   3. Push code: git add . && git commit -m 'Deploy' && git push"
  echo "   4. Check GitHub Actions for deployment status"
  read -p "Press ENTER when secrets are configured: "
fi

# Done
echo ""
echo "✅ HydroGrow is live!"
echo ""
echo "Backend API: $BACKEND_URL"
echo "Frontend:   (see Cloudflare Pages dashboard)"
echo ""
echo "Next: Share your game URL and start growing! 🌿"
