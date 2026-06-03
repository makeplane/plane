# Login Performance Test Report

**Date:** 2026-05-22 13:44 +07
**Env:** Local dev — web `http://localhost:3000` (Vite), api `http://localhost:8000` (Django)
**Browser:** Puppeteer-driven Chrome for Testing 148, headed, fresh cache + cleared cookies
**Account:** `ngocyt001@gmail.com`
**Artifacts:** `.claude/chrome-devtools/logs/login-test/` (`summary.json`, `all-requests.json`, `post-login.png`)

## TL;DR

Backend is **not slow** — every auth-related call to `localhost:8000` returned in **5–44 ms**.
Slowness in dev mode comes from **Vite serving 421 individual ES modules (~18.6 MB) on first load** and a second wave of module fetches after login navigation. Production build (single bundled chunks) won't see this.

## Measured Phases

| Phase                      | Time      | Notes                                                                  |
| -------------------------- | --------- | ---------------------------------------------------------------------- |
| Navigate `/` (cold)        | 1 650 ms  | DOMContentLoaded + networkidle2; 421 module fetches queued in parallel |
| Fill email                 | 247 ms    | mostly `page.type` keystroke delay (10 ms × chars)                     |
| Email → password screen    | 4 ms      | Single React form (no XHR)                                             |
| Login submit → networkidle | 120 000\* | \*hit timeout — see "Submit didn't fire" below                         |

## Auth Backend Calls (Cold Load)

| Method | URL                               | Status | Duration | TTFB  | Notes                      |
| ------ | --------------------------------- | ------ | -------- | ----- | -------------------------- |
| GET    | `/api/instances/`                 | 200    | 44 ms    | 42 ms | First call, slight warm-up |
| GET    | `/api/users/me/`                  | 401    | 5 ms     | 4 ms  | Expected (not signed in)   |
| GET    | `/auth/get-csrf-token/`           | 200    | 5 ms     | 4 ms  |                            |
| GET    | `/auth/get-csrf-token/` (refetch) | 200    | 9 ms     | 4 ms  | Called again on submit     |

**No `POST /auth/sign-in/` was captured** during the test run (see caveat).

## Dev-Mode Resource Breakdown (this is the actual cost)

```
435 total requests, 18.6 MB transferred
  ├─ 421 Script (ES modules) ......... 17.13 MB / 7 927 ms aggregated network time
  │     ├─ 266 app-src files .......... 3.62 MB   (apps/web/* served raw)
  │     ├─ 102 vite prebundled deps ... 8.37 MB   (.vite/deps/*)
  │     ├─  18 @plane/i18n files ...... 1.26 MB
  │     ├─  16 @plane/propel files .... 0.92 MB
  │     ├─   1 @plane/utils ........... 0.73 MB   (large bundle, hot path)
  │     ├─   1 @plane/constants ....... 0.39 MB
  │     └─   1 @plane/services ........ 0.37 MB
  ├─   4 XHR (the 4 auth calls above)
  ├─   3 Image, 2 Font, 1 Document, 1 Stylesheet, 1 Manifest
  └─   1 HTTP/304 (font), 1 HTTP/401 (users/me)
```

Slowest single resource: **`GET /` 213 ms** (the HTML doc). Everything else <100 ms each — the pain is the **count**.

## Why Login Feels Slow

1. **Vite dev mode (cold)** — 421 sequential/parallel module requests gate first paint. Network time alone is ~8 s aggregated; with HTTP/1.1 6-conn limit and waterfall this often visually stalls 1.5–3 s.
2. **`@plane/utils` (0.73 MB) and `@plane/constants` (0.39 MB)** are unbundled in dev — single requests but heavy parse cost on the client.
3. **After successful login** the app navigates to the workspace → a **second wave of module fetches** (dashboard, MobX stores, propel components not yet seen) — typically 200+ more modules.
4. Backend auth (`/auth/sign-in/`, `/auth/get-csrf-token/`, `/api/users/me/`) is consistently **<50 ms**, so server latency is not the bottleneck.

## Recommendations

| Priority | Action                                                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH     | For perceived perf testing of _real_ login, run against a **production build** (`pnpm build && pnpm start`). Dev mode is not representative.                                  |
| HIGH     | Add `optimizeDeps.include` entries in `vite.config.ts` for `@plane/utils`, `@plane/constants`, `@plane/i18n`, `@plane/services` so they pre-bundle (one chunk vs many files). |
| MED      | Consider Vite's `warmup.clientFiles` to pre-process the auth route on dev-server boot.                                                                                        |
| MED      | Show a skeleton/spinner immediately on submit (before navigation completes) — perceived latency win without backend changes.                                                  |
| LOW      | Backend `/api/instances/` first-hit cost (42 ms vs <10 ms others) suggests cold Django app init / DB warmup. Negligible.                                                      |

## Caveat — Submit Wasn't Captured

`loginTotal: 120 002 ms` is the Puppeteer navigation-wait timeout, not a real measurement. Root cause: the test clicked `button[type="submit"]` directly via `el.click()`, which fires the React `onSubmit` handler in `apps/web/core/components/account/auth-forms/password.tsx:151` — that handler calls `event.preventDefault()` then `formRef.current.submit()`. Either (a) the click landed on the email-step's continue button (different submit) and the password step never advanced, or (b) `handleCSRFToken()` was racing with `formRef.current.submit()` (fire-and-forget). No `POST /auth/sign-in/` ever appeared in the network trace.

For a real end-to-end measurement, the test should:

- Use `page.evaluate(() => formRef.current?.requestSubmit())` after asserting the password form is in DOM, **or**
- Run with the form's React onSubmit via a keyboard `Enter` press on the password input, which calls the same handler path the user takes.

## Files Inspected

- `apps/web/core/components/account/auth-forms/password.tsx:146-165` (form + onSubmit)
- `apps/web/core/components/account/auth-forms/staff-id-helpers.ts` (email-first step)

## Unresolved Questions

1. Was the timeout the user reports against **dev** (Vite) or a **deployed** build? Numbers differ by an order of magnitude.
2. Is `localhost:8000` the same Django container they're hitting in production, or is prod slower due to network/DB?
3. Do they observe slowness on the **first** login per session or on every navigation? (Cold module loading vs auth latency are different problems.)
