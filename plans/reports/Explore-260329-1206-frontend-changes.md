# Plane.so Frontend Changes Exploration Report

**Date**: March 29, 2026  
**Scope**: Recent CE (Community Edition) frontend features  
**Thoroughness**: Very thorough

---

## Executive Summary

The Plane.so codebase has received significant recent frontend enhancements across four major areas:

1. **Time-Tracking Features** — Timesheet, analytics, capacity dashboards with cross-workspace support
2. **Task Categories** — Instance-level main/sub category management with spreadsheet column integration
3. **Workspaces Default View** — Bank-wide project views with custom spreadsheet columns
4. **HO (Head Office) Features** — Multi-dimensional issue datasheet with department/category reporting

Key patterns: MobX stores for state, recharts for pie charts (donut), TanStack React Table for read-only datasheets, cross-workspace filtering, and activity tracking integration.

---

## 1. Time-Tracking Features

### 1.1 Timesheet Components

**Location**: `apps/web/ce/components/time-tracking/timesheet/`

| File                            | Purpose                                        | Key Features                                   |
| ------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `timesheet-table.tsx`           | Read-only timesheet using TanStack React Table | 7-day week view, daily totals, grand total row |
| `timesheet-grid.tsx`            | Grid-based timesheet view                      | —                                              |
| `timesheet-cell.tsx`            | Editable time cell                             | —                                              |
| `timesheet-week-navigator.tsx`  | Week selection UI                              | —                                              |
| `timesheet-add-issue-modal.tsx` | Add issue to timesheet modal                   | —                                              |

**Timesheet Row Type** (`packages/types/src/worklog.ts`):

```typescript
interface ITimesheetRow {
  issue_id: string;
  issue_name: string;
  issue_identifier: string;
  project_id: string;
  days: Record<string, number>; // "YYYY-MM-DD" → minutes
  total_minutes: number;
  workspace_slug?: string; // Cross-workspace extension
  workspace_name?: string;
}
```

### 1.2 Analytics Timesheet Components

**Location**: `apps/web/ce/components/time-tracking/analytics/`

| File                            | Purpose                           | Details                                        |
| ------------------------------- | --------------------------------- | ---------------------------------------------- |
| `analytics-timesheet-table.tsx` | Combined logtime across all users | Shows per-user breakdown popover on cell click |
| `analytics-timesheet-grid.tsx`  | Grid version of analytics         | —                                              |
| `logtime-breakdown-popover.tsx` | User-by-user breakdown modal      | Displays `IAnalyticsTimesheetUserBreakdown[]`  |
| `index.ts`                      | Barrel export                     | —                                              |

**Analytics Row Type**:

```typescript
interface IAnalyticsTimesheetRow extends ITimesheetRow {
  by_user: IAnalyticsTimesheetUserBreakdown[];
}

interface IAnalyticsTimesheetUserBreakdown {
  user_id: string;
  display_name: string;
  avatar_url: string;
  days: Record<string, number>;
  total_minutes: number;
}

interface IAnalyticsTimesheetResponse {
  week_start: string;
  week_end: string;
  rows: IAnalyticsTimesheetRow[];
  daily_totals: Record<string, number>;
  grand_total_minutes: number;
}
```

### 1.3 Capacity Dashboard Components

**Location**: `apps/web/ce/components/time-tracking/capacity/`

| Component                          | Purpose                                      | Features                                                                      |
| ---------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| `capacity-dashboard.tsx`           | Main capacity overview                       | Member filter, date range, cross-workspace toggle, export to CSV              |
| `capacity-heatmap.tsx`             | Heat-mapped member capacity grid             | Color-coded status (normal/under/overloaded), clickable cells for day details |
| `capacity-summary-cards.tsx`       | Total logged hours + category pie charts     | Displays main/sub category distribution as donut charts                       |
| `capacity-day-details-popover.tsx` | Per-day breakdown when clicking heatmap cell | Shows tasks logged by user on that day                                        |
| `category-count-table.tsx` (NEW)   | Donut pie chart visualization                | Replaced previous table view (commit `26b4189fe1`)                            |

**Capacity Types**:

```typescript
interface ICapacityMember {
  member_id: string;
  display_name: string;
  avatar_url: string;
  total_logged_minutes: number;
  days?: Record<string, number>;
}

interface ICapacityCategoriesResponse {
  main_task_categories: ICategoryCount[];
  sub_task_categories: ICategoryCount[];
}

interface ICapacityReportResponse {
  date_from: string;
  date_to: string;
  members: ICapacityMember[];
  project_total_logged: number;
  project_daily_totals?: Record<string, { minutes: number; issue_count: number }>;
}
```

