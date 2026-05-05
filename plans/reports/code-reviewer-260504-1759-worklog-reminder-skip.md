# Code Review — worklog reminder holiday/working-day skip

**Scope:** `apps/api/plane/bgtasks/worklog_reminder_task.py` (decorator wiring) + `apps/api/plane/tests/unit/bg_tasks/test_worklog_reminder_task.py` (new, 3 unit tests).
**Out of scope:** `_send_reminders` internals, multi-schedule support, email infra.
**Tests:** 12/12 already pass — not re-run.

## Verification of stated invariants

- Decorator order: `@shared_task` outermost, `@working_day_required()` inner — matches the documented contract in `plane/utils/celery_helpers.py:30-35`. Correct: `functools.wraps` preserves `__name__`/signature so Celery still registers `worklog_daily_reminder`. Periodic-task entry in `apps/api/plane/celery.py:81` and migration `0165_register_worklog_reminder_periodic_task.py:23` both reference the dotted task path — no rename, registration unaffected.
- Fail-open path: any `Exception` from `BusinessCalendarService.is_working_day` is logged via `logger.exception` and the task body still runs — preserves prior behaviour on calendar-service outages. Confirmed by `test_fail_open_runs_on_calendar_error`.
- Test isolation: patches `plane.utils.celery_helpers.timezone`, `BusinessCalendarService.is_working_day`, and `_send_reminders` — no DB, no email, no network. Properly imports the task inside `with` blocks so module-level decorator is exercised against the patched symbols.
- Schedule resolver: intentionally `None` (default schedule). Acceptable for a single-tenant VN deployment; flagged as future work, not a defect.
- Conventions: file path `plane/tests/unit/bg_tasks/test_worklog_reminder_task.py` matches existing layout (sibling `test_copy_s3_objects.py`); `@pytest.mark.unit` present per `backend-testing.md`; both files <200 LOC; AGPL header preserved.
- Decorator-internals coverage already lives in `plane/tests/unit/utils/test_celery_helpers.py::TestWorkingDayRequired` — this new file rightly only asserts integration (no duplication, DRY respected).

## Issues by severity

**CRITICAL:** none.
**HIGH:** none.
**MEDIUM:** none.

**LOW**

- L1. `worklog_reminder_task.py:51` — `_send_reminders` calls `date.today()` directly (server clock, naive UTC), while the decorator's "today" uses `Asia/Ho_Chi_Minh`. If Celery runs the task at e.g. 23:30 UTC on a VN holiday-eve, the decorator sees the next VN day (a non-working day → skip), but had it run, `_send_reminders` would have used the previous UTC date. Not a regression introduced by this change (pre-existing), but worth noting because the decorator now amplifies the timezone gap. Out of scope per the brief; flag for the multi-schedule follow-up.

**NIT**

- N1. Test fixture date `datetime(2025, 4, 26, 10, 0, tzinfo=dt_timezone.utc)` is real-world a Saturday, and `2025, 4, 28` is a Monday — nice touch (matches the mocked return value), but since `is_working_day` is mocked the calendar values are irrelevant. A short comment "(date irrelevant; calendar mocked)" would prevent future readers from over-trusting the literal. Optional.
- N2. The three tests duplicate the `with patch(...)` block setup. A small `_patches()` helper or a `@pytest.fixture` would tighten DRY, but at 3 cases the savings are marginal — leave as-is.
- N3. `from plane.bgtasks.worklog_reminder_task import worklog_daily_reminder` is repeated inside each test. Module-level import works fine here (nothing imports Django settings lazily inside the task module that would break collection); could hoist for clarity, but the current placement is defensive and fine.

## Behavioural checklist

- Concurrency: decorator is stateless — no shared mutable state. `BusinessCalendarService` uses class-method caching via `get_or_build_year_data`; concurrent Beat schedules are not an issue (single periodic task). Pass.
- Error boundaries: decorator catches broad `Exception` only at the `is_working_day` call site (correct — fail-open is intentional and scoped). Inner `_send_reminders` retains its own try/except + `raise` so Celery retry semantics are preserved. Pass.
- API contract: `worklog_daily_reminder()` still returns `None` on both skip and success — consistent with prior behaviour; Celery callers (Beat) ignore the return value. Pass.
- Backwards compat: task name unchanged; signature unchanged (no args); periodic-task DB row untouched. Pass.
- Input validation: no external input (no args); `today` derived from server clock + tz. Pass.
- Auth/authz: N/A (background task).
- N+1 / queries: change adds zero queries on skip path; on run path the existing `_send_reminders` query plan is unchanged. Pass.
- Data leaks: log lines emit task name + date only; no PII. Pass.

## Positive observations

- Decorator order placement matches the docstring contract exactly — visible discipline.
- Fail-open semantics are explicit and tested (`test_fail_open_runs_on_calendar_error`) — this is the correct policy for reminder tasks (under-notify is worse than over-notify on infra glitch).
- New test file mirrors existing `bg_tasks/` test layout; AGPL header carried over; module docstring points readers to the dedicated decorator-internals suite — good cross-referencing.
- Patches `plane.utils.celery_helpers.timezone` (where the symbol is *used*), not `django.utils.timezone` — correct mocking target.
- Decorator-internals already live in `tests/unit/utils/test_celery_helpers.py`; this file only adds the integration smoke tests — no duplication.

## Unresolved questions

- Should `_send_reminders` consume the VN-localized `today` from the decorator (passed as a kwarg) instead of calling `date.today()`? Tracked in plan unresolved questions but reiterating because the gap widens once the decorator becomes the source of truth for "what day is it".
- Half-day holidays: `is_working_day` returns `True` for `WORKDAY` overrides, so afternoon-only or morning-only holidays will still trigger reminders. Plan flags this as out of scope; confirm before VN Tet season.

**Status:** DONE
**Score:** 9/10
**Critical issues:** 0
