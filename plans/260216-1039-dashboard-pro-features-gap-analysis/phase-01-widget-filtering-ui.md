# Phase 1: Widget-level Filtering UI + Date Range Filter

## Context Links

- Widget config modal: `apps/web/core/components/dashboards/widget-config-modal.tsx`
- Backend data endpoint: `apps/api/plane/app/views/analytics_dashboard.py` (AnalyticsDashboardWidgetDataEndpoint)
- Types: `packages/types/src/analytics-dashboard.ts` (IAnalyticsWidgetConfig.filters)
- Constants: `packages/constants/src/analytics-dashboard.ts`
- Basic settings: `apps/web/core/components/dashboards/config/basic-settings-section.tsx`

## Overview

- **Priority:** High
- **Status:** Pending
- **Effort:** 4h
- **Description:** Backend already supports `config.filters` with whitelist validation (state, priority, labels, assignee, cycle, module, state_group). Frontend has zero UI to configure per-widget filters. Date properties (start_date, target_date, created_at, completed_at) need date range picker support on backend too.

## Key Insights

- `ALLOWED_FILTER_KEYS` in backend: state, priority, labels, assignee, cycle, module, state_group
- Widget `config.filters` is a JSON field; backend iterates and applies `__in` or exact match
- Date properties are used as x_axis grouping but NOT as filter dimensions yet
- Plane already has date picker components in `@plane/ui`

## Requirements

### Functional

- Add "Filters" tab to widget config modal (5th tab after Display)
- Multi-select dropdowns for: priority, state, state_group, assignee, labels, cycle, module
- Date range picker for: start_date, target_date, created_at, completed_at
- Filters saved to `widget.config.filters` and sent with widget data fetch
- Active filter count badge on Filters tab

### Non-functional

- Filter options fetched from workspace data (states, members, labels, cycles, modules)
- Debounced filter application to avoid excessive API calls
- Filters persisted across dashboard refresh

## Architecture

### Frontend

1. New tab "Filters" in `CONFIG_TABS` array in `widget-config-modal.tsx`
2. New component `apps/web/core/components/dashboards/config/filter-settings-section.tsx`
3. Uses existing workspace stores for filter options (member store, label store, state store, cycle store, module store)
4. Form data extended with `config.filters` object

### Backend

1. Extend `ALLOWED_FILTER_KEYS` to include date range keys: `start_date_after`, `start_date_before`, `target_date_after`, `target_date_before`, `created_at_after`, `created_at_before`, `completed_at_after`, `completed_at_before`
2. Handle date range filters with `__gte` and `__lte` lookups instead of `__in`

## Related Code Files

### Modify

- `apps/web/core/components/dashboards/widget-config-modal.tsx` — add Filters tab
- `apps/web/core/components/dashboards/config/index.ts` — export new section
- `packages/types/src/analytics-dashboard.ts` — type `IAnalyticsWidgetFilters`
- `apps/api/plane/app/views/analytics_dashboard.py` — extend date range filter handling
- `apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx` — pass filters to fetchWidgetData

### Create

- `apps/web/core/components/dashboards/config/filter-settings-section.tsx`

## Implementation Steps

1. **Types** — Add `IAnalyticsWidgetFilters` interface with typed filter keys (string arrays for entity filters, `{after?: string, before?: string}` for date ranges)
2. **Constants** — Add `ANALYTICS_FILTER_OPTIONS` mapping filter keys to labels
3. **Backend date filters** — In `AnalyticsDashboardWidgetDataEndpoint.get()`, add date range handling:
   ```python
   DATE_FILTER_KEYS = {
       "start_date_after": ("start_date__gte", ),
       "start_date_before": ("start_date__lte", ),
       # ... etc
   }
   ```
4. **FilterSettingsSection component** — Create with:
   - Priority multi-select (hardcoded options: urgent, high, medium, low, none)
   - State multi-select (from workspace state store)
   - State group multi-select (hardcoded: backlog, unstarted, started, completed, cancelled)
   - Assignee multi-select (from workspace member store)
   - Labels multi-select (from project label store)
   - Cycle/Module multi-select (from respective stores)
   - Date range pickers for 4 date properties
5. **Widget config modal** — Add CONFIG_TABS entry `{ key: "filters", label: "Filters" }`, render FilterSettingsSection
6. **Widget card** — When fetching data, pass `widget.config.filters` as query params
7. **Filter badge** — Show count of active filters on Filters tab button

## Todo List

- [ ] Add IAnalyticsWidgetFilters type
- [ ] Add ANALYTICS_FILTER_OPTIONS constants
- [ ] Extend backend ALLOWED_FILTER_KEYS with date range keys
- [ ] Implement date range filter logic in backend view
- [ ] Create FilterSettingsSection component
- [ ] Add Filters tab to widget config modal
- [ ] Pass filters to widget data fetch
- [ ] Add active filter count badge
- [ ] Test with various filter combinations

## Success Criteria

- User can configure filters per widget in config modal
- Date range picker works for all 4 date properties
- Filters persist after save and dashboard reload
- Backend correctly applies filters to widget data queries
- No regression in existing widget functionality

## Risk Assessment

<!-- Updated: Validation Session 1 - Confirmed lazy loading strategy -->

- **Filter option loading**: Lazy-load filter options when user clicks Filters tab (confirmed in validation). Use workspace MobX stores; trigger fetch if not already loaded.
- **Date format mismatch**: Frontend date picker format vs backend expected format. Mitigation: use ISO 8601 (YYYY-MM-DD) consistently.
- **Performance**: Many filters could slow queries. Mitigation: backend already uses indexed fields.

## Security Considerations

- Backend whitelist already prevents arbitrary filter injection
- Date range keys added to whitelist explicitly
- Filter values sanitized (cast to string) before queryset application
