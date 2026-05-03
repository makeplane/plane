# Phase 1: Precedence Graph Loader & Normalization - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Mode:** `--auto` (recommended options auto-selected; no user prompts)

<domain>
## Phase Boundary

Build a **pure-Python** same-project precedence graph loader as the foundation deep module for the Dependency Schedule Propagation feature. Reads `IssueRelation` rows, translates the canonical `blocked_by` direction into typed predecessor→successor edges, classifies cross-project edges, and detects cycles — all behind a tiny interface with **zero coupling** to Django views, DRF serializers, HTTP, or `transaction.atomic`. Phase 2's algorithm and Phase 3's endpoint are downstream consumers.

**In scope (Phase 1 only):**

- Package scaffolding `apps/api/plane/app/services/timeline_propagation/`
- `types.py` — identity-only graph dataclasses (no schedule dates)
- `graph.py` — loader + normalization + cycle detection + cross-project edge classification
- `pytest -m unit` tests for every classification and cycle case (TEST-11)

**Out of scope (deferred to later phases):**

- Date math, duration preservation, propagation walk → Phase 2
- DRF view, transactional persistence, stale-check, permission → Phase 3
- Frontend types/store/UI → Phases 4-5
- Working Calendar / working-day arithmetic → follow-up milestone (ADR 0002)

</domain>

<decisions>
## Implementation Decisions

### Loader interface boundary

- **D-01:** The loader is a **pure function** that accepts an `Iterable[IssueRelation]` (or a queryset, or a list of plain dicts via an adapter) plus a `project_id: UUID`, and returns a `LoadResult`. It does **not** own the ORM call. Phase 3's view will materialize the queryset (`IssueRelation.objects.filter(project_id=..., deleted_at__isnull=True).select_related(...)`) and hand the iterable to the loader. This keeps the loader independently testable in `pytest -m unit` with `factory_boy` fixtures and no DRF/HTTP dependency (matches the "no `from rest_framework`, no `from django.http`" success criterion).

### Cycle detection algorithm & shape

- **D-02:** Cycle detection runs **iterative DFS with three-color marking** (white / gray / black) over the precedence subgraph. On the first detected back-edge, the loader reconstructs the cycle path from the DFS stack and stores it in `LoadResult.cycle: tuple[UUID, ...] | None` (closed path, e.g., `(A, B, C, A)`). The loader never throws across the module boundary — Phase 2 just checks `result.cycle is not None` and translates that into a `DEPENDENCY_CYCLE` typed failure. Iterative (not recursive) to stay safe on graphs near the 100-item propagation limit and well beyond, and to keep stack frames bounded for Python's default recursion limit.

### Cross-project edge representation

- **D-03:** Cross-project edges are **kept in the adjacency, marked `cross_project=True` per `Edge`**. The loader **never dereferences the foreign issue's dates or fields** — it only inspects `IssueRelation.related_issue.project_id` (or, preferably, a precomputed `related_project_id` carried on the input row to keep the loader pure). Phase 2 then decides whether `PROJECT_BOUNDARY_EXCEEDED` fires based on **reachability from the moved Work Item**, not whether any cross-project edge exists in the project at all. This preserves PROP-16 semantics ("paths reaching outside the project fail propagation") while honoring the success criterion that "the loader marks the edge as cross-project … without ever loading the foreign issue's dates."

### Relation-type filter scope

- **D-04:** Only rows with `relation_type = "blocked_by"` participate in the precedence graph. **All other types** — `relates_to`, `duplicate`, `start_before`, `finish_before`, `implemented_by` — are dropped at the loader boundary (PROP-02). The "blocking" direction is **not a stored value**: per `apps/api/plane/db/models/issue.py:263` `IssueRelationChoices._RELATION_PAIRS`, every precedence row is canonically stored as `blocked_by` and the reverse view is synthesized by `apps/api/plane/app/views/issue/relation.py:175-179`. So the loader's "normalization" is a **direction translation**, not a value normalization: for each `blocked_by` row `(issue=X, related_issue=Y)`, emit edge `predecessor=Y → successor=X`. Document this directionality in `graph.py`'s module docstring so Phase 2 reviewers don't have to re-derive it.

### Soft-deleted / archived / draft Work Item handling

- **D-05:** The loader **defensively re-applies** `deleted_at IS NULL` on each input `IssueRelation` row, but it **assumes the caller (Phase 3 view) has already filtered out** edges whose endpoint Work Items are `archived_at IS NOT NULL`, `is_draft=True`, or `deleted_at IS NOT NULL`. Reason: those endpoint filters require a JOIN onto `Issue`, which the loader stays agnostic of. Phase 3's queryset will join and filter; the loader's docstring will declare the assumption explicitly so Phase 3 cannot forget. Self-edges (`issue_id == related_issue_id`, defensive guard against direct-DB rows) are classified as a one-element cycle by `D-02`.

