# Phase 4: Audit Trail + Reason Display in Activity Feed

<!-- Updated: Validation Session 1 - Merged from Phase 4 (reason display) + Phase 6 (admin modification history) -->

## Context Links

- Activity task: `apps/api/plane/bgtasks/issue_activities_task.py`
- Activity root: `apps/web/ce/components/issues/worklog/activity/root.tsx`
- Activity store: `apps/web/ce/store/issue/issue-details/activity.store.ts`
- View (backend): `apps/api/plane/app/views/issue/worklog.py`

## Overview

- **Priority**: P1
- **Status**: complete
- **Description**: Create `IssueActivity` records for worklog edit/delete with reason. Render audit trail entries in activity feed visible to all project members.

## Key Insights

- `ACTIVITY_MAPPER` has no `worklog.activity.*` entries — Celery task currently no-ops for worklog types
- Add mapper functions → `IssueActivity` records created for edit/delete with reason in `new_value`
- Existing WORKLOG entries from WorklogStore show "created" events; IssueActivity records show "updated"/"deleted" — no duplication
- All project members see modification entries (not admin-only)

## Requirements

### Functional

1. Admin edits worklog → activity feed: "[Admin] modified time log: [changes] — Reason: [reason]"
2. Admin deletes worklog → activity feed: "[Admin] deleted time log ([duration] on [date]) — Reason: [reason]"
3. Visible to ALL project members
4. Original worklog creation entries remain unchanged
5. Modification entries visually distinct (different icon)

### Non-functional

- Reason stored as plain text in `IssueActivity.new_value`
- No model migration needed

## Architecture

Add worklog activity handler functions in `issue_activities_task.py`:

```python
"worklog.activity.updated": worklog_activity_updated,
"worklog.activity.deleted": worklog_activity_deleted,
```

Each creates `IssueActivity` with:

- `field` = "worklog"
- `verb` = "updated" / "deleted"
- `old_value` = what changed (duration diff, date diff)
- `new_value` = reason text
- `actor` = admin user

Frontend renders these like other activity entries, with `PencilLine`/`Trash2` icons.

## Related Code Files

### Modify

- `apps/api/plane/bgtasks/issue_activities_task.py` — add `worklog_activity_updated()`, `worklog_activity_deleted()`, register in `ACTIVITY_MAPPER`
- `apps/web/ce/components/issues/worklog/activity/root.tsx` — render modification/deletion entries with distinct styling

### No changes needed

- `apps/web/ce/store/issue/issue-details/activity.store.ts` — IssueActivity records auto-appear in feed

## Implementation Steps

### 1. Add worklog activity functions in `issue_activities_task.py`

```python
def worklog_activity_updated(requested_data, current_instance, issue_id, project_id, workspace_id, actor_id, issue_activities, epoch):
    requested = json.loads(requested_data) if requested_data else {}
    current = json.loads(current_instance) if current_instance else {}
    reason = requested.get("reason", "")

    changes = []
    if "duration_minutes" in requested and requested.get("duration_minutes") != current.get("duration_minutes"):
        changes.append(f"duration: {current.get('duration_minutes')}m → {requested.get('duration_minutes')}m")
    if "logged_at" in requested and requested.get("logged_at") != current.get("logged_at"):
        changes.append(f"date: {current.get('logged_at')} → {requested.get('logged_at')}")
    if "description" in requested and requested.get("description") != current.get("description"):
        changes.append("description updated")

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id, project_id=project_id, workspace_id=workspace_id,
            actor_id=actor_id, verb="updated", field="worklog",
            old_value=", ".join(changes) if changes else "worklog updated",
            new_value=reason, epoch=epoch,
        )
    )


def worklog_activity_deleted(requested_data, current_instance, issue_id, project_id, workspace_id, actor_id, issue_activities, epoch):
    requested = json.loads(requested_data) if requested_data else {}
    current = json.loads(current_instance) if current_instance else {}
    reason = requested.get("reason", "")
    duration = current.get("duration_minutes", 0)

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id, project_id=project_id, workspace_id=workspace_id,
            actor_id=actor_id, verb="deleted", field="worklog",
            old_value=f"{duration}m logged", new_value=reason, epoch=epoch,
        )
    )
```

### 2. Register in ACTIVITY_MAPPER

```python
"worklog.activity.updated": worklog_activity_updated,
"worklog.activity.deleted": worklog_activity_deleted,
```

### 3. Frontend: Render modification/deletion activities

In activity component, detect `field="worklog"` with `verb="updated"/"deleted"`:

- Edit: `PencilLine` icon + "[Admin] modified time log: [old_value] — Reason: [new_value]"
- Delete: `Trash2` icon + "[Admin] deleted time log: [old_value] — Reason: [new_value]"
- Use `text-tertiary` for reason line

## Frontend Display Design

```
🔧 Ngoc modified a time log — 2h 30m → 3h 00m
   Reason: "Corrected time entry per team standup"
   Mar 17, 2026

🗑️ Ngoc deleted a time log — 1h 30m on Mar 15
   Reason: "Duplicate entry, already logged in PROJ-123"
   Mar 17, 2026
```

## Todo List

- [x] Add `worklog_activity_updated()` handler in `issue_activities_task.py`
- [x] Add `worklog_activity_deleted()` handler in `issue_activities_task.py`
- [x] Register both in `ACTIVITY_MAPPER`
- [x] Frontend: render modification activity with `PencilLine` icon + distinct styling
- [x] Frontend: render deletion activity with `Trash2` icon + distinct styling
- [x] Test: edit worklog → IssueActivity created with reason
- [x] Test: delete worklog → IssueActivity created with reason
- [x] Test: staff can see admin modification entries

## Success Criteria

- Edit/delete of worklogs create `IssueActivity` records with reason
- Activity feed shows modification reason alongside changes
- All members can see audit trail entries
- No duplicate entries (create = WorklogStore, update/delete = IssueActivity)
- Entries visually distinct from regular "logged time" entries

## Risk Assessment

- **Low**: New IssueActivity records are additive
- **Medium**: Activity feed ordering — modification entries appear at modification timestamp, not original log date
- **Large file**: `issue_activities_task.py` is already large; ~40 lines added is acceptable

## Security Considerations

- Reason stored as plain text in IssueActivity.new_value — same security as existing activity fields
- No HTML rendering of reason text
- Modification history visible to all project members (intentional — audit transparency)

## Next Steps

- Phase 6: Collapsible worklog groups for scalability
