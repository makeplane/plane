# Recurring Work Items Scheduler

This document describes the batch scheduling architecture for recurring work items.

## Overview

Recurring work items use a **batch scheduler** approach instead of creating individual `PeriodicTask` entries for each recurring work item. This provides better scalability and calendar-accurate scheduling.

## Why We Switched to This Approach

### Problem 1: Calendar Drift with Monthly/Yearly Intervals

The previous implementation used `django-celery-beat`'s `IntervalSchedule` for custom intervals (e.g., every 2 weeks, every 3 months). This required converting intervals to fixed days:

```python
# Old approach - causes drift!
if interval_type == "monthly":
    every = interval_count * 30  # 30 days per month
elif interval_type == "yearly":
    every = interval_count * 365  # 365 days per year
```

**The problem**: Months have 28-31 days, and years have 365-366 days. Using fixed approximations causes scheduling drift:

| Scenario          | Expected                 | Actual (30-day months)   |
| ----------------- | ------------------------ | ------------------------ |
| Monthly on Jan 15 | Jan 15 → Feb 15 → Mar 15 | Jan 15 → Feb 14 → Mar 16 |
| After 12 months   | Same date next year      | 5-6 days off             |
| After 5 years     | Same date                | ~25 days off             |

For yearly intervals, the drift is even worse - a task scheduled for "every year on March 1st" would eventually run in February or April.

### Problem 2: Scalability of Per-Record PeriodicTasks

The previous approach created one `PeriodicTask` database record for each recurring work item:

```
RecurringWorkitemTask (1000 records)
         ↓
PeriodicTask (1000 records)
         ↓
Celery Beat loads ALL into memory on startup
```

**Issues**:

- Celery Beat must load all `PeriodicTask` records into memory
- Each record adds overhead to the Beat scheduler loop
- Database grows with duplicate scheduling metadata
- Harder to debug and monitor scheduling state

### Problem 3: Limited Interval Flexibility

`IntervalSchedule` only supports fixed intervals (seconds, minutes, hours, days). It cannot express:

- "Every 2nd Tuesday"
- "Every 3 months on the 15th"
- "Every quarter"

While `CrontabSchedule` is more flexible, it cannot express intervals > 1 (e.g., "every 2 weeks").

### Solution: Batch Scheduler with Calendar Math

The new approach solves all these problems:

| Problem        | Solution                                               |
| -------------- | ------------------------------------------------------ |
| Calendar drift | `dateutil.relativedelta` for accurate month/year math  |
| Scalability    | Single batch job instead of N periodic tasks           |
| Flexibility    | Calculate next occurrence programmatically             |
| Memory         | O(1) Celery Beat memory regardless of task count       |
| Debugging      | `next_scheduled_at` field shows exactly when task runs |

### Trade-offs

| Aspect            | Old (PeriodicTask)            | New (Batch Scheduler)     |
| ----------------- | ----------------------------- | ------------------------- |
| Precision         | Exact cron timing             | Within 15-minute window   |
| Complexity        | Django-celery-beat handles it | Custom scheduler logic    |
| Visibility        | PeriodicTask admin            | `next_scheduled_at` field |
| Memory            | O(N) in Beat                  | O(1) in Beat              |
| Calendar accuracy | Drift with months/years       | Accurate                  |

The 15-minute window precision is acceptable for recurring work items (daily/weekly/monthly tasks) where exact-to-the-second timing is not critical.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BATCH SCHEDULER                          │
│                                                             │
│  Celery Beat (every 15 minutes)                              │
│       ↓                                                     │
│  schedule_batch() task                                      │
│       ↓                                                     │
│  Query: enabled=True, periodic_task__isnull=True,          │
│         next_scheduled_at <= now + 15 minutes               │
│       ↓                                                     │
│  Schedule each task with unique task_id                     │
│       ↓                                                     │
│  create_work_item_from_template() executes immediately      │
│       ↓                                                     │
│  advance_to_next_schedule() updates next_scheduled_at       │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### Model (`RecurringWorkitemTask`)

