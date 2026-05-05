# Phase 3: Frontend MVP - Page & Summary

## Context Links

- [Parent Plan](./plan.md)
- [Phase 1: Backend APIs](./phase-01-backend-scope-resolution-core-apis.md)
- Sidebar nav constants: `packages/constants/src/workspace.ts` (lines 201-290)
- Sidebar rendering: `apps/web/core/components/workspace/sidebar/sidebar-menu-items.tsx`
- Route config: `apps/web/app/routes/core.ts`
- Extended routes: `apps/web/app/routes/extended.ts`
- Analytics page pattern: `apps/web/app/(all)/[workspaceSlug]/(projects)/analytics/[tabId]/`
- CE service pattern: `apps/web/ce/services/department.service.ts`
- CE store pattern: `apps/web/ce/store/root.store.ts`
- APIService base: `apps/web/core/services/api.service.ts`

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 5h
- **Description:** Create the Head Office page, add sidebar navigation item, build service + MobX store, implement summary cards and workspace health table components.

## Key Insights

- Navigation: Head Office is a STATIC sidebar item, ngang hàng Projects, Org Chart. Manager + Admin only.
<!-- Updated: Validation Session 1 - static sidebar, manager/admin only -->
- Sidebar items defined in `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS` in workspace.ts constants.
- Route pattern: use `extended.ts` to add head-office route under `(projects)` layout (same as worklogs/workflows pattern).
- CE pattern: services in `apps/web/ce/services/`, stores in `apps/web/ce/store/`.
- Page pattern: layout.tsx (AppHeader + ContentWrapper + Outlet) + page.tsx (content) + header.tsx (breadcrumbs).
- Components must be <150 lines. Files <200 lines.
- MobX: `makeObservable` (explicit), `set()` for new keys, `runInAction` in async, `observer()` on all reading components.
- UI: prefer `@plane/propel/*` over `@plane/ui`.

## Requirements

### Functional

1. Page at `/:workspaceSlug/head-office/` with breadcrumb header
2. Sidebar item "Head Office" in workspace dropdown (dynamic items)
3. Summary cards: 6 KPI cards (Total Staff, Total Projects, Open Issues, Overdue Issues, Completion Rate, Active Cycles)
4. Workspace health table: columns = Workspace (hyperlink, opens new tab), Projects, Issues, Completion%, Status (traffic light)
5. Loading states and empty states

### Non-Functional

1. All components use `observer()` wrapper
2. Service follows existing `APIService` pattern
3. Store uses `makeObservable` with explicit observables/actions
4. Workspace links open in new tab (`target="_blank"`)

## Architecture

```
Route: /:workspaceSlug/head-office/
  Layout -> AppHeader + ContentWrapper
    Page -> HeadOfficePage
      -> HeadOfficeSummaryCards (6 cards)
      -> HeadOfficeWorkspaceTable (health table)

Service: HeadOfficeService extends APIService
  - fetchSummary(workspaceSlug)
  - fetchWorkspaces(workspaceSlug)
  - fetchActivity(workspaceSlug, limit?)
  - fetchStaffAnalytics(workspaceSlug)
  - fetchCycles(workspaceSlug)

Store: HeadOfficeStore
  - summary: observable
  - workspaces: observable
  - loading: observable
  - fetchSummary(): action
  - fetchWorkspaces(): action
```

## Related Code Files

### Files to Create

- `apps/web/app/(all)/[workspaceSlug]/(projects)/head-office/layout.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/head-office/page.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/head-office/header.tsx`
- `apps/web/ce/services/head-office.service.ts`
<!-- Updated: Validation Session 2 - store split by domain, overview store for Phase 3-5 concerns -->
- `apps/web/ce/store/head-office-overview.store.ts`
- `apps/web/core/components/head-office/head-office-summary-cards.tsx`
- `apps/web/core/components/head-office/head-office-workspace-table.tsx`
- `apps/web/core/components/head-office/head-office-health-badge.tsx`

### Files to Modify

<!-- Updated: Validation Session 2 - API-based sidebar visibility, store split to head-office-overview.store.ts -->

- `packages/constants/src/workspace.ts` -- Add head-office to DYNAMIC nav items (visible to all members, access gated by API check)
- `apps/web/app/routes/extended.ts` -- Add head-office route
- `apps/web/ce/store/root.store.ts` -- Register HeadOfficeOverviewStore
- `apps/web/core/components/workspace/sidebar/sidebar-menu-items.tsx` -- Add async access check for head-office visibility

## Implementation Steps

### Step 1: Create HeadOfficeService (0.5h)

