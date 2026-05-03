# Roadmap: Plane Timeline Dependency — Date-Range Propagation

## Overview

This milestone delivers server-authoritative dependency schedule propagation for the Plane Timeline (Gantt) view. The journey goes **backend-first, deep-module-first, contract-then-UI**: build a pure precedence graph loader, layer a pure date-range scheduling/propagation algorithm on top of it, expose both behind a transactional DRF endpoint with a stable error contract, then wire the new API into a `@plane/services` client and a MobX preview store before finally swapping the Gantt drag handler to the new endpoint and covering the result with Playwright E2E. Working Calendar / Japan holidays / planned working-day duration are explicitly deferred to a follow-up milestone (`docs/timeline-dependency-follow-up-tasks.md`); date math stays calendar-day but is isolated in a swappable helper so the future scheduling extension can replace it without touching the API shape or graph traversal.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Phases execute strictly sequentially (`config.json: parallelization=false`). Each phase locks a contract that the next phase consumes.

- [ ] **Phase 1: Precedence Graph Loader & Normalization** - Pure same-project precedence graph builder with cycle detection, isolated from Django views and HTTP.
- [ ] **Phase 2: Date-Range Scheduling Helper & Propagation Algorithm Core** - Pure deep-module algorithm: duration preservation, boundary checks, transitive propagation, limit, typed failures.
- [ ] **Phase 3: Propagation API Endpoint, Persistence & Contract** - DRF endpoint with all-or-nothing transactional persistence, stale detection, permission, stable `{code, message}` failure shape.
- [ ] **Phase 4: Frontend Service Client & MobX Preview Store** - `@plane/services` propagation client + MobX advisory preview / server-replace / rollback / hidden-update store.
- [ ] **Phase 5: Drag Handler Integration & Error UX** - Switch the existing Gantt move drag handler to the propagation endpoint and surface the 7 error codes plus the hidden-update notification.
- [ ] **Phase 6: End-to-End Coverage & Polish** - Playwright happy-path and failure-path drag specs that exercise the full stack.

## Phase Details

### Phase 1: Precedence Graph Loader & Normalization

**Goal**: A pure-data graph builder that reads `IssueRelation` rows for a project and returns a `predecessor → successor` adjacency, normalizing `blocking` and `blocked_by` into a single direction and rejecting cycles, with zero coupling to Django views, HTTP, or serializers.
**Why this slice / definition of done**: This is the foundation deep module that every later phase depends on. It must be testable in isolation (pure-Python, factory_boy fixtures) so Phase 2 can build the algorithm against a known graph contract. Done = `apps/api/plane/app/services/timeline_propagation/graph.py` exposes a small interface that takes a project id + ORM accessor and returns a normalized adjacency object with cycle detection, fully covered by `pytest -m unit` tests with no DRF dependencies.
**Depends on**: Nothing (first phase)
**Requirements**: PROP-01, PROP-02, PROP-15 (graph-side cycle detection), PROP-16 (graph-side cross-project edge classification), PROP-18 (move-only scope made explicit at module surface), TEST-11
**Success Criteria** (what must be TRUE):

1. Given a fixture project with `blocking` / `blocked_by` / `relates_to` / `duplicate` relations, the loader returns adjacency containing **only** precedence edges normalized predecessor→successor.
2. Given a graph that contains a cycle on the precedence subgraph, the loader surfaces a typed cycle result that the algorithm layer can convert into `DEPENDENCY_CYCLE` (no exceptions thrown across the module boundary).
3. Given a relation that points to an issue in a different project, the loader marks the edge as cross-project so the algorithm layer can fail with `PROJECT_BOUNDARY_EXCEEDED` without ever loading the foreign issue's dates.
4. The module has no `from rest_framework`, no `from django.http`, and no view/serializer imports — verifiable by lint/grep — proving it is independently testable.
   **Modules to change**:

