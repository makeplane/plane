# Phase 04: Frontend Service & Store

## Overview

Implement the MobX stores and API services for fetching and saving Project Workflows in the frontend (CE override).

## Requirements

- APIService extending in `apps/web/ce/services/`.
- MobX Store extending root store in `apps/web/ce/store/`.

## Related Code Files

- Files to create: `packages/types/src/workflow.d.ts`
- Files to create: `apps/web/ce/services/workflow.service.ts`
- Files to create: `apps/web/ce/store/workflow.store.ts`
- Files to modify: `packages/types/src/index.ts`
- Files to modify: `apps/web/ce/store/root.store.ts`

## Embedded Rules

1. **MobX**: Always use `makeObservable` with explicit field declarations. Protect mutations with `runInAction`. Use `set()` for dynamic dictionary population.
2. **Types**: Shared types must stay in `packages/types/src/`.
3. **Directory Rule**: Store & Service must go to `apps/web/ce/`, avoiding core `apps/web/core/*`.

## Implementation Steps

<!-- Updated: Validation Session 3 - Store uses per-project map shape, not models: Record<string, IProjectWorkflow> -->

1. Add types in `@plane/types`:
   - `IWorkflowStateData`: `{ allow_issue_creation: boolean; transitions: Record<string, IWorkflowTransitionData> }`
   - `IWorkflowTransitionData`: `{ transition_state: string; approvers: string[] }`
   - `IProjectWorkflowStore`: `{ isLive: boolean; states: Record<string, IWorkflowStateData> }`
2. Implement `WorkflowService`:
   - `getWorkflowStates(slug, projectId)` → GET `/workspaces/{slug}/workflow-states/?project_id={id}`
   - `getProjectWorkflow(slug, projectId)` → GET `/workspaces/{slug}/projects/{id}/workflow/`
   - Other mutation methods for PATCH, POST, DELETE as needed.
3. Class `WorkflowStore`:
   - Observable: `workflowByProject: ObservableMap<string, IProjectWorkflowStore>`
     (key = projectId, value = `{ isLive, states: Record<stateId, IWorkflowStateData> }`)
   - `fetchWorkflow(workspaceSlug, projectId)`: fetch both `/workflow/` (for isLive) and `/workflow-states/` (for states), then `runInAction` to set `workflowByProject.set(projectId, { isLive, states })`
   - Computed `isLive(projectId)`: returns `workflowByProject.get(projectId)?.isLive ?? false`
   - Mutations: `updateIsLive`, `updateStateConfig`, `addTransition`, `removeTransition`, `addApprovers`, `removeApprover`
   - <!-- Updated: Validation Session 5 - NO blockerModal (modal removed entirely); add client-side transition check instead -->
   - `isTransitionAllowed(projectId: string, fromStateId: string, toStateId: string): boolean` — computed/method: checks if a `WorkflowTransition` from→to exists in store for the project. Returns `true` if workflow not live or transition exists.
   - `getTransitionReviewers(projectId: string, fromStateId: string, toStateId: string): string[]` — returns list of approver user IDs for that transition (empty = All Members allowed)
4. Modify `RootStore` in `apps/web/ce/store/root.store.ts` to include `workflow: WorkflowStore`.
5. Export custom hook `useWorkflowStore()` returning `rootStore.workflow`.

## Post-Phase Checklist

- [ ] Types exposed via `packages/types/src/index.ts`.
- [ ] `makeObservable` used properly instead of `makeAutoObservable`.
- [ ] Store connected to the root correctly.

## Success Criteria

- CE components can access `useWorkflowStore(projectId)`.
