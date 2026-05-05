# Phase 02: Backend API Views

## Overview

Implement APIs matching the **exact Plane PRO API structure** captured from network analysis.

## Real API Endpoints (from Plane PRO network capture)

| Action                         | Endpoint                                                                       | Method   | Body                                                |
| ------------------------------ | ------------------------------------------------------------------------------ | -------- | --------------------------------------------------- |
| Get all workflow state configs | `/workspaces/{slug}/workflow-states/?project_id={id}`                          | `GET`    | —                                                   |
| Toggle Live                    | `/workspaces/{slug}/projects/{id}/workflow/`                                   | `PATCH`  | `{"is_live": true}`                                 |
| Toggle Allow issue creation    | `/workspaces/{slug}/workflow-states/{state_id}/`                               | `PATCH`  | `{"allow_issue_creation": true}`                    |
| Add transition                 | `/workspaces/{slug}/projects/{id}/workflow-transitions/`                       | `POST`   | `{"state_id": "...", "transition_state_id": "..."}` |
| Delete transition              | `/workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/`                 | `DELETE` | —                                                   |
| Add approver(s)                | `/workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/approvers/`       | `POST`   | `{"approver_ids": ["user_uuid"]}`                   |
| Delete approver                | `/workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/approvers/{aid}/` | `DELETE` | —                                                   |
| Reset workflow                 | `/workspaces/{slug}/projects/{id}/workflow/reset/`                             | `POST`   | —                                                   |
| View activity                  | `/workspaces/{slug}/projects/{id}/workflow/activity/`                          | `GET`    | —                                                   |

## GET /workflow-states/ Response Format (exact)

```json
{
  "<state_uuid>": {
    "allow_issue_creation": true,
    "transitions": {}
  },
  "<state_uuid_with_transitions>": {
    "allow_issue_creation": true,
    "transitions": {
      "<transition_uuid>": {
        "transition_state": "<target_state_uuid>",
        "approvers": ["<user_uuid>", ...]
      }
    }
  }
}
```

Note: Response is a **flat dict keyed by state UUID**, not an array. Each state always appears even if no transitions.

## Related Code Files

- Files to create: `apps/api/plane/app/views/workflow.py`
- Files to create: `apps/api/plane/app/serializers/workflow.py`
- Files to create: `apps/api/plane/app/urls/workflow.py`
- Files to modify: `apps/api/plane/app/urls/__init__.py`
- Files to modify: `apps/api/plane/app/views/__init__.py`
- Files to modify: `apps/api/plane/app/serializers/__init__.py`

## Embedded Rules

1. **Serializer Layering**: Internal API (`plane/app/`) only — never mix with external API (`plane/api/`).
2. **Permissions**:
   - All workflow read: `ROLE.MEMBER`
   - Workflow mutations (add/delete transitions, toggle live): `ROLE.ADMIN`
   - Add/delete approvers: `ROLE.ADMIN`
3. **Workspace slug filter**: ALL querysets must filter `project__workspace__slug=slug` or equivalent.
4. **Activity logging**: After every mutation, create a `WorkflowActivity` record.
5. **GET returns ALL states**: Even states with no transitions must appear in the dict (with empty `transitions: {}`).

## Serializer Design

```python
# serializers/workflow.py

class WorkflowTransitionSerializer(serializers.ModelSerializer):
    """Used inside the nested GET response"""
    approvers = serializers.SerializerMethodField()

    def get_approvers(self, obj):
        return list(obj.approvers.values_list("approver_id", flat=True))

class WorkflowStateConfigSerializer(serializers.ModelSerializer):
    """For PATCH /workflow-states/{id}/ response"""
    class Meta:
        model = WorkflowStateConfig
        fields = ["id", "state", "allow_issue_creation"]
```

## View Design

