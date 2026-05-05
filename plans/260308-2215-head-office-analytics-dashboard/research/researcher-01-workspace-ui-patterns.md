# Workspace UI Patterns & Analytics Architecture Research

## 1. Sidebar Navigation Structure

### Current Navigation Items

Workspace sidebar is defined in `/packages/constants/src/workspace.ts`:

**Static Items** (always visible):

- `home` → `/` (Home)
- `inbox` → `/notifications/` (Notifications)
- `your-work` → `/profile/`
- `stickies` → `/stickies/`
- `drafts` → `/drafts/`
- `projects` → `/projects/` (pinned section)

**Dynamic Items** (in Workspace dropdown, user-configurable):

- `views` → `/workspace-views/all-issues/`
- `analytics` → `/analytics/` (EXISTING - project-level analytics)
- `dashboards` → `/dashboards/`
- `archives` → `/projects/archives/`

### Navigation Component Stack

```
SidebarMenuItems (core/components/workspace/sidebar/sidebar-menu-items.tsx)
  └─ Renders WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS
  └─ Renders WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS (inside Workspace dropdown)
  └─ Uses SidebarItem component to render nav items
```

**Key Files:**

- `/apps/web/app/(all)/[workspaceSlug]/(projects)/sidebar.tsx` - Main sidebar entry point
- `/core/components/workspace/sidebar/sidebar-menu-items.tsx` - Nav items rendering (lines 33-180)
- `/packages/constants/src/workspace.ts` - Navigation definitions (lines 201-290)

## 2. Existing Analytics Implementation

### Current Project-Level Analytics

**Path:** `/apps/web/app/(all)/[workspaceSlug]/(projects)/analytics/[tabId]/`

**Structure:**

- `page.tsx` - Main analytics page (lines 27-140)
- `layout.tsx` - Layout wrapper
- `header.tsx` - Header component
- Uses `useAnalyticsTabs()` hook to dynamically load analytics tabs

**Pattern Used:**

- Tabs-based UI (Propel Tabs component)
- Filter actions bar (`AnalyticsFilterActions`)
- Permission gating: requires ADMIN/MEMBER at workspace level
- Tab content lazily rendered from hook-provided components

### Analytics Tabs Hook

Located in `/plane-web/components/analytics/use-analytics-tabs.ts`

- Returns array of tab objects: `{ key, label, content: ReactComponent, isDisabled }`
- Accepts `workspaceSlug` parameter

## 3. Workspace Page Layout Patterns

### Workspace-Level Pages Structure

Standard path: `/(projects)/{page-name}/[params]/`

**Examples:**

- Dashboards: `/(projects)/dashboards/[dashboardId]/`
- Analytics: `/(projects)/analytics/[tabId]/`
- Views: `/(projects)/workspace-views/all-issues/`

### Data Fetching Pattern

- Service → MobX Store → React Component (observer pattern)
- `useProject()`, `useWorkspace()` hooks for store access
- `useUserPermissions()` for permission gating
- Page head managed via `PageHead` component

## 4. Key Architectural Insights

### Navigation Item Interface

From `/packages/constants/src/workspace.ts` line 201-229:

```typescript
interface IWorkspaceSidebarNavigationItem {
  key: string;
  labelTranslationKey: string;
  href: string;
  access: EUserWorkspaceRoles[];
  highlight: (pathname: string, url: string) => boolean;
}
```

### Permission Model

- Access controlled via `access` array (ADMIN, MEMBER, GUEST)
- Runtime permission check: `allowPermissions(permissions, level)`
- Admin-only features typically exclude GUEST role

### i18n Pattern

Translation keys follow: `workspace_analytics.page_label` (example from analytics page)

- Keys stored in Plane i18n system
- Used via `useTranslation()` hook and `t()` function

## 5. Files to Reference

### Core Navigation Files

- `/packages/constants/src/workspace.ts` (lines 201-290) - Navigation definitions
- `/apps/web/core/components/workspace/sidebar/sidebar-menu-items.tsx` - Nav rendering

### Analytics Page Reference

- `/apps/web/app/(all)/[workspaceSlug]/(projects)/analytics/[tabId]/page.tsx` - Page template

### Dashboards Reference

- `/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` - Page structure

## 6. Key Observations

1. **Navigation is constants-based**: Adding new sidebar items requires updating `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS` in workspace.ts
2. **Tabs pattern established**: Analytics page uses same Propel Tabs component as other workspace features
3. **Permission gating at two levels**: Navigation item access + page-level permission checks
4. **No workspace-admin analytics**: Current "analytics" is project-analytics (per-project data)
5. **Translation keys required**: All UI strings use i18n keys
6. **Responsive design**: Uses Tailwind v4 with semantic color tokens

## Unresolved Questions

1. What specific metrics should Head Office Analytics Dashboard show?
2. Should this be workspace-level analytics or require admin access only?
3. Does backend have aggregated analytics API endpoint or need custom query?
4. Are there existing chart libraries (Recharts, Chart.js, etc.) already integrated?
