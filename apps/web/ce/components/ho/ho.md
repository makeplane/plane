# HO (Head Office) Menu — Rules & Architecture

## Overview

The HO menu is a cross-workspace reporting feature for Head Office staff. It aggregates
work items (issues) across multiple Plane workspaces based on the user's role and lets
HO managers view tasks by department, as a datasheet, or by task category.

**Route:** `/ho` (entry page, managed by the router in `apps/web`)
**State:** MobX store at `apps/web/ce/store/ho/`
**Backend:** Django views at `apps/api/plane/app/views/ho.py`
**Service:** `apps/web/ce/services/ho-issue.service.ts`

---

## Access Control Rules

### Roles & Visibility

| Role                                              | Department tab      | Datasheet tab                     | Category tab             |
| ------------------------------------------------- | ------------------- | --------------------------------- | ------------------------ |
| Instance Admin                                    | ✅ Full tree        | ✅ All workspaces                 | ✅ All depts             |
| Department Manager (`is_department_manager=true`) | ✅ Own subtree only | ✅ Managed + member workspaces    | ✅ Own dept subtree      |
| Workspace Admin (role=20)                         | ❌ Hidden           | ✅ All issues in admin workspaces | ✅ Linked dept           |
| Regular Member                                    | ❌ Hidden           | ✅ Only assigned issues           | ✅ Linked dept ancestors |

### Tab Visibility Logic (`ho-view-tabs.tsx`)

- Three tabs: `department`, `datasheet`, `category`
- `department` tab is hidden unless: `isInstanceAdmin || staffProfile.is_department_manager`
- Default tab when user lacks department access → auto-redirects to `datasheet` via `useEffect`
- Tab state stored in URL search param `?view=<key>`

### Backend Access Helpers (`ho.py`)

- `_is_instance_admin(user)` — checks `InstanceAdmin` model (not Django `is_staff`)
- `get_accessible_workspace_ids(user)` — returns workspace IDs the user can see:
  1. Instance admin → all workspaces
  2. Department manager → workspaces linked to managed dept + all descendants
  3. Regular member → workspaces they are members of
- `_get_all_descendant_dept_ids(dept_id)` — BFS to get dept + all children recursively
- `_get_user_scope_q(user, workspace_ids)` — Q filter scoping issues:
  - Instance admin / dept manager → all issues in accessible workspaces
  - Workspace admin (role=20) → all issues in those workspaces
  - Regular member → only issues where `assignees=user`

---

## Views / Tabs

### 1. Department Tab (`department-list.tsx` + `department-tree-row.tsx`)

Shows the department hierarchy tree with linked workspace info.

**Data source:** `DepartmentService.getDepartmentTree(workspaceSlug)` (SWR, key: `DEPARTMENTS_TREE_<slug>`)

**Tree scoping:**

- Instance admin → full tree
- Dept manager → subtree rooted at `staffProfile.department`
- Others → not visible

**Search:** Client-side recursive filter (`filterBySearch`) — matches name, preserves ancestors of matches

**`HoDepartmentTreeRow`:**

- Recursive component, indented by `depth * 20 + 12` px
- Expand/collapse with chevron (starts expanded)
- Linked workspace shown as a button → confirms then opens in new tab (`window.open`)

---

### 2. Datasheet Tab (`ho-datasheet-view.tsx`)

Paginated table of work items across workspaces.

**Store calls on mount:**

- `store.fetchIssues(1)` — page 1
- `store.fetchAccessibleWorkspaces()`
- `store.fetchFilterOptions()`

**Pagination:** "Load more" button at bottom, calls `store.fetchNextPage()`. Shows `loaded / total` count.

**Loading states:**

- Initial load with no data → full `<Loader>` skeleton
- Subsequent fetches while data present → overlay `<Spinner>` (absolute, z-10)

**Components:**

- `HoDatasheetToolbar` — date range, workspace/project selects, Display toggle
- `HoDatasheetTable` — scrollable table with sticky first column + frozen header
- `HoDatasheetDisplayProps` — toggle panel for visible columns (18 columns)
- `HoDatasheetHeader` — sticky `<thead>` with per-column sort+filter via `HoHeaderFilter`
- `HoDatasheetRow` — single issue row, groups by dept (thick top border on dept change)

**Display Properties (toggleable columns):**
`department_name`, `project_name`, `main_task_category`, `sub_task_category`,
`sub_issue_count`, `project_lead`, `assignee`, `bank_wide_project`, `priority`,
`state`, `progress_tracking`, `modules`, `cycle`, `start_date`, `due_date`,
`completed_date`, `total_log_time`, `reference_link`

---

### 3. Category Tab (`ho-category-view.tsx`)

Read-only summary of task categories per department (no issue counts — just the taxonomy tree).

**Store call on mount:**

- `store.fetchCategorySummary()`
- `store.fetchAccessibleWorkspaces()`
- `store.fetchFilterOptions()`

**Client-side search:** filters on `department_name`, `project_name`,
`main_task_category_name`, `sub_task_category_name` (OR match, case-insensitive)

