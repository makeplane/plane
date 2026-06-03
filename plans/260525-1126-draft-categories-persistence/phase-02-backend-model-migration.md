---
phase: 2
title: "Backend Model + Migration (GREEN: persistence + default state)"
status: pending
priority: P1
effort: "1.5h"
dependencies: [1]
---

# Phase 2: Backend Model + Migration

## Overview

GREEN-phase for the persistence + default-state-on-create test cases written in Phase 1. Adds 2 nullable FKs to `DraftIssue`; switches default-state lookup to backlog group on create when `state` is None.

## Requirements

**Functional:**

- `DraftIssue.main_task_category` FK → `MainTaskCategory`, `null=True, blank=True, on_delete=SET_NULL, related_name="draft_issues"`
- `DraftIssue.sub_task_category` FK → `SubTaskCategory`, same nullability + on_delete + reverse name
- `DraftIssue.save()` on create with `state=None` → pick `State.objects.filter(project=self.project, group="backlog").first()` (fallback to `default=True` if no backlog state). Existing assignment when state provided is preserved.

**Non-functional:**

- Migration named `XXXX_draft_issue_categories.py` (no plan refs per `review-audit-self-decision.md`).
- Migration must `--check` cleanly after `makemigrations`.

## Architecture

`MainTaskCategory` / `SubTaskCategory` already exist on `Issue` model (verified via 270303-0244 plan). Mirror the FK definition. `on_delete=SET_NULL` preserves draft when a category is deleted (consistent with how Issue handles it — verify by reading existing FK).

## Related Code Files

- Modify: `apps/api/plane/db/models/draft.py` (add 2 FKs; tweak save() default-state branch)
- Create: `apps/api/plane/db/migrations/XXXX_draft_issue_categories.py`
- Read for context: `apps/api/plane/db/models/issue.py` (mirror category FK signatures), `apps/api/plane/db/models/state.py`

## Implementation Steps

1. Grep `main_task_category` in `db/models/issue.py` — copy FK signature verbatim (on_delete, related_name pattern, db_index).
2. Add 2 FK fields to `DraftIssue`. Keep `related_name="draft_issues"` (workspace-unique).
3. Modify `DraftIssue.save()` block at lines 83-97 (per V1 — drop `is_system=True`):
   ```python
   if self._state.adding and self.state is None:
       self.state = State.objects.filter(
           ~Q(is_triage=True),
           project=self.project,
           group="backlog",
       ).first() or State.objects.filter(
           ~Q(is_triage=True),
           project=self.project,
           default=True,
       ).first()
   ```
   Validator (`issue.py:228`) only checks `state.group` — matching any backlog state is sufficient. Fallback to `default=True` preserves prior behavior for projects with no backlog state.
   <!-- Updated: Validation Session 1 - V1: dropped is_system=True filter -->
4. `cd apps/api && python manage.py makemigrations` → verify single migration file generated.
5. Inspect generated migration — rename file to descriptive slug if needed, ensure no plan refs leak into filename/comments.
6. Run `python run_tests.py -c -v -k draft_categories` — persistence + default-state tests should now pass. Move-to-issue test still fails (Phase 3).

## Success Criteria

- [ ] `DraftIssue` model has both FKs declared
- [ ] Migration generated, descriptive filename, applies cleanly on `--reuse-db --create-db`
- [ ] Phase 1's persistence test passes
- [ ] Phase 1's default-state test passes
- [ ] No regression on existing draft tests (`run_tests.py -c -k draft`)

## Risk Assessment

- **Risk:** Project has no `group=backlog` state at all (rare).
  - **Mitigation:** Fallback to `default=True` lookup preserves prior behavior.
- **Risk:** Migration conflicts with concurrent branch migrations.
  - **Mitigation:** Generate against latest `preview`; rebase before merge.
- **Risk:** `on_delete=CASCADE` on category — orphan drafts on category delete.
  - **Mitigation:** Verified spec is `SET_NULL` matching Issue's behavior.
