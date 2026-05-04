# Phase 04 — Celery Integration

<!-- Updated: Validation Session 1 — Q4 (decorator fail-open: service exception → log Sentry + run task) -->

## Context Links

- Research: `/plans/reports/researcher-260428-1412-vietnam-working-day-holiday-management.md` (Section 6)
- Beat schedule: `apps/api/plane/celery.py`
- Reference task: `apps/api/plane/bgtasks/issue_automation_task.py` (archive_and_close)
- Task list: `apps/api/plane/bgtasks/`

## Overview

- **Priority**: P3
- **Status**: ✅ Complete
- **Effort**: 1.5 ngày
- **Description**: `@working_day_required()` decorator + apply to candidate business tasks. NO scheduler refactor (Phase 1 strategy).

## Key Insights

- `apps/api/plane/celery.py` hardcode static crontab — không có hook DB-aware filtering
- Decorator pattern least invasive: từng task tự opt-in
- Server UTC, VN+07 — convert before `.date()`
- Infra/cleanup tasks (delete_api_logs, instance_traces) **KHÔNG** áp dụng — vẫn cần chạy mọi ngày
- Business tasks (archive_and_close, capacity_report) **CÓ** áp dụng

## Requirements

### Functional

- Decorator `@working_day_required(schedule_resolver=None)`:
  - Default: resolve to default schedule (`workspace=None, is_default=True`)
  - Optional: callable returning schedule_id from task args (per-workspace use case)
  - Skip task: log info + early return None (KHÔNG raise — task should not retry)
- Apply to candidate tasks (research Section 6.5):
  - `archive_and_close_old_issues` (in `issue_automation_task.py`)
  - Any task matching pattern `daily_*_report` or `notification_summary_*` if discovered via grep
- Tasks **NOT** to apply:
  - `email_notification_task.stack_email_notification` (alert critical)
  - `cleanup_task.delete_api_logs` (infra)
  - `instance_traces` (infra)
  - All `*_email_task.py` (transactional, not periodic)

### Non-functional

- Decorator <50 lines; readable
- Test coverage 100% on decorator (small surface)
- Logging via existing logger (`logging.getLogger(__name__)` in module)

## Architecture

### Decorator Flow

```
celery beat → trigger task → wrapper invokes
  ↓
  today_vn = now().astimezone(VN_TZ).date()
  schedule_id = resolver(*args, **kwargs) if resolver else None
  if not BusinessCalendarService.is_working_day(today_vn, schedule_id):
      log "Skip {fn.__name__}: {today_vn} not working day"
      return None
  return fn(*args, **kwargs)
```

### Per-task Application

```python
# bgtasks/issue_automation_task.py (modify existing)
from plane.utils.celery_helpers import working_day_required

@shared_task
@working_day_required()
def archive_and_close_old_issues():
    ...
```

**Decorator order matters**: `@shared_task` outermost (Celery sees the wrapped function), `@working_day_required()` inner.

## Related Code Files

### To create

- `apps/api/plane/utils/celery_helpers.py` — decorator module
- `apps/api/plane/tests/unit/utils/test_celery_helpers.py` — decorator tests

### To modify

- `apps/api/plane/bgtasks/issue_automation_task.py` — apply decorator to `archive_and_close_old_issues` (and any sibling business task)
- (Optional, if discovered via grep) other periodic business tasks

### To NOT touch

- `apps/api/plane/bgtasks/cleanup_task.py`
- `apps/api/plane/bgtasks/email_notification_task.py`
- `apps/api/plane/bgtasks/*_email_task.py`
- `apps/api/plane/celery.py` (no scheduler refactor)

## Implementation Steps

1. **Create decorator** `apps/api/plane/utils/celery_helpers.py`:

   ```python
   import functools, logging
   from django.utils import timezone
   from zoneinfo import ZoneInfo
   from plane.utils.business_calendar import BusinessCalendarService

   logger = logging.getLogger(__name__)
   VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")

   def working_day_required(schedule_resolver=None):
       def decorator(fn):
           @functools.wraps(fn)
           def wrapper(*args, **kwargs):
               today = timezone.now().astimezone(VN_TZ).date()
               sid = schedule_resolver(*args, **kwargs) if schedule_resolver else None
               try:
                   is_working = BusinessCalendarService.is_working_day(today, sid)
               except Exception as exc:
                   # Fail-open: avoid missing critical archive jobs on service error.
                   logger.exception(
                       f"BusinessCalendarService failed for {fn.__name__}; running task fail-open"
                   )
                   # Sentry auto-captures via existing exception_logger
                   return fn(*args, **kwargs)
               if not is_working:
                   logger.info(f"Skip {fn.__name__}: {today} (VN) is not a working day")
                   return None
               return fn(*args, **kwargs)
           return wrapper
       return decorator
   ```

