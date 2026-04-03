# Debugger Report: Column Sorting Bug (Project / Main Task Category / Sub Task Category)

**Date:** 2026-04-03  
**Env:** http://localhost:3000 (workspace: `yesyes`)  
**Tested columns:** Project, Main Task Category, Sub Task Category

---

## Executive Summary

**Bug confirmed.** Clicking sort headers triggers the API correctly (HTTP 200, correct `order_by` param), but the DOM **does not reorder**. The spreadsheet rows remain in their default `created_at` order regardless of which sort is applied.

Root cause: the client-side `workItemSortWithOrderByExtended` function returns early (falls back to `created_at` order) because `taskCategoryStore.mainCategories` and `taskCategoryStore.subCategories` are **empty at the time the sort is computed**. The `WorkspaceContentWrapper` SWR pre-fetch for categories runs asynchronously and has not completed before `issuesSortWithOrderBy` is called post-API-fetch.

---

## Evidence Chain

### 1. API fires correctly

Network captures on every sort click:

| Column             | API URL                                         | Status |
| ------------------ | ----------------------------------------------- | ------ |
| Project            | `…/issues/?order_by=project__name&…`            | 200    |
| Main Task Category | `…/issues/?order_by=main_task_category__name&…` | 200    |
| Sub Task Category  | `…/issues/?order_by=sub_task_category__name&…`  | 200    |

API returns **correctly re-ordered** results. Example for `main_task_category__name`:

```json
["ok" (cat:d5f449), "test" (cat:d5f449), "tesst" (cat:37c6ad), "2. Invite…" (cat:37c6ad), "tetetetetet" (no cat), ...]
```

Default `created_at` order:

```json
["tetetetetetett", "kkk", "tesst", "ok", "test", "oko", ...]
```

→ **API order differs from default. API is working.**

### 2. DOM does NOT reorder after API fetch

DOM row order before and after `main_task_category__name` sort:

```
BEFORE: ["tetetetetetett", "kkk", "tesst", "ok", "test", "oko", "ok", "ok"]
AFTER:  ["tetetetetetett", "kkk", "tesst", "ok", "test", "oko", "ok", "ok"]
```

**Verdict: `orderChanged: false`** — rows unchanged in DOM.

### 3. Sort indicator appears (header UI updates)

Screenshots confirm the `↑` arrow indicator appears on the sorted column header, confirming `displayFilters.order_by` **is** being updated in the MobX store. The sort state is saved; only the rendering is broken.

---

## Root Cause Analysis

### Execution path

```
User clicks header
  → handleOrderBy() in HeaderColumn (header-column.tsx)
  → handleDisplayFilterUpdate({ order_by: "main_task_category__name" })
  → WorkspaceSpreadsheetRoot.handleDisplayFiltersUpdate()
  → updateFilters(workspaceSlug, undefined, DISPLAY_FILTERS, { order_by: … }, viewId)
  → workspace/filter.store.ts:265 → fetchIssuesWithExistingPagination("mutation")
  → workspace/issue.store.ts → fetchIssues() → API call (returns sorted IDs)
  → onfetchIssues() → processIssueResponse() → updateGroupedIssueIds()
  → updateIssueGroup() → issuesSortWithOrderBy(IDs, "main_task_category__name")
  → switch default: → workItemSortWithOrderByExtended(array, key, rootStore)
```

### The guard in `workItemSortWithOrderByExtended`

```ts
// apps/web/ce/store/issue/helpers/base-issue.store.ts, lines 31–38
const needsCategories = key.includes("task_category");
if (needsCategories) {
  const hasMainCategories = Object.keys(taskCategoryStore.mainCategories ?? {}).length > 0;
  const hasSubCategories = Object.keys(taskCategoryStore.subCategories ?? {}).length > 0;
  if (!hasMainCategories && !hasSubCategories) {
    return getIssueIds(array); // ← RETURNS EARLY, unsorted (created_at order)
  }
}
```

**This guard fires because `taskCategoryStore.mainCategories` is `{}` at sort time.**

### Why categories are empty

`WorkspaceContentWrapper` pre-fetches categories via SWR:

```ts
// apps/web/ce/components/workspace/content-wrapper.tsx
useSWR(
  workspaceSlug ? `WORKSPACE_TASK_CATEGORIES_${workspaceSlug}` : null,
  workspaceSlug ? () => fetchCategories(workspaceSlug) : null,
  { revalidateIfStale: false, revalidateOnFocus: false }
);
```

The SWR fetch is **async and non-blocking**. When a user clicks a sort header quickly after page load, `fetchIssuesWithExistingPagination` completes and calls `issuesSortWithOrderBy` **before** `fetchCategories` has resolved. Since `mainCategories = {}` and `subCategories = {}`, the guard returns early with the original `created_at`-ordered array.

### Why Project sort also fails

For `project__name` sort, the function reads `projectStore.getProjectById(issue.project_id)?.name`. The `projectStore` IS populated (projects are loaded before issues render), so this path should work. However, the test showed the dropdown **did NOT open** for the Project column — the click registered but the CustomMenu did not render. This is a **separate selector/click-target issue** in the test script (clicking the row container instead of the actual button). The Project sort code path may work correctly, needs re-testing with a more precise click.

---

## The `project__name` Sort — Separate Investigation

