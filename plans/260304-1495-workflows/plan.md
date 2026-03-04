# Workflows Feature Implementation Plan

## Overview

Implement the Workflows feature cloned from Plane PRO to control Issue state transitions and work item creations. This is a Project-level feature that activates constraints on how states change.

## Architecture Decisions

1. **Backend**:
   - Create new models in `plane.db.models.workflow`: `ProjectWorkflow`, `WorkflowStateConfig`, `WorkflowTransition` and `WorkflowTransitionApprover` (Phase 01 naming is canonical — Phase 03 references updated accordingly).
   - APIs to manage workflows in `plane.app.views.workflow`.
   - API enforcement inside `plane.app.views.issue.IssueViewSet` (`create` and `partial_update`).
2. **Frontend CE Override**:
   - Adhere to `GEMINI.md` CE rules: custom features go in `apps/web/ce/`.
   - Add routes in `apps/web/app/routes/extended.ts` or appropriate page file structure.
   - Setup API services and MobX stores in `apps/web/ce/`.
   - Utilize `@plane/propel` for UI components and semantic color tokens.

## Phase List

| Phase | Title                                                      | Description                                                                     | Status  |
| ----- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- | ------- |
| 01    | [Backend Models](phase-01-backend-models.md)               | Database models for ProjectWorkflow, WorkflowState, and WorkflowStateTransition | Pending |
| 02    | [Backend API Views](phase-02-backend-api.md)               | DRF ViewSets, serializers, and URLs to manage Project Workflows                 | Pending |
| 03    | [Backend API Enforcement](phase-03-backend-enforcement.md) | Modify IssueViewSet to reject unpermitted state changes based on Workflow rules | Pending |
| 04    | [Frontend Service & Store](phase-04-frontend-store.md)     | CE setup: APIService, MobX root.store extension for workflow                    | Pending |
| 05    | [Frontend Settings UI](phase-05-frontend-ui.md)            | Project Settings page for configuring Workflows (UI & Integration)              | Pending |

## Validation Log

### Session 1 — 2026-03-04

**Trigger:** Initial plan validation before implementation begins.
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Phase 03 uses different model/field names than Phase 01 defines. Which naming is correct to use during implementation?
   - Options: Use Phase 01 names | Use Phase 03 names
   - **Answer:** Use Phase 01 names (Recommended)
   - **Rationale:** Phase 01 model names (`WorkflowTransition`, `WorkflowTransitionApprover`, `WorkflowStateConfig.allow_issue_creation`) match the PRO API field names captured from network analysis. Phase 03 had stale/draft references that must be updated to match.

2. **[Scope]** Should WorkflowActivity (audit log + /workflow/activity/ endpoint) be included in the MVP or deferred?
   - Options: Include in MVP | Defer to later
   - **Answer:** Include in MVP (Recommended)
   - **Rationale:** `WorkflowActivity` model is already in Phase 01 design; the endpoint is in Phase 02; Phase 05 "View change history" three-dot menu depends on it. All three phases must remain consistent.

3. **[Architecture]** When user triggers 'Reset Workflow', what should happen to existing transitions?
   - Options: Soft-delete all transitions | Hard-delete all transitions
   - **Answer:** Soft-delete all transitions (Recommended)
   - **Rationale:** Uses Django SoftDeletionManager, consistent with rest of codebase. Transitions are hidden but recoverable. Also resets `is_live=False`.

4. **[UX]** When a 403 workflow block occurs during issue state change, what is the primary rejection UX?
   - Options: Dedicated WorkflowBlockerModal | Error toast only | Both modal + toast
   - **Answer:** Dedicated WorkflowBlockerModal (Recommended)
   - **Rationale:** Matches PRO "blocker message" language. Must display `allowed_reviewers` from backend 403 response. Kanban cards must snap back visually.

#### Confirmed Decisions

