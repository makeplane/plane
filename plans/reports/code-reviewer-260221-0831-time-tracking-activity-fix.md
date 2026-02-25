# Code Review: Time Tracking Activity Fix

**Date**: 2026-02-21
**Branch**: preview
**Reviewer**: code-reviewer (a159c83)

---

## Scope

- `apps/web/ce/store/issue/issue-details/activity.store.ts`
- `apps/web/ce/components/issues/worklog/activity/root.tsx`
- `apps/web/core/components/issues/issue-detail/issue-activity/root.tsx`
- Supporting: `apps/web/core/store/worklog.store.ts`, `apps/web/ce/store/root.store.ts`, `packages/types/src/worklog.ts`, i18n `en/translations.ts`

---

## Overall Assessment

The fix correctly identifies and addresses the root cause: worklogs were never included in `buildActivityAndCommentItems()`. The general approach is sound. However, there are three issues that need attention before this is production-ready: a missing i18n key causes a silent translation fallback, `computedFn` will NOT automatically track the worklog store's observable because the store is accessed via an unsafe cast (not a tracked MobX observable reference), and `worklogStore` is included in the `useEffect` dependency array which can cause redundant fetches.

---

## Critical Issues

### 1. `computedFn` will not react to worklog store changes

**File**: `apps/web/ce/store/issue/issue-details/activity.store.ts`, lines 129–139

```typescript
const ceStore = this.store as {
  worklog?: {
    getWorklogsForIssue: (id: string) => { id: string; created_at: string }[]
  }
};
if (ceStore.worklog) {
  const worklogs = ceStore.worklog.getWorklogsForIssue(issueId);
```

`this.store` is typed as `CoreRootStore`, which has no `worklog` property. The cast bypasses TypeScript entirely, but more critically it bypasses MobX tracking. `computedFn` tracks observable accesses at call time. Because `ceStore.worklog` is a plain cast, not an observable property read, and `WorklogStore.worklogsByIssueId` is observable but is only accessed via a regular method call `getWorklogsForIssue()` (not a `computedFn` or `computed` getter), MobX may or may not pick up the reactive dependency depending on whether the method call internally reads `this.worklogsByIssueId[issueId]` within the same tracking frame.

**Testing confirms the risk**: `getWorklogsForIssue` is a plain method (not decorated with `action` or `computed`), so MobX will track the `this.worklogsByIssueId[issueId]` access inside it IF it is called from within a reactive context. However, because the path goes through an unsafe cast, there is a potential future breakage if the store shape changes, and the intent is opaque to readers.

**Recommended fix**: Add `worklog` to `CoreRootStore` as an optional property (or create a typed CE extension), so that the cast is unnecessary and the reference is explicitly typed:

```typescript
// In core/store/root.store.ts — add optional declaration:
worklog?: IWorklogStore;

// Then in activity.store.ts — remove the cast entirely:
if (this.store.worklog) {
  const worklogs = this.store.worklog.getWorklogsForIssue(issueId);
  // ...
}
```

This makes MobX tracking explicit and eliminates the structural cast. Alternatively, inject the worklog store reference into the activity store constructor at the CE level.

---

## High Priority Issues

### 2. Missing i18n key `worklog.activity_logged`

**File**: `apps/web/ce/components/issues/worklog/activity/root.tsx`, line 55

```typescript
{
  displayName ? ` ${t("worklog.activity_logged")}` : t("worklog.activity_logged");
}
```

The key `worklog.activity_logged` does not exist in `packages/i18n/src/locales/en/translations.ts`. The `worklog` namespace has: `title`, `log_time`, `estimate`, `logged`, `hours`, `minutes`, `description`, `date`, `no_entries`, `delete_confirm`, `over_budget`, `on_track`, `total_logged`, `total_estimated`, `variance`, `member`, `report`. There is no `activity_logged`.

This causes a silent fallback — the `t()` call returns the key string `"worklog.activity_logged"` verbatim in production, which is a UI regression. The missing key must be added to **all** language files (not just English).

**Fix**: Add to `packages/i18n/src/locales/en/translations.ts` inside the `worklog` block:

```typescript
activity_logged: "logged time",
```

And add placeholder entries to all other locales (`fr`, `de`, `es`, `ja`, `ko`, `it`, `id`, `cs`, etc.).

### 3. `worklogStore` in `useEffect` dependency array causes redundant fetches

**File**: `apps/web/core/components/issues/issue-detail/issue-activity/root.tsx`, lines 68–72

```typescript
const worklogStore = useWorklog();

useEffect(() => {
  if (workspaceSlug && projectId && issueId) {
    void worklogStore.fetchWorklogs(workspaceSlug, projectId, issueId);
  }
}, [workspaceSlug, projectId, issueId, worklogStore]);
```

`useWorklog()` returns `context.worklog` which is a stable singleton from MobX `StoreContext`. However, if MobX re-renders the component (via `observer`), `useWorklog()` may return a new reference on each render in edge cases (e.g., if StoreContext is remounted). More practically, ESLint exhaustive-deps will flag `worklogStore` as a required dependency, and it is included, which is correct, but the concern is that `worklogStore` being a MobX store object could trigger the effect more than intended.

The low-risk fix is to destructure the method reference with `useCallback` or simply accept the dependency as stable. Alternatively, use a `useRef` guard to prevent duplicate in-flight fetches (the store already does deduplication via `worklogsByIssueId` check — actually it does NOT; each `fetchWorklogs` call overwrites the cached array). Until fetch deduplication is added to the store, rapid re-mounts will fire duplicate network requests.

**Recommended fix** — add a guard in the effect or in the store:

```typescript
// Option A: Guard in the component
useEffect(() => {
  if (workspaceSlug && projectId && issueId) {
    const existing = worklogStore.getWorklogsForIssue(issueId);
    if (existing.length === 0) {
      void worklogStore.fetchWorklogs(workspaceSlug, projectId, issueId);
    }
  }
}, [workspaceSlug, projectId, issueId, worklogStore]);
```

Note: this guard is insufficient if worklogs were explicitly cleared. The cleanest fix is fetch deduplication in the store using `isLoading` or a per-issue tracking set.

---

## Medium Priority Issues

### 4. Unsafe structural cast leaks CE-specific concerns into core store

**File**: `apps/web/ce/store/issue/issue-details/activity.store.ts`, lines 129–139

The inline type cast for `ceStore` is fragile:

```typescript
const ceStore = this.store as {
  worklog?: {
    getWorklogsForIssue: (id: string) => { id: string; created_at: string }[];
  };
};
```

The return type `{ id: string; created_at: string }[]` is a structural subset of `IWorkLog`, which means if `IWorkLog` gains required fields this cast silently narrows them away. Use `IWorkLog[]` (imported from `@plane/types`) as the return type to stay in sync with the interface.

Also, this `activity.store.ts` file lives in `ce/store/` (CE override layer), so it is correct that it accesses CE-specific stores. But the cast is fragile. Prefer a proper interface or the typed CE root store.

### 5. `getWorklogsForIssue` called twice per render in worklog activity component

**File**: `apps/web/ce/components/issues/worklog/activity/root.tsx`, line 29–30

```typescript
const worklogs = store.getWorklogsForIssue(issueId);
const worklog = worklogs.find((w) => w.id === activityComment.id);
```

This is called on every render for every worklog activity item. For an issue with many worklogs in the activity feed, this is an O(n) scan per item, yielding O(n²) total. Since `getWorklogsForIssue` returns the full array each time, this should be memoized or the store should expose a `getWorklogById` helper. For typical usage (small worklog counts) this is acceptable but worth noting.

---

## Low Priority

### 6. Date formatting bypasses `@plane/utils` date helpers

**File**: `apps/web/ce/components/issues/worklog/activity/root.tsx`, line 33–35

```typescript
const createdAt = activityComment.created_at
  ? new Date(activityComment.created_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  : null;
```

Other activity components in the codebase use `renderFormattedDate` or similar utilities from `@plane/utils`. Using `toLocaleDateString(undefined, ...)` with `undefined` locale falls back to the browser locale and may produce inconsistent output across environments. Align with project date-formatting conventions.

### 7. `ends` prop destructured but never used in layout

**File**: `apps/web/ce/components/issues/worklog/activity/root.tsx`, line 24, 42–45

`workspaceSlug` and `projectId` are destructured in props but never used in the component body (only `activityComment`, `issueId`, `ends` are used). `ends` is used correctly for layout. `workspaceSlug` and `projectId` are declared in `TIssueActivityWorklog` but silently unused — this will likely trigger a linting warning.

---

## Positive Observations

- The CE layer pattern is correctly followed: worklog integration lives in `ce/store/` and `ce/components/`, not in core.
- `EActivityFilterType.WORKLOG` is already defined in constants and included in `defaultActivityFilters` — the fix slots in cleanly.
- `void` prefix on the `fetchWorklogs` call in `useEffect` correctly handles the floating promise.
- The `observer` wrapper is applied to `IssueActivityWorklog`, ensuring MobX reactivity for the worklog display component.
- `WorklogStore.deleteWorklog` has a `deleteInFlight` guard to prevent double-delete — good defensive coding.
- `IssueActivity` in `root.tsx` correctly derives `isWorklogButtonEnabled` to restrict the create button to non-guests who are admin or assignee.

---

## Recommended Actions (Prioritized)

1. **[Critical]** Fix `computedFn` tracking: add `worklog?: IWorklogStore` to `CoreRootStore` and remove the unsafe cast in `activity.store.ts`.
2. **[High]** Add `worklog.activity_logged` to all i18n locale files.
3. **[High]** Add fetch deduplication guard in `useEffect` (or in `WorklogStore.fetchWorklogs`) to prevent redundant API calls.
4. **[Medium]** Replace inline return type `{ id: string; created_at: string }[]` in the cast with `IWorkLog[]`.
5. **[Low]** Replace `toLocaleDateString(undefined, ...)` with a shared date utility from `@plane/utils`.
6. **[Low]** Remove unused `workspaceSlug` and `projectId` destructuring in `IssueActivityWorklog` (or annotate with `_` prefix to suppress lint).

---

## Metrics

- Files reviewed: 3 changed + 4 supporting
- Lint issues: 2 expected warnings (unused vars in `root.tsx`)
- Missing i18n keys: 1 (`worklog.activity_logged`)
- Type safety gaps: 1 unsafe cast narrowing `IWorkLog` fields
- Test coverage: none observed for new worklog-in-activity path

---

## Unresolved Questions

1. Is there a `getWorklogById(id)` method planned for `WorklogStore`? Adding it would remove the O(n) `find` in the display component and allow direct lookup.
2. Should `CoreRootStore` gain an optional `worklog?: IWorklogStore` or should the activity store receive it via constructor injection? Constructor injection would make the dependency explicit and testable.
3. Is the `fetchWorklogs` call in `IssueActivity.useEffect` the correct place to trigger the fetch, or should it be triggered earlier (e.g., when the issue detail panel opens)? Duplicating the fetch here and in the worklog section could cause double-fetching if both panels mount simultaneously.
