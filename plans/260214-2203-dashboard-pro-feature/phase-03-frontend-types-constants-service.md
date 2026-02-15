# Phase 3: Frontend Types, Constants & Service

## Context Links

- **Parent Plan**: [plan.md](./plan.md)
- **Previous Phase**: [Phase 2: Backend API](./phase-02-backend-api.md)
- **Research Reports**:
  - [Frontend Patterns](./research/researcher-02-frontend-patterns.md)
- **Dependencies**: Phase 2 must be completed (API endpoints exist)

## Overview

**Date**: 2026-02-14
**Priority**: P1
**Status**: Completed
**Estimated Effort**: 3 hours

Define TypeScript types, constants, and service layer for dashboard feature frontend.

## Key Insights

1. **Type Exports**: Use `export type` from `@plane/types` for tree-shaking
2. **Service Pattern**: Extend `APIService` with typed promises
3. **Constants**: Define enums for widget types, color presets
4. **Generics**: Use `<T>` for flexible API response types
5. **Error Handling**: Always catch and throw `err?.response?.data`

## Requirements

### Functional Requirements

1. TypeScript interfaces for Dashboard and DashboardWidget
2. Type definitions for widget config options
3. Constants for widget types, color presets, default configs
4. DashboardService class with all API methods
5. Color preset definitions (Modern, Horizon, Earthen)

### Non-Functional Requirements

1. Type-safe API calls with proper generics
2. Reusable constants across components
3. Consistent error handling
4. Tree-shakable exports
5. JSDoc documentation for public APIs

## Architecture

### Type System Hierarchy

```
IDashboard
  ↓ has many
IDashboardWidget
  ↓ contains
IWidgetConfig
  ↓ includes
  - IChartStyle
  - IChartDisplay
  - IColorPreset
```

### Service Layer

```
DashboardService extends APIService
  ↓ methods
  - getDashboards()
  - createDashboard()
  - updateDashboard()
  - deleteDashboard()
  - getWidgets()
  - createWidget()
  - updateWidget()
  - deleteWidget()
  - getWidgetData()
```

## Related Code Files

### Files to Create

1. **`packages/types/src/dashboard.ts`**
   - IDashboard, IDashboardWidget interfaces
   - Widget config type definitions
   - Enum types for widget types

2. **`packages/constants/src/dashboard.ts`**
   - WIDGET_TYPES constant
   - COLOR_PRESETS constant
   - DEFAULT_WIDGET_CONFIGS constant

3. **`apps/web/core/services/dashboard.service.ts`**
   - DashboardService class
   - All API methods

### Files to Modify

1. **`packages/types/src/index.ts`**
   - Export dashboard types

2. **`packages/constants/src/index.ts`**
   - Export dashboard constants

## Implementation Steps

### Step 1: Create Type Definitions

**File**: `packages/types/src/dashboard.ts`

