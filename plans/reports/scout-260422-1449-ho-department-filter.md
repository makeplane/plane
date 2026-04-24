# HO Department Filter Implementation Report

**Scope:** Plane head office (HO) view department filter across datasheet and category views  
**Codebase:** `/Users/ngoctran/Documents/Shinhan/plane`  
**Views:** `/[workspaceSlug]/ho/?view=datasheet` and `/[workspaceSlug]/ho/?view=category`  
**Report Date:** 2026-04-22

---

## 1. Route Location

**Main Page:**  
`/Users/ngoctran/Documents/Shinhan/plane/apps/web/app/(all)/[workspaceSlug]/(projects)/ho/page.tsx` (lines 1-17)

This is the entry point that routes based on URL query parameter `?view`:

- No `?view` param → renders `HoDepartmentList` component
- `?view=datasheet` → renders `HoDatasheetView`
- `?view=category` → renders `HoCategoryView`

**Layout Wrapper:**  
`/Users/ngoctran/Documents/Shinhan/plane/apps/web/app/(all)/[workspaceSlug]/(projects)/ho/layout.tsx` (lines 1-16)

Provides `AppHeader`, `HoViewTabs` (tab navigation), and `ContentWrapper` for both views.

**View Tabs Component:**  
`/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/components/ho/ho-view-tabs.tsx` (lines 1-60)

Renders three tabs: `department`, `datasheet`, `category`. The `department` tab is hidden unless user is instance admin or department manager. Access control uses `isInstanceAdmin` and `staffProfile?.is_department_manager` checks.

---

## 2. Datasheet View Component

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/components/ho/ho-datasheet-view.tsx` (lines 1-65)

**Key Actions on Mount:**

```typescript
useEffect(() => {
  void store.fetchIssues(1);
  void store.fetchAccessibleWorkspaces();
  void store.fetchFilterOptions();
}, [store]);
```

**Rendering Logic:**

- `HoDatasheetToolbar` — toolbar with workspace/project selects and date range pickers
- `HoDatasheetTable` — paginated table of issues with column filters
- "Load more" button for pagination
- Loading states: full skeleton on initial load, overlay spinner on subsequent fetches

**Filtering Logic:**  
Datasheet applies filters via `store._filterParams()` which includes `department_id`, `project_id`, and other filter parameters. The backend endpoint receives these and returns filtered issues.

---

## 3. Category View Component

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/components/ho/ho-category-view.tsx` (lines 1-130)

**Key Actions on Mount:**

```typescript
useEffect(() => {
  void store.fetchCategorySummary();
  void store.fetchFilterOptions();
}, [store]);
```

**Filtering Logic (Client-Side):**

```typescript
const filtered = useMemo(() => {
  let data = store.selectedDepartmentId
    ? store.categorySummary.filter((r) => r.department_id === store.selectedDepartmentId)
    : store.categorySummary;

  if (store.filters.department.length > 0)
    data = data.filter((r) => store.filters.department.includes(r.department_name));
  // ... other filters ...
  return data;
}, [...dependencies]);
```

**Key Issue:** The category view has **TWO separate department filtering mechanisms**:

1. `store.selectedDepartmentId` — workspace/department dropdown selector (from toolbar)
2. `store.filters.department` — column header filter for department names

The workspace select dropdown calls `store.setDepartmentFilter(val)`, which sets `selectedDepartmentId`. The category view then filters to only that department's data.

---

