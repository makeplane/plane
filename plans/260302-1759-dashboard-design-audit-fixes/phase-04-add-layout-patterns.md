# Phase 04: Add AppHeader + ContentWrapper Layout

## Context Links

- [Design Audit Report](../reports/design-review-260302-1619-dashboard-design-audit.md) — M3, M4
- [Layout reference: workspace-views](<../../apps/web/app/(all)/[workspaceSlug]/(projects)/workspace-views/layout.tsx>)
- [Current dashboards layout](<../../apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/layout.tsx>)

## Overview

- **Priority:** P2
- **Status:** pending
- **Description:** Add `AppHeader` + `ContentWrapper` pattern to dashboard layout, matching other workspace pages (workspace-views, stickies, analytics, etc.)

## Key Insights

- Current `dashboards/layout.tsx` is a bare `<Outlet />` — no AppHeader or ContentWrapper
- `[dashboardId]/page.tsx` has custom inline header (lines 67-82) that should move to a proper header component
- `dashboards/page.tsx` (list) has `DashboardListHeader` inline — should integrate with AppHeader
- Reference pattern from `workspace-views/layout.tsx`:
  ```tsx
  <AppHeader header={<GlobalIssuesHeader />} />
  <ContentWrapper><Outlet /></ContentWrapper>
  ```
- `ContentWrapper` import: `from "@/components/core/content-wrapper"` (NOT from `@plane/ui`)
- `AppHeader` import: `from "@/components/core/app-header"`

## Requirements

- Dashboard list page uses `ContentWrapper` for consistent padding
- Dashboard detail page uses `AppHeader` with proper header component
- Breadcrumb navigation in detail header follows Plane pattern
- Both pages integrate with sidebar layout correctly

## Architecture

### Current structure:

```
dashboards/layout.tsx         → bare <Outlet />
dashboards/page.tsx           → DashboardListHeader (inline border-b header)
dashboards/[dashboardId]/page.tsx → custom inline header with breadcrumb
```

### Target structure:

```
dashboards/layout.tsx         → <AppHeader /> + <ContentWrapper><Outlet /></ContentWrapper>
dashboards/page.tsx           → content only (header provided by layout)
dashboards/[dashboardId]/layout.tsx → NEW: <AppHeader /> + <ContentWrapper><Outlet /></ContentWrapper>
dashboards/[dashboardId]/page.tsx   → content only (header in layout)
```

**Alternative (simpler):** Since list and detail have different headers, two approaches:

**Option A — Single layout with dynamic header:** Complex, requires context/state to switch headers.

**Option B — Separate layouts:** Create `[dashboardId]/layout.tsx` with its own AppHeader. The parent `dashboards/layout.tsx` handles list-level header. This matches how `projects/(detail)/[projectId]/views/(list)/layout.tsx` and `views/(detail)/layout.tsx` work.

**Recommended: Option B** — simpler, follows existing codebase patterns.

## Related Code Files

### Files to modify

1. `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/layout.tsx` — add AppHeader + ContentWrapper for list
2. `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx` — remove DashboardListHeader (moved to layout header)
3. `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` — remove inline header

### Files to create

4. `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/header.tsx` — list page header component
5. `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/layout.tsx` — detail layout with AppHeader + ContentWrapper
6. `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/header.tsx` — detail page header component

### Reference files

- `apps/web/app/(all)/[workspaceSlug]/(projects)/workspace-views/layout.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/workspace-views/header.tsx`

## Embedded Rules

- **AppHeader pattern:** `<AppHeader header={<MyHeader />} />` — renders in sidebar layout header slot
- **ContentWrapper:** `<ContentWrapper>` wraps page content for consistent padding/scroll
- **observer()** on header components that read MobX stores
- **Import order:** React → external → types → @plane/\* → @/ → relative
- **File size:** header components should be <150 lines

## Implementation Steps

### Step 1: Create list page header component

**File (NEW):** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/header.tsx`

Extract from current `DashboardListHeader` component + integrate with Plane's header pattern:

```tsx
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Breadcrumbs } from "@plane/ui";
import { DashboardIcon } from "@plane/propel/icons";

interface DashboardListHeaderProps {
  onCreateClick: () => void;
}

export const DashboardListHeader = observer(function DashboardListHeader({ onCreateClick }: DashboardListHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-surface-1 p-4">
      <Breadcrumbs>
        <Breadcrumbs.BreadcrumbItem
          type="text"
          link={
            <span className="flex items-center gap-1.5">
              <DashboardIcon className="h-4 w-4" />
              {t("dashboards")}
            </span>
          }
        />
      </Breadcrumbs>
      <Button variant="primary" size="sm" onClick={onCreateClick}>
        <Plus className="h-4 w-4" />
        {t("analytics_dashboard.new_dashboard")}
      </Button>
    </div>
  );
});
```

**Note:** The `onCreateClick` callback needs to come from the page. Since AppHeader renders the header outside the Outlet, we need a shared state or callback mechanism. Check how other headers handle this — they typically use store actions or URL state.

**Alternative approach:** If passing callbacks to header is complex, keep the header simple (title + breadcrumb only) and keep the "New Dashboard" button inside the page content. This is simpler and avoids cross-component callback wiring.

### Step 2: Update dashboards/layout.tsx

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/layout.tsx`

