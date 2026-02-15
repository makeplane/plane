# Phase 4: Frontend MobX Store

## Context Links

- **Parent Plan**: [plan.md](./plan.md)
- **Previous Phase**: [Phase 3: Frontend Types & Service](./phase-03-frontend-types-constants-service.md)
- **Research Reports**:
  - [Frontend Patterns](./research/researcher-02-frontend-patterns.md)
- **Dependencies**: Phase 3 must be completed (types and service exist)

## Overview

**Date**: 2026-02-14
**Priority**: P1
**Status**: Completed
**Estimated Effort**: 3 hours

Create MobX store for dashboard state management with observables, actions, and computed values.

## Key Insights

1. **Observable Declaration**: Use `makeObservable()` with explicit property mapping
2. **Observable Types**: Use `observable.ref` for primitives, `observable` for collections
3. **Actions**: Wrap mutations in `runInAction()` for proper reactivity
4. **Computed**: Use getters for derived state (auto-memoized)
5. **Error Handling**: Try-catch in actions, set error observables

## Requirements

### Functional Requirements

1. Store dashboard list and active dashboard
2. Store widgets for active dashboard
3. Cache widget data by widget ID
4. CRUD operations for dashboards
5. CRUD operations for widgets
6. Fetch widget data with caching
7. Computed properties for sorted lists

### Non-Functional Requirements

1. Efficient re-renders (MobX reactivity)
2. Error state management
3. Loading state tracking
4. Data normalization (use Maps for O(1) lookups)
5. Memory cleanup on component unmount

## Architecture

### Store Structure

```
DashboardStore
  ├── observables
  │   ├── dashboardMap: Map<string, IDashboard>
  │   ├── widgetMap: Map<string, IDashboardWidget>
  │   ├── widgetDataMap: Map<string, IChartData | INumberWidgetData>
  │   ├── activeDashboardId: string | null
  │   ├── isLoading: boolean
  │   └── error: any | null
  ├── computed
  │   ├── dashboardsList
  │   ├── currentDashboard
  │   ├── currentWidgets
  │   └── sortedWidgets
  └── actions
      ├── fetchDashboards()
      ├── createDashboard()
      ├── updateDashboard()
      ├── deleteDashboard()
      ├── fetchWidgets()
      ├── createWidget()
      ├── updateWidget()
      ├── deleteWidget()
      ├── fetchWidgetData()
      └── setActiveDashboard()
```

### Data Flow

1. Component calls action → Action sets loading state
2. Action calls service method → Service hits API
3. API returns data → Action updates observables in `runInAction()`
4. MobX notifies observers → Components re-render

## Related Code Files

### Files to Create

1. **`apps/web/core/store/dashboard.store.ts`**
   - DashboardStore class
   - Interface IDashboardStore

### Files to Modify

1. **`apps/web/core/store/root.store.ts`**
   - Import and instantiate DashboardStore
   - Add to root store interface

## Implementation Steps

### Step 1: Create Dashboard Store Interface

**File**: `apps/web/core/store/dashboard.store.ts`

```typescript
import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { DashboardService } from "@/core/services/dashboard.service";
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

export interface IDashboardStore {
  // Observables
  dashboardMap: Map<string, IDashboard>;
  widgetMap: Map<string, IDashboardWidget>;
  widgetDataMap: Map<string, IChartData | INumberWidgetData>;
  activeDashboardId: string | null;
  isLoading: boolean;
  error: any | null;

  // Computed
  dashboardsList: IDashboard[];
  currentDashboard: IDashboard | null;
  currentWidgets: IDashboardWidget[];
  sortedWidgets: IDashboardWidget[];

  // Actions
  fetchDashboards: (workspaceSlug: string) => Promise<IDashboard[]>;
  createDashboard: (
    workspaceSlug: string,
    data: TDashboardCreate
  ) => Promise<IDashboard>;
  updateDashboard: (
    workspaceSlug: string,
    dashboardId: string,
    data: TDashboardUpdate
  ) => Promise<IDashboard>;
  deleteDashboard: (workspaceSlug: string, dashboardId: string) => Promise<void>;
  fetchDashboard: (
    workspaceSlug: string,
    dashboardId: string
  ) => Promise<IDashboardDetail>;
  fetchWidgets: (
    workspaceSlug: string,
    dashboardId: string
  ) => Promise<IDashboardWidget[]>;
  createWidget: (
    workspaceSlug: string,
    dashboardId: string,
    data: TWidgetCreate
  ) => Promise<IDashboardWidget>;
  updateWidget: (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TWidgetUpdate
  ) => Promise<IDashboardWidget>;
  deleteWidget: (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string
  ) => Promise<void>;
  fetchWidgetData: (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    params?: Record<string, any>
  ) => Promise<IChartData | INumberWidgetData>;
  setActiveDashboard: (dashboardId: string | null) => void;
  clearError: () => void;
}
```

