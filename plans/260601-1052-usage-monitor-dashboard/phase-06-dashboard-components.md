# Phase 06 — 3 Dashboard Chart Components

**Priority:** P1 | **Status:** pending | **Depends:** 05

## Overview

Render the three dashboards using Propel charts (Recharts) fed by the store (`users` + `departments` datasets).

## Key Insights

- Propel charts via subpath: `@plane/propel/charts/line-chart|bar-chart|pie-chart`. `verified by packages/propel/package.json` exports.
- Chart prop types are **generic with mandatory fields**: `TBarChartProps<K,T>`; `TBarItem` requires `stackId`, `textClassName`, and `fill` (string|fn). `TPieChartProps<K,T>` requires `data`, `dataKey`, `cells`, `showLabel`. `verified by packages/types/src/charts/index.ts:71-90,160-175`. The example carries a `// TODO: fix types` on the `fill` fn (`apps/web/core/components/profile/overview/priority-distribution.tsx:44`).
- **Grouped-bar spike first**: the Departments comparison wants side-by-side bars (active vs standard per workspace), but `stackId` is mandatory. Confirm whether distinct `stackId`s render grouped vs stacked in the Propel wrapper BEFORE building; document the working prop set.
- Chart fills: inline a small `const CHART_COLORS = {...}` in the component(s) (≤5 hex values, feature-local) — no separate colors module (YAGNI; precedent inlines fills).

## Architecture

1. `components/active-users-dashboard.tsx` (observer): on mount/filter → `fetchUsers`. LineChart (or BarChart for day) of `users.series_active` x=`period` y=`active_users`; headline stat `users.total_active_users`. Loading + empty states.
2. `components/standard-users-dashboard.tsx` (observer): `fetchUsers`. PieChart from `users.pie` (`standard_users` vs `non_standard_users`) with `dataKey` + 2 `cells`; plus a **stacked** BarChart of `users.series_standard` stacking `standard_user_days` + `non_standard_user_days` (non-overlapping — sum = active user-days). Show counts.
3. `components/departments-dashboard.tsx` (observer): `fetchDepartments`. Grouped BarChart comparing `departments.workspaces` (bars: active_users, standard_users) + a chart/table for `total_logged_minutes` (min→hours). When a workspace is selected, show `departments.projects` per-project logtime bar. **Label note: per-workspace counts; a user active in multiple workspaces appears in each row → sum may exceed the instance `total_active_users` (intentional, deduped only at instance level).**

## Related Code Files

- Create: `usage-monitor/components/active-users-dashboard.tsx`, `standard-users-dashboard.tsx`, `departments-dashboard.tsx`
- Modify: `usage-monitor/page.tsx` (render active dashboard by tab)
- Read: `apps/web/core/components/profile/overview/priority-distribution.tsx`, `apps/web/core/components/analytics/**` for chart usage patterns

## Implementation Steps

1. Grouped-bar spike: confirm Propel BarChart grouped rendering + full mandatory `TBarItem` field set.
2. Active Users dashboard (line/bar + total).
3. Standard Users dashboard (pie + non-overlapping stacked bar).
4. Departments dashboard (grouped bar + hours + project drilldown + multi-ws label).
5. Wire into page tab switch.
6. `tsc --noEmit` + visual render.

## Todo

- [ ] grouped-bar spike documented
- [ ] active-users-dashboard.tsx (<150L)
- [ ] standard-users-dashboard.tsx (<150L)
- [ ] departments-dashboard.tsx (<150L)
- [ ] page wires tabs to dashboards
- [ ] compiles, charts render with data + empty/loading states; multi-ws label present

## Success Criteria

All 3 dashboards render real data; pie shows standard vs non-standard; standard stacked bar is non-overlapping; departments grouped bar compares workspaces; minutes shown as hours; filter changes update charts; multi-workspace reconciliation note visible.

## Risk

- Min→hour display: divide by 60, 1 decimal. Label axes clearly.
- Empty data → Propel EmptyStateCompact, no chart crash.
- Grouped vs stacked: resolved by step-1 spike, not assumed.

## Next

Phase 07 integration + review.
