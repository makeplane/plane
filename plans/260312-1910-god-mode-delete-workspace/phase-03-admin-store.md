# Phase 03 — Admin Store: deleteWorkspace Action

**Parent plan:** [plan.md](./plan.md)
**Depends on:** [Phase 02](./phase-02-service-layer.md)
**Status:** ✅ complete

## Overview

Add `deleteWorkspace(workspaceId, workspaceSlug)` MobX action to the admin `WorkspaceStore` to call the service and remove the workspace from local state.

## Related Code Files

- `apps/admin/store/workspace.store.ts` — target file (IWorkspaceStore interface + WorkspaceStore class)
- `apps/web/core/store/workspace/index.ts` (lines 245–257) — reference delete pattern

## Implementation Steps

1. **Interface `IWorkspaceStore`** — add to interface:

   ```typescript
   deleteWorkspace: (workspaceId: string, workspaceSlug: string) => Promise<void>;
   ```

2. **`makeObservable`** — register action:

   ```typescript
   deleteWorkspace: action,
   ```

3. **Class method** — add after `bulkAssignMembers`:
   ```typescript
   deleteWorkspace = async (workspaceId: string, workspaceSlug: string): Promise<void> => {
     try {
       await this.instanceWorkspaceService.destroy(workspaceSlug);
       runInAction(() => {
         delete this.workspaces[workspaceId];
       });
     } catch (error) {
       console.error("Error deleting workspace", error);
       throw error;
     }
   };
   ```

## Todo

- [x] Add `deleteWorkspace` to `IWorkspaceStore` interface
- [x] Register in `makeObservable`
- [x] Implement action method

## Success Criteria

- Workspace removed from `this.workspaces` after successful API call
- Throws on API error (so UI can show toast)