### Step 2: Implement Dashboard Store

**File**: `apps/web/core/store/dashboard.store.ts` (continued)

```typescript
export class DashboardStore implements IDashboardStore {
  // Services
  dashboardService: DashboardService;

  // Observables
  dashboardMap: Map<string, IDashboard> = new Map();
  widgetMap: Map<string, IDashboardWidget> = new Map();
  widgetDataMap: Map<string, IChartData | INumberWidgetData> = new Map();
  activeDashboardId: string | null = null;
  isLoading = false;
  error: any | null = null;

  constructor() {
    makeObservable(this, {
      // Observables
      dashboardMap: observable,
      widgetMap: observable,
      widgetDataMap: observable,
      activeDashboardId: observable.ref,
      isLoading: observable.ref,
      error: observable.ref,

      // Computed
      dashboardsList: computed,
      currentDashboard: computed,
      currentWidgets: computed,
      sortedWidgets: computed,

      // Actions
      fetchDashboards: action,
      createDashboard: action,
      updateDashboard: action,
      deleteDashboard: action,
      fetchDashboard: action,
      fetchWidgets: action,
      createWidget: action,
      updateWidget: action,
      deleteWidget: action,
      fetchWidgetData: action,
      setActiveDashboard: action,
      clearError: action,
    });

    this.dashboardService = new DashboardService();
  }

  // Computed properties
  get dashboardsList(): IDashboard[] {
    return Array.from(this.dashboardMap.values()).sort(
      (a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at)
    );
  }

  get currentDashboard(): IDashboard | null {
    if (!this.activeDashboardId) return null;
    return this.dashboardMap.get(this.activeDashboardId) || null;
  }

  get currentWidgets(): IDashboardWidget[] {
    if (!this.activeDashboardId) return [];
    return Array.from(this.widgetMap.values()).filter(
      (widget) => widget.dashboard === this.activeDashboardId
    );
  }

  get sortedWidgets(): IDashboardWidget[] {
    return this.currentWidgets.sort(
      (a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at)
    );
  }

  // Dashboard actions
  fetchDashboards = async (workspaceSlug: string): Promise<IDashboard[]> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const dashboards = await this.dashboardService.getDashboards(workspaceSlug);

      runInAction(() => {
        dashboards.forEach((dashboard) => {
          this.dashboardMap.set(dashboard.id, dashboard);
        });
        this.isLoading = false;
      });

      return dashboards;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
      console.error("Failed to fetch dashboards:", error);
      throw error;
    }
  };

  createDashboard = async (
    workspaceSlug: string,
    data: TDashboardCreate
  ): Promise<IDashboard> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const dashboard = await this.dashboardService.createDashboard(
        workspaceSlug,
        data
      );

      runInAction(() => {
        this.dashboardMap.set(dashboard.id, dashboard);
        this.isLoading = false;
      });

      return dashboard;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
      console.error("Failed to create dashboard:", error);
      throw error;
    }
  };

  updateDashboard = async (
    workspaceSlug: string,
    dashboardId: string,
    data: TDashboardUpdate
  ): Promise<IDashboard> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const dashboard = await this.dashboardService.updateDashboard(
        workspaceSlug,
        dashboardId,
        data
      );

      runInAction(() => {
        this.dashboardMap.set(dashboard.id, dashboard);
        this.isLoading = false;
      });

      return dashboard;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
      console.error("Failed to update dashboard:", error);
      throw error;
    }
  };

  deleteDashboard = async (
    workspaceSlug: string,
    dashboardId: string
  ): Promise<void> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      await this.dashboardService.deleteDashboard(workspaceSlug, dashboardId);

      runInAction(() => {
        this.dashboardMap.delete(dashboardId);
        // Clear widgets for deleted dashboard
        Array.from(this.widgetMap.entries()).forEach(([widgetId, widget]) => {
          if (widget.dashboard === dashboardId) {
            this.widgetMap.delete(widgetId);
            this.widgetDataMap.delete(widgetId);
          }
        });
        if (this.activeDashboardId === dashboardId) {
          this.activeDashboardId = null;
        }
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
      console.error("Failed to delete dashboard:", error);
      throw error;
    }
  };

  fetchDashboard = async (
    workspaceSlug: string,
    dashboardId: string
  ): Promise<IDashboardDetail> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const dashboard = await this.dashboardService.getDashboard(
        workspaceSlug,
        dashboardId
      );

      runInAction(() => {
        this.dashboardMap.set(dashboard.id, dashboard);
        dashboard.widgets.forEach((widget) => {
          this.widgetMap.set(widget.id, widget);
        });
        this.isLoading = false;
      });

      return dashboard;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
      console.error("Failed to fetch dashboard:", error);
      throw error;
    }
  };

  // Widget actions
  fetchWidgets = async (
    workspaceSlug: string,
    dashboardId: string
  ): Promise<IDashboardWidget[]> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const widgets = await this.dashboardService.getWidgets(
        workspaceSlug,
        dashboardId
      );

      runInAction(() => {
        widgets.forEach((widget) => {
          this.widgetMap.set(widget.id, widget);
        });
        this.isLoading = false;
      });

      return widgets;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
      console.error("Failed to fetch widgets:", error);
      throw error;
    }
  };

  createWidget = async (
    workspaceSlug: string,
    dashboardId: string,
    data: TWidgetCreate
  ): Promise<IDashboardWidget> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const widget = await this.dashboardService.createWidget(
        workspaceSlug,
        dashboardId,
        data
      );

      runInAction(() => {
        this.widgetMap.set(widget.id, widget);
        // Update dashboard widget count
        const dashboard = this.dashboardMap.get(dashboardId);
        if (dashboard) {
          this.dashboardMap.set(dashboardId, {
            ...dashboard,
            widget_count: dashboard.widget_count + 1,
          });
        }
        this.isLoading = false;
      });

      return widget;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
      console.error("Failed to create widget:", error);
      throw error;
    }
  };

  updateWidget = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TWidgetUpdate
  ): Promise<IDashboardWidget> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const widget = await this.dashboardService.updateWidget(
        workspaceSlug,
        dashboardId,
        widgetId,
        data
      );

      runInAction(() => {
        this.widgetMap.set(widget.id, widget);
        // Clear cached data to force refresh
        this.widgetDataMap.delete(widgetId);
        this.isLoading = false;
      });

      return widget;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
      console.error("Failed to update widget:", error);
      throw error;
    }
  };

  deleteWidget = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string
  ): Promise<void> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      await this.dashboardService.deleteWidget(workspaceSlug, dashboardId, widgetId);

      runInAction(() => {
        this.widgetMap.delete(widgetId);
        this.widgetDataMap.delete(widgetId);
        // Update dashboard widget count
        const dashboard = this.dashboardMap.get(dashboardId);
        if (dashboard && dashboard.widget_count > 0) {
          this.dashboardMap.set(dashboardId, {
            ...dashboard,
            widget_count: dashboard.widget_count - 1,
          });
        }
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
      console.error("Failed to delete widget:", error);
      throw error;
    }
  };

  fetchWidgetData = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    params?: Record<string, any>
  ): Promise<IChartData | INumberWidgetData> => {
    try {
      const data = await this.dashboardService.getWidgetData(
        workspaceSlug,
        dashboardId,
        widgetId,
        params
      );

      runInAction(() => {
        this.widgetDataMap.set(widgetId, data);
      });

      return data;
    } catch (error) {
      console.error("Failed to fetch widget data:", error);
      throw error;
    }
  };

  // Utility actions
  setActiveDashboard = (dashboardId: string | null) => {
    this.activeDashboardId = dashboardId;
  };

  clearError = () => {
    this.error = null;
  };
}
```

