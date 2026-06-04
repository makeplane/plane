---
phase: 1
title: "GD Resolution Foundation"
status: completed
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: GD Resolution Foundation

## Overview

Establish the single source of truth for "who is the GD" so workspace-owner logic (Phase 2) can default to it. GD = the active staff whose job grade is `GD` (top grade in `job-positions-template.xlsx`). Job-position data must exist first (existing bulk import).

## Key Insights

- `StaffProfile.position` and `StaffProfile.job_grade` are free `CharField`s (`apps/api/plane/db/models/staff.py:39-40`). No DB constraint forces any particular value.
- `StaffProfile.user` is a FK to `User` (`staff.py:20-24`, plural `related_name="staff_profiles"` → one User may hold >1 staff row); `employment_status` choices include `active` (`staff.py:50-54`).
- `StaffProfile` is instance-level (no workspace FK), so the GD is a single instance-wide person — matches "GD là người cao nhất".

### ⚠️ Data-source correction (red-team, grep-verified — blocking)

- **`StaffProfile.job_grade` is set ONLY by the staff importer/editor, NOT the job-positions template.** `job_position_bulk_import.py:94,151` writes only the `JobGrade`/`JobPosition` lookup tables; it never touches `StaffProfile`. `StaffProfile.job_grade` is written at `license/api/views/staff.py:545,596` (single edit) and `:330,356` (staff bulk import). The original runbook step ("upload job-positions template so a staff carries grade GD") is a **no-op for the resolver** — corrected below.
- **The repo seed proves "GD" is not the stored value today.** `bgtasks/seed_department_staff_data.py:145` stores the General Director with `position="General Director"` and `job_grade="Director"` (a grade shared by ~8 rows). So on seed-shaped data, `job_grade__iexact="GD"` matches **zero rows**. Decision (user): keep `job_grade=="GD"` as the contract, but treat real Shinhan staff data as authoritative and **confirm before go-live** that the GD's staff record literally carries grade code `"GD"` (Phase 7 hard gate). If prod also stores the grade _name_, the import/edit data must be corrected to set `job_grade="GD"` on the GD's staff row.

## Requirements

- Functional: a deterministic function returns the GD `User` or `None`.
- Non-functional: O(1) query, `select_related("user")`, soft-delete aware.

## Architecture

```
get_general_director_user() -> User | None
  qs = (
      StaffProfile.objects.filter(
          job_grade__iexact="GD",
          employment_status="active",
          user__isnull=False,
          deleted_at__isnull=True,
      )
      .select_related("user")
  )
  user_ids = set(qs.values_list("user_id", flat=True))  # dedup: one User may hold >1 staff row
  if len(user_ids) == 0:
      return None
  if len(user_ids) > 1:
      raise AmbiguousGeneralDirector(user_ids)
  return qs.first().user
```

- **Ambiguity is an error, not a guess:** the resolver branches on the count of **distinct GD users** (not rows). >1 distinct user → raise `AmbiguousGeneralDirector` (callers surface 400 "ambiguous GD — fix staff data"). Do NOT use `.first()` as the resolution — that silently picks one and contradicts this rule. (One person carrying two staff rows is de-duped on `user_id`, so it is not falsely flagged ambiguous.)
- Zero GD → return `None` (callers handle: single-create picker/400, bulk fail-fast).
- Constant `GD_JOB_GRADE = "GD"` lives next to the resolver so Phase 2/3 import one symbol.

## Related Code Files

- Create: `apps/api/plane/utils/general_director.py` (resolver + `GD_JOB_GRADE`).
- Create: `apps/api/plane/tests/unit/test_general_director.py`.
- Read for context: `apps/api/plane/db/models/staff.py`, `apps/api/plane/license/api/views/job_position_bulk_import.py`.

## Implementation Steps (TDD)

1. **Test first** — `test_general_director.py`:
   - returns the user when one active `job_grade="GD"` staff exists.
   - returns `None` when no GD staff.
   - ignores resigned/suspended GD staff (`employment_status != active`).
   - case-insensitive grade match (`gd`, `GD`).
   - multiple active GD → raises `AmbiguousGeneralDirector` (NOT silent pick).
2. Run tests → confirm they fail (no module).
3. Implement `general_director.py` resolver + `GD_JOB_GRADE` constant per Architecture.
4. Run `cd apps/api && python run_tests.py -u` → green.
5. **Ops step (manual, documented) — CORRECTED:** ensure the GD's **staff record** carries `job_grade="GD"` via the **staff** import/edit path (`license/api/views/staff.py` single edit or staff bulk import) — NOT the job-positions template (which only seeds the `JobGrade`/`JobPosition` lookup tables and never sets `StaffProfile.job_grade`). Optionally seed the `JobGrade` lookup too for UI consistency, but the resolver reads `StaffProfile.job_grade`. Not part of code; note in Phase 7 runbook as a blocking go-live gate.

## Todo List

- [x] Write failing unit tests for GD resolver (10 tests, confirmed failing on missing module)
- [x] Implement `general_director.py` resolver + constant
- [x] Unit tests green (10/10 pass)
- [ ] Document staff-import grade prerequisite (deferred to Phase 7 runbook per plan)

## Success Criteria

- [ ] `get_general_director_user()` returns correct user / `None` across all test cases
- [ ] `python run_tests.py -u` passes for the new test module
- [ ] No new query exceeds 1 DB hit

## Risk Assessment

- **Staff `job_grade` stores a grade NAME, not the code "GD"** (empirically true of the repo seed — `seed_department_staff_data.py:145` → `"Director"`). Mitigated by: (a) the corrected runbook step setting `job_grade="GD"` on the GD's staff row via the staff path; (b) Phase 7 blocking gate that verifies real data resolves a single GD before go-live. `__iexact` only normalizes case, not name-vs-code — it does NOT save us if the value is "General Director"/"Director".
- **Multiple distinct GD users** → resolver raises `AmbiguousGeneralDirector` (data-entry bug, surfaced as 400, not silently picked).
- **No GD in data**: returns `None` → Phase 2 handles (picker / 400). Not a failure here.

## Security Considerations

- Read-only; no auth surface. Resolver must never leak staff of inactive status.

## Next Steps

- Phase 2 consumes `get_general_director_user()` for owner defaulting.
