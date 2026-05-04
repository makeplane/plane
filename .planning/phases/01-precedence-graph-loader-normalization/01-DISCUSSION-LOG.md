# Phase 1: Precedence Graph Loader & Normalization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 01-Precedence Graph Loader & Normalization
**Mode:** `--auto` (recommended options auto-selected; no AskUserQuestion calls per `discuss-phase/modes/auto.md`)
**Areas discussed:** Loader interface, Cycle detection, Cross-project edges, Relation-type filter, Soft-deleted/archived/draft handling, Adjacency data structure, Type module shape

---

## Loader interface boundary

| Option                                                         | Description                                                                                                | Selected |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| Pure function over an `Iterable[IssueRelation]` + `project_id` | Loader is callable; Phase 3 owns the ORM queryset and pre-filters. Independent unit tests; no DRF imports. | ✓        |
| Loader owns the queryset (`Issue.objects.filter(...)`)         | Loader hides ORM construction internally. Less argument plumbing but couples it to Django ORM lifecycle.   |          |
| Class-based loader with injected ORM accessor                  | Heavier surface; flexibility for DI not yet needed.                                                        |          |

**Selected option:** Pure function over an `Iterable[IssueRelation]` + `project_id` (auto-recommended).
**Notes:** Matches the ROADMAP recommendation ("loader takes a queryset/iterable to keep it pure; Phase 3 owns the ORM call") and the success criterion that the module has no `from rest_framework`, no `from django.http`, no view/serializer imports.

---

## Cycle detection algorithm & shape

| Option                                                          | Description                                                                                 | Selected |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| Iterative DFS three-color, return cycle path on first detection | Bounded stack; reconstructs the cycle for diagnostics; no exception across module boundary. | ✓        |
| Recursive DFS three-color                                       | Cleaner code but risks exceeding Python recursion limit on adversarial graphs.              |          |
| Tarjan's SCC for full-graph diagnostics                         | Returns every cycle, not just one. Overkill for "fail fast on first cycle."                 |          |
| Boolean-only `has_cycle` flag                                   | Simpler return type but loses the cycle path needed for diagnostics.                        |          |

**Selected option:** Iterative DFS three-color, return cycle path (auto-recommended).
**Notes:** Aligns with success criterion "surfaces a typed cycle result that the algorithm layer can convert into `DEPENDENCY_CYCLE` (no exceptions thrown across the module boundary)."

---

## Cross-project edge representation

| Option                                                   | Description                                                                            | Selected |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| Include in adjacency, mark `cross_project=True` per Edge | Phase 2 owns reachability; loader does not dereference foreign issue.                  | ✓        |
| Drop cross-project rows silently                         | Loses the information Phase 2 needs to fail with `PROJECT_BOUNDARY_EXCEEDED`.          |          |
| Abort the load on the first cross-project edge           | Too aggressive — would fail even when the moved Work Item never reaches that subgraph. |          |

**Selected option:** Include + flag (auto-recommended).
**Notes:** Honors success criterion "the loader marks the edge as cross-project so the algorithm layer can fail with `PROJECT_BOUNDARY_EXCEEDED` without ever loading the foreign issue's dates."

---

## Relation-type filter scope

| Option                                                   | Description                                                                                                                   | Selected |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| Only `blocked_by` rows; ignore everything else           | Matches PROP-02 and the canonical storage convention (only `blocked_by` is stored, `blocking` is a synthesized inverse view). | ✓        |
| Treat `start_before` / `finish_before` as precedence too | Out of scope — PRD focuses on `blocking`/`blocked_by` exclusively for v1; would expand the milestone.                         |          |
| Configurable allowlist via constructor argument          | Premature flexibility; no caller wants this today.                                                                            |          |

**Selected option:** `blocked_by` only (auto-recommended).
**Notes:** Confirmed by reading `apps/api/plane/db/models/issue.py:263` (`IssueRelationChoices._RELATION_PAIRS`) and `apps/api/plane/app/views/issue/relation.py:175-203` — `blocking` is never persisted; it's synthesized at the API edge from the same `blocked_by` rows.

---

## Soft-deleted / archived / draft handling

| Option                                                                                | Description                                                                             | Selected |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------- |
| Caller (Phase 3) pre-filters; loader defensively re-checks `IssueRelation.deleted_at` | Loader stays free of `Issue` JOINs while still being safe under direct test invocation. | ✓        |
| Loader joins `Issue` to filter `archived_at` / `is_draft` itself                      | Couples the loader to a second model; expands its surface.                              |          |
| Loader does no filtering — fully trusts caller                                        | Footgun: a bad fixture or direct DB row leaks archived items into the graph.            |          |

**Selected option:** Caller pre-filters + loader defensively re-checks `IssueRelation.deleted_at` (auto-recommended).
**Notes:** Documents the contract in `graph.py`'s docstring so Phase 3 cannot forget. Self-edges classified as one-element cycles by the cycle detector.

---

## Adjacency data structure

| Option                                                                                | Description                                                                | Selected |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| Frozen dataclass holding `successors`, `predecessors`, `nodes`, `cross_project_edges` | Both directions pre-computed for Phase 2's bidirectional walks; immutable. | ✓        |
| Single `successors` map; compute `predecessors` on demand                             | Smaller storage but doubles work for leftward moves — Phase 2 hits both.   |          |
| Mutable graph object with helper methods                                              | Encourages accidental mutation and shared state.                           |          |

**Selected option:** Frozen dataclass with both directions + cross-project edge tuple (auto-recommended).
**Notes:** Convenience methods `successors_of(...)` / `predecessors_of(...)` return empty `frozenset` for unknown ids — no `KeyError` leakage to Phase 2 callers.

---

## Type module shape

| Option                                                                                                                                                             | Description                                                                                               | Selected |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------- |
| Identity-only types in Phase 1: `WorkItemNode(id, project_id)`, `Edge(predecessor_id, successor_id, source_relation_id, cross_project)`, `Adjacency`, `LoadResult` | Phase 2 owns all date types; cleanest separation of concerns.                                             | ✓        |
| Include `start_date` / `target_date` on `WorkItemNode` now                                                                                                         | Bleeds Phase 2 concerns into Phase 1; expands surface and tests prematurely.                              |          |
| Skip `WorkItemNode` entirely; rely on raw `UUID`s                                                                                                                  | ROADMAP explicitly lists `WorkItemNode` in `types.py`; identity + project membership is small but useful. |          |

**Selected option:** Identity-only types (auto-recommended).
**Notes:** Phase 2 will introduce a separate `ScheduledWorkItem` (id + dates + duration) and a `MoveIntent` type when it owns the date-range algorithm. Keeps Phase 1's blast radius minimal.

---

## Claude's Discretion

- Implementation detail of cross-project annotation on the input row (precomputed `related_project_id` annotation vs. `select_related("related_issue__project_id")`) — Phase 3's call.
- Free function (`load_precedence_graph(...)`) vs. small `GraphLoader` class — leaning to free function for purity; revisit if Phase 3 wants DI hooks for testing.

## Deferred Ideas

- Caching loaded graphs per project — defer until Phase 3 measures real endpoint latency.
- Audit logging from `Edge.source_relation_id` — deferred to a later observability pass.
- Loader-level support for the future Working Calendar / working-day model — explicitly out of scope per ADR 0002.
- Iterating cross-project classification approach (annotation vs. select_related) — Phase 3 detail.