- **Model naming**: Phase 01 vocabulary is canonical — Phase 03 references updated
- **Activity log**: In MVP scope across all phases
- **Reset**: Soft-delete transitions + set `is_live=False`
- **Blocker UX**: Dedicated `WorkflowBlockerModal` (not just toast)

#### Action Items

- [x] Update plan.md Architecture Decisions to use Phase 01 model names
- [ ] Update Phase 03 to replace `WorkflowStateTransition` → `WorkflowTransition`, `StateTransitionReviewer` → `WorkflowTransitionApprover`, `WorkflowState.allow_new_work_items` → `WorkflowStateConfig.allow_issue_creation`
- [ ] Ensure Phase 02 reset action uses soft-delete (SoftDeletionManager)
- [ ] Ensure Phase 05 blocker uses `WorkflowBlockerModal` (not toast) as primary UX

#### Impact on Phases

- Phase 03: Fix all stale model/field name references to match Phase 01
- Phase 02: Confirm reset action uses `deleted_at` soft-delete pattern

---

### Session 2 — 2026-03-04

**Trigger:** User clarification — 403 `WORKFLOW_TRANSITION_BLOCKED` error handling should include toast in addition to modal.
**Questions asked:** 0 (explicit user directive, no ambiguity)

#### Change Applied

**[UX]** When a 403 `WORKFLOW_TRANSITION_BLOCKED` occurs, what feedback does the user receive?

- Previous (Session 1): Dedicated `WorkflowBlockerModal` only — "Do NOT use toast"
- **Updated:** Both `setToast` (instant feedback) + `WorkflowBlockerModal` (detail with allowed reviewers)
- **Rationale:** Toast gives immediate visual feedback in context; modal provides detail on who can approve. Non-conflicting — fire toast first, then open modal.

#### Confirmed Decisions

- **403 UX**: Toast + Modal (both) — toast fires `TOAST_TYPE.ERROR` with short message; modal shows `allowed_reviewers`.

#### Action Items

- [x] Update Phase 05 Part C step 3 to include `setToast` call before opening modal
- [x] Fix Phase 05 Success Criteria to reflect toast + modal

#### Impact on Phases

- Phase 05: Part C updated — catch block now fires both toast and modal on 403 `WORKFLOW_TRANSITION_BLOCKED`

---

### Session 3 — 2026-03-04

**Trigger:** Pre-implementation validation of remaining architectural decision points.
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Phase 04 defines `WorkflowStore.models: Record<string, IProjectWorkflow>`. But the GET /workflow-states/ response is a flat dict keyed by state UUID (not project). How should the store be structured?
   - Options: Per-project map | Keep two separate maps
   - **Answer:** Per-project map
   - **Rationale:** Store as `Record<projectId, { isLive: boolean, states: Record<stateId, IWorkflowStateData> }>`. Single fetch populates everything for a project. Cleaner than two separate maps and avoids sync issues between `isLive` and state configs.

2. **[Architecture]** Phase 01 uses `unique_together` for WorkflowTransition, but soft-delete means a deleted+recreated transition will violate the constraint. Should constraints use `UniqueConstraint` with `condition=Q(deleted_at__isnull=True)`?
   - Options: UniqueConstraint + condition | Keep unique_together
   - **Answer:** UniqueConstraint + condition
   - **Rationale:** Allows re-creating a previously soft-deleted transition. `unique_together` does not support partial indexes in Django, so it would permanently block re-adding a transition once soft-deleted.

3. **[Architecture]** Phase 02 GET /workflow-states/ must return ALL states. Should `list()` auto-create missing `WorkflowStateConfig` rows (side-effectful GET), or compute defaults in Python without persisting?
   - Options: Compute defaults, no persist | Auto get_or_create on GET
   - **Answer:** Compute defaults, no persist
   - **Rationale:** Keeps GET idempotent. Only create a DB row when PATCH is called. Avoids polluting the DB with defaults for states that the user never explicitly configured.

