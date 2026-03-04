# Phase 2: Backend API Cleanup

## Context Links

- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-database-migration.md](./phase-01-database-migration.md)

## Overview

- **Priority**: P1
- **Status**: pending
- **Description**: Remove `estimate_time` from serializers, views, background tasks, and utility code

## Key Insights

- Serializer includes `estimate_time` in Issue fields list
- Activity tracker has dedicated `track_estimate_time` function + mapper entry
- Time tracking views annotate `estimate_time` from Issue onto worklog queries
- Capacity report aggregates `estimate_time` for workload calculations

## Requirements

### Functional

- Remove `estimate_time` from all serializers
- Remove activity tracking for `estimate_time` changes
- Remove `estimate_time` annotations from time tracking views
- Remove `estimate_time` usage from capacity report

### Non-functional

- API responses should no longer include `estimate_time` field
- No breaking changes to other fields in the same endpoints

## Architecture

Straightforward removal from serializers + views. No new patterns needed.

## Related Code Files

### Files to Modify

| File                                                  | Change                                                                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/plane/app/serializers/issue.py`             | Remove `"estimate_time"` from fields list (line 802)                                                                          |
| `apps/api/plane/bgtasks/issue_activities_task.py`     | Remove `track_estimate_time` function (lines 595-630) and mapper entry `"estimate_time": track_estimate_time` (line 654)      |
| `apps/api/plane/app/views/workspace/time_tracking.py` | Remove `estimate_time=F("issue__estimate_time")` annotation (lines 62, 121) and remove from `.values()` calls (lines 65, 124) |
| `apps/api/plane/app/views/capacity.py`                | Remove `issue.estimate_time or 0` usage (line 110), adjust logic                                                              |
| `apps/api/plane/bgtasks/capacity_report.py`           | Remove `estimate_time__isnull=False` filter (line 81) and `total_estimated=Sum("estimate_time")` (line 85)                    |

## Embedded Rules

- Follow DRF serializer pattern: only list fields that exist on model
- ViewSet changes must not break other query annotations
- Background task changes: remove function + mapper entry together
- Run `python manage.py check` after changes to verify no model errors

## Implementation Steps

### Step 1: Serializer Cleanup

1. Open `apps/api/plane/app/serializers/issue.py`
2. Remove `"estimate_time"` from the `fields` list (line 802)
3. Check if any other serializer in same file references it

### Step 2: Activity Tracker Cleanup

1. Open `apps/api/plane/bgtasks/issue_activities_task.py`
2. Delete the entire `track_estimate_time` function (lines 594-630)
3. Remove `"estimate_time": track_estimate_time,` from `ISSUE_ACTIVITY_MAPPER` dict (line 654)

### Step 3: Time Tracking View Cleanup

1. Open `apps/api/plane/app/views/workspace/time_tracking.py`
2. Remove `estimate_time=F("issue__estimate_time"),` from both query annotations (lines 62, 121)
3. Remove `"estimate_time"` from both `.values()` calls (lines 65, 124)
4. API will stop returning `estimate_time` in time tracking summaries

### Step 4: Capacity View Cleanup

<!-- Updated: Validation Session 1 - Remove entirely, no replacement -->

1. Open `apps/api/plane/app/views/capacity.py`
2. Remove `issue_minutes = issue.estimate_time or 0` (line 110)
3. Remove all downstream logic referencing `issue_minutes` (no replacement with estimate_point)

### Step 5: Capacity Report Task Cleanup

<!-- Updated: Validation Session 1 - Remove aggregation entirely, no replacement -->

1. Open `apps/api/plane/bgtasks/capacity_report.py`
2. Remove `estimate_time__isnull=False` from filter (line 81)
3. Remove `total_estimated=Sum("estimate_time")` from annotate (line 85)
4. Remove all downstream logic referencing `total_estimated` (no replacement)

### Step 6: Remove/Update Backend Tests

<!-- Updated: Validation Session 3 - Check for tests referencing estimate_time -->

1. Search for test files referencing `estimate_time`:
   ```bash
   grep -r "estimate_time" apps/api/ --include="test_*.py" --include="*_test.py" -l
   ```
2. For each test file found: remove test cases that specifically test `estimate_time` behavior
3. Update any test fixtures or factories that set `estimate_time` on Issue objects

### Step 7: Verify

1. Run `python manage.py check` -- no errors
2. Run `python manage.py test` for affected modules

## Post-Phase Checklist

- [ ] `estimate_time` removed from all serializer field lists
- [ ] `track_estimate_time` function deleted
- [ ] Activity mapper entry removed
- [ ] Time tracking views no longer annotate/return `estimate_time`
- [ ] Capacity views updated
- [ ] `python manage.py check` passes
- [ ] No remaining `estimate_time` references in `apps/api/` (excluding migrations and test plans)
- [ ] Backend test files updated/removed for estimate_time test cases

## Todo List

- [ ] Clean serializer
- [ ] Clean activity tracker
- [ ] Clean time tracking views
- [ ] Clean capacity view
- [ ] Clean capacity report task
- [ ] Search and remove/update backend tests referencing estimate_time
- [ ] Run Django checks

## Success Criteria

- `grep -r "estimate_time" apps/api/plane/ --include="*.py"` returns only migration files
- API endpoints no longer include `estimate_time` in responses
- Django check passes

## Risk Assessment

- **Medium**: Time tracking report loses estimated time data in API response -- frontend must handle missing field gracefully
- **Medium**: Capacity report loses time-based estimation -- may need alternative logic

## Security Considerations

- No security impact

## Next Steps

- Proceed to Phase 3 (Frontend Types & Stores)
