# Phase 3: Frontend Service & Store

## Context Links
- Service pattern: `apps/web/core/services/staff.service.ts` (APIService extension)
- Store pattern: `apps/web/core/store/analytics-dashboard.store.ts`
- Root store: `apps/web/core/store/root.store.ts`
- API base: `@plane/constants` API_BASE_URL

## Overview
- **Priority**: P1
- **Status**: complete
- Create worklog API service and MobX store for state management.

## Key Insights
<!-- Updated: Validation Session 2 - Service URLs use v0 API paths -->
- Services extend `APIService` from `@/services/api.service`
- **API endpoints use v0 paths** (`/api/workspaces/...` NOT `/api/v1/workspaces/...`)
- MobX stores use `makeObservable` with `observable`, `action`, `computed`, `runInAction`
- Stores are instantiated in root store and passed `this` (root store ref)
- Data keyed by issueId for per-issue worklog lists

## Requirements
### Functional
- Service wrapping all worklog API endpoints
- MobX store managing worklog state per issue
- Fetch, create, update, delete operations
- Summary data fetching for reports

### Non-functional
- Store must handle concurrent issue detail views (keyed by issueId)
- Optimistic updates for delete (revert on failure)

## Related Code Files
### Create
- `apps/web/core/services/worklog.service.ts` — API service
- `apps/web/core/store/worklog.store.ts` — MobX store

### Modify
- `apps/web/core/store/root.store.ts` — add worklog store instance
- CE root store if separate: check `apps/web/ce/store/` or `@/plane-web/store/root.store`

## Implementation Steps

1. **Create worklog service** in `apps/web/core/services/worklog.service.ts`
```typescript
class WorklogService extends APIService {
  constructor() { super(API_BASE_URL); }

  // Issue-level CRUD
  async listWorklogs(workspaceSlug: string, projectId: string, issueId: string): Promise<IWorkLog[]>
  async createWorklog(workspaceSlug: string, projectId: string, issueId: string, data: IWorkLogCreate): Promise<IWorkLog>
  async updateWorklog(workspaceSlug: string, projectId: string, issueId: string, worklogId: string, data: IWorkLogUpdate): Promise<IWorkLog>
  async deleteWorklog(workspaceSlug: string, projectId: string, issueId: string, worklogId: string): Promise<void>

  // Summary endpoints
  async getProjectSummary(workspaceSlug: string, projectId: string, params?: Record<string, string>): Promise<IWorkLogSummary>
  async getWorkspaceSummary(workspaceSlug: string, params?: Record<string, string>): Promise<IWorkLogSummary>
}
```

2. **Create worklog store** in `apps/web/core/store/worklog.store.ts`
```typescript
interface IWorklogStore {
  // observables
  worklogsByIssueId: Record<string, IWorkLog[]>;
  isLoading: boolean;
  // computed
  getWorklogsForIssue(issueId: string): IWorkLog[];
  getTotalMinutesForIssue(issueId: string): number;
  // actions
  fetchWorklogs(workspaceSlug: string, projectId: string, issueId: string): Promise<void>;
  createWorklog(workspaceSlug: string, projectId: string, issueId: string, data: IWorkLogCreate): Promise<IWorkLog>;
  updateWorklog(workspaceSlug: string, projectId: string, issueId: string, worklogId: string, data: IWorkLogUpdate): Promise<IWorkLog>;
  deleteWorklog(workspaceSlug: string, projectId: string, issueId: string, worklogId: string): Promise<void>;
}
```
- Use `observable.deep` for worklogsByIssueId map
- `runInAction` for state mutations after async calls
- Service instance as private field

3. **Register in root store**
   - Import IWorklogStore and WorklogStore
   - Add `worklog: IWorklogStore` to CoreRootStore
   - Initialize in constructor: `this.worklog = new WorklogStore(this)`

## Todo List
- [ ] Create worklog service with all endpoints
- [ ] Create worklog MobX store
- [ ] Register store in root store
- [ ] Verify TypeScript compilation

## Success Criteria
- Service methods map 1:1 to API endpoints
- Store correctly caches worklogs by issueId
- Store updates local state after CRUD operations
- No TypeScript compilation errors

## Risk Assessment
- **Stale data**: Multiple tabs editing same issue → accept for MVP, SWR/polling later
- **Store size**: Many issues open → only load on demand per issue

## Security Considerations
- Service relies on cookie-based auth (handled by APIService base class)
- No secrets stored client-side

## Next Steps
- Phase 4: UI components consume this store
