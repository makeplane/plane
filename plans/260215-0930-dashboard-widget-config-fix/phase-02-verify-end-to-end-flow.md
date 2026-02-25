# Phase 2: Verify End-to-End Widget CRUD Flow

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-replace-headless-ui-in-modal.md)
- [Dashboard Page](<../../apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx>)

## Overview

- **Priority:** P1
- **Status:** Complete
- **Description:** Verify complete widget create/update/delete flow works after Phase 1 fixes

## Key Insights

- MobX store handles CRUD via AnalyticsDashboardService
- Backend API at `/api/workspaces/{slug}/analytics-dashboards/{id}/widgets/`
- Widget data endpoint maps frontend chart_property (lowercase) to backend x_axis keys (uppercase)
- Backend CHART_PROPERTY_TO_X_AXIS mapping already fixed in commit 80f370ae8

## Requirements

- Create widget: fill all fields → submit → widget appears in grid
- Update widget: click configure → modify fields → submit → widget updates
- Delete widget: click delete → widget removed
- Widget data: chart renders with correct data from backend

## Related Code Files

- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`
- `apps/web/core/store/analytics-dashboard.store.ts`
- `apps/web/core/services/analytics-dashboard.service.ts`
- `apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx`
- `apps/web/core/components/dashboards/analytics-dashboard-widget-grid.tsx`
- `apps/api/plane/app/views/analytics_dashboard.py`

## Implementation Steps

1. **Verify Create Flow**
   - Open dashboard → click Add Widget
   - Select widget type (e.g., Bar Chart)
   - Switch to Basic tab → set title, property, metric
   - Switch to Style tab → select color preset
   - Click "Add Widget"
   - Confirm widget appears in grid
   - Confirm API call succeeds (POST /widgets/)

2. **Verify Update Flow**
   - Enter edit mode → click Configure on existing widget
   - Change widget type or settings
   - Click "Update Widget"
   - Confirm widget updates in grid
   - Confirm API call succeeds (PATCH /widgets/{id}/)

3. **Verify Data Rendering**
   - Confirm widget fetches data via GET /widgets/{id}/data/
   - Confirm chart renders with data from backend
   - Test each widget type: bar, line, area, donut, pie, number

4. **Verify Delete Flow**
   - Enter edit mode → click Delete on widget
   - Confirm widget removed from grid
   - Confirm API call succeeds (DELETE /widgets/{id}/)

## Todo List

- [x] Test create widget with all 6 types
- [x] Test update widget configuration
- [x] Test widget data rendering
- [x] Test delete widget
- [x] Verify error handling (network errors, validation)

## Success Criteria

- Full CRUD cycle works without errors
- All 6 widget types render correctly
- Chart data matches backend response
- Error toasts show on failure

## Risk Assessment

- **Medium:** Backend may return unexpected data format — handle gracefully
- **Low:** Widget data caching may show stale data after update — store clears cache on update
