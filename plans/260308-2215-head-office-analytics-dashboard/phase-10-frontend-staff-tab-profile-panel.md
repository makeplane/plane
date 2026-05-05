# Phase 10: Frontend Staff Tab + Profile Panel

## Context Links

- [Parent Plan](./plan.md)
- [Phase 7: Backend Staff APIs](./phase-07-backend-staff-search-profile-apis.md)
- [Phase 9: Tab Navigation](./phase-09-frontend-tab-navigation-workspace-drilldown.md)
- Head office store: `apps/web/ce/store/head-office.store.ts`
- Head office service: `apps/web/ce/services/head-office.service.ts`
- Head office components: `apps/web/core/components/head-office/`
- Propel Accordion: `packages/propel/src/accordion/`

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 5h
- **Description:** Build the Staff tab content: global search with filters, paginated staff table, and expandable profile panel using Propel Accordion. Profile shows HR info, workload visualization (progress bars by status), projects list, and activity timeline.

## Key Insights

- Staff tab is the 3rd tab in HeadOfficeTabs (Phase 9 creates placeholder)
- Search: debounced input (300ms), searches name/email/staff_id
- Filters: department, workspace, position, employment status — all as dropdowns
- Pagination: page + page_size controls, total count from API response
- Profile panel: Propel Accordion inline expand (not modal/drawer)
- Workload bars: CSS progress bars colored by state group (backlog=gray, unstarted=blue, started=orange, completed=green)
- Activity timeline: vertical list with timestamps, lazy-loaded on profile expand

## Requirements

### Functional

1. Search bar: debounced, searches name/email/staff_id
2. Filter controls: department, workspace, position, employment status dropdowns
3. Paginated table: sortable columns, configurable page_size
4. Expandable profile: HR info, workload breakdown, projects, activity timeline
5. Workload visualization: progress bars by state group + priority breakdown

### Non-Functional

1. Debounce search input (300ms) to avoid excessive API calls
2. Pagination state in MobX store (page, page_size, total_count)
3. All components <150 lines, `observer()` wrapped
4. Lazy-load profile data + activity on accordion expand

## Architecture

```
Tabs.Content "staff"
  -> HeadOfficeStaffTab
       -> HeadOfficeStaffSearch (search input + filter dropdowns)
       -> HeadOfficeStaffTable (paginated table)
            -> Accordion.Root
                 -> Accordion.Item (per staff row)
                      -> Accordion.Trigger (table row)
                      -> Accordion.Content
                           -> HeadOfficeStaffProfile
                                -> HeadOfficeStaffWorkload (progress bars)
                                -> HeadOfficeStaffActivity (timeline)
```

## Related Code Files

### Files to Create

- `apps/web/core/components/head-office/head-office-staff-tab.tsx` — Tab container
- `apps/web/core/components/head-office/head-office-staff-search.tsx` — Search + filter controls
- `apps/web/core/components/head-office/head-office-staff-table.tsx` — Paginated table with accordion
- `apps/web/core/components/head-office/head-office-staff-profile.tsx` — Expanded profile panel
- `apps/web/core/components/head-office/head-office-staff-workload.tsx` — Workload progress bars
- `apps/web/core/components/head-office/head-office-staff-activity.tsx` — Activity timeline

### Files to Modify

<!-- Updated: Validation Session 2 - store split by domain, staff state in dedicated store -->

- `apps/web/ce/store/head-office-staff.store.ts` — New file: staff list, filters, pagination, profiles, activities
- `apps/web/ce/services/head-office.service.ts` — Add staff methods
- `apps/web/core/components/head-office/head-office-tabs.tsx` — Replace Staff placeholder

## Implementation Steps

### Step 1: Extend service with staff methods (0.5h)