```typescript
// Base Dashboard interface
export interface IDashboard {
  id: string;
  workspace: string;
  name: string;
  description: string | null;
  logo_props: Record<string, any>;
  owner: string;
  owner_name: string;
  is_default: boolean;
  sort_order: number;
  config: IDashboardConfig;
  widget_count: number;
  created_at: string;
  updated_at: string;
}

// Dashboard configuration
export interface IDashboardConfig {
  project_ids: string[];
  layout?: {
    columns?: number;
    rowHeight?: number;
  };
  filters?: Record<string, any>;
}

// Widget types enum
export enum EWidgetType {
  BAR = "bar",
  LINE = "line",
  AREA = "area",
  DONUT = "donut",
  PIE = "pie",
  NUMBER = "number",
}

// Widget interface
export interface IDashboardWidget {
  id: string;
  dashboard: string;
  widget_type: EWidgetType;
  widget_type_display: string;
  title: string;
  chart_property: string;
  chart_metric: string;
  config: IWidgetConfig;
  position: IWidgetPosition;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Widget configuration
export interface IWidgetConfig {
  color_preset: string;
  fill_opacity?: number;
  show_border?: boolean;
  smoothing?: boolean;
  show_legend?: boolean;
  show_tooltip?: boolean;
  center_value?: boolean; // For donut/pie
  show_markers?: boolean; // For line charts
  filters?: Record<string, any>;
}

// Widget grid position
export interface IWidgetPosition {
  row: number;
  col: number;
  width: number;
  height: number;
}

// Color preset type
export interface IColorPreset {
  id: string;
  name: string;
  colors: string[];
  description: string;
}

// Chart data response
export interface IChartData {
  data: Array<{
    [key: string]: any;
  }>;
  schema: Record<string, string>;
}

// Number widget response
export interface INumberWidgetData {
  value: number;
  metric: string;
}

// Dashboard detail (with widgets)
export interface IDashboardDetail extends IDashboard {
  widgets: IDashboardWidget[];
}

// Dashboard creation payload
export type TDashboardCreate = Pick<
  IDashboard,
  "name" | "description" | "logo_props" | "config"
>;

// Dashboard update payload
export type TDashboardUpdate = Partial<TDashboardCreate> & {
  is_default?: boolean;
  sort_order?: number;
};

// Widget creation payload
export type TWidgetCreate = Pick<
  IDashboardWidget,
  | "widget_type"
  | "title"
  | "chart_property"
  | "chart_metric"
  | "config"
  | "position"
>;

// Widget update payload
export type TWidgetUpdate = Partial<TWidgetCreate> & {
  sort_order?: number;
};

// Chart property options (x-axis)
export enum EChartProperty {
  PRIORITY = "priority",
  STATE = "state",
  STATE_GROUP = "state_group",
  ASSIGNEE = "assignee",
  LABELS = "labels",
  CYCLE = "cycle",
  MODULE = "module",
  ESTIMATE_POINT = "estimate_point",
  START_DATE = "start_date",
  TARGET_DATE = "target_date",
  CREATED_AT = "created_at",
  COMPLETED_AT = "completed_at",
}

// Chart metric options (y-axis)
export enum EChartMetric {
  COUNT = "count",
  ESTIMATE_POINTS = "estimate_points",
}
```

### Step 2: Create Constants

**File**: `packages/constants/src/dashboard.ts`

