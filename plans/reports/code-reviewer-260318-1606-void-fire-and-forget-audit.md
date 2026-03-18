# Code Review: `void` Fire-and-Forget Pattern Audit

**Date:** 2026-03-18
**Scope:** 5 files, 8 `void` call sites
**Focus:** Silent promise rejection risks from `void` operator usage

---

## Summary

Reviewed all `void` fire-and-forget patterns across 5 files. Most are **acceptably safe** because the fired-off functions have their own internal try-catch blocks. However, there are **2 medium-risk** sites and **1 notable finding** worth addressing.

---

## Findings Table

| #   | File                                                    | Line | Call                                                                               | Returns Promise?                              | Inside try-catch?              | Has internal error handling?    | Risk                      | Notes                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------ | ------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ce/store/dashboards/dashboard.store.ts`                | 151  | `void this.fetchWidgetChartData(...)`                                              | Yes (`Promise<void>`)                         | Yes (outer)                    | Yes (own try-catch, logs error) | **SAFE**                  | Rejection caught internally, only logs. Chart shows stale/empty data on failure -- acceptable for fire-and-forget.                                                                                                                        |
| 2   | `ce/store/dashboards/dashboard.store.ts`                | 179  | `void this.fetchWidgetChartData(...)`                                              | Yes (`Promise<void>`)                         | Yes (outer)                    | Yes (own try-catch, logs error) | **SAFE**                  | Same as above. Outer catch handles the `updateWidget` API error + rollback. Chart data fetch is best-effort.                                                                                                                              |
| 3   | `core/components/issues/peek-overview/root.tsx`         | 84   | `void fetchActivities(...)`                                                        | Yes (`Promise<TIssueActivity[]>`)             | No (inside `.then()` callback) | **NO** -- re-throws errors      | **MEDIUM**                | `fetchActivities` catches errors but then `throw error` re-throws. The `void` discards this rejected promise. Unhandled rejection possible.                                                                                               |
| 4   | `core/components/issues/peek-overview/root.tsx`         | 137  | `void fetchActivities(...)`                                                        | Yes                                           | Yes (outer)                    | **NO** -- re-throws             | **LOW**                   | Inside try-catch of `addCycleToIssue`. If `fetchActivities` rejects, the outer catch won't catch it (void detaches promise). But the outer function already succeeded at its primary task (cycle added). Activity refresh is best-effort. |
| 5   | `core/components/issues/peek-overview/root.tsx`         | 172  | `void fetchActivities(...)`                                                        | Yes                                           | Yes (outer)                    | **NO** -- re-throws             | **LOW**                   | Same pattern as #4. Primary action (remove from cycle) completed. Activity refresh failure = stale activity list, non-critical.                                                                                                           |
| 6   | `core/components/issues/peek-overview/root.tsx`         | 191  | `void fetchActivities(...)`                                                        | Yes                                           | **NO**                         | **NO** -- re-throws             | **MEDIUM**                | `changeModulesInIssue` has NO try-catch at all. If `fetchActivities` rejects, it becomes an unhandled promise rejection. The `void` operator suppresses the lint warning but the rejection propagates to the global handler.              |
| 7   | `core/store/global-view.store.ts`                       | 182  | `void this.rootStore.issue.workspaceIssues.fetchIssuesWithExistingPagination(...)` | Yes (`Promise<TIssuesResponse \| undefined>`) | Yes (outer)                    | **NO** -- re-throws             | **LOW**                   | Primary action (filter update) already succeeded. Issue list re-fetch is best-effort refresh. Failure = stale issue list until next manual refresh.                                                                                       |
| 8   | `core/store/user/base-permissions.store.ts`             | 328  | `void this.fetchWorkspaceLevelProjectEntities(...)`                                | **NO** (returns `void`)                       | Yes (outer)                    | N/A                             | **SAFE (but misleading)** | CE implementation returns `void` synchronously. The `void` operator is a no-op on a non-Promise value. However, if EE overrides this method to return a Promise, it would become a silent fire-and-forget.                                |
| 9   | `ce/components/issues/worklog/worklog-delete-modal.tsx` | 85   | `void handleConfirm()`                                                             | Yes (async function)                          | **NO** (onClick handler)       | Yes (own try-catch-finally)     | **SAFE**                  | `handleConfirm` has comprehensive internal error handling. The `catch` block catches and suppresses errors (comment says "error toast handled by caller"). The `finally` resets `isSubmitting`. No rejection can escape.                  |

---

## Detailed Analysis

### MEDIUM Risk: `fetchActivities` re-throws errors

The core issue is that `IssueActivityStore.fetchActivities()` (line 231-233 of `activity.store.ts`) **catches errors then re-throws them**:

```typescript
// activity.store.ts:231-233
} catch (error) {
  this.loader = undefined;
  throw error;  // <-- re-throws!
}
```

This means `void fetchActivities(...)` will create an unhandled promise rejection whenever the activity API call fails (network error, 500, etc).

**Affected sites:** #3, #4, #5, #6 (all `fetchActivities` calls in peek-overview)

**Impact:**

- In modern browsers/Node.js, unhandled promise rejections log a console warning/error
- React does NOT catch async errors in event handlers via error boundaries
- No user-visible breakage -- activities just won't refresh, showing stale data
- Could trigger monitoring alerts if unhandled rejection tracking is enabled

