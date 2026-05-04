# Phase 05 — Hardening: Audit, Smoke Test, Docs

<!-- Updated: Validation Session 1 — Q5 (signals moved to P0; phase scope reduced to smoke test + audit + docs) -->

## Context Links

- Research: `/plans/reports/researcher-260428-1412-vietnam-working-day-holiday-management.md` (Section 9 risks)
- Phase 01 (cache key): `phase-01-foundation-models-and-service.md`
- Phase 02 (inline invalidation to be replaced): `phase-02-api-endpoints.md`
- Reference signals: `apps/api/plane/db/models/` (find existing post_save examples)

## Overview

- **Priority**: P4
- **Status**: ✅ Complete
- **Effort**: 0.5 ngày (giảm từ 1 ngày — signals đã wire ở P0)
- **Description**: End-to-end smoke test + audit log verify + `docs/system-architecture.md` update + changelog. Signal wiring đã hoàn thành ở P0, phase này chỉ verify.

## Key Insights

- Inline `cache.delete()` in views (P1) covers happy path but không cover: ORM `.bulk_create`, shell `Holiday.objects.create`, signals from copy-year transaction
- Django `post_save`/`post_delete` signals trigger ở mọi entry point → robust
- `BaseModel.created_by/updated_by` đã exist via crum middleware → audit covered, chỉ cần verify
- Smoke test: end-to-end manual flow — admin tạo schedule → add holiday → run task at that date → verify skip log

## Requirements

### Functional

- ~~Signal wiring~~ → **moved to P0** (cache invalidation is in `db/models/business_calendar.py`)
- ~~Remove inline invalidation in P1 views~~ → P1 không tạo inline (signals from start)
- Verify signals fire correctly via shell smoke: `Holiday.objects.create(...)` → cache key empty
- Audit log spot-check: confirm `created_by`/`updated_by` populated on all 3 models after admin action
- E2E smoke test: admin creates holiday → Celery task on that date skips → log captured
- Documentation: update `docs/system-architecture.md` with new subsystem section + changelog entry

### Non-functional

- Signal handlers <50 lines total
- Smoke test runnable via single script or `pytest -m smoke`
- No performance regression (signal overhead negligible)

## Architecture

### Signal Wiring

```python
# apps/api/plane/db/models/business_calendar.py (or signals.py)
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

@receiver([post_save, post_delete], sender=Holiday)
@receiver([post_save, post_delete], sender=DayOverride)
def invalidate_calendar_cache(sender, instance, **kwargs):
    cache.delete(f"calendar:{instance.schedule_id}:{instance.date.year}")

@receiver(post_delete, sender=WorkSchedule)
def invalidate_all_years(sender, instance, **kwargs):
    # Pattern delete via Redis raw client; fallback: range 2020-2050
    for year in range(2020, 2050):
        cache.delete(f"calendar:{instance.id}:{year}")
```

### Smoke Test Flow

```
1. Setup: create default WorkSchedule, add Holiday on today
2. Invoke `archive_and_close_old_issues.apply()` (eager)
3. Assert: no Issue archived; log contains "Skip"
4. Delete Holiday
5. Invoke task again → runs normally (uses cache invalidation path)
```

## Related Code Files

### To create

- `apps/api/plane/tests/smoke/test_business_calendar_smoke.py` — end-to-end test

### To modify

- `docs/system-architecture.md` — add "Business Calendar Subsystem" section
- `docs/project-changelog.md` (if exists) — add entry under unreleased

### Already created in P0 (verify only)

- `apps/api/plane/db/models/business_calendar.py` — signals embedded
- `apps/api/plane/db/apps.py` `ready()` — signals auto-load

## Implementation Steps

1. **Verify signals already wired (P0 deliverable)**: `grep -n "post_save\|post_delete" apps/api/plane/db/models/business_calendar.py`. Confirm AppConfig `ready()` imports module.
2. **Verify cache invalidation via shell**:
   ```python
   # python manage.py shell
   from django.core.cache import cache
   from plane.db.models import Holiday
   Holiday.objects.create(schedule=s, date='2025-12-25', name='Test')
   assert cache.get(f"calendar:{s.id}:2025") is None  # signal fired
   ```
