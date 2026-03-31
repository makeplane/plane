# Scheduled Automation Triggers

## Overview

This document describes the scheduled (time-based) automation triggers feature added to the Plane automation engine. It is intended as a complete handoff document for a developer who needs to test, integrate with the frontend, and make any necessary changes.

**Status:** Backend implementation complete. Needs: migration generation, testing in dev environment, FE integration, API endpoints for CRUD.

**Design Spec:** `designs/automations/scheduled-triggers-design.md`
**Implementation Plan:** `designs/automations/scheduled-triggers-plan.md`
**Figma Designs:** https://www.figma.com/design/AGkhcaYhXQOyNMicvA3yup/Automations?node-id=4528-27054

---

## What Was Built

The automation engine previously only supported **event-based triggers** — automations fire in response to database events (issue created, state changed, etc.) flowing through RabbitMQ. This feature adds **scheduled (time-based) triggers** that fire on cron schedules or fixed intervals.

### Components Added

| Component                            | File                                                     | Purpose                                                                                                                      |
| ------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `ScheduledTriggerParams`             | `plane/automations/nodes/triggers.py`                    | Pydantic schema for trigger config — supports both "fixed" (daily/weekly/monthly/yearly) and "cron" modes                    |
| `ScheduledTrigger`                   | `plane/automations/nodes/triggers.py`                    | Trigger node class registered as `"scheduled"` in the node registry                                                          |
| `fixed_to_cron()`                    | `plane/automations/tasks.py`                             | Converts fixed schedule config to a 5-field cron expression                                                                  |
| `resolve_timezone()`                 | `plane/automations/tasks.py`                             | Resolves timezone with fallback chain: trigger config → project → workspace → UTC                                            |
| `compute_next_scheduled_at()`        | `plane/automations/tasks.py`                             | Computes next fire time using `croniter`, returns UTC datetime                                                               |
| `execute_scheduled_automation`       | `plane/automations/tasks.py`                             | Celery task that executes a single scheduled automation (builds synthetic event, creates AutomationRun, runs through engine) |
| `schedule_automation_triggers_batch` | `plane/automations/tasks.py`                             | Celery Beat task (every 5 min) that finds due triggers and dispatches execution                                              |
| `next_scheduled_at` field            | `plane/ee/models/automation.py`                          | DateTimeField on `AutomationNode` — stores next UTC fire time                                                                |
| `last_triggered_at` field            | `plane/ee/models/automation.py`                          | DateTimeField on `AutomationNode` — stores last dispatch time                                                                |
| `autonode_sched_next_idx`            | `plane/ee/models/automation.py`                          | Partial index on `next_scheduled_at` for efficient batch queries                                                             |
| Celery Beat entry                    | `plane/celery.py`                                        | `"schedule-automation-triggers"` in `EE_JOBS` dict                                                                           |
| Unit tests                           | `plane/tests/unit/automations/test_scheduled_trigger.py` | 19 tests for params validation + trigger execution                                                                           |
| Unit tests                           | `plane/tests/unit/automations/test_scheduled_tasks.py`   | 12 tests for cron conversion, timezone resolution, scheduling                                                                |

### Bug Fix Included

`plane/automations/engine.py` lines 657, 681: Fixed `automation_run.result_data` → `automation_run.result`. The model field is `result`, not `result_data`. The old code silently set an in-memory attribute that was never persisted to the database. This bug affected all automation runs (event-based and scheduled).

---

## Architecture

### Event-Based Flow (Existing — Unchanged)

```
DB Change → Outbox → RabbitMQ (fanout) → AutomationConsumer
  → ProcessedAutomationEvent (dedup) → execute_automation_task (Celery)
  → engine.dispatch_automation_event()
    → for each active automation: test trigger against event
    → if trigger matches: create AutomationRun → condition → action(s)
```

### Scheduled Flow (New)

```
Celery Beat (every 5 min)
  → schedule_automation_triggers_batch()
    → SELECT AutomationNode WHERE handler_name='scheduled'
        AND next_scheduled_at <= now + 5min
        AND automation is published & enabled
    → FOR EACH due trigger:
        1. Advance next_scheduled_at (BEFORE dispatch, prevents drift)
        2. Dispatch execute_scheduled_automation (Celery task)

execute_scheduled_automation(automation_id, trigger_node_id, scheduled_at_iso)
  → Load automation, check feature flag
  → Build synthetic event (event_type: "automation.scheduled")
  → Set GUC: plane.initiator_type = 'SYSTEM.AUTOMATION' (loop prevention)
  → Create AutomationRun (trigger_source="schedule")
  → Increment Automation.run_count, set last_run_at
  → Create AutomationActivity
  → Call engine._execute_automation_after_trigger()
    → Log trigger NodeExecution
    → Execute condition node (if present) → Execute action(s)
  → Update trigger_node.last_triggered_at
```

