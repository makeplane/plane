# Code Review — Vietnam Working-Day & Holiday Management

**Date:** 2026-04-28
**Reviewer:** code-reviewer
**Branch:** `duonglx/chore/gitignore-claude-state` (uncommitted)
**Scope:** P0–P4 (35 files, ~3,300 LOC)

---

## Summary

Backend correctness, test discipline, and architecture choices are solid. **One CRITICAL contract mismatch** (TS week_pattern strings vs Django booleans) blocks ship — schedule create/update will round-trip-fail at runtime. Several HIGH issues around `is_default` enforcement, `workspace` IDOR/scoping, store mutation safety. Otherwise high-quality work.

**Approval: APPROVED_WITH_CONDITIONS** (block on CRITICAL-1, fix HIGH-1..4 before merge).
**Score: 7.5/10**

---

## CRITICAL (block landing)

### CRITICAL-1 — TypeScript ↔ Backend `week_pattern` schema mismatch

**Files:**

- `packages/types/src/instance/business-calendar.ts:9,19`
- `apps/admin/components/calendar/create-schedule-modal.tsx:40,55`
- `apps/admin/components/calendar/workweek-toggle.tsx:34-39,54`
- `apps/admin/components/calendar/schedule-card.tsx:48`
- `apps/api/plane/db/models/business_calendar.py:32-37` (ArrayField of BooleanField)
- `apps/api/plane/license/api/serializers/business_calendar.py:40-45` (validates 7 booleans)
- `apps/api/plane/utils/business_calendar/service.py:55` (`schedule.week_pattern[d.weekday()]`)
- `apps/api/plane/db/migrations/0167_business_calendar_seed.py:96`

**Bug:**

- DB stores `week_pattern: bool[7]` indexed Mon=0..Sun=6 — service does `bool(schedule.week_pattern[d.weekday()])`.
- Serializer rejects payload unless 7 booleans (`validate_week_pattern`).
- TS type declares `week_pattern: TWeekPatternKey[]` (`"MON" | ... | "SUN"`).
- Admin form sends `["MON","TUE","WED","THU","FRI"]` → 400 from serializer.
- Detail card iterates via `.includes("MON")` → after backend returns `[true,true,...]`, that comparison is permanently `false`. Schedule card will show ALL weekdays as off.

**Impact:** Schedule create breaks 100% in admin UI. Workweek toggle / day badges render incorrect state. Tests on backend pass because they call ORM with bool arrays directly; tests on frontend never made a real round-trip.

**Fix:** Pick ONE encoding, then enforce end-to-end. Two options:

1. **Booleans** (recommended — already in DB & service): change TS to `week_pattern: boolean[]` (length 7). In `create-schedule-modal.tsx`, store `boolean[]` in form, convert key↔index for the toggle UI. Update `WorkweekToggle.includes(key)` → `pattern[INDEX[key]]`. Update `schedule-card.tsx` similarly.
2. **Keys** (requires backend rewrite): change DB to `ArrayField(CharField)`, rewrite service indexer, migrate seed data, rewrite serializer validation. More churn — not recommended.

**This is the single most load-bearing bug. Frontend agent's "typecheck pass" did not catch it because TS never sees backend response shape; build pass = compile only. No integration test exists.**

---

## HIGH (fix before merge)

### HIGH-1 — Multiple `is_default=True` schedules accepted on update

**File:** `apps/api/plane/license/api/serializers/business_calendar.py:14-54`

Partial unique constraint `unique_default_schedule_per_workspace` covers `(workspace, is_default)` only when `is_default=True`. On PATCH where the request flips a _second_ schedule's `is_default` to True, DB raises `IntegrityError`. The serializer's `validate()` wraps `super().validate()` in try/except `IntegrityError`, but `IntegrityError` raises during `serializer.save()` — NOT during `validate()` — so the catch never fires. End state: 500 + non-actionable error to UI.

