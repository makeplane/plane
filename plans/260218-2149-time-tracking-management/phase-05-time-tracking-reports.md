# Phase 5: Time Tracking Reports

## Context Links
- Routes: `apps/web/app/routes/core.ts`
- Existing analytics page pattern: `apps/web/core/components/dashboards/`
- Recharts usage: `apps/web/core/components/dashboards/widgets/bar-chart-widget.tsx`
- Settings pages: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/`
- Project settings layout: `apps/web/app/(all)/[workspaceSlug]/(projects)/`

## Overview
- **Priority**: P2
- **Status**: complete
- Create project-level time tracking report page with per-member breakdown and estimated-vs-actual chart.

## Key Insights
<!-- Updated: Validation Session 1 - Reports page is project sidebar tab, not settings -->
- Recharts already used for dashboard widgets — reuse same charting pattern
- **Reports page is a project-level sidebar tab** (like Issues, Cycles, Modules) — NOT under settings
- Summary data comes from Phase 1 API endpoints
- Keep simple: one page with filters and two visualizations
- **Default filter: current active cycle/sprint** — most actionable for sprint reviews

## Requirements
### Functional
- Project-level time tracking report page
- Filters: date range, member
- Table: issues with estimate vs logged time
- Bar chart: estimated vs actual per issue (top 10 by logged time)
- Member breakdown: table with total hours per member
- Export-friendly layout (clean tables)

### Non-functional
- Responsive layout
- Loading states for async data
- Empty states when no data

## Architecture
<!-- Updated: Validation Session 1 - Route changed to project sidebar tab + cycle default filter -->
```
/[workspaceSlug]/projects/[projectId]/time-tracking/
├── TimeTrackingReportPage
│   ├── TimeTrackingFilters (cycle selector [default=active], date range, member select)
│   ├── TimeTrackingSummaryCards (total logged, total estimated, variance)
│   ├── TimeTrackingIssueTable (sortable table of issues)
│   └── TimeTrackingChart (Recharts BarChart: estimate vs actual)
```

## Related Code Files
### Create
<!-- Updated: Validation Session 1 - Route is project-level tab, not settings -->
- `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/[projectId]/time-tracking/page.tsx` — page entry
- `apps/web/core/components/time-tracking/time-tracking-report-page.tsx` — main component
- `apps/web/core/components/time-tracking/time-tracking-filters.tsx` — filter bar
- `apps/web/core/components/time-tracking/time-tracking-summary-cards.tsx` — KPI cards
- `apps/web/core/components/time-tracking/time-tracking-issue-table.tsx` — issue breakdown table
- `apps/web/core/components/time-tracking/time-tracking-chart.tsx` — bar chart

### Modify
- `apps/web/app/routes/core.ts` — add route for time tracking page
- Project settings sidebar/navigation — add "Time Tracking" link

## Implementation Steps

1. **Add route** in `apps/web/app/routes/core.ts`
   - Add as project-level tab route (alongside issues, cycles, modules), NOT under settings

2. **Create page entry** (page.tsx)
   - Standard page wrapper with breadcrumbs
   - Render TimeTrackingReportPage component

3. **Create TimeTrackingReportPage** — orchestrator component
   - Fetch summary data from worklog store on mount
   - Manage filter state (date range, member)
   - Pass data to child components

4. **Create TimeTrackingFilters**
   - Date range: start date + end date pickers
   - Member: dropdown of project members
   - Apply button or auto-apply on change

5. **Create TimeTrackingSummaryCards**
   - Cards: Total Logged Time, Total Estimated Time, Variance (over/under)
   - Use formatMinutesToDisplay from constants

6. **Create TimeTrackingIssueTable**
   - Columns: Issue Key, Issue Name, Estimate, Logged, Variance, Status
   - Sortable by any column
   - Color-code variance (red if over, green if under/equal)

7. **Create TimeTrackingChart**
   - Recharts BarChart with grouped bars (estimate vs actual)
   - Top 10 issues by logged time
   - Tooltip showing hours
   - Match existing dashboard chart styling

8. **Add navigation link**
   - In project sidebar (alongside Issues, Cycles, Modules), add "Time Tracking" item
   - Only show when `is_time_tracking_enabled`

9. **Add cycle-based default filter**
   - On mount, detect active cycle from cycle store
   - Pre-select active cycle in filter, load its issues' worklogs
   - Allow user to switch to other cycles or custom date range

## Todo List
- [ ] Add route configuration
- [ ] Create page entry point
- [ ] Create TimeTrackingReportPage component
- [ ] Create TimeTrackingFilters
- [ ] Create TimeTrackingSummaryCards
- [ ] Create TimeTrackingIssueTable
- [ ] Create TimeTrackingChart
- [ ] Add navigation link in project settings
- [ ] Test with sample data
- [ ] Verify responsive layout

## Success Criteria
- Page accessible at correct URL
- Filters update displayed data
- Chart renders correctly with Recharts
- Table shows all issues with time data
- Summary cards show accurate totals
- Empty state when no worklogs exist

## Risk Assessment
- **Route structure**: May not match existing project settings pattern exactly → verify route nesting
- **Chart performance**: Many issues → limit to top N in chart, full list in table
- **Data volume**: Large projects → pagination on issue table

## Security Considerations
- Page accessible only to project members (route-level check)
- Summary data doesn't expose individual worklog details (aggregated)

## Next Steps
- Phase 6: Testing and polish
