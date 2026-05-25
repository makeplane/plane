# Debug: "Disable cache" makes post-login navigation slow

**Date:** 2026-05-22 14:29 +07
**Symptom:** With Chrome DevTools → Network → "Disable cache" checked, login → home navigation takes a long time.
**Tool:** Puppeteer + CDP `Network.setCacheDisabled`. URL probed: `http://localhost:3000/` (Vite dev).

## Measured (4 successive navigations, same browser/page)

| Pass | Cache state              | Wall     | Transferred  | 304s | Memory-cached scripts | Aggregated net work |
| ---- | ------------------------ | -------- | ------------ | ---- | --------------------- | ------------------- |
| 1    | Cold, cache **enabled**  | 1 903 ms | **18.63 MB** | 1    | 0 (all fresh)         | 7 812 ms            |
| 2    | Warm, cache **enabled**  | 1 178 ms | **86 KB**    | 17   | ~404 in-memory hits   | 2 191 ms            |
| 3    | Warm, cache **DISABLED** | 1 242 ms | **18.69 MB** | 0    | 0                     | 4 953 ms            |
| 4    | Warm, cache **DISABLED** | 1 210 ms | **18.69 MB** | 0    | 0                     | 5 328 ms            |

Every pass: **421 ES-module requests / 435 total requests**.

## Why it gets slow (root cause confirmed)

1. **Vite dev mode never bundles** — `apps/web/` is served as 421 individual ES modules per page load (`@fs/`, `node_modules/.vite/deps/`, `core/*.ts`, `ce/*.ts`).
2. With cache enabled, Chrome serves ~404 of those modules from **in-memory cache** → 86 KB on the wire, ~1.2 s wall.
3. **"Disable cache" turns off both disk and in-memory caches.** Every module is re-fetched, and each goes through Vite's transform middleware (TS → JS, dep-graph check, HMR injection). Wire transfer jumps ~217× (86 KB → 18.69 MB), aggregated network work doubles (2.2 s → 5.3 s).
4. Login submit causes a **navigation** to the workspace home — that page mounts MORE stores/components than the login screen (sidebar, kanban, issue stores, propel widgets…). The number of modules on a workspace page is typically larger than the 421 measured here, so the cache-disabled penalty is proportionally larger.
5. Localhost masks part of the cost (zero RTT). With realistic dev-machine load (api+postgres+celery+vite+admin all running) the per-module 5–30 ms turns into 50–200 ms quickly, multiplying into multi-second waits.

## What to do

### 1. Stop testing perf with "Disable cache" on

The toggle defeats Vite's primary perf mechanism. It's useful when **debugging caching issues**; it's harmful when measuring real UX. Either uncheck it, or test against a production build (`pnpm build && pnpm start`) — production serves a few bundled chunks instead of 421 modules.

### 2. Pre-bundle hot packages in Vite

Currently `@plane/utils` (730 KB), `@plane/constants` (390 KB), `@plane/services` (370 KB), `@plane/i18n` (1.26 MB across 18 files), `@plane/propel` (16 files / 920 KB) are served as raw ESM. Force Vite to pre-bundle them by adding to `apps/web/vite.config.ts`:

```ts
optimizeDeps: {
  include: [
    "@plane/utils",
    "@plane/constants",
    "@plane/services",
    "@plane/i18n",
    "@plane/propel/button",
    "@plane/propel/dialog",
    "@plane/propel/input",
    "@plane/propel/toast",
    // …any other propel subpaths used on hot paths
  ],
}
```

This collapses dozens of file requests into a handful of `.vite/deps/*.js` chunks, which are aggressively cached by Vite (immutable URL + content-hash).

### 3. Warm hot routes on dev-server boot

```ts
server: {
  warmup: {
    clientFiles: [
      "./app/root.tsx",
      "./app/routes/_app.tsx",
      "./core/components/account/auth-forms/password.tsx",
    ],
  },
}
```

Forces Vite to transform these files at startup so the first cache-disabled hit doesn't pay transform cost.

### 4. Reduce module count at the source

Spot-check candidates from the slowest-5 in pass 4:

- `core/store/worklog.store.ts`
- `ce/services/workflow.service.ts`
- `core/services/worklog.service.ts`
- `core/store/issue/issue_calendar_view.store.ts`

These (and many siblings) are imported eagerly at app bootstrap. Lazy-load route-specific stores/services where possible via dynamic `import()` so they're not in the cold-path graph.

### 5. Perceived-latency win (no perf change)

Show the spinner/skeleton **on submit click** before navigation completes — Plane already has `logo-spinner.svg` (the slowest non-doc resource at 145 ms first hit). Wiring it to the auth form's submitting state masks the module-fetch waterfall.

## Verification commands

```bash
# Re-run the comparison after any vite.config change:
node .claude/chrome-devtools/tmp/cache-disabled-load-test.js

# Quick prod-build sanity:
cd apps/web && pnpm build && pnpm start
# Then re-measure: wall time should drop ~3-5× with cache disabled.
```

Artifacts: `.claude/chrome-devtools/logs/login-test/cache-comparison.json`

## Unresolved Questions

1. Are you observing this against `pnpm dev` (Vite) or a built/staged environment? The fix scope is very different.
2. Roughly how many seconds is "very long" for you — 3 s? 10 s? 30 s? That tells us whether module count or per-module transform time is dominant.
3. Is the workspace home you're landing on Kanban, Dashboard, or Inbox? The module sets differ and we can target the heaviest one.
