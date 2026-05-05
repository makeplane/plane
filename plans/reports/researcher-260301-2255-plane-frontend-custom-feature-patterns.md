# Research Report: Plane.so Frontend Custom Feature Development Patterns

**Date:** 2026-03-01
**Sources:** Direct codebase analysis + GitHub repo exploration

---

## Executive Summary

Plane uses a layered override pattern: `core/` contains upstream-safe shared code, `ce/` (Community Edition) adds CE-specific stores/hooks/components, and `@/plane-web/*` is a TypeScript alias that resolves to `ce/`. Adding a new feature = add types → service (in `ce/services/`) → store (in `ce/store/`) → hook (in `ce/hooks/store/`) → components (in `ce/components/`) → route (in `app/routes/extended.ts`). Never touch `core/` for CE features.

Propel (`packages/propel`) is the primary design system with subpath imports (`@plane/propel/button`). Dialog uses compound component pattern. All components use Tailwind CSS v4 semantic tokens (`bg-surface-1`, `text-color-primary`, etc.) backed by CSS custom properties. MobX state flows from `RootStore` → hook → `observer()` component.

---

## 1. CE Override Pattern

### Directory Structure

```
apps/web/
├── core/         # Upstream-safe shared code — DO NOT put CE features here
│   ├── components/
│   ├── hooks/store/
│   ├── services/
│   ├── store/
│   └── lib/store-context.tsx   ← creates StoreContext from @/plane-web/store/root.store
│
├── ce/           # Community Edition features — all new features go here
│   ├── components/
│   ├── hooks/store/
│   ├── services/
│   ├── store/
│   │   └── root.store.ts       ← extends CoreRootStore
│   └── types/
│
└── app/          # React Router v7 file-based routes
    └── routes/
        ├── core.ts             ← core route definitions
        ├── extended.ts         ← CE route additions (currently empty — add CE routes here)
        └── helper.ts           ← mergeRoutes() deep-merges core + extended
```

### TypeScript Path Aliases (`apps/web/tsconfig.json`)

```json
{
  "@/*": ["./core/*"],
  "@/app/*": ["./app/*"],
  "@/helpers/*": ["./helpers/*"],
  "@/styles/*": ["./styles/*"],
  "@/plane-web/*": ["./ce/*"] // ← CE alias: @/plane-web/* → ce/*
}
```

**Rule:** `@/plane-web/...` always resolves to `ce/`. Core code imports CE types via this alias without knowing it's CE.

### CE RootStore Pattern

`core/store/root.store.ts` defines `CoreRootStore` with all base stores. `ce/store/root.store.ts` extends it:

```typescript
// ce/store/root.store.ts
import { CoreRootStore } from "@/store/root.store"; // resolves to core/
import { WorklogStore } from "@/store/worklog.store"; // resolves to core/
import { DashboardStore } from "./dashboards/dashboard.store"; // local CE store

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;
  worklog: IWorklogStore;
  customDashboard: DashboardStore; // ← CE-specific store added here

  constructor() {
    super();
    this.timelineStore = new TimeLineStore(this);
    this.worklog = new WorklogStore();
    this.customDashboard = new DashboardStore(this);
  }
}
```

