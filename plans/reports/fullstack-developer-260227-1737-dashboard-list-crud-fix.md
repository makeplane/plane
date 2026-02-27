# Phase Implementation Report

## Executed Phase

- Phase: Dashboard List Page + CRUD Modals + Components Fix
- Plan: ad-hoc task (no plan dir)
- Status: completed

## Files Modified

| File                                                                                                       | Change                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`                                        | Rewrote to use `useCustomDashboard()` store, correct store fields (`dashboards`, `isLoading`), semantic color tokens, removed `duplicateDashboard`, updated modal props         |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-list-header.tsx`  | Replaced `custom-*` tokens with semantic `border-color-subtle`, `text-color-primary`, `text-color-secondary`                                                                    |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-card.tsx`         | Removed `IAnalyticsDashboard` + `useAnalyticsDashboard` (favorites), replaced with `any` type, added access badge (Private/Public), semantic tokens, removed `onDuplicate` prop |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-form-modal.tsx`   | Removed `IAnalyticsDashboard`/`TAnalyticsDashboardCreate` types, added `access` toggle (0=private/1=public), semantic tokens, `workspaceSlug` prop                              |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-delete-modal.tsx` | Removed `IAnalyticsDashboard` type, changed to `dashboardName: string` prop, semantic tokens                                                                                    |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`                          | Fixed widget type annotation missing `chart_type` (TS2741)                                                                                                                      |
| `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`                                 | Removed `+types/page` import (unresolvable in routes/ folder), switched to `useParams` from `react-router`, uses `useCustomDashboard()`                                         |
| `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`                   | Removed `+types/page` import, switched to `useParams`                                                                                                                           |
| `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/components/*`                             | Synced from canonical app/(all)/ location                                                                                                                                       |

## Tasks Completed

- [x] `page.tsx` uses `useCustomDashboard()` instead of `useAnalyticsDashboard()`
- [x] Reads `store.dashboards` + `store.isLoading` (correct DashboardStore fields)
- [x] `AnalyticsDashboardListHeader` updated to semantic color tokens
- [x] `AnalyticsDashboardCard` uses `any` type, shows access badge (Private/Public via `access` field), semantic tokens, no favorites/duplicate deps
- [x] `AnalyticsDashboardFormModal` supports create + edit mode, `access` toggle, `workspaceSlug` prop, semantic tokens
- [x] `AnalyticsDashboardDeleteModal` uses `dashboardName: string` prop (not full dashboard object)
- [x] Fixed `[dashboardId]/page.tsx` widget type annotation missing `chart_type`
- [x] Fixed `app/routes/` duplicate files — removed unresolvable `+types/page` imports
- [x] Synced all component files to duplicate routes folder

## Tests Status

- Type check: **pass** — zero errors in dashboard files
- Pre-existing errors: 17 unrelated errors in `core/components/analytics/*`, `logo-spinner.tsx`, `project/form.tsx` (existed before this task)

## Issues Encountered

- `app/routes/(all)/` folder is a legacy duplicate of `app/(all)/` — React Router v7 only generates `+types/` for the canonical routes defined in `app/routes/core.ts`, which points to `app/(all)/`. The `app/routes/` copies are orphaned and should ideally be deleted or consolidated.
- `widget-config-modal.tsx` type errors (TS2345, TS2322, TS2741) from turbo cache were stale — fresh `tsc --noEmit` showed zero dashboard errors.

## Next Steps

- Consider removing the `app/routes/(all)/` duplicate folder entirely — it serves no routing purpose and creates maintenance burden
- The `app/routes/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` still uses `useAnalyticsDashboard` (Pro store) — if this route is meant to serve the CE custom dashboard feature, it needs to be rewritten to use `useCustomDashboard()`

## Unresolved Questions

- Should `app/routes/(all)/` duplicate files be deleted entirely? They appear to be leftover copies not wired to any route config.
- The `[dashboardId]/page.tsx` in `app/routes/(all)/` uses `useAnalyticsDashboard` (Pro). Is this intentional or should it mirror the canonical CE version?