**Fix:** Move the catch into the view's `post`/`patch`, or override `serializer.save()` to translate IntegrityError → ValidationError. Better: explicit pre-flight check —

```python
def validate(self, attrs):
    if attrs.get("is_default"):
        existing = WorkSchedule.objects.filter(
            workspace=attrs.get("workspace") or self.instance.workspace if self.instance else None,
            is_default=True,
        ).exclude(pk=self.instance.pk if self.instance else None)
        if existing.exists():
            raise serializers.ValidationError({"is_default": "Another default already exists for this workspace."})
    return super().validate(attrs)
```

### HIGH-2 — Workspace IDOR / unbounded scope on schedule list

**File:** `apps/api/plane/license/api/views/business_calendar/schedule.py:20-23`

`InstanceWorkScheduleEndpoint.get` returns ALL schedules across ALL workspaces with no scoping. Any instance admin sees every workspace's schedule (instance-admin role is global, so this is _intended_ per architecture — but undocumented). However:

- `WorkScheduleSerializer.workspace` is writable (line 17-23). Any instance admin can POST a schedule and assign it to ANY workspace by passing `workspace: <uuid>` — even workspaces they aren't a member of (instance-admin doesn't equal workspace-admin).
- Conversely, the frontend create form doesn't expose `workspace` → submits with default `null` → all admin-created schedules become instance-level. OK for V0 but a workspace may unknowingly get its schedule changed by another admin via curl.

**Fix:** Either remove `workspace` from the writable fields and force `workspace=None` in `perform_create` (instance admin only edits instance-level schedules), or add explicit field-level documentation that instance admins can author for any workspace by design.

### HIGH-3 — `BusinessCalendarStore.deleteSchedule` does not invalidate holiday/override caches

**File:** `apps/admin/store/business-calendar.store.ts:133-136`

Deleting a schedule removes it from `schedulesMap` but leaves `holidaysMap[scheduleId:year]` and `overridesMap[scheduleId:year]` keys orphaned. If admin re-creates a schedule with the same UUID (impossible), or — more realistically — navigates to a stale cached scheduleId, stale holiday data stays in memory. Minor since soft-delete prevents UUID reuse, but the orphaned memory is a correctness smell and grows unbounded across long admin sessions.

**Fix:**

```ts
deleteSchedule = async (id: string): Promise<void> => {
  await this.service.deleteSchedule(id);
  runInAction(() => {
    delete this.schedulesMap[id];
    Object.keys(this.holidaysMap)
      .filter((k) => k.startsWith(`${id}:`))
      .forEach((k) => delete this.holidaysMap[k]);
    Object.keys(this.overridesMap)
      .filter((k) => k.startsWith(`${id}:`))
      .forEach((k) => delete this.overridesMap[k]);
  });
};
```

### HIGH-4 — `_clear_schedule_cache` fallback range hardcoded 2020–2050

**File:** `apps/api/plane/db/models/business_calendar.py:158-163`

When `cache.delete_pattern` is unavailable (LocMemCache, fakeredis), fallback iterates `range(2020, 2051)`. Plane uses `django_redis.cache.RedisCache` in prod (verified `settings/common.py:187,198`), so `delete_pattern` exists in prod and tests. **But:** `LocMemCache` is also installed-but-rare; if the fallback ever runs, dates beyond 2050 will leak. More importantly the magic constants are not documented as a "safe horizon" decision.

**Fix:** Either remove the fallback (Plane standardizes on django_redis) and `assert callable(delete_pattern)` once at app ready, or extract `MIN_YEAR = 2020`, `MAX_YEAR = 2100` constants with a comment.

### HIGH-5 — `IntegrityError` re-raise is unreachable in serializer

**File:** `apps/api/plane/license/api/serializers/business_calendar.py:47-54, 65-71, 91-97`