```tsx
import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { DashboardListHeader } from "./header";

export default function WorkspaceDashboardsLayout() {
  return (
    <>
      <AppHeader header={<DashboardListHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
```

**Issue:** If `[dashboardId]/layout.tsx` also uses AppHeader, there may be nested AppHeader calls. Verify React Router v7 nesting: child layout replaces parent layout's AppHeader slot or stacks. Check how `projects/(detail)/[projectId]/views/` handles this.

### Step 3: Update dashboards/page.tsx (list)

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`

- Remove `DashboardListHeader` component import and usage (line 22, 99)
- Remove the outer `flex h-full flex-col overflow-hidden` wrapper if ContentWrapper handles it
- Keep the grid content and modals
- Move "New Dashboard" button to within page content (next to empty state button that already exists)

### Step 4: Create detail page header

**File (NEW):** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/header.tsx`

```tsx
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs } from "@plane/ui";
import { DashboardIcon } from "@plane/propel/icons";
import { useCustomDashboard } from "@/plane-web/hooks/store/use-custom-dashboard";

interface DashboardDetailHeaderProps {
  workspaceSlug: string;
  dashboardId: string;
}

export const DashboardDetailHeader = observer(function DashboardDetailHeader({
  workspaceSlug,
  dashboardId,
}: DashboardDetailHeaderProps) {
  const { t } = useTranslation();
  const store = useCustomDashboard();
  const dashboard = store.dashboards.find((d) => d.id === dashboardId);

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-surface-1 p-4">
      <Breadcrumbs>
        <Breadcrumbs.BreadcrumbItem
          type="text"
          link={
            <a href={`/${workspaceSlug}/dashboards`} className="flex items-center gap-1.5">
              <DashboardIcon className="h-4 w-4" />
              {t("dashboards")}
            </a>
          }
        />
        <Breadcrumbs.BreadcrumbItem
          type="text"
          link={<span>{dashboard?.name ?? t("analytics_dashboard.label")}</span>}
        />
      </Breadcrumbs>
    </div>
  );
});
```

### Step 5: Create [dashboardId]/layout.tsx

**File (NEW):** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/layout.tsx`

```tsx
import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { DashboardDetailHeader } from "./header";
import type { Route } from "./+types/layout";

export default function DashboardDetailLayout({ params }: Route.ComponentProps) {
  return (
    <>
      <AppHeader
        header={<DashboardDetailHeader workspaceSlug={params.workspaceSlug} dashboardId={params.dashboardId} />}
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
```

### Step 6: Clean up [dashboardId]/page.tsx

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`

- Remove inline header block (lines 67-82)
- Remove `useAppRouter` import if only used for back navigation (breadcrumb handles it now)
- Keep the "Add Widget" button inside the content area (above grid)
- Remove `flex h-full flex-col overflow-hidden` outer wrapper if ContentWrapper handles it

## Post-Phase Checklist

- [ ] `dashboards/layout.tsx` uses `AppHeader` + `ContentWrapper`
- [ ] `[dashboardId]/layout.tsx` uses `AppHeader` + `ContentWrapper`
- [ ] No inline headers in page components
- [ ] Breadcrumb navigation works (list → detail → back)
- [ ] `observer()` on header components that read stores
- [ ] Content scrolls correctly inside `ContentWrapper`
- [ ] New files under 150 lines
- [ ] `pnpm check:lint` passes
- [ ] React Router v7 route file conventions followed (check `+types` imports)

## Todo

- [ ] Create `dashboards/header.tsx`
- [ ] Update `dashboards/layout.tsx` with AppHeader + ContentWrapper
- [ ] Update `dashboards/page.tsx` — remove inline header
- [ ] Create `[dashboardId]/header.tsx`
- [ ] Create `[dashboardId]/layout.tsx`
- [ ] Update `[dashboardId]/page.tsx` — remove inline header
- [ ] Verify nested layout behavior (child AppHeader replaces parent)
- [ ] Lint check passes

## Success Criteria

- Dashboard pages use standard Plane layout pattern
- Breadcrumb navigation functional
- Consistent padding/scroll with other workspace pages
- No visual regression on content area

## Risk Assessment

- **Medium:** Nested layouts with AppHeader may conflict. Need to verify React Router v7 behavior — does child layout's AppHeader replace parent's?
- **Medium:** Passing callbacks (like `onCreateClick`) from page to header rendered in layout is non-trivial. May need URL state or context.
- If `+types` auto-generation doesn't work for new layout files, may need to define types manually
- Route file naming must match React Router v7 conventions exactly

## Security Considerations

- N/A — layout/structural change only

## Next Steps

- Phase 5: Split oversized style-settings
