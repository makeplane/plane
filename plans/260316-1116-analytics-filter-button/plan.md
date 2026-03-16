---
title: "Analytics: Add Filter Button"
description: "Filter button (left of All Projects) for Projects, Work Items, Cycles, Modules, Intake tabs"
status: completed
priority: P2
effort: 2h
branch: ngoc-feat/workspaces
tags: [analytics, filter, ui, ce]
created: 2026-03-16
---

# Analytics Filter Button

## Summary

Add a filter dropdown button to the Analytics header bar, positioned LEFT of the "All Projects" button. The button only renders on filterable tabs (`projects`, `work-items`, `cycles`, `modules`, `intake`) and is hidden on `overview` and `users` tabs. Follows the same UI pattern as the Views feature (`FiltersDropdown` + selection panel).

## Phases

| Phase                | File                                                           | Effort |
| -------------------- | -------------------------------------------------------------- | ------ |
| 1 - Types & Store    | [phase-01-types-and-store.md](./phase-01-types-and-store.md)   | 30min  |
| 2 - Filter Selection | [phase-02-filter-selection.md](./phase-02-filter-selection.md) | 30min  |
| 3 - Filter Button    | [phase-03-filter-button.md](./phase-03-filter-button.md)       | 20min  |
| 4 - Wire Up          | [phase-04-wire-up.md](./phase-04-wire-up.md)                   | 20min  |

## File Map

**New:**

- `apps/web/ce/components/analytics/filters/filter-date.tsx` -- generic date filter (title prop)
- `apps/web/ce/components/analytics/filters/filter-selection.tsx`
- `apps/web/ce/components/analytics/filters/analytics-filter-button.tsx`

**Modified:**

- `packages/types/src/analytics.ts` -- add `TAnalyticsTabFilters`
- `apps/web/core/store/analytics.store.ts` -- add `tabFilters` observable + `updateTabFilters` action
- `apps/web/ce/store/analytics.store.ts` -- (may need minor update if CE overrides store)
- `apps/web/core/components/analytics/analytics-filter-actions.tsx` -- accept `activeTab`, render CE filter button
- `apps/web/app/(all)/[workspaceSlug]/(projects)/analytics/[tabId]/page.tsx` -- pass `selectedTab` prop

## Key Reusable Components

- `FiltersDropdown` from `@/components/issues/issue-layouts/filters`
- `FilterCreatedDate` (or equivalent date filter) from `@/components/common/filters/` — reuse for start_date and target_date
- `FilterHeader`, `FilterOption` from `@/components/issues/issue-layouts/filters`

## Validation Log

### Session 1 — 2026-03-16

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** The plan adds `tabFilters` to the store and builds the UI, but never shows how filter values are passed to the analytics API calls. Are the filters UI-only (display state, wired to API later), or should API integration be in scope now?
   - Options: UI-only for now | Include API wiring
   - **Answer:** UI-only for now
   - **Custom input:** "UI only nhưng tôi đổi ý rồi tôi chỉ cần 2 trường filter start date và target date thôi những trường kia không quan trọng"
   - **Rationale:** Scope reduced to only `start_date` + `target_date` filters. All other filter fields (priority, assignee_ids, state_group, label_ids, created_at) are dropped. API integration is deferred.

2. **[Architecture]** Phase 2 maps `FilterCreatedBy` component to `assignee_ids`. Should this represent 'Assignee' or 'Created By'?
   - Options: Assignee (assignee_ids) | Created By (created_by_ids)
   - **Answer:** Moot — both fields dropped per scope change above

3. **[Behavior]** When the user switches tabs, should active filters reset or be preserved?
   - Options: Clear on tab switch | Persist across tabs
   - **Answer:** Clear on tab switch
   - **Rationale:** `clearAllTabFilters` must be called when tab changes (in page.tsx or a useEffect).

4. **[Type scope]** `TAnalyticsTabFilters` includes unused fields (state_group, label_ids). Remove or keep?
   - Options: Remove unused fields | Keep as placeholders
   - **Answer:** Remove unused fields
   - **Rationale:** Type should only contain fields with UI: `start_date` and `target_date`.

#### Confirmed Decisions

- Filter fields: only `start_date?: string[] | null` and `target_date?: string[] | null`
- API integration: out of scope (UI state only)
- Tab switch: clear all filters
- Type: lean, no placeholder fields

#### Action Items

- [ ] Update `TAnalyticsTabFilters` to only `start_date` + `target_date`
- [ ] Update Phase 2 to only implement 2 date filter sections
- [ ] Remove Priority, CreatedBy, memberIds references from all phases
- [ ] Add tab-change filter clear logic to Phase 4

#### Impact on Phases

- Phase 1: Rewrite `TAnalyticsTabFilters` — only `start_date` and `target_date`
- Phase 2: Replace Priority/CreatedBy/CreatedDate sections with 2 date filter sections; remove `memberIds` prop; simplify component
- Phase 3: Remove `workspaceMemberIds` usage; `isFiltersApplied` logic unchanged
- Phase 4: Add `clearAllTabFilters` call on tab change

---

### Session 2 — 2026-03-16

**Trigger:** Re-validation to resolve implementation-level decisions before coding
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** FilterCreatedDate has a hardcoded 'Created date' title and no label prop. For start_date and target_date sections, which approach should we take?
   - Options: Generic FilterDate + title prop | Duplicate FilterCreatedDate pattern
   - **Answer:** Generic FilterDate + title prop
   - **Rationale:** Create one `filter-date.tsx` component in `ce/components/analytics/filters/` with a `title` prop. Reuse for both start_date and target_date. DRY, ~80 lines max.

2. **[Behavior]** FilterCreatedDate requires a searchQuery prop. Should AnalyticsFilterSelection include a search input, or skip it?
   - Options: Skip search (pass empty string) | Include search bar
   - **Answer:** Skip search (pass empty string)
   - **Rationale:** Pass `searchQuery=""` so all date options always show. Keeps the filter panel minimal with no search overhead.

3. **[Implementation]** Phase 4 useEffect — should clearAllTabFilters be in the dependency array?
   - Options: Yes, include in deps | Disable exhaustive-deps comment
   - **Answer:** Yes, include in deps
   - **Rationale:** MobX actions are stable references, so including in deps is safe and avoids lint suppression comments.

#### Confirmed Decisions

- Date filter component: generic `FilterDate` with `title` prop (DRY, in CE filters dir)
- Search in filter panel: skip — pass `searchQuery=""`
- useEffect deps: `[selectedTab, clearAllTabFilters]`

#### Action Items

- [ ] Create `ce/components/analytics/filters/filter-date.tsx` (generic, accepts `title` prop)
- [ ] Update Phase 2 to use `FilterDate` instead of duplicating `FilterCreatedDate`
- [ ] Update Phase 4 `useEffect` deps to include `clearAllTabFilters`

#### Impact on Phases

- Phase 2: Add `filter-date.tsx` to file map; update implementation to use it with title prop; pass `searchQuery=""`
- Phase 4: Update useEffect to `[selectedTab, clearAllTabFilters]`
