# Code Review: Default Labels for Work Items

**Date:** 2026-03-03
**Branch:** ngoc-feat/work-items
**Reviewer:** code-reviewer

---

## Scope

- `apps/api/plane/db/models/label.py` — added `DEFAULT_LABELS` constant
- `apps/api/plane/db/models/__init__.py` — export `DEFAULT_LABELS`
- `apps/api/plane/app/views/project/base.py` — seed labels on project creation
- `apps/api/plane/db/management/commands/seed_department_staff.py` — `_seed_labels()` method
- `apps/api/plane/db/migrations/0128_seed_default_labels_existing_projects.py` — data migration backfill
- `apps/api/plane/seeds/data/labels.json` — updated seed file
- `apps/api/plane/seeds/data/issues.json` — cleared stale label refs

LOC changed: ~80 (net additions across 7 files)

---

## Overall Assessment

Solid implementation. Correctly mirrors the `DEFAULT_STATES` pattern, all JSON files are valid, idempotency is properly handled via `ignore_conflicts=True`, and the migration is correctly self-contained. Three issues worth addressing, none critical.

**Score: 8 / 10**

---

## Critical Issues

None.

---

## High Priority

### H1 — `Label.save()` auto-sort_order logic is silently bypassed by `bulk_create`

`Label.save()` (label.py lines 46–54) auto-computes `sort_order = max_existing + 10000` when adding a new record. `bulk_create` does **not** call `save()`, so the explicit `sort_order` values in `DEFAULT_LABELS` are used directly. This is the **intended** behavior here (we want deterministic ordering), but:

- If a user later adds a label manually via the UI/API, the auto-increment starts from the max of the explicit values (e.g., 135535 + 10000 = 145535). This is fine.
- However, if someone calls `Label(...).save()` directly with one of the DEFAULT_LABELS names on the same project, the sort_order will be recalculated and differ from the bulk_create value. Low risk but worth a comment.

**Recommendation:** Add a brief comment in `DEFAULT_LABELS` noting sort_orders are used directly (bypassing save-time auto-calc) so future maintainers don't expect save() behavior.

---

## Medium Priority

### M1 — Asymmetry: `State.objects.bulk_create` has no `ignore_conflicts=True` but `Label.objects.bulk_create` does

In `base.py` create():

- `State.objects.bulk_create(...)` — no `ignore_conflicts` (lines 278–292)
- `Label.objects.bulk_create(..., ignore_conflicts=True)` (lines 294–307)

This asymmetry is safe (State creation path only runs on new projects which can't have states yet), but it's inconsistent and could cause confusion. The Label version is strictly safer and should be the standard pattern for all default-seeding bulk_creates.

### M2 — `updated_by` set in seed command but not in view `create()`

In `seed_department_staff.py` `_seed_labels()` (line 214): `updated_by=admin` is passed.
In `base.py` `create()` (lines 294–306): `updated_by` is not set.

`updated_by` is nullable (mixin.py line 40) and BaseModel.save() intentionally leaves it `None` on creation (base.py line 38–39), so this is not a bug. But the seed command is setting `updated_by` on a newly-created record which is semantically incorrect (updated_by should only be set on updates, per base.py save logic). The view is actually correct; the seed command has a minor semantic inconsistency.

**Recommendation:** Remove `updated_by=admin` from `_seed_labels()` in `seed_department_staff.py`.

### M3 — Migration does not set `created_by` for backfilled labels

In `0128_seed_default_labels_existing_projects.py` (lines 23–32), the migration creates labels without `created_by`. This is intentional (migration context has no request user) and `created_by` is nullable, so it is safe. The resulting `NULL` audit trail for backfilled labels is acceptable but worth documenting as a known limitation in the migration comment.

---

## Low Priority

### L1 — `DEFAULT_LABELS` placement in `__init__.py` is inconsistent with `DEFAULT_STATES`

`DEFAULT_STATES` is imported inline with its model on line 64: `from .state import State, StateGroup, DEFAULT_STATES`.
`DEFAULT_LABELS` is imported at line 86 (a separate appended block, later than the main alphabetical model imports).

Minor style issue only — no functional impact.

### L2 — `labels.json` seed file uses sequential integer IDs (1–8) tied to `project_id: 1`

The seed file is fixture-style with hardcoded IDs. If the fixture loader is used on a database that already has labels, this could conflict. However this appears to be a test seed used outside the main migration path, so risk is low.

---

## Edge Cases Identified

1. **Re-running `seed_department_staff` command on existing seeded projects** — `ignore_conflicts=True` on `_seed_labels()` correctly handles this; no duplicates created. Count reported may be 0 on re-run (correct behavior, not a bug).

2. **Project creation race condition** — if two concurrent requests create the same project (extremely unlikely given `ProjectIdentifier` uniqueness), both would attempt `Label.objects.bulk_create`. The second would silently skip via `ignore_conflicts=True`. Correct behavior.

3. **Soft-deleted labels with same name** — `UniqueConstraint` on labels uses `condition=Q(project__isnull=False, deleted_at__isnull=True)`. If a default label is soft-deleted and then a new project is created, the new project's label insert would succeed (different project FK). If the same project's label is soft-deleted and the seed runs again (not a normal flow), `ignore_conflicts=True` would silently skip re-creation since the soft-deleted row still holds the unique slot. This edge case is unlikely in practice but could cause missing labels after accidental deletion.

4. **Migration dependency** — `0128` depends on `0127_drop_analytics_dashboard_tables` which exists. Chain is valid.

5. **Historical model in migration** — `apps.get_model("db", "Label")` returns historical model without custom `save()` logic. `bulk_create` with historical model is safe and correct.

---

## Positive Observations

- Migration is properly self-contained (inlined `_DEFAULT_LABELS`, no app model import). Follows Django migration best practices.
- `migrations.RunPython.noop` used as reverse — correct since data backfill reversal is a no-op.
- Pattern consistency with `DEFAULT_STATES` is well-executed: same structure, same placement in model file, same export pattern.
- Both JSON files are syntactically valid.
- All stale `"labels": [2]` references removed from `issues.json` — clean cleanup.
- `ignore_conflicts=True` correctly relies on the `unique_project_name_when_not_deleted` DB constraint for idempotency.

---

## Recommended Actions

1. **(Low)** Remove `updated_by=admin` from `_seed_labels()` in `seed_department_staff.py` — semantically incorrect on creation.
2. **(Low)** Add comment to `0128` migration noting `created_by=NULL` on backfilled labels is intentional.
3. **(Low)** Add `ignore_conflicts=True` to `State.objects.bulk_create` in `base.py` for consistency (does not change behavior for new projects, but makes intent explicit).
4. **(Info)** Add brief comment in `label.py` near `DEFAULT_LABELS` noting bulk_create bypasses `save()` auto sort_order logic.

---

## Unresolved Questions

- Is `labels.json` fixture loader still used in CI or local setup scripts? If yes, the hardcoded `"id"` fields may conflict with existing records in a non-empty test DB.
- Is there an API or admin path to re-seed labels for projects created before the migration (other than running the migration)? The migration covers backfill but there's no management command equivalent for a single project.
