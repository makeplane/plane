# Phase 2: Date-Range Scheduling Helper & Propagation Algorithm Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 02-Date-Range Scheduling Helper & Propagation Algorithm Core
**Mode:** `--auto` (recommended option auto-selected for every gray area; no user prompts)
**Areas discussed:** Algorithm shape, PropagationResult shape, Public types & shapes, Error code shape, Validation order, Cycle pre-check semantics, Stale check ownership, INCOMPLETE_SCHEDULE timing, Cross-project failure semantics, Limit counting, Date math isolation, Public surface, Test fixture style

---

## Algorithm shape

| Option                                                        | Description                                                                                                                                                                                                           | Selected |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Frontier expansion (BFS by direction) with delta accumulation | Walk only the move's direction (forward through successors for rightward; backward through predecessors for leftward). Push neighbors only on non-zero shift. Naturally yields minimum movement and gap preservation. | ✓        |
| Full topological recompute                                    | Topo-sort the precedence subgraph, recompute every node's earliest valid start. Visits unaffected nodes; violates PROP-04/PROP-05 minimum-movement intent.                                                            |          |
| Arrival-time DP                                               | Per-node earliest-arrival via dynamic programming over the DAG. Over-engineered for unweighted single-root delta.                                                                                                     |          |

**Auto choice:** Frontier expansion. Smallest interface, matches PRD's minimum-movement semantics, frontier-stop encodes gap preservation by construction.

---

## PropagationResult shape

| Option                                                                          | Description                                                                                                                           | Selected |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Single `PropagationResult` dataclass with `failure: PropagationFailure \| None` | Mirrors Phase 1 `LoadResult.cycle: tuple \| None`. `failure is None` ⇔ success. Pattern-matchable; trivially serializable by Phase 3. | ✓        |
| Sum type (`Success \| Failure`)                                                 | Two distinct dataclasses; isinstance branching at every consumer. Phase 3 would have to flatten anyway.                               |          |
| Exception-raising `propagate_move(...)`                                         | Algorithm raises typed exceptions; consumers catch. Conflicts with Phase 1 D-02 "no exceptions across module boundary" discipline.    |          |

**Auto choice:** Result-pattern dataclass.

---

## Public types & shapes

| Option                                                                                     | Description                                                                         | Selected |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | -------- |
| Frozen dataclasses (`MoveIntent`, `ScheduledWorkItem`, `WorkItemUpdate`) with `slots=True` | Immutable inputs; mirrors Phase 1 D-06/D-07.                                        | ✓        |
| Plain `TypedDict`s                                                                         | Less ceremony, but no runtime immutability and no easy `==` assertions in tests.    |          |
| Pydantic models                                                                            | Full validation/coercion stack, but adds a dependency Phase 1 deliberately avoided. |          |

**Auto choice:** Frozen dataclasses, identity by id, no schedule mutation possible inside the algorithm.

---

## Error code shape

| Option                                   | Description                                                                                      | Selected |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| `StrEnum` (Python 3.12 stdlib)           | Enum semantics + `code.value` already a string. Iteration / membership / `match`-by-member work. | ✓        |
| Plain `Enum`                             | Requires `.value` everywhere in serializers.                                                     |          |
| `Literal["DEPENDENCY_CYCLE", ...]` union | No centralized iteration; loses ergonomic `match`.                                               |          |

**Auto choice:** `StrEnum` — Python 3.12.10 already pinned (STACK.md), no migration cost.

---

## Validation order

| Option                                                                                                                           | Description                                                                     | Selected |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Fixed early-return order (INVALID_DATE_RANGE → DEPENDENCY_CYCLE → INCOMPLETE_SCHEDULE on dragged item → SCHEDULE_CHANGED → walk) | Earliest possible rejection of obviously bad input. Deterministic and testable. | ✓        |
| Walk-first; collect all failures; pick highest priority                                                                          | More work for invalid inputs; harder to reason about.                           |          |
| Each failure raised independently                                                                                                | Loses the all-or-nothing discipline.                                            |          |

**Auto choice:** Fixed early-return order. Pinned by an explicit ordering test in `test_propagation.py`.

---

## Cycle pre-check semantics

| Option                                                                 | Description                                                                                                                            | Selected |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Fail-fast on `LoadResult.cycle is not None` regardless of reachability | Server is authoritative; project-graph cycles are structurally invalid for "all-or-nothing" propagation. Surfaces broken graphs early. | ✓        |
| Only fail when the cycle is reachable from the moved item              | More permissive but allows broken graph state to accumulate.                                                                           |          |

**Auto choice:** Fail-fast regardless of reachability.

---

## Stale schedule check ownership & granularity

| Option                                                                       | Description                                                                                                                                                              | Selected |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Phase 2 owns the check; only the **dragged item's** `updated_at` is compared | Algorithmic invariant lives in the deep module. Matches US-27 wording (the user's own snapshot of the dragged item). Not brittle to background server-side propagations. | ✓        |
| Phase 3 view owns the check                                                  | Splits the algorithmic invariant across HTTP and service layers.                                                                                                         |          |
| Phase 2 owns; compare every **touched** item's `updated_at`                  | Brittle: a server-side propagation that touches a downstream node would falsely reject every concurrent drag.                                                            |          |

**Auto choice:** Phase 2 owns; dragged-item-only. Interface still accepts `Mapping[UUID, datetime]` to allow future strict modes without signature change.

