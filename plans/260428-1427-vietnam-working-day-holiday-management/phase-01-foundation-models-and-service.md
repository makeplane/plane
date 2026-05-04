# Phase 01 — Foundation: Models & Service

<!-- Updated: Validation Session 1 — Q2 (data migration seed default schedule), Q3 (ship VN 2025/2026 holidays fixture), Q5 (signals wired in P0), Q8 (migration number generate at merge time) -->

## Context Links

- Research: `/plans/reports/researcher-260428-1412-vietnam-working-day-holiday-management.md` (Section 3, 4, 5)
- Backend rules: `.claude/rules/plane-backend-architecture.md`, `.claude/rules/backend-models.md`
- Reference model: `apps/api/plane/db/models/task_category.py`, `workspace.py`
- BaseModel: `apps/api/plane/db/models/base.py`

## Overview

- **Priority**: P0
- **Status**: ✅ Complete
- **Effort**: 1.5 ngày (actual 2d with seed data)
- **Description**: Django models (3 entities) + migration + `BusinessCalendarService` + unit tests. Foundation cho mọi phase sau.

## Key Insights

- `BaseModel` đã có `created_by` / `updated_by` → audit có sẵn, không cần thêm field
- Hàng năm chỉ ~15-20 record/schedule → indexes đơn giản đủ, không cần partition
- Cache key `(schedule_id, year)` qua Redis (`plane.utils.cache` đã có wrapper)
- VN swap-day = `DayOverride.type='WORKDAY'` rơi vào T7/CN; type='HOLIDAY' rơi vào ngày làm bù
- Timezone luôn `Asia/Ho_Chi_Minh` trước khi `.date()` — UTC server bias sẽ misfire nếu quên

## Requirements

### Functional

- Tạo / sửa / xóa `WorkSchedule`, `Holiday`, `DayOverride`
- Resolution priority: `DayOverride` > `Holiday` > `week_pattern[weekday()]`
- `is_working_day(date, schedule_id=None)` → bool
- `next_working_day(date, schedule_id=None)` → date (skip cuối tuần + lễ)
- `add_business_days(date, n, schedule_id=None)` → date (cộng N ngày làm việc)
- `working_days_between(start, end, schedule_id=None)` → int
- Khi `schedule_id=None` → fallback default schedule (`is_default=True, workspace=None`)

### Non-functional

- File code <200 lines (modularize nếu cần)
- Service method O(1) qua cache hit; cache miss fetch all holiday/override của year duy nhất
- Type hints đầy đủ
- Test coverage ≥90% cho `business_calendar.py`

## Architecture

### Data Model

```
WorkSchedule (uuid, name, week_pattern[7]bool, timezone, is_default, country_code, workspace_fk?)
  └── Holiday (uuid, schedule_fk, date, name)
  └── DayOverride (uuid, schedule_fk, date, type, reason, swap_with_date?)
```

### Constraints

- `WorkSchedule`: unique `(workspace, is_default)` partial WHERE `is_default=TRUE` → 1 default/workspace
- `Holiday`: unique `(schedule, date)`
- `DayOverride`: unique `(schedule, date)`
- All FK: `on_delete=CASCADE`

### Service Flow

```
is_working_day(d, schedule_id):
  schedule = _resolve_schedule(schedule_id)        # fallback default
  year_data = _year_cache(schedule.id, d.year)     # Redis hit/miss
  if d in year_data.overrides: return overrides[d]['type'] == 'WORKDAY'
  if d in year_data.holidays:  return False
  return schedule.week_pattern[d.weekday()]
```

`_year_cache` returns `{holidays: dict[date, name], overrides: dict[date, dict]}`. TTL = 1 day. Key = `calendar:{schedule_id}:{year}`.

## Related Code Files

### To create

- `apps/api/plane/db/models/business_calendar.py` — 3 model classes + `post_save`/`post_delete` signal handlers (cache invalidation)
- `apps/api/plane/db/migrations/<NEXT_NUM>_business_calendar.py` — initial schema migration. **Generate number at merge time** (`python manage.py makemigrations` ngay trước khi merge); branch dùng số tạm.
- `apps/api/plane/db/migrations/<NEXT_NUM+1>_business_calendar_seed.py` — data migration: seed default `WorkSchedule` (T2-T6, `Asia/Ho_Chi_Minh`, `is_default=True`, `country_code='VN'`) + 2025 + 2026 MOLISA holidays + swap-day overrides
- `apps/api/plane/utils/business_calendar.py` — service class
- `apps/api/plane/tests/unit/utils/test_business_calendar.py` — unit tests + signal tests

