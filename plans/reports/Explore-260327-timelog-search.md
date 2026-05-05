# Log Time / Time Tracking Feature — Codebase Search Report

## Overview

Search completed for all files related to "log time" / "logtime" / "time tracking" feature across both backend (Python) and frontend (TypeScript/React) codebases.

---

## Backend Files (apps/api/plane)

### 1. Core Models

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/db/models/worklog.py`

- **Model:** `IssueWorkLog` (ProjectBaseModel)
- **Fields:**
  - `issue` (FK to Issue, CASCADE)
  - `logged_by` (FK to User, CASCADE)
  - `duration_minutes` (PositiveIntegerField)
  - `description` (TextField, optional)
  - `logged_at` (DateField) ← **KEY: stores date only, no time component**
- **Indexes:** `[issue, logged_by]`, `[project, logged_at]`
- **Ordering:** `-logged_at, -created_at`

**Important:** The `logged_at` field is a **DateField** (not DateTime), meaning time tracking operates at the day level. No timezone conversion needed for storage.

---

### 2. Serializers

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/app/serializers/worklog.py`

#### IssueWorkLogSerializer

- **Validation on `logged_at`:**
  ```python
  def validate_logged_at(self, value):
      if value > date.today():
          raise serializers.ValidationError("Cannot log time for future dates.")
      min_date = get_min_allowed_date()  # 60 working days ago
      if value < min_date:
          raise serializers.ValidationError("Cannot log time more than 60 working days ago.")
      return value
  ```
- **Validation on `duration_minutes`:**
  - Must be > 0
  - Cannot exceed 720 minutes (12 hours) per entry
  - Daily aggregate limit: 720 minutes (checked at view level)

#### TimesheetBulkEntrySerializer

- **Fields:** `issue_id` (UUID), `logged_at` (DateField), `duration_minutes` (0-720)
- **Uses context:** `project_timezone` passed from view (line 60 in timesheet_bulk.py)
- **Same validation** as above for `logged_at`
- **Zero duration triggers deletion** in bulk upsert (intentional)

#### Helper Function

```python
def get_min_allowed_date(working_days=60):
    """Calculate date N working days ago (Mon-Fri only)."""
    current = date.today()
    days_counted = 0
    while days_counted < working_days:
        current -= timedelta(days=1)
        if current.weekday() < 5:  # Mon=0..Fri=4
            days_counted += 1
    return current
```

---

### 3. Views — Time Tracking Logic

#### A. Issue-Level Worklog CRUD

**File:** `/Users/ngoctran/Documents/Shinhan/plane/app/views/issue/worklog.py`

**Key Logic:**

- **CREATE:** Validates daily limit (720 min) before insert
  - Line 56-65: `_check_daily_limit()` — sums all worklogs for user on `logged_at` date
  - Returns error if total + new > 720 min
- **UPDATE:** Same daily limit check, excludes current worklog from sum
- **EDIT WINDOW:** 60 working days (enforced via `_check_edit_window()`)
  - Lines 67-70: Rejects updates to worklogs older than 60 working days
  - Used in partial_update and destroy
- **TIME TRACKING CHECK:** Project must have `is_time_tracking_enabled=True`

**Date/Time Handling:**

- Uses `django.utils.timezone` for activity logging timestamp
- `logged_at` is received as date, stored as date in DB
- No timezone conversion on `logged_at` itself

#### B. Bulk Timesheet Operations

**File:** `/Users/ngoctran/Documents/Shinhan/plane/app/views/workspace/time_tracking/timesheet_bulk.py`

**Key Points:**

- Bulk create/update/delete entries in one request
- **Line 60:** Passes `project.timezone` to serializer context
- **Lines 56-88:** Aggregate daily limit check across ALL entries in bulk payload
- **Lines 109-130:** Upsert logic:
  - Find existing worklog for `user + issue + logged_at`
  - If exists + `logged_at < min_allowed_date`: reject (edit window)
  - If `duration_minutes == 0`: delete
  - Otherwise: create or update

#### C. Daily Worklog Total (Timezone-Aware)

**File:** `/Users/ngoctran/Documents/Shinhan/plane/app/views/user/daily_worklog.py`

**Critical Timezone Logic:**

