# Celery Task `issue_activity` Analysis Report

**Date**: 2026-03-19 | **Focus**: Data Format Compatibility & Error Handling

---

## Executive Summary

Found 1 **critical data format bug** in the worklog view's `partial_update` method that causes incompatible JSON serialization between Django QueryDict and the Celery task handler. The task has silent error swallowing via bare `except Exception:` handler.

**Issue**: Line 168 in `worklog.py` uses `dict(request.data)` which converts QueryDict to dict, then `json.dumps()` serializes it. When deserialized in the Celery task, values are strings (not typed), causing type mismatches in worklog_activity_updated handler at lines 1572-1576.

---

## 1. Task Handler Analysis (`issue_activities_task.py` lines 1607-1710)

### Entry Point

- **Function**: `issue_activity()` (lines 1607-1710)
- **Type**: Celery shared_task
- **Parameters**:
  - `type` (str): Activity type (e.g., "worklog.activity.updated")
  - `requested_data` (str): JSON string of changes
  - `current_instance` (str): JSON string of previous state
  - `issue_id`, `actor_id`, `project_id`, `epoch`: Metadata
  - `subscriber`, `notification`, `origin`, `intake`: Optional flags

### Error Handling Issue

```python
# Lines 1621-1710
try:
    # ... processing logic ...
except Exception as e:
    log_exception(e)  # Line 1709 - SILENTLY SWALLOWS ALL ERRORS
    return
```

**Problem**:

- Broad `except Exception` catches ALL errors without re-raising
- Only calls `log_exception(e)` which logs but doesn't propagate
- Task completes with status=SUCCESS even if data processing failed
- No visibility into why worklog activities aren't being created

### Worklog Activity Handler

Located at lines 1564-1586:

```python
def worklog_activity_updated(
    requested_data, current_instance, issue_id, project_id, workspace_id, actor_id, issue_activities, epoch
):
    requested = json.loads(requested_data) if requested_data else {}  # Line 1567
    current = json.loads(current_instance) if current_instance else {}  # Line 1568
    reason = requested.get("reason", "")  # Line 1569

    # Type comparisons - EXPECTS NUMERIC VALUES
    if "duration_minutes" in requested and requested.get("duration_minutes") != current.get("duration_minutes"):
        # BUG: If duration_minutes is string "60" vs int 60, this comparison fails
    if "logged_at" in requested and requested.get("logged_at") != current.get("logged_at"):
        # date comparison: string "2024-01-15" vs datetime object
```

---

## 2. Worklog View Analysis (`issue/worklog.py`)

### `partial_update` Method (lines 130-182)

**Line 151-153**: Creates JSON of current state (CORRECT)

```python
current_instance = json.dumps(
    IssueWorkLogSerializer(worklog).data, cls=DjangoJSONEncoder
)
```

- Uses serializer, guarantees typed values
- DjangoJSONEncoder handles datetime objects

**Line 168-172**: Creates JSON for request data (BUGGY)

```python
activity_data = dict(request.data)  # Line 168 - ISSUE HERE
activity_data["reason"] = reason
issue_activity.delay(
    type="worklog.activity.updated",
    requested_data=json.dumps(activity_data, cls=DjangoJSONEncoder),  # Line 172
    ...
)
```

### The Data Format Bug

**What is `request.data` in DRF?**

