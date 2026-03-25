# Deploy Buildwise

You already have two supported setups:

| Setup | Best for | URLs |
| ----- | -------- | ---- |
| **A. Render only** | Simplest — one URL for app + API | `https://your-service.onrender.com` |
| **B. Vercel + Render** | CDN for the frontend, API on Render | Vercel app + `https://your-api.onrender.com` |

---

## Before you deploy

### 1. Supabase database

In the Supabase SQL Editor, run **all** migration files in order from `supabase/migrations/` (e.g. `001_…` through the latest).  
Skip or adjust any migration you’ve already applied.

### 2. Supabase Auth (required for login in production)

1. Open **Authentication → URL configuration**.
2. **Site URL:** set to your live app origin, e.g.  
   - Render: `https://buildwise-xxxx.onrender.com`  
   - Vercel: `https://your-app.vercel.app`
3. **Redirect URLs:** add the same URL(s) plus any preview URLs you use, e.g.  
   `https://*.vercel.app/**` (if Supabase supports wildcards — otherwise add each preview URL).

Without this, OAuth/email redirects and magic links can fail in production.

### 3. Environment variables (reference)

| Variable | Where | Purpose |
| -------- | ----- | ------- |
| `VITE_SUPABASE_URL` | **Build** (Render/Vercel) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | **Build** | Supabase anon (public) key |
| `VITE_API_URL` | **Build** | Dev only; leave **empty** for same-origin production builds |
| `SUPABASE_URL` | Server (Render) | Same project URL as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (Render) | Service role key — **never** expose to the client |

---

## Option A — Full app on Render (recommended)

One Web Service serves the Express API and the Vite-built SPA from `client/dist` (same origin, no CORS issues).

### Steps

1. Push the repo to **GitHub** (or GitLab/Bitbucket).
2. In [Render](https://render.com): **New → Web Service** → connect the repo.
3. Settings:
   - **Root directory:** repository root (leave default).
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - **Plan:** Free tier is OK for demos (cold starts ~1 min).

4. **Environment** (same tab): add:

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

   Do **not** set `VITE_API_URL` (or set it empty) so the built client calls `/api` on the same host.

5. Deploy. When the build finishes, open your `https://….onrender.com` URL.

### Blueprint (optional)

You can use **`render.yaml`** in the repo: **New → Blueprint** → select the repo and apply.  
You must still add the environment variables in the Render dashboard (secrets are not in the file).

### After deploy

- Set Supabase **Site URL** and **Redirect URLs** to your Render URL.
- Test: `/health`, open the app, sign up / log in, browse engineers.

---

## Option B — Frontend on Vercel + API on Render

### 1. API on Render

Create a **Web Service** (can be the same repo):

- **Build command:** `npm run build` (builds client + installs server — needed so paths stay consistent), or use a minimal build:  
  `cd server && npm ci && cd ..`  
  if you only deploy the API (then **do not** rely on `client/dist` on this service).
- **Start command:** `npm start` from repo root **or** `cd server && npm start` if you only install server.

Simplest: same as Option A (`npm run build` + `npm start`). The API will still serve `client/dist` if present; you can ignore that and only point Vercel at the static site.

Copy the service URL, e.g. `https://buildwise-api-xxxx.onrender.com`.

### 2. Vercel project

1. **New Project** → import the repo.
2. **Root directory:** `client` (or monorepo with `client` as app root).
3. **Environment variables** (for the **build**):

   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

   Leave `VITE_API_URL` unset for production so `api.js` uses same-origin `/api` (Vercel will proxy — see below).

4. **Rewrites:** in the repo, `vercel.json` (root or `client/`) proxies `/api/*` to your Render API.  
   **Edit the destination** to your real Render URL:

   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://YOUR-SERVICE.onrender.com/api/$1"
       },
       { "source": "/((?!api/).*)", "destination": "/index.html" }
     ]
   }
   ```

5. Deploy.

### 3. CORS

The server already allows `*.vercel.app` origins. If you use a **custom domain**, add it to `allowedOrigins` in `server/src/index.js` or extend the origin check.

---

## Verify production

- [ ] `GET /health` on the API returns JSON `{ "status": "ok", ... }`.
- [ ] App loads; no “Supabase not configured” warnings in console (check env on the **build**).
- [ ] Sign up / sign in works (check Supabase Auth URLs).
- [ ] File uploads (avatars, project images, certificates) work — Supabase Storage buckets are created on server start; confirm **Storage** policies in Supabase match your security model.

---

## Troubleshooting

| Issue | What to check |
| ----- | ------------- |
| Blank page / wrong API | Vercel rewrite URL must match Render URL exactly (https, no trailing slash on host). |
| CORS errors | Custom domain not in `allowedOrigins`; or API URL wrong. |
| Auth redirect loop | Supabase **Site URL** and **Redirect URLs** must include your live app URL. |
| Env vars missing in client | `VITE_*` must exist at **build** time on Render/Vercel; trigger a new deploy after changing them. |
| Render sleeps (free) | First request after idle can take ~1 minute — normal on free tier. |

---

## Local `.env` reminder

- `client/.env.example` and `server/.env.example` describe local development.
- Never commit real `.env` files or the Supabase **service role** key.