**Donut Charts**: Uses Recharts `PieChart` with `innerRadius="45%"` for donut effect, 8-color palette, legend with circle icons.

### 1.4 Store: CEWorklogStore

**Location**: `apps/web/ce/store/worklog.store.ts`

Extends `WorklogStore` from core with CE-specific actions:

```typescript
interface ICEWorklogStore extends IWorklogStore {
  analyticsTimesheetData: IAnalyticsTimesheetResponse | null;
  isAnalyticsTimesheetLoading: boolean;
  categoriesData: ICapacityCategoriesResponse | null;

  fetchAnalyticsTimesheet(workspaceSlug, projectId, weekStart?): Promise<void>;
  fetchCapacityCategories(workspaceSlug, projectId, params?): Promise<void>;
  fetchCapacityDayDetails(workspaceSlug, projectId, memberId, date): Promise<ICapacityDayDetailsResponse>;
  fetchCrossWorkspaceTimesheet(workspaceSlug, weekStart?): Promise<void>;
  fetchCrossWorkspaceCapacity(workspaceSlug, params?): Promise<void>;
  fetchCrossWorkspaceCapacityDayDetails(workspaceSlug, memberId, date): Promise<ICapacityDayDetailsResponse>;
}
```

### 1.5 Services & Hooks

**Services**: No dedicated CE service files found (uses base `WorklogService` from core).

**Hooks**:

- `useProjectWorklogs()` — from `apps/web/core/hooks/store/use-project-worklog.ts`
- `useWorklog()` — expected in core

### 1.6 Key Features

- **Cross-workspace support** — Toggle button switches between project-scoped and workspace-wide views
- **Date range filtering** — DateRangeDropdown integration
- **Member filtering** — MemberDropdown for project view only
- **CSV export** — Generates capacity report with daily breakdown
- **Color-coded capacity** — Green (normal 7-8h), yellow (under 7h), red (over 8h)

---

## 2. Task Categories

### 2.1 Store: TaskCategoryStore

**Location**: `apps/web/ce/store/task-category.store.ts`

Instance-level category management:

```typescript
interface ITaskCategoryStore {
  loader: TLoader;
  hasFetched: boolean;
  mainCategories: Record<string, IMainTaskCategory>;
  subCategories: Record<string, ISubTaskCategory>;

  mainCategoryIds: string[]; // computed, sorted by sort_order
  getSubCategoriesByMain(mainId: string): ISubTaskCategory[];
  fetchCategories(workspaceSlug: string): Promise<void>;
}
```

**Key Design**:

- Single fetch guard via `hasFetched` flag
- Active categories only (filtered by `is_active`)
- Sort order respected for main categories
- Deduplicates with `Object.fromEntries()`

### 2.2 Components

| File                            | Purpose                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| `task-category-property.tsx`    | Issue detail sidebar property with 2-tier dropdown (main → sub) |
| `main-task-category-column.tsx` | Spreadsheet read-only display (displays category name or "—")   |
| `sub-task-category-column.tsx`  | Spreadsheet read-only display (displays category name or "—")   |

**Property Component** (`task-category-property.tsx`):

- Two-tier CustomMenu dropdowns (main first, then sub)
- Sub categories only shown when main is selected
- `closeOnSelect` enabled on both menus
- Updates issue via `issueOperations.update()` with cascade (setting main resets sub)
- Uses i18n keys: `task_category.main_label`, `task_category.sub_label`, `task_category.select_main`, `task_category.select_sub`

### 2.3 Hook

**Location**: `apps/web/core/hooks/store/use-task-category.ts`

```typescript
export const useTaskCategory = (): ITaskCategoryStore => {
  const context = useContext(StoreContext);
  return (context as unknown as { taskCategoryStore: ITaskCategoryStore }).taskCategoryStore;
};
```

### 2.4 Activity Tracking

**Hook**: `use-issue-form-validation.ts` includes task category validation rules:

```typescript
getTaskCategoryFieldRules(originalRules: FieldRules, categoriesExist: boolean): FieldRules
```

---

## 3. Workspace Default Views

### 3.1 Custom Spreadsheet Columns

**Location**: `apps/web/ce/components/issues/spreadsheet/columns/`

**New Column Components** (commit `e4a9a84f6c`):

