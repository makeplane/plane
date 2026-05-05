# Phase 9: Frontend Tab Navigation + Workspaces Drill-down

## Context Links

- [Parent Plan](./plan.md)
- [Phase 3: Frontend MVP](./phase-03-frontend-mvp-page-summary.md)
- [Phase 6: Backend Workspace Drill-down APIs](./phase-06-backend-workspace-drilldown-apis.md)
- Propel Tabs: `packages/propel/src/tabs/` (Root, List, Trigger, Content, Indicator)
- Propel Accordion: `packages/propel/src/accordion/` (Root, Item, Trigger, Content)
- Head office page: `apps/web/app/(all)/[workspaceSlug]/(projects)/head-office/page.tsx`
- Head office store: `apps/web/ce/store/head-office.store.ts`
- Head office service: `apps/web/ce/services/head-office.service.ts`
- Head office components: `apps/web/core/components/head-office/`

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 5h
- **Description:** Refactor head-office page to use Propel Tabs (Overview | Workspaces | Staff | Reports). Move existing Phase 3-5 components into Overview tab. Build Workspaces tab with expandable drill-down cards showing projects, members, and cycle progress per workspace.

## Key Insights

- Propel Tabs: compound component — `Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Content`, `Tabs.Indicator`
- Propel Accordion: `Accordion.Root`, `Accordion.Item`, `Accordion.Trigger`, `Accordion.Content`
- Tab state stored in MobX store as `currentTab` observable
- Workspace drill-down: lazy-load projects/members when accordion item expands
- "Compare" checkbox mode: select 2-3 workspaces, button navigates to comparison view (Phase 11)
- Components must be <150 lines, files <200 lines
- All components wrapped in `observer()`

## Requirements

### Functional

1. Tab navigation: Overview, Workspaces, Staff, Reports — persistent via MobX store
2. Overview tab: contains all existing Phase 3-5 components (no changes to them)
3. Workspaces tab: filter bar (date range, health status, sort) + workspace cards
4. Workspace cards: Propel Accordion, expand to show projects table + members table + cycle progress
5. Compare mode: checkboxes to select 2-3 workspaces for comparison
6. "Open WS" link on each card (target="\_blank")

### Non-Functional