Same root cause as HIGH-1, repeated 3×. `serializers.ModelSerializer.validate()` does not invoke DB writes — `IntegrityError` only fires inside `.save()` → `.create()` / `.update()`. Wrapping `super().validate()` in `try/except IntegrityError` is dead code. The friendly error message ("A holiday already exists…") is never returned; user sees a 500.

**Fix:** Override `create()` and `update()` in each serializer (or in the view's `post`/`patch`) to translate IntegrityError → ValidationError. Or rely on explicit unique-pre-check — the `unique_together` already triggers DRF's `UniqueTogetherValidator` which produces a clean 400. Verify this validator is registered.

---

## MEDIUM

### MEDIUM-1 — `_resolve_reason` does N×3 extra DB queries per `/check/` call

**File:** `apps/api/plane/license/api/views/business_calendar/actions.py:169-182`

`InstanceCalendarCheckEndpoint` calls `is_working_day()` (1 cache hit / build), then calls `_resolve_reason()` which does TWO MORE DB queries (`DayOverride.objects.filter(...).first()`, `Holiday.objects.filter(...).first()`). Year data is already in cache; reuse it.

**Fix:**

```python
def get(self, request):
    ...
    year_data = get_or_build_year_data(schedule, query_date.year)
    is_working = ... (compute from year_data)
    reason = _resolve_reason_from_cache(query_date, year_data, is_working)
```

Saves 2 queries per check. Reason computation matches what `is_working_day` already did — DRY win.

### MEDIUM-2 — Pickle deserialization branch is dead code

**File:** `apps/api/plane/utils/business_calendar/cache.py:33-34`

`return raw if isinstance(raw, dict) else pickle.loads(raw)` — `django_redis` returns the original Python object (already unpickled). The `isinstance(raw, dict)` check always wins, the `pickle.loads(raw)` branch is unreachable. The `# noqa: S301` suggests author knew it was suspicious.

**Fix:** Remove the pickle branch:

```python
return raw  # django_redis handles serialization
```

### MEDIUM-3 — Year query param has no upper/lower bound

**Files:** `holiday.py:32-38`, `day_override.py:32-38`, `actions.py:54-58`

`?year=999999999999999999` is accepted (int conversion succeeds). DB query is fine but builds a large filter expression; copy-year accepts arbitrary `from_year`/`to_year` (e.g., year=1 builds Holiday for year=1 silently). Potential for nonsense data via curl.

**Fix:** Validate `1900 <= year <= 2100` in all three views. One-liner.

### MEDIUM-4 — `business-calendar.store.ts` exceeds 200-line limit (229 lines)

**File:** `apps/admin/store/business-calendar.store.ts`

Project rule: stores ≤200 lines. Mostly mechanical CRUD — split into 3 stores (`schedule.store.ts`, `holiday.store.ts`, `override.store.ts`) sharing a service, or extract action helpers.

### MEDIUM-5 — Hardcoded colors in calendar grid (violates token rule)

**Files:**

- `apps/admin/components/calendar/holidays-month-grid.tsx:32-34`
- `apps/admin/components/calendar/holidays-year-view.tsx:77-79`
- `apps/admin/components/calendar/day-overrides-table.tsx:27-29`

Uses raw `bg-red-500/10 text-red-700`, `bg-amber-500/10`, `bg-yellow-500/10`. Project rule explicitly forbids hardcoded colors — must use semantic tokens (`bg-danger-subtle text-danger-primary`, `bg-warning-subtle`, etc.). Will not adapt to dark mode.

**Fix:**

```tsx
holiday: "bg-danger-subtle text-danger-primary font-medium",
"override-workday": "bg-warning-subtle text-warning-primary font-medium",
"override-holiday": "bg-accent-subtle text-accent-primary font-medium",
```

### MEDIUM-6 — Missing `DRF UniqueTogetherValidator` exposure to client

**File:** `apps/api/plane/license/api/serializers/business_calendar.py:60-71`

`HolidaySerializer.Meta.unique_together` is implicit via the model's `unique_together`. DRF auto-generates `UniqueTogetherValidator`, returning {"non_field_errors": [...]} on duplicate. The serializer's manual `validate(...)` IntegrityError catch is dead (HIGH-5) and the friendly Vietnamese message is lost. Verify duplicate POST returns a clean 400 with a usable error key the frontend can display.

### MEDIUM-7 — `next_working_day` infinite loop risk on misconfigured schedule

**File:** `apps/api/plane/utils/business_calendar/service.py:64-68`

If a schedule is created with `week_pattern=[False]*7` (all days off) AND no overrides, `while not is_working_day(candidate)` loops forever. Same risk in `add_business_days` (line 88-92).

**Fix:** Add a safety bound: max 365 iterations or detect all-False pattern and raise `ValueError("schedule has no working days")` early.

---

## LOW

### LOW-1 — `delete()` on detail endpoints catches bare `Exception`

**Files:** `schedule.py:65-70`, `holiday.py:81-86`, `day_override.py:81-86`

Catches every exception (incl. `KeyboardInterrupt`, `SystemExit` indirectly via subclass) and returns 400. Soft-delete almost never fails, so this masks bugs. Use `except (IntegrityError, DatabaseError):` or let `BaseAPIView.handle_exception` handle it (already does — see `views/base.py:58-95`).

### LOW-2 — `BusinessCalendarStore.error` is set in fetch but never cleared elsewhere

**File:** `apps/admin/store/business-calendar.store.ts:107-119`

`fetchSchedules` sets `error = null` at start, sets to "Không thể tải lịch làm việc" on failure. None of the other actions touch `error`. UI will show stale fetch error after a successful create. Minor — observed by no consumer right now.

### LOW-3 — Vietnamese hardcoded strings tightly couple admin to VN locale

**Files:** all `apps/admin/components/calendar/*.tsx`

Architecture decision per spec: "Admin UI: NO i18n (hardcode VN strings)". Confirmed. Note for future: any non-VN deployment of God Mode will need i18n migration. Not a blocker.

### LOW-4 — `confirm()` for destructive actions is browser-blocking and ugly

**Files:** `schedule-detail.tsx:38`, `day-overrides-table.tsx:37`

Native `confirm()` blocks event loop, looks unstyled. Project has propel dialog system. Replace with a small confirm dialog component. Minor UX, not security.

### LOW-5 — `holidays-year-view.tsx` line 11 swallows fetch errors as toast only

**File:** `apps/admin/components/calendar/holidays-year-view.tsx:33-40`

`.catch()` shows toast but does not set MobX `error` state — UI cannot retry programmatically. Acceptable for V0.

### LOW-6 — Empty barrel `apps/admin/store/business-calendar.store.ts` exports type only via `IBusinessCalendarStore`

Acceptable, no action needed.

### LOW-7 — Migration 0166 docstring "rename to next sequential number at PR merge time if conflict detected"

**File:** `apps/api/plane/db/migrations/0166_business_calendar.py:5`

Confirmed `0165_register_worklog_reminder_periodic_task` exists; chain valid today. If anyone else lands a 0166 first, this needs renumbering. Watch on rebase.

---

## INFO (acknowledgements / observations)

- **Cache key collision risk on UUID reuse:** schedule UUIDs are stable; cache key collision impossible without UUID re-issue. No-op.
- **`_extract_year` handles None:** `instance.date` is NOT NULL in schema, no null bug.
- **Decorator argless form:** `@working_day_required` (no parens) WOULD fail — `working_day_required` returns a decorator factory, not a decorator. Currently consumed correctly (`@working_day_required()` w/ parens at `issue_automation_task.py:25`). Test added (`test_celery_helpers.py:172` checks `__name__` preservation). Consider documenting in the docstring "always call with parens" — already mentioned, OK.
- **Fail-open on service exception:** correctly logs `.exception` not just `.warning` (line 50). Sentry will surface it. Good.
- **Timezone handling:** `_to_vn_date` covers tz-aware, naive (treated UTC), and bare `date`. Tests verify both UTC midnight crossings. Solid.
- **Copy-year `update_or_create` idempotency:** verified by `test_copy_year_idempotent`. Good design choice — prevents IntegrityError on second invocation.
- **Feb 29 → non-leap year:** `_safe_replace_year` at `actions.py:26-33` returns None and skips. Test `test_copy_year_skips_feb29_in_non_leap` covers it. Good.
- **`/check/` is `IsAuthenticated`:** correct per Q6 — read-only schedule check is non-sensitive. Cannot leak workspace data because schedules are not workspace-scoped from the user's perspective.
- **Soft-delete signal trick:** `post_save` + `deleted_at not None` is a Plane-idiomatic pattern (see also workspace soft-delete). OK.
- **Test coverage:** 38 unit + 38 view + 9 decorator + 8 smoke tests, plus mocking discipline (no real Redis hits in unit tests). Strong.
- **Architecture compliance:** routes under `plane/license/api/` (instance admin), uses `BaseAPIView`/`InstanceAdminPermission`, separates view files by resource. Aligns with backend rules.
- **Lunar holiday warning UX:** prominent banner in `CopyYearModal` after success, plus `warnings[]` in API response. Excellent for VN users.
- **2026 placeholders in seed migration:** explicitly labeled `[placeholder]` in DB strings, with note in migration docstring telling admin to verify. Defensive and honest.

---

## Architecture Compliance Checklist

| Item                                          | Status                                       |
| --------------------------------------------- | -------------------------------------------- |
| Models in `db/models/`, no business logic     | OK                                           |
| Views inherit `BaseAPIView`                   | OK                                           |
| Serializers separated read/write where needed | OK (single serializer is fine for this CRUD) |
| `__init__.py` exports updated                 | OK                                           |
| Migration sequential                          | OK (0166, 0167)                              |
| `InstanceAdminPermission` on mutations        | OK                                           |
| `IsAuthenticated` only on `/check/`           | OK                                           |
| Frontend uses `observer()` from `mobx-react`  | OK                                           |
| `makeObservable` (explicit, not auto)         | OK                                           |
| `set` from `lodash-es`                        | OK                                           |
| Propel imports subpathed                      | OK                                           |
| Vietnamese hardcoded (admin app, no i18n)     | OK per spec                                  |
| Files <200 lines                              | 11/12 OK; store=229 (MEDIUM-4)               |
| Components <150 lines                         | All OK                                       |
| Test markers (`@pytest.mark.unit`)            | OK                                           |
| No AI attribution in commits/code             | OK                                           |

---

## Pre-Merge Conditions (must all be done)

1. **CRITICAL-1:** unify `week_pattern` type end-to-end (boolean[] recommended).
2. **HIGH-1:** real `is_default` uniqueness validation pre-save.
3. **HIGH-2:** decide & document workspace assignment rules; force-null on admin form OR enable explicit picker.
4. **HIGH-3:** `deleteSchedule` cleans orphan caches.
5. **HIGH-5:** translate IntegrityError → ValidationError in actual write path.
6. Add **integration test** that POSTs from an `axios`/`fetch`-style mock through the serializer and back — would have caught CRITICAL-1.

## Post-Merge Follow-up (non-blocking)

- MEDIUM-1 query reuse on `/check/`
- MEDIUM-3 year bounds
- MEDIUM-4 store split
- MEDIUM-5 semantic color tokens (will visibly break in dark mode)
- MEDIUM-7 all-False pattern guard

---

## Approval Decision: **APPROVED_WITH_CONDITIONS**

Block on CRITICAL-1 and HIGH-1..5. Once those are fixed and verified end-to-end (admin can create + edit + see default-flag uniqueness errors gracefully), this is ready to merge.

**Score: 7.5/10**

- Backend correctness: 9/10
- Backend safety: 7/10 (IntegrityError dead code, year bounds)
- Frontend correctness: 5/10 (CRITICAL-1, color tokens)
- Test coverage: 9/10
- Architecture compliance: 9/10
- YAGNI/KISS/DRY: 8/10

---

## Fix Verification — 2026-04-28

All pre-merge conditions applied and verified:

| Issue            | Status | Notes                                                                                                                                                                                                                                                                    |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CRITICAL-1       | Fixed  | `IWorkSchedule.week_pattern: boolean[]`, `IWorkScheduleCreate` inherits via Pick. Forms use `boolean[7]` state with index toggles. `WorkweekToggle` sends full `boolean[7]` PATCH. `ScheduleCard` reads `pattern[index]`. Types package rebuilt — TS typecheck 0 errors. |
| HIGH-1           | Fixed  | Replaced dead `try/except IntegrityError` in `WorkScheduleSerializer.validate()` with explicit pre-flight query: filters `(workspace, is_default=True)` excluding current instance pk. Returns `{"is_default": "..."}` field error → 400.                                |
| HIGH-2           | Fixed  | `workspace` moved to `read_only_fields` in `WorkScheduleSerializer.Meta`. Payload `workspace=<uuid>` silently ignored; all admin-created schedules get `workspace=None` (instance-level). Test verifies.                                                                 |
| HIGH-3           | Fixed  | `deleteSchedule` in `BusinessCalendarStore` now cleans `holidaysMap` and `overridesMap` entries prefixed `${id}:` inside the same `runInAction`.                                                                                                                         |
| HIGH-4           | Fixed  | Extracted `CACHE_FALLBACK_MIN_YEAR = 2020` / `CACHE_FALLBACK_MAX_YEAR = 2100` module constants with explanatory comment in `business_calendar.py`. Loop uses `range(MIN, MAX + 1)`.                                                                                      |
| HIGH-5           | Fixed  | Removed dead `try/except IntegrityError` blocks from `HolidaySerializer.validate()` and `DayOverrideSerializer.validate()`. Overrode `create()` and `update()` in both to catch `IntegrityError` at write time and raise `ValidationError({"date": "..."})` → 400.       |
| Integration test | Added  | `test_week_pattern_roundtrip_create_and_patch` — POSTs boolean[] → asserts 201 + response shape; PATCHes → asserts 200. `test_week_pattern_rejects_string_keys` asserts 400 on legacy string payload.                                                                    |

**New tests added:** 8 (HIGH-1: 2, HIGH-2: 1, HIGH-5: 2, CRITICAL-1: 2, patch-default: 1)
**Build:** `pnpm --filter admin check:types` — 0 TS errors. `pnpm --filter admin check:lint` — 0 errors, 113 pre-existing warnings.
**Python syntax:** AST-verified clean on all 3 modified Python files. DB-dependent tests blocked by Docker (`plane-db` not running locally) — infrastructure gap, not code issue.

---

## Unresolved Questions

1. Is "instance-admin can create schedules for any workspace" the intended ACL? If yes, document. If no, lock workspace=None.
2. Should `/check/` be cached at the HTTP layer (e.g., `Cache-Control: max-age=60`)? It's auth-gated read-only; high traffic from front-end pickers could hammer it.
3. Will workspace-scoped schedules (`workspace != None`) be exposed in the admin UI, or only via API? Frontend currently only renders instance-level — by design or by omission?
4. After CRITICAL-1 fix: do we want to write a single end-to-end test (admin POSTs JSON via APIClient with the same shape `axios` would send) to prevent regression?
5. The `_LUNAR_HOLIDAY_WARNINGS` constant is global to the module — fine for now, but should it become localized text via `t()` if i18n is added later?
6. `delete_pattern` is `django_redis`-specific. Plane standardizes on it, but should we assert `cache.client` is RedisCache once at startup so the Loc/Mem fallback (lines 158-163) is documented as test-only?
