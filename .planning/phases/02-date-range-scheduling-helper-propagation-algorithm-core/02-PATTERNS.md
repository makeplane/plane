# Phase 2: Date-Range Scheduling Helper & Propagation Algorithm Core - Pattern Map

**Mapped:** 2026-05-04
**Files analyzed:** 9 (3 NEW production + 2 UPDATED + 4 NEW test)
**Analogs found:** 9 / 9 (8 exact in-package, 1 partial — `conftest.py` has no in-tree analog because no per-package conftest exists today)

> **Phase 2's defining characteristic:** Phase 2 is a same-package extension of Phase 1's `apps/api/plane/app/services/timeline_propagation/`. Almost every analog is a Phase 1 file in the same directory. The patterns below extract concrete excerpts from Phase 1 code and pin down what Phase 2 must mirror verbatim vs. what must differ in shape.

---

## File Classification

| File                                                                          | Status                   | Role                                                                     | Data Flow                                                                 | Closest Analog                                                                                                                                                                                                                                                                                                                                          | Match Quality                                                                                                                                                      |
| ----------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/plane/app/services/timeline_propagation/errors.py`                  | NEW                      | service / value-type module (enum + frozen dataclass)                    | transform (in-memory typed values)                                        | `apps/api/plane/app/services/timeline_propagation/types.py` (Phase 1 — sibling, same package, same convention)                                                                                                                                                                                                                                          | exact (sibling pattern)                                                                                                                                            |
| `apps/api/plane/app/services/timeline_propagation/scheduling.py`              | NEW                      | service / pure-function helper module (date math seam)                   | transform (date in → date/timedelta/bool out)                             | `apps/api/plane/utils/issue_search.py` (closest pure free function in `apps/api/plane/`) + `apps/api/plane/app/services/timeline_propagation/graph.py` (header / module-docstring shape)                                                                                                                                                                | role-match + sibling header convention                                                                                                                             |
| `apps/api/plane/app/services/timeline_propagation/propagation.py`             | NEW                      | service / pure-function deep module (BFS traversal)                      | transform (`LoadResult` + `Mapping` + `MoveIntent` → `PropagationResult`) | `apps/api/plane/app/services/timeline_propagation/graph.py` (Phase 1 — same iterative-walk discipline, same purity contract, same Result-pattern return)                                                                                                                                                                                                | exact (sibling — same package, same algorithm shape)                                                                                                               |
| `apps/api/plane/app/services/timeline_propagation/types.py`                   | UPDATE                   | service / value-type module                                              | transform                                                                 | itself — Phase 1's existing dataclasses (`WorkItemNode`, `Edge`, `Adjacency`, `LoadResult`) are the in-file analog                                                                                                                                                                                                                                      | exact (in-file extension)                                                                                                                                          |
| `apps/api/plane/app/services/timeline_propagation/__init__.py`                | UPDATE                   | sub-package re-export barrel                                             | n/a (import-only)                                                         | itself — Phase 1's existing barrel structure (`from .graph import ...`, `__all__ = [...]`)                                                                                                                                                                                                                                                              | exact (in-file extension)                                                                                                                                          |
| `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` | NEW                      | unit test (PURE — no `@django_db`)                                       | request-response (test → assert)                                          | `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py::TestLoadPrecedenceGraphEmpty` + `::TestAdjacencyConvenienceMethods` (the two pure, no-DB classes inside Phase 1's test file)                                                                                                                                                    | role-match (Phase 1 mostly used `@django_db`; Phase 2 D-13 forbids it)                                                                                             |
| `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py`  | NEW                      | unit test (PURE — no `@django_db`)                                       | request-response                                                          | same as above (`test_graph.py` pure-class shape); also `apps/api/plane/tests/unit/utils/test_uuid.py` for the simplest module-level pure-function test pattern                                                                                                                                                                                          | role-match                                                                                                                                                         |
| `apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py`      | NEW (or extend in-place) | unit test (lint-grep)                                                    | file-I/O (read source files, assert no forbidden strings)                 | `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py::test_no_drf_or_http_imports_in_module` (lines 411–435)                                                                                                                                                                                                                          | exact (Phase 1 already wrote the rglob-based scanner; Phase 2 either extends the forbidden-strings list and the test name or moves it to a sibling file unchanged) |
| `apps/api/plane/tests/unit/services/timeline_propagation/conftest.py`         | NEW (optional)           | test fixtures shared across `test_propagation.py` / `test_scheduling.py` | fixture-provision                                                         | **No in-tree analog** — no per-package `conftest.py` exists anywhere under `apps/api/plane/tests/` (only the root `tests/conftest.py`). Closest analogs: (a) the in-file `@pytest.fixture` definitions at the top of `test_graph.py` (lines 46–95); (b) the global `apps/api/plane/tests/conftest.py` for header / `@pytest.fixture` / docstring style. | first of its kind (consider OMITTING — see "No Analog Found")                                                                                                      |

---

## Pattern Assignments

### 1. `apps/api/plane/app/services/timeline_propagation/errors.py` (NEW — service, value-type module)

**Closest analog:** `apps/api/plane/app/services/timeline_propagation/types.py` (Phase 1, same package — frozen dataclass conventions are established there).

> Note: there is NO existing `StrEnum` usage anywhere in `apps/api/` (verified by `Grep "StrEnum" apps/api` returning zero hits). Phase 2 introduces the `StrEnum` convention deliberately under D-05. The enum's _file shape_ (license header, module docstring, single import block, value definitions) still mirrors `types.py`.

**License + module docstring + import-block pattern** (mirror from `types.py:1-27`):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/types.py:1-27
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Value types for the Timeline Dependency precedence graph.

Identity-and-classification types only — schedule dates, durations, and
move intent live in Phase 2's `scheduling.py` / `propagation.py`.

Design invariants (CONTEXT.md D-06, D-07):
  * All public types are frozen dataclasses with `slots=True`.
  * `Adjacency.successors_of` / `.predecessors_of` return `frozenset()` for
    unknown ids — they MUST NOT raise `KeyError` to callers (Phase 2 walks
    the graph from arbitrary moved nodes and relies on this contract).
  ...
Module scope (PROP-18): move-only. Resize is not a concept here.
"""

# Python imports
from collections.abc import Mapping
from dataclasses import dataclass
from uuid import UUID
```

**Frozen dataclass + slots pattern** (mirror exactly from `types.py:29-39`):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/types.py:29-39
@dataclass(frozen=True, slots=True)
class WorkItemNode:
    """Identity of a Work Item participating in the precedence graph.

    Schedule (start_date, target_date, updated_at) is intentionally NOT held
    here — Phase 2 introduces a separate `ScheduledWorkItem` for date math.
    """

    id: UUID
    project_id: UUID
```

**What to mirror:**

- 4-line license header + blank line, exactly as Phase 1 (universal across `apps/api/plane/`).
- Module docstring opens with one-line summary, then "Design invariants (CONTEXT.md D-XX):" block, then "Module scope (PROP-18): move-only" footer line.
- `# Python imports` section divider (graph.py:51 / types.py:23 idiom).
- `@dataclass(frozen=True, slots=True)` for `PropagationFailure` — identical decorator and per-class triple-quoted docstring shape as `WorkItemNode`.
- PEP-585 native generics (`tuple[UUID, ...] | None`) and PEP-604 unions (`PropagationErrorCode | None`); NEVER `typing.Optional` / `typing.Tuple`.
- Field-name lowercase + type annotation per line (no `field(default=...)` unless a default is required).

**What to differ:**

- Phase 2 introduces `from enum import StrEnum` — first `StrEnum` in the codebase. Add an inline comment (`# Python 3.12 stdlib — see CONTEXT.md D-05`) so reviewers see why a previously-unused stdlib symbol appears.
- The `PropagationErrorCode` is an `enum`, not a `dataclass` — but the _file-level_ style still copies the docstring + section-divider pattern.
- `PropagationFailure` carries DEFAULT VALUES on its optional fields (`work_item_id: UUID | None = None`, `cycle: tuple[UUID, ...] | None = None`). Phase 1's `WorkItemNode`, `Edge`, `Adjacency` use NO defaults (every field is required). Document the defaults in the dataclass docstring per CONTEXT.md D-05 ("`work_item_id` carries the offending node when meaningful").
- No convenience methods (`successors_of` / `predecessors_of`) — `PropagationFailure` is a pure value, no behavior.

**Target shape (skeleton — planner copies and fills):**

