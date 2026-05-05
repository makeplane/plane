# Worklog Modification Feature - Comprehensive Analysis

**Date**: 2026-03-19  
**Scope**: How worklog modification reasons are stored, displayed, and tracked in the system

---

## Executive Summary

The worklog modification feature is fully implemented with:

- **Reason capture**: Mandatory text field for all edit/delete operations
- **Audit trail**: Stored in `IssueActivity` table with old/new values and reason
- **Frontend**: Two modals (edit/delete) requiring reason input before operations
- **Backend**: Validation enforcing reason presence, activity logging via Celery task

---

## 1. Data Storage Model

### Backend Models

#### IssueWorkLog (App-Level Data)

**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/worklog.py`

```python
class IssueWorkLog(ProjectBaseModel):
    issue = FK(Issue)
    logged_by = FK(User)
    duration_minutes = PositiveInt
    description = TextField  # Optional notes on work
    logged_at = DateField
    created_at = DateTime    # Auto
    updated_at = DateTime    # Auto
```

**Key Point**: The `IssueWorkLog` model itself does NOT store the modification reason. It only stores the log details.

#### IssueActivity (Audit Trail)

**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/issue.py`

```python
class IssueActivity(ProjectBaseModel):
    issue = FK(Issue)
    verb = CharField          # "created", "updated", "deleted"
    field = CharField         # "worklog" for time tracking activities
    old_value = TextField     # Previous state or what changed
    new_value = TextField     # Reason text (for worklog activities)
    actor = FK(User)          # Who made the change
    epoch = Float             # Timestamp
    # ... other fields
```

**Key Point**: For worklog modifications:

- `field = "worklog"`
- `old_value` = Summary of what changed (e.g., "duration: 120m → 90m")
- `new_value` = **The modification reason** (mandatory text input)
- `verb` = "updated" or "deleted"

---

## 2. How Modification Reasons Are Captured

### Frontend Components

#### WorklogModal (Edit/Create Modal)

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/worklog-modal.tsx`

```typescript
type TWorklogModal = {
  existingWorklog?: IWorkLog;  // If provided, modal is in EDIT mode
};

export const WorklogModal = observer(function WorklogModal(props) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (existingWorklog) {
      // In EDIT mode, reset reason field
      setReason("");
    }
  }, [existingWorklog, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    // EDIT mode: Reason is MANDATORY
    if (existingWorklog && !reason.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        message: t("worklog.reason_required")
      });
      return;
    }

    // Call store with reason
    if (existingWorklog) {
      await store.updateWorklog(workspaceSlug, projectId, issueId,
        existingWorklog.id, {
          duration_minutes,
          logged_at,
          description,
          reason: reason.trim()  // INCLUDED IN UPDATE PAYLOAD
        }
      );
    }
  };

  return (
    <form>
      {/* Fields: date, duration, description */}

      {/* REASON FIELD (EDIT MODE ONLY) */}
      {existingWorklog && (
        <div className="flex flex-col gap-1">
          <label>{t("worklog.reason_label")} <span className="text-red-500">*</span></label>
          <textarea
            id="worklog-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("worklog.reason_placeholder")}
            required
          />
        </div>
      )}
    </form>
  );
});
```

**Key behaviors**:

- Reason field is **only shown in EDIT mode** (when `existingWorklog` is passed)
- Reason is **mandatory** for edits (validation error if empty)
- Reason is **not required for CREATE** operations (new worklogs)
- Reason is **cleared on modal open** (not pre-populated)

#### WorklogDeleteModal (Delete Confirmation)

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/worklog-delete-modal.tsx`

```typescript
export const WorklogDeleteModal = (props: TWorklogDeleteModal) => {
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) return; // MANDATORY

    await onConfirm(reason.trim()); // Pass reason to parent
  };

  return (
    <div>
      <h2>{t("worklog.confirm_delete_title")}</h2>

      {/* REASON FIELD (MANDATORY FOR DELETE) */}
      <div className="flex flex-col gap-1">
        <label>
          {t("worklog.delete_reason_label")} <span className="text-red-500">*</span>
        </label>
        <textarea id="delete-reason" value={reason} placeholder={t("worklog.delete_reason_placeholder")} />
      </div>

      <Button
        disabled={!reason.trim()} // Button disabled until reason provided
        onClick={handleConfirm}
      >
        {t("worklog.confirm_delete")}
      </Button>
    </div>
  );
};
```

