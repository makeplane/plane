# Phase 4 — File Size & Modularization

**Priority**: Medium
**Status**: [x] Complete
**Risk**: Medium — requires careful refactoring to avoid breaking imports
**Estimated effort**: ~2 hours

## Context

- Rule: Components <150 lines, hooks <100 lines, views <150 lines per class
- 3 frontend files exceed limits; backend views are large but contain multiple classes (acceptable)

## Files Exceeding Limits

### Frontend (>150 lines)

| File                                | Lines | Limit | Action                                   |
| ----------------------------------- | ----- | ----- | ---------------------------------------- |
| department-form-modal.tsx           | 229   | 150   | Split form fields into sub-components    |
| staff-form-modal.tsx                | 229   | 150   | Split form fields into sub-components    |
| staff-table.tsx                     | 168   | 150   | Extract status badge + action buttons    |
| staff/page.tsx                      | 239   | 150   | Extract stats cards + filter section     |
| dashboards/[dashboardId]/page.tsx   | 250   | 150   | Extract toolbar + empty state            |
| widget-config-modal.tsx             | 265   | 150   | Extract tab sections into sub-components |
| analytics-dashboard-widget-card.tsx | 238   | 150   | Extract chart renderer                   |

### Backend (informational — multi-class files are OK)

| File                           | Lines | Note                                                            |
| ------------------------------ | ----- | --------------------------------------------------------------- |
| staff.py (views)               | 637   | Contains 5+ ViewSets/APIViews — could split into separate files |
| analytics_dashboard.py (views) | 507   | Contains 2 ViewSets — acceptable                                |
| department.py (views)          | 265   | Contains 3 classes — acceptable                                 |

## Implementation Steps

### department-form-modal.tsx (229 → ~120 + ~100)

1. Extract `DepartmentFormFields` component (form input fields)
2. Keep modal wrapper + form submission logic in main file

### staff-form-modal.tsx (229 → ~120 + ~100)

1. Extract `StaffFormFields` component (form input fields)
2. Keep modal wrapper + form submission logic in main file

### staff-table.tsx (168 → ~100 + ~60)

1. Extract `StaffStatusBadge` component (status color mapping + badge render)
2. Extract `StaffActionButtons` component (edit/delete action column)

### staff/page.tsx (239 → ~120 + ~100)

1. Extract `StaffStatsCards` component (summary stats at top)
2. Keep main page layout + data fetching

### dashboards/[dashboardId]/page.tsx (250 → ~130 + ~110)

1. Extract `DashboardToolbar` component (action buttons, filters)
2. Keep main layout + widget grid

### widget-config-modal.tsx (265 → ~120 + ~80 + ~80)

1. Extract each tab section into separate component
2. Keep modal shell + tab navigation

### analytics-dashboard-widget-card.tsx (238 → ~120 + ~110)

1. Extract `WidgetChartRenderer` component (chart type switch + render)
2. Keep card wrapper + header/actions

## Todo List

- [x] department-form-modal.tsx → extract DepartmentFormFields
- [x] staff-form-modal.tsx → extract StaffFormFields
- [x] staff-table.tsx → extract StaffStatusBadge + StaffActionButtons
- [x] staff/page.tsx → extract StaffStatsCards
- [x] dashboards/[dashboardId]/page.tsx → extract DashboardToolbar
- [x] widget-config-modal.tsx → extract WidgetConfigTabContent
- [x] analytics-dashboard-widget-card.tsx → extract WidgetChartRenderer
- [x] Update all imports in consuming files
- [x] Run `pnpm check:types` — web passes clean
- [ ] Verify no visual regressions (manual)

## Risk Assessment

- **Import breakage**: extracted components must be exported from same directory
- **MobX observer**: ensure extracted components that read stores are wrapped with `observer`
- **Props drilling**: may need to pass callbacks/data as props to extracted components
