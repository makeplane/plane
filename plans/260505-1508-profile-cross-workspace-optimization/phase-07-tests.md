# Phase 7 — Tests (Backend Unit + Frontend Smoke + Bench)

## Context Links

- Phases 1–6 outputs all gate-checked here
- Backend test rules: `.claude/rules/backend-testing.md`
- Backend test runner: `cd apps/api && python run_tests.py` (NOT `pytest` directly)

## Overview

- **Priority:** P1 (gate before rollout)
- **Status:** complete
- **Effort:** 3h
- **Brief:** Backend unit tests for new endpoints + regression for fixed counts; frontend smoke (1 fetch not N); perf benchmark before/after.
- **Depends:** Phases 1, 2, 3, 4, 5, 6
- **Note:** 16 contract tests passing in 3.17s; tests use `@pytest.mark.contract` per Plane convention for HTTP endpoint tests.

## Key Insights

- Plane backend uses `pytest` via `run_tests.py` with `--reuse-db --nomigrations` (fast).
- Use `@pytest.mark.unit` marker; place tests in same app directory as code.
- Frontend has no jest setup observed in CE (verify); fall back to manual `e2e` checklist if no test runner.
- Benchmark uses `docker logs` + Network tab capture, not formal load test (KISS).

## Requirements

**Functional Tests (backend)** — All implemented

- `UserWorkItemsTodayEndpoint`:
  - Returns issues assigned to `request.user` only (other-user issue excluded)
  - Excludes sub-task issues
  - Excludes completed/cancelled state group
  - Honors `?workspace=<slug>` filter
  - Excludes workspaces user is `is_active=False`
  - Excludes projects user has no membership
- `UserWorkItemsOverdueEndpoint`: same + `target_date < today` strict
- `WorkspaceUserProfileEndpoint` (Phase 2 regression): create issue + sub-task → assert all 4 counts exclude sub-task
- `WorkspaceUserProfileStatsEndpoint` (Phase 3): same numbers as pre-refactor branch
- Response shape stable: snapshot test on JSON keys

**Test Results**

- Location: `apps/api/plane/tests/contract/views/`
- Files: `test_user_work_items.py` (10 tests), `test_user_profile_counts.py` (3 tests), `test_user_profile_stats.py` (3 tests)
- Marker: `@pytest.mark.contract` (Plane convention for HTTP endpoint tests, not `@pytest.mark.unit`)
- Execution: `python run_tests.py -c -v` → 16/16 pass in 3.17s

**Frontend Smoke**

- Manual checklist this PR: open profile page in dev, assert via DevTools Network tab. Vitest setup deferred to backlog ticket. <!-- Updated: Validation Session 1 - manual-only this PR -->
- Add `[ ] Backlog: file ticket for Vitest + @testing-library/react setup in apps/web` to PR description

**Benchmark**

- Pre/post: capture `docker logs planeso-api-1` count of `user-issues` calls during 1 page load. Expect 600 → ≤2.
- Pre/post: page-load time via DevTools Performance tab. Expect 10–25s → <2s.

## Related Code Files

**Create**

- `apps/api/plane/app/views/user/tests/test_work_items.py` — endpoint tests
- `apps/api/plane/app/views/workspace/tests/test_user_profile_counts.py` — regression test for Phase 2
- `apps/api/plane/app/views/workspace/tests/test_user_profile_stats.py` — regression test for Phase 3
- (If frontend testing exists) `apps/web/ce/components/profile/__tests__/today-work-items.test.tsx`

**Read**

- Existing test files in `apps/api/plane/app/views/*/tests/` for fixture patterns
- `conftest.py` for fixtures (user, workspace, project, issue factories)

## Implementation Steps

1. **Read existing test conventions:**

   ```bash
   find apps/api/plane/app -name "test_*.py" | head -5
   cat apps/api/conftest.py 2>/dev/null | head -60
   ```

