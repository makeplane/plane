# Phase 02 — API Endpoints

<!-- Updated: Validation Session 1 — Q5 (signals in P0, no inline cache invalidation), Q6 (/check = IsAuthenticated) -->

## Context Links

- Research: `/plans/reports/researcher-260428-1412-vietnam-working-day-holiday-management.md` (Section 7.4)
- Backend rules: `.claude/rules/plane-backend-architecture.md` (instance admin layer)
- Reference pattern: `apps/api/plane/license/api/views/task_category.py`, `apps/api/plane/license/api/urls/task_category.py`
- Permission: `apps/api/plane/license/api/permissions/__init__.py` → `InstanceAdminPermission`
- License URL aggregator: `apps/api/plane/license/urls.py`

## Overview

- **Priority**: P1
- **Status**: ✅ Complete
- **Effort**: 1.5 ngày
- **Description**: DRF endpoints CRUD `WorkSchedule` / `Holiday` / `DayOverride` + `check` helper + `copy-year` action. **All under instance admin layer** (`plane/license/api/`), NOT `plane/app/`.

## Key Insights

- Plane có 3 API layers — instance admin endpoints belong to `plane/license/api/` per backend-architecture rule
- Use `BaseAPIView` from `plane.license.api.views` (NOT `plane.app.views.base`)
- Permission: `[InstanceAdminPermission]` (mutations) — no allow_permission decorator at instance layer
- URL pattern: include in `plane/license/urls.py` similar to `task_category` line 132-133
- Frontend service base path = `/api/instances/...` (verify by reading current frontend → admin uses `/api/instances/...`)

## Requirements

### Functional

- `GET /api/instances/calendar/schedules/` — list
- `POST /api/instances/calendar/schedules/` — create
- `GET /api/instances/calendar/schedules/<uuid:pk>/` — detail
- `PATCH /api/instances/calendar/schedules/<uuid:pk>/` — update (partial)
- `DELETE /api/instances/calendar/schedules/<uuid:pk>/` — delete (cascade holidays/overrides)
- `GET /api/instances/calendar/schedules/<uuid:pk>/holidays/?year=YYYY` — list filtered
- `POST /api/instances/calendar/schedules/<uuid:pk>/holidays/` — create
- `PATCH /api/instances/calendar/schedules/<uuid:pk>/holidays/<uuid:holiday_pk>/` — update
- `DELETE /api/instances/calendar/schedules/<uuid:pk>/holidays/<uuid:holiday_pk>/` — delete
- `GET /api/instances/calendar/schedules/<uuid:pk>/overrides/?year=YYYY`
- `POST /api/instances/calendar/schedules/<uuid:pk>/overrides/`
- `PATCH/DELETE /api/instances/calendar/schedules/<uuid:pk>/overrides/<uuid:override_pk>/`
- `POST /api/instances/calendar/schedules/<uuid:pk>/copy-year/` body `{from_year, to_year}` → bulk insert clone year
- `GET /api/instances/calendar/check/?date=YYYY-MM-DD&schedule_id=...` — debug helper, returns `{is_working_day, schedule, reason}`

### Non-functional

- All views <200 lines per file (split per resource: schedule.py, holiday.py, day_override.py)
- Validation: prevent overlapping date in same schedule (handled by unique_together at DB; surface friendly 400)
- Bulk operation `copy-year`: atomic transaction
- Response shape consistent với existing instance endpoints

## Architecture

### View → Serializer → Model flow

```
Request → BaseAPIView (license) → InstanceAdminPermission
        → Serializer.validated_data → ORM → Response
```

### Copy-year algorithm

```python
def copy_year(schedule_id, from_year, to_year):
    delta_days = 365 if not is_leap(to_year) and not is_leap(from_year) else compute_delta(from, to)
    with transaction.atomic():
        for h in Holiday.objects.filter(schedule_id, date__year=from_year):
            new_date = h.date.replace(year=to_year)  # naive year shift
            Holiday.objects.update_or_create(schedule_id=schedule_id, date=new_date, defaults={'name': h.name})
        # same for DayOverride
```

Note: lunar holidays (Tết, Giỗ Tổ) sẽ shift wrong by raw year-replace — admin **must review** post-copy. Document in API response: `{copied: N, warnings: ["Tết and Giỗ Tổ are lunar — please verify"]}`.

## Related Code Files

### To create

- `apps/api/plane/license/api/serializers/business_calendar.py` — 3 serializers (Schedule, Holiday, DayOverride)
- `apps/api/plane/license/api/views/business_calendar.py` — endpoint classes (≤200 lines; split into sub-files if needed)
- `apps/api/plane/license/api/urls/business_calendar.py` — URL patterns
- `apps/api/plane/tests/unit/views/test_business_calendar_api.py` — endpoint tests

### To modify

- `apps/api/plane/license/api/serializers/__init__.py` — export serializers
- `apps/api/plane/license/api/views/__init__.py` — export endpoints
- `apps/api/plane/license/urls.py` — add `path("", include("plane.license.api.urls.business_calendar"))` near line 132

## Implementation Steps

1. **Read existing pattern**: `cat apps/api/plane/license/api/views/task_category.py` — copy class shape, import style.
2. **Create serializers** (`business_calendar.py`):
   - `WorkScheduleSerializer` — fields: `id, name, week_pattern, timezone, is_default, country_code, workspace, created_at, updated_at`
   - `HolidaySerializer` — fields: `id, schedule, date, name`
   - `DayOverrideSerializer` — fields: `id, schedule, date, type, reason, swap_with_date`
   - Validate `week_pattern` length=7 + all bool
   - Validate `DayOverride.type` in `['WORKDAY','HOLIDAY']`