4. **[Architecture]** Phase 05 Kanban snap-back on 403: optimistic update + rollback vs pessimistic wait-for-API?
   - Options: Optimistic update + rollback | Pessimistic: wait for API
   - **Answer:** Optimistic update + rollback
   - **Rationale:** Snapshot old state before PATCH call, restore on 403. Fastest UX — card snaps back cleanly. Consistent with how other issue updates work in the codebase.

#### Confirmed Decisions

- **Store shape**: `Record<projectId, { isLive: boolean, states: Record<stateId, IWorkflowStateData> }>`
- **Unique constraints**: `UniqueConstraint` with `condition=Q(deleted_at__isnull=True)` for `WorkflowTransition` and `WorkflowTransitionApprover`
- **GET side-effects**: No auto-create on GET; compute defaults in Python, only persist on PATCH
- **Kanban snap-back**: Optimistic update + snapshot rollback on 403

#### Action Items

- [ ] Update Phase 01 `unique_together` → `UniqueConstraint` with soft-delete condition for `WorkflowTransition` and `WorkflowTransitionApprover`
- [ ] Update Phase 04 store design to use per-project map shape
- [ ] Update Phase 02 `list()` to compute defaults without `get_or_create`
- [ ] Update Phase 05 snap-back to use optimistic snapshot pattern

#### Impact on Phases

- Phase 01: Replace `unique_together` with `UniqueConstraint(condition=Q(deleted_at__isnull=True))` for `WorkflowTransition` and `WorkflowTransitionApprover`
- Phase 02: `WorkflowStateConfigViewSet.list()` must NOT call `get_or_create`; return `allow_issue_creation=True` as default for states with no config row
- Phase 04: Redesign `WorkflowStore` to use `Record<projectId, { isLive: boolean, states: Record<stateId, {...}> }>` instead of `models: Record<string, IProjectWorkflow>`
- Phase 05: Kanban drag handler must snapshot `issue.state_id` before calling PATCH; on 403 restore snapshot in store

---

### Session 4 — 2026-03-04

**Trigger:** Re-validation after reviewing official guide; surfaces three implementation gaps.
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** Reset Workflow (three-dot menu) — should it also reset WorkflowStateConfig rows (allow_issue_creation back to default), or only soft-delete WorkflowTransition/Approver records?
   - Options: Transitions only | Full reset
   - **Answer:** Full reset
   - **Rationale:** Full reset means soft-delete all `WorkflowTransition` + `WorkflowTransitionApprover` AND delete/reset all `WorkflowStateConfig` rows so `allow_issue_creation` returns to `True` for all states. `is_live` also set to `False`. Matches the guide's "Removes all your custom workflow settings."

2. **[Architecture]** WorkflowBlockerModal mount point — where should the modal live in the component tree?
   - Options: Global layout (portal) | Per-layout injection
   - **Answer:** Global layout (portal)
   - **Rationale:** Render once in project/workspace layout via React portal. `WorkflowStore` holds modal open state + payload (`allowedReviewers`, `fromState`, `toState`). Any component fires it by setting store state — no prop-drilling needed.

3. **[Architecture]** When should `fetchWorkflow()` be called in issue views (for Kanban indicator icon + button hiding)?
   - Options: On issue board mount | Settings page only | Lazy on first access
   - **Answer:** On issue board mount
   - **Rationale:** Call `workflowStore.fetchWorkflow(projectId)` in the issue board layout/hook, same pattern as `fetchStates`. Ensures store is populated before Kanban/List renders, so indicator icons and button visibility work without extra load states.

#### Confirmed Decisions

- **Reset scope**: Full reset — transitions + approvers soft-deleted + all `WorkflowStateConfig` rows deleted + `is_live = False`
- **Modal mount**: Global layout portal; `WorkflowStore` owns modal open state + payload
- **fetchWorkflow trigger**: Called on issue board mount (same hook as fetchStates)

#### Action Items

