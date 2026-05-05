# Phase 5 — Frontend: Dedupe + SWR Cleanup

## Context Links

- Phase 4 covers main fan-out kill; this phase polishes residual duplicates
- Components: `apps/web/ce/components/profile/today-work-items.tsx`, `overdue-work-items.tsx` (post Phase 4)
- Page: `apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx`

## Overview

- **Priority:** P3 (polish; depends on Phase 4)
- **Status:** complete
- **Effort:** 1h
- **Brief:** After Phase 4, two components still each call `/work-items/today/` + `/work-items/overdue/` independently; SWR will dedupe by key but `useTaskCategory.fetchCategories(slug)` runs in BOTH `useEffect` → fetch twice. Lift category fetch to parent or use SWR-style guard. Convert remaining read-only fetches to `useSWRImmutable`.

## Key Insights

- Post-Phase-4 there are no fan-out duplicates. Remaining minor dupes:
  1. `taskCategoryStore.fetchCategories(workspaceSlug)` called in BOTH Today and Overdue components → 2 calls, should be 1.
  2. SWR re-fetches on focus/reconnect by default — `projects/states/categories` rarely change in session → use `useSWRImmutable` or `revalidateOnFocus: false`.
- Don't over-optimize: the new aggregate endpoint already 1-call. Don't introduce `SWRConfig` global config (might affect other pages).

## Requirements

**Functional**

- `fetchCategories` runs once per workspaceSlug visit, not twice.
- Profile page loads ≤30 total HTTP calls (down from ~30 post-Phase-4 to ~28).
- No regression in category name display.

**Non-functional**

- No global SWR config change (scope: profile page only).

## Architecture

Option A: Lift `fetchCategories` to parent profile `page.tsx` or a `<ProfileWorkItemsProvider>` wrapper.
Option B: Convert `useEffect` → `useSWRImmutable("categories-" + slug, () => taskCategoryStore.fetchCategories(slug))` so SWR dedupes across component tree.

Choose **Option B** — KISS, no prop drilling, one-line change per component, dedupe via SWR's identity-based dedup.

## Related Code Files

**Modify**

- `apps/web/ce/components/profile/today-work-items.tsx` — replace `useEffect` with `useSWRImmutable`
- `apps/web/ce/components/profile/overdue-work-items.tsx` — same
- (Optional) `apps/web/ce/hooks/store/use-user-work-items.ts` — switch to `useSWRImmutable` if categories are immutable enough

**Read for context**

- `apps/web/ce/store/task-category.store.ts` (verify idempotent `fetchCategories`)
- React docs on `useSWRImmutable` (no revalidate on focus/reconnect/interval)

## Implementation Steps

1. **Replace `useEffect` for categories** in both components:

   ```ts
   // before:
   useEffect(() => {
     if (workspaceSlug) void taskCategoryStore.fetchCategories(workspaceSlug.toString());
   }, [workspaceSlug]);
   // after:
   useSWRImmutable(workspaceSlug ? `TASK_CATEGORIES_${workspaceSlug}` : null, () =>
     taskCategoryStore.fetchCategories(workspaceSlug!.toString())
   );
   ```

2. **Verify dedupe** by mounting both components → only 1 categories request observed.

3. **Optional:** if `useUserWorkItems` is converted to `useSWRImmutable`, double-check that the `workspaces` data freshness (when user joins/leaves a workspace) is still acceptable. RECOMMEND: stick with `useSWR` (default) for work items since target_date and state changes during session are common.

4. **Lint + format**.

## Todo List

- [x] Replace category `useEffect` → `useSWRImmutable` in `today-work-items.tsx`
- [x] Same in `overdue-work-items.tsx`
- [x] Verify dedupe (Network tab shows 1 categories call, not 2)
- [x] Decide on `useSWRImmutable` for work items (default: keep `useSWR`)
- [x] `pnpm check:lint`
- [x] `pnpm check:format`

## Success Criteria

- Network tab: 1 `task-categories/` request on profile page (was 2)
- Total profile-page request count ≤30
- Category names render in table

## Risk Assessment

| Risk                                                                                               | Likelihood | Impact | Mitigation                                                                    |
| -------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------- |
| `taskCategoryStore.fetchCategories` not idempotent → SWR fetcher called once doesn't refresh store | Low        | Med    | Verify store implementation; if non-idempotent, add `revalidateIfStale: true` |
| `useSWRImmutable` causes stale work-item data after long session                                   | Low        | Low    | Keep `useSWR` default for issue list; immutable only for categories           |
| Breaking other components consuming `taskCategoryStore`                                            | Low        | Low    | Only changes WHO fetches; store API unchanged                                 |

## Security Considerations

- None. Pure client-side caching change.

## Next Steps

- Phase 7 adds smoke test: mount both components, assert 1 categories call only.
- Future cleanup (out-of-scope): consider migrating `useTaskCategory` to MobX `flow` with internal cache check.