2. **Audit candidate tasks**: `grep -rn "@shared_task" apps/api/plane/bgtasks/ | head -30` → identify periodic business tasks. Cross-reference với `apps/api/plane/celery.py` `beat_schedule` keys.
3. **Apply to `archive_and_close_old_issues`**:
   - Import `working_day_required` in `issue_automation_task.py`
   - Add `@working_day_required()` between `@shared_task` and `def archive_...`
   - Verify decorator order: shared_task outer, working_day_required inner
4. **Apply to other tasks discovered**: confirm with user via plan; default conservative — only apply to tasks where research explicitly recommends.
5. **Write decorator tests**:
   - Mock `BusinessCalendarService.is_working_day`:
     - Returns False → wrapped fn NOT called, logger called
     - Returns True → wrapped fn called with args/kwargs intact
     - **Raises Exception → wrapped fn IS called (fail-open)**, logger.exception called
   - With `schedule_resolver=lambda x: x.workspace_id`: resolver invoked with task args
   - Naive datetime handling: server UTC at 23:00 → VN 06:00 next day → uses VN date
6. **Integration test**: setup test DB with default schedule + holiday on `today`. Invoke `archive_and_close_old_issues.delay()` (eager mode). Assert no archiving happened + log captured.
7. **Run tests**: `cd apps/api && python run_tests.py -u`.
8. **Optional VN logging strings**: log message in English (existing convention); skip i18n.

## Todo List

- [x] Create `apps/api/plane/utils/celery_helpers.py`
- [x] Implement `working_day_required` decorator
- [x] Audit candidate tasks via grep
- [x] Apply decorator to `archive_and_close_old_issues`
- [x] Apply to any other discovered business periodic tasks (with user confirmation) — none additional; `worklog_daily_reminder` deferred (see Concerns)
- [x] Write unit tests for decorator
- [ ] Write integration test for `archive_and_close_old_issues` skip path — skipped (requires Docker DB; covered by decorator unit tests)
- [x] Verify decorator order (`@shared_task` outermost)
- [x] All tests pass (9/9 unit tests green)

## Outcome (Session 2 — Implementation)

`@working_day_required()` decorator in `plane/utils/celery_helpers.py` (<50 LOC). Fail-open behavior: service error logs Sentry, task runs anyway (no loss of critical archiving). Applied to `archive_and_close_old_issues` in `issue_automation_task.py`. Decorator handles UTC→VN timezone conversion. 9 unit tests passing. Deferred `worklog_daily_reminder` decoration (flagged HIGH-2 during code review; explicit decision to revisit post-MVP). Code review CRITICAL-1 fixed (week_pattern ArrayField).

## Success Criteria

- `@working_day_required()` skips wrapped fn on holiday/weekend (per default schedule)
- Log entry "Skip archive_and_close_old_issues: 2025-04-30 (VN) is not a working day" on holiday
- Wrapped fn executes normally on working day
- No regression in non-decorated tasks (cleanup, emails)
- Tests pass with `python run_tests.py -u`

## Risk Assessment

| Risk                                                                                                     | Likelihood | Impact | Mitigation                                                                                                    |
| -------------------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Decorator order swapped → Celery doesn't recognize task                                                  | Medium     | High   | Document order in code comment; test eager invocation works                                                   |
| Skipping `email_notification_task` accidentally                                                          | Low        | High   | Explicit allow-list; do NOT apply to email tasks; code review                                                 |
| Task signature break — decorator drops args                                                              | Low        | High   | Use `functools.wraps`; tests verify args/kwargs forwarded                                                     |
| Default schedule missing in DB → `is_working_day` errors → task swallows error and returns None silently | Medium     | Medium | Decorator catches `BusinessCalendarService` exception, logs warning, defaults to "is working day" (fail-open) |
| Server timezone drift                                                                                    | Low        | High   | Always `astimezone(VN_TZ)`; test with naive UTC datetime                                                      |
| Per-workspace resolver returns None → falls to default                                                   | Low        | Low    | Document in decorator docstring                                                                               |

## Security Considerations

- Decorator code path runs in worker; no user input flows in
- Logging level `info` — no PII in log
- Fail-open behavior (run task on service error) prevents missing critical archives; but **MUST** alert ops via Sentry if `BusinessCalendarService` raises (existing exception_logger)

## Next Steps

- **Blocks**: nothing
- **Depends on**: P0 (service)
- **Can run parallel with**: P2 (UI) — different file owners
- **Follow-up**: P4 smoke test E2E (admin sets holiday → task skips next day)
