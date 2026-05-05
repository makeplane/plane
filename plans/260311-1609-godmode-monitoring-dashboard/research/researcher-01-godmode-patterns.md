# God Mode Admin App Patterns Research

## Overview

Analysis of Plane.so God Mode admin app architecture for building monitoring dashboard feature.

---

## 1. Route Definition Pattern

**Location:** `apps/admin/app/routes.ts`

```typescript
import { index, layout, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  layout("./(all)/(home)/layout.tsx", [index("./(all)/(home)/page.tsx")]),
  layout("./(all)/(dashboard)/layout.tsx", [
    route("general", "./(all)/(dashboard)/general/page.tsx"),
    route("workspace", "./(all)/(dashboard)/workspace/page.tsx"),
    route("users", "./(all)/(dashboard)/users/page.tsx"),
  ]),
  route("*", "./components/404.tsx"),
] satisfies RouteConfig;
```

**Pattern:** React Router v7 route config using `layout()` and `route()` helpers. Nested groups use directory structure `(group)` for logical organization. To add monitoring dashboard:

- Add route: `route("monitoring", "./(all)/(dashboard)/monitoring/page.tsx")`
- Create directory: `apps/admin/app/(all)/(dashboard)/monitoring/`

---

## 2. MobX Store Pattern

**Location:** `apps/admin/store/instance.store.ts`

**Key Structure:**

```typescript
export interface IInstanceStore {
  // observables
  isLoading: boolean;
  error: any;
  instance: IInstance | undefined;
  // computed
  formattedConfig: IFormattedInstanceConfiguration | undefined;
  // actions
  fetchInstanceInfo: () => Promise<IInstanceInfo>;
  updateInstanceInfo: (data: Partial<IInstance>) => Promise<IInstance>;
}

export class InstanceStore implements IInstanceStore {
  constructor(private store: RootStore) {
    makeObservable(this, {
      // explicit field bindings
      isLoading: observable.ref,
      instance: observable,
      formattedConfig: computed,
      // actions must be declared
      fetchInstanceInfo: action,
      updateInstanceInfo: action,
    });
    this.instanceService = new InstanceService();
  }

  fetchInstanceInfo = async () => {
    this.isLoading = true;
    try {
      const data = await this.instanceService.info();
      runInAction(() => {
        this.instance = data.instance;
        this.isLoading = false;
      });
      return data;
    } catch (error) {
      this.error = { message: "Failed to fetch" };
      throw error;
    }
  };
}
```

**Critical Rules:**

- Use `makeObservable()` explicitly (NOT `makeAutoObservable`)
- Declare all observables and actions in config
- Use `runInAction()` for async state updates
- Use `set()` from lodash-es for nested updates
- `.ref` for primitives/non-observable refs

---

## 3. Service Pattern

**Location:** `packages/services/src/workspace/instance-workspace.service.ts`

```typescript
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

export class InstanceWorkspaceService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async list(nextPageCursor?: string): Promise<TWorkspacePaginationInfo> {
    return this.get(`/api/instances/workspaces/`, {
      params: { cursor: nextPageCursor },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
```

**Pattern:**

- Extend `APIService` base class
- Endpoint routes: `/api/instances/{resource}/`
- Use `.get()`, `.post()`, `.put()`, `.delete()` methods
- Return `response?.data` and throw `error?.response?.data`
- Constructor accepts optional `BASE_URL` override

---

## 4. Navigation/Sidebar Pattern

**Location:** `apps/admin/hooks/use-sidebar-menu/core.ts`

```typescript
import { Image, BrainCog, Cog, Mail, Users } from "lucide-react";
import { LockIcon, WorkspaceIcon } from "@plane/propel/icons";

export type TCoreSidebarMenuKey = "general" | "email" | "workspace" | "users" | "ai" | "image" | "monitoring";

export const coreSidebarMenuLinks: Record<TCoreSidebarMenuKey, TSidebarMenuItem> = {
  monitoring: {
    Icon: BarChart3, // or preferred lucide icon
    name: "Monitoring",
    description: "System health and metrics.",
    href: `/monitoring/`,
  },
};
```

**To Add Menu Item:**

1. Add key to `TCoreSidebarMenuKey` union type
2. Add entry to `coreSidebarMenuLinks` object
3. Import icon from `lucide-react` or `@plane/propel/icons`

Sidebar menu auto-renders from this config via `useSidebarMenu()` hook.

---

## 5. Data Fetching Pattern

**Page Component Pattern:** `apps/admin/app/(all)/(dashboard)/(dashboard)/general/page.tsx`

```typescript
import { useEffect } from "react";
import { observer } from "mobx-react";
import { useInstance } from "@/hooks/store";

function GeneralPage() {
  const { instance, fetchInstanceInfo } = useInstance();

  useEffect(() => {
    fetchInstanceInfo();
  }, []);

  if (!instance) return <LoadingSpinner />;

  return <div>{/* render using instance data */}</div>;
}

export default observer(GeneralPage);
```

**Pattern:**

- Wrap component with `observer()` from `mobx-react`
- Use custom hooks like `useInstance()` to access stores
- Call fetch in `useEffect` with empty dependency array
- No external data fetching library (SWR/React Query) — MobX actions only

---

## 6. Component Libraries & Imports

**Key Imports Used:**

```typescript
// UI Components
import { Tooltip } from "@plane/propel/tooltip";
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";

// Icons
import { Image, Cog, Mail, Users, BrainCog } from "lucide-react";
import { LockIcon, WorkspaceIcon } from "@plane/propel/icons";

// Hooks
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { observer } from "mobx-react";

// Styling
// Tailwind v4 with semantic color tokens:
// bg-surface-1, text-primary, text-secondary
// hover:bg-layer-transparent-hover, active:bg-layer-transparent-active
```

**Color System:** Use semantic tokens (`text-primary`, `bg-surface-1`), never hardcode colors.

---

## 7. Layout Structure

**Base Layout:** `apps/admin/app/(all)/(dashboard)/layout.tsx`

```typescript
import { observer } from "mobx-react";
import { Outlet } from "react-router";
import { AdminHeader } from "@/components/common/header";
import { AdminSidebar } from "./sidebar";

function AdminLayout() {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <AdminSidebar />
      <main className="relative flex h-full w-full flex-col overflow-hidden bg-surface-1">
        <AdminHeader />
        <div className="h-full w-full overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default observer(AdminLayout);
```

**Structure:**

- Sidebar (left, 290px or 70px collapsed)
- Header (top)
- Content area (right, scrollable)

---

## Key Takeaways

1. **Routes:** Add to `routes.ts` using `route()` helper + directory under `(all)/(dashboard)/`
2. **Store:** Create file `apps/admin/store/monitoring.store.ts` with `makeObservable()` explicit bindings
3. **Service:** Create `packages/services/src/instance/monitoring.service.ts` extending `APIService`
4. **Navigation:** Add entry to `coreSidebarMenuLinks` in `apps/admin/hooks/use-sidebar-menu/core.ts`
5. **Page:** Create `apps/admin/app/(all)/(dashboard)/monitoring/page.tsx` with `observer()` wrapper
6. **UI:** Use `@plane/propel/*` components, lucide-react icons, semantic color tokens
7. **Fetching:** MobX actions + `runInAction()` for state updates, no SWR/React Query

---

## Unresolved Questions

- Does monitoring dashboard need real-time data? If yes, WebSocket/polling strategy?
- What metrics to display? (CPU, memory, API latency, request counts, error rates?)
- Authentication/authorization model for dashboard access?
