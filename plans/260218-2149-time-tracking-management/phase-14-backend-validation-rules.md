# Phase 5: Backend Validation Rules

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1 — Backend permissions](./phase-01-backend-verify-permissions.md) (dependency: completed)
- Serializer: `apps/api/plane/app/serializers/worklog.py`
- Issue worklog view: `apps/api/plane/app/views/issue/worklog.py`
- Model: `apps/api/plane/db/models/worklog.py`

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 45m
- **Description**: Add 3 validation rules to worklog create/update: max 12h/day per user, no future dates, 7-working-day backdate limit.

## Key Insights

- Current serializer allows dates up to 7 days in the **future** (`MAX_FUTURE_DAYS = 7`). Must change to **no future dates**.
- Current `MAX_DURATION_MINUTES = 1440` (24h per entry). **Change to 720** (12h). Single entry max = daily max.
<!-- Updated: Validation Session 9 - Resolved contradiction: MAX_DURATION_MINUTES = 720, not 1440 -->
- Working days = exclude Saturday (5) and Sunday (6). No holiday calendar needed (KISS).
- Aggregate daily check needs `request.user` context — must pass via serializer context or validate in view.
- `TimesheetBulkEntrySerializer` also has `validate_logged_at` — must update both.

## Requirements

- **R1**: Single worklog entry: max 720min (12h). Aggregate: sum of all user worklogs on same date ≤ 720min.
- **R2**: `logged_at` must be ≤ today (no future dates).
- **R3**: `logged_at` must be ≥ 7 working days ago (Mon-Fri only, skip weekends when counting backwards).
- **R4**: On update, aggregate check must exclude current worklog's existing duration.
- **R5**: On update, `validate_duration_minutes` enforces ≤720min even for legacy worklogs >720min. No grandfathering — user must reduce duration to save.
<!-- Updated: Validation Session 7 - Reject legacy >720min worklogs on update, force fix -->

## Architecture

```
Request → Serializer.validate_logged_at() → no future + backdate check
        → View.create/partial_update() → aggregate 720min/day check (needs DB query)
```

Serializer handles date-range validation (stateless). View handles aggregate check (needs DB + user context).

## Related Code Files

- **Modify**: `apps/api/plane/app/serializers/worklog.py`
  - Remove `MAX_FUTURE_DAYS`, update `validate_logged_at` in both serializers
  - Add `get_min_backdate()` utility function
- **Modify**: `apps/api/plane/app/views/issue/worklog.py`
  - Add `_check_daily_limit()` helper
  - Call in `create()` and `partial_update()`

## Embedded Rules

```
- BaseViewSet / BaseAPIView inheritance
- @allow_permission decorator for role checks
- issue_activity.delay() after mutations
- current_instance capture BEFORE update
- Validation errors: return 400 with {"error": "message"}
- Use django.db.models.Sum for aggregate queries
```

## Implementation Steps

1. **Add `get_min_allowed_date()` utility in serializer file**

   ```python
   def get_min_allowed_date(working_days=7):
       """Calculate date that is N working days ago (Mon-Fri)."""
       current = date.today()
       days_counted = 0
       while days_counted < working_days:
           current -= timedelta(days=1)
           if current.weekday() < 5:  # Mon=0..Fri=4
               days_counted += 1
       return current
   ```

2. **Update `IssueWorkLogSerializer.validate_logged_at()`**
   - Remove the future-date allowance (`MAX_FUTURE_DAYS`)
   - Check `value > date.today()` → error "Cannot log time for future dates"
   - Check `value < get_min_allowed_date()` → error "Cannot log time more than 7 working days ago"

3. **Update `TimesheetBulkEntrySerializer.validate_logged_at()`**
   - Same logic as step 2

4. **Remove or update `MAX_FUTURE_DAYS` constant**
   - Remove `MAX_FUTURE_DAYS = 7` since no future dates allowed
   - Keep `MAX_DURATION_MINUTES = 1440` (per-entry cap) but also add `MAX_DAILY_MINUTES = 720`

