# Time Tracking / Log Time Investigation Report

**Date:** 2026-03-17 | **Scope:** Plane.so Codebase Analysis

## Executive Summary

Time tracking in Plane is implemented as a separate subsystem from traditional issue activities. Worklogs are stored as `IssueWorkLog` records and rendered in the activity feed through a dedicated component (`IssueActivityWorklog`). The system includes permission checks, an edit window (7 working days), and deletion/modification capabilities restricted to project admins only.

---

## 1. How Time Logging Activities Are Displayed in Issue Activity Feeds

### Frontend Flow

1. **Activity Feed Integration**
   - Location: `/apps/web/core/components/issues/issue-detail/issue-activity/`
   - Worklogs are fetched separately via `WorklogStore` (not via IssueActivity API)
   - Merged into activity feed in `activity.store.ts` (`buildActivityAndCommentItems()`)

2. **Worklog Activity Rendering Component**
   - File: `/apps/web/ce/components/issues/worklog/activity/root.tsx`
   - Component: `IssueActivityWorklog`
   - Displays: Timer icon + username + duration + description + logged date
   - Makes activity clickable for admins (opens edit modal on click)
   - Shows pencil icon on hover (admin-only)

3. **Activity Type Classification**
   - Activity type: `EActivityFilterType.WORKLOG` (constant in `/packages/constants/src/issue/filter.ts`)
   - Can be filtered via activity filter UI (included in default filters)
   - Separate from `COMMENT`, `STATE`, `ASSIGNEE`, `ACTIVITY`, and `DEFAULT` types

4. **Data Flow in Store**
   ```
   WorklogStore (core/store/worklog.store.ts)
   → getWorklogsForIssue(issueId)
   → IssueActivityStore (ce/store/issue/issue-details/activity.store.ts)
   → buildActivityAndCommentItems() merges worklogs with activities
   → Frontend renders via IssueActivityCommentRoot → IssueActivityWorklog
   ```

---

## 2. Modify/Delete of Time Logs (Implementation Status)

### ✅ Fully Implemented

#### Edit Capability

- **Who can edit:** Project ADMIN only (checked via `allowPermissions([EUserPermissions.ADMIN])`)
- **Edit window:** 7 working days (Mon-Fri only, excludes weekends)
- **How to edit:**
  1. Admin hovers over worklog in activity feed → pencil icon appears
  2. Click pencil or "Edit" from context menu → `WorklogModal` opens
  3. Fields editable: `duration_minutes`, `description`, `logged_at`
  4. Submit → `store.updateWorklog()` → PATCH request to backend

#### Delete Capability

- **Who can delete:** Project ADMIN only (same permission check)
- **Delete window:** Same 7 working day window
- **How to delete:**
  1. Admin hovers over worklog → context menu appears
  2. Click "Delete" option → `store.deleteWorklog()` → DELETE request
  3. Optimistic UI update (removes from list immediately)
  4. If API fails, worklog is restored

#### UI Implementation

- File: `/apps/web/ce/components/issues/worklog/activity/root.tsx`
- Lines 103-118: Context menu (Edit/Delete options) with hover effects
- Line 44: Edit eligibility check: `isAdmin && isWithinEditWindow(worklog.logged_at)`
- Line 58-67: Delete handler with error handling

---

## 3. Permission Checks for Time Log Operations

### Backend Permissions (`/apps/api/plane/app/views/issue/worklog.py`)

```python
# Line 72: CREATE requires ADMIN or MEMBER role
@allow_permission([ROLE.ADMIN, ROLE.MEMBER])
def create(self, request, slug, project_id, issue_id):

# Line 119: MODIFY requires ADMIN role only
@allow_permission(allowed_roles=[ROLE.ADMIN])
def partial_update(self, request, slug, project_id, issue_id, pk):

# Line 167: DELETE requires ADMIN role only
@allow_permission(allowed_roles=[ROLE.ADMIN])
def destroy(self, request, slug, project_id, issue_id, pk):
```

### Frontend Permissions

```typescript
// Line 43-44 in IssueActivityWorklog
const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);
const isEditable = isAdmin && worklog && isWithinEditWindow(worklog.logged_at);
```

### Permission Hierarchy

- **CREATE:** ADMIN or MEMBER
- **UPDATE:** ADMIN only
- **DELETE:** ADMIN only
- **VIEW:** ADMIN or MEMBER (same workspace/project member)