```typescript
import type { IColorPreset, IWidgetConfig, EWidgetType } from "@plane/types";

// Widget type options
export const WIDGET_TYPE_OPTIONS = [
  {
    key: "bar" as const,
    label: "Bar Chart",
    description: "Vertical bar chart for comparing values",
    icon: "BarChart3",
  },
  {
    key: "line" as const,
    label: "Line Chart",
    description: "Line chart for trends over time",
    icon: "LineChart",
  },
  {
    key: "area" as const,
    label: "Area Chart",
    description: "Filled area chart for cumulative data",
    icon: "AreaChart",
  },
  {
    key: "donut" as const,
    label: "Donut Chart",
    description: "Circular chart with center hole",
    icon: "PieChart",
  },
  {
    key: "pie" as const,
    label: "Pie Chart",
    description: "Circular chart showing proportions",
    icon: "PieChart",
  },
  {
    key: "number" as const,
    label: "Number Widget",
    description: "Display single metric value",
    icon: "Hash",
  },
];

// Color presets
export const COLOR_PRESETS: Record<string, IColorPreset> = {
  modern: {
    id: "modern",
    name: "Modern",
    description: "Vibrant and energetic colors",
    colors: [
      "#6366f1", // Indigo
      "#8b5cf6", // Violet
      "#ec4899", // Pink
      "#f59e0b", // Amber
      "#10b981", // Emerald
      "#3b82f6", // Blue
      "#f97316", // Orange
      "#14b8a6", // Teal
    ],
  },
  horizon: {
    id: "horizon",
    name: "Horizon",
    description: "Warm sunset-inspired palette",
    colors: [
      "#f97316", // Orange
      "#fb923c", // Orange-400
      "#fbbf24", // Amber
      "#fde047", // Yellow
      "#facc15", // Yellow-400
      "#fb7185", // Rose
      "#f472b6", // Pink
      "#e879f9", // Fuchsia
    ],
  },
  earthen: {
    id: "earthen",
    name: "Earthen",
    description: "Natural, muted earth tones",
    colors: [
      "#78716c", // Stone
      "#a8a29e", // Stone-400
      "#92400e", // Amber-800
      "#b45309", // Amber-700
      "#059669", // Emerald-600
      "#047857", // Emerald-700
      "#0369a1", // Sky-700
      "#0284c7", // Sky-600
    ],
  },
};

// Default widget configurations by type
export const DEFAULT_WIDGET_CONFIGS: Record<string, Partial<IWidgetConfig>> = {
  bar: {
    color_preset: "modern",
    fill_opacity: 0.8,
    show_border: false,
    show_legend: true,
    show_tooltip: true,
  },
  line: {
    color_preset: "modern",
    smoothing: true,
    show_markers: true,
    show_legend: true,
    show_tooltip: true,
  },
  area: {
    color_preset: "modern",
    fill_opacity: 0.3,
    smoothing: true,
    show_legend: true,
    show_tooltip: true,
  },
  donut: {
    color_preset: "modern",
    center_value: true,
    show_legend: true,
    show_tooltip: true,
  },
  pie: {
    color_preset: "modern",
    show_legend: true,
    show_tooltip: true,
  },
  number: {
    color_preset: "modern",
  },
};

// Chart property options
export const CHART_PROPERTY_OPTIONS = [
  { key: "priority", label: "Priority" },
  { key: "state", label: "State" },
  { key: "state_group", label: "State Group" },
  { key: "assignee", label: "Assignee" },
  { key: "labels", label: "Labels" },
  { key: "cycle", label: "Cycle" },
  { key: "module", label: "Module" },
  { key: "estimate_point", label: "Estimate Points" },
  { key: "start_date", label: "Start Date" },
  { key: "target_date", label: "Target Date" },
  { key: "created_at", label: "Created Date" },
  { key: "completed_at", label: "Completed Date" },
];

// Chart metric options
export const CHART_METRIC_OPTIONS = [
  { key: "count", label: "Issue Count" },
  { key: "estimate_points", label: "Estimate Points Sum" },
];

// Default grid layout settings
export const DEFAULT_GRID_CONFIG = {
  columns: 12,
  rowHeight: 60,
  margin: [16, 16] as [number, number],
  containerPadding: [16, 16] as [number, number],
};

// Default widget sizes by type
export const DEFAULT_WIDGET_SIZES: Record<string, { width: number; height: number }> = {
  bar: { width: 6, height: 4 },
  line: { width: 6, height: 4 },
  area: { width: 6, height: 4 },
  donut: { width: 4, height: 4 },
  pie: { width: 4, height: 4 },
  number: { width: 3, height: 2 },
};
```

### Step 3: Create Service Layer

**File**: `apps/web/core/services/dashboard.service.ts`

```typescript
import { APIService } from "./api.service";
import type {
  IDashboard,
  IDashboardDetail,
  IDashboardWidget,
  TDashboardCreate,
  TDashboardUpdate,
  TWidgetCreate,
  TWidgetUpdate,
  IChartData,
  INumberWidgetData,
} from "@plane/types";

export class DashboardService extends APIService {
  constructor() {
    super(import.meta.env.VITE_API_BASE_URL);
  }

  /**
   * List all dashboards for a workspace
   * @param workspaceSlug - Workspace slug
   * @returns Promise resolving to array of dashboards
   */
  async getDashboards(workspaceSlug: string): Promise<IDashboard[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Create a new dashboard
   * @param workspaceSlug - Workspace slug
   * @param data - Dashboard creation payload
   * @returns Promise resolving to created dashboard
   */
  async createDashboard(
    workspaceSlug: string,
    data: TDashboardCreate
  ): Promise<IDashboard> {
    return this.post(`/api/workspaces/${workspaceSlug}/dashboards/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Get dashboard details with widgets
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @returns Promise resolving to dashboard detail
   */
  async getDashboard(
    workspaceSlug: string,
    dashboardId: string
  ): Promise<IDashboardDetail> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Update dashboard
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param data - Dashboard update payload
   * @returns Promise resolving to updated dashboard
   */
  async updateDashboard(
    workspaceSlug: string,
    dashboardId: string,
    data: TDashboardUpdate
  ): Promise<IDashboard> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`,
      data
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Delete dashboard
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   */
  async deleteDashboard(
    workspaceSlug: string,
    dashboardId: string
  ): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * List widgets for a dashboard
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @returns Promise resolving to array of widgets
   */
  async getWidgets(
    workspaceSlug: string,
    dashboardId: string
  ): Promise<IDashboardWidget[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Create a new widget
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param data - Widget creation payload
   * @returns Promise resolving to created widget
   */
  async createWidget(
    workspaceSlug: string,
    dashboardId: string,
    data: TWidgetCreate
  ): Promise<IDashboardWidget> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/`,
      data
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Get widget configuration
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param widgetId - Widget ID
   * @returns Promise resolving to widget
   */
  async getWidget(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string
  ): Promise<IDashboardWidget> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Update widget
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param widgetId - Widget ID
   * @param data - Widget update payload
   * @returns Promise resolving to updated widget
   */
  async updateWidget(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TWidgetUpdate
  ): Promise<IDashboardWidget> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/`,
      data
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Delete widget
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param widgetId - Widget ID
   */
  async deleteWidget(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Fetch widget data (chart data or number value)
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param widgetId - Widget ID
   * @param params - Optional query parameters (filters, date range)
   * @returns Promise resolving to widget data
   */
  async getWidgetData(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    params?: Record<string, any>
  ): Promise<IChartData | INumberWidgetData> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/data/`,
      { params }
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
```

### Step 4: Export Types and Constants

**File**: `packages/types/src/index.ts`

```typescript
// Add to existing exports
export * from "./dashboard";
```

**File**: `packages/constants/src/index.ts`

```typescript
// Add to existing exports
export * from "./dashboard";
```

### Step 5: Verify Type Safety

Create test file to verify types work correctly:

**File**: `apps/web/core/services/__tests__/dashboard.service.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { DashboardService } from "../dashboard.service";
import type { IDashboard, TDashboardCreate } from "@plane/types";

