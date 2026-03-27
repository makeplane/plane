# Phase 5: Category View Component

## Context Links

- [Plan Overview](./plan.md)
- [Phase 3 — Store & Service](./phase-03-ho-store-service.md)
- Backend endpoint: `GET /api/ho/category-summary/` (Phase 2)
- HO department list (pattern reference): `apps/web/ce/components/ho/department-list.tsx`
- HO department tree row (pattern reference): `apps/web/ce/components/ho/department-tree-row.tsx`

## Overview

- **Priority**: P2
- **Status**: pending
- **Effort**: 1d
- **Description**: Implement `HoCategoryView` — a read-only aggregated summary table with 5 columns: Department, Team/Project, Main Task Category, Sub Task Category, Number of Work Items. Data grouped visually by Department then Team/Project, with sortable headers.

## Key Insights

- **Data source**: `hoIssueStore.fetchCategorySummary()` → `hoIssueStore.categorySummary` (array of `THoCategorySummary`). Backend returns it pre-sorted by dept → project → main cat → sub cat.
- **No pagination**: Category summary is bounded (finite combinations). Fetch all at once on mount.
- **Grouping visual**: Same as Datasheet — visual row separators between department groups and project groups (no rowspan/merge).
- **Sort**: Client-side sort (data is small). Click column header → sort `categorySummary[]` locally in the component (or in a derived computed in the store). Sortable columns: all 5.
- **No display properties toggle**: All 5 columns always visible (simple fixed layout).
- **Search**: Add search input to filter by department, project, or category name. Client-side filter on `categorySummary` array.
- **Structure mirrors department-list.tsx**: Same `py-9 px-page-x lg:px-12` layout, same table styling, same search bar pattern.
- **Date pickers**: Two Plane `DatePicker` components (From / To) reading `hoIssueStore.fromDate`/`toDate`. On change → `hoIssueStore.setDateRange()` immediately. Date state is shared with Datasheet view. <!-- Updated: Validation Session 3 - Use Plane DatePicker; shared store state; immediate re-fetch -->

## Requirements

### Functional

- 5 columns: Department, Team/Project, Main Task Category, Sub Task Category, Number of Work Items
- Data fetched on mount from `hoIssueStore.fetchCategorySummary()`
- Visual group separators between Department groups, lighter separator between Team/Project groups
- Sortable column headers (client-side sort, toggle asc/desc on click)
- Search input filtering rows by any column text
- Loading skeleton while fetching
- Empty state when no data

### Non-functional

- All 5 columns always visible (no display properties needed)
- File sizes: root <120L, table <100L, row <60L

## Architecture

```
apps/web/ce/components/ho/
├── ho-category-view.tsx       (root — fetch, search, sort, render table)
├── ho-category-table.tsx      (table with sticky header + scrollable body)
└── ho-category-row.tsx        (tbody tr for one THoCategorySummary)
```

### Column Definitions

```ts
type THoCategoryColumn = {
  key: keyof THoCategorySummary | "work_item_count";
  label: string;
  sortKey: keyof THoCategorySummary;
};

const HO_CATEGORY_COLUMNS: THoCategoryColumn[] = [
  { key: "department_name", label: "Department", sortKey: "department_name" },
  { key: "project_name", label: "Team/Project", sortKey: "project_name" },
  { key: "main_task_category_name", label: "Main Task Category", sortKey: "main_task_category_name" },
  { key: "sub_task_category_name", label: "Sub Task Category", sortKey: "sub_task_category_name" },
  { key: "work_item_count", label: "Number of Work Items", sortKey: "work_item_count" },
];
```

### Sort State (local, no store needed)

```ts
const [sortKey, setSortKey] = useState<keyof THoCategorySummary>("department_name");
const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

const handleSort = (key: keyof THoCategorySummary) => {
  if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  else {
    setSortKey(key);
    setSortDir("asc");
  }
};

const sortedData = useMemo(() => {
  return [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
}, [filtered, sortKey, sortDir]);
```

### Visual Grouping

Compare consecutive rows by `department_name` (border-t-2) and `project_name` (border-t).

### Search Filter

```ts
const filtered = useMemo(() => {
  if (!search) return data;
  const q = search.toLowerCase();
  return data.filter((r) =>
    [r.department_name, r.project_name, r.main_task_category_name, r.sub_task_category_name].some((v) =>
      v?.toLowerCase().includes(q)
    )
  );
}, [data, search]);
```

## Related Code Files

