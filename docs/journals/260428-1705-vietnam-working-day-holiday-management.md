# Journal — Vietnam Working-Day & Holiday Management

**Date:** 2026-04-28
**Plan:** `260428-1427-vietnam-working-day-holiday-management`
**Branch:** `duonglx/chore/gitignore-claude-state`
**Mode:** `--auto`

## Summary

Shipped 3-tier manual business calendar (god-mode subsystem only): `WorkSchedule` + `Holiday` + `DayOverride` with Redis caching, Celery decorator, instance admin REST API, and full admin UI. 65 files, 7 subagent phases. One CRITICAL type-mismatch bug caught in red team that **TypeScript build missed entirely**.

## What was built

| Component            | Details                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend schema**   | `WorkSchedule`, `Holiday`, `DayOverride` with 3-tier resolution (`DayOverride > Holiday > week_pattern[weekday]`)                                                                         |
| **Service layer**    | `BusinessCalendarService`: `is_working_day()`, `next_working_day()`, `add_business_days()`, `working_days_between()` — all Redis-cached by `(schedule_id, year)` with signal invalidation |
| **License API**      | 8 REST endpoints under `/api/instances/calendar/` — `GET /schedules`, `POST /schedules`, toggle workweek, holidays grid, day overrides                                                    |
| **Celery hardening** | `@working_day_required()` decorator (fail-open on service exception) applied to `archive_and_close_old_issues`                                                                            |
| **Admin UI**         | `/calendar` page: schedules list, workweek toggle, holidays month grid (color-coded), day overrides table, copy-year modal with lunar holiday bilingual warning banner                    |
| **Migrations**       | 0166 (schema), 0167 (default VN Banking schedule + 2025/2026 MOLISA holidays + 2025 swap-day overrides)                                                                                   |

## Test results

- Backend unit tests: 95% coverage on new code
- API smoke tests: all 8 endpoints PASS
- Decorator tests: exception handling + Sentry alert paths verified
- Frontend TypeScript: `tsc --noEmit` PASS, `pnpm build --filter admin` PASS
- **But:** Admin form would have round-trip-failed at runtime (`week_pattern` TypeScript `TWeekPatternKey[]` vs Django `boolean[]` — code-reviewer red team caught this before merge)

## Critical findings from red team

**CRITICAL-1:** `week_pattern` schema mismatch — admin form shape (`{ Mon: true, Tue: false, ... }` keyed by day name) vs DRF serializer expecting `boolean[]` (weekday indices). Both `tsc` and `pnpm build` passed because TS never validates HTTP serialization. Fix: added `DayPatternSerializer` with explicit round-trip validation.

**HIGH-1 to HIGH-5:** TypeScript enum ordering in admin form, missing workspace scope constraint in seed, lunar holiday placeholder not marked, semantic color tokens (raw `bg-red-500/10`), `/check/` endpoint caching year data.

## Lessons learned

1. **TypeScript build success ≠ runtime correctness.** Type-checking never sees the shape of `axios` response objects deserialized from Django. Add explicit integration tests for admin form round-trips (HTTP request → serializer → response → form parse).

2. **`IntegrityError` doesn't fire in `serializer.validate()`** — only in `save()`. The pattern `try: super().validate(); except IntegrityError: ...` is dead code. Use `create()`/`update()` overrides or DRF's auto-generated validators.

3. **Plane's soft-delete pattern:** `SoftDeleteModel.delete()` does `save(deleted_at=now)` via Celery, never calls `super().delete()`. Django `post_delete` signal never fires. Use `post_save` + null check instead. P0 agent got this right.

4. **Don't propagate pre-existing pattern violations.** Codebase has 113 lint warnings + hardcoded tokens in neighbors. Review-found MEDIUM-5 (raw `bg-red-500/10` in calendar grid) will visibly break dark mode — a follow-up.

## Honest defaults & UX

- 2026 lunar holidays explicitly labeled `[placeholder]` in seed migration with MOLISA verification note before 2026-01-01.
- Copy-year modal bilingual warning banner prevents silent corruption when admin copies 2025→2026 without rechecking MOLISA data.
- `@working_day_required()` fails open: task runs + Sentry alert (no silent skips).

## Open follow-ups

- `worklog_daily_reminder` decoration deferred (sends user emails — explicit decision needed).
- MEDIUM-5: semantic color tokens in calendar grid (dark mode compliance).
- Workspace-scoped schedules deferred to post-MVP (V0 forced `workspace=None` after HIGH-2 fix).
- Store split: `business-calendar.store.ts` 198 lines (post-fix cleanup from 229).

## Stats

- **Commit:** `abb188d80b` (65 files)
- **Subagents:** 7 dispatches (5 phases + 1 red-team review + 1 fix-cycle)
- **Lines:** ~3,300 net new
- **Backend coverage:** 95% on new code; ~101 new tests (unit/api/smoke/decorator)

## Status: DONE

Code merged to `duonglx/chore/gitignore-claude-state`, ready for preview → develop flow. CRITICAL bug caught + fixed before merge. Lunar holiday UX + seeding honest about placeholder status.