The model uses `ChangeTrackerMixin` to automatically detect field changes and trigger scheduler updates.

**Tracked Fields:**

```python
TRACKED_FIELDS = ["start_at", "interval_type", "interval_count", "enabled"]
```

**Key Fields:**

| Field               | Purpose                                 |
| ------------------- | --------------------------------------- |
| `next_scheduled_at` | Next execution time (calendar-accurate) |
| `last_run_at`       | Last successful execution time          |
| `periodic_task`     | Legacy field, NULL for new tasks        |

**Automatic Scheduler Triggering:**

The model's `save()` method automatically triggers the scheduler when:

1. A new task is created with `enabled=True`
2. Schedule fields change (`start_at`, `interval_type`, `interval_count`)
3. A task is enabled (`enabled` changes to `True`)

This eliminates the need for views to manually call the scheduler.

### Scheduler Tasks (`recurring_work_item_scheduler.py`)

| Task                             | Trigger                 | Purpose                                              |
| -------------------------------- | ----------------------- | ---------------------------------------------------- |
| `schedule_batch()`               | Celery Beat (every 15m) | Find and schedule all tasks due in next 15 minutes   |
| `schedule_on_create_or_enable()` | On create/update        | Immediate scheduling for newly created/enabled tasks |

### Worker Task (`recurring_work_item_task.py`)

`create_work_item_from_template()`:

1. Creates work item from template
2. Cleans up legacy `PeriodicTask` if present
3. Calls `advance_to_next_schedule()` to set next execution time

## Calendar-Accurate Scheduling

Uses `dateutil.relativedelta` for proper calendar math:

```python
# Monthly: Properly handles varying month lengths
relativedelta(months=1)  # Jan 31 → Feb 28/29 → Mar 31

# Yearly: Handles leap years correctly
relativedelta(years=1)   # Feb 29, 2024 → Feb 28, 2025
```

This avoids drift that would occur with fixed-day approximations (30 days/month, 365 days/year).

## Timezone Handling

All recurring work items execute at **00:05 in the project's timezone**.

> **Why 00:05 instead of 00:00?** The batch scheduler runs every 6 hours at :00 (00:00, 06:00, 12:00, 18:00 UTC). Tasks scheduled exactly at these boundaries could be picked up by two consecutive batch runs, causing duplicate execution. Using 00:05 avoids this edge case.

### Key Principles

1. **Project timezone is authoritative**: Regardless of which user creates the task, the schedule is based on the project's timezone
2. **Always 00:05**: Tasks run at 00:05 in the project's timezone, not the time when the task was created
3. **Calendar math in local time**: DST transitions are handled correctly

### Why Project Timezone?

Multiple admins from different timezones may manage the same project. Using the project's timezone ensures consistency:

| Admin Location | Creates task for Jan 15 | Execution Time   |
| -------------- | ----------------------- | ---------------- |
| New York (EST) | Jan 15                  | Jan 15 00:05 EST |
| London (GMT)   | Jan 15                  | Jan 15 00:05 EST |
| Tokyo (JST)    | Jan 15                  | Jan 15 00:05 EST |

All see and expect the same execution time relative to the project.

### DST Handling

Calendar math is performed in the project's timezone to handle DST correctly:

| Scenario   | March 9 (before DST)  | March 10 (after DST)    |
| ---------- | --------------------- | ----------------------- |
| UTC math   | 00:05 EST (05:05 UTC) | 01:05 EDT (05:05 UTC) ✗ |
| Local math | 00:05 EST (05:05 UTC) | 00:05 EDT (04:05 UTC) ✓ |

### Project Timezone Changes

When a project's timezone is changed, existing recurring tasks use a **self-healing approach**:

