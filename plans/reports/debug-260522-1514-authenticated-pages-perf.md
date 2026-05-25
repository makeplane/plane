# Authenticated Pages Performance — `/yesyes/ho/` & `/yesyes/profile/…`

**Date:** 2026-05-22 15:14 +07
**Env:** Local dev (Vite `:3000` + Django `:8000`), Puppeteer-driven Chrome 148, fresh cookies/cache, viewport 1440×900
**Method:** Real login (Enter-key submit), then 4 navigations per URL: cold/warm/cache-disabled × 2
**Artifacts:** `.claude/chrome-devtools/logs/login-test/authenticated-pages.json`, `tmp/authenticated-pages-perf-test.js`

## Headline numbers

| Event                                        | Wall          |
| -------------------------------------------- | ------------- |
| **Login submit → workspace home (cold)**     | **17 463 ms** |
| `/yesyes/ho/?view=datasheet` cold (cache on) | 3 028 ms      |
| `/yesyes/profile/…/` cold (cache on)         | 2 751 ms      |

The 17.5 s login is the **real user pain**. After `POST /auth/sign-in/` the browser hard-navigates to `/yesyes/`, which mounts 1442 fresh ES modules + ~25 XHRs in serial dependency chains. Subsequent client-side route changes are ~2-3 s because most modules are in memory.

## Per-page table (4 passes each)

### `/yesyes/ho/?view=datasheet`

| Pass                 | Wall     | Reqs | Scripts | XHRs | Transferred | Net work  | 304s      |
| -------------------- | -------- | ---- | ------- | ---- | ----------- | --------- | --------- |
| Cold, cache enabled  | 3 028 ms | 1480 | 1445    | 25   | **1.62 MB** | 21 876 ms | 15        |
| Warm, cache enabled  | 2 071 ms | 1480 | 1445    | 25   | **264 KB**  | 8 674 ms  | **1 236** |
| Warm, cache DISABLED | 2 088 ms | 1484 | 1445    | 25   | **43.9 MB** | 58 880 ms | 0         |
| Warm, cache DISABLED | 2 940 ms | 1484 | 1445    | 25   | **43.9 MB** | 49 287 ms | 0         |

### `/yesyes/profile/11d01b65…/`

| Pass                 | Wall     | Reqs | Scripts | XHRs | Transferred    | Net work  | 304s      |
| -------------------- | -------- | ---- | ------- | ---- | -------------- | --------- | --------- |
| Cold, cache enabled  | 2 751 ms | 1480 | 1442    | 27   | **43.2 MB** \* | 50 239 ms | 1         |
| Warm, cache enabled  | 2 581 ms | 1476 | 1442    | 24   | **264 KB**     | 9 452 ms  | **1 233** |
| Warm, cache DISABLED | 2 187 ms | 1480 | 1442    | 24   | **43.3 MB**    | 58 388 ms | 0         |
| Warm, cache DISABLED | 2 888 ms | 1480 | 1442    | 24   | **43.3 MB**    | 52 782 ms | 0         |

`*` Profile's cold pass had no warm cache from prior `/ho/` because cache was cleared between targets.

## Key observations

1. **1442 modules per authenticated page** — 3.4× more than the login screen (421). The workspace app eagerly imports the entire core+ce store graph, kanban, calendar, gantt, propel widgets, etc., even when the route only needs a subset.
2. **Disable Cache penalty is severe**: transferred bytes go from **264 KB → 43.9 MB (~170×)**; aggregated network work **8.7 s → 58.9 s (~6.8×)**. Wall time on localhost barely moves (LAN is free), but on a real network or contended dev machine this is multi-second visible delay.
3. **15 → 1 236 → 0 status-304 responses** across cache-enabled-warm vs cache-disabled. Vite's revalidation path is excellent; "Disable cache" bypasses it entirely.
4. **264 KB warm-cached payload** is identical between the two pages — meaning the common SPA shell is fully memory-cached, only fresh XHR/JSON payloads cross the wire.
5. **Backend hot spot found on `/ho/`** (orthogonal to the cache issue):

   | Endpoint                                                         | Duration | TTFB            |
   | ---------------------------------------------------------------- | -------- | --------------- |
   | `GET /api/ho/filter-options/?from_date=…&to_date=…`              | 424 ms   | 367 ms          |
   | `GET /api/ho/filter-options/?from_date=…&to_date=…` (refire)     | 416 ms   | 381 ms          |
   | `GET /api/ho/issues/?page=1&order_by=project__workspace__name&…` | 407 ms   | 385 ms          |
   | `GET /api/workspaces/yesyes/me/staff-profile/`                   | 96 ms    | 46 ms (**404**) |

   `filter-options` fires **twice**; `issues` once at 407 ms TTFB. With production Vite the page would be JS-cheap and these XHRs become the dominant wait. The 404 on `staff-profile` is also worth checking — it's swallowed quietly but adds latency.

