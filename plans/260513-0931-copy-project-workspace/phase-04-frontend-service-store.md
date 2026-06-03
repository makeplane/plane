# Phase 04 — Frontend: Service Method + Store + Polling

## Overview

- **Priority:** P1 (blocked by Phase 02; blocks Phase 03)
- **Status:** complete
- **Effort:** 4h
- **Description:** Wire frontend to backend with a service class, CE MobX store, polling loop, and hook.

## Context Links

- Service pattern: `apps/web/core/services/project/project.service.ts`
- CE root store: `apps/web/ce/store/root.store.ts`
- Frontend rules: `.claude/rules/plane-design-system.md`, `mobx-stores.md`, `api-services.md`

## Requirements

### Functional

- Service `ProjectCopyService` with 3 methods:
  - `startCopy(workspaceSlug, projectId, payload) → Promise<{ job_id, status }>`
  - `getCopyStatus(workspaceSlug, projectId, jobId) → Promise<CopyJob>`
  - `getAdminWorkspaces(workspaceSlug, projectId) → Promise<Workspace[]>`
- CE store `ProjectCopyStore`:
  - `jobs: Record<jobId, CopyJob>` (observable)
  - `adminWorkspaces: Workspace[]` (observable)
  - `startCopy(...)` action — calls service, stores job, starts polling
  - `pollJob(jobId)` action — uses interval (3s); stops on terminal status
  - `fetchAdminWorkspaces(...)` action
  - On poll-completed: toast + emit `onComplete` callback (modal subscribes for navigation)
- Hook `useProjectCopy()` exposes store + simplified API for components
- Polling cleanup on store reset / user logout

### Non-Functional

- Service uses base `APIService` (existing pattern)
- Store wired into CE `RootStore`
- Polling uses `setInterval(3000)` with max 200 iterations (10 min ceiling) — then stops with timeout error
- All polling per-job tracked in private `Map<jobId, IntervalId>` to avoid duplicates
- Types in `@plane/types` package

## Architecture

### Types (packages/types/src/project-copy.d.ts)

```typescript
export type TProjectCopyJobStatus = "queued" | "processing" | "completed" | "failed";

export type TProjectCopyJob = {
  id: string;
  status: TProjectCopyJobStatus;
  new_project_id: string | null;
  error: string;
  target_workspace_slug: string;
  target_identifier: string;
  target_name: string;
  created_at: string;
  completed_at: string | null;
};

export type TProjectCopyPayload = {
  target_workspace_slug: string;
  target_identifier: string;
  target_name: string;
};
```

### Service (apps/web/core/services/project/project-copy.service.ts)

```typescript
import { APIService } from "@plane/services";
import type { TProjectCopyJob, TProjectCopyPayload } from "@plane/types";

export class ProjectCopyService extends APIService {
  async startCopy(slug: string, projectId: string, payload: TProjectCopyPayload) {
    return this.post(`/api/workspaces/${slug}/projects/${projectId}/copy/`, payload)
      .then((r) => r.data)
      .catch((e) => { throw e?.response; });
  }

  async getCopyStatus(slug: string, projectId: string, jobId: string): Promise<TProjectCopyJob> {
    return this.get(`/api/workspaces/${slug}/projects/${projectId}/copy-status/${jobId}/`)
      .then((r) => r.data)
      .catch((e) => { throw e?.response; });
  }

  async getAdminWorkspaces(slug: string, projectId: string) {
    return this.get(`/api/workspaces/${slug}/projects/${projectId}/copy/admin-workspaces/`)
      .then((r) => r.data)
      .catch((e) => { throw e?.response; });
  }
}
```

### Store (apps/web/ce/store/project-copy.store.ts)

