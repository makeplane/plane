# Phase 3 — Backend: Optimize Stats Endpoint Single Query

## Context Links

- Debug report §"#3 — `WorkspaceUserProfileStatsEndpoint`": `plans/reports/debugger-260505-1454-your-work-profile-slow.md`
- File: `apps/api/plane/app/views/workspace/user.py:416–541`
- Frontend caller: `apps/web/core/services/user.service.ts:168` (`getUserProfileData`)

## Overview

- **Priority:** P3 (low-impact, debt cleanup)
- **Status:** complete
- **Effort:** 1.5h
- **Brief:** 8 sequential queries → consolidate `created_issues`, `assigned_issues_count`, `pending_issues_count`, `completed_issues_count` into 1 aggregate query with `Count(filter=...)`. Keep state/priority distribution + cycle queries separate (different shapes).

## Key Insights

- Currently ~68ms in dev — not an emergency, but classic N×SELECT on same table = wasted round-trips.
- 4 of 8 queries are `Issue.issue_objects.filter(...).count()` on overlapping conditions — perfect for `aggregate(Count(filter=Q(...)))` collapse.
- `priority_distribution` + `state_distribution` use `GROUP BY` → keep separate (different aggregation).
- `subscribed_issues_count` queries `IssueSubscriber` (different table) → keep separate.
- `upcoming_cycles` + `present_cycle` query `CycleIssue` → keep separate.
- DO NOT optimize the cycle queries — they return rows, not counts; refactor scope creep.

## Requirements

**Functional**

- Identical JSON response shape (`state_distribution`, `priority_distribution`, `created_issues`, `assigned_issues`, `completed_issues`, `pending_issues`, `subscribed_issues`, `present_cycles`, `upcoming_cycles`).
- Same numbers (verified by side-by-side test).
- `**filters` (`issue_filters` legacy) still applied to all 4 counts.

**Non-functional**

- Reduce 4 SELECT → 1 SELECT for the count cluster.
- p95 ≤ current (target: -30%).

## Architecture

```
Before: 4× SELECT COUNT(*) FROM issues WHERE ...  (4 round-trips)

After:  SELECT
          COUNT(*) FILTER (WHERE created_by_id=:uid AND ...)         AS created,
          COUNT(*) FILTER (WHERE :uid IN assignees AND ...)          AS assigned,
          COUNT(*) FILTER (WHERE :uid IN assignees AND state__group='completed' AND ...) AS completed,
          COUNT(*) FILTER (WHERE :uid IN assignees AND state__group NOT IN(...) AND ...) AS pending
        FROM issues
        WHERE workspace__slug=:slug AND project_member_active AND <filters>
```

Django ORM: `.aggregate(created=Count(...filter=Q(...)), assigned=Count(...filter=Q(...)), ...)`.

## Related Code Files

**Modify**

- `apps/api/plane/app/views/workspace/user.py:416–541` — only the 4 count blocks (lines 457–502)

**Read for context**

- Frontend consumer: `apps/web/core/store/profile/profile.store.ts` (verify it uses these field names — already does per debug report)
- Issue manager: `apps/api/plane/db/models/issue.py` `IssueManager`

## Implementation Steps

1. **gitnexus_impact** on `WorkspaceUserProfileStatsEndpoint` — confirm only frontend profile page consumes.

2. **Refactor count cluster** (replace lines 457–502):

   ```python
   active_assignee = Q(assignees=user_id) & Q(issue_assignee__deleted_at__isnull=True)
   counts = (
       Issue.issue_objects.filter(
           workspace__slug=slug,
           project__project_projectmember__member=request.user,
           project__project_projectmember__is_active=True,
           parent__isnull=True,
       )
       .filter(**filters)
       .aggregate(
           created_issues=Count("id", filter=Q(created_by_id=user_id), distinct=True),
           assigned_issues=Count("id", filter=active_assignee, distinct=True),
           pending_issues=Count("id", filter=active_assignee & ~Q(state__group__in=["completed","cancelled"]), distinct=True),
           completed_issues=Count("id", filter=active_assignee & Q(state__group="completed"), distinct=True),
       )
   )
   ```

   NOTE: Apply `parent__isnull=True` to `created_issues` for consistency with Phase 2's sibling-endpoint fix. <!-- Updated: Validation Session 1 - created_issues parent__isnull confirmed -->

3. **Wire up Response** with `counts["created_issues"]` etc.

4. **Side-by-side test** in shell: run old + new code on same workspace, assert identical numbers (within `parent__isnull=True` consistency note above).

5. **Compile + smoke** via curl.

## Todo List

- [x] gitnexus_impact on `WorkspaceUserProfileStatsEndpoint`
- [x] Replace 4 count queries with single `.aggregate()`
- [x] Apply `parent__isnull=True` to `created_issues` aggregate (decided in Validation Session 1)
- [x] Side-by-side numeric comparison shell test
- [x] Smoke curl `/user-stats/<uid>/`
- [x] Verify `connection.queries` count drops by 3

## Success Criteria

- Response shape identical (key-by-key)
- Numbers identical (modulo intentional `parent__isnull=True` correction)
- `connection.queries` shows ≤5 queries (was 8)
- p95 same or better

## Risk Assessment

| Risk                                                         | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------ | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Count(distinct=True)` performance hit                       | Med        | Low    | Benchmark on 10k-issue workspace. **Fallback (Session 2): subquery rewrite** — wrap as `Issue.objects.filter(...).annotate(_active=Case(When(active_assignee, then=1), default=0)).aggregate(assigned_issues=Sum("_active"), ...)` or use pre-filtered subquery via `.filter(id__in=Subquery(...)).count()` per-metric. KEEP Phase 3 in PR; do NOT defer or add cache. |
| Filter Q with m2m `assignees` over-counts without `distinct` | High       | Med    | `distinct=True` mandatory on each Count                                                                                                                                                                                                                                                                                                                                |
| `**filters` interacts badly with single aggregate            | Low        | Med    | Test with active filter (priority, state) — same code path                                                                                                                                                                                                                                                                                                             |
| Cycle queries accidentally touched                           | Low        | Low    | Limit edits to lines 457–502                                                                                                                                                                                                                                                                                                                                           |

<!-- Updated: Validation Session 2 - Count(distinct=True) fallback locked to subquery rewrite. NOT deferral, NOT cache layer. -->

**Validation decision (Session 2):** If benchmark shows `Count(distinct=True)` regression vs old 4-`.count()` approach → rewrite using `Sum(Case(When(...)))` over `parent__isnull=True`-filtered base queryset (avoids m2m distinct cost), or split into 4 `Subquery` annotations on a single SELECT. Phase 3 STAYS in this PR.

## Security Considerations

- `project__project_projectmember` filter preserved → no leak.
- `issue_assignee__deleted_at__isnull=True` preserved → respects soft-deleted assignment.

## Next Steps

- Phase 7 adds unit test comparing aggregated vs separate query
- If perf still bottleneck, add cache layer (60s TTL keyed by `(workspace_id, user_id, filter_hash)`)