**Client-side sort:** default `department_name` ASC (sort UI rendered but sort key fixed)

**Columns:**

1. Department Name (sticky left, shadow on horizontal scroll)
2. Main Task Category (bold; description shown in smaller italic below if present)
3. Sub Task Category

**Row grouping:** thick top border (`border-t-[1.5px]`) when `department_name` changes (`isNewDeptGroup`)

---

## Shared Filter Controls

### `HoWorkspaceSelect`

- Dropdown: "All workspaces" sentinel + list of `store.accessibleWorkspaces`
- Displays `department_name` (not workspace name) as label
- Selecting workspace → `store.setWorkspaceFilter(slug | null)`
- Selecting "All workspaces" → clears filter

### `HoProjectSelect`

- **Only visible when a workspace is selected** (`!workspace → return null`)
- Multi-select: shows projects belonging to selected workspace
- Label: "All projects" | comma-joined names | "3+ projects"
- Selecting projects → `store.setProjectFilter(ids[])`

### `HoHeaderFilter` (per-column sort+filter in table headers)

- Sort: ASC/DESC via `store.updateOrderBy(asc | desc)`
- Filter: multi-select with inline search (deduped options)
- Active indicator: blue dot for active filters, sort icon for active sort
- "Clear filters & sort" resets filter to `[]` and orderBy to `-created_at`
- `closeOnSelect={false}` when filterKey present (keep menu open for multi-select)

### Date Range Pickers

- Shared store state: `store.fromDate` / `store.toDate`
- Present in both Datasheet toolbar and Category header
- Backend overlap logic: include issues where `[start_date, target_date]` overlaps `[from_date, to_date]`
- When `progress` filter is active, `from_date` lower-bound on `target_date` is skipped

---

## Backend API Endpoints

| Method | URL                             | View                          | Description                          |
| ------ | ------------------------------- | ----------------------------- | ------------------------------------ |
| GET    | `/api/ho/issues/`               | `HoIssueListView`             | Paginated issues (100/page, max 500) |
| GET    | `/api/ho/category-summary/`     | `HoCategorySummaryView`       | Dept × MainCat × SubCat rows         |
| GET    | `/api/ho/filter-options/`       | `HoFilterOptionsView`         | Distinct filter values               |
| GET    | `/api/ho/workspaces/`           | `HoAccessibleWorkspacesView`  | Workspaces + projects                |
| GET    | `/api/ho/issues/<id>/worklogs/` | `HoIssueWorklogBreakdownView` | Per-user worklog totals              |

### Query Parameters — `/api/ho/issues/`

| Param                | Type           | Notes                                                     |
| -------------------- | -------------- | --------------------------------------------------------- |
| `workspace_slug`     | string         | Filter to single workspace                                |
| `project_id`         | csv UUIDs      | Must belong to accessible workspaces                      |
| `order_by`           | string         | Whitelist-validated; default `project__workspace__name`   |
| `from_date`          | YYYY-MM-DD     | `target_date >= from_date` (skipped if `progress` active) |
| `to_date`            | YYYY-MM-DD     | `start_date <= to_date`                                   |
| `priority`           | csv            | e.g. `urgent,high`                                        |
| `state`              | csv            | State names                                               |
| `assignees`          | csv UUIDs      | Assignee user IDs                                         |
| `main_task_category` | csv            | Category names                                            |
| `sub_task_category`  | csv            | Sub-category names                                        |
| `cycle`              | csv            | Cycle names                                               |
| `module`             | csv            | Module names                                              |
| `bank_wide`          | `true`/`false` | Bank-wide project flag                                    |
| `progress`           | csv            | `off_track`, `due_today`, `at_risk`, `on_track`           |

### Progress Filter Logic

- `off_track` → `target_date < today`
- `due_today` → `target_date = today`
- `at_risk` → `target_date = today + 1`
- `on_track` → `target_date > today + 1`

### `/api/ho/category-summary/` — Dept Scoping

- Instance admin → all depts
- Dept manager → own dept + all descendants (incl. depts with no linked workspace)
- Regular member → depts linked to joined workspaces + all ancestors up to root

---

## Store (`ho-issue.store.ts` + `ho-issue.defaults.ts`)

Located at `apps/web/ce/store/ho/`

**Key observables:**

- `issues: THoIssue[]` — current page results (appended on load-more)
- `categorySummary: THoCategorySummary[]`
- `accessibleWorkspaces: THoAccessibleWorkspace[]`
- `filterOptions: THoFilterOptions | null`
- `displayProperties: THoDisplayProperties` — per-column visibility toggles
- `filters` — active filter values (states, categories, etc.)
- `orderBy: string` — current sort field
- `fromDate / toDate: string` — date range (YYYY-MM-DD)
- `selectedWorkspaceSlug: string | null`
- `selectedProjectIds: string[]`
- `isLoading / isFetchingIssues / isCategoryLoading: boolean`
- `nextPageUrl: string | null` — pagination cursor
- `totalCount: number`

**Actions:**