| Column                          | Type    | Use Case                                     |
| ------------------------------- | ------- | -------------------------------------------- |
| `bank-wide-project-column.tsx`  | Display | Shows Y/N for `is_bank_wide` flag on project |
| `project-name-column.tsx`       | Display | Project name for workspace views             |
| `department-name-column.tsx`    | Display | Department name (from HO integration)        |
| `progress-tracking-column.tsx`  | Display | Visual progress bar (0-100%)                 |
| `completed-date-column.tsx`     | Display | Completion date formatted                    |
| `reference-link-column.tsx`     | Display | Reference link count                         |
| `total-log-time-column.tsx`     | Display | Worklog breakdown popover on click           |
| `project-lead-column.tsx` (NEW) | Display | Project lead user name                       |

**Bank-Wide Column Example**:

```typescript
<span
  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
    isBankWide ? "bg-status-green/10 text-status-green" : "bg-layer-2 text-secondary"
  }`}
>
  {isBankWide ? "Y" : "N"}
</span>
```

**Project Lead Column**:

- Resolves `project.project_lead` (can be IUserLite object or string ID)
- Falls back to email if display_name unavailable
- Returns "—" if no lead assigned

### 3.2 View System Integration

**Types** (`packages/types/src/view-props.ts`, `workspace-views.ts`):

- `IssueView` model includes `is_default: boolean` flag
- Workspace views seeded per workspace (migration `0146_seed_default_workspace_views.py`)

**Helper**: `apps/web/ce/helpers/default-view-filters.ts` — filter configuration for default views

**Routes**: `app/(all)/[workspaceSlug]/(projects)/workspace-views/` — dedicated page for workspace views

### 3.3 API Changes

**Backend** (Python/Django):

- Models: Added `is_default` to `IssueView`
- Migrations: `0145_issueview_is_default.py`, `0146_seed_default_workspace_views.py`
- Serializers updated with new fields
- Signals for auto-creating default views on workspace creation

---

## 4. HO (Head Office) Features

### 4.1 Store: HoIssueStore

**Location**: `apps/web/ce/store/ho/ho-issue.store.ts`

Multi-dimensional issue datasheet for bank-wide reporting:

```typescript
interface IHoIssueStore {
  issues: THoIssue[];
  categorySummary: THoCategorySummary[];
  isLoading: boolean;
  isCategoryLoading: boolean;
  error: string | null;
  currentPage: number;
  totalCount: number;
  nextPageUrl: string | null;
  orderBy: string;
  fromDate: string;
  toDate: string;
  displayProperties: THoDisplayProperties; // 18 toggleable columns

  fetchIssues(page?): Promise<void>;
  fetchNextPage(): Promise<void>;
  fetchCategorySummary(): Promise<void>;
  updateOrderBy(key: string): void;
  setDateRange(from: string, to: string): void;
  updateDisplayProperties(props: Partial<THoDisplayProperties>): void;
}
```

**Default Display Properties** (18 columns):

```typescript
const HO_DEFAULT_DISPLAY_PROPERTIES: THoDisplayProperties = {
  department_name: true,
  project_name: true,
  main_task_category: true,
  sub_task_category: true,
  sub_issue_count: true,
  project_lead: true,
  assignee: true,
  bank_wide_project: true,
  priority: true,
  state: true,
  progress_tracking: true,
  modules: true,
  cycle: true,
  start_date: true,
  due_date: true,
  completed_date: true,
  total_log_time: true,
  reference_link: true,
};
```

### 4.2 Data Types

**THoIssue** — Extended issue view with flattened fields:

```typescript
type THoIssue = {
  id: string;
  project_id: string;
  workspace_slug: string;
  department_name: string; // flattened from project.department
  project_name: string;
  name: string;
  main_task_category_name: string | null;
  sub_task_category_name: string | null;
  sub_issues_count: number;
  project_lead: string | null; // user ID
  assignees: THoIssueAssignee[];
  is_bank_wide_project: boolean;
  priority: string;
  state_name: string | null;
  state_color: string | null;
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  cycle_name: string | null;
  module_names: string[];
  total_log_time: number; // in minutes
  reference_link_count: number;
};