1. Lazy-load drill-down data on accordion expand (don't fetch all at once)
2. Tab switching preserves state (no re-fetch unless stale)
3. Responsive: cards stack on mobile, grid on desktop

## Architecture

```
HeadOfficePage (refactored)
  -> HeadOfficeTabs
       -> Tabs.Root (value=currentTab)
            -> Tabs.List
                 -> Tabs.Trigger "Overview"
                 -> Tabs.Trigger "Workspaces"
                 -> Tabs.Trigger "Staff"
                 -> Tabs.Trigger "Reports"
                 -> Tabs.Indicator
            -> Tabs.Content "overview"
                 -> HeadOfficeSummaryCards (existing)
                 -> HeadOfficeWorkspaceTable (existing)
                 -> HeadOfficeActivityFeed (existing)
                 -> HeadOfficeCycleMetrics (existing)
            -> Tabs.Content "workspaces"
                 -> HeadOfficeFilterBar
                 -> HeadOfficeWorkspaceCards
            -> Tabs.Content "staff"
                 -> (Phase 10 placeholder)
            -> Tabs.Content "reports"
                 -> (Phase 12 placeholder)
```

## Related Code Files

### Files to Create

- `apps/web/core/components/head-office/head-office-tabs.tsx` — Tab navigation wrapper
- `apps/web/core/components/head-office/head-office-workspace-cards.tsx` — Workspace card list with accordion
- `apps/web/core/components/head-office/head-office-workspace-detail.tsx` — Expanded accordion content
- `apps/web/core/components/head-office/head-office-workspace-projects.tsx` — Projects table inside detail
- `apps/web/core/components/head-office/head-office-workspace-members.tsx` — Members table inside detail
- `apps/web/core/components/head-office/head-office-filter-bar.tsx` — Filter controls for workspaces tab

### Files to Modify

- `apps/web/app/(all)/[workspaceSlug]/(projects)/head-office/page.tsx` — Wrap content in HeadOfficeTabs
<!-- Updated: Validation Session 2 - store split by domain, workspace drill-down in dedicated store -->
- `apps/web/ce/store/head-office-workspaces.store.ts` — New file: currentTab, workspaceProjects, workspaceMembers, filters, compare state
- `apps/web/ce/services/head-office.service.ts` — Add fetchWorkspaceProjects, fetchWorkspaceMembers

## Implementation Steps

### Step 1: Extend service with drill-down methods (0.5h)

1. In `head-office.service.ts`, add:

   ```typescript
   export interface IHeadOfficeProject {
     id: string; name: string; identifier: string;
     emoji: string | null; icon_prop: Record<string, unknown> | null;
     total_issues: number; open_issues: number;
     closed_issues_30d: number; completion_rate: number;
   }

   export interface IHeadOfficeMember {
     id: string; display_name: string; email: string; avatar: string;
     role: number; staff_profile: {
       staff_id: string; position: string;
       department: string;
     } | null;
     assigned_open_issues: number;
   }

   // In class:
   async fetchWorkspaceProjects(slug: string, wsId: string): Promise<IHeadOfficeProject[]>
   async fetchWorkspaceMembers(slug: string, wsId: string): Promise<IHeadOfficeMember[]>
   ```

### Step 2: Extend store with tab + drill-down state (1h)

1. In `head-office.store.ts`, add observables:
   ```typescript
   currentTab: string = "overview";
   workspaceProjects: Record<string, IHeadOfficeProject[]> = {};
   workspaceMembers: Record<string, IHeadOfficeMember[]> = {};
   workspaceDetailLoading: Record<string, boolean> = {};
   selectedCompareIds: string[] = [];
   filters: {
     healthStatus: string | null;
     sortBy: string;
   } = { healthStatus: null, sortBy: "name" };
   ```
2. Add actions:
   ```typescript
   setCurrentTab: action;
   fetchWorkspaceProjects: action; // lazy-load per workspace
   fetchWorkspaceMembers: action; // lazy-load per workspace
   toggleCompareSelection: action; // add/remove ws from compare list (max 3)
   setFilter: action;
   ```
3. Use `set()` from MobX for new keys on `workspaceProjects`/`workspaceMembers` records
4. `runInAction` in async callbacks

### Step 3: Create HeadOfficeTabs component (0.5h)

1. `head-office-tabs.tsx` (~60 lines):

   ```typescript
   import { Tabs } from "@plane/propel/tabs";
   import { observer } from "mobx-react";

   export const HeadOfficeTabs = observer(() => {
     const { headOffice } = useStore();
     const tabs = [
       { value: "overview", label: "Overview" },
       { value: "workspaces", label: "Workspaces" },
       { value: "staff", label: "Staff" },
       { value: "reports", label: "Reports" },
     ];

     return (
       <Tabs.Root value={headOffice.currentTab} onValueChange={(v) => headOffice.setCurrentTab(v)}>
         <Tabs.List>
           {tabs.map((t) => (
             <Tabs.Trigger key={t.value} value={t.value}>
               {t.label}
             </Tabs.Trigger>
           ))}
           <Tabs.Indicator />
         </Tabs.List>
         <Tabs.Content value="overview">{/* existing components */}</Tabs.Content>
         <Tabs.Content value="workspaces">
           <HeadOfficeWorkspaceCards />
         </Tabs.Content>
         <Tabs.Content value="staff">
           <div>Coming soon</div>
         </Tabs.Content>
         <Tabs.Content value="reports">
           <div>Coming soon</div>
         </Tabs.Content>
       </Tabs.Root>
     );
   });
   ```

### Step 4: Create Filter Bar component (0.5h)

1. `head-office-filter-bar.tsx` (~70 lines):
   - Health status dropdown: All / Good / Fair / At Risk / Critical
   - Sort dropdown: Name / Completion Rate / Open Issues
   - Compare mode toggle button
   - Use Propel/Plane UI dropdowns (CustomSelect or similar)

### Step 5: Create Workspace Cards + Detail components (2h)

1. `head-office-workspace-cards.tsx` (~90 lines):
   - Filter bar at top
   - Accordion.Root with workspace items
   - Each item: Accordion.Item with workspace card as trigger
   - On expand: call `fetchWorkspaceProjects` + `fetchWorkspaceMembers` if not cached
   - Compare checkbox on each card (visible in compare mode)
   - "Compare Selected" button (enabled when 2-3 selected)

2. `head-office-workspace-detail.tsx` (~80 lines):
   - Accordion.Content wrapper
   - Two sections: Projects table + Members table
   - Loading spinner while fetching
   - Cycle progress bar (if active cycle exists)

3. `head-office-workspace-projects.tsx` (~80 lines):
   - Table: Name | Identifier | Total Issues | Open | Closed (30d) | Completion%
   - Completion% with color coding
   - Empty state if no projects

4. `head-office-workspace-members.tsx` (~80 lines):
   - Table: Name | Position | Department | Open Issues (workload)
   - Workload cell with mini progress bar or badge
   - Staff profile info if available (graceful null handling)

### Step 6: Update page.tsx (0.5h)

1. Refactor `page.tsx` to render `<HeadOfficeTabs />` instead of inline components
2. Keep data fetching in page (summary + workspaces on mount)
3. Pass nothing via props — all from MobX store

## Todo List

- [ ] Add drill-down methods to HeadOfficeService
- [ ] Add tab state + drill-down observables to HeadOfficeStore
- [ ] Create `head-office-tabs.tsx` with Propel Tabs
- [ ] Create `head-office-filter-bar.tsx` with dropdowns
- [ ] Create `head-office-workspace-cards.tsx` with Accordion
- [ ] Create `head-office-workspace-detail.tsx` (expanded content)
- [ ] Create `head-office-workspace-projects.tsx` (projects table)
- [ ] Create `head-office-workspace-members.tsx` (members table)
- [ ] Refactor `page.tsx` to use HeadOfficeTabs
- [ ] Test: tab switching works and preserves state
- [ ] Test: accordion expand triggers lazy data fetch
- [ ] Test: compare mode allows selecting 2-3 workspaces
- [ ] Test: filter bar filters workspace cards
- [ ] Verify all components <150 lines

## Success Criteria

- 4 tabs render with Propel Tabs, tab switching works
- Overview tab contains all existing Phase 3-5 components unchanged
- Workspaces tab shows filterable, expandable workspace cards
- Expanding a card lazy-loads projects + members from Phase 6 APIs
- Compare checkboxes work (max 3 selection)
- All components use `observer()`, <150 lines each

## Risk Assessment

| Risk                                | Probability | Impact | Mitigation                                                 |
| ----------------------------------- | ----------- | ------ | ---------------------------------------------------------- |
| Propel Tabs API mismatch            | Medium      | Medium | Verify import paths + compound component API before coding |
| MobX Record reactivity              | Medium      | Medium | Use `set()` for new keys in workspaceProjects/Members maps |
| Lazy-load race condition            | Low         | Low    | Track loading state per workspace ID                       |
| Existing Phase 3-5 components break | Low         | High   | Only wrap in tab content, don't modify internal code       |

## Security Considerations

- No additional security surface — drill-down APIs enforce scope on backend
- Workspace links use current auth session (no tokens in URL)
- Compare selection stored client-side only

## Next Steps

- Phase 10: Staff tab content (search + profile panel)
- Phase 11: Comparison view (consumes compare API, renders in workspaces tab)
- Phase 12: Reports tab content