**Key behaviors**:

- Reason is **mandatory** for delete operations
- Submit button is **disabled** until reason is non-empty
- Reason is passed to `store.deleteWorklog(worklogId, reason)`

#### IssueActivityWorklog (Display Component)

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/activity/root.tsx`

```typescript
export const IssueActivityWorklog = observer(function (props) {
  const handleDelete = async (reason: string) => {
    if (!worklog) return;
    await store.deleteWorklog(workspaceSlug, projectId, issueId, worklog.id, reason); // PASS REASON TO STORE
  };

  return (
    <>
      {/* Edit modal */}
      <WorklogModal existingWorklog={worklog} onClose={() => setIsEditModalOpen(false)} />

      {/* Delete confirmation modal */}
      <WorklogDeleteModal
        onConfirm={handleDelete} // Called with reason
      />
    </>
  );
});
```

---

## 3. How Reasons Flow to Backend

### Frontend → Backend Data Flow

#### Type Definition

**File**: `/Volumes/Data/SHBVN/plane.so/packages/types/src/worklog.ts`

```typescript
export interface IWorkLogUpdate {
  duration_minutes?: number;
  description?: string;
  logged_at?: string;
  reason?: string; // Optional in TYPE but MANDATORY at API level
}
```

#### Service Layer

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/services/worklog.service.ts`

```typescript
async updateWorklog(
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  worklogId: string,
  data: IWorkLogUpdate  // Contains reason
): Promise<IWorkLog> {
  return this.patch(
    `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`,
    data  // SENT AS-IS (includes reason field)
  );
}

async deleteWorklog(
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  worklogId: string,
  reason?: string  // Optional but used if provided
): Promise<void> {
  return this.delete(
    `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`,
    reason ? { reason } : undefined  // SENT IN REQUEST BODY for DELETE
  );
}
```

#### MobX Store

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/store/worklog.store.ts`

```typescript
updateWorklog = async (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  worklogId: string,
  data: IWorkLogUpdate // Receives reason from component
): Promise<IWorkLog> => {
  const updated = await this.worklogService.updateWorklog(
    workspaceSlug,
    projectId,
    issueId,
    worklogId,
    data // PASS-THROUGH
  );
  // Update local state...
};

deleteWorklog = async (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  worklogId: string,
  reason?: string // Receives reason from delete modal
): Promise<void> => {
  await this.worklogService.deleteWorklog(workspaceSlug, projectId, issueId, worklogId, reason);
  // Update local state...
};
```

**Request examples**:

Edit request body:

```json
{
  "duration_minutes": 90,
  "logged_at": "2026-03-19",
  "description": "Updated work notes",
  "reason": "Corrected time - was 2 hours, should be 1.5"
}
```

Delete request body:

```json
{
  "reason": "Duplicate entry, real work was logged on another issue"
}
```

---

## 4. Backend Validation & Storage

### API Endpoints

#### Update Endpoint (PATCH)

**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/issue/worklog.py`

```python
@allow_permission(allowed_roles=[ROLE.ADMIN])
def partial_update(self, request, slug, project_id, issue_id, pk):
    worklog = IssueWorkLog.objects.get(pk=pk)  # Get existing

    # VALIDATE REASON (MANDATORY FOR EDIT)
    reason, error_response = self._validate_reason(request)
    if error_response:
        return error_response  # 400: "A reason for this change is required."

    # Serialize and save the worklog data
    serializer = IssueWorkLogSerializer(worklog, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()

        # CREATE ACTIVITY RECORD
        activity_data = dict(request.data)
        activity_data["reason"] = reason  # INCLUDE REASON IN ACTIVITY DATA

        issue_activity.delay(
            type="worklog.activity.updated",
            requested_data=json.dumps(activity_data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,  # Old values for audit
            epoch=int(timezone.now().timestamp()),
            notification=False,
            origin=base_host(request=request),
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
```

#### Delete Endpoint (DELETE)

