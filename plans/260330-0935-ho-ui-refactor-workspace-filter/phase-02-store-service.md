---
phase: 2
title: "Frontend: Service + Store Updates"
status: pending
priority: P1
effort: 1.5h
blocked_by: [phase-01]
---

# Phase 2: Frontend Service + Store

## Context Links

- Service: `apps/web/ce/services/ho-issue.service.ts`
- Store: `apps/web/ce/store/ho/ho-issue.store.ts`
- Hook: `apps/web/core/hooks/store/use-ho-issues.ts`

## Overview

Add `listAccessibleWorkspaces()` to service. Add workspace/project filter observables + actions to store. Ensure all fetches pass filter params to API.

## Data Flow

```
Component mounts
  -> store.fetchAccessibleWorkspaces()
  -> service.listAccessibleWorkspaces()
  -> GET /api/ho/workspaces/
  -> store.accessibleWorkspaces = response

User selects workspace
  -> store.setWorkspaceFilter("slug")
  -> store.selectedProjectIds = [] (reset)
  -> store.fetchIssues(1) (with workspace_slug param)
  -> store.fetchCategorySummary() (with workspace_slug param)

User selects projects
  -> store.setProjectFilter(["id1", "id2"])
  -> store.fetchIssues(1) (with workspace_slug + project_id params)
  -> store.fetchCategorySummary() (with workspace_slug + project_id params)
```

## Related Code Files

**Modify:**

- `apps/web/ce/services/ho-issue.service.ts` (add type + method)
- `apps/web/ce/store/ho/ho-issue.store.ts` (add observables + actions)

## Implementation Steps

### 1. Service: Add types and method

In `ho-issue.service.ts`, add type:

```typescript
export type THoWorkspaceProject = {
  id: string;
  name: string;
  identifier: string;
};

export type THoAccessibleWorkspace = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  projects: THoWorkspaceProject[];
};
```

Add method to `HoIssueService`:

```typescript
async listAccessibleWorkspaces(): Promise<THoAccessibleWorkspace[]> {
  return this.get("/api/ho/workspaces/")
    .then((res: { data: THoAccessibleWorkspace[] }) => res.data)
    .catch((err: { response?: { data: unknown } }) => {
      throw err?.response?.data;
    });
}
```

### 2. Store: Add observables

In `ho-issue.store.ts`, add to interface:

```typescript
accessibleWorkspaces: THoAccessibleWorkspace[];
selectedWorkspaceSlug: string | null;
selectedProjectIds: string[];
isWorkspacesLoading: boolean;
isFetchingIssues: boolean;  // Loading state during filter changes (prevents stale data misread)
fetchAccessibleWorkspaces: () => Promise<void>;
setWorkspaceFilter: (slug: string | null) => void;
setProjectFilter: (ids: string[]) => void;
```

Add to class:

```typescript
accessibleWorkspaces: THoAccessibleWorkspace[] = [];
selectedWorkspaceSlug: string | null = null;
selectedProjectIds: string[] = [];
isWorkspacesLoading = false;
isFetchingIssues = false;
_filterSeq = 0;  // Sequence counter for concurrent filter cancellation
```

Register in `makeObservable`:

```typescript
accessibleWorkspaces: observable,
selectedWorkspaceSlug: observable,
selectedProjectIds: observable,
isWorkspacesLoading: observable,
isFetchingIssues: observable,
fetchAccessibleWorkspaces: action,
setWorkspaceFilter: action,
setProjectFilter: action,
```

### 3. Store: Add actions

```typescript
fetchAccessibleWorkspaces = async (): Promise<void> => {
  // Dedup guard: skip if already loading or data already populated
  if (this.isWorkspacesLoading || this.accessibleWorkspaces.length > 0) return;
  runInAction(() => {
    this.isWorkspacesLoading = true;
  });
  try {
    const data = await this.service.listAccessibleWorkspaces();
    runInAction(() => {
      this.accessibleWorkspaces = data;
    });
  } catch (err: unknown) {
    // Distinguish auth errors from network errors
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 403) {
      console.error("[HO] fetchAccessibleWorkspaces: auth error", status);
    } else {
      console.error("[HO] fetchAccessibleWorkspaces failed:", err);
    }
    // Leave accessibleWorkspaces empty — UI falls back to "All workspaces"
  } finally {
    runInAction(() => {
      this.isWorkspacesLoading = false;
    });
  }
};

setWorkspaceFilter = (slug: string | null): void => {
  // All observable mutations MUST be in runInAction (MobX enforceActions compliance)
  runInAction(() => {
    this.selectedWorkspaceSlug = slug;
    this.selectedProjectIds = [];
    this.currentPage = 1;
  });
  void this._fetchFiltered();
};

setProjectFilter = (ids: string[]): void => {
  runInAction(() => {
    this.selectedProjectIds = ids;
    this.currentPage = 1;
  });
  void this._fetchFiltered();
};

// Sequence-guarded fetch: coordinates issues + summary so they always match the same filter state.
// Rapid filter changes cancel in-flight pairs via the _filterSeq counter.
_fetchFiltered = async (): Promise<void> => {
  const seq = ++this._filterSeq;
  runInAction(() => {
    this.isFetchingIssues = true;
  });
  try {
    const [issues, summary] = await Promise.all([
      this.service.listIssues({ page: 1, ...this._filterParams() }),
      this.service.getCategorySummary(this._filterParams()),
    ]);
    if (seq !== this._filterSeq) return; // Stale — a newer filter fired, discard
    runInAction(() => {
      this.issues = issues.results;
      this.totalCount = issues.count;
      this.currentPage = 1;
      this.categorySummary = summary; // Full replace, not merge
      this.isFetchingIssues = false;
    });
  } catch {
    if (seq !== this._filterSeq) return;
    runInAction(() => {
      this.isFetchingIssues = false;
    });
  }
};

// Centralised filter params — used by both issues and summary fetches
_filterParams = (): Record<string, string> => {
  const params: Record<string, string> = {
    order_by: this.orderBy,
    from_date: this.fromDate,
    to_date: this.toDate,
  };
  if (this.selectedWorkspaceSlug) params.workspace_slug = this.selectedWorkspaceSlug;
  if (this.selectedProjectIds.length > 0) params.project_id = this.selectedProjectIds.join(",");
  return params;
};
```

