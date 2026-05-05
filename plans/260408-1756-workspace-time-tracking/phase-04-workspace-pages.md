# Phase 04 — Workspace Pages (Layout, Header, Pages)

## Context Links

- Project layout reference: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/layout.tsx`
- Project header reference: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/header.tsx`
- Project page reference: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/page.tsx`

## Overview

- **Priority**: P1
- **Status**: Pending
- **Description**: Create workspace-level layout with 3-tab navigation, header with breadcrumbs, and 3 page files.

## Key Insights

- Layout is nearly identical to project layout — same TAB_ITEMS, same tab rendering
- Differences: no `projectId` in params, no feature flag guard, different breadcrumbs, different basePath
- Header: workspace breadcrumb (no project breadcrumb), Timer icon
- Pages: pass `defaultCrossWorkspace={true}` to shared components
- **Use `useParams()` directly — no `Route.ComponentProps` type imports** (fixes RT-16)
- **Use `analytics` not `project_analytics` as tab key** (fixes RT-15)

## Related Code Files

### Create (all in `apps/web/app/(all)/[workspaceSlug]/(projects)/time-tracking/`)

- `layout.tsx` — 3-tab layout with AppHeader
- `header.tsx` — workspace breadcrumb with Timer icon
- `page.tsx` — My Timesheet tab (default)
- `analytics/page.tsx` — Analytics tab
- `capacity/page.tsx` — Capacity tab

## Implementation Steps

### 1. `header.tsx` (~40 lines)

```tsx
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { Timer } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Header } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";

export const WorkspaceTimeTrackingHeader = observer(function WorkspaceTimeTrackingHeader() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("time_tracking")}
                href={`/${workspaceSlug}/time-tracking/`}
                icon={<Timer className="h-4 w-4 text-tertiary" />}
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
```

### 2. `layout.tsx` (~100 lines)

Clone project layout with these changes:

- Remove `projectId` from params — only `workspaceSlug`
- Remove feature flag guard (`is_time_tracking_enabled` check)
- `basePath = /${workspaceSlug}/time-tracking`
- Import `WorkspaceTimeTrackingHeader` instead of `TimeTrackingHeader`
- Same TAB_ITEMS array (reuse keys: `my_timesheet`, `project_analytics`, `capacity`)
- Same secondary header with tab buttons
- Same `ContentWrapper` + `Outlet` pattern

### 3. `page.tsx` (~20 lines) — My Timesheet tab

```tsx
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { PageHead } from "@/components/core/page-title";
import { TimesheetGrid } from "@/plane-web/components/time-tracking/timesheet";

const WorkspaceTimesheetPage = observer(function WorkspaceTimesheetPage() {
  const { workspaceSlug } = useParams();
  return (
    <>
      <PageHead title={t("my_timesheet")} />
      <TimesheetGrid workspaceSlug={workspaceSlug} defaultCrossWorkspace />
    </>
  );
});
export default WorkspaceTimesheetPage;
```

Note: `projectId` omitted (optional after Phase 3).

### 4. `analytics/page.tsx` (~20 lines) — Analytics tab

```tsx
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { PageHead } from "@/components/core/page-title";
import { WorkspaceAnalyticsTimesheetGrid } from "@/plane-web/components/time-tracking/analytics";

const WorkspaceAnalyticsPage = observer(function WorkspaceAnalyticsPage() {
  const { workspaceSlug } = useParams();
  return (
    <>
      <PageHead title={t("workspace_analytics")} />
      <WorkspaceAnalyticsTimesheetGrid workspaceSlug={workspaceSlug} />
    </>
  );
});
export default WorkspaceAnalyticsPage;
```

### 5. `capacity/page.tsx` (~20 lines) — Capacity tab

```tsx
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { PageHead } from "@/components/core/page-title";
import { CapacityDashboard } from "@/plane-web/components/time-tracking/capacity";

const WorkspaceCapacityPage = observer(function WorkspaceCapacityPage() {
  const { workspaceSlug } = useParams();
  return (
    <>
      <PageHead title={t("capacity")} />
      <CapacityDashboard workspaceSlug={workspaceSlug} defaultCrossWorkspace />
    </>
  );
});
export default WorkspaceCapacityPage;
```

## Todo List

- [ ] Create `header.tsx` with workspace breadcrumbs
- [ ] Create `layout.tsx` with 3-tab navigation (no feature flag guard)
- [ ] Create `page.tsx` — Timesheet tab with `defaultCrossWorkspace`
- [ ] Create `analytics/page.tsx` — Analytics tab with `WorkspaceAnalyticsTimesheetGrid`
- [ ] Create `capacity/page.tsx` — Capacity tab with `defaultCrossWorkspace`

## Success Criteria

- All 3 tabs render correctly at workspace URLs
- Tab switching works via navigate()
- Breadcrumbs show workspace-level path (no project)
- `PageHead` sets correct title per tab

## Risk Assessment

- **Low**: Direct clone of working project layout pattern
- **Medium**: `Route.ComponentProps` type file (`+types/page.ts`) auto-generated by react-router — verify it generates for new route paths after routes registered (Phase 5)

---

## Red Team Findings — Phase 04

### Finding RT-1 (Critical): Route path `:workspaceSlug/time-tracking` double-defines `workspaceSlug`

- **Severity:** Critical
- **Location:** Phase 05, but affects Phase 04 route composition
- **Flaw:** `route(":workspaceSlug/time-tracking", ...)` inside a parent layout that already provides `workspaceSlug` creates `/:ws/:ws/time-tracking`. React Router v7 cannot re-define captured params in child routes.
- **Fix:** Change to `route("time-tracking", ...)` in Phase 05 extended.ts. Phase 04 page files unaffected.
- **Status:** Fix in Phase 05.

### Finding RT-16 (Medium): `Route.ComponentProps` type generation timing

- **Severity:** Medium
- **Location:** Phase 04, all page files
- **Flaw:** `import type { Route } from "./+types/page"` only resolves after Phase 05 registers routes. TypeScript compilation fails in Phase 04.
- **Fix:** Use `ReturnType<typeof useParams>` as a temporary type workaround in Phase 04. Or implement Phase 05 (route registration) before Phase 04 type-checking.
- **Status:** Fix in Phase 04.

### Finding RT-17 (Medium): i18n key mismatch — `time_tracking` vs `workspace_time_tracking`

- **Severity:** Medium
- **Location:** Phase 04 `header.tsx` (uses `t("time_tracking")`) vs Phase 05 (adds `workspace_time_tracking`)
- **Flaw:** Phase 04 breadcrumb uses `t("time_tracking")`. Phase 05 plan to add `workspace_time_tracking` key suggests disconnect — new key may be unused.
- **Fix:** Align Phase 04 and Phase 05 i18n key strategy. Reuse existing `time_tracking` key for sidebar if it already exists.
- **Status:** Resolve Phase 04 / Phase 05 alignment.

### Finding RT-15 (Medium): Tab key `project_analytics` vs `analytics` mismatch

- **Severity:** Medium
- **Location:** Phase 04, section "Key Insights"
- **Flaw:** Phase 04 says reuse keys `my_timesheet`, `project_analytics`, `capacity` but project time-tracking uses `analytics` not `project_analytics`.
- **Fix:** Use `analytics` as tab key to match existing project time-tracking.
- **Status:** Fix in Phase 04.