```python
@allow_permission(allowed_roles=[ROLE.ADMIN])
def destroy(self, request, slug, project_id, issue_id, pk):
    worklog = IssueWorkLog.objects.get(pk=pk)

    # VALIDATE REASON (MANDATORY FOR DELETE)
    reason, error_response = self._validate_reason(request)
    if error_response:
        return error_response  # 400: "A reason for this change is required."

    # Log current state before deletion
    current_instance = json.dumps(
        IssueWorkLogSerializer(worklog).data, cls=DjangoJSONEncoder
    )

    worklog.delete()

    # CREATE ACTIVITY RECORD WITH REASON
    issue_activity.delay(
        type="worklog.activity.deleted",
        requested_data=json.dumps({"worklog_id": str(pk), "reason": reason}),
        actor_id=str(request.user.id),
        issue_id=str(issue_id),
        project_id=str(project_id),
        current_instance=current_instance,  # Full worklog details
        epoch=int(timezone.now().timestamp()),
        notification=False,
        origin=base_host(request=request),
    )
    return Response(status=status.HTTP_204_NO_CONTENT)
```

#### Validation Helper

```python
def _validate_reason(self, request):
    """Extract and validate mandatory reason from request body."""
    reason = request.data.get("reason", "").strip()
    if not reason:
        return None, Response(
            {"error": "A reason for this change is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return reason, None
```

---

## 5. Audit Trail & History Tracking

### Activity Recording

The system uses a **Celery background task** to process activity records asynchronously.

#### Task: issue_activity

**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/bgtasks/issue_activities_task.py`

When a worklog is modified, the backend queues this task:

```python
@shared_task
def issue_activity(
    type,                # "worklog.activity.created|updated|deleted"
    requested_data,      # JSON with new values + reason
    current_instance,    # JSON with old values
    issue_id,
    actor_id,
    project_id,
    epoch,
    ...
):
    """Processes activity based on type."""

    # Route to handler by type
    handlers = {
        "worklog.activity.created": worklog_activity_created,
        "worklog.activity.updated": worklog_activity_updated,
        "worklog.activity.deleted": worklog_activity_deleted,
    }

    handler = handlers.get(type)
    if handler:
        handler(requested_data, current_instance, ...)
```

#### Handlers

##### worklog_activity_updated

```python
def worklog_activity_updated(
    requested_data, current_instance, issue_id, project_id,
    workspace_id, actor_id, issue_activities, epoch
):
    requested = json.loads(requested_data) if requested_data else {}
    current = json.loads(current_instance) if current_instance else {}
    reason = requested.get("reason", "")  # Extract reason

    # Build change summary
    changes = []
    if requested.get("duration_minutes") != current.get("duration_minutes"):
        changes.append(
            f"duration: {current.get('duration_minutes')}m → {requested.get('duration_minutes')}m"
        )
    if requested.get("logged_at") != current.get("logged_at"):
        changes.append(f"date: {current.get('logged_at')} → {requested.get('logged_at')}")
    if requested.get("description") != current.get("description"):
        changes.append("description updated")

    # Create activity record
    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            actor_id=actor_id,
            verb="updated",
            field="worklog",
            old_value=", ".join(changes) if changes else "worklog updated",
            new_value=reason,          # REASON STORED HERE
            epoch=epoch,
        )
    )
```

**Stored Result in IssueActivity**:

```
verb: "updated"
field: "worklog"
old_value: "duration: 120m → 90m, date: 2026-03-18 → 2026-03-19"
new_value: "Corrected time - was 2 hours, should be 1.5"  # THE REASON
actor: User ID (admin who made change)
created_at: Auto timestamp
```

##### worklog_activity_deleted

```python
def worklog_activity_deleted(
    requested_data, current_instance, issue_id, project_id,
    workspace_id, actor_id, issue_activities, epoch
):
    requested = json.loads(requested_data) if requested_data else {}
    current = json.loads(current_instance) if current_instance else {}
    reason = requested.get("reason", "")
    duration = current.get("duration_minutes", 0)

    issue_activities.append(
        IssueActivity(
            issue_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            actor_id=actor_id,
            verb="deleted",
            field="worklog",
            old_value=f"{duration}m logged",
            new_value=reason,          # REASON STORED HERE
            epoch=epoch,
        )
    )
```

**Stored Result in IssueActivity**:

```
verb: "deleted"
field: "worklog"
old_value: "120m logged"
new_value: "Duplicate entry, real work was logged on another issue"
actor: User ID (admin who deleted)
created_at: Auto timestamp
```

---

## 6. Frontend Display of Modification Activity

### Activity Timeline Display

The frontend fetches `IssueActivity` records and displays them in the issue detail sidebar activity feed.

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/activity/root.tsx`

