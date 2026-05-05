# Phase 4: Frontend MVP - Activity & Cycles

## Context Links

- [Parent Plan](./plan.md)
- [Phase 2: Backend Activity & Analytics APIs](./phase-02-backend-activity-analytics-apis.md)
- [Phase 3: Frontend MVP - Page & Summary](./phase-03-frontend-mvp-page-summary.md)
- HeadOfficeService: `apps/web/ce/services/head-office.service.ts`
- HeadOfficeStore: `apps/web/ce/store/head-office.store.ts`
- Head Office page: `apps/web/app/(all)/[workspaceSlug]/(projects)/head-office/page.tsx`

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 3h
- **Description:** Add activity feed and active cycles progress components to the Head Office page. Extend the MobX store with activity and cycles data.

## Key Insights

- Activity feed: list of cross-workspace events, each with workspace badge, event summary, actor, timestamp. Similar to issue activity feed but cross-workspace.
- Cycles: progress bars showing active cycle completion across managed workspaces. Progress percentage from `progress_snapshot` (backend computed).
- Both components render below the workspace health table on the same page.
- Page layout: Summary Cards -> Workspace Table -> (Activity Feed | Active Cycles) side-by-side on desktop, stacked on mobile.

## Requirements

### Functional

1. Activity feed: show latest 20 cross-workspace events with workspace context
2. Activity items: workspace name badge, event summary, actor display_name, relative timestamp
3. Active cycles: progress bars per cycle showing name, workspace, progress%
4. Auto-refresh: not needed for MVP (manual page reload)

### Non-Functional

1. Activity feed scrollable with max-height
2. Components <150 lines each
3. All use `observer()` wrapper
4. Responsive: side-by-side on lg+, stacked on mobile

## Architecture

```
HeadOfficePage
  -> HeadOfficeSummaryCards (Phase 3)
  -> HeadOfficeWorkspaceTable (Phase 3)
  -> div.grid.lg:grid-cols-2
       -> HeadOfficeActivityFeed
       -> HeadOfficeActiveCycles
```

## Related Code Files

### Files to Create

- `apps/web/core/components/head-office/head-office-activity-feed.tsx`
- `apps/web/core/components/head-office/head-office-active-cycles.tsx`
- `apps/web/core/components/head-office/head-office-activity-item.tsx`
- `apps/web/core/components/head-office/head-office-cycle-progress.tsx`

### Files to Modify

- `apps/web/ce/store/head-office.store.ts` -- Add activity + cycles observables and actions
- `apps/web/app/(all)/[workspaceSlug]/(projects)/head-office/page.tsx` -- Add activity + cycles sections

## Implementation Steps

### Step 1: Extend HeadOfficeStore (0.5h)

1. Add types to service file:

   ```typescript
   export interface IHeadOfficeActivity {
     id: string;
     workspace: { id: string; name: string; slug: string };
     issue: { id: string; name: string | null } | null;
     event: string;
     field: string | null;
     old_value: string | null;
     new_value: string | null;
     summary: string;
     actor: { id: string; display_name: string | null };
     timestamp: string;
   }

   export interface IHeadOfficeCycleItem {
     id: string;
     workspace: { id: string; name: string; slug: string };
     name: string;
     start_date: string;
     end_date: string;
     progress: number;
     total_issues: number;
     completed_issues: number;
   }

   export interface IHeadOfficeCycles {
     active_cycles: IHeadOfficeCycleItem[];
     completed_cycles_30d: number;
     total_active: number;
   }
   ```

2. Extend `HeadOfficeStore`:

   ```typescript
   // New observables
   activities: IHeadOfficeActivity[] = [];
   cycles: IHeadOfficeCycles | null = null;
   isActivityLoading = false;
   isCyclesLoading = false;

   // In makeObservable:
   activities: observable,
   cycles: observable,
   isActivityLoading: observable,
   isCyclesLoading: observable,
   fetchActivity: action,
   fetchCycles: action,
   ```

3. Add fetch methods:
   ```typescript
   fetchActivity = async (workspaceSlug: string, limit = 20) => {
     this.isActivityLoading = true;
     try {
       const data = await this.service.fetchActivity(workspaceSlug, limit);
       runInAction(() => {
         this.activities = data;
       });
     } catch (error) {
       console.error("Failed to fetch head office activity", error);
     } finally {
       runInAction(() => {
         this.isActivityLoading = false;
       });
     }
   };
   // similar for fetchCycles
   ```

