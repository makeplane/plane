# Phase 1: Backend Reason Validation

## Context Links

- View: `apps/api/plane/app/views/issue/worklog.py`
- Serializer: `apps/api/plane/app/serializers/worklog.py`
- Activity task: `apps/api/plane/bgtasks/issue_activities_task.py`

## Overview

- **Priority**: P1
- **Status**: complete
- **Description**: Validate mandatory `reason` field on PATCH (edit) and DELETE requests. Include reason in `requested_data` JSON passed to `issue_activity.delay()`.

## Key Insights

- `partial_update` (line 119-165) receives `request.data` — reason can be sent alongside worklog fields
- `destroy` (line 167-199) currently reads no body — need to parse `request.data` for reason
- `issue_activity.delay()` already receives `requested_data` as JSON string — adding reason to this JSON is zero-cost
- `APIService.delete()` on frontend already supports sending a request body via `data` param
- The `ACTIVITY_MAPPER` in `issue_activities_task.py` has no `worklog.activity.*` entries — the task currently no-ops for worklog types. This is fine; we only need the reason in the `requested_data` JSON

## Requirements

### Functional

- PATCH must include `reason` (non-empty string) or return 400
- DELETE must include `reason` (non-empty string) or return 400
- Reason must appear in `requested_data` JSON sent to `issue_activity.delay()`

### Non-functional

- No model migration
- Backward compatible for frontend (fails gracefully with clear error)

## Architecture

No new models. Reason flows through existing `requested_data` parameter:

```
request.data["reason"] → validate → include in requested_data JSON → issue_activity.delay()
```

## Related Code Files

### Modify

- `apps/api/plane/app/views/issue/worklog.py` — `partial_update`, `destroy`

### No changes needed

- `apps/api/plane/app/serializers/worklog.py` — reason is NOT a model field; validated in view
- `apps/api/plane/bgtasks/issue_activities_task.py` — no mapper entry needed

## Implementation Steps

### 1. Add reason validation helper to `IssueWorkLogViewSet`

In `apps/api/plane/app/views/issue/worklog.py`, add a private method:

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

### 2. Update `partial_update` method

At the start of `partial_update` (after edit window check, before serializer validation):

```python
reason, error_response = self._validate_reason(request)
if error_response:
    return error_response
```

Then include reason in the `requested_data` JSON for `issue_activity.delay()`:

```python
activity_data = dict(request.data)
activity_data["reason"] = reason
issue_activity.delay(
    type="worklog.activity.updated",
    requested_data=json.dumps(activity_data, cls=DjangoJSONEncoder),
    ...
)
```

### 3. Update `destroy` method

At the start of `destroy` (after edit window check):

```python
reason, error_response = self._validate_reason(request)
if error_response:
    return error_response
```

Then include reason in `requested_data`:

```python
issue_activity.delay(
    type="worklog.activity.deleted",
    requested_data=json.dumps({"worklog_id": str(pk), "reason": reason}),
    ...
)
```

## Todo List

- [x] Add `_validate_reason` method to `IssueWorkLogViewSet`
- [x] Update `partial_update` to validate and pass reason
- [x] Update `destroy` to validate and pass reason
- [x] Test PATCH without reason → 400
- [x] Test DELETE without reason → 400
- [x] Test PATCH with reason → 200, reason in activity data
- [x] Test DELETE with reason → 204, reason in activity data

## Success Criteria

- PATCH/DELETE without `reason` return HTTP 400 with clear error message
- PATCH/DELETE with valid `reason` succeed normally
- `issue_activity.delay()` receives reason in `requested_data` JSON

## Risk Assessment

- **Breaking change**: Frontend must send reason or requests fail. Phases 2/3 must ship together or behind feature flag
- **Mitigation**: Deploy backend + frontend together in same release

## Security Considerations

- Reason is user input — strip whitespace, no HTML rendering needed (plain text)
- Already behind ADMIN role permission check

## Next Steps

- Phase 2: Add reason field to edit modal
- Phase 3: Add delete confirmation dialog with reason