1. **No immediate recalculation**: The stored `next_scheduled_at` (in UTC) is not updated when the project timezone changes
2. **First execution at old time**: The next execution happens at the originally scheduled UTC time (which may not be 00:05 in the new timezone)
3. **Self-correction**: After execution, `advance_to_next_schedule()` calculates the next run at 00:05 in the NEW timezone

**Example: Timezone change from UTC to IST (Asia/Kolkata, UTC+5:30)**

```
Initial state (project timezone: UTC):
  - Task created for Jan 16
  - start_at = Jan 16 00:05 UTC
  - next_scheduled_at = Jan 16 00:05 UTC

Project timezone changed to IST:
  - next_scheduled_at remains Jan 16 00:05 UTC (no change)
  - Jan 16 00:05 UTC = Jan 16 05:35 IST (NOT 00:05 IST)

First execution (Jan 16 00:05 UTC / Jan 16 05:35 IST):
  - Task executes at the old scheduled time
  - advance_to_next_schedule() runs:
    - Gets current date in IST: Jan 16
    - Adds interval (e.g., 1 day): Jan 17
    - Creates 00:05 in IST: Jan 17 00:05 IST = Jan 16 18:35 UTC
  - next_scheduled_at = Jan 16 18:35 UTC

Subsequent executions:
  - All run at 00:05 IST (correct for new timezone)
```

**Why this approach?**

1. **Simplicity**: No need to track timezone changes or trigger recalculations
2. **No missed executions**: The task still runs (just at a different local time once)
3. **Automatic correction**: Future executions are at the correct time
4. **No duplicate executions**: Only one execution happens per interval

**Trade-off**: The first execution after a timezone change may not be at 00:05 in the new timezone. This is acceptable because:

- Timezone changes are infrequent
- The task still executes (just at a different local time)
- All subsequent executions are correct

### Implementation

**Serializer** (`recurring_work_item.py`):

```python
def _convert_date_to_project_tz(self, date_value, project_id, start_of_day=True):
    # Get project timezone
    tz = pytz.timezone(project.timezone)

    # Create 00:05 in project timezone (not 00:00 to avoid batch scheduler boundary)
    local_time = time(0, 5, 0) if start_of_day else time(23, 59, 59)
    local_datetime = tz.localize(datetime.combine(date_only, local_time))

    # Convert to UTC for storage
    return local_datetime.astimezone(pytz.UTC)
```

**Model** (`recurring.py`):

```python
def calculate_next_scheduled_at(self, from_date=None, allow_past=False):
    tz = self._get_project_timezone()
    now_local = (from_date or timezone.now()).astimezone(tz)

    # Use next_scheduled_at as base if available, otherwise start_at
    base = self.next_scheduled_at or self.start_at
    base_local = base.astimezone(tz)

    # If base is in future, return it directly
    if base_local > now_local:
        return base_local.astimezone(pytz.UTC)

    # Calculate intervals to skip mathematically (O(1), no loop)
    diff = relativedelta(now_local, base_local)
    if self.interval_type == "daily":
        intervals_to_add = ((now_local - base_local).days // self.interval_count) + 1
    elif self.interval_type == "monthly":
        total_months = diff.years * 12 + diff.months
        intervals_to_add = (total_months // self.interval_count) + 1
    # ... similar for weekly/yearly

    next_run_local = base_local + (delta * intervals_to_add)
    return next_run_local.astimezone(pytz.UTC)
```

**Key optimization**: Uses `next_scheduled_at` as base and calculates intervals mathematically instead of looping. This is O(1) regardless of how long the task was disabled.

### Storage

- `start_at`: 00:05 on the start date in project timezone, stored as UTC
- `end_at`: End of day (23:59:59) on the end date in project timezone, stored as UTC
- `next_scheduled_at`: Next execution time (always 00:05 in project timezone), stored as UTC

## Idempotency

Unique Celery task IDs prevent duplicate execution:

```python
task_id = f"recurring_{task.id}_{int(task.next_scheduled_at.timestamp())}"
```