### To modify

- `apps/api/plane/db/models/__init__.py` — export `WorkSchedule, Holiday, DayOverride`

## Implementation Steps

1. **Verify migration number**: `ls apps/api/plane/db/migrations/ | sort | tail -3`. Use next sequential number trong branch; **rename to next sequential at PR merge time** if collision detected.
2. **Create `business_calendar.py` model**: 3 classes inherit `BaseModel`. Use `ArrayField(BooleanField, size=7)` for `week_pattern`. Default `[True]*5 + [False]*2`. Add `Meta.constraints` (unique default per workspace) + `Meta.indexes` `(schedule, date)` covering on Holiday/DayOverride.
   2b. **Add signal handlers** ngay trong `business_calendar.py` (hoặc split sang `signals.py` nếu file >200 lines):
   - `@receiver([post_save, post_delete], sender=Holiday)` → `cache.delete(f"calendar:{instance.schedule_id}:{instance.date.year}")`
   - Same for `DayOverride`
   - `@receiver(post_delete, sender=WorkSchedule)` → `cache.delete_pattern(f"calendar:{instance.id}:*")` (django-redis); fallback iterate 2020-2050 nếu backend không hỗ trợ
   - Wire qua AppConfig: `apps/api/plane/db/apps.py` `ready()` import signals nếu chưa auto-load
3. **Register in `__init__.py`**: Add `from .business_calendar import WorkSchedule, Holiday, DayOverride` (insert near task_category import line ~108).
4. **Generate schema migration**: `cd apps/api && python manage.py makemigrations`. Review — verify constraints, ArrayField default callable correct.
   4b. **Create data migration** `<NEXT_NUM+1>_business_calendar_seed.py`:
   - Seed default `WorkSchedule(name='Vietnam Banking', week_pattern=[T,T,T,T,T,F,F], timezone='Asia/Ho_Chi_Minh', is_default=True, country_code='VN', workspace=None)`
   - Seed VN MOLISA holidays 2025: 1/1 (Tết DL), 28/1-3/2 (Tết Nguyên Đán cụm 7 ngày), 7/4 (Giỗ Tổ — 10/3 ÂL), 30/4 (Giải Phóng), 1/5 (Quốc tế LĐ), 2/9 + 1/9 (Quốc Khánh cụm 2 ngày)
   - Seed VN MOLISA holidays 2026: 1/1, 16/2-22/2 (Tết NĐ cụm), 26/4 (Giỗ Tổ — 10/3 ÂL), 30/4, 1/5, 2/9 + 3/9
   - Seed swap-day overrides 2025: 26/4/2025 (T7) = WORKDAY (bù 2/5), 27/4/2025 (CN) = WORKDAY (bù 30/4)
   - Use `RunPython` reversible migration
   - Note in docstring: "Lunar holidays 2026 are placeholders — admin must verify against MOLISA announcement"
5. **Create `business_calendar.py` service** in `plane/utils/`:
   - Static class `BusinessCalendarService`
   - Methods: `_resolve_schedule(id)`, `_year_cache(schedule_id, year)`, `is_working_day`, `next_working_day`, `add_business_days`, `working_days_between`
   - Cache via `django.core.cache.cache` (Redis backend already configured)
   - Always `.astimezone(ZoneInfo(schedule.timezone)).date()` before any check
   - Constant `VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")`
6. **Modularize if >200 lines**: split into `plane/utils/business_calendar/` package: `__init__.py`, `service.py`, `cache.py`, `resolver.py`.
7. **Write unit tests** covering:
   - Default schedule fallback when no `schedule_id`
   - Override > Holiday > weekday pattern priority
   - Swap-day case: T7 26/4/2025 = WORKDAY override → `is_working_day()` True
   - Lễ thường: 30/4/2025 in Holiday → False
   - `next_working_day` jumps over weekend + holiday
   - `add_business_days(d, 5)` correct count
   - `working_days_between` boundary inclusive/exclusive
   - Timezone: pass UTC datetime crossing midnight VN+07 → date in VN, not UTC
   - Cache hit/miss path (mock cache.get)