1. Add interfaces:

   ```typescript
   export interface IHeadOfficeStaff {
     id: string;
     staff_id: string;
     display_name: string;
     email: string;
     avatar: string;
     position: string;
     department: { id: string; name: string } | null;
     workspace: { id: string; name: string; slug: string } | null;
     employment_status: string;
     assigned_open_issues: number;
   }

   export interface IHeadOfficeStaffProfile {
     // HR info
     staff_id: string;
     display_name: string;
     email: string;
     avatar: string;
     position: string;
     department: { id: string; name: string } | null;
     employment_status: string;
     date_of_joining: string | null;
     date_of_leaving: string | null;
     is_department_manager: boolean;
     // Workload
     workload_by_state: Record<string, number>;
     workload_by_priority: Record<string, number>;
     // Projects
     projects: { id: string; name: string; identifier: string; workspace_slug: string }[];
   }

   export interface IHeadOfficeStaffActivity {
     id: string;
     field: string;
     verb: string;
     old_value: string;
     new_value: string;
     issue: { id: string; name: string } | null;
     workspace_slug: string;
     created_at: string;
   }

   export interface IStaffListResponse {
     results: IHeadOfficeStaff[];
     total_count: number;
     page: number;
     page_size: number;
     total_pages: number;
   }
   ```

2. Add methods:
   ```typescript
   async fetchStaffList(slug: string, params: Record<string, string>): Promise<IStaffListResponse>
   async fetchStaffProfile(slug: string, staffId: string): Promise<IHeadOfficeStaffProfile>
   async fetchStaffActivity(slug: string, staffId: string, limit?: number): Promise<IHeadOfficeStaffActivity[]>
   ```

### Step 2: Extend store with staff state (1h)

1. Add observables:
   ```typescript
   staffList: IHeadOfficeStaff[] = [];
   staffTotalCount: number = 0;
   staffPage: number = 1;
   staffPageSize: number = 20;
   staffSearch: string = "";
   staffFilters: {
     department: string | null;
     workspace: string | null;
     position: string | null;
     status: string | null;
   } = { department: null, workspace: null, position: null, status: null };
   staffSort: string = "-assigned_open_issues";
   isStaffListLoading: boolean = false;
   staffProfiles: Record<string, IHeadOfficeStaffProfile> = {};
   staffActivities: Record<string, IHeadOfficeStaffActivity[]> = {};
   staffDetailLoading: Record<string, boolean> = {};
   ```
2. Add actions:
   ```typescript
   fetchStaffList: action;
   fetchStaffProfile: action; // lazy-load on expand
   fetchStaffActivity: action; // lazy-load on expand
   setStaffSearch: action;
   setStaffFilter: action;
   setStaffSort: action;
   setStaffPage: action;
   ```
3. Use `set()` for new keys in `staffProfiles`/`staffActivities` records
4. `fetchStaffList` builds query params from search + filters + sort + page

### Step 3: Create Staff Tab container (0.5h)

1. `head-office-staff-tab.tsx` (~40 lines):

   ```typescript
   export const HeadOfficeStaffTab = observer(() => {
     const { headOffice } = useStore();
     const { workspaceSlug } = useParams();

     useEffect(() => {
       if (workspaceSlug) headOffice.fetchStaffList(workspaceSlug);
     }, [workspaceSlug, headOffice.staffSearch, headOffice.staffFilters, headOffice.staffSort, headOffice.staffPage]);

     return (
       <div className="flex flex-col gap-4">
         <HeadOfficeStaffSearch />
         <HeadOfficeStaffTable />
       </div>
     );
   });
   ```

### Step 4: Create Search + Filter component (0.5h)

1. `head-office-staff-search.tsx` (~80 lines):
   - Search input with magnifying glass icon
   - Debounced onChange (300ms) -> `headOffice.setStaffSearch(value)`
   - Filter row: 4 dropdowns (department, workspace, position, status)
   - Each dropdown: `CustomSelect` or Propel Select, calls `headOffice.setStaffFilter(key, value)`
   - Reset filters button

### Step 5: Create Paginated Table with Accordion (1h)