### Key Differences from Event-Based

| Aspect                         | Event-Based                            | Scheduled                         |
| ------------------------------ | -------------------------------------- | --------------------------------- |
| Entry point                    | `dispatch_automation_event()`          | `execute_scheduled_automation()`  |
| Trigger source                 | RabbitMQ event                         | Celery Beat timer                 |
| Entity context                 | Single entity from event (`entity_id`) | No entity (entity-less execution) |
| `AutomationRun.trigger_source` | `event.get("source", "unknown")`       | `"schedule"`                      |
| `AutomationRun.trigger_event`  | Real event from outbox                 | Synthetic event dict              |
| Deduplication                  | `ProcessedAutomationEvent` model       | Idempotent Celery task ID         |
| Consumer involvement           | Yes (`AutomationConsumer`)             | No — bypasses consumer entirely   |

---

## Trigger Configuration Schema

The `ScheduledTriggerParams` Pydantic model validates the `config` JSON stored on `AutomationNode.config`.

### Two Modes

#### Mode 1: Fixed Schedule

User-friendly form matching the Figma UI. The frontend presents frequency/day/time pickers; the backend stores the structured data.

```json
{
  "method": "fixed",
  "frequency": "weekly",
  "days": ["mon", "wed", "fri"],
  "hour": 9,
  "minute": 0,
  "timezone": "Asia/Kolkata"
}
```

| Field          | Type                                           | Required         | Description                                       |
| -------------- | ---------------------------------------------- | ---------------- | ------------------------------------------------- |
| `method`       | `"fixed"`                                      | Yes              | Indicates fixed schedule mode                     |
| `frequency`    | `"daily" \| "weekly" \| "monthly" \| "yearly"` | Yes              | Schedule frequency                                |
| `days`         | `["mon", "tue", ...]`                          | Weekly only      | Which days of the week (multi-select)             |
| `day_of_month` | `1-31`                                         | Monthly + Yearly | Which day of the month                            |
| `month`        | `1-12`                                         | Yearly only      | Which month                                       |
| `hour`         | `0-23`                                         | Yes              | Hour (24h format)                                 |
| `minute`       | `0-59`                                         | Yes              | Minute                                            |
| `timezone`     | IANA string or `null`                          | No               | Optional; falls back to project → workspace → UTC |

**Validation rules per frequency:**

| Frequency | Required fields                           | Example cron equivalent |
| --------- | ----------------------------------------- | ----------------------- |
| `daily`   | `hour`, `minute`                          | `0 9 * * *`             |
| `weekly`  | `days` (non-empty), `hour`, `minute`      | `0 9 * * 1,3,5`         |
| `monthly` | `day_of_month`, `hour`, `minute`          | `0 9 15 * *`            |
| `yearly`  | `month`, `day_of_month`, `hour`, `minute` | `0 9 15 3 *`            |

#### Mode 2: Cron Expression

For power users. Standard 5-field cron.

```json
{
  "method": "cron",
  "cron_expression": "0 9 * * 1-5",
  "timezone": "Asia/Kolkata"
}
```

| Field             | Type                  | Required | Description                                     |
| ----------------- | --------------------- | -------- | ----------------------------------------------- |
| `method`          | `"cron"`              | Yes      | Indicates cron mode                             |
| `cron_expression` | String                | Yes      | 5-field standard cron (validated by `croniter`) |
| `timezone`        | IANA string or `null` | No       | Optional; same fallback chain                   |

### Fixed-to-Cron Conversion

The engine internally converts all fixed schedules to cron expressions for `croniter` to compute `next_scheduled_at`. The `fixed_to_cron()` function handles this:

```python
DAY_TO_CRON = {"mon": "1", "tue": "2", "wed": "3", "thu": "4", "fri": "5", "sat": "6", "sun": "0"}

# daily, 9:00       → "0 9 * * *"
# weekly, [mon,fri]  → "0 9 * * 1,5"
# monthly, 15th      → "0 9 15 * *"
# yearly, Mar 15     → "0 9 15 3 *"
```

### Timezone Resolution

