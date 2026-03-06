# Phase 04 — Tests

**Parent:** [plan.md](plan.md)
**Date:** 2026-03-06 | **Status:** pending

## Overview

Update test assertions that reference the string "Backlog" as a state name.

## Related Files

| File                                                           | Change                                        |
| -------------------------------------------------------------- | --------------------------------------------- |
| `apps/api/plane/tests/contract/app/test_project_app.py`        | `"Backlog"` state name assertions → `"Draft"` |
| `apps/api/plane/tests/contract/app/test_dashboard.py`          | `"Backlog"` references → `"Draft"`            |
| `apps/api/plane/tests/contract/api/test_cycles.py`             | `"Backlog"` state name → `"Draft"`            |
| `apps/api/plane/tests/unit/models/test_issue_comment_modal.py` | `"Backlog"` → `"Draft"` if used as state name |

## Do NOT Change

- Any test using `group="backlog"` — internal key, correct as-is
- Any test asserting on the `group` field value

## Implementation Steps

1. Grep each test file for `"Backlog"` to confirm which are state name assertions vs. group key assertions
2. Replace only `name="Backlog"` or `"name": "Backlog"` style assertions with `"Draft"`
3. Run tests to confirm: `cd apps/api && python run_tests.py`

## Success Criteria

- All test files pass without referencing old "Backlog" name
- Group-key based tests unaffected