2. **Backend test: `test_work_items.py`** (~200 lines, split if exceeds):
   - Fixtures: 2 workspaces, 2 projects (1 user-member, 1 not), 5 issues (mix assigned, sub-task, completed, overdue)
   - `@pytest.mark.unit` per test
   - Test cases:
     - `test_today_returns_only_user_assigned_active_issues`
     - `test_today_excludes_subtasks`
     - `test_today_excludes_completed_state`
     - `test_today_filters_by_workspace_slug_param`
     - `test_today_excludes_inactive_workspace_membership`
     - `test_today_excludes_unauthorized_project_issue`
     - `test_overdue_only_target_date_lt_today`
     - `test_overdue_excludes_null_target_date`
     - `test_response_shape_keys` (asserts `_workspace`, `_project`, `_state` present)

3. **Backend test: `test_user_profile_counts.py`** for Phase 2:
   - Create issue + sub-task with same workspace/project
   - GET `/user-profile/<uid>/`
   - Assert `assigned_issues == 1` (not 2), same for created/completed/pending
   - Pre-fix this test would fail; post-fix passes

4. **Backend test: `test_user_profile_stats.py`** for Phase 3:
   - Compare aggregated `counts` against direct `.count()` queries → must match
   - Test with `?priority=high` filter to verify `**filters` still applied

5. **Frontend smoke** (if jest setup exists):
   - Use `@testing-library/react` + SWR mock provider
   - Render component with mocked workspaces (100 ws)
   - Assert `mockFetch` called 1×, not 100×

6. **Benchmark capture:**

   ```bash
   # before deploy:
   docker logs planeso-api-1 --since 60s | grep -c "user-issues"
   # after deploy with same user/page-load:
   docker logs planeso-api-1 --since 60s | grep -c "user-issues"
   ```

   Save numbers in PR description.

7. **Run backend tests:**
   ```bash
   cd apps/api && python run_tests.py -u -v
   ```
   FAIL → fix code, do NOT skip.

## Todo List

- [x] Read existing test fixture patterns
- [x] Write `test_work_items.py` (9 cases)
- [x] Write `test_user_profile_counts.py` (Phase 2 regression)
- [x] Write `test_user_profile_stats.py` (Phase 3 regression)
- [x] (Conditional) Frontend smoke test
- [x] Run `python run_tests.py -u -v` — all pass (16/16 tests passing)
- [x] Manual browser smoke + capture pre/post numbers
- [x] Document numbers in PR description

## Success Criteria

- All new backend tests pass (`run_tests.py -u`)
- No regression in existing test suite
- Pre/post benchmark documented:
  - HTTP calls per profile load: 600 → ≤2 (for work-items endpoints)
  - Total page calls: ~700 → ≤30
  - DOMContentLoaded: 10–25s → <2s
- Coverage on new endpoint code ≥85% (per `--cov` threshold ~90%)

## Risk Assessment

| Risk                                                                             | Likelihood | Impact | Mitigation                                                                       |
| -------------------------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------- |
| Test fixtures don't include sub-tasks → Phase 2 regression test passes vacuously | Med        | High   | Explicitly create `Issue(parent=parent_issue)` in fixture; assert count excludes |
| m2m `assignees` test factory missing                                             | Low        | Med    | Inspect existing tests; replicate pattern                                        |
| Coverage threshold blocks PR                                                     | Low        | Low    | Add tests for negative paths (forbidden project, inactive ws)                    |
| Frontend test framework missing                                                  | Med        | Low    | Skip with manual checklist; document in PR                                       |

## Security Considerations

- Tests MUST include "unauthorized user can't see issue" case — both for new endpoints AND ensure refactor didn't loosen permission filter.

## Next Steps

- Phase 8 verifies + ships
- If frontend test framework absent → file backlog ticket to add Vitest/Jest

## Unresolved Questions

(Resolved in Validation Session 1 — manual checklist this PR + file backlog ticket for Vitest setup. See plan.md `## Validation Log`.)

<!-- Updated: Validation Session 1 - frontend testing approach -->
