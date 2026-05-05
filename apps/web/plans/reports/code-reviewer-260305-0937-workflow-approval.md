# Code Review: Workflow Approval Feature

**Date:** 2026-03-05
**Branch:** ngoc-feat/workflow-approval
**Score: 7 / 10**

---

## Scope

| Layer               | Files Reviewed                                                         |
| ------------------- | ---------------------------------------------------------------------- |
| Backend models      | `plane/db/models/workflow.py` (5 models)                               |
| Backend serializers | `plane/app/serializers/workflow.py`                                    |
| Backend views       | `plane/app/views/workflow.py`, `plane/app/views/issue/base.py` (patch) |
| Backend utils       | `plane/utils/workflow_checker.py`                                      |
| Backend URLs        | `plane/app/urls/workflow.py`                                           |
| Frontend types      | `packages/types/src/workflow.ts`                                       |
| Frontend service    | `apps/web/ce/services/workflow.service.ts`                             |
| Frontend store      | `apps/web/ce/store/workflow.store.ts`                                  |
| Frontend hook       | `apps/web/core/hooks/store/use-workflow.ts`                            |
| Frontend root store | `apps/web/ce/store/root.store.ts`                                      |
| Frontend components | drag hook, kanban indicator, blocker modal, settings UI (8 files)      |
| Frontend layout     | `apps/web/app/.../[projectId]/layout.tsx`                              |

---

## Overall Assessment

The implementation is architecturally sound and follows the CE pattern correctly. All new code lives in `ce/`, `core/` is unmodified except for the hook import. The MobX store, SWR fetch, and 403-modal pattern are clean. The main concerns are security gaps on the backend (cross-project/cross-workspace data leakage, missing approver membership validation) and one incomplete UI feature (add-reviewer button is a stub).

---

## Critical Issues

### 1. Cross-Project Data Leakage in `WorkflowStateConfigViewSet.list`

**File:** `apps/api/plane/app/views/workflow.py`, lines 66–72

The `@allow_permission` decorator authenticates the user against the workspace `slug`, but `project_id` comes from an unvalidated query parameter. The subsequent `WorkflowStateConfig.objects.filter(project_id=project_id)` and `WorkflowTransition.objects.filter(project_id=project_id)` queries **do not verify that the project belongs to the slug workspace**. A member of workspace A who supplies a `project_id` from workspace B will receive that project's workflow configuration.

```python
# CURRENT — project_id is not checked against the workspace
configs = {
    str(c.state_id): c
    for c in WorkflowStateConfig.objects.filter(project_id=project_id)   # no workspace join
}
transitions = list(
    WorkflowTransition.objects.filter(project_id=project_id)              # no workspace join
)

# FIX — add the workspace scope
WorkflowStateConfig.objects.filter(
    project_id=project_id,
    project__workspace__slug=slug,
)
WorkflowTransition.objects.filter(
    project_id=project_id,
    project__workspace__slug=slug,
)
```

**Impact:** Information disclosure across tenants. Severity: HIGH.

### 2. `_reset` Bypasses Workspace Scope Validation

**File:** `apps/api/plane/app/views/workflow.py`, lines 176–206

`_reset` is called only through `post()` which carries `@allow_permission([ROLE.ADMIN])`, so RBAC is enforced. However all ORM queries inside `_reset` filter only on `project_id` without scoping to `workspace__slug=slug`. If another admin somehow supplies a UUID belonging to a different workspace's project (e.g., via a confused-deputy scenario), the reset will affect that project.

```python
# All three queries need the workspace join:
WorkflowTransitionApprover.objects.filter(
    project_id=project_id,
    project__workspace__slug=slug,   # add this
)
WorkflowTransition.objects.filter(
    project_id=project_id,
    project__workspace__slug=slug,   # add this
)
WorkflowStateConfig.objects.filter(
    project_id=project_id,
    project__workspace__slug=slug,   # add this
)
```

