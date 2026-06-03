# Prod Serve Setup

## Decision: no reverse proxy needed

Plan called for Caddy on :3001 proxying `/api/*` → Django :8000 and `/*` → `serve` :3000. After scout:

- `packages/constants/src/endpoints.ts:7` → `API_BASE_URL = process.env.VITE_API_BASE_URL || ""`
- `apps/web/.env` → `VITE_API_BASE_URL="http://localhost:8000"`
- All `core/services/*.ts` call `super(API_BASE_URL)` → absolute URL baked into prod bundle at build time.

Therefore frontend issues absolute `http://localhost:8000/api/...` requests directly to Django. There are no relative `/api` paths in the prod bundle to proxy. CORS is already configured in Django dev. The Caddy step is moot for this benchmark.

## What was done

- Build: `cd apps/web && pnpm build` → `build/client/` (28 MB, 81-line output saved in `build-output.txt`). Build time: 4.17s (incremental — Vite cache warm).
- Serve: `pnpm exec serve -s build/client -l 3010` on port 3010 (3000 is occupied by dev server, 3001 by admin dev).
- Sanity: `curl localhost:3010/` → 200; `curl localhost:8000/api/instances/` → 200.

## Login-completes precheck

Run before measuring page perf:

- `POST http://localhost:8000/api/auth/sign-in/` → expect 200
- `GET http://localhost:8000/api/users/me/` → expect 200

If either fails, Django env / cookies / CSRF setup is wrong — fix before capturing perf data.

## Caveats vs real prod

- Real prod uses HTTP/2 + nginx (or similar) at same origin → connection-multiplexing benefits absent here.
- Browser will treat `localhost:3010 → localhost:8000` as cross-origin → preflight `OPTIONS` per non-GET endpoint adds RTTs. This understates real prod numbers somewhat.
- For our purpose (dev-vs-prod **bundle** comparison — module count, total bytes), this setup is sufficient.
