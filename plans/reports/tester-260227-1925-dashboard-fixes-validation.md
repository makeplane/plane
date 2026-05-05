# Tester Report: Dashboard Fixes Validation

**Date:** 2026-02-27
**Scope:** Dashboard feature — split CRUD views, chart endpoint extraction, WidgetAdapter, form modal, store rollback

---

## Test Results Overview

| Suite                               | Run           | Passed   | Failed | Errors | Skipped |
| ----------------------------------- | ------------- | -------- | ------ | ------ | ------- |
| Backend unit (no DB)                | 105           | 81       | 24     | 0      | —       |
| Backend unit (DB required)          | —             | —        | —      | 23     | —       |
| Frontend TypeScript (`check:types`) | 22 errors     | —        | —      | —      | —       |
| Frontend ESLint (`check:lint`)      | 4544 warnings | 0 errors | —      | —      | —       |

---

## 1. Backend Python Tests

**Command:** `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost/plane_test uv run python -m pytest plane/tests/unit/ -q --nomigrations`

**Infrastructure:** No local PostgreSQL or Redis running. DB-requiring tests (models, serializers, bg_tasks) errored with `OperationalError: connection refused`. This is an environment constraint, not a code defect.

### Failures (24) — ALL pre-existing, unrelated to dashboard

| File                               | Count | Root Cause                                                                                          |
| ---------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| `test_ldap_provider.py` (20 tests) | 20    | `ValueError: too many values to unpack (expected 7)` — LDAP provider decomposition bug pre-existing |
| `test_ldap_signin_endpoint.py`     | 1     | Same LDAP issue                                                                                     |
| `test_url.py`                      | 3     | `contains_url()` logic fails when total text ≥ 1000 chars — pre-existing bug                        |

**Dashboard-related failures: 0**

### Errors (23) — All infrastructure (no DB/Redis)

- `test_workspace_model.py`, `test_issue_comment_modal.py`, `test_label.py`, `test_workspace.py`, `test_issue_recent_visit.py`, `test_copy_s3_objects.py`, `test_ldap_provider.py::TestSetUserData` — all `django.db.utils.OperationalError: connection refused`

**Dashboard tests: none exist** — no test files found for `plane/app/views/dashboard.py` or `plane/app/views/dashboard_chart.py`.

---

## 2. Frontend TypeScript Check

**Command:** `pnpm check:types` (runs `react-router typegen && tsc --noEmit`)
**Exit code: 2 (failure)**
**Total errors: 22**

### Dashboard-Introduced Errors (5) — BLOCKING

**Error 1: `WidgetAdapter` prop name mismatch**

- File: `app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx:116`
- Caller passes `workspaceSlug` and `dashboardId`, but `WidgetAdapterProps` defines them as `_workspaceSlug` and `_dashboardId` (underscore-prefixed)
- Fix: Either add `workspaceSlug` and `dashboardId` to `WidgetAdapterProps` in `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/widget-adapter.tsx`, or update callers to use `_workspaceSlug`/`_dashboardId`

**Errors 2–5: `AnalyticsDashboardFormModal` missing `workspaceSlug` prop**

- Files:
  - `app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx:144`
  - `app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx:153`
  - `app/routes/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx:137`
  - `app/routes/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx:146`
- Callers pass `workspaceSlug` prop but `Props` type in `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/analytics-dashboard-form-modal.tsx` doesn't declare it
- Fix: Add `workspaceSlug?: string` to `Props` type (or remove the unused prop from callers if not needed)

### Pre-existing Errors (17) — Not introduced by dashboard changes

| Count | File pattern                              | Error                                                                                                                                                  |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 10    | `core/components/analytics/*/`            | `TS2305: Module '@plane/types' has no exported member 'AnalyticsTableDataMap'`, `CycleInsightColumns`, `IAnalyticsParams`, etc. — missing type exports |
| 1     | `core/components/common/logo-spinner.tsx` | `TS2339: Property '_resolvedTheme' does not exist on type 'UseThemeProps'`                                                                             |
| 1     | `core/components/project/form.tsx`        | `TS2322: TChangeHandlerProps value type mismatch`                                                                                                      |

---

## 3. Frontend ESLint

**Command:** `pnpm check:lint`
**Exit code: 0 (pass)**
**Result:** 4544 warnings, 0 errors — within `--max-warnings=14367` threshold

Dashboard files flagged (warnings only, not blocking):

- `helpers/dashboard.helper.ts:78,91` — `@typescript-eslint/no-unsafe-enum-comparison` (2 warnings)
- `ce/services/analytics-dashboard.service.ts` — floating promise warnings

---

## Critical Issues

1. **[BLOCKING] 5 TypeScript errors in dashboard files** — `tsc --noEmit` exits non-zero; CI will fail
   - `widget-adapter.tsx`: prop naming `_workspaceSlug`/`_dashboardId` vs callers expecting `workspaceSlug`/`dashboardId`
   - `analytics-dashboard-form-modal.tsx`: `Props` type missing `workspaceSlug`

2. **[INFO] No dashboard backend tests** — `dashboard.py` and `dashboard_chart.py` have no test coverage

---

## Recommendations

### Fix immediately (blocking CI):

**Fix 1** — `widget-adapter.tsx` — add aliased props to `WidgetAdapterProps`:

```typescript
// /Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/widget-adapter.tsx
interface WidgetAdapterProps {
  widget: IDashboardWidget;
  workspaceSlug?: string;   // rename from _workspaceSlug
  dashboardId?: string;     // rename from _dashboardId
}
export const WidgetAdapter = observer(({ widget, workspaceSlug: _workspaceSlug, dashboardId: _dashboardId }: WidgetAdapterProps) => {
```

**Fix 2** — `analytics-dashboard-form-modal.tsx` — add `workspaceSlug` to `Props`:

```typescript
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DashboardFormPayload) => Promise<void>;
  dashboard?: { name?: string; description?: string | null; access?: number } | null;
  workspaceSlug?: string; // add this
};
```

### Add backend tests (non-blocking, recommended):

- Create `plane/tests/contract/app/test_dashboard_app.py` covering:
  - `GET /api/workspaces/{slug}/dashboards/` — list
  - `POST /api/workspaces/{slug}/dashboards/` — create
  - `PATCH /api/workspaces/{slug}/dashboards/{id}/` — update
  - `DELETE /api/workspaces/{slug}/dashboards/{id}/` — delete
  - `GET /api/workspaces/{slug}/dashboards/{id}/widgets/{widget_id}/chart/` — chart data

---

## Build Status

| Check                          | Status       | Notes                                                                |
| ------------------------------ | ------------ | -------------------------------------------------------------------- |
| Backend tests (unit, no DB)    | Partial pass | 81/105 pass; 24 fail (pre-existing LDAP/URL bugs); 23 errors (no DB) |
| Backend tests (contract/smoke) | Not run      | Requires DB + Redis                                                  |
| Frontend TypeScript            | **FAIL**     | 5 dashboard errors + 17 pre-existing                                 |
| Frontend ESLint                | PASS         | 0 errors, 4544 warnings within threshold                             |

---

## Unresolved Questions

1. Are the 17 pre-existing TS errors (`AnalyticsTableDataMap`, `IAnalyticsParams`, etc.) from an upstream branch and excluded from this review scope?
2. Is `workspaceSlug` actually used inside `AnalyticsDashboardFormModal` or just accidentally passed by callers? (If unused, remove from callers instead of adding to Props)
3. Is there a local dev env with Postgres/Redis available for running contract tests?