**Impact:** Cross-workspace data destruction under a confused-deputy path. Severity: HIGH (mitigated in practice by the `_get_or_create_workflow` call on GET/PATCH which validates the slug, but `_reset` is a separate code path that does not call it).

### 3. Approver IDs Are Not Validated Against Project Membership

**File:** `apps/api/plane/app/views/workflow.py`, lines 307–317

`WorkflowTransitionApproverViewSet.create` accepts an arbitrary list of `approver_ids` and creates `WorkflowTransitionApprover` rows without checking that each ID is a member of the project. An admin can add any user in the system (or any valid UUID) as an approver.

```python
# MISSING check — add before the loop:
valid_member_ids = set(
    ProjectMember.objects.filter(
        project_id=project_id,
        member_id__in=approver_ids,
        is_active=True,
    ).values_list("member_id", flat=True)
)
invalid = [aid for aid in approver_ids if str(aid) not in {str(v) for v in valid_member_ids}]
if invalid:
    return Response({"error": "Some approver_ids are not project members"}, status=400)
```

**Impact:** Workflow approval can be configured to reference non-members, making transitions permanently unblockable (no one on the project can ever satisfy the approver check). Severity: HIGH.

---

## High Priority

### 4. `WorkflowTransition.destroy` Does Not Validate Workspace Scope

**File:** `apps/api/plane/app/views/workflow.py`, line 265

```python
transition = WorkflowTransition.objects.get(pk=pk, project_id=project_id)
```

Missing `project__workspace__slug=slug`. An admin in workspace A who knows a transition UUID from workspace B can delete it.

```python
# Fix:
transition = WorkflowTransition.objects.get(
    pk=pk,
    project_id=project_id,
    project__workspace__slug=slug,
)
```

### 5. `WorkflowTransitionApprover.destroy` Does Not Validate Workspace Scope

**File:** `apps/api/plane/app/views/workflow.py`, lines 333–336

Same pattern — `pk` + `project_id` only. Add `project__workspace__slug=slug`.

### 6. `isTransitionAllowed` Returns `true` When `stateData` Is Missing

**File:** `apps/web/ce/store/workflow.store.ts`, lines 96–98

```typescript
const stateData = data.states[fromStateId];
if (!stateData) return true; // treated as "no restriction"
```

If the frontend store is stale (e.g., a new state was created after `fetchWorkflow`) then a transition involving the new state is silently allowed client-side. This is a soft bypass — the backend enforces correctly, but the drag-and-drop UI will not show the blocker card, giving a misleading UX. A refetch or a fallback-to-block strategy would be safer when workflow is live.

### 7. Add-Reviewer Button Is a Non-Functional Stub

**File:** `apps/web/ce/components/projects/settings/workflows/transition-row.tsx`, lines 83–88

```tsx
onClick={async () => {
  // Placeholder: member picker would open here
  // For now, just a stub — wire to member picker in integration
}}
```

The button renders in the settings UI but does nothing. Approvers can only be removed, never added from the UI. The backend `addApprovers` service method exists but is wired to nothing. This is a broken user-facing feature.

---

## Medium Priority

### 8. `WorkflowBlockerModal` Uses Global `unhandledrejection` — Fragile

**File:** `apps/web/ce/components/issues/workflow/workflow-blocker-modal.tsx`, lines 30–43

The modal opens by listening to `window.unhandledrejection`. This couples workflow error handling to the global error bus. Any other part of the app that accidentally throws an object shaped like `{ error: "WORKFLOW_TRANSITION_BLOCKED", detail: {...} }` will open the modal. A per-call error handler in the issue update path would be far more robust.

### 9. `useWorkflowStore` Uses `as unknown as` Cast

**File:** `apps/web/core/hooks/store/use-workflow.ts`, line 14

```typescript
return (context as unknown as { workflowStore: IWorkflowStore }).workflowStore;
```