- `fetchIssues(page)` — builds query params from filters, calls service
- `fetchNextPage()` — follows `nextPageUrl`
- `fetchCategorySummary()` — uses workspace/project/date filters
- `fetchAccessibleWorkspaces()` — cached, only fetches once
- `fetchFilterOptions()` — re-fetches on workspace/project/date change
- `setWorkspaceFilter(slug)` — resets project filter, re-fetches issues + options
- `setProjectFilter(ids[])` — re-fetches issues + options
- `setDateRange(from, to)` — re-fetches issues + category + options
- `updateFilters(partial)` — merges filters, re-fetches issues
- `updateOrderBy(field)` — re-fetches issues
- `updateDisplayProperties(partial)` — toggles column visibility (no re-fetch)

---

## Data Types (TypeScript)

```ts
THoIssue {
  id, project_id, workspace_slug, department_name, project_name, name,
  main_task_category_name, sub_task_category_name, sub_issues_count,
  project_lead, assignees: THoIssueAssignee[], is_bank_wide_project,
  priority, state_name, state_color, start_date, target_date, completed_at,
  cycle_name, module_names: string[], total_log_time, reference_link_count
}

THoCategorySummary {
  department_name, main_task_category_name, main_task_category_description,
  sub_task_category_name
}

THoAccessibleWorkspace {
  id, name, slug, logo_url, department_name, projects: THoWorkspaceProject[]
}

THoFilterOptions {
  states, main_task_categories, sub_task_categories, cycles, modules,
  assignees: {id, display_name}[], leads: {id, display_name}[], priorities, progress
}
```

---

## Scroll Behavior (Tables)

Both `HoDatasheetTable` and `HoCategoryTable`:

- `containerRef` + scroll event listener → `isScrolled` boolean
- First column is `sticky left-0` with conditional `shadow-[2px_0_8px_rgba(0,0,0,0.1)]` when scrolled
- Table header is `sticky top-0 z-[20]`; first header cell is `z-[15]`; body first cell is `z-[5]`
- Row background alternates `bg-surface-1 / bg-surface-2`; hover → `bg-layer-2/50`
- Frozen first column uses explicit `bg-surface-1/2` + `group-hover:bg-layer-2` (overrides stripe)

---

## Key File Locations

| File                                        | Purpose                                                 |
| ------------------------------------------- | ------------------------------------------------------- |
| `ho-view-tabs.tsx`                          | Tab navigation, access control for tab visibility       |
| `ho-category-view.tsx`                      | Category tab root, search + sort + data fetch           |
| `ho-category-table.tsx`                     | Category table with sticky header + column filters      |
| `ho-category-row.tsx`                       | Single category row, dept group border                  |
| `ho-datasheet-view.tsx`                     | Datasheet tab root, pagination, loading states          |
| `ho-datasheet-toolbar.tsx`                  | Date range + workspace/project selects + Display toggle |
| `ho-datasheet-table.tsx`                    | Issue table with scroll tracking                        |
| `ho-datasheet-header.tsx`                   | Sticky thead with per-column `HoHeaderFilter`           |
| `ho-datasheet-row.tsx`                      | Single issue row with display property control          |
| `ho-datasheet-display-props.tsx`            | Column visibility toggle panel                          |
| `ho-workspace-select.tsx`                   | Workspace dropdown filter                               |
| `ho-project-select.tsx`                     | Project multi-select (workspace-scoped)                 |
| `ho-header-filter.tsx`                      | Column sort + filter dropdown                           |
| `department-list.tsx`                       | Department tab: tree loader + search                    |
| `department-tree-row.tsx`                   | Recursive dept row with expand/collapse                 |
| `apps/web/ce/store/ho/ho-issue.store.ts`    | MobX store (state + actions)                            |
| `apps/web/ce/store/ho/ho-issue.defaults.ts` | Default display properties                              |
| `apps/web/ce/services/ho-issue.service.ts`  | API service (all HO endpoints)                          |
| `apps/api/plane/app/views/ho.py`            | Django views (all HO endpoints)                         |

---

## Adding New Features — Checklist

1. **New column in Datasheet:**
   - Add field to `THoIssue` in `ho-issue.service.ts`
   - Add to `COLUMN_LABELS` in `ho-datasheet-display-props.tsx`
   - Add to `THoDisplayProperties` defaults in `ho-issue.defaults.ts`
   - Render in `ho-datasheet-header.tsx` and `ho-datasheet-row.tsx`
   - Add to `HoIssueSerializer` and annotate in `HoIssueListView` queryset

2. **New filter:**
   - Add query param handling in `HoIssueListView.get()`
   - Add to `HoFilterOptionsView` response
   - Add to `THoFilterOptions` type
   - Add `HoHeaderFilter` usage in `ho-datasheet-header.tsx`
   - Add filter key to store's `filters` observable and `updateFilters`

3. **New tab:**
   - Add to `HO_VIEW_TABS` array in `ho-view-tabs.tsx`
   - Add access control condition to `visibleTabs` filter if needed
   - Create view component, add rendering in HO page route component
