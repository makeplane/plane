# Roadmap: Plane Timeline Dependency — Date-Range Propagation

## Overview

This milestone delivers server-authoritative dependency schedule propagation for the Plane Timeline (Gantt) view. The journey goes **backend-first, deep-module-first, contract-then-UI**: build a pure precedence graph loader, layer a pure date-range scheduling/propagation algorithm on top of it, expose both behind a transactional DRF endpoint with a stable error contract, then wire the new API into a `@plane/services` client and a MobX preview store before finally swapping the Gantt drag handler to the new endpoint and covering the result with Playwright E2E. Working Calendar / Japan holidays / planned working-day duration are explicitly deferred to a follow-up milestone (`docs/timeline-dependency-follow-up-tasks.md`); date math stays calendar-day but is isolated in a swappable helper so the future scheduling extension can replace it without touching the API shape or graph traversal.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Phases execute strictly sequentially (`config.json: parallelization=false`). Each phase locks a contract that the next phase consumes.

- [x] **Phase 1: Precedence Graph Loader & Normalization** - Pure same-project precedence graph builder with cycle detection, isolated from Django views and HTTP. (Completed 2026-05-03; 6 of 6 requirements done: PROP-01, PROP-02, PROP-15, PROP-16, PROP-18, TEST-11.)
- [x] **Phase 2: Date-Range Scheduling Helper & Propagation Algorithm Core** - Pure deep-module algorithm: duration preservation, boundary checks, transitive propagation, limit, typed failures. (Completed 2026-05-04; 3 of 3 plans done; 64 GREEN unit tests; Phase 2 package coverage 98%; all 24 PROP/TEST IDs and 14 D-01..D-14 decisions covered.)
- [x] **Phase 3: Propagation API Endpoint, Persistence & Contract** - DRF endpoint with all-or-nothing transactional persistence, stale detection, permission, stable `{code, message}` failure shape. (Completed 2026-05-04; 3 of 3 plans done; 26 GREEN contract tests in test_timeline_propagation.py + 64 Phase 1+2 unit tests still GREEN; transaction.on_commit fan-out wired with default-arg capture; first transaction.on_commit usage anywhere in apps/api/plane.)
- [x] **Phase 4: Frontend Service Client & MobX Preview Store** - `@plane/services` propagation client + MobX advisory preview / server-replace / rollback / hidden-update store. (Completed 2026-05-04; 2 of 2 plans done; 11 GREEN Vitest cases for the pure helpers; MobX store wired via `TimeLineStore.timelinePropagationStore`; Phase 3 backend regression still GREEN.)
- [x] **Phase 5: Drag Handler Integration & Error UX** - Switch the existing Gantt move drag handler to the propagation endpoint and surface the 7 error codes plus the hidden-update notification. (Completed 2026-05-04; 2 of 2 plans done; 05-01 shipped the typed seam — 10 i18n keys + hook + toast resolver; 05-02 wired the drag path — D-01 split, sibling preview override via observer, FE-03 / FE-09 / ERR-08 closed; manual smoke (D-11a) gated to /gsd-verify-work.)
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

| Phase                                                        | Plans Complete | Status      | Completed  |
| ------------------------------------------------------------ | -------------- | ----------- | ---------- |
| 1. Precedence Graph Loader & Normalization                   | 2/2            | Complete    | 2026-05-03 |
| 2. Date-Range Scheduling Helper & Propagation Algorithm Core | 0/3            | Planned     | -          |
| 3. Propagation API Endpoint, Persistence & Contract          | 3/3            | Complete    | 2026-05-04 |
| 4. Frontend Service Client & MobX Preview Store              | 2/2            | Complete    | 2026-05-04 |
| 5. Drag Handler Integration & Error UX                       | 2/2            | Complete    | 2026-05-04 |
| 6. End-to-End Coverage & Polish                              | 0/TBD          | Not started | -          |

## Phase 1 — Plans

