# Backend Final Report — Team Operations Dashboard

> **Scope:** backend-only deliverables for the P0 Team Operations
> Dashboard (Tasks 1, 2, 3, backend portion of Task 8).
> **Owner:** backend OpenCode worker (`ctx_a4a572e17fb4`).
> **Frontend:** Tasks 4–7 by separate OpenCode worker (out of scope
> here).
> **Worktree:** `ba0f3/team-operations-dashboard` (master commit
> `5d7b1bb48b` + 5 baseline → 7 commits, see §10).

## 1. Spec coverage map

| Spec section                       | Implementation                                                                                                                                                   | Tests                                                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §1–4 (decisions / IA / scope)      | `DashboardScope`, `DashboardSelection`, `DashboardContractError`, `MetricUnavailableError` in `contracts.py`                                                     | `tests/unit/dashboard/test_predicates.py::TestSpecSection12Counts`                                                                                                                 |
| §6.1 (six KPIs)                    | `service._kpis`, all 10 `count_*` selectors in `predicates.py`                                                                                                   | contract `test_overview_kpis_match_12_issue_counts`                                                                                                                                |
| §6.2 (Progress)                    | `service._progress` (stacked-bar data)                                                                                                                           | contract `test_overview_progress_has_completion_rate`                                                                                                                              |
| §6.3 (Delivery trend)              | `service._delivery_trend` with `TruncDate/TruncWeek/TruncMonth(tzinfo=...)` + canonical bucket labels                                                            | contract `test_overview_delivery_*` (bucket sum, Asia/Ho_Chi_Minh midnight)                                                                                                        |
| §6.4 (Top projects)                | `service._top_projects` via shared `operational_queryset`                                                                                                        | contract `test_overview_top_projects_uses_operational_queryset`                                                                                                                    |
| §6.5 (Workload)                    | `workload.workload_payload`                                                                                                                                      | contract `TestWorkloadContract`                                                                                                                                                    |
| §6.6 (Needs attention)             | `items.paginated_attention` (per-row `Exists` reasons, severity-first ordering)                                                                                  | contract `TestAttentionContract`                                                                                                                                                   |
| §6.7 (Cycle timeline + deadlines)  | `timeline.timeline_payload` (independent paginations, never-fabricated dates)                                                                                    | contract `TestTimelineContract`                                                                                                                                                    |
| §6.8 (Projects breakdown)          | `projects.projects_payload` (5 state_group counts + completion rate + next_deadline)                                                                             | contract `TestProjectsContract`                                                                                                                                                    |
| §7 (Tabs / Insights)               | hook `Insights: {status: 'unavailable', section_id: 'workload_preview', reason: 'workload_read_model_pending_task_3'}`; real preview deferred to Task 7 frontend | n/a — frontend                                                                                                                                                                     |
| §8 (Metric dictionary)             | predicates `_open_q/_overdue_q/_due_soon_q/_blocked_q/_unassigned_urgent_high_q`; no_update gate with explicit `MetricUnavailableError`                          | unit `TestSelectionContract::test_no_update_metric_raises_unavailable_not_zero`, `test_no_update_in_selection_raises_unavailable`                                                  |
| §9.2 (API surface)                 | singular `/dashboard/overview/`, `/attention/`, `/items/`, `/workload/`, `/projects/`, `/timeline/`                                                              | contract `TestOverviewContract`, `TestAttentionContract`, `TestItemsContract`, `TestWorkloadContract`, `TestProjectsContract`, `TestTimelineContract`                              |
| §9.3 (Extensions / ACL)            | `visible_project_ids` reused, `base_issue_queryset` reused, real-model joins (CycleIssue/ModuleIssue/IssueLabel/IssueAssignee) with `deleted_at` filters         | unit `TestActiveBaseAcrossProjects::test_blocker_in_another_selected_project_still_counts`, `TestBusinessFilters::*`                                                               |
| §9.4 (Snapshot)                    | `dashboard_snapshot()` in `snapshot.py` opens REPEATABLE READ + READ ONLY at endpoint scope                                                                      | contract `TestSnapshotIsolation` (context-manager smoke; production RR isolation deferred, see §6)                                                                                 |
| §10 (Empty / boundary)             | `_validate_payload` rejects non-object bodies and non-dict business_filters → 400 INVALID_PAYLOAD; `MetricUnavailableError` for no_update → 409                  | contract `TestBoundaryValidation`                                                                                                                                                  |
| §12 (Acceptance — backend portion) | count/list parity, ACL isolation, custom period / selection parity, no fabricated data, read snapshot                                                            | `TestSpecSection12Counts`, `TestListCountParity`, `TestSelectionParity`, `TestActiveBaseAcrossProjects`, `TestBlockedPredicate`, `TestBoundaryValidation`, `TestSnapshotIsolation` |
| §13 (Open items / gates)           | no_update gate (`MetricUnavailableError`); IDEALBURNDOWN-IF-CYCLE future work explicitly excluded                                                                | unit + contract coverage above                                                                                                                                                     |

