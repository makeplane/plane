---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 3 Plan 03-01 complete (routing scaffold + Wave-0 fixtures + auth tests)
last_updated: "2026-05-04T00:00:00.000Z"
last_activity: 2026-05-04 -- Plan 03-01 complete (6 GREEN contract tests, 2 commits)
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 9
  completed_plans: 6
  percent: 67
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-03)

**Core value:** ドラッグ移動が Precedence Boundary を超えても、サーバ権威で必要最小限の連鎖を all-or-nothing で再配置し、失敗時は明示的な reason code で UI に説明できる。
**Current focus:** Phase 3 — Propagation API Endpoint, Persistence & Contract

## Current Position

Phase: 3 (Propagation API Endpoint, Persistence & Contract) — EXECUTING
Plan: 2 of 3 (next: 03-02 — serializer fields + permission check + algorithm wiring)
Status: Executing Phase 3
Last activity: 2026-05-04 -- Plan 03-01 complete (6 GREEN contract tests; routing scaffold + Wave-0 fixtures locked)

Progress: [███░░░░░░░] 67% (6/9 plans)

Progress (legacy bar — see Current Position above for current value): [███░░░░░░░] 67%

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: ~7m
- Total execution time: ~42m

**By Phase:**

| Phase                                             | Plans | Total  | Avg/Plan |
| ------------------------------------------------- | ----- | ------ | -------- |
| 1. Precedence Graph Loader & Normalization        | 2/2   | 10m38s | 5m19s    |
| 2. Scheduling Helper & Propagation Algorithm Core | 3/3   | ~21m   | ~7m      |
| 3. Propagation API Endpoint & Contract            | 1/3   | ~10m   | ~10m     |
| 4. Frontend Service Client & MobX Preview Store   | 0     | —      | —        |
| 5. Drag Handler Integration & Error UX            | 0     | —      | —        |
| 6. End-to-End Coverage & Polish                   | 0     | —      | —        |

**Plan execution log:**

| Phase-Plan | Tasks | Files | Duration | Completed            |
| ---------- | ----- | ----- | -------- | -------------------- |
| 01-01      | 3     | 6     | 4m43s    | 2026-05-03T15:26:37Z |
| 01-02      | 2     | 3     | 5m55s    | 2026-05-03T15:37:28Z |
| 03-01      | 2     | 7     | ~10m     | 2026-05-04T00:00:00Z |

**Recent Trend:**

- Last 5 plans: 01-01 (4m43s), 01-02 (5m55s)
- Trend: Phase 1 complete in ~10m; loader contract locked for downstream phases.

_Updated after each plan completion_

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Backend propagation service is implemented as a deep module (Ousterhout): graph traversal, direction normalization, date-range movement, limit enforcement, and error selection are encapsulated behind a small interface (`apps/api/plane/app/services/timeline_propagation/`).
- Sequential phase execution (`parallelization=false`): Phase 1→2→3 must lock the algorithm/API contract before Phase 4 (frontend client/store), Phase 5 (drag handler), or Phase 6 (E2E) begin.
- Date math is isolated in a calendar-day helper so the deferred Working Calendar milestone (ADR 0002) can swap arithmetic without breaking the API surface or graph traversal.
- Dedicated propagation endpoint, not an overload of the existing bulk date update endpoint — different validation, response, and failure semantics.
- (01-01) Timeline propagation value types use `@dataclass(frozen=True, slots=True)` — first instance of frozen+slots in apps/api/plane. Prevents field mutation (FrozenInstanceError) and runtime attribute injection (T-01-01-02 mitigation).
- (01-01) `Adjacency.successors_of` / `.predecessors_of` return empty frozenset for unknown ids — Phase 2 walks the graph from arbitrary moved nodes and relies on this no-KeyError contract (D-06).
- (01-01) PROP-18 move-only scope is declared at the public surface (both `types.py` and `__init__.py` module docstrings) — resize is not a concept in the timeline_propagation module.
- (01-01) Inter-plan RED handoff pattern: ship the failing pytest case in plan N so plan N+1 has an immediate GREEN target. `__init__.py` forward-references the not-yet-created `.graph` module by design.
- (01-02) Cross-project edge classification reads BOTH endpoints' `project_id` (issue + related_issue), not only the related_issue side as the plan's literal `_make_edge` skeleton showed. PROP-16 semantics ("paths reaching outside the project fail propagation") apply regardless of which side of the IssueRelation row the foreign Issue lives on; Pitfall 2 invariant (no `row.project_id` use) is preserved.
- (01-02) Cycle detection is iterative three-color DFS with explicit list-of-(node, iter) stack, deterministic sort order on roots and successors (Pitfall 4), self-edge guard before color tracking (D-05). No recursion; no `sys.setrecursionlimit`. Returns the closed cycle path as `tuple[UUID, ...]` (last element equals first); never throws across the module boundary.
- (01-02) D-08 / PROP-18 lint-grep test (`test_no_drf_or_http_imports_in_module`) walks `pathlib.Path.rglob("*.py")` under the package and asserts no `rest_framework`, `django.http`, `plane.app.views`, `plane.app.serializers` imports — locks isolation for future Phase 2 modules (`scheduling.py`, `propagation.py`, `errors.py`).
- (01-02) `RelationLike` Protocol is the loader's structural input contract — first `typing.Protocol` use in apps/api/plane/. Lets tests pass plain dataclasses if desired without import-time coupling to ORM rows; Phase 3 `IssueRelation` queryset rows satisfy it automatically.
- (03-01) URL canonical path is `/api/workspaces/<slug>/projects/<uuid>/timeline-propagation/` (not `/api/v1/...` as CONTEXT D-01 narrative implied). The URL **name** `project-timeline-propagation` is what's locked; tests use `reverse(...)` rather than hardcoded paths. CONTEXT D-01 narrative was an off-by-one description of the urlconf mount.
- (03-01) `IssueFactory` pins `state.project` to the issue's project via `factory.SubFactory(StateFactory, project=factory.SelfAttribute("..project"))` — the cross-FK invariant must be wired at the SubFactory level or callers passing `project=p` get a state with a different (auto-generated) project.
- (03-01) `TimelinePropagationView.post(...)` returns 501 in Plan 03-01 — Plan 03-02 replaces the body wholesale. Module docstring documents the `transaction.on_commit` Django 4.2 pattern even though Plan 03-03 owns the actual call site.

