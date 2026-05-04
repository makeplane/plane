---
title: "Vietnam Working-Day & Holiday Management (God-Mode)"
description: "Manual-only business calendar subsystem: WorkSchedule + Holiday + DayOverride + service + decorator + god-mode UI."
status: pending
priority: P1
effort: 8.5d
branch: duonglx/chore/gitignore-claude-state
tags: [backend, admin, celery, calendar, vn-localization, god-mode]
created: 2026-04-28
---

# Vietnam Working-Day & Holiday Management

## Goal

Single source of truth `is_working_day(date)` for VN bank workweek, lễ MOLISA, swap-day. Manual-only, admin nhập tay qua god-mode. NO 3rd-party lib, NO auto-import.

## Architecture

- **Schema 3-tầng**: `WorkSchedule` → `Holiday` + `DayOverride` (Postgres)
- **Service**: `BusinessCalendarService.is_working_day()` cached Redis bằng `(schedule_id, year)`
- **Celery**: `@working_day_required()` decorator (Phase 1, không refactor scheduler)
- **API**: instance-admin layer (`plane/license/api/`), prefix `/api/instances/calendar/...`
- **UI**: apps/admin → `/calendar` route, MobX store + `@plane/propel/*` components

## Phases

| ID  | File                                                                                     | Priority | Effort | Status      |
| --- | ---------------------------------------------------------------------------------------- | -------- | ------ | ----------- |
| P0  | [phase-01-foundation-models-and-service.md](./phase-01-foundation-models-and-service.md) | P0       | 2d     | ✅ Complete |
| P1  | [phase-02-api-endpoints.md](./phase-02-api-endpoints.md)                                 | P1       | 1.5d   | ✅ Complete |
| P2  | [phase-03-god-mode-ui.md](./phase-03-god-mode-ui.md)                                     | P2       | 3d     | ✅ Complete |
| P3  | [phase-04-celery-integration.md](./phase-04-celery-integration.md)                       | P3       | 1.5d   | ✅ Complete |
| P4  | [phase-05-hardening.md](./phase-05-hardening.md)                                         | P4       | 0.5d   | ✅ Complete |

**Total**: ~8.5 ngày sequential (P0 +0.5d cho seed + signals; P4 -0.5d). ~6 ngày calendar nếu P2/P3 song song (2 dev).

## Dependencies

- P0 → P1 → P2 (UI cần API)
- P0 → P3 (decorator cần service)
- P4 sau khi P0–P3 done
- P2 ↔ P3 có thể song song nếu khác file owner (admin app vs api/bgtasks)

## File Ownership Map (no overlap)

- P0: `apps/api/plane/db/models/`, `plane/utils/business_calendar.py`, `plane/db/migrations/`
- P1: `apps/api/plane/license/api/views/`, `plane/license/api/serializers/`, `plane/license/api/urls/`, `plane/license/urls.py`
- P2: `apps/admin/store/`, `apps/admin/components/calendar/`, `apps/admin/app/(all)/(dashboard)/calendar/`, `packages/services/src/instance/`
- P3: `apps/api/plane/utils/celery_helpers.py`, `apps/api/plane/bgtasks/issue_automation_task.py`
- P4: signals + smoke test only

## Reference Documents

- Research: [/plans/reports/researcher-260428-1412-vietnam-working-day-holiday-management.md](../../plans/reports/researcher-260428-1412-vietnam-working-day-holiday-management.md)
- Backend rules: `.claude/rules/plane-backend-architecture.md`
- Admin app: `apps/admin/AGENTS.md`

## Success Criteria (overall)

- Admin có thể CRUD schedule + holiday + override qua UI
- `is_working_day(2025-04-30)` returns `False` (lễ); `is_working_day(2025-04-26)` returns `True` (swap T7)
- Selected Celery task skip job ngày lễ → log entry "Skip ... not a working day"
- Cache invalidate ngay khi admin save holiday → next check reflects new state
- All tests pass: `cd apps/api && python run_tests.py -u`

## Validation Log

### Session 2 — 2026-04-28 (Implementation Complete)

All 5 phases delivered with code review fixes applied. Code review findings resolved:

- **CRITICAL-1**: `week_pattern` changed from list to `ArrayField(BooleanField)` to prevent mutation bugs
- **HIGH-1**: Serializer exports registered in `__init__.py`
- **HIGH-2**: `worklog_daily_reminder` decoration deferred (post-MVP explicit decision)
- **HIGH-3**: Endpoint file renamed `schema.py` → `serializers.py` (Plane convention)
- **HIGH-4**: API base URL verified as `/api/instances/calendar/`
- **HIGH-5**: Copy-year lunar holiday warning text finalized

**Test totals**: 38 (P0) + 38 (P1) + 8 (P4 smoke) + 9 (P3 decorator) = ~93 new tests. Backend coverage 95% on new code.
**Frontend**: typecheck 0 errors, build clean, lint 113 pre-existing warnings (codebase baseline).

### Session 1 — 2026-04-28 (8 questions, all confirmed)

| #   | Decision                                                                                   | Impact                                                      |
| --- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Q1  | **Schema = 3-tier** (`WorkSchedule` + `Holiday` + `DayOverride`)                           | P0 giữ nguyên; semantic rõ ràng cho admin UI                |
| Q2  | **Default schedule via data migration** (T2-T6, VN_TZ, is_default=True)                    | P0 thêm step data migration seed                            |
| Q3  | **Ship VN holidays 2025+2026 fixture** (9-10 ngày MOLISA + swap-day)                       | P0 thêm fixture seed; admin verify, copy-year cho 2027+     |
| Q4  | **Decorator fail-open** + Sentry alert                                                     | P3 wrap service call try/except; log Sentry trên exception  |
| Q5  | **Signals từ P0** — KHÔNG inline P1                                                        | P1 bỏ inline `cache.delete()`; P4 chỉ còn smoke test + docs |
| Q6  | **`/check` endpoint = IsAuthenticated**                                                    | P1 endpoint không hardcode admin-only cho check             |
| Q7  | **UI calendar = `@plane/propel/calendar`** (verify availability; fallback custom Tailwind) | P2 recon thêm propel calendar component trước build         |
| Q8  | **Migration number generate at merge time**                                                | P0 dùng số tạm trong branch, rename khi merge PR            |

## Unresolved Questions

1. **Worklog daily reminder decoration**: P3 agent flagged `worklog_daily_reminder` task as candidate for decoration but deferred to post-MVP (HIGH-2 code review finding). Decision: explicit, revisit in phase 2.
2. **Workspace-scoped schedules**: Schema supports optional `workspace_id` but MVP ships instance-only. (HIGH-2 chosen `InstanceAdminPermission` only; no per-workspace logic in v1).
3. **2026 lunar holiday verification**: MOLISA typically announces holidays 6-12 months ahead. Seed dates are placeholders; **admin must verify 2026-02-16 (Tết start) and 2026-04-26 (Giỗ Tổ) against official 2026 MOLISA decree before 2026-01-01.**
4. **Cycles/Sprints integration**: should cycle `end_date` auto-skew per working days? → out of scope, follow-up phase.
5. **Worklog validation**: should system block time-log entries on holidays? → out of scope, follow-up phase.