The `resolve_timezone()` function walks a fallback chain:

1. `trigger.config.timezone` — if user explicitly set it in the UI
2. `project.timezone` — project-level default
3. `project.workspace.timezone` — workspace-level default
4. `"UTC"` — final fallback

The resolved timezone is used by `croniter` to evaluate cron expressions in local time, then the result is converted to UTC for storage in `next_scheduled_at`.

---

## Database Changes

### `AutomationNode` — New Fields

```python
next_scheduled_at = DateTimeField(null=True, blank=True)
last_triggered_at = DateTimeField(null=True, blank=True)
```

- Only populated for nodes where `handler_name="scheduled"`
- `next_scheduled_at` is always stored in **UTC**
- Both fields are `null` for all existing (event-based) trigger nodes

### Partial Index

```sql
CREATE INDEX autonode_sched_next_idx
ON automation_nodes (next_scheduled_at)
WHERE handler_name = 'scheduled' AND is_enabled = true;
```

This keeps the index small (only scheduled trigger rows) while enabling fast lookups for the batch scheduler.

### Migration

**Not yet generated.** Run:

```bash
cd plane-ee/apps/api
python manage.py makemigrations
python manage.py migrate
```

This will create a migration adding the two fields and the partial index to `automation_nodes`.

---

## Batch Scheduler — Detailed Logic

### `schedule_automation_triggers_batch()`

Registered in Celery Beat as `"schedule-automation-triggers"`, runs every 5 minutes.

**Query:**

```python
AutomationNode.objects
    .select_for_update(skip_locked=True)  # prevents concurrent dispatching
    .filter(
        handler_name="scheduled",                          # only scheduled triggers
        is_enabled=True,                                   # node is enabled
        next_scheduled_at__isnull=False,                   # has a scheduled time
        next_scheduled_at__lte=window_end,                 # due within 5-min window
        version__automation__is_enabled=True,              # automation is enabled
        version__automation__status="published",           # automation is published
        version__automation__current_version_id=F("version_id"),  # node is on active version
        version__automation__deleted_at__isnull=True,      # automation not soft-deleted
    )
    .select_related("version__automation__project")
```

**Key behaviors:**

1. **Advance-before-dispatch:** `next_scheduled_at` is updated and saved BEFORE the Celery task is dispatched. This prevents schedule drift if execution is slow or fails.

2. **Idempotent task ID:** `task_id=f"scheduled_{trigger_node.id}_{int(scheduled_at.timestamp())}"` — if Beat fires twice in quick succession, the second dispatch is a no-op (Celery deduplicates by task ID).

3. **`select_for_update(skip_locked=True)`** within `transaction.atomic()` — if two Beat workers run simultaneously, they skip rows already locked by the other worker.

4. **Per-trigger error isolation:** If dispatching one trigger fails, the loop continues to the next trigger. The error is logged and counted.

### `execute_scheduled_automation(automation_id, trigger_node_id, scheduled_at_iso)`

Celery task with 3 retries, exponential backoff, jitter.

**Execution steps:**

1. Load `Automation` with `select_related("current_version", "workspace", "project")`
2. Validate: `is_enabled=True`, `status="published"`, `current_version` exists
3. Check `FeatureFlag.AUTOMATIONS` for the workspace
4. Load automation nodes via `automation_engine._load_automation_nodes(version)`
5. Build synthetic event:
   ```python
   {
       "event_type": "automation.scheduled",
       "event_id": "<uuid4>",
       "timestamp": <epoch>,
       "workspace_id": "<uuid>",
       "project_id": "<uuid>",
       "entity_type": "work-item",  # from automation.scope
       "payload": {
           "scheduled_at": "2026-03-24T09:00:00+05:30"
       }
   }
   ```
6. Set Postgres GUC `plane.initiator_type = 'SYSTEM.AUTOMATION'` (prevents loop: consumer skips `SYSTEM.*` events)
7. Create `AutomationRun` with `trigger_source="schedule"`, `status="running"`
8. Atomically increment `Automation.run_count` and set `last_run_at`
9. Create `AutomationActivity` record
10. Call `engine._execute_automation_after_trigger(automation_run, event, trigger_result, nodes)` — this runs condition → action(s) exactly like event-based automations
11. Update `trigger_node.last_triggered_at`

### Loop Prevention

- The GUC `plane.initiator_type = 'SYSTEM.AUTOMATION'` is set within the transaction
- The `AutomationConsumer.process_message()` checks `initiator_type.startswith("SYSTEM.")` and skips system-originated events
- This means: if a scheduled automation's action creates/updates an issue, that database event will NOT re-trigger any event-based automations