### 4. Store: Update `fetchIssues` and `fetchCategorySummary` to pass filter params

> **NOTE:** With the sequence-guarded `_fetchFiltered` approach above, filter-triggered calls go through `_fetchFiltered` (which uses `_filterParams()`). The existing `fetchIssues(page)` method is still used for pagination (next page loads), so it must also pass filter params.

In `fetchIssues`, modify params construction:

```typescript
const params: Record<string, string> = {
  page: String(page),
  ...this._filterParams(), // Includes workspace_slug, project_id, order_by, from_date, to_date
};
```

For `fetchCategorySummary` (explicit — not "same pattern"):

```typescript
fetchCategorySummary = async (): Promise<void> => {
  try {
    const data = await this.service.getCategorySummary(this._filterParams());
    runInAction(() => {
      this.categorySummary = data; // Full replace, not Object.assign/merge
    });
  } catch {
    // non-critical
  }
};
```

> **Important:** `categorySummary` must be a **full replace** (`this.categorySummary = data`), not a merge (`Object.assign`). A merge would leave stale category keys from previous workspaces as phantom rows in the category view.

### 5. Import type from service

Add import at top of store:

```typescript
import type { THoIssue, THoCategorySummary, THoAccessibleWorkspace } from "@/plane-web/services/ho-issue.service";
```

## Todo List

- [ ] Add `THoWorkspaceProject` and `THoAccessibleWorkspace` types to service
- [ ] Add `listAccessibleWorkspaces()` method to service
- [ ] Add workspace/project observables + `isFetchingIssues` + `_filterSeq` to store interface + class
- [ ] Add `fetchAccessibleWorkspaces` action (with dedup guard + error logging by status code)
- [ ] Add `_filterParams()` centralised param builder
- [ ] Add `_fetchFiltered()` sequence-guarded coordinator (issues + summary as `Promise.all`)
- [ ] Add `setWorkspaceFilter` action (all mutations inside `runInAction`)
- [ ] Add `setProjectFilter` action (all mutations inside `runInAction`)
- [ ] Update `fetchIssues` to use `_filterParams()` for pagination calls
- [ ] Implement `fetchCategorySummary` with explicit full-replace pattern (no merge)
- [ ] Extract `ho-issue-defaults.ts` (`todayISO`, `HO_DEFAULT_DISPLAY_PROPERTIES`) to keep store ≤200 lines

## Failure Modes

| Risk                                     | Likelihood | Impact | Mitigation                                                                                                                    |
| ---------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Store file exceeds 200 lines             | High       | Low    | Current file is 174L; additions ~50L = ~224L. Extract helper function `todayISO` and default props to separate file if needed |
| Race condition on rapid filter changes   | Low        | Medium | Each fetch replaces data; last one wins. Acceptable for this use case                                                         |
| fetchAccessibleWorkspaces fails silently | Low        | Low    | User sees "All workspaces" default, selectors disabled while loading                                                          |

## Success Criteria

- `store.fetchAccessibleWorkspaces()` populates `accessibleWorkspaces` observable
- Calling `fetchAccessibleWorkspaces()` twice simultaneously fires only one request (dedup guard)
- `store.setWorkspaceFilter("slug")` resets projects, triggers `_fetchFiltered` with `workspace_slug` param
- `store.setProjectFilter(["id"])` triggers `_fetchFiltered` with both params
- `store.setWorkspaceFilter(null)` clears all filters, fetches unfiltered data
- Rapid filter changes (N calls) result in UI showing only the last filter's data (sequence guard)
- `isFetchingIssues` is `true` during active fetches — UI can show overlay
- `categorySummary` always matches current filter state (no phantom categories from previous workspace)
- Existing date range + order_by functionality unchanged
- Store file ≤200 lines after extraction

## File Size Management

Current `ho-issue.store.ts` = 174 lines. After changes ~230 lines. Extract:

- `ho-issue-defaults.ts` — `todayISO()`, `HO_DEFAULT_DISPLAY_PROPERTIES` constant (~25 lines saved)
- This keeps the store file under 200 lines
