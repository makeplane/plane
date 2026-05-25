---
phase: 2
title: "Vite Dev-Mode Speedup"
status: pending
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: Vite Dev-Mode Speedup

## Overview

Cut dev-mode cold-load time on authenticated pages (currently 1442 ES modules / ~17s login) by pre-bundling hot workspace packages and warming the workspace shell on dev-server boot.

**Scope-cut from original plan:** lazy-loading route-specific MobX stores was removed after red-team review — dev-only ROI, real MobX race risk against cross-store `computed`/`reaction`, and zero prod-bundle impact (static imports in `apps/web/ce/store/root.store.ts:7-26` are already tree-shaken/code-split by RR7 build).

**Stack note:** `apps/web` is **React Router v7 framework mode** (`react-router dev` / `react-router build` wrapping Vite via `@react-router/dev/vite`). All Vite config below must be verified to take effect through the RR7 plugin layer — see Step 0.

## Context Links

- Report: `plans/reports/debug-260522-1514-authenticated-pages-perf.md` (§ "Recommendations" 2-3, 6)
- Vite config: `apps/web/vite.config.ts` (no `optimizeDeps` / `warmup` blocks today)
- CE RootStore: `apps/web/ce/store/root.store.ts:43-52` (10 stores instantiated eagerly)
- Workspace layout: `apps/web/app/(all)/[workspaceSlug]/layout.tsx`
- HO page: `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/page.tsx`

## Key Insights

- `@plane/utils` (730 KB), `@plane/constants` (390 KB), `@plane/services` (370 KB), `@plane/i18n` (1.26 MB / 18 files), `@plane/propel/*` (16 files / 920 KB) are served as raw ESM today.
- `HoIssueStore`, `WorklogStore`, `DashboardStore`, `WorkflowStore`, `TimelineStore`, `ModuleActivityStore`, `TaskCategoryStore`, `ProjectCopyStore` mount on every workspace route regardless of page.
- Cache-enabled warm load: 264 KB / 1236 304s — Vite's revalidation works well when warm. Goal is to make cold + post-login warm both cheap.

## Requirements

- Functional: dev-mode cold authenticated-page load reduces ≥40% in wall-time
- Non-functional: zero prod-build behavioral change; HMR remains snappy; no regressions in `/ho/`, `/profile/`, kanban, calendar, gantt routes

## Architecture

Two independent changes, each measurable in isolation:

1. **Pre-bundle hot packages** via `optimizeDeps.include` → collapses N module requests into a few `.vite/deps/*.js` chunks (content-hashed, aggressively cached).
2. **Warm hot routes** via `server.warmup.clientFiles` → forces Vite to transform shell modules at boot, removing first-hit transform cost.

## Related Code Files

- Modify: `apps/web/vite.config.ts`
- Modify: root `package.json` (add `clean:vite` script)
- Read for context: `packages/propel/package.json` `exports` field (canonical subpath list)
- Read for context: `apps/web/core/hooks/store/use-*.ts`

## Implementation Steps

0. **RR7 plugin verification (BLOCKER — do first).**
   - Confirm `apps/web` runs under `@react-router/dev/vite` plugin (grep `vite.config.ts` for `reactRouter()`).
   - Add `optimizeDeps.include` with **one entry only** (e.g. `@plane/utils`), boot dev server with `pnpm dev --debug`, and verify the package is bundled into `.vite/deps/*` (check log lines `optimized dependency`).
   - Add `server.warmup.clientFiles` with **one file only**, restart, verify Vite logs a `warmup` transform for that file before first request.
   - Only proceed to steps 1–2 if both hooks fire. If RR7 plugin intercepts/overrides either, document in artifact and revise approach.

1. **Add `optimizeDeps.include` to `apps/web/vite.config.ts`:**
   - **Verify canonical Propel subpaths first.** Read `packages/propel/package.json` `exports` field — known valid subpaths in this repo: `button`, `dialog`, `input`, `toast`, `popover`, `tooltip`, `combobox`, `switch`, `menu`. There is **no** `select` or `checkbox` subpath — the previous draft was wrong.
   - Build include list from grep of actual `from "@plane/propel/..."` imports in `apps/web/{core,ce}`. Example final shape:
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
         "@plane/propel/popover",
         "@plane/propel/tooltip",
         "@plane/propel/combobox",
         "@plane/propel/menu",
         "@plane/propel/switch",
         // extend per grep results
       ],
     },
     ```
   - Alternative: if the grep yields >15 propel subpaths, evaluate switching to a single `@plane/propel` entry (only if barrel export exists in `packages/propel/package.json`).

2. **Add `server.warmup.clientFiles`:**

   ```ts
   server: {
     warmup: {
       clientFiles: [
         "./app/(all)/[workspaceSlug]/layout.tsx",
         "./app/(all)/[workspaceSlug]/(projects)/ho/page.tsx",
         "./app/(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx",
         "./core/components/account/auth-forms/password.tsx",
         "./ce/store/root.store.ts",
       ],
     },
   },
   ```

3. **Add `clean:vite` script to root `package.json`:**

   ```json
   "clean:vite": "rm -rf apps/web/node_modules/.vite apps/admin/node_modules/.vite apps/space/node_modules/.vite"
   ```

   Document in commit message and `docs/codebase-summary.md`: "If dev server behaves oddly after pulling, run `pnpm clean:vite`."

4. **Re-run `authenticated-pages-perf-test.js`** against dev — compare module count, wall time, transferred bytes against the report's baseline. Save to `artifacts/dev-after-phase2.json`.

5. **Regression sanity:** manual smoke `/ho/`, `/profile/`, `/projects/*/kanban`, calendar, gantt, worklog views. Confirm HMR latency on a trivial edit still <500 ms.

## Success Criteria

- [ ] RR7 verification step proves both `optimizeDeps` and `warmup` fire under the `@react-router/dev/vite` plugin
- [ ] `apps/web/vite.config.ts` contains `optimizeDeps.include` (Propel subpaths verified against `packages/propel/package.json` exports) + `server.warmup.clientFiles`
- [ ] Root `package.json` has `clean:vite` script
- [ ] Cold authenticated-page wall-time drops ≥40% vs report baseline (3028 ms → ≤1800 ms)
- [ ] Module count drops from 1442 to ≤700
- [ ] No console errors in smoke routes
- [ ] HMR latency on a trivial component edit still <500 ms

## Risk Assessment

- **Risk:** RR7 plugin overrides or ignores `optimizeDeps`/`warmup`. **Mitigation:** Step 0 verifies with single-entry probe before full config rollout.
- **Risk:** wrong Propel subpaths break optimize-deps cold-boot. **Mitigation:** verify each subpath against `packages/propel/package.json` `exports` before committing.
- **Risk:** `optimizeDeps.include` cache invalidation issues across team. **Mitigation:** `clean:vite` script + commit-message note + `docs/codebase-summary.md` entry.
- **Risk:** warmup increases dev-server boot time. **Mitigation:** acceptable trade-off (boot is once-per-session); measure boot delta and document.

## Rollback

- Revert `apps/web/vite.config.ts` to remove `optimizeDeps.include` and `server.warmup`.
- Run `pnpm clean:vite` to flush the bundled deps cache.
- Restart dev server. No DB/schema impact; rollback is a single-file revert.

## Security Considerations

None — config + lazy-load only.

## Next Steps

- Phase 3 (backend) can run in parallel with Phase 2 (different stack).
- Phase 4 depends on Phase 1 results to confirm 27-XHR pattern survives prod build.