```python
def get(self, request):
    tz_str = request.GET.get("tz", "UTC")  # Comes from frontend
    try:
        tz = ZoneInfo(tz_str)
    except (ZoneInfoNotFoundError, KeyError):
        tz = ZoneInfo("UTC")

    today = datetime.now(tz).date()  # "Today" in USER'S timezone
    total = IssueWorkLog.objects.filter(
        logged_by=request.user,
        logged_at=today,  # Filter by date in user's TZ
    ).aggregate(total=Sum("duration_minutes"))["total"] or 0
```

**Why This Matters:**

- User in Tokyo (UTC+9) at 23:00 local = next day UTC
- Query must use `datetime.now(tz).date()` to get "today" in user's timezone
- Comparison with DateField `logged_at` works correctly

#### D. Timesheet Grid Endpoint

**File:** `/Users/ngoctran/Documents/Shinhan/plane/app/views/workspace/time_tracking/timesheet_grid.py`

**Key Points:**

- Takes `week_start` param (YYYY-MM-DD), defaults to current Monday
- Fetches issues assigned to user in project
- Aggregates worklogs by `logged_at` for the week
- **Line 32-33:** Uses `timezone.now().date()` for default week_start
- **No timezone param** — uses server timezone for default, but frontend can specify week_start

#### E. Project-Level Worklog Listing

**File:** `/Users/ngoctran/Documents/Shinhan/plane/app/views/project/worklog.py`

**Filtering:**

- Optional filters: `member_id`, `date_from`, `date_to`, `issue_id`
- Uses `parse_date()` helper for `date_from` / `date_to`
- Filters on `logged_at__gte` and `logged_at__lte`

---

### 4. Utility: Timezone Converter

**File:** `/Users/ngoctran/Documents/Shinhan/plane/utils/timezone_converter.py`

**Functions:**

**`user_timezone_converter(queryset, datetime_fields, user_timezone)`**

- Converts UTC datetime fields in queryset to user's timezone
- Used for datetime fields (NOT DateFields like `logged_at`)
- Handles single dict or list of dicts
- Modifies in-place

**`convert_to_utc(date, project_id, is_start_date=False)`**

- Converts date string (YYYY-MM-DD) to UTC datetime
- For cycle start dates (adds 1 second to avoid overlap)
- For cycle end dates (adds 23:59:00)
- **Not currently used for worklog `logged_at`** (which is already a date)

**`convert_utc_to_project_timezone(utc_datetime, project_id)`**

- Converts UTC datetime back to project's timezone
- **Not currently used for worklog `logged_at`**

**Note:** These utilities are designed for full datetime conversions. Since worklog uses DateField, timezone conversion is handled differently (see daily_worklog.py).

---

## Frontend Files (apps/web)

### 1. Type Definitions

**File:** Type definitions in `@plane/types` (not visible in this search but referenced)

- `IWorkLog` — worklog instance with `logged_at` as string (YYYY-MM-DD)
- `IWorkLogCreate` — payload for creating worklog
- `IWorkLogUpdate` — payload for updating worklog
- `ITimesheetGridResponse` — grid structure with daily buckets
- `ITimesheetBulkEntry` — single bulk entry
- `IUserDailyWorklogTotal` — daily total response

### 2. Services

#### WorklogService

**File:** `/Users/ngoctran/Documents/Shinhan/plane/core/services/worklog.service.ts`

**Methods:**

- `listWorklogs(workspaceSlug, projectId, issueId)` → `IWorkLog[]`
- `createWorklog(workspaceSlug, projectId, issueId, data)` → `IWorkLog`
- `updateWorklog(workspaceSlug, projectId, issueId, worklogId, data)` → `IWorkLog`
- `deleteWorklog(workspaceSlug, projectId, issueId, worklogId, reason?)` → void
- `getProjectSummary(workspaceSlug, projectId, params?)` → `IWorkLogSummary`
- `getWorkspaceSummary(workspaceSlug, params?)` → `IWorkLogSummary`
- `getTimesheetGrid(workspaceSlug, projectId, params?)` → `ITimesheetGridResponse`
- `bulkUpdateTimesheet(workspaceSlug, projectId, data)` → bulk result
- `getCapacityReport(workspaceSlug, projectId, params?)` → `ICapacityReportResponse`

#### UserWorklogService (CE)

**File:** `/Users/ngoctran/Documents/Shinhan/plane/ce/services/user-worklog.service.ts`