### Project Member Verification

- Must be active member: `project__project_projectmember__is_active=True`
- Must have role: `project__project_projectmember__member=request.user`
- Project must not be archived: `project__archived_at__isnull=True`

---

## 4. Modification Reason Field - NOT IMPLEMENTED

### Finding

There is **NO "reason" field** for worklog modifications in the current implementation.

### Worklog Model Fields (Database)

```python
# /apps/api/plane/db/models/worklog.py
class IssueWorkLog(ProjectBaseModel):
    issue = ForeignKey
    logged_by = ForeignKey
    duration_minutes = PositiveIntegerField
    description = TextField  # ← Optional description, NOT a "reason"
    logged_at = DateField
```

### Editable Fields Only

- `duration_minutes` - time amount
- `description` - optional worklog description
- `logged_at` - date of log

### Activity Tracking

When modified, the API passes:

```python
# Old value stored as serialized JSON in activity
current_instance = IssueWorkLogSerializer(worklog).data

# New values sent in request
requested_data = { "duration_minutes": X, "logged_at": Y, "description": Z }
```

The `old_value` and `new_value` fields in IssueActivity don't include a "reason" for the change. The system only tracks what changed, not why.

---

## 5. API Endpoints & Data Models

### REST Endpoints

```
POST   /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/
GET    /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/
PATCH  /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/{worklog_id}/
DELETE /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/{worklog_id}/

POST   /api/workspaces/{slug}/projects/{project_id}/time-tracking/timesheet/bulk/
```

### Worklog Data Structure

```typescript
// IWorkLog interface (/packages/types/src/worklog.ts)
interface IWorkLog {
  id: string;
  issue: string;
  logged_by: string;
  duration_minutes: number;
  description: string;
  logged_at: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
  logged_by_detail?: { id; display_name; avatar_url };
  issue_detail?: { id; name; sequence_id; identifier };
  project_detail?: { id; name; identifier };
}
```

### Serializer Validation

```python
# /apps/api/plane/app/serializers/worklog.py
- MAX_DURATION_MINUTES = 720 (12 hours per entry)
- MAX_DAILY_MINUTES = 720 (per user per day)
- Can't log future dates
- Can't log >7 working days ago (locked after window)
- Daily aggregate limit enforced per user
```

---

## 6. Activity Recording & Celery Tasks

### How Worklog Activities Are Recorded

Worklogs **do NOT** go through the main `IssueActivity` system. Instead:

1. **Create/Update/Delete triggers Celery task:**

   ```python
   # /apps/api/plane/app/views/issue/worklog.py
   issue_activity.delay(
       type="worklog.activity.created|updated|deleted",
       requested_data=json.dumps(serializer.data),
       actor_id=str(request.user.id),
       issue_id=str(issue_id),
       project_id=str(project_id),
       current_instance=current_instance,
       epoch=int(timezone.now().timestamp()),
       notification=False,
   )
   ```

2. **Activity mapper in issue_activities_task.py:**
   - The `ACTIVITY_MAPPER` dict (line 1602-1630) does **NOT** include `worklog.activity.*` keys
   - Worklog activities are **silently passed through** without dedicated handler
   - This is intentional: worklog activities are stored in WorklogStore, not IssueActivity table

3. **Frontend doesn't query IssueActivity for worklogs:**
   - Direct API call: `GET /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/`
   - Worklogs cached in separate store
   - Merged into activity feed on-the-fly during rendering

---

## 7. Edit Window & Locking Mechanism

### 7 Working Day Window

- **Definition:** Monday-Friday only (weekends excluded)
- **Lock Date Calculation:** `/apps/web/ce/components/issues/worklog/utils/worklog-date-utils.ts`
  ```typescript
  getMinAllowedDate((workingDays = 7)); // Go back 7 business days
  isWithinEditWindow(loggedAt); // Check if date >= minDate
  ```

### Backend Validation

```python
# /apps/api/plane/app/views/issue/worklog.py, line 57-60
def _check_edit_window(self, worklog):
    min_date = get_min_allowed_date(working_days=7)
    return worklog.logged_at >= min_date

# If outside window on PATCH or DELETE:
# → HTTP 403 FORBIDDEN
# → Message: "Worklog is locked and cannot be edited..."
```

### Bulk Timesheet Updates Also Respect Window