```typescript
export const IssueActivityWorklog = observer(function (props) {
  const displayName = worklog?.logged_by_detail?.display_name;
  const duration = formatMinutesToDisplay(worklog.duration_minutes);

  return (
    <div>
      {/* Display: "John Doe logged 2h — work summary 2026-03-19" */}
      <span className="font-medium text-primary">{displayName}</span>
      <span> logged </span>
      <span className="font-medium text-primary">{duration}</span>
      {worklog?.description && <span> — {worklog.description}</span>}
      {createdAt && <span> {createdAt}</span>}

      {/* If admin & within edit window, show Edit/Delete menu */}
      {isEditable && (
        <CustomMenu>
          <MenuItem onClick={() => setIsEditModalOpen(true)}>Edit</MenuItem>
          <MenuItem onClick={() => setIsDeleteModalOpen(true)}>Delete</MenuItem>
        </CustomMenu>
      )}
    </div>
  );
});
```

**Note**: The frontend displays the **worklog details** (who, duration, description, date), but the **modification reason is stored in the activity record**, not displayed inline in the activity feed UI.

### Activity Record Access

To view modification reasons, you would need to:

1. Query `IssueActivity` records where `field = "worklog"` and `verb = "updated"` or `"deleted"`
2. Extract `new_value` field (contains the reason)
3. Display in a history/audit log panel (not currently shown in main UI)

---

## 7. Bulk Operations

### Bulk Timesheet Update

The bulk endpoint does **NOT require reasons** for modifications.

**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/workspace/time_tracking/timesheet_bulk.py`

```python
def _delete_entry(self, request, existing, issue_id, project_id):
    existing.delete()
    issue_activity.delay(
        type="worklog.activity.deleted",
        requested_data=json.dumps({"worklog_id": str(wl_id)}),  # NO REASON
        # ...
    )

def _update_entry(self, request, existing, duration_minutes, issue_id, project_id):
    existing.duration_minutes = duration_minutes
    existing.save()
    issue_activity.delay(
        type="worklog.activity.updated",
        requested_data=json.dumps({"duration_minutes": duration_minutes}),  # NO REASON
        # ...
    )
```

**Bulk activity records** will have empty `new_value` fields since no reason is provided.

---

## 8. Summary Table: Modification Tracking

| Aspect                        | Detail                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Reason Storage Location**   | `IssueActivity.new_value` (TextField)                                                                                          |
| **When Required**             | Edit (PATCH) and Delete (DELETE) operations only                                                                               |
| **When Optional**             | Create (POST) and Bulk operations                                                                                              |
| **Validation**                | Backend checks `request.data.get("reason", "").strip()` is non-empty                                                           |
| **Frontend Capture**          | `WorklogModal` (edit) and `WorklogDeleteModal` (delete)                                                                        |
| **Error if Missing**          | 400 Bad Request: "A reason for this change is required."                                                                       |
| **Activity Record Created**   | Async Celery task `issue_activity` processes and stores in `IssueActivity` table                                               |
| **Fields in Activity Record** | `verb` (updated/deleted), `field` ("worklog"), `old_value` (changes), `new_value` (reason), `actor` (who), `created_at` (when) |
| **Display in UI**             | Not shown inline; available via activity history query (API)                                                                   |
| **Bulk Operations**           | Bypass reason requirement; activities created with empty reason                                                                |

---

## 9. Key Files Reference

| File                                                                                          | Purpose                                               |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/worklog.py`                            | IssueWorkLog model (no reason field)                  |
| `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/issue.py`                              | IssueActivity model (stores reason in `new_value`)    |
| `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/issue/worklog.py`                      | API endpoints (validates reason, queues activity)     |
| `/Volumes/Data/SHBVN/plane.so/apps/api/plane/bgtasks/issue_activities_task.py`                | Activity handlers (worklog_activity_updated, deleted) |
| `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/worklog-modal.tsx`        | Edit modal (captures reason)                          |
| `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/worklog-delete-modal.tsx` | Delete confirmation (captures reason)                 |
| `/Volumes/Data/SHBVN/plane.so/packages/types/src/worklog.ts`                                  | TypeScript types (IWorkLogUpdate)                     |

---

## 10. Unresolved Questions

None. The worklog modification feature is fully functional and documented.