```python
# apps/api/plane/app/services/timeline_propagation/errors.py
"""Typed failure outcomes for Timeline Dependency Schedule Propagation.

Stable wire contract (US-22, US-37, API-06, CONTEXT.md D-05):
  PropagationErrorCode is the canonical 7-value StrEnum that downstream
  consumers (Phase 3 DRF view → frontend) read to map onto user-facing
  messages. Reordering or renaming members requires an explicit ADR
  amendment.

Module scope (PROP-18): move-only.
"""

# Python imports
from dataclasses import dataclass
from enum import StrEnum  # Python 3.12 stdlib — see CONTEXT.md D-05
from uuid import UUID


class PropagationErrorCode(StrEnum):
    """Canonical wire codes for `PropagationResult.failure`."""

    DEPENDENCY_CYCLE = "DEPENDENCY_CYCLE"
    PROJECT_BOUNDARY_EXCEEDED = "PROJECT_BOUNDARY_EXCEEDED"
    INCOMPLETE_SCHEDULE = "INCOMPLETE_SCHEDULE"
    PROPAGATION_LIMIT_EXCEEDED = "PROPAGATION_LIMIT_EXCEEDED"
    SCHEDULE_CHANGED = "SCHEDULE_CHANGED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    INVALID_DATE_RANGE = "INVALID_DATE_RANGE"


@dataclass(frozen=True, slots=True)
class PropagationFailure:
    """Diagnostic payload for a failed propagation. ..."""

    code: PropagationErrorCode
    message: str
    work_item_id: UUID | None = None
    cycle: tuple[UUID, ...] | None = None
```

---

### 2. `apps/api/plane/app/services/timeline_propagation/scheduling.py` (NEW — pure-function helper module / ADR 0002 swap-seam)

**Closest analog (file shape — module docstring + section dividers + free-function discipline):** `apps/api/plane/app/services/timeline_propagation/graph.py` (Phase 1, same package).

**Closest analog (single-purpose pure free function over primitives):** `apps/api/plane/utils/issue_search.py` (the smallest pure-function module in `apps/api/plane/`).

**Module docstring + section-divider pattern** (mirror from `graph.py:1-58`):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/graph.py:1-58
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Precedence graph loader for Timeline Dependency Schedule Propagation.

Pure-Python module — no DRF / no HTTP / no transactions / no ORM writes.