```typescript
async getUserDailyTotal(): Promise<IUserDailyWorklogTotal> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.get(`/api/users/me/daily-worklog-total/?tz=${encodeURIComponent(tz)}`)
        .then(getData)
        .catch(...)
}
```

**Key:** Sends browser's timezone to backend via `tz` query param.

### 3. MobX Store

**File:** `/Users/ngoctran/Documents/Shinhan/plane/core/store/worklog.store.ts`

**Observables:**

- `worklogsByIssueId: Record<string, IWorkLog[]>` — keyed by issue ID
- `isLoading`, `isTimesheetLoading`, `isCapacityLoading` — loading states
- `timesheetData: ITimesheetGridResponse | null`
- `capacityData: ICapacityReportResponse | null`

**Key Actions:**

- `fetchWorklogs()` — list for issue
- `createWorklog()` — adds to front of array
- `updateWorklog()` — find by ID and replace
- `deleteWorklog()` — removes from array, with in-flight tracking to prevent duplicates
- `fetchTimesheetGrid()` — fetches grid, sets `timesheetData`
- `bulkUpdateTimesheet()` — posts bulk entries, re-fetches grid
- `fetchCapacityReport()` — fetches and caches capacity data

### 4. Worklog Modal (CE Component)

**File:** `/Users/ngoctran/Documents/Shinhan/plane/ce/components/issues/worklog/worklog-modal.tsx`

**Form State:**

- `loggedAt: string` (YYYY-MM-DD) — initialized to `todayDate()`
- `hours: number` (0-23)
- `minutes: number` (0-59)
- `description: string` (optional)
- `reason: string` (required for edits)

**Validation:**

- `duration_minutes > 0` (client-side)
- `loggedAt >= getMinAllowedDate()` (date input min attribute)
- `loggedAt <= todayDate()` (date input max attribute)
- Reason required for edits

**Date Range Constraints:**

- `min={getMinAllowedDate()}` — HTML date input attribute
- `max={todayDate()}` — HTML date input attribute

**Submission:**

- Converts hours/minutes to `duration_minutes` via `parseDisplayToMinutes()`
- Sends `{ duration_minutes, logged_at, description, reason }`

### 5. Worklog Date Utilities (CE)

**File:** `/Users/ngoctran/Documents/Shinhan/plane/ce/components/issues/worklog/utils/worklog-date-utils.ts`

```typescript
export const getMinAllowedDate = (workingDays = 60): string => {
  const d = new Date();
  let counted = 0;
  while (counted < workingDays) {
    d.setDate(d.getDate() - 1);
    const dow = d.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) counted++;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const isWithinEditWindow = (loggedAt: string, workingDays = 60): boolean => {
  const minDate = getMinAllowedDate(workingDays);
  return loggedAt >= minDate; // String comparison works for YYYY-MM-DD
};
```

**Algorithm:** Counts backward through calendar, skipping weekends (Sat/Sun).

---

## Date/Time & Timezone Handling Summary

### Storage Level

- **`IssueWorkLog.logged_at`** is a `DateField` (no time or timezone)
- Database stores: YYYY-MM-DD string
- No UTC conversion needed for storage

### Creation/Update Validation

1. **Backend serializer** (`IssueWorkLogSerializer.validate_logged_at`):
   - Must be <= today (per server timezone, from `date.today()`)
   - Must be >= 60 working days ago
   - No timezone awareness — uses server's `date.today()`

2. **Frontend modal**:
   - Date picker uses browser's local date input
   - HTML5 constraints: `min=getMinAllowedDate()`, `max=todayDate()`
   - Sends YYYY-MM-DD string to backend

### Daily Limit Check (720 minutes)

- **Backend view** (`worklog.py`):
  - Queries all worklogs where `logged_by=user` AND `logged_at=date`
  - Sums `duration_minutes`
  - Enforced on create and update (exclude current worklog on update)

- **Frontend daily total** (`user/daily_worklog.py`):
  - Takes `?tz=` query param from frontend
  - Computes `today = datetime.now(tz).date()` in user's timezone
  - Queries by this date to show "today" correctly to user

### Edit Window (60 Working Days)

- **Calculated** via `get_min_allowed_date(working_days=60)`
- Counts Mon-Fri only (skips weekends)
- Enforced in both backend views and frontend date input

### Timezone Awareness