- NEW package: `apps/api/plane/app/services/timeline_propagation/__init__.py`
- NEW: `apps/api/plane/app/services/timeline_propagation/graph.py` (loader + normalization + cycle detection)
- NEW: `apps/api/plane/app/services/timeline_propagation/types.py` (small dataclasses for `WorkItemNode`, `Edge`, `Adjacency`, `LoadResult`)
- NEW tests: `apps/api/plane/tests/unit/services/timeline_propagation/__init__.py`, `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py`
- Reuse: `apps/api/plane/db/models/issue.py` (`Issue`, `IssueRelation`) — read-only
- Reuse: `apps/api/plane/tests/factories.py` + per-test factories for `Issue` / `IssueRelation` (extend if needed)
  **Test strategy**:
- Pytest `@pytest.mark.unit` + `@pytest.mark.django_db` (relation rows live in the test DB but no HTTP)
- Run via `cd apps/api && python run_tests.py -u` and direct `pytest plane/tests/unit/services/timeline_propagation/test_graph.py`
- Cases: (a) only-precedence edges retained, (b) `relates_to`/`duplicate` ignored, (c) `blocking` and `blocked_by` mirror to same edge, (d) cycle on precedence subgraph → `LoadResult.cycle`, (e) cross-project edge classification, (f) empty graph, (g) self-edge handled.
  **Dependencies**: None — first phase.
  **Risks / open questions**:
- Whether to fetch with `select_related("issue", "related_issue")` once and pass to the loader, or have the loader own the queryset. (Recommendation: loader takes a queryset/iterable to keep it pure; Phase 3 owns the ORM call.)
- Whether `IssueRelation` rows for archived/soft-deleted issues should be filtered. PRD says same-project boundary, archive treatment is silent — surface in discuss-phase.
  **First minimum task**: Scaffold `apps/api/plane/app/services/timeline_propagation/` package with `types.py` (`WorkItemNode`, `Edge`, `Adjacency`, `LoadResult` dataclasses) and a failing pytest case for "ignore relates_to" in `test_graph.py`. Wire `apps/api/plane/tests/unit/services/timeline_propagation/__init__.py` so pytest discovers the package.

---

### Phase 2: Date-Range Scheduling Helper & Propagation Algorithm Core

**Goal**: Pure-Python date-range scheduling and transitive propagation algorithm — duration preservation, boundary check, minimum-movement calculation, forward/backward transitive walk with split/merge, gap preservation, 100-item limit, typed failures — all consuming the Phase 1 graph and producing a `PropagationResult` (success or typed failure) with no DB writes.
**Why this slice / definition of done**: This is the user's explicit "deep module designed FIRST" deliverable. It must be unit-tested before any view, serializer, or URL exists. Done = `apps/api/plane/app/services/timeline_propagation/{scheduling.py, propagation.py, errors.py}` expose a function `propagate_move(graph, work_items_by_id, move_intent, expected_versions) -> PropagationResult` whose every algorithmic case (TEST-01..TEST-09, TEST-12, TEST-14) is covered by `pytest -m unit`. The `errors.py` module owns the canonical 7 error codes as `Literal`/`Enum` so the API layer can return them verbatim.
**Depends on**: Phase 1 (graph adjacency + cycle classification)
**Requirements**: PROP-03, PROP-04, PROP-05, PROP-06, PROP-07, PROP-08, PROP-09, PROP-10, PROP-11, PROP-12, PROP-13, PROP-14, PROP-17, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09, TEST-12, TEST-14
**Success Criteria** (what must be TRUE):

