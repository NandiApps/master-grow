# GitHub Actions Secrets Setup

To enable auto-deployment, add these secrets to your GitHub repo.

## Steps

1. Go to **Settings → Secrets and variables → Actions**
2. Click "New repository secret"
3. Add each secret below:

### Required Secrets

| Name | Value | How to Find |
|------|-------|-----------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token | Cloudflare Dashboard → My Profile → API Tokens → Create Token (scope: Cloudflare Workers) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare Dashboard → Right sidebar "Account ID" |
| `VITE_API_URL` | Backend API URL | `https://hydrogrow-api-prod.YOURNAME.workers.dev` (after first deploy) |

## Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **My Profile** (bottom left)
3. Go to **API Tokens**
4. Click **Create Token**
5. Choose template: "Cloudflare Workers - Edit"
6. Grant permissions:
   - ✅ Cloudflare Workers Scripts - Edit
   - ✅ Cloudflare Pages - Publish
7. Copy token, paste in GitHub secret

## First Deploy (Manual)

Before GitHub Actions can auto-deploy, manually deploy once:

```bash
# Install Wrangler
npm install -g wrangler

# Login (opens browser)
wrangler login

# Deploy from repo root
wrangler deploy --config wrangler.toml

# Output: https://hydrogrow-api-prod.YOURNAME.workers.dev
```

Then add `VITE_API_URL` secret with that URL.

## After Secrets are Set

Every `git push origin main` will automatically:
1. Build backend
2. Deploy to Cloudflare Workers
3. Build frontend
4. Deploy to Cloudflare Pages

Check **Actions** tab in GitHub for deployment status.