### Adjacency data structure

- **D-06:** `Adjacency` is a **frozen dataclass** holding:
  - `successors: Mapping[UUID, frozenset[UUID]]` — predecessor → set of successors (same-project only)
  - `predecessors: Mapping[UUID, frozenset[UUID]]` — successor → set of predecessors (same-project only)
  - `nodes: frozenset[UUID]` — every Work Item id touched by any precedence edge in this project
  - `cross_project_edges: tuple[Edge, ...]` — flagged edges with one endpoint outside the project
  - Both `successors` and `predecessors` are pre-computed at load time (no on-demand inversion). Both are needed because Phase 2 walks **forward** from the moved Work Item on rightward moves and **backward** on leftward moves.
  - Convenience methods: `successors_of(node_id) -> frozenset[UUID]` and `predecessors_of(node_id) -> frozenset[UUID]` returning empty frozenset for unknown ids (no `KeyError`s leaking to callers).

### Type module shape

- **D-07:** `types.py` exposes only **identity-and-classification** types (no schedule dates):
  - `WorkItemNode` = `frozen dataclass(id: UUID, project_id: UUID)` — used as the node identity for cross-project edge classification.
  - `Edge` = `frozen dataclass(predecessor_id: UUID, successor_id: UUID, source_relation_id: UUID, cross_project: bool)` — `source_relation_id` preserved for diagnostics and future audit logging.
  - `Adjacency` (per D-06).
  - `LoadResult` = `frozen dataclass(adjacency: Adjacency, cycle: tuple[UUID, ...] | None)` — the public return of the loader. Phase 2 will introduce a separate `ScheduledWorkItem` type (id + start_date + target_date + updated_at) and a `MoveIntent` type when it owns date math.

### Cross-cutting

- **D-08:** No `transaction.atomic`, no `model_activity.delay(...)`, no `request`, no DRF imports anywhere under `apps/api/plane/app/services/timeline_propagation/`. Verifiable by `grep`/lint in the test suite.
- **D-09:** Calendar-day–neutral by construction: Phase 1 holds **no** date arithmetic. The Working Calendar swap (ADR 0002, deferred) cannot affect Phase 1 because dates do not enter this module.
- **D-10:** Tests live at `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` and use `@pytest.mark.unit` + `@pytest.mark.django_db` (relations are real rows so `factory_boy` fixtures stay realistic) but **no `session_client`**, **no `live_server`**, **no DRF imports**.

### Claude's Discretion

The auto-mode chose recommended options for every gray area above. Specific call-outs the user may want to revisit during plan-phase:

- The exact representation of `cross_project` edges on the **input** row (precomputed `related_project_id` on the queryset annotation vs. `select_related("related_issue__project_id")` chain) — implementation detail; Phase 1 just needs _some_ way to know the related project id without the loader itself dereferencing it.
- Whether to expose a thin `load_precedence_graph(relations: Iterable, project_id: UUID) -> LoadResult` free function or a small `class GraphLoader` — leaning to free function for purity; revisit if Phase 3 wants DI hooks for testing.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Project-level direction

- `.planning/ROADMAP.md` §"Phase 1: Precedence Graph Loader & Normalization" — phase goal, success criteria, modules-to-change list, first-minimum-task.
- `.planning/REQUIREMENTS.md` — owns PROP-01, PROP-02, PROP-15, PROP-16, PROP-18, TEST-11 (every requirement assigned to Phase 1).
- `.planning/PROJECT.md` — Core value statement, in-scope/out-of-scope contract for the milestone, and the deep-module-first directive.
- `.planning/STATE.md` — current focus, sequential phase order (`parallelization=false`), and the carried-forward Vitest / `expected_updated_at` / adjacency open questions for later phases.

### Domain & PRD

- `CONTEXT.md` (repo root) — Ubiquitous Language: Work Item, Precedence Dependency, Dependency Schedule Propagation, Precedence Boundary. Use these terms in code, comments, and tests; avoid "issue" in user-facing messages and avoid "relation" when ordering is implied.
- `docs/prd/timeline-dependency-date-range-propagation.md` — PRD with 40 user stories. Phase 1 covers US-16 (graph reads `blocking`/`blocked_by`), US-17 / US-18 (relates_to / duplicate excluded), US-20 (cross-project boundary fail), US-28 (cycle fail), US-34 (server-authoritative graph build).

### Architecture decisions

- `docs/adr/0001-server-authoritative-dependency-schedule-propagation.md` — locks server authority over schedule propagation; Phase 1 is the data layer for that authority.
- `docs/adr/0002-working-calendar-with-japan-holiday-preset.md` — **deferred**; relevant only because Phase 1 is calendar-day-neutral so the future swap is non-breaking.

### Existing code (read-only inputs)

