# Tester Report — Dashboard Feature Fixes Validation

**Date:** 2026-02-27
**Scope:** Dashboard feature implementation fixes (backend + frontend)

---

## Summary

| Check                     | Status           |
| ------------------------- | ---------------- |
| Python syntax (4 files)   | PASS             |
| **init**.py registrations | PASS             |
| File size compliance      | PARTIAL FAIL     |
| TypeScript type check     | FAIL — 19 errors |

---

## 1. Python Syntax Check — PASS

All 4 backend files compile cleanly:

```
plane/app/views/dashboard.py             EXIT:0
plane/app/serializers/dashboard.py       EXIT:0
plane/db/models/dashboard.py             EXIT:0
plane/utils/dashboard_chart_aggregation.py EXIT:0
```

---

## 2. Registration Check — PASS

All dashboard items registered in `__init__.py` files:

**Models** (`plane/db/models/__init__.py`):

```
line 95: from .analytics_dashboard import AnalyticsDashboard, AnalyticsDashboardWidget
line 96: from .dashboard import Dashboard, DashboardWidget
```

**Views** (`plane/app/views/__init__.py`):

```
line 41:  UserWorkspaceDashboardEndpoint
line 243: AnalyticsDashboardEndpoint
line 244: AnalyticsDashboardDetailEndpoint
line 245: AnalyticsDashboardWidgetEndpoint
line 246: AnalyticsDashboardWidgetDetailEndpoint
line 247: AnalyticsDashboardWidgetDataEndpoint
line 267: DashboardViewSet, DashboardWidgetViewSet, DashboardWidgetChartEndpoint
```

**Serializers** (`plane/app/serializers/__init__.py`):

```
line 137: from .dashboard import DashboardSerializer, DashboardWidgetSerializer
```

---

## 3. File Size Compliance — PARTIAL FAIL

| File                                               | Lines | Limit | Status          |
| -------------------------------------------------- | ----- | ----- | --------------- |
| `plane/app/views/dashboard.py`                     | 191   | 200   | PASS (marginal) |
| `plane/utils/dashboard_chart_aggregation.py`       | 131   | 200   | PASS            |
| `plane/app/serializers/dashboard.py`               | 60    | 200   | PASS            |
| `ce/store/dashboards/dashboard.store.ts`           | 189   | 200   | PASS (marginal) |
| `core/services/dashboards/dashboard.service.ts`    | 120   | 200   | PASS            |
| `ce/components/dashboards/widget-config-modal.tsx` | 164   | 150\* | FAIL (+14)      |
| `ce/components/dashboards/widget-adapter.tsx`      | 160   | 150\* | FAIL (+10)      |
| `ce/components/dashboards/widget-context-menu.tsx` | 75    | 150\* | PASS            |
| `ce/hooks/store/use-custom-dashboard.ts`           | 10    | 100\* | PASS            |
| `app/(all)/.../dashboards/[dashboardId]/page.tsx`  | 160   | 150\* | FAIL (+10)      |
| `app/(all)/.../dashboards/page.tsx`                | 169   | 150\* | FAIL (+19)      |
| `app/routes/.../dashboards/[dashboardId]/page.tsx` | 189   | 150\* | FAIL (+39)      |

\*React component limit per design rules is 150 lines.

---

## 4. TypeScript Type Check — FAIL (19 errors)

Errors grouped by category:

### A. Missing types in `@plane/types` (11 errors) — PRE-EXISTING

These are unrelated to the dashboard fixes — missing exports from `packages/types/src/analytics.ts`:

- `AnalyticsTableDataMap`
- `CycleInsightColumns`, `IntakeInsightColumns`, `ModuleInsightColumns`, `ProjectInsightColumns`, `WorkItemInsightColumns`, `UserInsightColumns`
- `IAnalyticsParams`

Files affected:

- `core/components/analytics/cycles/cycles-insight-table.tsx`
- `core/components/analytics/insight-table/root.tsx`
- `core/components/analytics/intake/intake-insight-table.tsx`
- `core/components/analytics/modules/modules-insight-table.tsx`
- `core/components/analytics/projects/projects-insight-table.tsx`
- `core/components/analytics/users/users-insight-table.tsx`
- `core/components/analytics/work-items/workitems-insight-table.tsx`
- `core/components/analytics/work-items/customized-insights.tsx`
- `core/components/analytics/select/analytics-params.tsx`

Also pre-existing:

- `core/components/common/logo-spinner.tsx(12)`: `_resolvedTheme` not on `UseThemeProps`
- `core/components/project/form.tsx(231)`: emoji picker type mismatch

### B. Dashboard-specific type errors (8 errors) — INTRODUCED / UNFIXED