Direction translation (verified across every IssueRelation creation path in
this codebase, see RESEARCH.md "Existing Code Insights — Directionality
Verification"):

    For each row (issue=X, related_issue=Y, relation_type='blocked_by'):
        emit Edge(predecessor_id=Y (=row.related_issue_id),
                  successor_id=X   (=row.issue_id))
...
Module scope (PROP-18): move-only. Resize is not a concept here.
"""

# Python imports
from collections.abc import Iterable, Iterator
from typing import Protocol
from uuid import UUID

# Module imports
from .types import Adjacency, Edge, LoadResult
```

**Pure free function with type hints** (mirror from `apps/api/plane/utils/issue_search.py` shape, then upgrade to PEP-585 + PEP-604):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/utils/issue_search.py:11-25 (entire body)
def search_issues(query, queryset):
    fields = ["name", "sequence_id", "project__identifier"]
    q = Q()
    for field in fields:
        if field == "sequence_id" and len(query) <= 20:
            sequences = re.findall(r"\b\d+\b", query)
            for sequence_id in sequences:
                q |= Q(**{"sequence_id": sequence_id})
        else:
            q |= Q(**{f"{field}__icontains": query})
    return queryset.filter(q).distinct()
```

**What to mirror:**

- 4-line license header.
- Module docstring opens with "Pure-Python module — no DRF / no HTTP / no transactions / no ORM writes." (verbatim — this is the deep-module-discipline marker established by Phase 1).
- The docstring includes a dedicated section explaining WHY this module is the ADR 0002 swap seam (D-03) — analogous to Phase 1's "Direction translation" callout.
- `# Python imports` section divider (graph.py:51).
- All six helper functions are module-level free functions (no class). Mirrors `_make_edge` / `_detect_cycle` placement at module level in graph.py:136 and graph.py:175.
- Type hints on every parameter and return — mirror graph.py signature style: `def load_precedence_graph(relations: Iterable[RelationLike], project_id: UUID) -> LoadResult:` becomes `def range_duration(start: date, target: date) -> timedelta:`.
- One-line docstring per helper (mirror the `Adjacency.successors_of` / `predecessors_of` one-liner shape at types.py:72-78).
- `from datetime import date, timedelta` is the _only_ date import allowed in this file (CONTEXT.md D-03 — `propagation.py` MUST NOT import `timedelta` directly; this module is the seam).

**What to differ:**

- NO `Protocol` (Phase 1's `RelationLike` at graph.py:60 was needed because the loader accepts ORM rows OR plain dataclasses; scheduling.py's inputs are stdlib `date` / `timedelta` — primitive types need no Protocol).
- NO underscore-prefixed helpers (`_make_edge`, `_detect_cycle` are _internal_ to graph.py; every scheduling.py helper is _public_ and re-exported via `__init__.py` per Claude's-Discretion in CONTEXT.md "to keep `test_scheduling.py` from depth-importing").
- NO Iterative-DFS / cycle-detection complexity — every helper is a one-line wrapper around `+`/`-`/`>=`/`<` on `date` and `timedelta`.

**Target signatures (D-03, copied verbatim from CONTEXT.md):**

```python
# apps/api/plane/app/services/timeline_propagation/scheduling.py
def range_duration(start: date, target: date) -> timedelta: ...
def add_calendar_days(d: date, n: int) -> date: ...
def next_valid_start(after_target: date) -> date: ...
def previous_valid_target(before_start: date) -> date: ...
def is_valid_range(start: date, target: date) -> bool: ...
def boundary_violation(predecessor_target: date, successor_start: date) -> bool: ...
```

---

### 3. `apps/api/plane/app/services/timeline_propagation/propagation.py` (NEW — pure-function deep module / BFS traversal)

**Closest analog:** `apps/api/plane/app/services/timeline_propagation/graph.py` (Phase 1, same package). This is the _closest_ analog in the entire codebase: same package, same purity contract, same iterative-walk discipline, same Result-pattern return shape. Phase 2 mirrors it almost field-for-field with one direction (DFS → BFS) and one return type (`LoadResult` → `PropagationResult`) swapped.

**Module docstring shape** (mirror exactly from graph.py:1-49):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/graph.py:1-49
"""Precedence graph loader for Timeline Dependency Schedule Propagation.

Pure-Python module — no DRF / no HTTP / no transactions / no ORM writes.

Direction translation (verified across every IssueRelation creation path in
this codebase, see RESEARCH.md "Existing Code Insights — Directionality
Verification"):
...

Cycle detection (D-02):
    - Iterative three-color DFS over `Adjacency.successors`.
    - On first back-edge, returns the closed cycle path tuple.
    - Self-edge classified as one-node cycle (a, a).
    - NEVER throws across the module boundary — Phase 2 inspects
      `result.cycle` to translate into DEPENDENCY_CYCLE typed failure.

Caller assumptions (D-05):
    - The caller (Phase 3 view) MUST pre-filter rows whose endpoint
      Work Items are archived / draft / soft-deleted. ...

Module scope (PROP-18): move-only. Resize is not a concept here.
"""
```

**Public free-function entry-point pattern** (mirror from graph.py:84-133):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/graph.py:84-133
def load_precedence_graph(
    relations: Iterable[RelationLike],
    project_id: UUID,
) -> LoadResult:
    """Build a normalized precedence adjacency from IssueRelation rows.

    See module docstring for full semantics. Returns a `LoadResult` whose
    `cycle` is `None` for a DAG or a closed-path tuple on the first
    detected cycle (no exception ever crosses this module boundary).
    """
    successors_mut: dict[UUID, set[UUID]] = {}
    predecessors_mut: dict[UUID, set[UUID]] = {}
    nodes_mut: set[UUID] = set()
    cross_project_edges_mut: list[Edge] = []

    for row in relations:
        ...

    adjacency = Adjacency(
        successors={k: frozenset(v) for k, v in successors_mut.items()},
        predecessors={k: frozenset(v) for k, v in predecessors_mut.items()},
        nodes=frozenset(nodes_mut),
        cross_project_edges=tuple(cross_project_edges_mut),
    )

    cycle = _detect_cycle(adjacency)
    return LoadResult(adjacency=adjacency, cycle=cycle)
```

**Iterative-walk pattern with `_*` helper extraction** (mirror from graph.py:175-228 — the `_detect_cycle` shape; NOTE: Phase 2's walk is BFS, not DFS, so the data structure flips from a stack to a `collections.deque` queue):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/graph.py:175-228
def _detect_cycle(adj: Adjacency) -> tuple[UUID, ...] | None:
    """Iterative three-color DFS (D-02). Returns a closed cycle path or None.

    Deterministic iteration order via `sorted(...)` on roots and successors
    so test assertions on the returned tuple are stable across runs
    (Pitfall 4 — frozenset iteration order is undefined).
    ...
    """
    color: dict[UUID, int] = {n: _WHITE for n in adj.nodes}
    parent: dict[UUID, UUID | None] = {n: None for n in adj.nodes}

    for root in sorted(adj.nodes):
        if color[root] != _WHITE:
            continue

        stack: list[tuple[UUID, Iterator[UUID]]] = [
            (root, iter(sorted(adj.successors_of(root))))
        ]
        color[root] = _GRAY

        while stack:
            node, succ_iter = stack[-1]
            try:
                child = next(succ_iter)
            except StopIteration:
                color[node] = _BLACK
                stack.pop()
                continue
            ...
```

**Internal `_make_edge` / `_*_helper` pattern** (mirror placement and underscore-prefix convention from graph.py:136):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/graph.py:136-172
def _make_edge(row: RelationLike, project_id: UUID) -> Edge:
    """Translate a `blocked_by` row into a typed predecessor → successor Edge.

    For row (issue=X, related_issue=Y, relation_type='blocked_by'):
      - predecessor_id = Y (row.related_issue_id)
      - successor_id   = X (row.issue_id)
      - cross_project  = ANY endpoint's project_id != loader project_id
    ...
    """
    ...
```

**What to mirror:**

- 4-line license header.
- Module docstring shape — opens with "Pure-Python module — no DRF / no HTTP / no transactions / no ORM writes." line (deep-module discipline marker).
- Module docstring includes per-decision sections — for Phase 2 those are: "Validation order (D-06)", "Cycle pre-check (D-07)", "Frontier walk (D-01)", "Cross-project reachability (D-10)", "Limit (D-11)", "Caller assumptions (D-08, D-09)".
- `# Python imports` / `# Module imports` section dividers.
- Module-level constants block (mirror graph.py:78-81 `_WHITE = 0 / _GRAY = 1 / _BLACK = 2` placement); for Phase 2 this is `LIMIT = 100  # PROP-13 / D-11`.
- Single-public-free-function `propagate_move(...)` mirrors `load_precedence_graph(...)` — public, top-of-file (after constants), public docstring, returns Result-pattern type.
- All internal helpers are underscore-prefixed module-level functions (mirror `_make_edge` / `_detect_cycle`). Phase 2's helpers per CONTEXT.md "Specific Ideas": `_compute_shift_forward`, `_compute_shift_backward`, `_validate_intent`, `_build_cross_project_indices`, `_fail` (the `_fail(...)` helper from RESEARCH.md pseudocode line 363).
- Iterative-walk discipline (no recursion) — Phase 1 D-02 forbids `sys.setrecursionlimit`; Phase 2 D-01 inherits the same iterative-only constraint.
- Deterministic neighbor expansion via `iter(sorted(...))` — mirror graph.py:215 (`iter(sorted(adj.successors_of(child)))`). CONTEXT.md "Established Patterns" §"Deterministic iteration via `sorted(...)`" makes this explicit for Phase 2 frontier expansion.
- NEVER raises across the module boundary on a _typed_ failure. All seven failures return a `PropagationResult(failure=PropagationFailure(...), updates=())`. Mirror graph.py's "NEVER throws across the module boundary" wording in the docstring.
- Imports `from .types import (...)` and `from .errors import PropagationErrorCode, PropagationFailure` and `from .scheduling import (...)` — relative imports inside the package (mirror graph.py:57 `from .types import Adjacency, Edge, LoadResult`).
- `from collections.abc import Mapping` (NOT `from typing import Mapping`) — mirror types.py:24.
- `dict[UUID, ...]` / `set[UUID]` PEP-585 native generics — mirror graph.py:94-97.

**What to differ:**

- BFS, not DFS — use `collections.deque` for the frontier (`from collections import deque`); `popleft()` for FIFO order. Phase 1 used `list[tuple[UUID, Iterator[UUID]]]` as a DFS stack; Phase 2 uses `deque[UUID]` as a BFS queue.
- KeyError IS allowed for one specific case: looking up `work_items_by_id[dragged_id]` when the dict is missing the dragged item is a _programmer error_ from Phase 3 (RESEARCH.md Wave 11 `test_expected_versions_missing_dragged_id_raises_or_fails`). Phase 1 never raises; Phase 2 raises only on this contract violation.
- Phase 2 DOES import `from .scheduling import ...` for ALL date arithmetic. Phase 2 MUST NOT import `from datetime import timedelta` directly inside `propagation.py` (CONTEXT.md D-03 — the seam). Phase 1's graph.py imports nothing from `datetime` at all (date-free by design); Phase 2 inherits the same constraint by routing through `scheduling.py`.
- Result type is `PropagationResult`, not `LoadResult`. The shape differs (`failure: PropagationFailure | None` and `updates: tuple[WorkItemUpdate, ...]` vs Phase 1's `cycle: tuple[UUID, ...] | None`). The _pattern_ (Result with optional failure marker) is identical; only the marker types differ.
- Validation-order short-circuits (D-06 steps 1–4) MUST execute _before_ any traversal. Phase 1 had no equivalent — its only "validation" was the relation_type filter inside the loop.
- The reverse-index build for cross-project edges (D-10) happens once at the top of `propagate_move`, NOT per-visit. RESEARCH.md "Specific Ideas" line 266 makes this explicit: "build it up-front simplifies the walk loop and keeps the per-node check a single dict lookup." Phase 1 has no analog (the loader builds adjacency once and exits).
- Phase 2's `_fail(...)` helper (RESEARCH.md pseudocode lines 363, 376, 388, 393) builds a `PropagationResult(failure=..., updates=(), total_updated_count=0, requested_work_item_id=dragged_id)` — Phase 1 has no equivalent because `LoadResult` carries no `failure` field.

---

### 4. `apps/api/plane/app/services/timeline_propagation/types.py` (UPDATE — append four dataclasses)

**Closest analog:** itself — Phase 1's existing `WorkItemNode`, `Edge`, `Adjacency`, `LoadResult` set the convention for every new dataclass.

**The exact pattern to mirror per new dataclass** (from types.py:81-92 — the `LoadResult` is the structural twin of Phase 2's `PropagationResult`):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/types.py:81-92
@dataclass(frozen=True, slots=True)
class LoadResult:
    """Public result of `load_precedence_graph`.

    `cycle` is `None` when the graph is a DAG; otherwise it is a closed path
    (last element equals first) for diagnostics. Phase 2 translates the
    presence of `cycle` into a `DEPENDENCY_CYCLE` typed failure without
    re-throwing across the module boundary.
    """

    adjacency: Adjacency
    cycle: tuple[UUID, ...] | None
```

**Edge dataclass shape** (from types.py:41-54 — Phase 2's `MoveIntent` mirrors this multi-required-field shape):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/types.py:41-54
@dataclass(frozen=True, slots=True)
class Edge:
    """A normalized predecessor → successor precedence edge.

    `cross_project=True` means the successor (or predecessor) belongs to a
    project different from the loaded project. The loader never dereferences
    the foreign issue's dates or fields — only its `project_id` is consulted.
    `source_relation_id` is preserved for diagnostics and audit logging.
    """

    predecessor_id: UUID
    successor_id: UUID
    source_relation_id: UUID
    cross_project: bool
```

**Convenience-method pattern** (from types.py:72-78 — Phase 2's `PropagationResult.is_success` mirrors the no-arg `@property` style; Phase 1 used regular methods because it needed to accept arguments, but the placement/style is the same):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/types.py:72-78
def successors_of(self, node_id: UUID) -> frozenset[UUID]:
    """Return successors of `node_id`; empty frozenset for unknown ids."""
    return self.successors.get(node_id, frozenset())

def predecessors_of(self, node_id: UUID) -> frozenset[UUID]:
    """Return predecessors of `node_id`; empty frozenset for unknown ids."""
    return self.predecessors.get(node_id, frozenset())
```

**What to mirror (for each of the four new dataclasses — `ScheduledWorkItem`, `MoveIntent`, `WorkItemUpdate`, `PropagationResult`):**

- `@dataclass(frozen=True, slots=True)` decorator — verbatim, identical to every Phase 1 type.
- Per-class triple-quoted docstring opening with one-line summary, then a blank line, then 1–3 paragraphs of design rationale citing the relevant CONTEXT.md decision (D-04, D-08, D-11, etc.).
- Field declarations: lowercase + type annotation per line, no defaults unless explicitly required.
- PEP-585 generics: `tuple[WorkItemUpdate, ...]`, `Mapping[UUID, ScheduledWorkItem]`. PEP-604 unions: `date | None`, `PropagationFailure | None`.
- Imports added at the top of `types.py` with `# Python imports` block — mirror types.py:23-27. New imports: `from datetime import date, datetime`. The existing `from collections.abc import Mapping` and `from uuid import UUID` are reused.
- Forward-reference style — Phase 2's `PropagationResult.failure: PropagationFailure | None` requires importing `PropagationFailure` from `.errors`. Mirror Phase 1's `from .types import Adjacency, Edge, LoadResult` style at graph.py:57: use a relative `from .errors import PropagationFailure` at the top of types.py. `errors.py` MUST NOT import from `types.py` (avoid circular import — errors.py declares no `UUID`-typed dataclass besides `PropagationFailure`, and `PropagationFailure.work_item_id: UUID | None` only needs `from uuid import UUID`).

**What to differ:**

- `MoveIntent` has FIVE required fields (no defaults) — larger than any Phase 1 dataclass (`Edge` has 4). Per CONTEXT.md D-04, no `__post_init__` validator (PROP-08 duration preservation is enforced inside `propagate_move`, NOT on the dataclass; this is a deliberate Deferred Idea).
- `ScheduledWorkItem` has FIVE fields including TWO `Optional` fields (`start_date: date | None`, `target_date: date | None`) — Phase 1 has no `Optional` field anywhere. The Optionals model PROP-17 (incomplete schedule). Document this in the dataclass docstring per CONTEXT.md D-04 ("dates may be `None` to model PROP-17").
- `PropagationResult` has a `@property` (not a method) — `is_success: bool` returns `self.failure is None`. Phase 1's convenience methods (`successors_of`, `predecessors_of`) are regular methods because they take an argument. Use `@property` for the no-arg case to make the call site read as `result.is_success` (mirroring Python's "property for cheap derived state" idiom).
- Phase 2 must add NEW imports while not reshaping Phase 1's imports — append `from datetime import date, datetime` to the existing `# Python imports` block, then add `# Module imports` block above with `from .errors import PropagationFailure`.

---

### 5. `apps/api/plane/app/services/timeline_propagation/__init__.py` (UPDATE — extend re-export barrel)

**Closest analog:** itself — the existing 23-line file (Phase 1) is the exact shape Phase 2 extends.

**Existing file (entire content)** — Phase 2 extends this in place:

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/__init__.py:1-23
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Precedence graph loader & normalization for Timeline Dependency Schedule Propagation.

Pure-Python service module — no DRF / no HTTP / no transactions.
Consumed by `propagate_move` (Phase 2) and the Phase 3 DRF view.

Module scope (PROP-18): move-only. Resize is not a concept in this module.
"""

from .graph import load_precedence_graph
from .types import Adjacency, Edge, LoadResult, WorkItemNode

__all__ = [
    "Adjacency",
    "Edge",
    "LoadResult",
    "WorkItemNode",
    "load_precedence_graph",
]
```

**What to mirror:**

- Keep the 4-line license header verbatim.
- Keep the module docstring; UPDATE the second sentence — the file is no longer "loader & normalization" only. Suggested replacement: `"""Timeline Dependency Schedule Propagation — pure-Python service module.\n\nPure-Python service module — no DRF / no HTTP / no transactions. Owns the\nprecedence graph loader (Phase 1) and the date-range propagation algorithm\n(Phase 2). The Phase 3 DRF view consumes both via the public re-exports below."""`.
- Same flat re-export style — `from .module import Symbol` per line, sorted alphabetically inside `__all__`.
- Per CONTEXT.md "Claude's Discretion": re-export `scheduling.py` helpers (`add_calendar_days`, `boundary_violation`, `is_valid_range`, `next_valid_start`, `previous_valid_target`, `range_duration`) so `test_scheduling.py` does NOT need to depth-import.
- `__all__` sorted alphabetically (Phase 1 already sorts: `Adjacency, Edge, LoadResult, WorkItemNode, load_precedence_graph`). Phase 2 maintains the sort.
- F401 is ignored for `__init__.py` per `apps/api/pyproject.toml:69-70` — re-export-only files are idiomatic and lint-clean.

**What to differ:**

- Add the new imports per CONTEXT.md D-12: `from .errors import PropagationErrorCode, PropagationFailure`, `from .propagation import propagate_move`, `from .scheduling import (...)`, and from `.types` add `MoveIntent, PropagationResult, ScheduledWorkItem, WorkItemUpdate`.
- Phase 1 exports remain unchanged in NAME and SHAPE (CONTEXT.md D-12 — "Phase 1's exports are unchanged"). Reordering `__all__` is fine; removing or renaming a Phase 1 entry is forbidden.
- The new `__all__` is roughly twice as long; group via comment (optional) if the planner finds it improves readability — Phase 1 used no group comments, so default to "no comments" for consistency.

**Target shape (skeleton — planner copies and fills):**

```python
# apps/api/plane/app/services/timeline_propagation/__init__.py (Phase 2 — extended)
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Timeline Dependency Schedule Propagation — pure-Python service module.

Pure-Python service module — no DRF / no HTTP / no transactions. Owns the
precedence graph loader (Phase 1) and the date-range propagation algorithm
(Phase 2). The Phase 3 DRF view consumes both via the public re-exports below.

Module scope (PROP-18): move-only. Resize is not a concept in this module.
"""

from .errors import PropagationErrorCode, PropagationFailure
from .graph import load_precedence_graph
from .propagation import propagate_move
from .scheduling import (
    add_calendar_days,
    boundary_violation,
    is_valid_range,
    next_valid_start,
    previous_valid_target,
    range_duration,
)
from .types import (
    Adjacency,
    Edge,
    LoadResult,
    MoveIntent,
    PropagationResult,
    ScheduledWorkItem,
    WorkItemNode,
    WorkItemUpdate,
)

__all__ = [
    "Adjacency",
    "Edge",
    "LoadResult",
    "MoveIntent",
    "PropagationErrorCode",
    "PropagationFailure",
    "PropagationResult",
    "ScheduledWorkItem",
    "WorkItemNode",
    "WorkItemUpdate",
    "add_calendar_days",
    "boundary_violation",
    "is_valid_range",
    "load_precedence_graph",
    "next_valid_start",
    "previous_valid_target",
    "propagate_move",
    "range_duration",
]
```

---

### 6. `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` (NEW — pure unit tests, NO `@django_db`)

**Closest analog:** `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` (Phase 1, sibling), specifically the two PURE classes that don't use `@django_db`:

- `TestLoadPrecedenceGraphEmpty` (lines 333-347)
- `TestAdjacencyConvenienceMethods` (lines 391-407)

**Important context:** Phase 1's `test_graph.py` is dominated by `@pytest.mark.django_db` tests (it loads real `IssueRelation` rows). Phase 2's `test_propagation.py` is the **opposite**: per CONTEXT.md D-13, **NO `@pytest.mark.django_db`, NO `factory_boy`, NO DB roundtrip**. Phase 2 hand-builds `Adjacency`, `LoadResult`, `ScheduledWorkItem` literals because the algorithm consumes Phase 1's _outputs_, which are plain dataclasses.

So Phase 2's test file mirrors Phase 1's _file structure_ (license header, module docstring, class organization, `@pytest.mark.unit` marker discipline, coverage map in the docstring) but the body shape is closer to the two pure classes below.

**License + module docstring + coverage-map pattern** (mirror from test_graph.py:1-23):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py:1-23
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for `plane.app.services.timeline_propagation.graph.load_precedence_graph`.

Test pattern: per-test ORM fixture chain workspace → project → state → issue
(matches `apps/api/plane/tests/unit/models/test_issue_comment_modal.py`).
Uses `@pytest.mark.unit` at the class level + `@pytest.mark.django_db` at the
method level. The global `create_user` fixture from `tests/conftest.py:37-46`
is the entry point.

Coverage map (Phase 1 / 01-VALIDATION.md):
  TestLoadPrecedenceGraphFilters      → PROP-02 (relates_to / duplicate dropped)
                                      → PROP-01 alias (blocking → blocked_by mirror)
  TestLoadPrecedenceGraphDirection    → D-04 (predecessor=related_issue, successor=issue)
  TestLoadPrecedenceGraphCycle        → PROP-15 / TEST-11 + D-05 (self-edge)
  TestLoadPrecedenceGraphCrossProject → PROP-16 / D-03
  TestLoadPrecedenceGraphEmpty        → regression guard for default construction
  TestLoadPrecedenceGraphAdjacencyShape → D-06 (successors+predecessors symmetry)
  TestAdjacencyConvenienceMethods     → D-06 (no-KeyError invariant)
  test_no_drf_or_http_imports_in_module → D-08 / PROP-18 lint-grep
"""
```

**Pure (no `@django_db`) class-based test pattern** (mirror from test_graph.py:333-347):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py:333-347
@pytest.mark.unit
class TestLoadPrecedenceGraphEmpty:
    """Empty input must produce an empty Adjacency with cycle=None (regression guard)."""

    def test_empty_input_yields_empty_adjacency_no_cycle(self):
        """No DB needed — pure-list input."""
        from uuid import uuid4

        result = load_precedence_graph([], project_id=uuid4())

        assert result.adjacency.successors == {}
        assert result.adjacency.predecessors == {}
        assert result.adjacency.nodes == frozenset()
        assert result.adjacency.cross_project_edges == ()
        assert result.cycle is None
```

**In-test hand-built dataclass literal pattern** (mirror from test_graph.py:391-407):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py:391-407
@pytest.mark.unit
class TestAdjacencyConvenienceMethods:
    """Adjacency.successors_of / predecessors_of return empty for unknown ids (D-06)."""

    def test_successors_of_unknown_id_returns_empty_frozenset(self):
        """No KeyError — empty frozenset for unknown nodes (Phase 2 contract)."""
        from uuid import uuid4

        adj = Adjacency(
            successors={},
            predecessors={},
            nodes=frozenset(),
            cross_project_edges=(),
        )
        unknown = uuid4()
        assert adj.successors_of(unknown) == frozenset()
        assert adj.predecessors_of(unknown) == frozenset()
```

**Module-level helper pattern** (mirror from test_graph.py:103-126 — `_make_issue` / `_make_blocked_by`; Phase 2 will define `_make_scheduled_work_item`, `_make_adjacency`, `_make_intent`, `_make_load_result` etc.):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py:103-126
def _make_issue(workspace, project, state, name):
    return Issue.objects.create(
        name=name,
        workspace=workspace,
        project=project,
        state=state,
    )


def _make_blocked_by(workspace, project, predecessor, successor):
    """Create a canonical `blocked_by` row.

    Per CONTEXT.md D-04 / RESEARCH.md "Existing Code Insights — Directionality
    Verification": for `predecessor=Y blocks successor=X`, the row stores
    `IssueRelation(issue=X, related_issue=Y, relation_type='blocked_by')`.
    """
    return IssueRelation.objects.create(
        issue=successor,
        related_issue=predecessor,
        relation_type="blocked_by",
        project=project,
        workspace=workspace,
    )
```

**What to mirror:**

- 4-line license header.
- Module docstring with coverage map mapping test class → CONTEXT.md decision IDs (D-01..D-14) and PRD test IDs (TEST-01..TEST-09, TEST-12, TEST-14). Replicate the columnar `Test class → Requirement` shape from test_graph.py:13-23.
- `@pytest.mark.unit` at the **class** level (every test class).
- One test class per logical grouping (analogous to Phase 1's `TestLoadPrecedenceGraph<Concern>` naming). Suggested for Phase 2: `TestPropagateMoveValidation` (D-06 steps 1-4 / TEST-14), `TestPropagateMoveNoOp` (TEST-01, no-op delta=0), `TestPropagateMoveForward` (TEST-02, TEST-04 transitive forward, TEST-05 split), `TestPropagateMoveBackward` (TEST-03, TEST-06 merge), `TestPropagateMoveGapAndAdjacency` (TEST-07 gap, TEST-08 exact adjacency), `TestPropagateMoveIncompleteSchedule` (TEST-09 + dragged-item-eager auxiliary), `TestPropagateMoveLimit` (TEST-12 + `test_limit_exactly_at_100_succeeds` + `test_limit_at_101_fails`), `TestPropagateMoveCycle` (D-07 fail-fast regardless of reachability), `TestPropagateMoveStaleVersion` (D-08), `TestPropagateMoveCrossProject` (D-10 reachability).
- Module-level `_make_*` helpers for in-memory fixture construction. Mirror the `_make_issue` / `_make_blocked_by` shape (lowercase `_`-prefix, lowercase verbs, kwargs-only, returns the constructed value). Suggested helpers: `_make_scheduled(id, project_id, start, target, version)`, `_make_adjacency(successors_dict, predecessors_dict)`, `_make_load_result(adjacency, cycle=None)`, `_make_intent(work_item_id, original_start, original_target, requested_start, requested_target)`, `_make_versions(work_item_id, version)`.
- Arrange / Act / Assert layout inside test bodies (mirror `test_issue_comment_modal.py` style referenced in test_graph.py module docstring).
- Test method names start with `test_` and use full English sentences (not abbreviations) — mirror Phase 1's `test_relates_to_is_dropped`, `test_three_node_cycle_is_detected`, `test_self_edge_is_one_node_cycle`. Phase 2 examples: `test_rightward_move_propagates_to_one_successor`, `test_merge_predecessor_branches_takes_max_of_predecessor_targets`, `test_propagation_exceeds_100_returns_limit_exceeded`.
- Imports near the top via standard `# Python imports` / `# Module imports` blocks (mirror test_graph.py:25-38 — though Phase 2's imports are simpler: `import pytest` from stdlib + the public surface from `plane.app.services.timeline_propagation`). Phase 1 imported `IssueRelation, Issue, Project, State, Workspace` from `plane.db.models`; Phase 2 imports NOTHING from `plane.db.models` (D-13 — no DB).

**What to differ:**

- **NO `@pytest.mark.django_db` anywhere** — every test is pure-Python. Phase 1 used `@django_db` on most methods (lines 137, 161, 182, 224, 251, 273, 300, 354 ); Phase 2 omits it entirely.
- **NO ORM fixtures** (`workspace`, `project`, `state`, `other_project`, `other_state` from test_graph.py:46-95). Phase 2's "fixtures" are module-level helper functions returning frozen dataclasses. If state must be shared across multiple tests, prefer module-level constants (`_PROJECT_ID = uuid4()`, `_DRAGGED_ID = uuid4()`) over `@pytest.fixture`.
- **NO `from plane.db.models import ...`** — D-13 forbids DB roundtrip; the algorithm consumes pre-built dataclasses. Imports are limited to `pytest`, stdlib (`uuid`, `datetime`), and the public surface of `plane.app.services.timeline_propagation`.
- Helper functions construct **dataclasses**, not ORM rows. `_make_scheduled(...)` returns `ScheduledWorkItem(...)`, NOT `Issue.objects.create(...)`.
- Validation-order assertion is a Phase 2 invention (CONTEXT.md "Specific Ideas" — `test_validation_order_invalid_range_beats_cycle`). No Phase 1 analog.
- `@pytest.mark.unit` is universally applied (Phase 1 had it at class level on every class except sometimes also implicit via class scope — Phase 2 does the same).
- Determinism caveat — when asserting on `result.updates: tuple[WorkItemUpdate, ...]` order, sort by `updates[i].id` or check membership only. Per CONTEXT.md "Established Patterns" §"Deterministic iteration via `sorted(...)`" Phase 2 production code MUST sort neighbors before pushing onto the frontier so this assertion is stable across runs (graph.py:215 sets the precedent).

---

### 7. `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py` (NEW — pure unit tests for `scheduling.py` helpers)

**Closest analog:** `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py::TestAdjacencyConvenienceMethods` (test_graph.py:391-407, the pure-no-DB class) plus `apps/api/plane/tests/unit/utils/test_uuid.py` (the simplest module-level pure-helper test in the codebase).

**Pattern from `test_uuid.py` (referenced by Phase 1's PATTERNS.md as "secondary analog" for pure unit tests):**

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/utils/test_uuid.py:10-27 (referenced)
@pytest.mark.unit
class TestUUIDUtils:
    """Test the UUID utilities"""

    def test_is_valid_uuid_with_valid_uuid(self):
        """Test is_valid_uuid with a valid UUID"""
        # Generate a valid UUID
        valid_uuid = str(uuid.uuid4())
        assert is_valid_uuid(valid_uuid) is True
```

**Pure dataclass-construction test pattern from `test_graph.py`** (mirror for `scheduling.py` helpers — same pattern, simpler inputs since helpers consume `date` / `timedelta` primitives only):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py:391-407 (referenced above)
@pytest.mark.unit
class TestAdjacencyConvenienceMethods:
    """Adjacency.successors_of / predecessors_of return empty for unknown ids (D-06)."""

    def test_successors_of_unknown_id_returns_empty_frozenset(self):
        """No KeyError — empty frozenset for unknown nodes (Phase 2 contract)."""
        from uuid import uuid4

        adj = Adjacency(
            successors={},
            predecessors={},
            nodes=frozenset(),
            cross_project_edges=(),
        )
        unknown = uuid4()
        assert adj.successors_of(unknown) == frozenset()
        assert adj.predecessors_of(unknown) == frozenset()
```

**What to mirror:**

- 4-line license header + module docstring (one-line summary + coverage map mapping each class → helper under test).
- One test class per helper function, OR one test class per "concern group" (e.g., `TestRangeDurationAndAddCalendarDays`, `TestNextAndPreviousValid`, `TestRangeAndBoundaryPredicates`). RESEARCH.md Wave 3 lists per-helper test names — the planner can choose either grouping but must cover all 7 RED tests:
  - `test_range_duration_zero_when_start_equals_target`
  - `test_range_duration_one_day_when_target_one_day_after_start`
  - `test_add_calendar_days_advances_calendar`
  - `test_next_valid_start_is_target_plus_one`
  - `test_previous_valid_target_is_start_minus_one`
  - `test_is_valid_range_target_equal_start_is_valid`
  - `test_boundary_violation_strict_less_than`
- `@pytest.mark.unit` at the class level.
- NO `@pytest.mark.django_db` (helpers are pure date math).
- Imports limited to `pytest`, `from datetime import date, timedelta`, and the public surface from `plane.app.services.timeline_propagation` (per CONTEXT.md "Claude's Discretion" — re-exports avoid depth-import).

**What to differ:**

- Inputs are stdlib `date` / `timedelta` literals — no fixtures, no helpers needed. Test bodies are 3–5 lines (Arrange = `start = date(2026, 5, 4)`; Act = `result = range_duration(start, target)`; Assert = `assert result == timedelta(days=N)`).
- Edge cases worth pinning explicitly (CONTEXT.md "Specific Ideas" §"Validation-order assertion" implies the same discipline for boundary tests):
  - `range_duration(d, d)` returns `timedelta(0)` (start == target → 0-day duration per D-03).
  - `boundary_violation(pred=d, succ=d+1)` returns `False` (PROP-10 / D-02 — adjacency is valid, NOT a violation).
  - `boundary_violation(pred=d, succ=d)` returns `True` (succ.start < pred.target + 1).
  - `is_valid_range(start=d, target=d)` returns `True` (target == start → 0-day duration is valid).
  - `is_valid_range(start=d, target=d-1)` returns `False`.

---

### 8. `apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py` (NEW — OR extend in-place in `test_graph.py`)

**Closest analog:** `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py::test_no_drf_or_http_imports_in_module` (lines 411-435).

**Existing test (entire body — Phase 2 either reuses verbatim or extends in place):**

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py:411-435
@pytest.mark.unit
def test_no_drf_or_http_imports_in_module():
    """D-08 / PROP-18: timeline_propagation must not import DRF / Django HTTP / views.

    Verifiable by static grep — keeps the deep-module isolation honest as the
    package grows in Phase 2 (scheduling.py, propagation.py, errors.py).
    """
    pkg_root = (
        pathlib.Path(__file__).resolve().parents[4]
        / "app" / "services" / "timeline_propagation"
    )
    forbidden = (
        "rest_framework",
        "django.http",
        "plane.app.views",
        "plane.app.serializers",
    )

    py_files = list(pkg_root.rglob("*.py"))
    assert py_files, f"no .py files found under {pkg_root}"
    for py in py_files:
        text = py.read_text(encoding="utf-8")
        for needle in forbidden:
            assert needle not in text, (
                f"{py.name} imports forbidden module: {needle}"
            )
```

**RECOMMENDED APPROACH (per RESEARCH.md Wave 0):** Phase 2 **does NOT need to write a new test file**. The existing `test_graph.py::test_no_drf_or_http_imports_in_module` already walks `pkg_root.rglob("*.py")` (line 428), so the new files (`errors.py`, `scheduling.py`, `propagation.py`) are picked up automatically as soon as they exist. The only changes Phase 2 makes are:

1. **Extend the `forbidden` tuple** to cover the new files' anti-imports per CONTEXT.md D-14:
   - Add `"transaction.atomic"` (D-14: no `transaction.atomic` in `errors.py` / `scheduling.py` / `propagation.py`).
   - Add `"model_activity.delay"` (D-14).
   - Add `"Issue.objects"` (D-14: no `Issue.objects` writes).
   - Add `"from django.db.models import"` (D-14: no Django ORM model imports — currently none, but lock it).
   - Optionally add `"from datetime import timedelta"` only as a SCOPED check on `propagation.py` (NOT on `scheduling.py`). Per CONTEXT.md D-03 — `propagation.py` MUST NOT import `timedelta` directly, but `scheduling.py` MUST. The simplest implementation: split into two assertions or scope by filename.

2. **Update the docstring** to reference D-14 (Phase 2's purity invariant) in addition to D-08 (Phase 1's).

3. **Optionally extract to a sibling `test_purity.py`** if the pollutes-test_graph.py argument wins. Phase 1 placed the lint-grep test at the bottom of `test_graph.py` because there was nothing else to scan; Phase 2 has three new files to scan and a sibling file may be cleaner. **Recommended:** EXTEND IN PLACE for now; only extract when the test grows past ~50 lines.

**What to mirror (whether in-place or in sibling file):**

- `pathlib.Path(__file__).resolve().parents[4] / "app" / "services" / "timeline_propagation"` path-walk pattern (test_graph.py:417-420).
- `rglob("*.py")` to enumerate all package files (test_graph.py:428) — Phase 2's new files appear automatically.
- `assert py_files, f"no .py files found under {pkg_root}"` regression guard (test_graph.py:429) — guards against a bad `parents[N]` index after path refactors.
- `text = py.read_text(encoding="utf-8")` then `assert needle not in text` substring check. NOT regex — keep it simple, false-positive-tolerant (the `forbidden` tuple values are unique enough that substring is sufficient).
- `@pytest.mark.unit` (no DB needed; pure file I/O).
- Module-level test (no class) — mirror Phase 1's choice (test_graph.py:411).

**What to differ:**

- Phase 2 may need filename-scoped checks (e.g., `from datetime import timedelta` is ALLOWED in `scheduling.py` but FORBIDDEN in `propagation.py`). One way:

```python
# Sketch — planner may refine
SCOPED_FORBIDDEN: dict[str, tuple[str, ...]] = {
    "propagation.py": ("from datetime import timedelta",),
}
GLOBAL_FORBIDDEN = (
    "rest_framework",
    "django.http",
    "plane.app.views",
    "plane.app.serializers",
    "transaction.atomic",
    "model_activity.delay",
    "Issue.objects",
    "from django.db.models import",
)
for py in py_files:
    text = py.read_text(encoding="utf-8")
    for needle in GLOBAL_FORBIDDEN:
        assert needle not in text, ...
    for needle in SCOPED_FORBIDDEN.get(py.name, ()):
        assert needle not in text, ...
```

- Update docstring reference: `D-08 / PROP-18` → `D-08 / D-14 / PROP-18` (cite both phases' purity decisions).

---

### 9. `apps/api/plane/tests/unit/services/timeline_propagation/conftest.py` (NEW — OPTIONAL)

**Closest analog:** **No in-tree analog.** Per `Glob "apps/api/plane/tests/**/conftest.py"`, the only conftest in the entire `tests/` tree is `apps/api/plane/tests/conftest.py` (the global one — lines 1-141, contains `create_user`, `workspace`, `api_client`, `session_client`, etc.). No per-package or per-module conftest exists anywhere.

**Header / `@pytest.fixture` style pattern from the global conftest** (mirror at line 5-46 of the global conftest):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/conftest.py:1-46 (excerpt)
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.test import APIClient
from pytest_django.fixtures import django_db_setup

from plane.db.models import User, Workspace, WorkspaceMember
from plane.db.models.api import APIToken


@pytest.fixture(scope="session")
def django_db_setup(django_db_setup):  # noqa: F811
    """Set up the Django database for the test session"""
    pass


@pytest.fixture
def api_client():
    """Return an unauthenticated API client"""
    return APIClient()


@pytest.fixture
def user_data():
    """Return standard user data for tests"""
    return {
        "email": "test@plane.so",
        "password": "test-password",
        "first_name": "Test",
        "last_name": "User",
    }
```

**RECOMMENDATION: OMIT this file unless / until duplication appears.**

Phase 1 did NOT introduce a per-package conftest — it inlined `@pytest.fixture` definitions at the top of `test_graph.py:46-95`. Phase 2's `test_propagation.py` and `test_scheduling.py` both use **module-level helper functions** (per the recommendation in section 6 above) instead of fixtures, because the inputs are pure dataclasses. Fixtures only earn their keep when:

1. The same setup is needed across **multiple** test files (Phase 2 has only `test_propagation.py` and `test_scheduling.py`; `test_scheduling.py` needs no fixtures because its inputs are stdlib `date` literals).
2. The setup is expensive (here it's trivial — building a frozen dataclass).
3. Pytest's automatic fixture-injection improves readability over an explicit module-level helper call.

**If the planner DOES decide to add a `conftest.py`** (e.g., to share a `_PROJECT_ID = uuid4()` constant or a parameterized graph-builder fixture), follow this minimal shape:

```python
# apps/api/plane/tests/unit/services/timeline_propagation/conftest.py (sketch — only if duplication forces it)
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared in-memory fixtures for timeline_propagation unit tests (D-13)."""

# Python imports
from datetime import date, datetime, timezone
from uuid import UUID, uuid4

import pytest

# Module imports
from plane.app.services.timeline_propagation import (
    Adjacency,
    LoadResult,
    MoveIntent,
    ScheduledWorkItem,
)


@pytest.fixture
def project_id() -> UUID:
    return uuid4()


@pytest.fixture
def empty_graph() -> LoadResult:
    return LoadResult(
        adjacency=Adjacency(
            successors={},
            predecessors={},
            nodes=frozenset(),
            cross_project_edges=(),
        ),
        cycle=None,
    )
```

**What to mirror:**

- License header + module docstring.
- `import pytest` (the only required test framework import).
- `@pytest.fixture` decorator (no scope unless session-wide is needed; per-test default is correct — mirror `create_user` at conftest.py:36-46).
- One-line docstring per fixture (mirror `"""Set up the Django database for the test session"""` at conftest.py:15).

**What to differ:**

- NO `from rest_framework.test import APIClient` (D-14 / PROP-18 — the lint-grep test in `test_purity.py` will fail if this string appears anywhere under the package; conftest is not under the _production_ package, but consistency matters).
- NO `from plane.db.models import ...` — D-13 forbids DB roundtrip; fixtures construct frozen dataclasses only.
- NO `@pytest.mark.django_db` — every fixture is pure-Python.
- Use `from collections.abc import Mapping` if any fixture returns a `Mapping[UUID, ScheduledWorkItem]` — not `from typing import Mapping`. Mirror Phase 1's modern-stdlib import discipline.

---

## Shared Patterns

### License header (every Python file)

**Source:** Universal across `apps/api/plane/` — verified in every Phase 1 file.

**Apply to:** All 4 NEW files (`errors.py`, `scheduling.py`, `propagation.py`, `test_propagation.py`, `test_scheduling.py`, optional `conftest.py`) AND maintained in the 2 UPDATED files (`types.py`, `__init__.py`).

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

```

---

### Section-divider comments (production modules)

**Source:** `apps/api/plane/app/services/timeline_propagation/graph.py:51-57` (Phase 1 — established the convention inside this package):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/graph.py:51-57
# Python imports
from collections.abc import Iterable, Iterator
from typing import Protocol
from uuid import UUID

# Module imports
from .types import Adjacency, Edge, LoadResult
```

**Apply to:**

- `errors.py` — `# Python imports` (no Module imports needed).
- `scheduling.py` — `# Python imports` (no Module imports needed; no Django imports allowed).
- `propagation.py` — `# Python imports` + `# Module imports` (the latter holds `from .errors import ...`, `from .scheduling import ...`, `from .types import ...`).
- `types.py` — extend the existing `# Python imports` block (add `from datetime import date, datetime`); add `# Module imports` block above with `from .errors import PropagationFailure`.

> **Optional for `errors.py`:** Per Phase 1 PATTERNS.md §"Section-divider comments": "For `types.py` it's optional since there are no Django imports; recommended to omit per the simpler `apps/api/plane/utils/exporters/schemas/base.py` style." The same applies to `errors.py` if the planner prefers minimal comments. Default: include the dividers for consistency with `propagation.py`.

---

### Frozen dataclass with `slots=True` for value types

**Source:** `apps/api/plane/app/services/timeline_propagation/types.py:29-92` (Phase 1 — every dataclass uses this exact decorator; confirmed by reading lines 29, 41, 57, 81).

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/app/services/timeline_propagation/types.py:29-39
@dataclass(frozen=True, slots=True)
class WorkItemNode:
    """Identity of a Work Item participating in the precedence graph.
    ...
    """

    id: UUID
    project_id: UUID
```

**Apply to:** Every new dataclass in `types.py` (`ScheduledWorkItem`, `MoveIntent`, `WorkItemUpdate`, `PropagationResult`) and `errors.py` (`PropagationFailure`). NEVER drop `frozen=True` or `slots=True`.

---

### Iterative-walk discipline (no recursion, no `sys.setrecursionlimit`)

**Source:** `apps/api/plane/app/services/timeline_propagation/graph.py:175-228` (Phase 1's `_detect_cycle` uses an explicit `list[tuple[UUID, Iterator[UUID]]]` stack instead of recursion — D-02).

**Apply to:** `propagation.py`'s frontier walk (`_walk_forward` / `_walk_backward` or a unified `_walk(direction)`). Use `collections.deque` for the BFS queue; `popleft()` for FIFO; never call the walk recursively. The 100-item limit (D-11) does NOT fully protect against pathological deep graphs in a recursive design, so iteration is mandatory.

---

### Deterministic iteration via `sorted(...)`

**Source:** `apps/api/plane/app/services/timeline_propagation/graph.py:189` (`for root in sorted(adj.nodes):`) and graph.py:215 (`iter(sorted(adj.successors_of(child)))`). Documented at graph.py:178-180 ("Deterministic iteration order via `sorted(...)` so test assertions on the returned tuple are stable across runs").

**Apply to:** `propagation.py`'s neighbor expansion in the frontier walk — when popping a node and pushing its neighbors, sort the neighbor ids first:

```python
for neighbor_id in sorted(graph.adjacency.successors_of(node_id)):
    queue.append(neighbor_id)
```

This makes `result.updates: tuple[WorkItemUpdate, ...]` deterministic across runs, so test assertions like `assert updates[1].id == c.id` are stable. CONTEXT.md "Established Patterns" §"Deterministic iteration via `sorted(...)`" makes this explicit for Phase 2.

---

### Lint-grep purity invariant

**Source:** `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py:411-435` (Phase 1's `test_no_drf_or_http_imports_in_module`).

**Apply to:** Phase 2 extends the existing test in place (per RESEARCH.md Wave 0). Add to the `forbidden` tuple per CONTEXT.md D-14:

```python
# Extended forbidden list for Phase 2 (D-14)
forbidden = (
    # Phase 1 (D-08) — keep verbatim
    "rest_framework",
    "django.http",
    "plane.app.views",
    "plane.app.serializers",
    # Phase 2 (D-14) — new
    "transaction.atomic",
    "model_activity.delay",
    "Issue.objects",
    "from django.db.models import",
)
```

The `pkg_root.rglob("*.py")` walk at line 428 already picks up `errors.py` / `scheduling.py` / `propagation.py` automatically as soon as the files exist — no test code change required for the file discovery.

---

### Test marker discipline

**Source:** `apps/api/pytest.ini:7-11` declares `unit`, `contract`, `smoke`, `slow` with `--strict-markers`.

**Apply to:**

- `test_propagation.py` — every test class has `@pytest.mark.unit`. NO `@pytest.mark.django_db` (D-13).
- `test_scheduling.py` — every test class has `@pytest.mark.unit`. NO `@pytest.mark.django_db`.
- `conftest.py` (if present) — no marker (fixtures aren't tests).

---

### Modernization deltas (PEP-585, PEP-604, `collections.abc`)

**Source:** Phase 1 PATTERNS.md §"Modernization deltas" (lines 159-165) + Phase 1's actual code (graph.py, types.py).

**Apply to:** All Phase 2 files.

- Use PEP-585 native generics: `tuple[WorkItemUpdate, ...]`, `frozenset[UUID]`, `dict[UUID, ...]`, `Mapping[UUID, ScheduledWorkItem]` — NOT `typing.Tuple` / `typing.FrozenSet` / `typing.Dict`.
- Use PEP-604 unions: `date | None`, `PropagationFailure | None`, `tuple[UUID, ...] | None` — NOT `Optional[...]` / `Union[..., None]`.
- Import `Mapping` from `collections.abc`, NOT `typing` (mirror types.py:24).
- Do NOT add `from __future__ import annotations` — zero hits in `apps/api/plane/` per Phase 1 PATTERNS.md A7; Phase 2 maintains this.

---

### `ruff` line-length & quote style

**Source:** `apps/api/pyproject.toml:34-39` — line-length 120, double quotes, mccabe.max-complexity 10, pylint.max-args 8, pylint.max-statements 50.

**Apply to:** All new/updated files. The `propagate_move(...)` function signature has 4 parameters (well under max-args 8). The function body should stay under max-statements 50 by extracting `_compute_shift_*`, `_validate_intent`, `_build_cross_project_indices`, `_fail` helpers — which is the underscore-prefix module-helper pattern from graph.py anyway.

---

### Import ordering inside `# Python imports` and `# Module imports` blocks

**Source:** Phase 1's `graph.py:51-57` (alphabetical inside each section by symbol; `from X import Y, Z` style).

**Apply to:** Maintain alphabetical sort inside each block. Multi-symbol imports use `from X import (A, B, C)` parenthesized form when they exceed 120 chars (mirror Phase 1's compact single-line style for short imports).

---

## No Analog Found

| Concern                                                                | Reason                                                                                                                                                                                                               | Where the planner gets the pattern instead                                                                                                                                                                           |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `StrEnum` from Python 3.12 stdlib                                      | Zero hits in `apps/api/` per `Grep "StrEnum" apps/api`. Phase 2 introduces the convention.                                                                                                                           | CONTEXT.md D-05 enumerates the seven members verbatim; Python stdlib `enum.StrEnum` docs (Python 3.12+). Inline comment in `errors.py` should cite D-05.                                                             |
| Date-arithmetic helper module (`scheduling.py`)                        | No file in `apps/api/plane/` is dedicated to pure date math today. The closest is the `apps/api/plane/utils/` directory's general-purpose helpers (`issue_search.py`, `uuid.py`) — none of which do date arithmetic. | RESEARCH.md "Algorithmic Pseudocode" lines 321-440 supplies the helper signatures verbatim. Stdlib `datetime` docs for `timedelta(days=1)` arithmetic. Phase 2 establishes the convention as the ADR 0002 swap seam. |
| Result-pattern dataclass with `failure: T                              | None` field                                                                                                                                                                                                          | Phase 1's `LoadResult` carries `cycle: tuple[UUID, ...]                                                                                                                                                              | None` — same _shape_ (Result with optional failure marker) but different _marker type_ (cycle path vs. typed failure). | Mirror Phase 1's `LoadResult` shape; substitute `cycle: tuple[UUID, ...] | None`→`failure: PropagationFailure | None`. The pattern is "Result with optional failure marker", not literal field-for-field copying. |
| Per-package `conftest.py`                                              | No per-package conftest exists anywhere under `apps/api/plane/tests/`.                                                                                                                                               | OMIT — use module-level `_make_*` helpers (mirror test_graph.py:103-126). Only introduce conftest if duplication appears across `test_propagation.py` and `test_scheduling.py`.                                      |
| BFS frontier walk (Phase 1 used DFS)                                   | Phase 1's `_detect_cycle` is DFS; no BFS walk exists in the codebase.                                                                                                                                                | Pattern is identical EXCEPT for the data structure (`collections.deque` queue with `popleft()` instead of stack with `pop()`). RESEARCH.md "Algorithmic Pseudocode" lines 397-440 supplies the BFS skeleton.         |
| Lazy-validation pattern with deterministic-order short-circuits (D-06) | Phase 1's loader had no equivalent — its only "validation" was the relation_type filter inside the loop.                                                                                                             | RESEARCH.md "Algorithmic Pseudocode" lines 359-396 supplies the verbatim short-circuit chain (steps 1-4 of D-06) using a `_fail(...)` helper.                                                                        |

For all six "no analog" patterns, the planner copies the verbatim skeleton from RESEARCH.md (cited line ranges above) and adapts it to Phase 2's file paths. Phase 1's PATTERNS.md table at the bottom established this same "fall back to RESEARCH.md skeletons" approach for new conventions.

---

## Metadata

**Analog search scope:**

- `apps/api/plane/app/services/timeline_propagation/` (Phase 1 sibling — the dominant source of patterns)
- `apps/api/plane/tests/unit/services/timeline_propagation/` (Phase 1 test sibling)
- `apps/api/plane/tests/conftest.py` (global conftest — only existing conftest in the tests tree)
- `apps/api/plane/tests/unit/utils/test_uuid.py` (simplest pure-helper test pattern)
- `apps/api/plane/utils/issue_search.py` (closest pure-free-function precedent)
- `apps/api/plane/db/models/issue.py` (Issue model — `start_date`, `target_date`, `updated_at` source of truth for `ScheduledWorkItem` typing)
- `apps/api/plane/db/mixins.py` (TimeAuditModel — `updated_at = DateTimeField(auto_now=True)` source of truth for `datetime` typing)
- `apps/api/pytest.ini` and `apps/api/pyproject.toml` (test runner + lint config)
- `.planning/phases/01-precedence-graph-loader-normalization/01-PATTERNS.md` (Phase 1's pattern map — the structural template for this file)
- `.planning/phases/01-precedence-graph-loader-normalization/01-CONTEXT.md` (Phase 1 decisions D-01..D-10; D-08 inheritance)

**Files scanned for analog search:** 12 (Read), plus 3 Glob/Grep calls to confirm zero-hit invariants (`StrEnum` absence in `apps/api/`, single `conftest.py` under `tests/`, `tests/unit/services/timeline_propagation/__init__.py` is a 4-line empty marker).

**Pattern extraction date:** 2026-05-04

**Key invariants verified during this pass:**

- `apps/api/plane/app/services/timeline_propagation/` exists as a package (Phase 1 created it); `errors.py` / `scheduling.py` / `propagation.py` do NOT yet exist (Phase 2 creates them).
- `types.py` currently exports `WorkItemNode`, `Edge`, `Adjacency`, `LoadResult` — all four use `@dataclass(frozen=True, slots=True)` (verified at lines 29, 41, 57, 81).
- `__init__.py` currently exports `Adjacency`, `Edge`, `LoadResult`, `WorkItemNode`, `load_precedence_graph` (verified at lines 13-22).
- `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py::test_no_drf_or_http_imports_in_module` already uses `pkg_root.rglob("*.py")` so it scales to Phase 2's new files automatically (verified at line 428).
- No `StrEnum` exists anywhere in `apps/api/` — Phase 2 introduces the convention deliberately under D-05.
- Only one `conftest.py` exists in `apps/api/plane/tests/` (the global one) — no per-package conftest precedent.
- `Issue.start_date` / `Issue.target_date` are `DateField(null=True, blank=True)` (verified at issue.py:145-146) — `date | None` is the correct typing for `ScheduledWorkItem`.
- `TimeAuditModel.updated_at` is `DateTimeField(auto_now=True)` (verified at mixins.py:20) — `datetime` is the correct typing for `ScheduledWorkItem.updated_at` and `WorkItemUpdate.updated_at`.

---

## PATTERN MAPPING COMPLETE