Celery rejects tasks with duplicate `task_id`, ensuring each scheduled execution runs exactly once.

## Migration from Legacy System

There is **no backfill migration** for existing records. Legacy tasks migrate naturally through normal operation.

### Legacy Tasks (periodic_task IS NOT NULL)

Tasks created before the batch scheduler have a `PeriodicTask` entry. They continue to execute via the old system until they are migrated through one of two paths:

**Path 1: On Update (Immediate Migration)**

```
User updates a legacy task via API
    ↓
Model save() detects periodic_task IS NOT NULL
    ↓
_migrate_to_batch_scheduler() runs:
  - Deletes the PeriodicTask
  - Sets periodic_task = NULL
  - Calculates next_scheduled_at
    ↓
Task is now handled by batch scheduler
```

**Path 2: On Execution (Gradual Migration)**

```
Legacy PeriodicTask triggers execution
    ↓
Worker create_work_item_from_template() runs:
  - Creates work item
  - Deletes the PeriodicTask
  - Sets periodic_task = NULL
  - Calls advance_to_next_schedule() → sets next_scheduled_at
    ↓
Task is now handled by batch scheduler
```

### Why No Backfill?

1. **Legacy tasks keep working**: The old `PeriodicTask` system continues to trigger them
2. **No double execution**: Batch scheduler filters `periodic_task__isnull=True`
3. **Natural migration**: Tasks migrate when they execute or get updated
4. **Zero downtime**: No need to run a migration that touches all records

### New Tasks (periodic_task IS NULL)

Created without `PeriodicTask`, handled by batch scheduler from the start. The `next_scheduled_at` is calculated in `save()` on creation.

### Immediate Execution vs. Duplicate Prevention

The `calculate_next_scheduled_at()` method has an `allow_past` parameter:

```python
def calculate_next_scheduled_at(self, from_date=None, allow_past=False):
    base = self.next_scheduled_at or self.start_at
    base_local = base.astimezone(tz)

    # If allow_past=True and base is today/future, return it directly
    # This allows immediate execution if 00:05 has passed
    if allow_past and base_local.date() >= now_local.date():
        return base_local.astimezone(pytz.UTC)

    # Otherwise, calculate next future occurrence mathematically (O(1))
    intervals_to_add = (total_elapsed // self.interval_count) + 1
    next_run_local = base_local + (delta * intervals_to_add)
```

| Context           | `allow_past` | Behavior                                            |
| ----------------- | ------------ | --------------------------------------------------- |
| New task creation | `True`       | Can return today's 00:05 → immediate execution      |
| Task update       | `False`      | Always returns future date → no duplicate execution |
| Legacy migration  | `True`       | Can return today's 00:05 → immediate execution      |

**Example: Preventing duplicate execution on update**

1. User creates task for today (Jan 15) at 3pm
2. `allow_past=True` → `next_scheduled_at` = Jan 15 00:05
3. Task executes immediately, advances to Jan 16 00:05
4. User updates template name at 4pm
5. Schedule fields unchanged → `next_scheduled_at` stays Jan 16 00:05
6. If user updates `start_at` to today → `allow_past=False` → returns Jan 16 00:05 (not today)

### Filter for Batch Scheduler

```python
RecurringWorkitemTask.objects.filter(
    enabled=True,
    periodic_task__isnull=True,  # Only migrated/new tasks
    next_scheduled_at__lte=window_end,
)
```

The `periodic_task__isnull=True` filter ensures:

- Legacy tasks (still using `PeriodicTask`) are not double-scheduled
- Only tasks that have been migrated or newly created are picked up

## Flow Diagrams

### New Task Creation

```
API: POST /recurring-work-items/
    ↓
RecurringWorkitemTask.save()
    ↓
ChangeTrackerMixin detects new record
    ↓
Calculate next_scheduled_at (no PeriodicTask created)
    ↓
Model triggers schedule_on_create_or_enable.delay()
    ↓
If due within 15 minutes → schedule immediately
```

