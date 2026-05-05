# Phase 02 — Service Layer: InstanceWorkspaceService

**Parent plan:** [plan.md](./plan.md)
**Depends on:** [Phase 01](./phase-01-backend-delete-endpoint.md)
**Status:** ✅ complete

## Overview

Add `destroy(workspaceSlug)` method to `InstanceWorkspaceService` to call the new backend endpoint.

## Related Code Files

- `packages/services/src/workspace/instance-workspace.service.ts` — target file
- `packages/services/src/workspace/workspace.service.ts` (lines 81–90) — reference pattern

## Implementation Steps

1. **`packages/services/src/workspace/instance-workspace.service.ts`** — add method:
   ```typescript
   async destroy(workspaceSlug: string): Promise<void> {
     return this.delete(`/api/instances/workspaces/${workspaceSlug}/`)
       .then((response) => response?.data)
       .catch((error) => {
         throw error?.response?.data;
       });
   }
   ```

## Todo

- [x] Add `destroy(workspaceSlug)` to `InstanceWorkspaceService`

## Success Criteria

- Method calls `DELETE /api/instances/workspaces/{slug}/`
- Throws on error, resolves on success
