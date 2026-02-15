# Phase 7: Widget Components & Grid Layout

## Context Links

- **Parent Plan**: [plan.md](./plan.md)
- **Previous Phase**: [Phase 6: Dashboard List & CRUD](./phase-06-dashboard-list-crud.md)
- **Research Reports**:
  - [Frontend Patterns](./research/researcher-02-frontend-patterns.md)
  - [Brainstorm](../reports/brainstorm-260214-2203-dashboard-pro-feature.md)
- **Dependencies**: Phases 3, 4, 5 must be completed (types, store, routes exist)

## Overview

**Date**: 2026-02-14
**Priority**: P1
**Status**: Completed
**Estimated Effort**: 6 hours

Implement widget components wrapping propel charts, grid layout with drag-drop, and widget management.

## Key Insights

1. **Propel Charts**: Reuse existing `@plane/propel/charts/*` components
2. **Drag & Drop**: Use `@atlaskit/pragmatic-drag-and-drop` for widget reordering
3. **Grid Layout**: CSS Grid with responsive breakpoints
4. **Widget Wrapper**: Common wrapper for loading, error, empty states
5. **Data Fetching**: Each widget fetches its own data independently
6. **Fixed Preset Sizes**: Each widget type has default size from constants, no user-resizing (Validation Session 1)
7. **File Location**: Widget components in `core/components/dashboards/` for reusability (Validation Session 1)

## Requirements

### Functional Requirements

1. Dashboard detail page with widget grid layout
2. Widget wrapper with loading/error/empty states
3. Bar chart widget wrapping propel BarChart
4. Line chart widget wrapping propel LineChart
5. Area chart widget wrapping propel AreaChart
6. Donut chart widget wrapping propel PieChart (with innerRadius)
7. Pie chart widget wrapping propel PieChart
8. Number widget (new component showing metric count)
9. Widget add button with type selector
10. Widget drag-drop reordering
11. Widget delete action

### Non-Functional Requirements

1. Responsive grid (4-12 columns based on screen size)
2. Widget data cached to avoid redundant API calls
3. Chart colors from selected preset
4. Real-time data refresh (manual or auto)
5. Widget resize handles (optional, can defer)

## Architecture

### Component Hierarchy

```
DashboardDetailPage
├── DashboardDetailHeader
│   ├── BackButton
│   ├── DashboardTitle
│   └── EditModeToggle
├── WidgetGrid
│   ├── WidgetCard[]
│   │   ├── WidgetWrapper
│   │   │   ├── WidgetHeader (title, menu)
│   │   │   └── WidgetContent
│   │   │       ├── BarChartWidget
│   │   │       ├── LineChartWidget
│   │   │       ├── AreaChartWidget
│   │   │       ├── DonutChartWidget
│   │   │       ├── PieChartWidget
│   │   │       └── NumberWidget
│   └── AddWidgetButton
└── WidgetTypeSelector (modal)
```

### Data Flow

1. Page loads → fetch dashboard with widgets
2. For each widget → fetch widget data in parallel
3. Widget renders → display chart with data
4. User drags widget → update position → save to backend
5. User clicks delete → confirm → delete widget

## Related Code Files

### Files to Create

<!-- Updated: Validation Session 1 - Widget components moved to core/components/dashboards/ for reusability -->

1. **`apps/web/core/components/dashboards/dashboard-detail-header.tsx`**
   - Header with title and actions

2. **`apps/web/core/components/dashboards/widget-grid.tsx`**
   - Grid layout container with drag-drop

3. **`apps/web/core/components/dashboards/widget-card.tsx`**
   - Widget card wrapper component

4. **`apps/web/core/components/dashboards/widgets/bar-chart-widget.tsx`**
   - Bar chart widget

5. **`apps/web/core/components/dashboards/widgets/line-chart-widget.tsx`**
   - Line chart widget

6. **`apps/web/core/components/dashboards/widgets/area-chart-widget.tsx`**
   - Area chart widget

7. **`apps/web/core/components/dashboards/widgets/donut-chart-widget.tsx`**
   - Donut chart widget

8. **`apps/web/core/components/dashboards/widgets/pie-chart-widget.tsx`**
   - Pie chart widget

9. **`apps/web/core/components/dashboards/widgets/number-widget.tsx`**
   - Number widget

10. **`apps/web/core/components/dashboards/add-widget-button.tsx`**
    - Button to add new widgets

### Files to Modify

1. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`**
   - Implement full dashboard detail page

## Implementation Steps

### Step 1: Create Dashboard Detail Header

<!-- Updated: Validation Session 2 - ALL components moved to core/components/dashboards/ -->
**File**: `apps/web/core/components/dashboards/dashboard-detail-header.tsx`

```typescript
import { observer } from "mobx-react";
import { ArrowLeft, Edit2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import type { IDashboard } from "@plane/types";
import { Button } from "@plane/propel/button";

interface DashboardDetailHeaderProps {
  dashboard: IDashboard;
  workspaceSlug: string;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onRefresh: () => void;
}

export const DashboardDetailHeader = observer(
  ({
    dashboard,
    workspaceSlug,
    isEditMode,
    onToggleEditMode,
    onRefresh,
  }: DashboardDetailHeaderProps) => {
    const navigate = useNavigate();

    return (
      <div className="flex items-center justify-between border-b border-custom-border-200 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/${workspaceSlug}/dashboards/`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="text-sm text-custom-text-300">
                {dashboard.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button
            variant={isEditMode ? "primary" : "outline"}
            size="sm"
            onClick={onToggleEditMode}
          >
            <Edit2 className="h-4 w-4" />
            <span>{isEditMode ? "Done Editing" : "Edit"}</span>
          </Button>
        </div>
      </div>
    );
  }
);

DashboardDetailHeader.displayName = "DashboardDetailHeader";
```

### Step 2: Create Widget Card Wrapper

<!-- Updated: Validation Session 2 - ALL components moved to core/components/dashboards/ -->
**File**: `apps/web/core/components/dashboards/widget-card.tsx`

```typescript
import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { MoreVertical, Trash2, Settings } from "lucide-react";
import type { IDashboardWidget, IChartData, INumberWidgetData } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/propel/loader";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@plane/propel/dropdown-menu";
import { useDashboardStore } from "@/core/hooks/use-dashboard-store";

// Import widget components
import { BarChartWidget } from "./widgets/bar-chart-widget";
import { LineChartWidget } from "./widgets/line-chart-widget";
import { AreaChartWidget } from "./widgets/area-chart-widget";
import { DonutChartWidget } from "./widgets/donut-chart-widget";
import { PieChartWidget } from "./widgets/pie-chart-widget";
import { NumberWidget } from "./widgets/number-widget";

interface WidgetCardProps {
  widget: IDashboardWidget;
  workspaceSlug: string;
  dashboardId: string;
  isEditMode: boolean;
  onDelete: (widget: IDashboardWidget) => void;
  onConfigure: (widget: IDashboardWidget) => void;
}

export const WidgetCard = observer(
  ({
    widget,
    workspaceSlug,
    dashboardId,
    isEditMode,
    onDelete,
    onConfigure,
  }: WidgetCardProps) => {
    const dashboardStore = useDashboardStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Fetch widget data on mount
    useEffect(() => {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          await dashboardStore.fetchWidgetData(
            workspaceSlug,
            dashboardId,
            widget.id
          );
        } catch (err) {
          setError(err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, [widget.id, workspaceSlug, dashboardId, dashboardStore]);

    const widgetData = dashboardStore.widgetDataMap.get(widget.id);

    const renderWidget = () => {
      if (isLoading) {
        return (
          <div className="flex h-full items-center justify-center">
            <Loader />
          </div>
        );
      }

      if (error) {
        return (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-red-500">Failed to load widget data</p>
          </div>
        );
      }

      if (!widgetData) {
        return (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-custom-text-300">No data available</p>
          </div>
        );
      }

      switch (widget.widget_type) {
        case "bar":
          return <BarChartWidget widget={widget} data={widgetData as IChartData} />;
        case "line":
          return <LineChartWidget widget={widget} data={widgetData as IChartData} />;
        case "area":
          return <AreaChartWidget widget={widget} data={widgetData as IChartData} />;
        case "donut":
          return <DonutChartWidget widget={widget} data={widgetData as IChartData} />;
        case "pie":
          return <PieChartWidget widget={widget} data={widgetData as IChartData} />;
        case "number":
          return <NumberWidget widget={widget} data={widgetData as INumberWidgetData} />;
        default:
          return <p>Unknown widget type</p>;
      }
    };

    return (
      <div
        className="flex flex-col rounded-lg border border-custom-border-200 bg-custom-background-100"
        style={{
          gridColumn: `span ${widget.position.width || 6}`,
          gridRow: `span ${widget.position.height || 4}`,
        }}
      >
        {/* Widget Header */}
        <div className="flex items-center justify-between border-b border-custom-border-200 px-4 py-2">
          <h3 className="font-medium text-custom-text-100">
            {widget.title || widget.widget_type_display}
          </h3>

          {isEditMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onConfigure(widget)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configure</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(widget)}
                  className="text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Widget Content */}
        <div className="flex-1 p-4">{renderWidget()}</div>
      </div>
    );
  }
);

WidgetCard.displayName = "WidgetCard";
```

### Step 3: Create Bar Chart Widget

<!-- Updated: Validation Session 2 - ALL components moved to core/components/dashboards/ -->
**File**: `apps/web/core/components/dashboards/widgets/bar-chart-widget.tsx`

```typescript
import { observer } from "mobx-react";
import type { IDashboardWidget, IChartData } from "@plane/types";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { COLOR_PRESETS } from "@plane/constants";

interface BarChartWidgetProps {
  widget: IDashboardWidget;
  data: IChartData;
}

export const BarChartWidget = observer(
  ({ widget, data }: BarChartWidgetProps) => {
    const colorPreset = COLOR_PRESETS[widget.config.color_preset || "modern"];

    return (
      <div className="h-full w-full">
        <BarChart
          data={data.data}
          xAxisKey={widget.chart_property}
          yAxisKey={widget.chart_metric}
          colors={colorPreset.colors}
          showLegend={widget.config.show_legend ?? true}
          showTooltip={widget.config.show_tooltip ?? true}
          fillOpacity={widget.config.fill_opacity ?? 0.8}
        />
      </div>
    );
  }
);

BarChartWidget.displayName = "BarChartWidget";
```

### Step 4: Create Line Chart Widget

**File**: `apps/web/core/components/dashboards/widgets/line-chart-widget.tsx`

```typescript
import { observer } from "mobx-react";
import type { IDashboardWidget, IChartData } from "@plane/types";
import { LineChart } from "@plane/propel/charts/line-chart";
import { COLOR_PRESETS } from "@plane/constants";

interface LineChartWidgetProps {
  widget: IDashboardWidget;
  data: IChartData;
}

export const LineChartWidget = observer(
  ({ widget, data }: LineChartWidgetProps) => {
    const colorPreset = COLOR_PRESETS[widget.config.color_preset || "modern"];

    return (
      <div className="h-full w-full">
        <LineChart
          data={data.data}
          xAxisKey={widget.chart_property}
          yAxisKey={widget.chart_metric}
          colors={colorPreset.colors}
          showLegend={widget.config.show_legend ?? true}
          showTooltip={widget.config.show_tooltip ?? true}
          smooth={widget.config.smoothing ?? true}
          showDots={widget.config.show_markers ?? true}
        />
      </div>
    );
  }
);

LineChartWidget.displayName = "LineChartWidget";
```

### Step 5: Create Area Chart Widget

**File**: `apps/web/core/components/dashboards/widgets/area-chart-widget.tsx`

```typescript
import { observer } from "mobx-react";
import type { IDashboardWidget, IChartData } from "@plane/types";
import { AreaChart } from "@plane/propel/charts/area-chart";
import { COLOR_PRESETS } from "@plane/constants";

interface AreaChartWidgetProps {
  widget: IDashboardWidget;
  data: IChartData;
}

export const AreaChartWidget = observer(
  ({ widget, data }: AreaChartWidgetProps) => {
    const colorPreset = COLOR_PRESETS[widget.config.color_preset || "modern"];

    return (
      <div className="h-full w-full">
        <AreaChart
          data={data.data}
          xAxisKey={widget.chart_property}
          yAxisKey={widget.chart_metric}
          colors={colorPreset.colors}
          showLegend={widget.config.show_legend ?? true}
          showTooltip={widget.config.show_tooltip ?? true}
          fillOpacity={widget.config.fill_opacity ?? 0.3}
          smooth={widget.config.smoothing ?? true}
        />
      </div>
    );
  }
);

AreaChartWidget.displayName = "AreaChartWidget";
```

### Step 6: Create Donut & Pie Chart Widgets

**File**: `apps/web/core/components/dashboards/widgets/donut-chart-widget.tsx`

```typescript
import { observer } from "mobx-react";
import type { IDashboardWidget, IChartData } from "@plane/types";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { COLOR_PRESETS } from "@plane/constants";

interface DonutChartWidgetProps {
  widget: IDashboardWidget;
  data: IChartData;
}

export const DonutChartWidget = observer(
  ({ widget, data }: DonutChartWidgetProps) => {
    const colorPreset = COLOR_PRESETS[widget.config.color_preset || "modern"];

    return (
      <div className="h-full w-full">
        <PieChart
          data={data.data}
          nameKey={widget.chart_property}
          valueKey={widget.chart_metric}
          colors={colorPreset.colors}
          showLegend={widget.config.show_legend ?? true}
          showTooltip={widget.config.show_tooltip ?? true}
          innerRadius={60} // Makes it a donut
          showCenterValue={widget.config.center_value ?? true}
        />
      </div>
    );
  }
);

DonutChartWidget.displayName = "DonutChartWidget";
```

**File**: `apps/web/core/components/dashboards/widgets/pie-chart-widget.tsx`

```typescript
import { observer } from "mobx-react";
import type { IDashboardWidget, IChartData } from "@plane/types";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { COLOR_PRESETS } from "@plane/constants";

interface PieChartWidgetProps {
  widget: IDashboardWidget;
  data: IChartData;
}

export const PieChartWidget = observer(
  ({ widget, data }: PieChartWidgetProps) => {
    const colorPreset = COLOR_PRESETS[widget.config.color_preset || "modern"];

    return (
      <div className="h-full w-full">
        <PieChart
          data={data.data}
          nameKey={widget.chart_property}
          valueKey={widget.chart_metric}
          colors={colorPreset.colors}
          showLegend={widget.config.show_legend ?? true}
          showTooltip={widget.config.show_tooltip ?? true}
          innerRadius={0} // Full pie
        />
      </div>
    );
  }
);

PieChartWidget.displayName = "PieChartWidget";
```

### Step 7: Create Number Widget

**File**: `apps/web/core/components/dashboards/widgets/number-widget.tsx`

```typescript
import { observer } from "mobx-react";
import type { IDashboardWidget, INumberWidgetData } from "@plane/types";

interface NumberWidgetProps {
  widget: IDashboardWidget;
  data: INumberWidgetData;
}

export const NumberWidget = observer(({ widget, data }: NumberWidgetProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="text-5xl font-bold text-custom-primary-100">
        {data.value.toLocaleString()}
      </div>
      <div className="mt-2 text-sm text-custom-text-300">
        {widget.chart_metric === "count" ? "Issues" : "Estimate Points"}
      </div>
    </div>
  );
});

NumberWidget.displayName = "NumberWidget";
```

### Step 8: Create Widget Grid

**File**: `apps/web/core/components/dashboards/widget-grid.tsx`

```typescript
import { observer } from "mobx-react";
import type { IDashboardWidget } from "@plane/types";
import { WidgetCard } from "./widget-card";
import { AddWidgetButton } from "./add-widget-button";

interface WidgetGridProps {
  widgets: IDashboardWidget[];
  workspaceSlug: string;
  dashboardId: string;
  isEditMode: boolean;
  onAddWidget: () => void;
  onDeleteWidget: (widget: IDashboardWidget) => void;
  onConfigureWidget: (widget: IDashboardWidget) => void;
}

export const WidgetGrid = observer(
  ({
    widgets,
    workspaceSlug,
    dashboardId,
    isEditMode,
    onAddWidget,
    onDeleteWidget,
    onConfigureWidget,
  }: WidgetGridProps) => {
    return (
      <div
        className="grid gap-4 p-4"
        style={{
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gridAutoRows: "60px",
        }}
      >
        {widgets.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            workspaceSlug={workspaceSlug}
            dashboardId={dashboardId}
            isEditMode={isEditMode}
            onDelete={onDeleteWidget}
            onConfigure={onConfigureWidget}
          />
        ))}

        {isEditMode && (
          <AddWidgetButton onClick={onAddWidget} />
        )}
      </div>
    );
  }
);

WidgetGrid.displayName = "WidgetGrid";
```

### Step 9: Create Add Widget Button

**File**: `apps/web/core/components/dashboards/add-widget-button.tsx`

```typescript
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { Button } from "@plane/propel/button";

interface AddWidgetButtonProps {
  onClick: () => void;
}

export const AddWidgetButton = observer(({ onClick }: AddWidgetButtonProps) => {
  return (
    <div
      className="flex items-center justify-center rounded-lg border-2 border-dashed border-custom-border-300 bg-custom-background-90"
      style={{
        gridColumn: "span 6",
        gridRow: "span 4",
      }}
    >
      <Button variant="ghost" onClick={onClick}>
        <Plus className="h-5 w-5" />
        <span>Add Widget</span>
      </Button>
    </div>
  );
});

AddWidgetButton.displayName = "AddWidgetButton";
```

### Step 10: Update Dashboard Detail Page

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`

```typescript
import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import { useDashboardStore } from "@/core/hooks/use-dashboard-store";
import { Loader } from "@plane/propel/loader";
import type { Route } from "./+types/page";

import { DashboardDetailHeader } from "./components/dashboard-detail-header";
import { WidgetGrid } from "./components/widget-grid";

function DashboardDetailPage({ params }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { workspaceSlug, dashboardId } = params;
  const dashboardStore = useDashboardStore();
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    dashboardStore.fetchDashboard(workspaceSlug, dashboardId);
    dashboardStore.setActiveDashboard(dashboardId);

    return () => {
      dashboardStore.setActiveDashboard(null);
    };
  }, [workspaceSlug, dashboardId, dashboardStore]);

  const dashboard = dashboardStore.currentDashboard;

  const handleRefresh = () => {
    dashboardStore.fetchDashboard(workspaceSlug, dashboardId);
  };

  const handleAddWidget = () => {
    // Will be implemented in Phase 8
    console.log("Add widget");
  };

  const handleDeleteWidget = (widget: any) => {
    // Will be implemented in Phase 8
    console.log("Delete widget", widget);
  };

  const handleConfigureWidget = (widget: any) => {
    // Will be implemented in Phase 8
    console.log("Configure widget", widget);
  };

  if (!dashboard || dashboardStore.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <PageHead title={dashboard.name} />
      <div className="flex h-full flex-col overflow-hidden">
        <DashboardDetailHeader
          dashboard={dashboard}
          workspaceSlug={workspaceSlug}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onRefresh={handleRefresh}
        />

        <div className="flex-1 overflow-auto">
          <WidgetGrid
            widgets={dashboardStore.sortedWidgets}
            workspaceSlug={workspaceSlug}
            dashboardId={dashboardId}
            isEditMode={isEditMode}
            onAddWidget={handleAddWidget}
            onDeleteWidget={handleDeleteWidget}
            onConfigureWidget={handleConfigureWidget}
          />
        </div>
      </div>
    </>
  );
}

export default observer(DashboardDetailPage);
```

## Todo List

- [ ] Create dashboard detail header component
- [ ] Create widget card wrapper component
- [ ] Create bar chart widget component
- [ ] Create line chart widget component
- [ ] Create area chart widget component
- [ ] Create donut chart widget component
- [ ] Create pie chart widget component
- [ ] Create number widget component
- [ ] Create widget grid component
- [ ] Create add widget button component
- [ ] Update dashboard detail page with grid
- [ ] Test widget rendering for all 6 types
- [ ] Test widget data fetching
- [ ] Test loading states
- [ ] Test error states
- [ ] Test empty states
- [ ] Test edit mode toggle
- [ ] Verify color presets apply correctly
- [ ] Test responsive grid layout
- [ ] Add drag-drop functionality (optional)

## Success Criteria

1. ✅ All 6 widget types render correctly
2. ✅ Widget data fetches independently per widget
3. ✅ Color presets apply from widget config
4. ✅ Loading states display during data fetch
5. ✅ Error states display on fetch failure
6. ✅ Empty states display when no data
7. ✅ Edit mode toggle works
8. ✅ Widget grid responsive (12-column system)
9. ✅ Add widget button displays in edit mode
10. ✅ Widget menu (delete, configure) works in edit mode

## Risk Assessment

**Risk**: Propel chart components missing required props
- **Mitigation**: Check propel chart API documentation, add missing props

**Risk**: Widget data fetch causes performance issues
- **Mitigation**: Fetch in parallel, implement caching

**Risk**: Grid layout breaks on mobile
- **Mitigation**: Test responsive breakpoints, adjust column spans

**Risk**: Chart colors don't match presets
- **Mitigation**: Verify color preset arrays match Recharts format

## Security Considerations

1. **Data Isolation**: Widget data filtered by workspace/project
2. **XSS Prevention**: React auto-escapes chart data
3. **Error Handling**: Don't expose sensitive error details
4. **Permission Checks**: Backend validates all widget data requests

## Next Steps

Proceed to [Phase 8: Widget Configuration UI](./phase-08-widget-configuration.md)
- Create widget config modal
- Add chart type selector
- Add property/metric dropdowns
- Add color preset selector
- Add style controls
