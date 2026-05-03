---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: "Plan 01-01 complete: timeline_propagation package scaffolded + frozen value-type contracts + first failing pytest case (RED handoff to Plan 02)."
last_updated: "2026-05-03T15:26:37Z"
last_activity: 2026-05-03 -- Plan 01-01 complete; Plan 01-02 unblocked
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 2
  completed_plans: 1
  percent: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-03)

**Core value:** ドラッグ移動が Precedence Boundary を超えても、サーバ権威で必要最小限の連鎖を all-or-nothing で再配置し、失敗時は明示的な reason code で UI に説明できる。
**Current focus:** Phase 1 — Precedence Graph Loader & Normalization

## Current Position

Phase: 1 (Precedence Graph Loader & Normalization) — EXECUTING
Plan: 2 of 2 (next)
Status: Plan 01-01 complete (RED handoff); Plan 01-02 ready
Last activity: 2026-05-03 -- Plan 01-01 complete; Plan 01-02 unblocked

Progress: [█░░░░░░░░░] 8%

## Performance Metrics

**Velocity:**

- Total plans completed: 1
- Average duration: 4m43s
- Total execution time: 4m43s

**By Phase:**

| Phase                                             | Plans | Total | Avg/Plan |
| ------------------------------------------------- | ----- | ----- | -------- |
| 1. Precedence Graph Loader & Normalization        | 1/2   | 4m43s | 4m43s    |
| 2. Scheduling Helper & Propagation Algorithm Core | 0     | —     | —        |
| 3. Propagation API Endpoint & Contract            | 0     | —     | —        |
| 4. Frontend Service Client & MobX Preview Store   | 0     | —     | —        |
| 5. Drag Handler Integration & Error UX            | 0     | —     | —        |
| 6. End-to-End Coverage & Polish                   | 0     | —     | —        |

**Plan execution log:**

| Phase-Plan | Tasks | Files | Duration | Completed            |
| ---------- | ----- | ----- | -------- | -------------------- |
| 01-01      | 3     | 6     | 4m43s    | 2026-05-03T15:26:37Z |

**Recent Trend:**

- Last 5 plans: 01-01 (4m43s)
- Trend: First plan completed; baseline established

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

### Pending Todos

None yet.

### Blockers/Concerns

- **Vitest harness decision for `apps/web` / `@plane/utils`** (Phase 4): TEST-19..TEST-22 require frontend store/helper unit tests. `apps/web` has no JS test harness today (per `CONCERNS.md`). Recommendation locked in Phase 4 to put pure preview/diff logic in `@plane/utils` with Vitest, but final decision needs user sign-off in plan-phase.
- **`expected_updated_at` precision and HTTP status mapping** (Phase 3): exact ISO format and 409 vs 422 selection per error code must be locked during Phase 3 plan-phase.
- **Adjacency definition** (Phase 2): confirm `successor.start = predecessor.target + 1 calendar day` is the canonical adjacent case (PRD says yes; nail down at plan-phase).

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

Last session: 2026-05-03
Stopped at: Plan 01-01 complete (3/3 tasks committed; SUMMARY.md written; STATE / ROADMAP / REQUIREMENTS updated). RED handoff to Plan 01-02 in place — `__init__.py` forward-references `.graph`, `test_relates_to_is_dropped` is the first GREEN target.
Resume file: .planning/phases/01-precedence-graph-loader-normalization/01-02-PLAN.md