- `request.data` is a `QueryDict` (Django's multi-value dict)
- When serializer parses JSON input: `{duration_minutes: 60, logged_at: "2024-01-15"}`
- DRF deserializes based on serializer field types

**What happens with `dict(request.data)`?**

- Converts QueryDict to regular Python dict
- Preserves the VALUES as they came in the HTTP request (strings)
- Does NOT apply serializer validation/coercion

**JSON Serialization**:

```python
activity_data = {"duration_minutes": 60, "logged_at": "2024-01-15", "reason": "..."}
json.dumps(activity_data, cls=DjangoJSONEncoder)
# Output: '{"duration_minutes": 60, "logged_at": "2024-01-15", "reason": "..."}'
```

**Deserialization in Task**:

```python
requested = json.loads(requested_data)  # Line 1567
# Result: {"duration_minutes": 60, "logged_at": "2024-01-15", "reason": "..."}
# Types are native Python: int 60, str "2024-01-15"
```

**In Handler Comparison** (line 1572):

```python
current.get("duration_minutes")  # comes from IssueWorkLogSerializer
# Type: int (60) - CORRECTLY TYPED

requested.get("duration_minutes")  # comes from dict(request.data) -> json.dumps
# Type: int (60) if JSON integer, or str "60" if request sent string

# Comparison: 60 != "60" → Always detects "change" even when unchanged
```

---

## 3. Comparison: Correct vs Buggy Pattern

### CORRECT Pattern (timesheet_bulk.py)

```python
issue_activity.delay(
    type="worklog.activity.updated",
    requested_data=json.dumps(
        {"duration_minutes": duration_minutes},  # Explicit typed dict
        cls=DjangoJSONEncoder,
    ),
    ...
)
```

- Creates clean dict with explicit types
- Only includes changed fields
- Task handler receives correctly typed values

### BUGGY Pattern (worklog.py line 168)

```python
activity_data = dict(request.data)  # Raw dict from request
activity_data["reason"] = reason
issue_activity.delay(
    type="worklog.activity.updated",
    requested_data=json.dumps(activity_data, cls=DjangoJSONEncoder),
    ...
)
```

- Includes all request fields
- Preserves request format (potential string types)
- Task handler receives potentially mistyped values
- No serializer validation applied

---

## 4. Error Handling Issues

### Silent Error Swallowing

**Location**: Lines 1708-1710

```python
except Exception as e:
    log_exception(e)
    return  # Silent failure - returns None to Celery
```

**Consequences**:

1. Task marked as completed successfully by Celery
2. IssueActivity records may be partially created (some but not all)
3. Errors logged to `plane.exception` logger but not visible in Celery UI
4. No alerting or retry mechanism triggered
5. Frontend assumes activity was saved

**Logger Details** (exception_logger.py):

- Logs to `logging.getLogger("plane.exception")`
- Configured in settings.py LOGGING config
- Level depends on deployment (DEBUG shows traceback, production shows exception)

### Nested Try-Except

**Location**: Lines 1638-1642

```python
try:
    issue.updated_at = timezone.now()
    issue.save(update_fields=["updated_at"])
except Exception:
    pass  # Silent pass - no logging
```

Also swallows errors without logging.

---

## 5. Parameter Matching Verification

### `worklog_activity_updated` Signature (line 1564)

```python
def worklog_activity_updated(
    requested_data, current_instance, issue_id, project_id,
    workspace_id, actor_id, issue_activities, epoch
):
```

### Call Site (lines 1678-1687)

```python
func(
    requested_data=requested_data,
    current_instance=current_instance,
    issue_id=issue_id,
    project_id=project_id,
    workspace_id=workspace_id,
    actor_id=actor_id,
    issue_activities=issue_activities,
    epoch=epoch,
)
```

✅ **All parameters match** - no mismatch in parameter names or order

---

## 6. Data Flow Detailed Trace

### Worklog Create (lines 89-127)

```
1. IssueWorkLogSerializer validates & converts request.data
2. serializer.save() creates model instance
3. serializer.data returns ✅ correctly typed dict
4. json.dumps(serializer.data, cls=DjangoJSONEncoder) → clean JSON string
5. ✅ Task handler receives: {"duration_minutes": 60, "logged_at": "2024-01-15"} (typed)
```

### Worklog Update (lines 130-182) - BUGGY

```
1. IssueWorkLogSerializer validates request.data (✅ correct validation)
2. serializer.save() updates model (✅ correct data)
3. activity_data = dict(request.data) ❌ RAW REQUEST DICT
4. activity_data["reason"] = reason (✅ add field)
5. json.dumps(activity_data, cls=DjangoJSONEncoder) → JSON string
6. ❌ Task handler may receive: {"duration_minutes": "60"} (string not int)
   ❌ Comparison with current fails: "60" != 60
```

### Worklog Delete (lines 184-221)

```
1. current_instance = json.dumps(IssueWorkLogSerializer(worklog).data, ...) ✅
2. requested_data = json.dumps({"worklog_id": str(pk), "reason": reason}) ✅
3. ✅ Clean dict with explicit types
4. ✅ Task handler receives correct types
```

---

## 7. Specific Issues Found

### Issue #1: Type Mismatch in `partial_update`

**Severity**: HIGH
**Location**: worklog.py line 168
**Description**: `dict(request.data)` preserves request format instead of serializer types
**Impact**: Worklog updates create IssueActivity with wrong change detection
**Root Cause**: Not using serializer.data for activity_data

### Issue #2: Silent Error Swallowing

**Severity**: MEDIUM
**Location**: issue_activities_task.py lines 1708-1710
**Description**: Broad except catching all exceptions without re-raising
**Impact**: Failed activities silently marked as success
**Root Cause**: Defensive programming without proper error propagation

### Issue #3: Nested Silent Exception

**Severity**: LOW
**Location**: issue_activities_task.py lines 1638-1642
**Description**: Inner try-except with bare pass
**Impact**: Issue.updated_at may not update, but no visibility
**Root Cause**: Missing error logging in nested handler

---

## 8. QueryDict Behavior

When `request.data` is a QueryDict:

```python
QueryDict: {
    'duration_minutes': '60',  # String from HTTP body
    'logged_at': '2024-01-15',  # String from HTTP body
}

dict(request.data) produces:
{
    'duration_minutes': '60',  # Still string
    'logged_at': '2024-01-15',  # Still string
}
```

The `DjangoJSONEncoder` does NOT convert these - it just encodes them as-is:

```python
json.dumps({'duration_minutes': '60'}, cls=DjangoJSONEncoder)
# → '{"duration_minutes": "60"}'  (note: string in JSON)

# When deserialized:
json.loads('{"duration_minutes": "60"}')
# → {'duration_minutes': '60'}  (string type, not int)
```

Compare with serializer.data:

```python
IssueWorkLogSerializer(worklog).data produces:
{
    'duration_minutes': 60,  # Int from model field
    'logged_at': '2024-01-15',  # String date (correct format)
}

json.dumps({'duration_minutes': 60}, cls=DjangoJSONEncoder)
# → '{"duration_minutes": 60}'  (note: number in JSON, no quotes)
```

---

## 9. Actual Impact

### What Fails

1. Worklog partial_update creates IssueActivity but with incorrect `old_value`
2. If request sends string "60" but model field is int 60:
   - Comparison: `"60" != 60` → Always True
   - Creates activity entry: "changes detected" even if no actual change
   - User sees false change history

### What Works (Silent Success)

- Database update succeeds (serializer validation passed)
- IssueActivity is created (in try block before comparison)
- Celery task completes (catches Exception and returns)
- No error logs visible in Celery monitoring

### User Experience

- Edit worklog
- Activity says "duration changed" even if same value sent
- No error shown
- Activity created but with wrong data

---

## 10. Comparison with Similar Code

### IssueWorkLogViewSet.create() - CORRECT (lines 115-125)

```python
issue_activity.delay(
    type="worklog.activity.created",
    requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),  # ✅ serializer.data
    ...
)
```

### IssueWorkLogViewSet.destroy() - CORRECT (lines 210-220)

```python
issue_activity.delay(
    type="worklog.activity.deleted",
    requested_data=json.dumps({"worklog_id": str(pk), "reason": reason}),  # ✅ clean dict
    ...
)
```

### IssueWorkLogViewSet.partial_update() - BUGGY (line 168-172)

```python
activity_data = dict(request.data)  # ❌ raw request dict
issue_activity.delay(
    type="worklog.activity.updated",
    requested_data=json.dumps(activity_data, cls=DjangoJSONEncoder),  # ❌ untyped
    ...
)
```

---

## Unresolved Questions

1. **Are there actual runtime errors in production logs?** Requires checking `plane.exception` logger for "worklog.activity.updated" failures
2. **How often do users edit worklogs with same values?** Determines impact frequency
3. **What's the actual format of request.data when sent?** Depends on frontend - if it sends typed JSON vs form-encoded data
4. **Are there integration tests for worklog activity creation?** Would catch this type mismatch

---

## Recommendations for Investigation

1. Search Celery task logs/error queue for "worklog.activity.updated" failures
2. Check if IssueActivity records exist for worklog updates (may be partial)
3. Review frontend code - how does it send duration_minutes? (string vs number)
4. Check test coverage for worklog partial_update activity creation
5. Look for similar dict(request.data) patterns in other views (found unique occurrence)

---

**Files Analyzed**:

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/bgtasks/issue_activities_task.py` (lines 1564-1710)
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/issue/worklog.py` (lines 130-182)
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/serializers/worklog.py` (IssueWorkLogSerializer)
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/exception_logger.py` (error handling)
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/workspace/time_tracking/timesheet_bulk.py` (correct pattern reference)