### Step 3: Integrate with Root Store

**File**: `apps/web/core/store/root.store.ts`

```typescript
// Add import
import { DashboardStore } from "./dashboard.store";

// Add to RootStore interface
export interface IRootStore {
  // ... existing stores
  dashboard: DashboardStore;
}

// Add to RootStore class
export class RootStore implements IRootStore {
  // ... existing stores
  dashboard: DashboardStore;

  constructor() {
    // ... existing stores initialization
    this.dashboard = new DashboardStore();
  }
}
```

### Step 4: Create Custom Hook

**File**: `apps/web/core/hooks/use-dashboard-store.ts`

```typescript
import { useStore } from "./use-store";

export const useDashboardStore = () => {
  const { dashboard } = useStore();
  return dashboard;
};
```

### Step 5: Write Unit Tests

**File**: `apps/web/core/store/__tests__/dashboard.store.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DashboardStore } from "../dashboard.store";

describe("DashboardStore", () => {
  let store: DashboardStore;

  beforeEach(() => {
    store = new DashboardStore();
  });

  it("should initialize with empty maps", () => {
    expect(store.dashboardMap.size).toBe(0);
    expect(store.widgetMap.size).toBe(0);
    expect(store.widgetDataMap.size).toBe(0);
  });

  it("should set active dashboard", () => {
    const dashboardId = "test-id";
    store.setActiveDashboard(dashboardId);
    expect(store.activeDashboardId).toBe(dashboardId);
  });

  it("should compute dashboardsList correctly", () => {
    const mockDashboard = {
      id: "1",
      name: "Test",
      sort_order: 1,
      created_at: "2024-01-01",
    } as any;

    store.dashboardMap.set("1", mockDashboard);
    expect(store.dashboardsList).toHaveLength(1);
    expect(store.dashboardsList[0]).toBe(mockDashboard);
  });
});
```