- File: `/apps/api/plane/app/views/workspace/time_tracking/timesheet_bulk.py`
- Line 116-120: Check edit window before allowing bulk update

---

## 8. Component Structure

### Frontend Worklog Components

```
/apps/web/ce/components/issues/worklog/
├── activity/
│   ├── root.tsx                    # IssueActivityWorklog component
│   ├── filter-root.tsx             # Activity filter UI
│   ├── worklog-create-button.tsx   # "Log Time" button
│   └── index.ts
├── worklog-modal.tsx               # Create/Edit modal with form
├── property/
│   └── root.tsx                    # Total logged time display in sidebar
└── utils/
    └── worklog-date-utils.ts       # Date helpers
```

### Key Component Props

```typescript
// IssueActivityWorklog
type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

// WorklogModal
type TWorklogModal = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  existingWorklog?: IWorkLog; // If editing
};
```

---

## 9. Project Configuration

### Feature Toggle

```python
# /apps/api/plane/db/models/issue.py
project.is_time_tracking_enabled  # Boolean flag

# Checked on every CREATE/UPDATE/DELETE operation
# Returns 400 Bad Request if disabled
```

### When Log Time Button Appears

```typescript
// /apps/web/core/components/issues/issue-detail/issue-activity/root.tsx, line 84-85
const isTimeTrackingEnabled = project?.is_time_tracking_enabled !== false;
const isWorklogButtonEnabled = !isIntakeIssue && !isGuest && isTimeTrackingEnabled && (isAdmin || isAssigned);
```

**Visible to:**

- Intake issues: NO (always hidden)
- Guest users: NO
- If time tracking disabled: NO
- ADMIN: YES (always)
- MEMBER assigned to issue: YES
- MEMBER not assigned: NO

---

## 10. Summary Table: Operations & Permissions

| Operation        | Role Required | Time Window                         | Can Reason? |
| ---------------- | ------------- | ----------------------------------- | ----------- |
| Create worklog   | ADMIN/MEMBER  | No limit (7 day forward block only) | No          |
| View worklog     | ADMIN/MEMBER  | N/A                                 | N/A         |
| Edit duration    | ADMIN only    | 7 business days                     | No          |
| Edit date        | ADMIN only    | 7 business days                     | No          |
| Edit description | ADMIN only    | 7 business days                     | No          |
| Delete worklog   | ADMIN only    | 7 business days                     | No          |

---

## File References

### Backend

- Model: `/apps/api/plane/db/models/worklog.py`
- Serializer: `/apps/api/plane/app/serializers/worklog.py`
- Issue-level API: `/apps/api/plane/app/views/issue/worklog.py`
- Project-level API: `/apps/api/plane/app/views/project/worklog.py`
- Bulk API: `/apps/api/plane/app/views/workspace/time_tracking/timesheet_bulk.py`

### Frontend

- Store: `/apps/web/core/store/worklog.store.ts`
- Service: `/apps/web/core/services/worklog.service.ts`
- Activity Component: `/apps/web/ce/components/issues/worklog/activity/root.tsx`
- Modal: `/apps/web/ce/components/issues/worklog/worklog-modal.tsx`
- Activity Store: `/apps/web/ce/store/issue/issue-details/activity.store.ts`

### Types & Constants

- Worklog types: `/packages/types/src/worklog.ts`
- Activity filter enum: `/packages/constants/src/issue/filter.ts` (line 305-349)
- Worklog utilities: `/packages/constants/src/worklog.ts`

---

## Unresolved Questions

1. **Q:** Can non-admin members view edit/delete options for other members' worklogs?
   - **Finding:** No — permission check is project-wide ADMIN role (not object-level access control)

2. **Q:** Is there audit logging beyond IssueActivity for worklog changes?
   - **Finding:** Only through IssueActivity Celery task (but not stored in ACTIVITY_MAPPER)

3. **Q:** Can project admin edit/delete worklogs of other users?
   - **Finding:** Yes — permission check is role-based, not user-based. Admin can edit any worklog within edit window.

4. **Q:** How are bulk timesheet updates audited?
   - **Finding:** Each bulk entry generates separate `worklog.activity.created|updated|deleted` Celery tasks

5. **Q:** Is there a "reason" feature planned?
   - **Finding:** No indication in current codebase. Description field is optional but not a modification reason.
