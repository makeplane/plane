# Dashboard Widget Configuration Flow - Exploration Report

## Overview

Explored the Analytics Dashboard widget configuration implementation in Plane. The system uses a modal-based workflow with React Hook Form for managing widget creation and editing.

## Current Architecture

### 1. Entry Points

**Dashboard Page** (`apps/web/app/.../dashboards/[dashboardId]/page.tsx`)

- Main page component that orchestrates the entire widget management flow
- Manages modal state via two flags:
  - `isAddWidgetOpen`: Opens empty config modal for new widgets
  - `configWidget`: Holds selected widget for editing

### 2. Widget Grid & Action Triggers

**AnalyticsDashboardWidgetGrid** (`analytics-dashboard-widget-grid.tsx`)

- Renders 12-column grid layout (60px rows)
- Shows "Add Widget" button ONLY in edit mode
- Button has dashed border styling and is 4 cols × 4 rows
- Triggers `onAddWidget()` callback

**AnalyticsDashboardWidgetCard** (`analytics-dashboard-widget-card.tsx`)

- Displays individual widgets
- Edit mode: Shows menu with Configure/Delete options
- Configure button triggers `onConfigureWidget(widgetId)`
- Handles widget data fetching and rendering per widget type

### 3. Widget Configuration Modal

**WidgetConfigModal** (`widget-config-modal.tsx`)

- Modal component with 4 configuration tabs:
  1. **Type** - Widget type selection
  2. **Basic** - Title, chart property, metric
  3. **Style** - Colors, opacity, smoothing
  4. **Display** - Legend, tooltip, markers (contextual)
- Uses React Hook Form for state management
- FormData structure:

  ```typescript
  {
    widget_type: EAnalyticsWidgetType
    title: string
    chart_property: string
    chart_metric: string
    config: {
      color_preset: string
      fill_opacity?: number
      show_border?: boolean
      smoothing?: boolean
      show_legend?: boolean
      show_tooltip?: boolean
      center_value?: boolean
      show_markers?: boolean
    }
    position: {
      row: number
      col: number
      width: number
      height: number
    }
  }
  ```

- **New widget defaults**: BAR chart, default configs from constants
- **Edit mode**: Loads existing widget data for modification
- **On submit**: Calls `onSubmit()` with FormData

### 4. Tab Components

- **WidgetTypeSelector** (`widget-type-selector.tsx`)
  - 6 widget types: Bar, Line, Area, Donut, Pie, Number
  - 3-column grid on mobile, highlights selected type
- **BasicSettingsSection** (`basic-settings-section.tsx`)
  - Title input (required)
  - Property dropdown (default: "priority")
  - Metric dropdown (default: "count")
- **StyleSettingsSection** (`style-settings-section.tsx`)
  - Color preset selector
  - Fill opacity slider
  - Border & smoothing toggles
- **DisplaySettingsSection** (`display-settings-section.tsx`)
  - Conditional toggles based on widget type:
    - Legend/Tooltip: All except NUMBER
    - Center Value: DONUT/PIE only
    - Markers: LINE only

### 5. State Management & Backend

**AnalyticsDashboardStore** (`analytics-dashboard.store.ts`)

- MobX observable store managing dashboard state
- Key actions:
  - `createWidget()`: POST to backend, adds to widgetMap
  - `updateWidget()`: PUT to backend, updates widgetMap and clears cached data
  - `deleteWidget()`: DELETE from backend, removes from maps
  - `fetchWidgetData()`: GET widget data, caches in widgetDataMap

**AnalyticsDashboardService** (`analytics-dashboard.service.ts`)

- HTTP service layer (not shown but referenced)
- Handles API communication

## User Flow

### Adding a Widget

1. User clicks "Edit" button in dashboard header → `setIsEditMode(true)`
2. "Add Widget" button appears in grid
3. User clicks button → `handleAddWidget()` → `setIsAddWidgetOpen(true)`
4. Modal opens in "create mode" (no existing widget)
5. User selects type, configures settings across tabs
6. User clicks "Add Widget" button
7. Form submits → `handleWidgetSubmit()` → `createWidget()` API call
8. Toast notification shown
9. Modal closes, new widget appears in grid

### Editing a Widget

1. User in edit mode clicks widget menu (⋮ icon)
2. Selects "Configure" → `handleConfigureWidget(widgetId)`
3. Widget object loaded from `sortedWidgets`
4. Modal opens in "edit mode" (widget exists)
5. Form pre-populates with existing data
6. User modifies settings
7. User clicks "Update Widget" button
8. Form submits → `handleWidgetSubmit()` → `updateWidget()` API call
9. Widget cache invalidated automatically
10. Modal closes

## Key Design Patterns

1. **Modal Coupling**: Single modal handles both create and edit via `widget` prop
2. **Form Reset**: Modal resets form on close to prevent state bleeding
3. **Tab-based Organization**: Settings grouped logically, reduces cognitive load
4. **Type-aware Config**: Display section conditionally shows options based on widget type
5. **Default Values**: Constants provide sensible defaults for new widgets
6. **Automatic Data Refresh**: Widget card refetches data after config change

## Component Dependencies

```
DashboardDetailPage
├── AnalyticsDashboardWidgetGrid
│   ├── AnalyticsDashboardWidgetCard (multiple)
│   │   ├── [Widget implementations]
│   │   └── Menu (Configure/Delete)
│   └── "Add Widget" button (edit mode)
└── WidgetConfigModal
    ├── WidgetTypeSelector
    ├── BasicSettingsSection
    ├── StyleSettingsSection
    └── DisplaySettingsSection
```

## Storage Flow

New Widget:

```
User Input → WidgetConfigModal (form) → handleWidgetSubmit()
→ store.createWidget() → AnalyticsDashboardService.createWidget()
→ API POST → Backend → Response stored in widgetMap
```

Update Widget:

```
User Input → WidgetConfigModal (form) → handleWidgetSubmit()
→ store.updateWidget() → AnalyticsDashboardService.updateWidget()
→ API PUT → Backend → Response updates widgetMap + invalidates cache
```

## Type Definitions

- `IAnalyticsDashboardWidget`: Full widget definition
- `TAnalyticsWidgetCreate`: Create payload (excludes id, timestamps)
- `TAnalyticsWidgetUpdate`: Update payload (may differ from create)
- `EAnalyticsWidgetType`: Enum of 6 widget types (BAR, LINE, AREA, DONUT, PIE, NUMBER)

## Observed Strengths

- Clean separation between grid, modal, and tab components
- Type-safe form handling with react-hook-form
- Sensible defaults reduce user friction
- MobX reactivity ensures UI stays in sync
- Conditional display logic for context-specific options

## Questions for Implementation Planning

1. Are widget positions persisted, or recalculated on fetch?
2. How does the grid system handle responsive breakpoints?
3. Is there validation for widget data before submission?
4. How are default sizes determined (why 6 cols × 4 rows for BAR)?
5. What happens if widget type changes mid-edit?