type THoCategorySummary = {
  department_name: string;
  workspace_slug: string;
  project_id: string;
  project_name: string;
  main_task_category_name: string | null;
  sub_task_category_name: string | null;
  work_item_count: number;
};
```

### 4.3 Service: HoIssueService

**Location**: `apps/web/ce/services/ho-issue.service.ts`

```typescript
class HoIssueService extends APIService {
  async listIssues(params: Record<string, string>): Promise<THoIssueListResponse>;
  async getCategorySummary(params: Record<string, string>): Promise<THoCategorySummary[]>;
}
```

**API Endpoints**:

- `GET /api/ho/issues/?{query}` — paginated list with filters
- `GET /api/ho/category-summary/?{query}` — category aggregation

### 4.4 Components

**Location**: `apps/web/ce/components/ho/`

| Component                        | Purpose                                          |
| -------------------------------- | ------------------------------------------------ |
| `ho-datasheet-view.tsx`          | Main view orchestrator (fetches issues on mount) |
| `ho-datasheet-toolbar.tsx`       | Date range, ordering, export controls            |
| `ho-datasheet-table.tsx`         | TanStack table renderer with column visibility   |
| `ho-datasheet-row.tsx`           | Individual row component                         |
| `ho-datasheet-header.tsx`        | Column headers                                   |
| `ho-datasheet-display-props.tsx` | Column toggle modal                              |
| `ho-category-view.tsx`           | Category summary tab                             |
| `ho-category-table.tsx`          | Category table renderer                          |
| `ho-category-row.tsx`            | Category row component                           |
| `department-list.tsx`            | Department tree navigation                       |
| `department-tree-row.tsx`        | Hierarchical row for departments                 |
| `ho-view-tabs.tsx`               | Tab switcher (issues / categories)               |

**Load More Pattern**:

```typescript
{
  store.nextPageUrl && (
    <button onClick={() => void store.fetchNextPage()}>
      Load more ({store.issues.length} / {store.totalCount})
    </button>
  );
}
```

---

## 5. Type Changes & New Interfaces

**File**: `packages/types/src/worklog.ts`

**New Exports**:

- `IAnalyticsTimesheetRow` — extends `ITimesheetRow` with `by_user` breakdown
- `IAnalyticsTimesheetUserBreakdown` — per-user daily/total minutes
- `IAnalyticsTimesheetResponse` — API response wrapper
- `ICategoryCount` — `{ name: string; count: number }`
- `ICapacityCategoriesResponse` — main + sub categories
- `ICapacityDayTask` — tasks logged on a specific day
- `ICapacityDayDetailsResponse` — API response for day details
- `ICapacityMember` — member with daily breakdown
- `ICapacityReportResponse` — full capacity report API response
- `IUserDailyWorklogTotal` — summary by date

**File**: `packages/types/src/view-props.ts`

- `IssueView.is_default` — boolean flag for workspace default views

---

## 6. Store Registration

**Root Store** (`apps/web/ce/store/root.store.ts`):

Extends `CoreRootStore` with CE-specific stores:

- `taskCategoryStore: TaskCategoryStore` — instance-level categories
- `worklog: CEWorklogStore` — extends core worklog with analytics/capacity
- `hoIssues: HoIssueStore` — HO datasheet

```typescript
export class RootStore extends CoreRootStore {
  taskCategoryStore: ITaskCategoryStore;
  worklog: ICEWorklogStore;
  hoIssues: IHoIssueStore;

