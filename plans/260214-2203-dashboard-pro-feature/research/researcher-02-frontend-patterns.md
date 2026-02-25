# Frontend Patterns Research - Dashboard Feature

**Research Date**: 2026-02-14
**Focus**: MobX stores, services, navigation, page components, type definitions
**Files Analyzed**: 5 core frontend pattern files

---

## MobX Store Patterns

### Structure
- **Base Class Pattern**: Abstract base class (`BaseAnalyticsStore`) with interface (`IBaseAnalyticsStore`)
- **Observables Declaration**: Use `makeObservable()` in constructor with explicit property mapping
- **Observable Types**:
  - `observable.ref` - For primitives/simple values (strings, booleans)
  - `observable` - For arrays/complex objects (automatically tracks mutations)
  - `computed` - For derived values

### Store Implementation Template
```typescript
export interface IDashboardStore {
  // observables
  currentView: string;
  filters: Record<string, any>;

  // computed
  isDataLoaded: boolean;

  // actions
  updateFilters: (filters: Record<string, any>) => void;
}

export class DashboardStore implements IDashboardStore {
  currentView = "overview";
  filters = {};

  constructor() {
    makeObservable(this, {
      currentView: observable.ref,
      filters: observable,
      isDataLoaded: computed,
      updateFilters: action,
    });
  }

  get isDataLoaded() {
    return Object.keys(this.filters).length > 0;
  }

  updateFilters = (filters: Record<string, any>) => {
    runInAction(() => {
      this.filters = filters;
    });
  };
}
```

### Key Patterns
- **Actions**: Wrap state mutations in `runInAction()` for proper reactivity
- **Error Handling**: Try-catch in actions, log to console
- **Computed Values**: Use getters for derived state (memoized automatically)

---

## Service Class Patterns

### Structure
- **Inheritance**: Extend `APIService` from `./api.service`
- **Constructor**: Pass `API_BASE_URL` to super
- **Method Signature**: Async functions returning typed promises
- **URL Building**: Use helper methods for dynamic URL construction

### Service Implementation Template
```typescript
export class DashboardService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getDashboardData<T>(
    workspaceSlug: string,
    params?: Record<string, any>
  ): Promise<T> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboard`, {
      params,
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getDashboardStats<T>(
    workspaceSlug: string,
    viewType: string
  ): Promise<T> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboard/stats`, {
      params: { type: viewType },
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
```

### Conventions
- **Error Handling**: Always catch and throw `err?.response?.data`
- **Generics**: Use `<T>` for flexible response types
- **URL Structure**: `/api/workspaces/{slug}/{feature}/{endpoint}`
- **Params**: Pass as object to `this.get()` options

---

## Navigation Integration

### Sidebar Navigation Item Format
```typescript
export interface IWorkspaceSidebarNavigationItem {
  key: string;                    // Unique identifier
  labelTranslationKey: string;    // i18n key for label
  href: string;                   // Relative URL path
  access: EUserWorkspaceRoles[];  // Role-based access control
  highlight: (pathname: string, url: string) => boolean;
}
```

### Adding Dashboard Navigation
**Location**: `packages/constants/src/workspace.ts`

**Step 1**: Add to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS`
```typescript
dashboard: {
  key: "dashboard",
  labelTranslationKey: "dashboard",
  href: `/dashboard/`,
  access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
  highlight: (pathname: string, url: string) => pathname.includes(url),
}
```

**Step 2**: Add to export array
```typescript
export const WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS: IWorkspaceSidebarNavigationItem[] = [
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["views"],
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["analytics"],
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["dashboard"], // Add here
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["archives"],
];
```

**Note**: URL is reserved in `RESTRICTED_URLS` (line 63), ensure "dashboard" remains restricted to prevent workspace slug conflicts.

---

## Page Component Patterns

### File Structure
- **Location**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboard/[viewId]/page.tsx`
- **Export**: Default export wrapped with `observer()` HOC
- **Route Typing**: Use `Route.ComponentProps` from `+types/page`

### Page Component Template
```typescript
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import type { Route } from "./+types/page";

function DashboardPage({ params }: Route.ComponentProps) {
  const { viewId } = params;
  const router = useRouter();
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();

  const pageTitle = currentWorkspace?.name
    ? t(`dashboard.page_label`, { workspace: currentWorkspace?.name })
    : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full overflow-hidden">
        {/* Page content */}
      </div>
    </>
  );
}

export default observer(DashboardPage);
```

### Key Patterns
- **Observer Wrapper**: All pages using MobX stores must be wrapped with `observer()`
- **Translation**: Use `useTranslation()` for i18n, pass interpolation objects
- **Page Head**: Always include `PageHead` component for SEO
- **Permission Checks**: Use `useUserPermissions()` hook with `allowPermissions()`
- **Empty States**: Use `EmptyStateDetailed` component from `@plane/propel/empty-state`
- **Tabs**: Use `@plane/propel/tabs` for tabbed interfaces

---

## Type Definition Patterns

### Location
`packages/types/src/dashboard.ts` (create new file)

### Conventions
- **Enums**: Use for fixed sets (ChartXAxisProperty, ChartYAxisMetric)
- **Type Aliases**: Use for unions (`TAnalyticsTabsBase = "overview" | "work-items"`)
- **Interfaces**: Use for object shapes with specific properties
- **Generics**: Use `<T>` for flexible API response types

### Dashboard Types Template
```typescript
export type TDashboardView = "overview" | "widgets" | "reports";

export interface IDashboardTab {
  key: TDashboardView;
  label: string;
  content: React.FC;
  isDisabled: boolean;
}

export type TDashboardFilterParams = {
  project_ids?: string;
  date_range?: string;
};

export interface IDashboardResponse {
  [key: string]: any;
}

export interface IDashboardStats {
  total_projects: number;
  active_issues: number;
  completed_issues: number;
}
```

---

## Recommendations for Dashboard Implementation

### 1. Store Setup
- Create `apps/web/core/store/dashboard.store.ts`
- Implement `DashboardStore` extending base pattern
- Add to root store if needed

### 2. Service Setup
- Create `apps/web/core/services/dashboard.service.ts`
- Extend `APIService` with dashboard-specific methods
- Follow error handling conventions

### 3. Navigation Setup
- Add dashboard entry to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS`
- Include in `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS`
- Set role access to `[ADMIN, MEMBER]` (exclude GUEST)

### 4. Page Setup
- Create route at `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboard/[viewId]/page.tsx`
- Use observer pattern, tab-based UI
- Implement permission checks and empty states

### 5. Type Definitions
- Create `packages/types/src/dashboard.ts`
- Define view types, filter params, response shapes
- Export from `packages/types/src/index.ts`

---

## Unresolved Questions

1. **Root Store Integration**: Does `DashboardStore` need to be added to root store, or can it be standalone?
2. **Backend Endpoints**: What are the exact API endpoint URLs for dashboard data? (Service methods depend on this)
3. **Permission Model**: Should Dashboard be PRO-only? If yes, need additional permission checks beyond role-based access.
4. **i18n Keys**: What translation keys should be added to locale files? (e.g., `dashboard.page_label`, `dashboard.overview`, etc.)
5. **Tab Content Components**: Should each tab have its own component file, or inline in page component?
