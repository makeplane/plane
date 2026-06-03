---
phase: 5
title: "Integration Tests (REFACTOR + smoke)"
status: pending
priority: P2
effort: "1h"
dependencies: [4]
---

# Phase 5: Integration Tests

## Overview

REFACTOR + smoke. End-to-end coverage on the full flow: create draft with categories → reopen → move-to-project. Pre-existing draft (no categories) move-flow regression check.

## Requirements

**Functional:**

- Smoke test: create draft with full payload → list endpoint returns it with both categories → move-to-issue succeeds → resulting Issue has both categories + draft is deleted.
- Regression: pre-fix-style draft (NULL categories, backlog state) → move-to-issue still succeeds (no required-field 400).
- Negative: draft with explicit non-backlog state + NULL categories → move-to-issue fails with 400 listing the 2 missing fields (validates Phase 4 error UX path).

**Non-functional:**

- File: `apps/api/plane/tests/smoke/test_draft_move_smoke.py`. Marker `@pytest.mark.smoke`.

## Architecture

Smoke tests run against full DB stack (`--reuse-db`). Reuse contract fixtures.

## Related Code Files

- Create: `apps/api/plane/tests/smoke/test_draft_move_smoke.py`
- Read: `apps/api/plane/tests/contract/test_draft_categories.py` (Phase 1 patterns)

## Implementation Steps

1. Read existing smoke tests in `plane/tests/smoke/` to confirm fixture conventions.
2. Write 3 smoke tests (happy + regression + negative) mirroring Phase 1 contract patterns but using full create→move chain.
3. Run `cd apps/api && python run_tests.py -s -v`.
4. Run full suite `python run_tests.py` — confirm 100% green.
5. Manual frontend smoke per Phase 4 step 5.

## Success Criteria

- [ ] 3 smoke tests pass
- [ ] Full backend test suite green (`run_tests.py`)
- [ ] Manual: create draft with categories → reopen → categories present
- [ ] Manual: move backlog draft → succeeds
- [ ] Manual: move non-backlog draft missing categories → modal stays open, field errors shown

## Risk Assessment

- **Risk:** Smoke runs against real DB → slow.
  - **Mitigation:** `--reuse-db --nomigrations` already default per `backend-testing.md`.
- **Risk:** Validator behavior on non-backlog with categories filled differs from expectation.
  - **Mitigation:** Read `IssueCreateSerializer.validate()` lines 200-245 before writing negative test.
