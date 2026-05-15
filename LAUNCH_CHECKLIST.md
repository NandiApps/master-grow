# 🚀 HydroGrow Launch Checklist

## Pre-Launch (5 min)

- [ ] Cloudflare account & API key ready
- [ ] Node.js 18+ installed locally
- [ ] Git repo initialized

## Quick Deploy (15 min)

### Backend (Cloudflare Workers)

- [ ] `cd engine && npm install`
- [ ] `npm run build`
- [ ] `npm install -g wrangler` (if not installed)
- [ ] `wrangler login` (opens browser)
- [ ] `wrangler deploy --config wrangler.toml` from repo root
- [ ] Note the deployed URL: `https://hydrogrow-api-XXXXXX.workers.dev`
- [ ] Test: `curl https://hydrogrow-api-XXXXXX.workers.dev/health`

### Frontend (Cloudflare Pages)

- [ ] Go to Cloudflare Dashboard → Pages
- [ ] Create project → Connect GitHub repo
- [ ] Build settings:
  - Build command: `cd frontend && npm install && npm run build`
  - Output directory: `frontend/dist`
- [ ] Add environment variable: `VITE_API_URL` = (your backend URL from above)
- [ ] Deploy

### Test

- [ ] Open Pages URL (or custom domain)
- [ ] Start game → select strain → click "Start Growing"
- [ ] Adjust controls → Execute Day
- [ ] Click "Session Code" → verify code displays
- [ ] Check browser console (F12) for errors

## Optional: Setup Auto-Deploy (5 min)

- [ ] Push code to GitHub
- [ ] Go to Repo Settings → Secrets
- [ ] Add 3 secrets (see GITHUB_SECRETS.md):
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `VITE_API_URL`
- [ ] Next `git push` auto-deploys

## Optional: Custom Domain (5 min)

- [ ] Pages → Custom domain → add `yourdomain.com`
- [ ] Update DNS with CNAME (Cloudflare shows which one)
- [ ] Update `VITE_API_URL` in Pages env vars (if using custom domain for API)

---

**✅ Done!** Your game is live. Share the URL.

**API Base**: https://hydrogrow-api-XXXXXX.workers.dev
**Frontend**: https://youraccount.pages.dev OR yourdomain.com