1. A no-violation move returns a `PropagationResult` containing exactly one updated work item (the dragged one) and zero side effects (TEST-01).
2. Rightward and leftward moves that violate boundaries return updates only for affected successors / predecessors with minimum displacement; transitive chain, split, and merge cases return the full minimum set with each item's date-range duration preserved (TEST-02..TEST-06, PROP-08, PROP-09).
3. Pre-existing slack between work items is preserved unless a boundary violation forces movement; exact-day adjacency (`successor.start = predecessor.target + 1`) is treated as valid, not a violation (TEST-07, TEST-08, PROP-10).
4. The module returns typed failures `INCOMPLETE_SCHEDULE` (TEST-09), `PROPAGATION_LIMIT_EXCEEDED` (TEST-12), `INVALID_DATE_RANGE` (TEST-14), and propagates the `DEPENDENCY_CYCLE` / `PROJECT_BOUNDARY_EXCEEDED` outcomes from Phase 1 — without raising exceptions to callers.
5. The propagation entry point has a small interface (`graph`, `work_items_by_id`, `move_intent`, `expected_versions`, optional clock); internal traversal order, helper names, and intermediate data are not part of the contract — proven by tests asserting only inputs and outputs.
   **Modules to change**:

- NEW: `apps/api/plane/app/services/timeline_propagation/scheduling.py` (date-range duration helpers, boundary check, minimum-shift, calendar-day arithmetic isolated for future working-day swap)
- NEW: `apps/api/plane/app/services/timeline_propagation/propagation.py` (the `propagate_move` deep-module entry point + transitive walk)
- NEW: `apps/api/plane/app/services/timeline_propagation/errors.py` (`PropagationErrorCode` enum or `Literal` union of the 7 codes; `PropagationFailure` dataclass)
- UPDATE: `apps/api/plane/app/services/timeline_propagation/__init__.py` to re-export the public surface
- NEW tests: `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py`, `test_propagation.py`
  **Test strategy**:
- Pytest `@pytest.mark.unit` (no `@django_db` needed for pure functions — feed in-memory `WorkItemNode` dicts)
- One test per labeled PRD case: TEST-01..TEST-09, TEST-12 (limit), TEST-14 (invalid range)
- Use `freezegun` only if the algorithm reads `today()`; otherwise pass dates explicitly to keep tests deterministic
- Coverage gate: contributes to `python run_tests.py --coverage` `--fail-under=90`; the propagation package should be ~100% covered.
  **Dependencies**: Phase 1 (`Adjacency`, `LoadResult`, cycle/cross-project signals)
  **Risks / open questions**:
- Adjacency definition: PRD says successor.start ≥ predecessor.target + 1 calendar day. Confirm whether `start_date == target_date + 1` (zero gap) is expected to be the canonical adjacent case the algorithm preserves, vs. shrinking to `target_date` (zero gap including same day).
- Limit counting: does the limit count the dragged item itself? PRD says "100 work items", treat dragged item as 1 of 100.
- Cycle detection ordering: Phase 1 detects cycles in the full graph; Phase 2 must also handle the case where a cycle is "reachable from the moved item" specifically vs. anywhere in the project graph. Recommendation: Phase 1 returns full-graph cycle status, Phase 2 fails fast on `LoadResult.cycle` regardless of reachability (server is authoritative; cycles must not exist in the project at all).
  **First minimum task**: Add `errors.py` with the 7-code enum and a `PropagationFailure` dataclass; write `test_propagation.py::test_no_violation_move_updates_only_dragged` against a stub graph and a hand-built work-item dict, then implement the smallest code path to make it pass.

---

### Phase 3: Propagation API Endpoint, Persistence & Contract

**Goal**: Expose the deep module behind a dedicated DRF endpoint that accepts move intent, performs all-or-nothing transactional persistence, enforces project permission, performs stale-check against `updated_at`, and returns a stable success or `{code, message}` failure response.
**Why this slice / definition of done**: Phases 4-6 are HTTP clients of this endpoint. The contract must be locked here. Done = `POST /api/workspaces/<slug>/projects/<projectId>/timeline-propagation/` (or equivalent) is wired in URLs, the view delegates to `propagate_move` from Phase 2 and persists inside `transaction.atomic()` with a final `Issue.objects.bulk_update`, the request/response serializers are typed, and `apps/api/plane/tests/contract/app/test_timeline_propagation.py` covers TEST-13, TEST-15, TEST-16, TEST-17, TEST-18 + TEST-10 at endpoint level.
**Depends on**: Phase 2 (propagation algorithm + error codes)
**Requirements**: API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10, API-11, API-12, PROP-16 (endpoint-side enforcement), TEST-10, TEST-13, TEST-15, TEST-16, TEST-17, TEST-18
**Success Criteria** (what must be TRUE):