**Why this matters less than it sounds:** The primary operations (update issue, add to cycle, remove from cycle, change modules) all complete successfully before `fetchActivities` fires. The activity refresh is purely supplementary UI data. A failure means the activity feed is slightly stale until the user navigates away and back.

### Finding #6 (`changeModulesInIssue`) is the worst case

```typescript
changeModulesInIssue: async (...) => {
  const promise = await issues.changeModulesInIssue(...);
  void fetchActivities(workspaceSlug, projectId, issueId);  // No try-catch anywhere!
  return promise;
},
```

This function has **zero error handling** for the main operation either. If `issues.changeModulesInIssue` throws, the error propagates up normally (which is fine). But `fetchActivities` rejecting means an unhandled rejection in the same async context with no protection at all.

### Finding #8 (`fetchWorkspaceLevelProjectEntities`) -- type mismatch concern

The abstract declaration says `void` return:

```typescript
abstract fetchWorkspaceLevelProjectEntities: (workspaceSlug: string, projectId: string) => void;
```

The CE implementation:

```typescript
fetchWorkspaceLevelProjectEntities = (workspaceSlug: string, projectId: string): void => {
  void this.store.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);
};
```

This is actually a **double `void`**: the outer method returns `void`, and internally it uses `void` on `fetchProjectDetails` (which returns `Promise<TProject>`). So the `void this.fetchWorkspaceLevelProjectEntities(...)` in `joinProject` is applying `void` to a synchronous `void` return -- completely unnecessary but harmless.

**Risk:** If an EE override returns a Promise (TypeScript allows `() => Promise<void>` to satisfy `() => void`), the `void` in `joinProject` would silently discard that Promise. This is a design smell but not a current bug.

### Finding #9 (`worklog-delete-modal.tsx`) -- well-structured

```typescript
const handleConfirm = async () => {
  if (!reason.trim() || isSubmitting) return;
  setIsSubmitting(true);
  try {
    await onConfirm(reason.trim());
    onClose();
  } catch {
    // error toast handled by caller
  } finally {
    setIsSubmitting(false);
  }
};
// ...
onClick={() => void handleConfirm()}
```

This is the **correct pattern** for `void` in an onClick. The async function has comprehensive internal error handling: all paths lead to `finally` which resets state. No rejection can escape. The `void` here is purely to satisfy `@typescript-eslint/no-floating-promises` without using `.catch()`.

---

## Recommendations

### 1. [Medium] Add `.catch()` to `fetchActivities` calls in peek-overview/root.tsx

Replace:

```typescript
void fetchActivities(workspaceSlug, projectId, issueId);
```

With:

```typescript
fetchActivities(workspaceSlug, projectId, issueId).catch(console.error);
```

This is the safer pattern for fire-and-forget when the called function re-throws. Alternatively, modify `fetchActivities` in the activity store to NOT re-throw (just log and return), but that would break the other call sites that `await` it and expect errors to propagate.

**Best fix:** Keep `fetchActivities` as-is (re-throwing is correct for callers that `await` it). Just handle the rejection at the call site when using fire-and-forget.

### 2. [Low] Add try-catch to `changeModulesInIssue` in peek-overview

This function has no error handling at all, not just for the `fetchActivities` call:

```typescript
changeModulesInIssue: async (...) => {
  try {
    const promise = await issues.changeModulesInIssue(...);
    fetchActivities(workspaceSlug, projectId, issueId).catch(console.error);
    return promise;
  } catch (error) {
    setToast({ type: TOAST_TYPE.ERROR, ... });
  }
},
```

### 3. [Low] Consider making `fetchWorkspaceLevelProjectEntities` return `Promise<void>` in the abstract

This would make the contract explicit and force proper handling.

### 4. [No action needed] Dashboard store and worklog modal

These are correctly implemented. The dashboard `fetchWidgetChartData` has its own internal try-catch that does NOT re-throw. The worklog `handleConfirm` has complete internal error handling.

---

## Verdict

| Risk Level | Count | Action                                                                   |
| ---------- | ----- | ------------------------------------------------------------------------ |
| Safe       | 4     | No changes needed                                                        |
| Low        | 3     | Optional improvements                                                    |
| Medium     | 2     | Recommend fix -- unhandled rejections from `fetchActivities` re-throwing |
| High       | 0     | --                                                                       |
| Critical   | 0     | --                                                                       |

**Overall assessment:** The `void` pattern is broadly acceptable in this codebase. The key issue is the mismatch between `fetchActivities` re-throwing errors and callers using `void` to discard the promise. The fix is straightforward: use `.catch(console.error)` instead of `void` for the 4 `fetchActivities` calls in peek-overview/root.tsx. Everything else is safe as-is.

---

## Unresolved Questions

1. Are there EE overrides of `fetchWorkspaceLevelProjectEntities` that return Promises? If so, the `void` in `joinProject` would silently swallow those rejections.
2. Is there any unhandled rejection monitoring (e.g., Sentry) configured for the frontend? If yes, the medium-risk items would generate noise in error tracking.
3. The `relation.store.ts` and `link.store.ts` files also call `this.rootIssueDetailStore.activity.fetchActivities(...)` without `void` or `await` or `.catch()` -- those are the same pattern but were not in scope. They should be reviewed too.