6. **Profile page** XHRs are all healthy (<130 ms), no backend bottleneck. It does fire **27 XHRs** on load including `task-categories/sub`, `task-categories/main`, `members`, `user-stats`, `user-favorites`, `sidebar-preferences`, `work-items/overdue` — opportunity to batch / parallelize / lazy-load some of these.

## What's making login take 17 s

| Stage                                      | Approx contribution      |
| ------------------------------------------ | ------------------------ |
| Form POST `/auth/sign-in/` + 302           | <100 ms (server is fast) |
| Vite re-serve workspace shell (~1442 mods) | ~10–13 s aggregated work |
| 25–27 initial XHRs (sidebar, members, …)   | ~1–2 s serialized        |
| First paint of large datasheet/profile     | ~1 s                     |

The dominant cost is module fetch + transform; the auth call itself is negligible.

## Recommendations (in order of payoff)

1. **Stop testing with "Disable cache" on.** That toggle defeats Vite's primary mechanism. Use production build for any real perf benchmarking.
2. **Pre-bundle hot packages** in `apps/web/vite.config.ts` `optimizeDeps.include`: `@plane/utils`, `@plane/constants`, `@plane/services`, `@plane/i18n`, `@plane/propel/*` subpaths used on hot paths. Reduces 1442 modules → a few hundred.
3. **Warm the workspace shell on server boot**:
   ```ts
   server: {
     warmup: {
       clientFiles: [
         "./app/root.tsx",
         "./app/routes/$workspaceSlug+/_layout.tsx", // adapt to actual route file
         "./core/components/account/auth-forms/password.tsx",
       ];
     }
   }
   ```
4. **Investigate `/api/ho/filter-options/` 400 ms TTFB.** It fires twice on `/ho/` (likely React StrictMode double-render OR redundant fetches in store init). Two fixes: dedupe via SWR/react-query, and profile the Django view (missing index? N+1? heavy aggregation?).
5. **Fix `GET /api/workspaces/yesyes/me/staff-profile/` 404.** Either remove the call or implement the endpoint — silent 404s mask bugs.
6. **Lazy-load route-only modules**: gantt-chart, calendar-view, worklog, workflow-service are imported eagerly on every workspace page per slowest-modules sample. Dynamic `import()` per route would slash the cold graph.
7. **Profile page: batch 27 XHRs.** Consider a single composite endpoint (e.g. `/api/workspaces/{slug}/profile-bootstrap?user_id=…`) returning categories+members+stats+favorites+overdue+sidebar-prefs in one round-trip. Saves 5-10 RTTs.
8. **Perceived-latency**: show the workspace spinner immediately on `Sign In` click. Plane already ships `logo-spinner.svg`; wiring it to `isSubmitting` masks the 17 s shell load.

## Verification commands

```bash
# After any vite.config / module change:
node .claude/chrome-devtools/tmp/authenticated-pages-perf-test.js

# Production-build sanity (the real benchmark):
cd apps/web && pnpm build && pnpm start
# Then re-run the test against http://localhost:3000 (or whatever port)
```

## Unresolved Questions

1. Is the slow `filter-options` query an indexing issue or an aggregation cost? Need a `psql EXPLAIN ANALYZE` on the Django ORM SQL — happy to dig if you want.
2. The double-fire of `filter-options` — is that intentional (different filter sets) or React StrictMode dev-only double invocation? In prod build it would fire once.
3. `staff-profile` 404 — feature in progress, dead code, or actual bug?
4. Is the user expected to land on `/yesyes/ho/` after login, or some other workspace home? Login redirects to `/yesyes/` here.