```python
# views/workflow.py

class WorkflowStateConfigViewSet(BaseViewSet):
    """
    GET  /workspaces/{slug}/workflow-states/?project_id={id}
    PATCH /workspaces/{slug}/workflow-states/{state_id}/
    """
    # <!-- Updated: Validation Session 3 - Do NOT use get_or_create; compute defaults in Python without persisting -->
    def list(self, request, slug):
        # Fetch all states for the project
        # Fetch only existing WorkflowStateConfig rows (no auto-create)
        # For states without a config row, default allow_issue_creation=True in Python
        project_id = request.query_params.get("project_id")
        states = State.objects.filter(project_id=project_id, project__workspace__slug=slug)
        configs = {
            str(c.state_id): c
            for c in WorkflowStateConfig.objects.filter(project_id=project_id)
        }
        transitions = WorkflowTransition.objects.filter(
            project_id=project_id
        ).prefetch_related("approvers")

        result = {}
        for state in states:
            config = configs.get(str(state.id))
            result[str(state.id)] = {
                "allow_issue_creation": config.allow_issue_creation if config else True,
                "transitions": { str(t.id): {...} for t in transitions if t.state_id == state.id }
            }
        return Response(result)

class ProjectWorkflowViewSet(BaseViewSet):
    """
    GET  /workspaces/{slug}/projects/{id}/workflow/
    PATCH /workspaces/{slug}/projects/{id}/workflow/ - toggle is_live
    POST  /workspaces/{slug}/projects/{id}/workflow/reset/
    GET   /workspaces/{slug}/projects/{id}/workflow/activity/
    """

class WorkflowTransitionViewSet(BaseViewSet):
    """
    POST   /workspaces/{slug}/projects/{id}/workflow-transitions/
           Body: { state_id, transition_state_id }
    DELETE /workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/
    """
    # On POST: check UniqueConstraint, log activity

class WorkflowTransitionApproverViewSet(BaseViewSet):
    """
    POST   /workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/approvers/
           Body: { approver_ids: [uuid, ...] }  ← bulk add
    DELETE /workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/approvers/{aid}/
    """
    # POST accepts array of approver_ids (can add multiple at once)
```

## Implementation Steps

### Serializers (`serializers/workflow.py`)

1. `WorkflowStateConfigSerializer` — `id`, `state`, `allow_issue_creation`
2. `WorkflowTransitionSerializer` — `id`, `state`, `transition_state`, `approvers` (list of user UUIDs)
3. `WorkflowActivitySerializer` — `id`, `field`, `old_value`, `new_value`, `actor`, `created_at`

### Views (`views/workflow.py`)

4. `WorkflowStateConfigViewSet`:
   - `list()` → builds flat dict response for all project states
   - `partial_update()` → PATCH `allow_issue_creation`
5. `ProjectWorkflowViewSet`:
   - `retrieve()` → GET the ProjectWorkflow (or create one if first time)
   - `partial_update()` → PATCH `is_live`
   - `reset()` action → soft-delete all `WorkflowTransition` + `WorkflowTransitionApprover` records via `deleted_at=now()`, then **hard-delete all `WorkflowStateConfig` rows** for the project (so `allow_issue_creation` reverts to `True` default), then set `is_live=False` <!-- Updated: Validation Session 1 - soft-delete confirmed --> <!-- Updated: Validation Session 4 - full reset also deletes WorkflowStateConfig rows -->
   - `activity()` action → list `WorkflowActivity` records
6. `WorkflowTransitionViewSet`:
   - `create()` → POST with `state_id` + `transition_state_id`
   - `destroy()` → DELETE (shows confirmation in frontend before calling)
7. `WorkflowTransitionApproverViewSet`:
   - `create()` → POST with `approver_ids` array (bulk insert)
   - `destroy()` → DELETE single approver

### URLs (`urls/workflow.py`)

8. Register all URL patterns under `workspaces/<str:slug>/`:
   ```
   workflow-states/                                    → GET (list by project_id)
   workflow-states/<uuid:state_id>/                    → PATCH
   projects/<uuid:project_id>/workflow/                → GET, PATCH
   projects/<uuid:project_id>/workflow/reset/          → POST
   projects/<uuid:project_id>/workflow/activity/       → GET
   projects/<uuid:project_id>/workflow-transitions/    → POST
   projects/<uuid:project_id>/workflow-transitions/<uuid:transition_id>/         → DELETE
   projects/<uuid:project_id>/workflow-transitions/<uuid:transition_id>/approvers/ → POST
   projects/<uuid:project_id>/workflow-transitions/<uuid:transition_id>/approvers/<uuid:approver_id>/ → DELETE
   ```

## Post-Phase Checklist

- [ ] GET `/workflow-states/` returns flat dict keyed by state UUID.
- [ ] Response includes ALL project states (even those with no transitions).
- [ ] `transitions` dict inside each state uses transition UUID as key.
- [ ] PATCH `/workflow-states/{id}/` updates `allow_issue_creation`.
- [ ] POST `/workflow-transitions/` accepts `state_id` + `transition_state_id`.
- [ ] POST `/approvers/` accepts `approver_ids` array (bulk).
- [ ] All `workspace__slug` filters in querysets.
- [ ] `ROLE.ADMIN` required for mutations.
- [ ] `WorkflowActivity` records created after mutations.

## Success Criteria

- Full CRUD works via API with responses matching the Plane PRO format exactly.

## Completion Status

**Status**: COMPLETED
**Completed on**: 2026-03-05

All REST API endpoints implemented. ViewSets, serializers, and URL routing configured. Full CRUD operations functional with Plane PRO API format compliance.