---

## Synthetic Event Structure

When a scheduled automation fires, there is no real database event. The engine creates a synthetic event that flows through the same code path:

```python
{
    "event_type": "automation.scheduled",     # distinguishes from real events
    "event_id": "aeb02eb8-...",               # unique per execution
    "timestamp": 1754043667,                   # epoch of scheduled_at
    "workspace_id": "cd4ab5a2-...",
    "project_id": "02c3e1d5-...",
    "entity_type": "work-item",                # from automation.scope
    "payload": {
        "scheduled_at": "2026-03-24T09:00:00+05:30"
    }
}
```

**Important for action nodes:** This event has **no `entity_id`**. Action nodes that require `entity_id` (like `add_comment`, `change_property`) will fail with "No entity_id found in event data". Currently, only `run_script` works with scheduled triggers because it doesn't need `entity_id` — it passes the entire event as input to the script.

---

## How to Use — Creating a Scheduled Automation

### Via Management Command (Testing)

```bash
python manage.py create_automation --workspace-id <uuid> --project-id <uuid>
```

Select `scheduled` when prompted for the trigger type. Enter the config as JSON:

```json
{ "method": "fixed", "frequency": "daily", "hour": 9, "minute": 0, "timezone": "Asia/Kolkata" }
```

### Via API (Frontend Integration)

The existing automation CRUD API should work — the trigger node is just another `AutomationNode` with `handler_name="scheduled"` and `config` containing the schedule params.

**Creating an automation with a scheduled trigger:**

1. Create `Automation` (POST)
2. Create `AutomationVersion`
3. Create `AutomationNode` with:
   ```python
   node_type = "trigger"
   handler_name = "scheduled"
   config = {
       "method": "fixed",
       "frequency": "weekly",
       "days": ["mon", "fri"],
       "hour": 9,
       "minute": 0,
       "timezone": "Asia/Kolkata"
   }
   ```
4. Create action `AutomationNode` (e.g., `run_script`)
5. Create `AutomationEdge` connecting trigger → action
6. Publish the version
7. **Set `next_scheduled_at` on the trigger node** — this is critical, the batch scheduler won't find the trigger without it

### Setting `next_scheduled_at`

This must be set when the automation is published or enabled. Call `compute_next_scheduled_at()`:

```python
from plane.automations.tasks import compute_next_scheduled_at

trigger_node = AutomationNode.objects.get(id=trigger_node_id)
trigger_node.next_scheduled_at = compute_next_scheduled_at(
    config=trigger_node.config,
    project=trigger_node.version.automation.project,
)
trigger_node.save(update_fields=["next_scheduled_at"])
```

**When to set/clear `next_scheduled_at`:**

| Event                                       | Action                                                          |
| ------------------------------------------- | --------------------------------------------------------------- |
| Automation published with scheduled trigger | Set `next_scheduled_at`                                         |
| Automation enabled                          | Set `next_scheduled_at`                                         |
| Automation disabled                         | Set `next_scheduled_at = None`                                  |
| Trigger config updated                      | Recompute and set `next_scheduled_at`                           |
| Automation deleted                          | Soft-deleted; batch scheduler filters `deleted_at__isnull=True` |

**This lifecycle management is NOT yet implemented** — it needs to be added to the automation CRUD views or serializers.

---

## What Needs to Be Done (Frontend Integration)

### 1. Generate Migration

```bash
cd plane-ee/apps/api
python manage.py makemigrations
python manage.py migrate
```

### 2. API Changes — Trigger Config Validation

The automation create/update API endpoints need to validate the trigger config when `handler_name="scheduled"`. You can use `ScheduledTriggerParams` for this:

```python
from plane.automations.nodes.triggers import ScheduledTriggerParams

# In the serializer or view:
if node_data["handler_name"] == "scheduled":
    ScheduledTriggerParams(**node_data["config"])  # raises ValidationError if invalid
```

### 3. API Changes — `next_scheduled_at` Lifecycle

Add logic to set/clear `next_scheduled_at` when:

- An automation with a scheduled trigger is published → compute and set
- An automation is enabled/disabled → set or clear
- The trigger config is updated → recompute

This could be in:

- The `Automation.publish_version()` method
- The automation update view/serializer
- A `post_save` signal on `Automation`

### 4. Frontend — Trigger Configuration UI

The Figma design shows:

```
Trigger
├── "What's the trigger for this automation" dropdown
│     └── "Fixed schedule" (under "Time based" category)
├── Frequency dropdown: Daily / Weekly / Monthly / Yearly
├── Select day: chip multi-select (Mon-Sun) — shown for Weekly
├── Time: hour + minute + AM/PM pickers
└── Timezone: dropdown with IANA timezones
```

The frontend should:

1. Present the friendly form
2. Build the `ScheduledTriggerParams` JSON from the form values
3. Store in `AutomationNode.config`
4. For the cron mode (advanced): show a text input for `cron_expression`

**Note on AM/PM:** The Figma shows AM/PM format, but the backend stores `hour` in 24h format (0-23). The frontend must convert: 10 AM → `hour: 10`, 2 PM → `hour: 14`.

### 5. Frontend — Schedule Preview

Consider showing the user when the next N runs will be. You can compute this with:

```python
from croniter import croniter
from plane.automations.tasks import fixed_to_cron, resolve_timezone

cron_expr = config.get("cron_expression") if config["method"] == "cron" else fixed_to_cron(config)
tz = ZoneInfo(resolve_timezone(config, project))
cron = croniter(cron_expr, timezone.now().astimezone(tz))

next_runs = [cron.get_next(datetime) for _ in range(5)]
```

This could be exposed via a dedicated API endpoint.

### 6. Frontend — Automation List

The automation list should show scheduled automations alongside event-based ones. The `trigger_source="schedule"` on `AutomationRun` distinguishes scheduled runs from event-based runs.

### 7. Action Node Compatibility

Currently, only `run_script` works with scheduled triggers (entity-less execution). The other action nodes (`add_comment`, `change_property`) require `entity_id` in the event and will fail.

**Future work:** Add a condition/query node that selects entities from the DB (using rich filters or PQL), then fan-out actions across matched entities. See the design spec Section 8 ("Condition Node — Interface Contract") and Section 9 ("Unified Data Model") for the planned `EntityExecution` model.

---

## Testing Guide

### Running Unit Tests

```bash
cd plane-ee/apps/api

# All scheduled trigger tests
pytest plane/tests/unit/automations/ -v

# Just params validation
pytest plane/tests/unit/automations/test_scheduled_trigger.py -v

# Just scheduling utilities
pytest plane/tests/unit/automations/test_scheduled_tasks.py -v
```

### Manual Testing — End to End

1. **Start services:** API, Celery worker, Celery Beat, PostgreSQL, Redis, RabbitMQ

2. **Create a scheduled automation** via the management command or API

3. **Verify `next_scheduled_at` is set** on the trigger node:

   ```python
   from plane.ee.models import AutomationNode
   node = AutomationNode.objects.get(handler_name="scheduled", version__automation__name="My Automation")
   print(node.next_scheduled_at)  # Should be a future UTC datetime
   ```

4. **Wait for the batch scheduler** to fire (or trigger manually):

   ```python
   from plane.automations.tasks import schedule_automation_triggers_batch
   result = schedule_automation_triggers_batch()
   print(result)  # {"dispatched": 1, "errors": 0}
   ```

5. **Check execution results:**

   ```python
   from plane.ee.models import AutomationRun
   run = AutomationRun.objects.filter(trigger_source="schedule").order_by("-created_at").first()
   print(run.status)        # "success" or "failed"
   print(run.result)        # result JSON
   print(run.trigger_event) # synthetic event
   ```

6. **Check `next_scheduled_at` advanced:**
   ```python
   node.refresh_from_db()
   print(node.next_scheduled_at)  # Should be the NEXT fire time
   print(node.last_triggered_at)  # Should be set
   ```

### Testing Specific Scenarios

| Scenario            | How to test                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Daily at 9am IST    | Set `config.timezone="Asia/Kolkata"`, `hour=9`, verify `next_scheduled_at` is 03:30 UTC         |
| Weekly Mon+Fri      | Set `days=["mon", "fri"]`, verify it fires on correct days                                      |
| Cron mode           | Set `method="cron"`, `cron_expression="*/5 * * * *"` for every 5 min                            |
| Disabled automation | Set `is_enabled=False`, verify batch scheduler skips it                                         |
| Feature flag off    | Disable `AUTOMATIONS` flag, verify task returns early                                   |
| Concurrent Beat     | Run `schedule_automation_triggers_batch()` twice simultaneously, verify no duplicate dispatches |

---

## Known Limitations and Future Work

