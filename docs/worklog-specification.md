# Worklog Specification & Implementation Details

**Last Updated**: 2026-03-04
**Status**: Complete (Phases 1-9)
**Scope**: Time tracking models, API validation, permissions, daily reminders, frontend UX, feature flag gating

---

## Overview

Worklog (time tracking) allows team members to log time spent on project issues. The system enforces daily limits, edit windows, and role-based permissions to maintain accurate time tracking records.

**Key constraints:**

- Maximum 12 hours (720 minutes) per user per day
- No future-dated entries
- 7 working-day backdate window for edits
- ADMIN-only edit/delete permissions (with 7-day window)
- Daily email + in-app reminder (optional, user-toggled)

---

## Data Model

### IssueWorkLog

| Field              | Type           | Constraints                    | Purpose                         |
| ------------------ | -------------- | ------------------------------ | ------------------------------- |
| `id`               | UUID           | PK                             | Unique identifier               |
| `issue`            | FK → Issue     | NOT NULL                       | Work log belongs to issue       |
| `project`          | FK → Project   | NOT NULL (denormalized)        | Performance optimization        |
| `workspace`        | FK → Workspace | NOT NULL (denormalized)        | Workspace membership check      |
| `logged_by`        | FK → User      | NOT NULL                       | Team member who logged time     |
| `duration_minutes` | PositiveInt    | 1–1440, default per serializer | Minutes spent (e.g., 120 = 2h)  |
| `description`      | TextField      | Optional, max 1000 chars       | Notes on work completed         |
| `logged_at`        | DateField      | No future dates, ≥7 days back  | Date work was performed (local) |
| `created_at`       | DateTime       | Auto                           | Record creation timestamp       |
| `updated_at`       | DateTime       | Auto                           | Last modification timestamp     |

**Related Fields on Issue**:

| Field                                | Type        | Purpose                      |
| ------------------------------------ | ----------- | ---------------------------- |
| `estimate_time`                      | PositiveInt | Expected duration in minutes |
| `is_time_tracking_enabled` (Project) | Boolean     | Feature toggle per project   |

### UserNotificationPreference

Extended with `worklog_reminder: Boolean` field to allow users to opt out of daily reminders.

---

## Validation Rules

### 1. Daily Time Limit

**Rule**: A single user cannot log more than 720 minutes (12 hours) on any calendar day.

**Enforcement**:

- Checked in `IssueWorkLogViewSet._check_daily_limit(user, logged_at, new_duration, exclude_pk=None)`
- Applies to `create` and `partial_update` operations
- On `partial_update`, excludes the worklog being edited to avoid self-blocking
- Aggregates all worklogs across all projects for the user on the date

**Calculation**:

```python
existing_total = IssueWorkLog.objects.filter(
    logged_by=user,
    logged_at=date
).exclude(pk=exclude_pk).aggregate(total=Sum("duration_minutes"))["total"] or 0

if existing_total + new_duration > 720:
    remaining = max(720 - existing_total, 0)
    # Return error with remaining minutes
```

**Error Response** (400 Bad Request):

```json
{
  "error": "Daily time limit exceeded. You have 120 minutes remaining for this date."
}
```

### 2. Date Range Validation

