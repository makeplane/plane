# Phase 2: Date-Range Scheduling Helper & Propagation Algorithm Core - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Mode:** `--auto` (recommended options auto-selected; no user prompts)

<domain>
## Phase Boundary

Build the **pure-Python deep module** that owns the actual schedule decision: take the `LoadResult` produced by Phase 1, the project's scheduled Work Items as in-memory inputs, and a single `MoveIntent`, then return a typed `PropagationResult` (success with the minimum set of date updates, or one of the 7 typed failures). Zero coupling to Django views, DRF serializers, HTTP, ORM writes, `transaction.atomic`, or `Issue.objects` — same purity contract Phase 1 locked (D-08).

**In scope (Phase 2 only):**

- `apps/api/plane/app/services/timeline_propagation/errors.py` — the 7 canonical error codes as `StrEnum`, plus `PropagationFailure` dataclass.
- `apps/api/plane/app/services/timeline_propagation/scheduling.py` — pure date-range helpers (duration, boundary check, minimum required shift, calendar-day arithmetic) — the **single seam** that ADR 0002's Working Calendar swap will replace.
- `apps/api/plane/app/services/timeline_propagation/propagation.py` — the `propagate_move(...)` deep-module entry point: validates intent, walks the precedence subgraph from the moved Work Item, accumulates minimum updates, enforces the 100-item limit, returns `PropagationResult`.
- New types in `types.py`: `ScheduledWorkItem`, `WorkItemUpdate`, `MoveIntent`, `PropagationResult` — additions only, never reshape Phase 1's `WorkItemNode` / `Edge` / `Adjacency` / `LoadResult`.
- `__init__.py` re-export of the new public surface.
- `pytest -m unit` tests covering TEST-01..TEST-09, TEST-12, TEST-14 (the 11 algorithmic cases pinned to Phase 2).

**Out of scope (deferred to later phases):**

- DRF view, request/response serializer, URL wiring, transactional persistence, `bulk_update`, `model_activity` audit hooks → Phase 3.
- API contract tests (`@pytest.mark.contract`) and the all-or-nothing persistence assertions (TEST-10, TEST-13, TEST-15..TEST-18) → Phase 3 owns these because they require a real endpoint and HTTP roundtrip; Phase 2 covers TEST-13 (stale rejection) at the **service level** because the algorithm owns `expected_updated_at` comparison, but the contract-level TEST-13 lives with Phase 3.
- Frontend types / store / drag handler / E2E → Phases 4-6.
- Working Calendar / working-day arithmetic / Japan holiday preset → ADR 0002 follow-up milestone. Phase 2 isolates the calendar-day math in `scheduling.py` so the swap is a function-module replacement, not an algorithm rewrite.

</domain>

<decisions>
## Implementation Decisions

### Algorithm shape

- **D-01:** Propagation is a **single-direction frontier walk** (BFS over the precedence subgraph) parameterized by the move's `delta = requested_start_date - original_start_date`:
  - `delta > 0` (rightward move) → walk **forward** through `Adjacency.successors`.
  - `delta < 0` (leftward move) → walk **backward** through `Adjacency.predecessors`.
  - `delta == 0` (no-op move with same start; can happen when the client only resubmits) → return success with a single update for the dragged item only (idempotent), zero traversal.
- For each visited node, compute the minimum shift required to restore adjacency against the **already-shifted** parent(s). Push neighbors onto the frontier **only** when the visited node's own dates change. Untouched gaps are preserved by construction (PROP-07, US-6) — a node whose `start_date` is already on or beyond the required boundary is a frontier-stop, its descendants are not walked.
- One algorithm, two symmetric branches. Mirrored math, not duplicated code.
- Rejected alternatives: full topological recompute (visits unaffected nodes — violates PROP-05/PROP-04 minimum-movement intent); arrival-time DP (over-engineered for unweighted DAG with at most one root delta).

### Adjacency math (Precedence Boundary)

