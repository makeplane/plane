# Phase Implementation Report

### Executed Phase

- Phase: All 5 phases (sequential)
- Plan: /Volumes/Data/SHBVN/plane.so/plans/260228-0918-dashboard-v1-cleanup/
- Status: completed

### Files Modified

**Deleted (22 V1-only files):**

- `apps/api/plane/db/models/analytics_dashboard.py`
- `apps/api/plane/app/views/analytics_dashboard.py`
- `apps/api/plane/app/urls/analytics_dashboard.py`
- `apps/api/plane/api/views/analytics_dashboard.py`
- `apps/api/plane/api/serializers/analytics_dashboard.py`
- `apps/api/plane/api/urls/analytics_dashboard.py`
- `apps/api/plane/tests/contract/app/test_analytics_dashboard.py`
- `apps/web/ce/components/dashboards/analytics-dashboard-widget-card.tsx`
- `apps/web/ce/components/dashboards/analytics-dashboard-widget-grid.tsx`
- `apps/web/ce/components/dashboards/widget-chart-renderer.tsx`
- `apps/web/ce/components/dashboards/widgets/` (6 files)
- `apps/web/ce/store/analytics-dashboard.store.ts`
- `apps/web/ce/hooks/store/use-analytics-dashboard.ts`
- `apps/web/ce/services/analytics-dashboard.service.ts`
- `packages/types/src/analytics-dashboard.ts`
- `packages/constants/src/analytics-dashboard.ts`

**Created (new files):**

- `apps/api/plane/db/migrations/0127_drop_analytics_dashboard_tables.py` — DROP V1 tables
- `packages/types/src/custom-dashboard.ts` — V2 types (IDashboard, IDashboardWidget, IAnalyticsWidgetConfig, etc.)
- `packages/constants/src/custom-dashboard.ts` — V2 constants (color presets, chart options, etc.)
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-card.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-delete-modal.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-list-header.tsx`
- `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-card.tsx`
- `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-delete-modal.tsx`
- `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-list-header.tsx`
- `apps/web/ce/components/dashboards/dashboard-form-modal.tsx`

**Modified:**

- `apps/api/plane/db/models/__init__.py` — removed analytics_dashboard import
- `apps/api/plane/app/views/__init__.py` — removed AnalyticsDashboard\* imports
- `apps/api/plane/app/urls/__init__.py` — removed analytics_dashboard_urls
- `apps/api/plane/api/views/__init__.py` — removed AnalyticsDashboard\* imports
- `apps/api/plane/api/serializers/__init__.py` — removed AnalyticsDashboard\* imports
- `apps/api/plane/app/serializers/favorite.py` — replaced AnalyticsDashboard → Dashboard model
- `apps/web/ce/store/root.store.ts` — removed analyticsDashboard store
- `apps/web/core/store/favorite.store.ts` — updated analytics_dashboard case → customDashboard
- `apps/web/core/hooks/use-favorite-item-details.tsx` — replaced useAnalyticsDashboard → useCustomDashboard
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx` — updated imports
- `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx` — updated imports
- `apps/web/ce/components/dashboards/config/widget-preview-panel.tsx` — rewrote to use propel charts directly (no V1 widget deps)
- `packages/types/src/index.ts` — added custom-dashboard export, removed analytics-dashboard
- `packages/constants/src/index.ts` — added custom-dashboard export, removed analytics-dashboard

### Tasks Completed

- [x] Create git tag `dashboard-v1-archive`
- [x] Delete 22 V1-only files
- [x] Create migration `0127_drop_analytics_dashboard_tables.py`
- [x] Rename 7 active V1-named components to V2 naming
- [x] Clean 5 backend `__init__.py` files
- [x] Clean `root.store.ts` (removed analyticsDashboard)
- [x] Fix `favorite.store.ts` (analytics_dashboard → customDashboard)
- [x] Fix `favorite.py` serializer (AnalyticsDashboard → Dashboard model)
- [x] Fix `use-favorite-item-details.tsx` (useAnalyticsDashboard → useCustomDashboard)
- [x] Update page.tsx imports in both app/ and routes/ dirs
- [x] Rewrite `widget-preview-panel.tsx` to use propel charts (V1 widget components deleted)
- [x] Create V2 types in `packages/types/src/custom-dashboard.ts`
- [x] Create V2 constants in `packages/constants/src/custom-dashboard.ts`

### Tests Status

- Python syntax check: pass (all 7 modified .py files)
- TypeScript: zero NEW errors introduced; 9 pre-existing errors remain (AnalyticsTableDataMap, IAnalyticsParams, logo-spinner, project/form — all confirmed pre-existing on clean branch)
- V1 remnant search: only migration files remain (expected)

### Issues Encountered

1. `packages/types/src/analytics-dashboard.ts` contained both V1 types AND V2 types (IDashboard, IDashboardWidget, etc.) mixed together — split into `custom-dashboard.ts` for V2-only types
2. `packages/constants/src/analytics-dashboard.ts` similarly mixed — extracted to `custom-dashboard.ts`
3. `widget-preview-panel.tsx` imported deleted V1 widget components — rewrote to use propel charts directly (same pattern as `widget-adapter.tsx`)
4. `apps/api/plane/app/serializers/favorite.py` referenced `AnalyticsDashboard` model — updated to use V2 `Dashboard` model
5. `apps/web/core/hooks/use-favorite-item-details.tsx` used deleted `useAnalyticsDashboard` hook — updated to `useCustomDashboard` with `.find()` on the dashboards array

### Next Steps

- User can commit: `git add -A && git commit -m "refactor: remove Dashboard V1 completely (code + DB)"`
- Run `python manage.py migrate` on next deploy to drop V1 DB tables
- V1 preserved at git tag `dashboard-v1-archive` for recovery if needed
