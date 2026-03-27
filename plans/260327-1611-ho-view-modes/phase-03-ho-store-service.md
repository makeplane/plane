# Phase 3: Frontend Store & Service

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2 — Backend API](./phase-02-backend-ho-issues-api.md)
- CE root store: `apps/web/ce/store/root.store.ts`
- Store hook pattern: `apps/web/core/hooks/store/use-workflow.ts` (reference)
- Existing HO components: `apps/web/ce/components/ho/`
- WorklogStore reference: `apps/web/core/store/worklog.store.ts`

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 0.5d
- **Description**: Create `HoIssueService` (API calls) and `HoIssueStore` (MobX state) for cross-workspace issues and category summary. Register store in CE root store and expose via hook.

## Key Insights

- **No global store reuse**: We cannot reuse `EIssuesStoreType.GLOBAL` because it is scoped to a single workspace. We need a separate lightweight store.
- **SWR vs MobX**: For simple read-only paginated data, SWR inside components is simpler. However, since we want display property persistence (which MobX stores handle), we use a MobX store for state + SWR for data fetching (or manual fetch in store actions).
- **Display properties**: Store the HO Datasheet display properties in `localStorage` (same pattern as spreadsheet view sorting) OR in the store as observable — use store since it's simpler and doesn't need backend persistence.
- **Pagination**: Store manages current page, page size, total count, and the issue list. Uses cursor/page approach.
- **Sort state**: Store holds `orderBy` string, updated when user clicks a column header.

## Requirements

### Functional

- `HoIssueService.listIssues(params)` → calls `GET /api/ho/issues/`
- `HoIssueService.getCategorySummary(params)` → calls `GET /api/ho/category-summary/`
- `HoIssueStore`:
  - Observable: `issues[]`, `categorySummary[]`, `isLoading`, `error`, `pagination`, `orderBy`, `displayProperties`, `fromDate`, `toDate`
  - Actions: `fetchIssues()`, `fetchNextPage()`, `fetchCategorySummary()`, `updateOrderBy()`, `updateDisplayProperties()`, `setDateRange(from: string, to: string)`
  - Default: `fromDate` = today (YYYY-MM-DD), `toDate` = today (YYYY-MM-DD)
  - On `setDateRange()`: reset pagination to page 1, call `fetchIssues()` and `fetchCategorySummary()` with updated params
  - Helpers: `getIssues()` (returns sorted list), `getCategorySummary()`
- `useHoIssues()` hook in `core/hooks/store/`

<!-- Updated: Validation Session 2 - Store needs fromDate/toDate observables (default today) and setDateRange() action; both service methods accept date params -->

### Non-functional

- MobX `makeObservable` with explicit action map
- `runInAction()` for all async state mutations
- Store file < 150 lines (split if needed)

## Architecture

```
apps/web/ce/services/ho-issue.service.ts     (new)
apps/web/ce/store/ho/ho-issue.store.ts       (new)
apps/web/core/hooks/store/use-ho-issues.ts   (new)
apps/web/ce/store/root.store.ts              (modify — add hoIssue store)
```

### Service Shape

```ts
// ho-issue.service.ts
export type THoIssue = {
  id: string;
  project_id: string;
  workspace_slug: string;
  department_name: string;
  project_name: string;
  name: string;
  main_task_category_name: string | null;
  sub_task_category_name: string | null;
  sub_issues_count: number;
  project_lead: string | null;
  assignees: { id: string; display_name: string; avatar: string }[];
  is_bank_wide_project: boolean;
  priority: string;
  state_name: string;
  state_color: string;
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  cycle_name: string | null;
  module_names: string[];
  total_log_time: number;
  reference_links: string[];
  progress_tracking: string | null;
};

export type THoCategorySummary = {
  department_name: string;
  workspace_slug: string;
  project_id: string;
  project_name: string;
  main_task_category_name: string | null;
  sub_task_category_name: string | null;
  work_item_count: number;
};

export class HoIssueService extends APIService {
  async listIssues(
    params: Record<string, string>
  ): Promise<{ results: THoIssue[]; count: number; next: string | null }>;
  async getCategorySummary(): Promise<THoCategorySummary[]>;
}
```

### Store Shape

