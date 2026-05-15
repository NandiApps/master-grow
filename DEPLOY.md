# 🚀 Deployment Guide - HydroGrow

## Prerequisites

✅ Cloudflare account with API Key
✅ Node.js 18+
✅ Git repo (optional, for CI/CD)

## Step 1: Prepare Backend

```bash
cd engine
npm install
npm run build
```

## Step 2: Deploy Backend to Cloudflare Workers

### Install Wrangler

```bash
npm install -g wrangler
wrangler login
# This opens browser to authorize and saves API key
```

### Deploy

```bash
cd /path/to/Master\ Grow
wrangler deploy --config wrangler.toml

# Output: https://hydrogrow-api.YOURNAME.workers.dev
# Note the API URL for frontend step
```

### Verify Backend

```bash
curl https://hydrogrow-api-prod.YOURNAME.workers.dev/health
# Should return: {"status":"ok","timestamp":"2024..."}
```

## Step 3: Deploy Frontend to Cloudflare Pages

### Option A: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to Cloudflare Dashboard → Pages → Create project
   - Select your GitHub repo
   - Build settings:
     - **Build command**: `cd frontend && npm install && npm run build`
     - **Build output directory**: `frontend/dist`
   - Add environment variable:
     ```
     VITE_API_URL = https://hydrogrow-api-prod.YOURNAME.workers.dev
     ```
   - Deploy

3. **Custom Domain** (optional)
   - In Pages settings → Custom domain
   - Add `yourdomain.com` or `hydrogrow.yourdomain.com`

### Option B: Manual Deployment (Quick)

```bash
cd frontend
npm install
npm run build

# You now have a dist/ folder ready to deploy
# Upload to Cloudflare Pages manually via dashboard
```

## Step 4: Connect Frontend to Backend

After backend is live, update frontend environment:

```bash
cd frontend
echo "VITE_API_URL=https://hydrogrow-api-prod.YOURNAME.workers.dev" > .env.production
npm run build
# Redeploy to Pages
```

## Step 5: Test Live

1. Open `https://yourdomain.com` or `https://hydrogrow-pages.YOURNAME.pages.dev`
2. Start a game → Should connect to backend at `https://hydrogrow-api-prod.YOURNAME.workers.dev`
3. Click "Session Code" → Should show session code
4. Execute day → Should update plant state

## Troubleshooting

### Backend returns 404
- Check wrangler.toml `name` matches deployed service name
- Verify API route: `GET /health` should work
- Check Cloudflare Workers dashboard for logs

### Frontend can't reach backend
- Verify `VITE_API_URL` in Pages environment variables
- Check CORS headers (should be enabled in Express)
- Open browser DevTools → Network tab → check /api/ requests

### Session not persisting
- Currently in-memory (resets when Workers restart)
- For production: Add KV storage (see Advanced section)

## Advanced: Persistent Game Storage

### Add Cloudflare KV

1. Create KV namespace:
   ```bash
   wrangler kv:namespace create "HYDROGROW_GAMES" --preview false
   ```

2. Update wrangler.toml:
   ```toml
   [[kv_namespaces]]
   binding = "HYDROGROW_GAMES"
   id = "your-namespace-id"
   ```

3. Update backend to use KV (in engine/src/server.ts):
   ```typescript
   // Store game state in KV instead of in-memory
   // Key: gameId, Value: JSON stringified GameState
   ```

### Database (PostgreSQL)

For larger scale, add PostgreSQL (Render, Heroku, AWS RDS):

```bash
DATABASE_URL=postgres://user:pass@host:5432/hydrogrow npm run dev
```

(Update GameManager to persist to DB)

## Rollback

If something goes wrong:

```bash
# List recent deployments
wrangler deployments list

# Rollback to previous
wrangler rollback

# Or redeploy specific version
wrangler deploy --version {version-id}
```

## Monitoring

### View Backend Logs

```bash
wrangler tail --name hydrogrow-api
# Shows real-time logs from Workers
```

### View Frontend Errors

- Cloudflare Pages → Analytics
- Browser DevTools → Console for client-side errors

## DNS Configuration (Custom Domain)

If using custom domain (e.g., hydrogrow.yourdomain.com):

1. **Frontend**: Add CNAME in DNS
   ```
   hydrogrow CNAME youraccount.pages.dev
   ```

2. **Backend API**: Add CNAME
   ```
   api CNAME hydrogrow-api.YOURNAME.workers.dev
   ```

3. **Update frontend env variable**:
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```

## Performance Optimization

### Enable Caching

In wrangler.toml:
```toml
routes = [
  { pattern = "hydrogrow.yourdomain.com/*", zone_name = "yourdomain.com", custom_domain = true }
]
```

### Cloudflare Rules

- Cache HTML/CSS/JS for 1 week
- Cache API responses for 5 minutes (optional)
- Add rate limiting on /api/game endpoints

## Next Steps

1. ✅ Deploy backend to Workers
2. ✅ Deploy frontend to Pages
3. ⏭️  (Optional) Add KV for session persistence
4. ⏭️  (Optional) Add analytics/monitoring
5. ⏭️  (Optional) Set up custom domain

---

**Deployment complete!** Share your HydroGrow URL and start testing.
