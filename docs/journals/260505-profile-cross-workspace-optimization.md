# Journal — Profile Cross-Workspace Optimization

**Date:** 2026-05-05
**Plan:** `260505-1508-profile-cross-workspace-optimization`
**Branch:** `duonglx/feat/profile-cross-workspace-perf`
**PR:** https://github.com/shbvn/plane/pull/74 (against `develop`)

## Summary

Shipped single-query work-items aggregation for profile page (today/overdue tasks): killed 600-call client fan-out with 2 backend endpoints, fixed sub-task bug in workspace stats, collapsed 8 queries to 5 via aggregation, and added 150-issue-per-workspace partial index. 8 phases complete. 16/16 contract tests pass (3.17s).

## What was built

| Component             | Details                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Backend endpoints** | `GET /api/users/me/work-items/{today,overdue}/` — single SQL, `select_related` + `prefetch_related`, self-only, cap 200, optional `?workspace=` filter |
| **Phase 2 fix**       | `WorkspaceUserProfileEndpoint` annotations: 3/4 Count missing `parent__isnull=True`. All 4 now use DRY `_base_issue_q` Q-clause. Bug from prior fix.   |
| **Phase 3 perf**      | `WorkspaceUserProfileStatsEndpoint` — 4 sequential `.count()` → 1 `.aggregate()` with `Count(filter=Q(...), distinct=True)`. Net: 8 queries → 5.       |
| **Phase 6 DB**        | Partial index `issues_workitems_idx ON issues (target_date, state_id) WHERE parent_id IS NULL AND deleted_at IS NULL ...`. Migration 0168.             |
| **Frontend service**  | New CE service + 3-branch hook `useUserWorkItems`: other-user / flag-off / self-aggregate. Components shrunk 148L → 95L. Toggle hidden on non-self.    |
| **Feature flag**      | `VITE_USE_AGGREGATE_PROFILE_ENDPOINT` (build-time, Vite not Next.js). Requires redeploy for rollback.                                                  |

## Key surprises & decisions

**Surprise 1: Wire-shape mismatch caught only at code-review.** Backend serializer returned `_workspace: { slug, name }` (nested) but `EnrichedIssue` expects flat `_workspaceSlug`/`_workspaceName`. Fix landed at service boundary via `toEnriched` mapper rather than changing serializer — less invasive, FE type stays the table contract. **Lesson:** when server adds a nested object, double-check consumer types before merging. Code-reviewer caught what compile + tests + lint did not.

**Surprise 2: Test placement convention drift.** Initial tester placed tests at `plane/app/views/{user,workspace}/tests/` per plan; pytest collection failed (duplicate `tests` basename). Real Plane convention: `plane/tests/{unit,contract,smoke}/` with `@pytest.mark.contract` for HTTP endpoint tests. Relocated.

**Surprise 3: Vite, not Next.js.** Spec said `process.env.NEXT_PUBLIC_*` (frontend dev's first instinct); doesn't work. Use `import.meta.env.VITE_*` and add to `turbo.json` `globalEnv`. Worth remembering for any future env-var work.

**Decision 1: DRY Q-clause pattern.** Phase 2's 4 annotations made `_base_issue_q = Q(project_issue__deleted_at__isnull=True, ..., project_issue__parent__isnull=True)` clean and avoided the 3-of-4-fixed footgun that caused this bug originally. Advocating for in similar multi-annotation code.

**Decision 2: Defensive client-side parity.** Legacy `WorkspaceUserProfileIssuesEndpoint` (Branch 1 of hook for non-self profiles) doesn't filter `parent_id`. Added `.filter((i) => i.parent_id == null)` client-side rather than expanding scope to backend; aggregate endpoint already excludes sub-tasks server-side. Contained blast radius.

## Test results

- Backend contract tests: 16/16 PASS (3.17s)
- Coverage: new endpoints + aggregation refactor fully covered
- No regressions in legacy branches (other-user still works)

## Honest trade-offs

- Feature flag is build-time only (no runtime toggle). Rollback requires redeploy, not config change. Documented in PR for ops team.
- Vite env-var limitation (not Next.js) means `VITE_*` is baked at build — keep this in mind for future env-var requirements.
- Legacy endpoint stays unfixed (no `parent_id` filter) for low-risk reason: aggregate endpoint filters correctly server-side. Small performance cost in "other profiles" view acceptable for scope containment.

## Stats

- **Commits:** 6 (focused, per phase)
- **Backend:** 2 new endpoints, 1 refactor (stats aggregation), 1 migration (partial index)
- **Frontend:** 1 new CE service, 1 new hook, 3 branch logic paths
- **Lines:** ~1,200 net new (backend) + ~400 (frontend)
- **Tests:** 16 contract tests, 3.17s suite time

## Status: DONE

Code in PR #74, ready for review. All phases complete. Contract tests pass. Wire-shape issue found and fixed. Ready to merge.
