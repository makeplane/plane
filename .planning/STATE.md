# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-03)

**Core value:** ドラッグ移動が Precedence Boundary を超えても、サーバ権威で必要最小限の連鎖を all-or-nothing で再配置し、失敗時は明示的な reason code で UI に説明できる。
**Current focus:** Phase 1 — Precedence Graph Loader & Normalization

## Current Position

Phase: 1 of 6 (Precedence Graph Loader & Normalization)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-05-03 — Roadmap and STATE initialized; 71 v1 requirements mapped across 6 phases.

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase                                             | Plans | Total | Avg/Plan |
| ------------------------------------------------- | ----- | ----- | -------- |
| 1. Precedence Graph Loader & Normalization        | 0     | —     | —        |
| 2. Scheduling Helper & Propagation Algorithm Core | 0     | —     | —        |
| 3. Propagation API Endpoint & Contract            | 0     | —     | —        |
| 4. Frontend Service Client & MobX Preview Store   | 0     | —     | —        |
| 5. Drag Handler Integration & Error UX            | 0     | —     | —        |
| 6. End-to-End Coverage & Polish                   | 0     | —     | —        |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

_Updated after each plan completion_

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Backend propagation service is implemented as a deep module (Ousterhout): graph traversal, direction normalization, date-range movement, limit enforcement, and error selection are encapsulated behind a small interface (`apps/api/plane/app/services/timeline_propagation/`).
- Sequential phase execution (`parallelization=false`): Phase 1→2→3 must lock the algorithm/API contract before Phase 4 (frontend client/store), Phase 5 (drag handler), or Phase 6 (E2E) begin.
- Date math is isolated in a calendar-day helper so the deferred Working Calendar milestone (ADR 0002) can swap arithmetic without breaking the API surface or graph traversal.
- Dedicated propagation endpoint, not an overload of the existing bulk date update endpoint — different validation, response, and failure semantics.

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
Stopped at: Roadmap (6 phases) + STATE + REQUIREMENTS traceability written; ready to begin Phase 1 planning.
Resume file: None
