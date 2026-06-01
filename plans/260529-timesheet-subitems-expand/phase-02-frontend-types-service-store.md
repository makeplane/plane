# Phase 02 — Frontend: types, service, store action

**Priority:** High · **Status:** ✅ Done — tsc clean · **Depends on:** Phase 01

## Related code files

**Modify**

- `packages/types/src/worklog.ts` — add `sub_issues_count?: number` to `ITimesheetRow`; add
  `ITimesheetSubIssuesResponse`.
- `apps/web/core/services/worklog.service.ts` — add `getTimesheetSubIssues(...)`.
- `apps/web/core/store/worklog.store.ts` — add `fetchTimesheetSubIssues(...)` to `IWorklogStore` +
  `WorklogStore` (sits beside existing `fetchTimesheetGrid`; hook `useWorklog` already returns the CE
  store which extends this, so no casting needed).

## Design

### Types (`worklog.ts`)

```ts
export interface ITimesheetRow {
  ...
  sub_issues_count?: number; // present when backend annotates hierarchy
}
export interface ITimesheetSubIssuesResponse {
  rows: ITimesheetRow[];
}
```

### Service (`worklog.service.ts`)

```ts
async getTimesheetSubIssues(
  workspaceSlug: string, projectId: string, parentId: string, params?: Record<string, string>
): Promise<ITimesheetSubIssuesResponse> {
  return (this.get(
    `/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/timesheet/sub-issues/`,
    { params: { parent_id: parentId, ...(params ?? {}) } }
  ) as Promise<{ data: ITimesheetSubIssuesResponse }>)
    .then(getData)
    .catch((error: { response?: { data: unknown } }) => { throw error?.response?.data; });
}
```

### Store action (`worklog.store.ts`)

Lazy per-row read — return rows, no global observable (each row holds its children in local state):

```ts
fetchTimesheetSubIssues = async (
  workspaceSlug: string,
  projectId: string,
  parentId: string,
  weekStart?: string
): Promise<ITimesheetRow[]> => {
  const params: Record<string, string> = {};
  if (weekStart) params["week_start"] = weekStart;
  const data = await this.worklogService.getTimesheetSubIssues(workspaceSlug, projectId, parentId, params);
  return data.rows;
};
```

Add to `IWorklogStore` interface + `makeObservable` actions map (`fetchTimesheetSubIssues: action`).

> **Error contract (red-team #7).** The service rethrows `error.response.data` and this store action does
> NOT catch — errors propagate to the caller. Phase 03's `handleToggleExpand` MUST wrap the call in
> `try/catch/finally` (set a per-row error state, clear `isLoading` in `finally`). Document here so the
> caller owns error handling; do not swallow errors in the store.

## Implementation steps

1. Add type field + response interface in `worklog.ts`.
2. Add `getTimesheetSubIssues` to `WorklogService`.
3. Add `fetchTimesheetSubIssues` to store interface, class, and `makeObservable`.
4. Typecheck: `pnpm --filter web exec tsc --noEmit`.

## Todo

- [x] `worklog.ts` type changes (`sub_issues_count?` + `ITimesheetSubIssuesResponse`)
- [x] service method `getTimesheetSubIssues`
- [x] store action + interface + makeObservable (CE store inherits — no CE edit needed)
- [x] typecheck clean (exit 0)

## Success criteria

- Types compile; service + store expose the lazy fetch; week_start forwarded.

## Next

- Phase 03 renders rows using `sub_issues_count` + `fetchTimesheetSubIssues`.