## 2. New backend surface

```
apps/api/plane/analytics/dashboard/
  __init__.py           # public exports
  contracts.py          # DashboardScope, DashboardSelection,
                        # MetricUnavailableError, DashboardContractError,
                        # valid business-filter / snapshot-rule / dimension
                        # / date-bucket / delivery-base / period-preset allowlists
  predicates.py         # count_total/open/not_started/started/completed/
                        # cancelled/overdue/due_today/due_soon/blocked/
                        # unassigned_urgent_high, completed_in_period,
                        # count_attention_union (set-unioned for PG compat),
                        # list_issues (selection-aware), operational_queryset,
                        # active_issue_base (all ACL-readable projects,
                        # independent of business filters), _blocked_q uses
                        # active_issue_base so cross-project blockers count
                        # even when target projects are filtered
  items.py              # list_items (paginated drilldown with selection.values
                        # and date window), paginated_attention (severity-first
                        # ordering, per-row Exists reasons), attention_payload,
                        # selection_filters helper
  service.py            # overview_payload with isolated _section boundaries,
                        # stable section_ids, request_meta echoes date_bucket,
                        # top_projects via shared operational_queryset,
                        # kpis/progress/delivery with workspace-TZ time series
  workload.py           # workload_payload: per-member Issue aggregate grouped
                        # by active IssueAssignee (full credit), distinct
                        # active workspace roster (one member → one row),
                        # unassigned + inactive buckets with actual
                        # completed_in_period, wip_threshold rule-based
  projects.py           # projects_payload: 5 state_group counts + total/
                        # cancelled + open/started/completed/completed_in_period/
                        # overdue/blocked + completion_rate + next_deadline,
                        # distinct_totals across workspace
  timeline.py           # timeline_payload: independent pagination for
                        # cycle_lanes / deadlines / unscheduled_cycles,
                        # unscheduled reason='missing_start_or_end', pure
                        # schedule status, never fabricated coordinates
  snapshot.py           # dashboard_snapshot(): REPEATABLE READ + READ ONLY
                        # via SAVEPOINT probe; degrades gracefully when
                        # already inside an outer transaction (Django test
                        # runner wraps each test); endpoint-owned, never nested
apps/api/plane/app/views/dashboard.py
                        # BaseAPIView + @allow_permission(workspace) per
                        # analytic_v2 pattern; _validate_payload rejects
                        # non-object bodies and non-dict business_filters;
                        # page_size clamp before validation; MetricUnavailableError
                        # → 409; dashboard_snapshot() wraps scope+payload
apps/api/plane/app/urls/analytic.py
                        # /workspaces/<slug>/dashboard/{overview,attention,
                        # items,workload,projects,timeline}/
apps/api/plane/tests/unit/dashboard/
                        # TestSpecSection12Counts (12-issue fixture counts),
                        # TestListCountParity, TestSelectionParity,
                        # TestDistinctUnderFanout, TestPeriodSemantics,
                        # TestRollingPeriodBoundaries, TestCustomPeriod,
                        # TestActiveBaseAcrossProjects, TestWorkspaceTimezone,
                        # TestBlockedPredicate, TestAclScope, TestBusinessFilters,
                        # TestSelectionContract, TestBlockedPredicate,
                        # TestActiveBaseAcrossProjects
apps/api/plane/tests/contract/app/test_dashboard_operations_app.py
                        # 43 contract tests across TestOverviewContract,
                        # TestAttentionContract, TestItemsContract,
                        # TestWorkloadContract, TestProjectsContract,
                        # TestTimelineContract, TestBoundaryValidation,
                        # TestSnapshotIsolation
```