- **D-02:** A schedule is valid when, for every kept edge `pred → succ`, `succ.start_date >= pred.target_date + 1 day`. PRD line 82 is binding: "a successor must start no earlier than the calendar day after its predecessor ends." US-12 / PROP-10: `succ.start_date == pred.target_date + 1` is the canonical adjacent case and is **valid** (not a violation, not shrunk).
- Forward (rightward) shift formula at a successor `s` with predecessors `P`:
  - `required_start = max(p.target_date + 1 for p in P_in_visited)` (only predecessors already updated by this propagation; untouched predecessors may have moved earlier in this walk too — see D-04).
  - `new_start = max(s.start_date, required_start)`.
  - `shift = new_start - s.start_date`. If `shift == 0`, `s` is a frontier-stop. Else `s.target_date += shift` (PROP-09 duration preservation).
- Backward (leftward) shift formula at a predecessor `p` with successors `S`: mirror — `required_target = min(s.start_date - 1 for s in S_in_visited)`; `new_target = min(p.target_date, required_target)`; `shift = p.target_date - new_target`; if 0, frontier-stop; else `p.start_date -= shift`.
- All arithmetic uses `datetime.timedelta(days=1)`. Calendar-day only (PROP-11). **No** weekend/holiday logic in Phase 2.

### Date math isolation seam (ADR 0002 swap target)

- **D-03:** `scheduling.py` owns the **only** date arithmetic in this module. Public functions:
  - `range_duration(start: date, target: date) -> timedelta` — `target - start` with the convention that `start == target` → 0-day duration.
  - `add_calendar_days(d: date, n: int) -> date` — `d + timedelta(days=n)`.
  - `next_valid_start(after_target: date) -> date` — `after_target + 1 day`.
  - `previous_valid_target(before_start: date) -> date` — `before_start - 1 day`.
  - `is_valid_range(start: date, target: date) -> bool` — `target >= start`.
  - `boundary_violation(predecessor_target: date, successor_start: date) -> bool` — `successor_start < predecessor_target + 1 day`.
- `propagation.py` calls these helpers exclusively; never imports `timedelta` directly. ADR 0002's Working Calendar swap replaces this single function module without touching `propagation.py` (the deep-module-first directive: keep variability isolated behind the small interface).
- **No** `Calendar` Protocol injected today. Pre-introducing a DI seam is YAGNI for this milestone and contradicts the "small interface" directive. The seam is the function module itself; ADR 0002 will choose protocol-vs-function-replacement when it lands.

### Public types & shapes

- **D-04:** Three new value types in `types.py` (frozen, `slots=True`, identity by id):
  - `ScheduledWorkItem(id: UUID, project_id: UUID, start_date: date | None, target_date: date | None, updated_at: datetime)` — mirrors `Issue` model fields the algorithm reads (`apps/api/plane/db/models/issue.py:145-146` are `DateField(null=True)`; `updated_at` is `DateTimeField(auto_now=True)` from `TimeAuditModel`). `start_date` / `target_date` may be `None` to model PROP-17 (incomplete schedule); `updated_at` is always present (Django guarantees).
  - `MoveIntent(work_item_id: UUID, original_start_date: date, original_target_date: date, requested_start_date: date, requested_target_date: date)` — the user's drag intent (US-35, API-02). All five fields required (the dragged item, by definition, must be a complete schedule).
  - `WorkItemUpdate(id: UUID, start_date: date, target_date: date, updated_at: datetime)` — one entry in the success result. `updated_at` is the **input** value (Phase 3 sets the post-write value after `bulk_update`); this keeps Phase 2 free of clock dependence.
