# Phase 01: Backend Models

## Overview

Create database schema for Workflows based on **reverse-engineered Plane PRO API structure**.

## Real API Endpoints (from network capture on Plane PRO app)

```
GET  /api/workspaces/{slug}/workflow-states/?project_id={id}
POST /api/workspaces/{slug}/projects/{id}/workflow-transitions/
     Body: { "state_id": "<source_state_uuid>", "transition_state_id": "<target_state_uuid>" }
POST /api/workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/approvers/
     Body: { "approver_ids": ["<user_uuid>"] }
DELETE /api/workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/
PATCH  /api/workspaces/{slug}/projects/{id}/workflow/
       Body: { "is_live": true/false }
       (for toggling Live status)
PATCH  /api/workspaces/{slug}/workflow-states/{state_id}/
       Body: { "allow_issue_creation": true/false }
       (for toggling "Allow new work items" per state)
```

## GET /workflow-states/ Response Structure (actual JSON from PRO)

```json
{
  "<state_uuid>": {
    "allow_issue_creation": true,
    "transitions": {}
  },
  "<state_uuid_with_transitions>": {
    "allow_issue_creation": true,
    "transitions": {
      "<transition_id>": {
        "transition_state": "<target_state_uuid>",
        "approvers": ["<user_uuid>"]
      }
    }
  }
}
```

**Key observations:**

- The response is **keyed by state_uuid** (flat dict, not array)
- Field is called `allow_issue_creation` (NOT `allow_new_work_items`)
- Transitions are indexed by `transition_id` (UUID)
- Each transition has `transition_state` (target) + `approvers` array (list of user UUIDs)
- The overall `is_live` flag is NOT in this response (likely in separate `/workflow/` endpoint)

## DELETE Confirmation UI

When deleting a transition, a **modal appears**:

- Title: _"Are you sure you want to delete this state-change rule?"_
- Body: _"Once deleted, you can't undo this change and you will have to set the rule again if you want it running for this project."_
- Buttons: Cancel + Delete (red)

## Data Model Design (aligned with actual API)

```
WorkflowTransition  ←  the core entity (maps to /workflow-transitions/ endpoint)
  id: UUID
  project: FK(Project)
  workspace: FK(Workspace)        ← via ProjectBaseModel
  state: FK(State)                ← "state_id" = source state
  transition_state: FK(State)     ← "transition_state_id" = target state
  created_by, updated_by          ← via BaseModel audit fields

WorkflowTransitionApprover        ← maps to /workflow-transitions/{id}/approvers/
  id: UUID
  transition: FK(WorkflowTransition)
  approver: FK(settings.AUTH_USER_MODEL)
  project: FK(Project)            ← via ProjectBaseModel

WorkflowStateConfig               ← maps to /workflow-states/{state_id}/ PATCH
  id: UUID
  project: FK(Project)
  state: FK(State)  UNIQUE per project
  allow_issue_creation: BooleanField(default=True)

ProjectWorkflow                   ← the master toggle
  id: UUID
  project: OneToOneField(Project)
  workspace: FK(Workspace)
  is_live: BooleanField(default=False)

WorkflowActivity                  ← audit log (View change history)
  id: UUID
  project: FK(Project)
  workflow: FK(ProjectWorkflow)
  field: CharField                 ← changed field name, e.g. "is_live", "transition_added"
  old_value: TextField null=True
  new_value: TextField null=True
  actor: FK(User) null=True
```

## Related Code Files

- Files to create: `apps/api/plane/db/models/workflow.py`
- Files to modify: `apps/api/plane/db/models/__init__.py`

## Embedded Rules

1. **Model Inheritance**: All models inherit `ProjectBaseModel` (not `BaseModel`) since all are project-scoped.
2. **Unique Constraints**: Must add soft-delete guards `condition=Q(deleted_at__isnull=True)`.
3. **Field names**: Use exact field names matching PRO API:
   - `allow_issue_creation` (NOT `allow_new_work_items`)
   - `transition_state` (NOT `target_state`)
   - `approver` (NOT `reviewer` or `member`)
4. **Registration**: All models in `__init__.py`.
5. **Managers**: SoftDeletionManager auto-excludes deleted records.

## Implementation Steps

1. Create `workflow.py` in `plane/db/models/`.

2. Define `ProjectWorkflow(ProjectBaseModel)`:

   ```python
   class ProjectWorkflow(ProjectBaseModel):
       is_live = models.BooleanField(default=False)

       class Meta:
           unique_together = [("project", "workspace")]
           db_table = "project_workflows"
   ```

3. Define `WorkflowStateConfig(ProjectBaseModel)`:

   ```python
   class WorkflowStateConfig(ProjectBaseModel):
       state = models.ForeignKey("db.State", on_delete=models.CASCADE, related_name="workflow_config")
       allow_issue_creation = models.BooleanField(default=True)

       class Meta:
           unique_together = [("project", "state")]
           db_table = "workflow_state_configs"
   ```

4. Define `WorkflowTransition(ProjectBaseModel)`:

   ```python
   # <!-- Updated: Validation Session 3 - UniqueConstraint with soft-delete condition replaces unique_together -->
   class WorkflowTransition(ProjectBaseModel):
       state = models.ForeignKey("db.State", on_delete=models.CASCADE, related_name="outgoing_transitions")
       transition_state = models.ForeignKey("db.State", on_delete=models.CASCADE, related_name="incoming_transitions")

       class Meta:
           constraints = [
               models.UniqueConstraint(
                   fields=["project", "state", "transition_state"],
                   condition=models.Q(deleted_at__isnull=True),
                   name="unique_workflow_transition_active",
               )
           ]
           db_table = "workflow_transitions"
   ```

5. Define `WorkflowTransitionApprover(ProjectBaseModel)`:

   ```python
   # <!-- Updated: Validation Session 3 - UniqueConstraint with soft-delete condition replaces unique_together -->
   class WorkflowTransitionApprover(ProjectBaseModel):
       transition = models.ForeignKey(WorkflowTransition, on_delete=models.CASCADE, related_name="approvers")
       approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workflow_approvals")

       class Meta:
           constraints = [
               models.UniqueConstraint(
                   fields=["transition", "approver"],
                   condition=models.Q(deleted_at__isnull=True),
                   name="unique_workflow_approver_active",
               )
           ]
           db_table = "workflow_transition_approvers"
   ```

6. Define `WorkflowActivity(ProjectBaseModel)`:

   ```python
   class WorkflowActivity(ProjectBaseModel):
       field = models.CharField(max_length=255)
       old_value = models.TextField(null=True, blank=True)
       new_value = models.TextField(null=True, blank=True)
       actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

       class Meta:
           db_table = "workflow_activities"
           ordering = ["-created_at"]
   ```

7. Register all 5 models in `apps/api/plane/db/models/__init__.py`.
8. Run `python manage.py makemigrations`.

## Post-Phase Checklist

- [ ] 5 models created, all inheriting `ProjectBaseModel`.
- [ ] Field name `allow_issue_creation` (matches PRO API).
- [ ] Field name `transition_state` (matches PRO API).
- [ ] Field name `approver` (matches PRO API).
- [ ] `WorkflowTransition` uses `UniqueConstraint` with `condition=Q(deleted_at__isnull=True)` (NOT `unique_together`).
- [ ] `WorkflowTransitionApprover` uses `UniqueConstraint` with `condition=Q(deleted_at__isnull=True)` (NOT `unique_together`).
- [ ] Registered in `__init__.py`.
- [ ] Migrations created successfully.

## Success Criteria

- Models load cleanly. Can be queried in Django shell. Migrations generated.