The store context is not typed to include `workflowStore`. This should be resolved by either typing the context correctly or exposing a typed `RootStore` from the CE root. The double-cast hides real type errors.

### 10. `WorkflowStateConfigSerializer` Exposes `state` FK as UUID in Read, Blocks Write

**File:** `apps/api/plane/app/serializers/workflow.py`, line 32

`state` is in `read_only_fields`, which is correct for PATCH. But the field is also in the serializer's `fields` list, meaning the state UUID is serialized on responses even though the client already knows it (it's the lookup key). Minor over-exposure, no real risk.

### 11. `WorkflowTransitionSerializer.serializer_class` Mismatch in `WorkflowTransitionApproverViewSet`

**File:** `apps/api/plane/app/views/workflow.py`, line 287

`WorkflowTransitionApproverViewSet.serializer_class = WorkflowTransitionSerializer` — this is the transition serializer, not an approver serializer. The viewset returns a `WorkflowTransition` on POST (which is valid) but the declared `serializer_class` is misleading since `model = WorkflowTransitionApprover`. If any framework tooling auto-uses `serializer_class` it will fail. At minimum this is confusing.

### 12. Inconsistent Soft-Delete vs Hard-Delete in `_reset`

**File:** `apps/api/plane/app/views/workflow.py`, lines 187–190

Transitions and approvers are soft-deleted (keeping audit trail), but `WorkflowStateConfig` is hard-deleted. This inconsistency means activity log for `allow_issue_creation` changes disappears on reset while transition activity is preserved. Intentional or oversight — should be documented.

### 13. `WorkflowActivityLog` Has Hardcoded English Strings

**File:** `apps/web/ce/components/projects/settings/workflows/activity-log.tsx`, lines 44, 56

```tsx
<span className="text-color-secondary mx-1">changed</span>
// ...
<div className="py-6 text-center text-sm text-color-tertiary">No activity yet.</div>
```

These strings bypass i18n (`useTranslation` is imported but used only for one label). All visible strings must use `t()`.

### 14. `WorkflowStateInfoPopup` Has Hardcoded English String

**File:** `apps/web/ce/components/issues/workflow/workflow-state-info-popup.tsx`, line 73

```tsx
<p className="text-xs text-color-tertiary">No transitions defined into this state.</p>
```

Missing `t()` call.

---

## Low Priority

### 15. `WorkflowStore.fetchActivity` Does Not Cache

The method calls the service directly and returns raw data — callers must manage their own state (which `WorkflowActivityLog` does via local `useState`). This is fine but inconsistent with the rest of the store pattern. Not a bug.

### 16. `_log_activity` Called Synchronously on Every Write

Audit logging is synchronous on the DB write path. For high-frequency operations this adds latency. Should be async (Celery task) in production. Low risk at current scale.

### 17. `confirm()` Used for Destructive Actions

**Files:** `root.tsx` line 54, `workflow-state-card.tsx` line 45

Browser `confirm()` is acceptable but blocks the main thread and is not styleable. Replace with a proper modal for production quality.

---

## Edge Cases Found

1. **State deleted after workflow fetch**: If a state is deleted between `fetchWorkflow` and drag-and-drop, `fromStateId` will not exist in `data.states`, `isTransitionAllowed` returns `true` (see issue 6 above), and the backend will see a non-existent `state_id` in the transition lookup — which returns `False` and blocks correctly. The frontend UX is misleading but not a security issue.

2. **Self-transition**: Nothing prevents adding a transition `state → state` (same state). The DB constraint is on `(project, state, transition_state)` — it allows `state == transition_state`. The workflow checker would then allow a "transition" to the same state with approver restrictions, which is nonsensical. Add a validation check.

3. **Workflow reset while transition is in progress**: If a user begins a drag-and-drop and the admin resets the workflow concurrently, the frontend store is stale. The drag will be visually allowed but the backend will correctly enforce the post-reset state (no transitions = all allowed since workflow becomes `is_live=False`). No data integrity issue but UX will be confusing.