`core/lib/store-context.tsx` instantiates `@/plane-web/store/root.store` (→ CE's RootStore):

```typescript
import { RootStore } from "@/plane-web/store/root.store"; // resolves to ce/
export const StoreContext = createContext<RootStore>(rootStore);
```

**Implication:** `CoreRootStore` sees CE stores via `RootStore` (which extends it), so `this as unknown as RootStore` cast is used in constructors that need CE stores.

---

## 2. MobX Store Pattern (Full Lifecycle)

### Store Interface + Class

```typescript
// ce/store/dashboards/dashboard.store.ts
import { makeObservable, observable, action, runInAction } from "mobx";
import { DashboardService } from "@/services/dashboards/dashboard.service";
import type { CoreRootStore } from "@/store/root.store";

export interface IDashboardStore {
  dashboards: IDashboard[];
  dashboardWidgets: Record<string, IDashboardWidget[]>;
  isLoading: boolean;
  // actions
  fetchDashboards: (workspaceSlug: string) => Promise<void>;
  createDashboard: (workspaceSlug: string, data: TDashboardCreate) => Promise<IDashboard>;
  // ... all methods typed in interface
}

export class DashboardStore implements IDashboardStore {
  dashboards: IDashboard[] = [];
  dashboardWidgets: Record<string, IDashboardWidget[]> = {};
  isLoading = false;

  private dashboardService: DashboardService;
  private rootStore: CoreRootStore;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      dashboards: observable,
      dashboardWidgets: observable,
      isLoading: observable,
      fetchDashboards: action,
      createDashboard: action,
    });
    this.rootStore = rootStore;
    this.dashboardService = new DashboardService();
  }

  fetchDashboards = async (workspaceSlug: string) => {
    runInAction(() => {
      this.isLoading = true;
    });
    try {
      const data = await this.dashboardService.getDashboards(workspaceSlug);
      runInAction(() => {
        this.dashboards = data;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };
}
```

### Register in CE RootStore

```typescript
// ce/store/root.store.ts
export class RootStore extends CoreRootStore {
  customDashboard: DashboardStore; // typed via IDashboardStore interface
  constructor() {
    super();
    this.customDashboard = new DashboardStore(this);
  }
}
```

### Hook Wrapper

```typescript
// ce/hooks/store/use-custom-dashboard.ts
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IDashboardStore } from "@/plane-web/store/dashboards/dashboard.store";
import type { RootStore as _RootStore } from "@/plane-web/store/root.store";

export const useCustomDashboard = (): IDashboardStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCustomDashboard must be used within StoreProvider");
  return (context as unknown as _RootStore).customDashboard;
};
```

**Note:** The cast `(context as unknown as _RootStore)` is needed because `StoreContext` is typed as `CoreRootStore` but the runtime value is `RootStore` (CE extension).

### Component Usage

```typescript
// ce/components/dashboards/custom-dashboard-widget-card.tsx
import { observer } from "mobx-react";
import { useCustomDashboard } from "@/plane-web/hooks/store/use-custom-dashboard";

export const CustomDashboardWidgetCard = observer(function CustomDashboardWidgetCard({ widget, workspaceSlug }) {
  const dashboardStore = useCustomDashboard();

  useEffect(() => {
    void dashboardStore.fetchWidgetChartData(workspaceSlug, widget.dashboard, widget.id);
  }, [workspaceSlug, widget.dashboard, widget.id, dashboardStore]);

  // render using dashboardStore.widgetChartData[widget.id]
});
```

**Key rule:** Every component reading MobX store MUST be wrapped in `observer()`. Use named function expressions (not arrows) for better React DevTools display.

---

## 3. React Router v7 Routing

### Entry Point (`app/routes.ts`)

```typescript
import { coreRoutes } from "./routes/core";
import { extendedRoutes } from "./routes/extended";
import { mergeRoutes } from "./routes/helper";

const mergedRoutes = mergeRoutes(coreRoutes, extendedRoutes);
export default [...mergedRoutes, route("*", "./not-found.tsx")];
```

### Adding CE Routes

Add routes to `app/routes/extended.ts` (currently empty):

```typescript
// app/routes/extended.ts
import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

export const extendedRoutes: RouteConfigEntry[] = [
  // Example: add a new CE-only page
  route(":workspaceSlug/my-feature", "./ce-pages/my-feature/page.tsx"),

  // Example: inject into existing workspace layout via mergeRoutes
  layout("./(all)/[workspaceSlug]/layout.tsx", [
    layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
      route(":workspaceSlug/my-section", "./my-pages/my-section/page.tsx"),
    ]),
  ]),
];
```

`mergeRoutes()` deep-merges by layout file path — if the same layout file key exists in both `core` and `extended`, children are merged preserving order (core first, then extended).

### Layout Hierarchy

```
app/(all)/layout.tsx                           # AppLayout — just <PreloadResources/><Outlet/>
└── app/(all)/[workspaceSlug]/layout.tsx       # WorkspaceLayout — auth check, WorkspaceContentWrapper
    └── app/(all)/[workspaceSlug]/(projects)/layout.tsx  # WorkspaceLayout — sidebar + main + Outlet
        ├── Sidebar (ProjectAppSidebar)
        ├── ExtendedProjectSidebar (CE panels)
        └── <main> with Outlet
            └── [page layout]                  # AppHeader + ContentWrapper + Outlet
                └── [page.tsx]                 # Actual page component
```

### Page Layout Pattern

Every page uses `AppHeader` + `ContentWrapper`:

```typescript
// app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(list)/layout.tsx
export default function ProjectCyclesListLayout() {
  return (
    <>
      <AppHeader header={<CyclesListHeader />} mobileHeader={<CyclesListMobileHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
```

### Route File Convention

- Route files: `page.tsx` (component), `layout.tsx` (layout wrapper)
- Params: `[workspaceSlug]`, `[projectId]`, `[dashboardId]` → `params.workspaceSlug` in component
- Grouped routes: `(projects)`, `(settings)`, `(detail)`, `(list)` — parenthesized dirs don't affect URL
- Access params via `Route.ComponentProps`:

```typescript
// page.tsx
import type { Route } from "./+types/page";

export default function MyPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
}
```

---

## 4. Service Layer

### Base Class (`core/services/api.service.ts`)

```typescript
export abstract class APIService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
    // auto-redirects to / on 401
    this.setupInterceptors();
  }

  get(url, params?, config?) { ... }
  post(url, data?, config?) { ... }
  put(url, data?, config?) { ... }
  patch(url, data?, config?) { ... }
  delete(url, config?) { ... }
}
```

### Service Implementation Pattern

```typescript
// ce/services/department.service.ts (actual codebase example)
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export class DepartmentService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getDepartments(workspaceSlug: string): Promise<IDepartment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/departments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createDepartment(workspaceSlug: string, data: IDepartmentCreate): Promise<IDepartment> {
    return this.post(`/api/workspaces/${workspaceSlug}/departments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateDepartment(workspaceSlug: string, departmentId: string, data: IDepartmentUpdate): Promise<IDepartment> {
    return this.patch(`/api/workspaces/${workspaceSlug}/departments/${departmentId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteDepartment(workspaceSlug: string, departmentId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/departments/${departmentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
```

**URL Pattern:** Always `/api/workspaces/${workspaceSlug}/...` — Django prepends `/api/`.

---

## 5. Propel Design System Deep Dive

### Import Convention (CRITICAL)

```typescript
// Subpath imports — always use these
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast, setPromiseToast } from "@plane/propel/toast";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { Input } from "@plane/propel/input";
import { Tooltip } from "@plane/propel/tooltip";
import { Avatar } from "@plane/propel/avatar";
import { Badge } from "@plane/propel/badge";

// NEVER barrel import:
import { Button } from "@plane/propel"; // ❌ wrong
```

### Button API

```typescript
// From packages/propel/src/button/helper.tsx
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "error-fill" | "error-outline" | "secondary" | "tertiary" | "ghost" | "link";
  size?: "sm" | "base" | "lg" | "xl";
  loading?: boolean;
  prependIcon?: React.ReactElement;   // icon before text
  appendIcon?: React.ReactElement;    // icon after text
};

// Usage:
<Button variant="primary" size="base" prependIcon={<Plus />} loading={isSaving}>
  Save
</Button>
<Button variant="secondary" onClick={onCancel}>Cancel</Button>
<Button variant="error-fill">Delete</Button>
```

### Dialog — Compound Component Pattern

Propel Dialog uses `Object.assign` compound components (built on `@base-ui-components/react`):

```typescript
// From packages/propel/src/dialog/root.tsx
const Dialog = Object.assign(DialogComponent, {
  Panel: DialogPanel,
  Title: DialogTitle,
});

// Usage:
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Trigger asChild>
    <Button>Open Dialog</Button>
  </Dialog.Trigger>
  <Dialog.Panel width={EDialogWidth.LG} position="center">
    <Dialog.Title>Confirm Action</Dialog.Title>
    <p className="text-color-secondary text-sm">Are you sure?</p>
    <div className="flex justify-end gap-2 mt-4">
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="error-fill" onClick={handleConfirm}>
        Delete
      </Button>
    </div>
  </Dialog.Panel>
</Dialog>;
```

### Toast API

```typescript
import { TOAST_TYPE, setToast, setPromiseToast } from "@plane/propel/toast";

// Simple toast:
setToast({ type: TOAST_TYPE.SUCCESS, title: "Saved successfully" });
setToast({ type: TOAST_TYPE.ERROR, title: "Save failed", message: "Network error" });

// Promise toast (loading → success/error):
setPromiseToast(myAsyncOperation(), {
  loading: "Saving...",
  success: { title: "Saved!" },
  error: { title: "Failed", message: (err) => err.detail ?? "Unknown error" },
});
```

### Available Propel Components

`accordion`, `animated-counter`, `avatar`, `badge`, `banner`, `button`, `calendar`, `card`, `charts` (area-chart, bar-chart, etc.), `collapsible`, `combobox`, `command`, `context-menu`, `dialog`, `emoji-icon-picker`, `emoji-reaction`, `empty-state`, `icon-button`, `icons`, `input`, `menu`, `pill`, `popover`, `portal`, `scrollarea`, `separator`, `skeleton`, `spinners`, `switch`, `tab-navigation`, `table`, `tabs`, `toast`, `toolbar`, `tooltip`

---

## 6. Semantic Color Token System

Defined in `packages/tailwind-config/variables.css` as CSS custom properties, mapped to Tailwind classes via CSS v4.

### Background Tokens

| Tailwind Class         | CSS Var                  | Usage                          |
| ---------------------- | ------------------------ | ------------------------------ |
| `bg-canvas`            | `--bg-canvas`            | Page background                |
| `bg-surface-1`         | `--bg-surface-1`         | Cards, panels (white in light) |
| `bg-surface-2`         | `--bg-surface-2`         | Secondary surface              |
| `bg-layer-1`           | `--bg-layer-1`           | List rows, items               |
| `bg-layer-1-hover`     | `--bg-layer-1-hover`     | Row hover state                |
| `bg-layer-2`           | `--bg-layer-2`           | Nested containers              |
| `bg-layer-3`           | `--bg-layer-3`           | Tertiary layer                 |
| `bg-layer-transparent` | `--bg-layer-transparent` | Transparent                    |
| `bg-layer-disabled`    | `--bg-layer-disabled`    | Disabled elements              |
| `bg-accent-primary`    | `--bg-accent-primary`    | Brand color buttons            |
| `bg-accent-subtle`     | `--bg-accent-subtle`     | Subtle brand highlight         |
| `bg-success-primary`   | `--bg-success-primary`   | Success fill                   |
| `bg-success-subtle`    | `--bg-success-subtle`    | Success background             |
| `bg-warning-primary`   | `--bg-warning-primary`   | Warning fill                   |
| `bg-danger-primary`    | `--bg-danger-primary`    | Error fill                     |
| `bg-danger-subtle`     | `--bg-danger-subtle`     | Error background               |

### Text Color Tokens

| Tailwind Class         | Usage                                       |
| ---------------------- | ------------------------------------------- |
| `text-primary`         | Primary text                                |
| `text-secondary`       | Muted secondary text                        |
| `text-tertiary`        | Hint/label text                             |
| `text-placeholder`     | Input placeholders                          |
| `text-disabled`        | Disabled text                               |
| `text-on-color`        | Text on colored (accent/danger) backgrounds |
| `text-link-primary`    | Link color                                  |
| `text-accent-primary`  | Accent/brand text                           |
| `text-danger-primary`  | Error text                                  |
| `text-success-primary` | Success text                                |
| `text-warning-primary` | Warning text                                |

### Border Tokens

| Tailwind Class          | Usage                 |
| ----------------------- | --------------------- |
| `border-subtle`         | Default subtle border |
| `border-strong`         | Prominent border      |
| `border-accent-strong`  | Accent border         |
| `border-danger-strong`  | Error border          |
| `border-success-strong` | Success border        |

### Dark Mode

Uses `@custom-variant dark` targeting `[data-theme*="dark"]` attribute. All semantic tokens auto-switch — never use `dark:` prefix manually.

Themes: `light`, `dark`, `light-contrast`, `dark-contrast`

```typescript
// Body class always uses data-theme; ThemeStore manages it
// In component — semantic tokens handle dark mode automatically:
<div className="bg-surface-1 text-primary border border-subtle">// works in all themes</div>
```

---

## 7. Component Composition Patterns

### Primary Pattern: Simple Composition + Observer

Plane uses **simple prop-passing composition** — not render props or HOCs. Complex UIs are split into focused sub-components co-located in the same directory:

```
core/components/issues/issue-detail/
├── root.tsx          ← IssueDetailRoot — defines TIssueOperations type + orchestrates
├── main-content.tsx  ← IssueMainContent
├── sidebar.tsx       ← IssueDetailsSidebar
└── index.ts
```

The `root.tsx` defines a shared operations type passed to children:

```typescript
// Shared operations contract passed down via props — no context needed
export type TIssueOperations = {
  fetch: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  archive?: (...) => Promise<void>;
};
```

### Workspace Layout Pattern

```typescript
// app/(all)/[workspaceSlug]/(projects)/layout.tsx
function WorkspaceLayout() {
  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-subtle">
      <div id="full-screen-portal" className="inset-0 absolute w-full" />
      <div className="relative flex size-full overflow-hidden">
        <ProjectAppSidebar />
        <ExtendedProjectSidebar /> {/* CE-specific sidebar extension */}
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-surface-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default observer(WorkspaceLayout);
```

### Modal Pattern

Modals are centralized in `GlobalModals` component at workspace layout level, controlled by `commandPalette` store flags. For feature-specific modals, use local `useState` + Propel `Dialog`.

---

## 8. i18n Pattern

### Translation Files Location

```
packages/i18n/src/locales/
├── en/
│   ├── translations.ts     # All en translations (TypeScript object)
│   ├── core.ts
│   └── ...
├── ko/                     # Korean
└── vi/                     # Vietnamese
```

### Adding Translations

Add keys to ALL 3 locale files (en, ko, vi):

```typescript
// packages/i18n/src/locales/en/translations.ts
export default {
  sidebar: { projects: "Projects", ... },
  my_feature: {                           // ← add new section
    title: "My Feature",
    create_button: "Create Item",
    empty_state: "No items yet",
    count: "{count, plural, one {item} other {items}}",  // ICU pluralization
  },
};
```

### Component Usage

```typescript
import { useTranslation } from "@plane/i18n";

export const MyComponent = observer(() => {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("my_feature.title")}</h1>
      <Button>{t("my_feature.create_button")}</Button>
      <p>{t("my_feature.count", { count: items.length })}</p>
    </div>
  );
});
```

---

## 9. Monorepo Packages Summary

| Package                  | Import                      | Purpose                                                   |
| ------------------------ | --------------------------- | --------------------------------------------------------- |
| `@plane/propel`          | `@plane/propel/{component}` | Primary design system — Buttons, Dialog, Toast, etc.      |
| `@plane/ui`              | `@plane/ui`                 | Legacy components — use only when propel lacks equivalent |
| `@plane/types`           | `@plane/types`              | All shared TypeScript interfaces (ICycle, IIssue, etc.)   |
| `@plane/utils`           | `@plane/utils`              | Shared utilities: `cn()`, date helpers, order/sort fns    |
| `@plane/i18n`            | `@plane/i18n`               | `useTranslation()` hook, locale files                     |
| `@plane/constants`       | `@plane/constants`          | `API_BASE_URL`, role enums, event constants               |
| `@plane/hooks`           | `@plane/hooks`              | Shared React hooks (usePlatformOS, etc.)                  |
| `@plane/editor`          | `@plane/editor`             | Rich text editor components                               |
| `@plane/tailwind-config` | CSS via postcss             | Tailwind v4 config + semantic CSS tokens                  |
| `@plane/shared-state`    | `@plane/shared-state`       | `WorkItemFilterStore` — shared MobX state                 |
| `@plane/services`        | `@plane/services`           | Shared API service utilities                              |
| `@plane/decorators`      | `@plane/decorators`         | Shared TS decorators                                      |
| `@plane/logger`          | `@plane/logger`             | Logging utilities                                         |

---

## 10. End-to-End Feature Addition Checklist

### Backend (Django)

1. Model → `apps/api/plane/db/models/my_model.py` (extend `BaseModel` or `ProjectBaseModel`)
2. Migration → `python manage.py makemigrations`
3. Serializer → `apps/api/plane/app/serializers/my_model.py` (extend `BaseSerializer`)
4. Views → `apps/api/plane/app/views/my_model.py` (extend `BaseViewSet`)
5. URLs → `apps/api/plane/app/urls/my_model.py`, register in `__init__.py`
6. Register model/serializer/view in respective `__init__.py`

### Frontend (React)

7. **Types** → `packages/types/src/my_model.ts` (export from `index.ts`)
8. **Service** → `apps/web/ce/services/my-model.service.ts` (extend `APIService`)
9. **Store** → `apps/web/ce/store/my-feature/my-model.store.ts`
   - Define `IMyModelStore` interface
   - Implement `MyModelStore` class with `makeObservable`
10. **Register store** → add to `apps/web/ce/store/root.store.ts` CE `RootStore`
11. **Hook** → `apps/web/ce/hooks/store/use-my-model.ts`
    - `useContext(StoreContext)` → cast to CE `RootStore` → return store
12. **Components** → `apps/web/ce/components/my-feature/*.tsx`
    - Use `observer()`, semantic tokens, propel components, `useTranslation()`
13. **Page** → `apps/web/app/(all)/[workspaceSlug]/(projects)/my-feature/page.tsx`
    - Use `AppHeader` + `ContentWrapper` pattern
14. **Route** → Add to `apps/web/app/routes/extended.ts`
15. **Translations** → Add keys to all 3 locale files (en/ko/vi)

---

## Key Gotchas

1. **`(context as unknown as _RootStore)`** — CE hooks must cast `StoreContext` (typed as `CoreRootStore`) to CE `RootStore` to access CE stores. This is intentional — see `ce/hooks/store/use-custom-dashboard.ts`.

2. **`makeObservable` not `makeAutoObservable`** — All Plane stores use explicit `makeObservable` with declared observables for clarity and TS compatibility.

3. **Named function expressions in `observer()`** — `observer(function MyComp(...) {...})` not `observer(() => ...)` — for better React DevTools.

4. **`runInAction()`** is required for state mutations inside async functions — Plane's stores consistently use it after every `await`.

5. **`computedFn` from mobx-utils** — Used for parameterized computed values (e.g., `getItemById(id)`). Regular `computed` is for no-arg getters.

6. **Route merging** — `mergeRoutes()` keys on the `file` property. If you want CE routes nested under an existing layout, declare the same layout file in `extendedRoutes` and children will be deep-merged.

7. **Storybook exists** in `packages/propel/.storybook/` — propel components have `.stories.tsx` files for each component.

8. **`resetOnSignOut()`** — `CoreRootStore` has this method; CE `RootStore` must also reset CE stores if they hold user-specific state.

---

## Unresolved Questions

1. How does EE (Enterprise Edition) layer differ from CE? (separate private repo assumed)
2. Is there a plugin/extension API or is `ce/` override pattern the only extension mechanism?
3. `extendedRoutes` in `routes/extended.ts` is currently empty in this codebase — is this intended or is CE using a different approach for routes (direct file placement in `app/`)?
4. `packages/shared-state` only exports `WorkItemFilterStore` — any plans to add more shared stores there?
5. No CONTRIBUTING.md found in root — developer onboarding docs location unclear.