```typescript
import { makeObservable, observable, action, runInAction } from "mobx";
import { set } from "lodash-es";
import { ProjectCopyService } from "@/services/project/project-copy.service";
import type { TProjectCopyJob, TProjectCopyPayload } from "@plane/types";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ITERATIONS = 200;

export interface IProjectCopyStore {
  jobs: Record<string, TProjectCopyJob>;
  adminWorkspaces: any[];
  startCopy: (slug: string, projectId: string, payload: TProjectCopyPayload, onComplete?: (job: TProjectCopyJob) => void) => Promise<TProjectCopyJob>;
  fetchAdminWorkspaces: (slug: string, projectId: string) => Promise<void>;
  stopPolling: (jobId: string) => void;
}

export class ProjectCopyStore implements IProjectCopyStore {
  jobs: Record<string, TProjectCopyJob> = {};
  adminWorkspaces: any[] = [];
  private polls: Map<string, ReturnType<typeof setInterval>> = new Map();
  private service = new ProjectCopyService();

  constructor(_root: any) {
    makeObservable(this, {
      jobs: observable,
      adminWorkspaces: observable,
      startCopy: action,
      fetchAdminWorkspaces: action,
    });
  }

  startCopy = async (slug, projectId, payload, onComplete) => {
    const { job_id } = await this.service.startCopy(slug, projectId, payload);
    // initial fetch
    const job = await this.service.getCopyStatus(slug, projectId, job_id);
    runInAction(() => { set(this.jobs, job_id, job); });
    this.startPolling(slug, projectId, job_id, onComplete);
    return job;
  };

  private startPolling = (slug, projectId, jobId, onComplete) => {
    let count = 0;
    const intervalId = setInterval(async () => {
      count += 1;
      if (count > POLL_MAX_ITERATIONS) { this.stopPolling(jobId); return; }
      try {
        const job = await this.service.getCopyStatus(slug, projectId, jobId);
        runInAction(() => { set(this.jobs, jobId, job); });
        if (job.status === "completed" || job.status === "failed") {
          this.stopPolling(jobId);
          onComplete?.(job);
        }
      } catch {
        this.stopPolling(jobId);
      }
    }, POLL_INTERVAL_MS);
    this.polls.set(jobId, intervalId);
  };

  stopPolling = (jobId) => {
    const intervalId = this.polls.get(jobId);
    if (intervalId) clearInterval(intervalId);
    this.polls.delete(jobId);
  };

  fetchAdminWorkspaces = async (slug, projectId) => {
    const data = await this.service.getAdminWorkspaces(slug, projectId);
    runInAction(() => { this.adminWorkspaces = data; });
  };
}
```

### Root store extension (apps/web/ce/store/root.store.ts)

Add field:

```typescript
public projectCopy: ProjectCopyStore;
// in constructor:
this.projectCopy = new ProjectCopyStore(this);
```

### Hook (apps/web/ce/hooks/store/use-project-copy.ts)

```typescript
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";

export const useProjectCopy = () => {
  const root = useContext(StoreContext);
  if (!root) throw new Error("useProjectCopy must be used inside StoreProvider");
  return root.projectCopy;
};
```

## Related Code Files

### To Create

- `packages/types/src/project-copy.d.ts` — types
- `apps/web/core/services/project/project-copy.service.ts` — service
- `apps/web/ce/store/project-copy.store.ts` — MobX store
- `apps/web/ce/hooks/store/use-project-copy.ts` — hook

### To Modify

- `packages/types/src/index.d.ts` — re-export project-copy types
- `apps/web/core/services/project/index.ts` — export service
- `apps/web/ce/store/root.store.ts` — instantiate `projectCopy` field

### To Read for Context

- `apps/web/core/services/project/project.service.ts` — service shape
- `apps/web/ce/store/root.store.ts` — root store extension pattern
- `apps/web/core/store/workspace/index.ts` — existing workspace store (reference for adminWorkspaces shape)

## Implementation Steps

1. Add types to `@plane/types`, re-export
2. Implement `ProjectCopyService` (3 methods)
3. Implement `ProjectCopyStore` with polling lifecycle (start, stop, max-iterations)
4. Wire into CE `root.store.ts` constructor
5. Create `useProjectCopy` hook
6. Smoke test in browser console: trigger startCopy, verify jobs map updates every 3s, verify stops on completed

## Todo List

- [x] Add `TProjectCopyJob`, `TProjectCopyPayload` types
- [x] Implement service (3 methods)
- [x] Implement store with polling
- [x] Wire into root store
- [x] Create `useProjectCopy` hook
- [x] `pnpm check:lint` clean
- [x] `pnpm check:format` clean

## Success Criteria

- `startCopy` returns immediately with job + auto-poll starts
- Polling stops within 3s after backend marks completed/failed
- Re-mounting consumer does not duplicate polls (Map dedupe)
- No memory leak: `stopPolling` removes interval + Map entry
- Network tab shows GET every 3s while processing, none after terminal

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Multiple modals trigger duplicate polls for same job | Map keyed by jobId — startPolling idempotent: check `polls.has(jobId)` before setInterval |
| Polling continues after logout/page navigation | `stopPolling(jobId)` exposed; consumer cleans up; or root store reset clears all |
| 3s interval too aggressive at scale | Acceptable for V1; switch to backoff (3 → 5 → 10) in V2 |
| Lost job_id on browser refresh | Out of scope for V1 (toast indicates copy continues server-side); persist to localStorage in V2 |
| Service throws on auth error mid-poll | Catch + stopPolling — silent failure preferred over toast spam |

## Security Considerations

- Service uses session cookie (existing APIService)
- No token storage in store

## Next Steps

- Unblocks Phase 03 modal (consumes `useProjectCopy`)
