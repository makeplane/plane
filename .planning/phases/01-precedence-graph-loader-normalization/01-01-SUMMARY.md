---
phase: 01-precedence-graph-loader-normalization
plan: 01
subsystem: api
tags: [python, django, dataclass, precedence-graph, timeline-propagation, tdd-red]

# Dependency graph
requires: []
provides:
  - "timeline_propagation public surface (5 symbols): WorkItemNode, Edge, Adjacency, LoadResult, load_precedence_graph"
  - "Frozen value-type contracts (slots=True) that Plan 02 / Phase 2 / Phase 3 inherit verbatim"
  - "Adjacency.successors_of / .predecessors_of convenience methods (return frozenset() for unknown ids; no KeyError leak)"
  - "Failing pytest case TestLoadPrecedenceGraphFilters::test_relates_to_is_dropped (RED handoff to Plan 02)"
  - "PROP-18 move-only scope declared at module surface (types.py + __init__.py docstrings)"
affects: [01-02, phase-2, phase-3]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "First sub-package under apps/api/plane/app/services/ — establishes the services umbrella convention"
    - "@dataclass(frozen=True, slots=True) value-type idiom (zero hits before this plan; deliberate new convention per CONTEXT.md D-06/D-07)"
    - "PEP-585 native generics (frozenset[UUID], tuple[Edge, ...]) + PEP-604 unions (tuple[UUID, ...] | None) — no `from __future__ import annotations` per RESEARCH.md A7"
    - "Mapping imported from collections.abc, not typing"
    - "Per-test ORM fixture chain workspace → project → state (matches tests/unit/models/test_issue_comment_modal.py analog; no factory_boy extension)"
    - "RED-state handoff between sequential plans: __init__.py forward-references not-yet-implemented .graph module to drive Plan 02 to GREEN"

key-files:
  created:
    - apps/api/plane/app/services/__init__.py
    - apps/api/plane/app/services/timeline_propagation/__init__.py
    - apps/api/plane/app/services/timeline_propagation/types.py
    - apps/api/plane/tests/unit/services/__init__.py
    - apps/api/plane/tests/unit/services/timeline_propagation/__init__.py
    - apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py
  modified: []

key-decisions:
  - "D-06: Adjacency exposes both successors and predecessors mappings pre-computed at load time (Phase 2 needs both forward and backward walks). Convenience methods return frozenset() for unknown ids — no KeyError leaks to callers."
  - "D-07: types.py holds identity-and-classification only (no schedule dates). Schedule (start_date, target_date, updated_at) deferred to Phase 2's ScheduledWorkItem."
  - "D-10: Tests use per-test Model.objects.create() — do NOT extend factories.py for IssueFactory / IssueRelationFactory in Phase 1; matches the test_issue_comment_modal.py analog and minimizes blast radius."
  - "PROP-18 move-only scope is declared at the module's public surface (both types.py module docstring and __init__.py module docstring). Resize is not a concept in this module."
  - "Deliberate new convention: @dataclass(frozen=True, slots=True). Existing codebase has zero frozen+slots dataclasses; introduced here for value-type immutability and runtime attribute-injection guard (T-01-01-02 mitigation)."

patterns-established:
  - "License-header empty marker (4 lines + trailing blank) for new package directories under apps/api/plane/app/services/."
  - "Flat re-export __init__.py barrel idiom (Adjacency, Edge, LoadResult, WorkItemNode, load_precedence_graph) — matches apps/api/plane/utils/exporters/__init__.py."
  - "Inter-plan RED handoff: ship the failing test in plan N so plan N+1 has an immediate GREEN target. test_relates_to_is_dropped is Plan 02's first GREEN target."
  - "_make_blocked_by helper encodes D-04 directionality (issue=successor, related_issue=predecessor) in one place so test bodies don't have to re-derive it."

requirements-completed: [PROP-18]

# Metrics
duration: 4m43s
completed: 2026-05-03
---

# Phase 1 Plan 01: Scaffold timeline_propagation package + types.py + first failing pytest case Summary

**timeline_propagation package scaffolded with frozen+slots value-type contracts (WorkItemNode, Edge, Adjacency, LoadResult) and a single failing pytest case (test_relates_to_is_dropped) wired to drive Plan 02 from RED to GREEN.**

## Performance

- **Duration:** 4m43s
- **Started:** 2026-05-03T15:21:54Z
- **Completed:** 2026-05-03T15:26:37Z
- **Tasks:** 3
- **Files created:** 6
- **Files modified:** 0

## Accomplishments