### Pending Todos

None yet.

### Blockers/Concerns

- **Vitest harness decision for `apps/web` / `@plane/utils`** (Phase 4): TEST-19..TEST-22 require frontend store/helper unit tests. `apps/web` has no JS test harness today (per `CONCERNS.md`). Recommendation locked in Phase 4 to put pure preview/diff logic in `@plane/utils` with Vitest, but final decision needs user sign-off in plan-phase.
- **`expected_updated_at` precision and HTTP status mapping** (Phase 3): exact ISO format and 409 vs 422 selection per error code must be locked during Phase 3 plan-phase.
- **Adjacency definition** (Phase 2): confirm `successor.start = predecessor.target + 1 calendar day` is the canonical adjacent case (PRD says yes; nail down at plan-phase).
- **Pre-existing unit-suite failures** (logged in `.planning/phases/01-precedence-graph-loader-normalization/deferred-items.md`): 5 tests fail in `bg_tasks/test_copy_s3_objects.py`, `bg_tasks/test_work_item_link_task.py`, `utils/test_url.py`. They pre-date this milestone (verified by re-running on Plan 01-01's tip `c7df9b8d2d`). Not blocking Phase 2 — out of scope per SCOPE BOUNDARY. May need triage outside this milestone if any timeline_propagation work depends on those modules.

## Deferred Items

Items acknowledged and carried forward (see also `docs/timeline-dependency-follow-up-tasks.md`):

| Category   | Item                                                    | Status                                                | Deferred At |
| ---------- | ------------------------------------------------------- | ----------------------------------------------------- | ----------- |
| Scheduling | Working Calendar (workspace default + project override) | Deferred to follow-up milestone                       | 2026-05-03  |
| Scheduling | Japan public holiday preset (2024-2030)                 | Deferred to follow-up milestone                       | 2026-05-03  |
| Scheduling | `planned_duration_working_days` field                   | Deferred (estimate-model conflict unresolved)         | 2026-05-03  |
| Scheduling | Auto-calc `target_date = start_date + planned_duration` | Deferred                                              | 2026-05-03  |
| Scheduling | Working-day skip during propagation                     | Deferred (Working Calendar prereq)                    | 2026-05-03  |
| UI         | Resize-handle propagation                               | Out of scope (PRD: move-only)                         | 2026-05-03  |
| Scope      | Cross-project propagation                               | Out of scope (fails with `PROJECT_BOUNDARY_EXCEEDED`) | 2026-05-03  |

## Session Continuity

Last session: 2026-05-04T00:00:00.000Z
Stopped at: Phase 3 Plan 03-01 complete (routing scaffold + Wave-0 fixtures + auth tests; 6 GREEN contract tests)
Resume file: .planning/phases/03-propagation-api-endpoint-persistence-contract/03-02-PLAN.md