```ts
// ho-issue.store.ts
export class HoIssueStore {
  issues: THoIssue[] = [];
  categorySummary: THoCategorySummary[] = [];
  isLoading = false;
  isCategoryLoading = false;
  error: string | null = null;
  currentPage = 1;
  totalCount = 0;
  nextPageUrl: string | null = null;
  orderBy = "department_name";    // default sort
  displayProperties: Partial<IIssueDisplayProperties> = { /* all true by default */ };
  fromDate: string = todayISO();  // "YYYY-MM-DD", default today
  toDate: string = todayISO();    // "YYYY-MM-DD", default today

  constructor(private service: HoIssueService) {
    makeObservable(this, { ... });
  }

  fetchIssues = async (page = 1) => { ... };  // passes fromDate/toDate in params
  fetchNextPage = async () => { ... };
  fetchCategorySummary = async () => { ... }; // passes fromDate/toDate in params
  updateOrderBy = (key: string) => { ... };
  updateDisplayProperties = (props: Partial<IIssueDisplayProperties>) => { ... };
  setDateRange = (from: string, to: string) => { ... }; // updates fromDate/toDate, resets page, re-fetches both
}
```

### Default Display Properties for HO Datasheet

All 18 HO columns enabled by default:

```ts
const HO_DEFAULT_DISPLAY_PROPERTIES: Partial<IIssueDisplayProperties> = {
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

## Related Code Files

- **Create**: `apps/web/ce/services/ho-issue.service.ts`
- **Create**: `apps/web/ce/store/ho/ho-issue.store.ts`
- **Create**: `apps/web/core/hooks/store/use-ho-issues.ts`
- **Modify**: `apps/web/ce/store/root.store.ts` — add `hoIssue: HoIssueStore`

## Embedded Rules

```
- CE stores: create in ce/store/, add to RootStore constructor, add hook in core/hooks/store/
- MobX: makeObservable (explicit actions map), runInAction() for all async mutations
- Services extend APIService from @plane/services or core APIService pattern
- Hook: useContext(StoreContext) → rootStore.hoIssue
- observer() NOT needed on the store or service (only on React components)
- Type exports: add THoIssue, THoCategorySummary to local types or package types if shared
- File <200 lines — split store if it grows (e.g., separate ho-category.store.ts)
- @plane/propel/* imports for any UI; no UI in store/service files
```

## Implementation Steps

1. **Create `ho-issue.service.ts`**:
   - Extend `APIService` (from `@plane/services` or existing pattern)
   - `listIssues(params)`: `GET /api/ho/issues/?${queryString}`
   - `getCategorySummary()`: `GET /api/ho/category-summary/`
   - Define and export `THoIssue`, `THoCategorySummary` types

2. **Create `ho-issue.store.ts`**:
   - All observables, actions defined above
   - `fetchIssues(page)`: sets loading, calls service, `runInAction` to update issues + pagination
   - `fetchNextPage()`: only calls if `nextPageUrl` not null; appends to `issues[]`
   - `fetchCategorySummary()`: sets `isCategoryLoading`, fetches, updates `categorySummary`
   - `updateOrderBy(key)`: sets `orderBy`, calls `fetchIssues(1)` to reset
   - `updateDisplayProperties(props)`: merges into `displayProperties`

3. **Create `use-ho-issues.ts`** hook:

   ```ts
   export const useHoIssues = () => {
     const { hoIssue } = useContext(StoreContext);
     return hoIssue;
   };
   ```

4. **Modify `ce/store/root.store.ts`**:
   - Import `HoIssueStore`, `HoIssueService`
   - In constructor: `this.hoIssue = new HoIssueStore(new HoIssueService())`
   - Add `hoIssue: HoIssueStore` to class declaration

5. **Verify**: Import `useHoIssues` in a test component, check store initializes, no TypeScript errors.

## Post-Phase Checklist

- [ ] `pnpm check:lint` — 0 errors on service + store + hook files
- [ ] `HoIssueStore` appears in CE root store
- [ ] `useHoIssues()` hook returns store instance
- [ ] `fetchIssues()` action calls correct API URL
- [ ] All MobX observables use `makeObservable` with explicit map
- [ ] `runInAction` wraps all async state mutations
- [ ] Types `THoIssue` and `THoCategorySummary` exported for use in components

## Todo List

- [ ] Create `ho-issue.service.ts`
- [ ] Create `ho-issue.store.ts`
- [ ] Create `use-ho-issues.ts`
- [ ] Register in `ce/store/root.store.ts`

## Success Criteria

- Store correctly fetches and holds cross-workspace issues
- Display properties default to all 18 columns enabled
- `updateOrderBy` triggers re-fetch with new sort

## Risk Assessment

- **APIService base class**: Confirm the correct base class pattern from existing CE services (e.g., `ce/services/workflow.service.ts`)
- **StoreContext shape**: Verify `StoreContext` type includes new `hoIssue` field after root store update

## Security Considerations

- Service makes authenticated requests (token injected by APIService interceptors)
- No sensitive data stored in store beyond what API returns

## Next Steps

- Phase 4 (Datasheet view) and Phase 5 (Category view) consume this store