---

## INCOMPLETE_SCHEDULE timing

| Option                               | Description                                                                                                          | Selected |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | -------- |
| Lazy detection during walk           | Tied to the propagation path. Avoids touching unaffected items. Matches US-19 "Plane does not invent missing dates". | ✓        |
| Up-front scan of all reachable nodes | More predictable but does extra work even in the success case.                                                       |          |

**Auto choice:** Lazy detection. Dragged-item check is still eager (D-06 step 3) because there is no traversal yet.

---

## Cross-project failure semantics

| Option                                                                                      | Description                                                                                                                                                   | Selected |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Reachability-based (fail only if a cross-project edge is reachable in the move's direction) | Matches PROP-16 / US-20 wording "paths reaching outside the project fail propagation". Allows leaf drags in projects that have unrelated cross-project edges. | ✓        |
| Presence-based (fail if any cross-project edge exists in the project graph)                 | Symmetric with cycle pre-check (D-07) but overly broad for the "minimum scope" intent of the propagation algorithm.                                           |          |

**Auto choice:** Reachability-based. Phase 2 builds reverse indices over `Adjacency.cross_project_edges` once and consults them per visited node.

---

## Limit counting & enforcement

| Option                                                                | Description                                                                | Selected |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| Dragged item = 1 of 100; lazy enforcement on each `affected.add(...)` | Locked by ROADMAP "treat dragged item as 1 of 100". Avoids unbounded work. | ✓        |
| Compute full affected set, then check                                 | Pathological graphs could run unbounded work before failing.               |          |
| Limit = 100 propagated items (101 total counting dragged)             | Contradicts ROADMAP wording.                                               |          |

**Auto choice:** Dragged item = 1 of 100; lazy. `PROPAGATION_LIMIT_EXCEEDED.work_item_id = None` (graph-level outcome).

---

## Date math isolation seam (ADR 0002 swap target)

| Option                                                                           | Description                                                                                    | Selected |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| Pure functions in `scheduling.py`; `propagation.py` calls them exclusively       | The function module IS the seam. ADR 0002 swap = function-module replacement. YAGNI-compliant. | ✓        |
| `Calendar` Protocol injected into `propagate_move(...)`                          | Pre-introduces a DI seam not yet needed. Contradicts "small interface" directive.              |          |
| Strategy class with `CalendarDayStrategy` and a future `WorkingCalendarStrategy` | Even more ceremony; same YAGNI critique.                                                       |          |

**Auto choice:** Pure functions. ADR 0002 will choose between protocol-vs-function-replacement when it lands.

---

## Public surface

| Option                                                                                  | Description                                                                                            | Selected |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| Free function `propagate_move(graph, work_items_by_id, move_intent, expected_versions)` | Mirrors Phase 1 `load_precedence_graph(...)`. Algorithm is deterministic from inputs alone (no clock). | ✓        |
| Small class `Propagator(graph, clock).run(...)`                                         | DI hooks for testing — but no clock dependence and no other DI need today.                             |          |
| Module-level state with config-fed defaults                                             | Loses purity; conflicts with D-14.                                                                     |          |

**Auto choice:** Free function. Phase 3 wraps; future phases can introduce DI when needed.

---

## Test fixture style

| Option                                                                                | Description                                                                                        | Selected |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Pure in-memory dicts, hand-built `Adjacency` / `LoadResult`, `@pytest.mark.unit` only | Algorithm is pure-Python; DB roundtrip wastes I/O. Faster iteration; cleaner failure traces.       | ✓        |
| `factory_boy` + `@pytest.mark.django_db` (Phase 1's pattern)                          | Phase 1 used DB because it consumed real `IssueRelation` rows; Phase 2 consumes Phase 1's outputs. |          |
| Hybrid: in-memory for `test_scheduling.py`, DB for `test_propagation.py`              | Inconsistent; no upside.                                                                           |          |

**Auto choice:** Pure in-memory. No `@django_db` for Phase 2 tests.

---

## Claude's Discretion

The auto-mode chose recommended options for every gray area above. Specific call-outs the user may want to revisit during plan-phase (also captured in CONTEXT.md `<decisions>` "Claude's Discretion"):

- The convention name for `PropagationResult.failure` (vs. `error` / `outcome`).
- Whether `WorkItemUpdate.updated_at` should carry the input value (current contract — Phase 3 sets the post-write value) or whether Phase 3 should pass an `updated_at` factory in.
- Whether `dry_run` mode should be exposed for hypothetical server-side preview (decision: NO; revisit only if a future phase needs it).
- Whether `scheduling.py` helpers should be re-exported from `__init__.py` (decision: YES, so tests don't depth-import).

## Deferred Ideas

(Mirrored from CONTEXT.md `<deferred>` for audit-trail completeness.)

- Working Calendar protocol seam (ADR 0002).
- Per-touched-item `updated_at` strict mode.
- `dry_run` mode for server-side preview.
- Cycle path enrichment (status / title / assignee) at the algorithm layer (belongs in Phase 3 serializer).
- `PROPAGATION_LIMIT_EXCEEDED` carrying the truncated affected list (defer until UX asks).
- Graph caching / incremental updates.
- Audit logging of propagation outcomes (later observability pass).
- `MoveIntent.__post_init__` enforcing PROP-08 (currently enforced inside the algorithm to preserve typed-failure-only-at-the-boundary discipline).