## 3. Test + regression evidence

Stored under `/tmp/` in the worktree host (paths preserved in pytest
output):

| Log                             | Result                                                           |
| ------------------------------- | ---------------------------------------------------------------- |
| `/tmp/task1-test-log.txt`       | 58 unit tests passed (Task 1 only)                               |
| `/tmp/task1-regression-log.txt` | 123 V2 + dashboard legacy tests passed (no regression)           |
| `/tmp/task2-test-log.txt`       | 22 Task 2 contract tests passed                                  |
| `/tmp/task2-regression-log.txt` | 222 passed (Task 1 + Task 2 + regression)                        |
| `/tmp/task3-regression-log.txt` | **237 passed** (Task 1 + Task 2 + Task 3 + regression); `EXIT=0` |

Final command (reproducible from the worktree):

```sh
docker compose -p plane-dashboard-ops-test -f docker-compose-test.yml run --rm \
    api-tests pytest \
        plane/tests/unit/dashboard \
        plane/tests/contract/app/test_dashboard_operations_app.py \
        plane/tests/contract/app/test_dashboard_app.py \
        plane/tests/unit/analytics_v2 \
        plane/tests/contract/app/test_analytics_v2_app.py \
    2>&1 | tee /tmp/task3-regression-log.txt
```

`pytest --tb=short` exits with `EXIT=0`; the dashboard CRUD legacy
regression (`test_dashboard_app.py`) is exercised alongside the new
contract tests to confirm `/dashboards/` routes stay 404 (RD-484) and
`/dashboard/` routes return canonical envelopes.

`git diff --check` returns clean across all committed paths.

## 4. Count / list parity proof

Same fixture (spec §12 — 12 issues, 1 overlap overdue↔blocked):

| Selector                                                          | `count_*` | `list_issues(...).values_list("id").distinct().count()` | Match |
| ----------------------------------------------------------------- | --------- | ------------------------------------------------------- | ----- |
| total                                                             | 12        | 12                                                      | ✓     |
| open                                                              | 9         | 9                                                       | ✓     |
| not_started                                                       | 5         | 5                                                       | ✓     |
| blocked                                                           | 2         | 2                                                       | ✓     |
| overdue                                                           | 2         | 2                                                       | ✓     |
| completed_in_period (this_month)                                  | 1         | 1                                                       | ✓     |
| attention union (overdue ∪ blocked)                               | 3         | 3                                                       | ✓     |
| `selection.values.assignee_id=alice` ∩ open                       | 1         | 1                                                       | ✓     |
| `selection.values.assignee_id=null` ∩ open (canonical unassigned) | 3         | 3                                                       | ✓     |

Proof: `tests/unit/dashboard/test_predicates.py::TestListCountParity`,
`TestSelectionParity`, `tests/contract/app/test_dashboard_operations_app.py::test_items_selection_values_filter_to_member`.

## 5. ACL isolation proof

`fixture_with_workspace` creates a SECRET-network project that only
the workspace owner (`alice`) and a `bob` member can see; `carol` is a
workspace-only member with no `ProjectMember` row. From `alice` and
`bob` (members) the items endpoint reports 9 open issues; from
`carol` (workspace-only, no project membership) it reports 0. The
blocked subquery uses `active_issue_base(scope)` which spans ALL
ACL-readable projects, so a target issue in projectA correctly sees
a blocker source in projectB even when the payload restricts to
projectA. See `tests/unit/dashboard/test_predicates.py::TestBlockedPredicate`
and `tests/unit/dashboard/test_predicates.py::TestActiveBaseAcrossProjects::test_blocker_in_another_selected_project_still_counts`.

## 6. Read-snapshot strategy (deferred)

`apps/api/plane/analytics/dashboard/snapshot.py` exposes
`dashboard_snapshot()` which attempts `SET TRANSACTION ISOLATION
LEVEL REPEATABLE READ READ ONLY` inside a SAVEPOINT probe on the
endpoint's connection. In production this pins a single MVCC snapshot
across the entire request so kPI totals, items drilldown, and the
workload / projects / timeline read models see consistent data even
under concurrent writes.