1. Create `apps/web/ce/services/head-office.service.ts`
2. Follow `DepartmentService` pattern:

   ```typescript
   export interface IHeadOfficeSummary {
     managed_workspaces: number;
     total_staff: number;
     total_projects: number;
     open_issues: number;
     overdue_issues: number;
     avg_completion_rate: number;
     active_cycles: number;
   }

   export interface IHeadOfficeWorkspace {
     workspace: { id: string; name: string; slug: string };
     department: { name: string; code: string; level: number } | null;
     projects_count: number;
     open_issues: number;
     closed_issues_30d: number;
     completion_rate: number;
     health_status: "good" | "fair" | "at_risk" | "critical";
     active_members: number;
     current_cycle: { id: string; name: string } | null;
   }

   export class HeadOfficeService extends APIService {
     constructor() {
       super(API_BASE_URL);
     }

     async fetchSummary(workspaceSlug: string): Promise<IHeadOfficeSummary>;
     async fetchWorkspaces(workspaceSlug: string): Promise<IHeadOfficeWorkspace[]>;
     async fetchActivity(workspaceSlug: string, limit?: number): Promise<IHeadOfficeActivity[]>;
     async fetchCycles(workspaceSlug: string): Promise<IHeadOfficeCycles>;
     async fetchStaffAnalytics(workspaceSlug: string): Promise<IHeadOfficeStaffAnalytics>;
   }
   ```

3. All methods: `this.get(url).then(r => r?.data).catch(e => { throw e?.response?.data; })`

### Step 2: Create HeadOfficeStore (1h)

1. Create `apps/web/ce/store/head-office.store.ts`
2. MobX store with explicit observables:

   ```typescript
   export interface IHeadOfficeStore {
     // observables
     summary: IHeadOfficeSummary | null;
     workspaces: IHeadOfficeWorkspace[];
     isSummaryLoading: boolean;
     isWorkspacesLoading: boolean;
     // actions
     fetchSummary(workspaceSlug: string): Promise<void>;
     fetchWorkspaces(workspaceSlug: string): Promise<void>;
   }

   export class HeadOfficeStore implements IHeadOfficeStore {
     summary: IHeadOfficeSummary | null = null;
     workspaces: IHeadOfficeWorkspace[] = [];
     isSummaryLoading = false;
     isWorkspacesLoading = false;

     private service: HeadOfficeService;

     constructor() {
       makeObservable(this, {
         summary: observable,
         workspaces: observable,
         isSummaryLoading: observable,
         isWorkspacesLoading: observable,
         fetchSummary: action,
         fetchWorkspaces: action,
       });
       this.service = new HeadOfficeService();
     }

     fetchSummary = async (workspaceSlug: string) => {
       this.isSummaryLoading = true;
       try {
         const data = await this.service.fetchSummary(workspaceSlug);
         runInAction(() => {
           this.summary = data;
         });
       } catch (error) {
         console.error("Failed to fetch head office summary", error);
       } finally {
         runInAction(() => {
           this.isSummaryLoading = false;
         });
       }
     };
     // similar for fetchWorkspaces
   }
   ```

3. Register in `apps/web/ce/store/root.store.ts`:
   - Import HeadOfficeStore
   - Add `headOffice: IHeadOfficeStore` property
   - Initialize in constructor: `this.headOffice = new HeadOfficeStore();`

### Step 3: Add Route & Navigation (0.5h)

1. Add to `packages/constants/src/workspace.ts` in `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS`:
   <!-- Updated: Validation Session 2 - API-based visibility check replaces ADMIN-only access -->
   ```typescript
   "head-office": {
     key: "head_office",
     labelTranslationKey: "head_office",
     href: `/head-office/`,
     access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
     highlight: (pathname: string, url: string) => pathname.includes(url),
   },
   ```
