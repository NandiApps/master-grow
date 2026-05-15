# GitHub Setup for Auto-Deploy

## Step 1: Initialize Local Git (1 min)

```bash
cd /path/to/Master\ Grow

# Initialize git
git init
git add .
git commit -m "Initial HydroGrow commit: engine + frontend ready"

# Check status
git status
# Should show: On branch main, nothing to commit
```

## Step 2: Create GitHub Repo (2 min)

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `hydrogrow` (or your choice)
3. **Description**: "Cannabis hydroponic simulator"
4. **Visibility**: Public (or Private if you prefer)
5. **Initialize with**: None (we already have code)
6. Click **Create repository**

## Step 3: Connect Local to GitHub (1 min)

GitHub will show commands. Copy them. They look like:

```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hydrogrow.git
git push -u origin main
```

**Run those commands** in your Master Grow folder.

## Step 4: Get Cloudflare Secrets (2 min)

You'll need 3 secrets. Go to [Cloudflare Dashboard](https://dash.cloudflare.com):

### Secret 1: CLOUDFLARE_API_TOKEN

1. **My Profile** (bottom left)
2. **API Tokens** tab
3. **Create Token** button
4. Choose template: **"Cloudflare Workers - Edit"**
5. Accept defaults (grants Workers + Pages access)
6. **Create Token**
7. **Copy the token** (you won't see it again!)

### Secret 2: CLOUDFLARE_ACCOUNT_ID

1. Back in Cloudflare Dashboard
2. Look at **right sidebar** → "Account ID"
3. Copy it

### Secret 3: VITE_API_URL

Leave blank for now. After first deploy, you'll update it with your Workers URL.

## Step 5: Add GitHub Secrets (3 min)

1. Go to your GitHub repo
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add 3 secrets:

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | (paste token from above) |
| `CLOUDFLARE_ACCOUNT_ID` | (paste account ID from above) |
| `VITE_API_URL` | Leave empty for now (`https://hydrogrow-api-prod.YOUR-NAME.workers.dev` after first deploy) |

✅ After each secret, click **Add secret**

## Step 6: Trigger First Deploy (1 min)

Go back to your repo code view. Everything is already committed and pushed.

**GitHub Actions runs automatically.** Check **Actions** tab:

- Green checkmark = Deploy succeeded
- Red X = Deploy failed (check logs)

**Wait for both jobs:**
1. "Deploy Backend to Cloudflare Workers" ✅
2. "Deploy Frontend to Cloudflare Pages" ✅

This takes ~3-5 minutes.

## Step 7: Update VITE_API_URL (1 min)

After backend deploys:

1. Check Cloudflare Workers dashboard
2. Find your deployed worker URL: `https://hydrogrow-api-prod.XXXXX.workers.dev`
3. Go to GitHub → Settings → Secrets
4. **Update** `VITE_API_URL` with that URL
5. Done! Next push auto-updates frontend with correct API URL

## Step 8: Test Live (2 min)

1. Check Cloudflare Pages dashboard → find your deployment
2. Click the URL
3. Start a game
4. Check browser console (F12) for errors
5. Execute a day → should call `/api/game/:gameId/day`

## Congrats! 🎉

Every time you `git push`, both backend + frontend auto-deploy.

```bash
# Edit code locally
# Then:
git add .
git commit -m "Add new feature"
git push
# → GitHub Actions auto-deploys in ~3 min
```

---

**Need custom domain?** After this works, update Cloudflare DNS (see DEPLOY.md).