### Step 2: Create Activity Feed Components (1h)

1. `head-office-activity-item.tsx` (~50 lines):
   - Props: `activity: IHeadOfficeActivity`
   - Render:
     - Left: actor avatar placeholder (first letter circle)
     - Middle: `<span class="font-medium">{actor.display_name}</span> {summary}` on issue `{issue.name}` in `<WorkspaceBadge />`
     - Right: relative timestamp (use `formatDistanceToNow` from date-fns or existing util)
   - Workspace badge: small colored pill with workspace name

2. `head-office-activity-feed.tsx` (~80 lines):
   - `observer()` wrapper
   - Section header: "Recent Activity" with activity icon
   - Scrollable list: `max-h-96 overflow-y-auto`
   - Map `store.activities` -> `<HeadOfficeActivityItem />`
   - Loading: skeleton list (3-4 items)
   - Empty: "No recent activity across managed workspaces"
   - Container: `bg-surface-1 rounded-lg border border-subtle p-4`

### Step 3: Create Active Cycles Components (1h)

1. `head-office-cycle-progress.tsx` (~40 lines):
   - Props: `cycle: IHeadOfficeCycleItem`
   - Render:
     - Top row: cycle name + workspace badge (small text)
     - Progress bar: `<div class="h-2 rounded-full bg-layer-3"><div style={{width: progress%}} class="h-full rounded-full bg-primary" /></div>`
     - Bottom row: `{completed_issues}/{total_issues} issues` + `{progress}%`
     - Days remaining: computed from `end_date - now`

2. `head-office-active-cycles.tsx` (~80 lines):
   - `observer()` wrapper
   - Section header: "Active Cycles" with cycle icon + total count badge
   - Stats row: `{total_active} active` | `{completed_cycles_30d} completed (30d)`
   - List of `<HeadOfficeCycleProgress />` items
   - Loading: skeleton (2-3 items)
   - Empty: "No active cycles across managed workspaces"
   - Container: same card style as activity feed

### Step 4: Update Page Layout (0.5h)

1. Update `head-office/page.tsx`:
   - Add `useEffect` to also call `fetchActivity` and `fetchCycles`
   - Add grid section below workspace table:
     ```tsx
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
       <HeadOfficeActivityFeed />
       <HeadOfficeActiveCycles />
     </div>
     ```
   - Keep total page component under 80 lines (extract if needed)

## Todo List

- [ ] Add activity + cycles types to `head-office.service.ts`
- [ ] Extend `head-office.store.ts` with activity + cycles observables and fetch actions
- [ ] Create `head-office-activity-item.tsx` component
- [ ] Create `head-office-activity-feed.tsx` component
- [ ] Create `head-office-cycle-progress.tsx` component
- [ ] Create `head-office-active-cycles.tsx` component
- [ ] Update `head-office/page.tsx` to render activity + cycles sections
- [ ] Verify activity feed shows cross-workspace events with workspace badges
- [ ] Verify cycle progress bars render correctly
- [ ] Verify responsive layout (side-by-side on desktop, stacked on mobile)

## Success Criteria

- Activity feed displays latest 20 events with workspace context
- Each activity item shows actor, summary, workspace badge, relative timestamp
- Active cycles show progress bars with percentage and issue counts
- Layout is responsive (2-col on desktop, 1-col on mobile)
- Loading and empty states render correctly
- No component exceeds 150 lines

## Risk Assessment

| Risk                                         | Probability | Impact | Mitigation                              |
| -------------------------------------------- | ----------- | ------ | --------------------------------------- |
| Activity API returns many items, slow render | Low         | Low    | Limit to 20, virtualize if needed later |
| Cycle progress_snapshot empty                | Medium      | Low    | Default to 0%, show "No data"           |
| Timestamp formatting inconsistent            | Low         | Low    | Use existing workspace timezone util    |

## Security Considerations

- Activity feed shows only display_name (no email)
- Workspace links in badges are view-only, same auth context
- No PII exposed beyond what backend scope resolution allows

## Next Steps

- Phase 5: Staff analytics components with charts (P2, deferrable)
