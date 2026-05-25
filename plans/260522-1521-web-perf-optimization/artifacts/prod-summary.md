# Phase 1 — Production Build Benchmark: Summary

**Date:** 2026-05-22
**Build:** `pnpm --filter=web build` (Vite + react-router build, SPA mode, 3.87s)
**Serving:** same-origin Node proxy on `:3100` (in CORS/CSRF allowlist) → backend `:8000`
**Auth:** ngocyt001@gmail.com (loginMs=34123, page nav redirected to :3000 workspace; cookies set on backend domain, page measurements at :3100 authenticated correctly — kb/xhr counts confirm)

## Measurements

### Production (`localhost:3100`, authenticated)

| Target                       | Pass                  | wall(ms) | req | scripts | xhrs |   KB | aggNet(ms) |
| ---------------------------- | --------------------- | -------: | --: | ------: | ---: | ---: | ---------: |
| `/yesyes/ho/?view=datasheet` | cold-cache-enabled    | **1293** | 299 | **266** |   22 | 6069 |       8395 |
| `/yesyes/ho/?view=datasheet` | warm-cache-enabled    |     1080 | 299 |     266 |   22 |   30 |       1214 |
| `/yesyes/ho/?view=datasheet` | warm-cache-disabled   |     1386 | 303 |     266 |   22 | 9615 |      11146 |
| `/yesyes/ho/?view=datasheet` | warm-cache-disabled-2 |     1539 | 303 |     266 |   22 | 9615 |      12009 |
| `/yesyes/profile/{id}/`      | cold-cache-enabled    | **1281** | 305 | **269** |   24 | 9904 |       9810 |
| `/yesyes/profile/{id}/`      | warm-cache-enabled    |     1112 | 304 |     269 |   24 |   34 |       1537 |
| `/yesyes/profile/{id}/`      | warm-cache-disabled   |     1196 | 308 |     269 |   24 | 9928 |      10953 |
| `/yesyes/profile/{id}/`      | warm-cache-disabled-2 |     1263 | 308 |     269 |   24 | 9928 |      10588 |

### Dev baseline (`localhost:3000`, from `debug-260522-1514-authenticated-pages-perf.md`)

| Target             | Pass               | wall(ms) |  scripts | xhrs |
| ------------------ | ------------------ | -------: | -------: | ---: |
| `/yesyes/ho/`      | cold-cache-enabled | **3028** | **1445** |   25 |
| `/yesyes/profile/` | cold-cache-enabled |    ~3000 |    ~1442 |   27 |

## Dev → Prod Diff

| Metric                        |    Dev |   Prod | Δ        |
| ----------------------------- | -----: | -----: | -------- |
| Cold-cache wall (/ho/)        | 3028ms | 1293ms | **−57%** |
| Script modules (/ho/)         |   1445 |    266 | **−82%** |
| Script modules (/profile/)    |   1442 |    269 | **−81%** |
| XHRs (/profile/ cold)         |     27 |     24 | −11%     |
| XHRs (/ho/ cold)              |     25 |     22 | −12%     |
| Cold-cache aggNet (/profile/) |    n/a | 9810ms | n/a      |

## Phase Priority Decisions

### Phase 2 (Vite Dev-Mode Speedup) — PROCEED, narrower scope

Prod bundles 266 vs dev 1445 = **5.4× module-count reduction** in prod. Confirms Vite dev's per-module HTTP overhead is the dev-mode bottleneck. **Phase 2 ROI is dev-only** (already validated in red-team review #3). Proceed but acknowledge:

- All gains affect local DX, NOT prod users.
- Anti-rationalize against expanding scope into prod bundle work — prod already at 266 modules.

### Phase 3 (Backend /ho/ + staff-profile) — PROCEED, unchanged

XHR count (22) and prod wall (1293ms) confirm backend is NOT the dominant cost. But Track B serializer/query work + Track A double-fetch dedupe still net wins. Track C (staff-profile 404) is intended behavior — confirmed.

### Phase 4 (Profile XHR Batching) — HARD-GATE EVAL → **PROCEED**

Cancel threshold per `phase-04-profile-page-xhr-batching.md:18-20`: "profile page wall-time <2s AND aggregated network time <3s → cancel".

Cold-cache profile prod:

- wall=1281ms ✓ (<2s)
- **aggNet=9810ms ✗** (>3s)

**Decision: PROCEED.** Wall is OK, but 9.8s aggregated network across 24 XHRs (avg ~410ms/request, cold-load dominated by 9.9MB total bytes) signals real RTT/payload-serialization cost. Cancellation criteria require BOTH gates true — only one passes.

Caveat: 22-24 XHRs in prod is close to 25-27 in dev — Phase 4's "27 RTTs" premise survives (no HTTP/2 multiplexing gain visible here; backend on :8000 over HTTP/1.1).

## Hard-Gate Verdict

| Phase | Hard-gate                 | Verdict                                  |
| ----- | ------------------------- | ---------------------------------------- |
| 2     | Dev-only ROI acknowledged | ✅ Proceed                               |
| 3     | Track C: 404 intended     | ✅ Proceed (A+B only)                    |
| 4     | wall<2s AND aggNet<3s     | ❌ Cancel condition NOT met → ✅ Proceed |

## Artifacts

- `artifacts/prod-authenticated-pages.json` — full per-target/per-pass metrics
- `artifacts/build-output.txt` — Vite build log
- `artifacts/same-origin-proxy.mjs` — Node proxy used for benchmark
- `artifacts/prod-pages-perf-test.js` — Puppeteer harness

## Unresolved Questions

- Login redirect ended at `:3000/yesyes/` (dev server URL). Cookies still worked on `:3100` measurements, but post-login workspace navigation is hardcoded to `VITE_WEB_BASE_URL` — does this affect real-user UX if the prod web origin differs from API origin in deployment? (Not blocking; observed during benchmark only.)
- HTTP/1.1 between proxy and `:8000` likely caps the realistic gain of Phase 4 batching; real production likely uses HTTP/2 or HTTP/3 at the edge. If deployment uses HTTP/2 end-to-end, Phase 4 ROI may be smaller than dev-mode numbers suggest. Worth measuring once prod infra is known.
