# Phase 1 — Add `@working_day_required()` decorator + unit test

## Context Links

- Bug discovery via GitNexus MCP (session 2026-05-04 17:29)
- Decorator source: `apps/api/plane/utils/celery_helpers.py:23-61`
- Reference precedent: `apps/api/plane/bgtasks/issue_automation_task.py` (`archive_and_close_old_issues`)
- Existing decorator tests: `apps/api/plane/tests/unit/utils/test_celery_helpers.py::TestWorkingDayRequired`
- Backend rules: `.claude/rules/plane-backend-architecture.md` (Top 10 rule #8: `str(obj.id)` to Celery — N/A vì task không nhận args)

## Overview

- **Priority:** Medium (UX bug — không critical, nhưng spam mail vào ngày nghỉ)
- **Status:** IMPLEMENTED
- **Description:** Wrap `worklog_daily_reminder` với decorator `working_day_required()` để skip task khi today không phải working day theo VN business calendar.

## Key Insights

1. Decorator order CRITICAL: `@shared_task` outermost, `@working_day_required()` inner — comment trong celery_helpers.py:30-35 chỉ rõ.
2. Decorator dùng `timezone.now().astimezone(VN_TZ).date()` (Asia/Ho_Chi_Minh) → đúng cho cả container chạy UTC.
3. Fail-open: nếu `BusinessCalendarService` raise, task vẫn chạy → không regress hành vi cũ.
4. Task hiện tại không có incoming Python callers (chỉ Celery beat string-path) → impact LOW.

## Requirements

### Functional
- Khi `worklog_daily_reminder` chạy vào weekend/holiday VN → skip, không gửi mail, không tạo `Notification`.
- Khi chạy vào working day → behavior y hệt hiện tại.
- Log info-level message khi skip (decorator đã handle).

### Non-functional
- Backwards compat: schedule cron không đổi.
- No new dependencies, no migration.
- Test coverage: thêm 1 unit test verify decorator áp dụng đúng.

## Architecture

```
[Celery Beat] 10:00 UTC daily
    ↓ trigger
worklog_daily_reminder()
    ↓ @working_day_required() guard (NEW)
    ├─ working day  → continue → _send_reminders()
    └─ holiday/weekend → log "Skip", return None
```

Không thay đổi cấu trúc. Chỉ add 1 layer wrapper.

## Related Code Files

### Modify
- `apps/api/plane/bgtasks/worklog_reminder_task.py` (+2 lines: import + decorator)

### Create
- `apps/api/plane/tests/unit/bgtasks/test_worklog_reminder_task.py` (~30 lines, 1-2 test cases)

### Delete
- None

### Verify (no change but check)
- `apps/api/plane/celery.py:80-82` — schedule entry không đổi
- `apps/api/plane/bgtasks/__init__.py` — không cần re-register vì task name không đổi

## Implementation Steps

### Step 1 — Add decorator to task

File: `apps/api/plane/bgtasks/worklog_reminder_task.py`

```python
# Add import at top (after existing imports)
from plane.utils.celery_helpers import working_day_required

# Decorate existing task (line 25-26):
@shared_task
@working_day_required()  # ← NEW
def worklog_daily_reminder():
    """Send daily reminder to users who haven't logged time today.

    Skipped automatically on weekends and VN public holidays.
    """
    try:
        _send_reminders()
    except Exception as e:
        log_exception(e)
        raise
```

### Step 2 — Create unit test

File: `apps/api/plane/tests/unit/bgtasks/test_worklog_reminder_task.py`

```python
import pytest
from unittest.mock import patch
from datetime import date

pytestmark = pytest.mark.unit


class TestWorklogDailyReminder:
    @patch("plane.bgtasks.worklog_reminder_task._send_reminders")
    @patch("plane.utils.celery_helpers.BusinessCalendarService.is_working_day")
    def test_skips_on_non_working_day(self, mock_is_working, mock_send):
        from plane.bgtasks.worklog_reminder_task import worklog_daily_reminder
        mock_is_working.return_value = False
        result = worklog_daily_reminder()
        assert result is None
        mock_send.assert_not_called()

    @patch("plane.bgtasks.worklog_reminder_task._send_reminders")
    @patch("plane.utils.celery_helpers.BusinessCalendarService.is_working_day")
    def test_runs_on_working_day(self, mock_is_working, mock_send):
        from plane.bgtasks.worklog_reminder_task import worklog_daily_reminder
        mock_is_working.return_value = True
        worklog_daily_reminder()
        mock_send.assert_called_once()
```

### Step 3 — Run tests

```bash
cd apps/api && python run_tests.py -u -v -k "TestWorklogDailyReminder or TestWorkingDayRequired"
```

### Step 4 — Manual smoke (optional)

Trên dev env:
1. Set system date = Saturday → start celery beat → confirm task skips, log shows "Skip worklog_daily_reminder"
2. Reset → run với HOLIDAY trong DB → confirm skip
3. Working day → confirm gửi mail

### Step 5 — Commit

```bash
git checkout -b duonglx/fix/worklog-reminder-skip-holiday
git add apps/api/plane/bgtasks/worklog_reminder_task.py \
        apps/api/plane/tests/unit/bgtasks/test_worklog_reminder_task.py
git commit -m "fix(worklog): skip daily reminder on weekends and VN holidays

Wraps worklog_daily_reminder with @working_day_required() decorator,
matching the pattern already used by archive_and_close_old_issues.

Decorator uses BusinessCalendarService.is_working_day with VN timezone
and fail-open policy to avoid silently missing critical days."
```

### Step 6 — PR to develop

Per git safety rules: branch → develop (squash merge, 1 review).

## Todo List

- [ ] Confirm 3 unresolved questions với SHB (xem plan.md)
- [x] Step 1: add import + decorator to `worklog_reminder_task.py`
- [x] Step 2: create test file `test_worklog_reminder_task.py`
- [x] Step 3: run unit tests, all green
- [ ] Step 4: optional smoke test trên dev env (recommended cho confidence)
- [x] Step 5: commit theo conventional format
- [ ] Step 6: open PR `duonglx/fix/...` → `develop`, request 1 review
- [ ] Post-merge: monitor production logs để confirm skip behavior 1 tuần đầu

## Success Criteria

- ✅ All existing tests pass (regression check)
- ✅ 2 new tests pass (skip + run scenarios)
- ✅ Coverage cho task không giảm
- ✅ Production: ngày nghỉ kế tiếp (vd thứ 7) → log thấy "Skip worklog_daily_reminder", không có mail nào gửi đi (verify qua mail provider dashboard hoặc inbox của test user)

## Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| BusinessCalendarService throw exception | Low | Decorator fail-open → task vẫn chạy như cũ |
| Schedule_id misconfigured | Low | None passed → falls back default |
| Wrong VN timezone offset | Very low | Decorator hard-codes `Asia/Ho_Chi_Minh` |
| Half-day holiday skips legitimate reminders | Medium | Đã list ở unresolved Qs — nếu xảy ra, switch sang inline check với half-day-aware logic |

## Security Considerations

None — task chạy server-side via Celery worker, không expose endpoint mới, không thay đổi auth.

## Implementation Summary

**Completed 2026-05-04 17:59**

- **Code changes:** Added `@working_day_required()` decorator to `worklog_daily_reminder` task (import + 1-line decoration)
- **Test coverage:** Created `apps/api/plane/tests/unit/bgtasks/test_worklog_reminder_task.py` with 3 test scenarios (skip on non-working day, run on working day, fail-open on error)
- **Test results:** 12/12 passed (3 new + 9 regression on `TestWorkingDayRequired`); runtime ~0.95s
- **Code review:** Passed with 9/10, 0 critical issues
- **Impact analysis:** GitNexus confirms LOW upstream callers (0), LOW process impact (0 affected flows)
- **Test report:** `plans/reports/tester-260504-1759-worklog-reminder-skip.md`
- **Review report:** `plans/reports/code-reviewer-260504-1759-worklog-reminder-skip.md`

---

## Next Steps

- After merge: cập nhật `docs/project-changelog.md` (per docs-management.md rule)
- If multi-schedule confirmed: refactor để pass `schedule_resolver` (workspace-aware) — separate plan
- Consider extending `working_day_required` cho các bgtasks khác có pattern tương tự (audit cypher query: tasks chạy daily/cron mà không skip holiday)