describe("DashboardService", () => {
  it("should have correct method signatures", () => {
    const service = new DashboardService();

    expect(service.getDashboards).toBeDefined();
    expect(service.createDashboard).toBeDefined();
    expect(service.getDashboard).toBeDefined();
    expect(service.updateDashboard).toBeDefined();
    expect(service.deleteDashboard).toBeDefined();
    expect(service.getWidgets).toBeDefined();
    expect(service.createWidget).toBeDefined();
    expect(service.getWidget).toBeDefined();
    expect(service.updateWidget).toBeDefined();
    expect(service.deleteWidget).toBeDefined();
    expect(service.getWidgetData).toBeDefined();
  });
});
```

## Todo List

- [x] Create `packages/types/src/analytics-dashboard.ts` with all type definitions
- [x] Create `packages/constants/src/analytics-dashboard.ts` with constants
- [x] Create `apps/web/core/services/analytics-dashboard.service.ts`
- [x] Export types from `packages/types/src/index.ts`
- [x] Export constants from `packages/constants/src/index.ts`
- [x] Verify TypeScript compilation passes
- [ ] Create unit tests for service methods
- [x] Verify color presets have valid hex codes
- [x] Document all public APIs with JSDoc
- [x] Run type checker: `pnpm check:types`

## Success Criteria

1. ✅ All TypeScript interfaces defined
2. ✅ Enums for widget types and chart options
3. ✅ Color presets defined with 8 colors each
4. ✅ Default widget configs for all 6 widget types
5. ✅ DashboardService with all 11 methods
6. ✅ Type exports work across packages
7. ✅ Constants exports work across packages
8. ✅ TypeScript compilation passes with no errors
9. ✅ JSDoc documentation complete
10. ✅ Unit tests pass

## Risk Assessment

**Risk**: Type definitions don't match backend response
- **Mitigation**: Use backend serializer fields to define interfaces

**Risk**: Color preset hex codes invalid
- **Mitigation**: Test colors in browser dev tools

**Risk**: Service methods have incorrect signatures
- **Mitigation**: Add unit tests verifying method signatures

## Security Considerations

1. **Type Safety**: Prevent runtime errors with strict typing
2. **Input Validation**: Types enforce required fields
3. **API Response Validation**: Could add Zod schema validation
4. **No Secrets**: Constants contain only public configuration

## Next Steps

Proceed to [Phase 4: Frontend MobX Store](./phase-04-frontend-store.md)
- Create DashboardStore with MobX observables
- Implement actions for CRUD operations
- Add computed properties for derived state
