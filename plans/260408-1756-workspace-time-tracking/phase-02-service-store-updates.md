# Phase 02 — Service + Store Updates

## Context Links

- Worklog service: `apps/web/core/services/worklog.service.ts`
- CE worklog store: `apps/web/ce/store/worklog.store.ts`
- Types: `packages/types/src/workspace.ts`

## Overview

- **Priority**: P1 (blocks Phase 3)
- **Status**: Pending
- **Description**: Add `getWorkspaceAnalyticsTimesheet` to service, `fetchWorkspaceAnalyticsTimesheet` to CE store.

## Key Insights

- Service already has cross-workspace timesheet/capacity methods — follow same pattern
- CE store already extends base `WorklogStore` with `makeObservable` — add new observable + action
- Response type: reuse `IAnalyticsTimesheetResponse` (same shape as project analytics)

## Related Code Files

### Modify

- `apps/web/core/services/worklog.service.ts` — add `getWorkspaceAnalyticsTimesheet` method
- `apps/web/ce/store/worklog.store.ts` — add observable + action

### No new files needed

## Implementation Steps

### 1. Service method (`worklog.service.ts`)

Add after `getAnalyticsTimesheet` (line ~176):

```typescript
async getWorkspaceAnalyticsTimesheet(
  workspaceSlug: string,
  params?: Record<string, string>
): Promise<IAnalyticsTimesheetResponse> {
  return (
    this.get(`/api/workspaces/${workspaceSlug}/time-tracking/analytics/timesheet/`, {
      params,
    }) as Promise<{ data: IAnalyticsTimesheetResponse }>
  )
    .then(getData)
    .catch((error: { response?: { data: unknown } }) => {
      throw error?.response?.data;
    });
}
```

### 2. CE Store (`worklog.store.ts`)

Add to `ICEWorklogStore` interface:

```typescript
workspaceAnalyticsTimesheetData: IAnalyticsTimesheetResponse | null;
isWorkspaceAnalyticsTimesheetLoading: boolean;
fetchWorkspaceAnalyticsTimesheet(workspaceSlug: string, weekStart?: string): Promise<void>;
```

Add to `CEWorklogStore` class:

- New observables: `workspaceAnalyticsTimesheetData = null`, `isWorkspaceAnalyticsTimesheetLoading = false`
- Register in `makeObservable`: both as `observable`, action as `action`
- New action method (follows same pattern as `fetchAnalyticsTimesheet`):

```typescript
fetchWorkspaceAnalyticsTimesheet = async (workspaceSlug: string, weekStart?: string): Promise<void> => {
  this.isWorkspaceAnalyticsTimesheetLoading = true;
  try {
    const params: Record<string, string> = {};
    if (weekStart) params["week_start"] = weekStart;
    const data = await this.ceService.getWorkspaceAnalyticsTimesheet(workspaceSlug, params);
    runInAction(() => {
      this.workspaceAnalyticsTimesheetData = data;
    });
  } finally {
    runInAction(() => {
      this.isWorkspaceAnalyticsTimesheetLoading = false;
    });
  }
};
```

## Todo List

- [ ] Add `getWorkspaceAnalyticsTimesheet` to `WorklogService`
- [ ] Add `workspaceAnalyticsTimesheetData` + `isWorkspaceAnalyticsTimesheetLoading` observables to CE store
- [ ] Add `fetchWorkspaceAnalyticsTimesheet` action to CE store
- [ ] Register new fields in `makeObservable`

## Success Criteria

- `worklogStore.fetchWorkspaceAnalyticsTimesheet(slug)` fetches from new endpoint
- Data stored in `workspaceAnalyticsTimesheetData` observable
- Loading state tracks correctly

## Risk Assessment

- **Low risk**: Follows exact same pattern as existing analytics fetch
- No existing code paths affected

---

## Red Team Findings — Phase 02

### Finding RT-7 (High): Missing workspace capacity endpoint — ALSO Phase 02 impact

- **Severity:** High
- **Location:** Phase 02, "Key Insights"
- **Flaw:** `fetchCrossWorkspaceCapacity` is called but its backend endpoint is not created in Phase 01. Must verify the endpoint exists or add it.
- **Fix:** Confirm `fetchCrossWorkspaceCapacity` URL hits an existing endpoint, or extend Phase 01.
- **Status:** Unresolved — flag for Phase 01 resolution first.

### Finding RT-8 (High): Error rethrow can throw `undefined`

- **Severity:** High
- **Location:** Phase 02, service method `.catch()` block
- **Flaw:** `throw error?.response?.data` — if `response` exists but `data` is undefined, throws `undefined` losing stack/message.
- **Fix:** Change to `throw error?.response?.data ?? error;`
- **Status:** Apply in Phase 02.

### Finding RT-9 (High): Store loading state desync — no error state

- **Severity:** High
- **Location:** Phase 02, CE Store action
- **Flaw:** `finally` resets loading=false on both success and failure. No `errorMessage` observable — user sees stale data with no error indication.
- **Fix:** Add `workspaceAnalyticsTimesheetError: string | null` observable. Set it in `catch`. Clear in `try`. Expose to components.
- **Status:** Apply in Phase 02.
