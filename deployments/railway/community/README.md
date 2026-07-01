# Deploying to Railway

## Why the build fails with `npm error Unsupported URL Type "catalog:"`

This repo is a pnpm workspace and uses pnpm's [catalog](https://pnpm.io/catalogs)
feature (`"turbo": "catalog:"` etc. in `package.json`, resolved via
`pnpm-workspace.yaml`). Railway's default Nixpacks builder falls back to plain
`npm install` for these services, and npm has no concept of the `catalog:`
protocol, so the install fails immediately.

The fix is to stop using Nixpacks/npm for these services and instead build with
the production Dockerfiles already shipped in this repo (the same ones used by
`docker-compose.yml`), which install dependencies with pnpm via corepack.

## Setup (per service)

For each of `web`, `admin`, `space`, `live`, in the Railway dashboard:

1. **Settings → Source → Root Directory**: leave this **blank** (repo root).
   The Dockerfiles for these four apps run `turbo prune` against the whole
   monorepo, so the build context must be the repo root, not the app
   subfolder.
2. **Settings → Build → Builder**: set to **Dockerfile**, or point
   **Config-as-code Path** at the matching file in this folder:
   - `deployments/railway/community/railway.web.json`
   - `deployments/railway/community/railway.admin.json`
   - `deployments/railway/community/railway.space.json`
   - `deployments/railway/community/railway.live.json`
3. **Settings → Networking**: target port `3000` (all four images `EXPOSE 3000`;
   Railway should detect this automatically — confirm it).

For `api` (and `worker` / `beat-worker` / `migrator` if you add them as
separate Railway services from the same repo):

1. **Root Directory**: `apps/api` (this Dockerfile's build context is the
   `apps/api` folder, not the repo root — see `docker-compose.yml`).
2. **Config-as-code Path**: `deployments/railway/community/railway.api.json`.
3. **Custom Start Command** (override the image's default, which is the API
   server): use `./bin/docker-entrypoint-worker.sh`,
   `./bin/docker-entrypoint-beat.sh`, or `./bin/docker-entrypoint-migrator.sh`
   for the worker/beat-worker/migrator services respectively.

## Build-time variables the frontends need

`web`, `admin`, `space`, and `live` are static/SPA builds — the backend URLs
get baked in at **build time** via Docker `ARG`s, not read at runtime. In
self-hosted Docker Compose these default to relative paths because a single
nginx `proxy` sits in front of everything; on Railway each service gets its
own domain, so you need to set these explicitly as **Variables** on each
frontend service so Railway passes them through as build args:

- `VITE_API_BASE_URL` → your `api` service's public URL
- `VITE_ADMIN_BASE_URL` → your `admin` service's public URL
- `VITE_SPACE_BASE_URL` → your `space` service's public URL
- `VITE_WEB_BASE_URL` → your `web` service's public URL
- `VITE_LIVE_BASE_URL` → your `live` service's public URL

Since Railway assigns the domain after first deploy, do an initial deploy to
get each URL, then set these variables and redeploy so the correct URLs get
baked into the build.

On the `api` service, set `CORS_ALLOWED_ORIGINS` (see `apps/api/.env.example`)
to a comma-separated list of the `web`/`admin`/`space` public URLs, since they
now live on different domains instead of behind one proxy.

## Ports

`web` and `admin` are served by nginx on a hardcoded port `3000`. `space`
(`react-router-serve`) and `live` (Node) read `process.env.PORT` — set an
explicit `PORT=3000` variable on those two services so they don't drift from
Railway's auto-injected port and stop matching the target port above.