2. Add to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS` array (after org-chart if exists)
3. In sidebar component, call `GET /head-office/access-check/` on mount. Only render Head Office nav item if `has_access: true`. Cache result in store.
4. Add route in `apps/web/app/routes/extended.ts`:
   ```typescript
   // Inside the (all) -> [workspaceSlug] -> (projects) layout chain:
   layout("./(all)/[workspaceSlug]/(projects)/head-office/layout.tsx", [
     route(":workspaceSlug/head-office",
       "./(all)/[workspaceSlug]/(projects)/head-office/page.tsx"),
   ]),
   ```
   Note: extend the existing `extendedRoutes` by adding under the `(projects)` layout nesting.

### Step 4: Create Page Files (1h)

1. `head-office/header.tsx` (~30 lines):
   - Breadcrumb with "Head Office" label and icon (use `BarChart2` from lucide-react or similar)
   - Follow WorkspaceAnalyticsHeader pattern

2. `head-office/layout.tsx` (~20 lines):
   - AppHeader + ContentWrapper + Outlet
   - Follow analytics layout pattern exactly

3. `head-office/page.tsx` (~60 lines):
   - `observer()` wrapper
   - Get `workspaceSlug` from params
   - Get `headOffice` store from root store
   - `useEffect`: fetch summary + workspaces on mount
   - Loading state: skeleton or spinner
   - Empty state: if no data after loading
   - Render: `<HeadOfficeSummaryCards />` + `<HeadOfficeWorkspaceTable />`

### Step 5: Create Summary Cards Component (1h)

1. `apps/web/core/components/head-office/head-office-summary-cards.tsx` (~80 lines):
   - `observer()` wrapper
   - 6-card grid (responsive: 2 cols mobile, 3 cols tablet, 6 cols desktop)
   - Each card: icon + label + value
   - Cards:
     - Total Staff (Users icon)
     - Total Projects (Briefcase icon)
     - Open Issues (Circle icon)
     - Overdue Issues (AlertTriangle icon, red highlight)
     - Completion Rate (percentage, green/yellow/red based on value)
     - Active Cycles (RefreshCw icon)
   - Use Tailwind: `bg-surface-1 rounded-lg border border-subtle p-4`
   - Loading: skeleton placeholders

### Step 6: Create Workspace Health Table (1h)

1. `apps/web/core/components/head-office/head-office-workspace-table.tsx` (~120 lines):
   - `observer()` wrapper
   - Table with columns: Workspace, Department, Projects, Open Issues, Completion%, Status, Active Members
   - Workspace column: hyperlink `<a href="/{slug}" target="_blank" rel="noopener">`
   - Status column: use `<HeadOfficeHealthBadge status={health_status} />`
   - Completion%: colored based on value (green >80, yellow >60, orange >40, red <40)
   - Empty state: "No managed workspaces found"

2. `apps/web/core/components/head-office/head-office-health-badge.tsx` (~30 lines):
   - Props: `status: "good" | "fair" | "at_risk" | "critical"`
   - Render: colored badge with label
   - Colors: good=green, fair=yellow, at_risk=orange, critical=red
   - Use semantic color tokens

## Todo List

- [ ] Create `apps/web/ce/services/head-office.service.ts` with all endpoint methods
- [ ] Create `apps/web/ce/store/head-office.store.ts` with MobX observables
- [ ] Register HeadOfficeStore in `apps/web/ce/store/root.store.ts`
- [ ] Add head-office nav item to `packages/constants/src/workspace.ts`
- [ ] Add head-office route to `apps/web/app/routes/extended.ts`
- [ ] Create `head-office/layout.tsx` (AppHeader + ContentWrapper)
- [ ] Create `head-office/header.tsx` (breadcrumb)
- [ ] Create `head-office/page.tsx` (main page, data fetching)
- [ ] Create `head-office-summary-cards.tsx` component
- [ ] Create `head-office-workspace-table.tsx` component
- [ ] Create `head-office-health-badge.tsx` component
- [ ] Add i18n translation key `head_office` to translation files
- [ ] Verify sidebar item renders and navigates correctly
- [ ] Verify summary cards show data from API
- [ ] Verify workspace table hyperlinks open in new tab

## Success Criteria

- Head Office page accessible at `/:workspaceSlug/head-office/`
- Sidebar shows "Head Office" in workspace dropdown for ADMIN/MEMBER roles
- Summary cards display 6 KPIs with loading states
- Workspace health table shows per-workspace stats with traffic light status
- Workspace names are clickable links that open in new tab
- All components use `observer()` and MobX store
- No component exceeds 150 lines

## Risk Assessment

| Risk                           | Probability | Impact | Mitigation                                       |
| ------------------------------ | ----------- | ------ | ------------------------------------------------ |
| Extended routes merge conflict | Low         | Medium | Follow existing pattern in extended.ts exactly   |
| Store not accessible from page | Low         | High   | Verify root.store.ts registration, useStore hook |
| Missing i18n key               | Medium      | Low    | Add to en.json, fallback to key string           |
| Summary API returns null/empty | Medium      | Low    | Show 0 values with empty state message           |

## Security Considerations

- No sensitive data exposed in frontend (staff details gated by backend)
- Workspace links use current user's auth (no token in URL)
- No write operations on this page

## Next Steps

- Phase 4: Activity feed and active cycles components (consume Phase 2 APIs)
- Phase 5: Staff analytics charts and heatmap