- One `PropagationResult` frozen dataclass (mirrors Phase 1's `LoadResult` Result-pattern):
  - `requested_work_item_id: UUID`
  - `failure: PropagationFailure | None` — `None` ⇔ success.
  - `updates: tuple[WorkItemUpdate, ...]` — empty tuple on failure (all-or-nothing); on success, **always includes the dragged item itself** (PROP-03 / TEST-01 — even no-violation moves return one update).
  - `total_updated_count: int` — `len(updates)`. Stored explicitly so callers don't recompute.
  - Convenience: `result.is_success: bool` property = `failure is None`.

### Error codes & failure dataclass

- **D-05:** `errors.py` exposes `PropagationErrorCode` as a Python 3.12 `StrEnum` with the canonical 7 wire codes:
  - `DEPENDENCY_CYCLE`
  - `PROJECT_BOUNDARY_EXCEEDED`
  - `INCOMPLETE_SCHEDULE`
  - `PROPAGATION_LIMIT_EXCEEDED`
  - `SCHEDULE_CHANGED`
  - `PERMISSION_DENIED` (defined here for symmetry; raised only by Phase 3 viewset, never by the algorithm — keeps the canonical enum in one place)
  - `INVALID_DATE_RANGE`
- `StrEnum` chosen over plain `Enum` (so serializers can emit `code.value` without ceremony) and over `Literal` union (so iteration / membership / `match`-by-member work).
- `PropagationFailure(code: PropagationErrorCode, message: str, work_item_id: UUID | None = None, cycle: tuple[UUID, ...] | None = None)` — frozen dataclass. `work_item_id` carries the offending node when meaningful (`INCOMPLETE_SCHEDULE`, `INVALID_DATE_RANGE`, `SCHEDULE_CHANGED`); `cycle` carries the closed path from `LoadResult.cycle` for `DEPENDENCY_CYCLE`. `message` is human-readable English in Phase 2; i18n happens in Phase 5's UI.
- The 7 codes are the **stable contract** (US-22, US-37, API-06). Reordering or renaming requires explicit ADR amendment.

### Validation order (deterministic early returns)

- **D-06:** `propagate_move(...)` validates in this fixed order; the **first** failure short-circuits and returns immediately. Order is intentional — earliest possible rejection of obviously bad input, before any traversal:
  1. `INVALID_DATE_RANGE` — `original_target < original_start` OR `requested_target < requested_start` OR `range_duration(original_*) != range_duration(requested_*)` (PROP-08 duration preservation enforced inside the deep module — the algorithm refuses to move at a different duration even if the client asks).
  2. `DEPENDENCY_CYCLE` — `graph.cycle is not None` (D-07: regardless of reachability).
  3. `INCOMPLETE_SCHEDULE` — the dragged Work Item itself is missing dates (defensive; serializer should reject upstream, but the algorithm refuses to propagate from an undated source).
  4. `SCHEDULE_CHANGED` — `expected_versions[move_intent.work_item_id] != work_items_by_id[move_intent.work_item_id].updated_at` (D-08: only the dragged item's `updated_at` is compared).
  5. Frontier walk; per visited node check `INCOMPLETE_SCHEDULE` (lazy, D-09), `PROJECT_BOUNDARY_EXCEEDED` (lazy reachability, D-10), `PROPAGATION_LIMIT_EXCEEDED` (lazy, D-11).

### Cycle pre-check semantics

- **D-07:** Phase 2 fails fast on `LoadResult.cycle is not None` regardless of reachability from the moved item. **Reason:** the server is authoritative (ADR 0001 / US-28). A project-graph that contains a cycle anywhere is structurally invalid for "all-or-nothing schedule propagation" — the user's drag may be on an unrelated leaf today, but the next drag on a cycle-adjacent item would silently fail or loop. Failing immediately surfaces the broken graph for support / data repair, rather than letting it accumulate.
- This also keeps the algorithm trivially terminating: once `cycle is None`, the precedence subgraph is a DAG and BFS without visited-set guards is sound. (The walk still uses a visited set to bound the limit check — D-11.)

### Stale schedule check ownership & granularity

- **D-08:** Phase 2 service owns the `SCHEDULE_CHANGED` check. The interface accepts `expected_versions: Mapping[UUID, datetime]`. **Only** the dragged item's `updated_at` is compared (`expected_versions[move_intent.work_item_id]` must equal `work_items_by_id[work_item_id].updated_at`). Reasons:
  - The client only sees `updated_at` for items it has loaded; an UNTOUCHED neighbor moving is not the user's concern (US-27 wording: "another user's edits are not silently lost" — relevant when the user's _own_ drag-start snapshot of the dragged item is stale).
  - Per-touched-item `updated_at` checks would be overly brittle: a server-side propagation in another request that touched a downstream node would falsely fail every concurrent drag.
  - Per-graph version is overkill and Plane has no such field.
- The `expected_versions` parameter remains a `Mapping`, not a single `datetime`, so Phase 3 may extend it later (e.g., for opt-in stricter checks) without changing the function signature. Today the algorithm reads only `expected_versions[move_intent.work_item_id]`.
- TEST-13 lives twice: as an in-memory algorithm test in Phase 2's `test_propagation.py` (`expected_versions` mismatch returns `SCHEDULE_CHANGED`); and as a contract test in Phase 3 covering the full HTTP path including transactional rollback.

### `INCOMPLETE_SCHEDULE` timing (lazy)

- **D-09:** Lazy detection during the frontier walk. The algorithm reads each visited node's `start_date` / `target_date` only when it actually needs to compute a shift. If either is `None`, return `PropagationFailure(code=INCOMPLETE_SCHEDULE, work_item_id=that_node_id)` immediately (all-or-nothing — no partial updates emitted). This avoids touching unaffected items and ties the failure to the offending propagation path (matches US-19 wording "Plane does not invent missing dates").
- Special case: dragged item itself missing dates → handled in step 3 of D-06 (eager) because there is no traversal yet.

### Cross-project failure semantics (reachability-based)

- **D-10:** `PROJECT_BOUNDARY_EXCEEDED` fires only when the propagation walk reaches a cross-project edge **in the move's direction** from a node already in the visited frontier. Phase 1's `Adjacency.cross_project_edges: tuple[Edge, ...]` carries the data; Phase 2 builds an index `cross_project_out: Mapping[UUID, tuple[Edge, ...]]` (keyed by predecessor for forward walks) and `cross_project_in: Mapping[UUID, tuple[Edge, ...]]` (keyed by successor for backward walks). When the walk pops a node, it consults the right index; if any cross-project edge from this node points outward in the walk direction, fail.
- Reasons:
  - PROP-16 / US-20 wording is "paths reaching outside the project fail propagation" — implies reachability.
  - A leaf-drag in a project that _also_ has unrelated cross-project edges should not fail. Failing globally would make the algorithm dependent on graph state outside the moved item's reachable subgraph.
- The classification math (which endpoint sits outside the project) is already done by Phase 1's `_make_edge` (graph.py:136); Phase 2 only consults the boolean flag and the edge's two ids.

### Limit counting & enforcement

- **D-11:** The 100-item limit (PROP-13, US-29) counts **distinct affected Work Item ids**, including the dragged item itself (so dragged item = 1 of 100; up to 99 propagated). Enforcement is lazy: the algorithm maintains `affected: set[UUID] = {dragged_id}` and grows it as nodes are visited _with non-zero shift_. Frontier-stop nodes (zero shift) are NOT counted (they don't "update" anything). The check `if len(affected) > 100: return PROPAGATION_LIMIT_EXCEEDED` runs **immediately after each set insertion**, so pathological graphs cannot run unbounded work before the limit fires.
- `PROPAGATION_LIMIT_EXCEEDED` failure carries `work_item_id=None` (limit is a graph-level outcome, not a per-node failure). The algorithm does NOT enumerate the would-be-affected list past 100; the user just gets the typed code.
- Locked by ROADMAP "treat dragged item as 1 of 100".

### Public surface

- **D-12:** Single free function exported from `__init__.py`:
  ```python
  def propagate_move(
      graph: LoadResult,
      work_items_by_id: Mapping[UUID, ScheduledWorkItem],
      move_intent: MoveIntent,
      expected_versions: Mapping[UUID, datetime],
  ) -> PropagationResult: ...
  ```
- Mirrors Phase 1's `load_precedence_graph(...)`. No `Propagator` class, no DI hooks, no clock parameter (the algorithm is deterministic from inputs alone — no `today()` calls). Phase 3 wraps this function; if future phases need DI, they can introduce it then. **Hidden Variability in the function module, not in a class.**
- Re-exports added to `__init__.py`: `propagate_move`, `MoveIntent`, `ScheduledWorkItem`, `WorkItemUpdate`, `PropagationResult`, `PropagationFailure`, `PropagationErrorCode`. Phase 1's exports (`load_precedence_graph`, `Adjacency`, `Edge`, `LoadResult`, `WorkItemNode`) are unchanged.

### Test fixture style

- **D-13:** Tests use **pure in-memory fixtures** — hand-built `Adjacency`, `LoadResult`, `ScheduledWorkItem` dicts, `MoveIntent` literals. **No `@pytest.mark.django_db`**, no `factory_boy`, no DB roundtrip. Reasons:
  - The algorithm is pure-Python; DB-roundtrip per test wastes I/O without adding coverage.
  - Phase 1 used `@django_db` because it consumed real `IssueRelation` rows; Phase 2 consumes Phase 1's _outputs_, which are plain dataclasses.
  - Faster iteration and cleaner failure traces (no fixture scaffolding noise).
- Test markers: `@pytest.mark.unit` only.
- Run command: `cd apps/api && python run_tests.py -u` and direct `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py plane/tests/unit/services/timeline_propagation/test_scheduling.py`.
- One test per labeled PRD case (TEST-01..TEST-09, TEST-12, TEST-14) plus auxiliary cases for: validation-order short-circuits, no-op move (delta=0), single-edge forward, single-edge backward, dragged-item-missing-dates, expected_versions missing the dragged id, limit-exceeded fires at exactly 101.

### Lint-grep purity invariant (carried from Phase 1 D-08)

- **D-14:** No `from rest_framework`, no `from django.http`, no `from django.db.models import` (except for `Model` if absolutely needed — currently none), no `transaction.atomic`, no `model_activity.delay(...)`, no `Issue.objects` writes anywhere in `errors.py`, `scheduling.py`, `propagation.py`. The Phase 1 lint-grep test (`test_graph.py::TestLoaderPurity`) should be extended (or a sibling test added) to cover the new files. Verifiable by `rg` in the test suite.

### Claude's Discretion

The auto-mode chose recommended options for every gray area above. Specific call-outs the user may want to revisit during plan-phase:

- The convention name for the `PropagationResult.failure` field. Could equally be `error` or `outcome`. Chose `failure` to mirror "PropagationFailure" and to make the truth check `result.failure is None` self-documenting.
- Whether `WorkItemUpdate.updated_at` should carry the **input** `updated_at` (current Phase 2 contract — Phase 3 sets the post-write value after `bulk_update`) or whether Phase 3 should pass an `updated_at` factory function in. Chose input-value because it keeps Phase 2 clock-free; Phase 3 can map to post-write values when assembling the response.
- Whether the algorithm should expose a `dry_run` mode (compute updates without claiming them as final) for Phase 4's preview store. Decision: NO — the frontend preview is loaded-graph only and does not call the backend (FE-02 "preview is advisory"). The endpoint is single-purpose: the call IS the commit. Revisit only if a future phase introduces server-side preview.
- Whether to expose helper functions from `scheduling.py` (`add_calendar_days`, `next_valid_start`, ...) directly via `__init__.py` or keep them module-private. Decision: keep them re-exported from `__init__.py` so `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py` does not need to depth-import; revisit if any helper becomes more than a one-line wrapper.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Project-level direction

- `.planning/ROADMAP.md` §"Phase 2: Date-Range Scheduling Helper & Propagation Algorithm Core" — phase goal, success criteria, modules-to-change list, first-minimum-task, "Risks / open questions" (adjacency, limit counting, cycle ordering — all locked here in D-02 / D-11 / D-07 respectively).
- `.planning/REQUIREMENTS.md` — owns PROP-03..PROP-14 and PROP-17 (algorithm behavior), TEST-01..TEST-09, TEST-12, TEST-14 (the 11 algorithmic test cases pinned to Phase 2). PROP-15 / PROP-16 outcomes are translated by Phase 2 from Phase 1 signals.
- `.planning/PROJECT.md` — Core value, the deep-module-first directive, in-scope/out-of-scope contract.
- `.planning/STATE.md` — current focus = Phase 2 unblocked; carries forward the Vitest decision (Phase 4) and `expected_updated_at` shape (this phase locks it as a dragged-item-only check).

### Prior phase context (do not re-litigate)

- `.planning/phases/01-precedence-graph-loader-normalization/01-CONTEXT.md` — Phase 1 decisions D-01..D-10. **Most relevant carry-overs:**
  - D-06: `Adjacency` shape (`successors`, `predecessors`, `nodes`, `cross_project_edges`) — Phase 2 reads all four.
  - D-08: lint-grep purity invariant — Phase 2 extends to its three new files (D-14).
  - D-03: cross-project edges live in `Adjacency.cross_project_edges` with `cross_project=True`. Phase 2 inspects them only via reachability (D-10).
- `.planning/phases/01-precedence-graph-loader-normalization/01-RESEARCH.md` — Pitfall 1 (directionality), Pitfall 2 (`row.project_id` is not the endpoint), Pitfall 4 (frozenset ordering). Carry forward: deterministic iteration via `sorted(...)` for testability.

### Domain & PRD

- `CONTEXT.md` (repo root) — Ubiquitous Language: Work Item, Precedence Dependency, Dependency Schedule Propagation, Precedence Boundary. Use these terms in code, comments, tests, and `PropagationFailure.message` strings; avoid "issue" in messages, avoid "relation" when ordering is implied.
- `docs/prd/timeline-dependency-date-range-propagation.md` — PRD with 40 user stories. Phase 2 covers US-2..US-14 (boundary semantics & propagation behavior), US-19 (incomplete schedule), US-20 (cross-project), US-21 (all-or-nothing), US-27 (stale check), US-28 (cycle), US-29 (limit), US-33 (deep module discipline), US-35 (move intent), US-37 (stable error codes).
  - **Line 82** (binding for D-02): "The Precedence Boundary for the first implementation is date-range adjacency: a successor must start no earlier than the calendar day after its predecessor ends."
  - **Lines 137-138** (binding for D-05): the 7 canonical error codes.
  - **Line 171** (binding for D-03): the calendar-day → working-day swap must not require rewriting graph traversal or API semantics.

### Architecture decisions

- `docs/adr/0001-server-authoritative-dependency-schedule-propagation.md` — server authority lock; Phase 2 is the algorithm that _exercises_ that authority.
- `docs/adr/0002-working-calendar-with-japan-holiday-preset.md` — **deferred**; relevant only because D-03 isolates calendar-day arithmetic in `scheduling.py` so the future swap is a function-module replacement.

### Existing code (read-only inputs)

- `apps/api/plane/app/services/timeline_propagation/__init__.py` — current Phase 1 surface; Phase 2 _adds_ exports, never reshapes existing ones.
- `apps/api/plane/app/services/timeline_propagation/types.py` — `WorkItemNode`, `Edge`, `Adjacency`, `LoadResult`. Phase 2 imports these and adds `ScheduledWorkItem`, `WorkItemUpdate`, `MoveIntent`, `PropagationResult` to the same module (D-04).
- `apps/api/plane/app/services/timeline_propagation/graph.py` — `load_precedence_graph`, `_make_edge`, `_detect_cycle`. Phase 2 consumes the public surface only; never reaches into the underscore-prefixed helpers.
- `apps/api/plane/db/models/issue.py:145-146` — `start_date = DateField(null=True, blank=True)` and `target_date = DateField(null=True, blank=True)` — source of truth for `ScheduledWorkItem.start_date / target_date` typing as `date | None`.
- `apps/api/plane/db/mixins.py:16-20` — `TimeAuditModel.updated_at = DateTimeField(auto_now=True)` — source of truth for `ScheduledWorkItem.updated_at` and `WorkItemUpdate.updated_at` typing as `datetime` (timezone-aware).
- `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` — Phase 1 test layout; Phase 2 mirrors the file structure with `test_propagation.py` and `test_scheduling.py` siblings.
- `apps/api/run_tests.py` — preferred test runner (`-u` for unit). **Do not use `apps/api/run_tests.sh`** (delegates to a missing script).

### Codebase maps (already-read context)

- `.planning/codebase/STACK.md` — Python 3.12.10 (allows `StrEnum` from D-05), pytest + pytest-django + factory_boy, `--reuse-db --nomigrations` defaults.
- `.planning/codebase/TESTING.md` — pytest markers `unit` / `contract` / `smoke` / `slow`; Phase 2 stays inside `unit`.
- `.planning/codebase/ARCHITECTURE.md` — layered Django REST monolith; thin view → service module → ORM. Phase 2 is the service-module layer; the view is Phase 3's job.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Phase 1 outputs** (`Adjacency`, `LoadResult`, `Edge`, `WorkItemNode`) — Phase 2 consumes these as inputs without reshaping them. The public surface is locked by Phase 1 D-06 / D-07.
- **`Adjacency.successors_of(node_id) -> frozenset[UUID]`** — already returns `frozenset()` for unknown ids (no `KeyError`), which makes the frontier walk's inner loop trivially safe.
- **`Adjacency.cross_project_edges: tuple[Edge, ...]`** — already classified at load time. Phase 2 builds reverse indices over this tuple in O(E_xproj) once at the start of `propagate_move(...)`; no per-walk classification needed.
- **`LoadResult.cycle: tuple[UUID, ...] | None`** — already a closed path; Phase 2 forwards it verbatim into `PropagationFailure(cycle=...)` for diagnostics.
- **`StrEnum`** — Python 3.12 stdlib; available without dependency. The codebase has no other `StrEnum` usage today (verifiable by `rg "StrEnum" apps/api`), so Phase 2 introduces it cleanly.
- **`apps/api/run_tests.py`** with `-u` — fast unit-test path, leverages `--reuse-db --nomigrations` defaults from `pytest.ini`.

### Established Patterns

- **Service module layout** (`apps/api/plane/app/services/timeline_propagation/`) — Phase 1 established it; Phase 2 adds three new files (`errors.py`, `scheduling.py`, `propagation.py`) under the same package.
- **Frozen dataclasses with `slots=True`** — Phase 1 D-06 / D-07 set this convention for value types; Phase 2 follows it for every new type in `types.py`.
- **Iterative algorithms over recursive ones** — Phase 1 D-02 (iterative DFS for cycle detection) chose iteration to stay under Python's recursion limit on large graphs. Phase 2's frontier walk is iterative for the same reason; the 100-item limit doesn't fully protect against unbounded recursion in pathological inputs (e.g., a long chain that frontier-stops at item 100 still has stack depth equal to walk depth in a recursive design).
- **Deterministic iteration via `sorted(...)`** — Phase 1 used `sorted(adj.nodes)` and `sorted(adj.successors_of(...))` for stable test assertions on the cycle path. Phase 2 follows: when expanding a frontier node's neighbors, sort the neighbor ids before pushing, so test assertions on the resulting `updates: tuple[...]` order are stable across runs.
- **No `from rest_framework`, no `from django.http` in services** — Phase 1 D-08 made it explicit. Phase 2 D-14 extends it to the three new files and the test that enforces it.

### Integration Points

- **Phase 3** consumes `propagate_move` directly inside `transaction.atomic()`. The view will:
  1. Build the queryset (`IssueRelation.objects.filter(project_id=...)`) and call `load_precedence_graph(...)` (Phase 1 entry).
  2. Build the queryset (`Issue.objects.filter(project_id=...)`) for scheduled work items, materialize into `Mapping[UUID, ScheduledWorkItem]`.
  3. Build `MoveIntent` from the validated request serializer.
  4. Build `expected_versions = {move_intent.work_item_id: request.expected_updated_at}` (single-entry dict).
  5. Call `propagate_move(graph, work_items_by_id, move_intent, expected_versions)`.
  6. On `result.failure is None`: `Issue.objects.bulk_update(updates, ["start_date", "target_date"])` then read back the new `updated_at` values.
  7. On `result.failure is not None`: short-circuit to `Response({"code": failure.code.value, "message": failure.message}, status=4xx)` and the transaction context manager rolls back automatically (no DB writes occurred).
- **Phase 4** is unaffected by Phase 2's internals (it talks to Phase 3's HTTP endpoint).
- **Working Calendar follow-up milestone** swaps `scheduling.py` only. The protocol/strategy choice is deferred to that milestone (D-03).

</code_context>

<specifics>
## Specific Ideas

- The deep-module-first discipline is the **explicit user directive** for this milestone (per `.planning/PROJECT.md`). Phase 2 is the canonical example: every algorithmic case is a unit test against `propagate_move(...)` BEFORE any view, serializer, or URL exists. Plan-phase should lock the order of test-first work as: `errors.py` + `PropagationErrorCode` enum → `types.py` additions (`MoveIntent`, `ScheduledWorkItem`, `WorkItemUpdate`, `PropagationResult`) → `scheduling.py` helpers → `propagation.py` `propagate_move(...)` shell that returns the simplest no-violation case → grow into each labeled TEST-NN case.
- The 11 PRD-pinned test cases (TEST-01..TEST-09, TEST-12, TEST-14) are the **acceptance contract** for this phase. Plan-phase should map each test name to the input fixture (graph + work_items + move_intent + expected_versions) and the expected output (success updates or specific PropagationFailure code) BEFORE writing any production code. RGB → green test order: start with TEST-01 (no-violation), then TEST-02 (rightward single), TEST-03 (leftward single), then transitive (TEST-04), then split/merge (TEST-05/TEST-06), then gap preservation (TEST-07), then exact adjacency (TEST-08), then the failure cases (TEST-09 incomplete, TEST-12 limit, TEST-14 invalid range).
- The `cross_project_edges` reverse-indexing should happen **once at the top of `propagate_move(...)`**, not lazily per node. The cost is O(E_xproj) and the index is consulted on every visit; building it up-front simplifies the walk loop and keeps the per-node check a single dict lookup.
- The 100-item limit edge case worth a dedicated test: a graph with exactly 100 nodes that all need to shift → succeed; the same graph with a 101st node added that also needs shift → `PROPAGATION_LIMIT_EXCEEDED`. Document in `test_propagation.py::test_limit_exactly_at_100_succeeds` and `::test_limit_at_101_fails`.
- The validation-order assertion (D-06) is testable: feed an input that violates BOTH `INVALID_DATE_RANGE` (e.g., `requested_target < requested_start`) and `DEPENDENCY_CYCLE` (graph has a cycle) and assert the failure is `INVALID_DATE_RANGE`, not `DEPENDENCY_CYCLE`. This pins the early-return ordering as a contract, not an accident.
- The `PropagationFailure.message` strings are **English-only in Phase 2** (the algorithm can't know the user's locale). Phase 5 will map `code` to a localized string via `packages/i18n`. Keep Phase 2 messages diagnostic ("Cycle detected: A → B → C → A") rather than user-facing prose.

</specifics>

<deferred>
## Deferred Ideas

- **Working Calendar protocol seam** — D-03 deliberately keeps `scheduling.py` as plain functions. ADR 0002's working-day milestone will choose between (a) drop-in function-module replacement, (b) inject a `Calendar` Protocol into `propagate_move(...)`, or (c) an entirely new entry point — and replace the helpers accordingly. Not Phase 2's call.
- **Per-touched-item `updated_at` checks** — D-08 explicitly limits stale-check to the dragged item. A future "strict mode" could compare every touched item's `updated_at`; if needed, the `expected_versions: Mapping` shape already supports it without an interface change. Defer until product evidence shows the user-facing brittleness is worth fixing.
- **`dry_run` mode for server-side preview** — Phase 4's preview is loaded-graph only (FE-02). If a future phase introduces server-side preview (e.g., expensive cross-project resolution that the client cannot replicate), `propagate_move(...)` could grow a `commit: bool = True` parameter that returns the same `PropagationResult` without claiming. Not needed now.
- **Cycle path enrichment (status, title, assignee)** — `LoadResult.cycle` carries only `UUID`s. Future support / debugging UX may want to enrich the path with Work Item titles. That enrichment belongs at the API serializer (Phase 3), not the algorithm.
- **`PROPAGATION_LIMIT_EXCEEDED` carrying the truncated affected list** — current contract returns no list. If product wants to tell the user _which_ items would have moved (so they can pre-emptively split the drag), the algorithm can be extended to keep the partial list when it overflows. Defer until UX asks.
- **Graph caching / incremental updates** — Phase 1's deferred idea, still deferred. Phase 2 does not memoize.
- **Audit logging of propagation outcomes** — would consume `WorkItemUpdate.id` and `PropagationFailure.work_item_id`; deferred to a later observability pass.
- **Enforcing "PROP-08 duration preservation" as a constructor invariant on `MoveIntent`** — currently enforced inside `propagate_move(...)` (D-06 step 1) so the failure surfaces as `INVALID_DATE_RANGE`. Could alternatively be a `__post_init__` guard on `MoveIntent` that raises `ValueError`. Decision deferred: keeping it inside the algorithm preserves the typed-failure-only-at-the-boundary discipline of Phase 1 D-02.

</deferred>

---

_Phase: 02-Date-Range Scheduling Helper & Propagation Algorithm Core_
_Context gathered: 2026-05-04_