- **`logged_at` (DateField):** No timezone needed — represents a calendar date
- **`created_at` / `updated_at`:** Django manages as UTC DateTimeFields
- **Daily total endpoint:** Explicitly takes user's timezone to compute "today"
- **Timesheet grid:** Uses server timezone for default week_start, but accepts `?week_start=` override

---

## Key Conditions & Boundaries

### Time Boundaries

| Boundary                       | Enforced Where       | Logic                       |
| ------------------------------ | -------------------- | --------------------------- |
| Max 12 hours per entry         | Serializer, frontend | `duration_minutes <= 720`   |
| Max 12 hours per day           | View create/update   | Daily aggregate check       |
| Future dates blocked           | Serializer, frontend | `logged_at <= date.today()` |
| Must be >= 60 working days old | Serializer, frontend | `get_min_allowed_date()`    |
| Edit window 60 days            | View edit/delete     | `_check_edit_window()`      |

### Edit Conditions

| Operation | Condition                               | Response                         |
| --------- | --------------------------------------- | -------------------------------- |
| Create    | Time tracking enabled + daily limit OK  | 201 Created                      |
| Create    | Time tracking disabled                  | 400 Bad Request                  |
| Create    | Daily limit exceeded                    | 400 Bad Request + remaining mins |
| Update    | Within 60 working days + daily limit OK | 200 OK                           |
| Update    | Outside edit window                     | 403 Forbidden                    |
| Update    | Daily limit exceeded                    | 400 Bad Request                  |
| Delete    | Within 60 working days                  | 204 No Content                   |
| Delete    | Outside edit window                     | 403 Forbidden                    |

---

## Data Flow Summary

### Create Flow

1. Frontend modal collects: `logged_at`, `hours`, `minutes`, `description`
2. Converts to: `duration_minutes`, sends POST to `/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/`
3. Backend `IssueWorkLogViewSet.create()`:
   - Validates time tracking enabled
   - Serializer validates `logged_at` and `duration_minutes`
   - Checks daily limit (720 min)
   - Saves with `logged_by=request.user`
   - Fires `issue_activity.delay(type="worklog.activity.created")`
4. Frontend store receives response, prepends to issue's worklog list

### Bulk Timesheet Update Flow

1. Frontend sends POST to `/api/workspaces/{slug}/projects/{project_id}/time-tracking/timesheet/bulk/`
2. Payload: `{ entries: [{ issue_id, logged_at, duration_minutes }, ...] }`
3. Backend `TimesheetBulkUpdateEndpoint.post()`:
   - Validates entries with `TimesheetBulkEntrySerializer` (includes `project_timezone` in context)
   - Aggregates daily limit across all entries
   - For each entry: upsert logic (create/update if > 0, delete if = 0)
   - Fires activity events for each change
4. Frontend re-fetches timesheet grid with same week_start

### Daily Total Check (for "today" in user's timezone)

1. Frontend calls `UserWorklogService.getUserDailyTotal()`
2. Sends: `GET /api/users/me/daily-worklog-total/?tz=America/New_York`
3. Backend `UserDailyWorklogTotalEndpoint.get()`:
   - Parses timezone from query param
   - Computes `today = datetime.now(tz).date()`
   - Sums all worklogs where `logged_by=user` AND `logged_at=today`
   - Returns `{ total_minutes, date }`

---

## Files Not Related to Log Time

(Found in grep but not core to log time feature)

- `apps/api/plane/db/signals/project.py` — general project signals
- `apps/api/plane/db/migrations/0148_seed_default_project_views.py` — seed data
- `apps/web/core/components/issues/issue-layouts/utils.tsx` — layout utilities
- `apps/web/core/hooks/use-timezone.tsx` — workspace-level timezone hook (not worklog-specific)
- `apps/web/core/hooks/use-timezone-converter.tsx` — timezone conversion utility
- `apps/web/ce/components/navigations/top-navigation-root.tsx` — navigation

---

## Questions Resolved

✓ Backend date storage: DateField (no datetime, no timezone)
✓ Validation boundaries: 60 working days edit window, 720 min daily limit
✓ Timezone handling: User's timezone passed via query param for "today" calculation
✓ Bulk operations: Aggregate limit check across all entries before any writes
✓ Edit conditions: Explicit 60-day window with 403 Forbidden response
✓ Frontend date constraints: HTML5 date input with min/max from working days calc