**Plans:** 2 plans (sequential, Wave 1 → Wave 2)

- [x] 01-01-PLAN.md — Scaffold timeline_propagation package + types.py (frozen dataclasses) + first failing pytest case for relates_to exclusion (PROP-18 declared at module surface) — completed 2026-05-03 (4m43s; commits 299261c8a2, c86eccdaf8, 8252a268c6; see [01-01-SUMMARY.md](phases/01-precedence-graph-loader-normalization/01-01-SUMMARY.md))
- [x] 01-02-PLAN.md — Implement graph.py (loader + iterative three-color DFS cycle detection) + 9 additional tests covering PROP-01, PROP-02, PROP-15, PROP-16, TEST-11 + lint-grep purity (D-08) — completed 2026-05-03 (5m55s; commits 7c8cf118b7, e0d9d07eef; see [01-02-SUMMARY.md](phases/01-precedence-graph-loader-normalization/01-02-SUMMARY.md))

## Phase 2 — Plans

**Plans:** 3 plans (sequential, Wave 1 → Wave 2 → Wave 3)

- [x] 02-01-scaffold-errors-types-scheduling-PLAN.md — Scaffold errors.py (PropagationErrorCode StrEnum + PropagationFailure), append four frozen+slots dataclasses to types.py (ScheduledWorkItem, MoveIntent, WorkItemUpdate, PropagationResult), implement scheduling.py six helpers (D-03 swap seam), STUB propagation.py, extend **init**.py with 18 re-exports, ship 18 GREEN tests (12 scheduling + 6 propagation scaffolding) — addresses PROP-08, PROP-10, PROP-11, PROP-14, PROP-17 setup. **Done 2026-05-04** (commits bc63251851, 633fd0440f, 6b88ea697b; merged 9dd06afcf3; 30 GREEN unit tests).
- [x] 02-02-propagation-algorithm-core-PLAN.md — Replace propagation.py STUB with full BFS frontier-walk algorithm per CONTEXT.md D-01..D-12 (forward/backward direction parameterized by delta sign, frontier-stop on zero shift, lazy INCOMPLETE_SCHEDULE/PROJECT_BOUNDARY_EXCEEDED/limit checks, dragged-only stale check, dragged-first deterministic update ordering), grow test_propagation.py with 11 PRD-pinned cases (TEST-01..TEST-09, TEST-12, TEST-14) plus 16 auxiliary edge-case tests pinning D-06/D-07/D-08/D-10/D-11 — addresses PROP-03, PROP-04, PROP-05, PROP-06, PROP-07, PROP-09, PROP-12, PROP-13, TEST-01..TEST-09, TEST-12, TEST-14
- [x] 02-03-purity-and-coverage-PLAN.md — Create test_purity.py (sibling to Phase 1's test_graph.py lint-grep) with TestModulePurity (D-14: extends Phase 1's forbidden-imports list with transaction.atomic / model_activity.delay / Issue.objects / from django.db.models import) and TestSchedulingSeam (D-03 / Pitfall 9: propagation.py MUST NOT import timedelta directly), validate package coverage ≥ 95% via run_tests.py -u --coverage — addresses PROP-11, PROP-14

## Phase 3 — Plans

**Plans:** 3 plans (sequential, Wave 1 → Wave 2 → Wave 3)