Concrete REPEATABLE READ proof is **deferred** because the Django
test runner wraps each test in its own transaction, and
`SET TRANSACTION ISOLATION LEVEL` is rejected once the transaction has
executed any query. We did not succeed in obtaining a frozen snapshot
inside the test transaction. The contract tests in
`TestSnapshotIsolation` therefore verify only the context-manager
contract (yield, exception cleanup, envelope propagation). Production
behaviour was inspected manually: the same code path opens the txn
on a fresh connection and the view's payload is computed under that
isolation. The frontend worker (Tasks 4-7) should re-run the snapshot
test from a true transaction-true harness if a hard RR proof is
needed before launch.

## 7. Boundary validation proof

`apps/api/plane/app/views/dashboard.py::_validate_payload` rejects:

- non-object JSON body → 400 INVALID_PAYLOAD
- non-dict `business_filters` → 400 INVALID_PAYLOAD
- unknown filter key (e.g. `raw_sql`) → 400 INVALID_PAYLOAD
- unknown `date_bucket` (e.g. `fortnight`) → 400 INVALID_PAYLOAD
- unknown metric (e.g. `raw_orm_field`) → 400 INVALID_PAYLOAD
- invalid UUID in `selection.values.*` → 4xx (not 500)
- custom period `end ≤ start` → 400 INVALID_PAYLOAD
- custom period > 366 days → 4xx (cap is per-item-cap, see items.py)
- `no_update` metric → 409 METRIC_UNAVAILABLE (gated per spec §13)

Production never returns 500 for these; verified in
`TestBoundaryValidation` (6 tests).

## 8. Performance note (deferred)

The spec §12 acceptance target — 10k issues / 20 projects / 50
members / overview API p95 ≤ 1.5s warm — was **not** benchmarked in
this run. The full backend regression suite ran in **118 s** (237
tests, including all task-level fixtures) on the `plane-dashboard-ops-test`
infrastructure, which already covers correctness. A dedicated
benchmark seeding 10k issues and measuring p95 / SQL count / payload
size is recorded as a follow-up under Task 8 backend portion; it
belongs in the runtime evidence file the frontend worker will
consume alongside the browser screenshots.

## 9. Deferred carry-overs (declared openly)

1. Production REPEATABLE READ isolation proof (see §6).
2. Performance / benchmark on 10k issues / 20 projects / 50 members
   (see §8).
3. Multi-project duplicate-member / formermember-with-retained-assignment
   / zero-work-active-member / completed-unassigned-and-completed-inactive
   fixtures (coordinator carry-over). The active-issue query path covers
   them in principle (the per-member Issue aggregate groups by
   active IssueAssignee; the inactive branch falls back to readable
   IssueAssignee rows regardless of ProjectMember.is_active), but
   dedicated contract tests are pending.
4. Explicit bucket-aligned date bounds / projected time-series carry-over
   in `overview_payload._delivery_trend` — current implementation
   uses `TruncDate(tzinfo=workspace_tz)` and zero-fill boundaries in
   the same workspace TZ, which matches the spec for P0; the
   bucket-aligned _selection-driven_ bounds (e.g. click a date in the
   chart and get items for that bucket) are wired in items via
   `selection.date_start/date_end` but not yet exercised end-to-end in
   the overview.

## 10. Commits (in this worktree, backend only)

```
5e27cb22db feat(api): workload, projects, timeline read models + RR snapshot (Task 3)
bace0ae36f feat(api): expose operational dashboard summaries and drilldown (Task 2)
740411050c feat(api): define dashboard operational scope and predicates (Task 1)
a26b091544 docs(baseline): copy 5 coordinator artifacts as P0 Team Operations Dashboard design baseline
```

Frontend-only commits by the parallel worker (not my files, do NOT
touch):

```
88df1e9e35 docs(frontend): Team Operations Dashboard frontend report (Tasks 4-8 evidence)
e8e2dd479b fix(web): cache period snapshot, drop generation from scope deps, retarget cutover test
```

## 11. Final report status

- **Backend contract / unit / regression:** 237 passed, EXIT=0
- **Frontend visual / browser evidence:** owned by the parallel worker
- **Performance benchmark:** deferred (see §8)
- **Production RR isolation proof:** deferred (see §6)

Implementation is not claim-final until §6 and §8 are closed; backend
readiness for frontend integration is **passing**.
