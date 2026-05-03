# Phase 1: Precedence Graph Loader & Normalization - Research

**Researched:** 2026-05-03
**Domain:** Pure-Python graph normalization layer over Django ORM rows (`IssueRelation`) — backend service module, no DRF/HTTP coupling.
**Confidence:** HIGH

## Summary

Phase 1 creates a brand-new `apps/api/plane/app/services/timeline_propagation/` package — and in fact the **first ever sub-package under `apps/api/plane/app/services/`**, since that directory does not yet exist. The phase is pure-Python normalization: ingest `IssueRelation` rows for one project, translate `blocked_by` direction into typed predecessor→successor edges, classify cross-project edges, and detect cycles via iterative DFS. CONTEXT.md already locks all 10 implementation decisions (D-01..D-10); the planner's job is to translate them into faithful tasks while honoring existing codebase idioms.

The directionality story is verified across all `IssueRelation`-creation paths in the codebase (relation viewset, external API, and historical migration): only `blocked_by` rows are stored, and the canonical mapping is **`predecessor = related_issue_id`, `successor = issue_id`**. Cross-project rows are physically possible (no FK constraint enforces same-project endpoints), so PROP-16's classification is a real concern. The existing `apps/api/plane/tests/factories.py` provides factories up to `ProjectMemberFactory` but nothing for `Issue` or `IssueRelation` — Phase 1 will either extend it or use the per-test-fixture `Model.objects.create(...)` pattern that the existing `tests/unit/models/test_issue_comment_modal.py` already follows.

**Primary recommendation:** Adopt the per-test-fixture `Model.objects.create(...)` pattern that is already idiomatic in `tests/unit/models/`, augmented with a small in-test `_make_relation(predecessor, successor)` helper. Defer adding `IssueFactory` / `IssueRelationFactory` to `factories.py` unless Phase 2 / 3 needs them — keeps Phase 1's blast radius minimal and matches `.planning/codebase/TESTING.md`'s "do not invent harnesses" discipline.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Read `IssueRelation` rows for a project | API / Backend (Django ORM) | — | The loader only **consumes** an `Iterable[IssueRelation]` per D-01; the queryset itself is owned by Phase 3's view, not Phase 1. |
| Filter `relation_type='blocked_by'` (PROP-01, PROP-02) | API / Backend (service module) | — | Pure data filter; lives inside the loader to keep the precedence-only invariant centralized. |
| Translate `(issue, related_issue, 'blocked_by')` → `predecessor → successor` edge (PROP-01) | API / Backend (service module) | — | The "normalization" concept of D-04. Not stored; computed at load time. |
| Cross-project edge classification (PROP-16) | API / Backend (service module) | — | Loader marks `Edge.cross_project=True` based on `related_issue.project_id` carried on the input row; never dereferences foreign issue dates per D-03. |
| Cycle detection on the precedence subgraph (PROP-15, TEST-11) | API / Backend (service module) | — | Iterative three-color DFS (D-02). Returns `LoadResult.cycle: tuple[UUID, ...] | None`; never raises across the module boundary. |
| Build forward + backward adjacency (D-06) | API / Backend (service module) | — | Both directions are pre-computed because Phase 2 walks forward (rightward moves) and backward (leftward moves) from the dragged item. |
| Soft-delete / archive / draft filtering | API / Backend (Phase 3 view) | API / Backend (loader, defensive) | Loader **assumes** Phase 3 has already pre-filtered endpoints (D-05); loader defensively re-applies `deleted_at IS NULL` on each row but does **not** join `Issue`. |
| Move-only scope marker (PROP-18) | API / Backend (service module surface) | — | Module docstring + `__init__.py` exports name the module "precedence graph loader" and explicitly mention that it is consumed only by `propagate_move` (Phase 2); resize is not a public concept here. |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

> Verbatim from `.planning/phases/01-precedence-graph-loader-normalization/01-CONTEXT.md` `<decisions>` block. The planner MUST honor every decision below; alternatives have already been weighed and rejected by the user.

**D-01 (Loader interface boundary):** The loader is a **pure function** that accepts an `Iterable[IssueRelation]` (or a queryset, or a list of plain dicts via an adapter) plus a `project_id: UUID`, and returns a `LoadResult`. It does **not** own the ORM call. Phase 3's view will materialize the queryset (`IssueRelation.objects.filter(project_id=..., deleted_at__isnull=True).select_related(...)`) and hand the iterable to the loader. This keeps the loader independently testable in `pytest -m unit` with `factory_boy` fixtures and no DRF/HTTP dependency (matches the "no `from rest_framework`, no `from django.http`" success criterion).

**D-02 (Cycle detection algorithm & shape):** Cycle detection runs **iterative DFS with three-color marking** (white / gray / black) over the precedence subgraph. On the first detected back-edge, the loader reconstructs the cycle path from the DFS stack and stores it in `LoadResult.cycle: tuple[UUID, ...] | None` (closed path, e.g., `(A, B, C, A)`). The loader never throws across the module boundary — Phase 2 just checks `result.cycle is not None` and translates that into a `DEPENDENCY_CYCLE` typed failure. Iterative (not recursive) to stay safe on graphs near the 100-item propagation limit and well beyond, and to keep stack frames bounded for Python's default recursion limit.

**D-03 (Cross-project edge representation):** Cross-project edges are **kept in the adjacency, marked `cross_project=True` per `Edge`**. The loader **never dereferences the foreign issue's dates or fields** — it only inspects `IssueRelation.related_issue.project_id` (or, preferably, a precomputed `related_project_id` carried on the input row to keep the loader pure). Phase 2 then decides whether `PROJECT_BOUNDARY_EXCEEDED` fires based on **reachability from the moved Work Item**, not whether any cross-project edge exists in the project at all.

**D-04 (Relation-type filter scope):** Only rows with `relation_type = "blocked_by"` participate in the precedence graph. **All other types** — `relates_to`, `duplicate`, `start_before`, `finish_before`, `implemented_by` — are dropped at the loader boundary (PROP-02). The "blocking" direction is **not a stored value**: per `apps/api/plane/db/models/issue.py:263` `IssueRelationChoices._RELATION_PAIRS`, every precedence row is canonically stored as `blocked_by` and the reverse view is synthesized by `apps/api/plane/app/views/issue/relation.py:175-179`. So the loader's "normalization" is a **direction translation**, not a value normalization: for each `blocked_by` row `(issue=X, related_issue=Y)`, emit edge `predecessor=Y → successor=X`. Document this directionality in `graph.py`'s module docstring so Phase 2 reviewers don't have to re-derive it.

**D-05 (Soft-deleted / archived / draft Work Item handling):** The loader **defensively re-applies** `deleted_at IS NULL` on each input `IssueRelation` row, but it **assumes the caller (Phase 3 view) has already filtered out** edges whose endpoint Work Items are `archived_at IS NOT NULL`, `is_draft=True`, or `deleted_at IS NOT NULL`. Reason: those endpoint filters require a JOIN onto `Issue`, which the loader stays agnostic of. Phase 3's queryset will join and filter; the loader's docstring will declare the assumption explicitly so Phase 3 cannot forget. Self-edges (`issue_id == related_issue_id`, defensive guard against direct-DB rows) are classified as a one-element cycle by D-02.

**D-06 (Adjacency data structure):** `Adjacency` is a **frozen dataclass** holding:
- `successors: Mapping[UUID, frozenset[UUID]]` — predecessor → set of successors (same-project only)
- `predecessors: Mapping[UUID, frozenset[UUID]]` — successor → set of predecessors (same-project only)
- `nodes: frozenset[UUID]` — every Work Item id touched by any precedence edge in this project
- `cross_project_edges: tuple[Edge, ...]` — flagged edges with one endpoint outside the project
- Both `successors` and `predecessors` are pre-computed at load time (no on-demand inversion).
- Convenience methods: `successors_of(node_id) -> frozenset[UUID]` and `predecessors_of(node_id) -> frozenset[UUID]` returning empty frozenset for unknown ids (no `KeyError`s leaking to callers).

**D-07 (Type module shape):** `types.py` exposes only **identity-and-classification** types (no schedule dates):
- `WorkItemNode` = `frozen dataclass(id: UUID, project_id: UUID)` — used as the node identity for cross-project edge classification.
- `Edge` = `frozen dataclass(predecessor_id: UUID, successor_id: UUID, source_relation_id: UUID, cross_project: bool)` — `source_relation_id` preserved for diagnostics and future audit logging.
- `Adjacency` (per D-06).
- `LoadResult` = `frozen dataclass(adjacency: Adjacency, cycle: tuple[UUID, ...] | None)` — the public return of the loader. Phase 2 will introduce a separate `ScheduledWorkItem` type and a `MoveIntent` type when it owns date math.

**D-08 (Cross-cutting):** No `transaction.atomic`, no `model_activity.delay(...)`, no `request`, no DRF imports anywhere under `apps/api/plane/app/services/timeline_propagation/`. Verifiable by `grep`/lint in the test suite.

**D-09 (Calendar-day–neutral by construction):** Phase 1 holds **no** date arithmetic. The Working Calendar swap (ADR 0002, deferred) cannot affect Phase 1 because dates do not enter this module.