  constructor() {
    super();
    this.taskCategoryStore = new TaskCategoryStore();
    this.worklog = new CEWorklogStore();
    this.hoIssues = new HoIssueStore();
  }
}
```

---

## 7. Recent Commits & Timeline

| Commit       | Date   | Feature                                                                            |
| ------------ | ------ | ---------------------------------------------------------------------------------- |
| `26b4189fe1` | Mar 27 | Capacity: Replace category count tables with donut pie charts                      |
| `e659d2e779` | Mar 27 | Fix: Cross-workspace timesheet shows all assigned issues, capacity cells clickable |
| `b6ee10c34e` | Mar 26 | Feat: Add HO (Head Office) issues endpoint                                         |
| `9f4ce6ea87` | Mar 26 | Feat: Enhance timesheet and capacity components                                    |
| `554c9fdbae` | Mar 25 | Feat: Add analytics and capacity component implementations                         |
| `12b2fdce7f` | Mar 24 | Feat: Add store, service, and hook for analytics/cross-workspace                   |
| `93247c1dd8` | Mar 22 | Feat: Add popover with worklog breakdown by user                                   |
| `7e28edb0ef` | Mar 18 | Merge: Workspaces default view PR                                                  |
| `1747fb2998` | Mar 18 | Feat: Add project lead display to workspace default views                          |
| `e4a9a84f6c` | Mar 13 | Feat: Add workspace default views with spreadsheet columns                         |
| `00628dafe5` | Mar 08 | Feat: Add instance-level task category management                                  |

---

## 8. Design Patterns & Best Practices Observed

### 8.1 Component Patterns

- **Observer wrapper**: All MobX-reading components wrapped with `observer()`
- **Read-only tables**: Using TanStack React Table with `getCoreRowModel()` only (no sorting/filtering in table)
- **Barrel exports**: Each directory has `index.ts` exporting all components
- **Props drilling**: Limited to necessary data (workspaceSlug, projectId, etc.)

### 8.2 Store Patterns

- **Explicit makeObservable**: All observables, actions, computed listed
- **Load guards**: `hasFetched` flag prevents repeated fetches
- **Error handling**: Try-finally blocks, `runInAction()` for async updates
- **Service instantiation**: Stores create their own service instances

### 8.3 UI Patterns

- **i18n integration**: All user-facing strings use `t()` from `@plane/i18n`
- **Semantic colors**: Uses token-based colors (text-primary, bg-surface-1, border-subtle)
- **Custom menu**: Uses `@plane/ui` CustomMenu for dropdowns (NOT custom dropdowns)
- **Tooltips**: Uses `@plane/propel/tooltip` for contextual help
- **Avatar integration**: Shows user avatars with fallback to initials

### 8.4 API Patterns

- **Service layer**: APIService subclasses with typed responses
- **Error wrapping**: `.catch((err) => { throw err?.response?.data; })`
- **Query params**: URLSearchParams for building query strings
- **Pagination**: `nextPageUrl` pattern for load-more UI

---

## 9. File Structure Summary

```
apps/web/ce/
├── components/
│   ├── time-tracking/
│   │   ├── timesheet/        (5 files)
│   │   ├── analytics/        (4 files) — READ-ONLY analytics view
│   │   └── capacity/         (4 files) — Heatmap + pie charts
│   ├── issues/
│   │   └── spreadsheet/columns/
│   │       ├── main-task-category-column.tsx
│   │       ├── sub-task-category-column.tsx
│   │       ├── bank-wide-project-column.tsx
│   │       ├── project-lead-column.tsx
│   │       ├── total-log-time-column.tsx
│   │       └── ... (3 more)
│   ├── ho/                   (12 files) — HO datasheet
│   └── issues/issue-details/sidebar/
│       └── task-category-property.tsx
├── store/
│   ├── worklog.store.ts      (CE extension)
│   ├── task-category.store.ts
│   └── ho/
│       └── ho-issue.store.ts
├── services/
│   └── ho-issue.service.ts
└── hooks/
    └── store/
        └── use-project-worklog.ts

packages/types/src/
├── worklog.ts (expanded)
└── view-props.ts (is_default added)
```

---

## 10. Key Metrics & Statistics

| Metric                   | Count | Notes                                      |
| ------------------------ | ----- | ------------------------------------------ |
| Time-tracking components | 13    | Timesheet (5), Analytics (4), Capacity (4) |
| Task category files      | 3     | Store (1), Component (1), Property (1)     |
| Spreadsheet columns      | 8+    | Bank-wide, project, department, etc.       |
| HO components            | 12    | Full datasheet + category views            |
| Store files              | 3     | Worklog (CE), TaskCategory, HoIssue        |
| Service files            | 1     | HoIssueService (CE-specific)               |
| Type additions           | 11    | Worklog types for analytics/capacity       |
| Commits (past 2 weeks)   | 40+   | Heavy CE development                       |

---

## 11. Unresolved Questions & Notes

1. **Analytics Service**: No dedicated `CEAnalyticsService` found — uses shared `WorklogService.getAnalyticsTimesheet()`
2. **Capacity Cross-workspace**: How member filtering is scoped across workspaces at API level (unclear from frontend code)
3. **HO API Authentication**: HO endpoints use session auth like other internal API endpoints
4. **Category Images/Icons**: No visual assets for category badges observed (only text labels)
5. **Pie Chart Colors**: Fixed 8-color palette — what happens with 9+ categories? (no visible overflow handling)
6. **Export Format**: CSV export works for capacity, unclear if analytics/HO support export

---

## Conclusion

The codebase shows a **well-structured, production-ready** implementation of advanced time-tracking and reporting features. Key strengths:

- Clear separation between project-scoped and workspace-scoped data
- Robust pagination and load-more patterns for large datasets
- Strong type safety with comprehensive interface definitions
- Consistent use of MobX for state management
- i18n-first approach to UI text
- Reuse of Plane design system components (Propel/UI)

The CE override pattern is cleanly applied, with stores extending base classes and new services living in the `ce/services/` directory.
