# Worklog Reminder — Skip on Non-Working Days

**Date:** 2026-05-04 17:44
**Branch:** `duonglx/fix/worklog-reminder-skip-holiday`
**Issue:** Daily 5pm worklog reminder gửi mail vào weekend & ngày lễ VN — gây noise, không đúng business intent.
**Discovered via:** GitNexus MCP (cypher + context queries)

---

## Phases

| # | Phase | Status | File |
|---|---|---|---|
| 1 | Add decorator + unit test | IMPLEMENTED | [phase-01-add-decorator-and-test.md](./phase-01-add-decorator-and-test.md) |

Single-phase plan — fix là 2 dòng code + 1 unit test, đã có decorator chuẩn (`working_day_required`) và precedent (`archive_and_close_old_issues`).

---

## Key Decisions

1. **Reuse existing decorator** thay vì viết logic check inline → DRY, consistent với `issue_automation_task.py`
2. **Default schedule** (no `schedule_resolver`) — assume SHB dùng 1 lịch chung. Nếu sai, refactor sau.
3. **Skip cả in-app notification + email** — cùng task, decorator skip toàn bộ. User opt-out qua `UserNotificationPreference.worklog_reminder`.

---

## Dependencies

- ✅ `working_day_required()` decorator: `apps/api/plane/utils/celery_helpers.py:23`
- ✅ `BusinessCalendarService.is_working_day()` — verified working
- ✅ Holiday model + admin endpoints (commit `abb188d8`)
- ✅ Test fixture `TestWorkingDayRequired` ở `test_celery_helpers.py`

Không có dependency mới, không có migration.

---

## Risk

**LOW** — isolated celery task, không có Python callers. Decorator pattern đã proven.
- Worst case nếu BusinessCalendarService fail → fail-open, gửi như cũ (không regress).
- Worst case nếu config sai schedule_id → fall back default schedule.

---

## Implementation Summary

**Completed:** 2026-05-04 17:59

Implementation delivered and tested. Phase 1 complete with:
- Code changes: `@working_day_required()` decorator added to `worklog_daily_reminder` task
- Test coverage: 3 new unit tests (skip, run, fail-open scenarios), all 12 tests pass
- Code review: Passed, 0 critical issues
- Impact analysis: LOW risk (0 upstream callers, 0 affected processes)

**Reports:**
- Test: `plans/reports/tester-260504-1759-worklog-reminder-skip.md`
- Review: `plans/reports/code-reviewer-260504-1759-worklog-reminder-skip.md`

**Next:** Commit to branch, PR to develop for merge. Changelog update post-merge per docs-management.md.

---

## Unresolved Questions (cần SHB confirm cho future phases)

1. **Multi-schedule:** SHB có nhiều business calendar (theo workspace/project) hay chỉ 1?
2. **Half-day holidays** (chiều 30 Tết, 5pm rơi vào đó): có gửi không?
3. **In-app notification** cũng skip? (Hiện tại fix sẽ skip cả 2)

Default trong plan: 1-schedule, half-day = skip, skip cả in-app. Update khi có feedback.