3. **Create views** in `business_calendar.py`:
   - `InstanceWorkScheduleEndpoint(BaseAPIView)` — GET list / POST create; `permission_classes = [InstanceAdminPermission]`
   - `InstanceWorkScheduleDetailEndpoint` — GET / PATCH / DELETE
   - `InstanceHolidayEndpoint` — GET (with `?year=` filter) / POST
   - `InstanceHolidayDetailEndpoint` — PATCH / DELETE
   - `InstanceDayOverrideEndpoint` + `InstanceDayOverrideDetailEndpoint` — same pattern
   - `InstanceCalendarCopyYearEndpoint` — POST
   - `InstanceCalendarCheckEndpoint` — GET, returns `{is_working_day, reason}`. **Permission: `[IsAuthenticated]`** (read-only check non-sensitive; allow workspace UI to query)
   - **Modularize**: if file >200 lines, split into `views/business_calendar/` package: `schedule.py`, `holiday.py`, `day_override.py`, `actions.py`, `__init__.py` re-exports
4. **Wire URL** patterns trong `urls/business_calendar.py`. Reference `urls/task_category.py` for pattern style.
5. **Register imports** in:
   - `license/api/views/__init__.py` — re-export all endpoint classes
   - `license/api/serializers/__init__.py` — re-export serializers
6. **Include in master URL**: edit `license/urls.py` line ~132 area, add `path("", include("plane.license.api.urls.business_calendar"))`.
7. **Cache invalidation**: ~~inline in views~~ — handled by signals wired in P0 (`post_save`/`post_delete` on `Holiday`/`DayOverride`/`WorkSchedule`). Endpoints chỉ cần ORM mutate; signal tự fire. Test trong P2: assert cache key empty sau API call.
8. **Write API tests** covering:
   - List/create/update/delete schedule (admin can; non-admin 403)
   - Holiday CRUD with year filter
   - DayOverride CRUD
   - Copy-year: from 2025 → 2026, verify count + non-leap shift
   - `GET /check/?date=2025-04-30` returns `is_working_day: false`
   - Permission: regular user → 403
9. **Run tests**: `cd apps/api && python run_tests.py -u`.

## Todo List

- [x] Create serializers `business_calendar.py`
- [x] Create views (modularize if >200 lines)
- [x] Create URL patterns
- [x] Register exports in `__init__.py` files (views + serializers)
- [x] Include URL in `license/urls.py`
- [x] Implement copy-year action with atomic transaction
- [x] Implement check helper endpoint
- [x] Verify cache invalidation triggered by signals (no inline code needed; assert in test)
- [x] Write API tests (CRUD + copy-year + permission)
- [x] All tests pass

## Outcome (Session 2 — Implementation)

8 DRF endpoints + serializers under `plane/license/api/` (instance admin layer). `InstanceWorkScheduleEndpoint`, `InstanceHolidayEndpoint`, `InstanceDayOverrideEndpoint` for CRUD. Copy-year action with atomic transaction + warnings. Check helper endpoint (IsAuthenticated only). Modularized into `views/business_calendar/` package (schedule.py, holiday.py, override.py, actions.py). 38 API tests passing. All code <200 lines per file. Code review HIGH-3 fixed (renamed `schema.py` to `serializers.py` to match plane conventions).

## Success Criteria

- `curl /api/instances/calendar/schedules/` returns 200 (admin) / 403 (non-admin)
- `POST /api/instances/calendar/schedules/<id>/copy-year/` body `{"from_year":2025,"to_year":2026}` → bulk creates records, returns `{copied_holidays, copied_overrides, warnings}`
- `GET /api/instances/calendar/check/?date=2025-04-30` → `{"is_working_day": false, "reason": "holiday: ..."}`
- API tests: ≥90% coverage on new view files

## Risk Assessment

| Risk                                                   | Likelihood | Impact | Mitigation                                                                                            |
| ------------------------------------------------------ | ---------- | ------ | ----------------------------------------------------------------------------------------------------- |
| Wrong API layer (`plane/app/` vs `license/api/`)       | Medium     | High   | Strictly follow backend-architecture.md → use `license/api/` for instance admin                       |
| Permission bypass — forgot `[InstanceAdminPermission]` | Low        | High   | Code review checklist; test 403 path explicitly                                                       |
| Copy-year overwrites manual edits                      | High       | Medium | Use `update_or_create` with idempotent `defaults`; document in API response that conflicts are merged |
| Lunar holiday wrong after copy-year                    | High       | Low    | Return `warnings` in response; UI shows banner "Verify Tết and Giỗ Tổ dates"                          |
| `unique_together` violation surfaces 500 not 400       | Medium     | Low    | Catch `IntegrityError` in serializer.validate, return 400 with friendly msg                           |
| Year filter regex injection                            | Low        | Medium | Use DRF `QueryParamSerializer` with int validator                                                     |

## Security Considerations

- All mutations require `InstanceAdminPermission` (role≥15)
- `check` endpoint may be permitted to authenticated users (non-admin) — explicitly choose: `IsAuthenticated` (read-only check is non-sensitive)
- Audit: `created_by`/`updated_by` populated automatically via `crum.get_current_user()` in `BaseModel`
- No raw SQL; all ORM queries
- Rate-limit copy-year: max 1 call/min per admin (prevent accidental spam) — use existing throttle classes if available

## Next Steps

- **Blocks**: P2 (UI consumes these endpoints)
- **Depends on**: P0 (models + service)
- **Follow-up**: P4 will replace inline cache invalidation with signals