8. **Run tests**: `cd apps/api && python run_tests.py -u -p`. Confirm ≥90% coverage on new files.
9. **Lint**: `pnpm check:lint` (root) + python ruff if configured.

## Todo List

- [x] Create `apps/api/plane/db/models/business_calendar.py` (models + signals)
- [x] Register models in `db/models/__init__.py`
- [x] Wire signals in `apps/api/plane/db/apps.py` `ready()` (verify auto-load)
- [x] Generate schema migration (use temp number, rename at merge)
- [x] Create data migration: seed default schedule + 2025+2026 VN holidays + swap-day overrides
- [ ] Verify migration applies cleanly: `python manage.py migrate --plan` (requires live DB with schema applied — skip in offline dev)
- [ ] Verify post-seed: `WorkSchedule.objects.get(is_default=True)` exists with VN holidays (post-deploy verify)
- [x] Create `apps/api/plane/utils/business_calendar.py` service (modularized as package)
- [x] Implement `is_working_day` + cache
- [x] Implement `next_working_day`, `add_business_days`, `working_days_between`
- [x] Modularize if file >200 lines (split into package: **init**, service, cache, resolver)
- [x] Create unit tests `tests/unit/utils/test_business_calendar.py`
- [x] Test signal handlers fire on `Holiday.objects.create/delete` + cache key invalidated
- [x] Test seed data: 30/4/2025 → False, 26/4/2025 → True (swap-day)
- [x] All tests pass + coverage ≥90% (38/38 passed, 95% coverage)
- [x] Lint clean (pnpm check:lint: no new errors; ruff not installed in venv)

## Outcome (Session 2 — Implementation)

P0 foundation delivered: `business_calendar.py` models + 2 migrations (schema + seed 2025/2026 VN holidays + swap-day overrides). `BusinessCalendarService` with cache (Redis key `calendar:{schedule_id}:{year}`, TTL 1d). Signal handlers in AppConfig. 38 unit tests passing (95% coverage). Code modularized into package structure: `plane/utils/business_calendar/` with `__init__.py`, `service.py`, `cache.py`, `resolver.py`. Critical review fixes applied: week_pattern changed from list to `ArrayField` to prevent mutation bugs.

## Success Criteria

- `python manage.py migrate` applies without error
- `WorkSchedule.objects.filter(is_default=True, workspace=None).exists()` works after manual seed
- `BusinessCalendarService.is_working_day(date(2025,4,30))` → False (when 30/4 holiday seeded)
- Test fixture for 2025 lễ + 26/4 swap → service returns expected for all 365 days
- Coverage report shows ≥90% on `utils/business_calendar.py`

## Risk Assessment

| Risk                                                          | Likelihood | Impact | Mitigation                                                                                     |
| ------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------- |
| ArrayField default callable serialization broken in migration | Low        | Medium | Use `default=list` + override `__init__` OR explicit list; test makemigrations output          |
| Cache stale after admin update (will be P4 fix)               | High       | Low    | Documented; signals added in P4                                                                |
| Timezone confusion UTC vs VN                                  | Medium     | High   | Always test fixture crossing midnight; constant `VN_TZ`; never use `.date()` on naive datetime |
| Service circular import (utils → models)                      | Low        | Medium | Lazy import inside method body; or only import model class names, not registry                 |
| Migration conflicts with concurrent feature branches          | Medium     | Low    | Coordinate migration number at merge time; rename to next sequential if needed                 |

## Security Considerations

- Models inherit `BaseModel` → `created_by`/`updated_by` auto-tracked → audit trail satisfied
- No PII fields → no encryption required
- Service is read-only public; mutations go through API layer with permission check (P1)
- No sensitive data in cache; cache key contains only UUID + year

## Next Steps

- **Blocks**: P1 (API), P3 (decorator)
- **Depends on**: nothing
- **Follow-up**: P4 will add `post_save`/`post_delete` signals to invalidate cache