4. **Approver UUID collision**: `WorkflowTransitionApprover.objects.get_or_create` uses `approver_id` as part of the lookup key. If the soft-delete pattern is in play (i.e., a deleted approver row exists), `get_or_create` will create a new active row while the deleted row remains. The unique constraint is conditioned on `deleted_at__isnull=True`, so duplicates across deleted/active states are possible. No functional impact but messy data.

5. **`getWorkflowStates` list view — no pagination**: The entire workflow state dict is returned in one response. For projects with hundreds of states + transitions + approvers this becomes a large payload with no size limit.

---

## Positive Observations

- CE pattern followed cleanly — no `core/` modifications except the hook import path which is correct.
- MobX `runInAction` used correctly on every async action; no observable mutations outside actions.
- `useSWR` with `revalidateIfStale: false, revalidateOnFocus: false` in the layout is appropriate — workflow data is admin-controlled and should not auto-refetch aggressively.
- The `WorkflowBlockerModal` mounted at project-layout level (not per-view) is the right approach to avoid duplicating the event listener.
- `@plane/propel/*` used for Button and Toast (over legacy `@plane/ui`). Compliant.
- Soft-delete constraint `condition=models.Q(deleted_at__isnull=True)` on `WorkflowTransition` is correct — allows re-adding a previously deleted transition.
- `WorkflowTransitionSerializer.get_approvers` uses `values_list` flat — efficient, no N+1.
- `check_workflow_transition` is pure and well-structured; easy to unit test.
- `fetchWorkflow` uses `Promise.all` for parallel fetching — good.

---

## Recommended Actions (Prioritized)

1. **[Critical]** Add `project__workspace__slug=slug` scope to all ORM queries in `WorkflowStateConfigViewSet.list` (configs and transitions).
2. **[Critical]** Add same workspace scope to all queries in `_reset`.
3. **[Critical]** Validate `approver_ids` against `ProjectMember` before creating `WorkflowTransitionApprover` rows.
4. **[High]** Add `project__workspace__slug=slug` to `WorkflowTransition.destroy` and `WorkflowTransitionApprover.destroy` lookups.
5. **[High]** Implement the add-reviewer member-picker in `transition-row.tsx` — currently a broken stub.
6. **[High]** Replace `window.unhandledrejection` in `WorkflowBlockerModal` with a direct error handler in the issue update call site.
7. **[Medium]** Fix `useWorkflowStore` to use a properly typed context instead of `as unknown as`.
8. **[Medium]** Add self-transition guard in `WorkflowTransitionViewSet.create` (`state_id != transition_state_id`).
9. **[Medium]** Replace all hardcoded English strings in `activity-log.tsx` and `workflow-state-info-popup.tsx` with `t()` calls.
10. **[Low]** Document or standardize the soft-delete vs hard-delete split in `_reset`.

---

## Metrics

| Metric                  | Value                 |
| ----------------------- | --------------------- |
| Backend files reviewed  | 6                     |
| Frontend files reviewed | 14                    |
| Critical issues         | 3                     |
| High issues             | 4                     |
| Medium issues           | 7                     |
| Low issues              | 3                     |
| i18n violations         | 3 strings             |
| Broken UI features      | 1 (add-reviewer stub) |

---

## Unresolved Questions

1. Is the self-transition case (`state → same state`) intentionally excluded or an oversight?
2. Is `WorkflowStateConfig` hard-deletion on reset intentional (discard allow_issue_creation history) or should it be soft-deleted for consistency with transitions?
3. The `WorkflowTransitionApproverViewSet.serializer_class = WorkflowTransitionSerializer` — is returning the full transition on approver POST/DELETE intentional API design, or should it return a minimal approver response?
4. Is there a plan to wire the add-reviewer button to a member picker, or is approver management intended to be API-only for now?