- [x] 03-01-PLAN.md — **COMPLETE 2026-05-04** — Wave 1 routing scaffold: extend `tests/factories.py` with `IssueFactory` / `IssueRelationFactory` / `StateFactory`; create empty `TimelinePropagationView(BaseAPIView)` returning a 501 placeholder; create placeholder serializer module; register URL `project-timeline-propagation`; barrel re-exports; add 6 GREEN contract tests (3 factory sanity + `test_url_reverses` + `test_unauthenticated_request_returns_401` + `test_existing_bulk_update_endpoint_unchanged`) — addresses API-01, API-09 (partial), API-11, API-12 (test scaffold), TEST-18 (partial). Commits: `0cadfe2a81` (factories + smoke tests), `bbc56e63cb` (view + URL + serializer scaffold + routing tests). See `03-01-SUMMARY.md`. Note: CONTEXT D-01 said canonical path is `/api/v1/...`; actual path is `/api/...` (plane.app.urls is mounted at /api/, not /api/v1/).
- [x] 03-02-PLAN.md — **COMPLETE 2026-05-04** — Wave 2 serializers + view body + happy/failure paths: implemented `TimelinePropagationRequestSerializer` / `Response` / `Error` / `WorkItem` (D-04 structural-only); full `TimelinePropagationView.post` body with inline `ProjectMember` permission check (D-02); `transaction.atomic()` + `select_for_update(of=("self",))` (D-05); queryset construction with cross-project annotations (D-10, D-11); `propagate_move`; `Issue.objects.bulk_update(..., ["start_date","target_date","updated_at"])` with single captured `now` (D-05a / D-05f); `{code, message}` failure envelope per D-03 HTTP status mapping via `STATUS_BY_CODE` single-source-of-truth dict. NO `transaction.on_commit` yet — seam marker `# Plan 03-03: transaction.on_commit registrations go here` between bulk_update and success Response. Added 17 contract tests (5 serializer + 12 view); 23 GREEN total in `test_timeline_propagation.py` (6 from 03-01 + 17 new). Phase 1+2 unit tests (64) still GREEN; no contract regressions. Commits: `a6877c8c28` (serializers + 5 structural tests), `a820e369d4` (view body + 11 view tests + 2 helpers). See `03-02-SUMMARY.md`. Addresses API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-10, PROP-16, TEST-10, TEST-13, TEST-15, TEST-16, TEST-17.
- [x] 03-03-PLAN.md — **COMPLETE 2026-05-04** — Wave 3 audit + webhook fan-out via `transaction.on_commit`: appended per-pair `issue_activity.delay(...)` (start_date / target_date events with `if inst.X != pre.X` skip-zero-delta guard) + per-issue `model_activity.delay(...)` registrations to the success path with default-arg lambda capture `lambda inst=inst, pre=pre: ...` (RESEARCH Pitfall 4 averted). FIRST usage of `transaction.on_commit` anywhere in `apps/api/plane` — verified by grep across the package. Added 3 new contract tests in `TestTimelinePropagationActivityFanOut` pinning: (1) per-issue registration counts and Pitfall 4 distinct-id capture, (2) the on_commit-swallow scenario proving `.delay` is NEVER called synchronously (Pitfall 7 regression guard against `IssueBulkUpdateDateEndpoint`), (3) cycle-failure path returns BEFORE registrations (`.delay.call_count == 0`). 26 GREEN contract tests in `test_timeline_propagation.py` (3 new + 23 prior); 64 Phase 1+2 unit tests still GREEN. `views/issue/base.py` UNCHANGED (API-11 honored). Commits: `6d91d88cac` (RED tests), `37bb69ed96` (GREEN view modification). See [03-03-SUMMARY.md](phases/03-propagation-api-endpoint-persistence-contract/03-03-SUMMARY.md). Addresses API-12.

## Phase 4 — Plans

**Plans:** 2 plans (sequential, Wave 1 → Wave 2)