## Todo List

- [ ] Create `apps/web/core/store/dashboard.store.ts` with interface
- [ ] Implement DashboardStore class with all observables
- [ ] Implement all computed properties
- [ ] Implement all actions (11 total)
- [ ] Add to root store in `apps/web/core/store/root.store.ts`
- [ ] Create `use-dashboard-store.ts` custom hook
- [ ] Write unit tests for store
- [ ] Test MobX reactivity with mock components
- [ ] Verify error handling works
- [ ] Test loading states
- [ ] Verify computed properties are memoized

## Success Criteria

1. ✅ DashboardStore class created with all observables
2. ✅ All 11 actions implemented
3. ✅ All 4 computed properties working
4. ✅ Store integrated with root store
5. ✅ Custom hook `useDashboardStore` working
6. ✅ Unit tests pass
7. ✅ MobX reactivity working (observer components re-render)
8. ✅ Error states captured and stored
9. ✅ Loading states work correctly
10. ✅ Data normalization (Maps) working efficiently

## Risk Assessment

**Risk**: Memory leaks from cached widget data
- **Mitigation**: Clear cache on dashboard change, implement max cache size

**Risk**: Race conditions on concurrent updates
- **Mitigation**: Use runInAction for atomic updates

**Risk**: Stale data after updates
- **Mitigation**: Clear widget data cache after widget config updates

**Risk**: Store not reactive in components
- **Mitigation**: Ensure components wrapped with `observer()`

## Security Considerations

1. **No Sensitive Data**: Store contains only workspace-scoped data
2. **Error Handling**: Errors logged but sensitive details not exposed
3. **State Isolation**: Store scoped to workspace context
4. **Memory Management**: Clear maps on logout/workspace change

## Next Steps

Proceed to [Phase 5: Navigation & Routing](./phase-05-navigation-routing.md)
- Add "Dashboards" to sidebar navigation
- Create dashboard list and detail routes
- Set up route parameters