1. Authenticated client `POST`s `{ work_item_id, original_start_date, original_target_date, expected_updated_at, requested_start_date, requested_target_date, operation: "move" }` and on success receives `{ requested_work_item_id, total_updated_count, work_items: [{ id, start_date, target_date, updated_at }, …] }` (API-02, API-03, API-04, TEST-16).
2. Any failure (cycle, cross-project, incomplete schedule, limit, stale, permission, invalid range) returns HTTP 4xx with body `{ code: "<STABLE_CODE>", message: "<human-readable>" }` and **no row in `Issue` is updated** — verified by post-call `updated_at` snapshot diff (API-05, API-06, API-08, TEST-15, TEST-17).
3. A request with a stale `expected_updated_at` (server's current value differs) fails with `SCHEDULE_CHANGED` and writes nothing (API-07, TEST-13).
4. Permission rejection at the viewset layer returns `PERMISSION_DENIED` via the existing `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` machinery, and is asserted by a contract test using `session_client` for an unauthorized member (API-09, TEST-18).
5. Existing bulk date update endpoint behavior is unchanged — verified by re-running its existing tests (API-11).
   **Modules to change**:

- NEW: `apps/api/plane/app/views/issue/timeline_propagation.py` (`TimelinePropagationView(BaseAPIView)` — single `post`)
- NEW: `apps/api/plane/app/serializers/timeline_propagation.py` (`TimelinePropagationRequestSerializer`, `TimelinePropagationResponseSerializer`, `TimelinePropagationErrorSerializer`)
- UPDATE: `apps/api/plane/app/urls/issue.py` — register new path under the project scope
- UPDATE: `apps/api/plane/app/views/__init__.py` — export the new view
- REUSE: `apps/api/plane/app/permissions/` (existing `ROLE` decorator) and `apps/api/plane/app/views/base.py` (`BaseAPIView` exception handling)
- REUSE: `apps/api/plane/app/services/timeline_propagation/*` from Phase 2
- NEW tests: `apps/api/plane/tests/contract/app/test_timeline_propagation.py` (`@pytest.mark.contract`)
- Optional NEW model field: a `version` integer on `Issue` is **out of scope** — reuse `updated_at` for stale check (per PRD: `updated_at`/version equivalence). If a migration becomes necessary, surface in discuss-phase before adding.
  **Test strategy**:
- Pytest `@pytest.mark.contract` + `session_client` fixture
- Cases: success returns 200/201 with full payload (TEST-16), all-or-nothing on each of the 7 failure codes (TEST-15, TEST-17), `SCHEDULE_CHANGED` with mismatched `expected_updated_at` (TEST-13), permission denied for non-member (TEST-18), cross-project relation triggers `PROJECT_BOUNDARY_EXCEEDED` end-to-end (TEST-10)
- Run via `cd apps/api && python run_tests.py -c` or direct `pytest plane/tests/contract/app/test_timeline_propagation.py`
- Coverage gate: contributes to `--fail-under=90`
  **Dependencies**: Phase 2 (algorithm + error code surface).
  **Risks / open questions**:
- Endpoint URL shape: `/projects/<project_id>/timeline-propagation/` vs. `/projects/<project_id>/issues/<issue_id>/timeline-propagation/`. Recommendation: project-scoped (project is the same-project boundary; the moved work item id is in the body alongside its expected dates).
- `expected_updated_at` precision: ISO datetime vs. epoch ms. Recommendation: ISO with microseconds to match Django default; document in serializer.
- HTTP status code for failures: PRD mandates "stable code"; recommend 409 for `SCHEDULE_CHANGED`, 422 for the other domain errors, 403 for `PERMISSION_DENIED`. Lock in plan-phase.
- `transaction.atomic()` interaction with the `BaseModel.AuditMixin` `updated_at` auto-bump and any `model_activity.delay(...)` enqueues — ensure activity tasks fire only on the persist branch, never inside the rolled-back path (use `transaction.on_commit(...)`).
  **First minimum task**: Add the empty view + URL + a contract test that asserts 401/403 for unauthenticated requests; this locks the routing without yet calling the algorithm.

---

### Phase 4: Frontend Service Client & MobX Preview Store

**Goal**: Add a typed `@plane/services` client method for the new endpoint, plus a MobX store layer that holds an advisory preview during drag, replaces preview state with the server response on success, fully rolls back on failure, and computes a hidden-update count when the server moved more work items than the loaded graph contained.
**Why this slice / definition of done**: This is the seam between API contract and UI. Done = `packages/services/src/issue/timeline-propagation.service.ts` exposes a typed `propagateMove(...)` that returns `TimelinePropagationResponse | TimelinePropagationError`, and `apps/web/ce/store/timeline/timeline-propagation.store.ts` exposes `beginPreview / replaceWithServerResult / rollback / hiddenUpdateCount` actions consumed by Phase 5. Vitest decision is finalized in this phase: pure helper logic (date arithmetic for the loaded-graph preview, hidden-update diffing) goes into `@plane/utils` (already test-harnessed via `packages/utils/src/__tests__/` if added) — full MobX store unit tests inside `apps/web` are deferred unless we introduce Vitest to web (not required by PRD; surface as decision).
**Depends on**: Phase 3 (locked API contract: request body shape, response shape, error code list)
**Requirements**: FE-01, FE-02, FE-03, FE-04, FE-05, FE-06, FE-07, FE-08, TEST-19, TEST-20, TEST-21, TEST-22
**Success Criteria** (what must be TRUE):

1. A unit-tested function (or store action) computes a loaded-graph preview for the dragged work item and its loaded successors/predecessors covering simple, chain, and branch cases (TEST-19, FE-01, FE-02).
2. On a successful server response, the store discards the optimistic preview and applies the server's `work_items` array to the issues map; no client-derived guess survives (TEST-21, FE-04).
3. On a failure response, the store discards the preview entirely and exposes the `code` + `message` to consumers, leaving the original schedule intact (TEST-20, FE-05).
4. When `total_updated_count > loaded_preview_count`, the store exposes a hidden-update notification value the UI can render (TEST-22, FE-06).
5. The new service method has zero direct `axios` imports outside `APIService` and is registered on the `@plane/services` barrel, ready to be consumed in Phase 5.
   **Modules to change**:

- NEW: `packages/services/src/issue/timeline-propagation.service.ts` (extends `APIService`, single `propagateMove(...)` method)
- UPDATE: `packages/services/src/issue/index.ts` and/or `packages/services/src/index.ts` (barrel export)
- NEW types: `packages/types/src/issues/timeline-propagation.ts` (request/response/error codes mirroring Phase 3 serializer); export from `packages/types/src/index.ts`
- NEW: `apps/web/ce/store/timeline/timeline-propagation.store.ts` (MobX store with preview/rollback/replace state)
- UPDATE: `apps/web/ce/store/root.store.ts` to instantiate the store on the CE `RootStore`
- REUSE/EXTEND: `apps/web/core/store/issue/helpers/base-issues.store.ts` for the issues-map mutation that consumes the server response (action only, no inventory of new helpers)
- NEW pure helpers (if test-harnessed): `packages/utils/src/timeline-propagation/preview.ts` + `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` (only if we elect to add Vitest to `@plane/utils`)
  **Test strategy**:
- Decision in this phase: harness for TEST-19..TEST-22.
- **Recommendation:** put the preview/rollback/diff logic in `@plane/utils/timeline-propagation/*` as pure functions and add Vitest to `@plane/utils` (lightweight; mirrors `apps/live` and `packages/codemods` precedent). Store actions then call those helpers; the store layer is verified by the Phase 6 Playwright tests rather than introducing Vitest to `apps/web` for the first time (consistent with `CONCERNS.md` "do not invent test harnesses without asking").
- **Alternative:** skip Vitest entirely for Phase 4 and rely on Phase 6 E2E to cover TEST-19..TEST-22. Lock decision during plan-phase.
- Either way, no `axios` mocking convention exists — service client is exercised through E2E in Phase 6.
  **Dependencies**: Phase 3 (request/response shape, error code names, HTTP status codes).
  **Risks / open questions**:
- **Vitest harness decision** (above) — affects whether TEST-19..TEST-22 are "covered by automated unit tests" or "covered transitively by Phase 6 E2E". User should call this in discuss-phase.
- Where exactly the preview state lives: a brand-new store (cleaner) vs. extending `apps/web/ce/store/timeline/issues-timeline.store.ts` (existing). Recommendation: new store, dependency-inject the existing `issuesTimelineStore` for read-only graph access.
- Type duplication risk: the request/response types belong in `@plane/types` so admin/space could theoretically reuse them. Lock in this phase.
  **First minimum task**: Create `packages/types/src/issues/timeline-propagation.ts` with the request/response/error union exactly mirroring the Phase 3 serializer; export from the barrel. This is the typed contract Phase 5 will import.

---

### Phase 5: Drag Handler Integration & Error UX

**Goal**: Switch the existing Gantt move drag handler from the single-issue bulk update to the new propagation endpoint, render the loaded-graph preview during drag, surface server-failure messages per error code via the existing toast system, and render the hidden-update notification.
**Why this slice / definition of done**: This is the point at which the user-visible behavior changes. Done = an end-to-end drag in the local stack invokes the new endpoint, succeeds with preview-replace or fails with a user-readable reason, and never leaves the schedule partially changed. Resize handlers are untouched.
**Depends on**: Phase 4 (service client + store actions + types)
**Requirements**: FE-03, FE-09, ERR-01, ERR-02, ERR-03, ERR-04, ERR-05, ERR-06, ERR-07, ERR-08
**Success Criteria** (what must be TRUE):

1. Releasing a Gantt move drag fires `propagateMove(...)` against the Phase 3 endpoint with the work item's pre-drag `start_date`, `target_date`, and `updated_at` plus the requested dates from the drag (FE-03, FE-09).
2. On success, the loaded preview is replaced with the server response across all visible Gantt rows; on failure, every preview block snaps back to its original position and the server-provided message is surfaced (ERR-08).
3. Each of the 7 error codes (`DEPENDENCY_CYCLE`, `PROJECT_BOUNDARY_EXCEEDED`, `INCOMPLETE_SCHEDULE`, `PROPAGATION_LIMIT_EXCEEDED`, `SCHEDULE_CHANGED`, `PERMISSION_DENIED`, `INVALID_DATE_RANGE`) maps to a distinct, translated user-readable message via `@plane/i18n` (ERR-01..ERR-07).
4. When the server returns `total_updated_count > preview_count`, a non-blocking hidden-update notification ("N additional work items updated") is shown — without a confirmation dialog inside the safe limit (FE-07 was covered by Phase 4's no-dialog behavior; this phase also keeps the path dialog-free).
5. The dependency-creation drag handler (`use-dependency-drag.ts`), the resize handlers, and the existing relation cycle-check (`cycle-check.ts`) are untouched — verified by leaving the existing Phase 1-3 timeline E2E specs green (FE-09, PROP-18 visible at UI).
   **Modules to change**:

- UPDATE: the existing Gantt block move-drag handler under `apps/web/core/components/gantt-chart/blocks/` (move drop handler that currently hits the bulk update); locate via `apps/web/core/components/gantt-chart/chart/main-content.tsx` and the block files
- UPDATE: `apps/web/ce/components/gantt-chart/dependency/` only if the move handler bridges via CE; do **not** modify `use-dependency-drag.ts` or `cycle-check.ts`
- NEW or UPDATE: error-toast surfacing inside `apps/web/core/components/gantt-chart/...` or the existing toast helper (`@plane/propel` Toast)
- NEW i18n keys in `packages/i18n/src/locales/<lang>/translations.json` — at minimum `en` and `ja`, one key per error code, plus the hidden-update notification template
- REUSE: Phase 4 store actions, Phase 4 service client
- DO NOT TOUCH: `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx` (rendering), `cycle-check.ts` (immediate-feedback cycle guard remains per PRD), the bulk update endpoint and its callers
  **Test strategy**:
- Phase 5 has no new automated tests — the deep module is covered by Phase 1-2 unit tests, the API by Phase 3 contract tests, the store by Phase 4 (per the Phase 4 harness decision), and Phase 6 supplies the E2E gate.
- Manual smoke checklist before Phase 6: (a) drag without violation, (b) drag forcing one successor to move, (c) drag forcing chain, (d) drag triggering each of the 7 errors (forced via test data) — same data conditions Phase 6 will automate.
  **Dependencies**: Phase 4 (typed service + store).
  **Risks / open questions**:
- The existing move-drag handler uses native `mousedown`/`mousemove`/`mouseup` (per `PROJECT.md` and `docs/timeline-e2e-test-environment.md`); the preview must update during drag without re-running propagation per pixel. Recommendation: client-only preview during drag, server call only on `mouseup`.
- i18n: `ja` translations are required (project is internal Japanese team per `PROJECT.md`); confirm whether other locales should fall back to `en` or each be filled. Recommendation: en + ja in this phase, others fall back via IntlMessageFormat default behavior.
- OxLint warning budget for `apps/web` is 11957 — the changes here must not raise it (per `CONCERNS.md`). New code targets 0 warnings; touched files clear warnings within reason.
- `apps/web/ce` vs `apps/web/core` boundary for the new toast surface: error UX is product-visible, belongs in `core`; keep CE override layer empty for it.
  **First minimum task**: Identify the current move-drag-on-block code path (via the existing block component + bulk update call site) and document the exact file and function in the plan-phase artifact before changing behavior. This unblocks the rewrite without speculative grep results.
  **UI hint**: yes

---

### Phase 6: End-to-End Coverage & Polish

**Goal**: Extend the existing Playwright suite with a happy-path test (drag → dependent work item moves → schedule persists) and a failure-path test (drag → server rejects with a known code → UI returns to original schedule + message visible).
**Why this slice / definition of done**: This is the final gate that proves the full stack — drag, network call, transactional persistence, response replace, rollback — works end-to-end. Done = `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` exists with at least the two PRD-required cases (TEST-23, TEST-24), reuses the existing fixtures (`auth.setup.ts`, `api.ts`, `test-fixtures.ts`, `timeline.page.ts`), and the suite passes locally against `docker-compose-local.yml` + `pnpm dev`.
**Depends on**: Phase 5 (drag handler change must be live so the spec's drag actually fires the new endpoint)
**Requirements**: TEST-23, TEST-24
**Success Criteria** (what must be TRUE):

1. A Playwright test creates a `blocking` relation between two work items, drags the predecessor rightward past the successor's `start_date`, asserts the propagation request fires against the new endpoint, asserts both work items' `data-block-id` blocks render at the new positions, and verifies persistence by re-fetching via `Api` fixture (TEST-23).
2. A Playwright test drags a work item into a configuration that triggers a known failure code (e.g., `INCOMPLETE_SCHEDULE` by removing one item's dates pre-drag, or `SCHEDULE_CHANGED` by mutating `updated_at` via the API mid-drag), asserts the server returns the expected code, asserts the toast/message containing the user-readable text appears, and asserts both work items' DOM positions return to their pre-drag coordinates (TEST-24, ERR-08 verified at UI).
3. The pre-existing relation-creation specs (`#1`/`#2`/`#3` in `timeline-dependency-drag.spec.ts`) continue to pass — confirms Phase 5 did not break dependency creation.
4. New POM helpers (e.g., `dragBlockTo(srcId, deltaDays)`) are added to `apps/web/e2e/pages/timeline.page.ts` with the same `data-block-id` / `aria-label` discipline as the existing helpers.
5. `pnpm --filter=web test:e2e` passes locally; CI integration remains out of scope per `docs/timeline-e2e-test-environment.md` §4.5.
   **Modules to change**:

- NEW: `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts`
- UPDATE: `apps/web/e2e/pages/timeline.page.ts` — add block-drag helpers (`dragBlockBy(deltaDays)`, `getBlockBox(id)`)
- UPDATE (if needed): `apps/web/e2e/fixtures/api.ts` — add helpers to create a `blocking` relation between two issues, and to mutate `updated_at` for the `SCHEDULE_CHANGED` test
- REUSE: existing fixtures, `playwright.config.ts`, `auth.setup.ts`
- DO NOT TOUCH: existing relation-drag specs (regression guard)
  **Test strategy**:
- Playwright per `docs/timeline-e2e-test-environment.md` patterns (POM, fixtures, `page.waitForResponse` before action).
- Two specs in one file with `test.describe("timeline dependency propagation")`.
- Use `page.waitForResponse((r) => r.url().includes("/timeline-propagation/") && r.request().method() === "POST", { timeout: 10_000 })` filtered by URL.
- DOM assertions via `data-block-id` (already in `apps/web/core/components/gantt-chart/blocks/block.tsx` per branch state) plus computed bounding box at known x-pixel-per-day from `chart-coords.ts`.
- Local-only; not in CI.
  **Dependencies**: Phase 5 (live UI integration).
  **Risks / open questions**:
- Pixel-per-day arithmetic for asserting block movement; reuse `chart-coords.ts` constants where possible to avoid hard-coded geometry (cross-references `CONCERNS.md` "load-bearing CSS selectors").
- Failure-path choice: which of the 7 codes is easiest to trigger reliably from E2E? Recommendation: `INCOMPLETE_SCHEDULE` (delete `target_date` on one issue via the API fixture) + a second optional case `SCHEDULE_CHANGED` if time permits.
- The `apps/web/e2e/.env.e2e` is per-developer (per `CONCERNS.md` Operational); document any new env vars needed (none expected — reuses existing workspace/project ids).
  **First minimum task**: Add `dragBlockBy(srcId, deltaDays)` to `timeline.page.ts` and a single placeholder spec that opens the Gantt and asserts the existing relation-drag specs still pass with the new POM method present. Then iterate on the propagation specs.
  **UI hint**: yes

## Progress

**Execution Order:**
Phases execute strictly in numeric order: 1 → 2 → 3 → 4 → 5 → 6. Each phase locks a contract its successor depends on; `parallelization=false` in `config.json`.

| Phase                                                        | Plans Complete | Status      | Completed |
| ------------------------------------------------------------ | -------------- | ----------- | --------- |
| 1. Precedence Graph Loader & Normalization                   | 0/TBD          | Not started | -         |
| 2. Date-Range Scheduling Helper & Propagation Algorithm Core | 0/TBD          | Not started | -         |
| 3. Propagation API Endpoint, Persistence & Contract          | 0/TBD          | Not started | -         |
| 4. Frontend Service Client & MobX Preview Store              | 0/TBD          | Not started | -         |
| 5. Drag Handler Integration & Error UX                       | 0/TBD          | Not started | -         |
| 6. End-to-End Coverage & Polish                              | 0/TBD          | Not started | -         |
