# Phase 5: Navigation & Routing

## Context Links

- **Parent Plan**: [plan.md](./plan.md)
- **Previous Phase**: [Phase 4: Frontend Store](./phase-04-frontend-store.md)
- **Research Reports**:
  - [Frontend Patterns](./research/researcher-02-frontend-patterns.md)
- **Dependencies**: Phase 4 must be completed (store exists)

## Overview

**Date**: 2026-02-14
**Priority**: P1
**Status**: Completed
**Estimated Effort**: 2 hours

Add "Dashboards" navigation item to workspace sidebar and create route structure for dashboard pages.

## Key Insights

1. **Navigation Pattern**: Add to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS` in constants
2. **Route Structure**: Follow `(all)/[workspaceSlug]/(projects)/` pattern
3. **Route Types**: Use `Route.ComponentProps` from `+types/page`
4. **Icon Mapping**: Add icon mapping in sidebar helper
5. **Restricted URL**: "dashboards" already in RESTRICTED_URLS list

## Requirements

### Functional Requirements

1. "Dashboards" appears in workspace sidebar navigation
2. Dashboard list route: `/[workspaceSlug]/dashboards/`
3. Dashboard detail route: `/[workspaceSlug]/dashboards/[dashboardId]/`
4. Route highlighting when on dashboard pages
5. Permission-based visibility (ADMIN, MEMBER only)
6. i18n support for "Dashboards" label

### Non-Functional Requirements

1. Navigation item renders in correct sidebar section
2. Active state highlights when on dashboard routes
3. Icon displays correctly
4. Route transitions smooth (no flash)
5. Type-safe route parameters

## Architecture

### Navigation Structure

```
Workspace Sidebar
├── Views (existing)
├── Analytics (existing)
├── Dashboards (NEW)
│   └── href: /[workspaceSlug]/dashboards/
└── Archives (existing)
```

### Route Hierarchy

```
app/(all)/[workspaceSlug]/(projects)/
├── dashboards/
│   ├── page.tsx               # List view
│   └── [dashboardId]/
│       └── page.tsx           # Detail view
```

## Related Code Files

### Files to Create

1. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`**
   - Dashboard list page component

2. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`**
   - Dashboard detail page component

### Files to Modify

1. **`packages/constants/src/workspace.ts`**
   - Add "dashboards" to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS`
   - Add to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` array

2. **`apps/web/ce/components/navigations/top-navigation-root.tsx`** (or sidebar helper)
   - Add icon mapping for "dashboards"

3. **`packages/i18n/locales/en/default.json`** (and other locales)
   - Add translation key for "dashboards"

## Implementation Steps

### Step 1: Add Navigation Item to Constants

**File**: `packages/constants/src/workspace.ts`

Find `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS` and add:

```typescript
export const WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS: Record<
  string,
  IWorkspaceSidebarNavigationItem
