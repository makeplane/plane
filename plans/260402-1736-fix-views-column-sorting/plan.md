---
status: in-progress
priority: high
blockedBy: []
blocks: []
---

# Fix Views Column Sorting: Project, Main Task Category, Sub Task Category

## Problem

When sorting by **Project**, **Main Task Category**, or **Sub Task Category** columns from the spreadsheet header in both workspace and project views, rows don't get sorted. The sort dropdown UI works (shows arrows, sends `order_by`) but data order doesn't change.

## Root Cause

The CE extension function `workItemSortWithOrderByExtended` is a **no-op** — it ignores the `key` parameter and returns unsorted IDs. When the core `issuesSortWithOrderBy` switch hits `default`, it delegates to this function which does nothing.

Additionally, `ISSUE_ORDERBY_KEY` (core) doesn't map CE sort keys to TIssue properties, so `orderByKey` returns `undefined` — preventing re-sort on issue updates.

## Affected Files

| File                                                  | Role                                    |
| ----------------------------------------------------- | --------------------------------------- |
| `apps/web/ce/store/issue/helpers/base-issue.store.ts` | CE sort extension (FIX HERE)            |
| `packages/types/src/view-props.ts`                    | Type definitions (already correct)      |
| `packages/constants/src/issue/common.ts`              | Sort key definitions (already correct)  |
| `apps/api/plane/utils/order_queryset.py`              | Backend sort (works fine for FK fields) |

## Phases

- [Phase 01 — Implement CE client-side sorting](./phase-01-implement-ce-sorting.md) `[in-review]` - Implementation complete, pending manual testing

## Key Data

- `project__name` / `-project__name` → sort by `project_id` → resolve via `projectStore.getProjectById(id)?.name`
- `main_task_category__name` / `-main_task_category__name` → sort by `main_task_category_id` → resolve via `taskCategoryStore.mainCategories[id]?.name`
- `sub_task_category__name` / `-sub_task_category__name` → sort by `sub_task_category_id` → resolve via `taskCategoryStore.subCategories[id]?.name`

## Red Team Review

### Session — 2026-04-02

**Findings:** 10 (6 accepted, 4 rejected)
**Severity breakdown:** 1 Critical, 2 High, 3 Medium accepted

| #   | Finding                                                          | Severity | Disposition | Applied To |
| --- | ---------------------------------------------------------------- | -------- | ----------- | ---------- |
| 1   | `ISSUE_ORDERBY_KEY` not updated — re-sort on mutation broken     | Critical | Accept      | Phase 01   |
| 2   | `getSortOrderToFilterEmptyValues` checks wrong field for project | High     | Accept      | Phase 01   |
| 3   | Duplicate file strategy is a question, not a plan                | High     | Accept      | Phase 01   |
| 4   | Backend `order_queryset.py` not audited for ORM injection        | High     | Accept      | Phase 01   |
| 5   | No guard against missing `taskCategoryStore`                     | Medium   | Accept      | Phase 01   |
| 6   | Client-side sort vs paginated server data — no parity analysis   | Medium   | Accept      | Phase 01   |
| 7   | `taskCategoryStore` fetch failure is permanent                   | High     | Reject      | —          |
| 8   | Full `RootStore` passed — privilege escalation                   | High     | Reject      | —          |
| 9   | `as keyof TIssue` unsafe cast                                    | Medium   | Reject      | —          |
| 10  | No CSRF/auth for view preference                                 | Medium   | Reject      | —          |

## Validation Log

### Session 1 — 2026-04-02

**Trigger:** Pre-implementation validation of plan assumptions and architecture
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** The plan adds CE sort keys directly to `ISSUE_ORDERBY_KEY` in core (`base-issues.store.ts`). This violates the CE pattern rule (never modify core). Should we create a CE extension point instead?
   - Options: CE extension point (Recommended) | Direct core modification | Skip ISSUE_ORDERBY_KEY update
   - **Answer:** CE extension point
   - **Rationale:** Maintains CE/core separation. Core `ISSUE_ORDERBY_KEY` must be extendable from CE, not modified directly.

2. **[Scope]** Steps 5 (audit order_queryset.py) and 6 (verify client-server sort parity) are audit-only. Should these block implementation?
   - Options: Audit after implementation (Recommended) | Audit before implementation | Skip audits entirely
   - **Answer:** Audit after implementation
   - **Rationale:** Unblocks the sorting fix. Audits are safety checks, not prerequisites for the client-side fix.

3. **[Assumptions]** The plan assumes taskCategoryStore and project data are already loaded when sorting triggers. Is fallback-to-bottom acceptable?
   - Options: Accept fallback behavior (Recommended) | Add fetch-before-sort guard | Show loading state
   - **Answer:** Add fetch-before-sort guard
   - **Rationale:** User wants store data verified/fetched before sorting to avoid incorrect sort order from unresolved names.

4. **[Risk]** The duplicate file `base-issue-store.ts` (hyphen variant) needs resolution. Preference if imported somewhere?
   - Options: Delete if unused, re-export if used (Recommended) | Always delete and fix imports | Keep both files
   - **Answer:** Delete if unused, re-export if used
   - **Rationale:** Clean up the ambiguity but don't break existing imports.

#### Confirmed Decisions

- **ISSUE_ORDERBY_KEY:** CE extension point pattern, NOT direct core modification
- **Audit scope:** Implement first, audit backend after
- **Store data:** Add fetch-before-sort guard for taskCategoryStore/projectStore
- **Duplicate file:** Grep imports → delete or re-export

#### Action Items

- [ ] Design CE extension point for `ISSUE_ORDERBY_KEY` (merge pattern)
- [ ] Add store data availability check before sorting, trigger fetch if needed
- [ ] Move audit steps (5, 6) to a follow-up task, not blocking

#### Impact on Phases

- Phase 01: Step 4 rewritten — CE extension point instead of direct core edit. Step 1 updated — add fetch guard for store data. Steps 5-6 deprioritized to post-implementation.
