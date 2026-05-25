---
phase: 1
title: "Production Build Benchmark"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Production Build Benchmark

## Overview

Establish a real-world performance baseline by running Vite production build (`pnpm build && pnpm start`) and re-executing the existing Puppeteer test against `/yesyes/ho/` and `/yesyes/profile/...`. Goal: distinguish dev-mode artifacts from real prod problems so Phase 2-4 fixes target the right bottlenecks.

## Context Links

- `plans/reports/debug-260522-1429-cache-disabled-slow-login.md`
- `plans/reports/debug-260522-1514-authenticated-pages-perf.md`
- Test harness: `.claude/chrome-devtools/tmp/authenticated-pages-perf-test.js`

## Requirements

- Functional: capture login + 2-page perf metrics on prod build, save artifacts
- Non-functional: zero code changes — measurement only

## Implementation Steps

1. **Build prod web bundle**

   ```bash
   cd apps/web && pnpm build
   ```

   Capture build output (chunk count, sizes) into `plans/260522-1521-web-perf-optimization/artifacts/build-output.txt`.

2. **Serve prod build + set up `/api` reverse proxy.**
   - `pnpm start` in `apps/web` runs `serve -s build/client` which serves static assets only. It does **not** proxy `/api/*` to Django, so a raw `pnpm start` benchmark will 404 every API call and produce garbage data.
   - **Required setup (decision: Caddy — Validation Log Session 1):** front the static server with Caddy so `/api/*` → `http://localhost:8000` (Django dev) and `/*` → static. nginx and Node http-proxy are acceptable alternatives only if Caddy isn't installable.
   <!-- Updated: Validation Session 1 - reverse proxy = Caddy -->
   - Minimal Caddyfile (canonical):
     ```
     :3001 {
       handle /api/* { reverse_proxy localhost:8000 }
       handle { reverse_proxy localhost:3000 }   # where `serve -s build/client` runs
     }
     ```
   - Document chosen approach + commands in `artifacts/prod-serve-setup.md`.

3. **Re-run authenticated-pages test against prod** — copy harness to a new file `prod-pages-perf-test.js`, point BASE at the proxy URL/port (NOT the raw `serve` port), run with cleared cache+cookies.
   - **Login-completes checklist before measuring page perf:** confirm `POST /api/auth/sign-in/` returns 200 AND subsequent `GET /api/users/me/` returns 200. If either fails, the proxy is misconfigured — fix before capturing perf numbers.

4. **Capture artifacts** to `plans/260522-1521-web-perf-optimization/artifacts/`:
   - `prod-authenticated-pages.json` — full request log
   - `prod-summary.md` — table comparing dev vs prod for each pass (wall, total bytes, requests, scripts, XHRs)

5. **Diff dev vs prod** — produce a short comparison table in `prod-summary.md`. Decision matrix:
   - Module count drops >50% → Phase 2 (Vite optimizeDeps) is **lower priority** (prod already bundled)
   - Module count similar → Phase 2 stays P1
   - `/ho/filter-options` TTFB still >200ms → Phase 3 stays P1
   - Profile XHR count still ~27 → Phase 4 stays P1

6. **Update phase priorities** in `plan.md` based on results. Document rationale in `prod-summary.md` "Recommendations" section.

## Related Code Files

- Create: `plans/260522-1521-web-perf-optimization/artifacts/prod-pages-perf-test.js`
- Create: `plans/260522-1521-web-perf-optimization/artifacts/prod-authenticated-pages.json`
- Create: `plans/260522-1521-web-perf-optimization/artifacts/prod-summary.md`
- Read: `.claude/chrome-devtools/tmp/authenticated-pages-perf-test.js`
- Modify: `plans/260522-1521-web-perf-optimization/plan.md` (update priorities)

## Success Criteria

- [ ] `pnpm build` succeeds; build artifact sizes recorded
- [ ] Prod server runs and serves `/yesyes/ho/` + profile pages
- [ ] Puppeteer test completes 4 passes per URL, JSON captured
- [ ] Side-by-side dev vs prod comparison table written
- [ ] Phase 2-4 priorities reaffirmed or downgraded with explicit rationale

## Risk Assessment

- **Risk:** prod build may fail (untested in this branch). **Mitigation:** capture exact error, file as separate bug, do not block Phase 3-4 (backend work unaffected by frontend build).
- **Risk:** prod build needs different env vars / API URL. **Mitigation:** copy `.env.production.example` if present; otherwise reuse dev `.env`.
- **Risk:** `pnpm start` has no `/api` proxy → benchmark hits 404s and produces misleading "fast prod" numbers. **Mitigation:** mandatory reverse-proxy step + login-completes precheck (Step 2-3).

## Rollback

Pure measurement phase — no code changes to roll back. Discard `artifacts/` outputs if results are invalid (e.g. proxy misconfigured); re-run after fix.

## Next Steps

Phase 2-4 priorities driven by results captured here.
