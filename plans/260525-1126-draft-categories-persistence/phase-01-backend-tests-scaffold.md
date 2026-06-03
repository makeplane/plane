---
phase: 1
title: "Backend Tests Scaffold (RED)"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Backend Tests Scaffold (RED)

## Overview

TDD red-phase. Write failing tests covering the 3 backend behaviors before implementing. All tests MUST fail at end of this phase (proves they exercise the unfixed code paths).

## Requirements

**Functional:**

- Test: POST `/api/workspaces/<slug>/draft-issues/` with `main_task_category_id` + `sub_task_category_id` → response echoes both, DB row persists both.
- Test: POST draft with no `state` → resulting draft's state belongs to `group=backlog`.
- Test: POST `/api/workspaces/<slug>/draft-issues/<id>/move-to-issue/` for a draft with stored categories but no categories in request body → succeeds; created Issue has the draft's categories.
- Test: POST move-to-issue for draft with NO categories + backlog state → succeeds (validator skips category check).

**Non-functional:**

- Use existing fixtures: `session_client`, `create_user`, `create_project`. Factory for DraftIssue if not present → add to `plane/tests/factories.py`.

## Architecture

Tests live in `apps/api/plane/tests/contract/test_draft_categories.py`. Marked `@pytest.mark.contract` (per `backend-testing.md`). Use `reverse()` for URL resolution. Direct DB asserts via `DraftIssue.objects.get(...)`.

## Related Code Files

- Create: `apps/api/plane/tests/contract/test_draft_categories.py`
- Modify (if factory missing): `apps/api/plane/tests/factories.py`
- Read for context: `apps/api/plane/tests/conftest.py`, `apps/api/plane/app/views/workspace/draft.py`, `apps/api/plane/db/models/draft.py`

## Implementation Steps

1. Read `plane/tests/conftest.py` to confirm fixture names + signatures.
2. Read `plane/tests/factories.py` — add `DraftIssueFactory`, `MainTaskCategoryFactory`, `SubTaskCategoryFactory` inline (per V4 — none verified to exist; bundle in this phase, no separate scaffolding phase).
<!-- Updated: Validation Session 1 - V4: factories added inline in this phase -->
3. Write `test_draft_categories.py` with 4 test classes (one per behavior).
4. Run `cd apps/api && python run_tests.py -c -v -k draft_categories`.
5. Confirm: 4 tests collected, all FAIL (Red). If any test passes → revisit assertion (likely too lenient).

## Success Criteria

- [ ] 4 tests written, collected by pytest
- [ ] All 4 fail with assertion or 400/500 error against current code
- [ ] Failure modes documented in test docstrings (e.g. "fails because DraftIssue lacks main_task_category column")

## Risk Assessment

- **Risk:** Existing fixture conflicts (e.g. session_client requires extra setup for workspace).
  - **Mitigation:** Mirror patterns from `plane/tests/contract/test_*.py` already in repo.
- **Risk:** Category models (MainTaskCategory/SubTaskCategory) require workspace+project scoping unknown.
  - **Mitigation:** Read `plane/db/models/` for category model defs before writing factories.
