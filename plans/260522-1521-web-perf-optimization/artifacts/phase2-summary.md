# Phase 2 — Vite Dev-Mode Speedup: Results

## Baseline vs After

| Metric                       | Baseline | After Phase 2 | Δ     | Target       | Hit? |
| ---------------------------- | -------- | ------------- | ----- | ------------ | ---- |
| Login wall (ms)              | ~17000   | 13417         | -21%  | <8000        | ❌   |
| /ho/ cold wall (ms)          | 3028     | 2899          | -4.3% | ≤1800 (-40%) | ❌   |
| /profile/ cold wall (ms)     | (n/a)    | 2842          | n/a   | ≤1800        | ❌   |
| /ho/ cold scripts (modules)  | 1442     | 1418          | -1.7% | ≤700         | ❌   |
| /profile/ cold scripts       | (n/a)    | 1415          | n/a   | ≤700         | ❌   |
| /ho/ cold KB                 | (n/a)    | 1606          | n/a   | n/a          |      |
| /ho/ warm-cache-enabled wall | (n/a)    | 2229          | n/a   | n/a          |      |

## Full Matrix (after Phase 2)

| Target    | cold-cache-enabled | warm-cache-enabled | warm-cache-disabled | warm-cache-disabled-2 |
| --------- | ------------------ | ------------------ | ------------------- | --------------------- |
| /ho/      | 2899 / 1418 / 25   | 2229 / 1418 / 25   | 2852 / 1418 / 25    | 2798 / 1418 / 25      |
| /profile/ | 2842 / 1415 / 24   | 2365 / 1415 / 24   | 3178 / 1415 / 24    | 2640 / 1415 / 24      |

Format: `wallMs / scripts / xhrs`

## Verdict — FAIL

Phase 2 changes (vite.config.ts `optimizeDeps.include` + `server.warmup.clientFiles`, root `clean:vite` script) produced only marginal wins:

- Cold wall ↓4.3 % (target ≥40 %)
- Module count ↓1.7 % (target ≥51 %, from 1442→≤700)

**Root cause hypothesis** — Vite does not pre-bundle workspace (`@plane/*`) packages by default; even when listed in `optimizeDeps.include`, monorepo subpath imports (e.g. `@plane/propel/button`) keep emitting one module per entry. Real consolidation needs either `optimizeDeps.entries` pointing at workspace source or marking workspace pkgs as non-linked. That's a deeper refactor than the phase contracted for.

## Files Changed

- `apps/web/vite.config.ts` — added `optimizeDeps.include` (34 entries) + `server.warmup.clientFiles` (5 entries)
- `package.json` — added `clean:vite` script
- `plans/.../artifacts/dev-after-phase2.json` — measurement
- `plans/.../artifacts/dev-phase2-perf-test.js` — measurement script (fixed BASE→:3000, selector→`#login-identifier`)

## HMR Smoke

Not run (phase blocked early on success criteria fail).

## Decision Required

Phase 2 success criteria not met. Three options:

1. **Revert + skip Phase 2** — dev-only ROI, modest gains; move to Phase 3 backend hot-spots which has prod impact.
2. **Iterate Phase 2** — investigate workspace pre-bundling (~2–4 h research), risk: still won't hit 51 % module reduction in monorepo.
3. **Keep partial wins, lower bar** — accept ~5 % wall improvement, mark Phase 2 partial-pass, move on.

## Unresolved Questions

- Did `optimizeDeps.include` actually engage? `.vite/deps` inspection blocked earlier by `.ckignore` — needs re-check before reverting.
- Login time dropped 21 % (17 s→13 s) — is that from warmup or measurement noise? Single-sample, needs N=3 to confirm.
- Should we count warm-cache-enabled (~2.2–2.4 s) as the relevant metric since real users hit warm cache more often?