**D-10 (Test placement & markers):** Tests live at `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` and use `@pytest.mark.unit` + `@pytest.mark.django_db` (relations are real rows so `factory_boy` fixtures stay realistic) but **no `session_client`**, **no `live_server`**, **no DRF imports**.

### Claude's Discretion

> Verbatim from CONTEXT.md `<decisions>` block. Researcher recommendations follow each item below.

- **Cross-project input shape:** precomputed `related_project_id` annotation vs. `select_related("related_issue__project_id")`.
  - **Recommendation:** Define the loader's row-input contract as a small `Protocol` (or duck-typed interface) requiring `.project_id`, `.related_issue_id`, `.issue_id`, `.relation_type`, `.id`, `.deleted_at`, **and** access to `related_issue.project_id` via either attribute traversal (`row.related_issue.project_id`) OR an annotated `related_project_id`. The loader prefers `getattr(row, "related_project_id", None)` first and falls back to `row.related_issue.project_id`. Phase 3 then has freedom to use `select_related` or `annotate` without changing the loader. This keeps the loader truly pure and lets unit tests pass plain dataclasses.
- **Free function vs. small class:** `load_precedence_graph(relations, project_id) -> LoadResult` vs. `class GraphLoader`.
  - **Recommendation:** Free function. The loader has no instance state, no DI hooks needed (the `Iterable` argument *is* the DI seam), and class-based loaders typically smuggle in `self.queryset` over time. If Phase 3 later needs DI, wrapping a free function in a small adapter class is trivial; un-wrapping a class isn't.

### Deferred Ideas (OUT OF SCOPE)

> Verbatim from CONTEXT.md `<deferred>` block. Researcher MUST NOT explore these.

- **Iterating with `select_related`** vs. annotating `related_project_id` on the queryset for cross-project classification — implementation detail for Phase 3, not Phase 1.
- **`WorkItemNode` enrichment with status / state / assignee** — out of scope; Phase 1 cares only about identity and project membership.
- **Audit logging of loaded graphs** — would consume `Edge.source_relation_id`; deferred to a later observability pass.
- **Caching loaded graphs per project** — premature optimization; defer until Phase 3 measures real latency.
- **Loader support for the future Working Calendar / working-day model** — explicitly out of scope per ADR 0002 and PROJECT.md; Phase 1's date-free design is what makes the future swap a no-op for this module.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (verbatim from REQUIREMENTS.md) | Research Support |
|----|---------------------------------------------|------------------|
| **PROP-01** | サーバは current project の同一プロジェクト範囲で `IssueRelation` を読み、`blocking` / `blocked_by` を **predecessor → successor** に正規化したグラフを構築できる(US-34, US-16) | D-04 directionality fact verified across all relation-creation paths in §"Existing Code Insights — Directionality Verification". Edge direction: `predecessor=row.related_issue_id`, `successor=row.issue_id`. |
| **PROP-02** | `relates_to` / `duplicate` はグラフに**含めない**(US-17, US-18) | D-04 filter — drop every row whose `relation_type != "blocked_by"`. Test case (b) in §"Validation Architecture" pins the behavior. |
| **PROP-15** | precedence graph 上の循環(cycle)は伝播を停止し `DEPENDENCY_CYCLE` で fail(US-28) | D-02 iterative three-color DFS — see §"Cycle Detection Algorithm" for pseudocode. Loader returns `LoadResult.cycle`; Phase 2 maps to error code. |
| **PROP-16** | 同一プロジェクト範囲外に到達する依存パスは伝播全体を停止し `PROJECT_BOUNDARY_EXCEEDED` で fail(US-20) | D-03 cross-project edge classification — kept in `cross_project_edges`, never dereferenced. Phase 2 owns reachability decision. |
| **PROP-18** | 伝播はサービスレイヤとして resize は対象外、move(完全 schedule の移動)のみ対応 | D-09 calendar-day-neutral by construction; module docstring + `__init__.py` exports document "consumed by `propagate_move` only". No resize concept enters this module. |
| **TEST-11** | backend service unit test: cycle detection → `DEPENDENCY_CYCLE` | Phase 1 covers the loader-side: tests (d) "cycle on precedence subgraph → `LoadResult.cycle` is not None" and (g) "self-edge handled as one-element cycle" in §"Validation Architecture". Phase 2 will add the algorithm-side translation to the error code. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

The following directives from `./CLAUDE.md` constrain Phase 1 implementation. Treated with the same authority as locked decisions:

- **Toolchain:** Python 3.12.10 (Docker base `python:3.12.10-alpine`); pyproject is at `apps/api/pyproject.toml`. `apps/api` is **excluded from the pnpm workspace**.
- **Test runner:** Use `apps/api/run_tests.py` (NOT `apps/api/run_tests.sh` — it delegates to a missing path). Direct: `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_graph.py`.
- **Pytest defaults (from `apps/api/pytest.ini`):** `--reuse-db --nomigrations -vs`, `--strict-markers`. Markers `unit`, `contract`, `smoke`, `slow` declared. `python_classes = Test*`, `python_functions = test_*`.
- **Lint:** `ruff` (line-length 120, double quotes, `E + F` rules, `mccabe.max-complexity = 10`, `pylint.max-args = 8`, `pylint.max-statements = 50`). `tests/*` files have `E402, F401, F811` ignored. `__init__.py` has `F401` ignored.
- **Backend testing:** pytest 9.0.3 + pytest-django 4.5.2 + factory-boy 3.3.0; coverage threshold 90% via `python run_tests.py --coverage` → `--fail-under=90`.
- **Don't run `docker-compose.yml` (production)** — use `docker-compose-local.yml` for any local Django/Postgres needs.
- **Pre-commit:** Husky lint-staged runs `oxfmt` + `oxlint` on TS/JSON/MD; Python files are lint-checked via `ruff` (CI: `.github/workflows/pull-request-build-lint-api.yml`).
- **CI for backend:** runs `ruff check --fix apps/api`. Pytest is **not in CI** — must run locally.

## Standard Stack

### Core (Phase 1 only — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python stdlib `dataclasses` | 3.12 | `@dataclass(frozen=True)` for `WorkItemNode`, `Edge`, `Adjacency`, `LoadResult` | `[VERIFIED: codebase grep]` — already used in `apps/api/plane/utils/exporters/schemas/base.py`. Frozen dataclasses give hashable, immutable, `==`-comparable value types ideal for graph nodes. |
| Python stdlib `typing` | 3.12 | `Mapping`, `Iterable`, `Protocol` for the row-input contract | `[VERIFIED: codebase grep]` — codebase mixes `typing.Mapping/List/Dict` and PEP-585 `list[str]`. PEP-604 unions (`int | None`) are in use. New code may use either; **Phase 1 should use Python 3.12 native generics** (`list`, `tuple`, `frozenset`, `Mapping` from `collections.abc`) for new code, matching `apps/api/plane/db/mixins.py:167`. |
| Python stdlib `uuid.UUID` | 3.12 | Node identity type | `[VERIFIED: codebase grep]` — `Issue.id`, `Project.id` are `models.UUIDField`. `apps/api/plane/db/models/base.py:18`. |
| Python stdlib `collections.deque` | 3.12 | DFS work stack (iterative) | `[CITED: docs.python.org/3.12/library/collections.html#collections.deque]` — O(1) `append`/`pop` from either end; the stdlib's standard "stack" container. `[ASSUMED]` for the specific pattern's idiomatic use here, but it is canonical Python. |
| `pytest` | 9.0.3 | Test runner | `[VERIFIED: apps/api/requirements/test.txt:115 of STACK.md]` |
| `pytest-django` | 4.5.2 | `@pytest.mark.django_db` | `[VERIFIED: apps/api/requirements/test.txt]` — already in use across `apps/api/plane/tests/unit/`. |
| `factory-boy` | 3.3.0 | Test fixture factories (only if extending `factories.py`) | `[VERIFIED: STACK.md:115]` — already in `requirements/test.txt`. Test-side `IssueFactory`/`IssueRelationFactory` are **optional**; existing unit tests use direct `Model.objects.create(...)`. |

**No production dependency changes required.** This phase introduces zero new package installs; the existing Python 3.12.10 + Django 4.2.30 + pytest stack covers everything.