- New services umbrella package `apps/api/plane/app/services/` exists and is importable by `python -c "import plane.app.services"`.
- `timeline_propagation` sub-package exposes a clean public surface via `__init__.py` re-exports (5 symbols): `Adjacency`, `Edge`, `LoadResult`, `WorkItemNode`, `load_precedence_graph`.
- `types.py` defines four `@dataclass(frozen=True, slots=True)` value types with the exact field shapes locked by D-06 / D-07 — every later phase inherits these verbatim. Frozen + slots invariants verified by smoke test (`FrozenInstanceError` on field mutation, `AttributeError`/`TypeError` on attribute injection).
- `Adjacency.successors_of` / `.predecessors_of` return empty `frozenset()` for unknown ids (no `KeyError` leak — Phase 2 walks the graph from arbitrary moved nodes and relies on this contract).
- `LoadResult.cycle` accepts both `None` (DAG) and `tuple[UUID, ...]` (closed-path cycle) — verified by smoke test.
- Test sub-tree at `apps/api/plane/tests/unit/services/timeline_propagation/` is discoverable by pytest and contains the first failing PROP-02 test case `test_relates_to_is_dropped` — the explicit RED handoff to Plan 02.
- PROP-18 move-only scope is declared at the module surface (both `types.py` and `__init__.py` module docstrings).

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold empty package markers (services umbrella + test sub-tree)** — `299261c8a2` (chore)
2. **Task 2: Define types.py — frozen value-type dataclasses (D-06, D-07)** — `c86eccdaf8` (feat)
3. **Task 3: Wire **init**.py barrel + write first failing test (TDD RED)** — `8252a268c6` (test)

**Plan metadata commit:** _to be added in final commit_

_Note: Task 2 was tagged `tdd="true"`. The TDD cycle here is "behavior contract via smoke verification" rather than a separate test file, because the pytest test that exercises these types lives in Task 3 (and is intentionally RED at end-of-plan). Task 2's `<verify>` smoke import drove the file from "doesn't exist" to "contract holds" in one shot._

## Files Created/Modified

### Created

- `apps/api/plane/app/services/__init__.py` — Empty 4-line license-header marker. Establishes the new services umbrella package. Empty by intent (RESEARCH.md "Pitfall 5": no eager Django-model imports → no app-load races).
- `apps/api/plane/app/services/timeline_propagation/__init__.py` — Re-export barrel. Imports `load_precedence_graph` from `.graph` (forward reference; Plan 02 implements) and `Adjacency, Edge, LoadResult, WorkItemNode` from `.types`. Module docstring declares PROP-18 move-only scope.
- `apps/api/plane/app/services/timeline_propagation/types.py` — Four `@dataclass(frozen=True, slots=True)` classes: `WorkItemNode(id, project_id)`, `Edge(predecessor_id, successor_id, source_relation_id, cross_project)`, `Adjacency(successors, predecessors, nodes, cross_project_edges)` with `successors_of` / `predecessors_of` convenience methods, and `LoadResult(adjacency, cycle)` with `cycle: tuple[UUID, ...] | None`.
- `apps/api/plane/tests/unit/services/__init__.py` — Empty marker (test sub-package parent).
- `apps/api/plane/tests/unit/services/timeline_propagation/__init__.py` — Empty marker (test sub-package).
- `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` — `workspace` / `project` / `state` fixtures (per-test ORM fixture chain, matches `test_issue_comment_modal.py` analog), `_make_issue` / `_make_blocked_by` helpers (D-04 directionality), and `TestLoadPrecedenceGraphFilters::test_relates_to_is_dropped` — the failing PROP-02 case that drives Plan 02 to GREEN.

## Decisions Made

None beyond plan execution — all key decisions (D-06, D-07, D-10, PROP-18 surface declaration) were locked in CONTEXT.md and applied verbatim from the plan. See key-decisions in frontmatter for the executed decisions.

## RED-state Handoff to Plan 02

This plan is INTENTIONALLY RED at end-of-plan. The acceptance criteria explicitly require:

> Pytest exits non-zero (RED is expected — `graph.py` doesn't exist yet, so import fails). The acceptance is that the test FILE is discoverable and the failure mode is "module not found" or similar, NOT a syntax error.

Verified failure mode at end-of-plan:

```
ModuleNotFoundError: No module named 'plane.app.services.timeline_propagation.graph'
```

Failure occurs at `__init__.py:13` (`from .graph import load_precedence_graph`) during pytest collection. This is the explicit RED handoff: Plan 02's first task creates `graph.py` with a stub, at which point collection succeeds and `test_relates_to_is_dropped` becomes the first GREEN target.

## Deviations from Plan

None — plan executed exactly as written.

### Plan-internal verification inconsistency (informational, not a deviation)

The plan's `<verification>` block contains an internal inconsistency that surfaced at end-of-plan: Verify 1 claims `python -c "from plane.app.services.timeline_propagation.types import ..."` MUST succeed, while Verify 2 declares the package-level `from plane.app.services.timeline_propagation import load_precedence_graph` import EXPECTED to fail with `ModuleNotFoundError`. Once `__init__.py` re-exports `.graph` (Task 3), Python's import machinery executes the parent package `__init__.py` even for direct submodule imports — so Verify 1's command also fails with the same `ModuleNotFoundError`.

This does NOT indicate a code defect:

- `types.py` itself is fully implemented and contract-correct, verified independently by direct file-load via `importlib.util.spec_from_file_location` (smoke output: `types-direct-ok`).
- The `__init__.py` cascade-failure is the EXPLICIT RED handoff to Plan 02 per the plan's own `<acceptance_criteria>` and `<verification>` Verify 2.
- Plan 02's first task creates a `graph.py` stub that resolves the import, at which point both Verify 1 and Verify 2's "MUST succeed"/"EXPECTED to fail" semantics align.

No fix applied; documenting for Plan 02 verifier so the verifier doesn't re-flag this as a regression.

## Verification Results

Final plan verification block (from PLAN.md `<verification>`):

| #   | Check                                                                                   | Result                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `python -c "from plane.app.services.timeline_propagation.types import ..."`             | Cascade-fails through `__init__.py:13` (intentional RED). `types.py` standalone verified via `importlib.util` direct load: `types-direct-ok`.    |
| 2   | `python -c "from plane.app.services.timeline_propagation import load_precedence_graph"` | EXPECTED FAIL with `ModuleNotFoundError: No module named 'plane.app.services.timeline_propagation.graph'` ✓ matches plan's expected RED handoff. |
| 3   | `pytest plane/tests/unit/services/timeline_propagation/test_graph.py --collect-only`    | EXPECTED collection error (1 error during collection) — failure cause is the same `ModuleNotFoundError on .graph`. NOT a syntax error. ✓         |

Per-task acceptance criteria verification:

- Task 1: 3 markers exist with exact 4-line license header, no imports; `python -c "import plane.app.services"` succeeds. ✓
- Task 2: 4 dataclasses declared with `@dataclass(frozen=True, slots=True)`; PEP-585/PEP-604 generics; `Mapping` from `collections.abc`; smoke test prints `types-ok`; ruff check passes. ✓
- Task 3: `__init__.py` declares PROP-18, re-exports 5 symbols (count via `grep -o` = 10, satisfies "≥10 mentions" criterion); `test_graph.py` has `@pytest.mark.unit` + `@pytest.mark.django_db` + `TestLoadPrecedenceGraphFilters::test_relates_to_is_dropped`; D-04 directionality encoded in `_make_blocked_by` helper; no DRF/HTTP/view/serializer imports; ruff check passes. ✓

## Issues Encountered

None during planned work. The Verify-1 verification mismatch noted above is a plan-spec issue, not an issue encountered during execution.

## Threat Flags

None. This plan creates only data-shape contracts and empty packages — no new request input, no new I/O, no untrusted data, no auth surface. T-01-01-02 (Tampering / frozen-dataclass mutability) is mitigated as planned: `frozen=True` + `slots=True` enforced on all four dataclasses; smoke test asserts `FrozenInstanceError` on field mutation and `AttributeError`/`TypeError` on attribute injection.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Plan 02 (01-02-PLAN.md) is unblocked and has an immediate GREEN target.**

Plan 02 should:

1. Create `apps/api/plane/app/services/timeline_propagation/graph.py` with `load_precedence_graph(relations, project_id) -> LoadResult`. Even a minimal stub (return empty `LoadResult`) will make the existing `__init__.py` import succeed and Plan 01's `test_relates_to_is_dropped` pass (because `relates_to` rows produce no edges in any correct implementation).
2. Add the remaining 9 test cases (filter / direction / cycle / cross-project / empty / self-edge / adjacency shape / convenience / lint-grep purity) per RESEARCH.md §"Validation Architecture".
3. Implement the iterative three-color DFS cycle detection per RESEARCH.md "Pattern 3" (lines 419–478).

**Cross-phase contract locked by this plan (Plan 02 / Phase 2 / Phase 3 must consume verbatim):**

- `WorkItemNode(id: UUID, project_id: UUID)`
- `Edge(predecessor_id: UUID, successor_id: UUID, source_relation_id: UUID, cross_project: bool)`
- `Adjacency(successors: Mapping[UUID, frozenset[UUID]], predecessors: Mapping[UUID, frozenset[UUID]], nodes: frozenset[UUID], cross_project_edges: tuple[Edge, ...])` with `successors_of(node_id) -> frozenset[UUID]` and `predecessors_of(node_id) -> frozenset[UUID]`
- `LoadResult(adjacency: Adjacency, cycle: tuple[UUID, ...] | None)`
- Public symbols re-exported from `apps/api/plane/app/services/timeline_propagation/__init__.py`: `Adjacency`, `Edge`, `LoadResult`, `WorkItemNode`, `load_precedence_graph`

## Self-Check: PASSED

All 6 created files exist on disk; all 3 task commit hashes (`299261c8a2`, `c86eccdaf8`, `8252a268c6`) are reachable from `git log --oneline --all`. SUMMARY.md exists at the expected path.

---

_Phase: 01-precedence-graph-loader-normalization_
_Completed: 2026-05-03_