- `apps/api/plane/db/models/issue.py:263` — `IssueRelationChoices` and `_RELATION_PAIRS`. Source of truth that `blocking` is **not stored**, only `blocked_by` is — so the loader only filters `relation_type='blocked_by'`.
- `apps/api/plane/db/models/issue.py:287` — `IssueRelation` model: `issue`, `related_issue`, `relation_type`, `deleted_at` (soft-delete column).
- `apps/api/plane/app/views/issue/relation.py:175-203` — confirms reverse-direction synthesis at the API edge; loader does **not** need to handle `relation_type='blocking'`.
- `apps/api/plane/tests/factories.py` — `factory_boy` factories. New tests should extend this for `IssueRelation` if not already present.

### Codebase maps (already-read context)

- `.planning/codebase/ARCHITECTURE.md` — layered Django REST monolith; pattern is "thin view → service module → ORM."
- `.planning/codebase/STACK.md` — Python 3.12.10, pytest + pytest-django + factory_boy, `--reuse-db --nomigrations` defaults.
- `.planning/codebase/TESTING.md` — pytest markers (`unit`, `contract`, `smoke`, `slow`), runner `apps/api/run_tests.py -u`, **do not use** `apps/api/run_tests.sh`.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`IssueRelation` model** (`apps/api/plane/db/models/issue.py:287`) — already has `deleted_at` soft-delete column and the `relation_type` charfield. No schema change needed for Phase 1.
- **`IssueRelationChoices`** — declares the canonical-direction enum; loader's filter (`relation_type='blocked_by'`) reuses this constant rather than a magic string.
- **`apps/api/plane/tests/factories.py`** — base `factory_boy` registry. Phase 1 will add (or reuse) a `IssueRelationFactory` for fixture rows; pattern is to define per-test factories in the test module if not in the global registry.
- **`apps/api/pytest.ini`** — `--reuse-db --nomigrations` defaults make unit tests fast. Phase 1 stays inside this assumption.

### Established Patterns

- **Service module layout under `apps/api/plane/app/services/`** — Phase 1 introduces a new sub-package `timeline_propagation/`. Match the existing service-package idiom (small public surface re-exported from `__init__.py`).
- **No `from rest_framework` / no `from django.http` in services** — already a tacit convention; Phase 1 makes it explicit and lint-verifiable for this module.
- **Three-color iterative DFS** — standard algorithmic pattern; no library dependency needed (Python stdlib `collections.deque` for the DFS stack).
- **Frozen dataclasses for value types** — keeps the loader's outputs hashable, immutable, and trivially testable with `==` assertions.

### Integration Points

- **Phase 2** consumes `LoadResult` and `Adjacency` directly: it walks forward/backward over `successors_of(...)` / `predecessors_of(...)`, fails fast on `result.cycle`, and consults `cross_project_edges` reachability. Phase 1 must not change shape of these once Phase 2 begins.
- **Phase 3** owns the queryset construction and DI: it `select_related("related_issue")` (or annotates `related_project_id`), pre-filters archived/draft endpoints, and calls the loader's free function. The loader is **never** instantiated inside a view's request thread without that pre-filter.
- **Phase 6 E2E** does not interact with this module directly — it observes behavior end-to-end via the Phase 3 endpoint.

</code_context>

<specifics>
## Specific Ideas

- The deep-module-first discipline is the **explicit user directive** for this milestone (per `.planning/PROJECT.md`). Phase 1 is the literal foundation: every later phase inherits its types. Plan-phase must lock the public surface (the contents of `__init__.py` exports) early — Phase 2 cannot start until that surface is stable.
- The `blocked_by` directionality story is subtle and easy to mis-implement. Plan-phase should call out **which row column maps to predecessor and which to successor** as a first-minimum-task documentation deliverable, before any test is red.
- Cycle detection should produce a **path** (not just a boolean) because the eventual user-facing error message will name the cycle members; Phase 3 may forward the cycle path for support diagnostics even if the UI initially shows a generic message.
- Tests should include an explicit case for "empty input → empty Adjacency, no cycle" so regressions on default-construction don't silently break.

</specifics>

<deferred>
## Deferred Ideas

- **Iterating with `select_related`** vs. annotating `related_project_id` on the queryset for cross-project classification — implementation detail for Phase 3, not Phase 1.
- **`WorkItemNode` enrichment with status / state / assignee** — out of scope; Phase 1 cares only about identity and project membership.
- **Audit logging of loaded graphs** — would consume `Edge.source_relation_id`; deferred to a later observability pass.
- **Caching loaded graphs per project** — premature optimization; defer until Phase 3 measures real latency.
- **Loader support for the future Working Calendar / working-day model** — explicitly out of scope per ADR 0002 and PROJECT.md; Phase 1's date-free design is what makes the future swap a no-op for this module.

</deferred>

---

_Phase: 01-Precedence Graph Loader & Normalization_
_Context gathered: 2026-05-03_