> = {
  // ... existing items (views, analytics, etc.)

  dashboards: {
    key: "dashboards",
    labelTranslationKey: "dashboards",
    href: `/dashboards/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },

  // ... existing items (archives, etc.)
};
```

Then add to the links array:

```typescript
export const WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS: IWorkspaceSidebarNavigationItem[] = [
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["views"],
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["analytics"],
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["dashboards"], // Add here
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["archives"],
];
```

### Step 2: Add Icon Mapping

**File**: `apps/web/ce/components/navigations/top-navigation-root.tsx`

Find the icon mapping section and add:

```typescript
import { LayoutDashboard } from "lucide-react"; // Add import

// In the component or helper function that maps icons:
const getNavigationIcon = (key: string) => {
  switch (key) {
    case "views":
      return Layers;
    case "analytics":
      return BarChart3;
    case "dashboards": // Add this
      return LayoutDashboard;
    case "archives":
      return Archive;
    default:
      return null;
  }
};
```

### Step 3: Add i18n Translations

**File**: `packages/i18n/locales/en/default.json`

Add translation key:

```json
{
  "dashboards": "Dashboards"
}
```

Repeat for other locale files (es, fr, de, etc.):
- `packages/i18n/locales/es/default.json`: `"dashboards": "Paneles"`
- `packages/i18n/locales/fr/default.json`: `"dashboards": "Tableaux de bord"`
- `packages/i18n/locales/de/default.json`: `"dashboards": "Dashboards"`

### Step 4: Create Dashboard List Page

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`

```typescript
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import type { Route } from "./+types/page";

function DashboardListPage({ params }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { workspaceSlug } = params;

  const pageTitle = t("dashboards");

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-custom-border-200 p-4">
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </div>

        {/* Content - will be implemented in Phase 6 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-custom-text-300">
            Dashboard list will be implemented in Phase 6
          </div>
        </div>
      </div>
    </>
  );
}

export default observer(DashboardListPage);
```

### Step 5: Create Dashboard Detail Page

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`

```typescript
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import type { Route } from "./+types/page";

function DashboardDetailPage({ params }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { workspaceSlug, dashboardId } = params;

  const pageTitle = t("dashboards");

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header - will be implemented in Phase 6 */}
        <div className="border-b border-custom-border-200 p-4">
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
          <p className="text-sm text-custom-text-300">Dashboard ID: {dashboardId}</p>
        </div>

        {/* Content - widgets grid will be implemented in Phase 7 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-custom-text-300">
            Dashboard detail with widgets will be implemented in Phase 7
          </div>
        </div>
      </div>
    </>
  );
}

export default observer(DashboardDetailPage);
```

### Step 6: Verify Navigation Integration

Test the navigation:

```bash
# Start dev server
cd apps/web
pnpm dev

# Navigate to workspace
# http://localhost:3000/<workspace-slug>/

# Verify:
# 1. "Dashboards" appears in sidebar
# 2. Icon displays correctly
# 3. Click navigates to /dashboards/
# 4. Active state highlights
# 5. Dashboard list page loads
```

### Step 7: Test Route Parameters

Create manual test for route params:

```typescript
// Test navigation programmatically
import { useNavigate } from "react-router";

const navigate = useNavigate();

// Navigate to dashboard list
navigate(`/${workspaceSlug}/dashboards/`);

// Navigate to dashboard detail
navigate(`/${workspaceSlug}/dashboards/${dashboardId}/`);
```

### Step 8: Add Error Boundary

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/error.tsx`

```typescript
import { useRouteError, isRouteErrorResponse } from "react-router";

export default function DashboardErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{error.status}</h1>
          <p className="text-custom-text-300">{error.statusText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-custom-text-300">Something went wrong</p>
      </div>
    </div>
  );
}
```

### Step 9: Add Loading State

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/loading.tsx`

```typescript
import { Loader } from "@plane/propel/loader";

export default function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader />
    </div>
  );
}
```

## Todo List

- [ ] Add "dashboards" to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS`
- [ ] Add to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` array
- [ ] Add icon mapping in sidebar helper
- [ ] Add i18n translation keys (en, es, fr, de, etc.)
- [ ] Create dashboard list page component
- [ ] Create dashboard detail page component
- [ ] Create error boundary for dashboard routes
- [ ] Create loading component for dashboard routes
- [ ] Test navigation item appears in sidebar
- [ ] Test navigation to dashboard list
- [ ] Test navigation to dashboard detail
- [ ] Test active state highlighting
- [ ] Test permission-based visibility
- [ ] Verify route parameters work correctly
- [ ] Test i18n translations

## Success Criteria

1. ✅ "Dashboards" appears in workspace sidebar
2. ✅ Icon displays correctly (LayoutDashboard)
3. ✅ Navigation to `/dashboards/` works
4. ✅ Navigation to `/dashboards/[dashboardId]/` works
5. ✅ Active state highlights when on dashboard pages
6. ✅ Only visible to ADMIN and MEMBER roles
7. ✅ i18n translations work
8. ✅ Route parameters typed correctly
9. ✅ Error boundary catches route errors
10. ✅ Loading state displays during navigation

## Risk Assessment

**Risk**: Navigation item doesn't appear in sidebar
- **Mitigation**: Verify constants export and import chain

**Risk**: Icon not found or doesn't render
- **Mitigation**: Verify lucide-react icon import

**Risk**: Route parameters not typed
- **Mitigation**: Use `Route.ComponentProps` from `+types/page`

**Risk**: Translation keys missing
- **Mitigation**: Add to all locale files, fallback to English

## Security Considerations

1. **Role-Based Access**: Navigation only shows for ADMIN/MEMBER
2. **Route Guards**: Backend validates permissions (frontend only hides UI)
3. **Workspace Isolation**: Routes scoped to workspaceSlug
4. **Error Handling**: Error boundary prevents crash on bad routes

## Next Steps

Proceed to [Phase 6: Dashboard List & CRUD UI](./phase-06-dashboard-list-crud.md)
- Implement dashboard list page with cards
- Create dashboard create/edit modal
- Add delete confirmation dialog
- Implement empty state