1. `head-office-staff-table.tsx` (~120 lines):
   - Loading state
   - Accordion.Root wrapping table rows
   - Table header: Name | Position | Department | Workspace | Status | Workload | Sort indicators
   - Each row is Accordion.Item:
     - Accordion.Trigger: table row with staff summary data
     - Accordion.Content: `<HeadOfficeStaffProfile staffId={staff.id} />`
   - On Accordion expand: call `fetchStaffProfile` + `fetchStaffActivity` if not cached
   - Pagination controls at bottom: prev/next, page indicator, page_size selector
   - Empty state: "No staff found matching filters"

### Step 6: Create Profile + Workload + Activity components (1.5h)

1. `head-office-staff-profile.tsx` (~100 lines):
   - Loading state while fetching profile
   - HR info section: staff_id, email, position, department, status, joining date, manager badge
   - Workload section: `<HeadOfficeStaffWorkload />`
   - Projects section: list with links
   - Activity section: `<HeadOfficeStaffActivity />`

2. `head-office-staff-workload.tsx` (~80 lines):
   - Workload by state group: horizontal progress bars
     - backlog (gray), unstarted (blue), started (orange), completed (green), cancelled (red)
   - Workload by priority: bar segments
     - urgent (red), high (orange), medium (yellow), low (blue), none (gray)
   - Total count label

3. `head-office-staff-activity.tsx` (~70 lines):
   - Vertical timeline with dots and lines
   - Each item: timestamp + "Changed {field} from {old} to {new}" on Issue {name}
   - Workspace badge
   - "Load more" button (increment limit)
   - Empty state: "No recent activity"

## Todo List

- [ ] Add staff interfaces to HeadOfficeService
- [ ] Add staff methods to HeadOfficeService
- [ ] Add staff observables + actions to HeadOfficeStore
- [ ] Create `head-office-staff-tab.tsx` container
- [ ] Create `head-office-staff-search.tsx` with debounced search + filters
- [ ] Create `head-office-staff-table.tsx` with paginated accordion table
- [ ] Create `head-office-staff-profile.tsx` expanded profile panel
- [ ] Create `head-office-staff-workload.tsx` progress bars
- [ ] Create `head-office-staff-activity.tsx` timeline
- [ ] Update `head-office-tabs.tsx` to render StaffTab instead of placeholder
- [ ] Test: search triggers debounced API call
- [ ] Test: filters apply and reset correctly
- [ ] Test: pagination controls work (prev/next/page_size)
- [ ] Test: accordion expand fetches profile + activity
- [ ] Test: workload bars render correctly for each state group
- [ ] Verify all components <150 lines

## Success Criteria

- Staff tab displays searchable, filterable, paginated staff list
- Search debounces at 300ms, works on name/email/staff_id
- All 4 filters work independently and in combination
- Expanding a row shows full profile with workload bars + activity timeline
- Pagination controls work correctly with total_count
- All components use `observer()`, <150 lines each

## Risk Assessment

| Risk                                 | Probability | Impact | Mitigation                                           |
| ------------------------------------ | ----------- | ------ | ---------------------------------------------------- |
| Debounce timing causes stale results | Low         | Low    | Cancel pending fetch on new search input             |
| Large staff list performance         | Medium      | Medium | Pagination (default 20), avoid rendering hidden rows |
| Accordion + table layout conflict    | Medium      | Medium | Use CSS grid or flex layout instead of HTML table    |
| MobX Record reactivity for profiles  | Medium      | Medium | Use `set()` for new keys in staffProfiles map        |

## Security Considerations

- Staff personal data (email, joining date) visible only to authorized managers
- All data fetched from scope-validated backend APIs
- No sensitive data cached in localStorage (MobX in-memory only)
- Activity data filtered by managed workspaces on backend

## Next Steps

- Phase 11: Comparison view (can be done in parallel)
- Phase 12: Reports tab with PDF export
