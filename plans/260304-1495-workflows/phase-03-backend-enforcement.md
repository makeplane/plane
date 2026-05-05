# Phase 03: Backend API Enforcement

## Overview

Modify the Issue API to actively enforce the Workflows constraint rules whenever an issue is created or a state is transitioned. This phase makes the workflow settings "real".

## Requirements (from official docs)

<!-- Updated: Validation Session 1 - Use Phase 01 model/field names -->

### Rule 1 — Creation Guard

> "Items can only be created in states where 'Allow new work items' is enabled."

- Before saving a new issue, if `ProjectWorkflow.is_live = True`, check if the target state's `WorkflowStateConfig.allow_issue_creation = True`.
- If `False` → **block creation** with error 400.

### Rule 2 — Transition Guard

> "Members will only be able to move items to the states you've permitted."
> "If someone tries to make a state change they're not authorized for, they'll see a blocker message."

When `is_live = True` and `state_id` changes on PATCH:

**Step A — Check if transition is permitted:**

- Look up `WorkflowTransition` WHERE `state = current_state` AND `transition_state = new_state` AND `project = project`.
- If NO such transition exists → **block transition**, return 403 with blocker message.

**Step B — Check if user is an authorized approver:**

- If transition exists but has approvers (`WorkflowTransitionApprover.objects.filter(transition=...)`):
  - Check if `request.user` is in the approvers list.
  - If NOT → **block transition**, return 403 with blocker message.
- If transition exists and has NO approvers → **allow** (any team member can make this change).

### Edge Cases

| Condition                                                | Behavior                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| Workflow is NOT live (`is_live=False`)                   | All transitions and creations allowed normally                       |
| State has no `WorkflowStateConfig` record                | No constraints apply for that state (allows creation/transition)     |
| Transition defined, no reviewers assigned                | Anyone on the team can make this transition                          |
| Transition defined, reviewers assigned, user NOT in list | Block, return 403 blocker message                                    |
| Transition NOT defined for this source→target pair       | Block, return 403                                                    |
| Admin role bypassing?                                    | **No** — admins are subject to the same rules per Plane PRO behavior |

## Blocker Message Response

The "blocker message" referenced in the docs is a **403 Forbidden** response with a structured error:

```json
{
  "error": "WORKFLOW_TRANSITION_BLOCKED",
  "message": "You are not authorized to move this work item to the selected state.",
  "detail": {
    "from_state": "<state_name>",
    "to_state": "<state_name>",
    "allowed_reviewers": ["alice", "bob"]
  }
}
```

The frontend displays this as either an error toast or a modal/blocker overlay.

## Related Code Files

- Files to modify: `apps/api/plane/app/views/issue/base.py` (`IssueViewSet.create`, `IssueViewSet.partial_update`)
- Files to modify: `apps/api/plane/app/views/issue/` — check if sub-views also handle state changes (e.g. bulk updates)

## Embedded Rules

1. **Performance**: Fetch `ProjectWorkflow` once per request, use `select_related`/`prefetch_related` to avoid N+1.
2. **HTTP Status**: Use `403 Forbidden` for authorization failures, `400 Bad Request` for creation-state constraint.
3. **Capture `current_instance` BEFORE update** — required for activity logging if state changes.

## Implementation Steps

### Helper function (reusable)

1. Create utility `apps/api/plane/utils/workflow_checker.py`:

   ```python
   def check_workflow_transition(project_id, from_state_id, to_state_id, user) -> tuple[bool, dict]:
       """Returns (is_allowed, error_detail). Call this before any state change."""

   def check_workflow_creation(project_id, state_id) -> tuple[bool, str]:
       """Returns (is_allowed, error_message). Call before creating issue."""
   ```

2. In `check_workflow_transition`:
   - Fetch `ProjectWorkflow.objects.filter(project_id=project_id, is_live=True)`. If none → allow.
   - Fetch `WorkflowTransition` WHERE `state=from_state, transition_state=to_state, project=project`. If none → block.
   - Fetch `WorkflowTransitionApprover` for that transition. If none → allow. If any → check if user in list.
3. In `check_workflow_creation`:
   - Fetch workflow. If not live → allow.
   - Fetch `WorkflowStateConfig.objects.filter(project_id=project_id, state_id=state_id)`. Check `allow_issue_creation`.

### Inject into IssueViewSet

4. In `IssueViewSet.create()` — after parsing `state_id` from request data:
   ```python
   is_allowed, msg = check_workflow_creation(project_id, state_id)
   if not is_allowed:
       return Response({"error": msg}, status=400)
   ```
5. In `IssueViewSet.partial_update()` — after detecting state change:
   ```python
   if "state_id" in request.data and request.data["state_id"] != issue.state_id:
       is_allowed, detail = check_workflow_transition(project_id, issue.state_id, new_state_id, request.user)
       if not is_allowed:
           return Response({"error": "WORKFLOW_TRANSITION_BLOCKED", ...detail}, status=403)
   ```
6. <!-- Updated: Validation Session 6 - Bulk enforcement is REQUIRED --> Also apply workflow enforcement to bulk state update endpoints: locate any `bulk_update` or equivalent endpoint in `IssueViewSet` or related viewsets; call `check_workflow_transition` for each issue being updated; collect per-issue errors and return partial failure response where applicable.

## Post-Phase Checklist

- [ ] `check_workflow_transition` correctly blocks unauthorized transitions.
- [ ] `check_workflow_creation` correctly blocks creation in restricted states.
- [ ] 403 returned (not 400) for transition violations.
- [ ] 400 returned for creation in restricted state.
- [ ] No extra DB queries per unrelated field update (workflow check only runs if `state_id` changes).
- [ ] Works correctly when workflow is NOT live (no-op).
- [ ] Works correctly when state has no WorkflowState record (no-op).
- [ ] Blocker response includes `allowed_reviewers` list for frontend to display.

## Success Criteria

- Unauthorized state transitions return 403 with structured error.
- Creating issues in restricted states returns 400.
- Authorized transitions proceed normally.

## Completion Status

**Status**: COMPLETED
**Completed on**: 2026-03-05

Workflow enforcement logic integrated into IssueViewSet. Creation guards, transition guards, and bulk update enforcement all implemented. 403 and 400 response handling functional across all issue modification endpoints.