5. **Add `_check_daily_limit()` in `IssueWorkLogViewSet`**

   ```python
   MAX_DAILY_MINUTES = 720

   def _check_daily_limit(self, user, logged_at, new_duration, exclude_pk=None):
       """Check sum of user's worklogs on date + new_duration ≤ 720min."""
       qs = IssueWorkLog.objects.filter(logged_by=user, logged_at=logged_at)
       if exclude_pk:
           qs = qs.exclude(pk=exclude_pk)
       existing_total = qs.aggregate(total=Sum("duration_minutes"))["total"] or 0
       if existing_total + new_duration > MAX_DAILY_MINUTES:
           remaining = MAX_DAILY_MINUTES - existing_total
           return False, remaining
       return True, None
   ```

6. **Update `create()` method**
   - After `serializer.is_valid()`, before `serializer.save()`:
   - Call `_check_daily_limit(request.user, serializer.validated_data["logged_at"], serializer.validated_data["duration_minutes"])`
   - If fails, return 400 with error message including remaining minutes

7. **Update `partial_update()` method**
   - After `serializer.is_valid()`, before `serializer.save()`:
   - Determine effective `logged_at` and `duration_minutes` (from validated_data or existing worklog)
   - Call `_check_daily_limit(...)` with `exclude_pk=pk`
   - If fails, return 400

8. **Update `MAX_DURATION_MINUTES` in serializer**
   - Change `MAX_DURATION_MINUTES = 720` (was 1440). Single entry max = daily max = 12h.
   <!-- Updated: Validation Session 9 - Clarified: 720 per entry, no ambiguity -->

## Post-Phase Checklist

- [ ] `MAX_FUTURE_DAYS` removed, no future dates allowed
- [ ] `MAX_DURATION_MINUTES` updated to 720
- [ ] `MAX_DAILY_MINUTES = 720` aggregate check in view
- [ ] `get_min_allowed_date()` correctly skips weekends
- [ ] Both serializers updated (IssueWorkLogSerializer + TimesheetBulkEntrySerializer)
- [ ] `create()` and `partial_update()` check daily limit
- [ ] Error messages are clear and include remaining capacity
- [ ] Files < 200 lines

## Todo List

- [ ] Add `get_min_allowed_date()` utility
- [ ] Update both serializer `validate_logged_at()` methods
- [ ] Update `MAX_DURATION_MINUTES` to 720
- [ ] Add `MAX_DAILY_MINUTES` constant
- [ ] Add `_check_daily_limit()` in view
- [ ] Update `create()` with daily limit check
- [ ] Update `partial_update()` with daily limit check (exclude current pk)
- [ ] Add daily limit check to bulk endpoint view (TimesheetBulkEntry)
- [ ] Run post-phase checklist
- [ ] Mark phase complete in plan.md

## Success Criteria

- Creating worklog for future date returns 400
- Creating worklog >7 working days ago returns 400
- Creating worklog that would exceed 720min/day returns 400 with remaining capacity
- Updating worklog correctly excludes own duration from aggregate check
- Weekend days not counted in 7-working-day calculation

## Risk Assessment

- **Timezone mismatch**: `date.today()` uses server timezone. Acceptable since Plane stores `logged_at` as date (no TZ). If user is in different TZ, edge case on "today" boundary. Mitigation: document as known limitation.
- **Bulk entries**: `TimesheetBulkEntrySerializer` validates per-entry but aggregate check is in view — bulk endpoint must also check aggregate.
<!-- Updated: Validation Session 2 - Confirmed: add daily limit check to bulk endpoint too -->

## Security Considerations

- All validation server-side; frontend validation is UX only
- Aggregate query scoped to `logged_by=request.user` — users can't affect others' limits

## Implementation Steps (Bulk Endpoint)

<!-- Updated: Validation Session 2 - Add bulk endpoint daily limit check -->

8. **Add daily limit check to bulk endpoint view**
   - Locate the bulk entry view that uses `TimesheetBulkEntrySerializer`
   - Before saving entries, loop through validated entries grouped by `logged_at` date
   - For each date: sum new entries' durations + existing worklogs for that user+date
   - If any date exceeds 720min, return 400 with error specifying which date(s) exceed

## Next Steps

- Phase 6 depends on this: permission enforcement uses same working-day calculation
- Phase 7 mirrors these rules in frontend UI