### Current Limitations

1. **Entity-less only:** Scheduled automations currently run without an entity context. Only `run_script` action works. `add_comment` and `change_property` will fail because they need `entity_id`.

2. **No `next_scheduled_at` lifecycle management:** The CRUD views don't yet set/clear `next_scheduled_at` when automations are published/enabled/disabled/updated. This must be added.

3. **No API endpoint for schedule preview:** Users can't see when the next N runs will be.

4. **Retry creates duplicate `AutomationRun`s:** If `execute_scheduled_automation` fails mid-execution and is retried by Celery, a new `AutomationRun` is created on each retry. Consider adding idempotency checks.

5. **`autoretry_for=(Exception,)` is broad:** Retries on ALL exceptions including non-transient logic errors. Consider narrowing to `OperationalError`, `ConnectionError`.

### Planned Future Work (from Design Spec)

1. **EntityExecution model** — per-entity tracking for multi-entity scheduled runs
2. **Condition node for DB queries** — using rich filters / PQL to select entities
3. **Fan-out execution** — run actions against each matched entity, with per-entity error handling
4. **`PARTIAL_SUCCESS` status** — when some entities succeed and others fail
5. **Aggregate fields on `AutomationRun`** — `total_entity_count`, `succeeded_entity_count`, `failed_entity_count`
6. **Delay/deadline triggers** — "if issue in state X for more than N hours"
7. **Date-field triggers** — "3 days before target_date"
8. **Service limits** — max entities per run, min schedule interval, monthly quota

---

## File Reference

All paths relative to `plane-ee/apps/api/`.

| File                                                     | What changed                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `requirements/base.txt`                                  | Added `croniter==3.0.3`                                                           |
| `plane/ee/models/automation.py:265-324`                  | Added `next_scheduled_at`, `last_triggered_at`, partial index to `AutomationNode` |
| `plane/automations/nodes/triggers.py:308-391`            | Added `ScheduledTriggerParams`, `ScheduledTrigger`                                |
| `plane/automations/tasks.py:34-73`                       | Added `fixed_to_cron`, `resolve_timezone`, `compute_next_scheduled_at`            |
| `plane/automations/tasks.py:229-358`                     | Added `execute_scheduled_automation` Celery task                                  |
| `plane/automations/tasks.py:361-422`                     | Added `schedule_automation_triggers_batch` Celery task                            |
| `plane/automations/engine.py:657,681`                    | Fixed `result_data` → `result` (pre-existing bug)                                 |
| `plane/celery.py:155-159`                                | Added `"schedule-automation-triggers"` to `EE_JOBS`                               |
| `plane/automations/CLAUDE.md`                            | Added `scheduled` to triggers table                                               |
| `plane/automations/README.md`                            | Added scheduled trigger docs + deployment section                                 |
| `plane/tests/unit/automations/__init__.py`               | New test package                                                                  |
| `plane/tests/unit/automations/test_scheduled_trigger.py` | 19 tests                                                                          |
| `plane/tests/unit/automations/test_scheduled_tasks.py`   | 12 tests                                                                          |

---

## Dependencies

| Dependency           | Version          | Purpose                                           |
| -------------------- | ---------------- | ------------------------------------------------- |
| `croniter`           | 3.0.3            | Cron expression parsing and next-fire computation |
| `django-celery-beat` | 2.6.0 (existing) | Celery Beat with `DatabaseScheduler`              |
| `pydantic`           | existing         | Trigger config validation                         |
| `zoneinfo`           | stdlib           | Timezone handling                                 |

---

## Glossary

| Term                      | Definition                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| **Batch scheduler**       | `schedule_automation_triggers_batch` — Celery Beat task that finds due triggers every 5 minutes   |
| **Fixed schedule**        | User-friendly schedule mode: daily/weekly/monthly/yearly + time + timezone                        |
| **Cron mode**             | Power-user schedule mode: raw 5-field cron expression                                             |
| **Synthetic event**       | Fake event dict built by the scheduled path to mimic the event structure that action nodes expect |
| **Entity-less execution** | Scheduled automation runs without a specific entity (no `entity_id` in event)                     |
| **GUC**                   | PostgreSQL Grand Unified Configuration — `plane.initiator_type` set to prevent automation loops   |
| **`next_scheduled_at`**   | UTC datetime on `AutomationNode` — when the trigger should next fire                              |
| **Trigger config**        | JSON in `AutomationNode.config` — validated by `ScheduledTriggerParams`                           |
