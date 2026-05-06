# Phase 8 — Verification & Rollout

## Context Links

- All prior phases complete and tested
- Plane git rules: `.claude/rules/plane-design-system.md`, project CLAUDE.md "Git Safety"
- Branch model: `{user}/{type}/{desc}` → develop → preview (admin merge)

## Overview

- **Priority:** P1 (final gate)
- **Status:** in-progress
- **Effort:** 1h
- **Brief:** Manual verification checklist, docs update, PR open against `develop`.
- **Depends:** Phase 7
- **Note:** Code review complete; migration #0168 applied; 16/16 tests passing. Pending docs update & commit prep.

## Key Insights

- User is `duonglx` (dev role). PR target = `develop`. Cannot merge to `preview` (admin only).
- Branch name suggestion: `duonglx/perf/profile-cross-workspace-aggregate`
- Per `.claude/rules/documentation-management.md`: update `docs/system-architecture.md` if endpoint diagram exists; otherwise note in `docs/project-changelog.md`.
- Use `gitnexus_detect_changes()` before commit to verify scope.

## Requirements

**Functional Verification (manual)**

1. Reload `http://localhost/<slug>/profile/<uid>/` — DevTools Network tab shows ≤30 requests.
2. DOMContentLoaded < 2s.
3. Today + Overdue tables populate correctly with cross-workspace data.
4. Toggle off `crossWorkspaces` → switches to current workspace only.
5. XLSX export contains correct rows.
6. Project profile counts match SQL truth (no sub-task inflation).
7. User stats endpoint returns same numbers as before (modulo intentional sub-task fix on `created_issues` + 3 others).
8. Existing `user-issues` endpoint still works on issue list views (not Today/Overdue).
9. Cross-workspace toggle is HIDDEN when viewing another user's profile (`/profile/<otherUid>/`). <!-- Updated: Validation Session 1 -->
10. Setting `VITE_USE_AGGREGATE_PROFILE_ENDPOINT=false` reverts to fan-out behavior (verifies feature-flag rollback path). <!-- Updated: Validation Session 1; Note: Vite env var, not NEXT_PUBLIC -->

**Documentation**

- `docs/project-changelog.md`: add entry under "Performance / Bug Fixes"
- (If exists) `docs/system-architecture.md`: note new `/api/users/me/work-items/{kind}/` endpoint
- PR description: before/after numbers + screenshot of Network tab

## Architecture

```
Verification flow:
  gitnexus_detect_changes → verify scope
  manual checklist (8 items)
  → docs update
  → branch push
  → gh pr create against develop
  → request review
```

## Related Code Files

**Modify**

- `docs/project-changelog.md` (add entry)
- `docs/system-architecture.md` (if endpoint catalog exists)

**Read**

- `git diff develop...HEAD` — scope check
- All phase plan files for cross-reference in PR description

## Implementation Steps

1. **Run gitnexus impact verification:**

   ```
   gitnexus_detect_changes()
   ```

   Confirm only expected symbols changed.

2. **Manual verification** (run all 8 functional checks above on dev container).

3. **Update docs:**
   - Append `docs/project-changelog.md`:
     ```
     ## [unreleased] - 2026-05-XX
     ### Performance
     - Profile page cross-workspace work items: replaced 600-call client fan-out with single `/api/users/me/work-items/{today,overdue}/` aggregate endpoint. Page load 10–25s → <2s.
     ### Fixes
     - `WorkspaceUserProfileEndpoint`: 4 issue counts now correctly exclude sub-tasks (`parent__isnull=True`). Numbers may decrease for users with sub-tasks; this is the correct value.
     ### Refactor
     - `WorkspaceUserProfileStatsEndpoint`: 4 sequential counts collapsed into single aggregate query (-3 queries).
     ```

4. **Commit messages** (conventional, multiple commits OK):
   - `feat(api): add cross-workspace work items aggregate endpoint`
   - `fix(api): exclude sub-tasks from workspace user profile counts`
   - `perf(api): collapse user profile stats into single aggregate query`
   - `perf(web): replace cross-workspace fan-out with single aggregate call`
   - `chore(api): add partial index for work items query` (if Phase 6)
   - `test(api): regression tests for profile counts and work items endpoint`

5. **Branch + PR:**

   ```bash
   git checkout -b duonglx/perf/profile-cross-workspace-aggregate
   git push -u origin duonglx/perf/profile-cross-workspace-aggregate
   gh pr create --base develop --title "perf(profile): single aggregate endpoint for cross-workspace work items" --body "$(cat <<'EOF'
   ## Summary
   - Replaces client-side 600-call fan-out with `/api/users/me/work-items/{today,overdue}/` aggregate endpoint
   - Fixes sub-task counting bug in `WorkspaceUserProfileEndpoint` (3 of 4 annotations missed `parent__isnull=True`)
   - Optimizes `WorkspaceUserProfileStatsEndpoint` (8 → 5 queries)

   ## Before / After
   - HTTP calls per profile page load: ~700 → ~28
   - DOMContentLoaded: 10–25s → <2s
   - Backend SQL queries on user-stats: 8 → 5

   ## Test plan
   - [x] `cd apps/api && python run_tests.py -u`
   - [x] Manual: 8-item functional checklist (see plan/phase-08)
   - [x] Network tab capture before/after
   - [ ] Reviewer: spot-check on staging

   ## Plan
   See `plans/260505-1508-profile-cross-workspace-optimization/`
   EOF
   )"
   ```

6. **Notify:** comment in PR linking debug report + plan folder.

## Todo List

- [x] `gitnexus_detect_changes` scope verification
- [x] Run 8-item manual verification
- [ ] Update `docs/project-changelog.md`
- [ ] Update `docs/system-architecture.md` if applicable
- [ ] Stage files (no .env, no plans/ raw drafts)
- [ ] Commit per logical phase (conventional commits)
- [ ] Push branch
- [ ] Open PR against `develop`
- [ ] Comment with screenshots + numbers

## Success Criteria

- All 8 manual checks pass
- PR opened against `develop` (not `preview`)
- All commits use conventional commits, no AI references
- Docs updated
- Reviewer can reproduce before/after numbers from PR description

## Risk Assessment

| Risk                                                   | Likelihood | Impact   | Mitigation                                                      |
| ------------------------------------------------------ | ---------- | -------- | --------------------------------------------------------------- |
| Accidental push to `preview`                           | Low        | High     | Use `--base develop` explicitly; double-check branch protection |
| Force push (corrupts history)                          | Very low   | High     | Never use `--force` per project rules                           |
| Skip pre-commit hook                                   | Very low   | Med      | Never `--no-verify`; fix lint/test failures instead             |
| Commit `.env` or secrets                               | Low        | Critical | Stage files individually, NOT `git add -A`                      |
| Stale `WorkspaceUserProfileIssuesEndpoint` test breaks | Low        | Med      | Phase 7 covers regression; CI gates                             |

## Security Considerations

- PR description does NOT include real workspace IDs / user data in screenshots — redact.
- Verify `.env`, `*.env*`, `secrets.*` are NOT staged.

## Next Steps

- Post-merge: monitor prod profile-page p95 for 1 week
- If perf still suboptimal → revisit Phase 6 indexing decision
- Backlog ticket: add frontend test runner (Vitest) if missing

## Unresolved Questions

(Resolved in Validation Session 1 — feature flag `NEXT_PUBLIC_USE_AGGREGATE_PROFILE_ENDPOINT` added in Phase 4. See plan.md `## Validation Log`.)

<!-- Updated: Validation Session 1 - feature flag confirmed -->
