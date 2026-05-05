---
title: "Revert Default Labels"
description: "Remove DEFAULT_LABELS feature — undo all changes from plan 260303-2042-default-labels"
status: active
priority: P2
effort: 1h
branch: ngoc-feat/workspaces
tags: [labels, revert]
created: 2026-03-11
---

# Revert Default Labels

## Goal

Remove the default labels feature entirely. Return code to the state before `260303-2042-default-labels` was implemented.

## Scope of Changes

| File                                                                         | Action                                                           |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/api/plane/db/models/label.py`                                          | Remove `DEFAULT_LABELS` constant                                 |
| `apps/api/plane/db/models/__init__.py`                                       | Remove `DEFAULT_LABELS` from import                              |
| `apps/api/plane/app/views/project/base.py`                                   | Remove Label bulk_create + import                                |
| `apps/api/plane/seeds/data/labels.json`                                      | Restore original 2 labels (admin, concepts)                      |
| `apps/api/plane/seeds/data/issues.json`                                      | Restore `"labels": [2]` in issue id=2                            |
| `apps/api/plane/db/management/commands/seed_department_staff.py`             | Remove `_seed_labels()` + call                                   |
| `apps/api/plane/db/migrations/0128_seed_default_labels_existing_projects.py` | Delete migration file                                            |
| `apps/api/plane/db/migrations/0134_add_biweekly_default_label.py`            | Delete migration file                                            |
| `apps/api/plane/db/migrations/0136_remove_default_labels_from_projects.py`   | **NEW** — reverse data migration to delete seeded labels from DB |

## Migration Strategy

Migrations 0128 and 0134 were **data-only** (no schema changes). Since they have been applied to the DB:

1. Create new migration `0136` that **deletes** all labels with names matching the seeded defaults
2. Delete migration files 0128 and 0134 (code cleanup — they're in our private fork, not upstream)

The 0136 migration depends on `0135_rename_backlog_state_display`.

## Original State (restore targets)

**labels.json** (original):

```json
[
  { "id": 1, "name": "admin", "color": "#0693e3", "sort_order": 85535, "project_id": 1 },
  { "id": 2, "name": "concepts", "color": "#9900ef", "sort_order": 95535, "project_id": 1 }
]
```

**issues.json** (issue id=2 had labels restored):

- `"labels": [2]` for issue id=2

## Validation Log

### Session 1 — 2026-03-11

**Trigger:** Initial plan creation — validating before implementation.
**Questions asked:** 3

#### Questions & Answers

1. **[Risk]** Migration 0136 deletes labels by name only (`name__in=[...]`). This could accidentally delete user-created labels with the same names. Should we scope the deletion more narrowly?
   - Options: Name only (as planned) | Name + sort_order | Name + soft-delete check
   - **Answer:** Name only (as planned)
   - **Rationale:** Simple and matches exactly what was seeded. Acceptable risk since label names like "Daily"/"Weekly" are project-specific and unlikely to conflict in Shinhan's DB.

2. **[Architecture]** After deleting migration files 0128 and 0134, ghost records remain in `django_migrations` table. How should we handle this?
   - Options: Ignore | Add fake-reverse RunSQL in 0136 | Manual DB cleanup step
   - **Answer:** User unsure — recommended cleanest approach: add `RunSQL` in migration 0136 to delete ghost rows from `django_migrations` table.
   - **Rationale:** Keeping cleanup in the migration itself is atomic, self-documented, and avoids manual DB intervention. Standard Django pattern for removing ghost migrations.

3. **[Assumptions]** The plan notes Label import in project/base.py should be removed "if no longer used anywhere". Should we verify this before implementation or just assume safe to remove?
   - Options: Verify during implementation | Keep import unconditionally
   - **Answer:** Verify during implementation
   - **Rationale:** Avoids breaking base.py if Label is used elsewhere in the file (e.g. in other view methods).

#### Confirmed Decisions

- Migration 0136 delete scope: name-only filter — acceptable risk
- Ghost migration cleanup: add `RunSQL` in 0136 to remove 0128 and 0134 rows from `django_migrations`
- Label import: verify usage in base.py before removing

#### Action Items

- [ ] Update migration 0136 to include RunSQL for ghost migration cleanup

#### Impact on Phases

- Phase 1: Extend Step 7 (migration 0136) to add RunSQL that removes rows for `0128_seed_default_labels_existing_projects` and `0134_add_biweekly_default_label` from `django_migrations`

### Session 2 — 2026-03-11

**Trigger:** Re-validation before implementation.
**Questions asked:** 3

#### Questions & Answers

1. **[Assumptions]** Step 6 says to remove `Label` from seed_department_staff.py imports 'if also only used in \_seed_labels'. Should we verify this during implementation or remove unconditionally?
   - Options: Remove unconditionally (Recommended) | Verify during implementation
   - **Answer:** Verify during implementation
   - **Rationale:** Grep for Label usage in seed_department_staff.py first — consistent with base.py approach, avoids breaking other potential usages.

2. **[Architecture]** The verification step only runs `python manage.py check`. Should we also run `python manage.py migrate` to confirm migration 0136 applies cleanly?
   - Options: Yes, also run migrate (Recommended) | No, check is enough
   - **Answer:** Yes, also run migrate
   - **Rationale:** Running migrate confirms 0136 executes without errors and ghost rows are actually removed from django_migrations. More reliable than check alone.

3. **[Assumptions]** The plan deletes 0128/0134 files (Step 8) after creating 0136 (Step 7). Is this step order correct?
   - Options: Delete after creating 0136 (Recommended) | Delete before creating 0136
   - **Answer:** Delete after creating 0136
   - **Rationale:** Creating 0136 first ensures Django can resolve the dependency chain (0136 → 0135) before the old files are removed.

#### Confirmed Decisions

- Label import in seed_department_staff.py: verify usage before removing
- Verification: run both `manage.py check` AND `manage.py migrate`
- Step order: create 0136 first, then delete 0128/0134

#### Action Items

- [ ] Update Step 6 to verify Label usage before removing import
- [ ] Update Step 9 to include `python manage.py migrate` after check

#### Impact on Phases

- Phase 1: Step 6 — add grep check before removing Label import
- Phase 1: Step 9 — add `python manage.py migrate` to verification commands

### Session 3 — 2026-03-11

**Trigger:** Re-validation before implementation.
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** Should we do a global grep for `DEFAULT_LABELS` and `_seed_labels` across the entire codebase before implementing, to ensure no files beyond the plan's scope reference them?
   - Options: Yes, grep first (Recommended) | No, trust the plan
   - **Answer:** Yes, grep first
   - **Rationale:** A pre-implementation grep ensures no missed references are left dangling after the revert, without cost since it's a quick search.

2. **[Assumptions]** The Todo List at the bottom of Phase 1 is missing `python manage.py migrate` as a final verification step (Session 2 added it to Step 9 but the Todo List was not updated). Should we fix this?
   - Options: Yes, add it (Recommended) | No, Step 9 is enough
   - **Answer:** Yes, add it
   - **Rationale:** Todo List should match Step 9 so the post-phase checklist is complete and actionable.

3. **[Architecture]** After 0136 deletes ghost rows, there's an intentional sequence gap (0128→0134 deleted). Should a comment in 0136 document this?
   - Options: Yes, add a comment | No, keep it minimal
   - **Answer:** Yes, add a comment
   - **Rationale:** Helps future maintainers understand the gap is intentional, not an error in migration numbering.

#### Confirmed Decisions

- Pre-implementation: grep for `DEFAULT_LABELS` and `_seed_labels` before any code changes
- Todo List: add `python manage.py migrate` as final item
- Migration 0136: add header comment explaining 0128/0134 were intentionally deleted

#### Action Items

- [ ] Add Step 0 (grep check) to Phase 1 before Step 1
- [ ] Add `migrate` to Todo List in Phase 1
- [ ] Expand 0136 migration header comment to explain the intentional sequence gap

#### Impact on Phases

- Phase 1: Add Step 0 — grep for `DEFAULT_LABELS` and `_seed_labels` to confirm full scope
- Phase 1: Todo List — add `Run python manage.py migrate`
- Phase 1: Step 7 migration code — expand comment to note 0128/0134 deletion is intentional

### Session 4 — 2026-03-11

**Trigger:** Re-validation before implementation.
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** Plan 260303-2042-default-labels was purely backend. Should we also grep the frontend (apps/web) for any DEFAULT_LABELS or label-seeding references before implementing, to confirm no frontend cleanup is needed?
   - Options: Yes, grep frontend too (Recommended) | No, backend only
   - **Answer:** Yes, grep frontend too
   - **Rationale:** A quick frontend grep costs nothing and rules out any UI references that could be left dangling after the backend revert.

2. **[Checklist]** The Post-Phase Checklist is missing `python manage.py migrate` as a final item (it's in the Todo List and Step 9 but not the checklist). Should we add it for consistency?
   - Options: Yes, add to checklist (Recommended) | No, leave as-is
   - **Answer:** Yes, add to checklist
   - **Rationale:** Post-Phase Checklist and Todo List should be in sync so post-implementation verification is complete.

3. **[Verification]** After migration 0136 runs, should we add a DB count assertion to the verification step?
   - Options: No, migrate output is enough | Yes, add a quick SQL check (Recommended)
   - **Answer:** Yes, add a quick SQL check
   - **Rationale:** Explicit count assertion confirms labels are actually deleted, not just that the migration ran without errors.

#### Confirmed Decisions

- Frontend grep: extend Step 0 to also grep apps/web for DEFAULT_LABELS
- Post-Phase Checklist: add `python manage.py migrate` item
- Verification: add shell count assertion after migrate in Step 9

#### Action Items

- [ ] Extend Step 0 grep to include apps/web directory
- [ ] Add `python manage.py migrate` to Post-Phase Checklist
- [ ] Add DB count assertion to Step 9

#### Impact on Phases

- Phase 1: Step 0 — add `grep -r "DEFAULT_LABELS" apps/web/` to scope check
- Phase 1: Post-Phase Checklist — add `python manage.py migrate` passes
- Phase 1: Step 9 — add shell one-liner to assert 0 seeded labels remain

### Session 5 — 2026-03-11

**Trigger:** Re-validation before implementation.
**Questions asked:** 3

#### Questions & Answers

1. **[Risk]** The Label model uses SoftDeletionManager. Migration 0136's `Label.objects.filter(name__in=...).delete()` will likely soft-delete (sets deleted_at), not hard-delete. Seeded labels would remain in the DB. How should the migration delete them?
   - Options: Hard delete via raw SQL (Recommended) | Use update() to set deleted_at | Keep as-is (soft delete via .delete())
   - **Answer:** Hard delete via raw SQL
   - **Rationale:** Using raw SQL `DELETE FROM db_label WHERE name IN (...)` bypasses SoftDeletionManager entirely, ensuring labels are physically removed. ORM `.delete()` on a SoftDeletionModel sets `deleted_at` instead of issuing a real DELETE, so seeded labels would remain in the table.

2. **[Verification]** The DB count assertion uses `Label.objects.filter(name__in=names).count()`. With SoftDeletionManager, this only counts active (non-deleted) records — soft-deleted labels would show count=0 even if physically still in the DB. Should the assertion use raw SQL?
   - Options: Use raw SQL count (Recommended) | ORM count is sufficient
   - **Answer:** Use raw SQL count
   - **Rationale:** `SELECT COUNT(*) FROM db_label WHERE name IN (...)` checks physical rows regardless of deleted_at, providing definitive proof of deletion rather than just active-record absence.

3. **[Architecture]** Is there a risk another developer creates migration 0136 concurrently (causing a number collision)?
   - Options: Low risk — proceed with 0136 (Recommended) | Re-verify latest migration at implementation time
   - **Answer:** Low risk — proceed with 0136
   - **Rationale:** Private fork (shbvn/plane) on isolated branch ngoc-feat/workspaces — concurrent migration creation is unlikely.

#### Confirmed Decisions

- Migration 0136 delete method: raw SQL DELETE to bypass SoftDeletionManager
- DB count assertion: raw SQL SELECT COUNT(\*) for physical row verification
- Migration number: proceed with 0136, low collision risk

#### Action Items

- [ ] Replace `Label.objects.filter(...).delete()` in 0136 with raw SQL RunSQL DELETE
- [ ] Update Step 9 DB assertion to use raw SQL count

#### Impact on Phases

- Phase 1: Step 7 (migration 0136) — replace RunPython ORM delete with RunSQL hard delete
- Phase 1: Step 9 — replace ORM assertion with raw SQL count query

---

## Phases

| #   | Phase                                              | Status | File                                            |
| --- | -------------------------------------------------- | ------ | ----------------------------------------------- |
| 1   | Revert code + seed data + create reverse migration | todo   | [phase-01](./phase-01-revert-default-labels.md) |