- [x] 04-01-PLAN.md — **COMPLETE 2026-05-04** — Wave 1 typed contract + pure helpers + Vitest harness: NEW `packages/types/src/issues/timeline-propagation.ts` (six snake_case wire type aliases per D-02); NEW `packages/services/src/issue/timeline-propagation.service.ts` (`TimelinePropagationService.propagateMove(...)` extending `APIService`, rethrows `error?.response?.data` on failure per D-02a / D-03 — URL `/api/workspaces/<slug>/projects/<uuid>/timeline-propagation/`, NO `/v1/` prefix); installed Vitest `^4.0.8` in `@plane/utils` (third Vitest workspace package; matches `packages/codemods` pin per D-01a / D-01b / D-10a); NEW `packages/utils/src/timeline-propagation/preview.ts` with `computeLoadedPreview` / `diffHiddenUpdate` / `applyServerWorkItems` pure helpers reusing `@plane/utils/datetime` primitives (D-04 / D-04a / D-04b / D-04c — never mutate inputs); NEW `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` with **11 GREEN Vitest cases** covering TEST-19 (5 cases — simple/chain/branch/incomplete/immutability), TEST-21 (3 cases — replace/missing-id/immutability), TEST-22 (3 cases — preview-vs-server diff/full/empty). Phase 3 backend regression GREEN (26 contract + 64 unit). FE-08 + D-03b inert constraints honored (zero diff). Commits: `6db219631d` (types), `a126b6fbf6` (service), `3326239c1c` (Vitest harness + smoke), `fa300e3efb` (preview helpers + TEST-19), `e16d19dc56` (TEST-21 + TEST-22). See [04-01-SUMMARY.md](phases/04-frontend-service-client-mobx-preview-store/04-01-SUMMARY.md). Addresses FE-01, FE-02, FE-04, FE-06, TEST-19, TEST-21, TEST-22.
- [x] 04-02-PLAN.md — **COMPLETE 2026-05-04** — Wave 2: MobX store + CE root-store wiring. NEW `apps/web/ce/store/timeline/timeline-propagation.store.ts` exposing the 4-action surface `beginPreview / updatePreview / commitWithServerResult / rollback` (D-05) + 6 observables (`previewById` deep, `isPreviewActive` / `lastError` / `lastResponse` / `lastPreviewIds` / `unexpectedError` ref) + `hiddenUpdateCount` computed; dual-observable error split (D-05c — `lastError` for the 7 wire codes; `unexpectedError` for non-protocol); `lastPreviewIds`-pre-clear on success (D-05e / Pitfall 6); in-flight commit promise cache (D-08a / Pitfall 7); per-id `RootStore.issue.issues.updateIssue` writeback inside a single outer `runInAction` (D-05d / Pitfall 8); closed-set `_isProtocolError` discriminator. UPDATE `apps/web/ce/store/timeline/index.ts` extending `ITimelineStore` interface and `TimeLineStore` class with `timelinePropagationStore: ITimelinePropagationStore` (D-06); NO change to `apps/web/ce/store/root.store.ts`. TEST-20 covered transitively (helper-immutability invariant + store rollback semantics + Phase 6 E2E TEST-24). Phase 3 contract (26) + unit (64) regression GREEN; Wave 1 Vitest (11) still GREEN. Commits: `d810b92105` (TimelinePropagationStore), `888ff6c32b` (TimeLineStore wiring). See [04-02-SUMMARY.md](phases/04-frontend-service-client-mobx-preview-store/04-02-SUMMARY.md). Addresses FE-05, FE-07, FE-08, TEST-20.

## Phase 5 — Plans

**Plans:** 2 plans (sequential, Wave 1 → Wave 2)