- **Create**: `apps/web/ce/components/ho/ho-category-view.tsx`
- **Create**: `apps/web/ce/components/ho/ho-category-table.tsx`
- **Create**: `apps/web/ce/components/ho/ho-category-row.tsx`
- **Modify**: `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/page.tsx` — replace Category placeholder

## Embedded Rules

```
- observer() from mobx-react on components reading MobX store (ho-category-view reads hoIssueStore)
- useHoIssues() hook to access HoIssueStore
- Semantic tokens: text-primary, text-secondary, text-placeholder, border-subtle, bg-surface-1
- @plane/propel/* subpath imports (SearchIcon from propel/icons)
- Local sort state (useState) — no MobX needed for sort/search in Category view
- useMemo for derived filtered + sorted lists (avoid recompute on every render)
- File <150 lines per component
- Prettier: 120-char line width, trailing comma es5
```

## Implementation Steps

1. **`ho-category-view.tsx`** (root, observer):
   - Access `hoIssueStore` via `useHoIssues()`
   - On mount: `useEffect(() => { hoIssueStore.fetchCategorySummary(); }, [])` — store already has today as default dates
   - **Date range pickers**: two date inputs (From / To) initialized from `hoIssueStore.fromDate` / `hoIssueStore.toDate` (default today)
   - On date change → `hoIssueStore.setDateRange(from, to)` → store re-fetches category summary with overlap filter
   - Local state: `search`, `sortKey`, `sortDir`
   - Derived: `filtered` → `sortedData` via `useMemo`
   - Renders: header (`<h4>Category</h4>`) + date range pickers + search bar + `<HoCategoryTable>`
   - Shows loader while `isCategoryLoading`; empty state when `sortedData.length === 0`
   - Mirror layout from `department-list.tsx`: `<div className="size-full py-9 px-page-x lg:px-12">`

<!-- Updated: Validation Session 2 - Root needs From/To date pickers (default today from store); setDateRange() triggers backend re-aggregate -->

2. **`ho-category-table.tsx`**:
   - Props: `data: THoCategorySummary[]`, `sortKey`, `sortDir`, `onSort`
   - Renders `<table>` with `<thead>` (5 sortable `<th>`) + `<tbody>` of `<HoCategoryRow>`
   - Each `<th>` shows column label + sort arrow icon (ArrowUpDown / ArrowDownWideNarrow / ArrowUpNarrowWide)
   - Computes `isNewDeptGroup` and `isNewProjectGroup` per row
   - `overflow-x-auto` wrapper

3. **`ho-category-row.tsx`**:
   - Props: `row: THoCategorySummary`, `isNewDeptGroup: boolean`, `isNewProjectGroup: boolean`
   - 5 `<td>` cells: department_name, project_name, main_task_category_name (or "—"), sub_task_category_name (or "—"), work_item_count
   - Apply `border-t-2 border-subtle` if `isNewDeptGroup`, `border-t border-subtle` if `isNewProjectGroup`
   - `work_item_count` cell: right-aligned, bold for readability

4. **Update `ho/page.tsx`**: replace Category placeholder with `<HoCategoryView />`

5. **Verify**: Navigate to Category tab; data loads; search filters; click column headers sort; group separators visible.

## Post-Phase Checklist

- [ ] `pnpm check:lint` — 0 errors
- [ ] All 5 columns render in correct order
- [ ] Click any column header → rows re-sort; second click reverses direction
- [ ] Search input filters rows by partial match on any text column
- [ ] Visual group separator between different departments (border-t-2)
- [ ] Lighter separator between different projects within same department
- [ ] Loading skeleton shown during fetch
- [ ] Empty state shown when no data or no search results
- [ ] All files < 150 lines

## Todo List

- [ ] `ho-category-view.tsx`
- [ ] `ho-category-table.tsx`
- [ ] `ho-category-row.tsx`
- [ ] Update `ho/page.tsx`

## Success Criteria

- 5-column aggregated table loads and renders correctly
- Client-side sort works on all columns
- Search filter works correctly
- Visual grouping matches Datasheet view style

## Risk Assessment

- **Low risk**: Simpler than Datasheet view (no display properties, no backend sort, no pagination)
- **Null categories**: `main_task_category_name` / `sub_task_category_name` may be null — display "—"
- **Large datasets**: If category summary returns thousands of rows, client-side sort/filter still fast (useMemo). Unlikely to be a problem.

## Security Considerations

- Read-only table — no user mutations
- No external links in this view — no XSS risk

## Next Steps

- All phases complete → end-to-end test: all three HO tabs working correctly
- Update `docs/codebase-summary.md` with HO view modes feature
