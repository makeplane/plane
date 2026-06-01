# Phase 05 — Menu + Route + Page Scaffold + Filter Bar

**Priority:** P1 | **Status:** pending | **Depends:** 04

## Overview

Register "Usage Monitor" in the God-Mode sidebar + router, build the page shell with 3 tabs and a shared filter bar (granularity, date range, workspace).

## Key Insights

- Menu: add key to `TCoreSidebarMenuKey` + `coreSidebarMenuLinks` (`core.ts`) and to `useSidebarMenu()` array (`index.ts`). `verified by apps/admin/hooks/use-sidebar-menu/core.ts:25-119`
- **`useSidebarMenu()` is a hand-maintained array** — a key in `coreSidebarMenuLinks` does NOT auto-render. It already omits `job-positions` (defined in `core.ts`, missing from the `index.ts` array). A forgotten array push produces NO TS error. → both edits are required; Phase 07 must verify the item _renders_, not just compiles.
- Route: add `route("usage-monitor", "./(all)/(dashboard)/usage-monitor/page.tsx")` to `routes.ts:41`.
- Page shell + tabs pattern. `verified by apps/admin/app/(all)/(dashboard)/monitoring/page.tsx` (PageWrapper + tab state + observer)
- Workspace filter options: reuse admin `workspace.store.ts` / `useWorkspace`. **Verify the exact list accessor + fetch action exist before wiring** (don't assume); if no fetch-on-mount, trigger it in the filter bar.
- English-only, Propel components, inputs `bg-layer-2`.

## Architecture

1. `core.ts`: add `"usage-monitor"` to union + entry `{ Icon: Gauge, name: "Usage Monitor", description: "Track user activity and logged-time usage.", href: "/usage-monitor/" }` (import `Gauge` from lucide-react).
2. `index.ts`: add `coreSidebarMenuLinks["usage-monitor"]` to the returned array (explicit position; this is a SEPARATE required edit — TS won't catch its omission).
3. `routes.ts`: add the route line.
4. `app/(all)/(dashboard)/usage-monitor/page.tsx` (observer): `PageWrapper` header "Usage Monitor"; tab state `TUsageMonitorTab`; render `<UsageFilterBar/>` + `<UsageMonitorTabs/>` + active dashboard. `export const meta` → title "Usage Monitor - God Mode".
5. `components/usage-monitor-tabs.tsx`: 3-tab switcher (Active Users / Standard Users / Departments) — Propel tabs or simple button group like monitoring-tabs.
6. `components/usage-filter-bar.tsx` (observer): **range preset selector** (week / month / 3-month / custom — button group or Propel Menu), date_from/date_to inputs (`bg-layer-2`) shown only when preset = `custom`, granularity select (day/month/year), workspace dropdown (Propel Menu) populated from workspace store; on change → `setFilters` + refetch active tab's data. Default preset `month`.

## Related Code Files

- Modify: `apps/admin/hooks/use-sidebar-menu/core.ts`, `apps/admin/hooks/use-sidebar-menu/index.ts`, `apps/admin/app/routes.ts`
- Create: `app/(all)/(dashboard)/usage-monitor/page.tsx`, `components/usage-monitor-tabs.tsx`, `components/usage-filter-bar.tsx`
- Read: `apps/admin/store/workspace.store.ts`, `apps/admin/components/common/page-wrapper.tsx`

## Implementation Steps

1. Wire menu (core + index).
2. Add route.
3. Build page.tsx with tab state; default tab "active-users"; trigger initial fetch on mount + on filter change.
4. Build tabs + filter bar components (<150L each).
5. `tsc --noEmit` + dev render check.

## Todo

- [ ] Menu entry (core.ts + index.ts)
- [ ] Route line
- [ ] page.tsx
- [ ] usage-monitor-tabs.tsx
- [ ] usage-filter-bar.tsx
- [ ] compiles + menu visible

## Success Criteria

"Usage Monitor" **renders** in God-Mode sidebar (verify in browser, not just tsc — the array is hand-maintained); navigating renders page with working tab switch + filter bar (preset week/month/3-month/custom, custom reveals date inputs) that refetches. Workspace dropdown populated from a verified store accessor.

## Next

Phase 06 fills each tab with charts.