### Task Update (Schedule Fields Changed)

```
API: PATCH /recurring-work-items/{id}/
    ↓
RecurringWorkitemTask.save()
    ↓
ChangeTrackerMixin detects start_at/interval_type/interval_count changed
    ↓
Reset next_scheduled_at = None (forces recalculation)
    ↓
Recalculate next_scheduled_at from start_at
    ↓
Model triggers schedule_on_create_or_enable.delay()
```

### Task Execution

```
Celery executes create_work_item_from_template()
    ↓
Create work item from template
    ↓
Clean up legacy PeriodicTask (if exists)
    ↓
advance_to_next_schedule()
    ↓
next_scheduled_at = next day at 00:05 (in project timezone)
last_run_at = now
```

### Batch Scheduler (Every 15 Minutes)

```
schedule_batch() runs
    ↓
Query tasks where:
  - enabled = True
  - periodic_task IS NULL
  - next_scheduled_at <= now + 15 minutes
  - end_at IS NULL OR end_at > now
    ↓
For each task:
  - Generate unique task_id
  - Dispatch immediately (no ETA)
```

## Configuration

### Celery Beat (`celery.py`)

```python
"recurring-batch-scheduler": {
    "task": "plane.ee.bgtasks.recurring_work_item_scheduler.schedule_batch",
    "schedule": crontab(minute="*/15"),  # Every 15 minutes
},
```

### Batch Window

```python
BATCH_WINDOW_MINUTES = 15  # Look ahead 15 minutes, run every 15 minutes
```

## Database Index

Optimized for batch scheduler queries:

```python
models.Index(
    fields=["enabled", "next_scheduled_at"],
    name="rwt_enabled_next_idx"
)
```

## ChangeTrackerMixin

The model uses `ChangeTrackerMixin` (from `plane.db.mixins`) to automatically detect field changes without manual tracking in views.

### How It Works

```python
class RecurringWorkitemTask(ChangeTrackerMixin, ProjectBaseModel):
    TRACKED_FIELDS = ["start_at", "interval_type", "interval_count", "enabled"]

    def save(self, *args, **kwargs):
        # ChangeTrackerMixin provides self.changed_fields
        schedule_fields = {"start_at", "interval_type", "interval_count"}

        if set(self.changed_fields) & schedule_fields:
            # Schedule changed - reset next_scheduled_at to force recalculation
            self.next_scheduled_at = None

        # ... rest of save logic
```

### Benefits

1. **Encapsulation**: All scheduling logic lives in the model, not scattered across views
2. **Consistency**: Field change detection works the same regardless of how the model is saved
3. **Maintainability**: Adding new tracked fields is a one-line change
4. **Testing**: Model behavior can be tested independently of views

### Usage in save()

The `save()` method uses `changed_fields` to:

1. **Detect schedule changes**: If `start_at`, `interval_type`, or `interval_count` changed, reset `next_scheduled_at`
2. **Trigger scheduler**: If the task is enabled and schedule changed (or task was just enabled), call `schedule_on_create_or_enable.delay()`

## Files Reference

| File                                                | Purpose                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------- |
| `plane/ee/models/recurring.py`                      | Model with scheduling logic, ChangeTrackerMixin, auto-triggers scheduler on save |
| `plane/ee/bgtasks/recurring_work_item_scheduler.py` | Batch and on-demand schedulers                                                   |
| `plane/ee/bgtasks/recurring_work_item_task.py`      | Worker task that creates work items                                              |
| `plane/ee/views/app/issue/recurring_work_item.py`   | API endpoints (CRUD operations only, scheduler triggered by model)               |
| `plane/celery.py`                                   | Celery Beat configuration                                                        |
| `plane/db/mixins.py`                                | Contains `ChangeTrackerMixin` for field change detection                         |
