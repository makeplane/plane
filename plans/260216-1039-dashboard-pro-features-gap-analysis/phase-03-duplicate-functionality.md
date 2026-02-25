# Phase 3: Dashboard & Widget Duplicate

## Context Links

- Dashboard list page: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`
- Dashboard card: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-card.tsx`
- Widget card: `apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx`
- Store: `apps/web/core/store/analytics-dashboard.store.ts`
- Backend views: `apps/api/plane/app/views/analytics_dashboard.py`
- Service: `apps/web/core/services/analytics-dashboard.service.ts`

## Overview

- **Priority:** Medium
- **Status:** Pending
- **Effort:** 3h
- **Description:** No way to clone/duplicate a dashboard (with all widgets) or duplicate a single widget within a dashboard. Both are common Pro features for quick setup.

## Key Insights

- Dashboard duplication = create new dashboard + copy all widget configs
- Widget duplication = create new widget with same config but offset position
- Backend can handle this server-side (single API call) for atomicity
- Dashboard unique name constraint requires appending " (Copy)" suffix

## Requirements

### Functional

- "Duplicate" option in dashboard card context menu (list page)
- "Duplicate" option in widget card context menu (detail page, edit mode)
- Duplicated dashboard named "{original} (Copy)" with all widgets cloned
- Duplicated widget placed at next available grid position
- User redirected to new dashboard after dashboard duplication

### Non-functional

- Server-side duplication for atomicity
- Optimistic UI update for widget duplication

## Architecture

### Backend

- New `POST` endpoint: `/analytics-dashboards/{id}/duplicate/` — clones dashboard + all widgets
- Widget duplicate handled by existing create endpoint with pre-filled data from source widget

### Frontend

- Dashboard card: add "Duplicate" menu item
- Widget card: add "Duplicate" menu item (edit mode only)
- Store: add `duplicateDashboard` and `duplicateWidget` actions

## Related Code Files

### Modify

- `apps/api/plane/app/views/analytics_dashboard.py` — add duplicate view
- `apps/api/plane/app/urls/analytics_dashboard.py` — add duplicate URL
- `apps/web/core/services/analytics-dashboard.service.ts` — add duplicate methods
- `apps/web/core/store/analytics-dashboard.store.ts` — add duplicate actions
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-card.tsx` — add Duplicate menu item
- `apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx` — add Duplicate menu item

## Implementation Steps

1. **Backend dashboard duplicate endpoint**:
   ```python
   class AnalyticsDashboardDuplicateEndpoint(BaseAPIView):
       permission_classes = [WorkSpaceAdminPermission]
       def post(self, request, slug, dashboard_id):
           # Get source dashboard
           # Create new dashboard with "{name} (Copy)"
           # Bulk create all widgets with new dashboard FK
           # Return new dashboard detail
   ```
2. **URL route** — Add `analytics-dashboards/<dashboard_id>/duplicate/` POST route
3. **Service methods** — `duplicateDashboard(workspaceSlug, dashboardId)` and helper for widget duplication
4. **Store actions**:
   - `duplicateDashboard`: calls API, adds new dashboard to map, returns new dashboard
   - `duplicateWidget`: reads source widget config, calls createWidget with offset position
5. **Dashboard card menu** — Add Copy/Duplicate icon button in card context menu
6. **Widget card menu** — Add "Duplicate" option below "Configure" in edit mode menu
7. **Position offset for widget duplicate** — Place duplicated widget at `{row: source.row, col: source.col + source.width}` or next available row if no space

## Todo List

- [ ] Create backend dashboard duplicate endpoint
- [ ] Add URL route for dashboard duplicate
- [ ] Add service method for dashboard duplication
- [ ] Add store action for dashboard duplication
- [ ] Add store action for widget duplication
- [ ] Add Duplicate button to dashboard card context menu
- [ ] Add Duplicate button to widget card context menu
- [ ] Handle name conflict (append " (Copy)" with increment)
- [ ] Navigate to duplicated dashboard after creation
- [ ] Test duplicate with various widget configurations

## Success Criteria

- Dashboard duplication creates exact copy with all widgets
- Widget duplication creates copy with offset position
- Duplicate dashboard name follows "{name} (Copy)" convention
- No data corruption on duplication failure (atomic transaction)

## Risk Assessment

- **Name uniqueness constraint**: "Copy" suffix may conflict if user already created one. Mitigation: append counter "(Copy 2)", "(Copy 3)" or let backend handle unique constraint error gracefully.
- **Large dashboard duplication**: Many widgets. Mitigation: bulk_create on backend, single API call.

## Security Considerations

- Same WorkSpaceAdminPermission as other dashboard operations
- Source dashboard must belong to same workspace
