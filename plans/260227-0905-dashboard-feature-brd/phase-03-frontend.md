---
status: COMPLETE
---

# Phase 3: Frontend Component Architecture

## Overview

The frontend will reside strictly within the CE override paths under `apps/web/ce/`. State handling will leverage the MobX store pattern using `observer` wrappers.

## 1. Store Management (`apps/web/ce/store/`)

<!-- Updated: Validation Session 1 - Added "Fake" Live Preview architecture, check propel/charts first -->

- Create `DashboardStore` and `DashboardWidgetStore` extending `CoreRootStore`.
- Implement CRUD operations using `runInAction` for async API calls.
- **Fetching:** Standardize data fetching methods `fetchDashboards()`, `fetchDashboardWidgets(dashboardId)`, and chart data fetching.
- **"Fake" Live Preview Pattern:**
  - Data changes (X-axis, Y-axis, Filters, Metrics) → re-fetch `GET /charts/` for live preview
  - Visual changes (colors, line type, toggles) → local state re-render only, NO API call
  - Save to DB → `PATCH /widgets/{id}` fires ONLY on sidebar close (X button or click-away)
  - Store maintains a `draftWidgetConfig` observable for unsaved local state

## 2. API Service (`apps/web/core/services/`)

- Create `dashboard.service.ts` extending `APIService`.
- Map the REST URLs defined in Phase 2 to service methods. Ensure standard error handling.

## 3. Route Components (`apps/web/app/routes/`)

- `/workspace/:workspaceSlug/dashboards/` - Dashboard List View
- `/workspace/:workspaceSlug/dashboards/:dashboardId/` - Dashboard Detail View

## 4. UI Components (`apps/web/ce/components/dashboards/`)

- Following standard patterns, core reusable dashboard visual pieces should centralize under `core/components/dashboards/` or optionally `ce/components/dashboards/`.
- **`WidgetGrid`**: Implement a coordinate-based drag-and-drop grid system mapping to `x_axis_coord`, `y_axis_coord`, `width`, and `height` properties. (e.g., using a library like `react-grid-layout` if standard spacing requires it, or custom grid mapping).
- **`WidgetCard`**: Wrapper providing the panel look, edit/delete actions, and loading states.
- **Charts Integration**: Integrate the 6 chart varieties importing from `@plane/propel/charts/*` where available, otherwise `@plane/ui`.
- **`WidgetConfigModal`**: User interface for selecting chart type, X/Y axes, Group by grouping, and visual properties (color, legends, etc.).

## 5. Styling Rules

- Strict application of semantic colors (Avoid hardcoding hex codes outside of `@plane/propel` themes).
- Example: `bg-surface-1`, `border-color-subtle`, `text-color-primary`.
- No `dark:` classes.