- [ ] Update Phase 02 `reset()` to also delete all `WorkflowStateConfig` rows for the project
- [ ] Update Phase 04 `WorkflowStore` to add `blockerModal: { isOpen, allowedReviewers, fromState, toState } | null` observable + `openBlockerModal` / `closeBlockerModal` actions
- [ ] Update Phase 05 to mount `<WorkflowBlockerModal>` in project settings layout or issue board layout as a portal
- [ ] Update Phase 05 to add `workflowStore.fetchWorkflow(projectId)` call in issue board mount hook

#### Impact on Phases

- Phase 02: `reset()` action must delete all `WorkflowStateConfig` rows in addition to soft-deleting transitions
- Phase 04: Add `blockerModal` observable + `openBlockerModal(payload)` / `closeBlockerModal()` actions to `WorkflowStore`
- Phase 05: Add `<WorkflowBlockerModal>` as portal in project layout; add `fetchWorkflow(projectId)` to issue board mount hook

---

### Session 5 — 2026-03-04

**Trigger:** Screenshot review revealed Kanban blocker UX and indicator popup text differ from plan assumptions.
**Questions asked:** 3

#### Questions & Answers

1. **[UX]** The blocker UX for Kanban drag is NOT a modal — screenshot shows an inline message inside the target column during drag (before drop). Should the Kanban blocker be a client-side drag-over inline message (using store data, no API call), preventing the drop entirely?
   - Options: Inline drag-over (screenshot) | Keep API-based + modal
   - **Answer:** Inline drag-over (screenshot)
   - **Rationale:** Check `workflowStore` client-side during `dragOver`; if transition blocked, show inline blocker card at bottom of target column and prevent drop. No API call needed for blocked drags. If 403 occurs on drop as edge case, just show error toast. Replaces the optimistic-update + WorkflowBlockerModal approach for Kanban entirely.

2. **[UX]** For non-Kanban layouts (List dropdown, Gantt sidebar, Spreadsheet cell) — when user selects a blocked state, what UX should appear?
   - Options: Error toast only | WorkflowBlockerModal | Inline near trigger
   - **Answer:** Error toast only
   - **Rationale:** After API returns 403, show a brief error toast. Simpler and consistent with other errors. No modal needed for any layout. Removes the need for `WorkflowBlockerModal` component entirely.

3. **[UX]** The indicator popup shows 'All Members can move it to [state]' when no reviewers. Should this exact copy be used (not 'Anyone')?
   - Options: All Members (match screenshot) | Anyone
   - **Answer:** All Members (match screenshot)
   - **Rationale:** Use exact PRO copy: `"All Members can move it to [state]"` when a transition has no approvers assigned. Must be i18n key.

#### Confirmed Decisions

- **Kanban blocker**: Client-side inline drag-over message (no modal, no API call for blocked drags)
- **Other layout blocker**: Error toast only on 403 (no modal)
- **WorkflowBlockerModal**: REMOVED — not needed in any layout
- **No-reviewer copy**: "All Members can move it to [state]"

#### Action Items

- [ ] Remove `WorkflowBlockerModal` component from Phase 05 file list
- [ ] Remove `blockerModal` observable from Phase 04 store (session 4 action now superseded)
- [ ] Add `isTransitionAllowed(projectId, fromStateId, toStateId): boolean` helper to WorkflowStore
- [ ] Update Phase 05 Part C Kanban to use dragOver client-side check + inline column blocker
- [ ] Update Phase 05 Part C other layouts to use error toast only on 403
- [ ] Add i18n key `workflow.indicator.all_members` = "All Members"

#### Impact on Phases

- Phase 04: REMOVE `blockerModal` observable; ADD computed `isTransitionAllowed(projectId, fromStateId, toStateId)` that checks transitions in store
- Phase 05: Rewrite Part C — Kanban uses dragOver client-side check + inline blocker card; other layouts use toast only; remove WorkflowBlockerModal entirely