**Rule 1 - No Future Dates**: `logged_at` cannot be in the future (relative to user's local timezone).

**Enforcement**: Serializer-level validation in `IssueWorkLogSerializer.validate_logged_at`

**Rule 2 - 7-Working-Day Backdate**: `logged_at` must be within 7 working days (Mon–Fri, no holidays) of today.

**Enforcement**:

- `create`: Uses `get_min_allowed_date(working_days=7)` to compute minimum date
- `partial_update` / `destroy`: Checks existing worklog's `logged_at` against window via `_check_edit_window`

**Calculation** (Python):

```python
def get_min_allowed_date(working_days=7):
    """Return the earliest date within working_days of today."""
    today = date.today()
    days_back = 0
    target_date = today

    while days_back < working_days:
        target_date -= timedelta(days=1)
        if target_date.weekday() < 5:  # Mon=0, Fri=4
            days_back += 1

    return target_date
```

**Calculation** (TypeScript):

```typescript
function getMinAllowedDate(workingDays: number = 7): string {
  const today = new Date();
  let daysBack = 0;
  const targetDate = new Date(today);

  while (daysBack < workingDays) {
    targetDate.setDate(targetDate.getDate() - 1);
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      daysBack++;
    }
  }

  return targetDate.toISOString().split("T")[0];
}
```

**Error Response** (400 Bad Request):

```json
{
  "error": "Worklog date must be within 7 working days of today and not in the future."
}
```

### 3. Duration Constraints

| Constraint            | Value                 | Applies To                                    |
| --------------------- | --------------------- | --------------------------------------------- |
| Minimum duration      | 1 min                 | `create`, `partial_update`                    |
| Maximum duration      | 1440 min (24h)        | Both operations                               |
| Zero duration (0 min) | Invalid in normal ops | Allowed only in bulk upsert (triggers delete) |

**Implementation**:

- `IssueWorkLogSerializer`: `min_value=1, max_value=1440`
- `TimesheetBulkEntrySerializer`: `min_value=0, max_value=1440` (zero = delete semantics)

---

## Permission Model

### Role-Based Access

| Operation  | ADMIN | MEMBER | Notes                                       |
| ---------- | ----- | ------ | ------------------------------------------- |
| **List**   | ✅    | ✅     | Query filtered by project membership        |
| **Create** | ✅    | ✅     | Own logs only; checks time tracking enabled |
| **Read**   | ✅    | ✅     | Via list endpoint                           |
| **Edit**   | ✅    | ❌     | Requires 7-working-day edit window          |
| **Delete** | ✅    | ❌     | Requires 7-working-day edit window          |

**Enforcement**:

- `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` on `list` and `create`
- `@allow_permission(allowed_roles=[ROLE.ADMIN])` on `partial_update` and `destroy`
- Edit window check applies to both `partial_update` and `destroy`

**Edit Window Rule**: Admin can only edit/delete a worklog if `logged_at >= get_min_allowed_date(working_days=7)`

**Error Response** (403 Forbidden):

```json
{
  "error": "This worklog is locked and cannot be edited. Worklogs older than 7 working days are read-only."
}
```

### Project-Level Feature Toggle

All worklog operations require `project.is_time_tracking_enabled == True`.

**Enforcement**: `_check_time_tracking_enabled(project_id)` called before `create`

**Error Response** (400 Bad Request):

```json
{
  "error": "Time tracking is not enabled for this project"
}
```

---

## API Endpoints

### Issue-Level Worklogs

#### List Worklogs for Issue

**Endpoint**: `GET /api/v1/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/`

**Permissions**: ADMIN, MEMBER
**Query Params**: None
**Response** (200 OK):

```json
[
  {
    "id": "uuid",
    "issue": "uuid",
    "logged_by": {
      "id": "uuid",
      "display_name": "John Doe"
    },
    "duration_minutes": 120,
    "description": "Frontend implementation",
    "logged_at": "2026-03-04",
    "created_at": "2026-03-04T10:00:00Z",
    "updated_at": "2026-03-04T10:00:00Z"
  }
]
```

#### Create Worklog

**Endpoint**: `POST /api/v1/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/`

**Permissions**: ADMIN, MEMBER
**Request Body**:

```json
{
  "duration_minutes": 120,
  "description": "Frontend implementation",
  "logged_at": "2026-03-04"
}
```

**Validations**:

- `is_time_tracking_enabled == True`
- `logged_at` within 7 working days, not future
- `duration_minutes` between 1–1440
- `existing_total + duration_minutes <= 720`

**Response** (201 Created): Full worklog object

**Error Responses**:

- 400: Time tracking disabled, invalid date, exceeds daily limit
- 403: User not project member

#### Update Worklog

**Endpoint**: `PATCH /api/v1/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/{id}/`

**Permissions**: ADMIN only
**Request Body** (all optional):

```json
{
  "duration_minutes": 90,
  "description": "Updated notes",
  "logged_at": "2026-03-03"
}
```

**Validations** (same as create, plus):

- Worklog exists (404 if not)
- Original `logged_at` within edit window (403 if outside)
- If changing date/duration: recalculate daily limit check

**Response** (200 OK): Updated worklog object

#### Delete Worklog

**Endpoint**: `DELETE /api/v1/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/{id}/`

**Permissions**: ADMIN only
**Validations**:

- Worklog exists (404 if not)
- Original `logged_at` within edit window (403 if outside)

**Response** (204 No Content)

### Workspace-Level Endpoints

#### Project Worklog Summary

**Endpoint**: `GET /api/v1/workspaces/{slug}/projects/{pid}/worklogs/summary/`

**Purpose**: Aggregate worklogs by member or issue
**Query Params**:

- `group_by`: "member" | "issue" (required)
- `date_from`: ISO date (optional)
- `date_to`: ISO date (optional)

**Response** (200 OK):

```json
{
  "results": [
    {
      "member_id": "uuid",
      "member_name": "John Doe",
      "total_minutes": 480
    }
  ]
}
```

#### Workspace Worklog Summary

**Endpoint**: `GET /api/v1/workspaces/{slug}/time-tracking/summary/`

**Purpose**: Aggregate worklogs across all projects in workspace
**Query Params**: Same as project summary

#### Timesheet Grid

**Endpoint**: `GET /api/v1/workspaces/{slug}/time-tracking/timesheet-grid/`

**Purpose**: Table view of worklogs (member × date matrix)
**Response**: Daily totals per member

#### Bulk Timesheet Update (Upsert)

**Endpoint**: `POST /api/v1/workspaces/{slug}/time-tracking/bulk/`

**Purpose**: Create/update multiple worklogs in single request
**Request Body**:

```json
{
  "entries": [
    {
      "issue_id": "uuid",
      "logged_at": "2026-03-04",
      "duration_minutes": 240
    },
    {
      "issue_id": "uuid",
      "logged_at": "2026-03-04",
      "duration_minutes": 0  # Zero = delete
    }
  ]
}
```

**Validations**:

- Same as single-entry create/update, applied per entry
- Daily limit enforced per date (all entries on same date must not exceed 720 min total)
- Edit window checked for updates (replace_issue_ids parameter)

**Response** (200 OK):

```json
{
  "results": [
    {
      "issue_id": "uuid",
      "action": "created",
      "worklog_id": "uuid"
    },
    {
      "issue_id": "uuid",
      "action": "updated",
      "worklog_id": "uuid"
    }
  ]
}
```

---

## Daily Reminder System

### Celery Task Configuration

**Scheduled Task**: `worklog_daily_reminder`
**Schedule**: Every day at **UTC 10:00** (5:00 PM Vietnam time, UTC+7)
**Configuration**: `plane/celery.py` beat schedule

```python
"worklog-reminder": {
    "task": "plane.bgtasks.worklog_reminder_task.worklog_daily_reminder",
    "schedule": crontab(hour=10, minute=0),  # UTC 10:00
},
```

### Reminder Delivery

The task sends reminders to users in projects with time tracking enabled, who haven't logged time yet today.

**Task Flow**:

1. **Find active projects**: `Project.filter(is_time_tracking_enabled=True, archived_at__isnull=True)`
2. **Find active members**: `ProjectMember.filter(project_id__in=projects, is_active=True)`
3. **Filter non-logged users**: Users with no worklog entry for today
4. **Check preferences**: Skip users where `UserNotificationPreference.worklog_reminder == False`
5. **Send notifications**:
   - Email (async via Django backend)
   - In-app notification (Notification model)

**Idempotency**: Tracks already-reminded users in a set to avoid duplicates within the same run.

### Notification Models

#### Email Notification

**Subject**: "Time tracking reminder"
**Body**:

```
Hey there! Just a friendly nudge — don't forget to log your working hours
for today. Keeping your timesheet up to date helps the whole team stay on
track. It only takes a minute! Head over to your project and log your time
before the day wraps up.
```

**Sent via**: Django `EmailMultiAlternatives` with configured SMTP backend

#### In-App Notification

**Model**: `Notification`
**Entity Name**: `"worklog_reminder"`
**Data**:

```json
{
  "date": "2026-03-04",
  "message": "Don't forget to log your time for today!"
}
```

**User Preference**: `UserNotificationPreference.worklog_reminder` (Boolean, default=True)

### Timezone Handling

**Important**: The task runs at UTC 10:00 but uses local dates:

```python
today = date.today()  # Uses Django's timezone.now() -> local date
```

For different timezones:

- **Vietnam (UTC+7)**: UTC 10:00 = 5:00 PM same day ✅
- **US East (UTC-5)**: UTC 10:00 = 5:00 AM **next day** (morning reminder for yesterday) ⚠️
- **US West (UTC-8)**: UTC 10:00 = 2:00 AM **next day** ⚠️

**Note**: Reminders may fire on the "next day" for western timezones due to the UTC schedule. No weekend guard currently exists.

---

## Feature Flag Gating (Phase 9)

### Overview

All time tracking UI features are gated behind the `is_time_tracking_enabled` project flag, providing admins with fine-grained control over feature availability per project.

**Flag**: `Project.is_time_tracking_enabled` (Boolean, default=True)

### Frontend Gating Points

**1. Sidebar Navigation**

- **File**: `apps/web/ce/components/sidebar/project-navigation-root.tsx`
- **Pattern**: `shouldRender: !!project?.is_time_tracking_enabled`
- **Behavior**: "Time Tracking" menu item hidden when flag is False

**2. Route Guard**

- **File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/layout.tsx`
- **Behavior**: Direct URL access shows `DetailedEmptyState` with disabled message
- **Message** (i18n):
  - **EN**: "Time tracking is not enabled for this project. Contact a project admin to enable it in Project Settings → Features."
  - **VI**: "Dự án này không yêu cầu chấm công. Nếu cần, hãy liên hệ Project Admin để bật trong Cài đặt dự án → Tính năng."
  - **KO**: "이 프로젝트에서는 시간 추적이 활성화되지 않았습니다. 프로젝트 설정 → 기능에서 활성화하려면 프로젝트 관리자에게 문의하세요."

**3. "Log Time" Button**

- **File**: `apps/web/ce/components/issues/worklog/activity/worklog-create-button.tsx`
- **Behavior**: When disabled, shows friendly info popup instead of being hidden
- **Component**: Uses `AlertDialog` to display the disabled message
- **UX**: User sees explanation + link to project settings rather than button disappearing

**4. Worklog Property (Issue Sidebar)**

- **File**: `apps/web/ce/components/issues/worklog/property/root.tsx`
- **Behavior**: Hidden when `is_time_tracking_enabled === false`
- **Fallback**: No empty state needed (entire component unmounted)

### Type Definition

**File**: `packages/types/src/project/projects.ts`

Added to `IPartialProject`:

```typescript
is_time_tracking_enabled: boolean;
```

### i18n Keys

Added under `time_tracking` group:

| Key                    | EN                                               | VI                                   | KO                                |
| ---------------------- | ------------------------------------------------ | ------------------------------------ | --------------------------------- |
| `disabled_title`       | Time tracking is not enabled                     | Chấm công chưa được bật              | 시간 추적이 활성화되지 않았습니다 |
| `disabled_description` | Time tracking is not enabled for this project... | Dự án này không yêu cầu chấm công... | 이 프로젝트에서는 시간 추적이...  |

### Backend Enforcement

The backend API endpoints already enforce this flag server-side:

**File**: `apps/api/plane/app/views/issue/worklog.py`

- `create()`: Calls `_check_time_tracking_enabled(project_id)` before allowing worklog creation
- Response (400 Bad Request) if disabled:
  ```json
  {
    "error": "Time tracking is not enabled for this project"
  }
  ```

This ensures that even if a frontend bypasses gating, the API rejects unauthorized operations.

---

## Frontend Implementation

### Components

#### WorklogModal

**File**: `apps/web/ce/components/issues/worklog/worklog-modal.tsx`
**Purpose**: Create/edit worklog entry
**Props**:

- `isOpen: boolean` - Modal visibility
- `onClose: () => void` - Close handler
- `issueId: string` - Current issue
- `existingWorklog?: IIssueWorkLog` - Worklog to edit (optional)
- `onSuccess?: () => void` - Callback after save

**Features**:

- Date picker with min/max validation (7-working-day window)
- Duration input (1–1440 minutes)
- Description field
- Real-time daily limit feedback (visual indicator)
- Error toast on validation failure

#### WorklogActivity

**File**: `apps/web/ce/components/issues/worklog/activity/root.tsx`
**Purpose**: List and manage worklogs for issue
**Features**:

- List of logged time entries
- Edit/delete buttons (admin-only, show lock icon if outside edit window)
- Activity feed integration
- Filter by date range

#### WorklogProperty

**File**: `apps/web/ce/components/issues/worklog/property/root.tsx`
**Purpose**: Issue detail sidebar property (quick add)
**Features**:

- Quick "Log Time" button
- Display total logged time for issue
- Mini form or modal trigger

### Date Validation Logic

**File**: `apps/web/ce/components/issues/worklog/utils/worklog-date-utils.ts`

```typescript
function getMinAllowedDate(workingDays: number = 7): string {
  const today = new Date();
  let daysBack = 0;
  const targetDate = new Date(today);

  while (daysBack < workingDays) {
    targetDate.setDate(targetDate.getDate() - 1);
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Mon=1, Fri=5
      daysBack++;
    }
  }

  return targetDate.toISOString().split("T")[0];
}