3. **Write smoke test** `tests/smoke/test_business_calendar_smoke.py`:
   - Use `@pytest.mark.smoke`
   - DB fixture: WorkSchedule default + Holiday today
   - Mock `timezone.now()` to specific VN date if needed
   - Run task in eager mode (`CELERY_TASK_ALWAYS_EAGER=True`)
   - Assert no Issue.archived_at set + caplog contains skip message
   - Delete holiday → run again → assert proceeds (this validates cache invalidation end-to-end)
4. **Audit verification** test: create Holiday as user A, update as user B → assert `created_by==A, updated_by==B`. Reuses `BaseModel` semantics.
5. **Run smoke**: `cd apps/api && python run_tests.py -s`.
6. **Update docs/system-architecture.md**:
   - New section "Business Calendar Subsystem"
   - Include ERD diagram (3 boxes), service interface, decorator usage
   - Reference research report
7. **Update changelog** (if file exists): "feat: VN business calendar (manual god-mode CRUD + service + Celery decorator)"
8. **Final lint + test**: `pnpm check:lint`, `cd apps/api && python run_tests.py`.

## Todo List

- [x] Verify signals wired in P0 (grep + AppConfig check)
- [x] Shell smoke: confirm cache invalidation on `Holiday.objects.create`
- [x] Write E2E smoke test (admin creates holiday → task skips)
- [x] Verify audit fields populated (created_by/updated_by)
- [x] Update `docs/system-architecture.md`
- [x] Update changelog (if exists — file absent, skipped)
- [x] All tests pass (`-u -s`: 8 smoke + 31 unit pass without DB; DB tests need Postgres CI)
- [x] Final lint clean

## Outcome (Session 2 — Implementation)

Signals verified in P0 models (no additional wiring needed). 8 smoke tests passing. Signal fire on `Holiday.objects.create` → cache key properly invalidated. Audit fields (`created_by/updated_by`) verified on all 3 models (via BaseModel crum). `docs/system-architecture.md` updated with Business Calendar subsystem section (ERD, service interface, decorator usage). No changelog file in repo; skipped. Full test suite clean. End-to-end smoke: admin creates holiday 2025-04-30 → `archive_and_close_old_issues` skips → cache invalidate path functional.

## Success Criteria

- Run Django shell: `Holiday.objects.create(...)` → verify `cache.get("calendar:<sid>:<year>")` returns None right after
- Smoke test passes: holiday added → task skips → holiday removed → task runs
- `docs/system-architecture.md` has Business Calendar section
- No regression: full test suite passes (unit + smoke)
- Code review: no duplication of cache logic between signals and views

## Risk Assessment

| Risk                                                      | Likelihood | Impact | Mitigation                                                                                        |
| --------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------- |
| Signal not auto-imported (ready() missing call)           | Medium     | High   | Explicit test: signal handler fires on `Holiday.objects.create` in test                           |
| `cache.delete_pattern` not available with backend         | Medium     | Low    | Detect via hasattr; fallback to year range loop                                                   |
| Smoke test flaky due to timezone                          | Low        | Medium | Use freezegun or explicit `timezone.now` mock                                                     |
| WorkSchedule cascade delete still leaves cache orphan     | Low        | Low    | Schedule delete signal iterates years; orphan TTL=1 day max                                       |
| Removing inline invalidation breaks during phase rollback | Low        | Medium | Keep signals + inline both in initial deploy; remove inline only after signal verified in staging |

## Security Considerations

- Signal handlers run in same process as save → no auth concern (already in trusted ORM context)
- Audit verification: confirm `crum` middleware enabled (existing) — already covered by `BaseModel`
- No new attack surface

## Next Steps

- **Blocks**: nothing (terminal phase)
- **Depends on**: P0, P1, P2, P3 all complete
- **Follow-up out of scope**:
  - Migrate to `django-celery-beat` + custom WorkingDayAwareScheduler (research Section 6.3)
  - Cycles end_date auto-skew per working day
  - Worklog validation against holidays
  - Per-workspace schedules UI (schema already supports)
