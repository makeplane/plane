# Phase 04 — Admin Store + Hook + Root Registration

**Priority:** P1 | **Status:** pending | **Depends:** 03

## Overview

MobX store holding filters + 2 datasets, fetch actions, registered on the admin RootStore with a `useUsageMonitor` hook. `buildParams` resolves `date_from/date_to` once (single source) and always sends explicit dates. Range is preset-driven (week / month / 3-month / custom).

## Key Insights

- **Read `apps/admin/store/monitoring.store.ts` and `apps/admin/store/workspace.store.ts` first** to pick the house loader convention. `workspace.store.ts:30` uses a single `loader: TLoader` enum; confirm whether monitoring uses per-key records or `TLoader`. Match the dominant sibling pattern — do not invent a bespoke loader shape.
- `makeObservable` explicit map, `runInAction` for async, service instantiated in ctor.
- Registered in `RootStore` ctor AND `resetOnSignOut`. `verified by apps/admin/store/root.store.ts:42-82`
- Hook: `useContext(StoreContext).<store>`. `verified by apps/admin/hooks/store/use-monitoring.tsx`
- Param assembly is the **single source of truth** here — filter bar only calls `setFilters(partial)`; the view-side parsing is just validation/fallback.

## Architecture

Create `apps/admin/store/usage-monitor.store.ts` — `UsageMonitorStore implements IUsageMonitorStore`:

- observables: `filters: TUsageFilters` (default `{granularity:"day", preset:"month", date_from, date_to}` — dates resolved on init via `presetRange("month")`), `users: TUsageUsersResponse | null`, `departments: TDepartmentsResponse | null`, loader/error per chosen convention.
- actions: `setFilters(partial)` (selecting a preset re-resolves `date_from/date_to`; selecting `preset:"custom"` keeps caller-supplied dates), `fetchUsers()`, `fetchDepartments()` — each builds params from `filters` and stores result via `runInAction`. Returns are already typed `T*Response` (no cast).
- `buildParams()` private helper → `Record<string,string>` (granularity, date_from, date_to, workspace_id) — the ONLY place params are assembled.
- `presetRange(preset)` → resolves `week` (last 7d) / `month` (last 30d) / `3-month` (last 92d) to explicit ISO dates client-side; `custom` is a passthrough of user-picked dates. Both endpoints share one window. All presets stay within the daily-grain 92-day cap.

Create hook `apps/admin/hooks/store/use-usage-monitor.tsx` (mirror use-monitoring).

Modify `apps/admin/store/root.store.ts`:

- import type + class, add field `usageMonitor: IUsageMonitorStore`, instantiate in ctor + `resetOnSignOut` (`new UsageMonitorStore(this)`).

## Related Code Files

- Create: `apps/admin/store/usage-monitor.store.ts`, `apps/admin/hooks/store/use-usage-monitor.tsx`
- Modify: `apps/admin/store/root.store.ts`
- Read first: `apps/admin/store/monitoring.store.ts`, `apps/admin/store/workspace.store.ts` (loader convention)

## Implementation Steps

1. Confirm loader convention from sibling stores.
2. Write store: 2 fetchers + buildParams + presetRange (week/month/3-month/custom) + loading/error tracking.
3. Add hook.
4. Register in root.store (ctor + resetOnSignOut).
5. `tsc --noEmit` in apps/admin.

## Todo

- [ ] usage-monitor.store.ts (<200L)
- [ ] use-usage-monitor.tsx
- [ ] root.store.ts registration (2 spots)
- [ ] loader convention matches siblings
- [ ] type-check passes

## Success Criteria

`useUsageMonitor()` returns store; 2 fetchers populate observables with typed data; preset (week/month/3-month/custom) resolves dates client-side once; loading/error per dataset; compiles.

## Next

Phase 05 builds menu/route/page scaffold consuming the store.