function isWithinEditWindow(loggedAt: string): boolean {
  const minDate = getMinAllowedDate(7);
  // String comparison works because dates are zero-padded ISO format (YYYY-MM-DD)
  return loggedAt >= minDate;
}
```

### State Management

**Store**: `apps/web/ce/store/project/worklog.store.ts` (MobX)

**Actions**:

- `createWorklog(issueId, data)` → POST /worklogs/
- `updateWorklog(worklogId, data)` → PATCH /worklogs/{id}/
- `deleteWorklog(worklogId)` → DELETE /worklogs/{id}/
- `fetchSummary(groupBy, dateRange)` → GET /summary/
- `fetchTimesheet(filters)` → GET /timesheet-grid/

**Computed**:

- `totalLoggedToday: number` - Sum for current date
- `remainingMinutes: number` - 720 - totalLoggedToday
- `canEdit(worklog): boolean` - Within edit window
- `editableWorklogs: IIssueWorkLog[]` - Filtered by window

### Error Handling

**Common errors (with UX treatment)**:

| Error                  | Code | Toast Message                                          | User Action                             |
| ---------------------- | ---- | ------------------------------------------------------ | --------------------------------------- |
| Time tracking disabled | 400  | "Time tracking is not enabled for this project"        | Contact admin                           |
| Daily limit exceeded   | 400  | "Daily limit exceeded. You have 60 min remaining."     | Reduce duration or log on different day |
| Invalid date           | 400  | "Date must be within 7 working days and not in future" | Adjust date in picker                   |
| Outside edit window    | 403  | "This entry is locked (older than 7 days)"             | Contact admin or create new entry       |
| Network error          | 5xx  | "Failed to save worklog. Please try again."            | Retry                                   |

---

## Backend Architecture

### Module Structure

**File**: `apps/api/plane/app/views/workspace/time_tracking/`

Modularized into 4 focused files:

- **`__init__.py`**: Exports all view classes
- **`summary.py`** (95 lines):
  - `ProjectWorkLogSummaryEndpoint` - Aggregate by member/issue
  - `WorkspaceWorkLogSummaryEndpoint` - Workspace-level rollup

- **`timesheet_grid.py`** (105 lines):
  - `TimesheetGridEndpoint` - Matrix view (member × date)

- **`timesheet_bulk.py`** (165 lines):
  - `TimesheetBulkUpdateEndpoint` - Batch upsert with validation

**Rationale**: Separation reduces file size, improves maintainability, and isolates concerns.

### Serializers

**File**: `apps/api/plane/app/serializers/worklog.py` (126 lines)

**Classes**:

- `IssueWorkLogSerializer` (standard): Full validation, `min_value=1` for duration
- `TimesheetBulkEntrySerializer`: Allows `min_value=0` for delete semantics
- `WorklogSummarySerializer`: Aggregated results

**Key Methods**:

- `validate_logged_at()`: Date range check (get_min_allowed_date)
- `validate_duration_minutes()`: Rejects 0 in standard serializer

---

## Known Issues & Tracking

### High Priority (Address soon)

None currently blocking. All critical bugs from prior review cycle have been fixed.

### Medium Priority

1. **Bulk endpoint daily limit logic** — Complex exclusion filtering; needs inline documentation
2. **Multi-workspace user notification** — Reminder assigned to arbitrary workspace (dict collision)
3. **Email connection leak** — `get_connection()` not closed in finally block
4. **Notification.data GIN index** — Missing for efficient JSONB filtering at scale
5. **Time tracking enabled check** — `partial_update`/`destroy` don't verify flag (intentional cleanup window?)

### Low Priority

1. **Race condition in daily limit check** — Concurrent requests can exceed 720 min (no DB lock)
2. **Celery timezone comment** — Assumes fixed UTC+7; becomes stale if deployment region changes
3. **i18n tone mismatch** — Email body and UI reminder message use different emoji/tone (acceptable by design)
4. **String date comparison** — Relies on zero-padded ISO format (safe but should be documented)
5. **Bulk no-op entries** — Silent skip if duration=0 and no existing worklog

---

## Testing Checklist

- [ ] Daily limit enforced for single and bulk create
- [ ] Edit window blocks older entries (7-working-day check)
- [ ] Weekend/holiday correctly excluded from working-day count
- [ ] ADMIN-only permissions enforced on edit/delete
- [ ] Time tracking disabled blocks create
- [ ] Future dates rejected
- [ ] Celery reminder sends to eligible users only
- [ ] User preference toggle respected
- [ ] Date picker restricts to valid range (client-side)
- [ ] Error toasts display on all validation failures
- [ ] Bulk upsert correctly handles mixed creates/updates/deletes

---

## Deployment Notes

### Environment Variables

No new env vars required. Existing SMTP/email config applies to reminders.

### Database Migrations

**Migration**: `0128_usernotificationpreference_worklog_reminder.py`

Adds single Boolean field with default=True. Non-blocking, safe to apply to production.

### Celery Configuration

Ensure `worklog_daily_reminder` is registered in:

- `plane/celery.py` — beat schedule
- `plane/bgtasks/worklog_reminder_task.py` — task definition

### Monitoring

Track:

- Celery task execution time (daily reminder)
- Email delivery failures (SMTP errors)
- API 400/403 rates for worklog endpoints
- User preference toggle rates

---

## i18n Keys

**Locales**: EN, KO, VI

**Translation Keys**:

- `worklog.title` - "Time Tracking"
- `worklog.create_worklog` - "Log Time"
- `worklog.duration` - "Duration"
- `worklog.description` - "Description"
- `worklog.logged_at` - "Date"
- `worklog.reminder_message` - Daily reminder UI text
- `worklog.daily_limit_exceeded` - Error message
- `worklog.outside_edit_window` - Locked entry message
- `worklog.no_entries` - Empty state

---

## References

- Code review report: `plans/reports/code-reviewer-260304-1301-worklog-phases-5-8-final.md`
- Serializers: `apps/api/plane/app/serializers/worklog.py`
- Views: `apps/api/plane/app/views/issue/worklog.py`
- Time tracking endpoints: `apps/api/plane/app/views/workspace/time_tracking/`
- Celery task: `apps/api/plane/bgtasks/worklog_reminder_task.py`
- Frontend store: `apps/web/ce/store/project/worklog.store.ts`
- Types: `packages/types/src/worklog.ts`