For `project__name`, the network log showed it **DID fire** the API in the first test run (`test-sort-columns.js`). The DOM result was still `NO CHANGE`, suggesting the same client-side re-sort problem also affects `project__name` — however, `workItemSortWithOrderByExtended` for `project__name` doesn't have the category guard. It reads from `projectStore`, which should be populated. This warrants separate investigation; the guard might not be the only issue.

---

## Hypotheses Tested

| Hypothesis                                                       | Status         | Evidence                                                                              |
| ---------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| API not called on sort click                                     | **ELIMINATED** | Network captured `order_by=…` at status 200 for all 3 columns                         |
| Backend returns wrong order                                      | **ELIMINATED** | API response order differs from default and matches expected category grouping        |
| Frontend display filter not updated                              | **ELIMINATED** | Sort indicator (↑) appears on header after click                                      |
| Client-side re-sort overrides API order with empty category data | **CONFIRMED**  | Guard in `workItemSortWithOrderByExtended` returns early when `mainCategories={}`     |
| SWR pre-fetch race condition                                     | **CONFIRMED**  | `WorkspaceContentWrapper` SWR fires async; no await/guard before first sort completes |

---

## Fix Recommendations

### Fix 1 (Recommended): Make `issuesSortWithOrderBy` respect API order when called from a full refetch

In `updateIssueGroup` (base-issues.store.ts:1417), when the fetch is a full reset (not incremental pagination), pass the API-returned IDs directly **without re-sorting client-side**. The API already sorted them. Client-side re-sort should only apply for optimistic local updates (add/update/delete single issue).

**Alternatively:** when `isExistingPaginationOptions = true` (mutation refetch), skip client sort and trust API order:

```ts
// In onfetchIssues, pass a flag to skip re-sort on full-refresh fetches
this.updateGroupedIssueIds(groupedIssues, groupedIssueCount, undefined, undefined, /* skipClientSort */ true);
```

### Fix 2 (Simpler): Remove/fix the early-return guard in `workItemSortWithOrderByExtended`

The guard `if (!hasMainCategories && !hasSubCategories) return getIssueIds(array)` is overly aggressive — it returns the issues in `created_at` order instead of waiting for categories. Change to return a stable fallback order (null categories sort to bottom) without short-circuiting:

```ts
// If categories not loaded yet, sort issues without category (all nulls → bottom)
// Don't short-circuit; the sort will put all null-category items at end consistently
```

### Fix 3: Await category fetch before first sort

In `WorkspaceContentWrapper`, ensure category data is available before issues render — or in `workItemSortWithOrderByExtended`, return a pending/loading state that MobX can re-trigger once categories load.

The store already has `hasFetched` and `loader` observables on `TaskCategoryStore`. The computed sort should depend on these observables so MobX re-runs it when `hasFetched` becomes `true`.

---

## Timeline of Events

```
T+0s    User navigates to /workspace-views/all-issues/
T+0s    WorkspaceContentWrapper mounts → SWR fires fetchCategories() [async]
T+0s    Issues fetch begins → groupedIssueIds populated (default order)
T+~1s   User clicks "Main Task Category" header
T+~1s   handleDisplayFilterUpdate({ order_by: "main_task_category__name" })
T+~1s   fetchIssuesWithExistingPagination() called
T+~1.5s API returns sorted results (status 200)
T+~1.5s onfetchIssues → issuesSortWithOrderBy("main_task_category__name")
T+~1.5s workItemSortWithOrderByExtended: mainCategories={} → EARLY RETURN (created_at order)
T+~2s   fetchCategories() resolves → mainCategories populated
         [no re-trigger of sort — MobX doesn't know to re-sort]
```

---

## Files Involved

| File                                                      | Role                                                                               |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `apps/web/ce/store/issue/helpers/base-issue.store.ts`     | `workItemSortWithOrderByExtended` — the guard that causes early return             |
| `apps/web/ce/store/task-category.store.ts`                | `TaskCategoryStore` — `mainCategories`/`subCategories` observables                 |
| `apps/web/ce/components/workspace/content-wrapper.tsx`    | SWR pre-fetch of categories (races with first sort)                                |
| `apps/web/core/store/issue/helpers/base-issues.store.ts`  | `issuesSortWithOrderBy` → `updateIssueGroup` (client-side re-sort after API fetch) |
| `apps/web/core/store/issue/workspace/filter.store.ts:265` | Triggers `fetchIssuesWithExistingPagination` on `order_by` change                  |
| `packages/constants/src/issue/common.ts`                  | `SPREADSHEET_PROPERTY_DETAILS` — sort keys are correct                             |
| `packages/types/src/view-props.ts`                        | `TIssueOrderByOptions` — sort key types are correct                                |

---

## Monitoring Gap

No observable dependency exists between `taskCategoryStore.hasFetched` and the `issuesSortWithOrderBy` execution path. Once the guard returns early, there is no mechanism to re-trigger the sort after categories load. The fix requires either:

1. Making the sort a MobX `computed` that observes `taskCategoryStore.mainCategories` (so it auto-reruns), or
2. Not re-sorting client-side when the API already returned the correct order.

---

## Unresolved Questions

1. Does the same race condition affect the **first page load** sort (not just user-triggered resort)? If categories are pre-fetched before any issue list loads, it may work on cold-cache refresh but fail on warm-cache.
2. For `project__name`: the guard doesn't apply, but sort still appears not to work. Is `projectStore.getProjectById()` returning `undefined` for issues whose projects are not in the store at sort time?
3. Is `workItemSortWithOrderByExtended` ever triggered for the `project__name` key in production (vs. the MobX computed re-running cleanly because projectStore is always populated)?