- [x] 05-01-PLAN.md — **COMPLETE 2026-05-04** — Wave 1 typed seam: 10 i18n keys under `timeline.propagation.*` in en + ja `translations.ts` (D-06 / D-06a / D-06b — Ubiquitous Language honored, "作業項目"); NEW `apps/web/core/hooks/store/use-timeline-propagation-store.ts` (mirrors `use-instance.ts` analog; access path `context.timelineStore.timelinePropagationStore`); NEW `apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts` exposing `MESSAGE_KEY_BY_CODE` (Record over the 7 wire codes — compile-time exhaustiveness), `showPropagationErrorToast(code | "UNEXPECTED", t)` (D-04 / D-04c — single ERROR severity, shared title key, no action buttons), and `showHiddenUpdateToast(count, t)` (D-05 / D-05a — INFO toast with ICU plural). Pure-function module; no React hook. Type-only imports per D-12. `pnpm --filter=web check:types` GREEN; `pnpm --filter=web check:lint` 1001/11957 (no new warnings); `pnpm --filter=@plane/i18n build` GREEN; `pnpm --filter=@plane/utils test` 11/11 GREEN. Phase 4 store + 4 CE dependency-drag files byte-identical. Commits: `831c261543` (en i18n), `17c849606f` (ja i18n), `77b2c6a659` (hook), `189f5faee4` (toast resolver). See [05-01-SUMMARY.md](phases/05-drag-handler-integration-error-ux/05-01-SUMMARY.md). Addresses ERR-01..ERR-07.
- [x] 05-02-PLAN.md — **COMPLETE 2026-05-04** — Wave 2 drag-handler wiring: UPDATE `use-gantt-resizable.ts` adding optional 5th `propagationCallbacks?: PropagationCallbacks | null` param (D-03b gate — null = silent skip), wiring `beginPreview` at mousedown with `block.data.updated_at` snapshot (D-09 — Pitfall 5) and `updatePreview` per mousemove deriving requested\__ via `getDateFromPositionOnGantt` + `renderFormattedPayloadDate` (D-02 — implicit throttle via day-quantization); resize / left / right branches keep their existing logic and quantization (only inner-shadow `e`/`mouseX` renamed to `moveEvent`/`moveMouseX` for `--deny-warnings` compliance — no behavior change). NEW `apps/web/core/components/gantt-chart/helpers/propagation/callbacks-context.ts` (Option B plumbing — chosen at execute-time because the prop chain crosses `apps/web/ce/.../blocks-list.tsx` which D-10a forbids modifying). UPDATE `base-gantt-root.tsx::updateBlockDates` implementing D-01 split predicate (single entry, both dates, pre-drag had both dates), routing move → `commitWithServerResult` (D-01) and resize/half-block → `issues.updateIssueDates` (D-01b verbatim); on success fires `showHiddenUpdateToast(hiddenUpdateCount, t)` when > 0 (D-05 / D-05b); on failure fires `showPropagationErrorToast(unexpectedError ? "UNEXPECTED" : result.code, t)` (D-04 / D-04c — unexpectedError wins so network/5xx renders the UNEXPECTED fallback rather than the synthetic INVALID_DATE_RANGE envelope from Phase 4 D-05a). Edges assembler iterates `relation.relationMap[srcId]?.blocking` only (D-03a — Pitfall 2 single-direction). UPDATE `block.tsx` overriding `marginLeft`/`width` from `previewById.get(blockId)` via `getPositionFromDateOnGantt(date, dayWidth-or-0)` when present (right edge offset = `currentViewData.data.dayWidth` so the rendered width matches `getItemPositionWidth`'s canonical `(daysDiff + 1) _ dayWidth`formula), else`block.position`fallback (D-02 / D-02b — observer reactivity; D-02a dragged block keeps direct DOM writes via the resize hook). All 4 CE dependency-drag files + Phase 4 store +`apps/web/core/services/issue/issue.service.ts` byte-identical (`git diff --stat 831c261543..HEAD`zero — FE-08 / FE-09 / D-10b / Phase 4 D-03b inert).`pnpm --filter=web check:types`GREEN;`pnpm --filter=web check:lint`995/11957 (down 6 from drive-by lint fixes in`base-gantt-root.tsx`); `pnpm --filter=@plane/utils test`11/11 GREEN. Manual smoke checklist (14 D-11a scenarios + dependency-creation regression #15) gates /gsd-verify-work. Commits:`2c2330c6dc`(use-gantt-resizable),`d647349e81`(base-gantt-root + callbacks-context),`c2e6281e79` (block.tsx). See [05-02-SUMMARY.md](phases/05-drag-handler-integration-error-ux/05-02-SUMMARY.md). Addresses FE-03, FE-09, ERR-08.