**Version verification:**
- Python 3.12.10 is pinned by Docker base image `apps/api/Dockerfile.api:1` and `apps/api/Dockerfile.dev`. `[VERIFIED: bash head -3 of Dockerfiles]`.
- pytest, pytest-django, factory-boy versions read from `apps/api/requirements/test.txt` summary in `.planning/codebase/STACK.md:115`. `[VERIFIED: STACK.md]`.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Frozen `@dataclass(frozen=True)` | `attrs` / `pydantic.BaseModel` | None used in `apps/api/plane/`. Stdlib `dataclasses` matches existing convention (`apps/api/plane/utils/exporters/schemas/base.py`). `[VERIFIED: grep across apps/api/plane]` — only `@dataclass` decorators found, zero `attrs`/`pydantic` value-type usage. |
| `frozenset[UUID]` per-key | `set[UUID]` | `set` is mutable; `Adjacency` is supposed to be frozen end-to-end so callers cannot accidentally mutate adjacency lists. Performance is identical for membership tests. |
| Iterative DFS | Recursive DFS | Recursive DFS hits Python's `sys.getrecursionlimit()` (default 1000) on graphs ~1000+ deep. The 100-item propagation limit (PROP-13, Phase 2) is well below 1000, but graphs themselves can exceed that — and iterative DFS is exactly the same code complexity. CONTEXT.md D-02 already locks iterative. |
| Tarjan's SCC | Three-color DFS | Tarjan finds **all** cycles; we only need "is there at least one cycle, and if so, give us a representative cycle path for diagnostics." Three-color DFS first-back-edge satisfies that with simpler code. |
| Throwing `DependencyCycleError` | Returning `LoadResult.cycle: tuple[UUID, ...] | None` | CONTEXT.md D-02 explicitly rules out exceptions across the module boundary. Typed result fields keep the API surface predictable for Phase 2. |

### Test stack: factory_boy SubFactory pattern (open question resolved)

`[CITED: factoryboy.readthedocs.io/en/stable/reference.html#factory.SubFactory]` factory_boy supports `SubFactory` with parameter passing for cross-project scenarios. The standard pattern for a 5–10 work item precedence chain is:

```python
# Sketch — only if Phase 1 elects to extend factories.py (recommendation: DO NOT, see below)
class IssueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Issue

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"Issue {n}")
    workspace = factory.SubFactory(WorkspaceFactory)
    project = factory.SubFactory(ProjectFactory, workspace=factory.SelfAttribute("..workspace"))


class IssueRelationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = IssueRelation

    issue = factory.SubFactory(IssueFactory)         # successor
    related_issue = factory.SubFactory(IssueFactory) # predecessor
    relation_type = "blocked_by"
    project = factory.SelfAttribute("issue.project")
    workspace = factory.SelfAttribute("issue.workspace")
```

For a 5–10 chain: `predecessors = [IssueFactory(project=p) for _ in range(N)]` then pairwise `IssueRelationFactory(issue=successors[i+1], related_issue=successors[i])`.