## 4. Department Filter Component

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/components/ho/ho-workspace-select.tsx` (lines 1-58)

**Component Type:** Observer component wrapping `CustomSearchSelect` from `@plane/ui`

**Data Source:**

```typescript
const options = [
  {
    value: "",
    query: t("ho.all_departments"),
    content: <div>All departments</div>,
  },
  ...store.departmentOptions.map((dept) => ({
    value: dept.id,
    query: dept.name,
    content: <div>{dept.name}</div>,
  })),
];
```

**Department Options Computed Property (store):**  
`/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/store/ho/ho-issue.store.ts` (lines 103-109)

```typescript
get departmentOptions(): { id: string; name: string }[] {
  const seen = new Set<string>();
  return this.categorySummary
    .filter((r) => r.department_id && !seen.has(r.department_id) && !!seen.add(r.department_id))
    .map((r) => ({ id: r.department_id, name: r.department_name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
```

**Selection Handler:**

```typescript
onChange={(val: string) => store.setDepartmentFilter(val || null)}
```

**Store Action:**

```typescript
setDepartmentFilter = (departmentId: string | null): void => {
  runInAction(() => {
    this.selectedDepartmentId = departmentId;
    this.selectedProjectIds = [];
    this.currentPage = 1;
  });
  void this._fetchFiltered();
  void this.fetchFilterOptions();
};
```

---

## 5. Project Select Component

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/components/ho/ho-project-select.tsx` (lines 1-55)

**Key Logic:**

```typescript
const workspace = store.accessibleWorkspaces.find((w) => w.department_id === store.selectedDepartmentId);

if (!workspace) return null; // Hidden when no workspace selected

const options = workspace.projects.map((p) => ({
  value: p.id,
  query: `${p.name} ${p.identifier}`,
  content: <div>{p.name}</div>,
}));
```

**Store Call:**

```typescript
onChange={(val: string[]) => store.setProjectFilter(val)}
```

**Store Action:**

```typescript
setProjectFilter = (ids: string[]): void => {
  runInAction(() => {
    this.selectedProjectIds = ids;
    this.currentPage = 1;
  });
  void this._fetchFiltered();
  void this.fetchFilterOptions();
};
```

**Important:** Project select is **only visible when a workspace is selected**. It's scoped to the selected workspace's projects.

---

## 6. Data Fetching Logic

### Datasheet View Data Fetching

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/store/ho/ho-issue.store.ts` (lines 152-227)

**Filter Parameters Function (lines 152-176):**

```typescript
private _filterParams = (): Record<string, string> => {
  const params: Record<string, string> = {
    order_by: this.orderBy,
    from_date: this.fromDate,
    to_date: this.toDate,
    include_archived: String(this.showArchived),
  };
  if (this.selectedDepartmentId) params.department_id = this.selectedDepartmentId;
  if (this.selectedProjectIds.length > 0) params.project_id = this.selectedProjectIds.join(",");

  // Additional filters (priority, state, assignees, etc.)
  if (this.filters.priority.length > 0) params.priority = this.filters.priority.join(",");
  // ... more filters ...

  return params;
};
```

**API Service Call (lines 201-227):**

```typescript
fetchIssues = async (page = 1): Promise<void> => {
  runInAction(() => {
    this.isLoading = true;
    this.error = null;
  });
  try {
    const params: Record<string, string> = {
      page: String(page),
      ...this._filterParams(),
    };
    const res = await this.service.listIssues(params);
    runInAction(() => {
      this.issues = page === 1 ? res.results : [...this.issues, ...res.results];
      this.totalCount = res.count;
      this.nextPageUrl = res.next;
      this.currentPage = page;
    });
  } catch (_err) {
    // error handling
  }
};
```

**Service Call:**  
`/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/services/ho-issue.service.ts` (lines 91-98)

```typescript
async listIssues(params: Record<string, string>): Promise<THoIssueListResponse> {
  const query = new URLSearchParams(params).toString();
  return this.get(`/api/ho/issues/${query ? `?${query}` : ""}`)
    .then((res: { data: THoIssueListResponse }) => res.data)
    .catch((err: { response?: { data: unknown } }) => {
      throw err?.response?.data;
    });
}
```

**Endpoint:** `GET /api/ho/issues/?department_id=<id>&project_id=<ids>&...`

### Category View Data Fetching

**Store Call (ho-category-view.tsx, lines 24-27):**

```typescript
useEffect(() => {
  void store.fetchCategorySummary();
  void store.fetchFilterOptions();
}, [store]);
```

**Store Action (ho-issue.store.ts, lines 234-251):**

```typescript
fetchCategorySummary = async (): Promise<void> => {
  runInAction(() => {
    this.isCategoryLoading = true;
  });
  try {
    // Category summary is always unfiltered — department filtering is done on the frontend
    const data = await this.service.getCategorySummary({});
    runInAction(() => {
      this.categorySummary = data;
    });
  } catch {
    // non-critical
  } finally {
    runInAction(() => {
      this.isCategoryLoading = false;
    });
  }
};
```

**Service Call:**

```typescript
async getCategorySummary(params: Record<string, string>): Promise<THoCategorySummary[]> {
  const query = new URLSearchParams(params).toString();
  return this.get(`/api/ho/category-summary/${query ? `?${query}` : ""}`)
    .then((res: { data: THoCategorySummary[] }) => res.data)
    .catch((err: { response?: { data: unknown } }) => {
      throw err?.response?.data;
    });
}
```

**Endpoint:** `GET /api/ho/category-summary/` (NO filters passed, always returns full summary)

**Frontend Filtering (ho-category-view.tsx, lines 29-53):**

```typescript
const filtered = useMemo(() => {
  let data = store.selectedDepartmentId
    ? store.categorySummary.filter((r) => r.department_id === store.selectedDepartmentId)
    : store.categorySummary;

  if (store.filters.department.length > 0)
    data = data.filter((r) => store.filters.department.includes(r.department_name));
  // ... other filters ...

  return data;
}, [
  store.categorySummary,
  store.selectedDepartmentId,
  store.filters.department,
  // ... other dependencies ...
]);
```

---

## 7. Permissions & Accessible Workspaces

### Accessible Workspaces Fetching

**Store Action (ho-issue.store.ts, lines 253-275):**

```typescript
fetchAccessibleWorkspaces = async (): Promise<void> => {
  if (this.isWorkspacesLoading || this.accessibleWorkspaces.length > 0) return;
  runInAction(() => {
    this.isWorkspacesLoading = true;
  });
  try {
    const data = await this.service.listAccessibleWorkspaces();
    runInAction(() => {
      this.accessibleWorkspaces = data;
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 403) {
      console.error("[HO] fetchAccessibleWorkspaces: auth error", status);
    } else {
      console.error("[HO] fetchAccessibleWorkspaces failed:", err);
    }
  } finally {
    runInAction(() => {
      this.isWorkspacesLoading = false;
    });
  }
};
```

**Service Call:**

```typescript
async listAccessibleWorkspaces(): Promise<THoAccessibleWorkspace[]> {
  return this.get("/api/ho/workspaces/")
    .then((res: { data: THoAccessibleWorkspace[] }) => res.data)
    .catch((err: { response?: { data: unknown } }) => {
      throw err?.response?.data;
    });
}
```

**Endpoint:** `GET /api/ho/workspaces/`

**Data Type:**

```typescript
type THoAccessibleWorkspace = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  department_id: string;
  department_name: string;
  projects: THoWorkspaceProject[];
};
```

### Permissions Check in Frontend

**Department Tab Access Control (ho-view-tabs.tsx, lines 19-39):**

```typescript
const { data: staffProfile, isLoading: profileLoading } = useMyStaffProfile(currentWorkspace?.slug);
const { data: adminStatus, isLoading: adminLoading } = useSWR("INSTANCE_ADMIN_STATUS", () =>
  userService.currentUserInstanceAdminStatus()
);

const isInstanceAdmin = adminStatus?.is_instance_admin ?? false;
const canSeeDepartment = isInstanceAdmin || (staffProfile?.is_department_manager ?? false);

// Redirect to datasheet when user has no access to department tab
useEffect(() => {
  if (loaded && !canSeeDepartment && activeView === "department") {
    setSearchParams({ view: "datasheet" }, { replace: true });
  }
}, [loaded, canSeeDepartment, activeView, setSearchParams]);

const visibleTabs = HO_VIEW_TABS.filter((tab) => tab.key !== "department" || canSeeDepartment);
```

**Backend Permission Enforcement:**  
The backend endpoint `/api/ho/workspaces/` enforces permissions and returns only workspaces the user has access to. The documented access rules (from `ho.md`) state:

- Instance admin → sees all workspaces
- Department manager → sees workspaces linked to managed dept + descendants
- Workspace admin (role=20) → sees their admin workspaces
- Regular member → sees workspaces they are members of

---

## 8. Current Buggy Logic — Analysis

### Issue 1: Department Dropdown Shows All Departments from Category Summary

**Location:** `ho-workspace-select.tsx` (lines 14-36) + store computed property (lines 103-109)

**Current Behavior:**

```typescript
get departmentOptions(): { id: string; name: string }[] {
  const seen = new Set<string>();
  return this.categorySummary
    .filter((r) => r.department_id && !seen.has(r.department_id) && !!seen.add(r.department_id))
    .map((r) => ({ id: r.department_id, name: r.department_name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
```

**Problem:** `departmentOptions` is derived from `categorySummary` which is fetched WITHOUT any permission filtering. It calls `getCategorySummary({})` with empty params. This means:

- It returns ALL categories across ALL departments in the system
- Department dropdown shows ALL departments, not just user's accessible ones
- User can select departments they don't have permission to access

**Expected Behavior:**

- Department dropdown should only show departments (workspaces) from `accessibleWorkspaces`
- These would match the user's permissions as enforced by the backend

### Issue 2: "All Departments" Logic Incomplete in Category View

**Location:** `ho-category-view.tsx` (lines 29-53)

**Current Behavior:**

```typescript
const filtered = useMemo(() => {
  let data = store.selectedDepartmentId
    ? store.categorySummary.filter((r) => r.department_id === store.selectedDepartmentId)
    : store.categorySummary;

  if (store.filters.department.length > 0)
    data = data.filter((r) => store.filters.department.includes(r.department_name));
```

**Problems:**

1. When `selectedDepartmentId` is null (All departments), it shows ALL categories from `categorySummary` (unfiltered)
2. BUT if `store.filters.department` is active, it tries to filter by department NAME using the column header filter
3. This creates potential for showing data the user shouldn't see if `categorySummary` contains inaccessible departments

**Expected Behavior:**

- When "All departments" is selected, should only show departments from `accessibleWorkspaces`
- The category summary data should be pre-filtered server-side based on permissions (or frontend should filter using `accessibleWorkspaces`)

### Issue 3: Datasheet View Relies on Backend Enforcement

**Location:** `ho-issue.store.ts` (lines 152-176)

**Current Behavior:**

```typescript
if (this.selectedDepartmentId) params.department_id = this.selectedDepartmentId;
if (this.selectedProjectIds.length > 0) params.project_id = this.selectedProjectIds.join(",");
```

**Potential Issue:**

- The datasheet view passes `department_id` and `project_id` to backend
- Frontend allows selecting ANY department from the dropdown (which shows all departments)
- **If a user manually constructs URL params with unauthorized department_id, backend must reject it**
- The store doesn't validate that selected department is in `accessibleWorkspaces`

**Expected Behavior:**

- Frontend should validate department_id is in `accessibleWorkspaces` before making request
- Backend is the final authority (good), but frontend should prevent unnecessary invalid requests

### Issue 4: "All Departments" Not Properly Merging Accessible Data

**Location:** `ho-workspace-select.tsx` (lines 14-36)

**Current Behavior:**

```typescript
const selectedName = store.selectedDepartmentId
  ? store.departmentOptions.find((d) => d.id === store.selectedDepartmentId)?.name
  : null;

return (
  <CustomSearchSelect
    value={store.selectedDepartmentId ?? ""}
    onChange={(val: string) => store.setDepartmentFilter(val || null)}
    // ...
  />
);
```

**Problem:**

- When user selects "All departments" (empty string), the value becomes `null` in store
- But `departmentOptions` still comes from `categorySummary` which has all departments
- In category view, when `selectedDepartmentId === null`, it shows ALL categories (including inaccessible ones)
- Datasheet view with `selectedDepartmentId === null` makes request without `department_id` param → backend returns only accessible issues (relying on backend permission logic)

**Expected Behavior:**

- "All departments" selection should merge data only from user's accessible workspaces
- Frontend should filter `categorySummary` by departments in `accessibleWorkspaces` when "All departments" is selected

---

## 9. Suspected Root Causes

1. **Incomplete Frontend Permission Filtering**
   - `categorySummary` is fetched without filtering; all departments are returned
   - `departmentOptions` computed from unfiltered `categorySummary`
   - Backend enforces permissions on issue list, but category summary and department list trust frontend filtering

2. **Mismatch Between Department Selector Data Source and Accessible Workspaces**
   - Department dropdown populated from `categorySummary` (all departments)
   - But `accessibleWorkspaces` is fetched separately and contains only user-accessible ones
   - These two lists should be aligned; dropdown should use `accessibleWorkspaces.map(w => ({ id: w.department_id, name: w.department_name }))`

3. **Category View Filters by Department Name Instead of Department ID**
   - In category header filter, filtering by `department_name` (string) instead of `department_id`
   - In `ho-category-table.tsx` lines 74 and 83-91, filter logic uses `department_name`
   - This bypasses permission checks since name filtering is just string matching

4. **"All Departments" Option Doesn't Respect Accessible Workspaces**
   - When user selects "All departments", category view shows ALL categories
   - Should instead filter to only categories belonging to departments in `accessibleWorkspaces`
   - Currently relies solely on backend filtering in datasheet; category view is frontend-only with no permission enforcement

5. **Backend Endpoint Called with Empty Params**
   - `fetchCategorySummary()` calls backend with empty params `{}`
   - Comment says "department filtering is done on the frontend"
   - But this means full dataset must be loaded then filtered client-side (inefficient + security risk)

---

## Key Files Summary

| File Path                                          | Purpose                 | Issue                                                         |
| -------------------------------------------------- | ----------------------- | ------------------------------------------------------------- |
| `app/(all)/[workspaceSlug]/(projects)/ho/page.tsx` | Route handler           | None (correct view routing)                                   |
| `ce/components/ho/ho-workspace-select.tsx`         | Department dropdown     | **Shows all departments, not just accessible ones**           |
| `ce/components/ho/ho-project-select.tsx`           | Project dropdown        | OK (scoped to workspace)                                      |
| `ce/components/ho/ho-datasheet-view.tsx`           | Datasheet view renderer | OK (backend validates)                                        |
| `ce/components/ho/ho-category-view.tsx`            | Category view renderer  | **Filters by dept name; shows all when "All depts" selected** |
| `ce/components/ho/ho-category-table.tsx`           | Category table          | **Department filter key uses name not ID**                    |
| `ce/store/ho/ho-issue.store.ts`                    | MobX store              | **departmentOptions derived from full categorySummary**       |
| `ce/services/ho-issue.service.ts`                  | API calls               | `getCategorySummary({})` returns unfiltered data              |

---

## Recommendations for Fix

1. **Change department dropdown source:**
   - Instead of `store.departmentOptions` (from unfiltered `categorySummary`)
   - Use `store.accessibleWorkspaces.map(w => ({ id: w.id, name: w.department_name }))`

2. **Filter category summary by accessible workspaces:**
   - In category view, filter `store.categorySummary` to only rows where `department_id` is in accessible workspace IDs
   - Or change backend call to pass workspace filters

3. **Validate department selection:**
   - Before calling `_fetchFiltered()` in datasheet, validate `selectedDepartmentId` is in `accessibleWorkspaces`

4. **Fix category view "All departments" logic:**
   - When `selectedDepartmentId === null`, apply permission-based filter using `accessibleWorkspaces`
   - Don't show all `categorySummary` rows; only show rows from accessible departments

5. **Use department ID in filters consistently:**
   - Category filter should filter by `department_id` (UUID) not `department_name` (string)
   - Prevents accidental permission bypass through name-based filtering