**B1. `group_by: string | null` vs `WidgetFormData.group_by: string`**
Location: `app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx:154`
Cause: `IDashboardWidget.group_by` is `string | null` but `WidgetFormData.group_by` expects `string`. The `widget` prop passed to `WidgetConfigModal` is typed `IDashboardWidget` but the prop type is `WidgetFormData | null | undefined`.

**B2. `dashboard` prop doesn't exist on `AnalyticsDashboardDeleteModal`**
Location: `app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx:162`
Cause: Modal `Props` has `dashboardName: string` but page passes `dashboard={deleteDashboard}` (an `IDashboard` object). The modal expects `dashboardName` string, not the full object.

**B3. `TDashboardCreate` mismatch — `Record<string, unknown>` vs typed object**
Locations: `app/(all)/.../dashboards/page.tsx:42` and `app/routes/.../dashboards/page.tsx:44`
Cause: Form submit handlers typed `(data: Record<string, unknown>)` but `createDashboard`/`updateDashboard` expect `TDashboardCreate` (requires `name`, `description`, `access`).

**B4. Routes page: `WidgetFormData` vs `TAnalyticsWidgetCreate | TAnalyticsWidgetUpdate`**
Location: `app/routes/(all)/.../[dashboardId]/page.tsx:182,183`
Cause: `WidgetConfigModal.onSubmit` expects `(data: WidgetFormData) => Promise<void>` but `handleWidgetSubmit` has signature `(data: TAnalyticsWidgetCreate | TAnalyticsWidgetUpdate) => Promise<void>`. Also `configWidget` is `IAnalyticsDashboardWidget | null` but modal expects `WidgetFormData | null`.

**B5. `ToggleSwitch` `id` prop doesn't exist**
Location: `analytics-dashboard-form-modal.tsx:149`
Cause: `IToggleSwitchProps` has no `id` field (`value`, `onChange`, `label`, `size`, `disabled`, `className` only).

**B6. `Button variant="neutral"` invalid**
Location: `analytics-dashboard-form-modal.tsx:160`
Cause: Propel `Button` valid variants are `primary`, `secondary`, `tertiary`, `ghost`, `error-fill`, `error-outline`, `link`. `"neutral"` is not defined.

---

## Critical Issues (Blocking)

1. **B2** — Delete modal passed wrong prop (`dashboard` object instead of `dashboardName` string) — runtime crash on delete.
2. **B3** — Form submit type mismatch on create/update — will cause TypeScript build failure.
3. **B4** — Routes page `onSubmit`/`widget` type incompatibility — type-level break between two dashboard implementations.
4. **B6** — Invalid `Button` variant — propel will use default instead of intended style (visual regression only, not runtime crash).

---

## Recommendations

### Must-fix (blocking TS build):

1. **`analytics-dashboard-delete-modal`** — change `Props` to accept `dashboard: IDashboard` and derive `dashboardName` internally, OR update call site in `page.tsx` to pass `dashboard={deleteDashboard}` as `dashboardName={deleteDashboard?.name ?? ""}`.

2. **Dashboard page form handlers** — type submit callbacks as `(data: TDashboardCreate)` instead of `Record<string, unknown>`. Use `useForm<TDashboardCreate>` in the form modal.

3. **`IDashboardWidget.group_by` vs `WidgetFormData.group_by`** — either make `WidgetFormData.group_by: string | null` and handle null in the form, or coerce on the call site: `widget={{ ...selectedWidget, group_by: selectedWidget.group_by ?? "" }}`.

4. **Routes page widget submit** — align `WidgetConfigModal.onSubmit` signature with `TAnalyticsWidgetCreate | TAnalyticsWidgetUpdate`, or add an adapter function in the page that maps `WidgetFormData` → service types.

5. **ToggleSwitch `id` prop** — remove the `id` attribute from `ToggleSwitch` usage.

6. **`Button variant="neutral"`** — change to `variant="secondary"` or `variant="tertiary"` (closest equivalents).

### Non-blocking (style compliance):

7. Split `app/routes/.../[dashboardId]/page.tsx` (189 lines) — extract grid section into sub-component to stay under 150.
8. Split `app/(all)/.../dashboards/page.tsx` (169 lines) — extract delete confirmation section.

### Pre-existing (not introduced by this PR):

9. Missing `AnalyticsTableDataMap`, `IAnalyticsParams`, and column types from `@plane/types` — these existed before and block analytics insight tables, should be addressed separately.

---

## Unresolved Questions

1. Are `app/(all)/[workspaceSlug]/(projects)/dashboards/` and `app/routes/(all)/[workspaceSlug]/(projects)/dashboards/` two parallel implementations or a migration in progress? The routes version has `IAnalyticsDashboard` types while the app version uses `IDashboard`. If both coexist, the type systems need to be unified.

2. Is `dashboard_chart_aggregation.py` registered anywhere for import beyond `dashboard.py`? It's new but not imported via `__init__.py` — confirm this is intentional (internal utility, not exported).