For cross-project edges: build two `ProjectFactory` instances sharing one `WorkspaceFactory`, then create issues separately on each, and create the relation with the foreign-project successor as `related_issue` (note: `IssueRelation.project` itself can be either project; the loader inspects `related_issue.project_id`, not the relation's own `project_id`, for cross-project classification).

**Recommendation:** Do **not** add factories to `factories.py` in Phase 1. Existing unit tests under `apps/api/plane/tests/unit/models/test_issue_comment_modal.py` use per-test-file `@pytest.fixture` definitions calling `Model.objects.create(...)` directly. That pattern is more readable for dependency graph builders ("here is exactly the chain I'm constructing") and matches the testing-doc directive in `.planning/codebase/TESTING.md`: "do not invent harnesses without asking." Phase 2 or Phase 3 may add factories if and only if they hit duplication.

**Note about `Issue.save()`:** Creating an `Issue` triggers `Issue.save()` which (per `apps/api/plane/db/models/issue.py:178-234`) auto-assigns a default `State` (looking up `State.objects.filter(project=self.project, default=True)`) and acquires a Postgres transaction-level advisory lock to compute `sequence_id`. Tests must therefore create a `State` row for the project first OR pre-assign `state` on the Issue. This is the existing pattern in `test_issue_comment_modal.py:32-39`.

## Architecture Patterns

### System Architecture Diagram

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Phase 3 (FUTURE) — DRF view                                              │
│  apps/api/plane/app/views/issue/timeline_propagation.py                   │
│  - permission check, transaction.atomic, stale check                      │
│  - constructs queryset:                                                    │
│    IssueRelation.objects.filter(                                          │
│      project_id=pid,                                                      │
│      deleted_at__isnull=True,                                             │
│    ).select_related("related_issue")                                      │
│    .exclude(issue__archived_at__isnull=False)                             │
│    .exclude(issue__is_draft=True)                                         │
│    .exclude(related_issue__archived_at__isnull=False)                     │
│    .exclude(related_issue__is_draft=True)                                 │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │ Iterable[IssueRelation], project_id: UUID
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PHASE 1 — Precedence Graph Loader (PURE)                                 │
│  apps/api/plane/app/services/timeline_propagation/                        │
│                                                                            │
│  load_precedence_graph(relations, project_id) -> LoadResult               │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Stage 1: Filter & Translate                                      │    │
│  │  - drop relation_type != "blocked_by"           (PROP-02)         │    │
│  │  - defensive: drop deleted_at IS NOT NULL       (D-05)            │    │
│  │  - drop relations whose relation.project_id != project_id (D-01)  │    │
│  │  - per row: edge.predecessor = row.related_issue_id (PROP-01)     │    │
│  │            edge.successor   = row.issue_id          (D-04)        │    │
│  │  - classify cross-project: row.related_issue.project_id != pid    │    │
│  │    (lookup via getattr(row, 'related_project_id', ...) first)     │    │
│  │    OR  inverse case: edge endpoint pointing into a foreign        │    │
│  │    project from inside this project's queryset                    │    │
│  └──────────────────────────────────┬───────────────────────────────┘    │
│                                     │ list[Edge] (same + cross marked)   │
│                                     ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Stage 2: Adjacency Build                                         │    │
│  │  - successors: Mapping[UUID, frozenset[UUID]]   (D-06)            │    │
│  │  - predecessors: Mapping[UUID, frozenset[UUID]] (D-06)            │    │
│  │  - same-project edges only feed adjacency                         │    │
│  │  - cross-project edges go to Adjacency.cross_project_edges        │    │
│  │  - nodes = union of all same-project endpoints                    │    │
│  └──────────────────────────────────┬───────────────────────────────┘    │
│                                     │ Adjacency                          │
│                                     ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Stage 3: Cycle Detection                                         │    │
│  │  - iterative 3-color DFS over same-project subgraph (D-02)        │    │
│  │  - on first back-edge, reconstruct cycle path from DFS stack      │    │
│  │  - return LoadResult.cycle = (a, b, c, …, a) or None              │    │
│  │  - self-edge → 1-node cycle (a, a)  (D-05)                        │    │
│  └──────────────────────────────────┬───────────────────────────────┘    │
│                                     │ LoadResult{adjacency, cycle}       │
└──────────────────────────────────────┴────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Phase 2 (FUTURE) — propagate_move(graph, work_items, intent, expected)   │
│  - if result.cycle is not None: return DEPENDENCY_CYCLE                   │
│  - if reachable cross_project_edge from moved item:                       │
│      return PROJECT_BOUNDARY_EXCEEDED                                     │
│  - else: walk forward/backward via successors_of/predecessors_of          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```text
apps/api/plane/app/services/                       # NEW — first sub-package
├── __init__.py                                     # NEW — empty (no exports yet)
└── timeline_propagation/                           # NEW
    ├── __init__.py                                 # re-exports public surface
    ├── types.py                                    # WorkItemNode, Edge, Adjacency, LoadResult
    └── graph.py                                    # load_precedence_graph()

apps/api/plane/tests/unit/services/                 # NEW
├── __init__.py                                     # empty
└── timeline_propagation/                           # NEW
    ├── __init__.py                                 # empty
    └── test_graph.py                               # all 7 cases (a–g)
```

**`__init__.py` export convention:** `apps/api/plane/db/models/__init__.py` re-exports symbols flat (`from .issue import Issue, IssueRelation, IssueRelationChoices`). Apply the same flat re-export style to `apps/api/plane/app/services/timeline_propagation/__init__.py`. Per `apps/api/pyproject.toml:69-70`, `__init__.py` files have `F401` ignored, so re-export-only files are idiomatic.

Recommended `__init__.py` content for Phase 1:
```python
# apps/api/plane/app/services/timeline_propagation/__init__.py
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

### Pattern 1: Frozen value-type dataclasses for graph nodes
**What:** Use `@dataclass(frozen=True, slots=True)` for `WorkItemNode`, `Edge`, `LoadResult`. Use a custom frozen wrapper for `Adjacency` (because `Mapping` is structural, not a single concrete type).
**When to use:** Always for the public surface of `types.py` — these are value types (compared by content, hashable, immutable).
**Note on `slots=True`:** No existing dataclass in `apps/api/plane/` uses `slots=True` `[VERIFIED: grep slots=True returned 0]`. It is purely an optimization; not load-bearing for correctness. **Recommend `frozen=True, slots=True`** — `slots` cuts memory and makes "did I accidentally add a field at runtime" bugs impossible. Both are stdlib Python 3.10+, fully supported on 3.12.

**Example:**
```python
# apps/api/plane/app/services/timeline_propagation/types.py
# Source: stdlib `dataclasses` docs (https://docs.python.org/3.12/library/dataclasses.html)
from collections.abc import Mapping
from dataclasses import dataclass, field
from uuid import UUID


@dataclass(frozen=True, slots=True)
class WorkItemNode:
    """Identity of a Work Item participating in the precedence graph."""

    id: UUID
    project_id: UUID


@dataclass(frozen=True, slots=True)
class Edge:
    """A normalized predecessor → successor precedence edge.

    `cross_project=True` means the successor belongs to a project different
    from the loaded project. The loader never dereferences the foreign
    issue's dates — only its project_id is consulted.
    """

    predecessor_id: UUID
    successor_id: UUID
    source_relation_id: UUID
    cross_project: bool


@dataclass(frozen=True, slots=True)
class Adjacency:
    """Same-project precedence adjacency, both directions pre-computed."""

    successors: Mapping[UUID, frozenset[UUID]]
    predecessors: Mapping[UUID, frozenset[UUID]]
    nodes: frozenset[UUID]
    cross_project_edges: tuple[Edge, ...]

    def successors_of(self, node_id: UUID) -> frozenset[UUID]:
        """Return successors; empty frozenset for unknown ids."""
        return self.successors.get(node_id, frozenset())

    def predecessors_of(self, node_id: UUID) -> frozenset[UUID]:
        """Return predecessors; empty frozenset for unknown ids."""
        return self.predecessors.get(node_id, frozenset())


@dataclass(frozen=True, slots=True)
class LoadResult:
    """Public result of `load_precedence_graph`.

    `cycle` is `None` when the graph is a DAG; otherwise it is a closed
    path (e.g., `(a, b, c, a)`) for diagnostics. Phase 2 translates the
    presence of `cycle` into a DEPENDENCY_CYCLE typed failure without
    re-throwing.
    """

    adjacency: Adjacency
    cycle: tuple[UUID, ...] | None
```

### Pattern 2: Service-module loader as a free function
**What:** A single public free function `load_precedence_graph(relations: Iterable[IssueRelation | RelationLike], project_id: UUID) -> LoadResult`.
**When to use:** Whenever the Phase 3 view needs to materialize the graph for a propagation request.
**Why a free function:** Per `[CITED: CONTEXT.md D-01 + Discretion bullet 2]` — no instance state, the `Iterable` argument is already the DI seam. Free functions are the simplest interface; we can always wrap one in a class later if Phase 3 needs DI.

**Example signature (illustrative, not yet implemented):**
```python
# apps/api/plane/app/services/timeline_propagation/graph.py
from collections.abc import Iterable
from typing import Protocol
from uuid import UUID

from .types import Adjacency, Edge, LoadResult, WorkItemNode


class RelationLike(Protocol):
    """Structural subtype of `IssueRelation` consumable by the loader.

    Implemented automatically by `IssueRelation` ORM rows; can also be
    satisfied by plain dataclasses in unit tests when DB roundtrip is
    unnecessary. The loader prefers a precomputed `related_project_id`
    annotation; falls back to traversing `related_issue.project_id`.
    """

    id: UUID
    issue_id: UUID
    related_issue_id: UUID
    relation_type: str
    project_id: UUID
    # Optional fields, accessed via getattr fallback:
    # - related_project_id: UUID | None
    # - related_issue: Issue | None  (with .project_id)
    # - deleted_at: datetime | None


def load_precedence_graph(
    relations: Iterable[RelationLike],
    project_id: UUID,
) -> LoadResult:
    """Build a normalized precedence adjacency from IssueRelation rows.

    Direction: for each `blocked_by` row `(issue=X, related_issue=Y)`,
    emit edge predecessor=Y → successor=X.

    Filters applied:
      - relation_type == "blocked_by"           (PROP-02)
      - deleted_at IS NULL                       (defensive, D-05)
      - relation.project_id == project_id        (same-project boundary)

    Cross-project classification:
      - `Edge.cross_project = (related_issue.project_id != project_id)`
      - cross-project edges land in `Adjacency.cross_project_edges`
      - they DO NOT enter `successors` / `predecessors`

    Cycle detection:
      - iterative three-color DFS over `Adjacency.successors`
      - on first back-edge, returns the closed cycle path
      - self-edges classify as one-node cycles
    """
    # …
```

### Pattern 3: Iterative three-color DFS for cycle detection (D-02)
**What:** White / gray / black coloring driven by an explicit work stack of `(node_id, iterator_over_successors)`.
**When to use:** Once at the end of `load_precedence_graph`, after `Adjacency` is built.
**Why iterative:** Recursive DFS would crash on graphs > Python's default recursion limit (1000). The propagation limit (PROP-13) is 100 work items, but project graphs can be much larger — and iterative DFS is identical complexity.

**Pseudocode (canonical iterative three-color DFS):**

```text
WHITE = 0  # unvisited
GRAY  = 1  # on the current DFS path
BLACK = 2  # fully explored

color: dict[UUID, int] = {n: WHITE for n in adj.nodes}
parent: dict[UUID, UUID | None] = {n: None for n in adj.nodes}

for root in sorted(adj.nodes):  # deterministic iteration order for testability
    if color[root] != WHITE:
        continue

    # Stack holds (node, iter_over_remaining_successors)
    stack: list[tuple[UUID, Iterator[UUID]]] = [(root, iter(sorted(adj.successors_of(root))))]
    color[root] = GRAY

    while stack:
        node, succ_iter = stack[-1]
        try:
            child = next(succ_iter)
        except StopIteration:
            color[node] = BLACK
            stack.pop()
            continue

        # Self-edge guard (defensive, D-05): node -> node is a 1-node cycle
        if child == node:
            return (node, node)  # cycle path of length 1

        if color[child] == WHITE:
            color[child] = GRAY
            parent[child] = node
            stack.append((child, iter(sorted(adj.successors_of(child)))))
        elif color[child] == GRAY:
            # Back-edge → cycle. Reconstruct path: walk parent[] from `node`
            # back to `child`, then prepend `child`.
            cycle: list[UUID] = [child]
            cursor: UUID | None = node
            while cursor is not None and cursor != child:
                cycle.append(cursor)
                cursor = parent[cursor]
            cycle.append(child)  # close the loop: (a, ..., b, a)
            cycle.reverse()
            return tuple(cycle)
        # color[child] == BLACK → cross-edge, ignored

return None
```

Notes for the planner:
- Use `sorted(...)` on both root iteration and child iteration for **deterministic test outputs**. Without sorting, frozenset iteration order is arbitrary and tests become flaky.
- The reconstructed path is rotated so the "first" node sorts deterministically — Phase 2 may want to canonicalize further (rotate so smallest UUID is first) but Phase 1's contract is just "any closed cycle path."
- Self-edge handling is critical: without the guard, a single `node -> node` edge causes infinite loop (push child → child becomes node, child again → push, …).

### Anti-Patterns to Avoid

- **Mutating `Adjacency.successors` after construction:** `Adjacency` is frozen by intent. If you find you need to "fix up" the adjacency later, build a new one instead (copy + replace), or your design has a bug.
- **Recursive DFS with `sys.setrecursionlimit` bumps:** Tempting one-liner, fragile in production. CONTEXT.md D-02 forbids it.
- **Throwing on cycle detection:** Violates D-02. Always return `LoadResult.cycle` with a path or None.
- **Calling `IssueRelation.objects.filter(...)` from inside the loader:** Violates D-01. The Iterable argument *is* the seam.
- **Importing anything from `rest_framework`, `django.http`, `plane.app.views`, or `plane.app.serializers` inside this module:** Violates D-08. Add a grep-based test (`assert_no_drf_imports`) to keep this honest going forward.
- **Using `IssueRelation`'s own `project_id` for cross-project classification:** The relation's own `project_id` is set by `ProjectBaseModel.save()` from `self.project.workspace`; it does NOT necessarily match `related_issue.project_id`. The cross-project signal is **`related_issue.project_id != project_id (loader argument)`**, not `relation.project_id != project_id`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cycle detection over a small DAG | A custom adjacency hashing or "visit count" heuristic | Stdlib iterative three-color DFS (above) | Standard, correct, O(V+E), gives a back-edge path for diagnostics. |
| Hashable, immutable graph node types | Plain `dict` / `tuple` / namedtuple-by-hand | `@dataclass(frozen=True, slots=True)` (Python 3.12 stdlib) | Frozen dataclass gives `__hash__`, `__eq__`, `__repr__`, type checking, and slot memory savings for free. |
| Read-only adjacency lists | Wrapped lists with manual freezing | `frozenset[UUID]` per-key + `Mapping[UUID, frozenset[UUID]]` | `frozenset` is immutable and O(1) `in`. `Mapping` is structural — accept any read-only dict-like at runtime. |
| Soft-delete filter on `IssueRelation` | Custom `if row.deleted_at is None` walks | Trust `IssueRelation.objects` (manager already filters via `SoftDeletionManager`) AND defensively re-apply in loader | `apps/api/plane/db/mixins.py:48-58` already implements `SoftDeletionManager.get_queryset()` that filters `deleted_at__isnull=True`. Loader's defensive filter is for direct-DB rows or `all_objects` callers. |
| Test fixtures for Issue/IssueRelation | Hand-roll a global `IssueFactory` in `factories.py` for one phase | Use per-test-file `@pytest.fixture` + `Model.objects.create(...)` (existing pattern in `tests/unit/models/test_issue_comment_modal.py`) | Matches existing convention. Phase 2/3 can promote to a global factory if duplication appears. |

**Key insight:** This module's job is normalization, not invention. The DB already enforces (a) the canonical `blocked_by` direction (via `get_actual_relation()` in every relation-creation path), (b) soft-delete semantics (via `SoftDeletionManager`), and (c) `relation_type` constraints (via `IssueRelationChoices`). The loader **mirrors and surfaces** those invariants for the algorithm — it does not re-implement them.

## Common Pitfalls

### Pitfall 1: Reversing the predecessor / successor mapping
**What goes wrong:** The dragged Work Item moves rightward, the algorithm walks "successors" but those are actually the predecessors, and the test expects predecessor X but gets successor Y.
**Why it happens:** "X is blocked by Y" reads as "X depends on Y", but in the row `IssueRelation(issue=X, related_issue=Y, blocked_by)`, the **`issue` column is X (the dependent)** and the **`related_issue` column is Y (the prerequisite)**. The English natural-language flow ("X blocked by Y") goes opposite to the row column ordering.
**How to avoid:** **Test case (c)** in §"Validation Architecture" pins this directly: build a relation `IssueRelation.objects.create(issue=successor_issue, related_issue=predecessor_issue, relation_type="blocked_by")` and assert `adjacency.successors_of(predecessor.id) == frozenset({successor.id})`. Add a comment in `graph.py` next to the edge construction line: `# IssueRelation row (issue=X, related=Y, blocked_by) means X is blocked by Y → predecessor=Y, successor=X`.
**Warning signs:** Any plan task that names the source row column "predecessor" without qualification. Any task that says "iterate predecessors using row.issue_id" — that's wrong; row.issue_id is the SUCCESSOR.

### Pitfall 2: Assuming `IssueRelation.project_id` answers the cross-project question
**What goes wrong:** Loader says "no cross-project edges" but Phase 2 then walks the graph and somehow reaches a foreign project Issue.
**Why it happens:** `IssueRelation.project_id` is set to the workspace's project at row-creation time and reflects which project's relation table the row "belongs to." It does **not** constrain `related_issue.project_id`. The codebase has no FK constraint forcing same-project endpoints. So a relation can have `project_id=A` while `related_issue.project_id=B`.
**How to avoid:** Always classify cross-project edges by comparing `related_issue.project_id` (or annotated `related_project_id`) to the **loader argument `project_id`**, not to `row.project_id`. **Test case (e)** validates this directly.
**Warning signs:** Any plan task that filters cross-project via `row.project_id != project_id`. The correct filter is `row.related_issue.project_id != project_id`.

### Pitfall 3: factory_boy `IssueFactory.SubFactory` triggering `Issue.save()` invariants
**What goes wrong:** Test creates `IssueFactory(project=project)` and Django blows up with "no default state" or `IssueSequence` constraint violation.
**Why it happens:** `Issue.save()` (`apps/api/plane/db/models/issue.py:178-234`) auto-resolves `state` from `State.objects.filter(project=..., default=True)` and acquires a Postgres advisory lock to compute `sequence_id`. If the test project has no `State` rows, this branch silently leaves `state=None` (which is fine) but `IssueSequence` creation needs the project-scoped lock.
**How to avoid:** Either (a) create a `State(project=project, default=True)` fixture before any `Issue` (matches `tests/unit/models/test_issue_comment_modal.py:32-39`), OR (b) pass `state=None` explicitly and let `save()` no-op. Recommend (a) for consistency with existing tests. Document in the test conftest module docstring.
**Warning signs:** First test run fails with `IntegrityError` or `State.DoesNotExist`. Solution: add a `state` fixture.

### Pitfall 4: `frozenset` ordering non-determinism in test assertions
**What goes wrong:** A test asserts `result.cycle == (a, b, c, a)` but the actual returned tuple is `(b, c, a, b)` — both are valid cycle paths through the same SCC, but tests fail on the first non-deterministic run.
**Why it happens:** DFS root iteration order is `for root in adj.nodes` where `adj.nodes` is a `frozenset[UUID]`. Frozenset iteration order is NOT defined in Python 3.7+ (unlike `dict` which preserves insertion order).
**How to avoid:** In the algorithm, iterate `for root in sorted(adj.nodes)` and `for child in sorted(adj.successors_of(node))`. Tests then assert against a single canonical path. Document this in `graph.py` near the `sorted()` call.
**Warning signs:** Tests pass on one machine, fail on CI, pass again locally. Flaky assertions on tuple equality.

### Pitfall 5: Mistakenly importing the loader from a Django view too early
**What goes wrong:** Phase 3's view imports `load_precedence_graph` and tests pass, but circular-import errors appear when the worker process starts.
**Why it happens:** Django apps use lazy imports (`from plane.db.models import IssueRelation`) at top of files; Phase 1's loader does too. If Phase 1's `__init__.py` later starts importing Django models eagerly to expose convenience helpers (e.g., a "queryset adapter"), those imports execute at app-load time and can race ORM AppConfig.
**How to avoid:** Keep `__init__.py` lean (re-exports only). Loader imports `IssueRelation` only inside type hints (which become strings under `from __future__ import annotations` if added) or via the `RelationLike` Protocol. Avoid eager `from plane.db.models import IssueRelation` at module top-of-file unless functionally necessary. **Recommendation:** Do NOT use `from __future__ import annotations` for Phase 1 — no codebase precedent (`grep` returned 0 hits) and it would set a new convention silently.
**Warning signs:** Test suite green but `python manage.py runserver` errors at startup with "Apps aren't loaded yet."

## Code Examples

Verified patterns from official sources. Pseudocode/skeleton — final form lives in plan tasks.

### Loader: filter + edge construction (PROP-01, PROP-02, D-04)

```python
# apps/api/plane/app/services/timeline_propagation/graph.py
# Source: CONTEXT.md D-04 directionality + grep verification across all
# IssueRelation creation paths in apps/api/plane (see Existing Code Insights).

def _make_edge(row: RelationLike, project_id: UUID) -> Edge:
    """Translate a `blocked_by` row into a typed predecessor → successor Edge.

    For row (issue=X, related_issue=Y, relation_type='blocked_by'):
      - predecessor = Y (related_issue_id)
      - successor   = X (issue_id)
      - cross_project = (Y's project_id != project_id)

    The loader prefers a precomputed `related_project_id` annotation;
    falls back to traversing `row.related_issue.project_id`.
    """
    related_project_id = getattr(row, "related_project_id", None)
    if related_project_id is None:
        # Defer to ORM traversal — Phase 3 should annotate to avoid this
        related_project_id = row.related_issue.project_id
    return Edge(
        predecessor_id=row.related_issue_id,
        successor_id=row.issue_id,
        source_relation_id=row.id,
        cross_project=(related_project_id != project_id),
    )
```

### Test case (a) – ignore relates_to / duplicate (PROP-02) — first-minimum-task pattern

```python
# apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py
# Source: pattern adapted from
# apps/api/plane/tests/unit/models/test_issue_comment_modal.py
import pytest
from uuid import uuid4

from plane.db.models import (
    IssueRelation,
    Issue,
    Project,
    State,
    Workspace,
)
from plane.app.services.timeline_propagation import load_precedence_graph


@pytest.fixture
def workspace(create_user):
    return Workspace.objects.create(
        name="Test Workspace", slug="test-graph-ws", owner=create_user,
    )


@pytest.fixture
def project(workspace, create_user):
    return Project.objects.create(
        name="Test Project", identifier="TPG",
        workspace=workspace, created_by=create_user,
    )


@pytest.fixture
def state(project):
    return State.objects.create(
        name="Todo", project=project, group="backlog", default=True,
    )


def _make_issue(workspace, project, state, name):
    return Issue.objects.create(
        name=name, workspace=workspace, project=project, state=state,
    )


def _make_blocked_by(workspace, project, predecessor, successor):
    return IssueRelation.objects.create(
        issue=successor,           # X (dependent)
        related_issue=predecessor, # Y (prerequisite)
        relation_type="blocked_by",
        project=project,
        workspace=workspace,
    )


@pytest.mark.unit
class TestLoadPrecedenceGraphFilters:
    """The loader retains only `blocked_by` rows (PROP-02)."""

    @pytest.mark.django_db
    def test_relates_to_is_dropped(self, workspace, project, state):
        a = _make_issue(workspace, project, state, "A")
        b = _make_issue(workspace, project, state, "B")
        IssueRelation.objects.create(
            issue=a, related_issue=b, relation_type="relates_to",
            project=project, workspace=workspace,
        )

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        assert result.adjacency.successors == {}
        assert result.adjacency.predecessors == {}
        assert result.adjacency.nodes == frozenset()
        assert result.adjacency.cross_project_edges == ()
        assert result.cycle is None

    @pytest.mark.django_db
    def test_duplicate_is_dropped(self, workspace, project, state):
        a = _make_issue(workspace, project, state, "A")
        b = _make_issue(workspace, project, state, "B")
        IssueRelation.objects.create(
            issue=a, related_issue=b, relation_type="duplicate",
            project=project, workspace=workspace,
        )

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        assert result.adjacency.nodes == frozenset()
```

### Test case (d) – cycle detection (TEST-11, PROP-15)

```python
@pytest.mark.unit
class TestLoadPrecedenceGraphCycle:
    """Cycle on the precedence subgraph surfaces in LoadResult.cycle (TEST-11)."""

    @pytest.mark.django_db
    def test_three_node_cycle_is_detected(self, workspace, project, state):
        a = _make_issue(workspace, project, state, "A")
        b = _make_issue(workspace, project, state, "B")
        c = _make_issue(workspace, project, state, "C")

        # Build the cycle a → b → c → a (edges: A blocks B, B blocks C, C blocks A)
        # Per D-04: predecessor=related_issue, successor=issue
        # So "A blocks B" stored as IssueRelation(issue=B, related_issue=A, blocked_by)
        _make_blocked_by(workspace, project, predecessor=a, successor=b)
        _make_blocked_by(workspace, project, predecessor=b, successor=c)
        _make_blocked_by(workspace, project, predecessor=c, successor=a)

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        assert result.cycle is not None
        # Cycle is closed (last == first); members are A, B, C in some rotation
        assert result.cycle[0] == result.cycle[-1]
        assert set(result.cycle) == {a.id, b.id, c.id}

    @pytest.mark.django_db
    def test_self_edge_is_one_node_cycle(self, workspace, project, state):
        a = _make_issue(workspace, project, state, "A")
        # Defensive: direct-DB self-edge (unique_together prevents normal API path
        # from creating issue==related_issue pairs, but the loader still guards)
        IssueRelation.objects.create(
            issue=a, related_issue=a, relation_type="blocked_by",
            project=project, workspace=workspace,
        )

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        assert result.cycle == (a.id, a.id)
```

### Test case (e) – cross-project edge classification (PROP-16)

```python
@pytest.mark.unit
class TestLoadPrecedenceGraphCrossProject:
    """Foreign-project successor lands in cross_project_edges, not adjacency (PROP-16)."""

    @pytest.fixture
    def other_project(self, workspace, create_user):
        return Project.objects.create(
            name="Other Project", identifier="OPG",
            workspace=workspace, created_by=create_user,
        )

    @pytest.fixture
    def other_state(self, other_project):
        return State.objects.create(
            name="Todo", project=other_project, group="backlog", default=True,
        )

    @pytest.mark.django_db
    def test_cross_project_successor_marked(
        self, workspace, project, state, other_project, other_state,
    ):
        local = _make_issue(workspace, project, state, "Local")
        foreign = _make_issue(workspace, other_project, other_state, "Foreign")

        # Relation row lives in `project` but successor is in `other_project`
        IssueRelation.objects.create(
            issue=foreign,            # successor in other_project
            related_issue=local,      # predecessor in project
            relation_type="blocked_by",
            project=project,
            workspace=workspace,
        )

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project).select_related("related_issue"),
            project_id=project.id,
        )

        # Same-project adjacency is empty
        assert result.adjacency.successors_of(local.id) == frozenset()
        assert result.adjacency.nodes == frozenset()
        # Cross-project edge is preserved with the flag
        assert len(result.adjacency.cross_project_edges) == 1
        edge = result.adjacency.cross_project_edges[0]
        assert edge.predecessor_id == local.id
        assert edge.successor_id == foreign.id
        assert edge.cross_project is True
        assert result.cycle is None
```

(Tests for cases b, c, f, g follow the same shape — see §"Validation Architecture" for the full list.)

### Lint/grep test that pins the "no DRF imports" invariant (D-08)

```python
# apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py
import pkgutil
import pathlib

@pytest.mark.unit
def test_no_drf_or_http_imports_in_module():
    """D-08: timeline_propagation must not import DRF / Django HTTP / views.

    Verifiable by static grep — keeps the deep-module isolation honest.
    """
    pkg_root = pathlib.Path(__file__).resolve().parents[4] / "app" / "services" / "timeline_propagation"
    forbidden = ("rest_framework", "django.http", "plane.app.views", "plane.app.serializers")

    for py in pkg_root.rglob("*.py"):
        text = py.read_text(encoding="utf-8")
        for needle in forbidden:
            assert needle not in text, f"{py.name} imports forbidden module: {needle}"
```

## Existing Code Insights — Directionality Verification

The CONTEXT.md D-04 claim ("for each `blocked_by` row `(issue=X, related_issue=Y)`, emit edge `predecessor=Y → successor=X`") is verified across **every** relation-creation path in the codebase:

1. **Web app viewset** (`apps/api/plane/app/views/issue/relation.py:220-232`): Frontend calls `POST /api/.../issues/<sourceId>/issue-relation/` with `{relation_type: "blocking", issues: [targetId]}`. The view calls `get_actual_relation("blocking") = "blocked_by"`. For `relation_type` in `["blocking", "start_after", "finish_after"]`, the issue/related_issue are **swapped** before storage:

   ```python
   IssueRelation(
       issue_id=(issue if relation_type in ["blocking", ...] else issue_id),
       related_issue_id=(issue_id if relation_type in ["blocking", ...] else issue),
       relation_type=get_actual_relation(relation_type),
       ...
   )
   ```
   So storing `("blocking", source→target)` becomes `IssueRelation(issue=target, related_issue=source, relation_type="blocked_by")` — i.e., target is blocked by source, source is the predecessor.

2. **External API viewset** (`apps/api/plane/api/views/issue.py:2427-2441`): Same swap pattern via `is_reverse` flag and `get_actual_relation`. Stores canonical `blocked_by` rows.

3. **Historical migration `0043_*.py`** (`apps/api/plane/db/migrations/0043_alter_analyticview_created_by_and_more.py:16-25`): Migrating from old `IssueBlocker` table:
   ```python
   IssueRelation(
       issue_id=blocked_issue.block_id,           # the issue that IS blocked
       related_issue_id=blocked_issue.blocked_by_id,  # the issue that BLOCKS
       relation_type="blocked_by",
       ...
   )
   ```
   `IssueBlocker.block` is "the issue that's blocked"; `IssueBlocker.blocked_by` is "the blocking issue." So `block` (successor) → `issue_id`, `blocked_by` (predecessor) → `related_issue_id`. **Confirmed: `predecessor = related_issue_id`, `successor = issue_id`.**

4. **`get_actual_relation` mapper** (`apps/api/plane/utils/issue_relation_mapper.py:19-32`): Single source of truth. Maps `"blocking" → "blocked_by"`, identity for `"blocked_by"`. Confirms only canonical direction is stored.

5. **`IssueRelationChoices`** (`apps/api/plane/db/models/issue.py:263-284`): Enum lists `BLOCKED_BY` as a stored value; no `BLOCKING` constant. `_RELATION_PAIRS` declares `("blocked_by", "blocking")` as forward/reverse, with `_REVERSE_MAPPING` going forward → reverse. Used only for view-layer synthesis (`relation.py:175-179`).

**Cross-project endpoints can exist**: `IssueRelation.related_issue` is a plain `ForeignKey(Issue)` with no project-scoped check. The unique constraint `unique_together = ["issue", "related_issue", "deleted_at"]` does not include project. Verified by `grep`: no migration adds a `CHECK (issue.project_id = related_issue.project_id)` constraint. PROP-16 is therefore a real concern, not a defensive one.

**Soft-delete semantics**: `IssueRelation` extends `ProjectBaseModel → BaseModel → AuditModel`. `AuditModel` mixes in `SoftDeleteModel` (`apps/api/plane/db/mixins.py:61-82`) which uses `SoftDeletionManager` as `objects` — `IssueRelation.objects.all()` already filters `deleted_at__isnull=True`. `IssueRelation.all_objects` returns the unfiltered manager. D-05's defensive re-application protects against test fixtures using `all_objects` or hand-built dicts.

## Runtime State Inventory

This phase is **greenfield code creation** — no rename, refactor, or migration. New module, new tests, no existing data to update.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — verified by grep across `apps/api/plane`. No existing `timeline_propagation` references in DB columns, JSON keys, or table names. | None |
| Live service config | None — no n8n / Datadog / Tailscale / external-service registration of "timeline_propagation" | None |
| OS-registered state | None — no Celery beat schedule entry, no scheduled task, no systemd unit references the new module | None |
| Secrets/env vars | None — phase introduces no new env var | None |
| Build artifacts | None — Phase 1 adds Python files only; no compiled artifacts, no egg-info, no Docker tag | None |

**Skip rationale:** Phase 1 creates new files under brand-new package paths. No existing system has a stale reference to update.

## Validation Architecture

> Phase 1 is the only phase whose ONLY assigned TEST requirement is TEST-11. The rest of the test plan (TEST-01..TEST-10, TEST-12..TEST-22, TEST-23, TEST-24) is owned by Phases 2–6.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.0.3 + pytest-django 4.5.2 |
| Config file | `apps/api/pytest.ini` (settings: `plane.settings.test`, defaults `--strict-markers --reuse-db --nomigrations -vs`) |
| Quick run command | `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_graph.py -x` |
| Full suite command | `cd apps/api && python run_tests.py -u` (runs all `@pytest.mark.unit` tests) |

### Phase Requirements → Test Map

Each row corresponds to a test case from ROADMAP.md Phase 1 §"Test strategy" plus the directionality and module-purity invariants surfaced during research.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROP-01 / D-04 | (a) Direction translation: `(issue=X, related=Y, blocked_by)` → `predecessor=Y → successor=X` | unit | `pytest plane/tests/unit/services/timeline_propagation/test_graph.py::TestLoadPrecedenceGraphDirection -x` | ❌ Wave 0 |
| PROP-02 | (b) `relates_to` and `duplicate` rows excluded from adjacency | unit | `pytest …::TestLoadPrecedenceGraphFilters -x` | ❌ Wave 0 |
| PROP-01 (alias) | (c) Both API directions (`blocking` and `blocked_by` from frontend) end up as one `blocked_by` row → one normalized edge | unit | `pytest …::TestLoadPrecedenceGraphFilters::test_blocking_via_get_actual_relation_normalizes_to_one_edge -x` | ❌ Wave 0 |
| PROP-15 / TEST-11 | (d) Three-node cycle on precedence subgraph surfaces in `LoadResult.cycle` (closed path) | unit | `pytest …::TestLoadPrecedenceGraphCycle::test_three_node_cycle_is_detected -x` | ❌ Wave 0 |
| PROP-16 | (e) Cross-project successor goes to `cross_project_edges`, not `successors` | unit | `pytest …::TestLoadPrecedenceGraphCrossProject -x` | ❌ Wave 0 |
| (default) | (f) Empty input → empty `Adjacency`, `cycle=None` (regression guard) | unit | `pytest …::TestLoadPrecedenceGraphEmpty -x` | ❌ Wave 0 |
| PROP-15 / D-05 | (g) Self-edge (`issue == related_issue`) → 1-node cycle `(a, a)` | unit | `pytest …::TestLoadPrecedenceGraphCycle::test_self_edge_is_one_node_cycle -x` | ❌ Wave 0 |
| D-06 | Two transitive chains, split, merge — adjacency contents match expectations | unit | `pytest …::TestLoadPrecedenceGraphAdjacencyShape -x` | ❌ Wave 0 |
| D-08 / PROP-18 | Module imports nothing from `rest_framework`, `django.http`, `plane.app.views`, `plane.app.serializers` (lint/grep test) | unit | `pytest …::test_no_drf_or_http_imports_in_module -x` | ❌ Wave 0 |
| D-06 (convenience) | `successors_of(unknown_id)` returns empty `frozenset()`, never raises | unit | `pytest …::TestAdjacencyConvenienceMethods -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_graph.py -x` (~ 1–3 s with `--reuse-db --nomigrations`)
- **Per wave merge:** `cd apps/api && python run_tests.py -u` (full unit suite — keeps Phase 1 tests integrated with the rest of `tests/unit/`)
- **Phase gate:** `cd apps/api && python run_tests.py --coverage` reports `--fail-under=90`. The `timeline_propagation` package should reach ~100% line coverage given how small it is; the threshold gate is for the whole `plane/` package.

### Wave 0 Gaps
- [ ] `apps/api/plane/tests/unit/services/__init__.py` — empty marker file
- [ ] `apps/api/plane/tests/unit/services/timeline_propagation/__init__.py` — empty marker file
- [ ] `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` — full test module covering rows above
- [ ] `apps/api/plane/app/services/__init__.py` — empty marker file (NEW services umbrella package)
- [ ] `apps/api/plane/app/services/timeline_propagation/__init__.py` — re-exports public surface
- [ ] `apps/api/plane/app/services/timeline_propagation/types.py` — `WorkItemNode`, `Edge`, `Adjacency`, `LoadResult`
- [ ] `apps/api/plane/app/services/timeline_propagation/graph.py` — `load_precedence_graph` + iterative DFS
- [ ] No framework install needed — pytest, pytest-django, factory-boy already pinned in `apps/api/requirements/test.txt`

### Coverage threshold note
Phase 1's contribution to `--fail-under=90` is a small line count. The failure mode to watch is **not Phase 1 dropping coverage** but **Phase 1 introducing dead code that pulls average down**. Mitigation: any branch in `graph.py` should be exercised by at least one of the cases (a)–(g) above. The lint-grep test (D-08) is purely structural and adds no production-line coverage; that's expected.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `typing.List`, `typing.Dict`, `typing.Tuple` | PEP-585 native generics: `list`, `dict`, `tuple`, plus `collections.abc.Mapping` etc. | Python 3.9 (2020); preferred from 3.10 | `apps/api/plane/` is mixed; new code in 3.12 should use native generics. |
| `Optional[T]` / `Union[A, B]` | PEP-604 union: `T \| None`, `A \| B` | Python 3.10 (2021) | Already in use across `apps/api/plane/` (e.g., `apps/api/plane/utils/exporters/exporter.py:43`). Phase 1 should use it. |
| Recursive DFS for cycle detection | Iterative DFS with explicit stack | Always — guards against `RecursionError` | Locked by CONTEXT.md D-02. |
| Hand-rolled value types | `@dataclass(frozen=True, slots=True)` | `slots=True` available since Python 3.10 | Codebase uses `@dataclass` but no `slots=True` instances yet. Phase 1 should use it (memory + safety win, no downside). |
| Throwing `DependencyCycleError` | Returning `LoadResult.cycle` discriminated value | Locked by CONTEXT.md D-02 | Aligns with "no exceptions across module boundary" — predictable for callers. |

**Deprecated/outdated:**
- `from __future__ import annotations`: optional in 3.12 since stringification is automatic in many cases; **not used anywhere in `apps/api/plane/`** (`grep` returned 0 hits). **Do not introduce it for Phase 1** to avoid setting a new convention silently.
- `typing.Iterable` / `typing.Mapping`: deprecated alias for `collections.abc.Iterable` / `collections.abc.Mapping`. Use `collections.abc` in new code per PEP 585.
- `typing.NamedTuple` for value types: superseded by `@dataclass(frozen=True)` in Python 3.7+. Codebase uses neither, but dataclasses are the modern choice.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `slots=True` is safe for these dataclasses (no `__dict__`-based introspection downstream). | "Pattern 1: Frozen value-type dataclasses" | Low. If Phase 2 needs to monkey-patch `Adjacency` in a test, it can't with `slots`. Mitigation: drop `slots=True` if the first downstream collision occurs. |
| A2 | `factory_boy.SubFactory` works as documented for cross-project relation tests. | "Test stack: factory_boy SubFactory pattern" | Low — canonical pattern from official docs `[CITED: factoryboy.readthedocs.io]`. Recommendation is to NOT use factories in Phase 1 anyway. |
| A3 | The Django `IssueRelation.objects` manager (via `SoftDeletionManager`) already filters `deleted_at__isnull=True`. | "Don't Hand-Roll" + "Existing Code Insights" | Verified `[VERIFIED: codebase grep mixins.py:48-58]`. Defensive re-filter in loader still recommended for non-`objects` callers. |
| A4 | All current relation-creation paths route through `get_actual_relation`, so non-`blocked_by` precedence rows do not exist in the DB. | "Existing Code Insights — Directionality Verification" | Verified `[VERIFIED: grep across apps/api/plane]` for all 3 active code paths + 1 historical migration. Future code could violate this; the loader's `relation_type == "blocked_by"` filter is the safety net regardless. |
| A5 | Cross-project `IssueRelation` rows can exist in production (no FK enforces same-project endpoints). | "Pitfall 2" + "Existing Code Insights" | Verified `[VERIFIED: grep no project-scoped CHECK constraint]`. PROP-16 implementation is therefore necessary, not theoretical. |
| A6 | Recommended factory_boy version for `IssueFactory` skeleton remains `factory-boy 3.3.0` per `requirements/test.txt`. | "Test stack" sub-section | `[VERIFIED: STACK.md:115]`. |
| A7 | `from __future__ import annotations` is not used anywhere in `apps/api/plane/`, so introducing it would be a new convention. | "Deprecated/outdated" | `[VERIFIED: grep "from __future__ import annotations" apps/api/plane returned No files]`. |
| A8 | Frozen dataclasses are NOT yet used in `apps/api/plane/` (no `frozen=True` or `slots=True` hits anywhere). | "Pattern 1" + Alternatives | `[VERIFIED: grep frozen=True\|slots=True returned 0 hits]`. Phase 1 introduces this convention deliberately for value-type immutability. |

## Open Questions

1. **Does Phase 3's queryset use `select_related("related_issue")` (ORM traversal) or `annotate(related_project_id=F("related_issue__project_id"))` (cheaper, no JOIN-load)?**
   - What we know: D-03 explicitly defers this to Phase 3 implementation detail.
   - What's unclear: whether the loader Protocol should "officially" require `related_project_id` (forcing Phase 3 to annotate) or accept either form.
   - Recommendation: Define the Protocol with `getattr(row, "related_project_id", None)` fallback to `row.related_issue.project_id` (already in §"Code Examples"). Phase 3 is free to choose; the loader is robust to both. Document in the Protocol's docstring.

2. **Does `Adjacency.predecessors` / `successors` use `dict[UUID, frozenset[UUID]]` or a `MappingProxyType` wrap?**
   - What we know: D-06 says `Mapping[UUID, frozenset[UUID]]` (structural type). Implementation can choose.
   - What's unclear: `dict` is mutable; `MappingProxyType(dict_instance)` is read-only.
   - Recommendation: Use `dict` internally and expose as `Mapping` via the type annotation. The `frozen=True` dataclass blocks attribute reassignment (`adj.successors = ...` raises) but does NOT block `adj.successors[k] = v`. If Phase 2 review finds anyone trying to mutate, wrap with `MappingProxyType` defensively. For Phase 1, `dict` is fine — assertions in tests catch any leak.

3. **Should `WorkItemNode` actually be used in `Adjacency`, or is `UUID` sufficient?**
   - What we know: D-07 declares `WorkItemNode = (id, project_id)`, but `Adjacency` uses `UUID` keys directly.
   - What's unclear: where does `WorkItemNode` actually appear in the public surface?
   - Recommendation: `WorkItemNode` is reserved for **future** Phase 2/3 use when we want to pass identity-with-project together (e.g., to a `MoveIntent`). Phase 1 may export `WorkItemNode` from `types.py` but only `Adjacency` and `LoadResult` consume it (transitively, never directly stored). Document this in `types.py` so reviewers don't ask "why is `WorkItemNode` unused in Phase 1?"

4. **Should the lint-grep "no DRF imports" test live in Phase 1 or be a separate plan task?**
   - What we know: D-08 says "verifiable by `grep`/lint in the test suite."
   - What's unclear: whether to put it inside `test_graph.py` or a sibling `test_module_purity.py`.
   - Recommendation: Inside `test_graph.py` for Phase 1 (one file, simpler). If Phase 2 / 3 add more files in `timeline_propagation/`, the test naturally extends to scan `*.py` recursively (already does in §"Code Examples"). Splitting later is cheap.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python | All Phase 1 work | ✓ (in container) | 3.12.10 (Docker) | Local 3.13 also works for editing/typing; tests run via Docker compose |
| pytest | Test runner | ✓ | 9.0.3 (per requirements/test.txt) | — |
| pytest-django | `@pytest.mark.django_db` | ✓ | 4.5.2 | — |
| factory-boy | Optional test factories | ✓ | 3.3.0 | — (not actually needed for Phase 1; recommendation is to not use it) |
| Postgres 15 | Test DB (via `--reuse-db`) | ✓ | 15.7-alpine | — (must be running via `docker-compose-local.yml`) |
| Django ORM | `IssueRelation`, `Issue`, etc. | ✓ | 4.2.30 | — |
| `ruff` | Lint check (CI) | ✓ | 0.9.7 | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

**Operational note:** Tests in `@pytest.mark.django_db` require Postgres. The dev path is `docker compose -f docker-compose-local.yml up plane-db` (just the DB) followed by running pytest in the `api` container OR a local venv with `DATABASE_URL` pointed at the compose Postgres. Per `apps/api/pytest.ini` `--reuse-db --nomigrations`, the test DB persists across runs — drop with `--create-db` once after model changes (none are made in Phase 1).

## Sources

### Primary (HIGH confidence)
- **CONTEXT.md** (`.planning/phases/01-precedence-graph-loader-normalization/01-CONTEXT.md`) — `<decisions>` block D-01..D-10 (locked by user, treated as fact).
- **REQUIREMENTS.md** (`.planning/REQUIREMENTS.md`) — PROP-01, PROP-02, PROP-15, PROP-16, PROP-18, TEST-11 phase assignments.
- **ROADMAP.md** (`.planning/ROADMAP.md` Phase 1 section) — Goal, success criteria, modules-to-change, first-minimum-task.
- **PRD** (`docs/prd/timeline-dependency-date-range-propagation.md`) — US-16, US-17, US-18, US-20, US-28, US-34, plus Implementation Decisions section locking calendar-day, move-only, dedicated endpoint scope.
- **ADR 0001** (`docs/adr/0001-server-authoritative-dependency-schedule-propagation.md`) — Server authority over schedule propagation.
- **CLAUDE.md** (root) — pnpm/turbo/oxlint conventions; pytest defaults; Django backend notes.
- **CONTEXT.md** (root, ubiquitous language) — Work Item, Precedence Dependency, Precedence Boundary domain terms.
- `apps/api/plane/db/models/issue.py:104-311` — `Issue` and `IssueRelation` model schema, `IssueRelationChoices`, `_RELATION_PAIRS`, `_REVERSE_MAPPING`.
- `apps/api/plane/db/mixins.py:16-89` — `AuditModel`, `SoftDeletionManager`, `SoftDeletionQuerySet` confirming soft-delete semantics.
- `apps/api/plane/app/views/issue/relation.py:175-261` — Synthesized `blocking` view; canonical `blocked_by` storage via `get_actual_relation`.
- `apps/api/plane/utils/issue_relation_mapper.py:19-32` — `get_actual_relation` mapping table.
- `apps/api/plane/db/migrations/0043_alter_analyticview_created_by_and_more.py:16-28` — Historical migration confirming `IssueBlocker.block` → `IssueRelation.issue`, `IssueBlocker.blocked_by` → `IssueRelation.related_issue`.
- `apps/api/plane/api/views/issue.py:2427-2441` — External API path, same swap pattern as web app.
- `apps/api/pytest.ini` + `apps/api/run_tests.py` — Pytest configuration (markers, `--reuse-db`, `--nomigrations`, `--fail-under=90`).
- `apps/api/pyproject.toml:6-97` — `ruff` configuration (line-length 120, `E + F` rules, `tests/* per-file-ignores`).
- `apps/api/plane/tests/factories.py` — Existing factory_boy registry (`UserFactory`, `WorkspaceFactory`, `WorkspaceMemberFactory`, `ProjectFactory`, `ProjectMemberFactory`).
- `apps/api/plane/tests/conftest.py` — Top-level fixtures (`create_user`, `workspace`, `api_key_client`, `session_client`).
- `apps/api/plane/tests/unit/models/test_issue_comment_modal.py` — Per-test-fixture pattern (workspace, project, state, issue) idiomatic for unit tests.
- `apps/api/plane/tests/unit/utils/test_uuid.py`, `apps/api/plane/tests/unit/serializers/test_label.py`, `apps/api/plane/tests/unit/bg_tasks/test_work_item_link_task.py` — `@pytest.mark.unit` + class-based test patterns.
- `.planning/codebase/STACK.md` — Python 3.12.10, pytest stack versions, `apps/api/requirements/test.txt` summary.
- `.planning/codebase/TESTING.md` — pytest harness conventions, marker discipline, `do not use run_tests.sh`.
- `.planning/codebase/ARCHITECTURE.md` — Django service-layer pattern (URLConf → ViewSet → Serializer → Model).
- Stdlib `dataclasses` docs — `https://docs.python.org/3.12/library/dataclasses.html` (`frozen`, `slots` keywords).
- Stdlib `collections.abc` docs — `https://docs.python.org/3.12/library/collections.abc.html` (`Mapping`, `Iterable` runtime checkable Protocols).
- PEP 585 (https://peps.python.org/pep-0585/) — Native generics.
- PEP 604 (https://peps.python.org/pep-0604/) — Union with `|`.

### Secondary (MEDIUM confidence)
- factory_boy docs `https://factoryboy.readthedocs.io/en/stable/reference.html#factory.SubFactory` — `[CITED]`, used to confirm SubFactory pattern works with parameter passing for `workspace`/`project` plumbing across multiple `Issue` instances. Not verified via Context7 (CLI ETARGET error during research session); the pattern is canonical and well-documented.

### Tertiary (LOW confidence)
- None. Every claim in this research is either `[VERIFIED]` against the codebase or `[CITED]` against an authoritative source.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — every dependency already in `requirements/test.txt`; no new packages introduced.
- Architecture: **HIGH** — all 10 user decisions are locked; ROADMAP.md modules-to-change list is concrete; Phase 1 is small and well-scoped.
- Pitfalls: **HIGH** — directionality verified across 3 code paths + 1 migration; cross-project FK absence verified by absence-of-grep-hit; soft-delete behavior verified via mixin source.
- Test infrastructure: **HIGH** — pytest config + canonical fixture pattern surfaced from real existing test files (`test_issue_comment_modal.py` is a near-perfect template).
- Cycle detection algorithm: **HIGH** — three-color iterative DFS is textbook CS; pseudocode is verifiable mental model; deterministic-iteration-via-sorted-keys is a common Python testing idiom.
- factory_boy advanced patterns: **MEDIUM** — `SubFactory` is canonical but Context7 lookup unavailable in this session. Recommendation is to NOT use factories in Phase 1 anyway, deferring the question.

**Research date:** 2026-05-03
**Valid until:** 2026-06-02 (30 days — stable Django 4.2 LTS, Python 3.12.10 pinned in Dockerfile; no fast-moving dependencies introduced).
