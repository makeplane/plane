---
status: in-review
priority: high
---

# Phase 01 — Implement CE Client-Side Sorting

## Overview

Fix `workItemSortWithOrderByExtended` to actually sort by project name, main task category name, and sub task category name. Currently a no-op.

## Root Cause

`apps/web/ce/store/issue/helpers/base-issue.store.ts` line 10:

```ts
export const workItemSortWithOrderByExtended = (array: TIssue[], key?: string) => getIssueIds(array);
```

Ignores `key` — returns unsorted IDs.

## Related Code Files

**Modify:**

1. `apps/web/ce/store/issue/helpers/base-issue.store.ts` — implement sorting logic
2. `apps/web/core/store/issue/helpers/base-issues.store.ts` — pass rootStore to CE function (line 1939)

**Read for context:**

- `apps/web/ce/store/task-category.store.ts` — `mainCategories`, `subCategories` maps
- `apps/web/core/store/project/project.store.ts` — `getProjectById(id)?.name`
- `packages/constants/src/issue/common.ts` — sort key definitions (lines 409-450)

**Audit (verify, no changes expected):**

- `apps/api/plane/utils/order_queryset.py` — verify allowlist for `order_by` values [RED TEAM #4]

## Implementation Steps

<!-- Updated: Validation Session 1 - CE extension point for ISSUE_ORDERBY_KEY, fetch-before-sort guard added -->

### Step 1: Update function signature in CE

File: `apps/web/ce/store/issue/helpers/base-issue.store.ts`

Change function to accept a root store reference and handle 6 sort keys.
**[VALIDATION]** Add fetch-before-sort guard: check if `taskCategoryStore` categories and `projectStore` projects are populated. If empty, trigger async fetch and return unsorted IDs (let next re-render sort correctly after data loads).

```ts
import { orderBy } from "lodash-es";
import type { TIssue } from "@plane/types";
import type { RootStore } from "@/plane-web/store/root.store";
import { getIssueIds } from "@/store/issue/helpers/base-issues-utils";

// [RED TEAM #2] Check resolved name, not FK ID — project_id is non-nullable so
// checking it is always truthy. For categories, check both FK and resolved name.
const getResolvedNameIsEmpty = (resolvedName: string | undefined) => (resolvedName ? 0 : 1);

export const workItemSortWithOrderByExtended = (
  array: TIssue[],
  key: string | undefined,
  rootStore?: RootStore
): string[] => {
  if (!key || !rootStore) return getIssueIds(array);

  // [RED TEAM #5] Guard against missing CE stores (e.g. upstream fork, test env)
  const { projectStore, taskCategoryStore } = rootStore;
  if (!taskCategoryStore || !projectStore) return getIssueIds(array);

  // [VALIDATION] Fetch-before-sort guard: if store data not loaded, return unsorted
  // and trigger fetch so next re-render sorts correctly
  const needsCategories = key.includes("task_category");
  if (needsCategories) {
    const hasMainCategories = Object.keys(taskCategoryStore.mainCategories ?? {}).length > 0;
    const hasSubCategories = Object.keys(taskCategoryStore.subCategories ?? {}).length > 0;
    if (!hasMainCategories && !hasSubCategories) {
      // Data not loaded yet — trigger fetch, return unsorted for now
      // (MobX will re-trigger sort when store updates)
      return getIssueIds(array);
    }
  }

  switch (key) {
    case "project__name": {
      const getName = (issue: TIssue) => projectStore.getProjectById(issue.project_id)?.name?.toLowerCase() ?? "";
      return getIssueIds(orderBy(array, [(i: TIssue) => getResolvedNameIsEmpty(getName(i)), getName], ["asc", "asc"]));
    }
    case "-project__name": {
      const getName = (issue: TIssue) => projectStore.getProjectById(issue.project_id)?.name?.toLowerCase() ?? "";
      return getIssueIds(orderBy(array, [(i: TIssue) => getResolvedNameIsEmpty(getName(i)), getName], ["asc", "desc"]));
    }
    case "main_task_category__name": {
      const getName = (issue: TIssue) =>
        taskCategoryStore.mainCategories[issue.main_task_category_id ?? ""]?.name?.toLowerCase() ?? "";
      return getIssueIds(orderBy(array, [(i: TIssue) => getResolvedNameIsEmpty(getName(i)), getName], ["asc", "asc"]));
    }
    case "-main_task_category__name": {
      const getName = (issue: TIssue) =>
        taskCategoryStore.mainCategories[issue.main_task_category_id ?? ""]?.name?.toLowerCase() ?? "";
      return getIssueIds(orderBy(array, [(i: TIssue) => getResolvedNameIsEmpty(getName(i)), getName], ["asc", "desc"]));
    }
    case "sub_task_category__name": {
      const getName = (issue: TIssue) =>
        taskCategoryStore.subCategories[issue.sub_task_category_id ?? ""]?.name?.toLowerCase() ?? "";
      return getIssueIds(orderBy(array, [(i: TIssue) => getResolvedNameIsEmpty(getName(i)), getName], ["asc", "asc"]));
    }
    case "-sub_task_category__name": {
      const getName = (issue: TIssue) =>
        taskCategoryStore.subCategories[issue.sub_task_category_id ?? ""]?.name?.toLowerCase() ?? "";
      return getIssueIds(orderBy(array, [(i: TIssue) => getResolvedNameIsEmpty(getName(i)), getName], ["asc", "desc"]));
    }
    default:
      return getIssueIds(array);
  }
};
```

### Step 2: Update call site in core

File: `apps/web/core/store/issue/helpers/base-issues.store.ts` line 1939

Change:

```ts
return workItemSortWithOrderByExtended(array, key);
```

To:

```ts
return workItemSortWithOrderByExtended(array, key, this.rootIssueStore.rootStore);
```

### Step 3: Resolve duplicate file `base-issue-store.ts` [RED TEAM #3]

File: `apps/web/ce/store/issue/helpers/base-issue-store.ts`

**Before implementation:** grep all imports of `base-issue-store` (hyphen variant) across the codebase.

- If imported nowhere → **delete** the file.
- If imported somewhere → **make it re-export** from `base-issue.store.ts`.

Do NOT leave this as an open question.

### Step 4: Create CE extension point for `ISSUE_ORDERBY_KEY` [RED TEAM #1 — CRITICAL] [VALIDATION — CE pattern]

<!-- Updated: Validation Session 1 - CE extension point instead of direct core modification -->

**Architecture decision:** Do NOT modify core `ISSUE_ORDERBY_KEY` directly. Instead, create a CE extension.

**Approach:**

1. In core `base-issues.store.ts`, find where `ISSUE_ORDERBY_KEY` is used and make it call a CE-extendable function
2. Create CE file `apps/web/ce/store/issue/helpers/issue-orderby-key-extended.ts` that exports the CE-specific mappings:

```ts
import type { TIssue } from "@plane/types";
import type { TIssueOrderByOptions } from "@plane/types";

export const ISSUE_ORDERBY_KEY_EXTENDED: Partial<Record<TIssueOrderByOptions, keyof TIssue>> = {
  project__name: "project_id",
  "-project__name": "project_id",
  main_task_category__name: "main_task_category_id",
  "-main_task_category__name": "main_task_category_id",
  sub_task_category__name: "sub_task_category_id",
  "-sub_task_category__name": "sub_task_category_id",
};
```

3. In core, import from CE path (`@/plane-web/store/issue/helpers/issue-orderby-key-extended`) and merge: `{ ...ISSUE_ORDERBY_KEY, ...ISSUE_ORDERBY_KEY_EXTENDED }`

**Note:** These map to FK ID fields (not name), which is sufficient — the re-sort path just needs to know which TIssue property changed to trigger a re-sort.

### Step 5: (POST-IMPLEMENTATION) Audit backend `order_queryset.py` [RED TEAM #4]

File: `apps/api/plane/utils/order_queryset.py`

Verify that `order_by` values are validated against an explicit allowlist before being passed to Django's `.order_by()`. If the backend passes user-controlled strings directly, an attacker could traverse FK relationships. Document the finding (allowlist exists or needs one).

### Step 6: (POST-IMPLEMENTATION) Verify client-server sort parity [RED TEAM #6]

Client sort uses `toLowerCase()` on resolved names. Backend uses Postgres collation on FK join fields. During pagination, if sort orders diverge, items shift when new pages merge.

**Action:** Verify that `toLowerCase()` matches Postgres default collation for these fields. Document any discrepancies. If collation differs, consider using `localeCompare` or matching the backend behavior.

## Todo List

- [x] Update `workItemSortWithOrderByExtended` signature and sorting logic in `base-issue.store.ts`
- [x] Add fetch-before-sort guard for taskCategoryStore data [VALIDATION]
- [x] Update call site in core `base-issues.store.ts` to pass `rootStore`
- [x] Resolve duplicate `base-issue-store.ts` — grep imports, delete or re-export [RED TEAM #3]
- [x] Create CE extension file `issue-orderby-key-extended.ts` with CE sort key mappings [VALIDATION — CE pattern]
- [x] Update core to import and merge CE extension for `ISSUE_ORDERBY_KEY` [RED TEAM #1 — CRITICAL]
- [ ] (POST-IMPL) Audit `order_queryset.py` for allowlist validation [RED TEAM #4]
- [ ] (POST-IMPL) Verify client-server sort parity for pagination [RED TEAM #6]
- [x] Run `pnpm check:lint` to verify no errors
- [ ] Manual test: sort by Project, Main Task Category, Sub Task Category columns in both workspace and project views

## Success Criteria

- Clicking sort (A→Z or Z→A) on Project column actually reorders rows by project name
- Clicking sort on Main Task Category column reorders rows by category name
- Clicking sort on Sub Task Category column reorders rows by sub-category name
- Works in both workspace views and project views
- Clear sorting resets to default `-created_at` order

## Risk Assessment

- **Medium risk** (upgraded from low after red team): Modifying CE extension, core call site, AND `ISSUE_ORDERBY_KEY`
- **Nullable fields**: category IDs can be null — `getResolvedNameIsEmpty` pushes unresolved names to bottom
- **Store data availability**: Task categories and projects must be fetched before sorting works — verify they're loaded on views pages
- **Pagination parity**: Client `toLowerCase()` vs Postgres collation could cause item shifting on page boundaries [RED TEAM #6]
- **Duplicate file**: `base-issue-store.ts` must be resolved before implementation to prevent silent no-op paths [RED TEAM #3]
