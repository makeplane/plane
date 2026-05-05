# Code Review: Worklog Activity Feed Refresh

## Scope

- Files: `worklog-modal.tsx`, `activity/root.tsx` (both in `apps/web/ce/components/issues/worklog/`)
- LOC changed: ~6 lines (2 imports + 2 hook destructures + 2 setTimeout calls)
- Focus: Post-update/delete activity refresh for worklog operations

## Overall Assessment

The fix is **correct in intent** -- worklog update/delete were the only operations that did not refresh the activity feed after mutating. The implementation works but has several issues ranging from medium to high priority.

---

## Critical Issues

None.

---

## High Priority

### H1. setTimeout is a race condition, not a solution

**Problem:** The 1500ms delay is an arbitrary guess at Celery task completion time. Under load, Celery could take 3s+. On a fast machine, it completes in <200ms. The timeout creates two failure modes:

- Too early: activity feed fetches before Celery finishes, user still sees stale data
- Too late: user waits 1.5s for no reason

**Impact:** Unreliable UX. Users may or may not see the activity depending on backend load.

**Observation:** Every other `fetchActivities` call in the codebase fires **immediately** after the API response (see `link.store.ts:119`, `relation.store.ts:168`, `issue.store.ts:124`, `comment.store.ts:168`, `peek-overview/root.tsx:84`). Zero uses of `setTimeout` + `fetchActivities` exist outside these worklog files. The codebase pattern assumes the backend creates activity records **synchronously** before returning the API response.

**Root cause question:** Is the worklog `issue_activity.delay()` call actually necessary as async? The `link.store.ts`, `comment.store.ts`, etc. also call `issue_activity.delay()` in their backend views, yet the frontend fetches activities immediately and it works. This suggests either:

1. Celery processes are fast enough that the activity is created by the time the frontend fetch arrives, OR
2. Some of these other operations also have a subtle race but it rarely manifests

**Recommendation:** Remove the setTimeout and call `fetchActivities` immediately, matching the existing codebase pattern:

```typescript
// In worklog-modal.tsx (update path)
void fetchActivities(workspaceSlug, projectId, issueId);

// In activity/root.tsx (delete path)
void fetchActivities(workspaceSlug, projectId, issueId);
```

If the race condition is real for worklogs specifically (e.g., the Celery task does more complex work), consider a retry-with-backoff approach or a backend change to create activity synchronously.

### H2. Missing `fetchActivities` on worklog CREATE

**Problem:** `worklog-modal.tsx` line 96-102 shows that `createWorklog` does NOT trigger `fetchActivities`. The backend `create` handler (worklog.py:115) also calls `issue_activity.delay()` for creates, so the same problem exists for new worklog entries.

**Impact:** After creating a worklog, the activity feed won't show the "logged X hours" activity until the user manually refreshes or navigates away and back.

**Recommendation:** Add `fetchActivities` call after successful create too:

```typescript
} else {
  await store.createWorklog(workspaceSlug, projectId, issueId, { ... });
  void fetchActivities(workspaceSlug, projectId, issueId);
  setToast({ ... });
}
```

---

## Medium Priority

### M1. Unmounted component state update (modal close)

**Problem:** In `worklog-modal.tsx`, the flow is:

1. `setTimeout(() => void fetchActivities(...), 1500)` fires at line 90
2. `onClose()` fires at line 104, closing the modal
3. 1.5s later, the setTimeout callback runs

When `onClose()` is called, the `WorklogModal` component unmounts (the parent conditionally renders it via `isOpen`). The `fetchActivities` captured in the closure is from `useIssueDetail()` which is a store method (not component state), so it won't cause a React "setState on unmounted component" warning. However, `fetchActivities` is a store-level function that persists regardless of component lifecycle, so this is **safe in practice**.

**Verdict:** No actual bug here -- the MobX store method survives component unmount. But the pattern is fragile and non-obvious. If the approach changes to include component state updates (e.g., a loading indicator), it would break.

### M2. `activity/root.tsx` -- fetchActivities called but component may re-render mid-delete

**Problem:** In `activity/root.tsx:63-68`, after `deleteWorklog` succeeds, the component calls `fetchActivities`. But `deleteWorklog` uses optimistic update (worklog.store.ts:163-164) -- it removes the worklog from `worklogsByIssueId` immediately. Since `IssueActivityWorklog` reads `worklogs.find((w) => w.id === activityComment.id)` at line 45, the worklog reference becomes `undefined` after the optimistic update. The component may re-render with `worklog === undefined` before `handleDelete` completes.

**Impact:** Low -- the `handleDelete` function captures `worklog` in the closure before the delete call, so the check `if (!worklog) return` at line 64 passes before the optimistic update. The `fetchActivities` call uses primitive string args, not the worklog object. No actual bug, but worth noting.

### M3. eslint-disable comment on line 79

**Problem:** `// eslint-disable-next-line @typescript-eslint/no-floating-promises` on the IIFE wrapping `handleSubmit`. This suppress an important typed linting rule.

**Recommendation:** Convert the IIFE to a proper async handler or use `void`:

```typescript
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  // ... validation ...
  setIsSubmitting(true);
  void submitWorklog(); // extracted async function
};
```

This is a pre-existing issue, not introduced by this change, but worth fixing in context.

---

## Low Priority

### L1. Inconsistent placement: component-level vs store-level

**Problem:** Every other operation (links, comments, reactions, relations, attachments) calls `fetchActivities` **inside the MobX store** after the API call. Worklog is the only operation that calls it from the **component**. This means if worklog update/delete is triggered from a different component in the future, that new call site would need to remember to add `fetchActivities` too.

**Recommendation:** Move `fetchActivities` into `WorklogStore.updateWorklog()` and `WorklogStore.deleteWorklog()` to match the architectural pattern. This requires passing the `IIssueDetail` store (or just the activity store) into `WorklogStore`, which is how other stores work (they receive `rootIssueDetailStore` in constructor).

This is a larger refactor and acceptable as follow-up work.

---

## Positive Observations

1. **Correct root cause identification** -- the analysis accurately identifies that worklog was the only operation missing activity refresh
2. **`void` prefix** on the fire-and-forget `fetchActivities` call correctly handles the floating promise
3. **Error handling** in both files properly catches and displays errors via toast
4. **Optimistic delete** pattern in `worklog.store.ts` with rollback is well-implemented
5. **Delete deduplication** via `deleteInFlight` Set prevents double-delete race conditions

---

## Recommended Actions (Priority Order)

1. **[H1]** Remove `setTimeout` -- call `fetchActivities` immediately, matching all other codebase patterns
2. **[H2]** Add `fetchActivities` after `createWorklog` for consistency
3. **[M3]** Fix eslint-disable by extracting async logic (follow-up)
4. **[L1]** Consider moving `fetchActivities` into `WorklogStore` (follow-up refactor)

---

## Unresolved Questions

1. **Is the Celery race condition actually observable?** Other operations also use `issue_activity.delay()` but fetch activities immediately. Need to verify whether worklog activity creation in Celery is slower than other activity types (e.g., does it do additional DB queries or processing?). If it is, the real fix may be to make the backend create activity synchronously for worklog operations.
2. **Should `createWorklog` also refresh activities?** The backend creates activity for worklog creation too (`worklog.activity.created` type at worklog.py:115-125). If the activity feed is expected to show "X logged Y hours" entries, this is a gap.
