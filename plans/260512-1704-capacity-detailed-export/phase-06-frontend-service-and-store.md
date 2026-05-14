# Phase 06 — Frontend: Service + Store Slice

## Context Links

- FE research §3, §7
- Pattern: `apps/web/ce/services/project-worklog.service.ts`
- Store base: `apps/web/ce/store/worklog.store.ts`

## Overview

- Priority: P1
- Status: pending
- Brief: CE service for POST/GET capacity exports; store slice exposes `initiateDetailedExport()` and `fetchExportHistory()` to components.

## Key Insights

- CE service class prefix `CE…`; subclasses `APIService`.
- Store extension lives in existing `CEWorklogStore` (already exported via `useWorklog()`).
- Types live in `packages/types/src/`.

## Requirements

**Functional**

- `CECapacityExportService` with two methods (POST initiate, GET history).
- Store slice: `exportJobs: Record<string, ICapacityExportJob>`, `isExportJobsLoading: boolean`, `lastExportRequestAt: number | null` (FE debounce).
- Actions: `initiateDetailedExport(slug, payload)`, `fetchExportHistory(slug)`.
- Type `ICapacityExportJob` mirrors BE serializer.

**Non-functional**

- Service file <100 LOC; store delta <80 LOC.
- `observable`, `action`, `runInAction` for async mutations.
- `import type` for type-only imports.

## Architecture

```
Component → useWorklog() → store.initiateDetailedExport()
                              ↓
                      CECapacityExportService.initiateDetailedExport()
                              ↓
                      POST /api/workspaces/{slug}/capacity/exports/
                              ↓
                      runInAction → set lastExportRequestAt = Date.now()
                              ↓
                      return { job_id, message }
```

## Related Code Files

**Create**

- `apps/web/ce/services/capacity-export.service.ts`
- `packages/types/src/capacity-export.ts`

**Modify**

- `apps/web/ce/store/worklog.store.ts` — add exportJobs slice + actions
- `packages/types/src/index.ts` — `export * from "./capacity-export"`

## Implementation Steps

1. Type module `capacity-export.ts`:
   ```ts
   export type TCapacityExportStatus = "queued" | "processing" | "ready" | "failed" | "expired";
   export interface ICapacityExportJob {
     id: string;
     status: TCapacityExportStatus;
     date_from: string;
     date_to: string;
     member_count: number;
     row_count: number;
     file_url: string | null;
     file_size: number;
     expires_at: string | null;
     created_at: string;
     completed_at: string | null;
     error_message: string;
   }
   export interface ICapacityExportPayload {
     date_from: string;
     date_to: string;
     member_ids?: string[] | null;
     cross_workspace: boolean;
   }
   ```
2. Service `CECapacityExportService extends APIService`:
   - `initiateDetailedExport(slug, payload) → Promise<{ job_id; message; status }>`
   - `fetchExportHistory(slug) → Promise<ICapacityExportJob[]>`
   - Error handling: `.catch((err) => { throw err?.response?.data; })`.
3. Store changes in `CEWorklogStore`:
   - `exportJobs: Record<string, ICapacityExportJob> = {}`
   - `isExportJobsLoading = false`
   - `lastExportRequestAt: number | null = null`
   - `makeObservable` entries added (observable, action).
   - `initiateDetailedExport = action(async (slug, payload) => { … runInAction → set lastExportRequestAt; return res })`.
   - `fetchExportHistory = action(async (slug) => { … runInAction → set exportJobs by id })`.
4. Use `set` from `lodash-es` for record updates.

## Todo List

- [ ] Type module
- [ ] Service class
- [ ] Store slice + actions
- [ ] Re-export types via barrel
- [ ] Manual smoke: call service from devtools, inspect response

## Success Criteria

- `useWorklog().initiateDetailedExport(slug, payload)` returns job_id.
- `useWorklog().fetchExportHistory(slug)` populates `exportJobs`.
- TypeScript builds without errors.

## Risk Assessment

| Risk                                  | Likelihood | Impact | Mitigation                                                                                      |
| ------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------- |
| Store growth (existing file >200 LOC) | Med        | Low    | If `worklog.store.ts` >200 after edits, extract slice to `worklog-exports.store.ts` and compose |
| Type drift FE ↔ BE                    | Med        | Med    | Keep `ICapacityExportJob` in sync; verify in Phase 10                                           |

## Security Considerations

- Service never reads cross-user data (BE enforces requester scope).
- No sensitive data stored in MobX beyond presigned URL (already short-lived).

## Next Steps

- Unblocks Phase 07 (split-button uses store) and Phase 08 (My Exports page).
